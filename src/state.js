import {
  ARMOR_STATS,
  BUILDING_LOOKUP,
  EVENT_TEMPLATES,
  FACTIONS,
  FACTION_LOOKUP,
  ITEM_DEFINITIONS,
  POIS,
  RESOURCE_LOOKUP,
  RESOURCE_TYPES,
  WEAPON_STATS
} from "./game-data.js";
import { canPay, createMarket, formatCost, payCost } from "./economy.js";
import { createId } from "./ids.js";

const EVENT_LOCATIONS = [
  { x: -8, z: -18 },
  { x: 62, z: 38 },
  { x: -68, z: 58 },
  { x: 74, z: -42 },
  { x: -36, z: -86 }
];
const HISTORY_VOLUME_RECORD_THRESHOLD = 6;
const HISTORY_PRECEDING_VOLUME_COUNT = 3;
const HISTORY_RENOWN_PER_MENTION = 8;
const LORE_SCHEMA_VERSION = 2;
const LORE_RECORDED_EVENT_TYPES = new Set(["player_killed", "poi_claimed", "ruler_claimed", "ruler_killed"]);
const FIRST_NAMES = [
  "Alden",
  "Bran",
  "Cedric",
  "Daria",
  "Elian",
  "Faye",
  "Garrick",
  "Helena",
  "Ivor",
  "Jessa",
  "Kael",
  "Lysa",
  "Merek",
  "Nora",
  "Oren",
  "Petra",
  "Quinn",
  "Rowan",
  "Sera",
  "Ted",
  "Vela",
  "Wynn"
];
const POI_WORKER_DELIVERY_AMOUNT = 20;
const COURIER_RESOURCE_IDS = ["gold", ...RESOURCE_TYPES.map((resource) => resource.id)];
const POI_WORKER_NAMES = {
  gold: "Factor",
  iron: "Miner",
  stone: "Mason",
  wheat: "Farmer",
  wood: "Lumberjack"
};

export function createGameState() {
  const resources = Object.fromEntries(RESOURCE_TYPES.map((resource) => [resource.id, 0]));
  const factionMembers = Object.fromEntries(FACTIONS.map((faction) => [faction.id, []]));
  const factionGovernance = Object.fromEntries(
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
  );
  const factionResources = Object.fromEntries(
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
  );

  return {
    elapsed: 0,
    selectedFactionId: null,
    market: createMarket(),
    player: {
      id: "local-player",
      name: "You",
      gold: 260,
      renown: 0,
      position: { x: 0, z: 0 },
      velocity: { x: 0, z: 0 },
      selectedGearItemId: null,
      equipment: {
        headItemId: null,
        chestItemId: null,
        glovesItemId: null,
        backItemId: null,
        legsItemId: null,
        feetItemId: null,
        leftHandItemId: null,
        rightHandItemId: null,
        lastLeftAttackAt: -999,
        lastRightAttackAt: -999
      },
      hotbar: [null, null, null, null, null],
      resources: {
        ...resources,
        wood: 70,
        stone: 45,
        wheat: 30,
        iron: 12
      },
      inventory: [],
      houseName: "",
      firstName: "",
      lifeNumber: 0,
      historyRenownClaimed: 0,
      historyRenownVersion: LORE_SCHEMA_VERSION
    },
    factionMembers,
    factionGovernance,
    factionResources,
    pois: POIS.map((poi) => ({ ...poi, ownerFactionId: null, pulse: 0 })),
    structures: [],
    couriers: [],
    activeEvent: null,
    lore: createDefaultLoreState(),
    log: []
  };
}

export function createDefaultLoreState() {
  const opening = createOpeningLoreText();
  return {
    version: LORE_SCHEMA_VERSION,
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

function createInventoryItem(definition) {
  const weaponStats = WEAPON_STATS[definition.type];
  const armorStats = ARMOR_STATS[definition.type];

  return {
    id: createId("item"),
    name: definition.name,
    type: definition.type,
    category: definition.category,
    rarity: definition.rarity,
    weapon: weaponStats ? { ...weaponStats } : null,
    armor: armorStats ? { ...armorStats, material: "Leather" } : null,
    durability: definition.maxDurability,
    maxDurability: definition.maxDurability
  };
}

export function joinFaction(state, factionId, options = {}) {
  const faction = FACTION_LOOKUP[factionId];
  const houseName = sanitizeHouseName(options.houseName ?? state.player.houseName);

  if (!faction) {
    return { ok: false, message: "Choose a valid faction." };
  }

  if (!houseName) {
    return { ok: false, message: "Choose a house name." };
  }

  setPlayerHouseName(state, houseName);
  if (!state.player.firstName) {
    beginNewPlayerLife(state);
  } else {
    updatePlayerLineageName(state);
  }

  state.selectedFactionId = factionId;
  const members = state.factionMembers[factionId];

  if (!members.some((member) => member.playerId === state.player.id)) {
    members.push({
      playerId: state.player.id,
      name: state.player.name,
      houseName: state.player.houseName,
      renown: state.player.renown,
      joinedAt: state.elapsed
    });
  } else {
    syncFactionMemberRecord(state);
  }

  state.player.position.x = faction.position.x;
  state.player.position.z = faction.position.z + faction.safeRadius * 0.55;
  state.player.renown += 5;
  addLog(state, `You joined ${faction.name}.`);
  return { ok: true, message: `You joined ${faction.name}.` };
}

export function getFactionMembers(state, factionId) {
  return (state.factionMembers[factionId] ?? []).map((member) => ({
    ...member,
    name: member.playerId === state.player.id ? state.player.name : member.name,
    houseName: member.playerId === state.player.id ? state.player.houseName : member.houseName,
    renown: member.playerId === state.player.id ? state.player.renown : member.renown
  }));
}

export function isFactionRuler(state, factionId, playerId = state.player.id) {
  return state.factionGovernance[factionId]?.rulerPlayerId === playerId;
}

export function getFactionRulerName(state, factionId) {
  const rulerPlayerId = state.factionGovernance[factionId]?.rulerPlayerId;

  if (!rulerPlayerId) {
    return null;
  }

  return getFactionMembers(state, factionId).find((member) => member.playerId === rulerPlayerId)?.name ?? "Unknown Ruler";
}

export function claimFactionRulerSeat(state, factionId) {
  if (state.selectedFactionId !== factionId) {
    return { ok: false, message: "You can only rule the faction you belong to." };
  }

  const governance = state.factionGovernance[factionId];

  if (!governance) {
    return { ok: false, message: "That faction has no council record." };
  }

  if (governance.rulerPlayerId && governance.rulerPlayerId !== state.player.id) {
    return { ok: false, message: `${getFactionRulerName(state, factionId)} already holds this throne.` };
  }

  if (governance.rulerPlayerId === state.player.id) {
    return { ok: true, alreadyRuler: true, message: "You already hold this throne." };
  }

  governance.rulerPlayerId = state.player.id;
  state.player.renown += 25;
  addLog(state, `You became ruler of ${FACTION_LOOKUP[factionId].name}.`);
  syncFactionMemberRecord(state);
  recordLoreEvent(state, {
    type: "ruler_claimed",
    factionId,
    actor: createPlayerLoreActor(state),
    summary: `${FACTION_LOOKUP[factionId].name}'s ${state.player.name} became ruler.`,
    details: {
      factionName: FACTION_LOOKUP[factionId].name,
      title: "Ruler"
    },
    weight: 4
  });
  return { ok: true, becameRuler: true, message: `You are now ruler of ${FACTION_LOOKUP[factionId].name}.` };
}

export function setFactionRelation(state, sourceFactionId, targetFactionId, status) {
  if (!isFactionRuler(state, sourceFactionId)) {
    return { ok: false, message: "Only the ruler can change faction politics." };
  }

  if (sourceFactionId === targetFactionId || !state.factionGovernance[targetFactionId]) {
    return { ok: false, message: "Choose another faction." };
  }

  if (status !== "Enemy" && status !== "Neutral") {
    return { ok: false, message: "Use an allegiance request to create an alliance." };
  }

  state.factionGovernance[sourceFactionId].relationStatus[targetFactionId] = status;
  state.factionGovernance[targetFactionId].relationStatus[sourceFactionId] = status;
  clearAllianceRequestBetween(state, sourceFactionId, targetFactionId);
  addLog(state, `${FACTION_LOOKUP[sourceFactionId].name} set ${FACTION_LOOKUP[targetFactionId].name} to ${status}.`);
  return { ok: true, message: `${FACTION_LOOKUP[targetFactionId].name} is now ${status}.` };
}

export function requestFactionAllegiance(state, sourceFactionId, targetFactionId) {
  if (!isFactionRuler(state, sourceFactionId)) {
    return { ok: false, message: "Only the ruler can request allegiance." };
  }

  const targetGovernance = state.factionGovernance[targetFactionId];

  if (sourceFactionId === targetFactionId || !targetGovernance) {
    return { ok: false, message: "Choose another faction." };
  }

  if (state.factionGovernance[sourceFactionId].relationStatus[targetFactionId] === "Ally") {
    return { ok: false, message: "These factions are already allies." };
  }

  if (!targetGovernance.allianceRequests.includes(sourceFactionId)) {
    targetGovernance.allianceRequests.push(sourceFactionId);
  }

  addLog(state, `${FACTION_LOOKUP[sourceFactionId].name} requested allegiance with ${FACTION_LOOKUP[targetFactionId].name}.`);
  return { ok: true, message: "Allegiance requested." };
}

export function acceptFactionAllegiance(state, sourceFactionId, requesterFactionId) {
  if (!isFactionRuler(state, sourceFactionId)) {
    return { ok: false, message: "Only the ruler can accept allegiance." };
  }

  const governance = state.factionGovernance[sourceFactionId];

  if (!governance?.allianceRequests.includes(requesterFactionId)) {
    return { ok: false, message: "No allegiance request from that faction." };
  }

  governance.relationStatus[requesterFactionId] = "Ally";
  state.factionGovernance[requesterFactionId].relationStatus[sourceFactionId] = "Ally";
  governance.allianceRequests = governance.allianceRequests.filter((id) => id !== requesterFactionId);
  addLog(state, `${FACTION_LOOKUP[sourceFactionId].name} allied with ${FACTION_LOOKUP[requesterFactionId].name}.`);
  return { ok: true, message: "Allegiance accepted." };
}

function clearAllianceRequestBetween(state, factionA, factionB) {
  state.factionGovernance[factionA].allianceRequests = state.factionGovernance[factionA].allianceRequests.filter(
    (id) => id !== factionB
  );
  state.factionGovernance[factionB].allianceRequests = state.factionGovernance[factionB].allianceRequests.filter(
    (id) => id !== factionA
  );
}

export function getZone(state) {
  if (!state.selectedFactionId) {
    return { id: "unbound", label: "Unsworn", safe: false };
  }

  const faction = FACTION_LOOKUP[state.selectedFactionId];
  const distance = distance2D(state.player.position, faction.position);

  if (distance <= faction.safeRadius) {
    return { id: "safe", label: "Faction Hub", safe: true };
  }

  if (distance <= faction.bufferRadius) {
    return { id: "buffer", label: "Hub Buffer", safe: true };
  }

  return { id: "wild", label: "Wildlands", safe: false };
}

export function getNearestPoi(state) {
  const sorted = state.pois
    .map((poi) => ({
      poi,
      distance: distance2D(state.player.position, poi.position)
    }))
    .sort((a, b) => a.distance - b.distance);

  return sorted[0] ?? null;
}

export function claimNearestPoi(state) {
  if (!state.selectedFactionId) {
    return { ok: false, message: "Choose a faction before claiming territory." };
  }

  const nearest = getNearestPoi(state);

  if (!nearest || nearest.distance > nearest.poi.radius + 7) {
    return { ok: false, message: "Move closer to a point of interest." };
  }

  return claimPoi(state, nearest.poi.id);
}

export function claimPoi(state, poiId) {
  if (!state.selectedFactionId) {
    return { ok: false, message: "Choose a faction before claiming territory." };
  }

  const poi = state.pois.find((entry) => entry.id === poiId);

  if (!poi) {
    return { ok: false, message: "That point of interest is no longer available." };
  }

  if (poi.ownerFactionId === state.selectedFactionId) {
    return { ok: false, message: `${poi.name} already flies your banner.` };
  }

  state.couriers = state.couriers.filter((courier) => !isPoiWorker(courier) || courier.fromPoiId !== poi.id);
  poi.ownerFactionId = state.selectedFactionId;
  poi.pulse = 1;
  poi.workerRespawnAt = 0;
  state.player.renown += 18;
  damageEquippedItem(state, 2);
  addLog(state, `${poi.name} was claimed for ${FACTION_LOOKUP[state.selectedFactionId].name}.`);
  recordLoreEvent(state, {
    type: "poi_claimed",
    factionId: state.selectedFactionId,
    actor: createPlayerLoreActor(state),
    summary: `${FACTION_LOOKUP[state.selectedFactionId].name}'s ${state.player.name} claimed ${poi.name}.`,
    details: {
      factionName: FACTION_LOOKUP[state.selectedFactionId].name,
      poiName: poi.name,
      poiType: poi.type
    },
    weight: 2
  });

  return { ok: true, message: `${poi.name} claimed.` };
}

export function tickFactionIncome(state, deltaSeconds, options = {}) {
  const awardPlayerDividend = options.playerDividend !== false;

  for (const poi of state.pois) {
    if (!poi.ownerFactionId) {
      continue;
    }

    poi.pulse += deltaSeconds;

    if (poi.pulse < 5) {
      continue;
    }

    poi.pulse = 0;

    if (awardPlayerDividend && poi.resourceId !== "gold" && poi.ownerFactionId === state.selectedFactionId) {
      state.player.resources[poi.resourceId] += 1;
    }
  }
}

export function buildStructure(state, type, options = {}) {
  if (!state.selectedFactionId) {
    return { ok: false, message: "Choose a faction before building." };
  }

  const definition = BUILDING_LOOKUP[type];
  const cost = definition?.cost;

  if (!definition || !cost) {
    return { ok: false, message: "Choose a valid building." };
  }

  if (!canPay(state.player.resources, cost)) {
    return { ok: false, message: `Need ${formatCost(cost)}.` };
  }

  const hub = FACTION_LOOKUP[state.selectedFactionId].position;

  const buildPosition = normalizeBuildPosition(options.position, state.player.position);

  if (distance2D(buildPosition, hub) < 30) {
    return { ok: false, message: "Build beyond the inner hub perimeter." };
  }

  payCost(state.player.resources, cost);

  const structure = {
    id: createId("structure"),
    type,
    ownerFactionId: state.selectedFactionId,
    position: {
      x: buildPosition.x,
      z: buildPosition.z
    },
    rotation: normalizeRotation(options.rotation),
    hp: definition.maxHp,
    maxHp: definition.maxHp,
    storage: { wood: 0, stone: 0, wheat: 0, iron: 0 },
    storedItems: [],
    visible: type === "outpost"
  };

  state.structures.push(structure);
  if (type === "depot") {
    state.couriers.push(createDepotCamel(state, structure));
  }

  state.player.renown += definition.renown;
  addLog(state, `${definition.name} raised in the wildlands.`);

  return { ok: true, structure };
}

function normalizeBuildPosition(position, fallback) {
  const hasPosition = position && Number.isFinite(Number(position.x)) && Number.isFinite(Number(position.z));

  if (!hasPosition) {
    return {
      x: fallback.x + randomBetween(-3, 3),
      z: fallback.z + randomBetween(-3, 3)
    };
  }

  return {
    x: Math.max(-248, Math.min(248, Number(position.x))),
    z: Math.max(-248, Math.min(248, Number(position.z)))
  };
}

function normalizeRotation(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.atan2(Math.sin(number), Math.cos(number));
}

export function depositAtNearestDepot(state) {
  const depot = getNearestOwnedDepot(state);

  if (!depot) {
    return { ok: false, message: "No friendly depot close enough." };
  }

  const payload = {};
  let total = 0;

  for (const resource of RESOURCE_TYPES) {
    const amount = Math.floor(state.player.resources[resource.id] * 0.45);
    if (amount > 0) {
      payload[resource.id] = amount;
      state.player.resources[resource.id] -= amount;
      depot.storage[resource.id] += amount;
      total += amount;
    }
  }

  if (!total) {
    return { ok: false, message: "Your satchel is empty." };
  }

  state.player.renown += 6;
  addLog(state, `Stored ${total} resources at the depot.`);

  ensureDepotCouriers(state);
  return { ok: true, message: "Resources stored at depot." };
}

export function depositToFaction(state, resourceId, quantity = 1) {
  if (!state.selectedFactionId) {
    return { ok: false, message: "Choose a faction before depositing." };
  }

  const amount = Math.max(1, Math.floor(Number(quantity) || 1));
  const factionStore = state.factionResources[state.selectedFactionId];

  if (!factionStore) {
    return { ok: false, message: "Faction store unavailable." };
  }

  if (resourceId === "gold") {
    if (state.player.gold < amount) {
      return { ok: false, message: "Not enough gold in your purse." };
    }

    state.player.gold -= amount;
    factionStore.gold = (factionStore.gold ?? 0) + amount;
    addLog(state, `Deposited ${amount} gold into ${FACTION_LOOKUP[state.selectedFactionId].name}.`);
    return { ok: true, message: `Deposited ${amount} gold.` };
  }

  const resource = RESOURCE_LOOKUP[resourceId];

  if (!resource || state.player.resources[resourceId] < amount) {
    return { ok: false, message: "Not enough stock in your satchel." };
  }

  state.player.resources[resourceId] -= amount;
  factionStore.resources[resourceId] = (factionStore.resources[resourceId] ?? 0) + amount;
  addLog(state, `Deposited ${amount} ${resource.name} into ${FACTION_LOOKUP[state.selectedFactionId].name}.`);

  return { ok: true, message: `Deposited ${amount} ${resource.name}.` };
}

export function tickCouriers(state, deltaSeconds) {
  ensureDepotCouriers(state);
  ensurePoiWorkers(state);
  const delivered = [];
  const expired = new Set();

  for (const courier of state.couriers) {
    if (isDepotCamel(courier)) {
      tickDepotCamel(state, courier, deltaSeconds);

      if ((courier.hp ?? 1) <= 0) {
        expired.add(courier.id);
      }

      continue;
    }

    if (isPoiWorker(courier)) {
      tickPoiWorker(state, courier, deltaSeconds);

      if ((courier.hp ?? 1) <= 0) {
        expired.add(courier.id);
      }

      continue;
    }

    courier.progress += deltaSeconds / Math.max(1, courier.duration);

    if (courier.progress >= 1) {
      delivered.push(courier);
    }
  }

  for (const courier of delivered) {
    const factionStore = state.factionResources[courier.ownerFactionId];
    for (const [resourceId, amount] of Object.entries(courier.payload)) {
      factionStore.resources[resourceId] += amount;
    }

    const depot = state.structures.find((structure) => structure.id === courier.fromStructureId);
    if (depot) {
      for (const [resourceId, amount] of Object.entries(courier.payload)) {
        depot.storage[resourceId] = Math.max(0, depot.storage[resourceId] - amount);
      }
    }

    state.player.renown += 10;
    addLog(state, `Courier reached the hub for ${FACTION_LOOKUP[courier.ownerFactionId].name}.`);
  }

  state.couriers = state.couriers.filter((courier) => {
    if (expired.has(courier.id)) {
      return false;
    }

    return isDepotCamel(courier) || isPoiWorker(courier) || courier.progress < 1;
  });
}

export function ensureDepotCouriers(state) {
  for (const depot of state.structures) {
    if (depot.type !== "depot" || depot.hp <= 0) {
      continue;
    }

    const hasCamel = state.couriers.some(
      (courier) => isDepotCamel(courier) && courier.fromStructureId === depot.id && (courier.hp ?? 1) > 0
    );

    if (!hasCamel && (depot.camelRespawnAt ?? 0) <= state.elapsed) {
      state.couriers.push(createDepotCamel(state, depot));
    }
  }
}

function tickDepotCamel(state, courier, deltaSeconds) {
  const depot = state.structures.find((structure) => structure.id === courier.fromStructureId);
  const faction = FACTION_LOOKUP[courier.ownerFactionId];

  if (!depot || depot.hp <= 0 || !faction) {
    courier.hp = 0;
    return;
  }

  courier.direction = courier.direction === "toDepot" ? "toDepot" : "toHub";
  courier.progress = Math.max(0, Math.min(1, Number(courier.progress) || 0));
  courier.payload = normalizeCourierPayload(courier.payload);
  courier.position = courier.position ?? { ...depot.position };
  courier.target = courier.direction === "toHub" ? { ...faction.position } : { ...depot.position };
  courier.duration = Math.max(5, distance2D(depot.position, faction.position) / 12);
  courier.hp = Number.isFinite(Number(courier.hp)) ? courier.hp : 65;
  courier.maxHp = Number.isFinite(Number(courier.maxHp)) ? courier.maxHp : 65;

  courier.progress += deltaSeconds / courier.duration;

  if (courier.progress < 1) {
    return;
  }

  if (courier.direction === "toHub") {
    deliverCourierPayload(state, courier);
    courier.direction = "toDepot";
    courier.position = { ...faction.position };
    courier.target = { ...depot.position };
  } else {
    loadDepotCamel(courier, depot);
    courier.direction = "toHub";
    courier.position = { ...depot.position };
    courier.target = { ...faction.position };
  }

  courier.progress = 0;
}

function createDepotCamel(state, depot) {
  const faction = FACTION_LOOKUP[depot.ownerFactionId];
  const courier = {
    id: createId("courier"),
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

  loadDepotCamel(courier, depot);
  depot.camelRespawnAt = 0;
  return courier;
}

function loadDepotCamel(courier, depot) {
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

function deliverCourierPayload(state, courier) {
  const factionStore = state.factionResources[courier.ownerFactionId];

  if (!factionStore) {
    return;
  }

  let total = 0;

  for (const [resourceId, amount] of Object.entries(normalizeCourierPayload(courier.payload))) {
    if (resourceId === "gold") {
      factionStore.gold = (factionStore.gold ?? 0) + amount;
      total += amount;
    } else if (factionStore.resources[resourceId] !== undefined) {
      factionStore.resources[resourceId] = (factionStore.resources[resourceId] ?? 0) + amount;
      total += amount;
    }
  }

  courier.payload = {};
  if (Array.isArray(courier.items) && courier.items.length) {
    factionStore.items = Array.isArray(factionStore.items) ? factionStore.items : [];
    factionStore.items.push(...courier.items);
  }

  courier.items = [];

  if (total > 0) {
    addLog(state, `Depot camel delivered ${total} resources to ${FACTION_LOOKUP[courier.ownerFactionId].name}.`);
  }
}

function normalizeCourierPayload(payload) {
  return Object.fromEntries(
    COURIER_RESOURCE_IDS.map((resourceId) => [resourceId, Math.max(0, Math.floor(Number(payload?.[resourceId]) || 0))])
  );
}

function isDepotCamel(courier) {
  return courier.kind === "depotCamel" || (!courier.kind && Boolean(courier.direction));
}

export function ensurePoiWorkers(state) {
  const ownedPoiIds = new Set();

  for (const poi of state.pois) {
    if (!poi.ownerFactionId || !FACTION_LOOKUP[poi.ownerFactionId]) {
      continue;
    }

    ownedPoiIds.add(poi.id);
    const hasWorker = state.couriers.some(
      (courier) =>
        isPoiWorker(courier) &&
        courier.fromPoiId === poi.id &&
        courier.ownerFactionId === poi.ownerFactionId &&
        (courier.hp ?? 1) > 0
    );

    if (!hasWorker && (poi.workerRespawnAt ?? 0) <= state.elapsed) {
      state.couriers.push(createPoiWorker(state, poi));
    }
  }

  state.couriers = state.couriers.filter((courier) => {
    if (!isPoiWorker(courier)) {
      return true;
    }

    const poi = state.pois.find((entry) => entry.id === courier.fromPoiId);
    return ownedPoiIds.has(courier.fromPoiId) && poi?.ownerFactionId === courier.ownerFactionId;
  });
}

function tickPoiWorker(state, courier, deltaSeconds) {
  const poi = state.pois.find((entry) => entry.id === courier.fromPoiId);
  const faction = FACTION_LOOKUP[courier.ownerFactionId];

  if (!poi || poi.ownerFactionId !== courier.ownerFactionId || !faction) {
    courier.hp = 0;
    return;
  }

  courier.direction = courier.direction === "toPoi" ? "toPoi" : "toHub";
  courier.payload = normalizeCourierPayload(courier.payload);
  courier.position = courier.position ?? { ...poi.position };
  courier.target = courier.direction === "toHub" ? { ...faction.position } : { ...poi.position };
  courier.duration = Math.max(6, distance2D(poi.position, faction.position) / 10);
  courier.hp = Number.isFinite(Number(courier.hp)) ? courier.hp : 55;
  courier.maxHp = Number.isFinite(Number(courier.maxHp)) ? courier.maxHp : 55;

  courier.progress += deltaSeconds / courier.duration;

  if (courier.progress < 1) {
    return;
  }

  if (courier.direction === "toHub") {
    deliverCourierPayload(state, courier);
    courier.direction = "toPoi";
    courier.position = { ...faction.position };
    courier.target = { ...poi.position };
  } else {
    loadPoiWorker(courier, poi);
    courier.direction = "toHub";
    courier.position = { ...poi.position };
    courier.target = { ...faction.position };
  }

  courier.progress = 0;
}

function createPoiWorker(state, poi) {
  const faction = FACTION_LOOKUP[poi.ownerFactionId];
  const courier = {
    id: createId("poi-worker"),
    kind: "poiWorker",
    fromPoiId: poi.id,
    ownerFactionId: poi.ownerFactionId,
    workerName: getPoiWorkerName(poi),
    resourceId: poi.resourceId,
    amount: POI_WORKER_DELIVERY_AMOUNT,
    position: { ...poi.position },
    target: faction ? { ...faction.position } : { ...poi.position },
    direction: "toHub",
    payload: {},
    progress: 0,
    duration: faction ? Math.max(6, distance2D(poi.position, faction.position) / 10) : 6,
    hp: 55,
    maxHp: 55
  };

  loadPoiWorker(courier, poi);
  poi.workerRespawnAt = 0;
  return courier;
}

function loadPoiWorker(courier, poi) {
  courier.resourceId = poi.resourceId;
  courier.amount = POI_WORKER_DELIVERY_AMOUNT;
  courier.payload = {
    [poi.resourceId]: POI_WORKER_DELIVERY_AMOUNT
  };
}

function getPoiWorkerName(poi) {
  return POI_WORKER_NAMES[poi.resourceId] ?? "Worker";
}

function isPoiWorker(courier) {
  return courier.kind === "poiWorker";
}

export function spawnDynamicEvent(state) {
  const template = randomItem(EVENT_TEMPLATES);
  const location = randomItem(EVENT_LOCATIONS);
  const suffix = randomItem(["the Low Star", "the Old Road", "Black Ash", "Saint Elowen"]);
  const reward = {};

  for (const resourceId of template.rewardResources) {
    reward[resourceId] = resourceId === "gold" ? randomBetweenInt(70, 140) : randomBetweenInt(10, 26);
  }

  state.activeEvent = {
    id: createId("event"),
    templateId: template.id,
    name: `${template.name}: ${suffix}`,
    position: {
      x: location.x + randomBetween(-8, 8),
      z: location.z + randomBetween(-8, 8)
    },
    reward,
    item: createLootItem(template),
    timer: 55,
    danger: template.danger
  };

  addLog(state, `${state.activeEvent.name} appeared in the wildlands.`);
  return state.activeEvent;
}

export function tickEvent(state, deltaSeconds) {
  if (!state.activeEvent) {
    return;
  }

  state.activeEvent.timer -= deltaSeconds;

  if (state.activeEvent.timer <= 0) {
    addLog(state, `${state.activeEvent.name} faded before it was secured.`);
    state.activeEvent = null;
  }
}

export function resolveDynamicEvent(state) {
  if (!state.selectedFactionId) {
    return { ok: false, message: "Choose a faction before contesting events." };
  }

  const event = state.activeEvent;

  if (!event) {
    return { ok: false, message: "No active event in the wildlands." };
  }

  if (distance2D(state.player.position, event.position) > 16) {
    return { ok: false, message: "Move closer to the event marker." };
  }

  for (const [resourceId, amount] of Object.entries(event.reward)) {
    if (resourceId === "gold") {
      state.player.gold += amount;
    } else {
      state.player.resources[resourceId] += amount;
    }
  }

  state.player.inventory.push(event.item);
  state.player.renown += 20 + event.danger * 8;
  damageEquippedItem(state, 5 + event.danger);
  addLog(state, `${event.item.name} recovered from ${event.name}.`);
  state.activeEvent = null;

  return { ok: true, message: `Recovered ${event.item.name}.` };
}

export function simulateRaid(state) {
  const vulnerable = state.structures.filter((structure) => structure.hp > 0);

  if (!vulnerable.length) {
    return { ok: false, message: "No buildings are exposed." };
  }

  const target = randomItem(vulnerable);
  const damage = randomBetweenInt(18, 45);
  target.hp = Math.max(0, target.hp - damage);
  damageEquippedItem(state, 3);

  if (target.hp === 0) {
    addLog(state, `${capitalize(target.type)} destroyed by a raiding party.`);
    return { ok: true, message: `${capitalize(target.type)} destroyed.` };
  }

  addLog(state, `${capitalize(target.type)} took ${damage} raid damage.`);
  return { ok: true, message: `${capitalize(target.type)} took ${damage} damage.` };
}

export function repairGearAtHub(state) {
  const zone = getZone(state);

  if (!zone.safe) {
    return { ok: false, message: "Repairs require faction hub safety." };
  }

  const worn = state.player.inventory.filter((item) => item.durability < item.maxDurability);
  const cost = worn.reduce((sum, item) => sum + Math.ceil((item.maxDurability - item.durability) * 0.7), 0);

  if (!worn.length) {
    return { ok: false, message: "Your gear is already sound." };
  }

  if (state.player.gold < cost) {
    return { ok: false, message: `Repairs need ${cost} gold.` };
  }

  state.player.gold -= cost;
  for (const item of worn) {
    item.durability = item.maxDurability;
  }

  addLog(state, `Gear repaired for ${cost} gold.`);
  return { ok: true, message: "Gear repaired." };
}

export function equipItem(state, itemId, hand) {
  const item = state.player.inventory.find((entry) => entry.id === itemId);
  const slot = hand === "left" ? "leftHandItemId" : "rightHandItemId";
  const otherSlot = hand === "left" ? "rightHandItemId" : "leftHandItemId";

  if (!item) {
    return { ok: false, message: "That item is no longer in your gear." };
  }

  if (item.durability <= 0) {
    return { ok: false, message: `${item.name} is broken and cannot be equipped.` };
  }

  if (state.player.equipment[otherSlot] === item.id) {
    state.player.equipment[otherSlot] = null;
  }

  state.player.equipment[slot] = item.id;

  return {
    ok: true,
    message: `${item.name} equipped in your ${hand} hand.`
  };
}

export function unequipHand(state, hand) {
  const slot = hand === "left" ? "leftHandItemId" : "rightHandItemId";
  const item = state.player.inventory.find((entry) => entry.id === state.player.equipment[slot]) ?? null;

  state.player.equipment[slot] = null;

  return {
    ok: true,
    item,
    message: item ? `${item.name} removed from your ${hand} hand.` : `${hand} hand is already free.`
  };
}

export function getEquippedItem(state, hand) {
  const slot = hand === "left" ? "leftHandItemId" : "rightHandItemId";
  return state.player.inventory.find((item) => item.id === state.player.equipment[slot]) ?? null;
}

export function selectGearItem(state, itemId) {
  const item = state.player.inventory.find((entry) => entry.id === itemId);

  if (!item) {
    return null;
  }

  state.player.selectedGearItemId = item.id;
  return item;
}

export function getSelectedGearItem(state) {
  return (
    state.player.inventory.find((item) => item.id === state.player.selectedGearItemId) ??
    state.player.inventory[0] ??
    null
  );
}

export function isWeaponItem(item) {
  return Boolean(item?.weapon);
}

export function isArmorItem(item) {
  return Boolean(item?.armor);
}

export function performWeaponAttack(state, hand) {
  const item = getEquippedItem(state, hand);
  const attackKey = hand === "left" ? "lastLeftAttackAt" : "lastRightAttackAt";

  if (!item) {
    const emptyHandStats = WEAPON_STATS["Empty Hand"];
    const cooldown = 1 / emptyHandStats.frequency;
    const readyAt = state.player.equipment[attackKey] + cooldown;

    if (state.elapsed < readyAt) {
      return {
        ok: false,
        cooldown: readyAt - state.elapsed,
        message: "Empty hand is recovering."
      };
    }

    state.player.equipment[attackKey] = state.elapsed;

    return {
      ok: true,
      hand,
      item: {
        id: null,
        name: "Empty Hand",
        type: "Empty Hand",
        category: "Natural",
        weapon: emptyHandStats,
        durability: Number.POSITIVE_INFINITY,
        maxDurability: Number.POSITIVE_INFINITY
      },
      stats: emptyHandStats,
      message: `Empty hand attack: ${emptyHandStats.damage} damage, ${emptyHandStats.knockback} knockback.`
    };
  }

  if (!isWeaponItem(item)) {
    return { ok: false, message: `${item.name} is not a weapon.` };
  }

  if (item.durability <= 0) {
    return { ok: false, message: `${item.name} is broken.` };
  }

  const cooldown = 1 / item.weapon.frequency;
  const readyAt = state.player.equipment[attackKey] + cooldown;

  if (state.elapsed < readyAt) {
    return {
      ok: false,
      cooldown: readyAt - state.elapsed,
      message: `${item.name} is recovering.`
    };
  }

  state.player.equipment[attackKey] = state.elapsed;
  item.durability = Math.max(0, item.durability - 1);

  return {
    ok: true,
    hand,
    item,
    stats: item.weapon,
    message: `${item.name} attack: ${item.weapon.damage} damage, ${item.weapon.penetration} penetration, ${item.weapon.knockback ?? 0} knockback.`
  };
}

export function getNearestOwnedDepot(state) {
  return (
    state.structures
      .filter(
        (structure) =>
          structure.type === "depot" &&
          structure.ownerFactionId === state.selectedFactionId &&
          structure.hp > 0
      )
      .map((structure) => ({
        structure,
        distance: distance2D(state.player.position, structure.position)
      }))
      .filter((entry) => entry.distance <= 12)
      .sort((a, b) => a.distance - b.distance)[0]?.structure ?? null
  );
}

export function damageEquippedItem(state, amount) {
  const equippedIds = Object.entries(state.player.equipment)
    .filter(([key, value]) => value && key.endsWith("ItemId"))
    .map(([, value]) => value);
  const item =
    state.player.inventory.find((entry) => equippedIds.includes(entry.id) && entry.durability > 0) ??
    state.player.inventory.find((entry) => entry.durability > 0);

  if (!item) {
    return;
  }

  item.durability = Math.max(0, item.durability - amount);
}

export function sanitizeHouseName(value) {
  return String(value ?? "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 18);
}

export function setPlayerHouseName(state, value) {
  state.player.houseName = sanitizeHouseName(value);
  updatePlayerLineageName(state);
  syncFactionMemberRecord(state);
  return state.player.houseName;
}

export function beginNewPlayerLife(state) {
  if (!state.player.houseName) {
    return state.player.name;
  }

  state.player.firstName = randomItem(FIRST_NAMES);
  state.player.lifeNumber = Math.max(0, Math.floor(Number(state.player.lifeNumber) || 0)) + 1;
  updatePlayerLineageName(state);
  syncFactionMemberRecord(state);
  return state.player.name;
}

export function updatePlayerLineageName(state) {
  if (!state.player.houseName) {
    return state.player.name;
  }

  const firstName = state.player.firstName || randomItem(FIRST_NAMES);
  state.player.firstName = firstName;
  state.player.name = `${firstName} ${formatHouseName(state.player.houseName)}`;
  return state.player.name;
}

export function formatHouseName(houseName) {
  const clean = sanitizeHouseName(houseName);
  return clean ? `${clean.charAt(0)}${clean.slice(1).toLowerCase()}` : "";
}

export function syncFactionMemberRecord(state) {
  if (!state.selectedFactionId || !state.factionMembers[state.selectedFactionId]) {
    return;
  }

  const member = state.factionMembers[state.selectedFactionId].find((entry) => entry.playerId === state.player.id);

  if (!member) {
    return;
  }

  member.name = state.player.name;
  member.houseName = state.player.houseName;
  member.renown = state.player.renown;
}

export function recordPlayerKillLore(state, defeatedPlayer, options = {}) {
  if (!defeatedPlayer?.id || defeatedPlayer.id === state.player.id || !state.selectedFactionId) {
    return null;
  }

  const defeatedFaction = defeatedPlayer.factionId ? FACTION_LOOKUP[defeatedPlayer.factionId] : null;
  const wasRuler = defeatedPlayer.factionId
    ? state.factionGovernance[defeatedPlayer.factionId]?.rulerPlayerId === defeatedPlayer.id
    : false;
  const weaponName = options.weaponName ?? "arms";
  const summary = wasRuler
    ? `${FACTION_LOOKUP[state.selectedFactionId].name}'s ${state.player.name} killed ${defeatedFaction?.name ?? "a rival faction"}'s ruler ${defeatedPlayer.name} using ${weaponName}.`
    : `${FACTION_LOOKUP[state.selectedFactionId].name}'s ${state.player.name} defeated ${defeatedPlayer.name} using ${weaponName}.`;

  return recordLoreEvent(state, {
    type: wasRuler ? "ruler_killed" : "player_killed",
    factionId: state.selectedFactionId,
    actor: createPlayerLoreActor(state),
    subject: createExternalPlayerLoreActor(defeatedPlayer),
    summary,
    details: {
      factionName: FACTION_LOOKUP[state.selectedFactionId].name,
      defeatedFactionName: defeatedFaction?.name ?? "Unknown faction",
      weaponName,
      wasRuler
    },
    weight: wasRuler ? 5 : 3
  });
}

export function recordLoreEvent(state, event) {
  if (!event?.summary) {
    return null;
  }

  const type = String(event.type ?? "event").slice(0, 60);
  if (!LORE_RECORDED_EVENT_TYPES.has(type)) {
    return null;
  }

  ensureLoreState(state);
  const actor = normalizeLoreActor(event.actor);
  const subject = normalizeLoreActor(event.subject);
  const mentions = collectLoreMentions(actor, subject, event.mentions);
  const transaction = {
    id: createId("lore"),
    type,
    at: Math.max(0, Number(state.elapsed) || 0),
    factionId: FACTION_LOOKUP[event.factionId]?.id ?? actor?.factionId ?? null,
    summary: String(event.summary).slice(0, 240),
    actor,
    subject,
    mentions,
    details: event.details && typeof event.details === "object" ? { ...event.details } : {},
    weight: Math.max(1, Math.min(5, Math.floor(Number(event.weight) || 1)))
  };

  state.lore.transactions.push(transaction);
  state.lore.transactions = state.lore.transactions.slice(-120);
  if (state.lore.pendingStartedAt === null) {
    state.lore.pendingStartedAt = state.elapsed;
  }

  return maybeWriteHistoryVolume(state);
}

export function tickLoreSystem(state) {
  ensureLoreState(state);
  return maybeWriteHistoryVolume(state);
}

export function getLoreProgress(state) {
  const lore = ensureLoreState(state);
  const completed = Math.min(HISTORY_VOLUME_RECORD_THRESHOLD, lore.transactions.length);
  const percent = Math.floor((completed / HISTORY_VOLUME_RECORD_THRESHOLD) * 100);

  return {
    completed,
    required: HISTORY_VOLUME_RECORD_THRESHOLD,
    remaining: Math.max(0, HISTORY_VOLUME_RECORD_THRESHOLD - completed),
    percent
  };
}

export function claimLoreRenownAwards(state) {
  ensureLoreState(state);
  const playerId = state.player.id;
  const totalAward = Math.max(0, Math.floor(Number(state.lore.renownAwardsByPlayerId?.[playerId]) || 0));
  if (state.player.historyRenownVersion !== LORE_SCHEMA_VERSION) {
    state.player.historyRenownClaimed = 0;
    state.player.historyRenownVersion = LORE_SCHEMA_VERSION;
  }

  const alreadyClaimed = Math.max(0, Math.floor(Number(state.player.historyRenownClaimed) || 0));
  const gain = Math.max(0, totalAward - alreadyClaimed);

  if (!gain) {
    return 0;
  }

  state.player.renown += gain;
  state.player.historyRenownClaimed = totalAward;
  state.player.historyRenownVersion = LORE_SCHEMA_VERSION;
  syncFactionMemberRecord(state);
  addLog(state, `The chronicles named you. Gained ${gain} renown.`);
  return gain;
}

function createPlayerLoreActor(state) {
  return {
    playerId: state.player.id,
    name: state.player.name,
    houseName: state.player.houseName,
    factionId: state.selectedFactionId
  };
}

function createExternalPlayerLoreActor(player) {
  return {
    playerId: player.id ?? null,
    name: player.name ?? "Unknown",
    houseName: player.houseName ?? "",
    factionId: player.factionId ?? null
  };
}

function ensureLoreState(state) {
  state.lore = normalizeLoreState(state.lore);
  return state.lore;
}

export function normalizeLoreState(source) {
  const lore = source && typeof source === "object" ? source : {};
  if (lore.version !== LORE_SCHEMA_VERSION) {
    return createDefaultLoreState();
  }

  const fallback = createDefaultLoreState();
  return {
    version: LORE_SCHEMA_VERSION,
    story: typeof lore.story === "string" && lore.story.trim() ? lore.story.slice(0, 20000) : fallback.story,
    opening: typeof lore.opening === "string" && lore.opening.trim() ? lore.opening.slice(0, 2400) : fallback.opening,
    openingPrompt:
      typeof lore.openingPrompt === "string" && lore.openingPrompt.trim()
        ? lore.openingPrompt.slice(0, 3000)
        : fallback.openingPrompt,
    transactions: Array.isArray(lore.transactions)
      ? lore.transactions.filter((entry) => entry && LORE_RECORDED_EVENT_TYPES.has(entry.type)).slice(-120)
      : [],
    volumes: Array.isArray(lore.volumes) ? lore.volumes.filter(Boolean).slice(-40) : [],
    nextVolumeNumber: Math.max(1, Math.floor(Number(lore.nextVolumeNumber) || 1)),
    renownAwardsByPlayerId:
      lore.renownAwardsByPlayerId && typeof lore.renownAwardsByPlayerId === "object"
        ? Object.fromEntries(
            Object.entries(lore.renownAwardsByPlayerId)
              .filter(([playerId]) => typeof playerId === "string" && playerId.length <= 80)
              .map(([playerId, amount]) => [playerId, Math.max(0, Math.floor(Number(amount) || 0))])
          )
        : {},
    pendingStartedAt: Number.isFinite(Number(lore.pendingStartedAt)) ? Math.max(0, Number(lore.pendingStartedAt)) : null
  };
}

function maybeWriteHistoryVolume(state, options = {}) {
  const lore = ensureLoreState(state);
  const pendingCount = lore.transactions.length;

  if (pendingCount < HISTORY_VOLUME_RECORD_THRESHOLD) {
    return null;
  }

  return writeHistoryVolume(state);
}

function writeHistoryVolume(state) {
  const lore = ensureLoreState(state);
  const transactions = lore.transactions.splice(0, HISTORY_VOLUME_RECORD_THRESHOLD);

  if (!transactions.length) {
    return null;
  }

  const previousVolumes = selectRelevantPrecedingVolumes(lore.volumes);
  const mentionCounts = countMentions(transactions);
  const renownAwards = {};

  for (const [playerId, count] of Object.entries(mentionCounts)) {
    const award = count * HISTORY_RENOWN_PER_MENTION;
    renownAwards[playerId] = award;
    lore.renownAwardsByPlayerId[playerId] = (lore.renownAwardsByPlayerId[playerId] ?? 0) + award;
  }

  const volumeNumber = lore.nextVolumeNumber;
  const prompt = createHistoryPrompt(transactions, lore.story);
  const text = composeHistoryVolumeText(volumeNumber, transactions, lore.story);
  const volume = {
    id: createId("volume"),
    number: volumeNumber,
    title: createHistoryVolumeTitle(volumeNumber, transactions),
    createdAt: Math.max(0, Number(state.elapsed) || 0),
    previousVolumeIds: previousVolumes.map((volume) => volume.id),
    transactionIds: transactions.map((transaction) => transaction.id),
    mentionCounts,
    renownAwards,
    prompt,
    text
  };

  lore.volumes.unshift(volume);
  lore.volumes = lore.volumes.slice(0, 40);
  lore.story = appendStorySection(lore.story, text);
  lore.nextVolumeNumber += 1;
  lore.pendingStartedAt = lore.transactions.length ? state.elapsed : null;
  claimLoreRenownAwards(state);
  addLog(state, `The chronicle was extended.`);
  return volume;
}

function selectRelevantPrecedingVolumes(volumes) {
  return volumes
    .slice(0, HISTORY_PRECEDING_VOLUME_COUNT)
    .sort((a, b) => a.number - b.number);
}

function countMentions(transactions) {
  const counts = {};

  for (const transaction of transactions) {
    for (const mention of transaction.mentions ?? []) {
      if (!mention.playerId) {
        continue;
      }

      counts[mention.playerId] = (counts[mention.playerId] ?? 0) + 1;
    }
  }

  return counts;
}

function composeHistoryVolumeText(volumeNumber, transactions, storySoFar) {
  const opening = storySoFar?.trim()
    ? `Chapter ${volumeNumber}. The tale continued, and the ink turned again to banners, crowns, and names tested in the field.`
    : createOpeningLoreText();
  const deeds = transactions.map((event) => narrateTransaction(event)).join(" ");
  const strongest = transactions.slice().sort((a, b) => b.weight - a.weight)[0];

  return [opening, deeds, createEventReflection(strongest)].filter(Boolean).join("\n\n");
}

function createHistoryPrompt(transactions, storySoFar) {
  const eventText = formatEventsForHistoryPrompt(transactions);

  if (!storySoFar?.trim()) {
    return `Start a medieval tale based on the following events:\n\n${eventText}`;
  }

  return `Continue this story:\n\n${storySoFar}\n\nBased on these events:\n\n${eventText}`;
}

function formatEventsForHistoryPrompt(transactions) {
  return transactions.map((event) => `- ${event.summary}`).join("\n");
}

function appendStorySection(storySoFar, nextSection) {
  return [storySoFar?.trim(), nextSection?.trim()].filter(Boolean).join("\n\n");
}

function createOpeningLorePrompt() {
  return `Start a medieval tale. Set the scene using these factions by name: ${FACTIONS.map((faction) => faction.name).join(", ")}. Mention these places by name: ${POIS.map((poi) => poi.name).join(", ")}.`;
}

function createOpeningLoreText() {
  const factionNames = formatList(FACTIONS.map((faction) => faction.name));
  const poiNames = formatList(POIS.map((poi) => poi.name));
  return `In the wild crownlands, ${factionNames} raised their banners beneath a restless sky. Between them lay ${poiNames}, places of quarry dust, wheat, iron, market cries, and old dungeon shadows, where every oath waited to become history.`;
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

function createHistoryVolumeTitle(volumeNumber, transactions) {
  const strongest = transactions.slice().sort((a, b) => b.weight - a.weight)[0];
  const factionName = strongest?.factionId ? FACTION_LOOKUP[strongest.factionId]?.name : null;
  const theme = strongest ? getHistoryTheme(strongest.type) : "Unwritten Roads";
  return `Volume ${volumeNumber}: ${factionName ? `${theme} of ${factionName}` : theme}`;
}

function getHistoryTheme(type) {
  const themes = {
    player_killed: "Blood in the Field",
    poi_claimed: "Banners Raised",
    ruler_claimed: "Crowns Taken",
    ruler_killed: "Crowns Broken"
  };

  return themes[type] ?? "Field Notes";
}

function narrateTransaction(event) {
  if (event.type === "ruler_claimed") {
    return `${event.actor?.name ?? "A claimant"} took the throne, and the hall answered with steel-edged silence.`;
  }

  if (event.type === "ruler_killed") {
    return `${event.summary} The death of a crowned rival rang farther than the weapon stroke.`;
  }

  if (event.type === "player_killed") {
    return `${event.summary} Those who saw it carried the tale back through campfires and gatehouses.`;
  }

  if (event.type === "poi_claimed") {
    return `${event.actor?.name ?? "A captain"} planted a banner over ${event.details?.poiName ?? "new ground"}.`;
  }

  return event.summary;
}

function createEventReflection(event) {
  if (event.weight >= 5) {
    return "Such deeds do not settle quickly; they become the kind of rumor that sharpens borders.";
  }

  if (event.weight >= 3) {
    return "By nightfall the deed had already grown larger in the telling.";
  }

  return "Small acts, written faithfully, are how kingdoms learn their own names.";
}

function collectLoreMentions(actor, subject, mentions = []) {
  const byId = new Map();

  for (const entry of [actor, subject, ...(Array.isArray(mentions) ? mentions : [])]) {
    const mention = normalizeLoreActor(entry);

    if (!mention?.playerId) {
      continue;
    }

    byId.set(mention.playerId, mention);
  }

  return [...byId.values()];
}

function normalizeLoreActor(actor) {
  if (!actor || typeof actor !== "object") {
    return null;
  }

  const playerId = typeof actor.playerId === "string" ? actor.playerId.slice(0, 80) : null;
  const name = typeof actor.name === "string" ? actor.name.slice(0, 60) : "Unknown";
  const factionId = FACTION_LOOKUP[actor.factionId]?.id ?? null;

  return {
    playerId,
    name,
    houseName: sanitizeHouseName(actor.houseName),
    factionId
  };
}

export function addLog(state, message) {
  state.log.unshift({
    id: createId("log"),
    message,
    time: performance.now()
  });

  state.log = state.log.slice(0, 5);
}

export function distance2D(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function createLootItem(template) {
  const root = randomItem(template.itemRoots);
  const itemType = randomItem(template.itemTypes);
  const rarity = randomItem(["Rare", "Rare", "Epic", "Relic"]);
  const maxDurability = randomBetweenInt(80, 125);
  const weaponStats = WEAPON_STATS[itemType];
  const armorStats = ARMOR_STATS[itemType];

  return {
    id: createId("item"),
    name: `${root} ${itemType}`,
    type: itemType,
    category: weaponStats ? "Weapon" : "Armor",
    rarity,
    weapon: weaponStats ? { ...weaponStats } : null,
    armor: armorStats ? { ...armorStats, material: root } : null,
    durability: maxDurability,
    maxDurability
  };
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function randomBetweenInt(min, max) {
  return Math.floor(randomBetween(min, max + 1));
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
