import { isInOwnCastle, regenerateHealth } from './src/health.js';
import { captureHistory, mergeHistory, normalizeHistory, historyRenown } from './src/history.js';
import { writeArchiveChapter } from './server-history.mjs';
import { cheatCatalog, parseCheat, executeCheat } from './src/cheats.js';
import { createAuth } from "./server-auth.mjs";
import { isShield, resolveShieldBlock } from "./src/combat-motion.js";
import { createDeathDrops, pickupDeathDrop } from "./src/death-loot.js";
import { clearPlayerResources, syncResourceReceipts, reconcileResourceTransfers, transferFactionResource } from "./src/resource-transfers.js";
import { accruePoiIncome, normalizeIncomeTotals, reconcilePoiIncome } from "./src/poi-income.js";
import { createGameState, foundFaction, updateFactionIdentity } from "./src/state.js";
import { normalizeFactions } from "./src/factions.js";
import { clampWorldPosition } from "./src/world-layout.js";
import { createReadStream, existsSync, readFileSync, statSync, mkdirSync, writeFileSync, renameSync } from "node:fs";
import { createServer } from "node:http";
import { createServer as createProbeServer } from "node:net";
import { networkInterfaces } from "node:os";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createMarket } from "./src/economy.js";
import { FACTIONS, POIS, RESOURCE_TYPES } from "./src/game-data.js";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)));
const auth = createAuth(root);
const localSaveFile = join(process.env.KOK_DATA_DIR || join(root, "data"), "realm-save.json");
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
const maxHistoryTransactions = 120;
const maxHistoryVolumes = 40;
const loreSchemaVersion = 2;
const recordedLoreEventTypes = new Set(["player_killed", "poi_claimed", "ruler_claimed", "ruler_killed", "faction_founded"]);
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
const cheatSessions = new Set();
const memoryPersistence = {
  world: createDefaultWorldState(),
  players: new Map()
};
if (existsSync(localSaveFile)) {
  const saved = JSON.parse(readFileSync(localSaveFile, "utf8"));
  memoryPersistence.world = saved.world;
  memoryPersistence.players = new Map(saved.players);
}
function flushLocalSave() {
  mkdirSync(resolve(localSaveFile, ".."), { recursive: true });
  writeFileSync(localSaveFile + ".tmp", JSON.stringify({ world: memoryPersistence.world, players: [...memoryPersistence.players] }));
  renameSync(localSaveFile + ".tmp", localSaveFile);
}
let dbPoolPromise = null;
let multiplayerSnapshotSequence = 0;
let worldSnapshotSequence = 0;
let worldRequestQueue = Promise.resolve();

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
  if (!(decodedPath === "/" || ["/index.html", "/styles.css"].includes(decodedPath) || /^\/(src|assets)\//.test(decodedPath) || decodedPath.startsWith("/node_modules/three/") || /^\/tools\/weapon-preview\.(html|js)$/.test(decodedPath))) return null;
  if (decodedPath.split(/[\\/]/).some(part => part.startsWith("."))) return null;
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

  if (requestUrl.pathname.startsWith("/auth/") || requestUrl.pathname.startsWith("/api/auth/")) {
    void auth.handle(request, response, requestUrl); return;
  }
  if (requestUrl.pathname.startsWith("/api/multiplayer/")) {
    void handleMultiplayerRequest(request, response, requestUrl);
    return;
  }

  if (requestUrl.pathname.startsWith("/api/world/")) {
    worldRequestQueue = worldRequestQueue.then(() => handleWorldRequest(request, response, requestUrl));
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
  if (requestUrl.pathname.startsWith('/api/world/cheats')) {
    try { await handleCheatRequest(request, response, requestUrl); }
    catch (error) { writeJson(response, error.status || 400, { ok: false, message: error.message }); }
    return;
  }
  try {
    if (request.method === "GET" && requestUrl.pathname === "/api/world/state") {
      const playerId = auth.playerId(request, requestUrl.searchParams.get("playerId"));
      writeJson(response, 200, {
        ...await loadPersistentState(playerId),
        snapshotSequence: ++worldSnapshotSequence
      });
      return;
    }

    if (request.method === "POST" && ["/api/world/found-faction", "/api/world/update-faction"].includes(requestUrl.pathname)) {
      const body = await readJsonBody(request);
      const playerId = auth.playerId(request, body?.playerId);
      const live = players.get(playerId);
      const nearThrone = live?.sceneMode === "interior" && live.interiorFactionId === body.castleId &&
        Math.hypot(live.position.x, live.position.z + 20.3) <= 7.5 && !live.dead;
      if (!playerId || !nearThrone || !body.seated) {
        writeJson(response, 200, { ok: false, message: "Sit on the castle's throne to manage its faction." }); return;
      }
      const saved = await loadPersistentState(playerId);
      const player = normalizePlayerSnapshot(playerId, body.player);
      const state = Object.assign(createGameState(), saved.world, player);
      // A stale client cannot leave its existing faction by changing its payload.
      state.selectedFactionId = [saved.player?.selectedFactionId, live.factionId, player.selectedFactionId].find(id => saved.world.factions[id]) || null;
      const action = requestUrl.pathname === "/api/world/update-faction" ? updateFactionIdentity : foundFaction;
      const result = action(state, body.castleId, body.draft, { castleId: live.interiorFactionId, seated: true });
      if (!result.ok) { writeJson(response, 200, result); return; }
      const payload = await savePersistentState(playerId, { world: state, player: { selectedFactionId: state.selectedFactionId, player: state.player } }, true);
      writeJson(response, 200, { ...payload, message: result.message, snapshotSequence: ++worldSnapshotSequence }); return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/world/pickup-drop") {
      const body = await readJsonBody(request);
      const playerId = auth.playerId(request, body?.playerId);
      const saved = await loadPersistentState(playerId);
      const result = saved.player ? pickupDeathDrop(saved.world, saved.player, players.get(playerId), body.dropId, 5.5) : { ok: false, message: "Player unavailable." };
      if (!result.ok) { writeJson(response, 200, result); return; }
      const payload = await savePersistentState(playerId, { world: saved.world, player: saved.player }, true, true);
      writeJson(response, 200, { ...payload, ...result, snapshotSequence: ++worldSnapshotSequence }); return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/world/give-resource") {
      const body = await readJsonBody(request);
      const playerId = auth.playerId(request, body?.playerId);
      const saved = await loadPersistentState(playerId);
      const requestId = sanitizeText(body.requestId, 80);
      if (!requestId) { writeJson(response, 400, { ok: false, message: "Missing transfer request id." }); return; }
      const requestKey = `${playerId}:${requestId}`;
      if (saved.world.resourceTransferRequests[requestKey]) {
        writeJson(response, 200, { ...saved, message: saved.world.resourceTransferRequests[requestKey], snapshotSequence: ++worldSnapshotSequence }); return;
      }
      const recipient = (await loadPersistentState(sanitizeText(body.recipientId, 80))).player;
      if (players.get(playerId)?.dead || players.get(body.recipientId)?.dead) {
        writeJson(response, 200, { ok: false, message: "Wait until both players are alive." }); return;
      }
      const result = transferFactionResource(saved.world, playerId, recipient, body.factionId, body.resourceId, body.amount);
      if (!result.ok) { writeJson(response, 200, result); return; }
      saved.world.resourceTransferRequests[requestKey] = result.message;
      await savePersistentState(recipient.player.id, { world: saved.world, player: recipient }, true, true);
      writeJson(response, 200, { ...await loadPersistentState(playerId), ...result, snapshotSequence: ++worldSnapshotSequence });
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/world/snapshot") {
      const body = await readJsonBody(request);
      const playerId = auth.playerId(request, body?.playerId);

      if (!playerId) {
        writeJson(response, 400, { ok: false, message: "Missing player id." });
        return;
      }

      writeJson(response, 200, {
        ...await savePersistentState(playerId, body),
        snapshotSequence: ++worldSnapshotSequence
      });
      return;
    }

    writeJson(response, 404, { ok: false, message: "World endpoint not found." });
  } catch (error) {
    writeJson(response, error.status || 500, {
      ok: false,
      message: error instanceof Error ? error.message : "World persistence request failed."
    });
  }
}

async function loadPersistentState(playerId) {
  const pool = await getDbPool();

  if (!pool) {
    const world = evolveWorldState(memoryPersistence.world);
    memoryPersistence.world = world;
    return {
      ok: true,
      storage: "disk",
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

const narrationJobs = new Set();
function scheduleNarration(world) {
  if (!process.env.OPENAI_API_KEY || !process.env.FOK_LORE_MODEL) return;
  const chapter = world.history.chapters.find(c => c.source === 'recorded-events' && !narrationJobs.has(c.id));
  if (!chapter) return;
  narrationJobs.add(chapter.id);
  const copy = structuredClone(world), epoch = copy.history.bookEpoch;
  // Network generation never holds the gameplay/save queue. Apply only to the same book edition.
  void writeArchiveChapter(copy, { chapterId: chapter.id }).then(result => {
    worldRequestQueue = worldRequestQueue.then(async () => {
      const saved = await loadPersistentState(null);
      const current = saved.world.history;
      const index = current.chapters.findIndex(c => c.id === chapter.id);
      if (!result || current.bookEpoch !== epoch || index < 0) return;
      current.chapters[index] = result;
      const pool = await getDbPool();
      if (pool) await pool.query('UPDATE kok_world_state SET state = $1::jsonb, updated_at = now() WHERE id = $2', [JSON.stringify(saved.world), 'primary']);
      else { memoryPersistence.world = saved.world; flushLocalSave(); }
    }).catch(error => console.error('Could not save history narrative', error.message));
    return worldRequestQueue;
  }).catch(error => console.error('Could not generate history narrative', error.message)).finally(() => narrationJobs.delete(chapter.id));
}

async function savePersistentState(playerId, body, founding = false, resourceAction = false) {
  const saved = await loadPersistentState(playerId);
  if (!founding && (Number(body?.cheatRevision) || 0) !== (saved.world.cheatRevision || 0)) return saved;
  if (body?.world && !founding) {
    const current = (await loadPersistentState(playerId)).world;
    reconcilePoiIncome(body.world, current);
    reconcileResourceTransfers(body.world, current);
    body.world.history = mergeHistory(current.history, body.world.history);
    body.world.elapsed = Math.max(current.elapsed, Number(body.world.elapsed) || 0);
    body.world.resourceTransferRequests = current.resourceTransferRequests;
    body.world.deathDrops = current.deathDrops;
    // Founding is an atomic server action; older world snapshots cannot erase it.
    body.world.resetAllRevision = current.resetAllRevision || 0;
    body.world.factions = current.factions;
    body.world.factionMembers ??= {};
    body.world.factionGovernance ??= {};
    body.world.factionResources ??= {};
    for (const id of Object.keys(current.factionGovernance)) {
      const oldRuler = body.world.factionGovernance?.[id]?.rulerPlayerId;
      if (oldRuler && current.history.events.some(e => e.type === "ruler_succeeded" && e.subject?.playerId === oldRuler && e.factionId === id)) {
        body.world.factionGovernance[id] = current.factionGovernance[id];
        body.world.factionMembers[id] = current.factionMembers[id];
      }
      if (!current.factions[id]) {
        body.world.factionMembers[id] = [];
        body.world.factionGovernance[id] = current.factionGovernance[id];
        body.world.factionResources[id] = current.factionResources[id];
      }
    }
    for (const id of Object.keys(current.factions)) {
      body.world.factionGovernance ??= {};
      body.world.factionMembers ??= {};
      if (current.factionMembers[id]?.some(member => member.playerId === current.factions[id].founderPlayerId) && !body.world.factionMembers[id]?.some(member => member.playerId === current.factions[id].founderPlayerId)) {
        body.world.factionMembers[id] = current.factionMembers[id];
        body.world.factionGovernance[id] = current.factionGovernance[id];
      }
    }
    if (body.world.lore && current.lore.nextVolumeNumber > (body.world.lore.nextVolumeNumber || 1)) body.world.lore = current.lore;
  }
  const player = normalizePlayerSnapshot(playerId, body?.player);
  if (playerId.startsWith("guest-")) {
    player.player.houseName = "";
    player.player.name = player.player.firstName || "Traveller";
  } else if (saved.player?.player.houseName) {
    player.player.houseName = saved.player.player.houseName;
    player.player.name = player.player.firstName + " " + player.player.houseName.charAt(0) + player.player.houseName.slice(1).toLowerCase();
  }
  if (!resourceAction && saved.player) syncResourceReceipts(player.player, saved.player.player);
  const pool = await getDbPool();
  let world = null;

  if (!pool) {
    world = body?.world ? normalizeWorldState(body.world) : evolveWorldState(memoryPersistence.world);
    captureHistory(world, player);
    if (player.selectedFactionId && !world.factions[player.selectedFactionId]) player.selectedFactionId = null;
    await writeArchiveChapter(world, { apiKey: null });
    player.player.renown = historyRenown(world.history, playerId);
    memoryPersistence.world = world;
    memoryPersistence.players.set(playerId, player);
    flushLocalSave();
    scheduleNarration(world);
    return {
      ok: true,
      storage: "disk",
      serverTime: Date.now(),
      world,
      player
    };
  }

  await ensureDatabaseSchema(pool);
  if (body?.world) {
    world = normalizeWorldState(body.world);
  } else {
    const worldResult = await pool.query("SELECT state FROM kok_world_state WHERE id = $1", ["primary"]);
    world = evolveWorldState(normalizeWorldState(worldResult.rows[0]?.state));
  }

  captureHistory(world, player);
    if (player.selectedFactionId && !world.factions[player.selectedFactionId]) player.selectedFactionId = null;
  await writeArchiveChapter(world, { apiKey: null });
  player.player.renown = historyRenown(world.history, playerId);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO kok_world_state (id, state, updated_at)
       VALUES ($1, $2::jsonb, now())
       ON CONFLICT (id) DO UPDATE SET state = EXCLUDED.state, updated_at = now()`,
      ["primary", JSON.stringify(world)]
    );
    await client.query(
      `INSERT INTO kok_player_state (player_id, state, updated_at)
       VALUES ($1, $2::jsonb, now())
       ON CONFLICT (player_id) DO UPDATE SET state = EXCLUDED.state, updated_at = now()`,
      [playerId, JSON.stringify(player)]
    );

    await client.query("COMMIT");
    scheduleNarration(world);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

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
    console.warn("World persistence is using local disk: no database address found.");
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
    dbPoolPromise = null;
    throw new Error("Database unavailable. Your saved progress has not been changed.");
  }
}

function readDatabaseAddress() {
  if (process.env.KOK_STORAGE === "disk") return "";
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
    version: 2,
    elapsed: 0,
    market: createMarket(),
    factions: {},
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
    houseRelations: {},
    factionResources: Object.fromEntries(
      FACTIONS.map((faction) => [
        faction.id,
      {
        gold: 500,
        items: [],
        blacksmith: {
          xp: 0,
          level: 1
        },
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
    history: normalizeHistory(),
    lore: createDefaultLoreState(),
    lastEvolvedAt: Date.now()
  };
}

function createDefaultLoreState() {
  const opening = createOpeningLoreText();
  return {
    version: loreSchemaVersion,
    story: opening,
    opening,
    openingPrompt: createOpeningLorePrompt(),
    transactions: [],
    volumes: [],
    nextVolumeNumber: 1,
    renownAwardsByPlayerId: {},
    pendingStartedAt: null
  };
}

function normalizeWorldState(snapshot) {
  const defaults = createDefaultWorldState();
  const source = snapshot && typeof snapshot === "object" ? snapshot : {};

  return {
    ...defaults,
    cheatRevision: Math.max(0, Number(source.cheatRevision) || 0),
    resetAllRevision: Math.max(0, Number(source.resetAllRevision) || 0),
    elapsed: clampNumber(source.elapsed, 0, Number.MAX_SAFE_INTEGER),
    poiIncomeTotals: normalizeIncomeTotals(source.poiIncomeTotals),
    resourceTransferTotals: normalizeIncomeTotals(source.resourceTransferTotals),
    resourceTransferRequests: source.resourceTransferRequests ?? {},
    deathDrops: Array.isArray(source.deathDrops) ? source.deathDrops : [],
    factions: normalizeFactions(source.factions),
    market: normalizeMarket(source.market, defaults.market),
    factionMembers: normalizeFactionMembers(source.factionMembers, defaults.factionMembers),
    factionGovernance: normalizeFactionGovernance(source.factionGovernance, defaults.factionGovernance),
    houseRelations: normalizeHouseRelations(source.houseRelations),
    factionResources: normalizeFactionResources(source.factionResources, defaults.factionResources),
    pois: normalizePois(source.pois, defaults.pois),
    structures: Array.isArray(source.structures) ? source.structures.filter(isPlainObject).slice(0, 250) : [],
    couriers: Array.isArray(source.couriers) ? source.couriers.filter(isPlainObject).slice(0, 250) : [],
    activeEvent: isPlainObject(source.activeEvent) ? source.activeEvent : null,
    history: normalizeHistory(source.history),
    lore: normalizeLoreState(source.lore, defaults.lore),
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
      houseName: sanitizeHouseName(player.houseName),
      firstName: sanitizeText(player.firstName, 24),
      lifeNumber: clampNumber(player.lifeNumber, 0, Number.MAX_SAFE_INTEGER),
      gold: clampNumber(player.gold, 0, Number.MAX_SAFE_INTEGER),
      renown: clampNumber(player.renown, 0, Number.MAX_SAFE_INTEGER),
      prowess: clampNumber(player.prowess ?? player.renown, 0, Number.MAX_SAFE_INTEGER),
      historyRenownClaimed: clampNumber(player.historyRenownClaimed, 0, Number.MAX_SAFE_INTEGER),
      historyRenownVersion: Number.isFinite(Number(player.historyRenownVersion))
        ? clampNumber(player.historyRenownVersion, 0, Number.MAX_SAFE_INTEGER)
        : 0,
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
  const evolutionStartedAt = world.lastEvolvedAt;
  const evolutionEndedAt = evolutionStartedAt + elapsedTicks * worldTickMs;

  accruePoiIncome(world, elapsedSeconds);
  ensureServerDepotCamels(world);
  ensureServerPoiWorkers(world);
  const deliveredCouriers = [];

  for (const courier of world.couriers) {
    if (isServerDepotCamel(courier)) {
      advanceServerDepotCamel(world, courier, evolutionStartedAt, evolutionEndedAt);
      continue;
    }

    if (isServerPoiWorker(courier)) {
      advanceServerPoiWorker(world, courier, evolutionStartedAt, evolutionEndedAt);
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
  captureHistory(world);
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

function advanceServerDepotCamel(world, courier, evolutionStartedAt, evolutionEndedAt) {
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
  prepareServerCourierRoute(courier, evolutionStartedAt);
  courier.progress = Math.max(0, (evolutionEndedAt - courier.routeStartedAt) / (courier.duration * 1000));

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

    courier.routeStartedAt += courier.duration * 1000;
    courier.routeRevision += 1;
    updateServerCourierRouteId(courier);
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

function advanceServerPoiWorker(world, courier, evolutionStartedAt, evolutionEndedAt) {
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
  prepareServerCourierRoute(courier, evolutionStartedAt);
  courier.progress = Math.max(0, (evolutionEndedAt - courier.routeStartedAt) / (courier.duration * 1000));

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

    courier.routeStartedAt += courier.duration * 1000;
    courier.routeRevision += 1;
    updateServerCourierRouteId(courier);
  }
}

function prepareServerCourierRoute(courier, evolutionStartedAt) {
  const durationMs = Math.max(1, Number(courier.duration) || 1) * 1000;
  const progress = Math.max(0, Math.min(1, Number(courier.progress) || 0));
  const routeStartedAt = Number(courier.routeStartedAt);

  courier.routeRevision = Math.max(0, Math.floor(Number(courier.routeRevision) || 0));
  courier.routeStartedAt = Number.isFinite(routeStartedAt) && routeStartedAt <= evolutionStartedAt
    ? routeStartedAt
    : evolutionStartedAt - progress * durationMs;
  updateServerCourierRouteId(courier);
}

function updateServerCourierRouteId(courier) {
  courier.routeId = `${courier.id}:${courier.routeRevision}:${courier.direction}`;
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
          blacksmith: normalizeBlacksmithProgress(store?.blacksmith, defaults[faction.id].blacksmith),
          resources: normalizeResourceBag(store?.resources, defaults[faction.id].resources)
        }
      ];
    })
  );
}

function normalizeBlacksmithProgress(source, defaults = { xp: 0, level: 1 }) {
  return {
    xp: numberOrDefault(source?.xp, defaults.xp ?? 0),
    level: clampNumber(source?.level, 1, 10) || defaults.level || 1
  };
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

function normalizeHouseRelations(source) {
  if (!isPlainObject(source)) {
    return {};
  }

  const relations = {};
  for (const [sourceHouse, targets] of Object.entries(source).slice(0, 250)) {
    const sourceHouseId = sanitizeHouseName(sourceHouse);
    if (!sourceHouseId || !isPlainObject(targets)) {
      continue;
    }

    relations[sourceHouseId] = {};
    for (const [targetHouse, status] of Object.entries(targets).slice(0, 250)) {
      const targetHouseId = sanitizeHouseName(targetHouse);
      if (targetHouseId && targetHouseId !== sourceHouseId && ["Ally", "Neutral", "Enemy"].includes(status)) {
        relations[sourceHouseId][targetHouseId] = status;
      }
    }
  }

  return relations;
}

function normalizePois(source, defaults) {
  return defaults.map((defaultPoi) => {
    const poi = Array.isArray(source) ? source.find((entry) => entry?.id === defaultPoi.id) : null;
    const ownerFactionId = sanitizeText(poi?.ownerFactionId, 40);
    return {
      ...defaultPoi,
      ownerFactionId: defaultPoi.type !== "Library" && FACTIONS.some((faction) => faction.id === ownerFactionId) ? ownerFactionId : null,
      incomeProgress: clampNumber(poi?.incomeProgress, 0, 4.999999),
      pulse: clampNumber(poi?.pulse, 0, worldTickMs / 1000),
      workerRespawnAt: clampNumber(poi?.workerRespawnAt, 0, Number.MAX_SAFE_INTEGER)
    };
  });
}

function normalizeLoreState(source, defaults = createDefaultLoreState()) {
  const lore = isPlainObject(source) ? source : {};

  if (lore.version !== loreSchemaVersion) {
    return createDefaultLoreState();
  }

  return {
    version: loreSchemaVersion,
    story: sanitizeLoreText(lore.story, defaults.story, 20000),
    opening: sanitizeLoreText(lore.opening, defaults.opening, 2400),
    openingPrompt: sanitizeLoreText(lore.openingPrompt, defaults.openingPrompt, 3000),
    transactions: normalizeLoreEntries(lore.transactions, maxHistoryTransactions).filter((entry) =>
      recordedLoreEventTypes.has(entry.type)
    ),
    volumes: normalizeLoreEntries(lore.volumes, maxHistoryVolumes),
    nextVolumeNumber: clampNumber(lore.nextVolumeNumber, 1, Number.MAX_SAFE_INTEGER) || defaults.nextVolumeNumber,
    renownAwardsByPlayerId: normalizeRenownAwards(lore.renownAwardsByPlayerId),
    pendingStartedAt: Number.isFinite(Number(lore.pendingStartedAt))
      ? clampNumber(lore.pendingStartedAt, 0, Number.MAX_SAFE_INTEGER)
      : null
  };
}

function sanitizeLoreText(value, fallback, maxLength) {
  return typeof value === "string" && value.trim() ? value.slice(0, maxLength) : fallback;
}

function normalizeLoreEntries(entries, maxEntries) {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries.filter(isPlainObject).slice(-maxEntries);
}

function normalizeRenownAwards(source) {
  if (!isPlainObject(source)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(source)
      .map(([playerId, amount]) => [sanitizeText(playerId, 80), clampNumber(amount, 0, Number.MAX_SAFE_INTEGER)])
      .filter(([playerId]) => Boolean(playerId))
      .slice(0, 1000)
  );
}

function createOpeningLorePrompt() {
  return `Start a medieval tale in the Grand Library, the neutral heart of an island where a great wall scroll records the deeds of living houses. Begin with four abandoned castles, empty thrones and no faction banners. Describe the snowy Frostspine, Kingswood forests, Amberfields and Sunmere coast. Use a few places naturally from this gazetteer: ${POIS.map((poi) => poi.name).join(", ")}.`;
}

function createOpeningLoreText() {
  const factionNames = formatList(FACTIONS.map((faction) => faction.name));
  return `At the heart of the crownlands stood the Grand Library. Beneath its twin towers, a great scroll waited upon the wall: a place for every oath, conquest and fallen ruler to outlive the hands that shaped them.\n\nBeyond its quiet court, four abandoned castles stood with empty thrones and bare flagpoles. Roads wound through the Kingswood, past the harvests of Amberfields and the warm shores of Sunmere. In the north, snow crowned the Frostspine above the mines; far from the library, raiders lit their fires among the ruins.\n\nThe chroniclers claimed no throne. They kept the history of those who did. The next words belonged to the living.`;
}

function formatList(values) {
  const clean = values.filter(Boolean);

  if (clean.length <= 1) {
    return clean[0] ?? "";
  }

  if (clean.length === 2) {
    return `${clean[0]} and ${clean[1]}`;
  }

  return `${clean.slice(0, -1).join(", ")}, and ${clean[clean.length - 1]}`;
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
        snapshotSequence: ++multiplayerSnapshotSequence,
        players: [...players.values()].map(serializePlayer)
      });
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/multiplayer/player") {
      const body = await readJsonBody(request);
      body.id = auth.playerId(request, body?.id);
      if (!auth.session(request).authenticated) { body.houseName = ""; body.name = body.firstName || "Traveller"; }
      const payload = sanitizePlayerPayload(body);

      if (!payload) {
        writeJson(response, 400, { ok: false, message: "Invalid player payload." });
        return;
      }

      const result = upsertPlayer(payload);
      writeJson(response, 200, {
        ok: true,
        serverTime: Date.now(),
        accepted: result.accepted,
        acceptedInputSequence: result.player.lastInputSequence ?? 0,
        player: serializePlayer(result.player)
      });
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/multiplayer/attack") {
      const body = await readJsonBody(request);
      body.attackerId = auth.playerId(request, body?.attackerId);
      writeJson(response, 200, resolvePlayerAttack(body));
      return;
    }

    writeJson(response, 404, { ok: false, message: "Multiplayer endpoint not found." });
  } catch (error) {
    writeJson(response, error.status || 500, {
      ok: false,
      message: error instanceof Error ? error.message : "Multiplayer request failed."
    });
  }
}

function queueResourceDeath(playerId, live) {
  const location = structuredClone(live.deathLocation ?? { position: live.position, elevation: live.elevation,
    sceneMode: live.sceneMode, interiorFactionId: live.interiorFactionId, activePoiInteriorId: live.activePoiInteriorId });
  const carried = live.carriedInventory ? structuredClone(live.carriedInventory) : null;
  worldRequestQueue = worldRequestQueue.then(async () => {
    const saved = await loadPersistentState(playerId);
    const snapshot = saved.player ?? normalizePlayerSnapshot(playerId, {});
    if (carried) snapshot.player.inventory = carried;
    const version = (snapshot.player.resourceDeathVersion || 0) + 1;
    saved.world.deathDrops.push(...createDeathDrops(snapshot.player, location, version));
    snapshot.player.dead = true;
    snapshot.player.hp = 0;
    snapshot.player.lootDeathReceiptCount = snapshot.player.lootReceiptCount || 0;
    snapshot.player.lootReceipts = [];
    clearPlayerResources(snapshot.player);
    snapshot.player.resourceDeathVersion = (snapshot.player.resourceDeathVersion || 0) + 1;
    snapshot.player.resourceDeathReceipts = { ...snapshot.player.resourceReceipts };
    await savePersistentState(playerId, { world: saved.world, player: snapshot }, true, true);
  }).catch(error => console.error("Could not persist death resource loss", error));
}

function upsertPlayer(payload) {
  const now = Date.now();
  const existing = players.get(payload.id);
  if (existing && payload.connectionId && existing.connectionId !== payload.connectionId) existing.lastInputSequence = 0;
  if (existing && payload.inputSequence <= (existing.lastInputSequence ?? 0)) {
    return { player: existing, accepted: false };
  }
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
    lastInputSequence: 0,
    joinedAt: now
  };

  const castleRegenSeconds = isInOwnCastle(player) && isInOwnCastle(payload)
    && player.factionId === payload.factionId
    ? Math.min(1, Math.max(0, (now - (player.lastSeen ?? now)) / 1000)) : 0;

  if (player.dead && now >= player.respawnAt && !payload.dead) {
    player.hp = player.maxHp;
    player.dead = false;
    player.respawnAt = 0;
    player.lastDamagedBy = null;
    player.lastDamagedByName = null;
    player.lastDamageSource = null;
  }

  player.connectionId = payload.connectionId;
  player.name = payload.name;
  player.houseName = payload.houseName;
  player.firstName = payload.firstName;
  player.lifeNumber = payload.lifeNumber;
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
  player.combatAttacks = payload.combatAttacks;
  player.armorItems = payload.armorItems;
  const guardElapsed = Math.min(1, (now - (player.guardUpdatedAt ?? now)) / 1000);
  player.guardStamina = Math.min(payload.guardStamina, Math.min(100, (player.guardStamina ?? 100) + (player.guardHand ? 0 : guardElapsed * 24)));
  const requestedGuard = payload.guardHand;
  const shieldType = requestedGuard === 'left' ? payload.leftHandType : requestedGuard === 'right' ? payload.rightHandType : null;
  const validGuard = isShield(shieldType) && !player.dead && now >= (player.guardBrokenUntil ?? 0) && now - player.lastAttackAt > 250;
  if (validGuard && requestedGuard !== player.guardHand) player.guardRaisedAt = now;
  player.guardHand = validGuard ? requestedGuard : null;
  player.guardUpdatedAt = now;
  player.lastInputSequence = payload.inputSequence;
  player.carriedInventory = payload.carriedInventory;
  player.deathLocation = payload.deathLocation;

  if (payload.dead && !player.dead) {
    player.hp = 0;
    player.dead = true;
    queueResourceDeath(player.id, player);
    player.respawnAt = Math.max(player.respawnAt ?? 0, payload.respawnAt || now + respawnDelayMs);
  } else if (!player.dead && Number.isFinite(payload.hp) && payload.hp < player.hp) {
    player.hp = Math.max(0, payload.hp);
  }

  if (!player.dead && player.hp <= 0) {
    player.dead = true;
    queueResourceDeath(player.id, player);
    player.respawnAt = now + respawnDelayMs;
  }

  player.hp = regenerateHealth(player, castleRegenSeconds);
  player.lastSeen = now;
  players.set(player.id, player);
  return { player, accepted: true };
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

  const attackId = sanitizeText(body?.attackId, 80);
  const batch = attacker.meleeBatch;
  const sameSwing = Boolean(attackId && batch?.id === attackId && now - batch.startedAt < 2000);
  if (sameSwing && (batch.targets.has(targetId) || batch.targets.size >= 5)) return { ok: false, message: 'Already struck by this swing.' };
  const minimumInterval = [attacker.leftHandType, attacker.rightHandType].includes('Dagger') ? 90 : 180;
  if (!sameSwing && (now - attacker.lastSuccessfulPvpAttackAt < minimumInterval || attacker.recentSwingIds?.includes(attackId) && attackId)) {
    return { ok: false, message: "Attack is recovering." };
  }

  const range = clampNumber(body?.range, 0.5, maxAttackRange);
  let damage = Math.round(clampNumber(body?.damage, 1, 80));
  let knockback = clampNumber(body?.knockback, 0, 30);
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

  const shieldType = target.guardHand === 'left' ? target.leftHandType : target.guardHand === 'right' ? target.rightHandType : null;
  const block = resolveShieldBlock({ type: shieldType, raised: Boolean(target.guardHand) && now - target.lastSeen < 750,
    stamina: target.guardStamina ?? 100, age: (now - (target.guardRaisedAt ?? 0)) / 1000,
    facing: { x: Math.sin(target.rotation), z: Math.cos(target.rotation) }, position: target.position, source: origin, damage, knockback });
  if (block.blocked) {
    damage = block.damage; knockback = block.knockback; target.guardStamina = block.stamina; target.lastBlockedAt = now;
    if (block.broken) { target.guardBrokenUntil = now + 1400; target.guardHand = null; }
  }
  attacker.guardHand = null;
  if (attackId) {
    if (!sameSwing) {
      attacker.meleeBatch = { id: attackId, startedAt: now, targets: new Set() };
      attacker.recentSwingIds = [...(attacker.recentSwingIds ?? []), attackId].slice(-32);
    }
    attacker.meleeBatch.targets.add(targetId);
  }
  target.hp = Math.max(0, target.hp - damage);
  if (knockback > 0 && knockbackDirection) {
    target.position = clampWorldPosition({ x: target.position.x + knockbackDirection.x * knockback, z: target.position.z + knockbackDirection.z * knockback });
  }
  target.lastDamagedAt = now;
  target.lastDamagedBy = attacker.id;
  target.lastDamagedByName = source === "outpost" && sourceName ? sourceName : attacker.name;
  target.lastDamageSource = source;
  attacker.lastAttackAt = now;
  attacker.lastSuccessfulPvpAttackAt = now;

  if (target.hp <= 0) {
    target.dead = true;
    queueResourceDeath(target.id, target);
    target.respawnAt = now + respawnDelayMs;
  }

  return {
    ok: true,
    damage,
    knockback,
    blocked: block.blocked,
    parried: block.parried,
    defeated: target.dead,
    attacker: serializePlayer(attacker),
    target: serializePlayer(target),
    message: block.blocked && damage === 0 ? `${target.name} perfectly blocked the attack.` : target.dead
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
    connectionId: sanitizeText(body.connectionId, 80),
    inputSequence: clampNumber(body.inputSequence, 1, Number.MAX_SAFE_INTEGER),
    name: sanitizeText(body.name, 32) || "Player",
    houseName: sanitizeHouseName(body.houseName),
    firstName: sanitizeText(body.firstName, 24),
    lifeNumber: clampNumber(body.lifeNumber, 0, Number.MAX_SAFE_INTEGER),
    renown: clampNumber(body.renown, 0, Number.MAX_SAFE_INTEGER),
    factionId: sanitizeText(body.factionId, 40) || null,
    position: sanitizePosition(body.position),
    elevation: clampNumber(body.elevation, -20, 400),
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
    combatAttacks: Array.isArray(body.combatAttacks) ? body.combatAttacks.filter(a => a && ['left','right'].includes(a.hand)).slice(0,2).map(a => ({
      hand: a.hand, id: sanitizeText(a.id,80), itemType: sanitizeText(a.itemType,40), comboStep: clampNumber(a.comboStep,0,2),
      charging: a.itemType === "Flail" && a.charging === true, chargePower: clampNumber(a.chargePower ?? 0,0,1), flailReleaseAngle: clampNumber(a.flailReleaseAngle ?? 0,-Math.PI*2,Math.PI*2),
      elapsed: clampNumber(a.elapsed,0,100), duration: clampNumber(a.duration,.1,5), direction: normalizeDirection(a.direction)
    })) : [],
    guardHand: ["left", "right"].includes(body.guardHand) ? body.guardHand : null,
    guardStamina: body.guardStamina == null ? 100 : clampNumber(body.guardStamina, 0, 100),
    carriedInventory: Array.isArray(body.carriedInventory) ? body.carriedInventory.filter(item => item && typeof item.id === "string").slice(0, 250) : null,
    deathLocation: body.dead && body.deathLocation && Number.isFinite(body.deathLocation.position?.x) && Number.isFinite(body.deathLocation.position?.z) ? body.deathLocation : null,
    armorItems: sanitizeArmorItems(body.armorItems),
    hp: Number.isFinite(Number(body.hp)) ? clampNumber(body.hp, 0, playerMaxHealth) : null,
    maxHp: playerMaxHealth,
    dead: Boolean(body.dead),
    respawnAt: clampNumber(body.respawnAt, 0, Number.MAX_SAFE_INTEGER)
  };
}

function sanitizePosition(position) {
  return clampWorldPosition(position, 24);
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
    inputSequence: player.lastInputSequence ?? 0,
    name: player.name,
    houseName: player.houseName ?? "",
    firstName: player.firstName ?? "",
    lifeNumber: player.lifeNumber ?? 0,
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
    combatAttacks: player.combatAttacks ?? [],
    guardHand: player.guardHand ?? null,
    guardStamina: player.guardStamina ?? 100,
    lastBlockedAt: player.lastBlockedAt ?? 0,
    guardBrokenUntil: player.guardBrokenUntil ?? 0,
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

function sanitizeHouseName(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 18);
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
  console.log(`Fate of Kingdoms 3D running at http://127.0.0.1:${port}/`);

  for (const address of getLanAddresses()) {
    console.log(`Fate of Kingdoms 3D also available at http://${address}:${port}/`);
  }

  const publicAddress = await getPublicAddress();

  if (publicAddress) {
    console.log(`Fate of Kingdoms 3D also available at http://${publicAddress}:${port}/`);
  }
});

async function handleCheatRequest(request, response, requestUrl) {
  const body = request.method === 'POST' ? await readJsonBody(request) : {};
  const playerId = auth.playerId(request, body.playerId);
  const sessionKey = request.headers.cookie;
  if (requestUrl.pathname === '/api/world/cheats/unlock' && request.method === 'POST') {
    if (body.password !== 'imacheater') { writeJson(response, 403, { ok: false, message: 'Incorrect password.' }); return; }
    cheatSessions.add(sessionKey);
    writeJson(response, 200, { ok: true }); return;
  }
  if (!cheatSessions.has(sessionKey)) { writeJson(response, 403, { ok: false, message: 'Unlock cheats first.' }); return; }
  const saved = await loadPersistentState(playerId);
  const pool = await getDbPool();
  const records = structuredClone(pool ? (await pool.query('SELECT state FROM kok_player_state')).rows.map(r => r.state) : [...memoryPersistence.players.values()]);
  const catalog = cheatCatalog(saved.world, records);
  if (request.method === 'GET') { writeJson(response, 200, { ok: true, catalog }); return; }
  const command = parseCheat(body.command, catalog);
  if (command.verb === 'spawn' && command.kind === 'mob') {
    writeJson(response, 200, { ok: true, mob: command.target, message: 'Mob spawned.' }); return;
  }
  const world = structuredClone(saved.world);
  executeCheat(command, world, records, playerId);
  world.cheatRevision = (world.cheatRevision || 0) + 1;
  if (pool) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('UPDATE kok_world_state SET state=$1::jsonb, updated_at=now() WHERE id=$2', [JSON.stringify(world), 'primary']);
      for (const record of records) await client.query('UPDATE kok_player_state SET state=$1::jsonb, updated_at=now() WHERE player_id=$2', [JSON.stringify(record), record.player.id]);
      await client.query('COMMIT');
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  } else {
    memoryPersistence.world = world;
    memoryPersistence.players = new Map(records.map(p => [p.player.id, p]));
    flushLocalSave();
  }
  if (command.verb === 'reset' && command.kind === 'all') players.clear();
  for (const record of records) {
    const live = players.get(record.player.id);
    if (live) { live.factionId = record.selectedFactionId; live.name = record.player.name; live.hp = record.player.hp ?? live.hp; live.dead = Boolean(record.player.dead); }
  }
  writeJson(response, 200, { ...await loadPersistentState(playerId), message: 'Command completed.', snapshotSequence: ++worldSnapshotSequence });
}
