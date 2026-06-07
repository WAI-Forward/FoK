import * as THREE from "three";
import {
  getCombatAttackDuration,
  getCombatDamage,
  getCombatHitMoment,
  getCombatKind,
  getCombatMeleeHitProfile,
  getCombatProfile,
  getCombatRange,
  getCombatReleaseMoment,
  getCombatWeaponHitSegments,
  isChargeableCombatType,
  isProjectileCombatType
} from "./combat-profiles.js";
import { buyResource, canPay, sellResource } from "./economy.js?v=0.5.4";
import { createId } from "./ids.js";
import {
  ARMOR_STATS,
  BUILDING_DEFINITIONS,
  BUILDING_LOOKUP,
  FACTIONS,
  FACTION_LOOKUP,
  ITEM_DEFINITIONS,
  POIS,
  RESOURCE_LOOKUP,
  RESOURCE_TYPES,
  STRUCTURE_COSTS,
  WEAPON_STATS
} from "./game-data.js";
import {
  beginNewPlayerLife,
  buildStructure,
  acceptFactionAllegiance,
  claimPoi,
  claimFactionRulerSeat,
  claimLoreRenownAwards,
  createGameState,
  depositToFaction,
  distance2D,
  equipItem,
  formatHouseName,
  getEquippedItem,
  getFactionMembers,
  getFactionRulerName,
  getLoreProgress,
  getNearestPoi,
  getSelectedGearItem,
  getZone,
  isFactionRuler,
  isArmorItem,
  isWeaponItem,
  joinFaction,
  normalizeLoreState,
  performWeaponAttack,
  recordPlayerKillLore,
  requestFactionAllegiance,
  sanitizeHouseName,
  setFactionRelation,
  selectGearItem,
  setPlayerHouseName,
  syncFactionMemberRecord,
  tickCouriers,
  tickEvent,
  tickFactionIncome,
  tickLoreSystem,
  unequipHand
} from "./state.js";

const canvas = document.querySelector("#game-canvas");
const state = createGameState();
const GAME_FLAGS = {
  pve: readBooleanFlag("pve", true)
};
const MULTIPLAYER_MAX_HEALTH = 100;
const MULTIPLAYER_SEND_INTERVAL = 0.12;
const MULTIPLAYER_POLL_INTERVAL = 0.18;
const PLAYER_RESPAWN_DELAY_MS = 3500;
const PERSISTENCE_SAVE_INTERVAL = 4;
const PERSISTENCE_POLL_INTERVAL = 6;
const BLOOD_SPLAT_LIFETIME = 1.28;
const BLOOD_SPLAT_DROPLET_COUNT = 12;
const WALL_BODY_SIZE = { width: 14.4, height: 4.4, depth: 2.4 };
const WALL_COLLIDER_HALF_WIDTH = WALL_BODY_SIZE.width / 2;
const WALL_COLLIDER_HALF_DEPTH = WALL_BODY_SIZE.depth / 2;
const LOCKED_THIRD_PERSON_CAMERA = {
  distanceScale: 0.38,
  minDistance: 16,
  maxDistance: 30,
  minPitch: 0.14,
  maxPitch: 1.42,
  shoulderOffset: 4.8,
  baseHeight: 5.8,
  pitchHeight: 5.8,
  minFocusDistance: 9,
  maxFocusDistance: 64,
  focusHeight: 4.8,
  pitchFocusOffset: 10
};
initializeNetworkIdentity();
const HAND_CONFIG = {
  left: {
    side: 1,
    basePosition: [0, 0, 0.03],
    baseRotation: [0, 0, 0]
  },
  right: {
    side: -1,
    basePosition: [0, 0, 0.03],
    baseRotation: [0, 0, 0]
  }
};
const TRADE_NPCS = [
  {
    id: "lumberjack",
    name: "Lumberjack",
    resourceId: "wood",
    position: { x: -24, z: 7 },
    color: "#7f4d25"
  },
  {
    id: "mason",
    name: "Mason",
    resourceId: "stone",
    position: { x: -8, z: 9 },
    color: "#878986"
  },
  {
    id: "farmer",
    name: "Farmer",
    resourceId: "wheat",
    position: { x: 8, z: 9 },
    color: "#c9aa45"
  },
  {
    id: "blacksmith",
    name: "Blacksmith",
    resourceId: "iron",
    position: { x: 24, z: 7 },
    color: "#505762"
  }
];
const DEPOSIT_RESOURCES = [
  { id: "gold", name: "Gold" },
  ...["wood", "stone", "iron", "wheat"].map((id) => ({
    id,
    name: RESOURCE_LOOKUP[id].name
  }))
];
const BODY_EQUIP_SLOTS = [
  { id: "head", label: "Head", stateKey: "headItemId" },
  { id: "chest", label: "Chest", stateKey: "chestItemId" },
  { id: "gloves", label: "Gloves", stateKey: "glovesItemId" },
  { id: "feet", label: "Feet", stateKey: "feetItemId" },
  { id: "leftHand", label: "Left hand", stateKey: "leftHandItemId", hand: "left" },
  { id: "rightHand", label: "Right hand", stateKey: "rightHandItemId", hand: "right" }
];
const ARMOR_VISUAL_SLOT_IDS = ["head", "chest", "gloves", "feet"];
const LOCATION_HOLD_DURATION = 1.05;
const POI_FLAG_HOLD_DURATION = 1.35;
const POI_FLAG_POSITION = { x: -23, z: -12 };
const POI_FLAG_INTERACTION_RANGE = 6.2;
const JUMP_VELOCITY = 21.75;
const JUMP_GRAVITY = 46;
const DIVE_DURATION = 0.58;
const DIVE_SPEED = 42;
const DIVE_COOLDOWN = 2;
const DIVE_VERTICAL_VELOCITY = -6.5;
const ROCK_PLATFORM_HEIGHT = 2.55;
const ROCK_PLATFORM_RADIUS_SCALE = 0.82;
const DUNGEON_ENEMY_SPAWNS = [
  { name: "Hollow Guard", position: { x: -24, z: -24 }, hp: 55, color: "#7d54b8" },
  { name: "Crypt Raider", position: { x: 24, z: -24 }, hp: 45, color: "#9b7250" },
  { name: "Bone Warden", position: { x: -18, z: 12 }, hp: 70, color: "#b8aa8d" },
  { name: "Hollow Acolyte", position: { x: 20, z: 16 }, hp: 38, color: "#5b477f" },
  { name: "Ebon Sentinel", position: { x: 0, z: -38 }, hp: 95, color: "#3d4249" }
];
const OUTDOOR_DUNGEON_MONSTERS = [
  { name: "Hollow Stalker", hp: 34, color: "#5b477f", speed: 8.2, radius: 1.05 },
  { name: "Ebon Crawler", hp: 42, color: "#3d4249", speed: 7.4, radius: 1.15 },
  { name: "Crypt Mauler", hp: 62, color: "#7d54b8", speed: 6.2, radius: 1.3 }
];
const OUTDOOR_DUNGEON_MONSTER_SPAWN_INTERVAL = 6.5;
const ENTITY_STATUS_CHANGED_VISIBLE_DURATION = 2.8;
const PVE_STATUS_BAR_HEIGHT = 7.15;
const REMOTE_STATUS_BAR_HEIGHT = 7.35;
const LOCAL_STATUS_BAR_HEIGHT = 7.05;
const PVE_MOB_COLLISION_PADDING = 0.22;
const ACTOR_COLLISION_PADDING = 0.12;
const PLAYER_COLLISION_RADIUS = 1.15;
const PVE_KNOCKBACK_IMPULSE_SCALE = 4.2;
const PLAYER_KNOCKBACK_IMPULSE_SCALE = 3.2;
const KNOCKBACK_MAX_SPEED = 13.5;
const KNOCKBACK_DAMPING = 8.8;
const OUTPOST_ATTACK_RANGE = 95;
const OUTPOST_ATTACK_INTERVAL = 2.35;
const OUTPOST_ATTACK_DAMAGE = 24;
const OUTPOST_PROJECTILE_SPEED = 76;
const DROPPED_ITEM_PICKUP_RANGE = 5.5;
const LOCKED_DROPPED_ITEM_PICKUP_ASSIST_RADIUS = 3.2;
const PVE_WEAPON_DEFINITIONS = ITEM_DEFINITIONS.filter((item) => item.category === "Weapon" && WEAPON_STATS[item.type]);
const STARTER_WEAPON_NAMES = new Set(PVE_WEAPON_DEFINITIONS.map((item) => item.name));
const PVE_WEAPON_PREFIXES = [
  "Cracked",
  "Rust-Bitten",
  "Grave-Forged",
  "Hollow",
  "Ashmarked",
  "Ebon",
  "Warden's",
  "Raider's"
];
const PVE_ARMOR_TYPES = Object.entries(ARMOR_STATS).map(([type, stats]) => ({ type, ...stats }));
const PVE_ARMOR_MATERIALS = [
  { name: "Hide", tier: 1, color: "#6f4a2c", defense: 0.72, resistance: 0.75, toughness: 0.7, durability: 0.78, metalness: 0.04 },
  { name: "Leather", tier: 2, color: "#7b5131", defense: 0.95, resistance: 0.95, toughness: 0.9, durability: 0.92, metalness: 0.06 },
  { name: "Bronze", tier: 3, color: "#b37a3a", defense: 1.18, resistance: 1.1, toughness: 1.12, durability: 1.08, metalness: 0.34 },
  { name: "Iron", tier: 4, color: "#858b8f", defense: 1.42, resistance: 1.28, toughness: 1.36, durability: 1.24, metalness: 0.42 },
  { name: "Steel", tier: 5, color: "#c5c9c8", defense: 1.72, resistance: 1.48, toughness: 1.62, durability: 1.46, metalness: 0.52 },
  { name: "Mithril", tier: 6, color: "#9fd7d0", defense: 2.05, resistance: 1.72, toughness: 1.92, durability: 1.72, metalness: 0.58 }
];
const ARMOR_MATERIAL_FALLBACKS = {
  "starfallen": { color: "#88bdf4", metalness: 0.48 },
  "meteor-forged": { color: "#6f7480", metalness: 0.52 },
  "skybrand": { color: "#d7c26b", metalness: 0.34 },
  "oathbreaker": { color: "#463f4f", metalness: 0.28 },
  "bannerlord's": { color: "#9b3f35", metalness: 0.22 },
  "red keep": { color: "#b24b3d", metalness: 0.24 },
  "wayfarer's": { color: "#6f5634", metalness: 0.08 },
  "silk road": { color: "#c49b62", metalness: 0.06 },
  "sunmarked": { color: "#d8aa48", metalness: 0.18 }
};
const TERRAIN_SIZE = 520;
const TERRAIN_HALF = TERRAIN_SIZE / 2;
const TERRAIN_SEGMENTS = 156;
const LONG_GRASS_PATCH_COUNT = 115;
const LONG_GRASS_BLADES_PER_PATCH = 22;
const TERRAIN_LEVELS = [
  { x: -210, z: -210, height: 2.2, radius: 78, falloff: 34 },
  { x: 210, z: -210, height: 7.6, radius: 76, falloff: 36 },
  { x: -210, z: 210, height: 4.4, radius: 80, falloff: 32 },
  { x: 210, z: 210, height: 10.8, radius: 78, falloff: 36 },
  { x: 0, z: 0, height: 3.3, radius: 48, falloff: 42 },
  { x: -110, z: 120, height: 5.2, radius: 54, falloff: 34 },
  { x: 126, z: 42, height: 6.8, radius: 62, falloff: 30 }
];
const OUTDOOR_SCENERY = [
  { type: "tree", x: -172, z: -132, scale: 1.2 },
  { type: "tree", x: -154, z: -156, scale: 0.95 },
  { type: "tree", x: -102, z: -172, scale: 1.1 },
  { type: "tree", x: -184, z: 50, scale: 1.35 },
  { type: "tree", x: -160, z: 84, scale: 0.9 },
  { type: "tree", x: -122, z: 88, scale: 1.15 },
  { type: "tree", x: -84, z: 148, scale: 1.05 },
  { type: "tree", x: -36, z: 182, scale: 1.25 },
  { type: "tree", x: 58, z: 174, scale: 0.95 },
  { type: "tree", x: 96, z: 146, scale: 1.2 },
  { type: "tree", x: 152, z: 122, scale: 1.05 },
  { type: "tree", x: 184, z: -24, scale: 1.0 },
  { type: "tree", x: 158, z: -62, scale: 1.28 },
  { type: "tree", x: 104, z: -142, scale: 0.92 },
  { type: "tree", x: 54, z: -184, scale: 1.1 },
  { type: "tree", x: -48, z: -88, scale: 0.9 },
  { type: "tree", x: 44, z: 82, scale: 1.0 },
  { type: "rock", x: -132, z: -88, scale: 1.15 },
  { type: "rock", x: -92, z: -132, scale: 0.9 },
  { type: "rock", x: -46, z: -152, scale: 1.25 },
  { type: "rock", x: -132, z: 128, scale: 0.9 },
  { type: "rock", x: -72, z: 102, scale: 1.05 },
  { type: "rock", x: 26, z: 138, scale: 1.1 },
  { type: "rock", x: 84, z: 98, scale: 0.85 },
  { type: "rock", x: 144, z: 10, scale: 1.25 },
  { type: "rock", x: 102, z: -34, scale: 0.95 },
  { type: "rock", x: 36, z: -118, scale: 1.05 },
  { type: "rock", x: -16, z: -48, scale: 0.9 },
  { type: "rock", x: 26, z: 30, scale: 1.15 }
];

const world = {
  scene: new THREE.Scene(),
  outdoorRoot: new THREE.Group(),
  interiorRoot: new THREE.Group(),
  poiInteriorRoot: new THREE.Group(),
  sceneMode: "outdoor",
  interiorFactionId: null,
  activePoiInteriorId: null,
  baseEntryAction: null,
  renderer: new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true }),
  camera: new THREE.PerspectiveCamera(48, 1, 0.1, 900),
  raycaster: new THREE.Raycaster(),
  groundPlane: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
  aimTarget: new THREE.Vector3(0, 0, 1),
  aimPoint: new THREE.Vector3(0, 0, 1),
  aimRayDirection: new THREE.Vector3(0, 0, 1),
  aimDirection: new THREE.Vector3(0, 0, 1),
  hasAim: false,
  clock: new THREE.Clock(),
  keys: new Set(),
  frames: 0,
  renderStatsTimer: 0,
  hoveredStatusEntityKey: null,
  meshes: {
    factions: new Map(),
    pois: new Map(),
    poiInteriors: new Map(),
    poiInteriorFlags: new Map(),
    structures: new Map(),
    couriers: new Map(),
    event: null,
    terrain: null,
    grassPatches: null,
    scenery: null
  },
  courierVisuals: new Map(),
  sceneryColliders: [],
  hoverBases: [],
  tradeNpcs: [],
  activeTradeNpcId: null,
  stewardNpcs: [],
  stewardPanelOpen: false,
  depotPanelOpen: false,
  activeDepotId: null,
  throneSeat: null,
  heldItems: {
    left: { itemId: null, mesh: null },
    right: { itemId: null, mesh: null }
  },
  playerArmorVisuals: createArmorVisualState(),
  projectiles: [],
  projectilesFired: 0,
  outpostDefenses: new Map(),
  bloodSplats: [],
  bloodSplatTexture: null,
  droppedItems: [],
  pveEnemies: [],
  remotePlayers: new Map(),
  pveEnemySeq: 0,
  outdoorMonsters: [],
  outdoorMonsterSeq: 0,
  outdoorMonsterSpawnTimer: 2,
  selectedBuildingType: "depot",
  placement: {
    active: false,
    type: null,
    rotation: 0,
    position: { x: 0, z: 0 },
    valid: false,
    mesh: null
  },
  workAction: null,
  rulerAction: null,
  outdoorReturnPosition: { x: 0, z: 0 },
  outpostTower: {
    active: false,
    structureId: null,
    position: { x: 0, z: 0 },
    elevation: 15.7,
    aimDirection: new THREE.Vector3(0, -0.12, 1),
    drawStartedAt: 0,
    shotCooldown: 0
  },
  attacks: {
    left: null,
    right: null
  },
  attackCycles: {
    left: 0,
    right: 0
  },
  combatDebug: {
    hitboxes: false,
    objects: []
  },
  combatFeedback: {
    hitstop: 0,
    cameraImpulse: 0,
    cameraPhase: 0
  },
  weaponAssetRegistry: {
    loaders: new Map(),
    proceduralFallbacks: new Map()
  },
  playerRig: null,
  playerVisualRoot: null,
  playerMotion: {
    moving: false,
    speed: 0,
    gait: 0,
    verticalOffset: 0,
    verticalVelocity: 0,
    supportOffset: 0,
    knockbackVelocity: new THREE.Vector3(0, 0, 0),
    jumping: false,
    diving: false,
    diveElapsed: 0,
    diveCooldown: 0,
    diveDirection: new THREE.Vector3(0, 0, 1)
  },
  multiplayer: {
    enabled: location.protocol !== "file:",
    sendTimer: 0,
    pollTimer: 0,
    publishInFlight: false,
    pollInFlight: false,
    failed: false,
    localDefeated: false,
    respawnAt: 0
  },
  persistence: {
    enabled: location.protocol !== "file:",
    online: false,
    storage: "none",
    dirty: false,
    saveTimer: PERSISTENCE_SAVE_INTERVAL,
    pollTimer: PERSISTENCE_POLL_INTERVAL,
    saveInFlight: false,
    loadInFlight: false
  },
  seatedOnThrone: false,
  cameraMode: "free",
  cameraYaw: Math.PI * 0.25,
  cameraPitch: 0.6,
  cameraDistance: 62,
  uiReady: false,
  pointer: {
    dragging: false,
    cameraDragging: false,
    moved: false,
    working: false,
    enteringBase: false,
    downAt: 0,
    lastMiddleClickAt: -999,
    suppressClickAction: false,
    attackHand: null,
    rangedCharge: null,
    insideCanvas: false,
    x: 0,
    y: 0
  }
};

const ui = {
  factionSelect: document.querySelector("#faction-select"),
  factionCards: document.querySelector("#faction-cards"),
  houseNameInput: document.querySelector("#house-name"),
  houseNameStatus: document.querySelector("#house-name-status"),
  hudFactionButton: document.querySelector("#hud-faction-button"),
  hudFaction: document.querySelector("#hud-faction"),
  hudPlayerButton: document.querySelector("#hud-player-button"),
  hudPlayer: document.querySelector("#hud-player"),
  hudLoreButton: document.querySelector("#hud-lore-button"),
  hudRenown: document.querySelector("#hud-renown"),
  hudStatusButton: document.querySelector("#hud-status-button"),
  hudZone: document.querySelector("#hud-zone"),
  resourceList: document.querySelector("#resource-list"),
  statusPanel: document.querySelector("#status-panel"),
  statusClose: document.querySelector("#status-close"),
  statusSummary: document.querySelector("#status-summary"),
  statusBody: document.querySelector("#status-body"),
  structureCount: document.querySelector("#structure-count"),
  structureList: document.querySelector("#structure-list"),
  inventoryPanel: document.querySelector("#inventory-panel"),
  inventoryClose: document.querySelector("#inventory-close"),
  inventoryStatus: document.querySelector("#inventory-status"),
  inventoryGrid: document.querySelector("#inventory-grid"),
  inventoryDetails: document.querySelector("#inventory-details"),
  inventoryHotbar: document.querySelector("#inventory-hotbar"),
  buildPanel: document.querySelector("#build-panel"),
  buildClose: document.querySelector("#build-close"),
  buildStatus: document.querySelector("#build-status"),
  buildGrid: document.querySelector("#build-grid"),
  buildDetails: document.querySelector("#build-details"),
  hotbar: document.querySelector("#hotbar"),
  leftHandIcon: document.querySelector("#left-hand-icon"),
  rightHandIcon: document.querySelector("#right-hand-icon"),
  baseTooltip: document.querySelector("#base-tooltip"),
  locationPrompt: document.querySelector("#location-prompt"),
  locationPromptTitle: document.querySelector("#location-prompt-title"),
  locationPromptProgress: document.querySelector("#location-prompt-progress"),
  interiorHint: document.querySelector("#interior-hint"),
  interiorTitle: document.querySelector("#interior-title"),
  leaveInterior: document.querySelector("#leave-interior"),
  npcTradePanel: document.querySelector("#npc-trade-panel"),
  npcTradeTitle: document.querySelector("#npc-trade-title"),
  npcTradeResource: document.querySelector("#npc-trade-resource"),
  npcTradeClose: document.querySelector("#npc-trade-close"),
  npcTradeAmount: document.querySelector("#npc-trade-amount"),
  npcBuyPrice: document.querySelector("#npc-buy-price"),
  npcSellPrice: document.querySelector("#npc-sell-price"),
  npcBuyResource: document.querySelector("#npc-buy-resource"),
  npcSellResource: document.querySelector("#npc-sell-resource"),
  stewardPanel: document.querySelector("#steward-panel"),
  stewardTitle: document.querySelector("#steward-title"),
  stewardStatus: document.querySelector("#steward-status"),
  stewardClose: document.querySelector("#steward-close"),
  stewardAmount: document.querySelector("#steward-amount"),
  stewardDepositList: document.querySelector("#steward-deposit-list"),
  depotPanel: document.querySelector("#depot-panel"),
  depotTitle: document.querySelector("#depot-title"),
  depotStatus: document.querySelector("#depot-status"),
  depotClose: document.querySelector("#depot-close"),
  depotAmount: document.querySelector("#depot-amount"),
  depotResourceList: document.querySelector("#depot-resource-list"),
  depotItemList: document.querySelector("#depot-item-list"),
  rulerPanel: document.querySelector("#ruler-panel"),
  rulerClose: document.querySelector("#ruler-close"),
  rulerTitle: document.querySelector("#ruler-title"),
  rulerStatus: document.querySelector("#ruler-status"),
  rulerMembers: document.querySelector("#ruler-members"),
  rulerResources: document.querySelector("#ruler-resources"),
  rulerPolitics: document.querySelector("#ruler-politics"),
  loreScroll: document.querySelector("#lore-scroll"),
  loreClose: document.querySelector("#lore-close"),
  loreMeta: document.querySelector("#lore-meta"),
  loreBody: document.querySelector("#lore-body"),
  toastLog: document.querySelector("#toast-log")
};

function initializeNetworkIdentity() {
  const storageKey = "kok3d.playerId";
  const nameKey = "kok3d.playerName";
  const houseKey = "kok3d.houseName";
  let playerId = "";

  try {
    playerId = sessionStorage.getItem(storageKey) ?? "";

    if (!playerId) {
      playerId = createId("player");
      sessionStorage.setItem(storageKey, playerId);
    }
  } catch {
    playerId = createId("player");
  }

  const fallbackName = `Player ${playerId.slice(-4).toUpperCase()}`;
  let playerName = fallbackName;

  try {
    playerName = localStorage.getItem(nameKey) || fallbackName;
    localStorage.setItem(nameKey, playerName);
  } catch {
    playerName = fallbackName;
  }

  state.player.id = playerId;
  state.player.name = playerName;
  try {
    state.player.houseName = sanitizeHouseName(localStorage.getItem(houseKey));
  } catch {
    state.player.houseName = "";
  }
  state.player.hp = MULTIPLAYER_MAX_HEALTH;
  state.player.maxHp = MULTIPLAYER_MAX_HEALTH;
  state.player.dead = false;
  document.body.dataset.playerId = playerId;
}

async function loadPersistentState() {
  if (!world.persistence.enabled) {
    return;
  }

  world.persistence.loadInFlight = true;

  try {
    const data = await fetchPersistentJson(`/api/world/state?playerId=${encodeURIComponent(state.player.id)}`);
    applyPersistentPayload(data, { includePlayer: true });
    world.persistence.online = true;
    world.persistence.storage = data.storage ?? "database";
  } catch (error) {
    world.persistence.online = false;
    world.persistence.storage = "none";
    console.warn("World persistence unavailable.", error);
  } finally {
    world.persistence.loadInFlight = false;
  }
}

async function pollPersistentState() {
  if (!world.persistence.enabled || world.persistence.loadInFlight || world.persistence.saveInFlight) {
    return;
  }

  world.persistence.loadInFlight = true;

  try {
    const data = await fetchPersistentJson(`/api/world/state?playerId=${encodeURIComponent(state.player.id)}`);
    applyPersistentPayload(data, { includePlayer: false });
    world.persistence.online = true;
    world.persistence.storage = data.storage ?? world.persistence.storage;
  } catch {
    world.persistence.online = false;
  } finally {
    world.persistence.loadInFlight = false;
  }
}

async function savePersistentState(options = {}) {
  if (!world.persistence.enabled || world.persistence.saveInFlight) {
    return;
  }

  const includeWorld = options.includeWorld ?? world.persistence.dirty;
  world.persistence.saveInFlight = true;

  try {
    const data = await fetchPersistentJson("/api/world/snapshot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPersistentPayload(includeWorld))
    });
    if (includeWorld) {
      world.persistence.dirty = false;
    }
    applyPersistentPayload(data, { includePlayer: true });
    world.persistence.online = true;
    world.persistence.storage = data.storage ?? world.persistence.storage;
  } catch {
    world.persistence.online = false;
    if (includeWorld) {
      world.persistence.dirty = true;
    }
  } finally {
    world.persistence.saveInFlight = false;
  }
}

async function fetchPersistentJson(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });

    if (!response.ok) {
      throw new Error(`Persistence request failed: ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function markPersistenceDirty() {
  if (world.persistence.enabled) {
    world.persistence.dirty = true;
    world.persistence.saveTimer = Math.min(world.persistence.saveTimer, 0.5);
  }
}

function markPlayerPersistenceDue() {
  if (world.persistence.enabled) {
    world.persistence.saveTimer = Math.min(world.persistence.saveTimer, 0.5);
  }
}

function updatePersistence(deltaSeconds) {
  if (!world.persistence.enabled) {
    return;
  }

  world.persistence.saveTimer -= deltaSeconds;
  world.persistence.pollTimer -= deltaSeconds;

  if (world.persistence.dirty && world.persistence.saveTimer <= 0 && !world.persistence.saveInFlight) {
    world.persistence.saveTimer = PERSISTENCE_SAVE_INTERVAL;
    void savePersistentState({ includeWorld: true });
    return;
  }

  if (!world.persistence.dirty && world.persistence.saveTimer <= 0 && !world.persistence.saveInFlight) {
    world.persistence.saveTimer = PERSISTENCE_SAVE_INTERVAL;
    void savePersistentState({ includeWorld: false });
    return;
  }

  if (!world.persistence.dirty && world.persistence.pollTimer <= 0) {
    world.persistence.pollTimer = PERSISTENCE_POLL_INTERVAL;
    void pollPersistentState();
  }
}

function buildPersistentPayload(includeWorld = true) {
  const payload = {
    playerId: state.player.id,
    player: {
      selectedFactionId: state.selectedFactionId,
      player: {
        id: state.player.id,
        name: state.player.name,
        houseName: state.player.houseName,
        firstName: state.player.firstName,
        lifeNumber: state.player.lifeNumber,
        gold: state.player.gold,
        renown: state.player.renown,
        historyRenownClaimed: state.player.historyRenownClaimed,
        historyRenownVersion: state.player.historyRenownVersion,
        position: state.player.position,
        velocity: state.player.velocity,
        selectedGearItemId: state.player.selectedGearItemId,
        equipment: state.player.equipment,
        hotbar: state.player.hotbar,
        resources: state.player.resources,
        inventory: state.player.inventory
      }
    }
  };

  if (includeWorld) {
    payload.world = {
      elapsed: state.elapsed,
      market: state.market,
      factionMembers: state.factionMembers,
      factionGovernance: state.factionGovernance,
      factionResources: state.factionResources,
      pois: state.pois,
      structures: state.structures,
      couriers: state.couriers,
      activeEvent: state.activeEvent,
      lore: state.lore
    };
  }

  return payload;
}

function applyPersistentPayload(data, options = {}) {
  if (!data?.ok) {
    return;
  }

  if (data.world) {
    applyWorldSnapshot(data.world);
  }

  if (options.includePlayer && data.player) {
    applyPlayerSnapshot(data.player);
  }

  if (claimLoreRenownAwards(state) > 0) {
    markPlayerPersistenceDue();
    if (world.uiReady) {
      refreshUi();
    }
  }
}

function applyWorldSnapshot(snapshot) {
  state.elapsed = Math.max(state.elapsed, Number(snapshot.elapsed) || 0);
  state.market = mergeMarketSnapshot(snapshot.market, state.market);
  state.factionMembers = mergeFactionMap(snapshot.factionMembers, state.factionMembers);
  state.factionGovernance = mergeFactionMap(snapshot.factionGovernance, state.factionGovernance);
  state.factionResources = mergeFactionResources(snapshot.factionResources, state.factionResources);

  if (Array.isArray(snapshot.pois)) {
    state.pois = state.pois.map((poi) => {
      const persisted = snapshot.pois.find((entry) => entry?.id === poi.id);
      return persisted
        ? {
            ...poi,
            ownerFactionId: persisted.ownerFactionId ?? null,
            pulse: persisted.pulse ?? 0,
            workerRespawnAt: persisted.workerRespawnAt ?? poi.workerRespawnAt ?? 0
          }
        : poi;
    });
  }

  if (Array.isArray(snapshot.structures)) {
    state.structures = snapshot.structures;
  }

  if (Array.isArray(snapshot.couriers)) {
    state.couriers = snapshot.couriers;
  }

  state.activeEvent = snapshot.activeEvent ?? null;
  state.lore = normalizeLoreState(snapshot.lore ?? state.lore);
}

function applyPlayerSnapshot(snapshot) {
  if (snapshot.selectedFactionId && FACTION_LOOKUP[snapshot.selectedFactionId]) {
    state.selectedFactionId = snapshot.selectedFactionId;
  }

  const persisted = snapshot.player;

  if (!persisted || typeof persisted !== "object") {
    return;
  }

  state.player.gold = Number.isFinite(Number(persisted.gold)) ? Number(persisted.gold) : state.player.gold;
  state.player.renown = Number.isFinite(Number(persisted.renown)) ? Number(persisted.renown) : state.player.renown;
  state.player.historyRenownClaimed = Number.isFinite(Number(persisted.historyRenownClaimed))
    ? Number(persisted.historyRenownClaimed)
    : state.player.historyRenownClaimed;
  state.player.historyRenownVersion = Number.isFinite(Number(persisted.historyRenownVersion))
    ? Number(persisted.historyRenownVersion)
    : 0;
  state.player.houseName = sanitizeHouseName(persisted.houseName) || state.player.houseName;
  state.player.firstName = typeof persisted.firstName === "string" ? persisted.firstName.slice(0, 24) : state.player.firstName;
  state.player.lifeNumber = Number.isFinite(Number(persisted.lifeNumber))
    ? Math.max(0, Math.floor(Number(persisted.lifeNumber)))
    : state.player.lifeNumber;
  state.player.resources = mergeResourceBag(persisted.resources, state.player.resources);

  if (persisted.position) {
    state.player.position.x = Number.isFinite(Number(persisted.position.x)) ? Number(persisted.position.x) : state.player.position.x;
    state.player.position.z = Number.isFinite(Number(persisted.position.z)) ? Number(persisted.position.z) : state.player.position.z;
  }

  if (persisted.velocity) {
    state.player.velocity.x = Number.isFinite(Number(persisted.velocity.x)) ? Number(persisted.velocity.x) : 0;
    state.player.velocity.z = Number.isFinite(Number(persisted.velocity.z)) ? Number(persisted.velocity.z) : 0;
  }

  if (persisted.equipment && typeof persisted.equipment === "object") {
    state.player.equipment = { ...state.player.equipment, ...persisted.equipment };
  }

  if (Array.isArray(persisted.hotbar)) {
    state.player.hotbar = persisted.hotbar.slice(0, state.player.hotbar.length);
  }

  if (Array.isArray(persisted.inventory) && persisted.inventory.length) {
    state.player.inventory = persisted.inventory;
  }

  if (refreshPersistedWeaponRanges()) {
    markPersistenceDirty();
  }

  state.player.selectedGearItemId = persisted.selectedGearItemId ?? state.player.selectedGearItemId;
  if (state.player.houseName) {
    if (!state.player.firstName) {
      beginNewPlayerLife(state);
    } else {
      setPlayerHouseName(state, state.player.houseName);
    }
  }
  syncFactionMemberRecord(state);
  removeLegacyStarterWeapons();
}

function refreshPersistedWeaponRanges() {
  let changed = false;

  for (const item of state.player.inventory) {
    const baseline = WEAPON_STATS[item?.type];

    if (!baseline || !item?.weapon) {
      continue;
    }

    const currentRange = Number(item.weapon.range) || 0;
    if (currentRange < baseline.range) {
      item.weapon.range = baseline.range;
      changed = true;
    }
  }

  return changed;
}

function removeLegacyStarterWeapons() {
  const removedIds = new Set(
    state.player.inventory
      .filter((item) => item?.category === "Weapon" && STARTER_WEAPON_NAMES.has(item.name))
      .map((item) => item.id)
  );

  if (!removedIds.size) {
    return;
  }

  state.player.inventory = state.player.inventory.filter((item) => !removedIds.has(item.id));

  for (const slot of BODY_EQUIP_SLOTS) {
    if (removedIds.has(state.player.equipment[slot.stateKey])) {
      state.player.equipment[slot.stateKey] = null;
    }
  }

  state.player.hotbar = state.player.hotbar.map((itemId) => (removedIds.has(itemId) ? null : itemId));

  if (removedIds.has(state.player.selectedGearItemId)) {
    state.player.selectedGearItemId = state.player.inventory[0]?.id ?? null;
  }
}

function mergeMarketSnapshot(source, fallback) {
  return Object.fromEntries(
    RESOURCE_TYPES.map((resource) => {
      const price = source?.[resource.id] ?? fallback[resource.id];
      return [
        resource.id,
        {
          buy: Number.isFinite(Number(price?.buy)) ? Number(price.buy) : fallback[resource.id].buy,
          sell: Number.isFinite(Number(price?.sell)) ? Number(price.sell) : fallback[resource.id].sell
        }
      ];
    })
  );
}

function mergeFactionResources(source, fallback) {
  return Object.fromEntries(
    FACTIONS.map((faction) => {
      const store = source?.[faction.id] ?? fallback[faction.id];
      return [
        faction.id,
        {
          gold: Number.isFinite(Number(store?.gold)) ? Number(store.gold) : fallback[faction.id].gold,
          items: Array.isArray(store?.items) ? store.items : fallback[faction.id].items ?? [],
          resources: mergeResourceBag(store?.resources, fallback[faction.id].resources)
        }
      ];
    })
  );
}

function mergeResourceBag(source, fallback) {
  return Object.fromEntries(
    RESOURCE_TYPES.map((resource) => [
      resource.id,
      Number.isFinite(Number(source?.[resource.id])) ? Number(source[resource.id]) : fallback[resource.id]
    ])
  );
}

function mergeFactionMap(source, fallback) {
  if (!source || typeof source !== "object") {
    return fallback;
  }

  return Object.fromEntries(
    FACTIONS.map((faction) => [faction.id, source[faction.id] ?? fallback[faction.id]])
  );
}

function readBooleanFlag(name, fallback) {
  const value = new URLSearchParams(window.location.search).get(name);

  if (value === null || value === "") {
    return fallback;
  }

  return !["0", "false", "off", "no"].includes(value.trim().toLowerCase());
}

setupRenderer();
await loadPersistentState();
setupScene();
setupUi();
setupDebugTools();
animate();

function setupRenderer() {
  world.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  world.renderer.setSize(window.innerWidth, window.innerHeight);
  world.renderer.shadowMap.enabled = true;
  world.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  world.scene.background = new THREE.Color("#111814");
  world.scene.fog = new THREE.Fog("#111814", 180, 620);

  window.addEventListener("resize", resize);
  resize();
}

function setupScene() {
  world.scene.add(world.outdoorRoot);
  world.scene.add(world.interiorRoot);
  world.scene.add(world.poiInteriorRoot);
  world.scene.add(world.camera);
  world.interiorRoot.visible = false;
  world.poiInteriorRoot.visible = false;
  document.body.dataset.pveEnabled = String(GAME_FLAGS.pve);

  const ambient = new THREE.HemisphereLight("#f4e7c9", "#253026", 1.1);
  world.scene.add(ambient);

  const sun = new THREE.DirectionalLight("#fff1c9", 2.1);
  sun.position.set(-70, 95, -35);
  sun.castShadow = true;
  sun.shadow.camera.left = -280;
  sun.shadow.camera.right = 280;
  sun.shadow.camera.top = 280;
  sun.shadow.camera.bottom = -280;
  sun.shadow.mapSize.set(2048, 2048);
  world.scene.add(sun);

  const ground = new THREE.Mesh(createTerrainGeometry(), createTerrainMaterial());
  ground.name = "terrain";
  ground.receiveShadow = true;
  addOutdoor(ground);
  world.meshes.terrain = ground;

  createRoads();
  createFactionHubs();
  createPoiMeshes();
  createOutdoorScenery();
  createLongGrassPatches();
  createCastleInterior();
  createPoiInteriors();
  createPlayerMesh();
  createTowerBowView();
}

function addOutdoor(mesh) {
  world.outdoorRoot.add(mesh);
}

function removeFromParent(mesh) {
  if (mesh?.parent) {
    mesh.parent.remove(mesh);
  }
}

function createRoads() {
  const material = new THREE.MeshStandardMaterial({
    color: "#594936",
    roughness: 0.98
  });
  const roads = [
    { x: 0, z: 0, sx: 610, sz: 5, rotation: Math.PI * 0.25 },
    { x: 0, z: 0, sx: 610, sz: 5, rotation: -Math.PI * 0.25 },
    { x: 0, z: 0, sx: 420, sz: 5, rotation: 0 },
    { x: 0, z: 0, sx: 5, sz: 420, rotation: 0 }
  ];

  for (const road of roads) {
    createRoadSegments(road, material);
  }
}

function createRoadSegments(road, material) {
  const length = Math.max(road.sx, road.sz);
  const width = Math.min(road.sx, road.sz);
  const segments = Math.ceil(length / 18);
  const segmentLength = length / segments;

  for (let index = 0; index < segments; index += 1) {
    const offset = -length * 0.5 + segmentLength * (index + 0.5);
    const localX = road.sx >= road.sz ? offset : 0;
    const localZ = road.sx >= road.sz ? 0 : offset;
    const sin = Math.sin(road.rotation);
    const cos = Math.cos(road.rotation);
    const x = road.x + localX * cos - localZ * sin;
    const z = road.z + localX * sin + localZ * cos;
    const height = getTerrainHeightAt(x, z);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(road.sx >= road.sz ? segmentLength : width, 0.08, road.sx >= road.sz ? width : segmentLength), material);
    mesh.position.set(x, height + 0.08, z);
    mesh.rotation.y = road.rotation;
    mesh.receiveShadow = true;
    addOutdoor(mesh);
  }
}

function createFactionHubs() {
  for (const faction of FACTIONS) {
    const group = new THREE.Group();
    group.position.set(faction.position.x, getTerrainHeightAt(faction.position.x, faction.position.z), faction.position.z);

    const zone = new THREE.Mesh(
      new THREE.CircleGeometry(faction.bufferRadius, 80),
      new THREE.MeshBasicMaterial({
        color: faction.color,
        transparent: true,
        opacity: 0.11,
        side: THREE.DoubleSide
      })
    );
    zone.rotation.x = -Math.PI / 2;
    zone.position.y = 0.08;
    group.add(zone);

    const keep = createKeep(faction);
    keep.name = "factionKeep";
    keep.traverse((child) => {
      child.userData.factionId = faction.id;
    });
    group.add(keep);

    const label = createTextSprite(faction.name, faction.accent, 50);
    label.position.set(0, 27, 0);
    group.add(label);

    addOutdoor(group);
    world.meshes.factions.set(faction.id, group);
    world.hoverBases.push(keep);
  }
}

function createKeep(faction) {
  const group = new THREE.Group();
  const stone = createStoneBrickMaterial();
  const banner = new THREE.MeshStandardMaterial({
    color: faction.color,
    roughness: 0.7
  });
  const roof = new THREE.MeshStandardMaterial({
    color: "#3b2d28",
    roughness: 0.8
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(18, 12, 18), stone);
  body.position.y = 6;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const roofMesh = new THREE.Mesh(new THREE.ConeGeometry(14, 8, 4), roof);
  roofMesh.position.y = 16;
  roofMesh.rotation.y = Math.PI / 4;
  roofMesh.castShadow = true;
  group.add(roofMesh);

  const towers = [
    [-13, -13],
    [13, -13],
    [-13, 13],
    [13, 13]
  ];

  for (const [x, z] of towers) {
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 4, 16, 8), stone);
    tower.position.set(x, 8, z);
    tower.castShadow = true;
    tower.receiveShadow = true;
    group.add(tower);

    const towerRoof = new THREE.Mesh(new THREE.ConeGeometry(4.7, 6, 8), roof);
    towerRoof.position.set(x, 18, z);
    towerRoof.castShadow = true;
    group.add(towerRoof);
  }

  const flagPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 13, 8),
    new THREE.MeshStandardMaterial({ color: "#2b241b" })
  );
  flagPole.position.set(0, 22, 0);
  group.add(flagPole);

  const flag = new THREE.Mesh(new THREE.BoxGeometry(5.5, 3.2, 0.25), banner);
  flag.position.set(2.7, 24, 0);
  group.add(flag);

  return group;
}

function createPoiMeshes() {
  for (const poi of POIS) {
    const group = new THREE.Group();
    group.position.set(poi.position.x, getTerrainHeightAt(poi.position.x, poi.position.z), poi.position.z);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(poi.radius, 0.18, 8, 96),
      new THREE.MeshBasicMaterial({ color: "#d6a542", transparent: true, opacity: 0.45 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.25;
    group.add(ring);

    group.add(createPoiModel(poi));

    const flagPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 7, 8),
      new THREE.MeshStandardMaterial({ color: "#2b241b" })
    );
    flagPole.name = "flagPole";
    flagPole.position.set(5.5, 3.5, 0);
    group.add(flagPole);

    const flag = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 2, 0.2),
      new THREE.MeshStandardMaterial({ color: "#6f6a5f" })
    );
    flag.name = "flag";
    flag.position.set(7.2, 5.8, 0);
    group.add(flag);

    const label = createTextSprite(poi.name, "#f4e7c9", 38);
    label.position.set(0, 11, 0);
    group.add(label);

    addOutdoor(group);
    world.meshes.pois.set(poi.id, group);
  }
}

function createPoiModel(poi) {
  const group = new THREE.Group();
  const resource = RESOURCE_LOOKUP[poi.resourceId];
  const material = new THREE.MeshStandardMaterial({
    color: resource?.color ?? "#d6a542",
    roughness: 0.82
  });

  if (poi.type === "Dungeon") {
    const stone = new THREE.MeshStandardMaterial({ color: "#2e3035", roughness: 0.95 });
    const rune = new THREE.MeshStandardMaterial({ color: "#8457bd", emissive: "#3a1a68", emissiveIntensity: 0.9 });

    const stair = new THREE.Mesh(new THREE.BoxGeometry(14, 0.6, 8), stone);
    stair.position.set(0, 0.3, 0.5);
    stair.castShadow = true;
    stair.receiveShadow = true;
    group.add(stair);

    for (const x of [-3.8, 3.8]) {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.1, 6.5, 8), stone);
      pillar.position.set(x, 3.25, -3.2);
      pillar.castShadow = true;
      group.add(pillar);
    }

    const lintel = new THREE.Mesh(new THREE.BoxGeometry(9, 1.2, 1.6), stone);
    lintel.position.set(0, 6.4, -3.2);
    lintel.castShadow = true;
    group.add(lintel);

    const door = new THREE.Mesh(new THREE.BoxGeometry(5.4, 5.4, 0.45), new THREE.MeshStandardMaterial({ color: "#050505", roughness: 1 }));
    door.position.set(0, 2.8, -3.55);
    group.add(door);

    for (const x of [-4.2, 4.2]) {
      const obelisk = new THREE.Mesh(new THREE.ConeGeometry(0.8, 5.4, 4), rune);
      obelisk.position.set(x * 1.7, 2.7, -1.2);
      obelisk.castShadow = true;
      group.add(obelisk);
    }
  } else if (poi.resourceId === "stone") {
    for (let index = 0; index < 8; index += 1) {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.8 + Math.random() * 1.2), material);
      rock.position.set(Math.random() * 10 - 5, 1.2, Math.random() * 10 - 5);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.castShadow = true;
      group.add(rock);
    }
  } else if (poi.resourceId === "wood") {
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: "#6f4222", roughness: 0.9 });
    const leafMaterial = new THREE.MeshStandardMaterial({ color: "#315f32", roughness: 0.75 });

    for (let index = 0; index < 7; index += 1) {
      const tree = new THREE.Group();
      tree.position.set(Math.random() * 13 - 6.5, 0, Math.random() * 13 - 6.5);

      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.62, 5, 7), trunkMaterial);
      trunk.position.y = 2.5;
      trunk.castShadow = true;
      tree.add(trunk);

      const leaves = new THREE.Mesh(new THREE.ConeGeometry(2.4, 6, 9), leafMaterial);
      leaves.position.y = 7;
      leaves.castShadow = true;
      tree.add(leaves);

      group.add(tree);
    }
  } else if (poi.resourceId === "wheat") {
    for (let index = 0; index < 34; index += 1) {
      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 2.1, 5), material);
      stalk.position.set(Math.random() * 15 - 7.5, 1, Math.random() * 13 - 6.5);
      stalk.rotation.z = Math.random() * 0.2 - 0.1;
      group.add(stalk);
    }
  } else if (poi.resourceId === "iron") {
    const cliff = new THREE.Mesh(
      new THREE.BoxGeometry(14, 7, 6),
      new THREE.MeshStandardMaterial({ color: "#3d4249", roughness: 0.95 })
    );
    cliff.position.set(0, 3.5, 2);
    cliff.castShadow = true;
    cliff.receiveShadow = true;
    group.add(cliff);

    const mouth = new THREE.Mesh(
      new THREE.BoxGeometry(5, 4.5, 0.4),
      new THREE.MeshStandardMaterial({ color: "#111111", roughness: 1 })
    );
    mouth.position.set(0, 2.25, -1.2);
    group.add(mouth);
  } else {
    const stallMaterial = new THREE.MeshStandardMaterial({ color: "#8b5132", roughness: 0.78 });
    const clothMaterial = new THREE.MeshStandardMaterial({ color: "#c7a04a", roughness: 0.6 });
    const stall = new THREE.Mesh(new THREE.BoxGeometry(12, 3, 8), stallMaterial);
    stall.position.y = 1.5;
    stall.castShadow = true;
    group.add(stall);

    const canopy = new THREE.Mesh(new THREE.BoxGeometry(13.5, 1, 9.5), clothMaterial);
    canopy.position.y = 4.1;
    canopy.castShadow = true;
    group.add(canopy);
  }

  return group;
}

function createOutdoorScenery() {
  const group = new THREE.Group();
  world.sceneryColliders = [];

  for (const scenery of OUTDOOR_SCENERY) {
    const mesh = scenery.type === "tree"
      ? createOutdoorTree(scenery.scale)
      : createOutdoorRock(scenery.scale);

    mesh.position.set(scenery.x, getTerrainHeightAt(scenery.x, scenery.z), scenery.z);
    mesh.rotation.y = ((Math.abs(scenery.x * 13 + scenery.z * 7) % 100) / 100) * Math.PI * 2;
    group.add(mesh);

    world.sceneryColliders.push({
      type: scenery.type,
      x: scenery.x,
      z: scenery.z,
      radius: (scenery.type === "tree" ? 1.35 : 1.7) * scenery.scale,
      height: (scenery.type === "tree" ? 9.8 : 3.4) * scenery.scale,
      groundY: mesh.position.y,
      platformHeight: scenery.type === "rock" ? ROCK_PLATFORM_HEIGHT * scenery.scale : 0,
      platformRadius: scenery.type === "rock" ? 1.7 * scenery.scale * ROCK_PLATFORM_RADIUS_SCALE : 0
    });
  }

  world.meshes.scenery = group;
  addOutdoor(group);
  document.body.dataset.sceneryColliders = String(world.sceneryColliders.length);
}

function createOutdoorTree(scale = 1) {
  const group = new THREE.Group();
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: "#6f4222", roughness: 0.92 });
  const barkDark = new THREE.MeshStandardMaterial({ color: "#4d2d1b", roughness: 0.94 });
  const leafMaterial = new THREE.MeshStandardMaterial({ color: "#2f6a38", roughness: 0.8 });
  const leafAccent = new THREE.MeshStandardMaterial({ color: "#3f7f42", roughness: 0.82 });

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.45 * scale, 0.72 * scale, 5.2 * scale, 8), trunkMaterial);
  trunk.position.y = 2.6 * scale;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  group.add(trunk);

  const trunkBase = new THREE.Mesh(new THREE.CylinderGeometry(0.78 * scale, 0.96 * scale, 0.55 * scale, 8), barkDark);
  trunkBase.position.y = 0.28 * scale;
  trunkBase.castShadow = true;
  group.add(trunkBase);

  const lowerLeaves = new THREE.Mesh(new THREE.ConeGeometry(3.0 * scale, 5.6 * scale, 10), leafMaterial);
  lowerLeaves.position.y = 6.1 * scale;
  lowerLeaves.castShadow = true;
  lowerLeaves.receiveShadow = true;
  group.add(lowerLeaves);

  const upperLeaves = new THREE.Mesh(new THREE.ConeGeometry(2.25 * scale, 4.2 * scale, 10), leafAccent);
  upperLeaves.position.y = 8.55 * scale;
  upperLeaves.castShadow = true;
  upperLeaves.receiveShadow = true;
  group.add(upperLeaves);

  return group;
}

function createOutdoorRock(scale = 1) {
  const group = new THREE.Group();
  const rockMaterial = new THREE.MeshStandardMaterial({ color: "#8d8d84", roughness: 0.96 });
  const darkRock = new THREE.MeshStandardMaterial({ color: "#68685f", roughness: 0.98 });

  const main = new THREE.Mesh(new THREE.DodecahedronGeometry(1.65 * scale), rockMaterial);
  main.position.set(0, 1.05 * scale, 0);
  main.scale.set(1.25, 0.78, 1.0);
  main.rotation.set(0.24, 0.45, -0.12);
  main.castShadow = true;
  main.receiveShadow = true;
  group.add(main);

  const side = new THREE.Mesh(new THREE.DodecahedronGeometry(1.0 * scale), darkRock);
  side.position.set(1.05 * scale, 0.75 * scale, -0.35 * scale);
  side.scale.set(1.0, 0.7, 0.82);
  side.rotation.set(-0.1, -0.4, 0.2);
  side.castShadow = true;
  side.receiveShadow = true;
  group.add(side);

  return group;
}

function createLongGrassPatches() {
  const group = new THREE.Group();
  group.name = "long-grass-patches";

  const bladeGeometry = createLongGrassBladeGeometry();
  const lightGrass = new THREE.MeshStandardMaterial({
    color: "#4f7d3a",
    roughness: 0.96,
    side: THREE.DoubleSide
  });
  const darkGrass = new THREE.MeshStandardMaterial({
    color: "#355f31",
    roughness: 0.98,
    side: THREE.DoubleSide
  });
  const maxBlades = LONG_GRASS_PATCH_COUNT * Math.ceil(LONG_GRASS_BLADES_PER_PATCH * 1.35);
  const lightBlades = new THREE.InstancedMesh(bladeGeometry, lightGrass, maxBlades);
  const darkBlades = new THREE.InstancedMesh(bladeGeometry, darkGrass, maxBlades);
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const rotation = new THREE.Quaternion();
  const bladeScale = new THREE.Vector3();
  const euler = new THREE.Euler();
  let lightIndex = 0;
  let darkIndex = 0;
  let patches = 0;

  for (let attempt = 0; attempt < 420 && patches < LONG_GRASS_PATCH_COUNT; attempt += 1) {
    const radius = 24 + Math.sqrt(hash2d(attempt + 13, 41)) * (TERRAIN_HALF - 42);
    const angle = attempt * 2.399963 + hash2d(attempt + 5, 103) * 0.85;
    const centerX = Math.cos(angle) * radius + (hash2d(attempt, 71) - 0.5) * 18;
    const centerZ = Math.sin(angle) * radius + (hash2d(attempt, 97) - 0.5) * 18;

    if (!canPlaceLongGrassAt(centerX, centerZ, 8.5)) {
      continue;
    }

    patches += 1;
    const patchRadius = 2.2 + hash2d(attempt, 151) * 4.4;
    const bladeCount = Math.floor(LONG_GRASS_BLADES_PER_PATCH * (0.72 + hash2d(attempt, 173) * 0.58));

    for (let blade = 0; blade < bladeCount; blade += 1) {
      const bladeSeed = attempt * 97 + blade * 13;
      const bladeRadius = Math.sqrt(hash2d(bladeSeed, 11)) * patchRadius;
      const bladeAngle = hash2d(bladeSeed, 23) * Math.PI * 2;
      const x = centerX + Math.cos(bladeAngle) * bladeRadius;
      const z = centerZ + Math.sin(bladeAngle) * bladeRadius;

      if (!canPlaceLongGrassAt(x, z, 4.5)) {
        continue;
      }

      const bladeHeight = 0.62 + hash2d(bladeSeed, 37) * 1.15;
      const bladeWidth = 0.16 + hash2d(bladeSeed, 43) * 0.16;
      const yaw = hash2d(bladeSeed, 59) * Math.PI * 2;
      const leanX = (hash2d(bladeSeed, 67) - 0.5) * 0.24;
      const leanZ = (hash2d(bladeSeed, 79) - 0.5) * 0.28;
      euler.set(leanX, yaw, leanZ);
      rotation.setFromEuler(euler);
      position.set(x, getTerrainHeightAt(x, z) + 0.02, z);
      bladeScale.set(bladeWidth, bladeHeight, 1);
      matrix.compose(position, rotation, bladeScale);

      if (hash2d(bladeSeed, 89) > 0.45) {
        lightBlades.setMatrixAt(lightIndex, matrix);
        lightIndex += 1;
      } else {
        darkBlades.setMatrixAt(darkIndex, matrix);
        darkIndex += 1;
      }
    }
  }

  lightBlades.count = lightIndex;
  darkBlades.count = darkIndex;
  lightBlades.instanceMatrix.needsUpdate = true;
  darkBlades.instanceMatrix.needsUpdate = true;
  lightBlades.castShadow = true;
  darkBlades.castShadow = true;
  lightBlades.receiveShadow = true;
  darkBlades.receiveShadow = true;
  group.add(lightBlades, darkBlades);

  world.meshes.grassPatches = group;
  addOutdoor(group);
}

function createLongGrassBladeGeometry() {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute([
      -0.5, 0, 0,
      0.5, 0, 0,
      0.18, 0.72, 0,
      0, 1, 0,
      -0.18, 0.72, 0
    ], 3)
  );
  geometry.setAttribute(
    "uv",
    new THREE.Float32BufferAttribute([
      0, 0,
      1, 0,
      0.68, 0.72,
      0.5, 1,
      0.32, 0.72
    ], 2)
  );
  geometry.setIndex([0, 1, 2, 0, 2, 4, 4, 2, 3]);
  geometry.computeVertexNormals();
  return geometry;
}

function canPlaceLongGrassAt(x, z, rockPadding) {
  if (Math.max(Math.abs(x), Math.abs(z)) > TERRAIN_HALF - 14) {
    return false;
  }

  if (distanceToOutdoorRoad(x, z) < 8) {
    return false;
  }

  if (getTerrainGrassAmountAt(x, z) < 0.78) {
    return false;
  }

  for (const scenery of OUTDOOR_SCENERY) {
    const clearance = scenery.type === "rock" ? rockPadding + scenery.scale * 3.2 : 2.4 + scenery.scale * 1.8;
    if (Math.hypot(x - scenery.x, z - scenery.z) < clearance) {
      return false;
    }
  }

  return true;
}

function distanceToOutdoorRoad(x, z) {
  return Math.min(
    Math.abs(x),
    Math.abs(z),
    Math.abs(x - z) * Math.SQRT1_2,
    Math.abs(x + z) * Math.SQRT1_2
  );
}

function createCastleInterior() {
  const root = world.interiorRoot;
  const stone = new THREE.MeshStandardMaterial({ color: "#6f6a5e", roughness: 0.88 });
  const darkStone = new THREE.MeshStandardMaterial({ color: "#34332e", roughness: 0.94 });
  const wood = new THREE.MeshStandardMaterial({ color: "#5a3520", roughness: 0.82 });
  const runner = new THREE.MeshStandardMaterial({ color: "#743328", roughness: 0.74 });
  const gold = new THREE.MeshStandardMaterial({ color: "#caa44b", roughness: 0.42, metalness: 0.18 });

  const floor = new THREE.Mesh(new THREE.BoxGeometry(70, 0.5, 54), darkStone);
  floor.position.y = -0.25;
  floor.receiveShadow = true;
  root.add(floor);

  const carpet = new THREE.Mesh(new THREE.BoxGeometry(12, 0.08, 45), runner);
  carpet.position.set(0, 0.05, 1);
  carpet.receiveShadow = true;
  root.add(carpet);

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(70, 18, 1), stone);
  backWall.position.set(0, 9, -27);
  backWall.castShadow = true;
  root.add(backWall);

  const frontWallLeft = new THREE.Mesh(new THREE.BoxGeometry(26, 16, 1), stone);
  frontWallLeft.position.set(-22, 8, 27);
  root.add(frontWallLeft);

  const frontWallRight = new THREE.Mesh(new THREE.BoxGeometry(26, 16, 1), stone);
  frontWallRight.position.set(22, 8, 27);
  root.add(frontWallRight);

  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(1, 16, 54), stone);
  leftWall.position.set(-35, 8, 0);
  root.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(1, 16, 54), stone);
  rightWall.position.set(35, 8, 0);
  root.add(rightWall);

  const archTop = new THREE.Mesh(new THREE.BoxGeometry(18, 5, 1.2), stone);
  archTop.position.set(0, 13.5, 27);
  root.add(archTop);

  const throneBase = new THREE.Mesh(new THREE.BoxGeometry(12, 1.2, 7), stone);
  throneBase.position.set(0, 0.6, -20);
  root.add(throneBase);

  const throneSeat = new THREE.Mesh(new THREE.BoxGeometry(5, 3, 3.5), wood);
  throneSeat.name = "rulerSeat";
  throneSeat.userData.rulerSeat = true;
  throneSeat.position.set(0, 2.7, -21);
  throneSeat.castShadow = true;
  root.add(throneSeat);
  world.throneSeat = throneSeat;

  const throneBack = new THREE.Mesh(new THREE.BoxGeometry(5.8, 7, 0.8), wood);
  throneBack.name = "rulerSeatBack";
  throneBack.userData.rulerSeat = true;
  throneBack.position.set(0, 5.2, -23);
  throneBack.castShadow = true;
  root.add(throneBack);

  const table = new THREE.Mesh(new THREE.BoxGeometry(18, 1, 5), wood);
  table.position.set(0, 2.2, 2);
  table.castShadow = true;
  root.add(table);

  for (const side of [-1, 1]) {
    const bench = new THREE.Mesh(new THREE.BoxGeometry(17, 0.7, 1.5), wood);
    bench.position.set(0, 1.3, side * 5.1);
    bench.castShadow = true;
    root.add(bench);
  }

  for (const [x, z] of [[-14, -18], [14, -18], [-14, 15], [14, 15]]) {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.45, 15, 10), stone);
    pillar.position.set(x, 7.5, z);
    pillar.castShadow = true;
    root.add(pillar);
  }

  for (const [x, z] of [[-24, -26], [24, -26], [-34, 0], [34, 0], [-14, 26], [14, 26]]) {
    const sconce = new THREE.Group();
    sconce.position.set(x, 7, z);
    const bracket = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 6), gold);
    bracket.rotation.z = Math.PI * 0.5;
    sconce.add(bracket);
    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.35, 1.1, 8),
      new THREE.MeshStandardMaterial({ color: "#f2b24b", emissive: "#d76b21", emissiveIntensity: 1.4 })
    );
    flame.position.y = 0.7;
    sconce.add(flame);
    const light = new THREE.PointLight("#f0a84a", 1.5, 28);
    light.position.y = 1.2;
    sconce.add(light);
    root.add(sconce);
  }

  const steward = createStewardNpc();
  root.add(steward);
  world.stewardNpcs.push(steward);
}

function createPoiInteriors() {
  for (const poi of POIS) {
    const scene = createPoiInteriorScene(poi);
    scene.visible = false;
    world.poiInteriorRoot.add(scene);
    world.meshes.poiInteriors.set(poi.id, scene);
  }
}

function createPoiInteriorScene(poi) {
  const group = new THREE.Group();
  group.name = `${poi.id}Interior`;
  const resource = RESOURCE_LOOKUP[poi.resourceId];
  const resourceColor = resource?.color ?? "#d6a542";
  const isDungeon = poi.type === "Dungeon";
  const width = isDungeon ? 116 : 66;
  const depth = isDungeon ? 88 : 48;
  const halfWidth = width / 2;
  const halfDepth = depth / 2;
  const floorMaterial = new THREE.MeshStandardMaterial({ color: "#2f342c", roughness: 0.92 });
  const wallMaterial = new THREE.MeshStandardMaterial({ color: "#5e574c", roughness: 0.9 });
  const trimMaterial = new THREE.MeshStandardMaterial({ color: resourceColor, roughness: 0.72 });

  const floor = new THREE.Mesh(new THREE.BoxGeometry(width, 0.45, depth), floorMaterial);
  floor.position.y = -0.24;
  floor.receiveShadow = true;
  group.add(floor);

  const exit = new THREE.Mesh(new THREE.BoxGeometry(16, 0.1, 4), trimMaterial);
  exit.position.set(0, 0.08, halfDepth - 2);
  exit.receiveShadow = true;
  group.add(exit);

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(width, 10, 1), wallMaterial);
  backWall.position.set(0, 5, -halfDepth);
  backWall.castShadow = true;
  group.add(backWall);

  for (const side of [-1, 1]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(1, 8, depth), wallMaterial);
    wall.position.set(side * halfWidth, 4, 0);
    wall.castShadow = true;
    group.add(wall);

    const frontNib = new THREE.Mesh(new THREE.BoxGeometry(isDungeon ? 42 : 20, 7, 1), wallMaterial);
    frontNib.position.set(side * (halfWidth - (isDungeon ? 21 : 10)), 3.5, halfDepth);
    frontNib.castShadow = true;
    group.add(frontNib);
  }

  const label = createTextSprite(poi.name, resourceColor, 38);
  label.position.set(0, 13, -halfDepth + 2.5);
  group.add(label);

  if (!isDungeon) {
    const flagpole = createInteriorPoiFlagpole(poi);
    flagpole.position.set(POI_FLAG_POSITION.x, 0, POI_FLAG_POSITION.z);
    group.add(flagpole);
    world.meshes.poiInteriorFlags.set(poi.id, flagpole);
  }

  if (poi.id === "kingswood") {
    addKingswoodInterior(group);
  } else if (poi.id === "north-quarry") {
    addQuarryInterior(group);
  } else if (poi.id === "river-market") {
    addRiverMarketInterior(group);
  } else if (poi.id === "millfield") {
    addMillfieldInterior(group);
  } else if (poi.id === "blackridge") {
    addBlackridgeInterior(group);
  } else if (poi.id === "ebon-hollow") {
    addDungeonInterior(group);
  }

  group.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = child.castShadow || child.position.y > 0.2;
      child.receiveShadow = true;
    }
  });

  return group;
}

function createInteriorPoiFlagpole(poi) {
  const group = new THREE.Group();
  group.name = "poiInteriorFlagpole";
  group.userData.poiId = poi.id;

  const wood = new THREE.MeshStandardMaterial({ color: "#2b241b", roughness: 0.8 });
  const rope = new THREE.MeshStandardMaterial({ color: "#c8b58a", roughness: 0.7 });
  const neutralCloth = new THREE.MeshStandardMaterial({ color: "#6f6a5f", roughness: 0.74 });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.35, 0.55, 12), wood);
  base.position.y = 0.28;
  group.add(base);

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 9.6, 10), wood);
  pole.name = "flagPole";
  pole.position.y = 5.05;
  group.add(pole);

  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 8), new THREE.MeshStandardMaterial({ color: "#d1a74c", roughness: 0.48 }));
  finial.position.y = 10.1;
  group.add(finial);

  const ropeMesh = new THREE.Mesh(new THREE.BoxGeometry(0.06, 8.6, 0.06), rope);
  ropeMesh.position.set(0.32, 5.05, 0.03);
  group.add(ropeMesh);

  const flag = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.2, 0.18), neutralCloth);
  flag.name = "flag";
  flag.position.set(2.05, 8.15, 0);
  group.add(flag);

  const marker = new THREE.Mesh(
    new THREE.TorusGeometry(POI_FLAG_INTERACTION_RANGE, 0.05, 6, 52),
    new THREE.MeshBasicMaterial({ color: "#d6a542", transparent: true, opacity: 0.24 })
  );
  marker.name = "flagInteractionRing";
  marker.rotation.x = Math.PI / 2;
  marker.position.y = 0.08;
  group.add(marker);

  return group;
}

function addKingswoodInterior(group) {
  const trunk = new THREE.MeshStandardMaterial({ color: "#6b3f22", roughness: 0.88 });
  const leaves = new THREE.MeshStandardMaterial({ color: "#2f6a38", roughness: 0.8 });
  const canvasMat = new THREE.MeshStandardMaterial({ color: "#b58b52", roughness: 0.76 });

  for (const [x, z] of [[-22, -13], [-12, -17], [16, -15], [25, -8]]) {
    const tree = new THREE.Group();
    tree.position.set(x, 0, z);
    const trunkMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.75, 6, 8), trunk);
    trunkMesh.position.y = 3;
    tree.add(trunkMesh);
    const crown = new THREE.Mesh(new THREE.ConeGeometry(3.2, 6, 10), leaves);
    crown.position.y = 7.1;
    tree.add(crown);
    group.add(tree);
  }

  for (const z of [-4, 0.5, 5]) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 12, 12), trunk);
    log.position.set(-7, 0.8, z);
    log.rotation.z = Math.PI / 2;
    group.add(log);
  }

  const tent = new THREE.Mesh(new THREE.ConeGeometry(5.4, 5.2, 4), canvasMat);
  tent.position.set(18, 2.6, 7);
  tent.rotation.y = Math.PI * 0.25;
  group.add(tent);
}

function addQuarryInterior(group) {
  const rockMat = new THREE.MeshStandardMaterial({ color: "#8a8a84", roughness: 0.94 });
  const cartMat = new THREE.MeshStandardMaterial({ color: "#5c3824", roughness: 0.84 });
  const railMat = new THREE.MeshStandardMaterial({ color: "#2c2b27", roughness: 0.72 });

  for (let index = 0; index < 18; index += 1) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.9 + Math.random() * 1.6), rockMat);
    rock.position.set(-26 + Math.random() * 52, 0.8 + Math.random() * 1.4, -18 + Math.random() * 24);
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    group.add(rock);
  }

  for (const x of [-4, 4]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(1, 0.14, 28), railMat);
    rail.position.set(x, 0.16, 1);
    group.add(rail);
  }

  const cart = new THREE.Mesh(new THREE.BoxGeometry(6, 2, 4), cartMat);
  cart.position.set(0, 1.15, -5);
  group.add(cart);
}

function addRiverMarketInterior(group) {
  const waterMat = new THREE.MeshStandardMaterial({ color: "#2f6570", roughness: 0.45, metalness: 0.04 });
  const woodMat = new THREE.MeshStandardMaterial({ color: "#6a4227", roughness: 0.82 });
  const clothMats = ["#c9a34e", "#7f4a3e", "#4f7c59"].map(
    (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.72 })
  );

  const water = new THREE.Mesh(new THREE.BoxGeometry(66, 0.12, 10), waterMat);
  water.position.set(0, 0.03, -18);
  group.add(water);

  const dock = new THREE.Mesh(new THREE.BoxGeometry(38, 0.55, 6), woodMat);
  dock.position.set(0, 0.35, -12);
  group.add(dock);

  for (const [index, x] of [-18, 0, 18].entries()) {
    const stall = new THREE.Group();
    stall.position.set(x, 0, 4);
    const counter = new THREE.Mesh(new THREE.BoxGeometry(9, 2, 4), woodMat);
    counter.position.y = 1;
    stall.add(counter);
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.8, 5.6), clothMats[index]);
    canopy.position.y = 3.4;
    stall.add(canopy);
    group.add(stall);
  }

  for (const npc of TRADE_NPCS) {
    const npcMesh = createTradeNpc(npc);
    group.add(npcMesh);
    world.tradeNpcs.push(npcMesh);
  }
}

function addMillfieldInterior(group) {
  const wheatMat = new THREE.MeshStandardMaterial({ color: "#d8b955", roughness: 0.78 });
  const soilMat = new THREE.MeshStandardMaterial({ color: "#4b3322", roughness: 0.95 });
  const barnMat = new THREE.MeshStandardMaterial({ color: "#8f3f2d", roughness: 0.8 });

  for (const x of [-20, -12, -4, 4, 12, 20]) {
    const row = new THREE.Mesh(new THREE.BoxGeometry(3, 0.12, 30), soilMat);
    row.position.set(x, 0.07, 0);
    group.add(row);

    for (const z of [-12, -6, 0, 6, 12]) {
      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.1, 5), wheatMat);
      stalk.position.set(x, 1.05, z);
      group.add(stalk);
    }
  }

  const barn = new THREE.Mesh(new THREE.BoxGeometry(13, 6, 9), barnMat);
  barn.position.set(0, 3, -16);
  group.add(barn);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(9, 5, 4), new THREE.MeshStandardMaterial({ color: "#4a2620", roughness: 0.8 }));
  roof.position.set(0, 8.1, -16);
  roof.rotation.y = Math.PI * 0.25;
  group.add(roof);
}

function addBlackridgeInterior(group) {
  const oreMat = new THREE.MeshStandardMaterial({ color: "#5d6674", roughness: 0.68, metalness: 0.28 });
  const stoneMat = new THREE.MeshStandardMaterial({ color: "#36373a", roughness: 0.92 });
  const fireMat = new THREE.MeshStandardMaterial({ color: "#f18446", emissive: "#9f2e19", emissiveIntensity: 1.2 });
  const woodMat = new THREE.MeshStandardMaterial({ color: "#5a3520", roughness: 0.82 });

  const mineMouth = new THREE.Mesh(new THREE.BoxGeometry(15, 9, 2), stoneMat);
  mineMouth.position.set(0, 4.5, -21);
  group.add(mineMouth);

  for (const x of [-20, -12, 13, 22]) {
    const ore = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2 + Math.random()), oreMat);
    ore.position.set(x, 1.2, -8 + Math.random() * 18);
    ore.rotation.set(Math.random(), Math.random(), Math.random());
    group.add(ore);
  }

  const forge = new THREE.Mesh(new THREE.BoxGeometry(8, 3, 5), stoneMat);
  forge.position.set(-12, 1.5, 7);
  group.add(forge);
  const fire = new THREE.Mesh(new THREE.ConeGeometry(1.6, 3.4, 10), fireMat);
  fire.position.set(-12, 4.2, 7);
  group.add(fire);
  const anvil = new THREE.Mesh(new THREE.BoxGeometry(5, 1.2, 2.4), oreMat);
  anvil.position.set(12, 1.2, 7);
  group.add(anvil);

  for (const x of [-6, 6]) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(1, 8, 1), woodMat);
    beam.position.set(x, 4, -20);
    group.add(beam);
  }
}

function addDungeonInterior(group) {
  const stoneMat = new THREE.MeshStandardMaterial({ color: "#24262b", roughness: 0.96 });
  const runeMat = new THREE.MeshStandardMaterial({ color: "#7d54b8", emissive: "#30145d", emissiveIntensity: 1.15 });
  const goldMat = new THREE.MeshStandardMaterial({ color: "#caa44b", roughness: 0.42, metalness: 0.18 });
  const boneMat = new THREE.MeshStandardMaterial({ color: "#b8aa8d", roughness: 0.9 });

  for (const [x, z] of [[-42, -28], [42, -28], [-42, 20], [42, 20], [-20, -40], [20, -40], [-20, 32], [20, 32]]) {
    const column = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 2, 10, 8), stoneMat);
    column.position.set(x, 5, z);
    group.add(column);
  }

  const dais = new THREE.Mesh(new THREE.CylinderGeometry(9, 10, 1.2, 16), stoneMat);
  dais.position.set(0, 0.6, -18);
  group.add(dais);

  const relic = new THREE.Mesh(new THREE.OctahedronGeometry(2.2), runeMat);
  relic.position.set(0, 4.2, -18);
  group.add(relic);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(12, 0.16, 8, 72),
    new THREE.MeshBasicMaterial({ color: "#9b6be5", transparent: true, opacity: 0.65 })
  );
  ring.position.set(0, 1.35, -18);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  for (const [x, z] of [[-34, 4], [34, 4], [-14, 28], [14, 28]]) {
    const chest = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 2.6), goldMat);
    chest.position.set(x, 1, z);
    group.add(chest);
  }

  for (const [x, z] of [[-32, -6], [30, -8], [-8, 12], [12, 34], [-44, 28]]) {
    const bone = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 4, 6), boneMat);
    bone.position.set(x, 0.35, z);
    bone.rotation.set(Math.PI * 0.5, 0, Math.random() * Math.PI);
    group.add(bone);
  }

  if (GAME_FLAGS.pve) {
    for (const spawn of DUNGEON_ENEMY_SPAWNS.slice(0, getPveMobCap())) {
      group.add(createPveEnemy(spawn));
    }
  }
}

function getOnlinePlayerCount() {
  if (!world.multiplayer.enabled) {
    return 1;
  }

  return Math.max(1, 1 + world.remotePlayers.size);
}

function getOnlineRenownTotal() {
  const remoteRenown = [...world.remotePlayers.values()].reduce(
    (sum, remote) => sum + Math.max(0, Number(remote.snapshot?.renown) || 0),
    0
  );

  return Math.max(0, state.player.renown + remoteRenown);
}

function getPveMobCap() {
  return Math.max(1, getOnlinePlayerCount() * 4);
}

function getAlivePveMobCount() {
  if (world.sceneMode === "poiInterior" && world.activePoiInteriorId === "ebon-hollow") {
    return world.pveEnemies.filter((enemy) => !enemy.dead).length;
  }

  if (world.sceneMode === "outdoor") {
    return world.outdoorMonsters.filter((enemy) => !enemy.dead).length;
  }

  return [...world.pveEnemies, ...world.outdoorMonsters].filter((enemy) => !enemy.dead).length;
}

function createRandomPveWeapon() {
  const definition = randomItem(PVE_WEAPON_DEFINITIONS);
  const baseStats = WEAPON_STATS[definition.type];
  const renownCap = Math.max(1, Math.floor(getOnlineRenownTotal()));
  const quality = randomBetween(0.45, 1);
  const maxDurability = Math.round(clamp(definition.maxDurability * randomBetween(0.72, 1.18), 25, renownCap + 80));
  const weapon = {
    range: roundStat(clamp(baseStats.range * randomBetween(0.75, 1.2), 0.8, renownCap)),
    damage: Math.round(clamp(baseStats.damage * quality * randomBetween(0.72, 1.25), 1, renownCap)),
    penetration: Math.round(clamp(baseStats.penetration * quality * randomBetween(0.65, 1.25), 0, renownCap)),
    frequency: roundStat(clamp(baseStats.frequency * randomBetween(0.75, 1.2), 0.35, Math.min(2.4, renownCap))),
    speed: roundStat(clamp(baseStats.speed * randomBetween(0.75, 1.2), 0.45, Math.min(2.4, renownCap))),
    knockback: roundStat(clamp(baseStats.knockback * quality * randomBetween(0.65, 1.35), 0, renownCap))
  };

  return {
    id: createId("mob-weapon"),
    name: `${randomItem(PVE_WEAPON_PREFIXES)} ${definition.type}`,
    type: definition.type,
    category: "Weapon",
    rarity: getPveWeaponRarity(renownCap, weapon),
    weapon,
    durability: maxDurability,
    maxDurability
  };
}

function createRandomPveArmor(slot = null) {
  const armorType = slot
    ? PVE_ARMOR_TYPES.find((entry) => entry.slot === slot)
    : randomItem(PVE_ARMOR_TYPES);

  if (!armorType) {
    return null;
  }

  const material = getRandomPveArmorMaterial();
  const renownCap = Math.max(1, Math.floor(getOnlineRenownTotal()));
  const quality = randomBetween(0.86, 1.18);
  const tierBudget = material.tier * 4 + Math.sqrt(renownCap);
  const baseDurability = 60 + armorType.toughness * 7 + material.tier * 8;
  const maxDurability = Math.round(clamp(baseDurability * material.durability * randomBetween(0.82, 1.2), 35, tierBudget + 125));
  const armor = {
    slot: armorType.slot,
    material: material.name,
    color: material.color,
    metalness: material.metalness,
    defense: roundStat(clamp(armorType.defense * material.defense * quality, 1, tierBudget)),
    resistance: roundStat(clamp(armorType.resistance * material.resistance * quality + material.tier * 0.7, 1, 35)),
    toughness: roundStat(clamp(armorType.toughness * material.toughness * quality, 1, tierBudget)),
    weight: roundStat(armorType.weight * (0.75 + material.tier * 0.12))
  };

  return {
    id: createId("mob-armor"),
    name: `${material.name} ${armorType.type}`,
    type: armorType.type,
    category: "Armor",
    rarity: getPveArmorRarity(material, armor),
    weapon: null,
    armor,
    durability: maxDurability,
    maxDurability
  };
}

function createRandomPveArmorSet() {
  return PVE_ARMOR_TYPES
    .filter(() => Math.random() < 0.58)
    .map((entry) => createRandomPveArmor(entry.slot))
    .filter(Boolean);
}

function getRandomPveArmorMaterial() {
  const renownCap = Math.max(1, Math.floor(getOnlineRenownTotal()));
  const tierCap = clamp(Math.floor(renownCap / 45) + 2, 2, PVE_ARMOR_MATERIALS.length);
  const pool = PVE_ARMOR_MATERIALS.filter((material) => material.tier <= tierCap);
  const weighted = [];

  for (const material of pool) {
    const weight = Math.max(1, tierCap - material.tier + 1);
    for (let index = 0; index < weight; index += 1) {
      weighted.push(material);
    }
  }

  return randomItem(weighted);
}

function getPveWeaponRarity(renownCap, stats) {
  const rating = stats.damage + stats.penetration + stats.range + stats.knockback;
  const ratio = renownCap > 0 ? rating / renownCap : 0;

  if (ratio > 1.85) return "Relic";
  if (ratio > 1.35) return "Epic";
  if (ratio > 0.85) return "Rare";
  if (ratio > 0.45) return "Uncommon";
  return "Common";
}

function getPveArmorRarity(material, stats) {
  const rating = stats.defense + stats.toughness * 0.6 + stats.resistance * 0.8;
  const tierBonus = material.tier * 4;
  const score = rating + tierBonus;

  if (score > 58) return "Relic";
  if (score > 43) return "Epic";
  if (score > 30) return "Rare";
  if (score > 19) return "Uncommon";
  return "Common";
}

function roundStat(value) {
  return Math.round(value * 100) / 100;
}

function cloneDroppedWeapon(item) {
  return {
    ...item,
    id: createId("item"),
    weapon: { ...item.weapon },
    durability: item.maxDurability
  };
}

function cloneDroppedArmor(item) {
  return {
    ...item,
    id: createId("item"),
    armor: { ...item.armor },
    durability: item.maxDurability
  };
}

function getDroppedLootItems(enemy) {
  const droppedWeapon = enemy.weapon ? cloneDroppedWeapon(enemy.weapon) : null;
  const droppedArmor = (enemy.armor ?? []).map(cloneDroppedArmor);
  return [droppedWeapon, ...droppedArmor].filter(Boolean);
}

function spawnDroppedLootItems(items, position, sourceName = "mob") {
  if (!items.length || world.sceneMode !== "outdoor") {
    return;
  }

  const baseX = Number(position?.x) || 0;
  const baseZ = Number(position?.z) || 0;

  items.forEach((item, index) => {
    const angle = (index / Math.max(1, items.length)) * Math.PI * 2 + randomBetween(-0.28, 0.28);
    const radius = items.length === 1 ? 0.45 : randomBetween(0.75, 1.95);
    const x = baseX + Math.cos(angle) * radius;
    const z = baseZ + Math.sin(angle) * radius;
    const groundY = getTerrainHeightAt(x, z);
    const dropId = createId("drop");
    const mesh = createDroppedItemMesh(item, dropId);

    mesh.position.set(x, groundY + 0.22, z);
    mesh.rotation.y = angle + Math.PI * 0.5;
    addOutdoor(mesh);
    world.droppedItems.push({
      id: dropId,
      item,
      mesh,
      position: { x, z },
      baseY: groundY + 0.22,
      phase: Math.random() * Math.PI * 2,
      sourceName
    });
  });

  document.body.dataset.droppedItems = String(world.droppedItems.length);
}

function createDroppedItemMesh(item, dropId) {
  const group = new THREE.Group();
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: item.weapon ? "#f2c45d" : "#8fc4ff",
    transparent: true,
    opacity: 0.68,
    depthWrite: false
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.035, 8, 38), ringMaterial);
  ring.rotation.x = Math.PI * 0.5;
  ring.position.y = 0.08;
  group.add(ring);

  const hitbox = new THREE.Mesh(
    new THREE.CylinderGeometry(1.25, 1.25, 1.15, 16),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.001, depthWrite: false })
  );
  hitbox.position.y = 0.6;
  group.add(hitbox);

  const visual = item.weapon ? createDroppedWeaponVisual(item) : createDroppedArmorVisual(item);
  visual.position.y = 0.42;
  group.add(visual);

  group.userData.droppedItemId = dropId;
  group.traverse((child) => {
    child.userData.droppedItemRoot = group;
    child.userData.droppedItemId = dropId;
  });

  return group;
}

function createDroppedWeaponVisual(item) {
  const visual = new THREE.Group();
  const weapon = createHeldItemMesh(item, "right");
  weapon.position.set(0, 0, 0);
  visual.add(weapon);
  visual.scale.setScalar(0.52);
  visual.rotation.set(0.04, 0.35, -0.75);
  return visual;
}

function createDroppedArmorVisual(item) {
  const group = new THREE.Group();
  const profile = getArmorMaterialProfile(item);
  const material = new THREE.MeshStandardMaterial({
    color: profile.color,
    roughness: profile.metalness > 0.25 ? 0.38 : 0.76,
    metalness: profile.metalness
  });
  const trim = new THREE.MeshStandardMaterial({ color: "#d9d2b5", roughness: 0.5, metalness: 0.18 });
  const slot = item.armor?.slot;

  if (slot === "head") {
    const helm = new THREE.Mesh(new THREE.SphereGeometry(0.46, 16, 10), material);
    helm.scale.y = 0.72;
    helm.castShadow = true;
    group.add(helm);
  } else if (slot === "chest") {
    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.7, 0.38), material);
    chest.castShadow = true;
    group.add(chest);
  } else if (slot === "gloves") {
    for (const side of [-1, 1]) {
      const glove = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.28, 0.32), material);
      glove.position.x = side * 0.28;
      glove.castShadow = true;
      group.add(glove);
    }
  } else if (slot === "feet") {
    for (const side of [-1, 1]) {
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.25, 0.56), material);
      boot.position.x = side * 0.24;
      boot.castShadow = true;
      group.add(boot);
    }
  } else {
    const bundle = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.42, 0.46), material);
    bundle.castShadow = true;
    group.add(bundle);
  }

  const clasp = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.5), trim);
  clasp.position.y = 0.05;
  clasp.castShadow = true;
  group.add(clasp);
  group.rotation.set(-0.18, 0, 0.22);
  return group;
}

function getPveAttackRange(weaponItem, fallback = 2.4) {
  if (!weaponItem?.weapon) {
    return fallback;
  }

  const range = weaponItem.weapon.range;
  return isProjectileWeapon(weaponItem.type) ? Math.min(16, Math.max(fallback, range * 0.8)) : Math.max(fallback, range);
}

function getPveAttackCooldown(weaponItem, fallback = 1.4) {
  const frequency = weaponItem?.weapon?.frequency;
  return frequency ? Math.max(0.55, 1 / frequency) : fallback;
}

function createPveEnemyWeaponMesh(weaponItem) {
  const mount = new THREE.Group();
  const mesh = createHeldItemMesh(weaponItem, "right");
  mount.name = "pveWeaponVisual";
  mount.add(mesh);
  mount.position.set(1.05, 2.65, 0.25);
  mount.rotation.set(0.08, -0.08, -0.55);
  mount.scale.setScalar(0.82);
  return mount;
}

function resetPveEnemyAttackState(enemy) {
  enemy.attackAnimation = null;
  resetPveEnemyWeaponPose(enemy);
}

function resetPveEnemyWeaponPose(enemy) {
  const weapon = enemy?.mesh?.getObjectByName("pveWeaponVisual");

  if (!weapon) {
    return;
  }

  weapon.position.set(1.05, 2.65, 0.25);
  weapon.rotation.set(0.08, -0.08, -0.55);
  weapon.scale.setScalar(0.82);
}

function createPveEnemyArmorMesh(armorItems = []) {
  const group = new THREE.Group();
  group.name = "pveArmorVisual";

  for (const item of armorItems) {
    if (!item?.armor) {
      continue;
    }

    const profile = getArmorMaterialProfile(item);
    const material = new THREE.MeshStandardMaterial({
      color: profile.color,
      roughness: profile.metalness > 0.25 ? 0.36 : 0.76,
      metalness: profile.metalness
    });

    if (item.armor.slot === "head") {
      const helm = new THREE.Mesh(new THREE.SphereGeometry(0.58, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.58), material);
      helm.position.y = 4.48;
      helm.scale.set(1.06, 0.72, 1.02);
      group.add(helm);
    } else if (item.armor.slot === "chest") {
      const chest = new THREE.Mesh(new THREE.BoxGeometry(1.42, 1.55, 0.28), material);
      chest.position.set(0, 3.02, 0.72);
      group.add(chest);

      const back = new THREE.Mesh(new THREE.BoxGeometry(1.34, 1.42, 0.2), material);
      back.position.set(0, 3.02, -0.72);
      group.add(back);
    } else if (item.armor.slot === "gloves") {
      for (const side of [-1, 1]) {
        const glove = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), material);
        glove.position.set(side * 0.86, 2.45, 0.2);
        glove.scale.set(1.25, 0.82, 1);
        group.add(glove);
      }
    } else if (item.armor.slot === "feet") {
      for (const side of [-1, 1]) {
        const boot = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.26, 0.72), material);
        boot.position.set(side * 0.34, 1.06, 0.16);
        group.add(boot);
      }
    }
  }

  group.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return group;
}

function setPveEnemyWeapon(enemy, weaponItem) {
  const current = enemy.mesh.getObjectByName("pveWeaponVisual");

  if (current) {
    enemy.mesh.remove(current);
  }

  enemy.weapon = weaponItem;
  enemy.attackRange = getPveAttackRange(weaponItem, enemy.attackRange ?? 2.4);
  enemy.attackCooldown = getPveAttackCooldown(weaponItem, enemy.attackCooldown ?? 1.4);
  resetPveEnemyAttackState(enemy);
  const visual = createPveEnemyWeaponMesh(weaponItem);
  visual.traverse((child) => {
    child.userData.pveEnemyId = enemy.id;
    child.userData.statusEntityKey = getPveStatusKey(enemy.id);
    if (child.isMesh) {
      child.castShadow = true;
    }
  });
  enemy.mesh.add(visual);
}

function setPveEnemyArmor(enemy, armorItems = []) {
  const current = enemy.mesh.getObjectByName("pveArmorVisual");

  if (current) {
    enemy.mesh.remove(current);
  }

  enemy.armor = armorItems;
  const visual = createPveEnemyArmorMesh(armorItems);
  visual.traverse((child) => {
    child.userData.pveEnemyId = enemy.id;
    child.userData.statusEntityKey = getPveStatusKey(enemy.id);
  });
  enemy.mesh.add(visual);
}

function createPveEnemy(spawn) {
  const group = new THREE.Group();
  const id = `pve-${world.pveEnemySeq}`;
  world.pveEnemySeq += 1;
  group.name = id;
  group.position.set(spawn.position.x, 0, spawn.position.z);

  const cloth = new THREE.MeshStandardMaterial({ color: spawn.color, roughness: 0.74 });
  const skin = new THREE.MeshStandardMaterial({ color: "#9d8b74", roughness: 0.86 });
  const mobWeapon = createRandomPveWeapon();
  const mobArmor = createRandomPveArmorSet();

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.85, 2.2, 5, 12), cloth);
  body.position.y = 2.75;
  group.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.52, 14, 10), skin);
  head.position.y = 4.35;
  group.add(head);

  group.add(createPveEnemyWeaponMesh(mobWeapon));
  group.add(createPveEnemyArmorMesh(mobArmor));

  const healthBar = createHealthBarSprite(spawn.name);
  healthBar.name = "healthBar";
  healthBar.position.set(0, PVE_STATUS_BAR_HEIGHT, 0);
  healthBar.scale.set(4.7, 1.58, 1);
  healthBar.visible = false;
  group.add(healthBar);

  group.traverse((child) => {
    child.userData.pveEnemyId = id;
    if (child.isMesh) {
      child.castShadow = true;
    }
  });
  tagEntityStatusTarget(group, getPveStatusKey(id));

  world.pveEnemies.push({
    id,
    name: spawn.name,
    mesh: group,
    healthBar,
    hp: spawn.hp,
    maxHp: spawn.hp,
    spawn: { ...spawn.position },
    weapon: mobWeapon,
    armor: mobArmor,
    radius: 1.15,
    speed: spawn.hp >= 80 ? 5.4 : 6.7,
    knockbackVelocity: new THREE.Vector3(0, 0, 0),
    attackRange: getPveAttackRange(mobWeapon, 2.4),
    attackCooldown: getPveAttackCooldown(mobWeapon, 1.4),
    attackTimer: Math.random() * 0.8,
    attackAnimation: null,
    dead: false,
    deathTimer: 0
  });

  return group;
}

function spawnOutdoorDungeonMonster() {
  if (!GAME_FLAGS.pve) {
    return;
  }

  if (getAlivePveMobCount() >= getPveMobCap()) {
    return;
  }

  const dungeon = state.pois.find((poi) => poi.id === "ebon-hollow");

  if (!dungeon) {
    return;
  }

  const template = OUTDOOR_DUNGEON_MONSTERS[world.outdoorMonsterSeq % OUTDOOR_DUNGEON_MONSTERS.length];
  const angle = (world.outdoorMonsterSeq * 2.399963 + state.elapsed * 0.37) % (Math.PI * 2);
  const spawnDistance = 9 + (world.outdoorMonsterSeq % 4) * 1.7;
  const spawn = {
    x: dungeon.position.x + Math.cos(angle) * spawnDistance,
    z: dungeon.position.z + Math.sin(angle) * spawnDistance
  };
  const id = `outdoor-monster-${world.outdoorMonsterSeq}`;
  world.outdoorMonsterSeq += 1;
  const mobWeapon = createRandomPveWeapon();
  const mobArmor = createRandomPveArmorSet();

  const mesh = createMonsterMesh({
    id,
    name: template.name,
    color: template.color,
    position: spawn,
    weapon: mobWeapon,
    armor: mobArmor
  });

  const monster = {
    id,
    name: template.name,
    mesh,
    healthBar: mesh.getObjectByName("healthBar"),
    hp: template.hp,
    maxHp: template.hp,
    weapon: mobWeapon,
    armor: mobArmor,
    spawn,
    radius: template.radius,
    speed: template.speed,
    knockbackVelocity: new THREE.Vector3(0, 0, 0),
    attackRange: getPveAttackRange(mobWeapon, 2.55),
    attackCooldown: getPveAttackCooldown(mobWeapon, 1.25),
    attackTimer: Math.random() * 0.6,
    attackAnimation: null,
    aggro: false,
    roamAngle: angle,
    dead: false,
    deathTimer: 0
  };

  world.outdoorMonsters.push(monster);
  addOutdoor(mesh);
  updatePveEnemyHealthBar(monster);
}

function createMonsterMesh({ id, name, color, position, weapon, armor = [] }) {
  const group = new THREE.Group();
  group.name = id;
  group.position.set(position.x, getTerrainHeightAt(position.x, position.z), position.z);

  const cloth = new THREE.MeshStandardMaterial({ color, roughness: 0.74 });
  const skin = new THREE.MeshStandardMaterial({ color: "#9d8b74", roughness: 0.86 });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.85, 2.2, 5, 12), cloth);
  body.position.y = 2.75;
  group.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.52, 14, 10), skin);
  head.position.y = 4.35;
  group.add(head);

  if (weapon) {
    group.add(createPveEnemyWeaponMesh(weapon));
  }

  group.add(createPveEnemyArmorMesh(armor));

  const healthBar = createHealthBarSprite(name);
  healthBar.name = "healthBar";
  healthBar.position.set(0, PVE_STATUS_BAR_HEIGHT, 0);
  healthBar.scale.set(4.7, 1.58, 1);
  healthBar.visible = false;
  group.add(healthBar);

  group.traverse((child) => {
    child.userData.pveEnemyId = id;
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  tagEntityStatusTarget(group, getPveStatusKey(id));

  return group;
}

function createTradeNpc(npc) {
  const group = new THREE.Group();
  group.name = `${npc.id}TradeNpc`;
  group.position.set(npc.position.x, getTerrainHeightAt(npc.position.x, npc.position.z), npc.position.z);
  group.rotation.y = npc.position.z < 0 ? 0 : Math.PI;

  const resource = RESOURCE_LOOKUP[npc.resourceId];
  const cloth = new THREE.MeshStandardMaterial({ color: npc.color, roughness: 0.72 });
  const skin = new THREE.MeshStandardMaterial({ color: "#d3b58f", roughness: 0.78 });
  const leather = new THREE.MeshStandardMaterial({ color: "#45301f", roughness: 0.86 });
  const tool = new THREE.MeshStandardMaterial({ color: resource.color, roughness: 0.5, metalness: npc.resourceId === "iron" ? 0.32 : 0.04 });

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(3.2, 0.18, 8, 48),
    new THREE.MeshBasicMaterial({ color: resource.color, transparent: true, opacity: 0.75 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.18;
  group.add(ring);

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.78, 1.85, 5, 12), cloth);
  body.position.y = 2.65;
  body.castShadow = true;
  group.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.48, 16, 12), skin);
  head.position.y = 4.12;
  head.castShadow = true;
  group.add(head);

  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.52, 0.45, 8), leather);
  cap.position.y = 4.6;
  cap.castShadow = true;
  group.add(cap);

  const crate = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.3, 1.7), tool);
  crate.position.set(0, 0.72, 2.1);
  crate.castShadow = true;
  group.add(crate);

  const counter = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.55, 1.5), leather);
  counter.position.set(0, 1.42, 1.55);
  counter.castShadow = true;
  group.add(counter);

  addTradeNpcProp(group, npc.resourceId, tool, leather);

  const label = createTextSprite(npc.name, resource.color, 28);
  label.position.set(0, 6.2, 0);
  group.add(label);

  group.traverse((child) => {
    child.userData.tradeNpcId = npc.id;
    child.userData.resourceId = npc.resourceId;
  });

  return group;
}

function createStewardNpc() {
  const group = new THREE.Group();
  group.name = "factionStewardNpc";
  group.position.set(-18, 0, -9);
  group.rotation.y = Math.PI * 0.2;

  const robe = new THREE.MeshStandardMaterial({ color: "#4d5f76", roughness: 0.76 });
  const skin = new THREE.MeshStandardMaterial({ color: "#d3b58f", roughness: 0.78 });
  const leather = new THREE.MeshStandardMaterial({ color: "#3f2a1a", roughness: 0.86 });
  const parchment = new THREE.MeshStandardMaterial({ color: "#d9c38d", roughness: 0.72 });
  const gold = new THREE.MeshStandardMaterial({ color: "#caa44b", roughness: 0.42, metalness: 0.18 });

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(3.3, 0.18, 8, 48),
    new THREE.MeshBasicMaterial({ color: "#d6a542", transparent: true, opacity: 0.75 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.18;
  group.add(ring);

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.82, 1.9, 5, 12), robe);
  body.position.y = 2.65;
  body.castShadow = true;
  group.add(body);

  const sash = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.22, 1.05), gold);
  sash.position.y = 2.58;
  sash.castShadow = true;
  group.add(sash);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12), skin);
  head.position.y = 4.14;
  head.castShadow = true;
  group.add(head);

  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.35, 10), leather);
  cap.position.y = 4.58;
  cap.castShadow = true;
  group.add(cap);

  const ledger = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.2, 1.8), parchment);
  ledger.position.set(0, 1.9, 1.5);
  ledger.rotation.x = -0.18;
  ledger.castShadow = true;
  group.add(ledger);

  const coffer = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.35, 1.7), leather);
  coffer.position.set(0, 0.74, 2.15);
  coffer.castShadow = true;
  group.add(coffer);

  const cofferBand = new THREE.Mesh(new THREE.BoxGeometry(2.76, 0.22, 1.82), gold);
  cofferBand.position.set(0, 1.24, 2.15);
  cofferBand.castShadow = true;
  group.add(cofferBand);

  const label = createTextSprite("Steward", "#d6a542", 30);
  label.position.set(0, 6.2, 0);
  group.add(label);

  group.traverse((child) => {
    child.userData.stewardNpc = true;
  });

  return group;
}

function addTradeNpcProp(group, resourceId, material, darkMaterial) {
  if (resourceId === "wood") {
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.3, 8), darkMaterial);
    handle.position.set(-1.35, 2.45, 0.95);
    handle.rotation.z = -0.55;
    group.add(handle);
    const axeHead = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.45, 0.18), material);
    axeHead.position.set(-1.82, 3.22, 0.95);
    axeHead.rotation.z = -0.55;
    group.add(axeHead);
  } else if (resourceId === "stone") {
    for (const offset of [-0.55, 0.1, 0.65]) {
      const block = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55), material);
      block.position.set(offset, 1.95, 1.55 + Math.abs(offset) * 0.35);
      block.castShadow = true;
      group.add(block);
    }
  } else if (resourceId === "wheat") {
    for (const offset of [-0.38, 0, 0.38]) {
      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.7, 5), material);
      stalk.position.set(offset, 2.45, 1.15);
      stalk.rotation.z = offset * 0.5;
      group.add(stalk);
      const grain = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.42, 6), material);
      grain.position.set(offset * 1.18, 3.32, 1.15);
      grain.rotation.z = offset * 0.5;
      group.add(grain);
    }
  } else if (resourceId === "iron") {
    const anvil = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.55, 0.75), material);
    anvil.position.set(1.25, 1.95, 1.15);
    anvil.castShadow = true;
    group.add(anvil);
    const hammer = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.25, 0.25), darkMaterial);
    hammer.position.set(-1.15, 2.15, 1.15);
    hammer.rotation.z = 0.55;
    group.add(hammer);
  }
}

function createPlayerMesh() {
  const group = new THREE.Group();
  const visualRoot = new THREE.Group();
  group.add(visualRoot);
  const tunic = new THREE.MeshStandardMaterial({ color: "#c9b88f", roughness: 0.72, metalness: 0.04 });
  const skin = new THREE.MeshStandardMaterial({ color: "#d7bf9b", roughness: 0.78 });
  const leather = new THREE.MeshStandardMaterial({ color: "#523722", roughness: 0.85 });
  const dark = new THREE.MeshStandardMaterial({ color: "#15130f", roughness: 0.6 });
  const steel = new THREE.MeshStandardMaterial({ color: "#656b72", roughness: 0.45, metalness: 0.2 });

  const body = createPlayerTorso(tunic, leather);
  body.position.y = 3.15;
  visualRoot.add(body);

  const chest = createPlayerChestAccent(tunic, leather);
  chest.position.set(0, 3.65, 0);
  visualRoot.add(chest);

  const belt = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.22, 1.08), leather);
  belt.position.y = 2.55;
  belt.castShadow = true;
  visualRoot.add(belt);

  const leftLeg = createPlayerLeg(HAND_CONFIG.left.side, leather, dark);
  const rightLeg = createPlayerLeg(HAND_CONFIG.right.side, leather, dark);
  visualRoot.add(leftLeg, rightLeg);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 5.2, 0.16);
  visualRoot.add(headGroup);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.44, 12), skin);
  neck.position.set(0, -0.5, -0.02);
  neck.castShadow = true;
  headGroup.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.58, 16, 12), skin);
  head.castShadow = true;
  headGroup.add(head);

  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), dark);
    eye.position.set(side * 0.22, 0.08, 0.52);
    headGroup.add(eye);
  }

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.34, 8), skin);
  nose.position.set(0, -0.04, 0.64);
  nose.rotation.x = Math.PI * 0.5;
  nose.castShadow = true;
  headGroup.add(nose);

  const helm = new THREE.Mesh(
    new THREE.ConeGeometry(0.62, 0.72, 8),
    steel
  );
  helm.position.set(0, 0.58, -0.06);
  helm.castShadow = true;
  headGroup.add(helm);

  const crown = createPlayerCrown();
  crown.visible = false;
  headGroup.add(crown);

  const leftArm = createPlayerArm(HAND_CONFIG.left.side, skin, leather);
  const rightArm = createPlayerArm(HAND_CONFIG.right.side, skin, leather);
  visualRoot.add(leftArm, rightArm);

  const healthBar = createHealthBarSprite(state.player.name);
  healthBar.position.set(0, LOCAL_STATUS_BAR_HEIGHT, 0);
  healthBar.visible = false;
  group.add(healthBar);

  world.leftHandMount = new THREE.Group();
  world.leftHandMount.position.set(...HAND_CONFIG.left.basePosition);
  world.leftHandMount.rotation.set(...HAND_CONFIG.left.baseRotation);
  getPlayerHandAnchor(leftArm).add(world.leftHandMount);

  world.rightHandMount = new THREE.Group();
  world.rightHandMount.position.set(...HAND_CONFIG.right.basePosition);
  world.rightHandMount.rotation.set(...HAND_CONFIG.right.baseRotation);
  getPlayerHandAnchor(rightArm).add(world.rightHandMount);

  world.playerMesh = group;
  world.playerVisualRoot = visualRoot;
  world.playerRig = {
    visualRoot,
    body,
    chest,
    headGroup,
    head,
    helm,
    crown,
    leftArm,
    rightArm,
    leftForearm: leftArm.userData.forearm,
    rightForearm: rightArm.userData.forearm,
    leftHand: leftArm.userData.hand,
    rightHand: rightArm.userData.hand,
    leftLeg,
    rightLeg,
    leftShin: leftLeg.userData.shin,
    rightShin: rightLeg.userData.shin,
    leftFoot: leftLeg.userData.foot,
    rightFoot: rightLeg.userData.foot,
    healthBar
  };
  world.scene.add(group);
  updatePlayerHealthBar();
}

function createPlayerTorso(tunic, leather) {
  const torso = new THREE.Group();
  torso.name = "playerTorso";

  const hips = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.68, 0.5, 12), tunic);
  hips.position.y = -0.72;
  hips.scale.set(1.2, 1, 0.72);
  torso.add(hips);

  const abdomen = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.42, 0.82, 12), tunic);
  abdomen.position.y = -0.14;
  abdomen.scale.set(1.16, 1, 0.68);
  torso.add(abdomen);

  const ribcage = new THREE.Mesh(new THREE.CylinderGeometry(0.74, 0.5, 1.12, 14), tunic);
  ribcage.position.y = 0.58;
  ribcage.scale.set(1.22, 1, 0.7);
  torso.add(ribcage);

  const shoulders = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 1.4, 4, 10), tunic);
  shoulders.position.y = 1.16;
  shoulders.rotation.z = Math.PI * 0.5;
  shoulders.scale.z = 0.76;
  torso.add(shoulders);

  const waistWrap = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.56, 0.24, 12), leather);
  waistWrap.position.y = -0.58;
  waistWrap.scale.set(1.18, 1, 0.72);
  torso.add(waistWrap);

  torso.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return torso;
}

function createPlayerChestAccent(tunic, leather) {
  const chest = new THREE.Group();
  chest.name = "playerChestAccent";

  const front = new THREE.Mesh(new THREE.BoxGeometry(1.26, 1.32, 0.12), tunic);
  front.position.set(0, -0.1, 0.62);
  chest.add(front);

  const collar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.16, 0.16), leather);
  collar.position.set(0, 0.62, 0.66);
  chest.add(collar);

  const sash = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.24, 0.14), leather);
  sash.position.set(-0.28, -0.08, 0.69);
  sash.rotation.z = -0.18;
  chest.add(sash);

  chest.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return chest;
}

function createPlayerLeg(side, leather, dark) {
  const leg = new THREE.Group();
  leg.position.set(side * 0.42, 2.05, 0);

  const thighGroup = new THREE.Group();
  thighGroup.name = side > 0 ? "leftThighPivot" : "rightThighPivot";
  leg.add(thighGroup);

  const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.27, 0.78, 4, 10), leather);
  thigh.position.set(0, -0.42, 0.02);
  thigh.scale.set(1.04, 1, 0.9);
  thigh.castShadow = true;
  thighGroup.add(thigh);

  const knee = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), leather);
  knee.position.set(0, -0.88, 0.07);
  knee.scale.set(1.05, 0.78, 0.95);
  knee.castShadow = true;
  thighGroup.add(knee);

  const kneeCap = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), dark);
  kneeCap.position.set(0, -0.86, 0.24);
  kneeCap.scale.set(1.1, 0.64, 0.62);
  kneeCap.castShadow = true;
  thighGroup.add(kneeCap);

  const shinGroup = new THREE.Group();
  shinGroup.name = side > 0 ? "leftShinPivot" : "rightShinPivot";
  shinGroup.position.set(0, -0.9, 0.05);
  thighGroup.add(shinGroup);

  const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.21, 0.82, 4, 10), leather);
  shin.position.set(0, -0.42, 0.02);
  shin.scale.set(0.92, 1, 0.84);
  shin.castShadow = true;
  shinGroup.add(shin);

  const footGroup = new THREE.Group();
  footGroup.name = side > 0 ? "leftFootPivot" : "rightFootPivot";
  footGroup.position.set(0, -0.9, 0.2);
  shinGroup.add(footGroup);

  const ankle = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6), dark);
  ankle.position.set(0, 0.12, -0.02);
  ankle.scale.set(1.05, 0.72, 0.85);
  ankle.castShadow = true;
  footGroup.add(ankle);

  const boot = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.22, 0.78), dark);
  boot.position.set(0, -0.08, 0.19);
  boot.castShadow = true;
  footGroup.add(boot);

  leg.userData.thigh = thighGroup;
  leg.userData.shin = shinGroup;
  leg.userData.knee = knee;
  leg.userData.foot = footGroup;

  return leg;
}

function createPlayerCrown() {
  const group = new THREE.Group();
  const gold = new THREE.MeshStandardMaterial({ color: "#d6a542", roughness: 0.34, metalness: 0.28 });
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.045, 8, 18), gold);
  band.position.y = 0.66;
  band.rotation.x = Math.PI * 0.5;
  band.castShadow = true;
  group.add(band);

  for (let index = 0; index < 6; index += 1) {
    const angle = (index / 6) * Math.PI * 2;
    const point = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.34, 4), gold);
    point.position.set(Math.sin(angle) * 0.41, 0.82, Math.cos(angle) * 0.41);
    point.rotation.y = angle;
    point.castShadow = true;
    group.add(point);
  }

  group.name = "playerRulerCrown";
  return group;
}

function createPlayerArm(side, skin, leather) {
  const arm = new THREE.Group();
  arm.position.set(side * 1.08, 4.35, 0.22);
  arm.rotation.z = side * 0.16;

  const upperArm = new THREE.Group();
  upperArm.name = side > 0 ? "leftUpperArmPivot" : "rightUpperArmPivot";
  arm.add(upperArm);

  const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), leather);
  shoulder.position.set(0, -0.08, 0.02);
  shoulder.scale.set(1.05, 0.8, 0.9);
  shoulder.castShadow = true;
  upperArm.add(shoulder);

  const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 0.78, 4, 10), leather);
  sleeve.position.set(0, -0.44, 0.03);
  sleeve.scale.set(1.02, 1, 0.9);
  sleeve.castShadow = true;
  upperArm.add(sleeve);

  const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), skin);
  elbow.position.set(0, -0.9, 0.1);
  elbow.scale.set(1.04, 0.78, 0.9);
  elbow.castShadow = true;
  upperArm.add(elbow);

  const forearmGroup = new THREE.Group();
  forearmGroup.name = side > 0 ? "leftForearmPivot" : "rightForearmPivot";
  forearmGroup.position.set(0, -0.92, 0.1);
  upperArm.add(forearmGroup);

  const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.78, 4, 10), skin);
  forearm.position.set(0, -0.4, 0.04);
  forearm.scale.set(0.9, 1, 0.84);
  forearm.castShadow = true;
  forearmGroup.add(forearm);

  const handGroup = new THREE.Group();
  handGroup.name = side > 0 ? "leftHandPivot" : "rightHandPivot";
  handGroup.position.set(0, -0.84, 0.13);
  forearmGroup.add(handGroup);

  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), skin);
  hand.scale.set(1.05, 0.82, 1.08);
  hand.castShadow = true;
  handGroup.add(hand);

  arm.userData.upperArm = upperArm;
  arm.userData.forearm = forearmGroup;
  arm.userData.elbow = elbow;
  arm.userData.hand = handGroup;

  return arm;
}

function getPlayerHandAnchor(arm) {
  return arm?.userData?.hand ?? arm;
}

function createArmorVisualState() {
  return Object.fromEntries(ARMOR_VISUAL_SLOT_IDS.map((slotId) => [slotId, { itemId: null, meshes: [] }]));
}

function getArmorMaterialProfile(itemOrArmor) {
  const armor = itemOrArmor?.armor ?? itemOrArmor ?? {};
  const materialName = String(armor.material ?? "").trim();
  const materialKey = materialName.toLowerCase();
  const generatedProfile = PVE_ARMOR_MATERIALS.find((profile) => profile.name.toLowerCase() === materialKey);
  const fallbackProfile = ARMOR_MATERIAL_FALLBACKS[materialKey];
  const metalness = Number.isFinite(Number(armor.metalness))
    ? Number(armor.metalness)
    : generatedProfile?.metalness ?? fallbackProfile?.metalness ?? 0.16;

  return {
    material: materialName || "Unknown",
    color: armor.color ?? generatedProfile?.color ?? fallbackProfile?.color ?? "#858b8f",
    metalness: clamp(metalness, 0, 0.75)
  };
}

function createArmorVisualMaterial(item) {
  const profile = getArmorMaterialProfile(item);

  return new THREE.MeshStandardMaterial({
    color: profile.color,
    roughness: profile.metalness > 0.25 ? 0.36 : 0.76,
    metalness: profile.metalness
  });
}

function getArmorVisualItem(slotId) {
  const slot = BODY_EQUIP_SLOTS.find((entry) => entry.id === slotId);
  return slot ? getItemById(state.player.equipment[slot.stateKey]) : null;
}

function updatePlayerArmorVisuals() {
  if (!world.playerRig) {
    return;
  }

  for (const slotId of ARMOR_VISUAL_SLOT_IDS) {
    const item = getArmorVisualItem(slotId);
    syncArmorSlotVisual(world.playerArmorVisuals, world.playerRig, slotId, isArmorItem(item) && item.durability > 0 ? item : null);
  }
}

function syncArmorSlotVisual(visuals, rig, slotId, item, statusKey = null) {
  const visual = visuals[slotId];
  const nextItemId = item?.id ?? null;

  if (!visual || visual.itemId === nextItemId) {
    return;
  }

  for (const mesh of visual.meshes) {
    removeFromParent(mesh);
  }

  visual.itemId = nextItemId;
  visual.meshes = [];

  if (!item?.armor) {
    if (slotId === "head" && rig.helm) {
      rig.helm.visible = true;
    }
    return;
  }

  if (slotId === "head" && rig.helm) {
    rig.helm.visible = false;
  }

  for (const mount of getArmorSlotMounts(rig, slotId)) {
    const mesh = createPlayerArmorSlotMesh(item, slotId, mount.side);

    if (statusKey) {
      tagEntityStatusTarget(mesh, statusKey);
    }

    mount.parent.add(mesh);
    visual.meshes.push(mesh);
  }
}

function getArmorSlotMounts(rig, slotId) {
  if (slotId === "head") {
    return [{ parent: rig.headGroup, side: 0 }];
  }

  if (slotId === "chest") {
    return [{ parent: rig.body, side: 0 }];
  }

  if (slotId === "gloves") {
    return [
      { parent: rig.leftForearm ?? rig.leftArm, side: HAND_CONFIG.left.side },
      { parent: rig.rightForearm ?? rig.rightArm, side: HAND_CONFIG.right.side }
    ];
  }

  if (slotId === "feet") {
    return [
      { parent: rig.leftFoot ?? rig.leftLeg, side: HAND_CONFIG.left.side },
      { parent: rig.rightFoot ?? rig.rightLeg, side: HAND_CONFIG.right.side }
    ];
  }

  return [];
}

function createPlayerArmorSlotMesh(item, slotId, side = 0) {
  const group = new THREE.Group();
  const material = createArmorVisualMaterial(item);
  const trim = new THREE.MeshStandardMaterial({ color: "#d9d2b5", roughness: 0.48, metalness: 0.18 });

  if (slotId === "head") {
    const helm = new THREE.Mesh(new THREE.SphereGeometry(0.62, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.62), material);
    helm.position.set(0, 0.08, 0);
    group.add(helm);

    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.1, 0.12), trim);
    brow.position.set(0, 0.16, 0.48);
    group.add(brow);
  } else if (slotId === "chest") {
    const front = new THREE.Mesh(new THREE.BoxGeometry(1.42, 1.54, 0.18), material);
    front.position.set(0, 0.2, 0.6);
    group.add(front);

    const back = new THREE.Mesh(new THREE.BoxGeometry(1.32, 1.36, 0.16), material);
    back.position.set(0, 0.18, -0.5);
    group.add(back);

    for (const sideSign of [-1, 1]) {
      const sidePlate = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.18, 0.72), material);
      sidePlate.position.set(sideSign * 0.72, 0.14, 0.04);
      sidePlate.rotation.z = sideSign * 0.08;
      group.add(sidePlate);

      const shoulderGuard = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), material);
      shoulderGuard.position.set(sideSign * 0.74, 0.82, 0.18);
      shoulderGuard.scale.set(1.25, 0.42, 0.9);
      group.add(shoulderGuard);
    }

    const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.46, 0.08), trim);
    ridge.position.set(0, 0.2, 0.72);
    group.add(ridge);

    const fauld = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.28, 0.14), trim);
    fauld.position.set(0, -0.68, 0.58);
    group.add(fauld);
  } else if (slotId === "gloves") {
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.28, 10), material);
    cuff.position.set(0, -0.3, 0.05);
    group.add(cuff);

    const guard = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), material);
    guard.position.set(0, -0.82, 0.14);
    guard.scale.set(1, 0.68, 0.92);
    group.add(guard);
  } else if (slotId === "feet") {
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.82), material);
    boot.position.set(0, -0.02, 0.08);
    group.add(boot);

    const toe = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.16, 0.24), trim);
    toe.position.set(0, 0.02, 0.48);
    group.add(toe);
  }

  group.userData.armorVisual = true;
  group.userData.armorSlot = slotId;
  group.userData.armorSide = side;
  group.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return group;
}

function createRemotePlayerVisual(player) {
  const faction = player.factionId ? FACTION_LOOKUP[player.factionId] : null;
  const group = new THREE.Group();
  const tunic = new THREE.MeshStandardMaterial({ color: faction?.color ?? "#8f8067", roughness: 0.74, metalness: 0.04 });
  const skin = new THREE.MeshStandardMaterial({ color: "#d7bf9b", roughness: 0.78 });
  const leather = new THREE.MeshStandardMaterial({ color: "#523722", roughness: 0.85 });
  const dark = new THREE.MeshStandardMaterial({ color: "#15130f", roughness: 0.6 });
  const steel = new THREE.MeshStandardMaterial({ color: "#656b72", roughness: 0.45, metalness: 0.2 });

  group.name = `remotePlayer-${player.id}`;
  group.position.set(player.position.x, player.elevation ?? 0, player.position.z);
  group.rotation.y = player.rotation ?? 0;

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.45, 0.05, 6, 36),
    new THREE.MeshBasicMaterial({ color: faction?.accent ?? "#e7d3a1", transparent: true, opacity: 0.76 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.12;
  group.add(ring);

  const body = createPlayerTorso(tunic, leather);
  body.position.y = 3.15;
  group.add(body);

  const chest = createPlayerChestAccent(tunic, leather);
  chest.position.set(0, 3.65, 0);
  group.add(chest);

  const belt = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.22, 1.08), leather);
  belt.position.y = 2.55;
  group.add(belt);

  const leftLeg = createPlayerLeg(HAND_CONFIG.left.side, leather, dark);
  const rightLeg = createPlayerLeg(HAND_CONFIG.right.side, leather, dark);
  group.add(leftLeg, rightLeg);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 5.2, 0.16);
  group.add(headGroup);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.44, 12), skin);
  neck.position.set(0, -0.5, -0.02);
  headGroup.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.58, 16, 12), skin);
  headGroup.add(head);

  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), dark);
    eye.position.set(side * 0.22, 0.08, 0.52);
    headGroup.add(eye);
  }

  const helm = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.72, 8), steel);
  helm.position.set(0, 0.58, -0.06);
  headGroup.add(helm);

  const leftArm = createPlayerArm(HAND_CONFIG.left.side, skin, leather);
  const rightArm = createPlayerArm(HAND_CONFIG.right.side, skin, leather);
  group.add(leftArm, rightArm);

  const leftHandMount = new THREE.Group();
  leftHandMount.position.set(...HAND_CONFIG.left.basePosition);
  getPlayerHandAnchor(leftArm).add(leftHandMount);

  const rightHandMount = new THREE.Group();
  rightHandMount.position.set(...HAND_CONFIG.right.basePosition);
  getPlayerHandAnchor(rightArm).add(rightHandMount);

  const healthBar = createHealthBarSprite(player.name);
  healthBar.position.set(0, REMOTE_STATUS_BAR_HEIGHT, 0);
  healthBar.visible = false;
  group.add(healthBar);

  group.traverse((child) => {
    child.userData.remotePlayerId = player.id;
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  tagEntityStatusTarget(group, getRemotePlayerStatusKey(player.id));

  world.scene.add(group);

  const remote = {
    id: player.id,
    name: player.name,
    isRemotePlayer: true,
    mesh: group,
    group,
    radius: 1.15,
    hp: player.hp,
    maxHp: player.maxHp,
    dead: player.dead,
    healthBar,
    leftHandMount,
    rightHandMount,
    heldItems: {
      left: { itemKey: null, mesh: null },
      right: { itemKey: null, mesh: null }
    },
    rig: {
      body,
      chest,
      helm,
      headGroup,
      leftArm,
      rightArm,
      leftForearm: leftArm.userData.forearm,
      rightForearm: rightArm.userData.forearm,
      leftHand: leftArm.userData.hand,
      rightHand: rightArm.userData.hand,
      leftLeg,
      rightLeg,
      leftShin: leftLeg.userData.shin,
      rightShin: rightLeg.userData.shin,
      leftFoot: leftLeg.userData.foot,
      rightFoot: rightLeg.userData.foot
    },
    armorVisuals: createArmorVisualState(),
    motion: {
      amount: 0,
      gait: 0
    },
    snapshot: player,
    targetPosition: new THREE.Vector3(player.position.x, player.elevation ?? 0, player.position.z),
    targetRotation: player.rotation ?? 0,
    targetHeadRotation: player.headRotation ?? 0,
    lastDamagedAt: player.lastDamagedAt ?? 0
  };

  return remote;
}

function setupUi() {
  if (ui.houseNameInput) {
    ui.houseNameInput.value = sanitizeHouseName(state.player.houseName);
  }

  ui.factionCards.innerHTML = FACTIONS.map(
    (faction) => `
      <button class="faction-card" style="--faction-color: ${faction.color}66" data-faction="${faction.id}" type="button">
        <span class="trait">${faction.trait}</span>
        <h2>${faction.name}</h2>
        <p>${faction.summary}</p>
      </button>
    `
  ).join("");

  updateHouseNameGate();
  ui.houseNameInput?.addEventListener("input", () => {
    const sanitized = sanitizeHouseName(ui.houseNameInput.value);
    if (ui.houseNameInput.value !== sanitized) {
      ui.houseNameInput.value = sanitized;
    }
    updateHouseNameGate();
  });

  ui.factionCards.addEventListener("click", (event) => {
    const button = event.target.closest("[data-faction]");
    if (!button) {
      return;
    }

    const houseName = sanitizeHouseName(ui.houseNameInput?.value);

    if (!houseName) {
      flash("Choose a house name.");
      ui.houseNameInput?.focus();
      updateHouseNameGate();
      return;
    }

    try {
      localStorage.setItem("kok3d.houseName", houseName);
    } catch {
      // Local saves are optional; server persistence still receives the house name.
    }

    const result = joinFaction(state, button.dataset.faction, { houseName });
    runAction(result);

    if (result.ok) {
      ui.factionSelect.classList.add("is-hidden");
      ui.factionSelect.setAttribute("aria-hidden", "true");
      publishLocalPlayer(true);
    }
  });

  if (state.selectedFactionId && state.player.houseName) {
    ui.factionSelect.classList.add("is-hidden");
    ui.factionSelect.setAttribute("aria-hidden", "true");
  }

  document.querySelectorAll(".ruler-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".ruler-tab").forEach((entry) => entry.classList.remove("is-active"));
      document
        .querySelectorAll(".ruler-view")
        .forEach((entry) => entry.classList.remove("is-active"));
      tab.classList.add("is-active");
      document.querySelector(`[data-ruler-view="${tab.dataset.rulerPanel}"]`).classList.add("is-active");
    });
  });

  ui.hudFactionButton.addEventListener("click", () => {
    setRulerPanelOpen(ui.rulerPanel.classList.contains("is-hidden"), { leaveSeat: false });
  });
  ui.hudPlayerButton.addEventListener("click", () => {
    setInventoryPanelOpen(ui.inventoryPanel.classList.contains("is-hidden"));
  });
  ui.hudLoreButton.addEventListener("click", () => {
    setLoreScrollOpen(ui.loreScroll.classList.contains("is-hidden"));
  });
  ui.hudStatusButton.addEventListener("click", () => {
    setStatusPanelOpen(ui.statusPanel.classList.contains("is-hidden"));
  });
  ui.statusClose.addEventListener("click", () => {
    setStatusPanelOpen(false);
  });
  ui.inventoryClose.addEventListener("click", () => {
    setInventoryPanelOpen(false);
  });
  ui.buildClose.addEventListener("click", () => {
    setBuildPanelOpen(false);
  });
  ui.buildGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-building-type]");

    if (!button) {
      return;
    }

    world.selectedBuildingType = button.dataset.buildingType;
    renderBuildPanel();
  });
  ui.buildDetails.addEventListener("click", (event) => {
    const button = event.target.closest("[data-build-selected]");

    if (!button) {
      return;
    }

    startBuildingPlacement(world.selectedBuildingType);
  });
  ui.leaveInterior.addEventListener("click", () => {
    leaveCurrentInterior();
  });
  ui.npcTradeClose.addEventListener("click", () => {
    closeNpcTradePanel();
  });
  ui.npcTradeAmount.addEventListener("input", () => {
    renderNpcTradePanel();
  });
  ui.stewardClose.addEventListener("click", () => {
    closeStewardPanel();
  });
  ui.stewardAmount.addEventListener("input", () => {
    renderStewardPanel();
  });
  ui.depotClose.addEventListener("click", () => {
    closeDepotPanel();
  });
  ui.depotAmount.addEventListener("input", () => {
    renderDepotPanel();
  });
  ui.depotResourceList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-depot-resource]");
    if (!button) {
      return;
    }

    runAction(depositResourceToDepot(button.dataset.depotResource, getDepotAmount()));
  });
  ui.depotItemList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-depot-item]");
    if (!button) {
      return;
    }

    runAction(depositItemToDepot(button.dataset.depotItem));
  });
  ui.stewardDepositList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-deposit-resource]");
    if (!button) {
      return;
    }

    runAction(depositToFaction(state, button.dataset.depositResource, getStewardAmount()));
  });
  ui.npcBuyResource.addEventListener("click", () => {
    const npc = getActiveTradeNpc();
    if (!npc) {
      return;
    }

    runAction(buyResource(state, npc.resourceId, getTradeAmount()));
  });
  ui.npcSellResource.addEventListener("click", () => {
    const npc = getActiveTradeNpc();
    if (!npc) {
      return;
    }

    runAction(sellResource(state, npc.resourceId, getTradeAmount()));
  });
  ui.rulerClose.addEventListener("click", () => {
    setRulerPanelOpen(false);
  });
  ui.loreClose?.addEventListener("click", () => {
    setLoreScrollOpen(false);
  });
  ui.rulerPolitics.addEventListener("click", (event) => {
    const button = event.target.closest("[data-politics-action]");
    const factionId = state.selectedFactionId || world.interiorFactionId;

    if (!button || !factionId) {
      return;
    }

    const targetFactionId = button.dataset.targetFaction;
    const action = button.dataset.politicsAction;
    let result = null;

    if (action === "enemy") {
      result = setFactionRelation(state, factionId, targetFactionId, "Enemy");
    } else if (action === "neutral") {
      result = setFactionRelation(state, factionId, targetFactionId, "Neutral");
    } else if (action === "request") {
      result = requestFactionAllegiance(state, factionId, targetFactionId);
    } else if (action === "accept") {
      result = acceptFactionAllegiance(state, factionId, targetFactionId);
    }

    if (result) {
      runAction(result);
      renderRulerPanel();
    }
  });
  ui.leftHandIcon.parentElement.addEventListener("click", () => clearHand("left"));
  ui.rightHandIcon.parentElement.addEventListener("click", () => clearHand("right"));
  setupInventoryControls();

  window.addEventListener("keydown", (event) => {
    if (event.code === "KeyL" && !isTypingInField(event.target)) {
      event.preventDefault();
      if (!ui.factionSelect.classList.contains("is-hidden")) {
        return;
      }
      setLoreScrollOpen(ui.loreScroll.classList.contains("is-hidden"));
      return;
    }

    if (event.code === "KeyR" && !isTypingInField(event.target)) {
      event.preventDefault();
      if (!ui.factionSelect.classList.contains("is-hidden")) {
        return;
      }
      setInventoryPanelOpen(ui.inventoryPanel.classList.contains("is-hidden"));
      return;
    }

    if (event.code === "KeyB" && !isTypingInField(event.target)) {
      event.preventDefault();
      if (world.placement.active) {
        cancelBuildingPlacement();
        return;
      }

      if (!ui.factionSelect.classList.contains("is-hidden")) {
        return;
      }
      setBuildPanelOpen(ui.buildPanel.classList.contains("is-hidden"));
      return;
    }

    if (event.code === "Escape" && !ui.loreScroll.classList.contains("is-hidden") && !isTypingInField(event.target)) {
      event.preventDefault();
      setLoreScrollOpen(false);
      return;
    }

    if (event.code === "Escape" && world.placement.active && !isTypingInField(event.target)) {
      event.preventDefault();
      cancelBuildingPlacement();
      return;
    }

    if (event.code === "Space" && !isTypingInField(event.target)) {
      event.preventDefault();
      if (!event.repeat) {
        const startedLocationAction = startSpaceLocationAction();
        if (!startedLocationAction) {
          handleSpaceMovementAction();
        }
      }
      return;
    }

    if (["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight", "ShiftLeft"].includes(event.code)) {
      world.keys.add(event.code);
      event.preventDefault();
    }
  });

  window.addEventListener("keyup", (event) => {
    if (event.code === "Space") {
      stopSpaceLocationAction();
      event.preventDefault();
      return;
    }

    world.keys.delete(event.code);
  });

  canvas.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 && event.button !== 1 && event.button !== 2) {
      return;
    }

    event.preventDefault();
    world.pointer.insideCanvas = true;
    world.pointer.x = event.clientX;
    world.pointer.y = event.clientY;
    if (event.button === 1 && isDoubleMiddleClick()) {
      toggleThirdPersonCameraLock();
      world.pointer.dragging = false;
      world.pointer.cameraDragging = false;
      world.pointer.moved = false;
      world.pointer.suppressClickAction = true;
      world.pointer.button = event.button;
      world.pointer.downAt = performance.now();
      world.pointer.x = event.clientX;
      world.pointer.y = event.clientY;
      canvas.setPointerCapture(event.pointerId);
      return;
    }

    if (isLockedThirdPersonCamera() && event.button === 1) {
      world.pointer.suppressClickAction = true;
      world.pointer.button = event.button;
      canvas.setPointerCapture(event.pointerId);
      return;
    }

    if (world.placement.active) {
      updatePlacementFromPointer(event);

      if (event.button === 0) {
        placeSelectedBuilding();
      } else if (event.button === 2) {
        cancelBuildingPlacement();
      }

      return;
    }

    world.pointer.dragging = true;
    world.pointer.cameraDragging = event.button === 1;
    world.pointer.moved = false;
    world.pointer.working = false;
    world.pointer.enteringBase = false;
    world.pointer.button = event.button;
    world.pointer.attackHand = event.button === 2 ? "right" : "left";
    world.pointer.downAt = performance.now();
    world.pointer.rangedCharge = null;

    if (world.pointer.cameraDragging) {
      canvas.setPointerCapture(event.pointerId);
      return;
    }

    if (isLockedThirdPersonCamera()) {
      updateLockedThirdPersonAim();
      hideBaseTooltip();
    } else {
      updateAimFromPointer(event);
      updateBaseHoverFromPointer(event);
    }
    if (world.outpostTower.active) {
      world.outpostTower.drawStartedAt = performance.now();
      canvas.setPointerCapture(event.pointerId);
      return;
    }

    world.pointer.enteringBase = world.sceneMode === "interior" ? startRulerSeatAction(event) : false;
    world.pointer.working = world.pointer.enteringBase ? false : startWorkAction(world.pointer.attackHand);
    if (!world.pointer.enteringBase && !world.pointer.working && canChargeRangedHand(world.pointer.attackHand)) {
      world.pointer.rangedCharge = {
        hand: world.pointer.attackHand,
        startedAt: world.pointer.downAt
      };
    }
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });

  canvas.addEventListener("auxclick", (event) => {
    if (event.button === 1) {
      event.preventDefault();
    }
  });

  canvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    if (world.placement.active) {
      rotatePlacement(event.deltaY > 0 ? 1 : -1);
      return;
    }

    const zoomStep = event.deltaY > 0 ? 1 : -1;
    world.cameraDistance = clamp(world.cameraDistance + zoomStep * 5, 24, 105);
  }, { passive: false });

  canvas.addEventListener("pointermove", (event) => {
    const previousX = world.pointer.x;
    const previousY = world.pointer.y;
    world.pointer.insideCanvas = true;

    if (world.placement.active) {
      world.pointer.x = event.clientX;
      world.pointer.y = event.clientY;
      updatePlacementFromPointer(event);
      return;
    }

    if (isLockedThirdPersonCamera()) {
      world.pointer.x = event.clientX;
      world.pointer.y = event.clientY;
      updateLockedThirdPersonAim();
      hideBaseTooltip();
      return;
    }

    if (!world.pointer.dragging) {
      world.pointer.x = event.clientX;
      world.pointer.y = event.clientY;
      updateAimFromPointer(event);
      updateBaseHoverFromPointer(event);
      return;
    }

    if (world.pointer.cameraDragging) {
      const deltaX = event.clientX - previousX;
      const deltaY = event.clientY - previousY;
      world.pointer.x = event.clientX;
      world.pointer.y = event.clientY;
      if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
        world.pointer.moved = true;
        world.cameraYaw -= deltaX * 0.006;
        world.cameraPitch = clamp(world.cameraPitch + deltaY * 0.004, 0.28, 1.08);
      }
      return;
    }

    if (world.pointer.enteringBase) {
      world.pointer.x = event.clientX;
      world.pointer.y = event.clientY;
      updateBaseHoverFromPointer(event);
      return;
    }

    if (world.pointer.working) {
      world.pointer.x = event.clientX;
      world.pointer.y = event.clientY;
      updateAimFromPointer(event);
      updateBaseHoverFromPointer(event);
      return;
    }

    const totalMove = Math.hypot(event.clientX - previousX, event.clientY - previousY);
    world.pointer.x = event.clientX;
    world.pointer.y = event.clientY;
    updateBaseHoverFromPointer(event);
    updateAimFromPointer(event);

    if (totalMove > 5) {
      world.pointer.moved = true;
    }
  });

  canvas.addEventListener("pointerup", (event) => {
    if (world.pointer.suppressClickAction) {
      // Double middle-click toggles camera mode and should not trigger world actions.
    } else if (world.pointer.cameraDragging) {
      // Camera movement is bound to middle mouse, so it should never trigger an attack or work action.
    } else if (isLockedThirdPersonCamera()) {
      updateLockedThirdPersonAim();
      hideBaseTooltip();
    } else {
      updateAimFromPointer(event);
      updateBaseHoverFromPointer(event);
    }

    if (world.pointer.suppressClickAction) {
      // Nothing else to resolve.
    } else if (world.pointer.cameraDragging) {
      // Nothing else to resolve.
    } else if (world.outpostTower.active) {
      tryTowerBowAttack();
    } else if (world.pointer.enteringBase) {
      stopBaseEntryAction();
    } else if (world.pointer.working) {
      stopWorkAction();
    } else if (!world.pointer.moved && tryPickupDroppedItemFromPointer(event)) {
      // Loot clicks should resolve before weapon swings.
    } else if (!world.pointer.moved && openNpcPanelFromPointer(event)) {
      // NPC clicks open their panel instead of swinging an equipped weapon.
    } else if (world.pointer.rangedCharge?.hand === (event.button === 2 ? "right" : "left") || !world.pointer.moved) {
      const hand = event.button === 2 ? "right" : "left";
      tryAttackFromPointer(hand, getRangedChargePower(hand));
    }

    clearRangedCharge();
    world.pointer.dragging = false;
    world.pointer.cameraDragging = false;
    world.pointer.working = false;
    world.pointer.enteringBase = false;
    world.pointer.suppressClickAction = false;
    world.pointer.attackHand = null;
    canvas.releasePointerCapture(event.pointerId);
  });

  canvas.addEventListener("pointerleave", () => {
    world.pointer.insideCanvas = false;
    world.hoveredStatusEntityKey = null;
    hideBaseTooltip();
  });

  canvas.addEventListener("pointercancel", () => {
    clearRangedCharge();
    world.pointer.dragging = false;
    world.pointer.cameraDragging = false;
    world.pointer.working = false;
    world.pointer.enteringBase = false;
    world.pointer.suppressClickAction = false;
    world.pointer.attackHand = null;
    world.pointer.insideCanvas = false;
    world.hoveredStatusEntityKey = null;
  });

  document.addEventListener("pointerlockchange", handlePointerLockChange);
  document.addEventListener("mousemove", handleLockedThirdPersonMouseMove);

  world.uiReady = true;
  refreshUi();
}

function updateHouseNameGate() {
  if (!ui.houseNameInput || !ui.houseNameStatus || !ui.factionCards) {
    return;
  }

  const houseName = sanitizeHouseName(ui.houseNameInput.value);
  const valid = houseName.length > 0;
  ui.houseNameStatus.textContent = valid ? `House ${formatHouseName(houseName)}` : "A-Z";
  ui.houseNameStatus.classList.toggle("is-valid", valid);

  for (const card of ui.factionCards.querySelectorAll("[data-faction]")) {
    card.disabled = !valid;
  }
}

function isDoubleMiddleClick() {
  const now = performance.now();
  const isDoubleClick = now - world.pointer.lastMiddleClickAt <= 320;
  world.pointer.lastMiddleClickAt = now;
  return isDoubleClick;
}

function toggleThirdPersonCameraLock() {
  const locked = world.cameraMode !== "lockedThirdPerson";
  world.cameraMode = locked ? "lockedThirdPerson" : "free";

  if (locked) {
    requestLockedThirdPersonPointerLock();
    updateLockedThirdPersonAim();
  } else {
    syncFreeCameraYawToCurrentView();
    releaseLockedThirdPersonPointerLock();
  }

  flash(world.cameraMode === "lockedThirdPerson" ? "Locked third-person camera." : "Free camera.");
}

function isLockedThirdPersonCamera() {
  return world.cameraMode === "lockedThirdPerson" && !world.outpostTower.active;
}

function requestLockedThirdPersonPointerLock() {
  if (!canvas.requestPointerLock) {
    world.cameraMode = "free";
    flash("Pointer lock unavailable.");
    return;
  }

  if (document.pointerLockElement === canvas) {
    return;
  }

  const lockRequest = canvas.requestPointerLock();

  if (lockRequest?.catch) {
    lockRequest.catch(() => {
      if (world.cameraMode === "lockedThirdPerson") {
        world.cameraMode = "free";
        syncFreeCameraYawToCurrentView();
        flash("Pointer lock unavailable.");
      }
    });
  }
}

function releaseLockedThirdPersonPointerLock() {
  if (document.pointerLockElement === canvas) {
    document.exitPointerLock();
  }
}

function releaseLockedCameraForMenu() {
  if (world.cameraMode !== "lockedThirdPerson") {
    return;
  }

  syncFreeCameraYawToCurrentView();
  world.cameraMode = "free";
  releaseLockedThirdPersonPointerLock();
}

function handlePointerLockChange() {
  if (world.cameraMode === "lockedThirdPerson" && document.pointerLockElement !== canvas) {
    world.cameraMode = "free";
    syncFreeCameraYawToCurrentView();
  }
}

function handleLockedThirdPersonMouseMove(event) {
  if (!isLockedThirdPersonCamera() || document.pointerLockElement !== canvas) {
    return;
  }

  rotateLockedThirdPersonCamera(event.movementX, event.movementY);
}

function rotateLockedThirdPersonCamera(deltaX, deltaY) {
  if (!Number.isFinite(deltaX) || !Number.isFinite(deltaY)) {
    return;
  }

  const { minPitch, maxPitch } = LOCKED_THIRD_PERSON_CAMERA;
  world.cameraYaw -= deltaX * 0.0032;
  world.cameraPitch = clamp(world.cameraPitch + deltaY * 0.003, minPitch, maxPitch);
  updateLockedThirdPersonAim();
}

function updateLockedThirdPersonAim() {
  if (!isLockedThirdPersonCamera()) {
    return;
  }

  const target = getAimPointFromScreenCenter();

  if (!target) {
    const forward = new THREE.Vector3();
    world.camera.getWorldDirection(forward);

    if (forward.lengthSq() < 0.001) {
      return;
    }

    forward.normalize();
    const horizontalForward = forward.clone();
    horizontalForward.y = 0;

    if (horizontalForward.lengthSq() < 0.001) {
      return;
    }

    horizontalForward.normalize();
    world.aimPoint.set(
      state.player.position.x + forward.x * 42,
      getPlayerWorldElevation() + 4 + forward.y * 42,
      state.player.position.z + forward.z * 42
    );
    world.aimRayDirection.copy(forward);
    world.aimTarget.set(
      state.player.position.x + horizontalForward.x * 42,
      0,
      state.player.position.z + horizontalForward.z * 42
    );
    world.aimDirection.copy(horizontalForward);
    world.hasAim = true;
    applyAimFacing();
    return;
  }

  const direction = new THREE.Vector3(
    target.x - state.player.position.x,
    0,
    target.z - state.player.position.z
  );

  if (direction.lengthSq() < 0.001) {
    return;
  }

  world.aimPoint.copy(target);
  world.aimTarget.copy(target);
  world.aimDirection.copy(direction.normalize());
  world.hasAim = true;
  applyAimFacing();
}

function syncFreeCameraYawToCurrentView() {
  const forward = new THREE.Vector3();
  world.camera.getWorldDirection(forward);
  forward.y = 0;

  if (forward.lengthSq() >= 0.001) {
    forward.normalize();
    world.cameraYaw = Math.atan2(-forward.x, -forward.z);
    return;
  }

  const playerElevation = getPlayerWorldElevation();
  const target = new THREE.Vector3(state.player.position.x, playerElevation, state.player.position.z);
  const offset = world.camera.position.clone().sub(target);

  if (offset.lengthSq() < 0.001) {
    return;
  }

  world.cameraYaw = Math.atan2(offset.x, offset.z);
}

function clearHand(hand) {
  unequipHand(state, hand);
  clearHandVisuals(hand);
  stopWorkAction();
  refreshUi();
}

function setLoreScrollOpen(open) {
  if (!ui.loreScroll) {
    return;
  }

  ui.loreScroll.classList.toggle("is-hidden", !open);
  ui.loreScroll.setAttribute("aria-hidden", String(!open));
  ui.hudLoreButton.setAttribute("aria-expanded", String(open));
  ui.hudLoreButton.classList.toggle("is-active", open);

  if (open) {
    releaseLockedCameraForMenu();
    setStatusPanelOpen(false);
    setInventoryPanelOpen(false);
    setBuildPanelOpen(false);
    closeNpcTradePanel();
    closeStewardPanel();
    closeDepotPanel();
    setRulerPanelOpen(false);
    renderLoreScroll();
  }
}

function renderLoreScroll() {
  if (!ui.loreBody || !ui.loreMeta) {
    return;
  }

  const volumes = Array.isArray(state.lore?.volumes)
    ? state.lore.volumes.slice().sort((a, b) => a.number - b.number)
    : [];
  ui.loreMeta.textContent = volumes.length
    ? `${volumes.length} ${volumes.length === 1 ? "addition" : "additions"} written`
    : "Opening";

  ui.loreBody.innerHTML = `
    ${renderLoreStory(state.lore?.story ?? state.lore?.opening ?? "", getLoreProgress(state))}
    ${volumes.length ? renderLoreAdditionList(volumes) : ""}
  `;
}

function renderLoreStory(story, progress) {
  return `
    <article class="lore-volume">
      <header>
        <div>
          <strong>The Book So Far</strong>
          <small>Living chronicle</small>
        </div>
      </header>
      ${renderLoreParagraphs(story || "The chronicle has not yet begun.")}
      ${renderLoreProgress(progress)}
    </article>
  `;
}

function renderLoreProgress(progress) {
  const percent = Math.max(0, Math.min(100, Math.floor(Number(progress?.percent) || 0)));
  const completed = Math.max(0, Math.floor(Number(progress?.completed) || 0));
  const required = Math.max(1, Math.floor(Number(progress?.required) || 1));
  const remaining = Math.max(0, Math.floor(Number(progress?.remaining) || 0));
  const label = remaining === 0
    ? "The next part is ready to be written."
    : `${remaining} ${remaining === 1 ? "record" : "records"} until the next part is added.`;

  return `
    <section class="lore-progress" aria-label="Next chronicle progress">
      <div>
        <strong>${percent}% of next volume finished</strong>
        <span>${completed} / ${required} records gathered</span>
      </div>
      <div class="lore-progress-meter" style="--value: ${percent}%"><span></span></div>
      <p>${label}</p>
    </section>
  `;
}

function renderLoreAdditionList(volumes) {
  return volumes.map((volume) => renderLoreVolume(volume)).join("");
}

function renderLoreVolume(volume) {
  const awarded = volume.renownAwards?.[state.player.id] ?? 0;
  const awardLine = awarded > 0 ? `<span>${awarded} renown</span>` : "";
  return `
    <article class="lore-volume">
      <header>
        <div>
          <strong>${escapeHtml(volume.title ?? `Addition ${volume.number}`)}</strong>
          <small>${formatLoreTime(volume.createdAt)}</small>
        </div>
        ${awardLine}
      </header>
      ${renderLoreParagraphs(volume.text ?? "")}
    </article>
  `;
}

function renderLoreParagraphs(text) {
  return escapeHtml(text)
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br />")}</p>`)
    .join("");
}

function formatLoreTime(value) {
  const seconds = Math.max(0, Math.floor(Number(value) || 0));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}m ${remainder}s`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function setStatusPanelOpen(open) {
  ui.statusPanel.classList.toggle("is-hidden", !open);
  ui.statusPanel.setAttribute("aria-hidden", String(!open));
  ui.hudStatusButton.setAttribute("aria-expanded", String(open));
  ui.hudStatusButton.classList.toggle("is-active", open);

  if (open) {
    releaseLockedCameraForMenu();
    setLoreScrollOpen(false);
    setInventoryPanelOpen(false);
    setBuildPanelOpen(false);
    closeNpcTradePanel();
    closeStewardPanel();
    closeDepotPanel();
    setRulerPanelOpen(false, { leaveSeat: false });
    renderStatusPanel();
  }
}

function setInventoryPanelOpen(open) {
  ui.inventoryPanel.classList.toggle("is-hidden", !open);
  ui.inventoryPanel.setAttribute("aria-hidden", String(!open));
  ui.hudPlayerButton.setAttribute("aria-expanded", String(open));
  ui.hudPlayerButton.classList.toggle("is-active", open);
  ui.hotbar.classList.toggle("is-hidden", open || !ui.buildPanel.classList.contains("is-hidden"));

  if (open) {
    releaseLockedCameraForMenu();
    setLoreScrollOpen(false);
    setStatusPanelOpen(false);
    setBuildPanelOpen(false);
    closeNpcTradePanel();
    closeStewardPanel();
    closeDepotPanel();
    setRulerPanelOpen(false);
    renderInventoryPanel();
  }
}

function setBuildPanelOpen(open) {
  ui.buildPanel.classList.toggle("is-hidden", !open);
  ui.buildPanel.setAttribute("aria-hidden", String(!open));
  ui.hotbar.classList.toggle("is-hidden", open || !ui.inventoryPanel.classList.contains("is-hidden"));

  if (open) {
    releaseLockedCameraForMenu();
    setLoreScrollOpen(false);
    setStatusPanelOpen(false);
    setInventoryPanelOpen(false);
    closeNpcTradePanel();
    closeStewardPanel();
    closeDepotPanel();
    setRulerPanelOpen(false);
    renderBuildPanel();
  }
}

function isTypingInField(target) {
  return ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName);
}

function setRulerPanelOpen(open, options = {}) {
  ui.rulerPanel.classList.toggle("is-hidden", !open);
  ui.rulerPanel.setAttribute("aria-hidden", String(!open));
  ui.hudFactionButton.setAttribute("aria-expanded", String(open));
  ui.hudFactionButton.classList.toggle("is-active", open);

  if (open) {
    releaseLockedCameraForMenu();
    setLoreScrollOpen(false);
    setStatusPanelOpen(false);
    setInventoryPanelOpen(false);
    setBuildPanelOpen(false);
    closeNpcTradePanel();
    closeStewardPanel();
    closeDepotPanel();
    renderRulerPanel();
  } else if (options.leaveSeat !== false) {
    leaveRulerSeat();
  }
}

function renderRulerPanel() {
  const factionId = state.selectedFactionId || world.interiorFactionId;
  const faction = factionId ? FACTION_LOOKUP[factionId] : null;

  if (!faction) {
    setRulerPanelOpen(false);
    return;
  }

  const rulerName = getFactionRulerName(state, factionId);
  ui.rulerTitle.textContent = `Faction: ${faction.name}`;
  ui.rulerStatus.textContent = `${rulerName ? `King: ${rulerName}` : "No king"} | ${faction.trait}`;
  ui.rulerMembers.innerHTML = renderRulerMembers(factionId);
  ui.rulerResources.innerHTML = renderRulerResources(factionId);
  ui.rulerPolitics.innerHTML = renderRulerPolitics(factionId);
}

function renderRulerMembers(factionId) {
  const rulerName = getFactionRulerName(state, factionId);
  const members = getFactionMembers(state, factionId);
  const faction = FACTION_LOOKUP[factionId];

  if (!members.length) {
    return `<div class="notice">No members have joined this faction.</div>`;
  }

  const houses = new Map();
  for (const member of members) {
    const houseName = formatHouseName(member.houseName) || "Wanderers";
    if (!houses.has(houseName)) {
      houses.set(houseName, []);
    }
    houses.get(houseName).push(member);
  }

  return `
    <article class="status-card">
      <strong>${faction.name}</strong>
      <p>${faction.summary}</p>
      <span>${rulerName ? `King ${rulerName}` : "The throne is unclaimed."}</span>
    </article>
    ${[...houses.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([houseName, houseMembers]) => renderHouseFolder(houseName, houseMembers, rulerName))
      .join("")}
  `;
}

function renderHouseFolder(houseName, members, rulerName) {
  const sortedMembers = members
    .slice()
    .sort((a, b) => Number(b.renown || 0) - Number(a.renown || 0) || String(a.name).localeCompare(String(b.name)));
  const isPlayerHouse = sortedMembers.some((member) => member.playerId === state.player.id);

  return `
    <details class="house-folder" ${isPlayerHouse ? "open" : ""}>
      <summary>
        <strong>House ${escapeHtml(houseName)}</strong>
        <span>${sortedMembers.length} ${sortedMembers.length === 1 ? "member" : "members"}</span>
      </summary>
      <div class="house-members">
        ${sortedMembers
          .map(
            (member) => `
              <article class="house-member">
                <strong>${escapeHtml(member.name)}</strong>
                <span>${member.name === rulerName ? "King" : "Member"} | ${Math.round(member.renown)} lore</span>
              </article>
            `
          )
          .join("")}
      </div>
    </details>
  `;
}

function renderRulerResources(factionId) {
  const store = state.factionResources[factionId];

  return `
    <article class="ruler-row">
      <strong>Gold</strong>
      <span>${Math.round(store.gold)}</span>
    </article>
    ${RESOURCE_TYPES.map(
      (resource) => `
        <article class="ruler-row">
          <strong>${resource.name}</strong>
          <span>${store.resources[resource.id] ?? 0}</span>
        </article>
      `
    ).join("")}
  `;
}

function renderRulerPolitics(factionId) {
  const governance = state.factionGovernance[factionId];
  const canManage = isFactionRuler(state, factionId);

  return FACTIONS.filter((faction) => faction.id !== factionId)
    .map((faction) => {
      const relation = governance.relationStatus[faction.id] ?? "Neutral";
      const hasRequest = governance.allianceRequests.includes(faction.id);
      const requested = state.factionGovernance[faction.id].allianceRequests.includes(factionId);

      return `
        <article class="ruler-row">
          <strong>${faction.name}</strong>
          <span>${relation}${hasRequest ? " | request waiting" : ""}${requested ? " | requested" : ""}</span>
          <div class="politics-actions">
            <button data-politics-action="enemy" data-target-faction="${faction.id}" type="button" ${canManage ? "" : "disabled"}>Enemy</button>
            <button data-politics-action="neutral" data-target-faction="${faction.id}" type="button" ${canManage ? "" : "disabled"}>Neutral</button>
            ${
              hasRequest
                ? `<button data-politics-action="accept" data-target-faction="${faction.id}" type="button" ${canManage ? "" : "disabled"}>Accept Allegiance</button>`
                : `<button data-politics-action="request" data-target-faction="${faction.id}" type="button" ${canManage ? "" : "disabled"}>Request Allegiance</button>`
            }
          </div>
        </article>
      `;
    })
    .join("");
}

function renderStatusPanel() {
  if (!ui.statusBody || !ui.statusSummary) {
    return;
  }

  const faction = state.selectedFactionId ? FACTION_LOOKUP[state.selectedFactionId] : null;
  const zone = getZone(state);
  const interiorFaction = world.interiorFactionId ? FACTION_LOOKUP[world.interiorFactionId] : null;
  const interiorPoi = world.activePoiInteriorId ? state.pois.find((poi) => poi.id === world.activePoiInteriorId) : null;
  const nearest = getNearestPoi(state);
  const locationName =
    world.sceneMode === "interior" && interiorFaction
      ? `${interiorFaction.name} Keep`
      : world.sceneMode === "poiInterior" && interiorPoi
        ? interiorPoi.name
        : zone.label;
  const nearestLabel = nearest
    ? `${nearest.poi.name} | ${Math.round(nearest.distance)}m | ${
        nearest.poi.ownerFactionId ? FACTION_LOOKUP[nearest.poi.ownerFactionId].name : "Neutral"
      }`
    : "No point of interest nearby";

  ui.statusSummary.textContent = `${locationName} | ${Math.round(state.player.hp ?? MULTIPLAYER_MAX_HEALTH)} HP`;
  ui.statusBody.innerHTML = `
    <article class="status-card">
      <strong>Location</strong>
      <span>${escapeHtml(locationName)}</span>
      <p>${escapeHtml(nearestLabel)}</p>
    </article>
    <article class="status-card">
      <strong>Player</strong>
      <span>${escapeHtml(state.player.name)} | ${Math.round(state.player.hp ?? MULTIPLAYER_MAX_HEALTH)} HP</span>
      <p>${faction ? `Sworn to ${escapeHtml(faction.name)}` : "Unsworn"}</p>
    </article>
    <article class="status-card">
      <strong>World Event</strong>
      ${
        state.activeEvent
          ? `<span>${escapeHtml(state.activeEvent.name)} | ${Math.ceil(state.activeEvent.timer)}s</span><p>Loot: ${escapeHtml(state.activeEvent.item.name)}</p>`
          : "<span>No active dynamic event.</span><p>The field is quiet for now.</p>"
      }
    </article>
    <article class="status-card">
      <strong>Carry</strong>
      <span>Gold ${Math.round(state.player.gold)}</span>
      <p>${RESOURCE_TYPES.map((resource) => `${resource.name} ${state.player.resources[resource.id]}`).join(" | ")}</p>
    </article>
  `;
}

function setupInventoryControls() {
  const clickState = {
    itemId: null,
    button: null,
    time: 0
  };

  ui.inventoryPanel.addEventListener("contextmenu", (event) => {
    if (event.target.closest("[data-item-id], [data-equip-slot], [data-hotbar-index]")) {
      event.preventDefault();
    }
  });

  ui.inventoryGrid.addEventListener("pointerdown", (event) => {
    const row = event.target.closest("[data-item-id]");

    if (!row || (event.button !== 0 && event.button !== 2)) {
      return;
    }

    event.preventDefault();

    const now = performance.now();
    const isDoubleClick =
      clickState.itemId === row.dataset.itemId &&
      clickState.button === event.button &&
      now - clickState.time < 1500;

    clickState.itemId = row.dataset.itemId;
    clickState.button = event.button;
    clickState.time = now;
    selectGearItem(state, row.dataset.itemId);

    if (isDoubleClick) {
      runAction(equipInventoryItem(row.dataset.itemId, event.button === 2 ? "right" : "left"));
      clickState.time = 0;
    } else {
      renderInventoryPanel();
    }
  });

  ui.inventoryGrid.addEventListener("dblclick", (event) => {
    const row = event.target.closest("[data-item-id]");

    if (!row) {
      return;
    }

    event.preventDefault();
    selectGearItem(state, row.dataset.itemId);
    runAction(equipInventoryItem(row.dataset.itemId, "left"));
    clickState.time = 0;
  });

  ui.inventoryPanel.addEventListener("click", (event) => {
    const equipSlot = event.target.closest("[data-equip-slot]");
    const hotbarSlot = event.target.closest("[data-hotbar-index]");

    if (equipSlot) {
      assignSelectedItemToEquipSlot(equipSlot.dataset.equipSlot);
    } else if (hotbarSlot) {
      assignSelectedItemToHotbar(Number(hotbarSlot.dataset.hotbarIndex));
    }
  });
}

function equipInventoryItem(itemId, visibleHand) {
  const item = state.player.inventory.find((entry) => entry.id === itemId);

  if (isArmorItem(item)) {
    const slot = BODY_EQUIP_SLOTS.find((entry) => entry.id === item.armor.slot);

    if (!slot) {
      return { ok: false, message: `${item.name} does not match an armor slot.` };
    }

    return equipBodyItem(item, slot);
  }

  return equipVisibleHand(itemId, visibleHand);
}

function equipVisibleHand(itemId, visibleHand) {
  const item = state.player.inventory.find((entry) => entry.id === itemId);

  if (item?.armor) {
    return { ok: false, message: `${item.name} belongs in your ${getArmorSlotLabel(item.armor.slot)} slot.` };
  }

  clearItemFromBodySlots(itemId);
  const result = equipItem(state, itemId, visibleHand);

  if (result.ok && item) {
    return {
      ...result,
      message: `${item.name} equipped in your ${visibleHand} hand.`
    };
  }

  return result;
}

function assignSelectedItemToEquipSlot(slotId) {
  const slot = BODY_EQUIP_SLOTS.find((entry) => entry.id === slotId);
  const selectedItem = getSelectedGearItem(state);
  const currentItemId = slot ? state.player.equipment[slot.stateKey] : null;

  if (!slot) {
    return;
  }

  if (!selectedItem && currentItemId) {
    selectGearItem(state, currentItemId);
    renderInventoryPanel();
    return;
  }

  if (!selectedItem) {
    flash("Select an item first.");
    return;
  }

  if (currentItemId === selectedItem.id) {
    state.player.equipment[slot.stateKey] = null;
    runAction({ ok: true, message: `${selectedItem.name} removed from ${slot.label}.` });
    return;
  }

  let result;

  if (slot.hand) {
    result = equipVisibleHand(selectedItem.id, slot.hand);
  } else {
    result = equipBodyItem(selectedItem, slot);
  }

  runAction(result);
}

function equipBodyItem(item, slot) {
  if (item.category === "Weapon") {
    return { ok: false, message: "Weapons must be equipped in a hand slot." };
  }

  if (!isArmorItem(item)) {
    return { ok: false, message: `${item.name} is not wearable armor.` };
  }

  if (item.armor.slot !== slot.id) {
    return { ok: false, message: `${item.name} belongs in your ${getArmorSlotLabel(item.armor.slot)} slot.` };
  }

  if (item.durability <= 0) {
    return { ok: false, message: `${item.name} is broken and cannot be equipped.` };
  }

  clearItemFromAllEquipment(item.id);
  state.player.equipment[slot.stateKey] = item.id;
  return { ok: true, message: `${item.name} equipped on ${slot.label}.` };
}

function getArmorSlotLabel(slotId) {
  return BODY_EQUIP_SLOTS.find((slot) => slot.id === slotId)?.label ?? slotId;
}

function assignSelectedItemToHotbar(index) {
  const selectedItem = getSelectedGearItem(state);
  const currentItemId = state.player.hotbar[index];

  if (!selectedItem && currentItemId) {
    selectGearItem(state, currentItemId);
    renderInventoryPanel();
    return;
  }

  if (!selectedItem) {
    flash("Select an item first.");
    return;
  }

  state.player.hotbar[index] = currentItemId === selectedItem.id ? null : selectedItem.id;
  runAction({
    ok: true,
    message: currentItemId === selectedItem.id
      ? `Removed ${selectedItem.name} from hotbar ${index + 1}.`
      : `${selectedItem.name} assigned to hotbar ${index + 1}.`
  });
}

function clearItemFromBodySlots(itemId) {
  for (const key of Object.keys(state.player.equipment)) {
    if (!key.endsWith("ItemId") || key === "leftHandItemId" || key === "rightHandItemId") {
      continue;
    }

    if (state.player.equipment[key] === itemId) {
      state.player.equipment[key] = null;
    }
  }
}

function clearItemFromAllEquipment(itemId) {
  for (const key of Object.keys(state.player.equipment)) {
    if (key.endsWith("ItemId") && state.player.equipment[key] === itemId) {
      state.player.equipment[key] = null;
    }
  }
}

function getItemById(itemId) {
  return itemId ? state.player.inventory.find((item) => item.id === itemId) ?? null : null;
}

function setupDebugTools() {
  window.__kingdomsDebug = {
    captureFrame: () => canvas.toDataURL("image/png"),
    getRenderStats: () => ({
      frames: Number(document.body.dataset.renderFrames || 0),
      size: document.body.dataset.renderSize || null,
      colors: Number(document.body.dataset.renderColors || 0),
      mean: Number(document.body.dataset.renderMean || 0),
      variance: Number(document.body.dataset.renderVariance || 0)
    }),
    getProjectileStats: () => ({
      active: world.projectiles.length,
      fired: world.projectilesFired,
      projectiles: world.projectiles.map((projectile) => ({
        x: Number(projectile.mesh.position.x.toFixed(2)),
        y: Number(projectile.mesh.position.y.toFixed(2)),
        z: Number(projectile.mesh.position.z.toFixed(2)),
        travelled: Number(projectile.travelled.toFixed(2)),
        range: Number(projectile.range.toFixed(2)),
        speed: Number(projectile.speed.toFixed(2))
      }))
    }),
    setCombatHitboxDebug: (enabled = true) => {
      world.combatDebug.hitboxes = Boolean(enabled);
      document.body.dataset.combatHitboxes = String(world.combatDebug.hitboxes);
      return world.combatDebug.hitboxes;
    },
    getCombatProfile: (itemType = "Sword") => getCombatProfile(itemType),
    registerWeaponAssetLoader,
    registerProceduralWeaponFallback,
    getPlayerPosition: () => ({ ...state.player.position }),
    getAim: () => ({
      target: { x: world.aimTarget.x, z: world.aimTarget.z },
      direction: { x: world.aimDirection.x, z: world.aimDirection.z },
      rotation: world.playerMesh?.rotation.y ?? 0,
      headRotation: world.playerRig?.headGroup?.rotation.y ?? 0
    }),
    getRulerVisualState: () => ({
      seated: world.seatedOnThrone,
      crownVisible: Boolean(world.playerRig?.crown?.visible),
      throneCrownExists: Boolean(world.interiorRoot.getObjectByName("rulerSeatCrown")),
      panelOpen: !ui.rulerPanel.classList.contains("is-hidden"),
      playerPosition: { ...state.player.position }
    }),
    setPlayerPosition: (x, z) => {
      state.player.position.x = x;
      state.player.position.z = z;
      document.body.dataset.playerX = String(Math.round(x));
      document.body.dataset.playerZ = String(Math.round(z));
    },
    getSceneryStats: () => ({
      colliders: world.sceneryColliders.length,
      nearest: world.sceneryColliders
        .map((collider) => ({
          type: collider.type,
          x: collider.x,
          z: collider.z,
          radius: collider.radius,
          distance: Math.hypot(state.player.position.x - collider.x, state.player.position.z - collider.z)
        }))
        .sort((a, b) => a.distance - b.distance)[0] ?? null
    })
  };
}

function renderBuildPanel() {
  if (!BUILDING_LOOKUP[world.selectedBuildingType]) {
    world.selectedBuildingType = BUILDING_DEFINITIONS[0].id;
  }

  const selected = BUILDING_LOOKUP[world.selectedBuildingType];
  const canBuild = state.selectedFactionId && canPay(state.player.resources, selected.cost);
  ui.buildStatus.textContent = state.selectedFactionId
    ? canBuild
      ? `${selected.name} ready`
      : `Need ${formatStructureCost(selected.id)}`
    : "Choose a faction first";

  ui.buildGrid.innerHTML = BUILDING_DEFINITIONS.map((building) => {
    const selectedClass = building.id === world.selectedBuildingType ? "is-selected" : "";

    return `
      <button class="build-tile ${selectedClass}" data-building-type="${building.id}" type="button" title="${building.name}">
        ${renderBuildingPreview(building.id)}
        <strong>${building.name}</strong>
        <small>${formatStructureCost(building.id)}</small>
      </button>
    `;
  }).join("");

  ui.buildDetails.innerHTML = `
    <header>
      ${renderBuildingPreview(selected.id)}
      <div>
        <strong>${selected.name}</strong>
        <span>${selected.maxHp} HP</span>
      </div>
    </header>
    <p>${selected.description}</p>
    <div class="stat-grid">
      <span>Health</span><strong>${selected.maxHp}</strong>
      <span>Renown</span><strong>${selected.renown}</strong>
      <span>Resources</span><strong>${formatStructureCost(selected.id)}</strong>
    </div>
    <button class="primary" data-build-selected="${selected.id}" type="button" ${canBuild ? "" : "disabled"}>
      Place ${selected.name}
    </button>
  `;

  renderStructureList();
}

function renderBuildingPreview(type) {
  return `<span class="building-preview building-preview-${type}" aria-hidden="true"><span></span><i></i></span>`;
}

function startBuildingPlacement(type) {
  const building = BUILDING_LOOKUP[type];

  if (!building) {
    flash("Choose a valid building.");
    return;
  }

  if (!state.selectedFactionId) {
    flash("Choose a faction before placing buildings.");
    return;
  }

  if (!canPay(state.player.resources, building.cost)) {
    flash(`Need ${formatStructureCost(type)}.`);
    return;
  }

  setBuildPanelOpen(false);
  closeNpcTradePanel();
  closeStewardPanel();
  closeDepotPanel();
  stopWorkAction();
  stopBaseEntryAction();
  removePlacementPreview();

  world.placement.active = true;
  world.placement.type = type;
  world.placement.rotation = world.playerMesh?.rotation.y ?? 0;
  world.placement.position = { ...state.player.position };
  world.placement.valid = false;
  world.placement.mesh = createPlacementPreviewMesh(type);
  addOutdoor(world.placement.mesh);
  updatePlacementPreview();
  flash(`Placing ${building.name}. Mouse wheel rotates, left click places.`);
}

function cancelBuildingPlacement() {
  if (!world.placement.active) {
    return;
  }

  removePlacementPreview();
  world.placement.active = false;
  world.placement.type = null;
  world.placement.valid = false;
  flash("Placement cancelled.");
}

function removePlacementPreview() {
  if (world.placement.mesh) {
    removeFromParent(world.placement.mesh);
  }

  world.placement.mesh = null;
}

function createPlacementPreviewMesh(type) {
  const building = BUILDING_LOOKUP[type];
  const mesh = createStructureMesh({
    id: "placement-preview",
    type,
    ownerFactionId: state.selectedFactionId,
    position: { ...world.placement.position },
    rotation: world.placement.rotation,
    hp: building.maxHp,
    maxHp: building.maxHp
  });

  const healthBar = mesh.getObjectByName("healthBar");
  if (healthBar) {
    healthBar.visible = false;
    removeFromParent(healthBar);
  }

  mesh.traverse((child) => {
    if (!child.isMesh || !child.material) {
      return;
    }

    child.material = child.material.clone();
    child.material.transparent = true;
    child.material.opacity = 0.42;
    child.material.depthWrite = false;
  });

  return mesh;
}

function updatePlacementFromPointer(event) {
  const target = getGroundPointFromPointer(event);

  if (!target) {
    return;
  }

  world.placement.position = {
    x: clamp(target.x, -248, 248),
    z: clamp(target.z, -248, 248)
  };
  updatePlacementPreview();
}

function rotatePlacement(direction) {
  const step = Math.PI / 12;
  world.placement.rotation += direction * step;
  world.placement.rotation = Math.atan2(Math.sin(world.placement.rotation), Math.cos(world.placement.rotation));
  updatePlacementPreview();
}

function updatePlacementPreview() {
  if (!world.placement.active || !world.placement.mesh) {
    return;
  }

  world.placement.valid = isPlacementValid(world.placement.position);
  world.placement.mesh.position.set(
    world.placement.position.x,
    getTerrainHeightAt(world.placement.position.x, world.placement.position.z),
    world.placement.position.z
  );
  world.placement.mesh.rotation.y = world.placement.rotation;
  world.placement.mesh.visible = world.sceneMode === "outdoor";

  const tint = world.placement.valid ? "#8ccf7e" : "#e27166";
  const opacity = world.placement.valid ? 0.44 : 0.28;

  world.placement.mesh.traverse((child) => {
    if (!child.isMesh || !child.material) {
      return;
    }

    child.material.opacity = opacity;
    if (child.material.color) {
      child.material.color.lerp(new THREE.Color(tint), 0.28);
    }
  });
  document.body.dataset.placementType = world.placement.type ?? "";
  document.body.dataset.placementValid = String(world.placement.valid);
}

function isPlacementValid(position) {
  if (!state.selectedFactionId || world.sceneMode !== "outdoor") {
    return false;
  }

  const building = BUILDING_LOOKUP[world.placement.type];
  const hub = FACTION_LOOKUP[state.selectedFactionId]?.position;

  if (!building || !hub || !canPay(state.player.resources, building.cost)) {
    return false;
  }

  if (distance2D(position, hub) < 30) {
    return false;
  }

  if (distance2D(position, state.player.position) > 58) {
    return false;
  }

  return !state.structures.some((structure) => structure.hp > 0 && distance2D(position, structure.position) < getStructurePlacementRadius(structure.type) + getStructurePlacementRadius(world.placement.type));
}

function getStructurePlacementRadius(type) {
  if (type === "wall") {
    return 7.5;
  }

  if (type === "depot") {
    return 6.2;
  }

  return 5.2;
}

function placeSelectedBuilding() {
  if (!world.placement.active) {
    return;
  }

  updatePlacementPreview();

  if (!world.placement.valid) {
    flash("Choose a valid placement spot.");
    return;
  }

  const result = buildStructure(state, world.placement.type, {
    position: world.placement.position,
    rotation: world.placement.rotation
  });
  removePlacementPreview();
  world.placement.active = false;
  world.placement.type = null;
  world.placement.valid = false;
  runAction(result);
}

function runAction(result) {
  if (result?.message) {
    flash(result.message);
  }

  if (result?.ok) {
    markPersistenceDirty();
  }

  refreshUi();

  if (!ui.rulerPanel.classList.contains("is-hidden")) {
    renderRulerPanel();
  }

  renderStewardPanel();
  renderDepotPanel();

  if (!ui.buildPanel.classList.contains("is-hidden")) {
    renderBuildPanel();
  }
}

function openNpcTradePanel(npcId) {
  const npc = TRADE_NPCS.find((entry) => entry.id === npcId);

  if (!npc) {
    return;
  }

  world.activeTradeNpcId = npcId;
  ui.npcTradeAmount.value = normalizeTradeAmount(ui.npcTradeAmount.value);
  ui.npcTradePanel.classList.remove("is-hidden");
  ui.npcTradePanel.setAttribute("aria-hidden", "false");
  releaseLockedCameraForMenu();
  setLoreScrollOpen(false);
  closeStewardPanel();
  closeDepotPanel();
  setStatusPanelOpen(false);
  setInventoryPanelOpen(false);
  setBuildPanelOpen(false);
  setRulerPanelOpen(false);
  renderNpcTradePanel();
}

function closeNpcTradePanel() {
  world.activeTradeNpcId = null;
  ui.npcTradePanel.classList.add("is-hidden");
  ui.npcTradePanel.setAttribute("aria-hidden", "true");
}

function openStewardPanel() {
  if (!state.selectedFactionId || world.interiorFactionId !== state.selectedFactionId) {
    flash("You can only deposit into your own faction.");
    return;
  }

  world.stewardPanelOpen = true;
  ui.stewardAmount.value = normalizeTradeAmount(ui.stewardAmount.value);
  ui.stewardPanel.classList.remove("is-hidden");
  ui.stewardPanel.setAttribute("aria-hidden", "false");
  releaseLockedCameraForMenu();
  setLoreScrollOpen(false);
  closeNpcTradePanel();
  closeDepotPanel();
  setStatusPanelOpen(false);
  setInventoryPanelOpen(false);
  setBuildPanelOpen(false);
  setRulerPanelOpen(false);
  renderStewardPanel();
}

function closeStewardPanel() {
  world.stewardPanelOpen = false;
  ui.stewardPanel.classList.add("is-hidden");
  ui.stewardPanel.setAttribute("aria-hidden", "true");
}

function openDepotPanel(depotId) {
  const depot = state.structures.find((structure) => structure.id === depotId);
  stopBaseEntryAction();

  if (!depot || depot.type !== "depot" || depot.hp <= 0) {
    flash("That depot is no longer available.");
    return;
  }

  if (depot.ownerFactionId !== state.selectedFactionId) {
    flash("You can only use your faction depot.");
    return;
  }

  world.activeDepotId = depotId;
  world.depotPanelOpen = true;
  ui.depotAmount.value = normalizeTradeAmount(ui.depotAmount.value);
  ui.depotPanel.classList.remove("is-hidden");
  ui.depotPanel.setAttribute("aria-hidden", "false");
  releaseLockedCameraForMenu();
  setLoreScrollOpen(false);
  closeNpcTradePanel();
  closeStewardPanel();
  setStatusPanelOpen(false);
  setInventoryPanelOpen(false);
  setBuildPanelOpen(false);
  setRulerPanelOpen(false);
  renderDepotPanel();
}

function closeDepotPanel() {
  world.depotPanelOpen = false;
  world.activeDepotId = null;
  ui.depotPanel.classList.add("is-hidden");
  ui.depotPanel.setAttribute("aria-hidden", "true");
}

function getActiveTradeNpc() {
  return TRADE_NPCS.find((entry) => entry.id === world.activeTradeNpcId) ?? null;
}

function getTradeAmount() {
  const amount = normalizeTradeAmount(ui.npcTradeAmount.value);
  ui.npcTradeAmount.value = amount;
  return amount;
}

function getStewardAmount() {
  const amount = normalizeTradeAmount(ui.stewardAmount.value);
  ui.stewardAmount.value = amount;
  return amount;
}

function getDepotAmount() {
  const amount = normalizeTradeAmount(ui.depotAmount.value);
  ui.depotAmount.value = amount;
  return amount;
}

function normalizeTradeAmount(value) {
  return Math.max(1, Math.floor(Number(value) || 1));
}

function renderNpcTradePanel() {
  const npc = getActiveTradeNpc();

  if (!npc) {
    return;
  }

  const resource = RESOURCE_LOOKUP[npc.resourceId];
  const amount = normalizeTradeAmount(ui.npcTradeAmount.value);
  const price = state.market[npc.resourceId];
  const buyPrice = Math.round(price.buy);
  const sellPrice = Math.round(price.sell);
  const buyTotal = Math.round(price.buy * amount);
  const sellTotal = Math.round(price.sell * amount);

  ui.npcTradeTitle.textContent = npc.name;
  ui.npcTradeResource.textContent = resource.name;
  ui.npcBuyPrice.textContent = String(buyPrice);
  ui.npcSellPrice.textContent = String(sellPrice);
  ui.npcBuyResource.textContent = `Buy (${buyTotal})`;
  ui.npcSellResource.textContent = `Sell (${sellTotal})`;
  ui.npcBuyResource.disabled = state.player.gold < buyTotal;
  ui.npcSellResource.disabled = state.player.resources[npc.resourceId] < amount;
}

function renderStewardPanel() {
  if (!world.stewardPanelOpen) {
    return;
  }

  const faction = state.selectedFactionId ? FACTION_LOOKUP[state.selectedFactionId] : null;
  const store = state.selectedFactionId ? state.factionResources[state.selectedFactionId] : null;

  if (!faction || !store) {
    closeStewardPanel();
    return;
  }

  const amount = normalizeTradeAmount(ui.stewardAmount.value);
  ui.stewardTitle.textContent = `${faction.name} Steward`;
  ui.stewardStatus.textContent = "Faction vault deposits";
  ui.stewardDepositList.innerHTML = DEPOSIT_RESOURCES.map((resource) => {
    const playerAmount = getPlayerDepositAmount(resource.id);
    const factionAmount = getFactionDepositAmount(store, resource.id);
    const disabled = playerAmount < amount ? "disabled" : "";

    return `
      <article class="deposit-row">
        <strong>${resource.name}</strong>
        <span>You ${Math.floor(playerAmount)}</span>
        <span>Vault ${Math.floor(factionAmount)}</span>
        <button data-deposit-resource="${resource.id}" type="button" ${disabled}>Deposit</button>
      </article>
    `;
  }).join("");
}

function renderDepotPanel() {
  if (!world.depotPanelOpen) {
    return;
  }

  const depot = state.structures.find((structure) => structure.id === world.activeDepotId);

  if (!depot || depot.type !== "depot" || depot.hp <= 0) {
    closeDepotPanel();
    return;
  }

  const amount = normalizeTradeAmount(ui.depotAmount.value);
  const storedTotal = RESOURCE_TYPES.reduce((sum, resource) => sum + (depot.storage?.[resource.id] ?? 0), 0);
  const storedItems = Array.isArray(depot.storedItems) ? depot.storedItems.length : 0;
  ui.depotTitle.textContent = "Depot Storage";
  ui.depotStatus.textContent = `${storedTotal} resources | ${storedItems} items waiting`;
  ui.depotResourceList.innerHTML = RESOURCE_TYPES.map((resource) => {
    const playerAmount = state.player.resources[resource.id] ?? 0;
    const depotAmount = depot.storage?.[resource.id] ?? 0;
    const disabled = playerAmount < amount ? "disabled" : "";

    return `
      <article class="deposit-row">
        <strong>${resource.name}</strong>
        <span>You ${Math.floor(playerAmount)}</span>
        <span>Depot ${Math.floor(depotAmount)}</span>
        <button data-depot-resource="${resource.id}" type="button" ${disabled}>Store</button>
      </article>
    `;
  }).join("");

  const equippedIds = new Set(Object.values(state.player.equipment).filter(Boolean));
  const carriedItems = state.player.inventory.filter((item) => !equippedIds.has(item.id));
  ui.depotItemList.innerHTML = carriedItems.length
    ? carriedItems
        .map(
          (item) => `
            <button class="depot-item-row" data-depot-item="${item.id}" type="button">
              <strong>${getItemGlyph(item)}</strong>
              <span>${item.name}</span>
              <span>${item.rarity} | ${Math.round(item.durability)} / ${item.maxDurability}</span>
            </button>
          `
        )
        .join("")
    : `<div class="notice">No unequipped inventory items to store.</div>`;
}

function getPlayerDepositAmount(resourceId) {
  return resourceId === "gold" ? state.player.gold : state.player.resources[resourceId] ?? 0;
}

function getFactionDepositAmount(store, resourceId) {
  return resourceId === "gold" ? store.gold : store.resources[resourceId] ?? 0;
}

function getActiveDepot() {
  return state.structures.find((structure) => structure.id === world.activeDepotId) ?? null;
}

function depositResourceToDepot(resourceId, amount) {
  const depot = getActiveDepot();
  const resource = RESOURCE_LOOKUP[resourceId];

  if (!depot || depot.type !== "depot" || depot.hp <= 0) {
    return { ok: false, message: "Depot unavailable." };
  }

  if (!resource || (state.player.resources[resourceId] ?? 0) < amount) {
    return { ok: false, message: "Not enough stock in your satchel." };
  }

  depot.storage[resourceId] = (depot.storage[resourceId] ?? 0) + amount;
  state.player.resources[resourceId] -= amount;
  return { ok: true, message: `Stored ${amount} ${resource.name} at the depot.` };
}

function depositItemToDepot(itemId) {
  const depot = getActiveDepot();
  const item = state.player.inventory.find((entry) => entry.id === itemId);

  if (!depot || depot.type !== "depot" || depot.hp <= 0) {
    return { ok: false, message: "Depot unavailable." };
  }

  if (!item) {
    return { ok: false, message: "That item is no longer in your inventory." };
  }

  if (Object.values(state.player.equipment).includes(item.id)) {
    return { ok: false, message: "Unequip that item before storing it." };
  }

  depot.storedItems = Array.isArray(depot.storedItems) ? depot.storedItems : [];
  depot.storedItems.push(item);
  state.player.inventory = state.player.inventory.filter((entry) => entry.id !== item.id);
  state.player.hotbar = state.player.hotbar.map((entry) => (entry === item.id ? null : entry));

  if (state.player.selectedGearItemId === item.id) {
    state.player.selectedGearItemId = state.player.inventory[0]?.id ?? null;
  }

  return { ok: true, message: `${item.name} stored at the depot.` };
}

function handleSpaceMovementAction() {
  const motion = world.playerMotion;

  if (!canUseMovementAbility()) {
    return;
  }

  if (isPlayerAirborne(motion) && startPlayerDive()) {
    return;
  }

  startPlayerJump();
}

function canUseMovementAbility() {
  return Boolean(
    state.selectedFactionId &&
    ui.factionSelect.classList.contains("is-hidden") &&
    !world.seatedOnThrone &&
    !world.outpostTower.active &&
    !state.player.dead
  );
}

function startPlayerJump() {
  const motion = world.playerMotion;
  motion.supportOffset = getPlayerSupportOffset(state.player.position);

  if (motion.jumping || motion.diving || isPlayerAirborne(motion)) {
    return false;
  }

  motion.jumping = true;
  motion.verticalOffset = motion.supportOffset;
  motion.verticalVelocity = JUMP_VELOCITY;
  return true;
}

function startPlayerDive() {
  const motion = world.playerMotion;

  if (!isPlayerAirborne(motion) || motion.diving || motion.diveCooldown > 0) {
    return false;
  }

  const direction = getSpaceDiveDirection();

  if (direction.lengthSq() < 0.001) {
    return false;
  }

  motion.diving = true;
  motion.diveElapsed = 0;
  motion.diveDirection.copy(direction);
  motion.verticalVelocity = Math.min(motion.verticalVelocity, DIVE_VERTICAL_VELOCITY);
  motion.jumping = false;
  return true;
}

function isPlayerAirborne(motion = world.playerMotion) {
  return motion.verticalOffset > (motion.supportOffset ?? 0) + 0.08;
}

function isPlayerDiving(motion = world.playerMotion) {
  return Boolean(motion.diving);
}

function getSpaceDiveDirection() {
  const input = getMovementInput();
  const { forward, right } = getCameraMovementBasis();
  const direction = new THREE.Vector3()
    .addScaledVector(forward, input.y)
    .addScaledVector(right, input.x);

  if (direction.lengthSq() > 0.001) {
    return direction.normalize();
  }

  const aimDirection = world.aimDirection.clone().setY(0);

  if (world.hasAim && aimDirection.lengthSq() > 0.001) {
    return aimDirection.normalize();
  }

  const angle = world.playerMesh?.rotation.y ?? world.cameraYaw;
  return new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle)).normalize();
}

function getMovementInput() {
  const input = new THREE.Vector2(0, 0);

  if (world.keys.has("KeyW") || world.keys.has("ArrowUp")) input.y += 1;
  if (world.keys.has("KeyS") || world.keys.has("ArrowDown")) input.y -= 1;
  if (world.keys.has("KeyA") || world.keys.has("ArrowLeft")) input.x -= 1;
  if (world.keys.has("KeyD") || world.keys.has("ArrowRight")) input.x += 1;

  if (input.lengthSq() > 0) {
    input.normalize();
  }

  return input;
}

function resetPlayerMovementAbility() {
  const motion = world.playerMotion;
  motion.verticalOffset = 0;
  motion.verticalVelocity = 0;
  motion.supportOffset = 0;
  motion.jumping = false;
  motion.diving = false;
  motion.diveElapsed = 0;
  motion.diveCooldown = 0;
  motion.diveDirection.set(0, 0, 1);
}

function updatePlayerJump(deltaSeconds) {
  const motion = world.playerMotion;
  const supportOffset = getPlayerSupportOffset(state.player.position);
  motion.supportOffset = supportOffset;

  if (!motion.jumping && !motion.diving && motion.verticalOffset > supportOffset + 0.05) {
    motion.jumping = true;
    motion.verticalVelocity = Math.min(0, motion.verticalVelocity);
  }

  if (!motion.jumping && !motion.diving && motion.verticalOffset <= supportOffset + 0.05) {
    motion.verticalOffset = supportOffset;
    motion.verticalVelocity = 0;
    return;
  }

  motion.verticalVelocity -= JUMP_GRAVITY * deltaSeconds;
  motion.verticalOffset += motion.verticalVelocity * deltaSeconds;

  if (motion.verticalOffset <= supportOffset) {
    motion.verticalOffset = supportOffset;
    motion.verticalVelocity = 0;
    motion.jumping = false;
  }
}

function settlePlayerSupportAfterMove() {
  const motion = world.playerMotion;
  const supportOffset = getPlayerSupportOffset(state.player.position);
  motion.supportOffset = supportOffset;

  if (motion.jumping || motion.diving) {
    if (motion.verticalVelocity <= 0 && motion.verticalOffset <= supportOffset) {
      motion.verticalOffset = supportOffset;
      motion.verticalVelocity = 0;
      motion.jumping = false;
    }
    return;
  }

  if (motion.verticalOffset <= supportOffset + 0.05) {
    motion.verticalOffset = supportOffset;
    motion.verticalVelocity = 0;
    return;
  }

  motion.jumping = true;
  motion.verticalVelocity = Math.min(0, motion.verticalVelocity);
}

function updateMovement(deltaSeconds) {
  if (!state.selectedFactionId || world.seatedOnThrone || world.outpostTower.active || state.player.dead) {
    world.playerMotion.moving = false;
    world.playerMotion.speed = 0;
    resetPlayerMovementAbility();
    return;
  }

  const input = getMovementInput();
  const speed = world.keys.has("ShiftLeft") ? 30 : 19;
  const { forward, right } = getCameraMovementBasis();
  const move = new THREE.Vector3()
    .addScaledVector(forward, input.y)
    .addScaledVector(right, input.x)
    .normalize();

  if (input.lengthSq() === 0) {
    move.set(0, 0, 0);
  }

  const motion = world.playerMotion;
  let activeMove = move;
  let activeSpeed = speed;

  if (motion.diveCooldown > 0) {
    motion.diveCooldown = Math.max(0, motion.diveCooldown - deltaSeconds);
  }

  if (motion.diving) {
    if (motion.diveElapsed >= DIVE_DURATION) {
      motion.diving = false;
      motion.diveElapsed = 0;
      motion.diveCooldown = DIVE_COOLDOWN;
      activeMove = move;
      activeSpeed = speed;
    } else {
      motion.diveElapsed = Math.min(DIVE_DURATION, motion.diveElapsed + deltaSeconds);
      activeMove = motion.diveDirection;
      activeSpeed = DIVE_SPEED;
    }
  }

  updatePlayerJump(deltaSeconds);

  world.playerMotion.moving = activeMove.lengthSq() > 0 || motion.diving;
  world.playerMotion.speed = world.playerMotion.moving ? activeSpeed : 0;

  const bounds = world.sceneMode === "interior" || world.sceneMode === "poiInterior"
    ? getInteriorMovementBounds()
    : { minX: -248, maxX: 248, minZ: -248, maxZ: 248 };

  const nextPosition = {
    x: clamp(state.player.position.x + activeMove.x * activeSpeed * deltaSeconds, bounds.minX, bounds.maxX),
    z: clamp(state.player.position.z + activeMove.z * activeSpeed * deltaSeconds, bounds.minZ, bounds.maxZ)
  };
  moveLocalPlayerTo(nextPosition, bounds);
  settlePlayerSupportAfterMove();
  applyLocalPlayerKnockbackMotion(deltaSeconds, bounds);
  resolveLocalPlayerActorCollisions(bounds);
}

function applyLocalPlayerKnockbackMotion(deltaSeconds, bounds) {
  const velocity = world.playerMotion.knockbackVelocity;

  if (!velocity || velocity.lengthSq() < 0.0025) {
    velocity?.set(0, 0, 0);
    return;
  }

  const nextPosition = {
    x: clamp(state.player.position.x + velocity.x * deltaSeconds, bounds.minX, bounds.maxX),
    z: clamp(state.player.position.z + velocity.z * deltaSeconds, bounds.minZ, bounds.maxZ)
  };
  moveLocalPlayerTo(nextPosition, bounds);
  dampKnockbackVelocity(velocity, deltaSeconds);
  settlePlayerSupportAfterMove();
}

function moveLocalPlayerTo(position, bounds, radius = PLAYER_COLLISION_RADIUS) {
  const resolvedPosition = world.sceneMode === "outdoor"
    ? resolveOutdoorSceneryCollision(position, radius)
    : position;

  state.player.position.x = clamp(resolvedPosition.x, bounds.minX, bounds.maxX);
  state.player.position.z = clamp(resolvedPosition.z, bounds.minZ, bounds.maxZ);
}

function getPlayerSupportOffset(position) {
  if (world.sceneMode !== "outdoor") {
    return 0;
  }

  const terrainY = getTerrainHeightAt(position.x, position.z);
  let supportOffset = 0;

  for (const collider of world.sceneryColliders) {
    if (collider.type !== "rock" || !collider.platformRadius) {
      continue;
    }

    const distance = Math.hypot(position.x - collider.x, position.z - collider.z);

    if (distance > collider.platformRadius) {
      continue;
    }

    supportOffset = Math.max(supportOffset, getRockPlatformWorldY(collider) - terrainY);
  }

  return Math.max(0, supportOffset);
}

function getRockPlatformWorldY(collider) {
  return (collider.groundY ?? getTerrainHeightAt(collider.x, collider.z)) + (collider.platformHeight ?? 0);
}

function canPlayerClearSceneryCollider(collider, position) {
  if (collider.type !== "rock") {
    return false;
  }

  const terrainY = getTerrainHeightAt(position.x, position.z);
  const platformOffset = getRockPlatformWorldY(collider) - terrainY;
  return world.playerMotion.verticalOffset >= platformOffset - 0.16;
}

function resolveOutdoorSceneryCollision(position, moverRadius = 1.15) {
  const resolved = { ...position };

  for (const collider of world.sceneryColliders) {
    const dx = resolved.x - collider.x;
    const dz = resolved.z - collider.z;
    const distance = Math.hypot(dx, dz);
    const minimumDistance = moverRadius + collider.radius;

    if (distance >= minimumDistance || canPlayerClearSceneryCollider(collider, resolved)) {
      continue;
    }

    if (distance < 0.001) {
      resolved.z = collider.z + minimumDistance;
      continue;
    }

    const push = minimumDistance - distance;
    resolved.x += (dx / distance) * push;
    resolved.z += (dz / distance) * push;
  }

  for (const structure of state.structures) {
    if (structure.hp <= 0) {
      continue;
    }

    if (structure.type === "wall") {
      pushCircleOutOfOrientedAabb(
        resolved,
        structure.position,
        Number.isFinite(Number(structure.rotation)) ? structure.rotation : 0,
        WALL_COLLIDER_HALF_WIDTH,
        WALL_COLLIDER_HALF_DEPTH,
        moverRadius
      );
      continue;
    }

    const radius = structure.type === "depot" ? 5.4 : structure.type === "outpost" ? 4.2 : 3.2;
    const dx = resolved.x - structure.position.x;
    const dz = resolved.z - structure.position.z;
    const distance = Math.hypot(dx, dz);
    const minimumDistance = moverRadius + radius;

    if (distance >= minimumDistance) {
      continue;
    }

    if (distance < 0.001) {
      resolved.z = structure.position.z + minimumDistance;
      continue;
    }

    const push = minimumDistance - distance;
    resolved.x += (dx / distance) * push;
    resolved.z += (dz / distance) * push;
  }

  return resolved;
}

function pushCircleOutOfAabb(position, center, halfWidth, halfDepth, radius) {
  const closestX = clamp(position.x, center.x - halfWidth, center.x + halfWidth);
  const closestZ = clamp(position.z, center.z - halfDepth, center.z + halfDepth);
  const dx = position.x - closestX;
  const dz = position.z - closestZ;
  const distance = Math.hypot(dx, dz);

  if (distance >= radius) {
    return;
  }

  if (distance > 0.001) {
    const push = radius - distance;
    position.x += (dx / distance) * push;
    position.z += (dz / distance) * push;
    return;
  }

  const left = Math.abs(position.x - (center.x - halfWidth));
  const right = Math.abs(center.x + halfWidth - position.x);
  const back = Math.abs(position.z - (center.z - halfDepth));
  const front = Math.abs(center.z + halfDepth - position.z);
  const minEdge = Math.min(left, right, back, front);

  if (minEdge === left) {
    position.x = center.x - halfWidth - radius;
  } else if (minEdge === right) {
    position.x = center.x + halfWidth + radius;
  } else if (minEdge === back) {
    position.z = center.z - halfDepth - radius;
  } else {
    position.z = center.z + halfDepth + radius;
  }
}

function pushCircleOutOfOrientedAabb(position, center, rotation, halfWidth, halfDepth, radius) {
  // Match THREE.Object3D.rotation.y on the X/Z plane.
  const sin = Math.sin(rotation);
  const cos = Math.cos(rotation);
  const dx = position.x - center.x;
  const dz = position.z - center.z;
  const local = {
    x: dx * cos - dz * sin,
    z: dx * sin + dz * cos
  };

  pushCircleOutOfAabb(local, { x: 0, z: 0 }, halfWidth, halfDepth, radius);

  position.x = center.x + local.x * cos + local.z * sin;
  position.z = center.z - local.x * sin + local.z * cos;
}

function getInteriorMovementBounds() {
  if (world.activePoiInteriorId === "ebon-hollow") {
    return { minX: -52, maxX: 52, minZ: -38, maxZ: 40 };
  }

  return { minX: -29, maxX: 29, minZ: -22, maxZ: 22 };
}

function getCameraMovementBasis() {
  const forward = new THREE.Vector3();
  world.camera.getWorldDirection(forward);
  forward.y = 0;

  if (forward.lengthSq() < 0.001) {
    forward.set(-Math.sin(world.cameraYaw), 0, -Math.cos(world.cameraYaw));
  } else {
    forward.normalize();
  }

  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
  return { forward, right };
}

function updateAimFromPointer(event) {
  if (world.outpostTower.active) {
    updateTowerAimFromPointer(event);
    return;
  }

  if (isPlayerDiving()) {
    return;
  }

  const target = getGroundPointFromPointer(event);

  if (!target) {
    return;
  }

  const direction = new THREE.Vector3(
    target.x - state.player.position.x,
    0,
    target.z - state.player.position.z
  );

  if (direction.lengthSq() < 0.001) {
    return;
  }

  world.aimPoint.copy(target);
  world.aimTarget.copy(target);
  world.aimDirection.copy(direction.normalize());
  world.hasAim = true;
  applyAimFacing();
}

function updateTowerAimFromPointer(event) {
  world.raycaster.setFromCamera(getNdcFromPointer(event), world.camera);
  world.outpostTower.aimDirection.copy(world.raycaster.ray.direction).normalize();

  const horizontal = world.outpostTower.aimDirection.clone();
  horizontal.y = 0;

  if (horizontal.lengthSq() > 0.001) {
    horizontal.normalize();
    world.aimDirection.copy(horizontal);
    world.aimTarget.set(
      state.player.position.x + horizontal.x * 42,
      0,
      state.player.position.z + horizontal.z * 42
    );
    world.hasAim = true;
  }
}

function getGroundPointFromPointer(event) {
  return getGroundPointFromNdc(getNdcFromPointer(event));
}

function getGroundPointFromScreenCenter() {
  return getGroundPointFromNdc(new THREE.Vector2(0, 0));
}

function getAimPointFromScreenCenter() {
  return getAimPointFromNdc(new THREE.Vector2(0, 0));
}

function getNdcFromPointer(event) {
  if (isLockedThirdPersonCamera()) {
    return new THREE.Vector2(0, 0);
  }

  const rect = canvas.getBoundingClientRect();
  return new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -(((event.clientY - rect.top) / rect.height) * 2 - 1)
  );
}

function getGroundPointFromNdc(ndc) {
  const target = new THREE.Vector3();

  world.raycaster.setFromCamera(ndc, world.camera);
  world.aimRayDirection.copy(world.raycaster.ray.direction).normalize();
  if (world.sceneMode === "outdoor" && world.meshes.terrain) {
    const terrainHit = world.raycaster.intersectObject(world.meshes.terrain, false)[0];
    if (terrainHit) {
      return terrainHit.point;
    }
  }

  return world.raycaster.ray.intersectPlane(world.groundPlane, target) ? target : null;
}

function getAimPointFromNdc(ndc) {
  const fallbackTarget = new THREE.Vector3();

  world.raycaster.setFromCamera(ndc, world.camera);
  world.aimRayDirection.copy(world.raycaster.ray.direction).normalize();

  const combatMeshes = getActiveCombatTargets()
    .map((target) => target.mesh)
    .filter((mesh) => mesh?.isObject3D);
  const combatHit = combatMeshes.length
    ? world.raycaster.intersectObjects(combatMeshes, true)[0]
    : null;

  if (combatHit) {
    return combatHit.point;
  }

  if (world.sceneMode === "outdoor" && world.meshes.terrain) {
    const terrainHit = world.raycaster.intersectObject(world.meshes.terrain, false)[0];
    if (terrainHit) {
      return terrainHit.point;
    }
  }

  if (world.raycaster.ray.intersectPlane(world.groundPlane, fallbackTarget)) {
    return fallbackTarget;
  }

  return world.raycaster.ray.origin.clone().addScaledVector(world.raycaster.ray.direction, 90);
}

function applyAimFacing() {
  if (!world.playerMesh || !world.hasAim || isPlayerDiving()) {
    return;
  }

  const direction = new THREE.Vector3(
    world.aimTarget.x - state.player.position.x,
    0,
    world.aimTarget.z - state.player.position.z
  );

  if (direction.lengthSq() < 0.001) {
    return;
  }

  world.aimDirection.copy(direction.normalize());
  if (world.seatedOnThrone) {
    world.playerMesh.rotation.y = 0;
    world.playerRig.headGroup.rotation.y = clamp(Math.atan2(world.aimDirection.x, world.aimDirection.z), -0.85, 0.85);
  } else {
    world.playerRig.headGroup.rotation.y = 0;
    world.playerMesh.rotation.y = Math.atan2(world.aimDirection.x, world.aimDirection.z);
  }
  document.body.dataset.aimX = world.aimDirection.x.toFixed(3);
  document.body.dataset.aimZ = world.aimDirection.z.toFixed(3);
}

function updateBaseHoverFromPointer(event) {
  if (ui.factionSelect && !ui.factionSelect.classList.contains("is-hidden")) {
    hideBaseTooltip();
    return;
  }

  const hit = getBaseHitFromPointer(event);

  if (!hit) {
    hideBaseTooltip();
    return;
  }

  showBaseTooltip(hit.object.userData.factionId, event.clientX, event.clientY);
}

function getBaseHitFromPointer(event) {
  if (world.sceneMode !== "outdoor") {
    return null;
  }

  world.raycaster.setFromCamera(getNdcFromPointer(event), world.camera);

  return world.raycaster
    .intersectObjects(world.hoverBases, true)
    .find((entry) => entry.object.userData.factionId);
}

function showBaseTooltip(factionId, x, y) {
  const faction = FACTION_LOOKUP[factionId];
  const store = state.factionResources[factionId];

  if (!faction || !store) {
    hideBaseTooltip();
    return;
  }

  ui.baseTooltip.innerHTML = `
    <strong>${faction.name}</strong>
    <span>Gold ${Math.round(store.gold)}</span>
    ${RESOURCE_TYPES.map((resource) => `<span>${resource.name} ${store.resources[resource.id] ?? 0}</span>`).join("")}
  `;
  ui.baseTooltip.classList.remove("is-hidden");
  ui.baseTooltip.setAttribute("aria-hidden", "false");
  positionBaseTooltip(x, y);
}

function positionBaseTooltip(x, y) {
  const margin = 14;
  const width = ui.baseTooltip.offsetWidth || 170;
  const height = ui.baseTooltip.offsetHeight || 150;
  const left = Math.min(window.innerWidth - width - margin, x + margin);
  const top = Math.min(window.innerHeight - height - margin, y + margin);

  ui.baseTooltip.style.left = `${Math.max(margin, left)}px`;
  ui.baseTooltip.style.top = `${Math.max(margin, top)}px`;
}

function hideBaseTooltip() {
  ui.baseTooltip.classList.add("is-hidden");
  ui.baseTooltip.setAttribute("aria-hidden", "true");
}

function startSpaceLocationAction() {
  if (world.baseEntryAction?.source === "space") {
    return true;
  }

  const action = getAvailableLocationAction();

  if (!action) {
    return false;
  }

  world.baseEntryAction = {
    ...action,
    source: "space",
    elapsed: 0,
    duration: action.type === "claimPoiFlag" ? POI_FLAG_HOLD_DURATION : LOCATION_HOLD_DURATION
  };
  document.body.dataset.castleTransition = action.type;
  document.body.dataset.enteringProgress = "0";
  updateLocationPrompt();
  return true;
}

function stopSpaceLocationAction() {
  if (world.baseEntryAction?.source === "space") {
    stopBaseEntryAction();
    updateLocationPrompt();
  }
}

function getAvailableLocationAction() {
  if (!state.selectedFactionId || !ui.factionSelect.classList.contains("is-hidden") || isBlockingLocationInput()) {
    return null;
  }

  if (world.sceneMode === "outdoor") {
    if (world.outpostTower.active) {
      return {
        type: "exitOutpost",
        label: "Outpost",
        prompt: "Hold Space to climb down"
      };
    }

    const outpost = getNearestOwnedStructure("outpost", 8);

    if (outpost) {
      return {
        type: "enterOutpost",
        label: "Outpost",
        prompt: "Hold Space to ascend the outpost",
        structureId: outpost.id
      };
    }

    const depot = getNearestOwnedStructure("depot", 9);

    if (depot) {
      return {
        type: "depositDepot",
        label: "Depot",
        prompt: "Hold Space to deposit resources at the depot",
        structureId: depot.id
      };
    }

    const faction = FACTION_LOOKUP[state.selectedFactionId];

    if (faction && distance2D(state.player.position, faction.position) <= faction.safeRadius + 5) {
      return {
        type: "enterCastle",
        label: `${faction.name} Keep`,
        prompt: `Hold Space to enter ${faction.name} Keep`,
        factionId: faction.id
      };
    }

    const nearest = getNearestPoi(state);

    if (nearest && nearest.distance <= nearest.poi.radius + 6) {
      return {
        type: "enterPoi",
        label: nearest.poi.name,
        prompt: `Hold Space to enter ${nearest.poi.name}`,
        poiId: nearest.poi.id
      };
    }

    return null;
  }

  if (world.sceneMode === "interior") {
    const rulerSeatAction = getAvailableRulerSeatAction();

    if (rulerSeatAction) {
      return rulerSeatAction;
    }

    if (isNearCastleExit()) {
      return {
        type: "exitCastle",
        label: "Wildlands",
        prompt: "Hold Space to leave the keep"
      };
    }
  }

  if (world.sceneMode === "poiInterior") {
    const flagAction = getAvailablePoiFlagAction();

    if (flagAction) {
      return flagAction;
    }

    if (isNearPoiExit()) {
      return {
        type: "exitPoi",
        label: "Wildlands",
        prompt: "Hold Space to return outside"
      };
    }
  }

  return null;
}

function getAvailablePoiFlagAction() {
  const poi = getActivePoiInterior();
  const playerFaction = state.selectedFactionId ? FACTION_LOOKUP[state.selectedFactionId] : null;

  if (!poi || poi.type === "Dungeon" || !playerFaction || poi.ownerFactionId === playerFaction.id || !isNearPoiFlagpole()) {
    return null;
  }

  const owner = poi.ownerFactionId ? FACTION_LOOKUP[poi.ownerFactionId] : null;

  return {
    type: "claimPoiFlag",
    phase: owner ? "lower" : "raise",
    label: `${poi.name} Flagpole`,
    prompt: owner ? `Hold Space to lower ${owner.name} flag` : `Hold Space to raise ${playerFaction.name} flag`,
    poiId: poi.id
  };
}

function getActivePoiInterior() {
  return world.activePoiInteriorId ? state.pois.find((poi) => poi.id === world.activePoiInteriorId) ?? null : null;
}

function getNearestOwnedStructure(type, maxDistance) {
  if (!state.selectedFactionId || world.sceneMode !== "outdoor") {
    return null;
  }

  return (
    state.structures
      .filter(
        (structure) =>
          structure.type === type &&
          structure.ownerFactionId === state.selectedFactionId &&
          structure.hp > 0
      )
      .map((structure) => ({
        structure,
        distance: distance2D(state.player.position, structure.position)
      }))
      .filter((entry) => entry.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance)[0]?.structure ?? null
  );
}

function isBlockingLocationInput() {
  return (
    !ui.inventoryPanel.classList.contains("is-hidden") ||
    !ui.buildPanel.classList.contains("is-hidden") ||
    !ui.statusPanel.classList.contains("is-hidden") ||
    !ui.npcTradePanel.classList.contains("is-hidden") ||
    !ui.stewardPanel.classList.contains("is-hidden") ||
    !ui.depotPanel.classList.contains("is-hidden") ||
    !ui.rulerPanel.classList.contains("is-hidden")
  );
}

function isNearCastleExit() {
  return Math.abs(state.player.position.x) <= 18 && state.player.position.z >= 11;
}

function getAvailableRulerSeatAction() {
  const factionId = world.interiorFactionId;

  if (!factionId || state.selectedFactionId !== factionId || !isNearRulerSeat()) {
    return null;
  }

  const currentRulerName = getFactionRulerName(state, factionId);

  if (currentRulerName && !isFactionRuler(state, factionId)) {
    return null;
  }

  return {
    type: "throne",
    label: "Throne",
    prompt: currentRulerName ? "Hold Space to sit on the throne" : "Hold Space to claim the throne",
    factionId
  };
}

function isNearRulerSeat() {
  return world.sceneMode === "interior" && distance2D(state.player.position, { x: 0, z: -20.3 }) <= 7.5;
}

function isNearPoiExit() {
  return Math.abs(state.player.position.x) <= 18 && state.player.position.z >= 13;
}

function isNearPoiFlagpole() {
  return world.sceneMode === "poiInterior" && distance2D(state.player.position, POI_FLAG_POSITION) <= POI_FLAG_INTERACTION_RANGE;
}

function updateLocationPrompt() {
  const action = world.baseEntryAction?.source === "space" ? world.baseEntryAction : getAvailableLocationAction();

  if (!action) {
    ui.locationPrompt.classList.add("is-hidden");
    ui.locationPrompt.setAttribute("aria-hidden", "true");
    ui.locationPromptProgress.style.width = "0%";
    return;
  }

  const progress = world.baseEntryAction?.source === "space"
    ? Math.min(1, world.baseEntryAction.elapsed / world.baseEntryAction.duration)
    : 0;

  ui.locationPromptTitle.textContent = action.prompt;
  ui.locationPromptProgress.style.width = `${Math.round(progress * 100)}%`;
  ui.locationPrompt.classList.remove("is-hidden");
  ui.locationPrompt.setAttribute("aria-hidden", "false");
}

function startBaseEntryAction(event) {
  if (world.sceneMode === "interior") {
    return startInteriorExitAction(event) || startRulerSeatAction(event);
  }

  if (world.sceneMode !== "outdoor") {
    return false;
  }

  const hit = getBaseHitFromPointer(event);

  if (!hit) {
    return false;
  }

  if (hit.object.userData.factionId !== state.selectedFactionId) {
    flash("You can only enter your own faction keep.");
    return false;
  }

  world.baseEntryAction = {
    type: "enter",
    factionId: hit.object.userData.factionId,
    elapsed: 0,
    duration: 0.95
  };
  document.body.dataset.enteringBase = hit.object.userData.factionId;
  document.body.dataset.enteringProgress = "0";
  return true;
}

function startRulerSeatAction(event) {
  if (!world.interiorFactionId || state.selectedFactionId !== world.interiorFactionId) {
    return false;
  }

  const hit = getRulerSeatHitFromPointer(event);

  if (!hit) {
    return false;
  }

  world.baseEntryAction = {
    type: "throne",
    factionId: world.interiorFactionId,
    elapsed: 0,
    duration: 0.95
  };
  document.body.dataset.castleTransition = "throne";
  document.body.dataset.enteringProgress = "0";
  return true;
}

function getRulerSeatHitFromPointer(event) {
  if (world.sceneMode !== "interior" || !world.throneSeat) {
    return null;
  }

  world.raycaster.setFromCamera(getNdcFromPointer(event), world.camera);
  return world.raycaster
    .intersectObjects(world.interiorRoot.children, true)
    .find((entry) => entry.object.userData.rulerSeat);
}

function openNpcPanelFromPointer(event) {
  if (event.button !== 0) {
    return false;
  }

  const stewardHit = getStewardNpcHitFromPointer(event);

  if (stewardHit) {
    openStewardPanel();
    return true;
  }

  const hit = getTradeNpcHitFromPointer(event);

  if (!hit) {
    return false;
  }

  openNpcTradePanel(hit.object.userData.tradeNpcId);
  return true;
}

function getTradeNpcHitFromPointer(event) {
  if (world.sceneMode !== "poiInterior" || world.activePoiInteriorId !== "river-market" || !world.tradeNpcs.length) {
    return null;
  }

  world.raycaster.setFromCamera(getNdcFromPointer(event), world.camera);
  return world.raycaster
    .intersectObjects(world.tradeNpcs, true)
    .find((entry) => entry.object.userData.tradeNpcId);
}

function getStewardNpcHitFromPointer(event) {
  if (world.sceneMode !== "interior" || !world.stewardNpcs.length) {
    return null;
  }

  world.raycaster.setFromCamera(getNdcFromPointer(event), world.camera);
  return world.raycaster
    .intersectObjects(world.stewardNpcs, true)
    .find((entry) => entry.object.userData.stewardNpc);
}

function tryPickupDroppedItemFromPointer(event) {
  if (event.button !== 0 || world.sceneMode !== "outdoor" || !world.droppedItems.length) {
    return false;
  }

  const hit = getDroppedItemHitFromPointer(event);

  if (!hit) {
    return false;
  }

  const dropId = hit.object.userData.droppedItemId;
  const drop = world.droppedItems.find((entry) => entry.id === dropId);

  if (!drop) {
    return false;
  }

  if (distance2D(state.player.position, drop.position) > DROPPED_ITEM_PICKUP_RANGE) {
    flash(`Move closer to pick up ${drop.item.name}.`);
    return true;
  }

  state.player.inventory.push(drop.item);
  state.player.selectedGearItemId = drop.item.id;
  removeDroppedItem(drop.id);
  markPersistenceDirty();
  refreshUi();
  flash(`Picked up ${drop.item.name}.`);
  return true;
}

function getDroppedItemHitFromPointer(event) {
  if (!world.droppedItems.length) {
    return null;
  }

  world.raycaster.setFromCamera(getNdcFromPointer(event), world.camera);
  const meshHit = world.raycaster
    .intersectObjects(world.droppedItems.map((entry) => entry.mesh), true)
    .find((entry) => entry.object.userData.droppedItemId);

  if (meshHit || !isLockedThirdPersonCamera()) {
    return meshHit;
  }

  const target = getGroundPointFromScreenCenter();

  if (!target) {
    return null;
  }

  const nearestDrop = world.droppedItems
    .filter((drop) => distance2D(state.player.position, drop.position) <= DROPPED_ITEM_PICKUP_RANGE)
    .map((drop) => ({
      drop,
      distance: Math.hypot(drop.position.x - target.x, drop.position.z - target.z)
    }))
    .filter((entry) => entry.distance <= LOCKED_DROPPED_ITEM_PICKUP_ASSIST_RADIUS)
    .sort((a, b) => a.distance - b.distance)[0]?.drop;

  return nearestDrop ? { object: { userData: { droppedItemId: nearestDrop.id } } } : null;
}

function removeDroppedItem(dropId) {
  const drop = world.droppedItems.find((entry) => entry.id === dropId);

  if (!drop) {
    return;
  }

  removeFromParent(drop.mesh);
  world.droppedItems = world.droppedItems.filter((entry) => entry.id !== dropId);
  document.body.dataset.droppedItems = String(world.droppedItems.length);
}

function startInteriorExitAction(event) {
  const target = getGroundPointFromPointer(event);

  if (!target || !isInteriorDoorExitTarget(target)) {
    return false;
  }

  world.baseEntryAction = {
    type: "exit",
    elapsed: 0,
    duration: 0.95
  };
  document.body.dataset.castleTransition = "exit";
  document.body.dataset.enteringProgress = "0";
  return true;
}

function isInteriorDoorExitTarget(target) {
  const playerNearDoor = Math.abs(state.player.position.x) <= 18 && state.player.position.z >= 11;
  const pointerBeyondDoor = Math.abs(target.x) <= 12 && target.z >= 22 && target.z <= 36;
  return playerNearDoor && pointerBeyondDoor;
}

function stopBaseEntryAction() {
  world.baseEntryAction = null;
  delete document.body.dataset.enteringBase;
  delete document.body.dataset.castleTransition;
  delete document.body.dataset.enteringProgress;
}

function updateBaseEntryAction(deltaSeconds) {
  const action = world.baseEntryAction;

  if (!action) {
    return;
  }

  action.elapsed += deltaSeconds;
  document.body.dataset.enteringProgress = String(Math.min(1, action.elapsed / action.duration).toFixed(2));
  updateLocationPrompt();

  if (action.elapsed >= action.duration) {
    if (action.type === "exit" || action.type === "exitCastle") {
      leaveCastleInterior();
    } else if (action.type === "exitPoi") {
      leavePoiInterior();
    } else if (action.type === "throne") {
      resolveRulerSeatAction(action.factionId);
    } else if (action.type === "enterCastle") {
      enterCastleInterior(action.factionId);
    } else if (action.type === "enterPoi") {
      enterPoiInterior(action.poiId);
    } else if (action.type === "claimPoiFlag") {
      resolvePoiFlagAction(action);
    } else if (action.type === "enterOutpost") {
      enterOutpostTower(action.structureId);
    } else if (action.type === "exitOutpost") {
      exitOutpostTower();
    } else if (action.type === "depositDepot") {
      openDepotPanel(action.structureId);
    } else {
      enterCastleInterior(action.factionId);
    }
  }
}

function resolvePoiFlagAction(action) {
  const poi = state.pois.find((entry) => entry.id === action.poiId);
  const playerFaction = state.selectedFactionId ? FACTION_LOOKUP[state.selectedFactionId] : null;

  if (!poi || poi.type === "Dungeon" || !playerFaction || !isNearPoiFlagpole()) {
    stopBaseEntryAction();
    flash("Move back to the flagpole.");
    refreshUi();
    return;
  }

  if (poi.ownerFactionId === playerFaction.id) {
    stopBaseEntryAction();
    flash(`${poi.name} already flies your banner.`);
    refreshUi();
    return;
  }

  if (action.phase === "lower" && poi.ownerFactionId) {
    const owner = FACTION_LOOKUP[poi.ownerFactionId];
    poi.ownerFactionId = null;
    poi.pulse = 0;
    poi.workerRespawnAt = 0;
    for (const courier of state.couriers.filter((entry) => entry.kind === "poiWorker" && entry.fromPoiId === poi.id)) {
      removeFromParent(world.meshes.couriers.get(courier.id));
      world.meshes.couriers.delete(courier.id);
      world.courierVisuals.delete(courier.id);
    }
    state.couriers = state.couriers.filter((entry) => entry.kind !== "poiWorker" || entry.fromPoiId !== poi.id);
    action.phase = "raise";
    action.elapsed = 0;
    action.duration = POI_FLAG_HOLD_DURATION;
    action.prompt = `Hold Space to raise ${playerFaction.name} flag`;
    document.body.dataset.enteringProgress = "0";
    markPersistenceDirty();
    refreshUi();
    flash(`${owner?.name ?? "The old"} flag lowered. Keep holding to raise yours.`);
    return;
  }

  stopBaseEntryAction();
  runAction(claimPoi(state, poi.id));
}

function resolveRulerSeatAction(factionId) {
  stopBaseEntryAction();

  if (isFactionRuler(state, factionId)) {
    sitOnRulerSeat();
    setRulerPanelOpen(true);
    return;
  }

  const result = claimFactionRulerSeat(state, factionId);
  runAction(result);

  if (result.ok) {
    sitOnRulerSeat();
    setRulerPanelOpen(true);
  }
}

function enterOutpostTower(structureId) {
  const structure = state.structures.find((entry) => entry.id === structureId);

  stopBaseEntryAction();

  if (!structure || structure.type !== "outpost" || structure.hp <= 0) {
    flash("That outpost is no longer standing.");
    return;
  }

  if (structure.ownerFactionId !== state.selectedFactionId) {
    flash("Only this faction can ascend the outpost.");
    return;
  }

  world.outpostTower.active = true;
  world.outpostTower.structureId = structure.id;
  world.outpostTower.position = { ...structure.position };
  world.outpostTower.elevation = getTerrainHeightAt(structure.position.x, structure.position.z) + 16.2;
  world.outpostTower.aimDirection.set(0, -0.12, 1).normalize();
  world.outpostTower.drawStartedAt = 0;
  world.outpostTower.shotCooldown = 0;
  state.player.position.x = structure.position.x;
  state.player.position.z = structure.position.z;
  world.playerMotion.moving = false;
  world.playerMotion.speed = 0;
  world.hasAim = true;
  world.aimDirection.set(0, 0, 1);
  world.aimTarget.set(structure.position.x, 0, structure.position.z + 30);
  clearRangedCharge();
  stopWorkAction();
  closeNpcTradePanel();
  closeStewardPanel();
  closeDepotPanel();
  setStatusPanelOpen(false);
  setInventoryPanelOpen(false);
  setBuildPanelOpen(false);
  flash("You climbed into the outpost.");
}

function exitOutpostTower() {
  if (!world.outpostTower.active) {
    return;
  }

  const structure = state.structures.find((entry) => entry.id === world.outpostTower.structureId);
  const angle = world.playerMesh?.rotation.y ?? 0;
  const exitDistance = 5.8;
  state.player.position.x = (structure?.position.x ?? world.outpostTower.position.x) + Math.sin(angle) * exitDistance;
  state.player.position.z = (structure?.position.z ?? world.outpostTower.position.z) + Math.cos(angle) * exitDistance;
  world.outpostTower.active = false;
  world.outpostTower.structureId = null;
  world.outpostTower.drawStartedAt = 0;
  world.hasAim = false;
  clearRangedCharge();
  flash("You climbed down from the outpost.");
}

function sitOnRulerSeat() {
  state.player.position.x = 0;
  state.player.position.z = -20.3;
  world.seatedOnThrone = true;
  world.hasAim = true;
  world.aimTarget.set(0, 0, 0);
  world.aimDirection.set(0, 0, 1);
  world.playerMotion.moving = false;
  world.playerMotion.speed = 0;
  applyAimFacing();
  applySeatedPose();
  document.body.dataset.seatedOnThrone = "true";
}

function leaveRulerSeat() {
  if (!world.seatedOnThrone) {
    return;
  }

  world.seatedOnThrone = false;
  state.player.position.x = 0;
  state.player.position.z = -15.2;
  world.playerRig.headGroup.rotation.set(0, 0, 0);
  world.hasAim = false;
  delete document.body.dataset.seatedOnThrone;
}

function enterCastleInterior(factionId) {
  const faction = FACTION_LOOKUP[factionId];

  if (!faction) {
    stopBaseEntryAction();
    return;
  }

  world.outdoorReturnPosition = { ...state.player.position };
  world.sceneMode = "interior";
  world.interiorFactionId = factionId;
  world.activePoiInteriorId = null;
  world.outdoorRoot.visible = false;
  world.interiorRoot.visible = true;
  world.poiInteriorRoot.visible = false;
  setActivePoiInterior(null);
  state.player.position.x = 0;
  state.player.position.z = 17;
  world.cameraYaw = 0;
  world.cameraPitch = 0.6;
  world.hasAim = false;
  stopWorkAction();
  stopBaseEntryAction();
  hideBaseTooltip();
  closeNpcTradePanel();
  closeStewardPanel();
  closeDepotPanel();
  clearProjectiles();
  leaveRulerSeat();
  setRulerPanelOpen(false, { leaveSeat: false });
  ui.interiorTitle.textContent = `${faction.name} Keep`;
  ui.leaveInterior.textContent = "Leave Keep";
  ui.interiorHint.classList.remove("is-hidden");
  ui.interiorHint.setAttribute("aria-hidden", "false");
  refreshUi();
}

function leaveCastleInterior() {
  if (world.sceneMode !== "interior") {
    return;
  }

  leaveRulerSeat();
  world.sceneMode = "outdoor";
  world.interiorFactionId = null;
  world.activePoiInteriorId = null;
  world.outdoorRoot.visible = true;
  world.interiorRoot.visible = false;
  world.poiInteriorRoot.visible = false;
  setActivePoiInterior(null);
  state.player.position.x = world.outdoorReturnPosition.x;
  state.player.position.z = world.outdoorReturnPosition.z;
  world.cameraYaw = Math.PI * 0.25;
  world.cameraPitch = 0.6;
  world.hasAim = false;
  stopWorkAction();
  stopBaseEntryAction();
  hideBaseTooltip();
  closeNpcTradePanel();
  closeStewardPanel();
  closeDepotPanel();
  clearProjectiles();
  setRulerPanelOpen(false, { leaveSeat: false });
  ui.interiorHint.classList.add("is-hidden");
  ui.interiorHint.setAttribute("aria-hidden", "true");
  refreshUi();
}

function enterPoiInterior(poiId) {
  const poi = state.pois.find((entry) => entry.id === poiId);

  if (!poi) {
    stopBaseEntryAction();
    return;
  }

  world.outdoorReturnPosition = { ...state.player.position };
  world.sceneMode = "poiInterior";
  world.interiorFactionId = null;
  world.activePoiInteriorId = poiId;
  world.outdoorRoot.visible = false;
  world.interiorRoot.visible = false;
  world.poiInteriorRoot.visible = true;
  setActivePoiInterior(poiId);
  state.player.position.x = 0;
  state.player.position.z = 17;
  world.cameraYaw = 0;
  world.cameraPitch = 0.6;
  world.hasAim = false;
  stopWorkAction();
  stopBaseEntryAction();
  hideBaseTooltip();
  closeNpcTradePanel();
  closeStewardPanel();
  closeDepotPanel();
  clearProjectiles();
  leaveRulerSeat();
  setRulerPanelOpen(false, { leaveSeat: false });
  ui.interiorTitle.textContent = poi.name;
  ui.leaveInterior.textContent = "Leave POI";
  ui.interiorHint.classList.remove("is-hidden");
  ui.interiorHint.setAttribute("aria-hidden", "false");
  refreshUi();
}

function leavePoiInterior() {
  if (world.sceneMode !== "poiInterior") {
    return;
  }

  world.sceneMode = "outdoor";
  world.activePoiInteriorId = null;
  world.outdoorRoot.visible = true;
  world.interiorRoot.visible = false;
  world.poiInteriorRoot.visible = false;
  setActivePoiInterior(null);
  state.player.position.x = world.outdoorReturnPosition.x;
  state.player.position.z = world.outdoorReturnPosition.z;
  world.cameraYaw = Math.PI * 0.25;
  world.cameraPitch = 0.6;
  world.hasAim = false;
  stopWorkAction();
  stopBaseEntryAction();
  hideBaseTooltip();
  closeNpcTradePanel();
  closeStewardPanel();
  closeDepotPanel();
  clearProjectiles();
  ui.interiorHint.classList.add("is-hidden");
  ui.interiorHint.setAttribute("aria-hidden", "true");
  refreshUi();
}

function leaveCurrentInterior() {
  if (world.sceneMode === "poiInterior") {
    leavePoiInterior();
  } else {
    leaveCastleInterior();
  }
}

function setActivePoiInterior(poiId) {
  for (const [id, group] of world.meshes.poiInteriors) {
    group.visible = id === poiId;
  }
}

function resetPveEnemiesForPoi(poiId) {
  if (!GAME_FLAGS.pve || poiId !== "ebon-hollow") {
    return;
  }

  for (const enemy of world.pveEnemies) {
    enemy.hp = enemy.maxHp;
    enemy.dead = false;
    enemy.deathTimer = 0;
    enemy.attackTimer = Math.random() * 0.8;
    resetPveEnemyAttackState(enemy);
    enemy.knockbackVelocity?.set(0, 0, 0);
    setPveEnemyWeapon(enemy, createRandomPveWeapon());
    setPveEnemyArmor(enemy, createRandomPveArmorSet());
    enemy.mesh.visible = true;
    enemy.mesh.scale.set(1, 1, 1);
    enemy.mesh.position.set(enemy.spawn.x, 0, enemy.spawn.z);
    updatePveEnemyHealthBar(enemy);
  }
}

function tryAttackFromPointer(hand, rangedChargePower = 0) {
  if (state.player.dead) {
    flash("You are respawning.");
    return false;
  }

  const result = performWeaponAttack(state, hand);

  if (!result.ok) {
    return false;
  }

  const kind = getAttackKind(result.item.type);
  const profile = getCombatProfile(result.item.type);
  const chargePower = isChargeableRangedType(result.item.type) ? clamp(rangedChargePower, 0, 1) : 0;
  const range = getEffectiveAttackRange(result.item, result.stats, chargePower);
  const damage = getEffectiveAttackDamage(result.item, result.stats, chargePower);
  const duration = getAttackDuration(result.item.type, result.stats, chargePower);
  const slashDirection = kind === "slash" || kind === "chop" ? getNextSlashDirection(hand) : 0;
  const attackDirection = world.aimDirection.clone();
  attackDirection.y = 0;
  if (attackDirection.lengthSq() > 0.001) {
    attackDirection.normalize();
  } else {
    attackDirection.set(0, 0, 1);
  }

  const aimPoint = world.hasAim ? world.aimPoint.clone() : null;
  const aimRayDirection = world.aimRayDirection.lengthSq() > 0.001
    ? world.aimRayDirection.clone().normalize()
    : null;
  world.attacks[hand] = {
    hand,
    itemName: result.item.name,
    itemType: result.item.type,
    kind,
    profile,
    range,
    damage,
    penetration: result.stats.penetration ?? 0,
    knockback: result.stats.knockback ?? 0,
    speed: result.stats.speed,
    direction: attackDirection,
    aimPoint,
    aimRayDirection,
    chargePower,
    slashDirection,
    elapsed: 0,
    duration,
    projectileSpawned: false,
    hitResolved: isProjectileWeapon(result.item.type)
  };

  refreshUi();
  return true;
}

function startWorkAction(hand) {
  if (world.sceneMode !== "outdoor" || getEquippedItem(state, hand)) {
    return false;
  }

  const target = world.hasAim ? world.aimTarget : null;
  const poi = target ? getPoiAtPoint(target) : null;

  if (!poi) {
    return false;
  }

  const playerDistance = distance2D(state.player.position, poi.position);

  if (playerDistance > poi.radius + 5) {
    flash(`Move closer to ${poi.name}.`);
    return false;
  }

  world.workAction = {
    hand,
    poiId: poi.id,
    resourceId: poi.resourceId,
    yield: poi.yield,
    elapsed: 0,
    duration: 1.15
  };
  document.body.dataset.workingHand = hand;
  document.body.dataset.workingPoi = poi.id;
  document.body.dataset.workingProgress = "0";
  return true;
}

function getPoiAtPoint(point) {
  return (
    state.pois
      .filter((poi) => distance2D(point, poi.position) <= poi.radius + 1.5)
      .sort((a, b) => distance2D(point, a.position) - distance2D(point, b.position))[0] ?? null
  );
}

function stopWorkAction() {
  if (!world.workAction) {
    return;
  }

  const hand = world.workAction.hand;
  const mount = hand === "left" ? world.leftHandMount : world.rightHandMount;
  const base = getHandBasePose(hand);

  mount.position.copy(base.position);
  mount.rotation.copy(base.rotation);
  world.workAction = null;
  delete document.body.dataset.workingHand;
  delete document.body.dataset.workingPoi;
  delete document.body.dataset.workingProgress;
}

function updateWorkAction(deltaSeconds) {
  const action = world.workAction;

  if (!action) {
    return;
  }

  if (getEquippedItem(state, action.hand)) {
    stopWorkAction();
    return;
  }

  const nearest = getNearestPoi(state);

  if (!nearest || nearest.poi.id !== action.poiId || nearest.distance > nearest.poi.radius + 5) {
    stopWorkAction();
    return;
  }

  action.elapsed += deltaSeconds;
  animateWorkAction(action);

  if (action.elapsed < action.duration) {
    document.body.dataset.workingProgress = String(Math.min(1, action.elapsed / action.duration).toFixed(2));
    return;
  }

  completeWorkAction(action);
  action.elapsed = 0;
  document.body.dataset.workingProgress = "0";
}

function animateWorkAction(action) {
  const mount = action.hand === "left" ? world.leftHandMount : world.rightHandMount;
  const side = HAND_CONFIG[action.hand].side;
  const base = getHandBasePose(action.hand);
  const progress = (action.elapsed % action.duration) / action.duration;
  const stroke = Math.sin(progress * Math.PI);
  const cycle = Math.sin(progress * Math.PI * 2);

  mount.position.copy(base.position);
  mount.rotation.copy(base.rotation);
  mount.position.z += stroke * 0.36;
  mount.position.y -= stroke * 0.26;
  mount.position.x += side * cycle * 0.08;
  mount.rotation.x -= 0.55 + stroke * 0.48;
  mount.rotation.z += side * cycle * 0.28;
  poseAttackArm(action.hand, -0.72 - stroke * 0.34, side * (0.16 + stroke * 0.14), side * cycle * 0.12, 0.42 + stroke * 0.22, -0.04 * stroke);
}

function completeWorkAction(action) {
  const poi = state.pois.find((entry) => entry.id === action.poiId);
  const amount = poi?.yield ?? action.yield;
  const resourceId = poi?.resourceId ?? action.resourceId;

  if (resourceId === "gold") {
    state.player.gold += amount;
  } else {
    state.player.resources[resourceId] += amount;
  }

  state.player.renown += 1;
  markPersistenceDirty();
  refreshUi();
}

function isProjectileWeapon(itemType) {
  return isProjectileCombatType(itemType);
}

function isChargeableRangedType(itemType) {
  return isChargeableCombatType(itemType);
}

function canChargeRangedHand(hand) {
  const item = getEquippedItem(state, hand);
  return isChargeableRangedType(item?.type);
}

function getRangedChargePower(hand) {
  const charge = world.pointer.rangedCharge;

  if (!charge || charge.hand !== hand) {
    return 0;
  }

  return clamp((performance.now() - charge.startedAt) / 900, 0, 1);
}

function clearRangedCharge() {
  world.pointer.rangedCharge = null;
  world.outpostTower.drawStartedAt = 0;
  delete document.body.dataset.rangedCharge;
  delete document.body.dataset.rangedChargeHand;
}

function tryTowerBowAttack() {
  if (!world.outpostTower.active) {
    return false;
  }

  if (world.outpostTower.shotCooldown > 0) {
    return false;
  }

  const drawPower = clamp((performance.now() - (world.outpostTower.drawStartedAt || performance.now())) / 850, 0.25, 1);
  spawnTowerProjectile(drawPower);
  world.outpostTower.shotCooldown = 0.55;
  world.outpostTower.drawStartedAt = 0;
  return true;
}

function updateOutpostDefenses(deltaSeconds) {
  if (world.sceneMode !== "outdoor") {
    delete document.body.dataset.outpostDefenders;
    return;
  }

  const activeOutposts = state.structures.filter(
    (structure) => structure.type === "outpost" && structure.hp > 0 && structure.ownerFactionId
  );
  const activeIds = new Set(activeOutposts.map((structure) => structure.id));

  for (const id of world.outpostDefenses.keys()) {
    if (!activeIds.has(id)) {
      world.outpostDefenses.delete(id);
    }
  }

  for (const structure of activeOutposts) {
    let defense = world.outpostDefenses.get(structure.id);

    if (!defense) {
      defense = { cooldown: randomBetween(0.35, OUTPOST_ATTACK_INTERVAL) };
      world.outpostDefenses.set(structure.id, defense);
    }

    defense.cooldown = Math.max(0, defense.cooldown - deltaSeconds);

    if (defense.cooldown > 0) {
      continue;
    }

    const target = getBestOutpostDefenseTarget(structure);

    if (!target) {
      defense.cooldown = 0.45;
      continue;
    }

    spawnOutpostDefenseProjectile(structure, target);
    defense.cooldown = OUTPOST_ATTACK_INTERVAL + randomBetween(-0.25, 0.45);
  }

  document.body.dataset.outpostDefenders = String(activeOutposts.length);
}

function getBestOutpostDefenseTarget(structure) {
  return getOutpostDefenseTargets(structure)
    .map((target) => ({
      target,
      distance: distance2D(structure.position, getCombatTargetGroundPosition(target))
    }))
    .filter((entry) => entry.distance <= OUTPOST_ATTACK_RANGE)
    .sort((a, b) => a.distance - b.distance)[0]?.target ?? null;
}

function getOutpostDefenseTargets(structure) {
  return [
    ...getOutpostPveTargets(),
    ...getOutpostEnemyPlayerTargets(structure)
  ];
}

function getOutpostPveTargets() {
  if (!GAME_FLAGS.pve || world.sceneMode !== "outdoor") {
    return [];
  }

  return world.outdoorMonsters.filter((monster) => monster.mesh.visible && !monster.dead && !monster.removed);
}

function getOutpostEnemyPlayerTargets(structure) {
  const targets = [];

  if (!structure.ownerFactionId) {
    return targets;
  }

  if (
    state.selectedFactionId &&
    !state.player.dead &&
    !world.outpostTower.active &&
    areFactionsEnemies(structure.ownerFactionId, state.selectedFactionId)
  ) {
    targets.push(getLocalPlayerCombatTarget());
  }

  if (!world.multiplayer.enabled) {
    return targets;
  }

  for (const remote of world.remotePlayers.values()) {
    const factionId = remote.snapshot?.factionId;

    if (
      remote.group.visible &&
      !remote.dead &&
      factionId &&
      isRemotePlayerInCurrentScene(remote.snapshot) &&
      areFactionsEnemies(structure.ownerFactionId, factionId)
    ) {
      targets.push(remote);
    }
  }

  return targets;
}

function areFactionsEnemies(sourceFactionId, targetFactionId) {
  if (!sourceFactionId || !targetFactionId || sourceFactionId === targetFactionId) {
    return false;
  }

  return state.factionGovernance[sourceFactionId]?.relationStatus?.[targetFactionId] === "Enemy";
}

function getLocalPlayerCombatTarget() {
  return {
    id: state.player.id,
    name: state.player.name,
    isLocalPlayer: true,
    mesh: world.playerMesh,
    radius: 1.15,
    hitMinY: 0.7,
    hitMaxY: 6.1,
    hp: state.player.hp ?? MULTIPLAYER_MAX_HEALTH,
    maxHp: state.player.maxHp ?? MULTIPLAYER_MAX_HEALTH,
    dead: Boolean(state.player.dead)
  };
}

function getOutpostShotOrigin(structure) {
  return new THREE.Vector3(
    structure.position.x,
    getTerrainHeightAt(structure.position.x, structure.position.z) + 16.9,
    structure.position.z
  );
}

function getCombatTargetGroundPosition(target) {
  const position = target?.mesh?.position ?? target?.group?.position;

  return {
    x: position?.x ?? 0,
    z: position?.z ?? 0
  };
}

function getCombatTargetAimPoint(target) {
  const position = new THREE.Vector3();

  if (typeof target?.mesh?.getWorldPosition === "function") {
    target.mesh.getWorldPosition(position);
  } else if (target?.mesh?.position) {
    position.copy(target.mesh.position);
  } else if (target?.group?.position) {
    position.copy(target.group.position);
  }

  const height = clamp((target?.hitMaxY ?? 5.5) * 0.6, 2.2, 4.8);
  position.y += height;
  return position;
}

function getNextSlashDirection(hand) {
  const direction = world.attackCycles[hand] % 2 === 0 ? -1 : 1;
  world.attackCycles[hand] += 1;
  return direction;
}

function getEffectiveAttackRange(item, stats, chargePower = 0) {
  return getCombatRange(item.type, stats, chargePower);
}

function getEffectiveAttackDamage(item, stats, chargePower = 0) {
  return getCombatDamage(item.type, stats, chargePower);
}

function getAttackDuration(itemType, stats, chargePower = 0, options = {}) {
  return getCombatAttackDuration(itemType, stats, chargePower, options);
}

function getAttackKind(itemType) {
  return getCombatKind(itemType);
}

function getMeleeHitProfile(itemType, kind, range) {
  return getCombatMeleeHitProfile(itemType, range);
}

function updateOutpostTower(deltaSeconds) {
  if (world.outpostTower.shotCooldown > 0) {
    world.outpostTower.shotCooldown = Math.max(0, world.outpostTower.shotCooldown - deltaSeconds);
  }

  if (!world.towerBowView) {
    return;
  }

  if (!world.outpostTower.active) {
    world.towerBowView.visible = false;
    delete document.body.dataset.outpostTower;
    return;
  }

  const structure = state.structures.find((entry) => entry.id === world.outpostTower.structureId);

  if (!structure || structure.hp <= 0) {
    exitOutpostTower();
    return;
  }

  state.player.position.x = structure.position.x;
  state.player.position.z = structure.position.z;
  world.outpostTower.position = { ...structure.position };
  world.towerBowView.visible = true;
  document.body.dataset.outpostTower = structure.id;
}

function updateWorld(deltaSeconds) {
  updateOutpostTower(deltaSeconds);
  const playerElevation = getPlayerWorldElevation();
  world.playerMesh.position.set(state.player.position.x, playerElevation, state.player.position.z);
  world.playerMesh.visible = !world.outpostTower.active;
  document.body.dataset.playerX = state.player.position.x.toFixed(2);
  document.body.dataset.playerZ = state.player.position.z.toFixed(2);
  document.body.dataset.sceneMode = world.sceneMode;
  document.body.dataset.playerElevation = playerElevation.toFixed(2);
  updatePlayerHealthBar();
  updatePlayerRespawnStatus();
  updateMultiplayer(deltaSeconds);
  applyAimFacing();
  updatePlayerAnimation(deltaSeconds);
  updateRemotePlayers(deltaSeconds);
  updateCamera(deltaSeconds);
  updateLockedThirdPersonAim();
  updateHeldItemVisuals();
  updatePlayerArmorVisuals();
  updateAttackAnimations(deltaSeconds);
  updateCombatFeedback(deltaSeconds);
  updateWorkAction(deltaSeconds);
  updateBaseEntryAction(deltaSeconds);
  updateLocationPrompt();
  updatePveEnemies(deltaSeconds);
  updateOutdoorDungeonMonsters(deltaSeconds);
  updateOutpostDefenses(deltaSeconds);
  updateProjectiles(deltaSeconds);
  updateDroppedItems(deltaSeconds);
  updateBloodSplats(deltaSeconds);
  updatePoiFlags();
  updateStructures();
  updatePlacementPreview();
  updateCouriers();
  updateEventMesh();
  updateEntityStatusVisibility();
}

function updatePlayerRespawnStatus() {
  if (!state.player.dead || !world.multiplayer.respawnAt || Date.now() < world.multiplayer.respawnAt) {
    return;
  }

  state.player.dead = false;
  state.player.hp = state.player.maxHp ?? MULTIPLAYER_MAX_HEALTH;
  beginNewPlayerLife(state);
  markPlayerPersistenceDue();
  world.multiplayer.localDefeated = false;
  world.multiplayer.respawnAt = 0;
  flash(`You respawned as ${state.player.name}.`);
  updatePlayerHealthBar();
  refreshUi();
}

function getPlayerWorldElevation() {
  if (world.outpostTower.active) {
    return world.outpostTower.elevation;
  }

  return world.sceneMode === "outdoor"
    ? getTerrainHeightAt(state.player.position.x, state.player.position.z) + world.playerMotion.verticalOffset
    : world.playerMotion.verticalOffset;
}

function updateMultiplayer(deltaSeconds) {
  if (!world.multiplayer.enabled) {
    return;
  }

  world.multiplayer.sendTimer -= deltaSeconds;
  world.multiplayer.pollTimer -= deltaSeconds;

  if (state.player.dead && world.multiplayer.respawnAt && Date.now() >= world.multiplayer.respawnAt) {
    publishLocalPlayer(true);
  }

  if (world.multiplayer.sendTimer <= 0) {
    world.multiplayer.sendTimer = MULTIPLAYER_SEND_INTERVAL;
    publishLocalPlayer();
  }

  if (world.multiplayer.pollTimer <= 0) {
    world.multiplayer.pollTimer = MULTIPLAYER_POLL_INTERVAL;
    pollMultiplayerState();
  }

  document.body.dataset.remotePlayers = String([...world.remotePlayers.values()].filter((player) => player.group.visible).length);
  document.body.dataset.playerHp = String(Math.round(state.player.hp ?? MULTIPLAYER_MAX_HEALTH));
}

function publishLocalPlayer(force = false) {
  if (!force && world.multiplayer.publishInFlight) {
    return;
  }

  world.multiplayer.publishInFlight = true;

  fetch("/api/multiplayer/player", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildLocalPlayerPayload())
  })
    .then((response) => response.ok ? response.json() : Promise.reject(new Error("Multiplayer publish failed.")))
    .then((data) => {
      world.multiplayer.failed = false;
      if (data.player) {
        syncLocalPlayerHealth(data.player);
      }
    })
    .catch(() => {
      world.multiplayer.failed = true;
    })
    .finally(() => {
      world.multiplayer.publishInFlight = false;
    });
}

function pollMultiplayerState() {
  if (world.multiplayer.pollInFlight) {
    return;
  }

  world.multiplayer.pollInFlight = true;

  fetch("/api/multiplayer/state")
    .then((response) => response.ok ? response.json() : Promise.reject(new Error("Multiplayer poll failed.")))
    .then((data) => {
      world.multiplayer.failed = false;
      syncMultiplayerPlayers(Array.isArray(data.players) ? data.players : []);
    })
    .catch(() => {
      world.multiplayer.failed = true;
    })
    .finally(() => {
      world.multiplayer.pollInFlight = false;
    });
}

function buildLocalPlayerPayload() {
  const leftHandItem = getEquippedItem(state, "left");
  const rightHandItem = getEquippedItem(state, "right");

  return {
    id: state.player.id,
    name: state.player.name,
    houseName: state.player.houseName,
    firstName: state.player.firstName,
    lifeNumber: state.player.lifeNumber,
    renown: state.player.renown,
    factionId: state.selectedFactionId,
    position: { ...state.player.position },
    elevation: getPlayerWorldElevation(),
    towerStructureId: world.outpostTower.active ? world.outpostTower.structureId : null,
    rotation: world.playerMesh?.rotation.y ?? 0,
    headRotation: world.playerRig?.headGroup?.rotation.y ?? 0,
    moving: world.playerMotion.moving,
    speed: world.playerMotion.speed,
    sceneMode: world.sceneMode,
    interiorFactionId: world.interiorFactionId,
    activePoiInteriorId: world.activePoiInteriorId,
    leftHandType: leftHandItem?.type ?? null,
    leftHandName: leftHandItem?.name ?? null,
    rightHandType: rightHandItem?.type ?? null,
    rightHandName: rightHandItem?.name ?? null,
    armorItems: getEquippedArmorItems().map(createNetworkArmorItem),
    hp: state.player.hp ?? MULTIPLAYER_MAX_HEALTH,
    maxHp: state.player.maxHp ?? MULTIPLAYER_MAX_HEALTH,
    dead: Boolean(state.player.dead),
    respawnAt: world.multiplayer.respawnAt ?? 0
  };
}

function syncMultiplayerPlayers(players) {
  const seenRemoteIds = new Set();

  for (const player of players) {
    if (!player?.id) {
      continue;
    }

    if (player.id === state.player.id) {
      syncLocalPlayerHealth(player);
      continue;
    }

    seenRemoteIds.add(player.id);
    syncRemotePlayer(player);
  }

  for (const [id, remote] of world.remotePlayers) {
    if (!seenRemoteIds.has(id)) {
      removeFromParent(remote.group);
      world.remotePlayers.delete(id);
    }
  }
}

function syncLocalPlayerHealth(player) {
  const previousHp = state.player.hp ?? MULTIPLAYER_MAX_HEALTH;
  const wasDead = Boolean(state.player.dead);
  state.player.maxHp = player.maxHp ?? MULTIPLAYER_MAX_HEALTH;
  state.player.hp = player.hp ?? state.player.maxHp;
  state.player.dead = Boolean(player.dead);
  world.multiplayer.respawnAt = player.respawnAt ?? 0;

  if (state.player.hp < previousHp && !state.player.dead && !isBloodlessDamageSource(player.lastDamageSource)) {
    spawnBloodSplat({ mesh: world.playerMesh, radius: 1.15, hitMinY: 0.8, hitMaxY: 5.4 }, null, previousHp - state.player.hp);
  }

  if (state.player.dead && !world.multiplayer.localDefeated) {
    const attacker = player.lastDamagedByName ? ` by ${player.lastDamagedByName}` : "";
    world.multiplayer.localDefeated = true;
    placePlayerAtRespawnPoint();
    flash(`You were defeated${attacker}.`);
  } else if (!state.player.dead && (wasDead || world.multiplayer.localDefeated)) {
    world.multiplayer.localDefeated = false;
    state.player.hp = state.player.maxHp;
    beginNewPlayerLife(state);
    markPlayerPersistenceDue();
    flash(`You respawned as ${state.player.name}.`);
  }
}

function placePlayerAtRespawnPoint() {
  const faction = state.selectedFactionId ? FACTION_LOOKUP[state.selectedFactionId] : null;
  state.player.position.x = faction ? faction.position.x : 0;
  state.player.position.z = faction ? faction.position.z + faction.safeRadius * 0.55 : 0;
  world.playerMotion.moving = false;
  world.playerMotion.speed = 0;
  clearProjectiles();
}

function syncRemotePlayer(player) {
  let remote = world.remotePlayers.get(player.id);
  const isNewRemote = !remote;

  if (!remote) {
    remote = createRemotePlayerVisual(player);
    remote.lastDamagedAt = player.lastDamagedAt ?? 0;
    world.remotePlayers.set(player.id, remote);
  }

  const previousRemoteHp = remote.hp ?? player.maxHp ?? MULTIPLAYER_MAX_HEALTH;
  remote.name = player.name;
  remote.snapshot = player;
  remote.hp = player.hp ?? MULTIPLAYER_MAX_HEALTH;
  remote.maxHp = player.maxHp ?? MULTIPLAYER_MAX_HEALTH;
  remote.dead = Boolean(player.dead);
  const remoteY = Number.isFinite(Number(player.elevation))
    ? Number(player.elevation)
    : getTerrainHeightAt(player.position.x, player.position.z);
  remote.targetPosition.set(player.position.x, remoteY, player.position.z);
  remote.targetRotation = player.rotation ?? 0;
  remote.targetHeadRotation = player.headRotation ?? 0;

  if (!isNewRemote && player.lastDamagedAt && player.lastDamagedAt !== remote.lastDamagedAt) {
    remote.lastDamagedAt = player.lastDamagedAt;
    remote.group.scale.set(1.08, 1.08, 1.08);
    if (!isBloodlessDamageSource(player.lastDamageSource)) {
      spawnBloodSplat(remote, null, Math.max(1, previousRemoteHp - remote.hp));
    }
  }

  syncRemoteHeldItem(remote, "left", createNetworkHeldItem(player.leftHandType, player.leftHandName));
  syncRemoteHeldItem(remote, "right", createNetworkHeldItem(player.rightHandType, player.rightHandName));
  syncRemoteArmorVisuals(remote, player.armorItems);
  updateRemoteHealthBar(remote);
}

function updateRemotePlayers(deltaSeconds) {
  for (const remote of world.remotePlayers.values()) {
    const visible = isRemotePlayerInCurrentScene(remote.snapshot) && !remote.dead;
    remote.group.visible = visible;

    if (!visible) {
      continue;
    }

    const blend = Math.min(1, deltaSeconds * 10);
    remote.group.position.lerp(remote.targetPosition, blend);
    remote.group.rotation.y = lerpAngle(remote.group.rotation.y, remote.targetRotation, blend);
    remote.group.scale.lerp(new THREE.Vector3(1, 1, 1), Math.min(1, deltaSeconds * 7));
    animateRemotePlayer(remote, deltaSeconds);
  }

  resolveRemotePlayerBodyCollisions();
}

function animateRemotePlayer(remote, deltaSeconds) {
  const rig = remote.rig;
  const moving = Boolean(remote.snapshot.moving);
  const speed = remote.snapshot.speed ?? 0;
  const blendSpeed = Math.min(1, deltaSeconds * 8);
  remote.motion.amount = THREE.MathUtils.lerp(remote.motion.amount ?? 0, moving ? 1 : 0, blendSpeed);
  remote.motion.gait += deltaSeconds * (moving ? Math.max(4.5, speed * 0.32) : 2.2);

  const stride = Math.sin(remote.motion.gait) * remote.motion.amount;
  const bob = Math.abs(Math.sin(remote.motion.gait)) * 0.11 * remote.motion.amount;
  const sway = Math.sin(remote.motion.gait * 0.5) * 0.04 * remote.motion.amount;

  rig.body.position.y = 3.15 + bob;
  rig.body.rotation.set(0, 0, 0);
  rig.chest.position.y = 3.65 + bob;
  rig.chest.rotation.set(0, 0, sway);
  rig.headGroup.position.set(0, 5.2 + bob * 0.65, 0.16);
  rig.headGroup.rotation.y = remote.targetHeadRotation;
  rig.leftLeg.position.set(HAND_CONFIG.left.side * 0.42, 2.05, 0);
  rig.rightLeg.position.set(HAND_CONFIG.right.side * 0.42, 2.05, 0);
  rig.leftLeg.rotation.x = stride * 0.72;
  rig.rightLeg.rotation.x = -stride * 0.72;
  setLegJointPose(rig.leftLeg, (0.12 + Math.max(0, -stride) * 0.58 + Math.abs(stride) * 0.12) * remote.motion.amount, -0.08 * remote.motion.amount);
  setLegJointPose(rig.rightLeg, (0.12 + Math.max(0, stride) * 0.58 + Math.abs(stride) * 0.12) * remote.motion.amount, -0.08 * remote.motion.amount);
  setRemoteArmWalkPose(remote, "left", -stride * 0.46);
  setRemoteArmWalkPose(remote, "right", stride * 0.46);
}

function setRemoteArmWalkPose(remote, hand, swing) {
  const arm = hand === "left" ? remote.rig.leftArm : remote.rig.rightArm;
  const side = HAND_CONFIG[hand].side;

  arm.position.set(side * 1.08, 4.35, 0.22);
  arm.rotation.set(swing, 0, side * 0.16);
  setArmJointPose(arm, 0.12 + Math.abs(swing) * 0.36, -0.03, 0);
}

function syncRemoteHeldItem(remote, hand, item) {
  const held = remote.heldItems[hand];
  const itemKey = item ? `${item.type}:${item.name}` : null;

  if (held.itemKey === itemKey) {
    return;
  }

  const mount = hand === "left" ? remote.leftHandMount : remote.rightHandMount;

  if (held.mesh) {
    mount.remove(held.mesh);
  }

  held.itemKey = itemKey;
  held.mesh = item ? createHeldItemMesh(item, hand) : null;

  if (held.mesh) {
    tagEntityStatusTarget(held.mesh, getRemotePlayerStatusKey(remote.id));
    mount.add(held.mesh);
  }
}

function createNetworkHeldItem(type, name) {
  return type ? { id: `${type}:${name ?? type}`, type, name: name ?? type } : null;
}

function createNetworkArmorItem(item) {
  const profile = getArmorMaterialProfile(item);

  return item?.armor
    ? {
        id: `${item.armor.slot}:${item.type}:${profile.material}:${profile.color}:${profile.metalness}`,
        type: item.type,
        name: item.name,
        armor: {
          slot: item.armor.slot,
          material: profile.material,
          color: profile.color,
          metalness: profile.metalness
        },
        durability: item.durability ?? 1,
        maxDurability: item.maxDurability ?? 1
      }
    : null;
}

function syncRemoteArmorVisuals(remote, armorItems = []) {
  const bySlot = new Map(
    (Array.isArray(armorItems) ? armorItems : [])
      .filter((item) => item?.armor?.slot)
      .map((item) => [item.armor.slot, item])
  );

  for (const slotId of ARMOR_VISUAL_SLOT_IDS) {
    syncArmorSlotVisual(
      remote.armorVisuals,
      remote.rig,
      slotId,
      bySlot.get(slotId) ?? null,
      getRemotePlayerStatusKey(remote.id)
    );
  }
}

function updateRemoteHealthBar(remote) {
  updateHealthBarSprite(remote.healthBar, remote.hp, remote.maxHp, remote.name);
}

function isRemotePlayerInCurrentScene(player) {
  if (!player || player.sceneMode !== world.sceneMode) {
    return false;
  }

  if (world.sceneMode === "interior") {
    return player.interiorFactionId === world.interiorFactionId;
  }

  if (world.sceneMode === "poiInterior") {
    return player.activePoiInteriorId === world.activePoiInteriorId;
  }

  return true;
}

function lerpAngle(from, to, amount) {
  const delta = Math.atan2(Math.sin(to - from), Math.cos(to - from));
  return from + delta * amount;
}

function resetPlayerRootLean() {
  if (world.playerMesh) {
    world.playerMesh.rotation.x = 0;
    world.playerMesh.rotation.z = 0;
  }

  if (world.playerVisualRoot) {
    world.playerVisualRoot.rotation.set(0, 0, 0);
  }
}

function setArmJointPose(arm, elbowX = 0, wristX = 0, wristZ = 0) {
  if (!arm) {
    return;
  }

  const forearm = arm.userData?.forearm;
  const hand = arm.userData?.hand;

  if (forearm) {
    forearm.rotation.set(elbowX, 0, 0);
  }

  if (hand) {
    hand.rotation.set(wristX, 0, wristZ);
  }
}

function setLegJointPose(leg, kneeX = 0, ankleX = 0) {
  if (!leg) {
    return;
  }

  const shin = leg.userData?.shin;
  const foot = leg.userData?.foot;

  if (shin) {
    shin.rotation.set(kneeX, 0, 0);
  }

  if (foot) {
    foot.rotation.set(ankleX, 0, 0);
  }
}

function updatePlayerAnimation(deltaSeconds) {
  const rig = world.playerRig;

  if (!rig) {
    return;
  }

  rig.crown.visible = state.selectedFactionId ? isFactionRuler(state, state.selectedFactionId) : false;

  if (world.seatedOnThrone) {
    applySeatedPose();
    return;
  }

  const motion = world.playerMotion;

  if (motion.diving) {
    applyDivePose(motion.diveElapsed / DIVE_DURATION);
    return;
  }

  resetPlayerRootLean();

  const blendSpeed = Math.min(1, deltaSeconds * 8);
  motion.amount = THREE.MathUtils.lerp(motion.amount ?? 0, motion.moving ? 1 : 0, blendSpeed);
  motion.gait += deltaSeconds * (motion.moving ? Math.max(4.5, motion.speed * 0.32) : 2.2);

  const stride = Math.sin(motion.gait) * motion.amount;
  const strideOpposite = -stride;
  const bob = Math.abs(Math.sin(motion.gait)) * 0.11 * motion.amount;
  const sway = Math.sin(motion.gait * 0.5) * 0.04 * motion.amount;

  rig.body.position.y = 3.15 + bob;
  rig.body.rotation.set(0, 0, 0);
  rig.chest.position.y = 3.65 + bob;
  rig.chest.rotation.set(0, 0, sway);
  rig.headGroup.position.set(0, 5.2 + bob * 0.65, 0.16);
  rig.headGroup.rotation.x = 0;
  rig.headGroup.rotation.z = 0;
  if (!world.hasAim) {
    rig.headGroup.rotation.y = 0;
  }

  rig.leftLeg.rotation.x = stride * 0.72;
  rig.rightLeg.rotation.x = strideOpposite * 0.72;
  rig.leftLeg.rotation.z = HAND_CONFIG.left.side * 0.04 * motion.amount;
  rig.rightLeg.rotation.z = HAND_CONFIG.right.side * 0.04 * motion.amount;
  setLegJointPose(rig.leftLeg, (0.12 + Math.max(0, -stride) * 0.58 + Math.abs(stride) * 0.12) * motion.amount, -0.08 * motion.amount);
  setLegJointPose(rig.rightLeg, (0.12 + Math.max(0, stride) * 0.58 + Math.abs(stride) * 0.12) * motion.amount, -0.08 * motion.amount);

  setArmWalkPose("left", -stride * 0.46);
  setArmWalkPose("right", stride * 0.46);
}

function ensureDungeonPveEnemyRoster() {
  const targetCount = Math.min(DUNGEON_ENEMY_SPAWNS.length, getPveMobCap());
  const dungeonGroup = world.meshes.poiInteriors.get("ebon-hollow");

  if (!dungeonGroup || world.pveEnemies.length >= targetCount) {
    return;
  }

  for (const spawn of DUNGEON_ENEMY_SPAWNS.slice(world.pveEnemies.length, targetCount)) {
    dungeonGroup.add(createPveEnemy(spawn));
  }
}

function startPveEnemyAttack(enemy, targetPosition) {
  const itemType = enemy.weapon?.type ?? "Empty Hand";
  const stats = enemy.weapon?.weapon ?? WEAPON_STATS["Empty Hand"];
  const kind = getAttackKind(itemType);
  const direction = new THREE.Vector3(
    targetPosition.x - enemy.mesh.position.x,
    0,
    targetPosition.z - enemy.mesh.position.z
  );

  if (direction.lengthSq() > 0.001) {
    direction.normalize();
  } else {
    direction.set(0, 0, 1);
  }

  enemy.attackAnimation = {
    kind,
    itemType,
    direction,
    elapsed: 0,
    profile: getCombatProfile(itemType),
    duration: getPveEnemyAttackDuration(itemType, stats),
    hitResolved: false,
    lungeApplied: 0
  };
  enemy.attackTimer = enemy.attackCooldown;
}

function getPveEnemyAttackDuration(itemType, stats) {
  return getAttackDuration(itemType, stats, 0, { mob: true });
}

function updatePveEnemyAttack(enemy, deltaSeconds, targetPosition, options = {}) {
  const attack = enemy.attackAnimation;

  if (!attack) {
    resetPveEnemyWeaponPose(enemy);
    return false;
  }

  attack.elapsed += deltaSeconds;
  const progress = Math.min(1, attack.elapsed / attack.duration);
  const hitMoment = getPveEnemyHitMoment(attack.itemType);

  animatePveEnemyAttack(enemy, attack, progress);
  movePveEnemyDuringAttack(enemy, attack, progress, hitMoment, deltaSeconds, options);

  if (!attack.hitResolved && progress >= hitMoment) {
    attack.hitResolved = true;
    if (canPveEnemyHitPlayer(enemy, targetPosition)) {
      applyPveEnemyHitToPlayer(enemy);
    }
  }

  if (progress >= 1) {
    resetPveEnemyAttackState(enemy);
    return false;
  }

  return true;
}

function getPveEnemyHitMoment(itemType) {
  return getCombatHitMoment(itemType);
}

function getAttackPhase(profile, progress) {
  const windupEnd = clamp(profile.windup ?? 0.3, 0.05, 0.82);
  const strikeEnd = clamp(windupEnd + (profile.strike ?? 0.34), windupEnd + 0.05, 0.96);
  const trail = profile.trail ?? {};
  const trailStart = trail.start ?? windupEnd;
  const trailEnd = Math.max(trailStart + 0.01, trail.end ?? strikeEnd);

  return {
    windupEnd,
    strikeEnd,
    anticipation: progress < windupEnd ? easeOut(progress / windupEnd) : 1,
    commit: progress < windupEnd ? 0 : easeOut((Math.min(progress, strikeEnd) - windupEnd) / Math.max(0.001, strikeEnd - windupEnd)),
    followThrough: Math.sin(clamp((progress - windupEnd * 0.72) / Math.max(0.001, strikeEnd - windupEnd * 0.18), 0, 1) * Math.PI),
    recover: progress < strikeEnd ? 0 : easeOut((progress - strikeEnd) / Math.max(0.001, 1 - strikeEnd)),
    trailPulse: trail.enabled ? Math.sin(clamp((progress - trailStart) / (trailEnd - trailStart), 0, 1) * Math.PI) : 0
  };
}

function getAttackRangeScale(attack, profile) {
  return profile.kind === "thrust"
    ? Math.min(1.9, attack.range / 2.8)
    : Math.min(1.42, attack.range / 3);
}

function applyProfiledWeaponPose(container, attack, progress, options = {}) {
  const profile = attack.profile ?? getCombatProfile(attack.itemType);
  const pose = profile.pose ?? {};
  const phase = getAttackPhase(profile, progress);
  const side = options.side ?? -1;
  const attackSide = attack.slashDirection || side;
  const rangeScale = options.mob ? 1 : getAttackRangeScale(attack, profile);
  const weight = profile.impactProfile?.weight ?? 0.5;

  if (profile.family === "bow") {
    const releaseAt = getCombatReleaseMoment(attack.itemType, attack.chargePower ?? 0);
    const heldDraw = (attack.chargePower ?? 0) > 0.08;
    const draw = heldDraw
      ? Math.max(0, 1 - easeOut(progress / Math.max(0.001, profile.hitMoment))) * (0.5 + (attack.chargePower ?? 0) * (pose.draw ?? 0.78))
      : progress < releaseAt
        ? easeOut(progress / Math.max(0.001, releaseAt)) * 0.52
        : Math.max(0, 1 - (progress - releaseAt) / Math.max(0.001, 1 - releaseAt)) * 0.52;
    const release = progress > releaseAt ? easeOut((progress - releaseAt) / Math.max(0.001, 1 - releaseAt)) : 0;

    container.position.z -= draw * (0.58 + (attack.chargePower ?? 0) * 0.18);
    container.position.x += side * draw * 0.18;
    container.position.y += draw * (pose.lift ?? 0.18) * 0.2;
    container.rotation.x -= 0.25 + draw * 0.62;
    container.rotation.z += side * draw * 0.46;
    updateHeldRangedModelState(container, attack.itemType, draw, !attack.projectileSpawned);

    if (!options.mob) {
      poseAttackArm(options.hand, -1.0 + release * 0.5, side * (0.38 - draw * 0.24), draw * 0.1, 0.36 + draw * 0.48, -0.08 * draw, side * 0.05 * draw);
      poseSupportArm(options.hand, profile, phase, draw);
    }
  } else if (profile.family === "crossbow") {
    const recoil = phase.followThrough;
    container.position.z += phase.commit * (pose.reach ?? 0.55) * rangeScale - recoil * 0.28;
    container.position.y += phase.anticipation * (pose.lift ?? 0.16);
    container.rotation.x += (pose.windupX ?? -0.4) * phase.anticipation + 0.18 * recoil + (pose.recoverX ?? -0.1) * phase.recover;
    container.rotation.z += side * ((pose.windupZ ?? 0.18) * phase.anticipation - 0.08 * recoil);
    updateHeldRangedModelState(container, attack.itemType, recoil * 0.2, !attack.projectileSpawned);

    if (!options.mob) {
      poseAttackArm(options.hand, -0.45 + recoil * 0.16, side * 0.22, 0, 0.28 + recoil * 0.12, -0.03 * recoil);
      poseSupportArm(options.hand, profile, phase, recoil);
    }
  } else if (profile.kind === "thrust") {
    const thrust = phase.followThrough;
    container.position.z += (phase.commit * (pose.reach ?? 1.5) - phase.anticipation * 0.22 - phase.recover * 0.28) * rangeScale;
    container.position.x += attackSide * (pose.lateral ?? 0.14) * (phase.commit - phase.recover) * 0.24;
    container.position.y += phase.anticipation * (pose.lift ?? 0.08) - phase.commit * 0.05;
    container.rotation.x += (pose.windupX ?? -0.24) * phase.anticipation + (pose.strikeX ?? -0.62) * thrust * 0.28;
    container.rotation.y += attackSide * ((pose.windupY ?? -0.1) * phase.anticipation + (pose.strikeY ?? 0.08) * phase.commit);
    container.rotation.z += attackSide * ((pose.windupZ ?? -0.1) * phase.anticipation + (pose.strikeZ ?? 0.08) * phase.commit);

    if (!options.mob) {
      poseAttackArm(options.hand, -0.28 - thrust * 0.42, side * 0.14, attackSide * 0.06 * phase.commit, 0.18 + thrust * 0.24, -0.05 * thrust);
      poseSupportArm(options.hand, profile, phase, thrust);
    }
  } else if (profile.kind === "chop") {
    const chop = phase.commit;
    const sweep = phase.followThrough;
    container.position.z += sweep * (pose.reach ?? 1) * rangeScale;
    container.position.x += attackSide * (-0.48 * phase.anticipation + (pose.lateral ?? 1) * chop * 0.9);
    container.position.y += (pose.lift ?? 0.8) * phase.anticipation - chop * 0.5 + sweep * 0.12;
    container.rotation.x += (pose.windupX ?? -1.1) * phase.anticipation + (pose.strikeX ?? 0.62) * chop + (pose.recoverX ?? -0.16) * phase.recover;
    container.rotation.y += attackSide * ((pose.windupY ?? -0.2) * phase.anticipation + (pose.strikeY ?? 0.32) * chop);
    container.rotation.z += attackSide * ((pose.windupZ ?? -0.7) * phase.anticipation + (pose.strikeZ ?? 1.35) * chop + 0.26 * sweep);

    if (!options.mob) {
      poseAttackArm(options.hand, -1.1 + chop * 1.5, side * (0.2 + attackSide * side * sweep * 0.22), -attackSide * (phase.anticipation * 0.22 - chop * 0.34), 0.5 + phase.anticipation * 0.28 - chop * 0.16, -0.07 * sweep, side * attackSide * 0.06 * chop);
    }
  } else if (profile.kind === "unarmed") {
    const chamber = phase.anticipation * (1 - phase.commit * 0.82);
    const swing = phase.commit * (1 - phase.recover * 0.9);
    const centerFinish = Math.max(0, swing - phase.recover * 0.18);
    const snap = phase.followThrough;
    const reach = (pose.reach ?? 1.15) * rangeScale;
    const chamberDepth = pose.chamber ?? 0.5;
    container.position.z += -chamberDepth * chamber + reach * swing - phase.recover * 0.24;
    container.position.x += side * ((pose.lateral ?? 0.56) * chamber - (pose.centerLine ?? 0.42) * centerFinish + 0.08 * phase.recover);
    container.position.y += (pose.lift ?? 0.34) * chamber - 0.12 * swing + snap * 0.06;
    container.rotation.x += (pose.windupX ?? -0.52) * chamber + (pose.strikeX ?? -1.04) * snap * 0.3 + (pose.recoverX ?? -0.14) * phase.recover;
    container.rotation.y += side * (-0.28 * chamber + 0.22 * swing - 0.04 * phase.recover);
    container.rotation.z += side * ((pose.windupZ ?? -0.72) * chamber + (pose.strikeZ ?? 0.54) * swing + (pose.recoverZ ?? -0.12) * phase.recover);

    if (!options.mob) {
      const armBaseX = pose.armBaseX ?? -0.38;
      const armChamberX = pose.armChamberX ?? -0.42;
      const armStrikeX = pose.armStrikeX ?? -1.22;
      poseAttackArm(
        options.hand,
        armBaseX + armChamberX * chamber + armStrikeX * swing + phase.recover * 0.18,
        side * (0.34 * chamber - 0.28 * centerFinish - phase.recover * 0.06),
        side * (-0.34 * chamber + 0.3 * swing),
        (pose.elbowBase ?? 0.72) * chamber + (pose.elbowStrike ?? 0.24) * swing + 0.26 * phase.recover,
        (pose.wristStrike ?? -0.05) * swing,
        side * (-0.16 * chamber + 0.12 * swing)
      );
    }
  } else {
    const cut = phase.commit;
    const swoop = phase.followThrough;
    container.position.z += swoop * (pose.reach ?? 1) * rangeScale - phase.recover * 0.18;
    container.position.x += attackSide * (phase.anticipation * -0.62 + cut * (pose.lateral ?? 1) - phase.recover * 0.4);
    container.position.y += (pose.lift ?? 0.08) * phase.anticipation - cut * 0.08 + swoop * 0.1;
    container.rotation.x += (pose.windupX ?? -0.52) * phase.anticipation + (pose.strikeX ?? -0.9) * swoop * 0.2 + (pose.recoverX ?? -0.16) * phase.recover;
    container.rotation.y += attackSide * ((pose.windupY ?? -0.18) * phase.anticipation + (pose.strikeY ?? 0.22) * cut);
    container.rotation.z += attackSide * ((pose.windupZ ?? -1.1) * phase.anticipation + (pose.strikeZ ?? 2.05) * cut + (pose.recoverZ ?? -0.5) * phase.recover);

    if (!options.mob) {
      poseAttackArm(options.hand, -0.5 - swoop * 0.4 + phase.recover * 0.12, attackSide * (0.16 + cut * 0.46 - phase.recover * 0.16), -attackSide * (phase.anticipation * 0.32 - cut * 0.48), (pose.elbowBase ?? 0.38) + swoop * 0.2, -0.04 * swoop, side * attackSide * 0.05 * cut);
      poseSupportArm(options.hand, profile, phase, swoop);
    }
  }

  if (!options.mob) {
    applyPlayerBodyAttackPose(options.hand, profile, phase, attackSide, weight);
  }

  updateWeaponTrailVisual(options.trailRoot ?? container, profile, phase.trailPulse, attackSide);
  return phase;
}

function poseSupportArm(activeHand, profile, phase, intensity = 1) {
  const support = profile.pose?.offhand ?? 0;

  if (support <= 0) {
    return;
  }

  const otherHand = activeHand === "left" ? "right" : "left";

  if (world.attacks[otherHand]) {
    return;
  }

  const arm = otherHand === "left" ? world.playerRig?.leftArm : world.playerRig?.rightArm;

  if (!arm) {
    return;
  }

  const side = HAND_CONFIG[otherHand].side;
  const brace = clamp((phase.anticipation * 0.55 + phase.commit * 0.65 + intensity * 0.3) * support, 0, 1);
  arm.rotation.x = THREE.MathUtils.lerp(arm.rotation.x, -0.62 - brace * 0.52, brace);
  arm.rotation.y = side * brace * 0.14;
  arm.rotation.z = side * (0.18 + brace * 0.24);
  setArmJointPose(arm, 0.3 + brace * 0.24, -0.06 * brace, side * 0.04 * brace);
}

function applyPlayerBodyAttackPose(hand, profile, phase, attackSide, weight) {
  const rig = world.playerRig;

  if (!rig || !world.playerVisualRoot) {
    return;
  }

  const pose = profile.pose ?? {};
  const plant = (pose.footPlant ?? 0.08) * weight;
  const twist = (pose.torsoTwist ?? 0.12) * (phase.anticipation * 0.35 - phase.commit * 0.85 + phase.recover * 0.25);
  const lean = (pose.torsoLean ?? 0.04) * (phase.commit * 0.8 - phase.recover * 0.4);
  rig.chest.rotation.z += attackSide * twist;
  rig.chest.rotation.x -= lean;
  rig.body.rotation.z += attackSide * twist * 0.42;
  rig.body.rotation.x -= lean * 0.5;
  world.playerVisualRoot.rotation.z += attackSide * twist * 0.18;

  const leadLeg = hand === "left" ? rig.leftLeg : rig.rightLeg;
  const backLeg = hand === "left" ? rig.rightLeg : rig.leftLeg;
  if (leadLeg && backLeg) {
    leadLeg.position.z += plant * (phase.commit - phase.recover * 0.4);
    backLeg.position.z -= plant * 0.45 * phase.anticipation;
  }
}

function getWeaponVisualRoot(container) {
  if (!container) {
    return null;
  }

  if (Array.isArray(container.userData?.weaponHitSegments)) {
    return container;
  }

  return container.children.find((child) => Array.isArray(child.userData?.weaponHitSegments)) ?? container;
}

function updateWeaponTrailVisual(container, profile, pulse, attackSide = 1) {
  const trailProfile = profile.trail;
  const root = getWeaponVisualRoot(container);

  if (!root || !trailProfile?.enabled) {
    removeTaggedHandVisuals(container, "attackTraceVisual");
    return;
  }

  let trail = root.getObjectByName("weaponAttackTrail");

  if (!trail) {
    const geometry = new THREE.PlaneGeometry(trailProfile.width ?? 0.28, trailProfile.length ?? 2.2);
    const material = new THREE.MeshBasicMaterial({
      color: trailProfile.color ?? "#dbeaff",
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    trail = new THREE.Mesh(geometry, material);
    trail.name = "weaponAttackTrail";
    trail.userData.attackTraceVisual = true;
    trail.position.y = (trailProfile.length ?? 2.2) * 0.36;
    trail.position.z = 0.02;
    trail.rotation.z = attackSide * 0.12;
    root.add(trail);
  }

  trail.visible = pulse > 0.01;
  trail.material.opacity = (trailProfile.opacity ?? 0.28) * pulse;
  trail.rotation.z = attackSide * (0.1 + pulse * 0.18);
}

function updateHeldRangedModelState(container, itemType, draw, projectileLoaded = true) {
  const root = getWeaponVisualRoot(container);

  if (!root) {
    return;
  }

  const bowString = root.getObjectByName("bowString");
  if (bowString) {
    bowString.position.x = (bowString.userData.baseX ?? bowString.position.x) + (bowString.userData.side ?? 1) * draw * 0.38;
    bowString.scale.y = Math.max(0.72, 1 - draw * 0.12);
  }

  const arrow = root.getObjectByName("bowArrow");
  if (arrow) {
    arrow.visible = projectileLoaded;
    arrow.position.x = (arrow.userData.baseX ?? arrow.position.x) + (arrow.userData.side ?? 1) * draw * 0.24;
    arrow.position.z = (arrow.userData.baseZ ?? arrow.position.z) - draw * 0.22;
  }

  const bolt = root.getObjectByName("crossbowBolt");
  if (bolt) {
    bolt.visible = projectileLoaded;
    bolt.position.z = (bolt.userData.baseZ ?? bolt.position.z) - draw * 0.18;
  }
}

function animatePveEnemyAttack(enemy, attack, progress) {
  const weapon = enemy.mesh.getObjectByName("pveWeaponVisual");

  if (!weapon) {
    return;
  }

  resetPveEnemyWeaponPose(enemy);
  applyProfiledWeaponPose(weapon, attack, progress, { mob: true, side: -1, trailRoot: weapon });
}

function movePveEnemyDuringAttack(enemy, attack, progress, hitMoment, deltaSeconds, options) {
  if (!attack.direction || !isPveMeleeWeaponAttack(attack.itemType)) {
    return;
  }

  if (progress < hitMoment) {
    movePveEntityTo(enemy, {
      x: enemy.mesh.position.x + attack.direction.x * enemy.speed * 0.16 * deltaSeconds,
      z: enemy.mesh.position.z + attack.direction.z * enemy.speed * 0.16 * deltaSeconds
    }, options);
    return;
  }

  const lungeProgress = clamp((progress - hitMoment) / 0.18, 0, 1);
  const reachScale = clamp((enemy.attackRange ?? 2.4) / 3.2, 0.65, 1.25);
  const desiredLunge = Math.sin(lungeProgress * Math.PI) * 0.42 * reachScale;
  const lungeStep = desiredLunge - attack.lungeApplied;

  if (Math.abs(lungeStep) <= 0.001) {
    return;
  }

  attack.lungeApplied = desiredLunge;
  movePveEntityTo(enemy, {
    x: enemy.mesh.position.x + attack.direction.x * lungeStep,
    z: enemy.mesh.position.z + attack.direction.z * lungeStep
  }, options);
}

function isPveMeleeWeaponAttack(itemType) {
  return Boolean(itemType && itemType !== "Empty Hand" && !isProjectileWeapon(itemType));
}

function canPveEnemyHitPlayer(enemy, targetPosition) {
  if (state.player.dead || world.outpostTower.active) {
    return false;
  }

  const distance = Math.hypot(
    targetPosition.x - enemy.mesh.position.x,
    targetPosition.z - enemy.mesh.position.z
  );
  return distance <= (enemy.attackRange ?? 2.4) + 0.85;
}

function updatePveEnemies(deltaSeconds) {
  if (!GAME_FLAGS.pve) {
    document.body.dataset.pveEnemiesAlive = "0";
    return;
  }

  if (world.sceneMode !== "poiInterior" || world.activePoiInteriorId !== "ebon-hollow") {
    return;
  }

  ensureDungeonPveEnemyRoster();

  const player = state.player.position;

  for (const enemy of world.pveEnemies) {
    if (enemy.dead) {
      enemy.deathTimer += deltaSeconds;
      enemy.mesh.scale.lerp(new THREE.Vector3(1, 0.08, 1), Math.min(1, deltaSeconds * 5));
      if (enemy.deathTimer > 0.65) {
        enemy.mesh.visible = false;
      }
      continue;
    }

    enemy.mesh.scale.lerp(new THREE.Vector3(1, 1, 1), Math.min(1, deltaSeconds * 6));
    const toPlayer = new THREE.Vector3(player.x - enemy.mesh.position.x, 0, player.z - enemy.mesh.position.z);
    const distance = toPlayer.length();

    if (distance > 0.05) {
      enemy.mesh.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);
    }

    enemy.attackTimer = Math.max(0, enemy.attackTimer - deltaSeconds);
    const attackActive = updatePveEnemyAttack(enemy, deltaSeconds, player, { outdoor: false });

    if (!attackActive && distance > enemy.attackRange && distance < 34) {
      toPlayer.normalize();
      movePveEntityTo(enemy, {
        x: enemy.mesh.position.x + toPlayer.x * enemy.speed * deltaSeconds,
        z: enemy.mesh.position.z + toPlayer.z * enemy.speed * deltaSeconds
      }, { outdoor: false });
    }

    applyPveEntityKnockbackMotion(enemy, deltaSeconds, { outdoor: false });
    updateCombatHitReaction(enemy, deltaSeconds);

    if (!attackActive && distance <= enemy.attackRange && enemy.attackTimer <= 0) {
      startPveEnemyAttack(enemy, player);
    }
  }

  resolvePveMobCollisions(world.pveEnemies, { outdoor: false });
  resolvePveMobPlayerCollisions(world.pveEnemies, { outdoor: false });
  document.body.dataset.pveEnemiesAlive = String(world.pveEnemies.filter((enemy) => !enemy.dead).length);
}

function updateOutdoorDungeonMonsters(deltaSeconds) {
  if (!GAME_FLAGS.pve) {
    document.body.dataset.outdoorMonstersAlive = "0";
    return;
  }

  if (world.sceneMode !== "outdoor" || !state.selectedFactionId) {
    document.body.dataset.outdoorMonstersAlive = String(world.outdoorMonsters.filter((monster) => !monster.dead).length);
    return;
  }

  world.outdoorMonsterSpawnTimer -= deltaSeconds;

  if (world.outdoorMonsterSpawnTimer <= 0 && getAlivePveMobCount() < getPveMobCap()) {
    spawnOutdoorDungeonMonster();
    world.outdoorMonsterSpawnTimer = OUTDOOR_DUNGEON_MONSTER_SPAWN_INTERVAL + Math.random() * 2.5;
  }

  const player = state.player.position;

  for (const monster of world.outdoorMonsters) {
    if (monster.dead) {
      monster.deathTimer += deltaSeconds;
      monster.mesh.scale.lerp(new THREE.Vector3(1, 0.08, 1), Math.min(1, deltaSeconds * 5));
      if (monster.deathTimer > 0.75) {
        removeFromParent(monster.mesh);
        monster.removed = true;
      }
      continue;
    }

    monster.mesh.scale.lerp(new THREE.Vector3(1, 1, 1), Math.min(1, deltaSeconds * 6));
    const toPlayer = new THREE.Vector3(player.x - monster.mesh.position.x, 0, player.z - monster.mesh.position.z);
    const distance = toPlayer.length();
    monster.aggro = monster.aggro || distance < 105;

    let direction;

    if (monster.aggro) {
      direction = distance > 0.05
        ? toPlayer.normalize()
        : new THREE.Vector3(0, 0, 0);
    } else {
      monster.roamAngle += deltaSeconds * 0.28;
      direction = new THREE.Vector3(Math.cos(monster.roamAngle), 0, Math.sin(monster.roamAngle));
    }

    if (direction.lengthSq() > 0.001) {
      monster.mesh.rotation.y = Math.atan2(direction.x, direction.z);
    }

    monster.attackTimer = Math.max(0, monster.attackTimer - deltaSeconds);
    const attackActive = updatePveEnemyAttack(monster, deltaSeconds, player, { outdoor: true });

    if (!attackActive && distance > monster.attackRange) {
      movePveEntityTo(monster, {
        x: monster.mesh.position.x + direction.x * monster.speed * deltaSeconds,
        z: monster.mesh.position.z + direction.z * monster.speed * deltaSeconds
      }, { outdoor: true });
    }

    applyPveEntityKnockbackMotion(monster, deltaSeconds, { outdoor: true });
    updateCombatHitReaction(monster, deltaSeconds);

    if (!attackActive && monster.aggro && distance <= monster.attackRange && monster.attackTimer <= 0) {
      startPveEnemyAttack(monster, player);
    }
  }

  resolvePveMobCollisions(world.outdoorMonsters, { outdoor: true });
  resolvePveMobPlayerCollisions(world.outdoorMonsters, { outdoor: true });
  world.outdoorMonsters = world.outdoorMonsters.filter((monster) => !monster.removed);
  document.body.dataset.outdoorMonstersAlive = String(world.outdoorMonsters.filter((monster) => !monster.dead).length);
}

function applySeatedPose() {
  const rig = world.playerRig;

  if (!rig) {
    return;
  }

  resetPlayerRootLean();
  world.playerMesh.rotation.y = 0;
  rig.body.position.y = 2.55;
  rig.body.rotation.set(-0.12, 0, 0);
  rig.chest.position.y = 3.05;
  rig.chest.rotation.set(-0.14, 0, 0);
  rig.headGroup.position.set(0, 4.55, 0.26);
  rig.headGroup.rotation.x = -0.04;
  rig.headGroup.rotation.z = 0;

  rig.leftLeg.rotation.set(-1.35, 0, -0.08);
  rig.rightLeg.rotation.set(-1.35, 0, 0.08);
  rig.leftLeg.position.set(HAND_CONFIG.left.side * 0.56, 2.2, 0.56);
  rig.rightLeg.position.set(HAND_CONFIG.right.side * 0.56, 2.2, 0.56);
  setLegJointPose(rig.leftLeg, 1.15, -0.42);
  setLegJointPose(rig.rightLeg, 1.15, -0.42);

  rig.leftArm.position.set(HAND_CONFIG.left.side * 1.0, 3.85, 0.28);
  rig.rightArm.position.set(HAND_CONFIG.right.side * 1.0, 3.85, 0.28);
  rig.leftArm.rotation.set(-0.65, 0, HAND_CONFIG.left.side * 0.34);
  rig.rightArm.rotation.set(-0.65, 0, HAND_CONFIG.right.side * 0.34);
  setArmJointPose(rig.leftArm, 0.5, -0.08, 0);
  setArmJointPose(rig.rightArm, 0.5, -0.08, 0);
}

function applyDivePose(progress) {
  const rig = world.playerRig;

  if (!rig) {
    return;
  }

  const t = clamp(progress, 0, 1);
  const diveIn = easeInOut(t / 0.36);
  const diveOut = 1 - easeInOut((t - 0.72) / 0.28);
  const dive = diveIn * diveOut;
  const reach = easeInOut(clamp((t - 0.08) / 0.24, 0, 1)) * dive;
  const legStream = easeInOut(clamp((t - 0.12) / 0.34, 0, 1)) * dive;
  const landingCrouch = Math.sin(clamp((t - 0.72) / 0.28, 0, 1) * Math.PI) * 0.18;
  const sideSway = Math.sin(t * Math.PI * 2) * 0.035 * dive;
  const diveDirection = world.playerMotion.diveDirection;

  if (diveDirection.lengthSq() > 0.001) {
    world.playerMesh.rotation.y = Math.atan2(diveDirection.x, diveDirection.z);
  }

  resetPlayerRootLean();
  world.playerVisualRoot.rotation.x = 1.38 * dive - landingCrouch * 0.18;
  world.playerVisualRoot.rotation.z = sideSway;

  rig.body.position.y = THREE.MathUtils.lerp(3.15, 3.12, dive) - landingCrouch * 0.45;
  rig.body.rotation.set(-0.08 * dive - landingCrouch * 0.35, 0, sideSway * 0.25);
  rig.chest.position.y = THREE.MathUtils.lerp(3.65, 3.62, dive) - landingCrouch * 0.35;
  rig.chest.rotation.set(-0.05 * dive, 0, sideSway * 0.2);
  rig.headGroup.position.set(0, THREE.MathUtils.lerp(5.2, 5.1, dive), THREE.MathUtils.lerp(0.16, 0.36, dive));
  rig.headGroup.rotation.set(0.1 * dive, 0, -sideSway * 0.18);

  rig.leftLeg.position.set(HAND_CONFIG.left.side * THREE.MathUtils.lerp(0.42, 0.46, dive), THREE.MathUtils.lerp(2.05, 2.14, dive), THREE.MathUtils.lerp(0, -0.18, dive));
  rig.rightLeg.position.set(HAND_CONFIG.right.side * THREE.MathUtils.lerp(0.42, 0.46, dive), THREE.MathUtils.lerp(2.05, 2.14, dive), THREE.MathUtils.lerp(0, -0.18, dive));
  rig.leftLeg.rotation.set(0.68 * legStream - landingCrouch * 1.1, 0, HAND_CONFIG.left.side * (0.04 + 0.06 * dive));
  rig.rightLeg.rotation.set(0.62 * legStream - landingCrouch * 1.1, 0, HAND_CONFIG.right.side * (0.04 + 0.06 * dive));
  setLegJointPose(rig.leftLeg, 0.2 * dive + landingCrouch * 1.45, -0.12 * dive - landingCrouch * 0.34);
  setLegJointPose(rig.rightLeg, 0.32 * dive + landingCrouch * 1.35, -0.12 * dive - landingCrouch * 0.32);

  rig.leftArm.position.set(HAND_CONFIG.left.side * THREE.MathUtils.lerp(1.08, 0.56, reach), THREE.MathUtils.lerp(4.35, 4.78, reach), THREE.MathUtils.lerp(0.22, 1.22, reach));
  rig.rightArm.position.set(HAND_CONFIG.right.side * THREE.MathUtils.lerp(1.08, 0.56, reach), THREE.MathUtils.lerp(4.35, 4.78, reach), THREE.MathUtils.lerp(0.22, 1.22, reach));
  rig.leftArm.rotation.set(-1.48 * reach - landingCrouch * 0.42, 0, HAND_CONFIG.left.side * (0.16 - 0.1 * reach));
  rig.rightArm.rotation.set(-1.48 * reach - landingCrouch * 0.42, 0, HAND_CONFIG.right.side * (0.16 - 0.1 * reach));
  setArmJointPose(rig.leftArm, 0.16 + reach * 0.42 + landingCrouch * 0.28, -0.08 * reach, HAND_CONFIG.left.side * 0.04 * reach);
  setArmJointPose(rig.rightArm, 0.16 + reach * 0.42 + landingCrouch * 0.28, -0.08 * reach, HAND_CONFIG.right.side * 0.04 * reach);
}

function setArmWalkPose(hand, swing) {
  const arm = hand === "left" ? world.playerRig.leftArm : world.playerRig.rightArm;
  const side = HAND_CONFIG[hand].side;

  arm.position.set(side * 1.08, 4.35, 0.22);
  arm.rotation.set(swing, 0, side * 0.16);
  setArmJointPose(arm, 0.12 + Math.abs(swing) * 0.36, -0.03, 0);
  const leg = hand === "left" ? world.playerRig.leftLeg : world.playerRig.rightLeg;
  leg.position.set(side * 0.42, 2.05, 0);
}

function updateAttackAnimations(deltaSeconds) {
  animateHandAttack("left", world.leftHandMount, deltaSeconds);
  animateHandAttack("right", world.rightHandMount, deltaSeconds);
}

function animateHandAttack(hand, mount, deltaSeconds) {
  const attack = world.attacks[hand];
  const base = getHandBasePose(hand);
  const side = HAND_CONFIG[hand].side;

  mount.position.copy(base.position);
  mount.rotation.copy(base.rotation);

  if (!attack) {
    animateRangedDraw(hand, mount, side);
    return;
  }

  attack.elapsed += deltaSeconds * (world.combatFeedback.hitstop > 0 ? 0.12 : 1);
  const progress = Math.min(1, attack.elapsed / attack.duration);
  const profile = attack.profile ?? getCombatProfile(attack.itemType);
  applyProfiledWeaponPose(mount, attack, progress, {
    hand,
    side,
    trailRoot: world.heldItems?.[hand]?.mesh ?? mount
  });

  if ((profile.kind === "bow" || profile.kind === "crossbow") && !attack.projectileSpawned && progress >= getCombatReleaseMoment(attack.itemType, attack.chargePower)) {
    spawnProjectile(hand, attack);
  }

  resolveMeleeHitAtSwingMoment(attack, progress);

  if (progress >= 1) {
    world.attacks[hand] = null;
    mount.position.copy(base.position);
    mount.rotation.copy(base.rotation);
  }
}

function animateRangedDraw(hand, mount, side) {
  const chargePower = getRangedChargePower(hand);

  if (chargePower <= 0) {
    return;
  }

  const draw = 0.28 + chargePower * 0.72;
  mount.position.z -= draw * 0.62;
  mount.position.x += side * draw * 0.18;
  mount.rotation.x -= 0.25 + draw * 0.62;
  mount.rotation.z += side * draw * 0.46;
  poseAttackArm(hand, -1.0 + chargePower * 0.12, side * (0.38 - draw * 0.24), draw * 0.1, 0.36 + draw * 0.48, -0.08 * draw, side * 0.05 * draw);
  updateHeldRangedModelState(world.heldItems?.[hand]?.mesh ?? mount, getEquippedItem(state, hand)?.type, draw, true);
  document.body.dataset.rangedCharge = chargePower.toFixed(2);
  document.body.dataset.rangedChargeHand = hand;
}

function resolveMeleeHitAtSwingMoment(attack, progress) {
  if (attack.hitResolved || attack.kind === "bow" || attack.kind === "crossbow") {
    return;
  }

  const hitMoment = getCombatHitMoment(attack.itemType);

  if (progress < hitMoment) {
    return;
  }

  attack.hitResolved = true;
  damagePveEnemyFromMelee(attack);
}

function spawnProjectile(hand, attack) {
  const mount = hand === "left" ? world.leftHandMount : world.rightHandMount;
  const start = new THREE.Vector3();
  const direction = getHorizontalProjectileDirection(attack);
  const horizontalSpeed = getProjectileHorizontalSpeed(attack);
  const adjustedHorizontalSpeed = horizontalSpeed;
  const chargePower = attack.chargePower ?? 0;
  const gravity = attack.kind === "crossbow" ? 15 : 24 + chargePower * 8;

  mount.getWorldPosition(start);
  start.addScaledVector(direction, attack.kind === "crossbow" ? 1.2 : 0.85);
  const velocity = getProjectileLaunchVelocity(start, attack, direction, adjustedHorizontalSpeed, gravity);
  const velocityDirection = velocity.clone();
  velocityDirection.y = 0;
  if (velocityDirection.lengthSq() > 0.001) {
    direction.copy(velocityDirection.normalize());
  }

  const projectile = {
    mesh: createProjectileMesh(attack.kind, attack.chargePower),
    direction,
    velocity,
    gravity,
    age: 0,
    travelled: 0,
    range: attack.range,
    damage: attack.damage,
    penetration: attack.penetration ?? 0,
    knockback: attack.knockback ?? 0,
    itemName: attack.itemName,
    itemType: attack.itemType,
    profile: attack.profile ?? getCombatProfile(attack.itemType),
    speed: adjustedHorizontalSpeed,
    previousPosition: start.clone()
  };

  projectile.mesh.position.copy(start);
  orientProjectileMesh(projectile);
  world.scene.add(projectile.mesh);
  world.projectiles.push(projectile);
  world.projectilesFired += 1;
  document.body.dataset.projectilesFired = String(world.projectilesFired);
  document.body.dataset.projectilesActive = String(world.projectiles.length);
  attack.projectileSpawned = true;
}

function getHorizontalProjectileDirection(attack) {
  const direction = attack?.direction?.clone?.() ?? world.aimDirection.clone();
  direction.y = 0;

  if (direction.lengthSq() < 0.001) {
    direction.set(0, 0, 1);
  }

  return direction.normalize();
}

function getProjectileLaunchVelocity(start, attack, direction, horizontalSpeed, gravity) {
  const fallbackVerticalVelocity = attack.kind === "crossbow"
    ? 3.4
    : 3.8 + (attack.chargePower ?? 0) * 4.6;
  const fallback = new THREE.Vector3(
    direction.x * horizontalSpeed,
    fallbackVerticalVelocity,
    direction.z * horizontalSpeed
  );
  const aimPoint = getProjectileAimPoint(start, attack);

  if (!aimPoint) {
    return fallback;
  }

  const offset = aimPoint.clone().sub(start);
  const horizontalOffset = new THREE.Vector3(offset.x, 0, offset.z);
  const horizontalDistance = horizontalOffset.length();

  if (horizontalDistance < 0.1) {
    const rayDirection = attack?.aimRayDirection?.clone?.() ?? world.aimRayDirection.clone();
    if (rayDirection.lengthSq() < 0.001) {
      return fallback;
    }

    rayDirection.normalize();
    return rayDirection.multiplyScalar(horizontalSpeed);
  }

  const launchDirection = horizontalOffset.normalize();
  const flightTime = horizontalDistance / horizontalSpeed;
  const verticalVelocity = (offset.y + 0.5 * gravity * flightTime * flightTime) / flightTime;

  return new THREE.Vector3(
    launchDirection.x * horizontalSpeed,
    verticalVelocity,
    launchDirection.z * horizontalSpeed
  );
}

function getProjectileAimPoint(start, attack) {
  const aimPoint = attack?.aimPoint?.clone?.() ?? (world.hasAim ? world.aimPoint.clone() : null);

  if (!aimPoint || aimPoint.distanceToSquared(start) < 0.01) {
    return null;
  }

  const horizontalOffset = new THREE.Vector3(aimPoint.x - start.x, 0, aimPoint.z - start.z);
  const horizontalDistance = horizontalOffset.length();
  const maxDistance = Math.max(8, attack.range ?? 42);

  if (horizontalDistance <= maxDistance) {
    return aimPoint;
  }

  const rayDirection = attack?.aimRayDirection?.clone?.() ?? world.aimRayDirection.clone();
  const verticalSlope = rayDirection.lengthSq() > 0.001 ? rayDirection.normalize().y : 0;
  const cappedDirection = horizontalOffset.normalize();

  return new THREE.Vector3(
    start.x + cappedDirection.x * maxDistance,
    start.y + verticalSlope * maxDistance,
    start.z + cappedDirection.z * maxDistance
  );
}

function spawnTowerProjectile(drawPower) {
  const direction = world.outpostTower.aimDirection.clone();

  if (direction.lengthSq() < 0.001) {
    direction.set(0, -0.08, 1);
  }

  direction.normalize();
  const start = new THREE.Vector3(
    world.outpostTower.position.x,
    world.outpostTower.elevation + 0.7,
    world.outpostTower.position.z
  ).addScaledVector(direction, 1.2);
  const speed = 62 + drawPower * 24;
  const projectile = {
    mesh: createProjectileMesh("bow", drawPower),
    direction: direction.clone(),
    velocity: new THREE.Vector3(direction.x * speed, direction.y * speed + 3.5, direction.z * speed),
    gravity: 12,
    age: 0,
    travelled: 0,
    range: 105,
    damage: 18 + drawPower * 14,
    knockback: 2 + drawPower * 2.5,
    speed,
    previousPosition: start.clone()
  };

  projectile.mesh.position.copy(start);
  orientProjectileMesh(projectile);
  world.scene.add(projectile.mesh);
  world.projectiles.push(projectile);
  world.projectilesFired += 1;
  document.body.dataset.projectilesFired = String(world.projectilesFired);
  document.body.dataset.projectilesActive = String(world.projectiles.length);
}

function spawnOutpostDefenseProjectile(structure, target) {
  const origin = getOutpostShotOrigin(structure);
  const aimPoint = getCombatTargetAimPoint(target);
  const direction = aimPoint.sub(origin);

  if (direction.lengthSq() < 0.001) {
    return false;
  }

  direction.normalize();
  const faction = FACTION_LOOKUP[structure.ownerFactionId];
  const projectile = {
    mesh: createProjectileMesh("bow", 0.72),
    direction: direction.clone(),
    velocity: direction.clone().multiplyScalar(OUTPOST_PROJECTILE_SPEED),
    gravity: 7.5,
    age: 0,
    travelled: 0,
    range: OUTPOST_ATTACK_RANGE + 18,
    damage: OUTPOST_ATTACK_DAMAGE,
    knockback: 3.2,
    speed: OUTPOST_PROJECTILE_SPEED,
    previousPosition: origin.clone(),
    sourceType: "outpost",
    sourceFactionId: structure.ownerFactionId,
    sourceStructureId: structure.id,
    sourceName: `${faction?.name ?? "Faction"} Outpost`,
    origin: {
      x: structure.position.x,
      z: structure.position.z
    }
  };

  projectile.mesh.position.copy(origin);
  orientProjectileMesh(projectile);
  world.scene.add(projectile.mesh);
  world.projectiles.push(projectile);
  world.projectilesFired += 1;
  document.body.dataset.projectilesFired = String(world.projectilesFired);
  document.body.dataset.projectilesActive = String(world.projectiles.length);
  return true;
}

function getProjectileHorizontalSpeed(attack) {
  const chargePower = attack.chargePower ?? 0;

  if (attack.kind === "crossbow") {
    return 78 * attack.speed;
  }

  return (54 + chargePower * 16) * attack.speed;
}

function orientProjectileMesh(projectile) {
  const velocityDirection = projectile.velocity.clone();

  if (velocityDirection.lengthSq() < 0.001) {
    velocityDirection.copy(projectile.direction);
  }

  velocityDirection.normalize();
  projectile.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), velocityDirection);
}

function createProjectileMesh(kind, chargePower = 0) {
  const group = new THREE.Group();
  const glowColor = kind === "crossbow" ? "#ff8a4a" : "#ffe18a";
  const shaftMaterial = new THREE.MeshStandardMaterial({
    color: glowColor,
    emissive: glowColor,
    emissiveIntensity: 0.45 + chargePower * 0.55,
    roughness: 0.48
  });
  const tipMaterial = new THREE.MeshStandardMaterial({
    color: "#f4f0df",
    emissive: "#f2c45d",
    emissiveIntensity: 0.25,
    roughness: 0.32,
    metalness: 0.25
  });
  const featherMaterial = new THREE.MeshStandardMaterial({
    color: kind === "crossbow" ? "#ff6d55" : "#fff4d2",
    emissive: kind === "crossbow" ? "#7a1d12" : "#8a621d",
    emissiveIntensity: 0.35,
    roughness: 0.64
  });
  const trailMaterial = new THREE.MeshBasicMaterial({
    color: glowColor,
    transparent: true,
    opacity: 0.32 + chargePower * 0.2,
    depthWrite: false
  });
  const length = kind === "crossbow" ? 1.55 : 2.2 + chargePower * 0.28;

  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, length, 10), shaftMaterial);
  shaft.rotation.x = Math.PI * 0.5;
  shaft.castShadow = true;
  group.add(shaft);

  const trail = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.065, length * 0.7, 10), trailMaterial);
  trail.position.z = -length * 0.42;
  trail.rotation.x = Math.PI * 0.5;
  group.add(trail);

  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.38, 10), tipMaterial);
  tip.position.z = length * 0.5 + 0.18;
  tip.rotation.x = Math.PI * 0.5;
  tip.castShadow = true;
  group.add(tip);

  for (const side of [-1, 1]) {
    const feather = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.38, 0.24), featherMaterial);
    feather.position.set(side * 0.13, 0, -length * 0.46);
    feather.rotation.z = side * 0.45;
    group.add(feather);
  }

  return group;
}

function updateProjectiles(deltaSeconds) {
  for (const projectile of world.projectiles) {
    projectile.previousPosition.copy(projectile.mesh.position);
    projectile.velocity.y -= projectile.gravity * deltaSeconds;
    projectile.mesh.position.addScaledVector(projectile.velocity, deltaSeconds);
    projectile.age += deltaSeconds;
    projectile.travelled += Math.hypot(
      projectile.mesh.position.x - projectile.previousPosition.x,
      projectile.mesh.position.z - projectile.previousPosition.z
    );
    orientProjectileMesh(projectile);

    if (getProjectileSceneryHit(projectile)) {
      projectile.travelled = projectile.range;
      continue;
    }

    const hit = getProjectileEnemyHit(projectile);

    if (hit) {
      projectile.impactPosition = projectile.mesh.position.clone();
      triggerCombatImpactFeedback(hit, projectile, projectile.impactPosition);
      damageCombatTarget(hit, projectile.damage, projectile.sourceType === "outpost" ? "outpost" : "projectile", projectile);
      projectile.travelled = projectile.range;
    }
  }

  const expired = world.projectiles.filter(isProjectileExpired);
  for (const projectile of expired) {
    removeFromParent(projectile.mesh);
  }

  world.projectiles = world.projectiles.filter((projectile) => !isProjectileExpired(projectile));
  document.body.dataset.projectilesActive = String(world.projectiles.length);
  document.body.dataset.projectilesFired = String(world.projectilesFired);
  if (world.projectiles[0]) {
    document.body.dataset.projectileHeight = world.projectiles[0].mesh.position.y.toFixed(2);
    document.body.dataset.projectileTravelled = world.projectiles[0].travelled.toFixed(2);
    document.body.dataset.projectileSpeed = world.projectiles[0].speed.toFixed(2);
  } else {
    delete document.body.dataset.projectileHeight;
    delete document.body.dataset.projectileTravelled;
    delete document.body.dataset.projectileSpeed;
  }
}

function isProjectileExpired(projectile) {
  const groundHeight = world.sceneMode === "outdoor"
    ? getTerrainHeightAt(projectile.mesh.position.x, projectile.mesh.position.z)
    : 0;
  return projectile.travelled >= projectile.range || (projectile.age > 0.06 && projectile.mesh.position.y <= groundHeight + 0.35);
}

function updateDroppedItems(deltaSeconds) {
  for (const drop of world.droppedItems) {
    drop.mesh.rotation.y += deltaSeconds * 0.75;
    drop.mesh.position.y = drop.baseY + Math.sin(state.elapsed * 2.4 + drop.phase) * 0.08;
  }
}

function getProjectileEnemyHit(projectile) {
  const enemies = getProjectileCombatTargets(projectile);

  if (!enemies.length) {
    return null;
  }

  for (const enemy of enemies) {
    if (enemy.dead) {
      continue;
    }

    const segmentHit = getHorizontalSegmentHit(
      projectile.previousPosition,
      projectile.mesh.position,
      enemy.mesh.position
    );

    const baseY = enemy.mesh?.position?.y ?? 0;
    const minY = baseY + (enemy.hitMinY ?? 0.6);
    const maxY = baseY + (enemy.hitMaxY ?? 5.6);

    if (segmentHit.distance <= enemy.radius + 0.5 && segmentHit.y >= minY && segmentHit.y <= maxY) {
      return enemy;
    }
  }

  return null;
}

function getProjectileCombatTargets(projectile) {
  if (projectile.sourceType !== "outpost") {
    return getActiveCombatTargets();
  }

  return getOutpostProjectileTargets(projectile);
}

function getOutpostProjectileTargets(projectile) {
  const sourceFactionId = projectile.sourceFactionId;

  return [
    ...getOutpostPveTargets(),
    ...getOutpostEnemyPlayerTargets({ ownerFactionId: sourceFactionId })
  ];
}

function getActiveCombatEnemies() {
  if (!GAME_FLAGS.pve) {
    return [];
  }

  if (world.sceneMode === "poiInterior" && world.activePoiInteriorId === "ebon-hollow") {
    return world.pveEnemies;
  }

  if (world.sceneMode === "outdoor") {
    return world.outdoorMonsters;
  }

  return [];
}

function getActiveCombatTargets() {
  return [
    ...getActiveCombatEnemies(),
    ...getAttackableStructures(),
    ...getAttackableCouriers(),
    ...getAttackableRemotePlayers()
  ];
}

function getAttackableStructures() {
  if (world.sceneMode !== "outdoor") {
    return [];
  }

  return state.structures
    .filter((structure) => structure.hp > 0)
    .map((structure) => {
      const mesh = world.meshes.structures.get(structure.id);
      const radius = structure.type === "wall" ? 6.4 : structure.type === "depot" ? 5.5 : 4.6;
      const hitMaxY = structure.type === "outpost" ? 17 : structure.type === "wall" ? 5.5 : 10.5;

      return {
        id: structure.id,
        name: BUILDING_LOOKUP[structure.type]?.name ?? capitalize(structure.type),
        isStructure: true,
        structure,
        mesh: mesh ?? { position: new THREE.Vector3(structure.position.x, 0, structure.position.z) },
        radius,
        hitMinY: 0.2,
        hitMaxY,
        hp: structure.hp,
        maxHp: structure.maxHp,
        dead: structure.hp <= 0
      };
    });
}

function getAttackableCouriers() {
  if (world.sceneMode !== "outdoor") {
    return [];
  }

  return state.couriers
    .filter((courier) => (courier.hp ?? 1) > 0)
    .map((courier) => {
      const mesh = world.meshes.couriers.get(courier.id);
      const position = getCourierWorldPosition(courier);
      const isWorker = courier.kind === "poiWorker";

      return {
        id: courier.id,
        name: getCourierDisplayName(courier),
        isCourier: true,
        courier,
        mesh: mesh ?? { position: new THREE.Vector3(position.x, 0, position.z) },
        radius: isWorker ? 1.25 : 1.9,
        hitMinY: 0.3,
        hitMaxY: isWorker ? 5.4 : 4.4,
        hp: courier.hp ?? getCourierMaxHp(courier),
        maxHp: courier.maxHp ?? getCourierMaxHp(courier),
        dead: (courier.hp ?? 1) <= 0
      };
    });
}

function getAttackableRemotePlayers() {
  if (!world.multiplayer.enabled) {
    return [];
  }

  return [...world.remotePlayers.values()].filter(
    (player) => player.group.visible && !player.dead && isRemotePlayerInCurrentScene(player.snapshot)
  );
}

function updateEntityStatusVisibility() {
  const entries = getEntityStatusEntries();
  const hoveredKey = getHoveredStatusEntityKey(entries);

  world.hoveredStatusEntityKey = hoveredKey;

  for (const entry of entries) {
    if (!entry.sprite) {
      continue;
    }

    entry.sprite.visible = !entry.dead && shouldShowEntityStatus(entry.sprite, entry.key === hoveredKey);
  }
}

function shouldShowEntityStatus(sprite, hovered = false) {
  if (hovered) {
    return true;
  }

  const data = sprite?.userData?.healthBar;

  if (data?.forceVisible) {
    return true;
  }

  const changedAt = data?.lastChangedAt;
  return Number.isFinite(changedAt) && state.elapsed - changedAt <= ENTITY_STATUS_CHANGED_VISIBLE_DURATION;
}

function getEntityStatusEntries() {
  const entries = [];

  for (const remote of world.remotePlayers.values()) {
    if (!remote.group.visible || remote.dead || !isRemotePlayerInCurrentScene(remote.snapshot)) {
      continue;
    }

      entries.push({
        key: getRemotePlayerStatusKey(remote.id),
        mesh: remote.group,
        sprite: remote.healthBar,
        dead: remote.dead
      });
  }

  if (world.sceneMode === "poiInterior" && world.activePoiInteriorId === "ebon-hollow") {
    for (const enemy of world.pveEnemies) {
      if (!enemy.mesh.visible) {
        continue;
      }

      entries.push({
        key: getPveStatusKey(enemy.id),
        mesh: enemy.mesh,
        sprite: enemy.healthBar,
        dead: enemy.dead
      });
    }
  }

  if (world.sceneMode === "outdoor") {
    for (const monster of world.outdoorMonsters) {
      if (!monster.mesh.visible) {
        continue;
      }

      entries.push({
        key: getPveStatusKey(monster.id),
        mesh: monster.mesh,
        sprite: monster.healthBar,
        dead: monster.dead
      });
    }

    for (const structure of state.structures) {
      const mesh = world.meshes.structures.get(structure.id);
      const healthBar = mesh?.getObjectByName("healthBar");

      if (!mesh || !healthBar || !mesh.visible) {
        continue;
      }

      entries.push({
        key: getStructureStatusKey(structure.id),
        mesh,
        sprite: healthBar,
        dead: structure.hp <= 0
      });
    }

    for (const courier of state.couriers) {
      const mesh = world.meshes.couriers.get(courier.id);
      const healthBar = mesh?.getObjectByName("healthBar");

      if (!mesh || !healthBar || !mesh.visible) {
        continue;
      }

      entries.push({
        key: getCourierStatusKey(courier.id),
        mesh,
        sprite: healthBar,
        dead: (courier.hp ?? 0) <= 0
      });
    }
  }

  return entries;
}

function getHoveredStatusEntityKey(entries) {
  if (!entries.length) {
    return null;
  }

  const ndc = getEntityStatusHoverNdc();

  if (!ndc) {
    return null;
  }

  world.raycaster.setFromCamera(ndc, world.camera);
  const hits = world.raycaster.intersectObjects(entries.map((entry) => entry.mesh), true);

  for (const hit of hits) {
    const key = findStatusEntityKey(hit.object);

    if (key && entries.some((entry) => entry.key === key && !entry.dead)) {
      return key;
    }
  }

  return null;
}

function getEntityStatusHoverNdc() {
  if (isLockedThirdPersonCamera()) {
    return new THREE.Vector2(0, 0);
  }

  if (!world.pointer.insideCanvas) {
    return null;
  }

  const rect = canvas.getBoundingClientRect();

  return new THREE.Vector2(
    ((world.pointer.x - rect.left) / rect.width) * 2 - 1,
    -(((world.pointer.y - rect.top) / rect.height) * 2 - 1)
  );
}

function findStatusEntityKey(object) {
  let current = object;

  while (current) {
    if (current.userData?.statusEntityKey) {
      return current.userData.statusEntityKey;
    }
    current = current.parent;
  }

  return null;
}

function tagEntityStatusTarget(root, key) {
  root.traverse((child) => {
    child.userData.statusEntityKey = key;
  });
}

function getPveStatusKey(id) {
  return `pve:${id}`;
}

function getRemotePlayerStatusKey(id) {
  return `player:${id}`;
}

function getStructureStatusKey(id) {
  return `structure:${id}`;
}

function getCourierStatusKey(id) {
  return `courier:${id}`;
}

function getProjectileSceneryHit(projectile) {
  if (world.sceneMode !== "outdoor") {
    return null;
  }

  for (const collider of world.sceneryColliders) {
    const segmentHit = getHorizontalSegmentHit(
      projectile.previousPosition,
      projectile.mesh.position,
      { x: collider.x, z: collider.z }
    );

    if (segmentHit.distance <= collider.radius + 0.12 && segmentHit.y >= 0.25 && segmentHit.y <= collider.height) {
      return collider;
    }
  }

  return null;
}

function getHorizontalSegmentHit(start, end, point) {
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const lengthSq = dx * dx + dz * dz;
  const t = lengthSq < 0.0001
    ? 0
    : clamp(((point.x - start.x) * dx + (point.z - start.z) * dz) / lengthSq, 0, 1);
  const closestX = start.x + dx * t;
  const closestZ = start.z + dz * t;

  return {
    distance: Math.hypot(point.x - closestX, point.z - closestZ),
    t,
    x: closestX,
    z: closestZ,
    y: start.y + (end.y - start.y) * t
  };
}

function damagePveEnemyFromMelee(attack) {
  const enemies = getActiveCombatTargets();

  if (!enemies.length) {
    return;
  }

  const weaponSegments = getAttackWeaponHitSegments(attack);

  if (weaponSegments.length) {
    showCombatDebugSegments(weaponSegments);
    if (damageCombatTargetFromWeaponSegments(enemies, attack, weaponSegments)) {
      return;
    }
  }

  damageCombatTargetFromAimProfile(enemies, attack);
}

function getAttackWeaponHitSegments(attack) {
  if (!attack?.hand || attack.kind === "unarmed") {
    return [];
  }

  const held = world.heldItems?.[attack.hand]?.mesh;
  const segments = held?.userData?.weaponHitSegments;

  if (!held || !Array.isArray(segments) || !segments.length) {
    return [];
  }

  held.updateWorldMatrix(true, true);
  return segments
    .map((segment) => {
      const start = held.localToWorld(new THREE.Vector3(...segment.start));
      const end = held.localToWorld(new THREE.Vector3(...segment.end));

      return {
        start,
        end,
        radius: Math.max(0.04, segment.radius ?? 0.16)
      };
    })
    .filter((segment) => segment.start.distanceToSquared(segment.end) > 0.0001);
}

function damageCombatTargetFromWeaponSegments(enemies, attack, weaponSegments) {
  let best = null;

  for (const enemy of enemies) {
    if (enemy.dead) {
      continue;
    }

    for (const segment of weaponSegments) {
      const hit = getWeaponSegmentTargetHit(segment, enemy);

      if (!hit) {
        continue;
      }

      const targetDistance = Math.hypot(
        hit.targetPosition.x - state.player.position.x,
        hit.targetPosition.z - state.player.position.z
      );
      const score = hit.distance + targetDistance * 0.035;

      if (!best || score < best.score) {
        best = { enemy, hit, score };
      }
    }
  }

  if (!best) {
    return false;
  }

  attack.impactPosition = best.hit.point;
  triggerCombatImpactFeedback(best.enemy, attack, best.hit.point);
  damageCombatTarget(best.enemy, attack.damage, attack.itemName, attack);
  return true;
}

function getWeaponSegmentTargetHit(segment, target) {
  const targetPosition = getCombatTargetBaseWorldPosition(target);
  const targetRadius = target.radius ?? 1.1;
  const segmentHit = getHorizontalSegmentHit(segment.start, segment.end, targetPosition);
  const baseY = targetPosition.y ?? 0;
  const minY = baseY + (target.hitMinY ?? 0.6);
  const maxY = baseY + (target.hitMaxY ?? 5.6);
  const verticalPadding = segment.radius + 0.18;

  if (segmentHit.distance > targetRadius + segment.radius) {
    return null;
  }

  if (segmentHit.y < minY - verticalPadding || segmentHit.y > maxY + verticalPadding) {
    return null;
  }

  return {
    distance: segmentHit.distance,
    targetPosition,
    point: new THREE.Vector3(segmentHit.x, clamp(segmentHit.y, minY, maxY), segmentHit.z)
  };
}

function getCombatTargetBaseWorldPosition(target) {
  const position = new THREE.Vector3();

  if (typeof target?.mesh?.getWorldPosition === "function") {
    target.mesh.getWorldPosition(position);
  } else if (target?.mesh?.position) {
    position.copy(target.mesh.position);
  }

  return position;
}

function damageCombatTargetFromAimProfile(enemies, attack) {
  const origin = state.player.position;
  const direction = attack?.direction?.clone?.() ?? world.aimDirection.clone();
  direction.y = 0;

  if (direction.lengthSq() < 0.001) {
    return;
  }

  direction.normalize();
  const right = new THREE.Vector3(direction.z, 0, -direction.x);
  const profile = getMeleeHitProfile(attack.itemType, attack.kind, attack.range);
  let best = null;

  for (const enemy of enemies) {
    if (enemy.dead) {
      continue;
    }

    const toEnemy = new THREE.Vector3(enemy.mesh.position.x - origin.x, 0, enemy.mesh.position.z - origin.z);
    const distance = toEnemy.length();
    const targetRadius = enemy.isStructure ? Math.min(enemy.radius ?? 1.1, 2.4) : (enemy.radius ?? 1.1);
    const forwardRadius = enemy.isStructure ? (enemy.radius ?? targetRadius) : targetRadius;

    if (distance < 0.01) {
      continue;
    }

    const forwardDistance = toEnemy.dot(direction);
    const lateralDistance = toEnemy.dot(right);
    const maxForward = profile.reach + forwardRadius * profile.enemyRadiusScale;
    const maxLateral = profile.halfWidth + targetRadius * profile.enemyRadiusScale;

    if (forwardDistance < profile.minForward - targetRadius * 0.22 || forwardDistance > maxForward) {
      continue;
    }

    if (Math.abs(lateralDistance) > maxLateral) {
      continue;
    }

    const sweepSide = attack.slashDirection || 1;
    const sweepBonus = attack.kind === "slash" ? Math.max(0, lateralDistance * sweepSide) * 0.12 : 0;
    const lateralPenalty = Math.max(0, Math.abs(lateralDistance) - profile.halfWidth * 0.55) * 0.75;
    const score = Math.abs(forwardDistance - profile.sweetSpot) * 0.55 + lateralPenalty + distance * 0.1 - sweepBonus;

    if (!best || score < best.score) {
      best = { enemy, score };
    }
  }

  if (best) {
    triggerCombatImpactFeedback(best.enemy, attack, null);
    damageCombatTarget(best.enemy, attack.damage, attack.itemName, attack);
  }
}

function triggerCombatImpactFeedback(target, attack, impactPosition = null, options = {}) {
  const profile = attack?.profile ?? getCombatProfile(attack?.itemType ?? attack?.kind);
  const impact = profile.impactProfile ?? {};
  const weight = impact.weight ?? 0.55;

  if (options.hitstop !== false) {
    world.combatFeedback.hitstop = Math.max(world.combatFeedback.hitstop, impact.hitstop ?? 0.035);
  }
  world.combatFeedback.cameraImpulse = Math.max(world.combatFeedback.cameraImpulse, impact.camera ?? 0.014);
  world.combatFeedback.cameraPhase = 0;
  document.body.dataset.lastCombatImpact = `${profile.family}:${Math.round(weight * 100)}`;

  if (impactPosition) {
    attack.impactPosition = impactPosition;
  }

  if (target?.mesh && !target.isStructure && !target.isCourier) {
    const direction = attack?.direction?.clone?.() ?? new THREE.Vector3(0, 0, 1);
    target.hitReaction = {
      elapsed: 0,
      duration: 0.16 + (impact.flinch ?? 0.25) * 0.32,
      intensity: impact.flinch ?? 0.25,
      direction
    };
  }
}

function updateCombatHitReaction(entity, deltaSeconds) {
  const reaction = entity?.hitReaction;

  if (!reaction || !entity.mesh) {
    return;
  }

  reaction.elapsed += deltaSeconds;
  const progress = clamp(reaction.elapsed / Math.max(0.001, reaction.duration), 0, 1);
  const pulse = Math.sin(progress * Math.PI) * reaction.intensity;
  entity.mesh.rotation.x = -pulse * 0.16;
  entity.mesh.rotation.z = pulse * 0.08;

  if (progress >= 1) {
    entity.mesh.rotation.x = 0;
    entity.mesh.rotation.z = 0;
    entity.hitReaction = null;
  }
}

function updateCombatFeedback(deltaSeconds) {
  world.combatFeedback.hitstop = Math.max(0, world.combatFeedback.hitstop - deltaSeconds);
  world.combatFeedback.cameraImpulse = Math.max(0, world.combatFeedback.cameraImpulse - deltaSeconds * 0.05);
  world.combatFeedback.cameraPhase += deltaSeconds * 58;
  updateCombatDebugVisuals();
}

function showCombatDebugSegments(segments) {
  if (!world.combatDebug.hitboxes || !Array.isArray(segments) || !segments.length) {
    return;
  }

  for (const segment of segments) {
    const geometry = new THREE.BufferGeometry().setFromPoints([segment.start, segment.end]);
    const material = new THREE.LineBasicMaterial({ color: "#ffef6e" });
    const line = new THREE.Line(geometry, material);
    line.userData.expiresAt = state.elapsed + 0.22;
    world.scene.add(line);
    world.combatDebug.objects.push(line);
  }

  document.body.dataset.combatHitboxDebug = String(world.combatDebug.objects.length);
}

function updateCombatDebugVisuals() {
  if (!world.combatDebug.objects.length) {
    return;
  }

  for (const object of world.combatDebug.objects) {
    if ((object.userData.expiresAt ?? 0) <= state.elapsed) {
      removeFromParent(object);
    }
  }

  world.combatDebug.objects = world.combatDebug.objects.filter((object) => object.parent);
  document.body.dataset.combatHitboxDebug = String(world.combatDebug.objects.length);
}

function applyPveEnemyHitToPlayer(enemy) {
  if (!enemy || state.player.dead) {
    return;
  }

  const stats = enemy.weapon?.weapon ?? {};
  const rawDamage = Math.max(1, Math.round(Number(stats.damage) || 8));
  const damage = mitigateDamageWithArmor(rawDamage, Number(stats.penetration) || 0, getEquippedArmorItems(), { wear: true });
  const previousHp = state.player.hp ?? state.player.maxHp ?? MULTIPLAYER_MAX_HEALTH;
  const attackDirection = new THREE.Vector3(
    state.player.position.x - enemy.mesh.position.x,
    0,
    state.player.position.z - enemy.mesh.position.z
  );

  if (attackDirection.lengthSq() > 0.001) {
    attackDirection.normalize();
  }

  applyKnockbackToLocalPlayer(enemy.mesh.position, stats.knockback ?? 0);
  triggerCombatImpactFeedback(getLocalPlayerCombatTarget(), {
    itemType: enemy.weapon?.type ?? "Empty Hand",
    profile: getCombatProfile(enemy.weapon?.type ?? "Empty Hand"),
    direction: attackDirection
  }, null, { hitstop: false });
  state.player.maxHp = state.player.maxHp ?? MULTIPLAYER_MAX_HEALTH;
  state.player.hp = Math.max(0, previousHp - damage);
  spawnBloodSplat({ mesh: world.playerMesh, radius: 1.15, hitMinY: 0.8, hitMaxY: 5.4 }, null, damage);
  updatePlayerHealthBar();
  refreshUi();

  if (state.player.hp > 0) {
    return;
  }

  state.player.dead = true;
  world.multiplayer.localDefeated = true;
  world.multiplayer.respawnAt = Date.now() + PLAYER_RESPAWN_DELAY_MS;
  placePlayerAtRespawnPoint();
  flash("You were defeated.");
}

function getEquippedArmorItems() {
  return BODY_EQUIP_SLOTS
    .filter((slot) => !slot.hand)
    .map((slot) => getItemById(state.player.equipment[slot.stateKey]))
    .filter((item) => isArmorItem(item) && item.durability > 0);
}

function mitigateDamageWithArmor(amount, penetration = 0, armorItems = [], options = {}) {
  const rawDamage = Math.max(1, Math.round(Number(amount) || 1));
  const totals = getArmorTotals(armorItems);

  if (totals.defense <= 0 && totals.resistance <= 0) {
    return rawDamage;
  }

  const effectiveDefense = Math.max(0, totals.defense - penetration * 0.75);
  const effectiveResistance = clamp(totals.resistance - penetration * 0.35, 0, 70);
  const reduced = rawDamage * (1 - effectiveResistance / 100) - effectiveDefense * 0.45;
  const mitigated = Math.max(1, Math.round(Math.max(rawDamage * 0.22, reduced)));

  if (options.wear) {
    wearArmorItems(armorItems, rawDamage);
  }

  return mitigated;
}

function getArmorTotals(armorItems = []) {
  return armorItems.reduce(
    (totals, item) => {
      const condition = clamp((item.durability ?? item.maxDurability ?? 1) / Math.max(1, item.maxDurability ?? 1), 0.2, 1);
      totals.defense += (Number(item.armor?.defense) || 0) * condition;
      totals.resistance += Number(item.armor?.resistance) || 0;
      totals.toughness += Number(item.armor?.toughness) || 0;
      totals.weight += Number(item.armor?.weight) || 0;
      return totals;
    },
    { defense: 0, resistance: 0, toughness: 0, weight: 0 }
  );
}

function wearArmorItems(armorItems, rawDamage) {
  const wearable = armorItems.filter((item) => item.durability > 0);

  if (!wearable.length) {
    return;
  }

  const item = randomItem(wearable);
  const toughness = Math.max(1, Number(item.armor?.toughness) || 1);
  const wear = Math.max(1, Math.round(rawDamage / (toughness + 8)));
  item.durability = Math.max(0, item.durability - wear);
}

function damageCombatTarget(target, amount, source, attack) {
  if (target.isStructure) {
    damageStructureTarget(target, amount, source, attack);
    return;
  }

  if (target.isCourier) {
    damageCourierTarget(target, amount, source, attack);
    return;
  }

  if (target.isRemotePlayer) {
    sendPlayerAttack(target, amount, source, attack);
    return;
  }

  if (target.isLocalPlayer) {
    damageLocalPlayerTarget(target, amount, source, attack);
    return;
  }

  damagePveEnemy(target, amount, source, attack);
}

function damageStructureTarget(target, amount, source, attack = null) {
  const structure = target.structure;

  if (!structure || structure.hp <= 0) {
    return;
  }

  structure.hp = Math.max(0, structure.hp - amount);
  structure.lastDamagedAt = state.elapsed;
  markPersistenceDirty();
  updateStructureHealthBar(structure);

  if (structure.hp <= 0) {
    if (world.outpostTower.structureId === structure.id) {
      exitOutpostTower();
    }

    if (structure.type === "depot") {
      for (const courier of state.couriers.filter((entry) => entry.fromStructureId === structure.id)) {
        removeFromParent(world.meshes.couriers.get(courier.id));
        world.meshes.couriers.delete(courier.id);
        world.courierVisuals.delete(courier.id);
      }
      state.couriers = state.couriers.filter((entry) => entry.fromStructureId !== structure.id);
    }

    flash(`${target.name} destroyed.`);
  } else {
    flash(`${target.name} hit for ${Math.round(amount)}.`);
  }
}

function damageCourierTarget(target, amount, source, attack = null) {
  const courier = target.courier;

  if (!courier || (courier.hp ?? 0) <= 0) {
    return;
  }

  courier.hp = Math.max(0, (courier.hp ?? 65) - amount);
  courier.lastDamagedAt = state.elapsed;
  markPersistenceDirty();

  if (courier.hp > 0) {
    flash(`${getCourierDisplayName(courier)} hit for ${Math.round(amount)}.`);
    return;
  }

  lootCourier(courier);

  if (courier.kind === "poiWorker") {
    const poi = state.pois.find((entry) => entry.id === courier.fromPoiId);
    if (poi) {
      poi.workerRespawnAt = state.elapsed + 30;
    }
  } else {
    const depot = state.structures.find((structure) => structure.id === courier.fromStructureId);
    if (depot) {
      depot.camelRespawnAt = state.elapsed + 30;
    }
  }

  state.couriers = state.couriers.filter((entry) => entry.id !== courier.id);
  removeFromParent(world.meshes.couriers.get(courier.id));
  world.meshes.couriers.delete(courier.id);
  world.courierVisuals.delete(courier.id);
  flash(`${getCourierDisplayName(courier)} defeated.`);
}

function lootCourier(courier) {
  let total = 0;

  for (const resource of RESOURCE_TYPES) {
    const amount = Math.max(0, Math.floor(Number(courier.payload?.[resource.id]) || 0));

    if (amount > 0) {
      state.player.resources[resource.id] += amount;
      total += amount;
    }
  }

  const gold = Math.max(0, Math.floor(Number(courier.payload?.gold) || 0));
  if (gold > 0) {
    state.player.gold += gold;
    total += gold;
  }

  if (Array.isArray(courier.items) && courier.items.length) {
    state.player.inventory.push(...courier.items);
  }

  if (total > 0 || courier.items?.length) {
    flash(`Looted ${total} resources from ${getCourierDisplayName(courier)}.`);
  }
}

function sendPlayerAttack(target, amount, source, attack) {
  if (!world.multiplayer.enabled || !target?.id) {
    return;
  }

  const direction = attack?.direction ?? world.aimDirection;
  const origin = attack?.origin ?? null;

  fetch("/api/multiplayer/attack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      attackerId: state.player.id,
      targetId: target.id,
      damage: amount,
      penetration: attack?.penetration ?? 0,
      knockback: attack?.knockback ?? 0,
      range: attack?.range ?? 3,
      source,
      sourceFactionId: attack?.sourceFactionId ?? state.selectedFactionId,
      sourceStructureId: attack?.sourceStructureId ?? null,
      sourceName: attack?.sourceName ?? null,
      origin,
      direction: {
        x: direction.x,
        z: direction.z
      }
    })
  })
    .then((response) => response.ok ? response.json() : Promise.reject(new Error("PvP attack failed.")))
    .then((result) => {
      if (!result.ok) {
        flash(result.message ?? "Attack missed.");
        return;
      }

      if (result.target) {
        syncRemotePlayer(result.target);
      }

      if (result.defeated && source !== "outpost") {
        recordPlayerKillLore(state, result.target ?? target.snapshot ?? target, {
          weaponName: attack?.itemName ?? source ?? "arms"
        });
        markPersistenceDirty();
      }

      flash(result.message ?? `${target.name} hit.`);
    })
    .catch(() => {
      flash("PvP attack could not reach the server.");
    });
}

function damageLocalPlayerTarget(target, amount, source, attack = null) {
  if (state.player.dead) {
    return;
  }

  const rawDamage = Math.max(1, Math.round(Number(amount) || 1));
  const damage = mitigateDamageWithArmor(rawDamage, Number(attack?.penetration) || 0, getEquippedArmorItems(), { wear: true });
  const previousHp = state.player.hp ?? state.player.maxHp ?? MULTIPLAYER_MAX_HEALTH;
  const sourcePosition = attack?.mesh?.position ?? attack?.previousPosition ?? null;

  if (sourcePosition) {
    applyKnockbackToLocalPlayer(sourcePosition, attack?.knockback ?? 0);
  }

  state.player.maxHp = state.player.maxHp ?? MULTIPLAYER_MAX_HEALTH;
  state.player.hp = Math.max(0, previousHp - damage);
  if (!isBloodlessAttack(attack, source)) {
    spawnBloodSplat(target, attack, damage);
  }
  updatePlayerHealthBar();
  refreshUi();

  if (state.player.hp <= 0) {
    state.player.dead = true;
    world.multiplayer.localDefeated = true;
    world.multiplayer.respawnAt = Date.now() + PLAYER_RESPAWN_DELAY_MS;
    placePlayerAtRespawnPoint();
    flash(`You were defeated by ${attack?.sourceName ?? "an outpost"}.`);
  } else {
    flash(`${attack?.sourceName ?? "Outpost"} hit you for ${damage}.`);
  }

  if (world.multiplayer.enabled) {
    publishLocalPlayer(true);
  }
}

function damagePveEnemy(enemy, amount, source, attack = null) {
  if (!enemy || enemy.dead) {
    return;
  }

  const damage = mitigateDamageWithArmor(amount, Number(attack?.penetration) || 0, enemy.armor ?? []);
  enemy.hp = Math.max(0, enemy.hp - damage);
  if (!isBloodlessAttack(attack, source)) {
    spawnBloodSplat(enemy, attack, damage);
  }
  applyKnockbackToPveEnemy(enemy, attack);
  updatePveEnemyHealthBar(enemy);
  if (enemy.hp > 0) {
    revealHealthBarSprite(enemy.healthBar, { persistent: true });
  }
  enemy.mesh.scale.set(1.08, 1.08, 1.08);

  if (enemy.hp <= 0) {
    enemy.dead = true;
    enemy.deathTimer = 0;
    resetPveEnemyAttackState(enemy);
    const droppedItems = getDroppedLootItems(enemy);

    if (source === "outpost") {
      spawnDroppedLootItems(droppedItems, enemy.mesh.position, enemy.name);
      flash(droppedItems.length
        ? `${enemy.name} defeated by outpost arrows. ${formatLootNames(droppedItems)} dropped nearby.`
        : `${enemy.name} defeated by outpost arrows.`);
      return;
    }

    const renownGain = Math.max(1, Math.round(enemy.maxHp / 8));

    if (droppedItems.length) {
      state.player.inventory.push(...droppedItems);
      state.player.selectedGearItemId = droppedItems[0].id;
    }

    state.player.renown += renownGain;
    markPersistenceDirty();
    refreshUi();
    flash(droppedItems.length
      ? `${enemy.name} defeated. Looted ${formatLootNames(droppedItems)} and gained ${renownGain} renown.`
      : `${enemy.name} defeated. Gained ${renownGain} renown.`);
  } else if (source !== "outpost") {
    flash(`${enemy.name} hit for ${Math.round(damage)}.`);
  }
}

function formatLootNames(items) {
  if (items.length <= 2) {
    return items.map((item) => item.name).join(" and ");
  }

  return `${items[0].name} and ${items.length - 1} more items`;
}

function isBloodlessAttack(attack = null, source = "") {
  return attack?.itemType === "Empty Hand" || source === "Empty Hand";
}

function isBloodlessDamageSource(source = "") {
  return source === "Empty Hand";
}

function spawnBloodSplat(target, attack = null, amount = 1) {
  if (!target?.mesh) {
    return;
  }

  const impact = getBloodImpactPosition(target, attack);
  const sprayDirection = getBloodSprayDirection(target, impact, attack);
  const texture = getBloodSplatTexture();
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0.95,
    depthTest: false,
    depthWrite: false
  });
  material.rotation = randomBetween(-Math.PI, Math.PI);

  const sprite = new THREE.Sprite(material);
  const scale = clamp(1.9 + Math.sqrt(Math.max(1, amount)) * 0.24, 2.1, 4.6);
  sprite.position.copy(impact).addScaledVector(sprayDirection, 0.44);
  sprite.renderOrder = 900;
  sprite.scale.set(scale, scale * randomBetween(0.78, 1.16), 1);
  world.scene.add(sprite);

  const droplets = [];
  for (let index = 0; index < BLOOD_SPLAT_DROPLET_COUNT; index += 1) {
    const dropletMaterial = new THREE.MeshBasicMaterial({
      color: index % 3 === 0 ? "#4a0505" : "#850909",
      transparent: true,
      opacity: 0.9,
      depthTest: false,
      depthWrite: false
    });
    const droplet = new THREE.Mesh(new THREE.SphereGeometry(randomBetween(0.055, 0.14), 6, 4), dropletMaterial);
    const side = new THREE.Vector3(
      randomBetween(-0.8, 0.8),
      randomBetween(-0.1, 0.7),
      randomBetween(-0.8, 0.8)
    );
    const velocity = sprayDirection.clone()
      .multiplyScalar(randomBetween(3.2, 7.8))
      .add(side)
      .add(new THREE.Vector3(0, randomBetween(1.7, 5.1), 0));
    droplet.position.copy(impact).addScaledVector(sprayDirection, 0.5);
    droplet.renderOrder = 901;
    world.scene.add(droplet);
    droplets.push({ mesh: droplet, velocity });
  }

  world.bloodSplats.push({
    sprite,
    droplets,
    age: 0,
    lifetime: BLOOD_SPLAT_LIFETIME,
    baseScale: sprite.scale.clone()
  });
}

function getBloodImpactPosition(target, attack) {
  const targetPosition = new THREE.Vector3();
  const hasExplicitImpact = Boolean(attack?.impactPosition || attack?.mesh?.position);

  if (attack?.impactPosition) {
    targetPosition.copy(attack.impactPosition);
  } else if (attack?.mesh?.position) {
    targetPosition.copy(attack.mesh.position);
  } else if (typeof target.mesh.getWorldPosition === "function") {
    target.mesh.getWorldPosition(targetPosition);
  } else {
    targetPosition.copy(target.mesh.position);
  }

  const baseY = target.mesh?.position?.y ?? targetPosition.y;
  const minY = baseY + (target.hitMinY ?? 0.8);
  const maxY = baseY + (target.hitMaxY ?? 5.2);
  const preferredY = hasExplicitImpact
    ? targetPosition.y
    : baseY + clamp((target.hitMaxY ?? 5.2) * 0.58, 1.5, 3.4);
  targetPosition.y = clamp(preferredY + randomBetween(-0.28, 0.34), minY, maxY);
  return targetPosition;
}

function getBloodSprayDirection(target, impact, attack) {
  if (attack?.direction?.lengthSq?.() > 0.001) {
    return attack.direction.clone().normalize();
  }

  const fromPlayer = new THREE.Vector3(
    impact.x - state.player.position.x,
    0.1,
    impact.z - state.player.position.z
  );

  if (fromPlayer.lengthSq() > 0.001) {
    return fromPlayer.normalize();
  }

  const fallback = world.aimDirection.clone();
  fallback.y = 0.1;
  return fallback.lengthSq() > 0.001 ? fallback.normalize() : new THREE.Vector3(0, 0.1, 1);
}

function updateBloodSplats(deltaSeconds) {
  if (!world.bloodSplats.length) {
    return;
  }

  const remaining = [];
  for (const effect of world.bloodSplats) {
    effect.age += deltaSeconds;
    const progress = clamp(effect.age / effect.lifetime, 0, 1);
    const fade = 1 - easeOut(progress);

    effect.sprite.material.opacity = 0.95 * fade;
    effect.sprite.scale.copy(effect.baseScale).multiplyScalar(1 + progress * 0.34);

    for (const droplet of effect.droplets) {
      droplet.velocity.y -= 9.5 * deltaSeconds;
      droplet.mesh.position.addScaledVector(droplet.velocity, deltaSeconds);
      droplet.mesh.material.opacity = 0.9 * fade;
    }

    if (progress < 1) {
      remaining.push(effect);
      continue;
    }

    disposeBloodSplat(effect);
  }

  world.bloodSplats = remaining;
}

function disposeBloodSplat(effect) {
  removeFromParent(effect.sprite);
  effect.sprite.material.dispose();

  for (const droplet of effect.droplets) {
    removeFromParent(droplet.mesh);
    droplet.mesh.geometry.dispose();
    droplet.mesh.material.dispose();
  }
}

function getBloodSplatTexture() {
  if (world.bloodSplatTexture) {
    return world.bloodSplatTexture;
  }

  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 256;
  textureCanvas.height = 256;
  const context = textureCanvas.getContext("2d");
  context.clearRect(0, 0, 256, 256);

  const blotches = [
    { x: 128, y: 130, rx: 55, ry: 39, color: "rgba(112, 7, 8, 0.95)" },
    { x: 93, y: 114, rx: 31, ry: 24, color: "rgba(143, 10, 10, 0.9)" },
    { x: 157, y: 106, rx: 42, ry: 22, color: "rgba(82, 4, 7, 0.88)" },
    { x: 154, y: 160, rx: 34, ry: 30, color: "rgba(130, 8, 8, 0.86)" },
    { x: 101, y: 158, rx: 24, ry: 18, color: "rgba(74, 4, 5, 0.82)" }
  ];

  for (const blotch of blotches) {
    context.save();
    context.translate(blotch.x, blotch.y);
    context.rotate(randomBetween(-0.6, 0.6));
    context.fillStyle = blotch.color;
    context.beginPath();
    context.ellipse(0, 0, blotch.rx, blotch.ry, 0, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  for (let index = 0; index < 20; index += 1) {
    const angle = randomBetween(0, Math.PI * 2);
    const distance = randomBetween(34, 92);
    const size = randomBetween(3, 11);
    context.fillStyle = index % 4 === 0 ? "rgba(62, 3, 5, 0.85)" : "rgba(130, 8, 8, 0.82)";
    context.beginPath();
    context.ellipse(
      128 + Math.cos(angle) * distance,
      128 + Math.sin(angle) * distance,
      size * randomBetween(0.7, 1.45),
      size * randomBetween(0.45, 1.1),
      angle,
      0,
      Math.PI * 2
    );
    context.fill();
  }

  world.bloodSplatTexture = new THREE.CanvasTexture(textureCanvas);
  world.bloodSplatTexture.colorSpace = THREE.SRGBColorSpace;
  return world.bloodSplatTexture;
}

function applyKnockbackToPveEnemy(enemy, attack) {
  const knockback = Math.max(0, Number(attack?.knockback) || 0);

  if (!enemy?.mesh || knockback <= 0) {
    return;
  }

  const direction = getKnockbackDirection(attack?.direction, state.player.position, enemy.mesh.position);
  enemy.knockbackVelocity = enemy.knockbackVelocity ?? new THREE.Vector3(0, 0, 0);
  addKnockbackImpulse(enemy.knockbackVelocity, direction, knockback, PVE_KNOCKBACK_IMPULSE_SCALE);
}

function applyKnockbackToLocalPlayer(sourcePosition, knockback) {
  const amount = Math.max(0, Number(knockback) || 0);

  if (amount <= 0 || state.player.dead || world.outpostTower.active) {
    return;
  }

  const direction = getKnockbackDirection(null, sourcePosition, state.player.position);
  addKnockbackImpulse(world.playerMotion.knockbackVelocity, direction, amount, PLAYER_KNOCKBACK_IMPULSE_SCALE);
}

function addKnockbackImpulse(velocity, direction, amount, scale) {
  if (!velocity || !direction || amount <= 0) {
    return;
  }

  const impulse = clamp(amount * scale, 1.8, KNOCKBACK_MAX_SPEED);
  velocity.addScaledVector(direction, impulse);

  if (velocity.length() > KNOCKBACK_MAX_SPEED) {
    velocity.setLength(KNOCKBACK_MAX_SPEED);
  }
}

function applyPveEntityKnockbackMotion(entity, deltaSeconds, options = {}) {
  const velocity = entity?.knockbackVelocity;

  if (!entity?.mesh || !velocity || velocity.lengthSq() < 0.0025) {
    velocity?.set(0, 0, 0);
    return;
  }

  movePveEntityTo(entity, {
    x: entity.mesh.position.x + velocity.x * deltaSeconds,
    z: entity.mesh.position.z + velocity.z * deltaSeconds
  }, options);
  dampKnockbackVelocity(velocity, deltaSeconds);
}

function dampKnockbackVelocity(velocity, deltaSeconds) {
  velocity.multiplyScalar(Math.max(0, 1 - KNOCKBACK_DAMPING * deltaSeconds));

  if (velocity.lengthSq() < 0.0025) {
    velocity.set(0, 0, 0);
  }
}

function movePveEntityTo(entity, position, options = {}) {
  if (!entity?.mesh) {
    return;
  }

  if (options.outdoor) {
    const resolved = resolveOutdoorSceneryCollision(
      {
        x: clamp(position.x, -248, 248),
        z: clamp(position.z, -248, 248)
      },
      entity.radius ?? 1.1
    );
    entity.mesh.position.x = resolved.x;
    entity.mesh.position.y = getTerrainHeightAt(resolved.x, resolved.z);
    entity.mesh.position.z = resolved.z;
    return;
  }

  entity.mesh.position.x = clamp(position.x, -52, 52);
  entity.mesh.position.z = clamp(position.z, -38, 40);
}

function resolvePveMobCollisions(mobs, options = {}) {
  const activeMobs = mobs.filter((mob) => mob?.mesh?.visible && !mob.dead && !mob.removed);

  for (let pass = 0; pass < 2; pass += 1) {
    for (let aIndex = 0; aIndex < activeMobs.length; aIndex += 1) {
      for (let bIndex = aIndex + 1; bIndex < activeMobs.length; bIndex += 1) {
        separatePveMobPair(activeMobs[aIndex], activeMobs[bIndex], options);
      }
    }
  }
}

function resolveLocalPlayerActorCollisions(bounds) {
  if (!bounds || state.player.dead || world.outpostTower.active) {
    return;
  }

  const actors = [
    ...getActivePveBodyCollisionActors(),
    ...getActiveRemotePlayerCollisionActors()
  ];

  if (!actors.length) {
    return;
  }

  for (let pass = 0; pass < 2; pass += 1) {
    for (const actor of actors) {
      separateLocalPlayerFromActor(actor, bounds);
    }
  }

  settlePlayerSupportAfterMove();
}

function resolvePveMobPlayerCollisions(mobs, options = {}) {
  const activeMobs = mobs.filter((mob) => mob?.mesh?.visible && !mob.dead && !mob.removed);
  const players = getActivePlayerBodyCollisionActors();

  if (!activeMobs.length || !players.length) {
    return;
  }

  for (let pass = 0; pass < 2; pass += 1) {
    for (const mob of activeMobs) {
      for (const player of players) {
        separatePveMobFromPlayer(mob, player, options);
      }
    }
  }
}

function resolveRemotePlayerBodyCollisions() {
  const remotes = getActiveRemotePlayerCollisionActors();

  if (!remotes.length) {
    return;
  }

  for (let pass = 0; pass < 2; pass += 1) {
    if (!state.player.dead && !world.outpostTower.active) {
      const localPlayer = getLocalPlayerBodyCollisionActor();

      for (const remote of remotes) {
        separateRemotePlayerFromActor(remote, localPlayer);
      }
    }

    for (let aIndex = 0; aIndex < remotes.length; aIndex += 1) {
      for (let bIndex = aIndex + 1; bIndex < remotes.length; bIndex += 1) {
        separateRemotePlayerPair(remotes[aIndex], remotes[bIndex]);
      }
    }
  }
}

function separateLocalPlayerFromActor(actor, bounds) {
  const position = getCollisionActorPosition(actor);
  const dx = state.player.position.x - position.x;
  const dz = state.player.position.z - position.z;
  const separation = getCollisionSeparation(dx, dz, PLAYER_COLLISION_RADIUS, actor.radius, state.player.id, actor.id);

  if (!separation) {
    return;
  }

  moveLocalPlayerTo({
    x: state.player.position.x + separation.nx * separation.overlap,
    z: state.player.position.z + separation.nz * separation.overlap
  }, bounds);
}

function separatePveMobFromPlayer(mob, player, options) {
  const mobPosition = getCollisionActorPosition(mob);
  const playerPosition = getCollisionActorPosition(player);
  const dx = mobPosition.x - playerPosition.x;
  const dz = mobPosition.z - playerPosition.z;
  const separation = getCollisionSeparation(dx, dz, mob.radius, player.radius, mob.id, player.id);

  if (!separation) {
    return;
  }

  movePveEntityTo(mob, {
    x: mob.mesh.position.x + separation.nx * separation.overlap,
    z: mob.mesh.position.z + separation.nz * separation.overlap
  }, options);
}

function separateRemotePlayerFromActor(remote, actor) {
  const remotePosition = getCollisionActorPosition(remote);
  const actorPosition = getCollisionActorPosition(actor);
  const dx = remotePosition.x - actorPosition.x;
  const dz = remotePosition.z - actorPosition.z;
  const separation = getCollisionSeparation(dx, dz, remote.radius, actor.radius, remote.id, actor.id);

  if (!separation) {
    return;
  }

  moveRemotePlayerVisualTo(remote, {
    x: remote.group.position.x + separation.nx * separation.overlap,
    z: remote.group.position.z + separation.nz * separation.overlap
  });
}

function separateRemotePlayerPair(first, second) {
  const dx = first.group.position.x - second.group.position.x;
  const dz = first.group.position.z - second.group.position.z;
  const separation = getCollisionSeparation(dx, dz, first.radius, second.radius, first.id, second.id);

  if (!separation) {
    return;
  }

  const push = separation.overlap * 0.5;
  moveRemotePlayerVisualTo(first, {
    x: first.group.position.x + separation.nx * push,
    z: first.group.position.z + separation.nz * push
  });
  moveRemotePlayerVisualTo(second, {
    x: second.group.position.x - separation.nx * push,
    z: second.group.position.z - separation.nz * push
  });
}

function getCollisionSeparation(dx, dz, firstRadius = 1.1, secondRadius = 1.1, firstId = "", secondId = "") {
  let distance = Math.hypot(dx, dz);
  const minimumDistance = firstRadius + secondRadius + ACTOR_COLLISION_PADDING;

  if (distance >= minimumDistance) {
    return null;
  }

  if (distance < 0.001) {
    const angle = getStableSeparationAngle(firstId, secondId);
    return {
      nx: Math.cos(angle),
      nz: Math.sin(angle),
      overlap: minimumDistance
    };
  }

  return {
    nx: dx / distance,
    nz: dz / distance,
    overlap: minimumDistance - distance
  };
}

function getActivePveBodyCollisionActors() {
  return getActiveCombatEnemies().filter((enemy) => enemy?.mesh?.visible && !enemy.dead && !enemy.removed);
}

function getActivePlayerBodyCollisionActors() {
  const players = [];

  if (!state.player.dead && !world.outpostTower.active) {
    players.push(getLocalPlayerBodyCollisionActor());
  }

  players.push(...getActiveRemotePlayerCollisionActors());
  return players;
}

function getLocalPlayerBodyCollisionActor() {
  return {
    id: state.player.id,
    mesh: world.playerMesh,
    position: state.player.position,
    radius: PLAYER_COLLISION_RADIUS
  };
}

function getActiveRemotePlayerCollisionActors() {
  if (!world.multiplayer.enabled) {
    return [];
  }

  return [...world.remotePlayers.values()].filter(
    (remote) => remote.group.visible && !remote.dead && isRemotePlayerInCurrentScene(remote.snapshot)
  );
}

function getCollisionActorPosition(actor) {
  return actor?.position ?? actor?.mesh?.position ?? actor?.group?.position ?? { x: 0, z: 0 };
}

function moveRemotePlayerVisualTo(remote, position) {
  remote.group.position.x = position.x;
  remote.group.position.z = position.z;
}

function separatePveMobPair(first, second, options) {
  const dx = first.mesh.position.x - second.mesh.position.x;
  const dz = first.mesh.position.z - second.mesh.position.z;
  let distance = Math.hypot(dx, dz);
  const minimumDistance = (first.radius ?? 1.1) + (second.radius ?? 1.1) + PVE_MOB_COLLISION_PADDING;

  if (distance >= minimumDistance) {
    return;
  }

  let nx;
  let nz;

  if (distance < 0.001) {
    const angle = getStableSeparationAngle(first.id, second.id);
    nx = Math.cos(angle);
    nz = Math.sin(angle);
    distance = 0.001;
  } else {
    nx = dx / distance;
    nz = dz / distance;
  }

  const push = (minimumDistance - distance) * 0.5;
  movePveEntityTo(first, {
    x: first.mesh.position.x + nx * push,
    z: first.mesh.position.z + nz * push
  }, options);
  movePveEntityTo(second, {
    x: second.mesh.position.x - nx * push,
    z: second.mesh.position.z - nz * push
  }, options);
}

function getStableSeparationAngle(firstId = "", secondId = "") {
  const key = `${firstId}:${secondId}`;
  let hash = 0;

  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) >>> 0;
  }

  return (hash % 6283) / 1000;
}

function getKnockbackDirection(preferredDirection, sourcePosition, targetPosition) {
  const preferred = preferredDirection
    ? new THREE.Vector3(preferredDirection.x ?? 0, 0, preferredDirection.z ?? 0)
    : new THREE.Vector3(0, 0, 0);

  if (preferred.lengthSq() > 0.001) {
    return preferred.normalize();
  }

  const fallback = new THREE.Vector3(
    (targetPosition?.x ?? 0) - (sourcePosition?.x ?? 0),
    0,
    (targetPosition?.z ?? 0) - (sourcePosition?.z ?? 0)
  );

  if (fallback.lengthSq() > 0.001) {
    return fallback.normalize();
  }

  return new THREE.Vector3(0, 0, 1);
}

function updatePveEnemyHealthBar(enemy) {
  if (!enemy?.healthBar) {
    return;
  }

  updateHealthBarSprite(enemy.healthBar, enemy.hp, enemy.maxHp, enemy.name);
  const data = enemy.healthBar.userData?.healthBar;

  if (enemy.hp <= 0 || enemy.dead) {
    if (data) {
      data.forceVisible = false;
    }
    enemy.healthBar.visible = false;
    return;
  }

  if (enemy.hp >= enemy.maxHp) {
    if (data) {
      data.forceVisible = false;
      data.lastChangedAt = -Infinity;
    }
    enemy.healthBar.visible = false;
  }
}

function clearProjectiles() {
  for (const projectile of world.projectiles) {
    removeFromParent(projectile.mesh);
  }

  world.projectiles = [];
  document.body.dataset.projectilesActive = "0";
}

function getHandBasePose(hand) {
  const config = HAND_CONFIG[hand];
  const position = new THREE.Vector3(...config.basePosition);
  const rotation = new THREE.Euler(...config.baseRotation);

  return { position, rotation };
}

function poseAttackArm(hand, rotationX, rotationZ, rotationY, elbowX = 0.28, wristX = 0, wristZ = 0) {
  const arm = hand === "left" ? world.playerRig.leftArm : world.playerRig.rightArm;
  const side = HAND_CONFIG[hand].side;

  arm.rotation.x = rotationX;
  arm.rotation.y = rotationY;
  arm.rotation.z = side * 0.16 + rotationZ;
  setArmJointPose(arm, elbowX, wristX, wristZ);
}

function easeOut(value) {
  const t = clamp(value, 0, 1);
  return 1 - (1 - t) * (1 - t);
}

function easeInOut(value) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function updateHeldItemVisuals() {
  syncHeldItem("left", world.leftHandMount, getEquippedItem(state, "left"));
  syncHeldItem("right", world.rightHandMount, getEquippedItem(state, "right"));
}

function syncHeldItem(hand, mount, item) {
  const held = world.heldItems[hand];

  if (held.itemId === item?.id) {
    if (!item) {
      removeTaggedHandVisuals(mount, "heldItemVisual");
      if (world.attacks[hand] && world.attacks[hand].itemType !== "Empty Hand") {
        clearHandVisuals(hand);
      }
    }
    return;
  }

  if (!item && world.attacks[hand] && world.attacks[hand].itemType !== "Empty Hand") {
    clearHandVisuals(hand);
    return;
  }

  if (held.mesh) {
    mount.remove(held.mesh);
  }

  held.itemId = item?.id ?? null;
  held.mesh = item ? createHeldItemMesh(item, hand) : null;

  if (held.mesh) {
    held.mesh.userData.heldItemVisual = true;
    mount.add(held.mesh);
  } else {
    removeTaggedHandVisuals(mount, "heldItemVisual");
  }
}

function clearHandVisuals(hand) {
  const mount = hand === "left" ? world.leftHandMount : world.rightHandMount;
  const held = world.heldItems[hand];
  const attack = world.attacks[hand];

  if (!mount || !held) {
    return;
  }

  if (held.mesh) {
    mount.remove(held.mesh);
  }

  if (attack?.trace) {
    mount.remove(attack.trace);
  }

  held.itemId = null;
  held.mesh = null;
  world.attacks[hand] = null;
  removeTaggedHandVisuals(mount, "heldItemVisual");
  removeTaggedHandVisuals(mount, "attackTraceVisual");

  const base = getHandBasePose(hand);
  mount.position.copy(base.position);
  mount.rotation.copy(base.rotation);
}

function removeTaggedHandVisuals(mount, tag) {
  for (let index = mount.children.length - 1; index >= 0; index -= 1) {
    const child = mount.children[index];

    if (child.userData?.[tag]) {
      mount.remove(child);
    }
  }
}

function getHeldWeaponHitSegments(itemType, hand) {
  const side = HAND_CONFIG[hand]?.side ?? -1;
  return getCombatWeaponHitSegments(itemType, side);
}

function registerWeaponAssetLoader(itemType, loader) {
  if (typeof loader === "function") {
    world.weaponAssetRegistry.loaders.set(itemType, loader);
  }
}

function registerProceduralWeaponFallback(itemType, factory) {
  if (typeof factory === "function") {
    world.weaponAssetRegistry.proceduralFallbacks.set(itemType, factory);
  }
}

function createRegisteredWeaponAsset(item, hand) {
  const loader = world.weaponAssetRegistry.loaders.get(item.type);

  if (loader) {
    const mesh = loader(item, hand, getCombatProfile(item.type));

    if (mesh) {
      return mesh;
    }
  }

  const fallback = world.weaponAssetRegistry.proceduralFallbacks.get(item.type);

  if (fallback) {
    const mesh = fallback(item, hand, getCombatProfile(item.type));

    if (mesh) {
      return mesh;
    }
  }

  return null;
}

function createHeldItemMesh(item, hand) {
  const registered = createRegisteredWeaponAsset(item, hand);

  if (registered) {
    return registered;
  }

  const group = new THREE.Group();
  const side = HAND_CONFIG[hand].side;
  const profile = getCombatProfile(item.type);
  const model = profile.modelProfile ?? {};
  const metal = new THREE.MeshStandardMaterial({ color: "#d7d8d2", roughness: 0.33, metalness: 0.38 });
  const darkMetal = new THREE.MeshStandardMaterial({ color: "#5f6670", roughness: 0.45, metalness: 0.25 });
  const edgeMetal = new THREE.MeshStandardMaterial({ color: "#f4f5ef", roughness: 0.28, metalness: 0.45 });
  const brass = new THREE.MeshStandardMaterial({ color: "#b7a16a", roughness: 0.45, metalness: 0.2 });
  const wood = new THREE.MeshStandardMaterial({ color: "#7a4b2c", roughness: 0.82 });
  const leather = new THREE.MeshStandardMaterial({ color: "#4d3021", roughness: 0.88 });
  const shieldFace = new THREE.MeshStandardMaterial({ color: hand === "left" ? "#2d6ab3" : "#a94335", roughness: 0.65 });
  group.userData.weaponHitSegments = getHeldWeaponHitSegments(item.type, hand);

  if (item.type === "Dagger") {
    addBlade(group, model.bladeLength ?? 1.48, model.bladeWidth ?? 0.17, metal, edgeMetal);
    addHandle(group, model.handleLength ?? 0.66, leather, brass, { guardWidth: 0.54, pommelRadius: 0.12 });
    group.position.set(side * 0.04, -0.03, 0.12);
    group.rotation.set(1.2, side * 0.04, side * -0.2);
  } else if (item.type === "Sword") {
    addBlade(group, model.bladeLength ?? 2.65, model.bladeWidth ?? 0.2, metal, edgeMetal, { fuller: true });
    addHandle(group, model.handleLength ?? 0.88, leather, brass, { guardWidth: 0.88, pommelRadius: 0.15 });
    group.position.set(side * 0.05, -0.04, 0.13);
    group.rotation.set(1.17, side * 0.04, side * -0.18);
  } else if (item.type === "Long Sword") {
    addBlade(group, model.bladeLength ?? 3.55, model.bladeWidth ?? 0.23, metal, edgeMetal, { fuller: true });
    addHandle(group, model.handleLength ?? 1.18, leather, brass, { guardWidth: 1.08, pommelRadius: 0.18, twoHanded: true });
    group.position.set(side * 0.05, -0.05, 0.12);
    group.rotation.set(1.12, side * 0.035, side * -0.16);
  } else if (item.type === "Axe") {
    const haft = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, model.haftLength ?? 3, 10), wood);
    haft.position.y = 0.5;
    haft.castShadow = true;
    group.add(haft);

    const head = new THREE.Mesh(new THREE.BoxGeometry(model.headWidth ?? 1.08, 0.46, 0.2), darkMetal);
    head.position.set(side * 0.32, 1.9, 0);
    head.castShadow = true;
    group.add(head);

    const upperBeard = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.72, 4), edgeMetal);
    upperBeard.position.set(side * 0.78, 2.02, 0);
    upperBeard.rotation.set(0, 0, side * -0.78);
    upperBeard.scale.set(0.72, 1.05, 0.2);
    upperBeard.castShadow = true;
    group.add(upperBeard);

    const lowerBeard = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.56, 4), edgeMetal);
    lowerBeard.position.set(side * 0.72, 1.68, 0);
    lowerBeard.rotation.set(0, 0, side * -2.28);
    lowerBeard.scale.set(0.62, 0.9, 0.18);
    lowerBeard.castShadow = true;
    group.add(lowerBeard);

    const endCap = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), brass);
    endCap.position.y = -1.02;
    endCap.scale.set(0.8, 0.8, 0.8);
    group.add(endCap);

    group.position.set(side * 0.04, -0.05, 0.12);
    group.rotation.set(1.08, side * 0.035, side * -0.22);
  } else if (item.type === "Spear") {
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.068, model.shaftLength ?? 4.65, 10), wood);
    shaft.position.y = 1.1;
    shaft.castShadow = true;
    group.add(shaft);

    const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.34, 10), darkMetal);
    socket.position.y = 3.4;
    socket.castShadow = true;
    group.add(socket);

    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.22, model.tipLength ?? 0.82, 12), edgeMetal);
    tip.position.y = 3.84;
    tip.castShadow = true;
    group.add(tip);

    const pennant = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.24), new THREE.MeshStandardMaterial({ color: "#9f3535", roughness: 0.7, side: THREE.DoubleSide }));
    pennant.position.set(side * 0.24, 3.18, 0);
    pennant.rotation.z = side * 0.24;
    group.add(pennant);

    group.position.set(side * 0.03, -0.26, 0.16);
    group.rotation.set(1.34, side * 0.03, side * -0.1);
  } else if (item.type === "Bow" || item.type === "Long Bow") {
    const height = model.height ?? (item.type === "Long Bow" ? 3.5 : 2.7);
    const bow = new THREE.Mesh(new THREE.TorusGeometry(height * 0.38, 0.035, 8, 32, Math.PI * 1.24), wood);
    bow.name = "bowBody";
    bow.scale.x = 0.42;
    bow.rotation.z = Math.PI * 0.5;
    bow.castShadow = true;
    group.add(bow);

    const string = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, height * 0.84, 6), metal);
    string.name = "bowString";
    string.position.x = side * (model.stringOffset ?? 0.42);
    string.rotation.z = 0;
    string.userData.baseX = string.position.x;
    string.userData.side = side;
    group.add(string);

    const arrow = createArrowMesh(model.arrowLength ?? 1.5, edgeMetal, wood);
    arrow.name = "bowArrow";
    arrow.position.set(side * 0.18, 0, -0.03);
    arrow.rotation.x = Math.PI * 0.5;
    arrow.userData.baseX = arrow.position.x;
    arrow.userData.baseZ = arrow.position.z;
    arrow.userData.side = side;
    group.add(arrow);

    const gripWrap = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.42, 8), leather);
    gripWrap.rotation.z = Math.PI * 0.5;
    gripWrap.position.x = side * 0.02;
    group.add(gripWrap);

    group.position.set(side * 0.02, -0.05, 0.04);
    group.rotation.set(0.08, side * 0.08, side * -0.08);
  } else if (item.type === "Crossbow") {
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.28, model.stockLength ?? 1.7, 0.26), wood);
    stock.rotation.x = Math.PI * 0.5;
    stock.castShadow = true;
    group.add(stock);

    const limb = new THREE.Mesh(new THREE.BoxGeometry(model.limbWidth ?? 1.9, 0.12, 0.18), wood);
    limb.position.z = 0.55;
    limb.castShadow = true;
    group.add(limb);

    const string = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, model.limbWidth ?? 1.9, 6), metal);
    string.name = "crossbowString";
    string.rotation.z = Math.PI * 0.5;
    string.position.z = 0.42;
    group.add(string);

    const bolt = createArrowMesh(model.boltLength ?? 1.32, edgeMetal, wood);
    bolt.name = "crossbowBolt";
    bolt.rotation.x = Math.PI * 0.5;
    bolt.position.z = 0.22;
    bolt.userData.baseZ = bolt.position.z;
    group.add(bolt);

    const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.06), brass);
    trigger.position.set(0, -0.16, -0.18);
    group.add(trigger);

    group.position.set(side * 0.02, -0.1, 0.18);
    group.rotation.set(-0.08, side * 0.15, side * -0.05);
  } else if (item.type === "Shield" || item.type === "Long Shield") {
    const isLong = item.type === "Long Shield";
    const shield = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, isLong ? 2.9 : 2.0, isLong ? 1.35 : 1.65),
      shieldFace
    );
    shield.position.set(side * 0.35, -0.25, 0);
    shield.castShadow = true;
    group.add(shield);

    const boss = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.18, 16), darkMetal);
    boss.position.set(side * 0.52, -0.25, 0);
    boss.rotation.z = Math.PI * 0.5;
    boss.castShadow = true;
    group.add(boss);

    group.position.set(side * 0.18, -0.12, 0.06);
    group.rotation.set(0, side * 0.14, side * -0.08);
  }

  group.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return group;
}

function createTowerBowView() {
  const group = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: "#7a4b2c", roughness: 0.78 });
  const string = new THREE.MeshStandardMaterial({ color: "#f2ead7", roughness: 0.42 });
  const arrowMat = new THREE.MeshStandardMaterial({
    color: "#ffe18a",
    emissive: "#8a621d",
    emissiveIntensity: 0.34,
    roughness: 0.5
  });

  const bow = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.018, 8, 38, Math.PI * 1.28), wood);
  bow.scale.x = 0.42;
  bow.rotation.set(0, 0, Math.PI * 0.5);
  bow.position.set(0.72, -0.46, -1.35);
  group.add(bow);

  const bowString = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 1.55, 6), string);
  bowString.position.set(0.98, -0.46, -1.35);
  group.add(bowString);

  const arrow = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.35, 8), arrowMat);
  arrow.rotation.x = Math.PI * 0.5;
  arrow.position.set(0.42, -0.5, -1.42);
  group.add(arrow);

  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.16, 8), arrowMat);
  tip.rotation.x = Math.PI * 0.5;
  tip.position.set(0.42, -0.5, -2.15);
  group.add(tip);

  group.visible = false;
  world.towerBowView = group;
  world.camera.add(group);
}

function addBlade(group, length, width, material, edgeMaterial = material, options = {}) {
  const blade = new THREE.Mesh(new THREE.BoxGeometry(width, length, width * 0.45), material);
  blade.position.y = length * 0.45;
  blade.castShadow = true;
  group.add(blade);

  if (options.fuller) {
    const fuller = new THREE.Mesh(new THREE.BoxGeometry(width * 0.24, length * 0.58, width * 0.12), edgeMaterial);
    fuller.position.set(0, length * 0.42, width * 0.25);
    fuller.castShadow = true;
    group.add(fuller);
  }

  for (const edgeSide of [-1, 1]) {
    const edge = new THREE.Mesh(new THREE.BoxGeometry(width * 0.18, length * 0.84, width * 0.18), edgeMaterial);
    edge.position.set(edgeSide * width * 0.42, length * 0.45, 0);
    edge.rotation.z = edgeSide * 0.03;
    edge.castShadow = true;
    group.add(edge);
  }

  const point = new THREE.Mesh(new THREE.ConeGeometry(width * 0.82, width * 2.1, 4), material);
  point.position.y = length * 0.95;
  point.rotation.y = Math.PI * 0.25;
  point.castShadow = true;
  group.add(point);
}

function addHandle(group, length, material, guardMaterial, options = {}) {
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, length, 8), material);
  grip.position.y = -length * 0.45;
  grip.castShadow = true;
  group.add(grip);

  const guard = new THREE.Mesh(
    new THREE.BoxGeometry(options.guardWidth ?? 0.75, 0.12, 0.12),
    guardMaterial ?? new THREE.MeshStandardMaterial({ color: "#b7a16a", roughness: 0.45, metalness: 0.2 })
  );
  guard.position.y = 0;
  guard.castShadow = true;
  group.add(guard);

  if (options.twoHanded) {
    const wrap = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, length * 0.32, 8), material);
    wrap.position.y = -length * 0.78;
    wrap.castShadow = true;
    group.add(wrap);
  }

  const pommel = new THREE.Mesh(
    new THREE.SphereGeometry(options.pommelRadius ?? 0.14, 12, 8),
    guardMaterial ?? material
  );
  pommel.position.y = -length * 0.94;
  pommel.scale.set(1, 0.82, 1);
  pommel.castShadow = true;
  group.add(pommel);
}

function createArrowMesh(length, tipMaterial, shaftMaterial) {
  const group = new THREE.Group();

  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, length, 8), shaftMaterial);
  shaft.castShadow = true;
  group.add(shaft);

  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.18, 8), tipMaterial);
  tip.position.y = length * 0.5 + 0.08;
  tip.castShadow = true;
  group.add(tip);

  const fletch = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.09, 0.012),
    new THREE.MeshStandardMaterial({ color: "#f2ead7", roughness: 0.62 })
  );
  fletch.position.y = -length * 0.44;
  fletch.castShadow = true;
  group.add(fletch);

  return group;
}

function getLockedThirdPersonCameraVectors(cameraYaw = world.cameraYaw) {
  const forward = new THREE.Vector3(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw)).normalize();
  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
  return { forward, right };
}

function getLockedThirdPersonCameraFrame(target, orbitDistance) {
  const config = LOCKED_THIRD_PERSON_CAMERA;
  const distance = clamp(
    orbitDistance * config.distanceScale,
    config.minDistance,
    config.maxDistance
  );
  const { forward, right } = getLockedThirdPersonCameraVectors();
  const pitchFactor = clamp(
    (world.cameraPitch - config.minPitch) / (config.maxPitch - config.minPitch),
    0,
    1
  );
  const cameraHeight = config.baseHeight + clamp(pitchFactor, 0, 1) * config.pitchHeight;
  const focusDistance = config.maxFocusDistance + (config.minFocusDistance - config.maxFocusDistance) * pitchFactor;
  const focusHeight = config.focusHeight - (world.cameraPitch - 0.6) * config.pitchFocusOffset;
  const cameraPosition = target.clone()
    .addScaledVector(forward, -distance)
    .addScaledVector(right, config.shoulderOffset);
  cameraPosition.y += cameraHeight;

  const lookTarget = target.clone()
    .addScaledVector(forward, focusDistance)
    .addScaledVector(right, config.shoulderOffset * 0.18);
  lookTarget.y += focusHeight;

  return { cameraPosition, lookTarget };
}

function updateCamera(deltaSeconds) {
  if (world.outpostTower.active) {
    const origin = new THREE.Vector3(
      world.outpostTower.position.x,
      world.outpostTower.elevation + 0.85,
      world.outpostTower.position.z
    );
    const direction = world.outpostTower.aimDirection.lengthSq() > 0.001
      ? world.outpostTower.aimDirection
      : new THREE.Vector3(0, -0.12, 1);
    const lookTarget = origin.clone().addScaledVector(direction, 42);

    world.camera.position.lerp(origin, Math.min(1, deltaSeconds * 12));
    world.camera.lookAt(lookTarget);
    applyCombatCameraImpulse();
    document.body.dataset.cameraMode = "outpost";
    return;
  }

  const playerElevation = getPlayerWorldElevation();
  const target = new THREE.Vector3(state.player.position.x, playerElevation, state.player.position.z);
  const orbitDistance = world.sceneMode === "interior" || world.sceneMode === "poiInterior"
    ? clamp(world.cameraDistance * 0.72, 22, 66)
    : world.cameraDistance;
  const cameraYaw = world.cameraYaw;

  if (isLockedThirdPersonCamera()) {
    const { cameraPosition, lookTarget } = getLockedThirdPersonCameraFrame(target, orbitDistance);
    world.camera.position.copy(cameraPosition);
    world.camera.lookAt(lookTarget);
    applyCombatCameraImpulse();
    updateLockedThirdPersonAim();
    document.body.dataset.cameraYaw = cameraYaw.toFixed(3);
    document.body.dataset.cameraPitch = world.cameraPitch.toFixed(3);
    document.body.dataset.cameraDistance = world.cameraDistance.toFixed(1);
    document.body.dataset.cameraMode = "locked-third-person";
    return;
  }

  const distance = orbitDistance;
  const horizontalDistance = Math.cos(world.cameraPitch) * distance;
  const height = Math.sin(world.cameraPitch) * distance;
  const cameraTarget = new THREE.Vector3(
    target.x + Math.sin(cameraYaw) * horizontalDistance,
    target.y + height,
    target.z + Math.cos(cameraYaw) * horizontalDistance
  );

  world.camera.position.lerp(cameraTarget, Math.min(1, deltaSeconds * 5));
  world.camera.lookAt(target.x, target.y + 4, target.z);
  applyCombatCameraImpulse();
  document.body.dataset.cameraYaw = cameraYaw.toFixed(3);
  document.body.dataset.cameraPitch = world.cameraPitch.toFixed(3);
  document.body.dataset.cameraDistance = world.cameraDistance.toFixed(1);
  document.body.dataset.cameraMode = world.cameraMode === "lockedThirdPerson" ? "locked-third-person" : "orbit";
}

function applyCombatCameraImpulse() {
  const impulse = world.combatFeedback.cameraImpulse;

  if (impulse <= 0) {
    return;
  }

  const forward = new THREE.Vector3();
  world.camera.getWorldDirection(forward);
  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
  const phase = world.combatFeedback.cameraPhase;
  world.camera.position.addScaledVector(right, Math.sin(phase) * impulse * 7);
  world.camera.position.y += Math.cos(phase * 1.37) * impulse * 4;
}

function updatePoiFlags() {
  for (const poi of state.pois) {
    const mesh = world.meshes.pois.get(poi.id);
    const flag = mesh?.getObjectByName("flag");
    const ring = mesh?.children[0];
    const faction = poi.ownerFactionId ? FACTION_LOOKUP[poi.ownerFactionId] : null;

    flag?.material.color.set(faction?.color ?? "#6f6a5f");
    ring?.material.color.set(faction?.accent ?? "#d6a542");
    updateInteriorPoiFlag(poi, faction);
  }
}

function updateInteriorPoiFlag(poi, faction) {
  const flagpole = world.meshes.poiInteriorFlags.get(poi.id);

  if (!flagpole) {
    return;
  }

  const flag = flagpole.getObjectByName("flag");
  const ring = flagpole.getObjectByName("flagInteractionRing");

  if (!flag) {
    return;
  }

  const action = world.baseEntryAction?.type === "claimPoiFlag" && world.baseEntryAction.poiId === poi.id
    ? world.baseEntryAction
    : null;
  const actionFaction = state.selectedFactionId ? FACTION_LOOKUP[state.selectedFactionId] : null;
  const lowerY = 2.45;
  const raisedY = 8.15;
  let progress = faction ? 1 : 0;
  let flagFaction = faction;

  if (action) {
    const phaseProgress = Math.min(1, action.elapsed / action.duration);

    if (action.phase === "lower") {
      progress = 1 - phaseProgress;
    } else {
      progress = phaseProgress;
      flagFaction = actionFaction;
    }
  }

  flag.position.y = lowerY + (raisedY - lowerY) * progress;
  flag.material.color.set(flagFaction?.color ?? "#6f6a5f");
  flag.visible = progress > 0.03 || Boolean(action);

  if (ring) {
    ring.material.color.set(flagFaction?.accent ?? "#d6a542");
    ring.material.opacity = isNearPoiFlagpole() && world.activePoiInteriorId === poi.id ? 0.42 : 0.2;
  }
}

function updateStructures() {
  const activeIds = new Set(state.structures.map((structure) => structure.id));

  for (const [id, mesh] of world.meshes.structures) {
    if (!activeIds.has(id)) {
      removeFromParent(mesh);
      world.meshes.structures.delete(id);
    }
  }

  for (const structure of state.structures) {
    let mesh = world.meshes.structures.get(structure.id);

    if (!mesh) {
      mesh = createStructureMesh(structure);
      world.meshes.structures.set(structure.id, mesh);
      addOutdoor(mesh);
    }

    mesh.position.set(
      structure.position.x,
      getTerrainHeightAt(structure.position.x, structure.position.z),
      structure.position.z
    );
    mesh.rotation.y = Number.isFinite(Number(structure.rotation)) ? structure.rotation : 0;
    mesh.visible = structure.hp > 0;
    mesh.scale.set(1, 1, 1);
    updateStructureHealthBar(structure);
  }
}

function createStructureMesh(structure) {
  const group = new THREE.Group();
  const faction = FACTION_LOOKUP[structure.ownerFactionId];
  const wood = new THREE.MeshStandardMaterial({ color: "#6f4427", roughness: 0.82 });
  const cloth = new THREE.MeshStandardMaterial({ color: faction?.color ?? "#d6a542", roughness: 0.7 });
  const stone = new THREE.MeshStandardMaterial({ color: "#8c887c", roughness: 0.92 });

  if (structure.type === "outpost") {
    const tower = new THREE.Mesh(new THREE.BoxGeometry(6, 13, 6), wood);
    tower.position.y = 6.5;
    tower.castShadow = true;
    tower.receiveShadow = true;
    group.add(tower);

    const top = new THREE.Mesh(new THREE.BoxGeometry(9, 2.2, 9), stone);
    top.position.y = 14;
    top.castShadow = true;
    group.add(top);
  } else if (structure.type === "wall") {
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(WALL_BODY_SIZE.width, WALL_BODY_SIZE.height, WALL_BODY_SIZE.depth),
      stone
    );
    wall.position.y = WALL_BODY_SIZE.height / 2;
    wall.castShadow = true;
    wall.receiveShadow = true;
    group.add(wall);

    for (const x of [-5.5, -1.85, 1.85, 5.5]) {
      const cap = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.1, 2.8), stone);
      cap.position.set(x, 5, 0);
      cap.castShadow = true;
      cap.receiveShadow = true;
      group.add(cap);
    }
  } else {
    const base = new THREE.Mesh(new THREE.BoxGeometry(11, 5, 8), stone);
    base.position.y = 2.5;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(8, 6, 4), cloth);
    roof.position.y = 8;
    roof.rotation.y = Math.PI * 0.25;
    roof.castShadow = true;
    group.add(roof);
  }

  const flag = new THREE.Mesh(new THREE.BoxGeometry(3.3, 2, 0.18), cloth);
  flag.position.set(3, structure.type === "wall" ? 6.4 : 12, -3);
  if (structure.type !== "wall") {
    group.add(flag);
  }

  const structureName = BUILDING_LOOKUP[structure.type]?.name ?? capitalize(structure.type);
  const healthBar = createHealthBarSprite(structureName);
  healthBar.name = "healthBar";
  healthBar.position.set(0, structure.type === "outpost" ? 17.4 : structure.type === "wall" ? 6.4 : 10.7, 0);
  healthBar.visible = false;
  group.add(healthBar);
  updateHealthBarSprite(healthBar, structure.hp, structure.maxHp, structureName);
  tagEntityStatusTarget(group, getStructureStatusKey(structure.id));

  return group;
}

function updateStructureHealthBar(structure) {
  const mesh = world.meshes.structures.get(structure.id);
  const healthBar = mesh?.getObjectByName("healthBar");

  if (!healthBar) {
    return;
  }

  updateHealthBarSprite(
    healthBar,
    structure.hp,
    structure.maxHp,
    BUILDING_LOOKUP[structure.type]?.name ?? capitalize(structure.type)
  );
  if (structure.hp <= 0) {
    healthBar.visible = false;
  }
}

function updateCouriers() {
  const activeIds = new Set(state.couriers.map((courier) => courier.id));

  for (const [id, mesh] of world.meshes.couriers) {
    if (!activeIds.has(id)) {
      removeFromParent(mesh);
      world.meshes.couriers.delete(id);
      world.courierVisuals.delete(id);
    }
  }

  for (const courier of state.couriers) {
    let mesh = world.meshes.couriers.get(courier.id);

    if (!mesh) {
      mesh = createCourierMesh(courier);
      world.meshes.couriers.set(courier.id, mesh);
      addOutdoor(mesh);
    }

    const visualProgress = getCourierVisualProgress(courier, mesh);
    const position = getCourierWorldPosition(courier, visualProgress);
    mesh.position.set(position.x, getTerrainHeightAt(position.x, position.z), position.z);
    if (position.direction.lengthSq() > 0.001) {
      mesh.rotation.y = Math.atan2(position.direction.x, position.direction.z);
    } else {
      mesh.rotation.y += 0.01;
    }
    updateCourierHealthBar(courier, mesh);
  }
}

function getCourierVisualProgress(courier, mesh) {
  const key = getCourierRouteKey(courier);
  const rawProgress = clamp(Number(courier.progress) || 0, 0, 1);
  const duration = Math.max(1, Number(courier.duration) || 1);
  let visual = world.courierVisuals.get(courier.id);

  if (!visual || visual.key !== key) {
    visual = {
      key,
      progress: rawProgress,
      serverProgress: rawProgress,
      serverElapsed: state.elapsed,
      lastFrameElapsed: state.elapsed
    };
    world.courierVisuals.set(courier.id, visual);
  }

  if (Math.abs(rawProgress - visual.serverProgress) > 0.001) {
    const serverMovedBackward = rawProgress < visual.serverProgress - 0.08;
    visual.serverProgress = rawProgress;
    visual.serverElapsed = state.elapsed;

    if (serverMovedBackward) {
      visual.progress = rawProgress;
    }
  }

  const frameDelta = Math.max(0, state.elapsed - visual.lastFrameElapsed);
  visual.lastFrameElapsed = state.elapsed;

  const estimatedProgress = clamp(
    visual.serverProgress + Math.max(0, state.elapsed - visual.serverElapsed) / duration,
    0,
    1
  );

  if (visual.progress < estimatedProgress) {
    visual.progress = Math.min(estimatedProgress, visual.progress + frameDelta / duration);
  } else if (visual.progress > estimatedProgress + 0.03) {
    visual.progress = THREE.MathUtils.lerp(visual.progress, estimatedProgress, Math.min(1, frameDelta * 3));
  }

  mesh.userData.visualProgress = visual.progress;
  return visual.progress;
}

function getCourierRouteKey(courier) {
  const start = courier.position ?? { x: 0, z: 0 };
  const target = courier.target ?? start;

  return [
    courier.direction ?? "",
    Math.round(start.x * 10),
    Math.round(start.z * 10),
    Math.round(target.x * 10),
    Math.round(target.z * 10)
  ].join(":");
}

function getCourierWorldPosition(courier, visualProgress = null) {
  const start = courier.position ?? { x: 0, z: 0 };
  const target = courier.target ?? start;
  const progress = visualProgress === null
    ? clamp(Number(courier.progress) || 0, 0, 1)
    : clamp(visualProgress, 0, 1);
  const x = THREE.MathUtils.lerp(start.x, target.x, progress);
  const z = THREE.MathUtils.lerp(start.z, target.z, progress);
  const direction = new THREE.Vector3(target.x - start.x, 0, target.z - start.z);

  if (direction.lengthSq() > 0.001) {
    direction.normalize();
  }

  return { x, z, direction };
}

function createCourierMesh(courier) {
  if (courier.kind === "poiWorker") {
    return createPoiWorkerMesh(courier);
  }

  const group = new THREE.Group();
  const faction = FACTION_LOOKUP[courier.ownerFactionId];
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(4.5, 2.3, 2),
    new THREE.MeshStandardMaterial({ color: "#b68d58", roughness: 0.85 })
  );
  body.position.y = 1.8;
  body.castShadow = true;
  group.add(body);

  const pack = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 1.4, 2.6),
    new THREE.MeshStandardMaterial({ color: faction?.color ?? "#d6a542", roughness: 0.72 })
  );
  pack.position.y = 3.2;
  pack.castShadow = true;
  group.add(pack);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.72, 12, 8),
    new THREE.MeshStandardMaterial({ color: "#caa06f", roughness: 0.86 })
  );
  head.position.set(2.65, 2.15, 0);
  head.castShadow = true;
  group.add(head);

  const label = getCourierDisplayName(courier);
  const healthBar = createHealthBarSprite(label);
  healthBar.name = "healthBar";
  healthBar.position.set(0, 4.9, 0);
  healthBar.scale.set(4.1, 1.02, 1);
  healthBar.visible = false;
  group.add(healthBar);
  updateHealthBarSprite(healthBar, courier.hp ?? getCourierMaxHp(courier), courier.maxHp ?? getCourierMaxHp(courier), label);
  tagEntityStatusTarget(group, getCourierStatusKey(courier.id));

  return group;
}

function createPoiWorkerMesh(courier) {
  const group = new THREE.Group();
  const faction = FACTION_LOOKUP[courier.ownerFactionId];
  const resource = RESOURCE_LOOKUP[courier.resourceId];
  const cloth = new THREE.MeshStandardMaterial({ color: faction?.color ?? "#d6a542", roughness: 0.72 });
  const accent = new THREE.MeshStandardMaterial({ color: faction?.accent ?? "#f4e7c9", roughness: 0.62 });
  const skin = new THREE.MeshStandardMaterial({ color: "#d3b58f", roughness: 0.78 });
  const leather = new THREE.MeshStandardMaterial({ color: "#45301f", roughness: 0.86 });
  const cargo = new THREE.MeshStandardMaterial({ color: resource?.color ?? "#d6a542", roughness: 0.62, metalness: courier.resourceId === "iron" ? 0.28 : 0.04 });

  const legs = [
    new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 1.05, 4, 8), leather),
    new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 1.05, 4, 8), leather)
  ];
  legs[0].position.set(-0.28, 1.05, 0);
  legs[1].position.set(0.28, 1.05, 0);
  legs[0].rotation.z = 0.08;
  legs[1].rotation.z = -0.08;
  group.add(...legs);

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.62, 1.55, 5, 12), cloth);
  body.position.y = 2.65;
  body.castShadow = true;
  group.add(body);

  const sash = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.16, 0.18), accent);
  sash.position.set(0, 3.06, 0.55);
  sash.rotation.z = -0.32;
  sash.castShadow = true;
  group.add(sash);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.46, 16, 12), skin);
  head.position.y = 4.05;
  head.castShadow = true;
  group.add(head);

  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.42, 8), leather);
  cap.position.y = 4.55;
  cap.castShadow = true;
  group.add(cap);

  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 1.05, 4, 8), skin);
    arm.position.set(side * 0.8, 2.9, 0.1);
    arm.rotation.z = side * -0.32;
    arm.castShadow = true;
    group.add(arm);
  }

  const pack = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.82, 0.62), cargo);
  pack.position.set(0, 2.78, -0.72);
  pack.castShadow = true;
  group.add(pack);

  const loadRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.45, 0.06, 8, 36),
    new THREE.MeshBasicMaterial({ color: resource?.color ?? "#d6a542", transparent: true, opacity: 0.56 })
  );
  loadRing.rotation.x = Math.PI / 2;
  loadRing.position.y = 0.16;
  group.add(loadRing);

  const label = getCourierDisplayName(courier);
  const healthBar = createHealthBarSprite(label);
  healthBar.name = "healthBar";
  healthBar.position.set(0, 5.75, 0);
  healthBar.scale.set(4.3, 1.06, 1);
  healthBar.visible = false;
  group.add(healthBar);
  updateHealthBarSprite(healthBar, courier.hp ?? getCourierMaxHp(courier), courier.maxHp ?? getCourierMaxHp(courier), label);
  tagEntityStatusTarget(group, getCourierStatusKey(courier.id));

  group.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return group;
}

function updateCourierHealthBar(courier, mesh) {
  const healthBar = mesh.getObjectByName("healthBar");

  if (!healthBar) {
    return;
  }

  updateHealthBarSprite(
    healthBar,
    courier.hp ?? getCourierMaxHp(courier),
    courier.maxHp ?? getCourierMaxHp(courier),
    getCourierDisplayName(courier)
  );
  if ((courier.hp ?? 0) <= 0) {
    healthBar.visible = false;
  }
}

function getCourierDisplayName(courier) {
  if (courier?.kind === "poiWorker") {
    return courier.workerName ?? getPoiWorkerName(courier.resourceId);
  }

  return "Depot Camel";
}

function getPoiWorkerName(resourceId) {
  const names = {
    gold: "Factor",
    iron: "Miner",
    stone: "Mason",
    wheat: "Farmer",
    wood: "Lumberjack"
  };

  return names[resourceId] ?? "Worker";
}

function getCourierMaxHp(courier) {
  return courier?.kind === "poiWorker" ? 55 : 65;
}

function updateEventMesh() {
  if (!state.activeEvent) {
    if (world.meshes.event) {
      removeFromParent(world.meshes.event);
      world.meshes.event = null;
    }
    return;
  }

  if (!world.meshes.event) {
    world.meshes.event = createEventMesh();
    addOutdoor(world.meshes.event);
  }

  const event = state.activeEvent;
  world.meshes.event.position.set(event.position.x, getTerrainHeightAt(event.position.x, event.position.z), event.position.z);
  world.meshes.event.rotation.y += 0.018;
}

function createEventMesh() {
  const group = new THREE.Group();
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(4.2, 24, 16),
    new THREE.MeshStandardMaterial({
      color: "#f18446",
      emissive: "#9f2e19",
      emissiveIntensity: 1.2,
      roughness: 0.5
    })
  );
  glow.position.y = 5.5;
  glow.castShadow = true;
  group.add(glow);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(9, 0.24, 8, 72),
    new THREE.MeshBasicMaterial({ color: "#f5c46c", transparent: true, opacity: 0.7 })
  );
  ring.position.y = 0.3;
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  const light = new THREE.PointLight("#f18446", 3, 42);
  light.position.y = 9;
  group.add(light);

  return group;
}

function refreshUi() {
  const faction = state.selectedFactionId ? FACTION_LOOKUP[state.selectedFactionId] : null;
  const zone = getZone(state);
  const interiorFaction = world.interiorFactionId ? FACTION_LOOKUP[world.interiorFactionId] : null;
  const interiorPoi = world.activePoiInteriorId ? state.pois.find((poi) => poi.id === world.activePoiInteriorId) : null;
  ui.hudFaction.textContent = faction?.name ?? "Unsworn";
  ui.hudPlayer.textContent = state.player.name;
  ui.hudRenown.textContent = String(state.player.renown);
  const statusLabel =
    world.sceneMode === "interior" && interiorFaction
      ? `${interiorFaction.name} Keep`
      : world.sceneMode === "poiInterior" && interiorPoi
        ? interiorPoi.name
        : zone.label;
  ui.hudZone.textContent = `${statusLabel} | ${Math.round(state.player.hp ?? MULTIPLAYER_MAX_HEALTH)} HP`;

  ui.resourceList.innerHTML = `
      <article class="resource-row">
        <strong>Gold</strong>
        <span>${Math.round(state.player.gold)}</span>
      </article>
    ${RESOURCE_TYPES.map(
      (resource) => `
      <article class="resource-row">
        <strong>${resource.name}</strong>
        <span>${state.player.resources[resource.id]}</span>
      </article>
    `
    ).join("")}`;

  renderNpcTradePanel();
  renderStewardPanel();
  renderDepotPanel();

  renderStructureList();
  if (!ui.buildPanel.classList.contains("is-hidden")) {
    renderBuildPanel();
  }

  const wornCount = state.player.inventory.filter((item) => item.durability < item.maxDurability).length;
  const leftHand = getEquippedItem(state, "left");
  const rightHand = getEquippedItem(state, "right");
  renderHandSlot(ui.leftHandIcon, leftHand, "Left hand");
  renderHandSlot(ui.rightHandIcon, rightHand, "Right hand");
  ui.inventoryStatus.textContent = wornCount ? `${wornCount} worn` : "Ready";
  renderInventoryPanel();
  renderHotbar();
  if (!ui.loreScroll.classList.contains("is-hidden")) {
    renderLoreScroll();
  }
  if (!ui.rulerPanel.classList.contains("is-hidden")) {
    renderRulerPanel();
  }
  if (!ui.statusPanel.classList.contains("is-hidden")) {
    renderStatusPanel();
  }

  renderToasts();
}

function renderStructureList() {
  ui.structureCount.textContent = `${state.structures.filter((entry) => entry.hp > 0).length} built`;
  ui.structureList.innerHTML =
    state.structures.length === 0
      ? `<div class="notice">${BUILDING_DEFINITIONS.map((building) => `${building.name}: ${formatStructureCost(building.id)}`).join(" | ")}</div>`
      : state.structures
          .map((structure) => {
            const building = BUILDING_LOOKUP[structure.type];
            const name = building?.name ?? capitalize(structure.type);
            const hp = Math.max(0, Math.round(structure.hp));
            const maxHp = Math.max(1, Math.round(structure.maxHp));

            return `
              <article class="structure-row">
                <strong>${name}</strong>
                <span>${hp} / ${maxHp} HP</span>
                <div class="meter" style="--value: ${(hp / maxHp) * 100}%"><span></span></div>
              </article>
            `;
          })
          .join("");
}

function renderGearDetails(item) {
  if (!item) {
    return `<div class="notice">Select an item to inspect its stats.</div>`;
  }

  const durability = `${Math.round(item.durability)} / ${item.maxDurability}`;

  if (isArmorItem(item)) {
    return `
      <article>
        <header>
          <strong>${item.name}</strong>
          <span>${item.type}</span>
        </header>
        <div class="stat-grid">
          <span>Material</span><strong>${item.armor.material ?? "Unknown"}</strong>
          <span>Slot</span><strong>${getArmorSlotLabel(item.armor.slot)}</strong>
          <span>Defense</span><strong>${formatStat(item.armor.defense)}</strong>
          <span>Resistance</span><strong>${formatStat(item.armor.resistance)}%</strong>
          <span>Toughness</span><strong>${formatStat(item.armor.toughness)}</strong>
          <span>Weight</span><strong>${formatStat(item.armor.weight)}</strong>
          <span>Durability</span><strong>${durability}</strong>
        </div>
      </article>
    `;
  }

  if (!isWeaponItem(item)) {
    return `
      <article>
        <header>
          <strong>${item.name}</strong>
          <span>${item.type}</span>
        </header>
        <div class="stat-grid">
          <span>Category</span><strong>${item.category}</strong>
          <span>Durability</span><strong>${durability}</strong>
        </div>
      </article>
    `;
  }

  return `
    <article>
      <header>
        <strong>${item.name}</strong>
        <span>${item.type}</span>
      </header>
      <div class="stat-grid">
        <span>Range</span><strong>${item.weapon.range}</strong>
        <span>Damage</span><strong>${item.weapon.damage}</strong>
        <span>Penetration</span><strong>${item.weapon.penetration}</strong>
        <span>Knockback</span><strong>${formatStat(item.weapon.knockback ?? 0)}</strong>
        <span>Frequency</span><strong>${item.weapon.frequency}/s</strong>
        <span>Speed</span><strong>${item.weapon.speed}</strong>
        <span>Durability</span><strong>${durability}</strong>
      </div>
    </article>
  `;
}

function formatStat(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return Number.isInteger(number) ? String(number) : number.toFixed(2).replace(/\.?0+$/, "");
}

function renderInventoryPanel() {
  const selectedGear = getSelectedGearItem(state);

  ui.inventoryGrid.innerHTML = state.player.inventory
    .map((item) => renderInventoryItemSlot(item, selectedGear))
    .join("");

  ui.inventoryDetails.innerHTML = renderGearDetails(selectedGear);
  renderEquipmentSlots();
  renderInventoryHotbar(selectedGear);
}

function renderInventoryItemSlot(item, selectedGear) {
  const equippedSlot = BODY_EQUIP_SLOTS.find((slot) => state.player.equipment[slot.stateKey] === item.id);
  const selected = selectedGear?.id === item.id;

  return `
    <button class="inventory-item-slot ${equippedSlot ? "is-equipped" : ""} ${selected ? "is-selected" : ""}" data-item-id="${item.id}" type="button">
      <strong>${getItemGlyph(item)}</strong>
      <span>${item.name}</span>
      <small>${equippedSlot?.label ?? item.rarity}</small>
      <div class="meter" style="--value: ${(item.durability / item.maxDurability) * 100}%"><span></span></div>
    </button>
  `;
}

function renderEquipmentSlots() {
  for (const slot of BODY_EQUIP_SLOTS) {
    const button = ui.inventoryPanel.querySelector(`[data-equip-slot="${slot.id}"]`);
    const item = getItemById(state.player.equipment[slot.stateKey]);

    if (!button) {
      continue;
    }

    button.querySelector("strong").textContent = item ? getItemGlyph(item) : "Empty";
    button.title = item ? `${slot.label}: ${item.name}` : `${slot.label}: empty`;
    button.classList.toggle("is-filled", Boolean(item));
  }
}

function renderInventoryHotbar(selectedGear) {
  ui.inventoryHotbar.innerHTML = state.player.hotbar
    .map((itemId, index) => {
      const item = getItemById(itemId);
      const selected = selectedGear && item?.id === selectedGear.id;

      return `
        <button class="inventory-hotbar-slot ${item ? "is-filled" : ""} ${selected ? "is-selected" : ""}" data-hotbar-index="${index}" type="button">
          <span>${index + 1}</span>
          <strong>${item ? getItemGlyph(item) : "Empty"}</strong>
        </button>
      `;
    })
    .join("");
}

function renderHotbar() {
  ui.hotbar.innerHTML = state.player.hotbar
    .map((itemId, index) => {
      const item = getItemById(itemId);

      return `
        <div class="hotbar-slot ${item ? "is-filled" : ""}">
          <span>${index + 1}</span>
          <strong>${item ? getItemGlyph(item) : "Empty"}</strong>
        </div>
      `;
    })
    .join("");
}

function renderGearSelection() {
  renderInventoryPanel();
}

function renderHandSlot(element, item, emptyLabel) {
  element.textContent = item ? getItemGlyph(item) : "Empty";
  element.title = item ? `${emptyLabel}: ${item.name}` : `${emptyLabel}: empty`;
  element.parentElement.classList.toggle("is-filled", Boolean(item));
}

function getItemGlyph(item) {
  const glyphs = {
    Axe: "Axe",
    Bow: "Bow",
    Chestplate: "Chest",
    Crossbow: "Xbow",
    Dagger: "Dagger",
    Feet: "Boots",
    Gloves: "Gloves",
    Helmet: "Helm",
    "Long Bow": "LBow",
    "Long Shield": "LShld",
    "Long Sword": "LSword",
    Spear: "Spear",
    Shield: "Shield",
    Sword: "Sword"
  };

  return glyphs[item.type] ?? item.type.slice(0, 5);
}

function renderToasts() {
  const now = performance.now();
  const visible = state.log.filter((entry) => now - entry.time < 5500).slice(0, 3);
  ui.toastLog.innerHTML = visible.map((entry) => `<div class="toast">${entry.message}</div>`).join("");
}

function flash(message) {
  const exists = state.log.some((entry) => entry.message === message && performance.now() - entry.time < 800);
  if (!exists) {
    state.log.unshift({ id: createId("log"), message, time: performance.now() });
  }
}

function animate() {
  const rawDeltaSeconds = world.clock.getDelta();
  const deltaSeconds = Math.min(0.05, rawDeltaSeconds);
  state.elapsed += deltaSeconds;
  updateMovement(deltaSeconds);
  tickFactionIncome(state, deltaSeconds, { factionIncome: !world.persistence.online });
  if (!world.persistence.online) {
    tickCouriers(state, deltaSeconds);
  }
  tickEvent(state, deltaSeconds);
  if (tickLoreSystem(state)) {
    markPersistenceDirty();
  }
  updatePersistence(deltaSeconds);
  updateWorld(deltaSeconds);

  if (Math.floor(state.elapsed * 2) !== Math.floor((state.elapsed - deltaSeconds) * 2)) {
    refreshUi();
  }

  world.renderer.render(world.scene, world.camera);
  world.frames += 1;
  document.body.dataset.renderFrames = String(world.frames);
  updateRenderStats(rawDeltaSeconds);
  requestAnimationFrame(animate);
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  world.camera.aspect = width / height;
  world.camera.updateProjectionMatrix();
  world.renderer.setSize(width, height, false);
}

function createTerrainGeometry() {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const uvs = [];
  const indices = [];

  for (let zIndex = 0; zIndex <= TERRAIN_SEGMENTS; zIndex += 1) {
    const z = -TERRAIN_HALF + (zIndex / TERRAIN_SEGMENTS) * TERRAIN_SIZE;

    for (let xIndex = 0; xIndex <= TERRAIN_SEGMENTS; xIndex += 1) {
      const x = -TERRAIN_HALF + (xIndex / TERRAIN_SEGMENTS) * TERRAIN_SIZE;
      vertices.push(x, getTerrainHeightAt(x, z), z);
      uvs.push(x / TERRAIN_SIZE + 0.5, z / TERRAIN_SIZE + 0.5);
    }
  }

  const row = TERRAIN_SEGMENTS + 1;
  for (let zIndex = 0; zIndex < TERRAIN_SEGMENTS; zIndex += 1) {
    for (let xIndex = 0; xIndex < TERRAIN_SEGMENTS; xIndex += 1) {
      const a = zIndex * row + xIndex;
      const b = a + 1;
      const c = a + row;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createTerrainMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      grassMap: { value: createGrassTexture() },
      rockMap: { value: createRockTexture() }
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormalWorld;
      varying vec3 vWorldPos;

      void main() {
        vUv = uv;
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPosition.xyz;
        vNormalWorld = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D grassMap;
      uniform sampler2D rockMap;
      varying vec2 vUv;
      varying vec3 vNormalWorld;
      varying vec3 vWorldPos;

      void main() {
        vec3 normal = normalize(vNormalWorld);
        float incline = smoothstep(0.045, 0.24, length(normal.xz));
        float highStone = smoothstep(7.5, 12.0, vWorldPos.y) * 0.12;
        float rockAmount = clamp(incline + highStone, 0.0, 1.0);
        vec3 grass = texture2D(grassMap, vUv * 22.0).rgb;
        vec3 rock = texture2D(rockMap, vWorldPos.xz * 0.055 + vec2(vWorldPos.y * 0.018, 0.0)).rgb;
        vec3 baseColor = mix(grass, rock, rockAmount);
        vec3 lightDir = normalize(vec3(-0.48, 0.82, -0.3));
        float diffuse = max(dot(normal, lightDir), 0.0);
        vec3 sky = vec3(1.0, 0.91, 0.72);
        vec3 ground = vec3(0.2, 0.28, 0.2);
        vec3 hemi = mix(ground, sky, normal.y * 0.5 + 0.5) * 0.62;
        vec3 color = baseColor * (hemi + diffuse * 0.88);
        gl_FragColor = vec4(color, 1.0);
      }
    `
  });
}

function getTerrainHeightAt(x, z) {
  let height = 0;
  let factionCore = 0;

  for (const level of TERRAIN_LEVELS) {
    const distance = Math.hypot(x - level.x, z - level.z);
    const plateau = 1 - smoothstep(level.radius, level.radius + level.falloff, distance);
    height += level.height * plateau;
  }

  for (const faction of FACTIONS) {
    const distance = Math.hypot(x - faction.position.x, z - faction.position.z);
    factionCore = Math.max(factionCore, 1 - smoothstep(22, 40, distance));
  }

  const broadUndulation =
    Math.sin(x * 0.028 + 1.4) * Math.cos(z * 0.023 - 0.7) * 0.72 +
    Math.sin((x + z) * 0.017) * 0.42 +
    (hash2d(Math.floor(x / 18), Math.floor(z / 18)) - 0.5) * 0.36;
  const edgeFalloff = 1 - smoothstep(238, 260, Math.max(Math.abs(x), Math.abs(z)));

  height += broadUndulation * edgeFalloff * (1 - factionCore * 0.86);
  return clamp(height, 0, 13.5);
}

function getTerrainGrassAmountAt(x, z) {
  const sample = 1.6;
  const height = getTerrainHeightAt(x, z);
  const heightX = getTerrainHeightAt(x + sample, z) - getTerrainHeightAt(x - sample, z);
  const heightZ = getTerrainHeightAt(x, z + sample) - getTerrainHeightAt(x, z - sample);
  const normal = new THREE.Vector3(-heightX, sample * 2, -heightZ).normalize();
  const incline = smoothstep(0.045, 0.24, Math.hypot(normal.x, normal.z));
  const highStone = smoothstep(7.5, 12.0, height) * 0.12;
  return 1 - clamp(incline + highStone, 0, 1);
}

function smoothstep(edge0, edge1, value) {
  const x = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return x * x * (3 - 2 * x);
}

function hash2d(x, z) {
  const value = Math.sin(x * 127.1 + z * 311.7) * 43758.5453123;
  return value - Math.floor(value);
}

function createGrassTexture() {
  const canvasTexture = document.createElement("canvas");
  canvasTexture.width = 512;
  canvasTexture.height = 512;
  const context = canvasTexture.getContext("2d");
  context.fillStyle = "#456238";
  context.fillRect(0, 0, 512, 512);

  for (let index = 0; index < 5600; index += 1) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const radius = Math.random() * 2.2 + 0.35;
    const hue = 70 + Math.random() * 38;
    const lightness = 22 + Math.random() * 20;
    context.fillStyle = `hsla(${hue}, 34%, ${lightness}%, ${Math.random() * 0.34})`;

    for (const offsetX of [-512, 0, 512]) {
      for (const offsetY of [-512, 0, 512]) {
        context.beginPath();
        context.arc(x + offsetX, y + offsetY, radius, 0, Math.PI * 2);
        context.fill();
      }
    }
  }

  for (let index = 0; index < 900; index += 1) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const bladeLength = 4 + Math.random() * 13;
    const lean = Math.random() * 8 - 4;
    context.strokeStyle = `hsla(${82 + Math.random() * 26}, ${38 + Math.random() * 18}%, ${24 + Math.random() * 22}%, ${0.2 + Math.random() * 0.22})`;
    context.lineWidth = 0.45 + Math.random() * 1.15;

    for (const offsetX of [-512, 0, 512]) {
      for (const offsetY of [-512, 0, 512]) {
        context.beginPath();
        context.moveTo(x + offsetX, y + offsetY);
        context.quadraticCurveTo(
          x + offsetX + lean * 0.35,
          y + offsetY - bladeLength * 0.55,
          x + offsetX + lean,
          y + offsetY - bladeLength
        );
        context.stroke();
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvasTexture);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createRockTexture() {
  const canvasTexture = document.createElement("canvas");
  canvasTexture.width = 512;
  canvasTexture.height = 512;
  const context = canvasTexture.getContext("2d");
  context.fillStyle = "#595c55";
  context.fillRect(0, 0, 512, 512);

  for (let index = 0; index < 1500; index += 1) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const width = 8 + Math.random() * 36;
    const height = 3 + Math.random() * 18;
    const shade = 34 + Math.random() * 28;
    context.fillStyle = `hsla(${42 + Math.random() * 18}, 6%, ${shade}%, ${0.16 + Math.random() * 0.32})`;
    context.save();
    context.translate(x, y);
    context.rotate(Math.random() * Math.PI);
    context.fillRect(-width * 0.5, -height * 0.5, width, height);
    context.restore();
  }

  for (let index = 0; index < 180; index += 1) {
    const y = Math.random() * 512;
    context.strokeStyle = `rgba(38, 37, 34, ${0.2 + Math.random() * 0.18})`;
    context.lineWidth = 1 + Math.random() * 2;
    context.beginPath();
    context.moveTo(0, y);
    for (let x = 0; x <= 512; x += 32) {
      context.lineTo(x, y + Math.sin(x * 0.05 + index) * (2 + Math.random() * 5));
    }
    context.stroke();
  }

  const texture = new THREE.CanvasTexture(canvasTexture);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createStoneBrickMaterial() {
  const texture = createStoneBrickTexture();
  texture.repeat.set(2.4, 2.4);
  return new THREE.MeshStandardMaterial({
    color: "#b0aa9a",
    map: texture,
    roughness: 0.94,
    metalness: 0.02
  });
}

function createStoneBrickTexture() {
  const canvasTexture = document.createElement("canvas");
  canvasTexture.width = 512;
  canvasTexture.height = 512;
  const context = canvasTexture.getContext("2d");
  context.fillStyle = "#918b7c";
  context.fillRect(0, 0, 512, 512);

  const brickHeight = 42;
  const mortar = 4;

  for (let row = 0; row < 14; row += 1) {
    const y = row * brickHeight;
    const offset = row % 2 === 0 ? 0 : 58;

    for (let x = -offset; x < 512; x += 116) {
      const shade = 48 + Math.random() * 18;
      context.fillStyle = `hsl(${38 + Math.random() * 10}, 8%, ${shade}%)`;
      context.fillRect(x + mortar, y + mortar, 116 - mortar * 2, brickHeight - mortar * 2);
      context.fillStyle = "rgba(255, 255, 255, 0.08)";
      context.fillRect(x + mortar + 4, y + mortar + 4, 92, 3);
      context.fillStyle = "rgba(32, 29, 24, 0.12)";
      context.fillRect(x + mortar + 4, y + brickHeight - mortar - 5, 96, 3);
    }
  }

  context.strokeStyle = "rgba(44, 38, 31, 0.55)";
  context.lineWidth = 3;

  for (let y = 0; y <= 512; y += brickHeight) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(512, y);
    context.stroke();
  }

  for (let row = 0; row < 14; row += 1) {
    const y = row * brickHeight;
    const offset = row % 2 === 0 ? 0 : 58;

    for (let x = -offset; x <= 512; x += 116) {
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x, y + brickHeight);
      context.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvasTexture);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function updateRenderStats(deltaSeconds) {
  world.renderStatsTimer += deltaSeconds;

  if (world.renderStatsTimer < 1) {
    return;
  }

  world.renderStatsTimer = 0;

  const gl = world.renderer.getContext();
  const sampleSize = Math.min(96, gl.drawingBufferWidth, gl.drawingBufferHeight);
  const x = Math.floor((gl.drawingBufferWidth - sampleSize) / 2);
  const y = Math.floor((gl.drawingBufferHeight - sampleSize) / 2);
  const pixels = new Uint8Array(sampleSize * sampleSize * 4);
  const colors = new Set();
  let sum = 0;
  let sumSq = 0;
  let samples = 0;

  gl.readPixels(x, y, sampleSize, sampleSize, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

  for (let index = 0; index < pixels.length; index += 16) {
    const r = pixels[index];
    const g = pixels[index + 1];
    const b = pixels[index + 2];
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    colors.add(`${r >> 4},${g >> 4},${b >> 4}`);
    sum += lum;
    sumSq += lum * lum;
    samples += 1;
  }

  const mean = sum / samples;
  document.body.dataset.renderColors = String(colors.size);
  document.body.dataset.renderMean = String(Math.round(mean));
  document.body.dataset.renderVariance = String(Math.round(sumSq / samples - mean * mean));
  document.body.dataset.renderSize = `${gl.drawingBufferWidth}x${gl.drawingBufferHeight}`;
}

function createHealthBarSprite(name = "") {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 384;
  textureCanvas.height = 128;
  const context = textureCanvas.getContext("2d");
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(5.2, 1.72, 1);
  sprite.renderOrder = 1100;
  sprite.userData.healthBar = {
    canvas: textureCanvas,
    context,
    texture,
    name,
    lastHp: null,
    lastMaxHp: null,
    lastName: null,
    lastChangedAt: -Infinity,
    forceVisible: false
  };
  updateHealthBarSprite(sprite, MULTIPLAYER_MAX_HEALTH, MULTIPLAYER_MAX_HEALTH, name);
  return sprite;
}

function updatePlayerHealthBar() {
  if (!world.playerRig?.healthBar) {
    return;
  }

  updateHealthBarSprite(
    world.playerRig.healthBar,
    state.player.hp ?? MULTIPLAYER_MAX_HEALTH,
    state.player.maxHp ?? MULTIPLAYER_MAX_HEALTH,
    state.player.name
  );
  world.playerRig.healthBar.visible = !state.player.dead && shouldShowEntityStatus(world.playerRig.healthBar);
}

function updateHealthBarSprite(sprite, hp, maxHp, name = null) {
  const data = sprite?.userData.healthBar;

  if (!data) {
    return;
  }

  if (name !== null) {
    data.name = name;
  }

  const safeMaxHp = Math.max(1, Number.isFinite(maxHp) ? maxHp : MULTIPLAYER_MAX_HEALTH);
  const safeHp = clamp(Number.isFinite(hp) ? hp : safeMaxHp, 0, safeMaxHp);
  const roundedHp = Math.ceil(safeHp);
  const roundedMaxHp = Math.ceil(safeMaxHp);
  const label = data.name || "";
  const healthChanged = data.lastHp !== null && (data.lastHp !== roundedHp || data.lastMaxHp !== roundedMaxHp);

  if (data.lastHp === roundedHp && data.lastMaxHp === roundedMaxHp && data.lastName === label) {
    return;
  }

  if (healthChanged) {
    data.lastChangedAt = state.elapsed;
  }

  data.lastHp = roundedHp;
  data.lastMaxHp = roundedMaxHp;
  data.lastName = label;

  const { context, texture } = data;
  const ratio = clamp(safeHp / safeMaxHp, 0, 1);
  const fillColor = ratio > 0.55 ? "#4fbe5d" : ratio > 0.28 ? "#d9a846" : "#d84f45";

  context.clearRect(0, 0, 384, 128);
  drawRoundedRect(context, 18, 14, 348, 100, 12, "rgba(8, 9, 8, 0.78)", "rgba(238, 226, 196, 0.55)");

  if (label) {
    context.fillStyle = "#fff2d5";
    context.font = "700 22px Segoe UI, Arial, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(label, 192, 38, 312);
  }

  drawRoundedRect(context, 34, 58, 316, 24, 8, "rgba(33, 22, 20, 0.92)");
  if (ratio > 0) {
    drawRoundedRect(context, 36, 60, Math.max(8, 312 * ratio), 20, 7, fillColor);
  }

  context.fillStyle = "#fff2d5";
  context.font = "700 18px Segoe UI, Arial, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(`${roundedHp} / ${roundedMaxHp} HP`, 192, 98);
  texture.needsUpdate = true;
}

function revealHealthBarSprite(sprite, options = {}) {
  const data = sprite?.userData?.healthBar;

  if (!data) {
    return;
  }

  data.lastChangedAt = state.elapsed;
  data.forceVisible = Boolean(options.persistent);
  sprite.visible = true;
}

function drawRoundedRect(context, x, y, width, height, radius, fillStyle, strokeStyle = null) {
  const right = x + width;
  const bottom = y + height;
  const safeRadius = Math.min(radius, width * 0.5, height * 0.5);

  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(right - safeRadius, y);
  context.quadraticCurveTo(right, y, right, y + safeRadius);
  context.lineTo(right, bottom - safeRadius);
  context.quadraticCurveTo(right, bottom, right - safeRadius, bottom);
  context.lineTo(x + safeRadius, bottom);
  context.quadraticCurveTo(x, bottom, x, bottom - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();

  context.fillStyle = fillStyle;
  context.fill();

  if (strokeStyle) {
    context.strokeStyle = strokeStyle;
    context.lineWidth = 2;
    context.stroke();
  }
}

function createTextSprite(text, color = "#ffffff", width = 42) {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 512;
  textureCanvas.height = 128;
  const context = textureCanvas.getContext("2d");
  context.clearRect(0, 0, 512, 128);
  context.fillStyle = "rgba(8, 9, 8, 0.72)";
  context.fillRect(10, 30, 492, 68);
  context.strokeStyle = "rgba(238, 226, 196, 0.45)";
  context.strokeRect(10, 30, 492, 68);
  context.fillStyle = color;
  context.font = "700 38px Segoe UI, Arial, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, 256, 65, 460);

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(width, width / 4, 1);
  sprite.renderOrder = 1000;
  return sprite;
}

function formatStructureCost(type) {
  return Object.entries(STRUCTURE_COSTS[type])
    .filter(([, amount]) => amount > 0)
    .map(([resourceId, amount]) => `${amount} ${RESOURCE_LOOKUP[resourceId].name}`)
    .join(", ");
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}
