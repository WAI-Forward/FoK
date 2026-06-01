import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { createServer as createProbeServer } from "node:net";
import { networkInterfaces } from "node:os";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createMarket } from "./src/economy.js";
import { FACTIONS, POIS, RESOURCE_TYPES } from "./src/game-data.js";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)));
const preferredPort = Number.parseInt(process.env.PORT ?? "5173", 10);
const maxPortAttempts = 20;
const host = "0.0.0.0";
const playerTimeoutMs = 12000;
const maxJsonBodyBytes = 250000;
const maxAttackRange = 120;
const playerMaxHealth = 100;
const respawnDelayMs = 3500;
const worldTickMs = 5000;
const poiWorkerDeliveryAmount = 20;
const courierResourceIds = ["gold", ...RESOURCE_TYPES.map((resource) => resource.id)];
const poiWorkerNames = {
  gold: "Factor",
  iron: "Miner",
  stone: "Mason",
  wheat: "Farmer",
  wood: "Lumberjack"
};
const armorSlots = new Set(["head", "chest", "gloves", "feet"]);
const armorTypes = new Set(["Helmet", "Chestplate", "Gloves", "Feet"]);
const players = new Map();
const memoryPersistence = {
  world: createDefaultWorldState(),
  players: new Map()
};
let dbPoolPromise = null;

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};

function resolveRequestPath(url) {
  const requestUrl = new URL(url, "http://localhost");
  const decodedPath = decodeURIComponent(requestUrl.pathname);
  const safePath = normalize(decodedPath)
    .replace(/^[/\\]+/, "")
    .replace(/^(\.\.[/\\])+/, "");
  const fullPath = resolve(join(root, safePath));

  if (!fullPath.startsWith(root)) {
    return null;
  }

  if (existsSync(fullPath) && statSync(fullPath).isDirectory()) {
    return join(fullPath, "index.html");
  }

  return fullPath;
}

const server = createServer((request, response) => {
  const requestUrl = new URL(request.url ?? "/", "http://localhost");

  if (requestUrl.pathname.startsWith("/api/multiplayer/")) {
    void handleMultiplayerRequest(request, response, requestUrl);
    return;
  }

  if (requestUrl.pathname.startsWith("/api/world/")) {
    void handleWorldRequest(request, response, requestUrl);
    return;
  }

  const filePath = resolveRequestPath(request.url ?? "/");

  if (!filePath || !existsSync(filePath) || !statSync(filePath).isFile()) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "Content-Type": mimeTypes[extname(filePath)] ?? "application/octet-stream"
  });
  createReadStream(filePath).pipe(response);
});

async function handleWorldRequest(request, response, requestUrl) {
  try {
    if (request.method === "GET" && requestUrl.pathname === "/api/world/state") {
      const playerId = sanitizeText(requestUrl.searchParams.get("playerId"), 80);
      writeJson(response, 200, await loadPersistentState(playerId));
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/world/snapshot") {
      const body = await readJsonBody(request);
      const playerId = sanitizeText(body?.playerId, 80);

      if (!playerId) {
        writeJson(response, 400, { ok: false, message: "Missing player id." });
        return;
      }

      writeJson(response, 200, await savePersistentState(playerId, body));
      return;
    }

    writeJson(response, 404, { ok: false, message: "World endpoint not found." });
  } catch (error) {
    writeJson(response, 500, {
      ok: false,
      message: error instanceof Error ? error.message : "World persistence request failed."
    });
  }
}

async function loadPersistentState(playerId) {
  const pool = await getDbPool();

  if (!pool) {
    const world = evolveWorldState(memoryPersistence.world);
    return {
      ok: true,
      storage: "memory",
      serverTime: Date.now(),
      world,
      player: playerId ? memoryPersistence.players.get(playerId) ?? null : null
    };
  }

  await ensureDatabaseSchema(pool);
  const worldResult = await pool.query("SELECT state FROM kok_world_state WHERE id = $1", ["primary"]);
  const world = evolveWorldState(normalizeWorldState(worldResult.rows[0]?.state));

  await pool.query(
    `INSERT INTO kok_world_state (id, state, updated_at)
     VALUES ($1, $2::jsonb, now())
     ON CONFLICT (id) DO UPDATE SET state = EXCLUDED.state, updated_at = now()`,
    ["primary", JSON.stringify(world)]
  );

  const player = playerId
    ? (await pool.query("SELECT state FROM kok_player_state WHERE player_id = $1", [playerId])).rows[0]?.state ?? null
    : null;

  return {
    ok: true,
    storage: "database",
    serverTime: Date.now(),
    world,
    player
  };
}

async function savePersistentState(playerId, body) {
  const player = normalizePlayerSnapshot(playerId, body?.player);
  const pool = await getDbPool();
  let world = null;

  if (!pool) {
    world = body?.world ? normalizeWorldState(body.world) : evolveWorldState(memoryPersistence.world);
    world.lastEvolvedAt = Date.now();
    memoryPersistence.world = world;
    memoryPersistence.players.set(playerId, player);
    return {
      ok: true,
      storage: "memory",
      serverTime: Date.now(),
      world,
      player
    };
  }

  await ensureDatabaseSchema(pool);
  if (body?.world) {
    world = normalizeWorldState(body.world);
    world.lastEvolvedAt = Date.now();
  } else {
    const worldResult = await pool.query("SELECT state FROM kok_world_state WHERE id = $1", ["primary"]);
    world = evolveWorldState(normalizeWorldState(worldResult.rows[0]?.state));
  }

  await pool.query(
    `INSERT INTO kok_world_state (id, state, updated_at)
     VALUES ($1, $2::jsonb, now())
     ON CONFLICT (id) DO UPDATE SET state = EXCLUDED.state, updated_at = now()`,
    ["primary", JSON.stringify(world)]
  );
  await pool.query(
    `INSERT INTO kok_player_state (player_id, state, updated_at)
     VALUES ($1, $2::jsonb, now())
     ON CONFLICT (player_id) DO UPDATE SET state = EXCLUDED.state, updated_at = now()`,
    [playerId, JSON.stringify(player)]
  );

  return {
    ok: true,
    storage: "database",
    serverTime: Date.now(),
    world,
    player
  };
}

async function getDbPool() {
  if (!dbPoolPromise) {
    dbPoolPromise = createDbPool();
  }

  return dbPoolPromise;
}

async function createDbPool() {
  const connectionString = readDatabaseAddress();

  if (!connectionString) {
    console.warn("World persistence is using memory: no database address found.");
    return null;
  }

  try {
    const { Pool } = await import("pg");
    const pool = new Pool({
      connectionString,
      max: 8,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 3000
    });
    await pool.query("SELECT 1");
    console.log("World persistence connected to PostgreSQL.");
    return pool;
  } catch (error) {
    console.warn(
      `World persistence is using memory: ${error instanceof Error ? error.message : "PostgreSQL unavailable."}`
    );
    return null;
  }
}

function readDatabaseAddress() {
  if (process.env.KOK_DATABASE_URL || process.env.DATABASE_URL) {
    return normalizeDatabaseAddress(process.env.KOK_DATABASE_URL || process.env.DATABASE_URL);
  }

  const configPath = join(root, "data", "db-uri.json");

  if (!existsSync(configPath)) {
    return null;
  }

  try {
    const config = JSON.parse(readFileSync(configPath, "utf8"));
    const key =
      process.env.KOK_DB_TARGET === "prod" || process.env.NODE_ENV === "production"
        ? "prod_address"
        : "dev_address";
    return normalizeDatabaseAddress(config[key]);
  } catch (error) {
    console.warn(`Could not read database config: ${error instanceof Error ? error.message : "invalid JSON"}`);
    return null;
  }
}

function normalizeDatabaseAddress(address) {
  if (typeof address !== "string" || !address.trim()) {
    return null;
  }

  return address.trim().replace(/^postgresql\+psycopg2:\/\//, "postgresql://").replace(/ /g, "%20");
}

async function ensureDatabaseSchema(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS kok_world_state (
      id text PRIMARY KEY,
      state jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS kok_player_state (
      player_id text PRIMARY KEY,
      state jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
}

function createDefaultWorldState() {
  return {
    version: 1,
    elapsed: 0,
    market: createMarket(),
    factionMembers: Object.fromEntries(FACTIONS.map((faction) => [faction.id, []])),
    factionGovernance: Object.fromEntries(
      FACTIONS.map((faction) => [
        faction.id,
        {
          rulerPlayerId: null,
          relationStatus: Object.fromEntries(
            FACTIONS.filter((other) => other.id !== faction.id).map((other) => [other.id, "Neutral"])
          ),
          allianceRequests: []
        }
      ])
    ),
    factionResources: Object.fromEntries(
      FACTIONS.map((faction) => [
        faction.id,
      {
        gold: 500,
        items: [],
        resources: {
            wood: 100,
            stone: 80,
            wheat: 120,
            iron: 35
          }
        }
      ])
    ),
    pois: POIS.map((poi) => ({ ...poi, ownerFactionId: null, pulse: 0 })),
    structures: [],
    couriers: [],
    activeEvent: null,
    lastEvolvedAt: Date.now()
  };
}

function normalizeWorldState(snapshot) {
  const defaults = createDefaultWorldState();
  const source = snapshot && typeof snapshot === "object" ? snapshot : {};

  return {
    ...defaults,
    elapsed: clampNumber(source.elapsed, 0, Number.MAX_SAFE_INTEGER),
    market: normalizeMarket(source.market, defaults.market),
    factionMembers: normalizeFactionMembers(source.factionMembers, defaults.factionMembers),
    factionGovernance: normalizeFactionGovernance(source.factionGovernance, defaults.factionGovernance),
    factionResources: normalizeFactionResources(source.factionResources, defaults.factionResources),
    pois: normalizePois(source.pois, defaults.pois),
    structures: Array.isArray(source.structures) ? source.structures.filter(isPlainObject).slice(0, 250) : [],
    couriers: Array.isArray(source.couriers) ? source.couriers.filter(isPlainObject).slice(0, 250) : [],
    activeEvent: isPlainObject(source.activeEvent) ? source.activeEvent : null,
    lastEvolvedAt: clampNumber(source.lastEvolvedAt, 0, Date.now()) || Date.now()
  };
}

function normalizePlayerSnapshot(playerId, snapshot) {
  const source = snapshot && typeof snapshot === "object" ? snapshot : {};
  const player = source.player && typeof source.player === "object" ? source.player : {};

  return {
    selectedFactionId: sanitizeText(source.selectedFactionId, 40) || null,
    player: {
      ...player,
      id: playerId,
      name: sanitizeText(player.name, 32) || "Player",
      gold: clampNumber(player.gold, 0, Number.MAX_SAFE_INTEGER),
      renown: clampNumber(player.renown, 0, Number.MAX_SAFE_INTEGER),
      resources: normalizeResourceBag(player.resources, Object.fromEntries(RESOURCE_TYPES.map((resource) => [resource.id, 0])))
    }
  };
}

function evolveWorldState(snapshot) {
  const world = normalizeWorldState(snapshot);
  const now = Date.now();
  const elapsedTicks = Math.min(17280, Math.floor((now - world.lastEvolvedAt) / worldTickMs));

  if (elapsedTicks <= 0) {
    return world;
  }

  const elapsedSeconds = (elapsedTicks * worldTickMs) / 1000;

  ensureServerDepotCamels(world);
  ensureServerPoiWorkers(world);
  const deliveredCouriers = [];

  for (const courier of world.couriers) {
    if (isServerDepotCamel(courier)) {
      advanceServerDepotCamel(world, courier, elapsedSeconds);
      continue;
    }

    if (isServerPoiWorker(courier)) {
      advanceServerPoiWorker(world, courier, elapsedSeconds);
      continue;
    }

    courier.progress = Math.min(1, (Number(courier.progress) || 0) + elapsedSeconds / Math.max(1, Number(courier.duration) || 1));

    if (courier.progress >= 1) {
      deliveredCouriers.push(courier);
    }
  }

  for (const courier of deliveredCouriers) {
    const factionStore = world.factionResources[courier.ownerFactionId];

    if (!factionStore || !isPlainObject(courier.payload)) {
      continue;
    }

    for (const [resourceId, amount] of Object.entries(courier.payload)) {
      if (factionStore.resources[resourceId] !== undefined) {
        factionStore.resources[resourceId] += Math.max(0, Number(amount) || 0);
      }
    }

    const depot = world.structures.find((structure) => structure.id === courier.fromStructureId);
    if (depot?.storage) {
      for (const [resourceId, amount] of Object.entries(courier.payload)) {
        depot.storage[resourceId] = Math.max(0, (Number(depot.storage[resourceId]) || 0) - Math.max(0, Number(amount) || 0));
      }
    }
  }

  world.couriers = world.couriers.filter((courier) => {
    if (isServerDepotCamel(courier) || isServerPoiWorker(courier)) {
      return (Number(courier.hp) || 0) > 0;
    }

    return courier.progress < 1;
  });
  world.elapsed += elapsedSeconds;
  world.lastEvolvedAt += elapsedTicks * worldTickMs;
  return world;
}

function ensureServerDepotCamels(world) {
  for (const depot of world.structures) {
    if (depot?.type !== "depot" || (Number(depot.hp) || 0) <= 0) {
      continue;
    }

    const hasCamel = world.couriers.some(
      (courier) => isServerDepotCamel(courier) && courier.fromStructureId === depot.id && (Number(courier.hp) || 0) > 0
    );

    if (!hasCamel && (Number(depot.camelRespawnAt) || 0) <= world.elapsed) {
      world.couriers.push(createServerDepotCamel(depot));
    }
  }
}

function createServerDepotCamel(depot) {
  const faction = FACTIONS.find((entry) => entry.id === depot.ownerFactionId);
  const courier = {
    id: `server-camel-${depot.id}-${Date.now().toString(36)}`,
    kind: "depotCamel",
    fromStructureId: depot.id,
    ownerFactionId: depot.ownerFactionId,
    position: { ...depot.position },
    target: faction ? { ...faction.position } : { ...depot.position },
    direction: "toHub",
    payload: {},
    items: [],
    progress: 0,
    duration: faction ? Math.max(5, distance2D(depot.position, faction.position) / 12) : 5,
    hp: 65,
    maxHp: 65
  };
  loadServerDepotCamel(courier, depot);
  depot.camelRespawnAt = 0;
  return courier;
}

function advanceServerDepotCamel(world, courier, elapsedSeconds) {
  const depot = world.structures.find((structure) => structure.id === courier.fromStructureId);
  const faction = FACTIONS.find((entry) => entry.id === courier.ownerFactionId);

  if (!depot || (Number(depot.hp) || 0) <= 0 || !faction) {
    courier.hp = 0;
    return;
  }

  courier.direction = courier.direction === "toDepot" ? "toDepot" : "toHub";
  courier.payload = normalizeCourierPayload(courier.payload);
  courier.position = courier.position ?? { ...depot.position };
  courier.target = courier.direction === "toHub" ? { ...faction.position } : { ...depot.position };
  courier.duration = Math.max(5, distance2D(depot.position, faction.position) / 12);
  courier.hp = numberOrDefault(courier.hp, 65);
  courier.maxHp = numberOrDefault(courier.maxHp, 65);
  courier.progress = Math.max(0, Number(courier.progress) || 0) + elapsedSeconds / courier.duration;

  let safety = 0;
  while (courier.progress >= 1 && safety < 24) {
    courier.progress -= 1;
    safety += 1;

    if (courier.direction === "toHub") {
      deliverServerCourierPayload(world, courier);
      courier.direction = "toDepot";
      courier.position = { ...faction.position };
      courier.target = { ...depot.position };
    } else {
      loadServerDepotCamel(courier, depot);
      courier.direction = "toHub";
      courier.position = { ...depot.position };
      courier.target = { ...faction.position };
    }
  }
}

function loadServerDepotCamel(courier, depot) {
  courier.payload = {};

  for (const resource of RESOURCE_TYPES) {
    const amount = Math.floor(Number(depot.storage?.[resource.id]) || 0);

    if (amount > 0) {
      courier.payload[resource.id] = amount;
      depot.storage[resource.id] = 0;
    }
  }

  courier.items = Array.isArray(depot.storedItems) ? depot.storedItems.splice(0) : [];
}

function deliverServerCourierPayload(world, courier) {
  const factionStore = world.factionResources[courier.ownerFactionId];

  if (!factionStore) {
    return;
  }

  for (const [resourceId, amount] of Object.entries(normalizeCourierPayload(courier.payload))) {
    if (resourceId === "gold") {
      factionStore.gold = (Number(factionStore.gold) || 0) + amount;
    } else if (factionStore.resources[resourceId] !== undefined) {
      factionStore.resources[resourceId] += amount;
    }
  }

  if (Array.isArray(courier.items) && courier.items.length) {
    factionStore.items = Array.isArray(factionStore.items) ? factionStore.items : [];
    factionStore.items.push(...courier.items);
  }

  courier.payload = {};
  courier.items = [];
}

function normalizeCourierPayload(payload) {
  return Object.fromEntries(
    courierResourceIds.map((resourceId) => [resourceId, Math.max(0, Math.floor(Number(payload?.[resourceId]) || 0))])
  );
}

function isServerDepotCamel(courier) {
  return courier?.kind === "depotCamel" || (!courier?.kind && Boolean(courier?.direction));
}

function ensureServerPoiWorkers(world) {
  const ownedPoiIds = new Set();

  for (const poi of world.pois) {
    if (!poi?.ownerFactionId || !FACTIONS.some((entry) => entry.id === poi.ownerFactionId)) {
      continue;
    }

    ownedPoiIds.add(poi.id);
    const hasWorker = world.couriers.some(
      (courier) =>
        isServerPoiWorker(courier) &&
        courier.fromPoiId === poi.id &&
        courier.ownerFactionId === poi.ownerFactionId &&
        (Number(courier.hp) || 0) > 0
    );

    if (!hasWorker && (Number(poi.workerRespawnAt) || 0) <= world.elapsed) {
      world.couriers.push(createServerPoiWorker(poi));
    }
  }

  world.couriers = world.couriers.filter((courier) => {
    if (!isServerPoiWorker(courier)) {
      return true;
    }

    const poi = world.pois.find((entry) => entry.id === courier.fromPoiId);
    return ownedPoiIds.has(courier.fromPoiId) && poi?.ownerFactionId === courier.ownerFactionId;
  });
}

function createServerPoiWorker(poi) {
  const faction = FACTIONS.find((entry) => entry.id === poi.ownerFactionId);
  const courier = {
    id: `server-poi-worker-${poi.id}-${Date.now().toString(36)}`,
    kind: "poiWorker",
    fromPoiId: poi.id,
    ownerFactionId: poi.ownerFactionId,
    workerName: poiWorkerNames[poi.resourceId] ?? "Worker",
    resourceId: poi.resourceId,
    amount: poiWorkerDeliveryAmount,
    position: { ...poi.position },
    target: faction ? { ...faction.position } : { ...poi.position },
    direction: "toHub",
    payload: {},
    progress: 0,
    duration: faction ? Math.max(6, distance2D(poi.position, faction.position) / 10) : 6,
    hp: 55,
    maxHp: 55
  };
  loadServerPoiWorker(courier, poi);
  poi.workerRespawnAt = 0;
  return courier;
}

function advanceServerPoiWorker(world, courier, elapsedSeconds) {
  const poi = world.pois.find((entry) => entry.id === courier.fromPoiId);
  const faction = FACTIONS.find((entry) => entry.id === courier.ownerFactionId);

  if (!poi || poi.ownerFactionId !== courier.ownerFactionId || !faction) {
    courier.hp = 0;
    return;
  }

  courier.direction = courier.direction === "toPoi" ? "toPoi" : "toHub";
  courier.payload = normalizeCourierPayload(courier.payload);
  courier.position = courier.position ?? { ...poi.position };
  courier.target = courier.direction === "toHub" ? { ...faction.position } : { ...poi.position };
  courier.duration = Math.max(6, distance2D(poi.position, faction.position) / 10);
  courier.hp = numberOrDefault(courier.hp, 55);
  courier.maxHp = numberOrDefault(courier.maxHp, 55);
  courier.progress = Math.max(0, Number(courier.progress) || 0) + elapsedSeconds / courier.duration;

  let safety = 0;
  while (courier.progress >= 1 && safety < 24) {
    courier.progress -= 1;
    safety += 1;

    if (courier.direction === "toHub") {
      deliverServerCourierPayload(world, courier);
      courier.direction = "toPoi";
      courier.position = { ...faction.position };
      courier.target = { ...poi.position };
    } else {
      loadServerPoiWorker(courier, poi);
      courier.direction = "toHub";
      courier.position = { ...poi.position };
      courier.target = { ...faction.position };
    }
  }
}

function loadServerPoiWorker(courier, poi) {
  courier.resourceId = poi.resourceId;
  courier.amount = poiWorkerDeliveryAmount;
  courier.payload = {
    [poi.resourceId]: poiWorkerDeliveryAmount
  };
}

function isServerPoiWorker(courier) {
  return courier?.kind === "poiWorker";
}

function distance2D(a, b) {
  return Math.hypot((a?.x ?? 0) - (b?.x ?? 0), (a?.z ?? 0) - (b?.z ?? 0));
}

function normalizeMarket(source, defaults) {
  const market = {};

  for (const resource of RESOURCE_TYPES) {
    market[resource.id] = {
      buy: clampNumber(source?.[resource.id]?.buy, resource.floor + 6, resource.ceiling),
      sell: clampNumber(source?.[resource.id]?.sell, resource.floor, resource.ceiling)
    };

    if (!Number.isFinite(Number(source?.[resource.id]?.buy))) {
      market[resource.id].buy = defaults[resource.id].buy;
    }

    if (!Number.isFinite(Number(source?.[resource.id]?.sell))) {
      market[resource.id].sell = defaults[resource.id].sell;
    }
  }

  return market;
}

function normalizeFactionResources(source, defaults) {
  return Object.fromEntries(
    FACTIONS.map((faction) => {
      const store = source?.[faction.id];
      return [
        faction.id,
        {
          gold: numberOrDefault(store?.gold, defaults[faction.id].gold),
          items: Array.isArray(store?.items) ? store.items.filter(isPlainObject).slice(0, 500) : defaults[faction.id].items,
          resources: normalizeResourceBag(store?.resources, defaults[faction.id].resources)
        }
      ];
    })
  );
}

function normalizeResourceBag(source, defaults) {
  return Object.fromEntries(
    RESOURCE_TYPES.map((resource) => [
      resource.id,
      numberOrDefault(source?.[resource.id], defaults[resource.id] ?? 0)
    ])
  );
}

function numberOrDefault(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : fallback;
}

function normalizeFactionMembers(source, defaults) {
  return Object.fromEntries(
    FACTIONS.map((faction) => [
      faction.id,
      Array.isArray(source?.[faction.id]) ? source[faction.id].filter(isPlainObject).slice(0, 250) : defaults[faction.id]
    ])
  );
}

function normalizeFactionGovernance(source, defaults) {
  return Object.fromEntries(
    FACTIONS.map((faction) => {
      const governance = source?.[faction.id];
      const defaultGovernance = defaults[faction.id];
      return [
        faction.id,
        {
          rulerPlayerId: sanitizeText(governance?.rulerPlayerId, 80) || null,
          relationStatus: {
            ...defaultGovernance.relationStatus,
            ...(isPlainObject(governance?.relationStatus) ? governance.relationStatus : {})
          },
          allianceRequests: Array.isArray(governance?.allianceRequests)
            ? governance.allianceRequests.map((id) => sanitizeText(id, 40)).filter(Boolean).slice(0, 20)
            : []
        }
      ];
    })
  );
}

function normalizePois(source, defaults) {
  return defaults.map((defaultPoi) => {
    const poi = Array.isArray(source) ? source.find((entry) => entry?.id === defaultPoi.id) : null;
    const ownerFactionId = sanitizeText(poi?.ownerFactionId, 40);
    return {
      ...defaultPoi,
      ownerFactionId: FACTIONS.some((faction) => faction.id === ownerFactionId) ? ownerFactionId : null,
      pulse: clampNumber(poi?.pulse, 0, worldTickMs / 1000),
      workerRespawnAt: clampNumber(poi?.workerRespawnAt, 0, Number.MAX_SAFE_INTEGER)
    };
  });
}

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

async function handleMultiplayerRequest(request, response, requestUrl) {
  try {
    prunePlayers();

    if (request.method === "GET" && requestUrl.pathname === "/api/multiplayer/state") {
      writeJson(response, 200, {
        serverTime: Date.now(),
        players: [...players.values()].map(serializePlayer)
      });
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/multiplayer/player") {
      const payload = sanitizePlayerPayload(await readJsonBody(request));

      if (!payload) {
        writeJson(response, 400, { ok: false, message: "Invalid player payload." });
        return;
      }

      const player = upsertPlayer(payload);
      writeJson(response, 200, { ok: true, player: serializePlayer(player) });
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/multiplayer/attack") {
      writeJson(response, 200, resolvePlayerAttack(await readJsonBody(request)));
      return;
    }

    writeJson(response, 404, { ok: false, message: "Multiplayer endpoint not found." });
  } catch (error) {
    writeJson(response, 500, {
      ok: false,
      message: error instanceof Error ? error.message : "Multiplayer request failed."
    });
  }
}

function upsertPlayer(payload) {
  const now = Date.now();
  const existing = players.get(payload.id);
  const player = existing ?? {
    id: payload.id,
    name: payload.name,
    renown: payload.renown,
    hp: playerMaxHealth,
    maxHp: playerMaxHealth,
    dead: false,
    respawnAt: 0,
    lastAttackAt: 0,
    lastSuccessfulPvpAttackAt: 0,
    lastDamagedAt: 0,
    lastDamagedBy: null,
    lastDamagedByName: null,
    lastDamageSource: null,
    joinedAt: now
  };

  if (player.dead && now >= player.respawnAt) {
    player.hp = player.maxHp;
    player.dead = false;
    player.respawnAt = 0;
    player.lastDamagedBy = null;
    player.lastDamagedByName = null;
    player.lastDamageSource = null;
  }

  player.name = payload.name;
  player.renown = payload.renown;
  player.factionId = payload.factionId;
  player.position = player.dead ? player.position : payload.position;
  player.elevation = player.dead ? player.elevation ?? 0 : payload.elevation;
  player.towerStructureId = payload.towerStructureId;
  player.rotation = payload.rotation;
  player.headRotation = payload.headRotation;
  player.moving = payload.moving;
  player.speed = payload.speed;
  player.sceneMode = payload.sceneMode;
  player.interiorFactionId = payload.interiorFactionId;
  player.activePoiInteriorId = payload.activePoiInteriorId;
  player.leftHandType = payload.leftHandType;
  player.leftHandName = payload.leftHandName;
  player.rightHandType = payload.rightHandType;
  player.rightHandName = payload.rightHandName;
  player.armorItems = payload.armorItems;

  if (payload.dead && !player.dead) {
    player.hp = 0;
    player.dead = true;
    player.respawnAt = Math.max(player.respawnAt ?? 0, payload.respawnAt || now + respawnDelayMs);
  } else if (!player.dead && Number.isFinite(payload.hp) && payload.hp < player.hp) {
    player.hp = Math.max(0, payload.hp);
  }

  if (!player.dead && player.hp <= 0) {
    player.dead = true;
    player.respawnAt = now + respawnDelayMs;
  }

  player.lastSeen = now;
  players.set(player.id, player);
  return player;
}

function resolvePlayerAttack(body) {
  const attackerId = sanitizeText(body?.attackerId, 80);
  const targetId = sanitizeText(body?.targetId, 80);
  const attacker = players.get(attackerId);
  const target = players.get(targetId);

  if (!attacker || !target || attacker.id === target.id) {
    return { ok: false, message: "No valid player target." };
  }

  const now = Date.now();

  if (attacker.dead) {
    return { ok: false, message: "You are defeated." };
  }

  if (target.dead) {
    return { ok: false, message: `${target.name} is already defeated.` };
  }

  if (getSceneKey(attacker) !== getSceneKey(target)) {
    return { ok: false, message: `${target.name} is not in this area.` };
  }

  if (now - attacker.lastSuccessfulPvpAttackAt < 180) {
    return { ok: false, message: "Attack is recovering." };
  }

  const range = clampNumber(body?.range, 0.5, maxAttackRange);
  const damage = Math.round(clampNumber(body?.damage, 1, 80));
  const knockback = clampNumber(body?.knockback, 0, 30);
  const direction = normalizeDirection(body?.direction);
  const source = sanitizeText(body?.source, 40);
  const sourceName = sanitizeText(body?.sourceName, 60);
  const origin = source === "outpost" ? sanitizePosition(body?.origin) : attacker.position;
  const dx = target.position.x - origin.x;
  const dz = target.position.z - origin.z;
  const distance = Math.hypot(dx, dz);
  const knockbackDirection = direction ?? (distance > 0.001 ? { x: dx / distance, z: dz / distance } : null);

  if (distance > range + 2.2) {
    return { ok: false, message: `${target.name} is out of range.` };
  }

  if (distance > 0.75 && direction) {
    const facing = ((dx / distance) * direction.x) + ((dz / distance) * direction.z);

    if (facing < 0.08) {
      return { ok: false, message: `${target.name} is outside your swing.` };
    }
  }

  target.hp = Math.max(0, target.hp - damage);
  if (knockback > 0 && knockbackDirection) {
    target.position = {
      x: clampNumber(target.position.x + knockbackDirection.x * knockback, -300, 300),
      z: clampNumber(target.position.z + knockbackDirection.z * knockback, -300, 300)
    };
  }
  target.lastDamagedAt = now;
  target.lastDamagedBy = attacker.id;
  target.lastDamagedByName = source === "outpost" && sourceName ? sourceName : attacker.name;
  target.lastDamageSource = source;
  attacker.lastAttackAt = now;
  attacker.lastSuccessfulPvpAttackAt = now;

  if (target.hp <= 0) {
    target.dead = true;
    target.respawnAt = now + respawnDelayMs;
  }

  return {
    ok: true,
    damage,
    knockback,
    defeated: target.dead,
    attacker: serializePlayer(attacker),
    target: serializePlayer(target),
    message: target.dead
      ? `${target.name} defeated${source === "outpost" && sourceName ? ` by ${sourceName}` : ""}.`
      : `${target.name} hit${source === "outpost" && sourceName ? ` by ${sourceName}` : ""} for ${damage}.`
  };
}

function getSceneKey(player) {
  return [
    player.sceneMode ?? "outdoor",
    player.interiorFactionId ?? "",
    player.activePoiInteriorId ?? ""
  ].join(":");
}

function sanitizePlayerPayload(body) {
  if (!body || typeof body !== "object") {
    return null;
  }

  const id = sanitizeText(body.id, 80);

  if (!id) {
    return null;
  }

  return {
    id,
    name: sanitizeText(body.name, 32) || "Player",
    renown: clampNumber(body.renown, 0, Number.MAX_SAFE_INTEGER),
    factionId: sanitizeText(body.factionId, 40) || null,
    position: sanitizePosition(body.position),
    elevation: clampNumber(body.elevation, 0, 40),
    towerStructureId: sanitizeText(body.towerStructureId, 80) || null,
    rotation: clampNumber(body.rotation, -Math.PI * 2, Math.PI * 2),
    headRotation: clampNumber(body.headRotation, -Math.PI * 2, Math.PI * 2),
    moving: Boolean(body.moving),
    speed: clampNumber(body.speed, 0, 60),
    sceneMode: ["outdoor", "interior", "poiInterior"].includes(body.sceneMode) ? body.sceneMode : "outdoor",
    interiorFactionId: sanitizeText(body.interiorFactionId, 40) || null,
    activePoiInteriorId: sanitizeText(body.activePoiInteriorId, 60) || null,
    leftHandType: sanitizeText(body.leftHandType, 40) || null,
    leftHandName: sanitizeText(body.leftHandName, 60) || null,
    rightHandType: sanitizeText(body.rightHandType, 40) || null,
    rightHandName: sanitizeText(body.rightHandName, 60) || null,
    armorItems: sanitizeArmorItems(body.armorItems),
    hp: Number.isFinite(Number(body.hp)) ? clampNumber(body.hp, 0, playerMaxHealth) : null,
    maxHp: playerMaxHealth,
    dead: Boolean(body.dead),
    respawnAt: clampNumber(body.respawnAt, 0, Number.MAX_SAFE_INTEGER)
  };
}

function sanitizePosition(position) {
  return {
    x: clampNumber(position?.x, -300, 300),
    z: clampNumber(position?.z, -300, 300)
  };
}

function sanitizeArmorItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  const seenSlots = new Set();

  return items
    .map((item) => {
      const slot = sanitizeText(item?.armor?.slot, 20);
      const type = sanitizeText(item?.type, 40);

      if (!armorSlots.has(slot) || !armorTypes.has(type) || seenSlots.has(slot)) {
        return null;
      }

      seenSlots.add(slot);
      const material = sanitizeText(item?.armor?.material, 40) || "Unknown";
      const color = sanitizeArmorColor(item?.armor?.color);
      const metalness = clampNumber(item?.armor?.metalness, 0, 0.75);

      return {
        id: `${slot}:${type}:${material}:${color}:${metalness}`,
        type,
        name: sanitizeText(item?.name, 60) || `${material} ${type}`,
        armor: {
          slot,
          material,
          color,
          metalness
        },
        durability: clampNumber(item?.durability, 0, Number.MAX_SAFE_INTEGER),
        maxDurability: clampNumber(item?.maxDurability, 1, Number.MAX_SAFE_INTEGER)
      };
    })
    .filter(Boolean)
    .slice(0, 4);
}

function sanitizeArmorColor(color) {
  return typeof color === "string" && /^#[0-9a-fA-F]{6}$/.test(color) ? color : "#858b8f";
}

function normalizeDirection(direction) {
  const x = clampNumber(direction?.x, -1, 1);
  const z = clampNumber(direction?.z, -1, 1);
  const length = Math.hypot(x, z);

  if (length < 0.001) {
    return null;
  }

  return { x: x / length, z: z / length };
}

function serializePlayer(player) {
  return {
    id: player.id,
    name: player.name,
    renown: player.renown ?? 0,
    factionId: player.factionId,
    position: player.position,
    elevation: player.elevation ?? 0,
    towerStructureId: player.towerStructureId ?? null,
    rotation: player.rotation,
    headRotation: player.headRotation,
    moving: player.moving,
    speed: player.speed,
    sceneMode: player.sceneMode,
    interiorFactionId: player.interiorFactionId,
    activePoiInteriorId: player.activePoiInteriorId,
    leftHandType: player.leftHandType,
    leftHandName: player.leftHandName,
    rightHandType: player.rightHandType,
    rightHandName: player.rightHandName,
    armorItems: player.armorItems ?? [],
    hp: player.hp,
    maxHp: player.maxHp,
    dead: player.dead,
    respawnAt: player.respawnAt,
    lastAttackAt: player.lastAttackAt,
    lastDamagedAt: player.lastDamagedAt,
    lastDamagedBy: player.lastDamagedBy,
    lastDamagedByName: player.lastDamagedByName,
    lastDamageSource: player.lastDamageSource ?? null,
    lastSeen: player.lastSeen
  };
}

function prunePlayers() {
  const now = Date.now();

  for (const [id, player] of players) {
    if (now - player.lastSeen > playerTimeoutMs) {
      players.delete(id);
    }
  }
}

function readJsonBody(request) {
  return new Promise((resolveBody, rejectBody) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;

      if (body.length > maxJsonBodyBytes) {
        request.destroy();
        rejectBody(new Error("Request body too large."));
      }
    });

    request.on("end", () => {
      if (!body) {
        resolveBody(null);
        return;
      }

      try {
        resolveBody(JSON.parse(body));
      } catch {
        rejectBody(new Error("Invalid JSON."));
      }
    });

    request.on("error", rejectBody);
  });
}

function writeJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function clampNumber(value, min, max) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return min;
  }

  return Math.max(min, Math.min(max, number));
}

function sanitizeText(value, maxLength) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/[^\w .:'-]/g, "").trim().slice(0, maxLength);
}

function isPortAvailable(port) {
  return new Promise((resolveAvailable) => {
    const probe = createProbeServer()
      .once("error", () => resolveAvailable(false))
      .once("listening", () => {
        probe.close(() => resolveAvailable(true));
      })
      .listen(port, host);
  });
}

async function findAvailablePort(startPort) {
  for (let offset = 0; offset <= maxPortAttempts; offset += 1) {
    const port = startPort + offset;

    if (await isPortAvailable(port)) {
      return port;
    }
  }

  throw new Error(`No available port found from ${startPort} to ${startPort + maxPortAttempts}.`);
}

function getLanAddresses() {
  return Object.values(networkInterfaces())
    .flat()
    .filter((address) => address?.family === "IPv4" && !address.internal)
    .map((address) => address.address);
}

async function getPublicAddress() {
  if (process.env.PUBLIC_HOST) {
    return process.env.PUBLIC_HOST;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1400);
    const response = await fetch("https://api.ipify.org", { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      return null;
    }

    return (await response.text()).trim();
  } catch {
    return null;
  }
}

const port = await findAvailablePort(preferredPort);

server.once("error", (error) => {
  throw error;
});

server.listen(port, host, async () => {
  console.log(`King of Kingdoms 3D running at http://127.0.0.1:${port}/`);

  for (const address of getLanAddresses()) {
    console.log(`King of Kingdoms 3D also available at http://${address}:${port}/`);
  }

  const publicAddress = await getPublicAddress();

  if (publicAddress) {
    console.log(`King of Kingdoms 3D also available at http://${publicAddress}:${port}/`);
  }
});
