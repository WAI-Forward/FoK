import { subtractRects, stepLavaExposure, LAVA_SPEED_MULTIPLIER } from "./dungeon-lava.js";
import { updateRoomDoors, dungeonMobElevation } from "./dungeon-room-doors.js";
import { fireStaffConfig, flameHitsBody } from './fire-magic.js';
import { FlameJetVisual } from './fire-magic-visuals.js';
import { buildDungeonLayout, inside, roomBarriers, crossesBarrier } from "./dungeon-layout.js";
import { poseEarthStaff } from './earth-magic-visuals.js';
import { craftIronItem, combineForgeItems, gemSvg } from './forging.js';
import { renderForge } from './forge-ui.js';
import { transferStewardItem } from './steward-storage.js';
const stewardMenu = { tab: 'vault' };
import { exchangePage, exchangePaginationMarkup } from './exchange-pagination.js';
import { EarthRockControl, earthStaffControl, ROCK_SMASH_MIN_DROP } from './earth-magic.js';
import { attachEquipmentGem } from './equipment-gems.js';
const forgeMenu = { tab: 'exchange', mould: 'Dagger', selection: [] };
const exchangePages = { stock: 0, inventory: 0 };
import { BARREL_HP, BARREL_BLAST_RADIUS, createBarrel, barrelPlacements, barrelBlastStrength, createBarrelPickup, disposeBarrelObject } from "./dungeon-barrels.js";
import { StatusEffects, STATUS_EFFECTS } from './status-effects.js';
import { PlayerStatusVisuals, createElementalEffect, updateElementalEffect } from './elemental-effects.js';
import { createStaffVisual, stepSorcererMelee, poseSorcererStaff } from './staff.js';
const playerStatuses = new StatusEffects();
const flamingTargets = new Map();
import { createCastleWorker, nearbyCastleNpc } from './castle-npcs.js';
import { locateBodyHit, locationDamage, armorForHit, mitigateHitDamage } from "./hit-damage.js";
import { DUNGEON_GATE_HOLD_SECONDS, createDungeonGate, advanceDungeonGate, isNearDungeonGate, constrainToDungeonAntechamber, crossesClosedDungeonGate } from "./dungeon-gate.js";
import { SORCERERS, createElementalGem, createSorcererVisual, loadSorcererModel, animateSorcerer, stepSorcererMovement, stepSorcererCombat, createBossArena, SorcererSpells, updateCollapseDebris } from "./dungeon-bosses.js";
import { chooseCampTentSpawn, stepTentExit } from './camp-spawning.js';
import { attachMobModel } from './mob-models.js';
import { createPerformanceDiagnostics, isDiagnosticsShortcut } from './performance-diagnostics.js';
import { applyGremlinSize, restoreGremlinRewards } from './gremlin-scaling.js';
import { resolveNearbyMobPairs } from './mob-collisions.js';
import { BloodEffects } from './blood-effects.js';
import { statusPickCandidates } from './status-picking.js';
import { pickCombatAimPoint, terrainAimCandidates } from './aim-picking.js';
import { takeMobUpdate, distantMobInterval, moveMobInSteps, updateStructureTransform } from './update-budget.js';
import { isInOwnCastle, regenerateHealth, reconcileHealth } from './health.js';
import { LIBRARY_TABLE_DISPLAYS } from './library-displays.js';
import { simulationSteps } from './frame-timing.js';
import { normalizeHistory, mergeHistory, historyRenown } from './history.js';
import { renderArchive, selectArchiveDisplay } from './history-ui.js';
import { createCheatConsole } from './cheat-console.js';
import { METAL_TIERS, equipmentMaterial, equipmentName, stampEquipmentMaterial } from "./equipment-materials.js";
import { equipmentArtUrl } from "./equipment-art.js";
import { createInventoryPreview } from "./inventory-preview.js";
import { createGroundSmashEffect, updateGroundSmashEffect } from "./ground-smash.js";
import { getJumpAttack, canStartDaggerAirAttack, consumeDaggerAirStrike, canSpearVault, applySpearVaultLift, startSpearJump, isGroundSmashTarget, GROUND_SMASH_RADIUS } from "./jump-attacks.js";
import { createGroundCoverInstances, createFootpaths } from './ground-cover.js';
import { createLocalShadows, installShadowEdgeFade } from "./daylight-shadows.js";
import { createCampLights, updateCampLights, campFireFlicker } from "./camp-art.js";
import { CAMP_CHEST_REACH, claimCampChest, updateCampChest } from "./camp-loot.js";
import { INLAND_LAKES, lakeDistance, shoreScale, nearestLake, tileTouchesLake } from "./waterways.js";
import { createCoastalWaterGeometry } from "./water-art.js";
import { createBuildableArchitecture } from "./structure-art.js";
import { CASTLE_GATE_Z, CASTLE_FOUNDATION_RADIUS, CASTLE_INTERIOR, castleEntrance, createCastleExterior, createCastleInteriorDetails } from "./castle-art.js";
import { LIBRARY_INTERIOR_WIDTH_SCALE, POI_HALL, createPoiInteriorArt, createDungeonInteriorDetails, interiorUv } from "./poi-interior-art.js";
import { surface } from "./poi-architecture.js";
import { createPoiArchitecture } from "./poi-architecture.js";
import { chooseAccount, retryAccount, finishAccountLoading, showSaveStatus } from "./account.js";
import { getPoiWorkstation, isWithinWorkstationReach, rayHitsWorkstation, createPoiWorkstationModel } from "./poi-workstations.js";
import { createRoutePlanner } from "./navigation.js";
import { NIGHT_CAMP_CAP, raidSpawnSources, raidTargets, nearestRaidTarget, advanceRaidCapture, reclaimPoiForWilderness } from "./night-raids.js";
import { createRoadMask, roadSpeedMultiplier } from "./roads.js";
import { clearPlayerInventory, createDeathDrops, sameLootScene, DROPPED_LOOT_LIFETIME_MS, isLootExpired, pruneExpiredLoot } from "./death-loot.js";
import { trackLootResources, disposeLootResources } from './loot-resources.js';
import { clearPlayerResources, syncResourceReceipts } from "./resource-transfers.js";
import { factionProduction } from "./poi-income.js";
import { createRoyalCape, animateRoyalCape } from "./royal-cape.js";
import { createCameraOcclusion } from "./camera-occlusion.js";
import { createWorldLabels } from "./world-labels.js";
import { createMinimap } from "./minimap.js";
import { getFaction, flagSvg, flagPixels, normalizeFlag, normalizeFactions, FLAG_PATTERNS } from "./factions.js";
import { setupFlagColours } from "./flag-colours.js";
import { updateInstanceDetail, isBeyondFog, SpatialGrid, partitionInstances, createTerrainTile, isWithinRenderDistance, getRenderPixelRatio, WORLD_RENDER_DISTANCE, TERRAIN_DETAIL_DISTANCE } from "./world-performance.js";
import { createRockPart, rockVariant, rockColliderProfile, rockSurfaceWorldY } from "./rock-art.js";
import { createLibraryExterior, createLibraryInterior, createInstancedLandscape, createPoiSetting, createCampModel } from "./world-art.js";
import { WORLD_EXTENT, SNOW_LINE, LIBRARY_ID, LIBRARY_SCROLL_POSITION, REGIONS, MOB_CAMPS, distanceToCoast, clampWorldPosition, getNaturalHeight, getRegionAt, createWorldRoutes, selectCampForSpawn } from "./world-layout.js";
import * as THREE from "three";
import { createMarketFurnishings, MARKET_SHOPKEEP_POSITION } from "./market-interior.js";
import { applyJumpAnimation, stepJumpAnimation } from "./jump-animation.js";
import { attachWarriorModel } from "./warrior-model.js";
import { attachArmourModel } from "./armour-models.js";
import { flailChargePower, flailSpinAngle, getFlailReleaseAngle } from "./flail-dynamics.js";
import { MELEE_STYLES, sampleMeleeMotion, canWeaveAttack, isShield, resolveShieldBlock, getStrikeWindow } from "./combat-motion.js";
import { ATTACK_BUFFER_SECONDS, angleDifference, approachFacing, selectMeleeTarget, assistedDirection,
  canCancelIntoDefense, attackMovementScale, attackStepDistance, meleeContactPadding, sweptWeaponSegments,
  enemyAttackPermitted, clearRecoilPose, applyRecoilPose, meleeTargetTorso, meleeTargetInReach, lockedMeleeContact } from './combat-feel.js';
import { getComboCadence, getComboIndex, createComboChain } from "./combo-timing.js";
import { CombatTrails } from "./combat-trails.js";
import { combatAudio } from './combat-audio.js';
import { attachWeaponModel, createBowString, updateBowString, focusedSwingAngles, reachHand, createFlailModel, updateFlailModel, simulateFlailModel, seatWeaponInHand } from "./weapon-models.js";
import {
  getCombatAttackDuration,
  getCombatComboTiming,
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
  appendRemoteSnapshot,
  estimateServerTime,
  getCourierProgressAt,
  observeServerClock,
  sampleRemoteSnapshots
} from "./network-sync.js";
import {
  ARMOR_STATS,
  BUILDING_DEFINITIONS,
  BUILDING_LOOKUP,
  FACTIONS as CASTLES,

  ITEM_DEFINITIONS,
  POIS,
  RESOURCE_LOOKUP,
  RESOURCE_TYPES,
  STRUCTURE_COSTS,
  WEAPON_STATS
} from "./game-data.js";
import {
  foundFaction,
  updateFactionIdentity,
  beginNewPlayerLife,
  randomPlayerFirstName,
  buildStructure,
  claimPoi,
  claimFactionRulerSeat,
  canUseFactionThrone,
  claimLoreRenownAwards,
  createGameState,
  damageInventoryItem,
  depositToFaction,
  distance2D,
  equipItem,
  formatHouseName,
  getEquippedItem,
  getFactionMembers,
  getFactionRulerName,
  getHouseMembers,
  getKnownHouses,
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
  sanitizeHouseName,
  setFactionRelation,
  setHouseRelation,
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
const heraldryTextures = new Map();
const state = createGameState();
const FACTION_LOOKUP = Object.fromEntries(CASTLES.map(castle => [castle.id, null]));
for (const castle of CASTLES) Object.defineProperty(FACTION_LOOKUP, castle.id, { get: () => getFaction(state, castle.id) });
const FACTIONS = CASTLES.map(castle => new Proxy(castle, { get: (_, key) => getFaction(state, castle.id)?.[key] }));
const GAME_FLAGS = {
  pve: readBooleanFlag("pve", true)
};
const MULTIPLAYER_MAX_HEALTH = 100;
const MULTIPLAYER_SEND_INTERVAL = 0.12;
const MULTIPLAYER_POLL_INTERVAL = 0.18;
const REMOTE_INTERPOLATION_DELAY_MS = 150;
const REMOTE_MAX_EXTRAPOLATION_MS = 250;
const REMOTE_TELEPORT_DISTANCE = 18;
const PLAYER_RESPAWN_DELAY_MS = 3500;
const PERSISTENCE_SAVE_INTERVAL = 4;
const PERSISTENCE_POLL_INTERVAL = 6;
const DAY_DURATION_SECONDS = 300;
const NIGHT_DURATION_SECONDS = 300;
const DAY_NIGHT_CYCLE_SECONDS = DAY_DURATION_SECONDS + NIGHT_DURATION_SECONDS;
const DAWN_DUSK_BLEND_SECONDS = 36;
const MAX_TERRAIN_LAMP_LIGHTS = 16;
const MAX_STREET_LAMP_POINT_LIGHTS = 8;
const STREET_LAMP_TERRAIN_LIGHT_RADIUS = 58;
const STREET_LAMP_POINT_LIGHT_RADIUS = 54;
const STREET_LAMP_LOCAL_LIGHT_OFFSET = { x: 2.55, y: 6.45, z: 0 };
const BLOOD_SPLAT_LIFETIME = 1.28;
const BLOOD_SPLAT_DROPLET_COUNT = 12;
const WALL_BODY_SIZE = { width: 14.4, height: 4.4, depth: 2.4 };
const WALL_COLLIDER_HALF_WIDTH = WALL_BODY_SIZE.width / 2;
const WALL_COLLIDER_HALF_DEPTH = WALL_BODY_SIZE.depth / 2;
const LOCKED_THIRD_PERSON_CAMERA = {
  distanceScale: 0.38,
  minDistance: 16,
  maxDistance: 30,
  minPitch: -1.12,
  framingMinPitch: 0.14,
  maxPitch: 1.42,
  shoulderOffset: 4.8,
  baseHeight: 5.8,
  pitchHeight: 5.8,
  minFocusDistance: 9,
  maxFocusDistance: 64,
  focusHeight: 4.8,
  pitchFocusOffset: 10
};
const OUTPOST_TOWER_CAMERA = {
  minPitch: -1.12,
  maxPitch: 0.72,
  sensitivity: 0.0028
};
const account = await chooseAccount();
const connectionId = createId("connection");
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
    id: "shopkeep",
    name: "Shopkeep",
    resourceIds: ["wood", "stone", "wheat", "iron"],
    position: MARKET_SHOPKEEP_POSITION,
    color: "#8f5a31"
  }
];
const BLACKSMITH_STOCK_SIZE = 5;
const BLACKSMITH_NPC = {
  id: "blacksmith",
  name: "Blacksmith",
  position: { x: 50, z: -8 },
  color: "#3f4145"
};
const BLACKSMITH_MAX_STOCK_SIZE = 8;
const BLACKSMITH_BUY_XP_RATE = 0.16;
const BLACKSMITH_SELL_XP_RATE = 0.22;
const BLACKSMITH_MAX_LEVEL = 10;
const BLACKSMITH_WEAPON_PREFIXES = [
  "Tempered",
  "Balanced",
  "Keen",
  "Stout",
  "Hardened",
  "Fine",
  "Hammered",
  "True"
];
const BLACKSMITH_MASTER_PREFIXES = [
  "Masterwork",
  "King-forged",
  "Runed",
  "Perfected",
  "Warborn"
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
  { id: "legs", label: "Legs", stateKey: "legsItemId" },
  { id: "feet", label: "Feet", stateKey: "feetItemId" },
  { id: "leftHand", label: "Left hand", stateKey: "leftHandItemId", hand: "left" },
  { id: "rightHand", label: "Right hand", stateKey: "rightHandItemId", hand: "right" }
];
const ITEM_ICON_SVGS = {
  Flail: `<path class="item-icon-wood" d="m18 53 12-27"/><path class="item-icon-detail" d="M30 26 33 18 40 14 47 20 47 28"/><path class="item-icon-metal" d="m47 25 4 5 6 1-3 6 1 6-7-1-5 4-3-6-5-3 5-5 1-6Z"/>`,
  Axe: `
    <path class="item-icon-wood" d="M29 52 43 18" />
    <path class="item-icon-edge" d="M39 11c8 1 13 6 15 14-8 5-16 6-24 2 2-8 5-13 9-16Z" />
    <path class="item-icon-detail" d="M34 28c5 1 10 0 15-3" />`,
  Bow: `
    <path class="item-icon-wood" d="M40 8c-15 12-17 36 0 48" />
    <path class="item-icon-detail" d="M40 8 40 56" />
    <path class="item-icon-edge" d="M25 36h20" />
    <path class="item-icon-edge" d="m42 32 7 4-7 4" />`,
  Chestplate: `
    <path class="item-icon-metal" d="M19 16 28 10h8l9 6 5 31-7 8H21l-7-8 5-31Z" />
    <path class="item-icon-detail" d="M28 12v15l-8 10M36 12v15l8 10M23 50h18" />`,
  Crossbow: `
    <path class="item-icon-wood" d="M32 16v37" />
    <path class="item-icon-edge" d="M13 20c12 9 26 9 38 0" />
    <path class="item-icon-detail" d="M16 20h32M23 31h18" />
    <path class="item-icon-edge" d="M32 10v18" />`,
  Dagger: `
    <path class="item-icon-edge" d="M34 8 42 31 31 42 22 33 34 8Z" />
    <path class="item-icon-detail" d="M34 11 31 39" />
    <path class="item-icon-gold" d="M20 35 29 44M17 39l8 8" />
    <path class="item-icon-wood" d="m17 47 7-7" />`,
  Feet: `
    <path class="item-icon-leather" d="M16 34h14l4 11c-5 4-13 5-21 2v-6l3-7Z" />
    <path class="item-icon-leather" d="M36 34h14l3 7v6c-8 3-16 2-21-2l4-11Z" />
    <path class="item-icon-detail" d="M14 44h17M33 44h17" />`,
  Gloves: `
    <path class="item-icon-leather" d="M18 18c8 3 13 10 14 21l-8 10-13-14 7-17Z" />
    <path class="item-icon-leather" d="M46 18c-8 3-13 10-14 21l8 10 13-14-7-17Z" />
    <path class="item-icon-detail" d="M24 26 17 37M40 26l7 11" />`,
  Helmet: `
    <path class="item-icon-metal" d="M15 34c1-16 9-24 17-24s16 8 17 24l-5 13H20l-5-13Z" />
    <path class="item-icon-detail" d="M18 34h28M24 46v-9M32 46v-12M40 46v-9" />`,
  "Long Bow": `
    <path class="item-icon-wood" d="M43 5c-20 15-22 39 0 54" />
    <path class="item-icon-detail" d="M43 5 43 59" />
    <path class="item-icon-edge" d="M20 37h27" />
    <path class="item-icon-edge" d="m44 33 8 4-8 4" />`,
  "Long Shield": `
    <path class="item-icon-metal" d="M32 8 48 15v16c0 12-6 21-16 25-10-4-16-13-16-25V15l16-7Z" />
    <path class="item-icon-gold" d="M32 12v39" />
    <path class="item-icon-detail" d="M20 23h24M20 34h24" />`,
  "Long Sword": `
    <path class="item-icon-edge" d="M34 5 41 36 32 49 23 36 30 5h4Z" />
    <path class="item-icon-detail" d="M32 8v38" />
    <path class="item-icon-gold" d="M20 42h24" />
    <path class="item-icon-wood" d="M32 44v13" />`,
  Shield: `
    <path class="item-icon-metal" d="M32 9 48 17v14c0 11-6 19-16 24-10-5-16-13-16-24V17l16-8Z" />
    <path class="item-icon-gold" d="M32 13v37" />
    <path class="item-icon-detail" d="M20 25h24" />`,
  Spear: `
    <path class="item-icon-wood" d="M17 54 42 19" />
    <path class="item-icon-edge" d="M45 8 54 15 42 22 38 18 45 8Z" />
    <path class="item-icon-detail" d="M40 18 44 21" />`,
  Sword: `
    <path class="item-icon-edge" d="M32 7 39 35 32 45 25 35 32 7Z" />
    <path class="item-icon-detail" d="M32 10v32" />
    <path class="item-icon-gold" d="M21 40h22" />
    <path class="item-icon-wood" d="M32 42v13" />`
};
const ARMOR_VISUAL_SLOT_IDS = ["head", "chest", "gloves", "legs", "feet"];
const LOCATION_HOLD_DURATION = 1.05;
const POI_DOOR_INTERACTION_RANGE = 6.5;
const POI_FLAG_HOLD_DURATION = 1.35;
const POI_FLAG_POSITION = { x: -23, z: -12 };
const POI_FLAG_INTERACTION_RANGE = 6.2;
const WORK_ACTION_DURATION = 1.15;
const DUAL_HAND_WORK_SPEED_MULTIPLIER = 1.5;
const POINTER_BUTTON_LEFT = 1;
const POINTER_BUTTON_RIGHT = 2;
const JUMP_VELOCITY = 21.75;
const JUMP_GRAVITY = 46;
const ROLL_DURATION = 0.9;
const ROLL_DOUBLE_TAP_MS = 300;
const ROLL_SPEED = 32;
const ROLL_DIVE_SPEED_BOOST = 12;
const ROLL_COOLDOWN = 0.65;
const ROLL_VERTICAL_VELOCITY = 3;
const DUNGEON_ENEMY_SPAWNS = [
  { name: "Hollow Guard", position: { x: -24, z: -24 }, hp: 55, color: "#7d54b8" },
  { name: "Crypt Raider", position: { x: 24, z: -24 }, hp: 45, color: "#9b7250" },
  { name: "Bone Warden", position: { x: -18, z: 12 }, hp: 70, color: "#b8aa8d" },
  { name: "Hollow Acolyte", position: { x: 20, z: 16 }, hp: 38, color: "#5b477f" },
  { name: "Ebon Sentinel", position: { x: 0, z: -38 }, hp: 95, color: "#3d4249" }
];
const PVE_CREATURE_TEMPLATES = [
  { name: "Hollow Stalker", hp: 30, color: "#5b477f", skinColor: "#7c6aa1", speed: 8.4, radius: 1.05 },
  { name: "Ebon Crawler", hp: 38, color: "#303942", skinColor: "#59656c", speed: 7.8, radius: 1.12 },
  { name: "Crypt Gnawer", hp: 46, color: "#654a78", skinColor: "#92749e", speed: 7.1, radius: 1.2 }
];
const PVE_RAIDER_TEMPLATES = [
  { name: "Orc Reaver", hp: 78, color: "#6e4d91", skinColor: "#9d8b74", speed: 6.15, radius: 1.18 },
  { name: "Orc Marauder", hp: 92, color: "#3d4249", skinColor: "#8f806e", speed: 5.75, radius: 1.22 },
  { name: "Orc Warden", hp: 108, color: "#77573d", skinColor: "#a18c72", speed: 5.35, radius: 1.28 }
];
const PVE_RAIDER_SPAWN_CHANCE = 0.22;
const OUTDOOR_DUNGEON_MONSTER_SPAWN_INTERVAL = 6.5;
const OUTDOOR_DUNGEON_MONSTER_RING_PADDING = 2.5;
const OUTDOOR_DUNGEON_MONSTER_SPAWN_BUFFER = 10;
const OUTDOOR_DUNGEON_MONSTER_TRACK_RANGE = 105;
const DUNGEON_COLLAPSE_WARNING_SECONDS = 240;
const DUNGEON_RESPAWN_SECONDS = 300;
const DUNGEON_CORRIDOR_WIDTH = 12;
const DUNGEON_TREASURE_PICKUP_RANGE = 7;
const ENTITY_STATUS_CHANGED_VISIBLE_DURATION = 2.8;
const PVE_STATUS_BAR_HEIGHT = 7.15;
const REMOTE_STATUS_BAR_HEIGHT = 7.35;
const LOCAL_STATUS_BAR_HEIGHT = 7.05;
const PVE_MOB_COLLISION_PADDING = 0.22;
const ACTOR_COLLISION_PADDING = 0.12;
const PLAYER_COLLISION_RADIUS = 1.15;
const PVE_KNOCKBACK_IMPULSE_SCALE = 4.2;
const SPEAR_KNOCKBACK_IMPULSE_SCALE = 5.1;
const SPEAR_KNOCKBACK_MAX_SPEED = 16;
const SPEAR_HIT_STAGGER_DURATION = 0.28;
const PVE_SHOVE_KNOCKBACK_IMPULSE_SCALE = 4.8;
const PVE_SHOVE_KNOCKBACK_MAX_SPEED = 17.5;
const PVE_SHOVE_STAGGER_DURATION = 0.42;
const PLAYER_KNOCKBACK_IMPULSE_SCALE = 3.2;
const KNOCKBACK_MAX_SPEED = 13.5;
const KNOCKBACK_DAMPING = 8.8;
const OUTPOST_ATTACK_RANGE = 95;
const OUTPOST_ATTACK_INTERVAL = 2.35;
const OUTPOST_ATTACK_DAMAGE = 24;
const PROJECTILE_DAMAGE_MULTIPLIER = 0.7;
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
  { name: "Mithril", tier: 6, color: "#70d6cf", defense: 2.05, resistance: 1.72, toughness: 1.92, durability: 1.72, metalness: 0.58 },
  { name: "Adamant", tier: 7, color: "#a68ad4", defense: 2.4, resistance: 2, toughness: 2.25, durability: 2, metalness: 0.65 }
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
const PLAYABLE_HALF = WORLD_EXTENT;
const WORLD_ROUTES = createWorldRoutes(POIS, FACTIONS);
const FOOTPATHS = createFootpaths(WORLD_ROUTES, MOB_CAMPS);
const GROUND_ROUTE_GRIDS = new Map([WORLD_ROUTES, FOOTPATHS].map(routes => [routes, new SpatialGrid(routes.flatMap(route => route.slice(1).map((b,i) => {
  const a=route[i];
  return {a,b,x:(a.x+b.x)/2,z:(a.z+b.z)/2,radius:Math.hypot(b.x-a.x,b.z-a.z)/2};
})),48)]));
const TERRAIN_SIZE = WORLD_EXTENT * 2 + 500;
const TERRAIN_HALF = TERRAIN_SIZE / 2;
const TERRAIN_FOUNDATIONS = [...FACTIONS, ...POIS, ...MOB_CAMPS].map(landmark => ({ ...landmark, height: getNaturalHeight(landmark.position.x, landmark.position.z) }));
const LONG_GRASS_PATCH_COUNT = 3600;
const LONG_GRASS_BLADES_PER_PATCH = 56;
const INLAND_LAKE = INLAND_LAKES[0];
const WATER_WADING_SPEED_MULTIPLIER = 0.48;
const WATER_SPLASH_INTERVAL = 0.16;
const BIOME_REGIONS = { kingswood: REGIONS.find(region => region.id === "forest"), quarryHighlands: REGIONS.find(region => region.id === "alpine") };

const POI_EXTERIOR_LAYOUTS = {
  "north-quarry": createPoiExteriorLayout("#777873", "#41433f", [
    { x: 0, z: -4, width: 46, depth: 32, height: 11 },
    { x: 23, z: -8, width: 18, depth: 20, height: 8 }
  ]),
  kingswood: createPoiExteriorLayout("#81532f", "#3f2b22", [
    { x: 0, z: -4, width: 46, depth: 32, height: 11 },
    { x: -23, z: -8, width: 18, depth: 20, height: 8 }
  ]),
  millfield: createPoiExteriorLayout("#94412f", "#4b2922", [
    { x: 0, z: -4, width: 48, depth: 32, height: 12 },
    { x: 25, z: -8, width: 18, depth: 20, height: 9 }
  ]),
  blackridge: createPoiExteriorLayout("#44484e", "#242629", [
    { x: 0, z: -4, width: 48, depth: 32, height: 11 },
    { x: -25, z: -8, width: 18, depth: 20, height: 9 }
  ]),
  "river-market": createPoiExteriorLayout("#9a6841", "#6f3e31", [
    { x: 0, z: -4, width: 50, depth: 30, height: 11 },
    { x: -26, z: -7, width: 16, depth: 22, height: 8 },
    { x: 26, z: -7, width: 16, depth: 22, height: 8 }
  ]),
  "ebon-hollow": createPoiExteriorLayout("#303238", "#17181c", [
    { x: 0, z: -5, width: 44, depth: 30, height: 12 },
    { x: -23, z: -9, width: 12, depth: 16, height: 10 },
    { x: 23, z: -9, width: 12, depth: 16, height: 10 }
  ])
};

const world = {
  scene: new THREE.Scene(),
  outdoorRoot: new THREE.Group(),
  campModels: [],
  campChests: [],
  campLights: createCampLights(),
  interiorRoot: new THREE.Group(),
  poiInteriorRoot: new THREE.Group(),
  sceneMode: "outdoor",
  interiorFactionId: null,
  activePoiInteriorId: null,
  baseEntryAction: null,
  renderer: new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true }),
  camera: new THREE.PerspectiveCamera(48, 1, 0.1, 1800),
  raycaster: new THREE.Raycaster(),
  worldLabels: createWorldLabels(),
  groundPlane: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
  aimTarget: new THREE.Vector3(0, 0, 1),
  aimPoint: new THREE.Vector3(0, 0, 1),
  aimRayOrigin: new THREE.Vector3(0, 0, 0),
  aimRayDirection: new THREE.Vector3(0, 0, 1),
  aimDirection: new THREE.Vector3(0, 0, 1),
  hasAim: false,
  clock: new THREE.Clock(),
  keys: new Set(),
  frames: 0,
  renderStatsTimer: 0,
  lighting: {
    ambient: null,
    sun: null,
    isNight: false,
    nightAmount: 0
  },
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
  serverClock: {
    initialized: false,
    offsetMs: 0
  },
  sceneryColliders: [],
  poiExteriorColliders: [],
  castleExteriorColliders: [],
  waterSplashes: [],
  waterSplashCooldown: 0,
  hoverBases: [],
  interiorCameraWalls: [],
  cameraOcclusion: createCameraOcclusion(),
  tradeNpcs: [],
  activeTradeNpcId: null,
  blacksmithNpcs: [],
  blacksmithStock: [],
  blacksmithStockByFaction: {},
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
  bloodEffects: null,
  bloodSplatTexture: null,
  droppedItems: [],
  dungeons: new Map(),
  dungeonContextId: null,
  get dungeon() {
    const id = this.dungeonContextId ?? state.pois.find(poi => poi.id === this.activePoiInteriorId && poi.type === "Dungeon")?.id ?? "ebon-hollow";
    if (!this.dungeons.has(id)) this.dungeons.set(id, {
      id, status: "active", generation: 0, collapseTimer: 0, respawnTimer: 0,
      warningTimer: 0, layout: null, contentRoot: null, treasure: null, chests: [], enemies: []
    });
    return this.dungeons.get(id);
  },
  get pveEnemies() { return this.dungeon.enemies; },
  set pveEnemies(enemies) { this.dungeon.enemies = enemies; },
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
    yaw: Math.PI,
    pitch: -0.12,
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
  comboChains: { left: null, right: null },
  weaveQueue: null,
  flailCharge: null,
  guard: { hand: null, stamina: 100, raisedAt: -10, brokenUntil: 0 },
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
    rolling: false,
    rollElapsed: 0,
    rollCooldown: 0,
    rollDirection: new THREE.Vector3(0, 0, 1),
    airborneDirection: new THREE.Vector3(0, 0, 0),
    airborneSpeed: 0
  },
  multiplayer: {
    enabled: location.protocol !== "file:",
    sendTimer: 0,
    pollTimer: 0,
    publishInFlight: false,
    pollInFlight: false,
    failed: false,
    localDefeated: false,
    respawnAt: 0,
    nextInputSequence: Math.floor(Date.now() * 1000),
    lastAckedInputSequence: 0,
    lastSnapshotSequence: 0
  },
  persistence: {
    enabled: location.protocol !== "file:",
    online: false,
    storage: "none",
    incomeSupported: null,
    dirty: false,
    saveTimer: PERSISTENCE_SAVE_INTERVAL,
    pollTimer: PERSISTENCE_POLL_INTERVAL,
    saveInFlight: false,
    loadInFlight: false,
    lastSnapshotSequence: 0
  },
  seatedOnThrone: false,
  cameraMode: "free",
  cameraMenuSuspended: false,
  cameraLockPending: false,
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
    buttons: 0,
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
  deathScreen: document.querySelector("#death-screen"),
  respawnForm: document.querySelector("#respawn-form"),
  respawnName: document.querySelector("#respawn-name"),
  respawnButton: document.querySelector("#respawn-button"),
  respawnLocation: document.querySelector("#respawn-location"),
  factionSelect: document.querySelector("#faction-select"),
  factionCards: document.querySelector("#faction-cards"),
  houseNameInput: document.querySelector("#house-name"),
  houseNameStatus: document.querySelector("#house-name-status"),
  hudFactionButton: document.querySelector("#hud-faction-button"),
  hudFaction: document.querySelector("#hud-faction"),
  hudFactionGold: document.querySelector("#hud-faction-gold"),
  hudHouseButton: document.querySelector("#hud-house-button"),
  hudHouse: document.querySelector("#hud-house"),
  hudPlayerButton: document.querySelector("#hud-player-button"),
  hudPlayer: document.querySelector("#hud-player"),
  hudPlayerHp: document.querySelector("#hud-player-hp"),
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
  npcTradePanel: document.querySelector("#npc-trade-panel"),
  npcTradeTitle: document.querySelector("#npc-trade-title"),
  npcTradeResource: document.querySelector("#npc-trade-resource"),
  npcTradeClose: document.querySelector("#npc-trade-close"),
  npcTradeAmount: document.querySelector("#npc-trade-amount"),
  npcTradeResourceList: document.querySelector("#npc-trade-resource-list"),
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
  housePanel: document.querySelector("#house-panel"),
  houseClose: document.querySelector("#house-close"),
  houseTitle: document.querySelector("#house-title"),
  houseStatus: document.querySelector("#house-status"),
  houseBody: document.querySelector("#house-body"),
  loreScroll: document.querySelector("#lore-scroll"),
  loreClose: document.querySelector("#lore-close"),
  loreMeta: document.querySelector("#lore-meta"),
  loreBody: document.querySelector("#lore-body"),
  toastLog: document.querySelector("#toast-log"),
  combatHitMarker: document.querySelector("#combat-hit-marker")
};

function initializeNetworkIdentity() {
  state.player.id = account.playerId;
  state.player.houseName = "";
  state.player.firstName = "";
  state.player.name = "Traveller";
  state.player.hp = MULTIPLAYER_MAX_HEALTH;
  state.player.maxHp = MULTIPLAYER_MAX_HEALTH;
  state.player.dead = false;
  document.body.dataset.playerId = account.playerId;
}

async function loadPersistentState() {
  if (!world.persistence.enabled) {
    return;
  }

  world.persistence.loadInFlight = true;

  try {
    const data = await fetchPersistentJson(`/api/world/state?playerId=${encodeURIComponent(state.player.id)}`);
    applyPersistentPayload(data, { includePlayer: true, includePlayerPosition: true });
    world.persistence.online = true;
    world.persistence.storage = data.storage ?? "database";
  } catch (error) {
    world.persistence.online = false;
    world.persistence.storage = "none";
    throw error;
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
  if (!state.player.firstName || !world.persistence.enabled || world.persistence.saveInFlight) {
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
    applyPersistentPayload(data, { includePlayer: false });
    world.persistence.online = true;
    world.persistence.storage = data.storage ?? world.persistence.storage;
    showSaveStatus(account.authenticated ? "Family progress saved" : "Guest progress saved in this browser");
    return true;
  } catch {
    world.persistence.online = false;
    showSaveStatus("Save failed — reconnect before leaving");
    if (includeWorld) world.persistence.dirty = true;
    return false;
  } finally {
    world.persistence.saveInFlight = false;
  }
}

async function fetchPersistentJson(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  const requestStartedAt = Date.now();

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });

    if (!response.ok) {
      throw new Error(`Persistence request failed: ${response.status}`);
    }

    const data = await response.json();
    observeServerClock(world.serverClock, data?.serverTime, requestStartedAt, Date.now());
    return data;
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
  if (!state.player.firstName) return;

  world.persistence.saveTimer -= deltaSeconds;
  const pollInterval = ui.rulerPanel.classList.contains("is-hidden") ? PERSISTENCE_POLL_INTERVAL : 1;
  world.persistence.pollTimer = Math.min(world.persistence.pollTimer, pollInterval) - deltaSeconds;
  // Keep due work pending while a request is running; never consume a poll without sending it.
  if (world.persistence.loadInFlight || world.persistence.saveInFlight) return;

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
    world.persistence.pollTimer = pollInterval;
    void pollPersistentState();
  }
}

function buildPersistentPayload(includeWorld = true) {
  const payload = {
    playerId: state.player.id,
    cheatRevision: state.cheatRevision || 0,
    player: {
      selectedFactionId: state.selectedFactionId,
      player: {
        id: state.player.id,
        name: state.player.name,
        houseName: state.player.houseName,
        firstName: state.player.firstName,
        lifeNumber: state.player.lifeNumber,
        hp: state.player.hp,
        dead: state.player.dead,
        gold: state.player.gold,
        resourceReceipts: state.player.resourceReceipts,
        lootReceiptCount: state.player.lootReceiptCount,
        lootReceipts: state.player.lootReceipts,
        lootDeathReceiptCount: state.player.lootDeathReceiptCount,
        resourceDeathVersion: state.player.resourceDeathVersion,
        resourceDeathReceipts: state.player.resourceDeathReceipts,
        renown: state.player.renown,
        prowess: state.player.prowess || 0,
        historyRenownClaimed: state.player.historyRenownClaimed,
        historyRenownVersion: state.player.historyRenownVersion,
        position: world.sceneMode === "outdoor" ? state.player.position : world.outdoorReturnPosition,
        velocity: state.player.velocity,
        selectedGearItemId: state.player.selectedGearItemId,
        equipment: state.player.equipment,
        hotbar: state.player.hotbar,
        resources: state.player.resources,
        inventory: state.player.inventory,
        stewardInventory: state.player.stewardInventory,
        campChestRefills: state.player.campChestRefills
      }
    }
  };

  if (includeWorld) {
    payload.world = {
      cheatRevision: state.cheatRevision || 0,
      elapsed: state.elapsed,
      market: state.market,
      poiIncomeTotals: state.poiIncomeTotals,
      resourceTransferTotals: state.resourceTransferTotals,
      factions: state.factions,
      factionMembers: state.factionMembers,
      factionGovernance: state.factionGovernance,
      houseRelations: state.houseRelations,
      factionResources: state.factionResources,
      pois: state.pois,
      structures: state.structures,
      couriers: state.couriers,
      activeEvent: state.activeEvent,
      history: { events: (state.history?.events || []).slice(-120) },
      lore: state.lore
    };
  }

  return payload;
}

function applyPersistentPayload(data, options = {}) {
  if (!data?.ok) {
    return;
  }

  const snapshotSequence = Math.max(0, Math.floor(Number(data.snapshotSequence) || 0));
  if (snapshotSequence > 0 && snapshotSequence <= world.persistence.lastSnapshotSequence) {
    return;
  }
  if (snapshotSequence > 0) {
    world.persistence.lastSnapshotSequence = snapshotSequence;
  }

  // Rebuild local mobs, chests, interiors and transient combat state after a full reset.
  // Keep the old revision until navigation, so unload saves are rejected by the server.
  if (state.cheatRevision !== undefined && (data.world?.resetAllRevision || 0) > state.cheatRevision) {
    world.persistence.enabled = false;
    window.location.reload();
    return;
  }
  if (data.world && (data.world.cheatRevision || 0) !== (state.cheatRevision || 0)) {
    options = { ...options, includePlayer: true };
    state.selectedFactionId = data.player?.selectedFactionId ?? null;
    state.houseRelations = {};
    if (data.player?.player) {
      state.player.dead = Boolean(data.player.player.dead);
      world.multiplayer.localDefeated = state.player.dead;
      if (!state.player.dead) {
        ui.deathScreen.classList.add("is-hidden");
        ui.deathScreen.setAttribute("aria-hidden", "true");
      }
      state.player.selectedGearItemId = data.player.player.selectedGearItemId ?? null;
    }
  }
  if (data.world) {
    state.cheatRevision = data.world.cheatRevision || 0;
    applyWorldSnapshot(data.world);
  }

  if (!options.includePlayer && data.player) {
    syncResourceReceipts(state.player, data.player.player);
    if (world.uiReady) refreshUi();
  }

  if (options.includePlayer && data.player) {
    applyPlayerSnapshot(data.player, {
      includePosition: Boolean(options.includePlayerPosition)
    });
  }

  if (data.world && world.uiReady && !ui.rulerPanel.classList.contains("is-hidden")) renderRulerPanel();

  if (claimLoreRenownAwards(state) > 0) {
    markPlayerPersistenceDue();
    if (world.uiReady) {
      refreshUi();
    }
  }
}

function applyWorldSnapshot(snapshot) {
  world.persistence.incomeSupported = snapshot.poiIncomeTotals != null;
  state.poiIncomeTotals = snapshot.poiIncomeTotals;
  state.resourceTransferTotals = snapshot.resourceTransferTotals;
  state.deathDrops = snapshot.deathDrops ?? [];
  if (world.uiReady) syncDeathDropMeshes();
  state.factions = normalizeFactions(snapshot.factions);
  if (state.selectedFactionId && !state.factions[state.selectedFactionId]) state.selectedFactionId = null;
  state.elapsed = Math.max(state.elapsed, Number(snapshot.elapsed) || 0);
  state.market = mergeMarketSnapshot(snapshot.market, state.market);
  state.factionMembers = mergeFactionMap(snapshot.factionMembers, state.factionMembers);
  state.factionGovernance = mergeFactionMap(snapshot.factionGovernance, state.factionGovernance);
  for (const castle of CASTLES) if (!state.factions[castle.id]) state.factionGovernance[castle.id].rulerPlayerId = null;
  state.houseRelations = mergeHouseRelations(snapshot.houseRelations, state.houseRelations);
  state.factionResources = mergeFactionResources(snapshot.factionResources, state.factionResources);

  if (Array.isArray(snapshot.pois)) {
    state.pois = state.pois.map((poi) => {
      const persisted = snapshot.pois.find((entry) => entry?.id === poi.id);
      return persisted
        ? {
            ...poi,
            ownerFactionId: poi.type === "Library" ? null : persisted.ownerFactionId ?? null,
            incomeProgress: persisted.incomeProgress ?? 0,
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
  state.history = mergeHistory(snapshot.history ?? state.history, state.history);
  state.lore = normalizeLoreState(snapshot.lore ?? state.lore);
}

function applyPlayerSnapshot(snapshot, options = {}) {
  if (snapshot.selectedFactionId && state.factions[snapshot.selectedFactionId]) {
    state.selectedFactionId = snapshot.selectedFactionId;
  }

  const persisted = snapshot.player;

  if (!persisted || typeof persisted !== "object") {
    return;
  }

  state.player.gold = Number.isFinite(Number(persisted.gold)) ? Number(persisted.gold) : state.player.gold;
  state.player.prowess = Number(persisted.prowess ?? persisted.renown) || 0;
  state.player.renown = Number.isFinite(Number(persisted.renown)) ? Number(persisted.renown) : state.player.renown;
  state.player.historyRenownClaimed = Number.isFinite(Number(persisted.historyRenownClaimed))
    ? Number(persisted.historyRenownClaimed)
    : state.player.historyRenownClaimed;
  state.player.historyRenownVersion = Number.isFinite(Number(persisted.historyRenownVersion))
    ? Number(persisted.historyRenownVersion)
    : 0;
  state.player.houseName = account.authenticated ? sanitizeHouseName(persisted.houseName) : "";
  state.player.firstName = typeof persisted.firstName === "string" ? persisted.firstName.slice(0, 24) : state.player.firstName;
  state.player.lifeNumber = Number.isFinite(Number(persisted.lifeNumber))
    ? Math.max(0, Math.floor(Number(persisted.lifeNumber)))
    : state.player.lifeNumber;
  state.player.resources = mergeResourceBag(persisted.resources, state.player.resources);
  state.player.resourceReceipts = { ...persisted.resourceReceipts };
  state.player.campChestRefills = { ...persisted.campChestRefills };
  state.player.lootReceiptCount = persisted.lootReceiptCount || 0;
  state.player.lootReceipts = persisted.lootReceipts || [];
  state.player.lootDeathReceiptCount = persisted.lootDeathReceiptCount || 0;
  state.player.resourceDeathVersion = persisted.resourceDeathVersion || 0;
  state.player.resourceDeathReceipts = { ...persisted.resourceDeathReceipts };

  if (options.includePosition && persisted.position) {
    state.player.position.x = Number.isFinite(Number(persisted.position.x)) ? Number(persisted.position.x) : state.player.position.x;
    state.player.position.z = Number.isFinite(Number(persisted.position.z)) ? Number(persisted.position.z) : state.player.position.z;
  }

  if (options.includePosition && persisted.velocity) {
    state.player.velocity.x = Number.isFinite(Number(persisted.velocity.x)) ? Number(persisted.velocity.x) : 0;
    state.player.velocity.z = Number.isFinite(Number(persisted.velocity.z)) ? Number(persisted.velocity.z) : 0;
  }

  if (persisted.equipment && typeof persisted.equipment === "object") {
    state.player.equipment = { ...state.player.equipment, ...persisted.equipment };
  }

  if (Array.isArray(persisted.hotbar)) {
    state.player.hotbar = persisted.hotbar.slice(0, state.player.hotbar.length);
  }

  if (Array.isArray(persisted.inventory)) {
    state.player.inventory = persisted.inventory;
  }
  state.player.stewardInventory = Array.isArray(persisted.stewardInventory) ? persisted.stewardInventory : [];

  if (refreshPersistedWeaponRanges()) {
    markPersistenceDirty();
  }

  state.player.selectedGearItemId = persisted.selectedGearItemId ?? state.player.selectedGearItemId;
  if (state.player.firstName || state.player.houseName) {
    if (!state.player.firstName) {
      beginNewPlayerLife(state);
    } else {
      setPlayerHouseName(state, state.player.houseName);
    }
  }
  if (Number.isFinite(persisted.hp)) state.player.hp = persisted.hp;
  if (persisted.dead) {
    state.player.dead = true;
    state.player.hp = 0;
    world.multiplayer.localDefeated = true;
    world.multiplayer.respawnAt = Date.now() + PLAYER_RESPAWN_DELAY_MS;
  }
  syncFactionMemberRecord(state);
  removeLegacyStarterWeapons();
}

function refreshPersistedWeaponRanges() {
  let changed = false;

  for (const item of state.player.inventory) {
    if (item.socketedGem && item.name !== equipmentName(item)) {
      item.name = equipmentName(item);
      changed = true;
    }
    const baseline = WEAPON_STATS[item?.type];

    if (!baseline || !item?.weapon) {
      continue;
    }

    const currentRange = Number(item.weapon.range) || 0;
    if (currentRange !== baseline.range) {
      item.weapon.range = baseline.range;
      changed = true;
    }
  }

  return changed;
}

function removeLegacyStarterWeapons() {
  const removedIds = new Set(
    state.player.inventory
      .filter((item) => item?.category === "Weapon" && !item.cheatSpawned && STARTER_WEAPON_NAMES.has(item.name))
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
          blacksmith: normalizeBlacksmithProgress(store?.blacksmith, fallback[faction.id].blacksmith),
          resources: mergeResourceBag(store?.resources, fallback[faction.id].resources)
        }
      ];
    })
  );
}

function normalizeBlacksmithProgress(source, fallback = { xp: 0, level: 1 }) {
  const xp = Math.max(0, Number.isFinite(Number(source?.xp)) ? Number(source.xp) : Number(fallback?.xp) || 0);
  const level = getBlacksmithLevelFromXp(xp);
  return { xp, level };
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

function mergeHouseRelations(source, fallback = {}) {
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return fallback;
  }

  const merged = {};
  for (const [sourceHouse, targets] of Object.entries(source)) {
    const sourceHouseId = sanitizeHouseName(sourceHouse);
    if (!sourceHouseId || !targets || typeof targets !== "object" || Array.isArray(targets)) {
      continue;
    }

    merged[sourceHouseId] = {};
    for (const [targetHouse, status] of Object.entries(targets)) {
      const targetHouseId = sanitizeHouseName(targetHouse);
      if (targetHouseId && targetHouseId !== sourceHouseId && ["Ally", "Neutral", "Enemy"].includes(status)) {
        merged[sourceHouseId][targetHouseId] = status;
      }
    }
  }

  return merged;
}

function readBooleanFlag(name, fallback) {
  const value = new URLSearchParams(window.location.search).get(name);

  if (value === null || value === "") {
    return fallback;
  }

  return !["0", "false", "off", "no"].includes(value.trim().toLowerCase());
}

const diagnostics = createPerformanceDiagnostics(readPerformanceCounters);
setupRenderer();
for (;;) {
  try { await loadPersistentState(); break; }
  catch { await retryAccount("Could not load your saved game."); }
}
setupScene();
setupUi();
setupDebugTools();
finishAccountLoading(account, async () => {
  while (world.persistence.saveInFlight) await new Promise(resolve => setTimeout(resolve, 50));
  return !state.player.firstName || await savePersistentState({ includeWorld: world.persistence.dirty });
});
window.addEventListener("pagehide", () => {
  if (!state.player.firstName || world.persistence.loadInFlight || world.persistence.saveInFlight) return;
  const body = JSON.stringify(buildPersistentPayload(world.persistence.dirty));
  if (new Blob([body]).size < 60000) void fetch("/api/world/snapshot", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) void savePersistentState();
});
const minimap = createMinimap({
  root: world.outdoorRoot,
  gameFocusTarget: canvas,
  onExpand: () => { world.keys.clear(); world.pointer.buttons = 0; stopSpaceLocationAction(); releaseLockedCameraForMenu(); },
  onCollapse: () => { resumeLockedCameraAfterMenu(); },
  getPlayer: () => state.player.position,
  getPlayerHeading: () => world.playerMesh?.rotation.y ?? 0,
  getDestinations: () => [
    ...state.pois.map(poi => ({ ...poi, arrival: poi.id === LIBRARY_ID ? 48 : 32 })),
    ...FACTIONS.map(castle => ({ id: castle.id, name: castle.name, position: castleEntrance(castle), castle: true, arrival: 5 }))
  ],
  getHeight: getTerrainHeightAt,
  isWalkable: position => {
    if (getInlandLakeDistance(position.x, position.z) < 1.08) return false;
    const resolved = resolveOutdoorSceneryCollision(position, 2);
    return Math.hypot(resolved.x - position.x, resolved.z - position.z) < 0.1;
  },
  isOutdoor: () => world.sceneMode === "outdoor",
  isPlaying: () => ui.factionSelect.classList.contains("is-hidden"),
  roads: WORLD_ROUTES
});
installPerformanceProbes();
animate();

function installPerformanceProbes() {
  const p = diagnostics.profiler;
  stepSimulation = p.wrap('Simulation', stepSimulation);
  updateWorld = p.wrap('World updates', updateWorld);
  updateFrameVisuals = p.wrap('Frame visuals', updateFrameVisuals);
  updateCamera = p.wrap('Camera', updateCamera);
  updateLockedThirdPersonAim = p.wrap('Camera aiming', updateLockedThirdPersonAim);
  updateLocationPrompt = p.wrap('Interaction prompts', updateLocationPrompt);
  updatePoiFlags = p.wrap('POI flags', updatePoiFlags);
  updateCouriers = p.wrap('Courier visuals', updateCouriers);
  updateMovement = p.wrap('Player movement', updateMovement);
  updatePersistence = p.wrap('Persistence', updatePersistence);
  updateMultiplayer = p.wrap('Network sync', updateMultiplayer);
  updateRemotePlayers = p.wrap('Remote players', updateRemotePlayers);
  updatePlayerAnimation = p.wrap('Player animation', updatePlayerAnimation);
  updateHeldItemVisuals = p.wrap('Held equipment', updateHeldItemVisuals);
  updatePlayerArmorVisuals = p.wrap('Player armour', updatePlayerArmorVisuals);
  updateAttackAnimations = p.wrap('Player combat', updateAttackAnimations);
  updatePveEnemies = p.wrap('Dungeon mobs', updatePveEnemies);
  updateOutdoorDungeonMonsters = p.wrap('Outdoor mobs', updateOutdoorDungeonMonsters);
  updateRaidRoutes = p.wrap('Raid pathfinding', updateRaidRoutes);
  resolvePveMobCollisions = p.wrap('Mob collisions', resolvePveMobCollisions);
  resolvePveMobPlayerCollisions = p.wrap('Mob/player collisions', resolvePveMobPlayerCollisions);
  updatePveMobAnimation = p.wrap('Mob animation', updatePveMobAnimation);
  updatePveEnemyAttack = p.wrap('Mob attacks', updatePveEnemyAttack);
  updateProjectiles = p.wrap('Projectiles', updateProjectiles);
  updateBloodSplats = p.wrap('Blood effects', updateBloodSplats);
  updateWaterSplashEffects = p.wrap('Water effects', updateWaterSplashEffects);
  updateDroppedItems = p.wrap('Dropped loot', updateDroppedItems);
  updateStructures = p.wrap('Structures', updateStructures);
  updateStreetLampLightingSystem = p.wrap('Street lighting', updateStreetLampLightingSystem);
  updateDayNightLighting = p.wrap('Daylight / shadows', updateDayNightLighting);
  updateDungeonLifecycle = p.wrap('Dungeon lifecycle', updateDungeonLifecycle);
  updateOutpostDefenses = p.wrap('Outpost defenses', updateOutpostDefenses);
  updateEntityStatusVisibility = p.wrap('Health-bar picking', updateEntityStatusVisibility);
  updateWorldRenderDistance = p.wrap('Distance culling', updateWorldRenderDistance);
  updateRenderStats = p.wrap('Render stats / readback', updateRenderStats);
  refreshUi = p.wrap('HUD refresh', refreshUi);
  minimap.update = p.wrap('Minimap', minimap.update);
  world.worldLabels.update = p.wrap('World-label picking', world.worldLabels.update);
  world.cameraOcclusion.update = p.wrap('Camera occlusion', world.cameraOcclusion.update);
  world.renderer.render = p.wrap('Render submission', world.renderer.render);
}

function readPerformanceCounters() {
  const outdoor = world.outdoorMonsters.filter(mob => !mob.dead && !mob.removed);
  const dungeon = world.pveEnemies.filter(mob => !mob.dead && !mob.removed);
  const effects = world.bloodEffects?.effects ?? [];
  const memory = performance.memory;
  const info = world.renderer.info;
  const treeChunks = world.renderChunks.filter(mesh => mesh.visible && mesh.userData.treeDetail);
  return {
    'Scene': world.sceneMode,
    'Visible tree batches (full / distant)': world.sceneMode === 'outdoor'
      ? `${treeChunks.filter(mesh => mesh.userData.treeDetail.detailed.visible).length} / ${treeChunks.filter(mesh => mesh.userData.treeDetail.coarse.visible).length}` : 'n/a',
    'Mobs alive (outdoor / dungeon)': `${outdoor.length} / ${dungeon.length}`,
    'Outdoor mobs within 100 units': world.sceneMode === 'outdoor'
      ? outdoor.filter(mob => !mob.raidInteriorId && distance2D(mob.mesh.position, state.player.position) < 100).length : 'n/a',
    'Remote players / route jobs': `${world.remotePlayers.size} / ${world.raidRoutePlanner?.size ?? 0}`,
    'Projectiles / loot': `${world.projectiles.length} / ${world.droppedItems.length}`,
    'Blood bursts active / pooled': `${effects.filter(effect => effect.active).length} / ${effects.length}`,
    'Trail quads / water splashes': `${world.weaponTrails?.quads.length ?? 0} / ${world.waterSplashes.length}`,
    'GPU resources (geometries / textures / programs)': `${info.memory.geometries} / ${info.memory.textures} / ${info.programs?.length ?? 0}`,
    'Render size / pixel ratio': `${world.renderer.domElement.width} × ${world.renderer.domElement.height} / ${world.renderer.getPixelRatio().toFixed(2)}`,
    'JS heap used / allocated': memory ? `${(memory.usedJSHeapSize / 1048576).toFixed(1)} / ${(memory.totalJSHeapSize / 1048576).toFixed(1)} MB` : 'unavailable in this browser',
    'Network requests in flight': `publish ${world.multiplayer.publishInFlight}, poll ${world.multiplayer.pollInFlight}, save ${world.persistence.saveInFlight}`,
    'Legacy GPU readback enabled': new URLSearchParams(location.search).has('renderDiagnostics') ? 'yes (can stall frames)' : 'no'
  };
}

function setupRenderer() {
  installShadowEdgeFade();
  world.renderer.shadowMap.enabled = true;
  world.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  world.scene.background = new THREE.Color("#111814");
  world.scene.fog = new THREE.Fog("#111814", 280, 1050);

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
  ambient.name = "day-night-ambient";
  world.scene.add(ambient);
  world.lighting.ambient = ambient;

  const sun = new THREE.DirectionalLight("#fff1c9", 2.1);
  sun.name = "day-night-sun";
  world.lighting.shadows = createLocalShadows(sun);
  world.scene.add(sun, sun.target);
  world.lighting.sun = sun;
  updateDayNightLighting(0);

  const ground = createChunkedTerrain();
  ground.name = "terrain";
  ground.receiveShadow = true;
  addOutdoor(ground);
  world.meshes.terrain = ground;

  createCoastalSea();
  createInlandLake();
  createFactionHubs();
  createPoiMeshes();
  createOutdoorScenery();
  createDesignedLandmarks();
  createLongGrassPatches();
  createCastleInterior();
  createPoiInteriors();
  world.cameraOcclusion.register(world.outdoorRoot);
  world.cameraOcclusion.register(world.interiorRoot);
  world.cameraOcclusion.register(world.poiInteriorRoot);
  createPlayerMesh();
  createTowerBowView();
  world.renderChunks = [];
  world.outdoorRoot.traverse(object => { if (object.userData.renderBounds) world.renderChunks.push(object); });
}

function updateDayNightLighting(deltaSeconds) {
  const nightAmount = getNightAmount(state.elapsed);
  const sunLight = world.lighting.sun;
  const ambientLight = world.lighting.ambient;
  const isNight = nightAmount > 0.62;

  world.lighting.nightAmount = nightAmount;
  world.lighting.isNight = isNight;

  if (sunLight) {
    const anchor = state.player.position;
    const groundY = world.sceneMode === "outdoor" ? getTerrainHeightAt(anchor.x, anchor.z) : 0;
    world.lighting.shadows.update(deltaSeconds, state.elapsed, new THREE.Vector3(anchor.x, groundY, anchor.z), world.sceneMode);
  }

  if (ambientLight) {
    ambientLight.color.lerpColors(new THREE.Color("#f4e7c9"), new THREE.Color("#7f96c7"), nightAmount);
    ambientLight.groundColor.lerpColors(new THREE.Color("#253026"), new THREE.Color("#090b12"), nightAmount);
    ambientLight.intensity = THREE.MathUtils.lerp(1.1, 0.44, nightAmount);
  }

  if (world.sceneMode === "outdoor") {
    world.scene.background = new THREE.Color().lerpColors(new THREE.Color("#9fb9d8"), new THREE.Color("#080b13"), nightAmount);
    world.scene.fog.color.lerpColors(new THREE.Color("#9ea990"), new THREE.Color("#0e121a"), nightAmount);
    world.scene.fog.near = THREE.MathUtils.lerp(420, 170, nightAmount);
    world.scene.fog.far = THREE.MathUtils.lerp(1100, 850, nightAmount);
  } else {
    // All interiors have a black void, independent of the outdoor time of day.
    world.scene.background = new THREE.Color("#000000");
    world.scene.fog.color.set("#000000");
    world.scene.fog.near = 170;
    world.scene.fog.far = 850;
  }

  const terrainUniforms = world.meshes.terrain?.material?.uniforms;
  if (terrainUniforms?.nightAmount) {
    terrainUniforms.nightAmount.value = nightAmount;
    terrainUniforms.sunDirection.value.subVectors(sunLight.position, sunLight.target.position).normalize();
    terrainUniforms.sunColor.value.copy(sunLight.color);
    terrainUniforms.sunStrength.value = sunLight.intensity / 2.1;
    terrainUniforms.shadowAnchor.value.set(sunLight.target.position.x, sunLight.target.position.z);
    terrainUniforms.hazeNear.value = world.scene.fog.near;
    terrainUniforms.hazeFar.value = world.scene.fog.far;
  }

  document.body.dataset.timeOfDay = isNight ? "night" : "day";
}

function getNightAmount(elapsedSeconds) {
  const phase = ((elapsedSeconds % DAY_NIGHT_CYCLE_SECONDS) + DAY_NIGHT_CYCLE_SECONDS) % DAY_NIGHT_CYCLE_SECONDS;

  if (phase < DAY_DURATION_SECONDS) {
    return phase < DAY_DURATION_SECONDS - DAWN_DUSK_BLEND_SECONDS
      ? 0
      : smoothstep(DAY_DURATION_SECONDS - DAWN_DUSK_BLEND_SECONDS, DAY_DURATION_SECONDS, phase);
  }

  const nightPhase = phase - DAY_DURATION_SECONDS;
  return nightPhase < NIGHT_DURATION_SECONDS - DAWN_DUSK_BLEND_SECONDS
    ? 1
    : 1 - smoothstep(NIGHT_DURATION_SECONDS - DAWN_DUSK_BLEND_SECONDS, NIGHT_DURATION_SECONDS, nightPhase);
}

function addOutdoor(mesh) {
  world.outdoorRoot.add(mesh);
}

function addDistantLandmark(mesh) {
  const sphere = new THREE.Box3().setFromObject(mesh).getBoundingSphere(new THREE.Sphere());
  if (Number.isFinite(sphere.radius)) mesh.userData.renderBounds = {
    x:sphere.center.x, z:sphere.center.z, radius:sphere.radius, distance:WORLD_RENDER_DISTANCE
  };
  addOutdoor(mesh);
}

function removeFromParent(mesh) {
  if (mesh?.parent) {
    mesh.parent.remove(mesh);
  }
}

function tagInteriorCameraWall(mesh) {
  mesh.userData.interiorCameraWall = true;
  world.interiorCameraWalls.push(mesh);
  return mesh;
}

function createCoastalSea() {
  const ocean = new THREE.Mesh(createCoastalWaterGeometry(), new THREE.MeshStandardMaterial({ color: "#447c88", roughness: 0.36, metalness: 0.16 }));
  ocean.position.y = -3.5;
  ocean.name = "open-sea";
  ocean.userData.cameraOcclusionExcluded = true;
  addOutdoor(ocean);
}





function createInlandLake() {
  for (const basin of INLAND_LAKES) createLakeBasin(basin);
}

function createLakeBasin(basin) {
  const lake = new THREE.Group();
  lake.name = "inland-lake";

  // Sand is shaded directly on the terrain; a second conforming mesh
  // intersects the terrain triangles and flickers as the viewpoint changes.
  const water = new THREE.Mesh(
    createInlandLakeSurfaceGeometry(basin, 120),
    new THREE.MeshStandardMaterial({
      color: "#ffffff",
      map: createLakeWaterTexture(),
      emissive: "#07394a",
      emissiveIntensity: 0.14,
      roughness: 0.24,
      metalness: 0.02,
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );
  water.name = "inland-lake-water";
  water.position.y = basin.waterHeight;
  water.receiveShadow = true;
  lake.add(water);

  addOutdoor(lake);
}

function createInlandLakeSurfaceGeometry(lake, segments = 120) {
  const geometry = new THREE.BufferGeometry();
  const vertices = [lake.x, 0, lake.z];
  const uvs = [0.5, 0.5];
  const indices = [];
  const cosRotation = Math.cos(lake.rotation);
  const sinRotation = Math.sin(lake.rotation);

  for (let segment = 0; segment <= segments; segment += 1) {
    const angle = (segment / segments) * Math.PI * 2;
    // Bury the polygon edge inside the bank. The terrain depth test, rather
    // than a hovering polygon rim, determines where water meets land.
    const edgeScale = lake.bankScale * getInlandLakeShoreScale(angle);
    const localX = Math.cos(angle) * lake.radiusX * edgeScale;
    const localZ = Math.sin(angle) * lake.radiusZ * edgeScale;
    vertices.push(
      lake.x + localX * cosRotation - localZ * sinRotation,
      0,
      lake.z + localX * sinRotation + localZ * cosRotation
    );
    uvs.push(0.5 + Math.cos(angle) * 0.5, 0.5 + Math.sin(angle) * 0.5);

    if (segment > 0) {
      indices.push(0, segment + 1, segment);
    }
  }

  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createTerrainConformingQuadGeometry(centerX, centerZ, width, depth, rotation, yOffset = 0.08) {
  const geometry = new THREE.BufferGeometry();
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const localCorners = [
    [-width * 0.5, -depth * 0.5],
    [width * 0.5, -depth * 0.5],
    [width * 0.5, depth * 0.5],
    [-width * 0.5, depth * 0.5]
  ];
  const vertices = [];

  for (const [localX, localZ] of localCorners) {
    const x = centerX + localX * cos - localZ * sin;
    const z = centerZ + localX * sin + localZ * cos;
    vertices.push(x, getTerrainHeightAt(x, z) + yOffset, z);
  }

  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  geometry.setIndex([0, 2, 1, 0, 3, 2]);
  geometry.computeVertexNormals();
  return geometry;
}

function createFactionHubs() {
  world.castleExteriorColliders = [];
  for (const faction of FACTIONS) {
    const group = new THREE.Group();
    group.position.set(faction.position.x, getTerrainHeightAt(faction.position.x, faction.position.z), faction.position.z);

    const keep = createKeep(faction);
    keep.name = "factionKeep";
    for (const collider of keep.userData.colliders) world.castleExteriorColliders.push({ ...collider, x: faction.position.x + collider.x, z: faction.position.z + collider.z });
    keep.traverse((child) => {
      child.userData.factionId = faction.id;
    });
    group.add(keep);

    const label = createTextSprite(faction.name, faction.accent, 50);
    label.name = "castleLabel";
    label.position.set(0, 59, 0);
    group.add(label);

    addDistantLandmark(group);
    world.meshes.factions.set(faction.id, group);
    world.hoverBases.push(keep);
  }
}

function createKeep(faction) {
  return createCastleExterior(faction, Boolean(state.factions[faction.id]));
}

function createPoiMeshes() {
  world.poiExteriorColliders = [];

  for (const poi of POIS) {
    const layout = getPoiExteriorLayout(poi);
    const group = new THREE.Group();
    group.position.set(poi.position.x, getTerrainHeightAt(poi.position.x, poi.position.z), poi.position.z);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.2, 0.07, 8, 48),
      new THREE.MeshBasicMaterial({ color: "#d6a542", transparent: true, opacity: 0.65, depthWrite: false })
    );
    ring.name = "poiDoorInteractionRing";
    ring.rotation.x = Math.PI / 2;
    ring.position.set(layout.entry.x, Math.max(0.4, getTerrainHeightAt(poi.position.x + layout.entry.x, poi.position.z + layout.entry.z) - group.position.y + 0.12), layout.entry.z);
    ring.visible = false;
    group.add(ring);

    group.add(createPoiModel(poi));

    const station = getPoiWorkstation(poi);
    if (station) {
      const workbench = createPoiWorkstationModel(poi);
      const stationHeight = getTerrainHeightAt(station.x, station.z);
      workbench.position.set(station.x - poi.position.x, stationHeight - group.position.y, station.z - poi.position.z);
      const stationLabel = createTextSprite(station.name, station.color, 24);
      stationLabel.position.set(0, 10.6, -0.5);
      workbench.add(stationLabel);
      group.add(workbench);
      world.poiExteriorColliders.push({ poiId: poi.id, x: station.x, z: station.z, halfWidth: station.halfWidth, halfDepth: station.halfDepth });
    }

    for (const block of layout.blocks) {
      world.poiExteriorColliders.push({
        poiId: poi.id,
        x: poi.position.x + block.x,
        z: poi.position.z + block.z,
        halfWidth: block.width / 2,
        halfDepth: block.depth / 2
      });
    }

    const flagPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 7, 8),
      new THREE.MeshStandardMaterial({ color: "#2b241b" })
    );
    flagPole.name = "flagPole";
    flagPole.position.set(layout.blocks[0].width * 0.32, 3.5, layout.entry.z + 1.5);
    group.add(flagPole);

    const flag = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 2, 0.2),
      new THREE.MeshStandardMaterial({ color: "#6f6a5f" })
    );
    flag.name = "flag";
    flag.position.set(layout.blocks[0].width * 0.32 + 1.7, 5.8, layout.entry.z + 1.5);
    group.add(flag);

    const label = createTextSprite(poi.name, "#f4e7c9", 38);
    label.position.set(0, poi.id === LIBRARY_ID ? 54 : poi.type === "Dungeon" ? 25 : 18, -4);
    if (poi.type === "Dungeon") { flag.visible = false; flagPole.visible = false; }
    if (poi.id === LIBRARY_ID) { flag.visible = false; flagPole.visible = false; ring.visible = false; }
    group.add(label);

    addDistantLandmark(group);
    world.meshes.pois.set(poi.id, group);
  }
}

function createPoiExteriorLayout(wallColor, roofColor, blocks) {
  const main = blocks[0];
  return {
    wallColor,
    roofColor,
    blocks,
    entry: {
      x: main.x,
      z: main.z + main.depth / 2 + 2.8
    }
  };
}

function getPoiExteriorLayout(poi) {
  if (poi.id === LIBRARY_ID) return createPoiExteriorLayout("#b8af96", "#34545b", [
    { x: 0, z: -8, width: 52, depth: 40, height: 24 },
    { x: -36, z: -13, width: 18, depth: 26, height: 32 },
    { x: 36, z: -13, width: 18, depth: 26, height: 32 }
  ]);
  return POI_EXTERIOR_LAYOUTS[poi.id] ?? POI_EXTERIOR_LAYOUTS[({ Dungeon: "ebon-hollow", Quarry: "north-quarry", "Lumber Camp": "kingswood", "Wheat Field": "millfield", "Iron Mine": "blackridge", "Trade Post": "river-market" })[poi.type]] ?? createPoiExteriorLayout("#756a59", "#40332c", [
    { x: 0, z: -4, width: 46, depth: 32, height: 11 }
  ]);
}

function getPoiEntrancePosition(poi) {
  const entry = getPoiExteriorLayout(poi).entry;
  return {
    x: poi.position.x + entry.x,
    z: poi.position.z + entry.z
  };
}

function createPoiModel(poi) {
  if (poi.id === LIBRARY_ID) return createLibraryExterior();
  const group = new THREE.Group();
  const layout = getPoiExteriorLayout(poi);
  const resource = RESOURCE_LOOKUP[poi.resourceId];
  const compound = new THREE.Group();

  compound.add(createPoiArchitecture(poi, layout));

  if (poi.type !== "Trade Post" && poi.type !== "Iron Mine") {
    addPoiExteriorDetails(compound, poi, layout, resource?.color ?? "#d6a542");
  }

  if (poi.type === "Dungeon") {
    compound.name = "dungeonEntranceOpen";
    group.add(compound);
    group.add(createCollapsedDungeonExterior(layout));
  } else {
    group.add(compound);
  }

  return group;
}

function addPoiExteriorDetails(group, poi, layout, resourceColor) {
  const accent = new THREE.MeshStandardMaterial({ color: resourceColor, roughness: 0.82 });
  const wood = new THREE.MeshStandardMaterial({ color: "#5b371f", roughness: 0.9 });
  const frontZ = layout.entry.z + 0.4;

  if (poi.resourceId === "stone") {
    for (const [x, z, scale] of [[-18, frontZ, 1.5], [-24, frontZ - 4, 1.15], [18, frontZ + 1, 1.2]]) {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(scale), accent);
      rock.position.set(x, scale * 0.7, z);
      rock.castShadow = true;
      group.add(rock);
    }
  } else if (poi.resourceId === "wood") {
    for (const zOffset of [-2.2, 0, 2.2]) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 12, 10), wood);
      log.position.set(16, 0.85, frontZ + zOffset);
      log.rotation.z = Math.PI / 2;
      log.castShadow = true;
      group.add(log);
    }
  } else if (poi.resourceId === "wheat") {
    for (const [x, z] of [[-18, frontZ], [-14, frontZ + 3], [18, frontZ + 1]]) {
      const bale = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 2.3, 14), accent);
      bale.position.set(x, 1.7, z);
      bale.rotation.z = Math.PI / 2;
      bale.castShadow = true;
      group.add(bale);
    }
  } else if (poi.resourceId === "iron") {
    const annex = layout.blocks[1];
    const chimney = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.35, 11, 10), accent);
    chimney.position.set(annex.x, annex.height + 4.5, annex.z);
    chimney.castShadow = true;
    group.add(chimney);
  } else if (poi.type === "Trade Post") {
    for (const x of [-17, 17]) {
      const stall = new THREE.Mesh(new THREE.BoxGeometry(10, 3.2, 5.5), wood);
      stall.position.set(x, 1.6, frontZ + 1);
      stall.castShadow = true;
      group.add(stall);
      const canopy = new THREE.Mesh(new THREE.BoxGeometry(11, 0.75, 6.5), accent);
      canopy.position.set(x, 4.25, frontZ + 1);
      canopy.castShadow = true;
      group.add(canopy);
    }
  }
}

function createCollapsedDungeonExterior(layout) {
  const collapsed = new THREE.Group();
  collapsed.name = "dungeonEntranceCollapsed";
  collapsed.visible = false;
  const rubble = new THREE.MeshStandardMaterial({ color: "#4f504d", roughness: 0.98 });

  for (let index = 0; index < 30; index += 1) {
    const radius = 1.1 + (index % 5) * 0.38;
    const angle = index * 2.399963;
    const distance = 4 + (index % 9) * 2.25;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(radius), rubble);
    rock.position.set(Math.cos(angle) * distance, radius * 0.58, -3 + Math.sin(angle) * distance * 0.68);
    rock.rotation.set(angle * 0.21, angle * 0.37, angle * 0.13);
    rock.castShadow = true;
    rock.receiveShadow = true;
    collapsed.add(rock);
  }

  const blockedDoor = new THREE.Mesh(new THREE.BoxGeometry(9, 7, 3), rubble);
  blockedDoor.position.set(layout.entry.x, 3.2, layout.entry.z - 3);
  blockedDoor.rotation.set(0.12, 0.18, -0.08);
  blockedDoor.castShadow = true;
  collapsed.add(blockedDoor);
  return collapsed;
}

function createOutdoorScenery() {
  const scenery = createBiomeSceneryLayout();
  const group = createInstancedLandscape(scenery, getTerrainHeightAt);
  world.sceneryColliders = scenery.map((entry) => ({
    type: entry.type === "conifer" ? "tree" : entry.type,
    x: entry.x, z: entry.z,
    radius: (entry.type === "rock" ? 1.7 : 0.8) * entry.scale,
    height: (entry.type === "rock" ? 3.4 : 14) * entry.scale,
    groundY: getTerrainHeightAt(entry.x, entry.z),
    ...(entry.type === "rock" ? rockColliderProfile(entry) : {})
  }));
  world.sceneryGrid = new SpatialGrid(world.sceneryColliders);
  world.earthMagic = new EarthRockControl(group, world.sceneryColliders, getTerrainHeightAt,
    () => { world.sceneryGrid = new SpatialGrid(world.sceneryColliders); }, resolveEarthRockSmash);
  world.meshes.scenery = group;
  addOutdoor(group);
  document.body.dataset.biomeScenery = String(scenery.length);
}

function createDesignedLandmarks() {
  for (const poi of POIS) {
    const heightAt = (x,z) => getTerrainHeightAt(poi.position.x+x, poi.position.z+z);
    const setting = createPoiSetting(poi, heightAt);
    setting.position.set(poi.position.x, heightAt(0,0), poi.position.z);
    addDistantLandmark(setting);
  }
  world.outdoorRoot.add(world.campLights);
  for (const [index, camp] of MOB_CAMPS.entries()) {
    const mesh = createCampModel(index);
    mesh.userData.campId = camp.id;
    world.campModels.push(mesh);
    mesh.userData.chests.forEach((chest, chestIndex) => {
      chest.userData.lootId = `${camp.id}:${chestIndex}`;
      const label = createTextSprite("Loot chest", "#dfb68a", 10);
      label.position.y = 4;
      chest.add(label);
      chest.userData.label = label;
      world.campChests.push(chest);
      updateCampChest(chest, state.player);
    });
    mesh.position.set(camp.position.x, getTerrainHeightAt(camp.position.x, camp.position.z), camp.position.z);
    const label = createTextSprite(camp.name, "#dfb68a", 30);
    label.position.y = 13; mesh.add(label); addDistantLandmark(mesh);
  }
  const stone = new THREE.MeshStandardMaterial({ color: "#b2aa92", roughness: 0.95 });
  const court = new THREE.Mesh(new THREE.CylinderGeometry(66,66,0.3,64), stone);
  court.receiveShadow = true;
  court.position.set(0, getTerrainHeightAt(0,0)+0.1, 0); addDistantLandmark(court);
  // A clear processional approach framed by four obelisks.
  for (const x of [-24,24]) for (const z of [36,60]) {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.6,1.8,9,4), stone);
    pillar.castShadow = pillar.receiveShadow = true;
    pillar.position.set(x,getTerrainHeightAt(x,z)+4.5,z); addDistantLandmark(pillar);
  }
}

function addOutdoorSceneryEntry(group, scenery, includeCollider) {
  const mesh = createOutdoorSceneryMesh(scenery);
  mesh.position.set(scenery.x, getTerrainHeightAt(scenery.x, scenery.z), scenery.z);
  mesh.rotation.y = scenery.rotation ?? ((Math.abs(scenery.x * 13 + scenery.z * 7) % 100) / 100) * Math.PI * 2;
  group.add(mesh);

  if (!includeCollider) {
    return;
  }

  const colliderProfile = getOutdoorSceneryColliderProfile(scenery);
  world.sceneryColliders.push({
    type: scenery.type,
    x: scenery.x,
    z: scenery.z,
    radius: colliderProfile.radius,
    height: colliderProfile.height,
    groundY: mesh.position.y,
    ...(scenery.type === "rock" ? rockColliderProfile({ ...scenery, rotation: mesh.rotation.y }) : {})
  });
}

function createOutdoorSceneryMesh(scenery) {
  if (scenery.type === "palm") {
    return createOutdoorPalmTree(scenery.scale);
  }

  return scenery.type === "tree"
    ? createOutdoorTree(scenery.scale)
    : createOutdoorRock(scenery.scale, rockVariant(scenery));
}

function getOutdoorSceneryColliderProfile(scenery) {
  if (scenery.type === "palm") {
    return { radius: 1.05 * scenery.scale, height: 16.8 * scenery.scale };
  }

  if (scenery.type === "tree") {
    return { radius: 1.35 * scenery.scale, height: 9.8 * scenery.scale };
  }

  return { radius: 1.7 * scenery.scale, height: 3.4 * scenery.scale };
}

function createBiomeSceneryLayout() {
  const scenery = [];
  for (const [regionIndex,region] of REGIONS.entries()) {
    for (let index = 0; index < region.count * 3; index++) {
      const angle = index * 2.399963;
      const radius = Math.sqrt(hash2d(index,regionIndex+341));
      const x = region.x + Math.cos(angle)*region.radiusX*radius;
      const z = region.z + Math.sin(angle)*region.radiusZ*radius;
      if (!canPlaceBiomeSceneryAt(x,z,region.scenery,scenery)) continue;
      if (getInlandLakeDistance(x,z) < 1.3) continue;
      const type = region.id === "alpine" && (getTerrainHeightAt(x,z) > 125 || index % 4 === 0) ? "rock" : region.scenery;
      scenery.push({ type, x,z,scale: (type === "rock" ? 0.5 : 0.75) + Math.pow(hash2d(index,regionIndex+991), type === "rock" ? 1.7 : 1.45) * (type === "rock" ? 5.75 : region.id === "forest" ? 4.5 : type === "palm" ? 2.3 : 3.3), variant: index % 3, rotation: angle });
    }
  }
  // Resource sites sit in their landscape instead of isolated on bare grass.
  for (const [poiIndex,poi] of POIS.entries()) {
    if (poi.type === "Library" || poi.type === "Wheat Field" || poi.type === "Trade Post") continue;
    const type = poi.type === "Lumber Camp" ? "tree" : "rock";
    for (let index = 0; index < 38; index++) {
      const angle = index * 2.399963;
      const radius = 75+hash2d(index,poiIndex+700)*95;
      const x = poi.position.x+Math.cos(angle)*radius, z = poi.position.z+Math.sin(angle)*radius;
      if (canPlaceBiomeSceneryAt(x,z,type,scenery)) scenery.push({type,x,z,scale: type === "rock" ? 0.85+Math.pow(hash2d(index,53),1.35)*4.55 : 1.3+hash2d(index,61)*3.4,variant:index%3,rotation:angle});
    }
  }
  return scenery;
}

function canPlaceBiomeSceneryAt(x, z, type, existingScenery) {
  if (MOB_CAMPS.some(camp => distance2D({x,z},camp.position) < 55)) return false;
  if (Math.hypot(x,z) < 125) return false;
  if (getInlandLakeDistance(x,z) < 1.3) return false;
  if (POIS.some(poi => poi.type === "Wheat Field" && distance2D({x,z},poi.position) < 110)) return false;
  if (distanceToCoast(x, z) < 70) {
    return false;
  }

  if (distanceToOutdoorRoad(x, z) < (type === "rock" ? 16 : 12)) {
    return false;
  }

  for (const poi of POIS) {
    if (Math.hypot(x - poi.position.x, z - poi.position.z) < poi.radius + 24) {
      return false;
    }
  }

  for (const faction of FACTIONS) {
    if (Math.hypot(x - faction.position.x, z - faction.position.z) < Math.max(faction.bufferRadius + 16, CASTLE_FOUNDATION_RADIUS + 12)) {
      return false;
    }
  }

  const minimumSpacing = type === "rock" ? 13 : type === "palm" ? 12 : 10;
  return existingScenery.every((entry) => Math.hypot(x - entry.x, z - entry.z) >= minimumSpacing);
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

function createOutdoorPalmTree(scale = 1) {
  const group = new THREE.Group();
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: "#8a5930", roughness: 0.94 });
  const trunkAccent = new THREE.MeshStandardMaterial({ color: "#5b351c", roughness: 0.98 });
  const leafMaterial = new THREE.MeshStandardMaterial({ color: "#2f783c", roughness: 0.88, side: THREE.DoubleSide });
  const leafAccent = new THREE.MeshStandardMaterial({ color: "#58a34f", roughness: 0.86, side: THREE.DoubleSide });
  const leafSunlit = new THREE.MeshStandardMaterial({ color: "#73b85b", roughness: 0.84, side: THREE.DoubleSide });
  const coconutMaterial = new THREE.MeshStandardMaterial({ color: "#594022", roughness: 0.9 });

  const trunkHeight = 12.8 * scale;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.27 * scale, 0.62 * scale, trunkHeight, 11),
    trunkMaterial
  );
  trunk.position.set(0.28 * scale, trunkHeight * 0.5, 0);
  trunk.rotation.z = -0.045;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  group.add(trunk);

  for (let ringIndex = 1; ringIndex < 10; ringIndex += 1) {
    const t = ringIndex / 10;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(THREE.MathUtils.lerp(0.55, 0.29, t) * scale, 0.045 * scale, 5, 11),
      trunkAccent
    );
    ring.rotation.x = Math.PI / 2;
    ring.rotation.y = -0.045;
    ring.position.set((t - 0.5) * 0.58 * scale, t * trunkHeight, 0);
    ring.castShadow = true;
    group.add(ring);
  }

  const crownY = trunkHeight + 0.05 * scale;
  const crownX = -0.02 * scale;
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(0.82 * scale, 1), leafAccent);
  crown.position.set(crownX, crownY, 0);
  crown.scale.set(1.35, 0.8, 1.35);
  crown.castShadow = true;
  group.add(crown);

  for (let index = 0; index < 11; index += 1) {
    const angle = (index / 11) * Math.PI * 2;
    const length = (5.6 + hash2d(index, 283) * 1.55) * scale;
    const frond = new THREE.Mesh(
      createPalmFrondGeometry(length, (1.05 + hash2d(index, 281) * 0.32) * scale, (1.45 + hash2d(index, 293) * 0.7) * scale),
      index % 3 === 0 ? leafSunlit : index % 2 === 0 ? leafAccent : leafMaterial
    );
    frond.position.set(crownX, crownY + (index % 3) * 0.11 * scale, 0);
    frond.rotation.y = angle;
    frond.rotation.z = (hash2d(index, 307) - 0.5) * 0.08;
    frond.castShadow = true;
    frond.receiveShadow = true;
    group.add(frond);
  }

  for (let index = 0; index < 4; index += 1) {
    const angle = (index / 4) * Math.PI * 2 + 0.35;
    const coconut = new THREE.Mesh(new THREE.SphereGeometry(0.34 * scale, 8, 6), coconutMaterial);
    coconut.position.set(
      crownX + Math.cos(angle) * 0.72 * scale,
      crownY - 0.72 * scale,
      Math.sin(angle) * 0.78 * scale
    );
    coconut.castShadow = true;
    group.add(coconut);
  }

  return group;
}

function createPalmFrondGeometry(length, width, drop) {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const uvs = [];
  const indices = [];
  const segments = 7;

  for (let index = 0; index <= segments; index += 1) {
    const t = index / segments;
    const x = t * length;
    const y = Math.sin(t * Math.PI) * length * 0.08 - Math.pow(t, 1.7) * drop;
    const halfWidth = Math.sin(t * Math.PI) * width * 0.5 + width * 0.08 * (1 - t);
    vertices.push(x, y, -halfWidth, x, y, halfWidth);
    uvs.push(t, 0, t, 1);

    if (index < segments) {
      const a = index * 2;
      indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }

  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createOutdoorRock(scale = 1, variant = 0) {
  const { geometry, material } = createRockPart(variant);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.scale.setScalar(scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
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
  const flowers = [], hedges = [];

  for (let attempt = 0; attempt < LONG_GRASS_PATCH_COUNT * 5 && patches < LONG_GRASS_PATCH_COUNT; attempt += 1) {
    const radius = 24 + Math.sqrt(hash2d(attempt + 13, 41)) * (PLAYABLE_HALF - 42);
    const angle = attempt * 2.399963 + hash2d(attempt + 5, 103) * 0.85;
    let centerX = Math.cos(angle) * radius + (hash2d(attempt, 71) - 0.5) * 18;
    let centerZ = Math.sin(angle) * radius + (hash2d(attempt, 97) - 0.5) * 18;

    // Mix meadow islands with roadside verges, so detail is visible while travelling.
    if (attempt % 2 === 0) {
      const route = WORLD_ROUTES[Math.floor(attempt/2) % WORLD_ROUTES.length];
      const i = Math.min(route.length-2, Math.floor(hash2d(attempt,419)*(route.length-1)));
      const a=route[i], b=route[i+1], dx=b.x-a.x, dz=b.z-a.z, length=Math.hypot(dx,dz)||1;
      const offset=(12+hash2d(attempt,421)*24)*(attempt%4===0?1:-1);
      centerX=a.x-dz/length*offset; centerZ=a.z+dx/length*offset;
    }
    if (!canPlaceLongGrassAt(centerX, centerZ, 8.5)) {
      continue;
    }

    patches += 1;
    const patchRadius = 3.5 + hash2d(attempt, 151) * 6.5;
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

      if (blade % 7 === 0 && attempt % 3 !== 0) {
        flowers.push({x,z,scale:0.85+hash2d(bladeSeed,431)*0.75,rotation:bladeAngle,color:attempt%4});
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
  lightBlades.castShadow = false;
  darkBlades.castShadow = false;
  lightBlades.receiveShadow = true;
  darkBlades.receiveShadow = true;
  group.add(partitionInstances(lightBlades, 120, 220), partitionInstances(darkBlades, 120, 220));

  // Broken, gently curving hedgerows follow the terrain per shrub.
  for (const [routeIndex,route] of WORLD_ROUTES.entries()) {
    for (let i=4;i<route.length-4;i+=9) {
      const a=route[i], b=route[i+1], dx=b.x-a.x, dz=b.z-a.z, length=Math.hypot(dx,dz)||1;
      const side=(i+routeIndex)%2?1:-1;
      for(let shrub=0;shrub<7;shrub++) {
        const along=(shrub-3)*3.1, across=side*(19+Math.sin(shrub*0.6)*1.8);
        const x=a.x+dx/length*along-dz/length*across, z=a.z+dz/length*along+dx/length*across;
        if (!canPlaceLongGrassAt(x,z,5)) continue;
        hedges.push({x,z,rotation:-Math.atan2(dz,dx),scale:0.85+hash2d(i+shrub,routeIndex+443)*0.35,variant:(shrub+routeIndex)%3});
      }
    }
  }
  group.add(createGroundCoverInstances(hedges,flowers,getTerrainHeightAt));
  group.userData.coverCounts = { patches, blades:lightIndex+darkIndex, flowers:flowers.length, hedges:hedges.length };
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
  if (Math.hypot(x,z)<76 || MOB_CAMPS.some(c=>Math.hypot(x-c.position.x,z-c.position.z)<38)) return false;
  if (POIS.some(p=>Math.hypot(x-p.position.x,z-p.position.z)<Math.max(p.radius+18,p.type==='Wheat Field'?105:0))) return false;
  if (FACTIONS.some(f=>Math.hypot(x-f.position.x,z-f.position.z)<Math.max(f.bufferRadius+16,CASTLE_FOUNDATION_RADIUS+12))) return false;
  if (distanceToOutdoorRoad(x,z,FOOTPATHS)<3.4) return false;
  if (distanceToCoast(x, z) < 70) {
    return false;
  }

  if (distanceToOutdoorRoad(x, z) < 8) {
    return false;
  }

  if (getTerrainGrassAmountAt(x, z) < 0.78) {
    return false;
  }

  for (const scenery of world.sceneryGrid.query(x-12,z-12,x+12,z+12)) {
    const clearance = scenery.radius + (scenery.type === "rock" ? rockPadding : 2);
    if (Math.hypot(x - scenery.x, z - scenery.z) < clearance) {
      return false;
    }
  }

  return true;
}

// Placement only needs clearance within 24 units; index the route segments.
function distanceToOutdoorRoad(x, z, routes = WORLD_ROUTES) {
  let nearest = Infinity;
  for (const {a,b} of GROUND_ROUTE_GRIDS.get(routes).query(x-24,z-24,x+24,z+24)) {
    const dx=b.x-a.x,dz=b.z-a.z;
    const t=clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz || 1),0,1);
    nearest=Math.min(nearest,Math.hypot(x-a.x-dx*t,z-a.z-dz*t));
  }
  return nearest;
}

function createCastleInterior() {
  const root = world.interiorRoot;
  const stone = surface("stone", "#b3a58c");
  const darkStone = surface("stone", "#847c6b");
  const wood = surface("wood", "#795337");
  const runner = new THREE.MeshStandardMaterial({ color: "#743328", roughness: 0.74 });
  const gold = new THREE.MeshStandardMaterial({ color: "#caa44b", roughness: 0.42, metalness: 0.18 });

  const floor = new THREE.Mesh(new THREE.BoxGeometry(93, 0.5, 74), darkStone);
  floor.position.set(-11.5, -0.25, 10);
  floor.receiveShadow = true;
  root.add(floor);

  const backWall = tagInteriorCameraWall(new THREE.Mesh(new THREE.BoxGeometry(93, 18, 1), stone));
  backWall.position.set(-11.5, 9, -27);
  backWall.castShadow = true;
  root.add(backWall);

  const frontWallLeft = tagInteriorCameraWall(new THREE.Mesh(new THREE.BoxGeometry(49, 16, 1), stone));
  frontWallLeft.position.set(-33.5, 8, 47);
  root.add(frontWallLeft);

  const frontWallRight = tagInteriorCameraWall(new THREE.Mesh(new THREE.BoxGeometry(26, 16, 1), stone));
  frontWallRight.position.set(22, 8, 47);
  root.add(frontWallRight);

  const leftWall = tagInteriorCameraWall(new THREE.Mesh(new THREE.BoxGeometry(1, 16, 74), stone));
  leftWall.position.set(-58, 8, 10);
  root.add(leftWall);

  const rightWallBack = tagInteriorCameraWall(new THREE.Mesh(new THREE.BoxGeometry(1, 16, 15), stone));
  rightWallBack.position.set(35, 8, -19.5);
  root.add(rightWallBack);

  const rightWallFront = tagInteriorCameraWall(new THREE.Mesh(new THREE.BoxGeometry(1, 16, 51), stone));
  rightWallFront.position.set(35, 8, 21.5);
  root.add(rightWallFront);

  const blacksmithDoorLintel = tagInteriorCameraWall(new THREE.Mesh(new THREE.BoxGeometry(1.2, 4.4, 8), stone));
  blacksmithDoorLintel.position.set(35, 13.8, -8);
  blacksmithDoorLintel.castShadow = true;
  root.add(blacksmithDoorLintel);

  const archTop = tagInteriorCameraWall(new THREE.Mesh(new THREE.BoxGeometry(18, 5, 1.2), stone));
  archTop.position.set(0, 13.5, 47);
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

  for (const [x, z] of [[-14, -18], [14, -18], [-14, 15], [14, 15]]) {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.45, 15, 10), stone);
    pillar.position.set(x, 7.5, z);
    pillar.castShadow = true;
    root.add(pillar);
  }

  for (const [x, z] of [[-24, -26], [24, -26], [-57, 0], [34, 0], [-14, 46], [14, 46]]) {
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

  createBlacksmithRoom(root, { stone, darkStone, wood, gold });

  root.add(createCastleInteriorDetails());
  root.traverse(mesh => { if (mesh.isMesh && [stone,darkStone,wood].includes(mesh.material)) interiorUv(mesh.geometry); });

  const steward = createStewardNpc();
  root.add(steward);
  world.stewardNpcs.push(steward);
}

function createBlacksmithRoom(root, materials) {
  const { stone, darkStone, wood, gold } = materials;
  const iron = new THREE.MeshStandardMaterial({ color: "#777b7f", roughness: 0.46, metalness: 0.45 });
  const coal = new THREE.MeshStandardMaterial({ color: "#11100f", roughness: 0.92 });
  const forgeGlow = new THREE.MeshStandardMaterial({
    color: "#f06a24",
    emissive: "#d84d18",
    emissiveIntensity: 1.45,
    roughness: 0.36
  });

  const roomFloor = new THREE.Mesh(new THREE.BoxGeometry(50, 0.5, 40), darkStone);
  roomFloor.position.set(60, -0.25, -8);
  roomFloor.receiveShadow = true;
  root.add(roomFloor);

  const outerWall = tagInteriorCameraWall(new THREE.Mesh(new THREE.BoxGeometry(1, 14, 40), stone));
  outerWall.position.set(85, 7, -8);
  outerWall.castShadow = true;
  root.add(outerWall);

  const backWall = tagInteriorCameraWall(new THREE.Mesh(new THREE.BoxGeometry(51, 14, 1), stone));
  backWall.position.set(60, 7, -28);
  backWall.castShadow = true;
  root.add(backWall);

  const frontWall = tagInteriorCameraWall(new THREE.Mesh(new THREE.BoxGeometry(51, 14, 1), stone));
  frontWall.position.set(60, 7, 12);
  frontWall.castShadow = true;
  root.add(frontWall);

  const threshold = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.1, 3.4), gold);
  threshold.position.set(35.6, 0.12, -8);
  threshold.receiveShadow = true;
  root.add(threshold);

  for (const z of [-11.8, -4.2]) {
    const jamb = tagInteriorCameraWall(new THREE.Mesh(new THREE.BoxGeometry(1.35, 7.8, 0.55), stone));
    jamb.position.set(35, 3.9, z);
    jamb.castShadow = true;
    root.add(jamb);
  }

  const forgeBase = new THREE.Mesh(new THREE.BoxGeometry(5.4, 2.1, 3.2), darkStone);
  forgeBase.position.set(61, 1.05, -16);
  forgeBase.castShadow = true;
  root.add(forgeBase);

  const forgeBed = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.32, 2.2), coal);
  forgeBed.position.set(61, 2.26, -16);
  forgeBed.castShadow = true;
  root.add(forgeBed);

  const forgeFire = new THREE.Mesh(new THREE.ConeGeometry(1.05, 1.85, 9), forgeGlow);
  forgeFire.position.set(61, 3.22, -16);
  forgeFire.castShadow = true;
  root.add(forgeFire);

  const forgeLight = new THREE.PointLight("#f07a2d", 2.25, 26);
  forgeLight.position.set(60, 4.4, -14.7);
  root.add(forgeLight);

  const anvilBase = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.85, 2.1, 8), wood);
  anvilBase.position.set(50, 1.05, -8.5);
  anvilBase.castShadow = true;
  root.add(anvilBase);

  const anvil = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.7, 1.15), iron);
  anvil.position.set(50, 2.42, -8.5);
  anvil.castShadow = true;
  root.add(anvil);

  const horn = new THREE.Mesh(new THREE.ConeGeometry(0.38, 1.05, 10), iron);
  horn.position.set(51.62, 2.42, -8.5);
  horn.rotation.z = -Math.PI * 0.5;
  horn.castShadow = true;
  root.add(horn);

  const workbench = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.65, 1.8), wood);
  workbench.position.set(55, 1.45, -3);
  workbench.castShadow = true;
  root.add(workbench);

  for (const offset of [-1.8, 0, 1.8]) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.7, 0.18), iron);
    blade.position.set(55 + offset, 2.95, -3.05);
    blade.rotation.z = offset * 0.1;
    blade.castShadow = true;
    root.add(blade);

    const hilt = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.16, 0.22), gold);
    hilt.position.set(55 + offset, 1.82, -3.05);
    hilt.castShadow = true;
    root.add(hilt);
  }

  const rack = new THREE.Mesh(new THREE.BoxGeometry(0.35, 4.8, 4.6), wood);
  rack.position.set(63.8, 2.4, -5.5);
  rack.castShadow = true;
  root.add(rack);

  for (const z of [-7, -5.5, -4]) {
    const spear = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 4.8, 8), iron);
    spear.position.set(63.52, 2.75, z);
    spear.rotation.z = 0.18;
    spear.castShadow = true;
    root.add(spear);
  }

  const blacksmith = createBlacksmithNpc();
  root.add(blacksmith);
  world.blacksmithNpcs.push(blacksmith);
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
  if (poi.id === LIBRARY_ID) return createLibraryInterior();
  const isDungeon = poi.type === "Dungeon";
  if (isDungeon) {
    withDungeon(poi.id, () => addDungeonInterior(group));
    return group;
  }
  const width = POI_HALL.width;
  const depth = POI_HALL.depth;
  const halfWidth = width / 2;
  const halfDepth = depth / 2;
  const floorMaterial = surface(poi.type === "Lumber Camp" ? "wood" : "stone", "#8b8270");
  const wallMaterial = surface("stone", "#b2a58c");
  const trimMaterial = new THREE.MeshStandardMaterial({ color: resourceColor, roughness: 0.72 });

  const floor = new THREE.Mesh(interiorUv(new THREE.BoxGeometry(width, 0.45, depth)), floorMaterial);
  floor.position.y = -0.24;
  floor.receiveShadow = true;
  group.add(floor);

  const exit = new THREE.Mesh(new THREE.BoxGeometry(16, 0.1, 4), trimMaterial);
  exit.position.set(0, 0.08, halfDepth - 2);
  exit.receiveShadow = true;
  group.add(exit);

  const backWall = tagInteriorCameraWall(new THREE.Mesh(interiorUv(new THREE.BoxGeometry(width, 14, 1)), wallMaterial));
  backWall.position.set(0, 7, -halfDepth);
  backWall.castShadow = true;
  group.add(backWall);

  for (const side of [-1, 1]) {
    const wall = tagInteriorCameraWall(new THREE.Mesh(interiorUv(new THREE.BoxGeometry(1, 14, depth)), wallMaterial));
    wall.position.set(side * halfWidth, 7, 0);
    wall.castShadow = true;
    group.add(wall);

    const frontNib = tagInteriorCameraWall(new THREE.Mesh(interiorUv(new THREE.BoxGeometry(halfWidth - 6, 14, 1)), wallMaterial));
    frontNib.position.set(side * (halfWidth + 6) / 2, 7, halfDepth);
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

  group.add(createPoiInteriorArt(poi.type));
  if (poi.type === "Trade Post") addRiverMarketInterior(group);

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

function addRiverMarketInterior(group) {
  group.add(createMarketFurnishings());

  for (const npc of TRADE_NPCS) {
    const npcMesh = createTradeNpc(npc);
    group.add(npcMesh);
    world.tradeNpcs.push(npcMesh);
  }
}

function withDungeon(id, action) {
  const previous = world.dungeonContextId;
  world.dungeonContextId = id;
  try { return action(); } finally { world.dungeonContextId = previous; }
}

function isDungeonEntranceSafe(position = state.player.position, padding = 0) {
  const room = world.dungeon.layout?.entranceRoom;
  if (world.dungeon.gate?.open) return false;
  return !!room && Math.abs(position.x - room.x) <= room.width / 2 + padding
    && Math.abs(position.z - room.z) <= room.depth / 2 + padding;
}

function addDungeonInterior(group) {
  rebuildProceduralDungeon(group);
}

function rebuildProceduralDungeon(group) {
  removeDungeonContent();
  world.pveEnemies = [];
  world.dungeon.layout = generateDungeonLayout();
  world.dungeon.treasure = null;
  world.dungeon.chests = [];
  world.dungeon.contentRoot = createProceduralDungeonContent(world.dungeon.layout);
  updateRoomDoors(world.dungeon, surface, 0);
  world.dungeon.sealRoot.traverse(child => {
    if (child.isMesh) { child.userData.dungeonId = world.dungeon.id; tagInteriorCameraWall(child); }
  });
  world.cameraOcclusion.register(world.dungeon.contentRoot);
  group.add(world.dungeon.contentRoot);
  document.body.dataset.dungeonStatus = world.dungeon.status;
  document.body.dataset.dungeonGeneration = String(world.dungeon.generation);
}

function removeDungeonContent() {
  for (const barrel of world.dungeon.barrels ?? []) disposeBarrelObject(barrel.mesh);
  for (const drop of world.dungeon.barrelDrops ?? []) disposeBarrelObject(drop.mesh);
  for (const effect of world.dungeon.barrelEffects ?? []) disposeBarrelObject(effect.mesh);
  world.dungeon.barrels = [];
  world.dungeon.barrelDrops = [];
  world.dungeon.barrelEffects = [];
  world.dungeon.gate = null;
  if (world.dungeon.sealRoot) {
    world.dungeon.sealRoot.traverse(child => { child.geometry?.dispose(); child.material?.dispose(); });
    world.dungeon.sealRoot.removeFromParent();
  }
  world.dungeon.sealRoot = null; world.dungeon.roomDoors = [];
  world.dungeon.lavaExposure = 0;
  for (const enemy of world.pveEnemies) enemy.spells?.dispose();
  for (const drop of [...world.droppedItems]) if (!drop.shared && drop.activePoiInteriorId === world.dungeon.id) removeDroppedItem(drop.id);
  if (world.dungeon.contentRoot) {
    removeFromParent(world.dungeon.contentRoot);
  }

  world.dungeon.contentRoot = null;
  world.dungeon.treasure = null;
  world.dungeon.chests = [];
  world.interiorCameraWalls = world.interiorCameraWalls.filter((wall) => wall.userData?.dungeonId !== world.dungeon.id);
}

function generateDungeonLayout() {
  return buildDungeonLayout(Math.random);
}

function createProceduralDungeonContent(layout) {
  const root = new THREE.Group();
  root.name = "proceduralDungeon";
  const stoneMat = surface("stone", "#686875");
  const floorMat = surface("stone", "#5a5d62");
  const corridorMat = surface("stone", "#64636a");
  const runeMat = new THREE.MeshStandardMaterial({ color: "#7d54b8", emissive: "#30145d", emissiveIntensity: 1.15 });
  const goldMat = new THREE.MeshStandardMaterial({ color: "#caa44b", roughness: 0.42, metalness: 0.18 });
  const boneMat = new THREE.MeshStandardMaterial({ color: "#b8aa8d", roughness: 0.9 });
  const woodMat = new THREE.MeshStandardMaterial({ color: "#5a3826", roughness: 0.84 });

  for (const corridor of layout.corridors) {
    for (const side of [-1,1]) {
      const wall = new THREE.Mesh(interiorUv(new THREE.BoxGeometry(corridor.horizontal ? corridor.width : 1, 10.8, corridor.horizontal ? 1 : corridor.depth)),stoneMat);
      wall.position.set(corridor.x+(corridor.horizontal?0:side*6.5),1.4,corridor.z+(corridor.horizontal?side*6.5:0));
      wall.userData.dungeonId = world.dungeon.id;
      wall.castShadow = true; wall.receiveShadow = true;
      tagInteriorCameraWall(wall); root.add(wall);
    }
    const gaps = layout.lava.filter(g=>g.corridor===corridor);
    for (const gap of gaps) {
      const lava = new THREE.Mesh(new THREE.BoxGeometry(gap.width,.3,gap.depth), new THREE.MeshStandardMaterial({color:0xff6508,emissive:0xff3300,emissiveIntensity:2}));
      lava.position.set(gap.x,-1.5,gap.z); root.add(lava);
    }
    if (gaps.length) {
      const warning = createTextSprite('Lava burns and slows - Space to jump out', '#ffb35c', 24);
      warning.position.set(corridor.x,4,corridor.z); root.add(warning);
    }
    for (const part of subtractRects(corridor,gaps)) {
      const floor=new THREE.Mesh(interiorUv(new THREE.BoxGeometry(part.width,4,part.depth)),corridorMat);
      floor.position.set(part.x,-1.81,part.z); floor.receiveShadow=true; root.add(floor);
    }
  }

  for (const room of layout.rooms) {
    addDungeonRoom(root, room, layout, { stoneMat, floorMat, runeMat, goldMat, boneMat, woodMat });
  }

  if (GAME_FLAGS.pve) {
    for (const spawn of createDungeonEnemySpawns(layout)) {
      root.add(createPveEnemy(spawn));
    }
  }

  return root;
}

function addDungeonRoom(root, room, layout, materials) {
  const floor = new THREE.Mesh(interiorUv(new THREE.BoxGeometry(room.width, 4, room.depth)), materials.floorMat);
  floor.position.set(room.x, -1.82, room.z);
  floor.receiveShadow = true;
  root.add(floor);

  root.add(createDungeonInteriorDetails(room));
  addDungeonBarrels(root, room);
  addDungeonRoomWalls(root, room, layout, materials.stoneMat);
  if (room.kind === "entrance") {
    world.dungeon.gate = createDungeonGate(room, DUNGEON_CORRIDOR_WIDTH, surface);
    root.add(world.dungeon.gate.root);
    world.dungeon.gate.root.traverse(child => {
      if (child.isMesh) { child.userData.dungeonId = world.dungeon.id; tagInteriorCameraWall(child); }
    });
  }

  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const column = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.95, 6.8, 8), materials.stoneMat);
    column.position.set(room.x + dx * (room.width / 2 - 1.4), 3.4, room.z + dz * (room.depth / 2 - 1.4));
    column.castShadow = true;
    root.add(column);
  }

  const lightCount = room.kind === "entrance" ? 2 : room.kind === "end" ? 4 : 1 + Math.floor(Math.random() * 2);
  for (let index = 0; index < lightCount; index += 1) {
    addDungeonRoomLight(root, room, index);
  }

  if (room.kind === "end") {
    root.add(createBossArena(room));
  } else if (room.kind === "treasure" || (room.kind === "main" && Math.random() < .45)) {
    const chest = new THREE.Group();
    chest.userData.opened = false;
    const base = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.7, 2.1), materials.woodMat);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.4, 2.3), materials.goldMat);
    lid.position.y = 1.05;
    chest.add(base, lid);
    chest.userData.lid = lid;
    chest.userData.roomId = room.id;
    chest.userData.gold = Math.round(room.kind === "treasure" ? randomBetween(100, 180) : randomBetween(8, 22));
    const label = createTextSprite(room.kind === "treasure" ? "Guarded Treasure" : "Supply Chest", "#f4d77a", 24);
    label.position.y = 4;
    chest.add(label);
    chest.userData.label = label;
    world.dungeon.chests.push(chest);
    chest.position.set(room.x + randomBetween(-room.width * 0.25, room.width * 0.25), 0.92, room.z + randomBetween(-room.depth * 0.22, room.depth * 0.22));
    chest.rotation.y = randomBetween(-0.3, 0.3);
    chest.castShadow = true;
    root.add(chest);
  }

  for (let index = 0; index < (room.kind === "entrance" ? 1 : 3); index += 1) {
    const bone = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, randomBetween(2.4, 4.2), 6), materials.boneMat);
    bone.position.set(room.x + randomBetween(-room.width * 0.34, room.width * 0.34), 0.34, room.z + randomBetween(-room.depth * 0.32, room.depth * 0.32));
    bone.rotation.set(Math.PI * 0.5, 0, Math.random() * Math.PI);
    root.add(bone);
  }
}

function addDungeonBarrels(root, room) {
  world.dungeon.barrels ??= [];
  for (const placement of barrelPlacements(room)) {
    const mesh = createBarrel(placement.trapped);
    mesh.position.set(placement.x, .2, placement.z);
    mesh.rotation.y = placement.rotation;
    root.add(mesh);
    world.dungeon.barrels.push({ id: `barrel-${world.dungeon.id}-${world.dungeon.barrels.length}`,
      name: 'Barrel', isBarrel: true, mesh, trapped: placement.trapped,
      hp: BARREL_HP, maxHp: BARREL_HP, radius: 1.5, hitMinY: 0, hitMaxY: 3.2, dead: false });
  }
}

function getActiveDungeonBarrels() {
  return world.sceneMode === 'poiInterior' && getActivePoiInterior()?.type === 'Dungeon'
    ? (world.dungeon.barrels ?? []).filter(barrel => !barrel.dead) : [];
}

function constrainDungeonBarrels(position) {
  const result = { ...position };
  for (const barrel of getActiveDungeonBarrels()) {
    const dx = result.x-barrel.mesh.position.x, dz = result.z-barrel.mesh.position.z;
    const distance = Math.hypot(dx,dz), clearance = barrel.radius + .8;
    if (distance < clearance) {
      result.x = barrel.mesh.position.x + (distance > .001 ? dx/distance : 1)*clearance;
      result.z = barrel.mesh.position.z + (distance > .001 ? dz/distance : 0)*clearance;
    }
  }
  return result;
}

function damageDungeonBarrel(barrel, amount) {
  if (barrel.dead || !Number.isFinite(amount) || amount <= 0) return;
  barrel.hp = Math.max(0, barrel.hp-amount);
  if (barrel.hp > 0) return;
  barrel.dead = true; // Mark before the blast so clustered barrels cannot recurse forever.
  const origin = barrel.mesh.position.clone();
  disposeBarrelObject(barrel.mesh);
  if (!barrel.trapped) {
    world.dungeon.barrelDrops ??= [];
    for (let i=0;i<3;i++) {
      const heart = i > 0, mesh = createBarrelPickup(heart), angle = i*Math.PI*2/3;
      mesh.position.set(origin.x + Math.cos(angle)*2, 1, origin.z + Math.sin(angle)*2);
      world.dungeon.contentRoot.add(mesh);
      world.dungeon.barrelDrops.push({ mesh, heart, value: heart ? 12 : 4 + Math.floor(Math.random()*7), age: 0 });
    }
    combatAudio.impact(.8);
    return;
  }
  const fire = new THREE.Mesh(new THREE.SphereGeometry(1,16,10), new THREE.MeshBasicMaterial({ color: '#ff9a32', transparent: true, opacity: .85, depthWrite: false }));
  fire.position.copy(origin).y += 1.4;
  world.dungeon.contentRoot.add(fire);
  world.dungeon.barrelEffects ??= [];
  world.dungeon.barrelEffects.push({ mesh: fire, age: 0 });
  combatAudio.impact(3);
  world.combatFeedback.cameraImpulse = Math.max(world.combatFeedback.cameraImpulse, .065*barrelBlastStrength(origin, state.player.position));
  const targets = [...getActiveCombatEnemies(), getLocalPlayerCombatTarget()];
  for (const target of targets) {
    if (target.dead || target.removed) continue;
    const position = target.isLocalPlayer ? state.player.position : target.mesh.position;
    const strength = barrelBlastStrength(origin, position);
    if (!strength || crossesClosedDungeonGate(world.dungeon.gate, origin, position)) continue;
    const direction = new THREE.Vector3(position.x-origin.x,0,position.z-origin.z);
    if (direction.lengthSq() < .001) direction.set(1,0,0);
    direction.normalize();
    damageCombatTarget(target, Math.round(42*strength), 'barrel explosion', {
      sourceName: 'a trapped barrel', previousPosition: origin, direction,
      knockback: 14*strength, comboName: 'overheadFinish', unavoidable: true
    });
    // Unavoidable area damage bypasses shield handling, including its knockback path.
    if (target.isLocalPlayer) applyKnockbackToLocalPlayer(origin, 14*strength);
  }
  for (const nearby of getActiveDungeonBarrels()) {
    const strength = barrelBlastStrength(origin, nearby.mesh.position);
    if (strength && !crossesClosedDungeonGate(world.dungeon.gate, origin, nearby.mesh.position)) damageDungeonBarrel(nearby, 42*strength);
  }
}

function updateDungeonBarrels(deltaSeconds) {
  for (const barrel of getActiveDungeonBarrels()) {
    if (!barrel.burning) continue;
    barrel.burnAge = (barrel.burnAge ?? 0) + deltaSeconds;
    updateElementalEffect(barrel.burning, barrel.burnAge % 2, true);
    damageDungeonBarrel(barrel, 4 * deltaSeconds);
  }
  if (world.sceneMode !== 'poiInterior' || getActivePoiInterior()?.type !== 'Dungeon') return;
  for (const effect of world.dungeon.barrelEffects ?? []) {
    effect.age += deltaSeconds;
    effect.mesh.scale.setScalar(1 + Math.min(1,effect.age/.25)*BARREL_BLAST_RADIUS);
    effect.mesh.material.opacity = Math.max(0,.85*(1-effect.age/.55));
    if (effect.age >= .55) disposeBarrelObject(effect.mesh);
  }
  world.dungeon.barrelEffects = (world.dungeon.barrelEffects ?? []).filter(effect => effect.age < .55);
  for (const drop of world.dungeon.barrelDrops ?? []) {
    if (world.dungeon.layout?.lava?.some(gap => inside(drop.mesh.position,gap))) {
      drop.collected = true; disposeBarrelObject(drop.mesh); continue;
    }
    drop.age += deltaSeconds;
    drop.mesh.rotation.y += deltaSeconds*1.4;
    drop.mesh.position.y = 1 + Math.sin(drop.age*3)*.18;
    const player = state.player;
    if (drop.age < .35 || player.dead || distance2D(player.position, drop.mesh.position) > 2.2) continue;
    if (drop.heart && player.hp >= player.maxHp) continue;
    if (drop.heart) {
      const healed = Math.min(drop.value, player.maxHp - player.hp);
      player.hp += healed;
      world.multiplayer.heartHealingTotal = (world.multiplayer.heartHealingTotal ?? 0) + healed;
      markPlayerPersistenceDue();
    }
    else player.gold += drop.value;
    drop.collected = true;
    disposeBarrelObject(drop.mesh);
    markPersistenceDirty();
    updatePlayerHealthBar();
    refreshUi();
  }
  world.dungeon.barrelDrops = (world.dungeon.barrelDrops ?? []).filter(drop => !drop.collected);
}

function addDungeonRoomWalls(root, room, layout, material) {
  const wallHeight = 7.4;
  const wallThickness = 0.9;
  const sides = [
    { side: "north", x: room.x, z: room.z - room.depth / 2, width: room.width, depth: wallThickness },
    { side: "south", x: room.x, z: room.z + room.depth / 2, width: room.width, depth: wallThickness },
    { side: "west", x: room.x - room.width / 2, z: room.z, width: wallThickness, depth: room.depth },
    { side: "east", x: room.x + room.width / 2, z: room.z, width: wallThickness, depth: room.depth }
  ];

  for (const side of sides) {
    if (hasDungeonConnectionOnSide(room, side.side, layout)) {
      continue;
    }

    const wall = tagInteriorCameraWall(new THREE.Mesh(interiorUv(new THREE.BoxGeometry(side.width, wallHeight, side.depth)), material));
    wall.userData.dungeonWall = true;
    wall.userData.dungeonId = world.dungeon.id;
    wall.userData.dungeonRoomId = room.id;
    wall.position.set(side.x, wallHeight / 2, side.z);
    wall.castShadow = true;
    root.add(wall);
  }
}

function hasDungeonConnectionOnSide(room, side, layout) {
  for (const roomId of room.connections) {
    const other = layout.rooms.find((entry) => entry.id === roomId);
    if (!other) {
      continue;
    }

    if (side === "north" && other.z < room.z) return true;
    if (side === "south" && other.z > room.z) return true;
    if (side === "west" && other.x < room.x) return true;
    if (side === "east" && other.x > room.x) return true;
  }

  return false;
}

function addDungeonRoomLight(root, room, index) {
  const x = room.x + (index % 2 === 0 ? -1 : 1) * (room.width / 2 - 1.2);
  const z = room.z + (index < 2 ? -1 : 1) * room.depth * 0.24;
  // Preserve room illumination without the floating cone and wooden bracket props.
  const light = new THREE.PointLight("#a779ff", room.kind === "end" ? 1.75 : 1.05, room.kind === "end" ? 32 : 22, 1.7);
  light.position.set(x, 4.2, z);
  root.add(light);
}

function createDungeonEnemySpawns(layout) {
  const rooms = layout.rooms.filter((room) => room.kind !== "entrance" && room.kind !== "end" && room.kind !== "treasure");
  const spawns = [];
  const encounters = rooms.flatMap(room => Array(room.kind === 'combat' ? 4 + Math.min(2, getOnlinePlayerCount()-1) : room.kind === 'barracks' ? 3 : 1).fill(room));
  for (const [index, room] of encounters.entries()) {
    const depthBonus = Math.max(0, room.gy) * 5;
    const archetype = index % 5 === 4 ? "raider" : "creature";
    const template = getPveMobTemplate(archetype, index);
    spawns.push({
      roomId: room.id,
      archetype,
      name: template.name,
      position: {
        x: room.x + randomBetween(-room.width * 0.26, room.width * 0.26),
        z: room.z + randomBetween(-room.depth * 0.22, room.depth * 0.22)
      },
      hp: Math.round(template.hp + depthBonus),
      color: template.color,
      skinColor: template.skinColor,
      speed: template.speed,
      radius: template.radius
    });
  }

  const element = randomItem(Object.keys(SORCERERS));
  const boss = SORCERERS[element];
  spawns.push({ archetype: "raider", bossElement: element, name: boss.name,
    position: { x: layout.endRoom.x, z: layout.endRoom.z }, hp: boss.hp,
    color: boss.color, speed: 4, radius: 2.1 });
  return spawns;
}

function updateDungeonEncounters(deltaSeconds = 0) {
  if (world.sceneMode !== 'poiInterior' || getActivePoiInterior()?.type !== 'Dungeon') return;
  const dungeon = world.dungeon, layout = dungeon.layout;
  if (!layout) return;
  for (const room of layout.rooms.filter(room => room.kind === 'combat' && !room.cleared)) {
    if (!room.active && !state.player.dead && inside(state.player.position, room, -5)) {
      const present = world.pveEnemies.filter(enemy => !enemy.dead && inside(enemy.mesh.position, room));
      if (!present.length && world.pveEnemies.some(enemy => !enemy.dead && enemy.roomId === room.id)) continue;
      room.encounterEnemies = new Set(present);
      room.active = true;
      flash('The doors seal. Defeat every guard to reopen them and unlock the treasure.');
    }
    if (room.active && !world.pveEnemies.some(enemy => !enemy.dead && (room.encounterEnemies?.has(enemy) || inside(enemy.mesh.position, room)))) {
      room.cleared = true;
      flash('Room cleared. The seals break and its treasure is unlocked.');
    }
    // A failed attempt can be entered again after respawning.
    if (state.player.dead && !room.cleared) room.active = false;
  }
  updateRoomDoors(dungeon, surface, deltaSeconds);
  const contact = !state.player.dead && world.playerMotion.verticalOffset <= -1.2 && layout.lava.some(gap => inside(state.player.position,gap));
  const exposure = stepLavaExposure(contact,dungeon.lavaExposure ?? 0,deltaSeconds);
  dungeon.lavaExposure = exposure.elapsed;
  if (exposure.damage) {
    damageLocalPlayerTarget({mesh:world.playerMesh},exposure.damage,'lava',{sourceName:'lava',unavoidable:true,statusTick:true});
  }
}

function beginDungeonCollapse() {
  if (world.dungeon.status !== "active") return;
  world.dungeon.status = "collapsing";
  world.dungeon.collapseTimer = DUNGEON_COLLAPSE_WARNING_SECONDS;
  world.dungeon.warningTimer = 15;
  document.body.dataset.dungeonStatus = world.dungeon.status;
  document.body.dataset.dungeonCollapseTimer = String(Math.ceil(world.dungeon.collapseTimer));
}

function updateDungeonLifecycle(deltaSeconds) {
  for (const poi of state.pois.filter(poi => poi.type === "Dungeon")) {
    withDungeon(poi.id, () => updateSingleDungeonLifecycle(deltaSeconds));
  }
  let warning = document.getElementById("dungeon-collapse-warning");
  const active = world.sceneMode === "poiInterior" && getActivePoiInterior()?.type === "Dungeon" && world.dungeon.status === "collapsing";
  if (active && !warning) {
    warning = document.createElement("div"); warning.id = "dungeon-collapse-warning";
    document.body.append(warning);
  }
  if (warning) {
    warning.hidden = !active;
    if (active) {
      const seconds = Math.ceil(world.dungeon.collapseTimer);
      warning.textContent = "DUNGEON COLLAPSING — Escape! " + Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0");
    }
  }
}

function updateSingleDungeonLifecycle(deltaSeconds) {
  if (world.dungeon.status === "collapsing") {
    world.dungeon.collapseTimer = Math.max(0, world.dungeon.collapseTimer - deltaSeconds);
    world.dungeon.warningTimer = Math.max(0, world.dungeon.warningTimer - deltaSeconds);
    document.body.dataset.dungeonStatus = "collapsing";
    document.body.dataset.dungeonCollapseTimer = String(Math.ceil(world.dungeon.collapseTimer));
    pulseCollapsingDungeon(deltaSeconds);

    if (world.sceneMode === "poiInterior" && world.activePoiInteriorId === world.dungeon.id && world.dungeon.warningTimer <= 0) {
      world.dungeon.warningTimer = 15;
      flash(`${Math.ceil(world.dungeon.collapseTimer)} seconds until the dungeon collapses.`);
    }

    if (world.dungeon.collapseTimer <= 0) {
      collapseDungeon();
    }
    return;
  }

  if (world.dungeon.status === "collapsed") {
    world.dungeon.respawnTimer = Math.max(0, world.dungeon.respawnTimer - deltaSeconds);
    document.body.dataset.dungeonStatus = "collapsed";
    document.body.dataset.dungeonRespawnTimer = String(Math.ceil(world.dungeon.respawnTimer));

    if (world.dungeon.respawnTimer <= 0) {
      regenerateDungeon();
    }
    return;
  }

  document.body.dataset.dungeonStatus = "active";
  delete document.body.dataset.dungeonCollapseTimer;
  delete document.body.dataset.dungeonRespawnTimer;
}

function pulseCollapsingDungeon(deltaSeconds) {
  const root = world.dungeon.contentRoot;

  if (!root) {
    return;
  }

  const visible = world.sceneMode === "poiInterior" && world.activePoiInteriorId === world.dungeon.id;
  const urgency = 1 - world.dungeon.collapseTimer / DUNGEON_COLLAPSE_WARNING_SECONDS;
  if (visible) {
    updateCollapseDebris(root, state.player.position, deltaSeconds, urgency);
    world.combatFeedback.cameraImpulse = Math.max(world.combatFeedback.cameraImpulse ?? 0, 0.002 + urgency * 0.008);
  }
  const pulse = 0.55 + Math.sin(state.elapsed * 12) * 0.45;
  root.position.x = Math.sin(state.elapsed * 17) * 0.09;
  root.position.z = Math.cos(state.elapsed * 13) * 0.09;

  for (const light of root.children.filter((child) => child.isPointLight)) {
    light.intensity = Math.max(0.35, light.intensity + (pulse - 0.5) * deltaSeconds * 3);
  }
}

function collapseDungeon() {
  world.dungeon.status = "collapsed";
  world.dungeon.collapseTimer = 0;
  world.dungeon.respawnTimer = DUNGEON_RESPAWN_SECONDS;
  world.dungeon.warningTimer = 0;
  updateDungeonExteriorMesh();
  clearDungeonEnemies();
  removeDungeonContent();

  if (world.sceneMode === "poiInterior" && world.activePoiInteriorId === world.dungeon.id) {
    damageLocalPlayerTarget({ mesh: world.playerMesh }, 100000, "collapse", { sourceName: "the collapsing dungeon", unavoidable: true });
    leavePoiInterior();
    flash("You were caught in the collapse. The dungeon will reopen in 5 minutes.");
  } else {
    flash(`${state.pois.find(poi => poi.id === world.dungeon.id)?.name} collapsed. It will reopen in 5 minutes.`);
  }
}

function regenerateDungeon() {
  const dungeonGroup = world.meshes.poiInteriors.get(world.dungeon.id);
  world.dungeon.status = "active";
  world.dungeon.generation += 1;
  world.dungeon.collapseTimer = 0;
  world.dungeon.respawnTimer = 0;
  world.dungeon.warningTimer = 0;
  updateDungeonExteriorMesh();

  if (dungeonGroup) {
    rebuildProceduralDungeon(dungeonGroup);
  }

  flash(`${state.pois.find(poi => poi.id === world.dungeon.id)?.name} has reopened.`);
}

function clearDungeonEnemies() {
  for (const enemy of world.pveEnemies) {
    removeFromParent(enemy.mesh);
  }

  world.pveEnemies = [];
}

function updateDungeonExteriorMesh() {
  const mesh = world.meshes.pois.get(world.dungeon.id);
  const openEntrance = mesh?.getObjectByName("dungeonEntranceOpen");
  const collapsedEntrance = mesh?.getObjectByName("dungeonEntranceCollapsed");
  const collapsed = world.dungeon.status === "collapsed";

  if (openEntrance) {
    openEntrance.visible = !collapsed;
  }

  if (collapsedEntrance) {
    collapsedEntrance.visible = collapsed;
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

  return Math.max(0, (state.player.prowess || 0) + state.player.renown + remoteRenown);
}

function getPveMobCap() {
  return world.sceneMode === "outdoor" ? Math.max(MOB_CAMPS.length * (getNightAmount(state.elapsed) > 0.62 ? NIGHT_CAMP_CAP : 3), getOnlinePlayerCount() * 4) : Math.max(1, getOnlinePlayerCount() * 4);
}

function getAlivePveMobCount() {
  if (world.sceneMode === "poiInterior" && getActivePoiInterior()?.type === "Dungeon") {
    return world.pveEnemies.filter((enemy) => !enemy.dead).length;
  }

  if (world.sceneMode === "outdoor") {
    return world.outdoorMonsters.filter((enemy) => !enemy.dead).length;
  }

  return [...world.pveEnemies, ...world.outdoorMonsters].filter((enemy) => !enemy.dead).length;
}

function createRandomPveWeapon(powerScale = 1, type = null, lootGrade = null) {
  const definition = type
    ? PVE_WEAPON_DEFINITIONS.find(item => item.type === type)
    : randomItem(PVE_WEAPON_DEFINITIONS.filter(item => item.type !== 'Staff'));
  const baseStats = WEAPON_STATS[definition.type];
  const renownCap = Math.max(1, Math.floor(getOnlineRenownTotal()));
  const materialCap = clamp(Math.floor(renownCap / 45) + 1, 1, METAL_TIERS.length);
  const material = METAL_TIERS[lootGrade === 'supply' ? 0 : lootGrade === 'treasure' ? materialCap-1 : Math.floor(Math.random() * materialCap)];
  const quality = material.power;
  const maxDurability = Math.round(clamp(definition.maxDurability * randomBetween(0.72, 1.18), 25, renownCap + 80));
  const weapon = {
    range: baseStats.range,
    damage: Math.round(clamp(baseStats.damage * quality * randomBetween(0.72, 1.25) * powerScale, 1, renownCap * 1.35)),
    penetration: Math.round(clamp(baseStats.penetration * quality * randomBetween(0.65, 1.25) * powerScale, 0, renownCap * 1.2)),
    frequency: roundStat(clamp(baseStats.frequency * randomBetween(0.75, 1.2), 0.35, Math.min(2.4, renownCap))),
    speed: roundStat(clamp(baseStats.speed * randomBetween(0.75, 1.2), 0.45, Math.min(2.4, renownCap))),
    knockback: roundStat(clamp(baseStats.knockback * quality * randomBetween(0.65, 1.35), 0, renownCap))
  };

  return {
    id: createId("mob-weapon"),
    name: `${material.name} ${definition.type}`,
    material: material.name,
    type: definition.type,
    category: "Weapon",
    rarity: material.quality,
    weapon,
    durability: maxDurability,
    maxDurability
  };
}

function createRandomPveArmor(slot = null, lootGrade = null) {
  const armorType = slot
    ? PVE_ARMOR_TYPES.find((entry) => entry.slot === slot)
    : randomItem(PVE_ARMOR_TYPES);

  if (!armorType) {
    return null;
  }

  const material = lootGrade === 'supply' ? PVE_ARMOR_MATERIALS[0] : lootGrade === 'treasure' ? PVE_ARMOR_MATERIALS.filter(m => m.tier <= Math.max(2, Math.floor(getOnlineRenownTotal()/45)+2)).at(-1) : getRandomPveArmorMaterial();
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
    name: `${material.name} ${armorType.type === "Feet" ? "Boots" : armorType.type}`,
    material: material.name,
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

function getPveMobTemplate(archetype, sequence = 0) {
  const templates = archetype === "raider" ? PVE_RAIDER_TEMPLATES : PVE_CREATURE_TEMPLATES;
  return templates[sequence % templates.length];
}

function choosePveMobArchetype(forceRaider = false) {
  return forceRaider || Math.random() < PVE_RAIDER_SPAWN_CHANCE ? "raider" : "creature";
}

function createPveMobLoadout(archetype) {
  if (archetype === "raider") {
    const weapon = createRandomPveWeapon(1.28);
    weapon.weapon.damage = Math.max(13, weapon.weapon.damage);
    weapon.weapon.penetration = Math.max(2, weapon.weapon.penetration);
    return {
      weapon,
      armor: createRandomPveArmorSet(),
      naturalAttack: null,
      goldMin: 4,
      goldMax: 9
    };
  }

  return {
    weapon: null,
    armor: [],
    naturalAttack: {
      range: randomBetween(2.05, 2.45),
      damage: Math.round(randomBetween(6, 10)),
      penetration: 0,
      frequency: randomBetween(0.72, 0.94),
      speed: 1,
      knockback: randomBetween(1.2, 2.6)
    },
    goldMin: 1,
    goldMax: 4
  };
}

function getPveEnemyAttackStats(enemy) {
  return enemy?.weapon?.weapon ?? enemy?.naturalAttack ?? WEAPON_STATS["Empty Hand"];
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
    durability: rollMobLootDurability(item)
  };
}

function cloneDroppedArmor(item) {
  return {
    ...item,
    id: createId("item"),
    armor: { ...item.armor },
    durability: rollMobLootDurability(item)
  };
}

function rollMobLootDurability(item) {
  const minimum = Math.max(1, Math.ceil(item.maxDurability * 0.15));
  const maximum = Math.max(minimum, Math.floor(item.maxDurability * 0.65));
  return Math.floor(randomBetween(minimum, maximum + 1));
}

function getDroppedLootItems(enemy) {
  if (enemy.bossElement) return [createElementalGem(enemy.bossElement, createId("gem")), structuredClone(enemy.weapon)];
  const droppedWeapon = enemy.weapon ? cloneDroppedWeapon(enemy.weapon) : null;
  const droppedArmor = (enemy.armor ?? []).map(cloneDroppedArmor);
  const goldAmount = Math.max(1, Math.round(randomBetween(enemy.goldMin ?? 1, enemy.goldMax ?? 3)));
  const gold = {
    id: createId("mob-gold"),
    name: `${goldAmount} Gold`,
    type: "Gold",
    category: "Currency",
    rarity: "Common",
    goldAmount
  };
  return [gold, droppedWeapon, ...droppedArmor].filter(Boolean);
}

function spawnDroppedLootItems(items, position, sourceName = "mob") {
  if (!items.length) {
    return;
  }

  const baseX = Number(position?.x) || 0;
  const baseZ = Number(position?.z) || 0;

  items.forEach((item, index) => {
    const angle = (index / Math.max(1, items.length)) * Math.PI * 2 + randomBetween(-0.28, 0.28);
    const radius = items.length === 1 ? 0.45 : randomBetween(0.75, 1.95);
    const x = baseX + Math.cos(angle) * radius;
    const z = baseZ + Math.sin(angle) * radius;
    const groundY = world.sceneMode === 'outdoor' ? getTerrainHeightAt(x, z) : 0;
    const dropId = createId("drop");
    const mesh = createDroppedItemMesh(item, dropId);

    mesh.position.set(x, groundY + 0.22, z);
    mesh.rotation.y = angle + Math.PI * 0.5;
    world.scene.add(mesh);
    world.droppedItems.push({
      id: dropId,
      expiresAt: Date.now() + DROPPED_LOOT_LIFETIME_MS,
      item,
      mesh,
      position: { x, z },
      baseY: groundY + 0.22,
      phase: Math.random() * Math.PI * 2,
      sourceName,
      sceneMode: world.sceneMode, activePoiInteriorId: world.activePoiInteriorId, interiorFactionId: world.interiorFactionId
    });
  });

  document.body.dataset.droppedItems = String(world.droppedItems.length);
}

function syncDeathDropMeshes() {
  const drops = state.deathDrops = pruneExpiredLoot(state.deathDrops);
  const ids = new Set(drops.map(drop => drop.id));
  for (const existing of [...world.droppedItems]) if (existing.shared && !ids.has(existing.id)) removeDroppedItem(existing.id);
  for (const drop of drops) {
    if (world.droppedItems.some(existing => existing.id === drop.id)) continue;
    const mesh = createDroppedItemMesh(drop.item, drop.id);
    const floor = drop.sceneMode === "outdoor" ? Math.max(getTerrainHeightAt(drop.position.x, drop.position.z), drop.elevation || 0) : 0;
    const baseY = floor + 0.22;
    mesh.position.set(drop.position.x, baseY, drop.position.z);
    mesh.visible = sameLootScene(world, drop);
    world.scene.add(mesh);
    world.droppedItems.push({ ...drop, shared: true, mesh, baseY, phase: Math.random() * Math.PI * 2 });
  }
  document.body.dataset.droppedItems = String(world.droppedItems.length);
}

async function pickupSharedDeathDrop(drop) {
  if (isLootExpired(drop)) { removeDroppedItem(drop.id); return; }
  if (drop.pending) return;
  if (!world.multiplayer.enabled) {
    state.player.inventory.push(drop.item);
    state.player.selectedGearItemId = drop.item.id;
    state.deathDrops = state.deathDrops.filter(entry => entry.id !== drop.id);
    removeDroppedItem(drop.id);
    refreshUi();
    flash(`Picked up ${drop.item.name}.`);
    return;
  }
  drop.pending = true;
  try {
    const data = await fetchPersistentJson("/api/world/pickup-drop", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: state.player.id, dropId: drop.id })
    });
    applyPersistentPayload(data);
    flash(data.message);
  } catch {
    flash("Could not confirm pickup. Reconnect to check your inventory.");
  } finally {
    drop.pending = false;
  }
}

function createDroppedItemMesh(item, dropId) {
  const group = new THREE.Group();
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: item.goldAmount ? "#ffd65a" : item.weapon ? "#f2c45d" : "#8fc4ff",
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

  const visual = item.goldAmount
    ? createDroppedGoldVisual(item)
    : item.weapon
      ? createDroppedWeaponVisual(item)
      : createDroppedArmorVisual(item);
  visual.position.y = 0.42;
  group.add(visual);

  group.userData.droppedItemId = dropId;
  trackLootResources(group);
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

function createDroppedGoldVisual(item) {
  const group = new THREE.Group();
  const gold = new THREE.MeshStandardMaterial({ color: "#e7b83d", roughness: 0.3, metalness: 0.58 });
  const coinCount = Math.min(5, Math.max(2, Math.ceil((item.goldAmount ?? 1) / 2)));

  for (let index = 0; index < coinCount; index += 1) {
    const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.08, 16), gold);
    coin.position.set((index % 2) * 0.28 - 0.14, index * 0.08, (index % 3) * 0.08 - 0.08);
    coin.rotation.z = Math.PI * 0.5;
    coin.castShadow = true;
    group.add(coin);
  }

  return group;
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
  } else if (slot === "legs") {
    for (const side of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.14, 0.85, 10), material);
      leg.position.x = side * 0.22;
      leg.castShadow = true;
      group.add(leg);
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

  const range = WEAPON_STATS[weaponItem.type]?.range ?? weaponItem.weapon.range;
  return isProjectileWeapon(weaponItem.type) ? Math.min(16, Math.max(fallback, range * 0.8)) : Math.max(fallback, range);
}

function getPveAttackCooldown(weaponItem, fallback = 1.4) {
  const frequency = weaponItem?.weapon?.frequency;
  return frequency ? Math.max(0.55, 1 / frequency) : fallback;
}

function createPveEnemyWeaponMesh(weaponItem, handAnchor = null) {
  const mount = new THREE.Group();
  const mesh = createHeldItemMesh(weaponItem, "right");
  mount.name = "pveWeaponVisual";
  mount.add(mesh);
  const basePosition = handAnchor ? [0, 0, 0.03] : [1.05, 2.65, 0.25];
  const baseRotation = handAnchor ? [0, 0, 0] : [0.08, -0.08, -0.55];
  mount.position.set(...basePosition);
  mount.rotation.set(...baseRotation);
  mount.scale.setScalar(0.82);
  mount.userData.basePosition = basePosition;
  mount.userData.baseRotation = baseRotation;
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

  weapon.position.set(...(weapon.userData.basePosition ?? [1.05, 2.65, 0.25]));
  weapon.rotation.set(...(weapon.userData.baseRotation ?? [0.08, -0.08, -0.55]));
  weapon.scale.setScalar(0.82);
}

function setPveEnemyWeapon(enemy, weaponItem) {
  const current = enemy.mesh.getObjectByName("pveWeaponVisual");

  if (current) {
    current.parent?.remove(current);
  }

  enemy.weapon = weaponItem;
  const attackStats = getPveEnemyAttackStats(enemy);
  enemy.attackRange = weaponItem
    ? getPveAttackRange(weaponItem, enemy.attackRange ?? 2.4)
    : attackStats.range ?? 2.2;
  enemy.attackCooldown = weaponItem
    ? getPveAttackCooldown(weaponItem, enemy.attackCooldown ?? 1.4)
    : Math.max(0.55, 1 / Math.max(0.1, attackStats.frequency ?? 0.8));
  resetPveEnemyAttackState(enemy);

  if (!weaponItem) {
    return;
  }

  const handAnchor = enemy.rig?.rightArm?.userData?.hand ?? null;
  const visual = createPveEnemyWeaponMesh(weaponItem, handAnchor);
  visual.traverse((child) => {
    child.userData.pveEnemyId = enemy.id;
    child.userData.statusEntityKey = getPveStatusKey(enemy.id);
    if (child.isMesh) {
      child.castShadow = true;
    }
  });
  (handAnchor ?? enemy.mesh).add(visual);
}

function setPveEnemyArmor(enemy, armorItems = []) {
  enemy.armor = armorItems;
  enemy.rig.armorVisuals ??= createArmorVisualState();
  for (const slotId of ARMOR_VISUAL_SLOT_IDS) {
    syncArmorSlotVisual(enemy.rig.armorVisuals, enemy.rig, slotId,
      armorItems.find(item => item.armor?.slot === slotId && item.durability > 0) ?? null,
      getPveStatusKey(enemy.id));
  }
}

function createPveHumanoidRig(color, skinColor, weapon) {
  const visualRoot = new THREE.Group();
  visualRoot.name = "pveHumanoidRig";
  const cloth = new THREE.MeshStandardMaterial({ color, roughness: 0.74 });
  const skin = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.86 });
  const leather = new THREE.MeshStandardMaterial({ color: "#3c291d", roughness: 0.88 });
  const dark = new THREE.MeshStandardMaterial({ color: "#171411", roughness: 0.68 });

  const body = createPlayerTorso(cloth, leather);
  body.position.y = 3.15;
  visualRoot.add(body);

  const belt = new THREE.Mesh(createRoundedBoxGeometry(1.72, 0.2, 1.02, 0.07, 3), leather);
  belt.position.y = 2.54;
  belt.castShadow = true;
  visualRoot.add(belt);

  const leftLeg = createPlayerLeg(HAND_CONFIG.left.side, leather, dark);
  const rightLeg = createPlayerLeg(HAND_CONFIG.right.side, leather, dark);
  visualRoot.add(leftLeg, rightLeg);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 5.15, 0.16);
  visualRoot.add(headGroup);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.56, 14, 10), skin);
  head.castShadow = true;
  headGroup.add(head);

  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 6), dark);
    eye.position.set(side * 0.21, 0.08, 0.51);
    headGroup.add(eye);
  }

  const leftArm = createPlayerArm(HAND_CONFIG.left.side, skin, cloth);
  const rightArm = createPlayerArm(HAND_CONFIG.right.side, skin, cloth);
  visualRoot.add(leftArm, rightArm);

  if (weapon) {
    rightArm.userData.hand.add(createPveEnemyWeaponMesh(weapon, rightArm.userData.hand));
  }

  return {
    kind: "humanoid",
    visualRoot,
    body,
    headGroup,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    animationTime: Math.random() * Math.PI * 2,
    moveAmount: 0
  };
}

function createPveCreatureRig(color, skinColor) {
  const visualRoot = new THREE.Group();
  visualRoot.name = "pveCreatureRig";
  const hide = new THREE.MeshStandardMaterial({ color, roughness: 0.9 });
  const skin = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.82 });
  const claw = new THREE.MeshStandardMaterial({ color: "#d7cfb0", roughness: 0.55 });
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: "#ffb348",
    emissive: "#d55720",
    emissiveIntensity: 0.75,
    roughness: 0.3
  });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.78, 1.55, 5, 12), hide);
  body.position.set(0, 3.18, -0.12);
  body.rotation.x = Math.PI * 0.42;
  body.scale.set(1.05, 1, 0.9);
  visualRoot.add(body);

  const shoulders = new THREE.Mesh(new THREE.SphereGeometry(0.88, 12, 8), hide);
  shoulders.position.set(0, 3.62, 0.18);
  shoulders.scale.set(1.35, 0.78, 0.9);
  visualRoot.add(shoulders);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 3.72, 1.08);
  headGroup.rotation.x = -0.2;
  visualRoot.add(headGroup);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.58, 12, 9), skin);
  head.scale.set(1.02, 0.82, 1.18);
  headGroup.add(head);
  const muzzle = new THREE.Mesh(new THREE.ConeGeometry(0.33, 0.72, 8), skin);
  muzzle.position.set(0, -0.12, 0.67);
  muzzle.rotation.x = Math.PI * 0.5;
  headGroup.add(muzzle);

  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), eyeMaterial);
    eye.position.set(side * 0.23, 0.12, 0.52);
    headGroup.add(eye);
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 7), skin);
    ear.position.set(side * 0.42, 0.38, 0.02);
    ear.rotation.z = side * -0.48;
    headGroup.add(ear);
  }

  const leftArm = createPlayerArm(HAND_CONFIG.left.side, skin, hide);
  const rightArm = createPlayerArm(HAND_CONFIG.right.side, skin, hide);
  for (const arm of [leftArm, rightArm]) {
    arm.position.set(Math.sign(arm.position.x) * 0.9, 3.72, 0.35);
    arm.scale.set(1.08, 1.2, 1.08);
    const hand = arm.userData.hand;
    for (const side of [-1, 0, 1]) {
      const talon = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.34, 6), claw);
      talon.position.set(side * 0.11, -0.18, 0.18);
      talon.rotation.x = Math.PI * 0.5;
      hand.add(talon);
    }
  }
  visualRoot.add(leftArm, rightArm);

  const leftLeg = createPlayerLeg(HAND_CONFIG.left.side, hide, claw);
  const rightLeg = createPlayerLeg(HAND_CONFIG.right.side, hide, claw);
  for (const leg of [leftLeg, rightLeg]) {
    leg.position.set(Math.sign(leg.position.x) * 0.46, 1.80, -0.2);
    leg.scale.set(1.08, 0.86, 1.12);
  }
  visualRoot.add(leftLeg, rightLeg);

  for (let index = 0; index < 4; index += 1) {
    const spine = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.48, 7), claw);
    spine.position.set(0, 3.86 - index * 0.22, -0.52 - index * 0.24);
    spine.rotation.x = -0.55;
    visualRoot.add(spine);
  }

  return {
    kind: "creature",
    visualRoot,
    body,
    headGroup,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    animationTime: Math.random() * Math.PI * 2,
    moveAmount: 0
  };
}

function createPveMobRig(archetype, color, skinColor, weapon) {
  const rig = archetype === "raider"
    ? createPveHumanoidRig(color, "#66834b", weapon)
    : createPveCreatureRig(color, skinColor);
  attachMobModel(rig, archetype === "raider" ? "orc" : "gremlin");
  return rig;
}

function createPveEnemy(spawn) {
  const group = new THREE.Group();
  group.userData.cameraOcclusionExcluded = true;
  const id = `pve-${world.pveEnemySeq}`;
  world.pveEnemySeq += 1;
  group.name = id;
  group.position.set(spawn.position.x, 0, spawn.position.z);
  const archetype = spawn.archetype ?? choosePveMobArchetype();
  const loadout = createPveMobLoadout(archetype);
  const rig = createPveMobRig(archetype, spawn.color, spawn.skinColor ?? "#9d8b74", loadout.weapon);
  group.add(rig.visualRoot);


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

  const enemy = {
    id,
    name: spawn.name,
    roomId: spawn.roomId,
    mobClass: archetype,
    mesh: group,
    rig,
    healthBar,
    hp: spawn.hp,
    maxHp: spawn.hp,
    spawn: { ...spawn.position },
    weapon: loadout.weapon,
    armor: loadout.armor,
    naturalAttack: loadout.naturalAttack,
    goldMin: loadout.goldMin,
    goldMax: loadout.goldMax,
    radius: spawn.radius ?? (archetype === "raider" ? 1.22 : 1.08),
    speed: spawn.speed ?? (archetype === "raider" ? 5.7 : 7.5),
    knockbackVelocity: new THREE.Vector3(0, 0, 0),
    attackRange: loadout.weapon
      ? getPveAttackRange(loadout.weapon, 2.4)
      : loadout.naturalAttack.range,
    attackCooldown: loadout.weapon
      ? getPveAttackCooldown(loadout.weapon, 1.4)
      : 1 / loadout.naturalAttack.frequency,
    attackTimer: Math.random() * 0.8,
    attackAnimation: null,
    dead: false,
    deathTimer: 0
  };
  if (spawn.bossElement) {
    enemy.bossElement = spawn.bossElement;
    enemy.dungeonId = world.dungeon.id;
    enemy.weapon = createRandomPveWeapon(1, 'Staff'); enemy.armor = [];
    rig.visualRoot.visible = false;
    const visual = createSorcererVisual(spawn.bossElement, enemy.weapon);
    visual.traverse(child => { child.userData.pveEnemyId = id; });
    group.add(visual);
    enemy.sorcererVisual = visual;
    loadSorcererModel(visual, spawn.bossElement, enemy.weapon);
    enemy.spells = new SorcererSpells(world.dungeon.contentRoot ?? group.parent ?? world.scene, spawn.bossElement, world.dungeon.layout.endRoom);
    enemy.castTurn = 0;
    enemy.attackTimer = 1.5;
    healthBar.position.y = 10;
  } else if (archetype === "raider") setPveEnemyArmor(enemy, loadout.armor);
  applyGremlinSize(enemy);
  world.pveEnemies.push(enemy);

  return group;
}

function getEbonHollowDungeon() {
  return state.pois.find((poi) => poi.id === "ebon-hollow") ?? null;
}

function getOutdoorDungeonMonsterRingRadius(dungeon = getEbonHollowDungeon()) {
  return (dungeon?.radius ?? 16) + OUTDOOR_DUNGEON_MONSTER_RING_PADDING;
}

function isOutsideOutdoorDungeonMonsterRing(position, dungeon = getEbonHollowDungeon()) {
  if (!dungeon || !position) {
    return true;
  }

  return distance2D(position, dungeon.position) >= getOutdoorDungeonMonsterRingRadius(dungeon);
}

function pushPositionOutsideOutdoorDungeonMonsterRing(position, dungeon = getEbonHollowDungeon(), radius = 0) {
  if (!dungeon || !position) {
    return position;
  }

  const minimumDistance = getOutdoorDungeonMonsterRingRadius(dungeon) + radius;
  const dx = position.x - dungeon.position.x;
  const dz = position.z - dungeon.position.z;
  const distance = Math.hypot(dx, dz);

  if (distance >= minimumDistance) {
    return position;
  }

  const angle = distance > 0.001
    ? Math.atan2(dz, dx)
    : (world.outdoorMonsterSeq * 2.399963) % (Math.PI * 2);

  return {
    x: dungeon.position.x + Math.cos(angle) * minimumDistance,
    z: dungeon.position.z + Math.sin(angle) * minimumDistance
  };
}

function spawnOutdoorDungeonMonster(camp = null, cheat = null) {
  if (!GAME_FLAGS.pve) {
    return;
  }

  const night = getNightAmount(state.elapsed) > 0.62;
  const sources = raidSpawnSources(MOB_CAMPS, CASTLES, state.factions, night);
  if (camp && !sources.some(source => source.id === camp.id)) return;
  if (!cheat && world.outdoorMonsters.filter(mob => !mob.dead).length >= sources.length * (night ? NIGHT_CAMP_CAP : 3)) {
    return;
  }

  const dungeon = cheat ? { id: 'cheat', position: state.player.position } : camp ?? selectCampForSpawn(sources, world.outdoorMonsters, state.player.position, getNightAmount(state.elapsed) > 0.62 ? NIGHT_CAMP_CAP : 3);

  if (!dungeon || (!cheat && world.outdoorMonsters.filter(mob => !mob.dead && mob.campId === dungeon.id).length >= (night ? NIGHT_CAMP_CAP : 3))) {
    return;
  }

  const archetype = cheat?.archetype ?? choosePveMobArchetype();
  const template = cheat?.template ?? getPveMobTemplate(archetype, world.outdoorMonsterSeq);
  const angle = (world.outdoorMonsterSeq * 2.399963 + state.elapsed * 0.37) % (Math.PI * 2);
  const spawnDistance = cheat ? 8 :
    getOutdoorDungeonMonsterRingRadius(dungeon) +
    OUTDOOR_DUNGEON_MONSTER_SPAWN_BUFFER +
    (world.outdoorMonsterSeq % 4) * 1.7;
  const campModel = !cheat && world.campModels.find(model => model.userData.campId === dungeon.id);
  const tentExit = campModel ? chooseCampTentSpawn(campModel, world.outdoorMonsters, dungeon.id, world.outdoorMonsterSeq) : null;
  if (campModel && !tentExit) return;
  const spawn = tentExit ? { ...tentExit.inside } : {
    x: dungeon.position.x + Math.cos(angle) * spawnDistance,
    z: dungeon.position.z + Math.sin(angle) * spawnDistance
  };
  const id = `outdoor-monster-${world.outdoorMonsterSeq}`;
  world.outdoorMonsterSeq += 1;
  const loadout = createPveMobLoadout(archetype);

  const mesh = createMonsterMesh({
    id,
    name: template.name,
    archetype,
    color: template.color,
    skinColor: template.skinColor,
    position: spawn,
    weapon: loadout.weapon,
    armor: loadout.armor
  });
  const rig = mesh.userData.pveRig;

  const monster = {
    tentExit,
    campId: dungeon.id,
    sourceCastleId: dungeon.sourceCastleId ?? null,
    id,
    name: template.name,
    mobClass: archetype,
    mesh,
    rig,
    healthBar: mesh.getObjectByName("healthBar"),
    hp: template.hp,
    maxHp: template.hp,
    weapon: loadout.weapon,
    armor: loadout.armor,
    naturalAttack: loadout.naturalAttack,
    goldMin: loadout.goldMin,
    goldMax: loadout.goldMax,
    spawn,
    radius: template.radius,
    speed: template.speed,
    knockbackVelocity: new THREE.Vector3(0, 0, 0),
    attackRange: loadout.weapon
      ? getPveAttackRange(loadout.weapon, 2.55)
      : loadout.naturalAttack.range,
    attackCooldown: loadout.weapon
      ? getPveAttackCooldown(loadout.weapon, 1.25)
      : 1 / loadout.naturalAttack.frequency,
    attackTimer: Math.random() * 0.6,
    attackAnimation: null,
    aggro: false,
    roamAngle: angle,
    dead: false,
    deathTimer: 0
  };

  applyGremlinSize(monster);
  if (tentExit) mesh.rotation.y = Math.atan2(tentExit.x - spawn.x, tentExit.z - spawn.z);
  world.outdoorMonsters.push(monster);
  addOutdoor(mesh);
  updatePveEnemyHealthBar(monster);
}

function createMonsterMesh({ id, name, archetype = "creature", color, skinColor = "#9d8b74", position, weapon, armor = [] }) {
  const group = new THREE.Group();
  group.name = id;
  group.position.set(position.x, getTerrainHeightAt(position.x, position.z), position.z);

  const rig = createPveMobRig(archetype, color, skinColor, weapon);
  group.add(rig.visualRoot);
  group.userData.pveRig = rig;

  if (archetype === "raider") setPveEnemyArmor({ id, mesh: group, rig }, armor);

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
  group.userData.cameraOcclusionExcluded = true;
  group.name = `${npc.id}TradeNpc`;
  group.position.set(npc.position.x, npc.position.y ?? 0, npc.position.z);
  group.rotation.y = 0; // Face the entrance across the desk.

  const marketColor = "#d6a542";
  const cloth = new THREE.MeshStandardMaterial({ color: npc.color, roughness: 0.72 });
  const skin = new THREE.MeshStandardMaterial({ color: "#d3b58f", roughness: 0.78 });
  const leather = new THREE.MeshStandardMaterial({ color: "#45301f", roughness: 0.86 });

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(3.2, 0.18, 8, 48),
    new THREE.MeshBasicMaterial({ color: marketColor, transparent: true, opacity: 0.75 })
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

  for (const x of [-0.38, 0.38]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 1.15, 8), leather);
    leg.position.set(x, 0.94, 0);
    group.add(leg);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.8), leather);
    boot.name = "shopkeepBoot";
    boot.position.set(x, 0.2, 0.13);
    group.add(boot);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.85, 4, 8), cloth);
    arm.position.set(x * 2.5, 2.9, 0.35);
    arm.rotation.x = -0.9;
    group.add(arm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), skin);
    hand.position.set(x * 2.5, 2.55, 0.8);
    group.add(hand);
  }

  const counter = new THREE.Mesh(new THREE.BoxGeometry(8, 0.35, 2.8), leather);
  counter.name = "merchantDesktop";
  counter.position.set(0, 2.35, 2.1);
  counter.castShadow = true;
  group.add(counter);
  for (const x of [-3.5, 3.5]) {
    for (const z of [1, 3.2]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.35, 2.2, 0.35), leather);
      leg.position.set(x, 1.1, z);
      group.add(leg);
    }
  }
  const front = new THREE.Mesh(new THREE.BoxGeometry(7.2, 1.95, 0.16), cloth);
  front.position.set(0, 1.18, 3.2);
  group.add(front);
  const ledger = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.12, 0.85), skin);
  ledger.position.set(2.6, 2.59, 2.1);
  ledger.rotation.y = -0.18;
  group.add(ledger);

  const deskGoods = new THREE.Group();
  deskGoods.position.y = 0.8;
  addShopkeepProps(deskGoods, npc.resourceIds, leather);
  group.add(deskGoods);

  const label = createTextSprite(npc.name, marketColor, 28);
  label.position.set(0, 6.2, 0);
  group.add(label);

  group.traverse((child) => {
    child.userData.tradeNpcId = npc.id;
  });

  return group;
}

function createStewardNpc() {
  return createCastleWorker("steward");
}

function createBlacksmithNpc() {
  return createCastleWorker("blacksmith");
}

function addShopkeepProps(group, resourceIds, darkMaterial) {
  resourceIds.forEach((resourceId, index) => {
    const resource = RESOURCE_LOOKUP[resourceId];
    const material = new THREE.MeshStandardMaterial({
      color: resource.color,
      roughness: 0.58,
      metalness: resourceId === "iron" ? 0.28 : 0.04
    });
    const x = -1.35 + index * 0.9;
    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.48, 0.52), material);
    crate.position.set(x, 1.95, 1.15);
    crate.castShadow = true;
    group.add(crate);

    if (resourceId === "wood") {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.74, 8), material);
      log.position.set(x, 2.34, 1.15);
      log.rotation.z = Math.PI / 2;
      log.castShadow = true;
      group.add(log);
    } else if (resourceId === "stone") {
      const block = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24), material);
      block.position.set(x, 2.32, 1.15);
      block.castShadow = true;
      group.add(block);
    } else if (resourceId === "wheat") {
      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.72, 5), material);
      stalk.position.set(x, 2.45, 1.15);
      stalk.rotation.z = 0.16;
      group.add(stalk);
      const grain = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.26, 6), material);
      grain.position.set(x + 0.06, 2.9, 1.15);
      grain.rotation.z = 0.16;
      group.add(grain);
    } else if (resourceId === "iron") {
      const ingot = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.2, 0.34), material);
      ingot.position.set(x, 2.32, 1.15);
      ingot.castShadow = true;
      group.add(ingot);
    }
  });

  const scales = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.42), darkMaterial);
  scales.position.set(0, 2.12, 0.92);
  scales.castShadow = true;
  group.add(scales);
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

  const belt = new THREE.Mesh(createRoundedBoxGeometry(1.76, 0.22, 1.08, 0.08, 3), leather);
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
  attachWarriorModel(world.playerRig, group, { belt });
}

function createRoundedBoxGeometry(width, height, depth, radius, segments = 4) {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const cornerRadius = Math.min(radius, halfWidth * 0.92, halfHeight * 0.92, depth * 0.42);
  const bevelSize = Math.min(cornerRadius * 0.48, depth * 0.18);
  const shape = new THREE.Shape();

  shape.moveTo(-halfWidth + cornerRadius, -halfHeight);
  shape.lineTo(halfWidth - cornerRadius, -halfHeight);
  shape.quadraticCurveTo(halfWidth, -halfHeight, halfWidth, -halfHeight + cornerRadius);
  shape.lineTo(halfWidth, halfHeight - cornerRadius);
  shape.quadraticCurveTo(halfWidth, halfHeight, halfWidth - cornerRadius, halfHeight);
  shape.lineTo(-halfWidth + cornerRadius, halfHeight);
  shape.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth, halfHeight - cornerRadius);
  shape.lineTo(-halfWidth, -halfHeight + cornerRadius);
  shape.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + cornerRadius, -halfHeight);
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevelSize,
    bevelSize,
    bevelSegments: segments,
    curveSegments: segments
  });

  geometry.center();
  geometry.computeVertexNormals();
  return geometry;
}

function createPlayerTorso(tunic, leather) {
  const torso = new THREE.Group();
  torso.name = "playerTorso";

  const hips = new THREE.Mesh(createRoundedBoxGeometry(1.58, 0.52, 0.88, 0.18, 5), tunic);
  hips.position.y = -0.72;
  hips.scale.set(1, 1, 1);
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
  arm.position.set(side * 0.92, 4.35, 0.02);
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
    const mesh = createPlayerArmorSlotMesh(item, slotId, mount.side, mount.part);

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
    return [
      { parent: rig.body, side: 0 },
      { parent: rig.leftArm?.userData.upperArm ?? rig.leftArm, side: 1, part: "shoulder" },
      { parent: rig.rightArm?.userData.upperArm ?? rig.rightArm, side: -1, part: "shoulder" }
    ].filter(mount => mount.parent);
  }

  if (slotId === "gloves") {
    return [
      { parent: rig.leftForearm ?? rig.leftArm, side: HAND_CONFIG.left.side, part: "forearm" },
      { parent: rig.rightForearm ?? rig.rightArm, side: HAND_CONFIG.right.side, part: "forearm" },
      { parent: rig.leftHand, side: HAND_CONFIG.left.side, part: "hand" },
      { parent: rig.rightHand, side: HAND_CONFIG.right.side, part: "hand" }
    ].filter(mount => mount.parent);
  }

  if (slotId === "legs") {
    return [
      { parent: rig.leftThigh ?? rig.leftLeg?.userData.thigh ?? rig.leftLeg, side: 1, part: "thigh" },
      { parent: rig.rightThigh ?? rig.rightLeg?.userData.thigh ?? rig.rightLeg, side: -1, part: "thigh" },
      { parent: rig.leftShin, side: 1, part: "shin" },
      { parent: rig.rightShin, side: -1, part: "shin" }
    ].filter(mount => mount.parent);
  }

  if (slotId === "feet") {
    return [
      { parent: rig.leftFoot ?? rig.leftLeg, side: HAND_CONFIG.left.side },
      { parent: rig.rightFoot ?? rig.rightLeg, side: HAND_CONFIG.right.side }
    ].filter(mount => mount.parent);
  }

  return [];
}

function createPlayerArmorSlotMesh(item, slotId, side = 0, part = null) {
  const group = new THREE.Group();
  const material = createArmorVisualMaterial(item);
  const trim = new THREE.MeshStandardMaterial({ color: "#d9d2b5", roughness: 0.48, metalness: 0.18 });

  if (part && !["forearm"].includes(part)) {
    // Additional articulated parts have no legacy primitive equivalent.
  } else if (slotId === "head") {
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
  attachEquipmentGem(group, item, part ?? slotId, side);
  attachArmourModel(group, item, part ?? ({ gloves: "forearm", feet: "foot" }[slotId] ?? slotId), side);
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

  const belt = new THREE.Mesh(createRoundedBoxGeometry(1.76, 0.22, 1.08, 0.08, 3), leather);
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
    snapshots: [],
    renderState: {
      moving: Boolean(player.moving),
      speed: player.speed ?? 0,
      headRotation: player.headRotation ?? 0
    },
    targetPosition: new THREE.Vector3(player.position.x, player.elevation ?? 0, player.position.z),
    targetRotation: player.rotation ?? 0,
    targetHeadRotation: player.headRotation ?? 0,
    lastDamagedAt: player.lastDamagedAt ?? 0
  };

  attachWarriorModel(remote.rig, group, { belt, factionColor: faction?.color });
  return remote;
}

function respawnPlayer(event) {
  event.preventDefault();
  if (!state.player.dead || Date.now() < world.multiplayer.respawnAt) return;
  const name = formatHouseName(ui.respawnName.value);
  if (!name) { ui.respawnName.focus(); return; }
  beginNewPlayerLife(state, name);
  playerStatuses.clear();
  placePlayerAtRespawnPoint();
  state.player.dead = false;
  state.player.hp = state.player.maxHp ?? MULTIPLAYER_MAX_HEALTH;
  world.multiplayer.localDefeated = false;
  world.multiplayer.respawnAt = 0;
  ui.deathScreen.classList.add("is-hidden");
  ui.deathScreen.setAttribute("aria-hidden", "true");
  markPlayerPersistenceDue();
  updatePlayerHealthBar();
  refreshUi();
  if (world.multiplayer.enabled) publishLocalPlayer(true);
  canvas.focus();
  flash(`You respawned as ${state.player.name}.`);
}

function setupUi() {
  ui.respawnForm.addEventListener("submit", respawnPlayer);
  if (!account.authenticated) {
    document.querySelector("#faction-title").textContent = "Begin your life";
    document.querySelector(".house-field span").textContent = "First name";
    ui.houseNameInput.placeholder = "Rowan";
    ui.hudHouseButton.disabled = true;
  }
  if (ui.houseNameInput) {
    ui.houseNameInput.value = sanitizeHouseName(state.player.houseName);
  }

  renderFactionChoices();

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

    const enteredName = sanitizeHouseName(ui.houseNameInput?.value);
    const houseName = account.authenticated ? enteredName : "";

    if (!enteredName) {
      flash(account.authenticated ? "Choose a family name." : "Choose a first name.");
      ui.houseNameInput?.focus();
      updateHouseNameGate();
      return;
    }

    if (!account.authenticated) {
      state.player.firstName = formatHouseName(enteredName);
      state.player.lifeNumber = Math.max(1, state.player.lifeNumber || 0);
    }

    let result;
    if (button.dataset.faction === "unsworn") {
      setPlayerHouseName(state, houseName);
      if (!state.player.lifeNumber) beginNewPlayerLife(state);
      result = { ok: true, message: "Find an abandoned castle and sit on its throne to found your kingdom." };
    } else result = joinFaction(state, button.dataset.faction, { houseName });
    runAction(result);

    if (result.ok) {
      ui.factionSelect.classList.add("is-hidden");
      ui.factionSelect.setAttribute("aria-hidden", "true");
      publishLocalPlayer(true);
    }
  });

  if (state.player.firstName && (!account.authenticated || state.player.houseName)) {
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

  ui.rulerResources.addEventListener("click", event => {
    const button = event.target.closest("[data-give-resource]");
    if (button) openResourceGift(button.dataset.giveResource);
  });
  ui.hudFactionButton.addEventListener("click", () => {
    setRulerPanelOpen(ui.rulerPanel.classList.contains("is-hidden"), { leaveSeat: false });
  });
  ui.hudHouseButton.addEventListener("click", () => {
    setHousePanelOpen(ui.housePanel.classList.contains("is-hidden"));
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
  document.querySelector('#steward-tabs').addEventListener('click', event => {
    const tab = event.target.closest('[data-steward-tab]');
    if (!tab) return;
    stewardMenu.tab = tab.dataset.stewardTab;
    renderStewardPanel();
  });
  document.querySelector('#steward-storage').addEventListener('click', event => {
    const button = event.target.closest('[data-storage-item]');
    if (!button || button.disabled || !world.stewardPanelOpen || world.interiorFactionId !== state.selectedFactionId) return;
    runAction(transferStewardItem(state.player, button.dataset.storageItem, button.dataset.storageAction));
  });
  document.querySelector('#blacksmith-tabs').addEventListener('click', event => {
    const tab = event.target.closest('[data-smith-tab]');
    if (!tab) return;
    forgeMenu.tab = tab.dataset.smithTab;
    renderNpcTradePanel();
  });
  ui.npcTradeResourceList.addEventListener('change', event => {
    if (event.target.id === 'forge-mould') { forgeMenu.mould = event.target.value; renderNpcTradePanel(); }
  });
  ui.npcTradeResourceList.addEventListener("click", (event) => {
    if (getActiveTradeNpc()?.id === BLACKSMITH_NPC.id) {
      const pageButton = event.target.closest('[data-exchange-page]');
      if (pageButton && !pageButton.disabled) {
        const section = pageButton.dataset.exchangeSection;
        if (Object.hasOwn(exchangePages, section)) {
          exchangePages[section] = Number(pageButton.dataset.exchangePage);
          renderNpcTradePanel();
          ui.npcTradeResourceList.querySelector(`[data-exchange-section="${section}"]:not(:disabled)`)?.focus({ preventScroll: true });
        }
        return;
      }
      const ingredient = event.target.closest('[data-forge-select]');
      if (ingredient) {
        const id = ingredient.dataset.forgeSelect;
        forgeMenu.selection = forgeMenu.selection.includes(id) ? forgeMenu.selection.filter(i => i !== id) : [...forgeMenu.selection.slice(-1), id];
        renderNpcTradePanel(); return;
      }
      if (event.target.closest('[data-forge-craft]')) { runAction(craftIronItem(state.player, forgeMenu.mould, createId('forged'))); return; }
      if (event.target.closest('[data-forge-combine]')) {
        const result = combineForgeItems(state.player, forgeMenu.selection[0], forgeMenu.selection[1], createId('forged'));
        if (result.ok) forgeMenu.selection = [];
        runAction(result); return;
      }
    }
    const weaponButton = event.target.closest("[data-buy-blacksmith-weapon]");
    if (weaponButton) {
      runAction(buyBlacksmithWeapon(weaponButton.dataset.buyBlacksmithWeapon));
      return;
    }

    const sellAllEquipmentButton = event.target.closest("[data-sell-all-blacksmith-equipment]");
    if (sellAllEquipmentButton) {
      runAction(sellAllBlacksmithEquipment());
      return;
    }

    const sellEquipmentButton = event.target.closest("[data-sell-blacksmith-equipment]");
    if (sellEquipmentButton) {
      runAction(sellBlacksmithEquipment(sellEquipmentButton.dataset.sellBlacksmithEquipment));
      return;
    }

    const button = event.target.closest("[data-trade-resource]");
    const npc = getActiveTradeNpc();

    if (!button || !npc) {
      return;
    }

    const resourceId = button.dataset.tradeResource;
    if (!npc.resourceIds.includes(resourceId)) {
      return;
    }

    const quantity = getTradeAmount();
    const result =
      button.dataset.tradeAction === "sell"
        ? sellResource(state, resourceId, quantity)
        : buyResource(state, resourceId, quantity);
    runAction(result);
  });
  ui.rulerClose.addEventListener("click", () => {
    setRulerPanelOpen(false);
  });
  ui.houseClose.addEventListener("click", () => {
    setHousePanelOpen(false);
  });
  ui.loreClose?.addEventListener("click", () => {
    setLoreScrollOpen(false);
  });
  ui.rulerPolitics.addEventListener("click", (event) => {
    if (event.target.closest("[data-edit-faction]") && world.seatedOnThrone && isFactionRuler(state, world.interiorFactionId)) {
      openFoundingEditor(world.interiorFactionId, true); return;
    }
    const button = event.target.closest("[data-politics-action]");
    const factionId = state.selectedFactionId || world.interiorFactionId;

    if (!button || !factionId) {
      return;
    }

    const targetFactionId = button.dataset.targetFaction;
    const action = button.dataset.politicsAction;
    let result = null;

    if (["ally", "neutral", "enemy"].includes(action)) {
      result = setFactionRelation(state, factionId, targetFactionId, capitalize(action));
    }

    if (result) {
      runAction(result);
      renderRulerPanel();
    }
  });
  ui.houseBody.addEventListener("click", (event) => {
    const button = event.target.closest("[data-house-politics-action]");

    if (!button) {
      return;
    }

    const action = button.dataset.housePoliticsAction;
    if (!["ally", "neutral", "enemy"].includes(action)) {
      return;
    }

    runAction(setHouseRelation(state, state.player.houseName, button.dataset.targetHouse, capitalize(action)));
    renderHousePanel();
  });
  ui.leftHandIcon.parentElement.addEventListener("click", () => clearHand("left"));
  ui.rightHandIcon.parentElement.addEventListener("click", () => clearHand("right"));
  setupInventoryControls();

  const cheatConsole = createCheatConsole({
    request: async (url, body) => {
      const response = await fetch(url, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {});
      if (response.status === 404) throw new Error('The running game server is out of date. Restart it, reload this page, then try again.');
      const result = await response.json();
      if (!result.ok) { const error = new Error(result.message || 'Cheat request failed.'); error.status = response.status; throw error; }
      return result;
    },
    beforeOpen: () => { world.keys.clear(); world.pointer.buttons = 0; stopSpaceLocationAction(); releaseLockedCameraForMenu(); },
    afterClose: () => resumeLockedCameraAfterMenu(),
    execute: async command => {
      if (world.persistence.saveInFlight || world.persistence.loadInFlight) throw new Error('A save is in progress. Try again in a moment.');
      if (/^\/spawn\s+(building|mob)\b/i.test(command) && world.sceneMode !== 'outdoor') throw new Error('Go outdoors to spawn buildings or mobs.');
      if (/^\/spawn\s+mob\b/i.test(command) && !GAME_FLAGS.pve) throw new Error('PvE is disabled. Reload with ?pve=true to spawn mobs.');
      if (!await savePersistentState({ includeWorld: world.persistence.dirty })) throw new Error('Could not save before running the command.');
      world.persistence.saveInFlight = true;
      try {
        const response = await fetch('/api/world/cheats', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ command }) });
        const data = await response.json();
        if (!data.ok) { const error = new Error(data.message || 'Command failed.'); error.status = response.status; throw error; }
        if (data.mob) {
          const creature = PVE_CREATURE_TEMPLATES.find(t => t.name === data.mob);
          const raider = PVE_RAIDER_TEMPLATES.find(t => t.name === data.mob);
          const archetype = creature || data.mob === 'gremlin' ? 'creature' : 'raider';
          const template = creature || raider || { ...getPveMobTemplate(archetype), name: data.mob === 'gremlin' ? 'Gremlin' : 'Orc' };
          spawnOutdoorDungeonMonster(null, { archetype, template });
        } else { applyPersistentPayload(data, { includePlayer: true }); refreshUi(); }
        return data.message;
      } finally { world.persistence.saveInFlight = false; }
    }
  });
  window.addEventListener("keydown", (event) => {
    if (isDiagnosticsShortcut(event)) {
      event.preventDefault();
      if (!event.repeat) diagnostics.toggle();
      return;
    }
    if (event.key === '/' && !isTypingInField(event.target) && !event.repeat) {
      event.preventDefault(); void cheatConsole.open(); return;
    }
    if (event.code === "KeyF" && !isTypingInField(event.target)) {
      event.preventDefault();
      if (event.repeat) {
        return;
      }
      if (!ui.factionSelect.classList.contains("is-hidden")) {
        return;
      }
      setRulerPanelOpen(ui.rulerPanel.classList.contains("is-hidden"), { leaveSeat: false });
      return;
    }

    if (event.code === "KeyH" && !isTypingInField(event.target)) {
      event.preventDefault();
      if (event.repeat) {
        return;
      }
      if (!ui.factionSelect.classList.contains("is-hidden")) {
        return;
      }
      setHousePanelOpen(ui.housePanel.classList.contains("is-hidden"));
      return;
    }

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
        if (startedLocationAction) world.playerMotion.lastSpaceTap = null;
        if (!startedLocationAction) {
          handleSpaceMovementAction();
        }
      }
      return;
    }

    if (
      !isTypingInField(event.target) &&
      ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight", "ShiftLeft"].includes(event.code)
    ) {
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
    world.pointer.captureId = null;
    // Pointer capture is unavailable while pointer lock owns the mouse, and
    // lock transitions can invalidate a pointer between this check and capture.
    if (document.pointerLockElement || isCameraMenuOpen()) return;
    try {
      canvas.setPointerCapture(event.pointerId);
      world.pointer.captureId = event.pointerId;
    } catch (error) {
      if (!['InvalidStateError', 'NotFoundError'].includes(error.name)) throw error;
    }
  });
  // Mouse events fire for each button in a chord; pointerdown/up only fire
  // for the first press and last release, losing alternating-hand inputs.
  canvas.addEventListener("mousedown", (event) => {
    combatAudio.unlock();
    if (event.button !== 0 && event.button !== 1 && event.button !== 2) {
      return;
    }
    if ((event.buttons & 4) && event.button !== 1) return;

    event.preventDefault();
    resumeLockedCameraAfterMenu();
    syncPointerButtons(event);
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
      return;
    }

    if (isLockedThirdPersonCamera() && event.button === 1) {
      world.pointer.suppressClickAction = true;
      world.pointer.button = event.button;
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

    if (event.button !== 1 && !world.outpostTower.active &&
        !isCombatInputReady(event.button === 2 ? 'right' : 'left')) {
      world.pointer.rejectedAttackButtons = (world.pointer.rejectedAttackButtons ?? 0) | (event.button === 2 ? 2 : 1);
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
    if (world.pointer.rangedCharge?.hand === world.pointer.attackHand) clearRangedCharge();

    if (world.pointer.cameraDragging) {
      return;
    }

    if (world.outpostTower.active) {
      world.outpostTower.drawStartedAt = performance.now();
      requestOutpostTowerPointerLock();
      return;
    }

    if (isLockedThirdPersonCamera()) {
      updateLockedThirdPersonAim();
      hideBaseTooltip();
    } else {
      updateAimFromPointer(event);
      updateBaseHoverFromPointer(event);
    }

    world.pointer.attackInputs ??= {};
    const pressedItem = getEquippedItem(state, world.pointer.attackHand);
    if (startFireStaff(world.pointer.attackHand) || startEarthRockControl(world.pointer.attackHand)) return;
    const pressedType = pressedItem?.type ?? 'Empty Hand';
    world.pointer.attackInputs[world.pointer.attackHand] = {
      itemId: pressedItem?.id,
      aim: isLockedThirdPersonCamera() && !isProjectileWeapon(pressedType) && pressedType !== 'Flail' && !isShield(pressedType)
        ? preparePlayerAttackAim(pressedType, getEffectiveAttackRange(pressedItem ?? { type: pressedType },
          pressedItem?.weapon ?? WEAPON_STATS[pressedType], 0)) : null
    };
    world.pointer.enteringBase = world.sceneMode === "interior" ? startRulerSeatAction(event) : false;
    world.pointer.working = world.pointer.enteringBase ? false : startWorkAction(world.pointer.attackHand);
    if (!world.pointer.enteringBase && !world.pointer.working && getEquippedItem(state,world.pointer.attackHand)?.type === 'Flail') startFlailCharge(world.pointer.attackHand);
    if (!world.pointer.enteringBase && !world.pointer.working && canChargeRangedHand(world.pointer.attackHand)) {
      world.pointer.rangedCharge = {
        hand: world.pointer.attackHand,
        startedAt: world.pointer.downAt
      };
    }
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
    syncPointerButtons(event);

    if (world.placement.active) {
      world.pointer.x = event.clientX;
      world.pointer.y = event.clientY;
      updatePlacementFromPointer(event);
      return;
    }

    if (world.outpostTower.active) {
      const deltaX = event.clientX - previousX;
      const deltaY = event.clientY - previousY;
      world.pointer.x = event.clientX;
      world.pointer.y = event.clientY;

      if (document.pointerLockElement !== canvas) {
        rotateOutpostTowerCamera(deltaX, deltaY);
      }

      hideBaseTooltip();
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

  window.addEventListener("mouseup", (event) => {
    const releasedHand = event.button === 0 ? 'left' : event.button === 2 ? 'right' : null;
    if (releasedHand && world.fireInputHand === releasedHand) {
      world.fireCast = null; world.fireInputHand = null;
      syncPointerButtons(event); world.pointer.dragging = event.buttons !== 0; world.pointer.attackHand = null;
      if (world.pointer.attackInputs) delete world.pointer.attackInputs[releasedHand];
      return;
    }
    if (releasedHand && world.earthInputHand === releasedHand) {
      world.earthMagic?.release();
      world.earthInputHand = null;
      syncPointerButtons(event);
      world.pointer.dragging = event.buttons !== 0;
      world.pointer.attackHand = null;
      if (world.pointer.attackInputs) delete world.pointer.attackInputs[releasedHand];
      if (!event.buttons && canvas.hasPointerCapture(world.pointer.captureId)) canvas.releasePointerCapture(world.pointer.captureId);
      return;
    }
    const releasedBit = event.button === 0 ? 1 : event.button === 2 ? 2 : 0;
    if ((world.pointer.rejectedAttackButtons ?? 0) & releasedBit) {
      world.pointer.rejectedAttackButtons &= ~releasedBit;
      syncPointerButtons(event);
      if (!event.buttons) world.pointer.dragging = false;
      return;
    }
    if (!world.pointer.dragging && !world.pointer.suppressClickAction) return;
    syncPointerButtons(event);

    if (world.pointer.suppressClickAction) {
      // Double middle-click toggles camera mode and should not trigger world actions.
    } else if (world.pointer.cameraDragging) {
      // Camera movement is bound to middle mouse, so it should never trigger an attack or work action.
    } else if (world.outpostTower.active) {
      // Tower aiming is controlled by first-person mouse look.
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
    } else if (world.flailCharge?.hand === (event.button === 2 ? 'right' : 'left')) {
      const charge = world.flailCharge;
      tryAttackFromPointer(charge.hand, flailChargePower(charge.elapsed));
      world.flailCharge = null;
    } else if (!world.pointer.moved && tryClaimCampChestFromPointer(event)) {
      // Camp loot clicks resolve before weapon swings.
    } else if (!world.pointer.moved && tryClaimDungeonTreasureFromPointer(event)) {
      // Ordinary dungeon chests remain available before and during escape.
    } else if (!world.pointer.moved && tryPickupDroppedItemFromPointer(event)) {
      // Loot clicks should resolve before weapon swings.
    } else if (!world.pointer.moved && openNpcPanelFromPointer(event)) {
      // NPC clicks open their panel instead of swinging an equipped weapon.
    } else if (getEquippedItem(state,event.button === 2 ? 'right' : 'left')?.type === 'Flail') {
      // Only a successfully started hold can release this weapon.
    } else if (event.button === 0 || event.button === 2) {
      // Aiming while holding a button is still an attack, not a cancelled click.
      const hand = event.button === 2 ? "right" : "left";
      const pressed = world.pointer.attackInputs?.[hand];
      if (!pressed || pressed.itemId === getEquippedItem(state, hand)?.id) {
        tryAttackFromPointer(hand, getRangedChargePower(hand), null, pressed?.aim ?? null);
      }
    }

    if (world.pointer.attackInputs) delete world.pointer.attackInputs[event.button === 2 ? 'right' : 'left'];
    if (world.pointer.rangedCharge?.hand === (event.button === 2 ? 'right' : 'left')) clearRangedCharge();
    world.pointer.dragging = event.buttons !== 0;
    world.pointer.cameraDragging = Boolean(event.buttons & 4);
    world.pointer.working = false;
    world.pointer.enteringBase = false;
    world.pointer.suppressClickAction = false;
    world.pointer.attackHand = null;
    if (!event.buttons && canvas.hasPointerCapture(world.pointer.captureId)) canvas.releasePointerCapture(world.pointer.captureId);
  });

  canvas.addEventListener("pointerleave", () => {
    world.pointer.insideCanvas = false;
    world.hoveredStatusEntityKey = null;
    hideBaseTooltip();
  });

  window.addEventListener('blur', () => { world.fireCast = null; world.fireInputHand = null; if (world.earthInputHand) world.pointer.dragging = false; world.earthMagic?.release(); world.earthInputHand = null; stopSpaceLocationAction(); world.playerMotion.lastSpaceTap = null; world.flailCharge = null; world.pointer.buttons = 0; world.guard.hand = null; world.weaveQueue = null; world.comboChains = { left: null, right: null }; });
  canvas.addEventListener("pointercancel", () => {
    world.fireCast = null; world.fireInputHand = null;
    world.earthMagic?.release();
    world.earthInputHand = null;
    world.flailCharge = null;
    world.guard.hand = null;
    world.weaveQueue = null;
    clearRangedCharge();
    world.pointer.buttons = 0;
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
  document.addEventListener("pointerlockerror", () => { world.cameraLockPending = false; });
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
  ui.houseNameStatus.textContent = valid ? (account.authenticated ? `Family ${formatHouseName(houseName)}` : formatHouseName(houseName)) : "A-Z";
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
  world.cameraMenuSuspended = false;
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
    if (!world.cameraMenuSuspended) world.cameraMode = "free";
    flash("Pointer lock unavailable.");
    return;
  }

  if (document.pointerLockElement === canvas || world.cameraLockPending) {
    return;
  }

  world.cameraLockPending = true;
  const lockRequest = canvas.requestPointerLock();

  if (lockRequest?.catch) {
    lockRequest.catch(() => {
      world.cameraLockPending = false;
      if (world.cameraMode === "lockedThirdPerson" && !world.cameraMenuSuspended) {
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

function requestOutpostTowerPointerLock() {
  if (!world.outpostTower.active || !canvas.requestPointerLock || document.pointerLockElement === canvas) {
    return;
  }

  const lockRequest = canvas.requestPointerLock();

  if (lockRequest?.catch) {
    lockRequest.catch(() => {
      // The tower remains playable with normal mouse movement if pointer lock is denied.
    });
  }
}

function releaseLockedCameraForMenu() {
  if (world.cameraMode !== "lockedThirdPerson") {
    return;
  }

  world.cameraMenuSuspended = true;
  releaseLockedThirdPersonPointerLock();
}

function isCameraMenuOpen() {
  return state.player.dead || isBlockingLocationInput() ||
    !ui.housePanel.classList.contains("is-hidden") ||
    !ui.loreScroll.classList.contains("is-hidden") ||
    !ui.factionSelect.classList.contains("is-hidden") ||
    Boolean(document.querySelector("dialog[open], .minimap.is-expanded"));
}

function resumeLockedCameraAfterMenu() {
  if (world.cameraMenuSuspended && isLockedThirdPersonCamera() && !isCameraMenuOpen()) {
    requestLockedThirdPersonPointerLock();
  }
}

function handlePointerLockChange() {
  world.cameraLockPending = false;
  if (document.pointerLockElement === canvas && world.cameraMenuSuspended) {
    if (isCameraMenuOpen()) {
      releaseLockedThirdPersonPointerLock();
    } else {
      world.cameraMenuSuspended = false;
    }
    return;
  }
  if (world.cameraMode === "lockedThirdPerson" && !world.cameraMenuSuspended && document.pointerLockElement !== canvas) {
    world.cameraMode = "free";
    syncFreeCameraYawToCurrentView();
  }
}

function handleLockedThirdPersonMouseMove(event) {
  if (world.cameraMenuSuspended) return;
  if (world.outpostTower.active && document.pointerLockElement === canvas) {
    rotateOutpostTowerCamera(event.movementX, event.movementY);
    return;
  }

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
  updateCamera(0);
  world.camera.updateMatrixWorld();
  updateLockedThirdPersonAim();
}

function rotateOutpostTowerCamera(deltaX, deltaY) {
  if (!Number.isFinite(deltaX) || !Number.isFinite(deltaY)) {
    return;
  }

  const config = OUTPOST_TOWER_CAMERA;
  world.outpostTower.yaw -= deltaX * config.sensitivity;
  world.outpostTower.pitch = clamp(world.outpostTower.pitch - deltaY * config.sensitivity, config.minPitch, config.maxPitch);
  updateOutpostTowerAimFromAngles();
}

function getOutpostTowerAimDirection() {
  const horizontal = Math.cos(world.outpostTower.pitch);
  return new THREE.Vector3(
    -Math.sin(world.outpostTower.yaw) * horizontal,
    Math.sin(world.outpostTower.pitch),
    -Math.cos(world.outpostTower.yaw) * horizontal
  ).normalize();
}

function syncOutpostTowerAimToCurrentView() {
  const forward = new THREE.Vector3();
  world.camera.getWorldDirection(forward);

  if (forward.lengthSq() >= 0.001) {
    forward.normalize();
    world.outpostTower.yaw = Math.atan2(-forward.x, -forward.z);
    // Keep the current heading, but do not inherit the steep downward pitch of the orbit camera.
    world.outpostTower.pitch = clamp(Math.asin(clamp(forward.y, -0.98, 0.98)), -0.22, 0.18);
  }

  updateOutpostTowerAimFromAngles();
}

function updateOutpostTowerAimFromAngles() {
  if (!world.outpostTower.active) {
    return;
  }

  const direction = getOutpostTowerAimDirection();
  world.outpostTower.aimDirection.copy(direction);

  const origin = getOutpostTowerCameraOrigin();
  world.aimRayOrigin.copy(origin);
  world.aimRayDirection.copy(direction);
  world.aimPoint.copy(origin).addScaledVector(direction, 90);

  const horizontal = direction.clone();
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

function updateLockedThirdPersonAim() {
  if (!isLockedThirdPersonCamera()) {
    return;
  }
  world.aimFollowsView = true;

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
    world.aimRayOrigin.copy(world.camera.position);
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
  // Shoulder melee follows the view, never the parallax to a nearby ray hit.
  // Keep the 3D hit point separately for projectiles and vertical weapon aim.
  world.camera.getWorldDirection(world.aimDirection);
  world.aimDirection.setY(0).normalize();
  world.aimTarget.set(state.player.position.x + world.aimDirection.x * 42, 0,
    state.player.position.z + world.aimDirection.z * 42);
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

function setLoreScrollOpen(open, archiveTab = "book") {
  // Wait until all panels finish switching before recapturing the cursor.
  queueMicrotask(resumeLockedCameraAfterMenu);
  if (!ui.loreScroll) {
    return;
  }

  ui.loreScroll.classList.toggle("is-hidden", !open);
  ui.loreScroll.setAttribute("aria-hidden", String(!open));
  ui.hudLoreButton.setAttribute("aria-expanded", String(open));
  ui.hudLoreButton.classList.toggle("is-active", open);

  if (open) {
    world.keys.clear();
    releaseLockedCameraForMenu();
    setStatusPanelOpen(false);
    setInventoryPanelOpen(false);
    setBuildPanelOpen(false);
    closeNpcTradePanel();
    closeStewardPanel();
    closeDepotPanel();
    setHousePanelOpen(false);
    setRulerPanelOpen(false);
    selectArchiveDisplay(ui.loreBody, archiveTab);
    renderLoreScroll();
  }
}

function renderLoreScroll() {
  if (!ui.loreBody || !ui.loreMeta) {
    return;
  }

  const castleId = world.sceneMode === "interior" ? world.interiorFactionId : null;
  ui.loreMeta.textContent = castleId ? "Castle archive · family histories" : "Grand Library · histories of the realm";
  renderArchive(ui.loreBody, state, castleId);

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
      ${(volume.foundings ?? []).map(f => `<div class="founding-record">${flagIcon(f.flag)}<strong>${escapeHtml(f.factionName)} — King ${escapeHtml(f.rulerName)}</strong></div>`).join("")}
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
  // Wait until all panels finish switching before recapturing the cursor.
  queueMicrotask(resumeLockedCameraAfterMenu);
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
    setHousePanelOpen(false);
    setRulerPanelOpen(false, { leaveSeat: false });
    renderStatusPanel();
  }
}

function setInventoryPanelOpen(open) {
  if (open && ui.inventoryPanel.classList.contains("is-hidden")) {
    state.player.selectedGearItemId = null;
  }
  // Wait until all panels finish switching before recapturing the cursor.
  queueMicrotask(resumeLockedCameraAfterMenu);
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
    setHousePanelOpen(false);
    setRulerPanelOpen(false);
    renderInventoryPanel();
  }
}

function setBuildPanelOpen(open) {
  // Wait until all panels finish switching before recapturing the cursor.
  queueMicrotask(resumeLockedCameraAfterMenu);
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
    setHousePanelOpen(false);
    setRulerPanelOpen(false);
    renderBuildPanel();
  }
}

function isTypingInField(target) {
  return ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName);
}

function setHousePanelOpen(open) {
  // Wait until all panels finish switching before recapturing the cursor.
  queueMicrotask(resumeLockedCameraAfterMenu);
  ui.housePanel.classList.toggle("is-hidden", !open);
  ui.housePanel.setAttribute("aria-hidden", String(!open));
  ui.hudHouseButton.setAttribute("aria-expanded", String(open));
  ui.hudHouseButton.classList.toggle("is-active", open);

  if (open) {
    releaseLockedCameraForMenu();
    setLoreScrollOpen(false);
    setStatusPanelOpen(false);
    setInventoryPanelOpen(false);
    setBuildPanelOpen(false);
    closeNpcTradePanel();
    closeStewardPanel();
    closeDepotPanel();
    setRulerPanelOpen(false, { leaveSeat: false });
    renderHousePanel();
  }
}

function setRulerPanelOpen(open, options = {}) {
  // Wait until all panels finish switching before recapturing the cursor.
  queueMicrotask(resumeLockedCameraAfterMenu);
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
    setHousePanelOpen(false);
    renderRulerPanel();
  } else if (options.leaveSeat !== false) {
    leaveRulerSeat();
  }
}

function renderHousePanel() {
  const houseId = sanitizeHouseName(state.player.houseName);

  if (!houseId) {
    setHousePanelOpen(false);
    return;
  }

  const houseName = formatHouseName(houseId);
  const members = getHouseMembers(state, houseId);
  const otherHouses = getKnownHouses(state).filter((house) => house.id !== houseId);
  const factionNames = [...new Set(members.map((member) => FACTION_LOOKUP[member.factionId]?.name).filter(Boolean))];

  ui.houseTitle.textContent = `House ${houseName}`;
  ui.houseStatus.textContent = `${members.length} ${members.length === 1 ? "member" : "members"}${
    factionNames.length ? ` | ${factionNames.join(", ")}` : ""
  }`;
  ui.houseBody.innerHTML = `
    <section class="house-section" aria-label="House members">
      <div class="house-section-heading">
        <strong>Members</strong>
        <span>${members.length}</span>
      </div>
      ${
        members.length
          ? members
              .map(
                (member) => `
                  <article class="ruler-row">
                    <strong>${escapeHtml(member.name)}</strong>
                    <span>${escapeHtml(FACTION_LOOKUP[member.factionId]?.name ?? "Unsworn")} | ${historyRenown(state.history, member.playerId)} renown</span>
                  </article>
                `
              )
              .join("")
          : `<div class="notice">No house members are known.</div>`
      }
    </section>
    <section class="house-section" aria-label="House relations">
      <div class="house-section-heading">
        <strong>House Relations</strong>
        <span>Ally, Neutral, or Enemy</span>
      </div>
      ${
        otherHouses.length
          ? otherHouses
              .map((house) => {
                const relation = state.houseRelations?.[houseId]?.[house.id] ?? "Neutral";
                const houseFactions = house.factionIds.map((factionId) => FACTION_LOOKUP[factionId]?.name).filter(Boolean);
                return `
                  <article class="ruler-row">
                    <strong>House ${escapeHtml(house.name)}</strong>
                    <span>${relation}${houseFactions.length ? ` | ${escapeHtml(houseFactions.join(", "))}` : ""}</span>
                    <div class="politics-actions">
                      ${renderRelationButtons("house", house.id, relation)}
                    </div>
                  </article>
                `;
              })
              .join("")
          : `<div class="notice">No other houses are known yet. They will appear here when their members join the realm.</div>`
      }
    </section>
  `;
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
  const giftForm = ui.rulerResources.querySelector("[data-resource-gift]");
  const stockpile = ui.rulerResources.querySelector("[data-resource-stockpile]");
  if (giftForm && stockpile && giftForm.dataset.factionId === factionId && isFactionRuler(state, factionId)) {
    // Updating totals must not interrupt typing or close the autocomplete popup.
    stockpile.innerHTML = renderRulerResources(factionId);
  } else {
    ui.rulerResources.innerHTML = `<div data-resource-stockpile>${renderRulerResources(factionId)}</div>`;
  }
  ui.rulerPolitics.innerHTML = `<article class="founding-record">${flagIcon(faction.flag)}<div><strong>${escapeHtml(faction.name)}</strong><p>${escapeHtml(faction.summary)}</p>
    ${isFactionRuler(state, factionId) ? `<button type="button" data-edit-faction ${world.seatedOnThrone && world.interiorFactionId === factionId ? "" : "disabled"}>Edit name, flag and mission</button><p>Sit on your throne to edit your faction.</p>` : ""}</div></article>` + renderRulerPolitics(factionId);
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
      <strong>${escapeHtml(faction.name)}</strong>
      <p>${escapeHtml(faction.summary)}</p>
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
                <span>${member.name === rulerName ? "King" : "Member"} | ${historyRenown(state.history, member.playerId)} renown</span>
              </article>
            `
          )
          .join("")}
      </div>
    </details>
  `;
}

function openResourceGift(resourceId) {
  const factionId = state.selectedFactionId || world.interiorFactionId;
  if (!isFactionRuler(state, factionId)) return;
  const previous = ui.rulerResources.querySelector("[data-resource-gift]");
  if (previous?.dataset.busy === "true") return;
  previous?.remove();
  const form = document.createElement("form");
  form.dataset.resourceGift = resourceId;
  form.dataset.factionId = factionId;
  form.className = "resource-gift-form";
  const members = getFactionMembers(state, factionId);
  const choices = members.map(member => ({ ...member, label: members.filter(other => other.name === member.name).length > 1
    ? `${member.name} (${member.playerId})` : member.name }));
  form.innerHTML = `
    <strong>Give ${escapeHtml(resourceId === "gold" ? "Gold" : RESOURCE_LOOKUP[resourceId].name)}</strong>
    <label>Faction member <input name="recipient" list="resource-gift-members" placeholder="Type a member's name" autocomplete="off" required></label>
    <datalist id="resource-gift-members">${choices.map(member => `<option value="${escapeHtml(member.label)}"></option>`).join("")}</datalist>
    <label>Amount <input name="amount" type="number" min="1" step="1" max="9007199254740991" value="1" required></label>
    <div class="politics-actions"><button type="submit">Send</button><button type="button" data-cancel-gift>Cancel</button></div>
    <p role="status" aria-live="polite"></p>`;
  form.querySelector("[data-cancel-gift]").onclick = () => { if (form.dataset.busy !== "true") form.remove(); };
  let pendingRequest = null;
  form.onsubmit = async event => {
    event.preventDefault();
    if (form.dataset.busy === "true") return;
    const status = form.querySelector('[role="status"]');
    const recipient = choices.find(member => member.label.toLocaleLowerCase() === form.elements.recipient.value.trim().toLocaleLowerCase());
    const amount = Number(form.elements.amount.value);
    if (!recipient) { status.textContent = "Select a faction member from the suggestions."; return; }
    if (!Number.isSafeInteger(amount) || amount <= 0) { status.textContent = "Enter a positive whole-number amount."; return; }
    if (!world.persistence.enabled) { status.textContent = "Connect to the server to send resources."; return; }
    if (world.persistence.saveInFlight || world.persistence.loadInFlight) { status.textContent = "Syncing resources. Please try Send again in a moment."; return; }
    const signature = `${recipient.playerId}:${amount}`;
    if (pendingRequest?.signature !== signature) pendingRequest = { signature, id: createId("transfer") };
    form.dataset.busy = "true";
    form.querySelectorAll("button, input").forEach(control => control.disabled = true);
    status.textContent = "Sending…";
    try {
      await savePersistentState({ includeWorld: world.persistence.dirty });
      if (!world.persistence.online) throw new Error("Unable to sync resources. Please try again.");
      world.persistence.saveInFlight = true;
      const data = await fetchPersistentJson("/api/world/give-resource", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: state.player.id, factionId, recipientId: recipient.playerId, resourceId, amount, requestId: pendingRequest.id })
      });
      applyPersistentPayload(data);
      status.textContent = data.message || "Unable to send resources.";
      pendingRequest = null;
      if (data.ok) { form.elements.amount.value = "1"; refreshUi(); }
    } catch (error) {
      status.textContent = error.message || "Unable to send resources. Check your connection.";
    } finally {
      world.persistence.saveInFlight = false;
      form.dataset.busy = "false";
      form.querySelectorAll("button, input").forEach(control => control.disabled = false);
    }
  };
  ui.rulerResources.append(form);
  form.elements.recipient.focus();
}

function renderRulerResources(factionId) {
  const store = state.factionResources[factionId];
  const incomeNotice = world.persistence.enabled && world.persistence.incomeSupported === false
    ? "The running server needs restarting to enable passive production. Reload the game after restarting it."
    : "Live faction stockpile: totals update as production is received.";
  const production = id => {
    const rate = factionProduction(state, factionId, id);
    return `+${rate.amount} / 5s from ${rate.count} captured ${rate.count === 1 ? "site" : "sites"}`;
  };
  return `
    <p class="notice" role="status">${incomeNotice}</p>
    <article class="ruler-row">
      <strong>Gold</strong>
      <span>${Math.round(store.gold)} | ${production("gold")}</span>
      ${isFactionRuler(state, factionId) ? `<button type="button" data-give-resource="gold">Give</button>` : ""}
    </article>
    ${RESOURCE_TYPES.map(
      (resource) => `
        <article class="ruler-row">
          <strong>${resource.name}</strong>
          <span>${store.resources[resource.id] ?? 0} | ${production(resource.id)}</span>
          ${isFactionRuler(state, factionId) ? `<button type="button" data-give-resource="${resource.id}">Give</button>` : ""}
        </article>
      `
    ).join("")}
  `;
}

function renderRulerPolitics(factionId) {
  const governance = state.factionGovernance[factionId];
  const canManage = isFactionRuler(state, factionId);

  return FACTIONS.filter((faction) => state.factions[faction.id] && faction.id !== factionId)
    .map((faction) => {
      const relation = governance.relationStatus[faction.id] ?? "Neutral";
      return `
        <article class="ruler-row">
          <strong>${escapeHtml(faction.name)}</strong>
          <span>${relation}</span>
          <div class="politics-actions">
            ${renderRelationButtons("faction", faction.id, relation, canManage)}
          </div>
        </article>
      `;
    })
    .join("");
}

function renderRelationButtons(kind, targetId, relation, enabled = true) {
  const dataAction = kind === "house" ? "data-house-politics-action" : "data-politics-action";
  const dataTarget = kind === "house" ? "data-target-house" : "data-target-faction";

  return ["Ally", "Neutral", "Enemy"]
    .map(
      (status) => `
        <button class="${relation === status ? "is-active" : ""}" ${dataAction}="${status.toLowerCase()}" ${dataTarget}="${targetId}" type="button" ${enabled ? "" : "disabled"}>${status}</button>
      `
    )
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
        : zone.label === "Wildlands" ? getRegionAt(state.player.position.x, state.player.position.z).name : zone.label;
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
      ${world.sceneMode === "outdoor" ? `<p>Grand Library ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ${Math.round(Math.hypot(state.player.position.x,state.player.position.z))}m toward the island's centre. Follow the pale roads to the twin towers.</p>` : ""}
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
    if (state.player.selectedGearItemId === row.dataset.itemId) {
      state.player.selectedGearItemId = null;
    } else {
      selectGearItem(state, row.dataset.itemId);
    }

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
    setCameraView: ({ yaw = 0, pitch = 0.6, distance = 90 } = {}) => {
      world.cameraYaw = yaw;
      world.cameraPitch = isLockedThirdPersonCamera()
        ? clamp(pitch, LOCKED_THIRD_PERSON_CAMERA.minPitch, LOCKED_THIRD_PERSON_CAMERA.maxPitch)
        : clamp(pitch, 0.15, 1.4);
      world.cameraDistance = clamp(distance, 20, 240);
    },
    getWorldStats: () => ({
      region: getRegionAt(state.player.position.x,state.player.position.z).name,
      camps: MOB_CAMPS.map(camp => ({id:camp.id, alive:world.outdoorMonsters.filter(mob => mob.campId === camp.id && !mob.dead).length})),
      drawCalls: world.renderer.info.render.calls,
      triangles: world.renderer.info.render.triangles
    }),
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

  world.placement.position = clampWorldPosition(target, 60);
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
  if (distanceToCoast(position.x, position.z) < 60 || Math.hypot(position.x, position.z) < 130 || getInlandLakeDistance(position.x, position.z) < 1.25) return false;
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

  if (type === "street-lamp") {
    return 3.4;
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
  setHousePanelOpen(false);
  setRulerPanelOpen(false);
  renderNpcTradePanel();
}

function openBlacksmithPanel() {
  if (world.sceneMode !== "interior") {
    return;
  }

  const factionId = getActiveBlacksmithFactionId();
  if (!factionId) {
    flash("This forge has no faction to serve.");
    return;
  }

  if (!getFactionBlacksmithStock(factionId).length) {
    refreshBlacksmithStock(factionId);
  }

  forgeMenu.tab = 'exchange';
  forgeMenu.selection = [];
  exchangePages.stock = 0;
  exchangePages.inventory = 0;
  world.activeTradeNpcId = BLACKSMITH_NPC.id;
  ui.npcTradeAmount.value = 1;
  ui.npcTradePanel.classList.remove("is-hidden");
  ui.npcTradePanel.setAttribute("aria-hidden", "false");
  releaseLockedCameraForMenu();
  setLoreScrollOpen(false);
  closeStewardPanel();
  closeDepotPanel();
  setStatusPanelOpen(false);
  setInventoryPanelOpen(false);
  setBuildPanelOpen(false);
  setHousePanelOpen(false);
  setRulerPanelOpen(false);
  renderNpcTradePanel();
}

function closeNpcTradePanel() {
  // Wait until all panels finish switching before recapturing the cursor.
  queueMicrotask(resumeLockedCameraAfterMenu);
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
  setHousePanelOpen(false);
  setRulerPanelOpen(false);
  renderStewardPanel();
}

function closeStewardPanel() {
  // Wait until all panels finish switching before recapturing the cursor.
  queueMicrotask(resumeLockedCameraAfterMenu);
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
  setHousePanelOpen(false);
  setRulerPanelOpen(false);
  renderDepotPanel();
}

function closeDepotPanel() {
  // Wait until all panels finish switching before recapturing the cursor.
  queueMicrotask(resumeLockedCameraAfterMenu);
  world.depotPanelOpen = false;
  world.activeDepotId = null;
  ui.depotPanel.classList.add("is-hidden");
  ui.depotPanel.setAttribute("aria-hidden", "true");
}

function getActiveTradeNpc() {
  if (world.activeTradeNpcId === BLACKSMITH_NPC.id) {
    return BLACKSMITH_NPC;
  }

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

function getActiveBlacksmithFactionId() {
  return world.sceneMode === "interior" ? world.interiorFactionId : state.selectedFactionId;
}

function getFactionBlacksmithProgress(factionId = getActiveBlacksmithFactionId()) {
  const store = factionId ? state.factionResources[factionId] : null;

  if (!store) {
    return { xp: 0, level: 1 };
  }

  store.blacksmith = normalizeBlacksmithProgress(store.blacksmith);
  return store.blacksmith;
}

function getBlacksmithLevelFromXp(xp) {
  const safeXp = Math.max(0, Number(xp) || 0);
  let level = 1;

  while (level < BLACKSMITH_MAX_LEVEL && safeXp >= getBlacksmithXpForLevel(level + 1)) {
    level += 1;
  }

  return level;
}

function getBlacksmithXpForLevel(level) {
  const safeLevel = clamp(Math.floor(Number(level) || 1), 1, BLACKSMITH_MAX_LEVEL);
  if (safeLevel <= 1) {
    return 0;
  }

  return Math.round(90 * (safeLevel - 1) * safeLevel * 0.75);
}

function getBlacksmithNextLevelXp(progress) {
  return progress.level >= BLACKSMITH_MAX_LEVEL
    ? progress.xp
    : getBlacksmithXpForLevel(progress.level + 1);
}

function addBlacksmithXp(factionId, amount) {
  const progress = getFactionBlacksmithProgress(factionId);
  const beforeLevel = progress.level;
  progress.xp = Math.max(0, Math.round(progress.xp + Math.max(0, Number(amount) || 0)));
  progress.level = getBlacksmithLevelFromXp(progress.xp);

  if (progress.level > beforeLevel) {
    refreshBlacksmithStock(factionId);
  }

  return {
    progress,
    levelGained: progress.level > beforeLevel
  };
}

function getFactionBlacksmithStock(factionId = getActiveBlacksmithFactionId()) {
  if (!factionId) {
    return world.blacksmithStock;
  }

  world.blacksmithStockByFaction[factionId] = world.blacksmithStockByFaction[factionId] ?? [];

  if (factionId === getActiveBlacksmithFactionId()) {
    world.blacksmithStock = world.blacksmithStockByFaction[factionId];
  }

  return world.blacksmithStockByFaction[factionId];
}

function setFactionBlacksmithStock(factionId, stock) {
  if (!factionId) {
    world.blacksmithStock = stock;
    return stock;
  }

  world.blacksmithStockByFaction[factionId] = stock;

  if (factionId === getActiveBlacksmithFactionId()) {
    world.blacksmithStock = stock;
  }

  return stock;
}

function refreshBlacksmithStock(factionId = getActiveBlacksmithFactionId()) {
  const progress = getFactionBlacksmithProgress(factionId);
  const stock = Array.from({ length: BLACKSMITH_STOCK_SIZE }, () => {
    const item = createRandomBlacksmithWeapon(progress.level);
    return {
      id: createId("smith-stock"),
      item,
      price: getBlacksmithWeaponPrice(item)
    };
  });

  for (const definition of ITEM_DEFINITIONS.filter(item => isShield(item.type))) {
    const item = stampEquipmentMaterial({ ...definition, id: createId('item'), durability: definition.maxDurability, weapon: null, armor: null });
    stock.push({ id: createId('smith-stock'), item, price: getBlacksmithEquipmentPrice(item) });
  }
  return setFactionBlacksmithStock(factionId, stock);
}

function createRandomBlacksmithWeapon(level = 1) {
  const safeLevel = clamp(Math.floor(Number(level) || 1), 1, BLACKSMITH_MAX_LEVEL);
  const definition = randomItem(getBlacksmithWeaponDefinitionsForLevel(safeLevel));
  const baseStats = WEAPON_STATS[definition.type];
  const levelBonus = (safeLevel - 1) * 0.055;
  const quality = randomBetween(0.84 + levelBonus * 0.65, 1.14 + levelBonus);
  const maxDurability = Math.round(clamp(
    definition.maxDurability * randomBetween(0.84 + levelBonus * 0.35, 1.12 + levelBonus),
    45,
    150 + safeLevel * 12
  ));
  const weapon = {
    range: baseStats.range,
    damage: Math.round(clamp(baseStats.damage * quality * randomBetween(0.9, 1.12 + levelBonus), 1, 48 + safeLevel * 6)),
    penetration: Math.round(clamp(baseStats.penetration * quality * randomBetween(0.86, 1.12 + levelBonus), 0, 24 + safeLevel * 3)),
    frequency: roundStat(clamp(baseStats.frequency * randomBetween(0.9, 1.08 + levelBonus * 0.45), 0.35, 2.25 + safeLevel * 0.04)),
    speed: roundStat(clamp(baseStats.speed * randomBetween(0.9, 1.1 + levelBonus * 0.45), 0.45, 2.25 + safeLevel * 0.04)),
    knockback: roundStat(clamp(baseStats.knockback * quality * randomBetween(0.9, 1.12 + levelBonus), 0, 6 + safeLevel * 0.8))
  };
  const prefixPool = safeLevel >= 6
    ? [...BLACKSMITH_WEAPON_PREFIXES, ...BLACKSMITH_MASTER_PREFIXES]
    : BLACKSMITH_WEAPON_PREFIXES;

  return stampEquipmentMaterial({
    id: createId("item"),
    name: `${randomItem(prefixPool)} ${definition.type}`,
    type: definition.type,
    category: "Weapon",
    rarity: getBlacksmithWeaponRarity(quality, weapon),
    weapon,
    durability: maxDurability,
    maxDurability
  });
}

function getBlacksmithWeaponDefinitionsForLevel(level) {
  return PVE_WEAPON_DEFINITIONS.filter((definition) => {
    if (definition.type === "Long Sword") return level >= 3;
    if (definition.type === "Crossbow") return level >= 5;
    if (definition.type === "Long Bow") return level >= 7;
    return true;
  });
}

function getBlacksmithWeaponPrice(item) {
  const stats = item.weapon ?? {};
  const rarityMultiplier = {
    Common: 1,
    Uncommon: 1.22,
    Rare: 1.55,
    Epic: 2.05
  }[item.rarity] ?? 1;
  const rating =
    Number(stats.damage) * 6 +
    Number(stats.penetration) * 5 +
    Number(stats.range) * 2.5 +
    Number(stats.knockback) * 8 +
    Number(stats.frequency) * 34 +
    Number(stats.speed) * 26 +
    Number(item.maxDurability) * 0.65;

  return Math.max(45, Math.round(rating * rarityMultiplier));
}

function getBlacksmithArmorPrice(item) {
  const stats = item.armor ?? {};
  const rarityMultiplier = {
    Common: 1,
    Uncommon: 1.22,
    Rare: 1.55,
    Epic: 2.05
  }[item.rarity] ?? 1;
  const rating =
    Number(stats.defense) * 8 +
    Number(stats.resistance) * 5 +
    Number(stats.toughness) * 7 +
    Number(item.maxDurability) * 0.65;

  return Math.max(45, Math.round(rating * rarityMultiplier));
}

function getBlacksmithEquipmentPrice(item) {
  if (isShield(item?.type)) return item.type === "Long Shield" ? 260 : 160;
  return isArmorItem(item) ? getBlacksmithArmorPrice(item) : getBlacksmithWeaponPrice(item);
}

function getBlacksmithEquipmentSellPrice(item) {
  const condition = clamp((Number(item.durability) || 0) / Math.max(1, Number(item.maxDurability) || 1), 0, 1);
  return Math.floor(getBlacksmithEquipmentPrice(item) * 0.10 * condition);
}

function isBlacksmithEquipment(item) {
  return isWeaponItem(item) || isArmorItem(item) || isShield(item?.type);
}

function getEquippedItemIds() {
  return new Set(
    Object.entries(state.player.equipment)
      .filter(([key, itemId]) => key.endsWith("ItemId") && itemId)
      .map(([, itemId]) => itemId)
  );
}

function getBlacksmithWeaponRarity(quality, stats) {
  const score = quality + (stats.damage + stats.penetration + stats.knockback) / 100;

  if (score > 1.88) return "Epic";
  if (score > 1.55) return "Rare";
  if (score > 1.22) return "Uncommon";
  return "Common";
}

function buyBlacksmithWeapon(stockId) {
  if (world.activeTradeNpcId !== BLACKSMITH_NPC.id) {
    return { ok: false, message: "The blacksmith is not trading right now." };
  }

  const factionId = getActiveBlacksmithFactionId();
  const stockList = getFactionBlacksmithStock(factionId);
  const stockIndex = stockList.findIndex((entry) => entry.id === stockId);
  const stock = stockList[stockIndex];

  if (!stock) {
    return { ok: false, message: "That equipment is no longer available." };
  }

  if (state.player.gold < stock.price) {
    return { ok: false, message: `You need ${stock.price} gold for ${stock.item.name}.` };
  }

  state.player.gold -= stock.price;
  state.player.inventory.push(stock.item);
  state.player.selectedGearItemId = stock.item.id;
  stockList.splice(stockIndex, 1);
  const xpResult = addBlacksmithXp(factionId, Math.max(8, Math.round(stock.price * BLACKSMITH_BUY_XP_RATE)));

  if (!stockList.length) {
    refreshBlacksmithStock(factionId);
  }

  return {
    ok: true,
    message: xpResult.levelGained
      ? `Bought ${stock.item.name} for ${stock.price} gold. The blacksmith reached level ${xpResult.progress.level}.`
      : `Bought ${stock.item.name} for ${stock.price} gold.`
  };
}

function sellBlacksmithEquipment(itemId) {
  if (world.activeTradeNpcId !== BLACKSMITH_NPC.id) {
    return { ok: false, message: "The blacksmith is not trading right now." };
  }

  const factionId = getActiveBlacksmithFactionId();
  const itemIndex = state.player.inventory.findIndex((entry) => entry.id === itemId);
  const item = state.player.inventory[itemIndex];

  if (!item) {
    return { ok: false, message: "That equipment is no longer in your inventory." };
  }

  if (!isBlacksmithEquipment(item)) {
    return { ok: false, message: `${item.name} is not equipment.` };
  }

  const price = getBlacksmithEquipmentSellPrice(item);
  state.player.inventory.splice(itemIndex, 1);
  state.player.gold += price;
  state.player.hotbar = state.player.hotbar.map((entry) => (entry === item.id ? null : entry));
  clearItemFromAllEquipment(item.id);

  if (state.player.selectedGearItemId === item.id) {
    state.player.selectedGearItemId = state.player.inventory[0]?.id ?? null;
  }

  const xpResult = addBlacksmithXp(factionId, Math.max(6, Math.round(price * BLACKSMITH_SELL_XP_RATE)));
  const stockList = getFactionBlacksmithStock(factionId);
  stockList.push({
    id: createId("smith-stock"),
    item,
    price: getBlacksmithEquipmentPrice(item)
  });

  if (stockList.length > BLACKSMITH_MAX_STOCK_SIZE) {
    stockList.splice(0, stockList.length - BLACKSMITH_MAX_STOCK_SIZE);
  }

  return {
    ok: true,
    message: xpResult.levelGained
      ? `Sold ${item.name} for ${price} gold. The blacksmith reached level ${xpResult.progress.level}.`
      : `Sold ${item.name} for ${price} gold.`
  };
}

function sellAllBlacksmithEquipment() {
  if (world.activeTradeNpcId !== BLACKSMITH_NPC.id) {
    return { ok: false, message: "The blacksmith is not trading right now." };
  }

  const equippedIds = getEquippedItemIds();
  const items = state.player.inventory.filter((item) => isBlacksmithEquipment(item) && !equippedIds.has(item.id));

  if (!items.length) {
    return { ok: false, message: "You have no unequipped equipment to sell." };
  }

  const soldIds = new Set(items.map((item) => item.id));
  const salePrices = items.map((item) => getBlacksmithEquipmentSellPrice(item));
  const totalPrice = salePrices.reduce((total, price) => total + price, 0);
  state.player.inventory = state.player.inventory.filter((item) => !soldIds.has(item.id));
  state.player.gold += totalPrice;
  state.player.hotbar = state.player.hotbar.map((itemId) => (soldIds.has(itemId) ? null : itemId));

  if (soldIds.has(state.player.selectedGearItemId)) {
    state.player.selectedGearItemId = state.player.inventory[0]?.id ?? null;
  }

  const factionId = getActiveBlacksmithFactionId();
  const xp = salePrices.reduce(
    (total, price) => total + Math.max(6, Math.round(price * BLACKSMITH_SELL_XP_RATE)),
    0
  );
  const xpResult = addBlacksmithXp(factionId, xp);
  const stockList = getFactionBlacksmithStock(factionId);
  stockList.push(...items.map((item) => ({
    id: createId("smith-stock"),
    item,
    price: getBlacksmithEquipmentPrice(item)
  })));

  if (stockList.length > BLACKSMITH_MAX_STOCK_SIZE) {
    stockList.splice(0, stockList.length - BLACKSMITH_MAX_STOCK_SIZE);
  }

  const levelMessage = xpResult.levelGained
    ? ` The blacksmith reached level ${xpResult.progress.level}.`
    : "";
  return {
    ok: true,
    message: `Sold ${items.length} unequipped item${items.length === 1 ? "" : "s"} for ${totalPrice} gold.${levelMessage}`
  };
}

function renderNpcTradePanel() {
  const npc = getActiveTradeNpc();

  if (!npc) {
    return;
  }

  ui.npcTradePanel.classList.toggle('is-blacksmith', npc.id === BLACKSMITH_NPC.id);
  document.querySelector('#blacksmith-tabs').classList.toggle('is-hidden', npc.id !== BLACKSMITH_NPC.id);
  document.querySelectorAll('[data-smith-tab]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.smithTab === forgeMenu.tab)));
  ui.npcTradeAmount.closest(".trade-amount")?.classList.toggle("is-hidden", npc.id === BLACKSMITH_NPC.id);

  if (npc.id === BLACKSMITH_NPC.id) {
    renderBlacksmithPanel();
    return;
  }

  const amount = normalizeTradeAmount(ui.npcTradeAmount.value);

  ui.npcTradeTitle.textContent = npc.name;
  ui.npcTradeResource.textContent = "Resource market";
  ui.npcTradeResourceList.innerHTML = npc.resourceIds
    .map((resourceId) => {
      const resource = RESOURCE_LOOKUP[resourceId];
      const price = state.market[resourceId];
      const buyPrice = Math.round(price.buy);
      const sellPrice = Math.round(price.sell);
      const buyTotal = Math.round(price.buy * amount);
      const sellTotal = Math.round(price.sell * amount);
      const canBuy = state.player.gold >= buyTotal;
      const canSell = state.player.resources[resourceId] >= amount;

      return `
        <article class="deposit-row market-trade-row">
          <strong>${resource.name}</strong>
          <span>Buy ${buyPrice}</span>
          <span>Sell ${sellPrice}</span>
          <button class="primary" data-trade-resource="${resourceId}" data-trade-action="buy" type="button" ${canBuy ? "" : "disabled"}>Buy (${buyTotal})</button>
          <button data-trade-resource="${resourceId}" data-trade-action="sell" type="button" ${canSell ? "" : "disabled"}>Sell (${sellTotal})</button>
        </article>
      `;
    })
    .join("");
}

function renderBlacksmithPanel() {
  const factionId = getActiveBlacksmithFactionId();
  const faction = factionId ? FACTION_LOOKUP[factionId] : null;
  const progress = getFactionBlacksmithProgress(factionId);
  const nextXp = getBlacksmithNextLevelXp(progress);
  const equippedIds = getEquippedItemIds();
  const stockPage = exchangePage(getFactionBlacksmithStock(factionId), exchangePages.stock);
  const inventoryPage = exchangePage(state.player.inventory.filter(isBlacksmithEquipment), exchangePages.inventory);
  exchangePages.stock = stockPage.page;
  exchangePages.inventory = inventoryPage.page;
  const stockRows = stockPage.items
    .map((entry) => {
      const item = entry.item;
      const canBuy = state.player.gold >= entry.price;
      const statSummary = isShield(item.type) ? "Hold to block | Frontal defence" : isArmorItem(item)
        ? `DEF ${item.armor.defense} | RES ${item.armor.resistance}% | TGH ${item.armor.toughness}`
        : `DMG ${item.weapon.damage} | PEN ${item.weapon.penetration} | RNG ${WEAPON_STATS[item.type]?.range ?? item.weapon.range}`;

      return `
        <article class="deposit-row market-trade-row weapon-trade-row">
          <strong class="trade-item-name">${getItemIconMarkup(item, { decorative: true })}<span>${escapeHtml(equipmentName(item))}</span></strong>
          <span>${escapeHtml(item.rarity)}</span>
          <span>${entry.price} gold</span>
          <span>${statSummary}</span>
          <button class="primary" data-buy-blacksmith-weapon="${entry.id}" type="button" ${canBuy ? "" : "disabled"}>Buy</button>
        </article>
      `;
    })
    .join("");
  const sellRows = inventoryPage.items
    .map((item) => {
      const price = getBlacksmithEquipmentSellPrice(item);
      const equipped = equippedIds.has(item.id);
      const statSummary = isShield(item.type) ? "Hold to block | Frontal defence" : isArmorItem(item)
        ? `DEF ${item.armor.defense} | RES ${item.armor.resistance}% | TGH ${item.armor.toughness}`
        : `DMG ${item.weapon.damage} | PEN ${item.weapon.penetration} | RNG ${WEAPON_STATS[item.type]?.range ?? item.weapon.range}`;

      return `
        <article class="deposit-row market-trade-row weapon-trade-row">
          <strong class="trade-item-name">${getItemIconMarkup(item, { decorative: true })}<span>${escapeHtml(equipmentName(item))}</span></strong>
          <span>${equipped ? "Equipped" : escapeHtml(item.rarity)}</span>
          <span>${price} gold</span>
          <span>${statSummary} | Durability ${Math.round(item.durability)} / ${item.maxDurability}</span>
          <button data-sell-blacksmith-equipment="${item.id}" type="button">Sell</button>
        </article>
      `;
    })
    .join("");
  const sellableItems = state.player.inventory.filter((item) => isBlacksmithEquipment(item) && !equippedIds.has(item.id));
  const xpText = progress.level >= BLACKSMITH_MAX_LEVEL
    ? `${Math.round(progress.xp)} XP`
    : `${Math.round(progress.xp)} / ${nextXp} XP`;

  ui.npcTradeTitle.textContent = faction ? `${faction.name} Blacksmith` : BLACKSMITH_NPC.name;
  ui.npcTradeResource.textContent = `Level ${progress.level} | ${xpText}`;
  if (forgeMenu.tab === 'forge') {
    const html = renderForge(state.player, forgeMenu.selection, forgeMenu.mould, getItemIconMarkup, escapeHtml);
    if (ui.npcTradeResourceList.dataset.forgeHtml !== html || ui.npcTradeResourceList.dataset.smithTab !== 'forge') ui.npcTradeResourceList.innerHTML = html;
    ui.npcTradeResourceList.dataset.forgeHtml = html;
    ui.npcTradeResourceList.dataset.smithTab = 'forge';
    return;
  }
  const html = `
    <div class="blacksmith-section-title">For sale</div>
    <div class="blacksmith-page-rows">${stockRows || `<div class="notice">No equipment for sale.</div>`}</div>
    ${exchangePaginationMarkup('stock', 'For sale', stockPage)}
    <div class="blacksmith-section-header">
      <div class="blacksmith-section-title">Sell equipment</div>
      <button class="primary" data-sell-all-blacksmith-equipment type="button" ${sellableItems.length ? "" : "disabled"}>Sell all unequipped (${sellableItems.length})</button>
    </div>
    <div class="blacksmith-page-rows">${sellRows || `<div class="notice">You have no equipment to sell.</div>`}</div>
    ${exchangePaginationMarkup('inventory', 'Sell equipment', inventoryPage)}
  `;
  if (ui.npcTradeResourceList.dataset.exchangeHtml !== html || ui.npcTradeResourceList.dataset.smithTab !== 'exchange') {
    ui.npcTradeResourceList.innerHTML = html;
  }
  ui.npcTradeResourceList.dataset.exchangeHtml = html;
  ui.npcTradeResourceList.dataset.smithTab = 'exchange';
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
  const storageOpen = stewardMenu.tab === 'storage';
  ui.stewardStatus.textContent = storageOpen ? 'Your personal loot bank · Safe through death' : 'Faction vault deposits';
  document.querySelectorAll('[data-steward-tab]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.stewardTab === stewardMenu.tab)));
  ui.stewardAmount.closest('label').classList.toggle('is-hidden', storageOpen);
  ui.stewardDepositList.classList.toggle('is-hidden', storageOpen);
  const storage = document.querySelector('#steward-storage');
  storage.classList.toggle('is-hidden', !storageOpen);
  if (storageOpen) {
    const equipped = getEquippedItemIds();
    const section = (items, title, action) => `<section><h3>${title} (${items.length})</h3><div class="steward-storage-items">${items.map(item => {
      const disabled = action === 'deposit' && equipped.has(item.id);
      return `<article class="steward-storage-row">
        <strong class="trade-item-name">${getItemIconMarkup(item, { decorative: true })}<span>${escapeHtml(equipmentName(item))}</span></strong>
        <button type="button" data-storage-item="${escapeHtml(item.id)}" data-storage-action="${action}" ${disabled ? 'disabled' : ''}>${disabled ? 'Equipped' : action === 'deposit' ? 'Deposit' : 'Withdraw'}</button>
      </article>`;
    }).join('') || '<p class="notice">No items here yet.</p>'}</div></section>`;
    storage.innerHTML = `<p class="notice">Only you can access these items. Unequip gear before depositing it.</p><div class="steward-storage-columns">${section(state.player.inventory, 'Carried loot', 'deposit')}${section(state.player.stewardInventory, 'Stored loot', 'withdraw')}</div>`;
    return;
  }
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
              ${getItemIconMarkup(item, { decorative: true })}
              <strong>${escapeHtml(item.type)}</strong>
              <span>${escapeHtml(equipmentName(item))}</span>
              <span>${escapeHtml(item.rarity)} | ${Math.round(item.durability)} / ${item.maxDurability}</span>
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
  if (!canUseMovementAbility() || isCameraMenuOpen()) {
    motion.lastSpaceTap = null;
    return;
  }
  const planted = Object.values(world.attacks).find(a => a?.jumpAttack === 'plant');
  if (planted && canSpearVault(planted, motion)) {
    planted.vaultUsed = true;
    world.attacks[planted.hand] = null;
    motion.jumping = true;
    motion.verticalVelocity = JUMP_VELOCITY;
    motion.airborneDirection.copy(getPlayerWalkingDirection());
    motion.airborneSpeed = getPlayerWalkingSpeed();
    motion.lastSpaceTap = null;
    return;
  }
  const now = performance.now();
  const doubleTap = motion.lastSpaceTap != null && now - motion.lastSpaceTap <= ROLL_DOUBLE_TAP_MS;
  motion.lastSpaceTap = doubleTap ? null : now;
  if (doubleTap) { startPlayerRoll(); return; }
  startPlayerJump();
}

function canUseMovementAbility() {
  return Boolean(
    state.player.firstName &&
    ui.factionSelect.classList.contains("is-hidden") &&
    !world.seatedOnThrone &&
    !world.outpostTower.active &&
    !state.player.dead
  );
}

function startPlayerJump() {
  const motion = world.playerMotion;
  motion.supportOffset = getPlayerSupportOffset(state.player.position);

  if (motion.jumping || motion.rolling || isPlayerAirborne(motion)) {
    return false;
  }

  motion.jumping = true;
  motion.verticalOffset = motion.supportOffset;
  motion.verticalVelocity = JUMP_VELOCITY;
  motion.airborneDirection.copy(getPlayerWalkingDirection());
  motion.airborneSpeed = getPlayerWalkingSpeed();
  return true;
}

function startPlayerRoll() {
  const motion = world.playerMotion;

  if (motion.rolling || motion.rollCooldown > 0) {
    return false;
  }
  if (!Object.values(world.attacks).every(canCancelIntoDefense)) {
    motion.rollQueuedUntil = state.elapsed + ATTACK_BUFFER_SECONDS;
    return false;
  }
  motion.rollQueuedUntil = null;

  const direction = getSpaceRollDirection();

  if (direction.lengthSq() < 0.001) {
    return false;
  }

  world.attacks = { left: null, right: null };
  world.comboChains = { left: null, right: null };
  world.weaveQueue = null;
  world.flailCharge = null;
  world.guard.hand = null;
  clearRangedCharge();
  motion.rollBlendFrom = world.playerRig
    ? captureCombatTransforms().filter(entry => entry.node !== world.playerMesh)
    : null;
  motion.rolling = true;
  motion.rollElapsed = 0;
  motion.rollDirection.copy(direction);
  motion.airborneDirection.copy(direction);
  motion.airborneSpeed = ROLL_SPEED;
  // Carry the jump into a low forward flight instead of forcing an immediate landing.
  motion.verticalVelocity = isPlayerAirborne(motion)
    ? Math.min(motion.verticalVelocity, ROLL_VERTICAL_VELOCITY)
    : ROLL_VERTICAL_VELOCITY;
  motion.jumping = false;
  return true;
}

function isPlayerAirborne(motion = world.playerMotion) {
  return motion.verticalOffset > (motion.supportOffset ?? 0) + 0.08;
}

function isPlayerRolling(motion = world.playerMotion) {
  return Boolean(motion.rolling);
}

function getSpaceRollDirection() {
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

function getPlayerWalkingDirection(input = getMovementInput()) {
  const { forward, right } = getCameraMovementBasis();
  const direction = new THREE.Vector3()
    .addScaledVector(forward, input.y)
    .addScaledVector(right, input.x);

  return direction.lengthSq() > 0 ? direction.normalize() : direction;
}

function getPlayerWalkingSpeed(input = getMovementInput()) {
  const baseSpeed = world.keys.has("ShiftLeft") ? 30 : 19;
  // Pure strafing is 30% slower, with a proportional penalty on diagonals.
  const strafeMultiplier = 1 - 0.3 * Math.abs(input.x);
  return baseSpeed * strafeMultiplier * roadSpeedMultiplier(WORLD_ROUTES, state.player.position, {
    outdoor: world.sceneMode === "outdoor",
    wading: isPositionInInlandLake(state.player.position),
    elevated: world.playerMotion.verticalOffset > 0.1
  });
}

function resetPlayerMovementAbility() {
  const motion = world.playerMotion;
  motion.jumpAnimation = undefined;
  if (world.playerVisualRoot) world.playerVisualRoot.position.set(0, 0, 0);
  resetPlayerRootLean();
  motion.verticalOffset = 0;
  motion.verticalVelocity = 0;
  motion.spearJumpUsedByHand = {};
  motion.daggerAirStrikesUsed = 0;
  motion.supportOffset = 0;
  motion.jumping = false;
  motion.rolling = false;
  motion.rollElapsed = 0;
  motion.rollCooldown = 0;
  motion.rollBlendFrom = null;
  motion.lastSpaceTap = null;
  motion.rollDirection.set(0, 0, 1);
  motion.airborneDirection.set(0, 0, 0);
  motion.airborneSpeed = 0;
}

function updatePlayerJump(deltaSeconds) {
  const motion = world.playerMotion;
  const supportOffset = getPlayerSupportOffset(state.player.position);
  motion.supportOffset = supportOffset;

  if (!motion.jumping && !motion.rolling && motion.verticalOffset > supportOffset + 0.05) {
    motion.jumping = true;
    motion.verticalVelocity = Math.min(0, motion.verticalVelocity);
  }

  if (!motion.jumping && !motion.rolling && motion.verticalOffset <= supportOffset + 0.05) {
    motion.verticalOffset = supportOffset;
    motion.verticalVelocity = 0;
    motion.spearJumpUsedByHand = {};
    motion.daggerAirStrikesUsed = 0;
    return;
  }

  motion.verticalVelocity -= JUMP_GRAVITY * deltaSeconds;
  motion.verticalOffset += motion.verticalVelocity * deltaSeconds;

  if (motion.verticalOffset <= supportOffset) {
    motion.verticalOffset = supportOffset;
    motion.verticalVelocity = 0;
    motion.spearJumpUsedByHand = {};
    motion.daggerAirStrikesUsed = 0;
    motion.jumping = false;
  }
}

function settlePlayerSupportAfterMove() {
  const motion = world.playerMotion;
  const supportOffset = getPlayerSupportOffset(state.player.position);
  motion.supportOffset = supportOffset;

  if (motion.jumping || motion.rolling) {
    if (motion.verticalVelocity <= 0 && motion.verticalOffset <= supportOffset) {
      motion.verticalOffset = supportOffset;
      motion.verticalVelocity = 0;
      motion.spearJumpUsedByHand = {};
      motion.daggerAirStrikesUsed = 0;
      motion.jumping = false;
    }
    return;
  }

  if (motion.verticalOffset <= supportOffset + 0.05) {
    motion.verticalOffset = supportOffset;
    motion.verticalVelocity = 0;
    motion.spearJumpUsedByHand = {};
    motion.daggerAirStrikesUsed = 0;
    return;
  }

  motion.jumping = true;
  motion.verticalVelocity = Math.min(0, motion.verticalVelocity);
}

function getOutdoorMovementBounds() {
  return {
    minX: -PLAYABLE_HALF,
    maxX: PLAYABLE_HALF,
    minZ: -PLAYABLE_HALF,
    maxZ: PLAYABLE_HALF
  };
}

function updateMovement(deltaSeconds) {
  if (!ui.factionSelect.classList.contains("is-hidden") || !ui.loreScroll.classList.contains("is-hidden") || !state.player.firstName || world.seatedOnThrone || world.outpostTower.active || state.player.dead) {
    world.playerMotion.moving = false;
    world.playerMotion.speed = 0;
    resetPlayerMovementAbility();
    return;
  }

  const motion = world.playerMotion;
  if (motion.rollQueuedUntil != null) {
    if (state.elapsed > motion.rollQueuedUntil) motion.rollQueuedUntil = null;
    else if (Object.values(world.attacks).every(canCancelIntoDefense)) startPlayerRoll();
  }
  const input = getMovementInput();
  const committed = world.attacks.left ?? world.attacks.right;
  const combatSpeed = world.guard.hand ? .65 : world.flailCharge ? .65
    : attackMovementScale(committed, MELEE_STYLES[committed?.itemType]?.movement ?? .75);
  const speed = getPlayerWalkingSpeed() * combatSpeed;
  const move = getPlayerWalkingDirection(input);
  const wasAirborne = motion.jumping || motion.rolling || isPlayerAirborne(motion);

  if (!wasAirborne) {
    motion.airborneDirection.copy(move);
    motion.airborneSpeed = speed;
  }

  let activeMove = move;
  let activeSpeed = speed;

  if (wasAirborne) {
    activeMove = motion.airborneDirection;
    activeSpeed = motion.airborneSpeed;
  }

  if (motion.rollCooldown > 0) {
    motion.rollCooldown = Math.max(0, motion.rollCooldown - deltaSeconds);
  }

  if (motion.rolling) {
    if (motion.rollElapsed >= ROLL_DURATION) {
      motion.rolling = false;
      motion.rollElapsed = 0;
      motion.rollCooldown = ROLL_COOLDOWN;
      motion.rollBlendFrom = null;
      motion.airborneSpeed = speed;
      activeMove = move;
      activeSpeed = speed;
    } else {
      motion.rollElapsed = Math.min(ROLL_DURATION, motion.rollElapsed + deltaSeconds);
      activeMove = motion.rollDirection;
      const rollProgress = motion.rollElapsed / ROLL_DURATION;
      // Hold the dash through the extended dive, then ease it out as the body tucks.
      const diveFade = clamp((rollProgress - 0.3) / 0.18, 0, 1);
      const diveBoost = ROLL_DIVE_SPEED_BOOST * (1 - diveFade * diveFade * (3 - 2 * diveFade));
      activeSpeed = ROLL_SPEED * (1 - 0.65 * Math.pow(rollProgress, 2)) + diveBoost;
    }
  }

  const isWading = !wasAirborne && isPositionInInlandLake(state.player.position);
  if (isWading) {
    activeSpeed *= WATER_WADING_SPEED_MULTIPLIER;
  }
  document.body.dataset.playerWading = String(isWading);
  activeSpeed *= playerStatuses.multiplier('speed');
  if (world.sceneMode === 'poiInterior' && getActivePoiInterior()?.type === 'Dungeon' && motion.verticalOffset <= -1.2 && world.dungeon.layout.lava.some(gap => inside(state.player.position,gap))) activeSpeed *= LAVA_SPEED_MULTIPLIER;

  updatePlayerJump(deltaSeconds);

  const walking = !motion.jumping && !motion.rolling && !isPlayerAirborne(motion) && activeMove.lengthSq() > 0;
  world.playerMotion.moving = walking;
  world.playerMotion.speed = world.playerMotion.moving ? activeSpeed : 0;

  const bounds = world.sceneMode === "interior" || world.sceneMode === "poiInterior"
    ? getInteriorMovementBounds()
    : getOutdoorMovementBounds();

  const nextPosition = {
    x: clamp(state.player.position.x + activeMove.x * activeSpeed * deltaSeconds, bounds.minX, bounds.maxX),
    z: clamp(state.player.position.z + activeMove.z * activeSpeed * deltaSeconds, bounds.minZ, bounds.maxZ)
  };
  if (!wasAirborne && !isWading && committed?.assistTarget && move.dot(committed.direction) >= -.1) {
    const target = committed.assistTarget;
    const offset = target.mesh.position.clone().setY(0).sub(new THREE.Vector3(nextPosition.x, 0, nextPosition.z));
    const distance = offset.length();
    const clearance = PLAYER_COLLISION_RADIUS + (target.radius ?? 1.1) + .3;
    const step = offset.dot(committed.direction) > clearance
      ? attackStepDistance(committed, deltaSeconds, distance - clearance) : 0;
    nextPosition.x = clamp(nextPosition.x + committed.direction.x * step, bounds.minX, bounds.maxX);
    nextPosition.z = clamp(nextPosition.z + committed.direction.z * step, bounds.minZ, bounds.maxZ);
    committed.advanceApplied = (committed.advanceApplied ?? 0) + step;
  }
  moveLocalPlayerTo(nextPosition, bounds);
  settlePlayerSupportAfterMove();
  applyLocalPlayerKnockbackMotion(deltaSeconds, bounds);
  resolveLocalPlayerActorCollisions(bounds);
}

function updateWaterSplashEffects(deltaSeconds) {
  world.waterSplashCooldown = Math.max(0, world.waterSplashCooldown - deltaSeconds);
  const isWading = isPositionInInlandLake(state.player.position);

  if (isWading && world.playerMotion.moving && world.waterSplashCooldown <= 0) {
    spawnWaterSplash(state.player.position);
    world.waterSplashCooldown = WATER_SPLASH_INTERVAL;
  }

  for (let index = world.waterSplashes.length - 1; index >= 0; index -= 1) {
    const splash = world.waterSplashes[index];
    splash.age += deltaSeconds;
    const progress = clamp(splash.age / splash.lifetime, 0, 1);
    splash.ring.scale.setScalar(0.45 + progress * 4.4);
    splash.ring.material.opacity = (1 - progress) * 0.72;

    for (const droplet of splash.droplets) {
      droplet.velocity.y -= 8.5 * deltaSeconds;
      droplet.mesh.position.addScaledVector(droplet.velocity, deltaSeconds);
      droplet.mesh.material.opacity = (1 - progress) * 0.88;
      droplet.mesh.scale.setScalar(0.7 + progress * 0.35);
    }

    if (progress < 1) {
      continue;
    }

    removeFromParent(splash.group);
    splash.group.traverse((child) => {
      child.geometry?.dispose?.();
      child.material?.dispose?.();
    });
    world.waterSplashes.splice(index, 1);
  }
}

function spawnWaterSplash(position) {
  const group = new THREE.Group();
  group.name = "water-wading-splash";
  const side = Math.sin(state.elapsed * 16) >= 0 ? 1 : -1;
  const offsetPosition = {
    x: position.x + side * 0.34,
    z: position.z + Math.cos(state.elapsed * 13) * 0.28
  };
  const splashPosition = isPositionInInlandLake(offsetPosition) ? offsetPosition : position;
  group.position.set(splashPosition.x, nearestLake(splashPosition.x, splashPosition.z).waterHeight + 0.055, splashPosition.z);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.17, 0.29, 18),
    new THREE.MeshBasicMaterial({
      color: "#b9f3ff",
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );
  ring.rotation.x = -Math.PI / 2;
  group.add(ring);

  const droplets = [];
  for (let index = 0; index < 7; index += 1) {
    const angle = (index / 7) * Math.PI * 2 + state.elapsed;
    const droplet = new THREE.Mesh(
      new THREE.SphereGeometry(0.07 + (index % 3) * 0.018, 6, 4),
      new THREE.MeshBasicMaterial({
        color: index % 2 === 0 ? "#d1f8ff" : "#75d5ed",
        transparent: true,
        opacity: 0.88,
        depthWrite: false
      })
    );
    droplet.position.set(Math.cos(angle) * 0.18, 0.04, Math.sin(angle) * 0.18);
    group.add(droplet);
    droplets.push({
      mesh: droplet,
      velocity: new THREE.Vector3(
        Math.cos(angle) * (1.2 + (index % 3) * 0.28),
        1.7 + (index % 2) * 0.55,
        Math.sin(angle) * (1.2 + (index % 3) * 0.28)
      )
    });
  }

  addOutdoor(group);
  world.waterSplashes.push({ group, ring, droplets, age: 0, lifetime: 0.62 });
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
  let resolvedPosition = world.sceneMode === "outdoor"
    ? resolveOutdoorSceneryCollision(clampWorldPosition(position, 38 + radius), radius)
    : world.sceneMode === "interior"
      ? resolveCastleInteriorMovementPosition(position)
      : getActivePoiInterior()?.type === "Dungeon"
        ? constrainDungeonBarrels(resolveDungeonMovementPosition(position))
      : position;

  if (world.sceneMode === "poiInterior" && getActivePoiInterior()?.type === "Dungeon" && world.dungeon.gate && !world.dungeon.gate.open) {
    resolvedPosition = constrainToDungeonAntechamber(resolvedPosition, world.dungeon.layout.entranceRoom, radius);
  }
  if (world.activePoiInteriorId === LIBRARY_ID && world.sceneMode === "poiInterior") {
    for (const side of [-1, 1]) {
      for (const z of [-14, -2, 10]) {
        pushCircleOutOfAabb(resolvedPosition, {x:side*29*LIBRARY_INTERIOR_WIDTH_SCALE,z}, 3*LIBRARY_INTERIOR_WIDTH_SCALE, 5, radius);
        pushCircleOutOfAabb(resolvedPosition, {x:side*13*LIBRARY_INTERIOR_WIDTH_SCALE,z}, LIBRARY_INTERIOR_WIDTH_SCALE, 1, radius);
      }
      for (const z of [-6,9]) pushCircleOutOfAabb(resolvedPosition, {x:side*20*LIBRARY_INTERIOR_WIDTH_SCALE,z}, 3*LIBRARY_INTERIOR_WIDTH_SCALE, 3, radius);
    }
  }
  if (world.sceneMode === "interior") {
    for (const prop of world.interiorRoot.getObjectByName("castleInteriorDetails")?.userData.colliders ?? []) pushCircleOutOfAabb(resolvedPosition, prop, prop.halfWidth, prop.halfDepth, radius);
  }
  if (world.sceneMode === "poiInterior") {
    const furnishings = world.meshes.poiInteriors.get(world.activePoiInteriorId)?.getObjectByName("furnishedPoiHall");
    for (const prop of furnishings?.userData.colliders ?? []) pushCircleOutOfAabb(resolvedPosition, prop, prop.halfWidth, prop.halfDepth, radius);
  }
  if (world.sceneMode === 'poiInterior' && getActivePoiInterior()?.type === 'Dungeon' && crossesBarrier(state.player.position, resolvedPosition, roomBarriers(world.dungeon.layout), radius)) return;
  // Falling below a ledge cannot turn into a free step back onto the floor.
  if (world.sceneMode === 'poiInterior' && getActivePoiInterior()?.type === 'Dungeon' && world.playerMotion.verticalOffset < -.2 &&
      world.dungeon.layout.lava.some(gap => inside(state.player.position,gap)) &&
      !world.dungeon.layout.lava.some(gap => inside(resolvedPosition,gap))) return;
  const finalPosition = world.sceneMode === "outdoor" ? clampWorldPosition(resolvedPosition, 38 + radius) : resolvedPosition;
  const previousPosition = { ...state.player.position };
  state.player.position.x = clamp(finalPosition.x, bounds.minX, bounds.maxX);
  state.player.position.z = clamp(finalPosition.z, bounds.minZ, bounds.maxZ);
  preservePlayerElevationAfterMove(previousPosition);
}

function preservePlayerElevationAfterMove(previousPosition) {
  if (world.sceneMode !== "outdoor") return;

  const motion = world.playerMotion;
  const position = state.player.position;
  const terrainDrop = getTerrainHeightAt(previousPosition.x, previousPosition.z)
    - getTerrainHeightAt(position.x, position.z);
  const distance = Math.hypot(position.x - previousPosition.x, position.z - previousPosition.z);
  // Offsets are terrain-relative for rendering/combat, but flight is in world space.
  // Only grounded walking follows gentle terrain; steep drops start a free fall.
  const inFlight = motion.jumping || motion.rolling || isPlayerAirborne(motion);
  const leavingLedge = terrainDrop > Math.max(0.05, distance * 0.75);
  if (inFlight || motion.verticalOffset > 0.08 || leavingLedge) {
    motion.verticalOffset += terrainDrop;
  }
}

function getPlayerSupportOffset(position) {
  if (world.sceneMode === 'poiInterior' && getActivePoiInterior()?.type === 'Dungeon' && world.dungeon.layout?.lava?.some(gap => inside(position, gap))) return -2;
  if (world.sceneMode !== "outdoor") {
    return 0;
  }

  const terrainY = getTerrainHeightAt(position.x, position.z);
  let supportOffset = 0;

  for (const collider of world.sceneryGrid.query(position.x, position.z)) {
    if (collider.earthAirborne || collider.type !== "rock" || !collider.platformRadius) {
      continue;
    }

    const distance = Math.hypot(position.x - collider.x, position.z - collider.z);

    if (distance > collider.platformRadius) {
      continue;
    }

    const surfaceY = rockSurfaceWorldY(collider, position);
    if (surfaceY !== null) supportOffset = Math.max(supportOffset, surfaceY - terrainY);
  }

  return Math.max(0, supportOffset);
}

function getRockPlatformWorldY(collider, position) {
  return rockSurfaceWorldY(collider, position) ?? ((collider.groundY ?? getTerrainHeightAt(collider.x, collider.z)) + (collider.platformHeight ?? 0));
}

function canPlayerClearSceneryCollider(collider, position) {
  if (collider.type !== "rock") {
    return false;
  }

  const playerY = getTerrainHeightAt(state.player.position.x, state.player.position.z)
    + world.playerMotion.verticalOffset;
  return playerY >= getRockPlatformWorldY(collider, position) - 0.16;
}

function resolveOutdoorSceneryCollision(position, moverRadius = 1.15) {
  const resolved = { ...position };

  for (const collider of world.sceneryGrid.query(position.x-moverRadius-32, position.z-moverRadius-32, position.x+moverRadius+32, position.z+moverRadius+32)) {
    if (collider.earthAirborne) continue;
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

  for (const collider of [...world.poiExteriorColliders, ...world.castleExteriorColliders]) {
    pushCircleOutOfAabb(
      resolved,
      { x: collider.x, z: collider.z },
      collider.halfWidth,
      collider.halfDepth,
      moverRadius
    );
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

    const radius =
      structure.type === "depot"
        ? 5.4
        : structure.type === "outpost"
          ? 4.2
          : structure.type === "street-lamp"
            ? 1.45
            : 3.2;
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
  if (getActivePoiInterior()?.type === "Dungeon") {
    return world.dungeon.layout?.bounds ?? { minX: -52, maxX: 52, minZ: -38, maxZ: 40 };
  }

  if (world.sceneMode === "interior") {
    return CASTLE_INTERIOR.bounds;
  }

  if (getActivePoiInterior()?.type === "Library") return { minX: -29*LIBRARY_INTERIOR_WIDTH_SCALE, maxX: 29*LIBRARY_INTERIOR_WIDTH_SCALE, minZ: -22, maxZ: 22 };
  return POI_HALL.bounds;
}

function resolveCastleInteriorMovementPosition(position) {
  const rooms = CASTLE_INTERIOR.rooms;

  if (rooms.some((room) => isPointInsideRect(position, room))) {
    return position;
  }

  return rooms
    .map((room) => {
      const x = clamp(position.x, room.minX, room.maxX);
      const z = clamp(position.z, room.minZ, room.maxZ);
      return {
        x,
        z,
        distanceSq: (position.x - x) ** 2 + (position.z - z) ** 2
      };
    })
    .sort((a, b) => a.distanceSq - b.distanceSq)[0];
}

function isPointInsideRect(position, rect) {
  return position.x >= rect.minX && position.x <= rect.maxX && position.z >= rect.minZ && position.z <= rect.maxZ;
}

function resolveDungeonMovementPosition(position) {
  const layout = world.dungeon.layout;
  const rects = layout?.walkRects ?? [];

  if (!rects.length || rects.some((rect) => isPointInsideRect(position, rect))) {
    return position;
  }

  return rects
    .map((rect) => {
      const x = clamp(position.x, rect.minX, rect.maxX);
      const z = clamp(position.z, rect.minZ, rect.maxZ);
      return {
        x,
        z,
        distanceSq: (position.x - x) ** 2 + (position.z - z) ** 2
      };
    })
    .sort((a, b) => a.distanceSq - b.distanceSq)[0] ?? position;
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

  if (isPlayerRolling()) {
    return;
  }
  world.aimFollowsView = false;

  const target = getAimPointFromNdc(getNdcFromPointer(event));

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
  updateOutpostTowerAimFromAngles();
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
  world.aimRayOrigin.copy(world.raycaster.ray.origin);
  world.aimRayDirection.copy(world.raycaster.ray.direction).normalize();
  if (world.sceneMode === "outdoor" && world.meshes.terrain) {
    const terrainHit = raycastTerrain();
    if (terrainHit) {
      return terrainHit.point;
    }
  }

  return world.raycaster.ray.intersectPlane(world.groundPlane, target) ? target : null;
}

function getAimPointFromNdc(ndc) {
  const fallbackTarget = new THREE.Vector3();

  world.raycaster.setFromCamera(ndc, world.camera);
  world.aimRayOrigin.copy(world.raycaster.ray.origin);
  world.aimRayDirection.copy(world.raycaster.ray.direction).normalize();

  // The camera sits behind the character. A hit in that intervening space
  // is ahead of the camera but behind the player, and used to reverse attacks.
  // Free-pointer aiming must still allow deliberately aiming behind yourself.
  const forward = world.aimRayDirection.clone().setY(0);
  const shoulderAim = isLockedThirdPersonCamera();
  if (forward.lengthSq() > 0.000001) forward.normalize();
  const isForwardHit = (point) => !shoulderAim || (
    (point.x - state.player.position.x) * forward.x +
    (point.z - state.player.position.z) * forward.z >= 0.65
  );

  const combatHit = pickCombatAimPoint([
    ...getActiveCombatEnemies(),
    ...getActiveDungeonBarrels(), ...getAttackableRemotePlayers()
  ], world.raycaster.ray, isForwardHit, target => { world.crosshairTarget = target; });
  if (combatHit) return combatHit;

  // Free-pointer aiming retains a flat baseline; shoulder aim follows the view.
  // Scenery and terrain triangles never participate in combat targeting.
  if (!shoulderAim && world.raycaster.ray.intersectPlane(world.groundPlane, fallbackTarget)) {
    return fallbackTarget;
  }

  // Let shoulder aiming use its player-relative forward fallback when the
  // crosshair hits nearby ground (or looks into the sky), never a rear point.
  if (shoulderAim) return null;

  return world.raycaster.ray.origin.clone().addScaledVector(world.raycaster.ray.direction, 90);
}

function applyAimFacing(deltaSeconds = 0) {
  if (!world.playerMesh || !world.hasAim || isPlayerRolling()) {
    return;
  }

  const direction = world.aimFollowsView ? world.aimDirection.clone() : new THREE.Vector3(
    world.aimTarget.x - state.player.position.x,
    0,
    world.aimTarget.z - state.player.position.z
  );

  if (direction.lengthSq() < 0.001) {
    return;
  }

  world.aimDirection.copy(direction.normalize());
  // Keep body yaw consistent with the stroke until its recovery finishes.
  const committed = world.attacks?.left ?? world.attacks?.right;
  if (committed) {
    facePlayerTowardAttack(committed);
    return;
  }
  if (world.seatedOnThrone) {
    world.playerMesh.rotation.y = 0;
    world.playerRig.headGroup.rotation.y = clamp(Math.atan2(world.aimDirection.x, world.aimDirection.z), -0.85, 0.85);
  } else {
    world.playerRig.headGroup.rotation.y = 0;
    // Idle facing follows input, never a cached enemy that may now be behind us.
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(world.playerMesh.quaternion);
    world.playerMesh.rotation.set(0, approachFacing(Math.atan2(forward.x, forward.z),
      Math.atan2(world.aimDirection.x, world.aimDirection.z), deltaSeconds), 0);
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
    <strong>${escapeHtml(faction.name)}</strong>
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
  if (isPlayerRolling()) return false;
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
    elapsed: action.type === "openDungeonGate" ? world.dungeon.gate.progress * DUNGEON_GATE_HOLD_SECONDS : 0,
    duration: action.type === "openDungeonGate" ? DUNGEON_GATE_HOLD_SECONDS : action.type === "claimPoiFlag" ? POI_FLAG_HOLD_DURATION : LOCATION_HOLD_DURATION
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
  if (!state.player.firstName || !ui.factionSelect.classList.contains("is-hidden") || isBlockingLocationInput()) {
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

    const faction = FACTIONS.find(entry => (!state.selectedFactionId || !state.factions[entry.id] || entry.id === state.selectedFactionId) && distance2D(state.player.position, castleEntrance(entry)) <= 7.5);

    if (faction && distance2D(state.player.position, castleEntrance(faction)) <= 7.5) {
      return {
        type: "enterCastle",
        label: `${faction.name} Keep`,
        prompt: `Hold Space to enter ${faction.name} Keep`,
        factionId: faction.id
      };
    }

    const nearest = getNearestPoiEntrance();

    if (nearest && nearest.distance <= POI_DOOR_INTERACTION_RANGE) {
      if (nearest.poi.type === "Dungeon" && world.dungeons.get(nearest.poi.id)?.status !== "active") {
        return null;
      }

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
    const npc = nearbyCastleNpc(state.player.position, [...world.stewardNpcs, ...world.blacksmithNpcs]);
    if (npc) return {
      type: "talkCastleNpc", role: npc.userData.role, factionId: world.interiorFactionId,
      label: npc.userData.role === "steward" ? "Steward" : "Blacksmith",
      prompt: "Hold Space to speak to the " + npc.userData.role
    };
    for (const [z,archiveTab,label] of [[-9,"resources","Family treasury"],[0,"book","Castle history books"],[9,"scroll","Castle history scroll"]]) {
      if (Math.hypot(state.player.position.x + 12, state.player.position.z-z) < 4.5) return { type:"readChronicle", archiveTab, label, prompt:"Hold Space to read" };
    }
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
    if (getActivePoiInterior()?.type === "Dungeon" && !state.player.dead && isNearDungeonGate(world.dungeon.gate, state.player.position)) {
      return { type: "openDungeonGate", poiId: world.activePoiInteriorId, label: "Dungeon doors", prompt: "Hold Space to open the dungeon doors" };
    }
    if (world.activePoiInteriorId === LIBRARY_ID) {
      if (Math.hypot(state.player.position.x,state.player.position.z+10)<6) return {type:"readChronicle",archiveTab:"book",label:"Living Chronicles",prompt:"Hold Space to read"};
      for (const {x,z,tab:archiveTab,label} of LIBRARY_TABLE_DISPLAYS) {
        if (Math.hypot(state.player.position.x-x*LIBRARY_INTERIOR_WIDTH_SCALE,state.player.position.z-z)<6) return {type:"readChronicle",archiveTab,label,prompt:"Hold Space to read"};
      }
    }
    if (world.activePoiInteriorId === LIBRARY_ID && distance2D(state.player.position, LIBRARY_SCROLL_POSITION) < 9) {
      return { type: "readChronicle", archiveTab: "scroll", label: "The Living Chronicle", prompt: "Hold Space to read the wall scroll" };
    }
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

function getNearestPoiEntrance() {
  return state.pois
    .map((poi) => ({
      poi,
      entrance: getPoiEntrancePosition(poi),
      distance: distance2D(state.player.position, getPoiEntrancePosition(poi))
    }))
    .sort((a, b) => a.distance - b.distance)[0] ?? null;
}

function getAvailablePoiFlagAction() {
  const poi = getActivePoiInterior();
  const playerFaction = state.selectedFactionId ? FACTION_LOOKUP[state.selectedFactionId] : null;

  if (!poi || (poi.type === "Dungeon" || poi.type === "Library") || !playerFaction || poi.ownerFactionId === playerFaction.id || !isNearPoiFlagpole()) {
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
    state.player.dead ||
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
  return distance2D(state.player.position, { x: 0, z: CASTLE_INTERIOR.exitZ }) <= 7.5;
}

function getAvailableRulerSeatAction() {
  const factionId = world.interiorFactionId;

  if (!canUseFactionThrone(state, factionId) || !factionId || (state.factions[factionId] && state.selectedFactionId && state.selectedFactionId !== factionId) || !isNearRulerSeat()) {
    return null;
  }

  const currentRulerName = getFactionRulerName(state, factionId);

  if (currentRulerName && state.selectedFactionId && !isFactionRuler(state, factionId)) {
    return null;
  }

  return {
    type: "throne",
    label: "Throne",
    prompt: state.factions[factionId] && !state.selectedFactionId ? `Hold Space to join ${FACTION_LOOKUP[factionId].name}` : currentRulerName ? "Hold Space to sit on the throne" : "Hold Space to claim the throne",
    factionId
  };
}

function isNearRulerSeat() {
  return world.sceneMode === "interior" && distance2D(state.player.position, { x: 0, z: -20.3 }) <= 7.5;
}

function isNearPoiExit() {
  const type = getActivePoiInterior()?.type;
  if (type === "Dungeon" || type === "Library") return Math.abs(state.player.position.x) <= 18 && state.player.position.z >= 13;
  return distance2D(state.player.position, { x: 0, z: POI_HALL.exitZ }) <= 6.5;
}

function isNearPoiFlagpole() {
  return world.sceneMode === "poiInterior" && distance2D(state.player.position, POI_FLAG_POSITION) <= POI_FLAG_INTERACTION_RANGE;
}

function updateLocationPrompt() {
  const action = world.baseEntryAction?.source === "space" ? world.baseEntryAction : getAvailableLocationAction();

  const workstation = getTargetedWorkstation();
  if (!action && workstation) {
    const station = getPoiWorkstation(workstation);
    ui.locationPromptTitle.textContent = `${station.name}: hold left / right click with free hands to gather`;
    ui.locationPromptProgress.style.width = `${Math.round(100 * (world.workAction?.elapsed ?? 0) / WORK_ACTION_DURATION)}%`;
    ui.locationPrompt.classList.remove("is-hidden");
    ui.locationPrompt.setAttribute("aria-hidden", "false");
    return;
  }

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

  if (state.selectedFactionId && state.factions[hit.object.userData.factionId] && hit.object.userData.factionId !== state.selectedFactionId) {
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
  if (!canUseFactionThrone(state, world.interiorFactionId)) return false;
  if (!world.interiorFactionId || (state.selectedFactionId && state.factions[world.interiorFactionId] && state.selectedFactionId !== world.interiorFactionId)) {
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

  const hit = getTradeNpcHitFromPointer(event);

  if (!hit) {
    return false;
  }

  openNpcTradePanel(hit.object.userData.tradeNpcId);
  return true;
}

function getTradeNpcHitFromPointer(event) {
  if (world.sceneMode !== "poiInterior" || getActivePoiInterior()?.type !== "Trade Post" || !world.tradeNpcs.length) {
    return null;
  }

  world.raycaster.setFromCamera(getNdcFromPointer(event), world.camera);
  return world.raycaster
    .intersectObjects(world.tradeNpcs.filter((npc) => npc.parent?.visible), true)
    .find((entry) => entry.object.userData.tradeNpcId);
}

function tryClaimCampChestFromPointer(event) {
  if (event.button !== 0 || world.sceneMode !== "outdoor" || state.player.dead) return false;
  world.raycaster.setFromCamera(getNdcFromPointer(event), world.camera);
  const hit = world.raycaster.intersectObjects(world.campChests, true)[0];
  if (!hit) return false;
  let chest = hit.object;
  while (chest.parent && !world.campChests.includes(chest)) chest = chest.parent;
  const position = chest.getWorldPosition(new THREE.Vector3());
  if (distance2D(state.player.position, position) > CAMP_CHEST_REACH) {
    flash("Move closer to open the chest.");
    return true;
  }
  const items = claimCampChest(chest, state.player);
  if (!items.length) {
    flash("This chest is empty. Camp supplies refill five minutes after looting.");
    return true;
  }
  markPersistenceDirty();
  refreshUi();
  flash(`Found ${items.map(item => item.name).join(" and ")}.`);
  return true;
}

function tryClaimDungeonTreasureFromPointer(event) {
  if (event.button !== 0 || world.sceneMode !== "poiInterior" || getActivePoiInterior()?.type !== "Dungeon") {
    return false;
  }

  if (state.player.dead) return false;
  world.raycaster.setFromCamera(getNdcFromPointer(event), world.camera);
  const chestHit = world.raycaster.intersectObjects(world.dungeon.chests.filter(chest => !chest.userData.opened), true)[0];
  if (chestHit) {
    let chest = chestHit.object;
    while (chest.parent && !world.dungeon.chests.includes(chest)) chest = chest.parent;
    if (distance2D(state.player.position, chest.position) > DUNGEON_TREASURE_PICKUP_RANGE) {
      flash("Move closer to open the chest.");
      return true;
    }
    const room = world.dungeon.layout.rooms.find(room => room.id === chest.userData.roomId);
    if (world.pveEnemies.some(enemy => !enemy.dead && Math.abs(enemy.mesh.position.x - room.x) < room.width / 2 + 6 && Math.abs(enemy.mesh.position.z - room.z) < room.depth / 2 + 6)) {
      flash("Defeat the nearby guards to open this chest.");
      return true;
    }
    if (room.guardRoomId && !world.dungeon.layout.rooms.find(r => r.id === room.guardRoomId)?.cleared) {
      flash("Clear the sealed combat room to unlock this treasure."); return true;
    }
    const grade = room.kind === 'treasure' ? 'treasure' : 'supply';
    const item = Math.random() < 0.65 ? createRandomPveWeapon(grade === 'treasure' ? 1.2 : .65, null, grade) : createRandomPveArmor(null, grade);
    chest.userData.opened = true;
    chest.userData.lid.rotation.x = -Math.PI / 3;
    chest.userData.label.visible = false;
    state.player.inventory.push(item);
    state.player.gold += chest.userData.gold;
    markPersistenceDirty();
    refreshUi();
    flash(`Found ${item.name} and ${chest.userData.gold} gold.`);
    return true;
  }
  return false;
}

function tryPickupDroppedItemFromPointer(event) {
  if (event.button !== 0 || state.player.dead || !world.droppedItems.length) {
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

  if (isLootExpired(drop)) { removeDroppedItem(drop.id); return true; }

  if (distance2D(state.player.position, drop.position) > DROPPED_ITEM_PICKUP_RANGE) {
    flash(`Move closer to pick up ${drop.item.name}.`);
    return true;
  }

  if (drop.shared) {
    void pickupSharedDeathDrop(drop);
    return true;
  }
  if (drop.item.goldAmount) {
    state.player.gold += drop.item.goldAmount;
  } else {
    state.player.inventory.push(drop.item);
    state.player.selectedGearItemId = drop.item.id;
  }
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
    .intersectObjects(world.droppedItems.filter(entry => entry.mesh.visible).map((entry) => entry.mesh), true)
    .find((entry) => entry.object.userData.droppedItemId);

  if (meshHit || !isLockedThirdPersonCamera()) {
    return meshHit;
  }

  const target = getGroundPointFromScreenCenter();

  if (!target) {
    return null;
  }

  const nearestDrop = world.droppedItems
    .filter((drop) => drop.mesh.visible && distance2D(state.player.position, drop.position) <= DROPPED_ITEM_PICKUP_RANGE)
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

  disposeLootResources(drop.mesh);
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
  const playerNearDoor = isNearCastleExit();
  const pointerBeyondDoor = Math.abs(target.x) <= 12 && target.z >= CASTLE_INTERIOR.exitZ - 2 && target.z <= CASTLE_INTERIOR.exitZ + 10;
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

  if (action.type === "talkCastleNpc") {
    const available = getAvailableLocationAction();
    // Space uses start/stopSpaceLocationAction on keydown/keyup, not the movement-key set.
    if (available?.type !== action.type || available.role !== action.role || available.factionId !== action.factionId) {
      stopSpaceLocationAction();
      return;
    }
  }
  if (action.type === "openDungeonGate") {
    if (world.sceneMode !== "poiInterior" || world.activePoiInteriorId !== action.poiId || state.player.dead || isBlockingLocationInput() || !isNearDungeonGate(world.dungeon.gate, state.player.position)) {
      stopSpaceLocationAction(); return;
    }
    advanceDungeonGate(world.dungeon.gate, deltaSeconds);
  }
  action.elapsed += deltaSeconds;
  document.body.dataset.enteringProgress = String(Math.min(1, action.elapsed / action.duration).toFixed(2));
  updateLocationPrompt();

  if (action.elapsed >= action.duration) {
    if (action.type === "talkCastleNpc") {
      stopBaseEntryAction();
      if (action.role === "steward") openStewardPanel();
      else openBlacksmithPanel();
    } else if (action.type === "openDungeonGate") {
      stopSpaceLocationAction();
      flash("The dungeon doors are open.");
    } else if (action.type === "exit" || action.type === "exitCastle") {
      leaveCastleInterior();
    } else if (action.type === "exitPoi") {
      leavePoiInterior();
    } else if (action.type === "throne") {
      resolveRulerSeatAction(action.factionId);
    } else if (action.type === "enterCastle") {
      enterCastleInterior(action.factionId);
    } else if (action.type === "enterPoi") {
      enterPoiInterior(action.poiId);
    } else if (action.type === "readChronicle") {
      stopBaseEntryAction();
      setLoreScrollOpen(true, action.archiveTab || "book");
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

  if (!poi || (poi.type === "Dungeon" || poi.type === "Library") || !playerFaction || !isNearPoiFlagpole()) {
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
  if (!canUseFactionThrone(state, factionId)) { flash("As king, you can only use your own faction’s throne."); return; }
  if (state.factions[factionId] && !state.selectedFactionId) {
    const position = { ...state.player.position };
    const result = joinFaction(state, factionId);
    state.player.position = position;
    runAction(result);
    publishLocalPlayer(true);
    return;
  }

  if (!state.factions[factionId]) {
    sitOnRulerSeat();
    openFoundingEditor(factionId);
    return;
  }

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
  world.outpostTower.drawStartedAt = 0;
  world.outpostTower.shotCooldown = 0;
  state.player.position.x = structure.position.x;
  state.player.position.z = structure.position.z;
  syncOutpostTowerAimToCurrentView();
  world.playerMotion.moving = false;
  world.playerMotion.speed = 0;
  clearRangedCharge();
  stopWorkAction();
  closeNpcTradePanel();
  closeStewardPanel();
  closeDepotPanel();
  setStatusPanelOpen(false);
  setInventoryPanelOpen(false);
  setBuildPanelOpen(false);
  requestOutpostTowerPointerLock();
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
  releaseLockedThirdPersonPointerLock();
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

  world.outdoorReturnPosition = { x: faction.position.x, z: faction.position.z + CASTLE_GATE_Z + 5 };
  world.sceneMode = "interior";
  world.interiorFactionId = factionId;
  world.activePoiInteriorId = null;
  world.outdoorRoot.visible = false;
  world.interiorRoot.visible = true;
  world.poiInteriorRoot.visible = false;
  setActivePoiInterior(null);
  state.player.position.x = 0;
  state.player.position.z = CASTLE_INTERIOR.spawnZ;
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
  setHousePanelOpen(false);
  setRulerPanelOpen(false, { leaveSeat: false });
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
  setHousePanelOpen(false);
  setRulerPanelOpen(false, { leaveSeat: false });
  refreshUi();
}

function enterPoiInterior(poiId) {
  const poi = state.pois.find((entry) => entry.id === poiId);

  if (!poi) {
    stopBaseEntryAction();
    return;
  }

  if (poi.type === "Dungeon" && world.dungeons.get(poi.id)?.status !== "active") {
    stopBaseEntryAction();
    flash(`${poi.name} is temporarily closed while it regenerates.`);
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
  state.player.position.z = poi.type === "Dungeon" || poi.type === "Library" ? 17 : POI_HALL.spawnZ;
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
  setHousePanelOpen(false);
  setRulerPanelOpen(false, { leaveSeat: false });
  refreshUi();
}

function leavePoiInterior() {
  for (const enemy of world.pveEnemies) enemy.spells?.clear();
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
  if (!GAME_FLAGS.pve || state.pois.find(poi => poi.id === poiId)?.type !== "Dungeon") {
    return;
  }

  for (const enemy of world.pveEnemies) {
    enemy.hp = enemy.maxHp;
    enemy.dead = false;
    enemy.deathTimer = 0;
    enemy.shoveStaggerTimer = 0;
    enemy.attackTimer = Math.random() * 0.8;
    resetPveEnemyAttackState(enemy);
    enemy.knockbackVelocity?.set(0, 0, 0);
    const loadout = createPveMobLoadout(enemy.mobClass);
    enemy.naturalAttack = loadout.naturalAttack;
    enemy.goldMin = loadout.goldMin;
    enemy.goldMax = loadout.goldMax;
    restoreGremlinRewards(enemy);
    setPveEnemyWeapon(enemy, loadout.weapon);
    setPveEnemyArmor(enemy, loadout.armor);
    enemy.mesh.visible = true;
    enemy.mesh.scale.set(1, 1, 1);
    enemy.mesh.position.set(enemy.spawn.x, 0, enemy.spawn.z);
    updatePveEnemyHealthBar(enemy);
  }
}

function isCombatInputReady(hand) {
  if (world.fireCast || world.earthMagic?.active?.phase === 'held') return false;
  const item = getEquippedItem(state, hand);
  if (isShield(item?.type)) return true;
  const now = state.elapsed;
  const deadline = now + ATTACK_BUFFER_SECONDS;
  const other = hand === 'left' ? 'right' : 'left';
  const outgoing = world.attacks[other];
  if (!canWeaveAttack(outgoing) && now + outgoing.duration *
      (outgoing.comboChainPoint ?? (outgoing.profile.windup + outgoing.profile.strike)) - outgoing.elapsed > deadline) return false;
  const active = world.attacks[hand];
  if (active && now + active.duration * (active.comboChainPoint ?? 1) - active.elapsed > deadline) return false;
  const chain = world.comboChains[hand];
  if (chain && chain.itemId === item?.id) return deadline >= chain.readyAt;
  const frequency = item?.weapon?.frequency ?? WEAPON_STATS['Empty Hand'].frequency;
  const last = state.player.equipment[hand === 'left' ? 'lastLeftAttackAt' : 'lastRightAttackAt'];
  return deadline >= last + 1 / Math.max(.1, frequency);
}

function isMeleeAssistVisible(target, position) {
  const origin = new THREE.Vector3(state.player.position.x, getPlayerWorldElevation() + 2.8, state.player.position.z);
  const end = meleeTargetTorso(target);
  const direction = end.clone().sub(origin);
  const distance = direction.length();
  const ray = new THREE.Raycaster(origin, direction.normalize(), 0, distance);
  const walls = world.interiorCameraWalls.filter(wall => {
    for (let node = wall; node; node = node.parent) if (!node.visible) return false;
    return true;
  });
  if (ray.intersectObjects(walls, false).length) return false;
  if (world.sceneMode === 'outdoor') {
    for (let t = .15; t < 1; t += .1) {
      const point = origin.clone().lerp(end, t);
      if (getTerrainHeightAt(point.x, point.z) > point.y) return false;
      const resolved = resolveOutdoorSceneryCollision({ x: point.x, z: point.z }, .1);
      if (Math.hypot(resolved.x - point.x, resolved.z - point.z) > .12) return false;
    }
    if (ray.intersectObjects(getAttackableStructures().map(entry => entry.mesh), true).length) return false;
  }
  return true;
}

function getMeleeAssistTarget(range) {
  const origin = new THREE.Vector3(state.player.position.x, getPlayerWorldElevation(), state.player.position.z);
  const explicit = world.crosshairTarget;
  if (explicit && meleeTargetInReach(explicit, origin, range, .65)) {
    const position = explicit.mesh.getWorldPosition(new THREE.Vector3());
    const forward = position.clone().sub(origin).setY(0).dot(world.aimDirection);
    // The screen ray wins over the character's cone. Camera shoulder offset
    // must not reject the enemy the player is explicitly pointing at.
    if (forward > .1 && isMeleeAssistVisible(explicit, position)) return explicit;
  }
  return selectMeleeTarget([...getActiveCombatEnemies(), ...getAttackableRemotePlayers()], origin,
    world.aimDirection, range, world.meleeAssistTarget, isMeleeAssistVisible);
}

function preparePlayerAttackAim(itemType, range) {
  // Snapshot input once; queued strokes retain this direction until execution.
  if (isLockedThirdPersonCamera()) updateLockedThirdPersonAim();
  const direction = world.aimDirection.clone().setY(0).normalize();
  if (direction.lengthSq() < .001 && world.playerMesh) {
    direction.set(0, 0, 1).applyQuaternion(world.playerMesh.quaternion).setY(0).normalize();
  }
  const origin = new THREE.Vector3(state.player.position.x, getPlayerWorldElevation(), state.player.position.z);
  if (isProjectileWeapon(itemType)) {
    if (world.hasAim) direction.copy(world.aimPoint).sub(origin).setY(0).normalize();
    return { direction, aimPoint: world.hasAim ? world.aimPoint.clone() : null, target: null };
  }
  const target = getMeleeAssistTarget(range);
  world.meleeAssistTarget = target;
  let distance = Math.max(4, Math.min(8, range)), height = origin.y + 3.2;
  if (target) {
    const point = meleeTargetTorso(target);
    direction.copy(assistedDirection(origin, direction, point));
    return { direction, aimPoint: point, aimOrigin: origin, target };
  }
  const aimPoint = origin.clone().addScaledVector(direction, distance);
  aimPoint.y = height;
  return { direction, aimPoint, aimOrigin: origin, target };
}

function updateMeleeAssistVisual() {
  const active = world.attacks.left ?? world.attacks.right;
  const item = ['right', 'left'].map(hand => getEquippedItem(state, hand))
    .find(item => item && !isShield(item.type) && !isProjectileWeapon(item.type));
  const enabled = world.hasAim && !state.player.dead && !isCameraMenuOpen() && !world.outpostTower.active
    && !isPlayerRolling() && (item || active);
  const target = enabled ? (active ? active.assistTarget : getMeleeAssistTarget(
    getCombatRange(item.type, item.weapon ?? WEAPON_STATS[item.type]))) : null;
  world.meleeAssistTarget = target?.dead ? null : target;
  if (!world.meleeAssistRing && target) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.05, 1.13, 40),
      new THREE.MeshBasicMaterial({ color: '#f4d38b', transparent: true, opacity: .55, depthWrite: false, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2;
    ring.userData.cameraOcclusionExcluded = true;
    world.scene.add(ring);
    world.meleeAssistRing = ring;
  }
  const ring = world.meleeAssistRing;
  if (ring) {
    ring.visible = Boolean(world.meleeAssistTarget);
    if (ring.visible) {
      ring.position.copy(target.mesh.getWorldPosition(new THREE.Vector3()));
      ring.position.y += .09;
      ring.scale.setScalar(Math.max(.8, target.radius ?? 1.1));
    }
  }
}

function tryAttackFromPointer(hand, rangedChargePower = 0, inputExpiresAt = null, inputAim = null) {
  // Only fresh clicks renew the short buffer; retries keep their original deadline.
  if (inputExpiresAt === null) {
    inputExpiresAt = state.elapsed + ATTACK_BUFFER_SECONDS;
    world.weaveQueue = null;
    for (const chain of Object.values(world.comboChains)) {
      if (chain) chain.queued = false;
    }
  }
  if (state.elapsed > inputExpiresAt) return false;
  if (state.player.dead || isCameraMenuOpen() || isPlayerRolling()) {
    flash("You cannot attack right now.");
    return false;
  }

  const pendingItem = getEquippedItem(state, hand);
  const pendingItemType = pendingItem?.type ?? "Empty Hand";
  if (isShield(pendingItemType)) return false;
  if (pendingItemType === 'Dagger' && !canStartDaggerAirAttack(world.playerMotion)) return false;
  if (world.flailCharge && world.flailCharge.hand !== hand) return false;
  inputAim ??= preparePlayerAttackAim(pendingItemType, getEffectiveAttackRange(
    pendingItem ?? { type: pendingItemType }, pendingItem?.weapon ?? WEAPON_STATS[pendingItemType], rangedChargePower));
  const otherHand = hand === 'left' ? 'right' : 'left';
  if (!canWeaveAttack(world.attacks[otherHand])) {
    world.weaveQueue = { hand, chargePower: rangedChargePower, itemId: pendingItem?.id, inputAim, expiresAt: inputExpiresAt };
    if (world.comboChains[otherHand]) world.comboChains[otherHand].queued = false;
    return true;
  }
  // The incoming stroke owns the body; the outgoing stroke has already landed.
  const outgoing = world.attacks[otherHand];
  const hasCombo = getCombatComboTiming(pendingItemType).steps > 1;
  const chain = world.comboChains[hand];
  const sameWeapon = chain?.itemId === pendingItem?.id;
  const active = world.attacks[hand];
  if (active && (!hasCombo || active.jumpAttack) && active.elapsed < active.duration) {
    const readyAt = Math.max(state.elapsed + active.duration - active.elapsed, active.cooldownReadyAt ?? 0);
    world.weaveQueue = { hand, chargePower: rangedChargePower, itemId: pendingItem?.id, inputAim,
      readyAt, expiresAt: inputExpiresAt };
    return true;
  }
  if (hasCombo && sameWeapon && (state.elapsed < chain.readyAt ||
      (active && (!active.hitResolved || active.elapsed < active.duration * (active.comboChainPoint ?? 1))))) {
    chain.queued = true;
    chain.inputExpiresAt = inputExpiresAt;
    chain.chargePower = rangedChargePower;
    chain.inputAim = inputAim;
    world.weaveQueue = null;
    return true;
  }
  const attackCycle = hasCombo ? getComboIndex(chain, pendingItem.id, state.elapsed) : world.attackCycles[hand];
  const comboTiming = getCombatComboTiming(pendingItemType, attackCycle);
  const result = performWeaponAttack(state, hand, {
    cooldownScale: comboTiming.cooldownScale,
    cooldownSeconds: hasCombo && sameWeapon ? chain.interval : undefined
  });

  if (!result.ok) {
    if (result.cooldown > 0 && result.cooldown <= .35) {
      world.weaveQueue = { hand, chargePower: rangedChargePower, itemId: pendingItem?.id, inputAim,
        readyAt: state.elapsed + result.cooldown, expiresAt: inputExpiresAt };
      return true;
    }
    return false;
  }

  if (outgoing) world.attacks[otherHand] = null;
  if (world.guard) world.guard.hand = null;
  world.weaveQueue = null;

  const jumpAttack = getJumpAttack(result.item.type, world.playerMotion, hand);
  const kind = jumpAttack === 'flurry' ? 'thrust' : comboTiming.kind ?? getAttackKind(result.item.type);
  const profile = { ...getCombatProfile(result.item.type), kind, comboName: comboTiming.name };
  const chargePower = result.item.type === "Flail" || isChargeableRangedType(result.item.type) ? clamp(rangedChargePower, 0, 1) : 0;
  const range = getEffectiveAttackRange(result.item, result.stats, chargePower);
  const preparedAim = inputAim;
  const damage = getEffectiveAttackDamage(result.item, result.stats, chargePower) * (comboTiming.damageScale ?? 1);
  let duration = jumpAttack ? (jumpAttack === 'flurry' ? .66 : jumpAttack === 'plant' ? 1.2 : .8) : getAttackDuration(result.item.type, result.stats, chargePower) * comboTiming.durationScale;
  const baseDuration = duration;
  const turnAngle = !jumpAttack && world.playerMesh
    ? Math.abs(angleDifference(world.playerMesh.rotation.y, Math.atan2(preparedAim.direction.x, preparedAim.direction.z))) : 0;
  const turnExtra = Math.max(0, turnAngle / (4 * .65) - duration * profile.windup);
  if (turnExtra > 0) {
    // Smoothstep peaks at 1.5x average speed: allow at most 6 rad/s
    // during the first 65% of anticipation, including unassisted turns.
    // Preserve strike/recovery lengths and delay combo readiness by the same beat.
    duration += turnExtra;
    profile.windup = (profile.windup * baseDuration + turnExtra) / duration;
    profile.strike = profile.strike * baseDuration / duration;
    profile.hitMoment = (profile.hitMoment * baseDuration + turnExtra) / duration;
  }
  if (jumpAttack) {
    Object.assign(profile, { windup: .18, strike: .52, hitMoment: .4 });
    world.playerMotion.lastSpaceTap = null;
    if (jumpAttack !== 'plant' && jumpAttack !== 'flurry') world.playerMotion.verticalVelocity = Math.min(world.playerMotion.verticalVelocity, -8);
  }
  if (world.comboChains[otherHand]) {
    world.comboChains[otherHand].expiresAt = Math.max(world.comboChains[otherHand].expiresAt, state.elapsed + duration + .6);
  }
  const cadence = hasCombo && !jumpAttack ? getComboCadence(result.item.type, result.stats, attackCycle) : null;
  if (cadence && turnExtra > 0) {
    cadence.chainPoint = (cadence.chainPoint * baseDuration + turnExtra) / duration;
    cadence.duration = duration;
    cadence.interval += turnExtra;
  }
  const blendFrom = captureComboPose(hand);
  world.comboChains[hand] = cadence ? createComboChain(pendingItem.id, attackCycle, cadence, state.elapsed) : null;
  const slashDirection = Number.isFinite(comboTiming.slashDirection)
    ? comboTiming.slashDirection
    : kind === "slash" || kind === "chop"
      ? getSlashDirectionForCycle(attackCycle)
      : 0;
  if (comboTiming.steps > 1 || kind === "slash" || kind === "chop") {
    world.attackCycles[hand] += 1;
  }
  const attackDirection = preparedAim.direction;
  attackDirection.y = 0;
  if (attackDirection.lengthSq() > 0.001) {
    attackDirection.normalize();
  } else {
    attackDirection.set(0, 0, 1).applyQuaternion(world.playerMesh?.quaternion ?? new THREE.Quaternion()).setY(0).normalize();
  }

  const aimPoint = preparedAim.aimPoint;
  const aimRayDirection = world.aimRayDirection.lengthSq() > 0.001
    ? world.aimRayDirection.clone().normalize()
    : null;
  const aimRayOrigin = world.aimRayOrigin.clone();
  world.attacks[hand] = {
    hand,
    jumpAttack,
    weaponItem: result.item,
    itemName: result.item.name,
    broken: Boolean(result.broken),
    itemType: result.item.type,
    kind,
    profile,
    range,
    damage: result.item.type === "Flail" ? damage * (.65 + chargePower * 1.85) : damage,
    penetration: result.stats.penetration ?? 0,
    knockback: (result.stats.knockback ?? 0) * (comboTiming.knockbackScale ?? 1) * (result.item.type === "Flail" ? .6 + chargePower * 2 : 1),
    id: createId("swing"),
    hitTargets: new Set(),
    speed: result.stats.speed,
    direction: attackDirection,
    startFacing: world.playerMesh?.rotation.y ?? Math.atan2(attackDirection.x, attackDirection.z),
    assistTarget: preparedAim.target,
    aimPoint,
    aimOrigin: preparedAim.aimOrigin?.clone() ?? null,
    aimRayOrigin,
    aimRayDirection,
    screenX: isLockedThirdPersonCamera() ? window.innerWidth * 0.5 : world.pointer.x,
    screenY: isLockedThirdPersonCamera() ? window.innerHeight * 0.5 : world.pointer.y,
    chargePower,
    flailReleaseAngle: world.flailCharge?.angle ?? Math.atan2(attackDirection.x,attackDirection.z),
    comboStep: comboTiming.step,
    comboName: comboTiming.name,
    comboFollowUp: comboTiming.isFollowUp,
    comboHitVolume: comboTiming.hitVolume,
    comboChainPoint: cadence && !cadence.final ? cadence.chainPoint : 1,
    comboBlendFrom: blendFrom,
    slashDirection: slashDirection * (hand === "left" ? -1 : 1),
    elapsed: 0,
    duration,
    cooldownReadyAt: state.elapsed + 1 / Math.max(.1, result.stats.frequency),
    projectileSpawned: false,
    hitResolved: isProjectileWeapon(result.item.type)
  };

  if (jumpAttack === 'plant') startSpearJump(world.attacks[hand], world.playerMotion);

  markPlayerPersistenceDue();
  if (result.broken) {
    flash(result.message);
  }
  // A swing changes no visible inventory data. Hit wear refreshes separately.
  return true;
}

function startWorkAction(hand) {
  if (world.sceneMode !== "outdoor" || getEquippedItem(state, hand)) {
    return false;
  }

  const poi = getTargetedWorkstation();
  if (!poi) return false;

  world.workAction = {
    hand,
    poiId: poi.id,
    resourceId: poi.resourceId,
    yield: poi.yield,
    elapsed: 0,
    duration: WORK_ACTION_DURATION
  };
  document.body.dataset.workingHand = hand;
  document.body.dataset.workingPoi = poi.id;
  document.body.dataset.workingProgress = "0";
  return true;
}

function getTargetedWorkstation() {
  if (world.sceneMode !== "outdoor" || !world.hasAim || isBlockingLocationInput()) return null;
  return state.pois.find(poi => {
    if (!isWithinWorkstationReach(poi, state.player.position)) return false;
    const station = getPoiWorkstation(poi);
    return rayHitsWorkstation(poi, getTerrainHeightAt(station.x, station.z), world.aimRayOrigin, world.aimRayDirection);
  }) ?? null;
}

function stopWorkAction() {
  if (!world.workAction) {
    return;
  }

  const animatedHands = new Set([world.workAction.hand, ...(world.workAction.animatedHands ?? [])]);

  for (const hand of animatedHands) {
    const mount = hand === "left" ? world.leftHandMount : world.rightHandMount;
    const base = getHandBasePose(hand);

    mount.position.copy(base.position);
    mount.rotation.copy(base.rotation);
  }
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

  const target = getTargetedWorkstation();
  const heldButton = action.hand === "left" ? POINTER_BUTTON_LEFT : POINTER_BUTTON_RIGHT;

  if (!target || target.id !== action.poiId || !(world.pointer.buttons & heldButton)) {
    stopWorkAction();
    return;
  }

  action.elapsed += deltaSeconds * getWorkActionSpeedMultiplier();
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
  const hands = getWorkActionAnimationHands(action);
  action.animatedHands = hands;

  for (const hand of hands) {
    animateWorkHand(action, hand, hand === action.hand ? 0 : 0.5);
  }
}

function animateWorkHand(action, hand, phaseOffset = 0) {
  const mount = hand === "left" ? world.leftHandMount : world.rightHandMount;
  const side = HAND_CONFIG[hand].side;
  const base = getHandBasePose(hand);
  const progress = (action.elapsed % action.duration) / action.duration;
  const localProgress = (progress + phaseOffset) % 1;
  const stroke = Math.sin(localProgress * Math.PI);
  const cycle = Math.sin(localProgress * Math.PI * 2);

  mount.position.copy(base.position);
  mount.rotation.copy(base.rotation);
  mount.position.z += stroke * 0.36;
  mount.position.y -= stroke * 0.26;
  mount.position.x += side * cycle * 0.08;
  mount.rotation.x -= 0.55 + stroke * 0.48;
  mount.rotation.z += side * cycle * 0.28;
  poseAttackArm(hand, -0.72 - stroke * 0.34, side * (0.16 + stroke * 0.14), side * cycle * 0.12, 0.42 + stroke * 0.22, -0.04 * stroke);
}

function syncPointerButtons(event) {
  if (typeof event.buttons === "number") {
    world.pointer.buttons = event.buttons;
  }
}

function getWorkActionSpeedMultiplier() {
  if (isDualHandWorkActive()) {
    return DUAL_HAND_WORK_SPEED_MULTIPLIER;
  }

  return 1;
}

function getWorkActionAnimationHands(action) {
  return isDualHandWorkActive() ? ["left", "right"] : [action.hand];
}

function isDualHandWorkActive() {
  const leftHeld = (world.pointer.buttons & POINTER_BUTTON_LEFT) !== 0;
  const rightHeld = (world.pointer.buttons & POINTER_BUTTON_RIGHT) !== 0;

  if (leftHeld && rightHeld && !getEquippedItem(state, "left") && !getEquippedItem(state, "right")) {
    return true;
  }

  return false;
}

function completeWorkAction(action) {
  const poi = state.pois.find((entry) => entry.id === action.poiId);
  if (!getPoiWorkstation(poi) || getTargetedWorkstation()?.id !== poi.id) return;
  state.player.resources[poi.resourceId] += poi.yield;

  state.player.prowess = (state.player.prowess || 0) + (1);
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

  return world.outdoorMonsters.filter((monster) => !monster.raidInteriorId && monster.mesh.visible && !monster.dead && !monster.removed);
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
    connectionId,
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

  const scale = target?.gremlinSize?.scale ?? 1;
  const minY = (target?.hitMinY ?? .6) * scale;
  const height = minY + ((target?.hitMaxY ?? 5.6) * scale - minY) * .55;
  position.y += height;
  return position;
}

function getSlashDirectionForCycle(attackCycle) {
  return attackCycle % 2 === 0 ? -1 : 1;
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
  updateOutpostTowerAimFromAngles();
  world.towerBowView.visible = true;
  document.body.dataset.outpostTower = structure.id;
}

function updateWorld(deltaSeconds) {
  updateOutpostTower(deltaSeconds);
  const playerElevation = getPlayerWorldElevation();
  world.playerMesh.position.set(state.player.position.x, playerElevation, state.player.position.z);
  world.playerMesh.visible = !world.outpostTower.active;
  updateCastleRegeneration(deltaSeconds);
  updatePlayerRespawnStatus();
  updateMultiplayer(deltaSeconds);
  applyAimFacing(deltaSeconds);
  updatePlayerAnimation(deltaSeconds);
  updateRemotePlayers(deltaSeconds);
  world.weaponTrails ??= new CombatTrails(world.scene);
  world.weaponTrails.update(deltaSeconds);
  updateAttackAnimations(deltaSeconds);
  updateCombatFeedback(deltaSeconds);
  updateWorkAction(deltaSeconds);
  updateBaseEntryAction(deltaSeconds);
  updateDungeonLifecycle(deltaSeconds);
  updateDungeonEncounters(deltaSeconds);
  updatePveEnemies(deltaSeconds);
  updateOutdoorDungeonMonsters(deltaSeconds);
  updateOutpostDefenses(deltaSeconds);
  updateProjectiles(deltaSeconds);
}

// Presentation runs after all collision-safe substeps, using their summed delta.
// Player/mob attack poses stay in updateWorld: their transforms drive hit tests.
function updateFrameVisuals(deltaSeconds) {
  world.playerStatusVisuals ??= new PlayerStatusVisuals(world.playerMesh);
  world.playerStatusVisuals.update(deltaSeconds, playerStatuses);
  const playerElevation = getPlayerWorldElevation();
  world.playerMesh.position.set(state.player.position.x, playerElevation, state.player.position.z);
  updateDayNightLighting(deltaSeconds);
  document.body.dataset.playerX = state.player.position.x.toFixed(2);
  document.body.dataset.playerZ = state.player.position.z.toFixed(2);
  document.body.dataset.sceneMode = world.sceneMode;
  document.body.dataset.playerElevation = playerElevation.toFixed(2);
  updatePlayerHealthBar();
  updateCamera(deltaSeconds);
  world.camera.updateMatrixWorld();
  updateLockedThirdPersonAim();
  updateMeleeAssistVisual();
  updatePlayerArmorVisuals();
  updateLocationPrompt();
  updateDroppedItems(deltaSeconds);
  updateBloodSplats(deltaSeconds);
  updateWaterSplashEffects(deltaSeconds);
  updatePoiFlags();
  updateStructures();
  updateCampLights(world.campLights, world.campModels, state.player.position, state.elapsed, world.sceneMode === "outdoor");
  for (const chest of world.campChests) updateCampChest(chest, state.player);
  updateStreetLampLightingSystem();
  updatePlacementPreview();
  updateCouriers();
  updateEventMesh();
}

function showDeathScreen() {
  if (!ui.deathScreen.classList.contains("is-hidden")) return;
  ui.respawnName.value = randomPlayerFirstName(state.player.firstName);
  const faction = getFaction(state, state.selectedFactionId);
  ui.respawnLocation.textContent = faction
    ? `Return to ${faction.name}'s castle with full health.`
    : "Return to the starting area with full health.";
  ui.deathScreen.classList.remove("is-hidden");
  ui.deathScreen.setAttribute("aria-hidden", "false");
  world.keys.clear();
  world.pointer.buttons = 0;
  world.attacks.left = null;
  world.attacks.right = null;
  world.flailCharge = null;
  world.weaveQueue = null;
  world.guard.hand = null;
  stopWorkAction();
  stopBaseEntryAction();
  releaseLockedCameraForMenu();
  if (document.pointerLockElement) document.exitPointerLock();
  ui.respawnName.focus();
}

function updatePlayerRespawnStatus() {
  if (!state.player.dead) return;
  showDeathScreen();
  const remaining = Math.max(0, Math.ceil((world.multiplayer.respawnAt - Date.now()) / 1000));
  ui.respawnButton.disabled = remaining > 0;
  ui.respawnButton.textContent = remaining ? `Respawn in ${remaining}s` : "Respawn";
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
  if (!state.player.firstName || !world.multiplayer.enabled) {
    return;
  }

  world.multiplayer.sendTimer -= deltaSeconds;
  world.multiplayer.pollTimer -= deltaSeconds;

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
  if (!state.player.firstName || world.multiplayer.publishInFlight) {
    return;
  }

  world.multiplayer.publishInFlight = true;
  const inputSequence = world.multiplayer.nextInputSequence;
  world.multiplayer.nextInputSequence += 1;
  const requestStartedAt = Date.now();

  return fetch("/api/multiplayer/player", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildLocalPlayerPayload(inputSequence))
  })
    .then((response) => response.ok ? response.json() : Promise.reject(new Error("Multiplayer publish failed.")))
    .then((data) => {
      world.multiplayer.failed = false;
      observeServerClock(world.serverClock, data.serverTime, requestStartedAt, Date.now());
      world.multiplayer.lastAckedInputSequence = Math.max(
        world.multiplayer.lastAckedInputSequence,
        Number(data.acceptedInputSequence) || 0
      );
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
  const requestStartedAt = Date.now();

  fetch("/api/multiplayer/state")
    .then((response) => response.ok ? response.json() : Promise.reject(new Error("Multiplayer poll failed.")))
    .then((data) => {
      world.multiplayer.failed = false;
      observeServerClock(world.serverClock, data.serverTime, requestStartedAt, Date.now());
      const snapshotSequence = Math.max(0, Math.floor(Number(data.snapshotSequence) || 0));
      if (snapshotSequence > 0 && snapshotSequence <= world.multiplayer.lastSnapshotSequence) {
        return;
      }
      if (snapshotSequence > 0) {
        world.multiplayer.lastSnapshotSequence = snapshotSequence;
      }
      syncMultiplayerPlayers(Array.isArray(data.players) ? data.players : [], data.serverTime);
    })
    .catch(() => {
      world.multiplayer.failed = true;
    })
    .finally(() => {
      world.multiplayer.pollInFlight = false;
    });
}

function buildLocalPlayerPayload(inputSequence) {
  const leftHandItem = getEquippedItem(state, "left");
  const rightHandItem = getEquippedItem(state, "right");

  return {
    heartHealingTotal: world.multiplayer.heartHealingTotal ?? 0,
    id: state.player.id,
    connectionId,
    inputSequence,
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
    leftHandGem: leftHandItem?.socketedGem ?? null,
    rightHandType: rightHandItem?.type ?? null,
    rightHandName: rightHandItem?.name ?? null,
    rightHandGem: rightHandItem?.socketedGem ?? null,
    combatAttacks: ['left','right'].flatMap(hand => {
      const a = world.attacks[hand], charge=world.flailCharge?.hand===hand ? world.flailCharge : null;
      if (charge) return [{hand,id:'charge',itemType:'Flail',charging:true,elapsed:charge.elapsed%100,chargePower:flailChargePower(charge.elapsed),flailReleaseAngle:charge.angle%(Math.PI*2),duration:5,direction:{x:world.aimDirection.x,z:world.aimDirection.z}}];
      return a ? [{ hand, id: a.id, itemType: a.itemType, comboStep: a.comboStep, elapsed: a.elapsed, duration: a.duration, chargePower:a.chargePower, flailReleaseAngle:a.flailReleaseAngle%(Math.PI*2), direction: { x: a.direction.x, z: a.direction.z } }] : [];
    }),
    guardHand: world.guard.hand,
    guardStamina: world.guard.stamina,
    armorItems: getEquippedArmorItems().map(createNetworkArmorItem),
    hp: state.player.hp ?? MULTIPLAYER_MAX_HEALTH,
    maxHp: state.player.maxHp ?? MULTIPLAYER_MAX_HEALTH,
    dead: Boolean(state.player.dead),
    carriedInventory: state.player.dead ? world.multiplayer.deathInventory ?? state.player.inventory : state.player.inventory,
    deathLocation: state.player.dead ? world.multiplayer.deathLocation : null,
    respawnAt: world.multiplayer.respawnAt ?? 0
  };
}

function syncMultiplayerPlayers(players, serverTimeMs) {
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
    syncRemotePlayer(player, serverTimeMs);
  }

  for (const [id, remote] of world.remotePlayers) {
    if (!seenRemoteIds.has(id)) {
      removeFromParent(remote.group);
      world.remotePlayers.delete(id);
    }
  }
}

function loseCarriedResources() {
  world.multiplayer.deathLocation = { position: { ...state.player.position }, elevation: world.playerMesh.position.y,
    sceneMode: world.sceneMode, interiorFactionId: world.interiorFactionId, activePoiInteriorId: world.activePoiInteriorId, lava: world.sceneMode === 'poiInterior' && getActivePoiInterior()?.type === 'Dungeon' ? world.dungeon.layout.lava.filter(gap => distance2D(gap,state.player.position)<20).map(({x,z,width,depth})=>({x,z,width,depth})) : [], destroyedByLava: world.sceneMode === 'poiInterior' && getActivePoiInterior()?.type === 'Dungeon' && world.dungeon.layout?.lava?.some(gap => inside(state.player.position, gap)) };
  world.multiplayer.deathInventory = structuredClone(state.player.inventory);
  if (!world.multiplayer.enabled) {
    state.deathDrops ??= [];
    state.deathDrops.push(...createDeathDrops(state.player, world.multiplayer.deathLocation, createId("life")));
    syncDeathDropMeshes();
  } else clearPlayerInventory(state.player);
  clearPlayerResources(state.player);
  markPlayerPersistenceDue();
  refreshUi();
}

function syncLocalPlayerHealth(player) {
  if ((player.lastSeen ?? 0) < (world.multiplayer.healthSnapshotTime ?? 0)) return;
  world.multiplayer.healthSnapshotTime = player.lastSeen ?? 0;
  if (!player.dead && player.flamingUntil > Date.now() && player.flamingUntil > (world.lastFlamingUntil ?? 0)) {
    world.lastFlamingUntil = player.flamingUntil;
    playerStatuses.apply('flaming', player.lastDamagedByName, (player.flamingUntil - Date.now()) / 1000);
  }
  // Delayed snapshots must not undo a local death or a newly chosen life.
  if ((player.lifeNumber ?? 0) < (state.player.lifeNumber ?? 0)) return;
  if (state.player.dead && !player.dead) return;
  if ((player.lastBlockedAt ?? 0) > (world.guard.lastServerBlock ?? 0)) {
    world.guard.lastServerBlock = player.lastBlockedAt;
    world.guard.stamina = Math.min(world.guard.stamina, player.guardStamina);
    if (player.guardStamina <= 0) { world.guard.brokenUntil = state.elapsed + 1.4; world.guard.hand = null; }
    const shield = ['left','right'].map(h => getEquippedItem(state,h)).find(item => isShield(item?.type));
    if (shield) { damageInventoryItem(state, shield, 1); markPlayerPersistenceDue(); }
    flash(player.guardStamina <= 0 ? 'Guard broken!' : 'Blocked');
  }
  const previousHp = state.player.hp ?? MULTIPLAYER_MAX_HEALTH;
  state.player.maxHp = player.maxHp ?? MULTIPLAYER_MAX_HEALTH;
  state.player.hp = reconcileHealth({ ...state.player, factionId: state.selectedFactionId,
    sceneMode: world.sceneMode, interiorFactionId: world.interiorFactionId }, player,
    world.multiplayer.damageInputSequence ?? 0, world.multiplayer.heartHealingTotal ?? 0);
  state.player.dead = Boolean(player.dead);
  world.multiplayer.respawnAt = player.respawnAt ?? 0;
  if (state.player.hp !== previousHp) markPlayerPersistenceDue();

  if (state.player.hp < previousHp && !state.player.dead && !isBloodlessDamageSource(player.lastDamageSource)) {
    spawnBloodSplat({ mesh: world.playerMesh, radius: 1.15, hitMinY: 0.8, hitMaxY: 5.4 }, null, previousHp - state.player.hp);
  }

  if (state.player.dead && !world.multiplayer.localDefeated) {
    const attacker = player.lastDamagedByName ? ` by ${player.lastDamagedByName}` : "";
    loseCarriedResources();
    world.multiplayer.localDefeated = true;
    showDeathScreen();
    flash(`You were defeated${attacker}.`);
  }
}

function placePlayerAtRespawnPoint() {
  exitOutpostTower();
  leaveCurrentInterior();
  leaveRulerSeat();
  world.keys.clear();
  world.playerMotion.verticalOffset = 0;
  world.playerMotion.verticalVelocity = 0;
  world.playerMotion.knockbackVelocity.set(0, 0, 0);
  world.hasAim = false;
  const faction = state.selectedFactionId ? FACTION_LOOKUP[state.selectedFactionId] : null;
  state.player.position.x = faction ? faction.position.x : 0;
  state.player.position.z = faction ? faction.position.z + CASTLE_GATE_Z + 5 : 0;
  world.playerMotion.moving = false;
  world.playerMotion.speed = 0;
  world.playerMesh.position.set(state.player.position.x, getPlayerWorldElevation(), state.player.position.z);
  clearProjectiles();
}

function syncRemotePlayer(player, serverTimeMs) {
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
  remote.combatReceivedAt = performance.now();
  remote.hp = player.hp ?? MULTIPLAYER_MAX_HEALTH;
  remote.maxHp = player.maxHp ?? MULTIPLAYER_MAX_HEALTH;
  remote.dead = Boolean(player.dead);
  const remoteY = Number.isFinite(Number(player.elevation))
    ? Number(player.elevation)
    : getTerrainHeightAt(player.position.x, player.position.z);
  const snapshotResult = appendRemoteSnapshot(remote.snapshots, {
    ...player,
    elevation: remoteY
  }, serverTimeMs, {
    teleportDistance: REMOTE_TELEPORT_DISTANCE
  });
  remote.targetPosition.set(player.position.x, remoteY, player.position.z);
  remote.targetRotation = player.rotation ?? 0;
  remote.targetHeadRotation = player.headRotation ?? 0;

  if (snapshotResult.reset || isNewRemote) {
    remote.group.position.set(
      snapshotResult.sample?.position.x ?? player.position.x,
      snapshotResult.sample?.position.y ?? remoteY,
      snapshotResult.sample?.position.z ?? player.position.z
    );
    remote.group.rotation.y = snapshotResult.sample?.rotation ?? player.rotation ?? 0;
  }

  if (!isNewRemote && player.lastDamagedAt && player.lastDamagedAt !== remote.lastDamagedAt) {
    remote.lastDamagedAt = player.lastDamagedAt;
    remote.group.scale.set(1.08, 1.08, 1.08);
    if (previousRemoteHp > remote.hp && !isBloodlessDamageSource(player.lastDamageSource)) {
      spawnBloodSplat(remote, null, Math.max(1, previousRemoteHp - remote.hp));
    }
  }

  syncRemoteHeldItem(remote, "left", createNetworkHeldItem(player.leftHandType, player.leftHandName, player.leftHandGem));
  syncRemoteHeldItem(remote, "right", createNetworkHeldItem(player.rightHandType, player.rightHandName, player.rightHandGem));
  syncRemoteArmorVisuals(remote, player.armorItems);
  updateRemoteHealthBar(remote);
}

function updateRemotePlayers(deltaSeconds) {
  const serverTimeMs = estimateServerTime(world.serverClock);

  for (const remote of world.remotePlayers.values()) {
    const visible = isRemotePlayerInCurrentScene(remote.snapshot) && !remote.dead;
    remote.group.visible = visible;

    if (!visible) {
      continue;
    }

    const renderSample = sampleRemoteSnapshots(remote.snapshots, serverTimeMs, {
      interpolationDelayMs: REMOTE_INTERPOLATION_DELAY_MS,
      maxExtrapolationMs: REMOTE_MAX_EXTRAPOLATION_MS
    });
    if (renderSample) {
      remote.group.position.set(renderSample.position.x, renderSample.position.y, renderSample.position.z);
      remote.group.rotation.y = renderSample.rotation;
      remote.renderState.moving = renderSample.moving;
      remote.renderState.speed = renderSample.speed;
      remote.renderState.headRotation = renderSample.headRotation;
    }
    remote.group.scale.lerp(new THREE.Vector3(1, 1, 1), Math.min(1, deltaSeconds * 7));
    animateRemotePlayer(remote, deltaSeconds);
  }

  resolveRemotePlayerBodyCollisions();
}

function animateRemotePlayer(remote, deltaSeconds) {
  const rig = remote.rig;
  rig.visualRoot ??= remote.group;
  if (!rig.crown) { rig.crown = createPlayerCrown(); rig.headGroup.add(rig.crown); }
  rig.crown.visible = isFactionRuler(state, remote.snapshot?.factionId, remote.snapshot?.id);
  updateRoyalCape(rig, remote.snapshot?.factionId, rig.crown.visible, deltaSeconds, { speed: remote.renderState?.speed ?? 0, heading: remote.group.rotation.y });
  const moving = Boolean(remote.renderState?.moving);
  const speed = remote.renderState?.speed ?? 0;
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
  rig.headGroup.rotation.y = remote.renderState?.headRotation ?? remote.targetHeadRotation;
  rig.leftLeg.position.set(HAND_CONFIG.left.side * 0.42, 2.05, 0);
  rig.rightLeg.position.set(HAND_CONFIG.right.side * 0.42, 2.05, 0);
  rig.leftLeg.rotation.x = stride * 0.72;
  rig.rightLeg.rotation.x = -stride * 0.72;
  setLegJointPose(rig.leftLeg, (0.12 + Math.max(0, -stride) * 0.58 + Math.abs(stride) * 0.12) * remote.motion.amount, -0.08 * remote.motion.amount);
  setLegJointPose(rig.rightLeg, (0.12 + Math.max(0, stride) * 0.58 + Math.abs(stride) * 0.12) * remote.motion.amount, -0.08 * remote.motion.amount);
  setRemoteArmWalkPose(remote, "left", -stride * 0.46);
  setRemoteArmWalkPose(remote, "right", stride * 0.46);
  animateRemoteCombat(remote);
}

function animateRemoteCombat(remote) {
  const now=performance.now();
  const age = (now - (remote.combatReceivedAt ?? now)) / 1000;
  const dt=Math.min(.1,(now-(remote.flailUpdatedAt??now))/1000);remote.flailUpdatedAt=now;
  for (const hand of ['left','right']) {
    const held = remote.heldItems[hand].mesh;
    if (!held) continue;
    held.quaternion.copy(held.userData.restQuaternion);
    held.position.copy(held.userData.restPosition);
    updateFlailModel(held);
    const arm = remote.rig[`${hand}Arm`], side = HAND_CONFIG[hand].side;
    const a = remote.snapshot.combatAttacks?.find(a => a.hand === hand);
    if (a?.itemType==='Flail' && (a.charging ? age<.75 : a.elapsed+age<a.duration)) {
      const profile=getCombatProfile('Flail'),p=a.charging?0:clamp((a.elapsed+age)/a.duration,0,1);
      const drop=a.charging?0:easeInOut((p-profile.windup)/profile.strike);
      const recover=a.charging?0:easeInOut((p-profile.windup-profile.strike)/profile.recovery);
      const idle=arm.quaternion.clone(),elbow=arm.userData.forearm.quaternion.clone();
      reachHand(arm,remote.group.localToWorld(new THREE.Vector3(side*(.85+drop*.35),5.8-drop*1.9,.3+drop*1.1)));
      const blend=Math.max(a.charging?1-easeInOut(a.elapsed/.5):0,recover);
      arm.quaternion.slerp(idle,blend);arm.userData.forearm.quaternion.slerp(elbow,blend);
      const forward=new THREE.Vector3(a.direction.x,0,a.direction.z).normalize();
      const direction=new THREE.Vector3(forward.z*side,.25,-forward.x*side).lerp(forward,drop).normalize();
      const rest=held.quaternion.clone();
      setObjectWorldPoseAlongDirection(held,held.parent.getWorldPosition(new THREE.Vector3()),direction);
      held.quaternion.slerp(rest,blend);seatWeaponInHand(held,arm.userData.hand);
      const angle=a.charging ? a.flailReleaseAngle+side*(2+8*a.chargePower)*age : getFlailReleaseAngle({...a,profile},p,side);
      const previous=held.userData.flailAngle??angle;
      // Network angles wrap; choose the nearby equivalent of the old angle.
      const from=angle+Math.atan2(Math.sin(previous-angle),Math.cos(previous-angle));
      simulateFlailModel(held,dt,{fromAngle:from,toAngle:angle,tilt:.7*(1-drop),side,yaw:Math.atan2(a.direction.x,a.direction.z),tension:a.charging?Math.min(1,(a.elapsed+age)/.55):1});
      held.userData.flailAngle=angle;
      continue;
    }
    if (a && a.elapsed + age < a.duration) {
      const step = getCombatComboTiming(a.itemType, a.comboStep);
      const profile = { ...getCombatProfile(a.itemType), kind: step.kind ?? getCombatKind(a.itemType), comboName: step.name };
      const p = clamp((a.elapsed + age) / a.duration, 0, 1);
      const direction = (step.slashDirection || 1)*(hand==='left'?-1:1);
      const pose = sampleMeleeMotion(profile, p, direction);
      arm.rotation.set(pose.shoulderX, pose.shoulderY, side * .16 + pose.shoulderZ);
      setArmJointPose(arm, pose.elbow, -.03, 0);
      remote.rig.body.rotation.y = remote.rig.chest.rotation.y = pose.chest;
      remote.rig.body.rotation.x = -pose.lean * .4;
      remote.rig.chest.rotation.x = -pose.lean;
      const lead = remote.rig[`${hand}Leg`]; lead.position.z += pose.step;
      setLegJointPose(lead, pose.knee * 1.5, -pose.knee * .4);
      const forward = new THREE.Vector3(a.direction?.x ?? Math.sin(remote.group.rotation.y), 0, a.direction?.z ?? Math.cos(remote.group.rotation.y));
      if (!isProjectileWeapon(a.itemType)) {
        const angles = profile.kind === 'thrust' ? {yaw:0,pitch:0,recovery:pose.recover} : focusedSwingAngles(profile,p,direction);
        const right = new THREE.Vector3(forward.z,0,-forward.x);
        forward.applyAxisAngle(new THREE.Vector3(0,1,0),angles.yaw).applyAxisAngle(right,-angles.pitch);
        const rest = held.quaternion.clone();
        setObjectWorldPoseAlongDirection(held,held.parent.getWorldPosition(new THREE.Vector3()),forward);
        if (a.itemType === 'Axe') held.rotateY(direction * (Math.PI * .5 + .3));
        else if (step.name === 'overheadFinish') held.rotateY(Math.PI / 2);
        held.quaternion.slerp(rest, Math.max(1-easeInOut(p/profile.windup),angles.recovery));
        seatWeaponInHand(held, arm.userData.hand);
      }
      updateFlailModel(held,p,a.itemType==='Flail',direction);
    } else if (held.getObjectByName('flailChain')) {
      simulateFlailModel(held,dt);delete held.userData.flailAngle;
    } else if (remote.snapshot.guardHand === hand && age < .75) {
      arm.rotation.set(-1.04, side*.16, -side*.22);
      setArmJointPose(arm,.85,0,0);
      const forward = new THREE.Vector3(Math.sin(remote.group.rotation.y)*side,0,Math.cos(remote.group.rotation.y)*side);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1,0,0),forward);
      held.quaternion.copy(held.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(q));
      held.position.set(0,0,0);
    }
  }
}

function setRemoteArmWalkPose(remote, hand, swing) {
  const arm = hand === "left" ? remote.rig.leftArm : remote.rig.rightArm;
  const side = HAND_CONFIG[hand].side;

  arm.position.set(side * 0.92, 4.35, 0.02);
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
    held.mesh.userData.restQuaternion = held.mesh.quaternion.clone();
    held.mesh.userData.restPosition = held.mesh.position.clone();
    tagEntityStatusTarget(held.mesh, getRemotePlayerStatusKey(remote.id));
    mount.add(held.mesh);
  }
}

function createNetworkHeldItem(type, name, socketedGem = null) {
  return type ? { id: `${type}:${name ?? type}:${socketedGem ?? ""}`, type, name: name ?? type, socketedGem } : null;
}

function createNetworkArmorItem(item) {
  const profile = getArmorMaterialProfile(item);

  return item?.armor
    ? {
        id: `${item.armor.slot}:${item.type}:${profile.material}:${profile.color}:${profile.metalness}:${item.socketedGem ?? ""}`,
        type: item.type,
        name: item.name,
        socketedGem: item.socketedGem ?? null,
        armor: {
          slot: item.armor.slot,
          material: profile.material,
          color: profile.color,
          metalness: profile.metalness,
          defense: item.armor.defense,
          resistance: item.armor.resistance,
          toughness: item.armor.toughness
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
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(world.playerMesh.quaternion);
    world.playerMesh.rotation.set(0, Math.atan2(forward.x, forward.z), 0);
  }

  if (world.playerVisualRoot) {
    world.playerVisualRoot.rotation.set(0, 0, 0);
    world.playerVisualRoot.position.set(0, 0, 0);
  }
}

function setArmJointPose(arm, elbowX = 0, wristX = 0, wristZ = 0) {
  if (!arm) {
    return;
  }

  const forearm = arm.userData?.forearm;
  const hand = arm.userData?.hand;

  if (forearm) {
    forearm.rotation.set(-THREE.MathUtils.clamp(elbowX, 0, 2.35), 0, 0);
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
  updateRoyalCape(rig, state.selectedFactionId, rig.crown.visible, deltaSeconds, { speed: world.playerMotion.moving ? world.playerMotion.speed : world.playerMotion.jumping ? world.playerMotion.airborneSpeed : 0, heading: world.playerMesh.rotation.y, seated: world.seatedOnThrone, airborne: world.playerMotion.jumping || world.playerMotion.rolling });

  if (world.seatedOnThrone) {
    world.playerMotion.jumpAnimation = undefined;
    rig.visualRoot.position.y = 0;
    applySeatedPose();
    return;
  }

  const motion = world.playerMotion;

  if (motion.rolling) {
    motion.jumpAnimation = undefined;
    rig.visualRoot.position.y = 0;
    applyRollPose(motion.rollElapsed / ROLL_DURATION);
    return;
  }

  resetPlayerRootLean();

  const airborne = motion.jumping || isPlayerAirborne(motion);
  const travelling = motion.moving || (airborne && motion.airborneDirection.lengthSq() > 0.001);
  const gaitSpeed = airborne ? motion.airborneSpeed : motion.speed;
  const blendSpeed = 1 - Math.exp(-deltaSeconds * 8);
  motion.amount = THREE.MathUtils.lerp(motion.amount ?? 0, travelling ? 1 : 0, blendSpeed);
  motion.gait += deltaSeconds * (travelling ? Math.max(4.5, gaitSpeed * 0.32) : 2.2);
  motion.jumpAnimation = stepJumpAnimation(motion.jumpAnimation, {
    airborne, verticalVelocity: motion.verticalVelocity
  }, deltaSeconds);

  const stride = Math.sin(motion.gait) * motion.amount;
  const strideOpposite = -stride;
  const bob = Math.abs(Math.sin(motion.gait)) * 0.11 * motion.amount * (1 - motion.jumpAnimation.weight);
  const sway = Math.sin(motion.gait * 0.5) * 0.04 * motion.amount;

  rig.body.position.y = 3.15 + bob;
  rig.body.rotation.set(0, 0, 0);
  rig.chest.position.y = 3.65 + bob;
  rig.chest.rotation.set(0, 0, sway);
  rig.headGroup.position.set(0, 5.2 + bob * 0.65, 0.16);
  rig.headGroup.rotation.x = 0;
  rig.headGroup.rotation.z = 0;
  // Attack chest compensation is additive; clear last frame's head twist even
  // while an attack owns facing, otherwise repeated strokes accumulate yaw.
  rig.headGroup.rotation.y = 0;

  rig.leftLeg.position.set(HAND_CONFIG.left.side * .42, 2.05, 0);
  rig.rightLeg.position.set(HAND_CONFIG.right.side * .42, 2.05, 0);
  rig.leftLeg.rotation.x = stride * 0.72;
  rig.rightLeg.rotation.x = strideOpposite * 0.72;
  rig.leftLeg.rotation.z = HAND_CONFIG.left.side * 0.04 * motion.amount;
  rig.rightLeg.rotation.z = HAND_CONFIG.right.side * 0.04 * motion.amount;
  setLegJointPose(rig.leftLeg, (0.12 + Math.max(0, -stride) * 0.58 + Math.abs(stride) * 0.12) * motion.amount, -0.08 * motion.amount);
  setLegJointPose(rig.rightLeg, (0.12 + Math.max(0, stride) * 0.58 + Math.abs(stride) * 0.12) * motion.amount, -0.08 * motion.amount);

  setArmWalkPose("left", -stride * 0.46);
  setArmWalkPose("right", stride * 0.46);
  applyJumpAnimation(rig, motion.jumpAnimation);
}

function ensureDungeonPveEnemyRoster() {
  if (world.dungeon.status !== "active" && world.dungeon.status !== "collapsing") {
    return;
  }

  if (world.pveEnemies.length || !world.dungeon.layout || !world.dungeon.contentRoot || !GAME_FLAGS.pve) {
    return;
  }

  for (const spawn of createDungeonEnemySpawns(world.dungeon.layout)) {
    world.dungeon.contentRoot.add(createPveEnemy(spawn));
  }
}

function getPveEnemyAttackRange(enemy) {
  const range = enemy.attackRange ?? 2.4;
  if (isProjectileWeapon(enemy.weapon?.type ?? "Empty Hand")) return range;

  // Melee must be able to start at the separation enforced by body collisions.
  const contactDistance = (enemy.radius ?? 1.1) + PLAYER_COLLISION_RADIUS + ACTOR_COLLISION_PADDING;
  return Math.max(range, contactDistance + 0.05);
}

function startPveEnemyAttack(enemy, targetPosition, comboIndex = 0) {
  if (comboIndex === 0 && !enemyAttackPermitted(enemy, getActiveCombatEnemies(), state.elapsed)) return false;
  enemy.lastAttackStartedAt = state.elapsed;
  const itemType = enemy.weapon?.type ?? "Empty Hand";
  const stats = getPveEnemyAttackStats(enemy);
  const ranged = isProjectileWeapon(itemType);
  const combo = getCombatComboTiming(itemType, comboIndex);
  const kind = ranged ? getAttackKind(itemType) : combo.kind ?? getAttackKind(itemType);
  const profile = { ...getCombatProfile(itemType), kind, comboName: combo.name };
  const duration = ranged ? getPveEnemyAttackDuration(itemType, stats)
    : Math.max(.48, getAttackDuration(itemType, stats) * combo.durationScale);
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
    itemName: enemy.weapon?.name ?? itemType,
    direction,
    elapsed: 0,
    profile,
    duration,
    comboStep: comboIndex,
    comboSteps: ranged ? 1 : Math.max(2, combo.steps),
    comboName: combo.name,
    slashDirection: combo.slashDirection ?? (comboIndex % 2 ? 1 : -1),
    comboChainPoint: Math.max(profile.hitMoment + .04, profile.windup + profile.strike + profile.recovery * .22),
    range: getPveEnemyAttackRange(enemy),
    damage: Math.max(1, Math.round((Number(stats.damage) || 8) * (combo.damageScale ?? 1))),
    penetration: Number(stats.penetration) || 0,
    knockback: (Number(stats.knockback) || 0) * (combo.knockbackScale ?? 1),
    speed: Number(stats.speed) || 1,
    projectileSpawned: false,
    hitResolved: false,
    lungeApplied: 0
  };
  enemy.mesh.rotation.y = Math.atan2(direction.x, direction.z);
  enemy.attackTimer = enemy.attackCooldown;
  if (isProjectileWeapon(itemType)) {
    // Plant the feet before raising the weapon instead of freezing mid-stride.
    updatePveMobAnimation(enemy, 1, false, false);
  }
}

function getPveEnemyAttackDuration(itemType, stats) {
  return getAttackDuration(itemType, stats, 0, { mob: true });
}

function getPveEnemyAttackProgress(attack) {
  if (!isProjectileWeapon(attack.itemType)) return Math.min(1, attack.elapsed / attack.duration);

  const release = getCombatReleaseMoment(attack.itemType, 0);
  const releaseTime = release * attack.duration;
  // Hold the loaded aiming pose for a beat, even with very fast weapons.
  const aimHold = Math.max(1.2, 1.4 - releaseTime);
  if (attack.elapsed < releaseTime) return attack.elapsed / attack.duration;
  if (attack.elapsed < releaseTime + aimHold) return Math.max(0, release - 0.001);
  return Math.min(1, (attack.elapsed - aimHold) / attack.duration);
}

function updatePveEnemyAttack(enemy, deltaSeconds, targetPosition, options = {}) {
  const attack = enemy.attackAnimation;

  if (!attack) {
    resetPveEnemyWeaponPose(enemy);
    return false;
  }

  if (enemy.shoveStaggerTimer > 0) {
    resetPveEnemyAttackState(enemy);
    enemy.attackTimer = Math.max(enemy.attackTimer ?? 0, 1.1);
    return false;
  }

  if (isProjectileWeapon(attack.itemType) && !attack.projectileSpawned) {
    updatePveEnemyAim(enemy, attack, targetPosition, deltaSeconds);
  }

  attack.elapsed += deltaSeconds;
  const progress = getPveEnemyAttackProgress(attack);
  const hitMoment = attack.profile?.hitMoment ?? getPveEnemyHitMoment(attack.itemType);

  animatePveEnemyAttack(enemy, attack, progress);
  movePveEnemyDuringAttack(enemy, attack, progress, hitMoment, deltaSeconds, options);

  const projectileAttack = isProjectileWeapon(attack.itemType);
  if (projectileAttack && !attack.projectileSpawned && progress >= getCombatReleaseMoment(attack.itemType, 0)) {
    spawnPveEnemyProjectile(enemy, attack, targetPosition);
  }

  if (!projectileAttack && !attack.hitResolved && progress >= hitMoment) {
    attack.hitResolved = true;
    if (canPveEnemyHitPlayer(enemy, targetPosition)) {
      applyPveEnemyHitToPlayer(enemy);
    }
  }

  // Link after the damaging stroke, without returning to idle between hits.
  if (!projectileAttack && attack.hitResolved && progress >= attack.comboChainPoint
      && attack.comboStep + 1 < attack.comboSteps && enemy.shoveStaggerTimer <= 0) {
    const distance = Math.hypot(targetPosition.x - enemy.mesh.position.x, targetPosition.z - enemy.mesh.position.z);
    if (distance <= attack.range + .75) {
      startPveEnemyAttack(enemy, targetPosition, attack.comboStep + 1);
      return true;
    }
  }

  if (progress >= 1) {
    resetPveEnemyAttackState(enemy);
    // Ranged cooldown starts after recovery so the aiming hold cannot consume it.
    enemy.attackTimer = Math.max(enemy.attackTimer ?? 0, projectileAttack ? 1.5 : 1.1);
    return false;
  }

  return true;
}

function updatePveEnemyAim(enemy, attack, targetPosition, deltaSeconds) {
  const desired = Math.atan2(targetPosition.x - enemy.mesh.position.x, targetPosition.z - enemy.mesh.position.z);
  const current = Math.atan2(attack.direction.x, attack.direction.z);
  const difference = Math.atan2(Math.sin(desired - current), Math.cos(desired - current));
  // 45 degrees per second: a dodge behind the archer beats its tracking.
  const limit = Math.PI / 4 * deltaSeconds;
  const yaw = current + clamp(difference, -limit, limit);
  attack.direction.set(Math.sin(yaw), 0, Math.cos(yaw));
  enemy.mesh.rotation.y = yaw;
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
    progress,
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
    ? Math.min(1.35, Math.max(0.9, attack.range / 4.8))
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
    const thrust = phase.commit * (1 - phase.recover);
    const retract = (pose.retract ?? 0.58) * phase.anticipation * (1 - phase.commit);
    const extension = (pose.reach ?? 1.7) * thrust;
    container.position.z += (extension - retract) * rangeScale;
    container.position.x += attackSide * (pose.lateral ?? 0.05) * thrust;
    container.position.y += phase.anticipation * (pose.lift ?? 0.04) - thrust * 0.025;
    container.rotation.x += (pose.windupX ?? -0.06) * phase.anticipation + (pose.strikeX ?? 0.08) * thrust + (pose.recoverX ?? -0.02) * phase.recover;
    container.rotation.y += attackSide * ((pose.windupY ?? -0.025) * phase.anticipation + (pose.strikeY ?? 0.015) * thrust);
    container.rotation.z += attackSide * ((pose.windupZ ?? -0.03) * phase.anticipation + (pose.strikeZ ?? 0.02) * thrust);

    if (!options.mob) {
      poseAttackArm(options.hand, -0.44 - thrust * 0.68, side * (0.1 - thrust * 0.04), attackSide * 0.025 * thrust, 0.3 - thrust * 0.08, -0.03 * thrust);
      poseSupportArm(options.hand, profile, phase, thrust);
    }
  } else if (profile.kind === "chop") {
    const windup = phase.anticipation * (1 - phase.commit);
    const chop = phase.commit * (1 - phase.recover);
    const sweep = phase.followThrough;
    const recoverySway = Math.sin(phase.recover * Math.PI);
    container.position.z += ((pose.reach ?? 1) * sweep - windup * 0.32) * rangeScale;
    container.position.x += attackSide * (-0.78 * windup + (pose.lateral ?? 1) * chop);
    container.position.y += (pose.lift ?? 0.5) * windup - chop * 0.16 + sweep * 0.1;
    container.rotation.x += (pose.windupX ?? -0.5) * windup + (pose.strikeX ?? -0.16) * chop - recoverySway * 0.08;
    container.rotation.y += attackSide * ((pose.windupY ?? -0.4) * windup + (pose.strikeY ?? 0.62) * chop);
    container.rotation.z += attackSide * ((pose.windupZ ?? -1.35) * windup + (pose.strikeZ ?? 2.6) * chop + 0.18 * sweep);

    if (!options.mob) {
      poseAttackArm(
        options.hand,
        -0.62 - windup * 0.42 - sweep * 0.38 + recoverySway * 0.12,
        attackSide * (-0.5 * windup + 0.72 * chop),
        -attackSide * (0.44 * windup - 0.58 * chop),
        (pose.elbowBase ?? 0.7) + windup * 0.18 - chop * 0.26,
        (pose.wristStrike ?? -0.09) * sweep,
        side * attackSide * 0.09 * chop
      );
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
      const armRotationZ = pose.armWindupZ == null
        ? attackSide * (0.16 + cut * 0.46 - phase.recover * 0.16)
        : attackSide * (pose.armWindupZ * phase.anticipation + (pose.armStrikeZ ?? 0.46) * cut + (pose.armRecoverZ ?? -0.16) * phase.recover);
      const armRotationY = pose.armWindupY == null
        ? -attackSide * (phase.anticipation * 0.32 - cut * 0.48)
        : attackSide * (pose.armWindupY * phase.anticipation + (pose.armStrikeY ?? 0.48) * cut + (pose.armRecoverY ?? -0.08) * phase.recover);
      poseAttackArm(options.hand, -0.5 - swoop * 0.4 + phase.recover * 0.12, armRotationZ, armRotationY, (pose.elbowBase ?? 0.38) + swoop * 0.2, -0.04 * swoop, side * attackSide * 0.05 * cut);
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
  if (!rig || !world.playerVisualRoot) return;
  const progress = phase.progress ?? 0;
  const motion = sampleMeleeMotion(profile, progress, attackSide);
  rig.chest.rotation.y += motion.chest;
  rig.chest.rotation.x -= motion.lean;
  rig.body.rotation.y += motion.chest;
  rig.body.rotation.x -= motion.lean * .4;
  rig.headGroup.rotation.y -= motion.chest * .35;
  const lead = hand === 'left' ? rig.leftLeg : rig.rightLeg;
  const back = hand === 'left' ? rig.rightLeg : rig.leftLeg;
  const grounded = !world.playerMotion?.jumping && !world.playerMotion?.rolling;
  if (lead && back && grounded) {
    lead.position.z += motion.step;
    back.position.z -= motion.step * .5;
    lead.rotation.x -= motion.knee;
    back.rotation.x += motion.knee * .6;
    setLegJointPose(lead, motion.knee * 1.5, -motion.knee * .4);
    setLegJointPose(back, motion.knee * .5, 0);
  }
  // Arms are siblings of the chest in the articulated rig: orbit their shoulder
  // anchors with the chest so the tunic and shoulders turn together.
  for (const [name, sign] of [['leftArm',1],['rightArm',-1]]) {
    const arm = rig[name];
    arm.position.x = sign * .92 * Math.cos(motion.chest) + .02 * Math.sin(motion.chest);
    arm.position.z = .02 * Math.cos(motion.chest) - sign * .92 * Math.sin(motion.chest);
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
  // The old rectangular plane read as a box around the weapon. Contact flashes
  // and hit reactions provide feedback without covering the actual blade.
  const root = getWeaponVisualRoot(container);
  const trail = root?.getObjectByName('weaponAttackTrail');
  if (trail) { trail.removeFromParent(); trail.geometry.dispose(); trail.material.dispose(); }
}

function updateHeldRangedModelState(container, itemType, draw, projectileLoaded = true) {
  const root = getWeaponVisualRoot(container);

  if (!root) {
    return;
  }

  if (root.getObjectByName("bowString")?.isLine) {
    updateBowString(root, draw, projectileLoaded);
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
  if (weapon) {
    resetPveEnemyWeaponPose(enemy);
    applyProfiledWeaponPose(weapon, attack, progress, { mob: true, side: -1, trailRoot: weapon });
    weapon.position.set(...weapon.userData.basePosition);
    updateFlailModel(weapon.children[0], progress, attack.itemType === "Flail", -1);
  }

  const rig = enemy.rig;
  if (!rig) {
    return;
  }

  const anticipationEnd = attack.profile?.windup ?? .4;
  const windup = progress < anticipationEnd
    ? easeOut(progress / anticipationEnd)
    : 1 - easeOut((progress - anticipationEnd) / Math.max(.01, 1 - anticipationEnd));
  if (rig.kind === "creature") {
    rig.body.rotation.x = Math.PI * 0.42 - windup * 0.18;
    rig.headGroup.rotation.x = -0.2 + windup * 0.32;
    rig.leftArm.rotation.x = -0.18 - windup * 1.45;
    rig.rightArm.rotation.x = 0.08 - windup * 1.7;
    rig.leftArm.rotation.z = 0.22 + windup * 0.2;
    rig.rightArm.rotation.z = -0.22 - windup * 0.2;
    setArmJointPose(rig.leftArm, 0.32 + windup * 0.5, -windup * 0.18, 0);
    setArmJointPose(rig.rightArm, 0.24 + windup * 0.62, -windup * 0.22, 0);
  } else {
    rig.rightArm.rotation.x = -windup * 1.1;
    rig.rightArm.rotation.z = -0.16 - windup * 0.2;
    rig.leftArm.rotation.x = windup * 0.28;
    setArmJointPose(rig.rightArm, 0.16 + windup * 0.48, -windup * 0.12, 0);
  }
}

function updatePveMobAnimation(enemy, deltaSeconds, moving, attackActive) {
  const rig = enemy.rig;
  if (!rig || attackActive) {
    return;
  }

  const blend = Math.min(1, deltaSeconds * 8);
  rig.moveAmount = THREE.MathUtils.lerp(rig.moveAmount ?? 0, moving ? 1 : 0, blend);
  rig.animationTime = (rig.animationTime ?? 0) + deltaSeconds * (moving ? Math.max(4.5, enemy.speed * 0.82) : 2);
  const stride = Math.sin(rig.animationTime) * rig.moveAmount;
  const bob = Math.abs(Math.sin(rig.animationTime)) * 0.1 * rig.moveAmount;

  if (rig.kind === "creature") {
    rig.body.position.y = 3.18 + bob;
    rig.body.rotation.x = Math.PI * 0.42 + stride * 0.035;
    rig.headGroup.position.y = 3.72 + bob * 0.55;
    rig.headGroup.rotation.x = -0.2 - Math.abs(stride) * 0.06;
    rig.leftLeg.rotation.set(stride * 0.65, 0, 0.04);
    rig.rightLeg.rotation.set(-stride * 0.65, 0, -0.04);
    rig.leftArm.rotation.set(-stride * 0.72 - 0.18, 0, 0.22);
    rig.rightArm.rotation.set(stride * 0.72 - 0.18, 0, -0.22);
    setLegJointPose(rig.leftLeg, Math.max(0, -stride) * 0.55 + 0.16, -0.08);
    setLegJointPose(rig.rightLeg, Math.max(0, stride) * 0.55 + 0.16, -0.08);
    setArmJointPose(rig.leftArm, 0.26 + Math.max(0, stride) * 0.35, -0.06, 0);
    setArmJointPose(rig.rightArm, 0.26 + Math.max(0, -stride) * 0.35, -0.06, 0);
    return;
  }

  rig.body.position.y = 3.15 + bob;
  rig.headGroup.position.y = 5.15 + bob * 0.65;
  rig.leftLeg.rotation.set(stride * 0.72, 0, 0.04);
  rig.rightLeg.rotation.set(-stride * 0.72, 0, -0.04);
  rig.leftArm.rotation.set(-stride * 0.48, 0, 0.16);
  rig.rightArm.rotation.set(stride * 0.48, 0, -0.16);
  setLegJointPose(rig.leftLeg, (0.12 + Math.max(0, -stride) * 0.58) * rig.moveAmount, -0.08 * rig.moveAmount);
  setLegJointPose(rig.rightLeg, (0.12 + Math.max(0, stride) * 0.58) * rig.moveAmount, -0.08 * rig.moveAmount);
  setArmJointPose(rig.leftArm, 0.12 + Math.abs(stride) * 0.3, -0.03, 0);
  setArmJointPose(rig.rightArm, 0.12 + Math.abs(stride) * 0.3, -0.03, 0);
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
  return Boolean(itemType && !isProjectileWeapon(itemType));
}

function canPveEnemyHitPlayer(enemy, targetPosition) {
  if (state.player.dead || world.outpostTower.active) {
    return false;
  }

  const distance = Math.hypot(
    targetPosition.x - enemy.mesh.position.x,
    targetPosition.z - enemy.mesh.position.z
  );
  const direction = enemy.attackAnimation?.direction;
  const dot = direction && distance > .01
    ? ((targetPosition.x - enemy.mesh.position.x) * direction.x +
      (targetPosition.z - enemy.mesh.position.z) * direction.z) / distance : 1;
  return distance <= getPveEnemyAttackRange(enemy) + 0.65 && dot >= Math.cos(.95);
}

function updatePveEnemies(deltaSeconds) {
  if (!GAME_FLAGS.pve) {
    document.body.dataset.pveEnemiesAlive = "0";
    return;
  }

  if (world.sceneMode !== "poiInterior" || getActivePoiInterior()?.type !== "Dungeon") {
    return;
  }

  ensureDungeonPveEnemyRoster();

  const player = state.player.position;

  for (const enemy of world.pveEnemies) {
    clearRecoilPose(enemy);
    if (enemy.dead) {
      enemy.deathTimer += deltaSeconds;
      enemy.mesh.scale.lerp(new THREE.Vector3(1, 0.08, 1), Math.min(1, deltaSeconds * 5));
      if (enemy.deathTimer > 0.65) {
        enemy.mesh.visible = false;
      }
      continue;
    }

    enemy.mesh.scale.lerp(new THREE.Vector3(1, 1, 1), Math.min(1, deltaSeconds * 6));
    enemy.shoveStaggerTimer = Math.max(0, (enemy.shoveStaggerTimer ?? 0) - deltaSeconds);
    const toPlayer = new THREE.Vector3(player.x - enemy.mesh.position.x, 0, player.z - enemy.mesh.position.z);
    const distance = toPlayer.length();

    if (distance > 0.05 && !enemy.attackAnimation) {
      enemy.mesh.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);
    }

    enemy.attackTimer = Math.max(0, enemy.attackTimer - deltaSeconds);
    if (isDungeonEntranceSafe(player)) {
      resetPveEnemyAttackState(enemy);
      enemy.spells?.clear();
      const home = new THREE.Vector3(enemy.spawn.x - enemy.mesh.position.x, 0, enemy.spawn.z - enemy.mesh.position.z);
      const step = Math.min(home.length(), enemy.speed * deltaSeconds);
      home.normalize();
      movePveEntityTo(enemy, { x: enemy.mesh.position.x + home.x * step, z: enemy.mesh.position.z + home.z * step }, { outdoor: false });
      updatePveMobAnimation(enemy, deltaSeconds, step > 0.01, false);
      continue;
    }
    if (enemy.bossElement) {
      updateDungeonSorcerer(enemy, deltaSeconds, player, distance);
      updateCombatHitReaction(enemy, deltaSeconds);
      continue;
    }
    const attackActive = updatePveEnemyAttack(enemy, deltaSeconds, player, { outdoor: false });
    let moving = false;

    const chaseRange = world.dungeon.status === "collapsing" ? 86 : 64;
    const attackRange = getPveEnemyAttackRange(enemy);
    if (!attackActive && enemy.shoveStaggerTimer <= 0 && distance > attackRange && distance < chaseRange) {
      toPlayer.normalize();
      movePveEntityTo(enemy, {
        x: enemy.mesh.position.x + toPlayer.x * enemy.speed * deltaSeconds,
        z: enemy.mesh.position.z + toPlayer.z * enemy.speed * deltaSeconds
      }, { outdoor: false });
      moving = true;
    }

    applyPveEntityKnockbackMotion(enemy, deltaSeconds, { outdoor: false });
    updatePveMobAnimation(enemy, deltaSeconds, moving, attackActive);
    updateCombatHitReaction(enemy, deltaSeconds);

    if (!attackActive && enemy.shoveStaggerTimer <= 0 && distance <= attackRange && enemy.attackTimer <= 0) {
      startPveEnemyAttack(enemy, player);
    }
  }

  resolvePveMobCollisions(world.pveEnemies, { outdoor: false });
  resolvePveMobPlayerCollisions(world.pveEnemies, { outdoor: false });
  const aliveEnemies = world.pveEnemies.filter((enemy) => !enemy.dead);
  document.body.dataset.pveEnemiesAlive = String(aliveEnemies.length);
  document.body.dataset.pveCreatureCount = String(aliveEnemies.filter((enemy) => enemy.mobClass === "creature").length);
  document.body.dataset.pveRaiderCount = String(aliveEnemies.filter((enemy) => enemy.mobClass === "raider").length);
}

function updateDungeonSorcerer(enemy, dt, player, distance) {
  const room = world.dungeon.layout.endRoom;
  const engaged = !state.player.dead && Math.abs(player.x - room.x) < room.width / 2 + 3 && Math.abs(player.z - room.z) < room.depth / 2 + 3;
  const target = { ...player, y: world.playerMotion.verticalOffset };
  enemy.spells.root = world.dungeon.contentRoot;
  enemy.spells.ensureArena();
  if (stepSorcererCombat(enemy, dt, engaged, distance)) {
    enemy.spells.cast(enemy.mesh.position, player, enemy.castTurn++);
  }
  stepSorcererMelee(enemy, target, dt, engaged, damage => damageLocalPlayerTarget(
    { mesh: world.playerMesh }, damage, 'Staff', { itemType: 'Staff', sourceName: enemy.name, previousPosition: enemy.mesh.position, knockback: 2 }));
  const moving = stepSorcererMovement(enemy, player, room, dt, engaged);
  animateSorcerer(enemy.sorcererVisual, dt, moving, enemy.castPause > 0);
  poseSorcererStaff(enemy.sorcererVisual, enemy.staffAttack);
  if (enemy.staffAttack) enemy.mesh.rotation.y = enemy.staffAttack.direction;
  if (!engaged) { enemy.spells.clear(); return; }
  revealHealthBarSprite(enemy.healthBar, { persistent: true });
  enemy.spells.update(dt, target, (damage, spell) => damageLocalPlayerTarget(
    { mesh: world.playerMesh }, damage, 'elemental magic', { sourceName: enemy.name, status: spell.status,
      previousPosition: enemy.bossElement === 'air' ? spell.origin : { x: spell.x, z: spell.z }, knockback: enemy.bossElement === 'air' ? 22 : 3 }),
    (damage, position) => damageLocalPlayerTarget({ mesh: world.playerMesh }, damage, 'arena spikes', { sourceName: 'arena spikes', previousPosition: position }),
    spell => {
      for (const barrel of getActiveDungeonBarrels()) {
        if (barrel.burning || Math.hypot(barrel.mesh.position.x-spell.x,barrel.mesh.position.z-spell.z)>spell.radius+barrel.radius) continue;
        barrel.burning = createElementalEffect('fire',{radius:1.6,delay:0});
        barrel.burning.userData.effect.warning.visible=false; barrel.mesh.add(barrel.burning);
      }
    });
  applyPveEntityKnockbackMotion(enemy, dt, { outdoor: false });
  enemy.mesh.position.x = clamp(enemy.mesh.position.x, room.x - room.width / 2 + 3, room.x + room.width / 2 - 3);
  enemy.mesh.position.z = clamp(enemy.mesh.position.z, room.z - room.depth / 2 + 3, room.z + room.depth / 2 - 3);
}

function getRaidEntrancePosition(target) {
  return target.type === "Castle" ? castleEntrance(target) : getPoiEntrancePosition(target);
}

function getRaidWaypoint(monster, destination, dt) {
  const planner = world.raidRoutePlanner ??= createRoutePlanner();
  monster.routeTimer = (monster.routeTimer ?? 0) - dt;
  if (monster.routeGoal !== monster.raidTargetId) {
    planner.cancel(monster);
    monster.route = [];
    monster.routeGoal = monster.raidTargetId;
    monster.routeTimer = 0;
  }
  const position = monster.mesh.position;
  const travelled = Math.hypot(position.x - (monster.routeLastX ?? position.x), position.z - (monster.routeLastZ ?? position.z));
  monster.routeStall = travelled > 0.01 ? 0 : (monster.routeStall ?? 0) + dt;
  monster.routeLastX = position.x;
  monster.routeLastZ = position.z;
  while (monster.route?.length && distance2D(position, monster.route[0]) < 2) monster.route.shift();
  if (distance2D(position, destination) < 11) {
    planner.cancel(monster);
    return destination;
  }
  if (monster.routeTimer <= 0 && (!monster.route?.length || monster.routeStall > 2) && !planner.has(monster)) {
    // Hold position while replanning, so a finished search never sends a moving
    // raider backwards to the start captured several frames earlier.
    monster.route = [];
    monster.routeTimer = 12 + Math.random() * 3;
    planner.request(monster, monster.mesh.position, destination, position => {
      if (getInlandLakeDistance(position.x, position.z) < 1.08) return false;
      return distance2D(resolveOutdoorSceneryCollision(position, monster.radius ?? 1.1), position) < 0.1;
    }, { step: 12, arrival: 10, limit: 22000 }, route => {
      monster.route = route.slice(1);
      monster.routeStall = 0;
      monster.routeTimer = 12 + Math.random() * 3;
    });
  }
  return monster.route?.[0] ?? (distance2D(monster.mesh.position, destination) < 11 ? destination : monster.mesh.position);
}

function updateOutdoorDungeonMonsters(frameDeltaSeconds) {
  let deltaSeconds = frameDeltaSeconds;
  if (!GAME_FLAGS.pve || !state.player.firstName) return;
  const updatedMobs = new Set();
  const night = getNightAmount(state.elapsed) > 0.62;
  const cap = night ? NIGHT_CAMP_CAP : 3;
  const sources = raidSpawnSources(MOB_CAMPS, CASTLES, state.factions, night);
  const targets = raidTargets(state.pois, CASTLES, state.factions);
  const targetOwners = targets.map(target => `${target.id}:${target.ownerFactionId}`).join('|');
  if (!world.campsInitialized || (night && !world.wasRaidNight)) {
    world.raidPopulationPending = true;
    world.campsInitialized = true;
    if (night && targets.length) flash("Night falls. Raiders are marching on claimed POIs and castles!");
  }
  if (world.raidPopulationPending) {
    let spawnBudget = 2;
    world.raidPopulationPending = false;
    for (const camp of sources) {
      const count = world.outdoorMonsters.filter(mob => !mob.dead && mob.campId === camp.id).length;
      for (let i = count; i < (night ? cap : 2); i++) {
        if (spawnBudget <= 0) { world.raidPopulationPending = true; break; }
        spawnOutdoorDungeonMonster(camp);
        spawnBudget--;
      }
    }
  }
  if (!night) world.raidRoutePlanner?.clear();
  world.wasRaidNight = night;
  world.outdoorMonsterSpawnTimer -= deltaSeconds;
  if (world.outdoorMonsterSpawnTimer <= 0) {
    spawnOutdoorDungeonMonster();
    world.outdoorMonsterSpawnTimer = night ? 3.25 : OUTDOOR_DUNGEON_MONSTER_SPAWN_INTERVAL + Math.random() * 2.5;
  }
  for (const monster of world.outdoorMonsters) {
    // Scene changes and nearby combat wake immediately. Distant noncombat AI
    // runs at 2–10 Hz; retain all elapsed time for movement and raid capture.
    deltaSeconds = frameDeltaSeconds;
    if (monster.dead) {
      clearRecoilPose(monster);
      world.raidRoutePlanner?.cancel(monster);
      monster.deathTimer += deltaSeconds;
      monster.mesh.scale.lerp(new THREE.Vector3(1, 0.08, 1), Math.min(1, deltaSeconds * 5));
      if (monster.deathTimer > 0.75) { removeFromParent(monster.mesh); monster.removed = true; }
      continue;
    }
    if (monster.sourceCastleId && (!night || state.factions?.[monster.sourceCastleId])) {
      world.raidRoutePlanner?.cancel(monster);
      removeFromParent(monster.mesh);
      monster.removed = true;
      continue;
    }
    const inPlayerScene = !monster.raidInteriorId ? world.sceneMode === "outdoor"
      : monster.raidInteriorType === "Castle"
        ? world.sceneMode === "interior" && world.interiorFactionId === monster.raidInteriorId
        : world.sceneMode === "poiInterior" && world.activePoiInteriorId === monster.raidInteriorId;
    const playerDistance = inPlayerScene ? distance2D(state.player.position, monster.mesh.position) : Infinity;
    const nearby = playerDistance < 250;
    const sceneKey = `${world.sceneMode}:${world.interiorFactionId}:${world.activePoiInteriorId}`;
    const immediate = nearby || monster.aggro || monster.tentExit || monster.attackAnimation
      || monster.shoveStaggerTimer > 0 || monster.knockbackVelocity?.lengthSq() > .0025
      || monster.simulationScene !== sceneKey || monster.simulationNight !== night
      || monster.simulationTargets !== targetOwners;
    monster.simulationScene = sceneKey;
    monster.simulationNight = night;
    monster.simulationTargets = targetOwners;
    deltaSeconds = takeMobUpdate(monster, frameDeltaSeconds, immediate,
      distantMobInterval(playerDistance, inPlayerScene), (monster.mesh.id * .61803398875) % 1);
    if (!deltaSeconds) continue;
    clearRecoilPose(monster);
    updatedMobs.add(monster);
    if (monster.tentExit) {
      monster.shoveStaggerTimer = Math.max(0, (monster.shoveStaggerTimer ?? 0) - deltaSeconds);
      const step = stepTentExit(monster.mesh.position, monster.tentExit,
        monster.shoveStaggerTimer > 0 ? 0 : monster.speed * .65, deltaSeconds);
      if (step.moving) {
        monster.mesh.rotation.y = step.facing;
        movePveEntityTo(monster, step, { outdoor: true });
      }
      applyPveEntityKnockbackMotion(monster, deltaSeconds, { outdoor: true });
      updatePveMobAnimation(monster, deltaSeconds, step.moving, false);
      updateCombatHitReaction(monster, deltaSeconds);
      if (distance2D(monster.mesh.position, monster.tentExit) <= .15) {
        monster.spawn = { x: monster.tentExit.x, z: monster.tentExit.z };
        monster.tentExit = null;
      }
      continue;
    }
    let poi = targets.find(target => target.id === monster.raidTargetId);
    if (!night || !poi?.ownerFactionId) {
      if (monster.raidInteriorId) {
        const entrance = getRaidEntrancePosition(state.pois.find(poi => poi.id === monster.raidInteriorId) ?? { ...CASTLES.find(castle => castle.id === monster.raidInteriorId), type: "Castle" });
        world.outdoorRoot.add(monster.mesh);
        monster.mesh.position.set(entrance.x, getTerrainHeightAt(entrance.x, entrance.z), entrance.z);
        monster.raidInteriorId = null;
        monster.raidInteriorType = null;
        monster.mesh.visible = true;
      }
      const origin = poi ? monster.mesh.position : sources.find(camp => camp.id === monster.campId)?.position ?? monster.spawn;
      poi = night ? nearestRaidTarget(targets, origin, monster.sourceCastleId) : null;
      monster.raidTargetId = poi?.id ?? null;
      monster.captureProgress = 0;
    }
    const outdoor = !monster.raidInteriorId;
    const sameScene = outdoor ? world.sceneMode === "outdoor"
      : monster.raidInteriorType === "Castle"
        ? world.sceneMode === "interior" && world.interiorFactionId === monster.raidInteriorId
        : world.sceneMode === "poiInterior" && world.activePoiInteriorId === monster.raidInteriorId;
    monster.mesh.visible = outdoor || monster.raidInteriorType !== "Castle" || sameScene;
    const player = state.player.position;
    const distance = sameScene ? distance2D(player, monster.mesh.position) : Infinity;
    const vulnerable = sameScene && !state.player.dead && (!outdoor || (Math.hypot(player.x, player.z) > 145
      && (night || !FACTIONS.some(faction => distance2D(player, faction.position) < faction.safeRadius + 15))));
    monster.aggro = vulnerable && (night
      ? distance < (poi ? 24 : OUTDOOR_DUNGEON_MONSTER_TRACK_RANGE) || monster.aggro
      : distance2D(player, monster.spawn) < 135 && (monster.aggro || distance < OUTDOOR_DUNGEON_MONSTER_TRACK_RANGE));
    if (monster.aggro || !outdoor || !poi) {
      world.raidRoutePlanner?.cancel(monster);
      monster.route = [];
      monster.routeTimer = 0;
      monster.routeGoal = null;
    }
    monster.shoveStaggerTimer = Math.max(0, (monster.shoveStaggerTimer ?? 0) - deltaSeconds);
    monster.attackTimer = Math.max(0, monster.attackTimer - deltaSeconds);
    if (!monster.aggro) resetPveEnemyAttackState(monster);
    const attackActive = monster.aggro && updatePveEnemyAttack(monster, deltaSeconds, player, { outdoor });
    let destination;
    if (monster.aggro) destination = player;
    else if (poi) destination = outdoor ? getRaidWaypoint(monster, getRaidEntrancePosition(poi), deltaSeconds) : poi.type === "Castle" ? { x: 0, z: -14 } : POI_FLAG_POSITION;
    else {
      monster.roamAngle += deltaSeconds * 0.28;
      destination = { x: monster.spawn.x + Math.cos(monster.roamAngle) * 16, z: monster.spawn.z + Math.sin(monster.roamAngle) * 16 };
    }
    const direction = new THREE.Vector3(destination.x - monster.mesh.position.x, 0, destination.z - monster.mesh.position.z);
    const remaining = direction.length();
    direction.normalize();
    let moving = false;
    const attackRange = getPveEnemyAttackRange(monster);
    if (!attackActive && monster.shoveStaggerTimer <= 0 && remaining > (monster.aggro ? attackRange : 0.8)) {
      monster.mesh.rotation.y = Math.atan2(direction.x, direction.z);
      const step = Math.min(remaining, monster.speed * deltaSeconds);
      moveMobInSteps(monster, { x: monster.mesh.position.x + direction.x * step, z: monster.mesh.position.z + direction.z * step }, movePveEntityTo, { outdoor }, deltaSeconds);
      moving = true;
    }
    applyPveEntityKnockbackMotion(monster, deltaSeconds, { outdoor });
    // Simulation and capture still tick everywhere; only distant visual poses
    // run less often. Nearby combat retains full-rate animation and hit timing.
    monster.animationElapsed = sameScene ? (monster.animationElapsed ?? 0) + deltaSeconds : 0;
    if (sameScene && (distance < 250 || attackActive || (monster.visualActive && monster.animationElapsed >= 0.1))) {
      updatePveMobAnimation(monster, monster.animationElapsed, moving, attackActive);
      monster.animationElapsed = 0;
    }
    if (!monster.visualActive && distance >= 250 && !attackActive) monster.animationElapsed = 0;
    updateCombatHitReaction(monster, deltaSeconds);
    if (!attackActive && monster.shoveStaggerTimer <= 0 && monster.aggro && distance <= attackRange && monster.attackTimer <= 0) startPveEnemyAttack(monster, player);
    if (poi && outdoor && !monster.aggro && distance2D(monster.mesh.position, getRaidEntrancePosition(poi)) < 4) {
      monster.raidInteriorId = poi.id;
      monster.raidInteriorType = poi.type;
      (poi.type === "Castle" ? world.interiorRoot : world.meshes.poiInteriors.get(poi.id)).add(monster.mesh);
      monster.mesh.visible = poi.type !== "Castle" || (world.sceneMode === "interior" && world.interiorFactionId === poi.id);
      monster.mesh.position.set(0, 0, poi.type === "Castle" ? CASTLE_INTERIOR.spawnZ : 17);
      resetPveEnemyAttackState(monster);
      flash(`${poi.name} has been breached! Defend ${poi.type === "Castle" ? "the keep" : "its flag"}!`);
    }
    const holding = poi?.type !== "Castle" && night && monster.raidInteriorId && !monster.aggro && monster.shoveStaggerTimer <= 0
      && distance2D(monster.mesh.position, POI_FLAG_POSITION) < 3;
    if (advanceRaidCapture(monster, poi, deltaSeconds, holding) && reclaimPoiForWilderness(state, poi)) {
      markPersistenceDirty();
      refreshUi();
      flash(`${poi.name} has fallen to the wilderness!`);
    }
  }
  const byInterior = new Map(), outside = [];
  for (const mob of world.outdoorMonsters) {
    if (!mob.raidInteriorId) outside.push(mob);
    else {
      if (!byInterior.has(mob.raidInteriorId)) byInterior.set(mob.raidInteriorId, []);
      byInterior.get(mob.raidInteriorId).push(mob);
    }
  }
  resolvePveMobCollisions(outside, { outdoor: true, updatedMobs });
  if (world.sceneMode === "outdoor") resolvePveMobPlayerCollisions(outside, { outdoor: true });
  for (const poi of [...state.pois, ...CASTLES.map(castle => ({ ...castle, type: "Castle" }))]) {
    const inside = byInterior.get(poi.id);
    if (!inside?.length) continue;
    resolvePveMobCollisions(inside, { outdoor: false, updatedMobs });
    if ((poi.type === "Castle" ? world.sceneMode === "interior" && world.interiorFactionId === poi.id : world.sceneMode === "poiInterior" && world.activePoiInteriorId === poi.id)) resolvePveMobPlayerCollisions(inside, { outdoor: false });
  }
  world.outdoorMonsters = world.outdoorMonsters.filter(monster => !monster.removed);
  const aliveMonsters = world.outdoorMonsters.filter(monster => !monster.dead);
  document.body.dataset.outdoorMonstersAlive = String(aliveMonsters.length);
  document.body.dataset.outdoorCreatureCount = String(aliveMonsters.filter(monster => monster.mobClass === "creature").length);
  document.body.dataset.outdoorRaiderCount = String(aliveMonsters.filter(monster => monster.mobClass === "raider").length);
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

// Takeoff and recovery remain vulnerable; only the tucked tumble evades hits.
function isPlayerDodging(motion = world.playerMotion) {
  return Boolean(motion.rolling && motion.rollElapsed >= 0.09 && motion.rollElapsed < 0.48);
}

function applyRollPose(progress) {
  const rig = world.playerRig;
  if (!rig) return;
  const t = clamp(progress, 0, 1);
  const smooth = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  // Reach into a long, nearly horizontal dive, then whip through a compact tumble.
  const reach = smooth(t / 0.16) * (1 - smooth((t - 0.3) / 0.18));
  const tuck = smooth((t - 0.29) / 0.19) * (1 - smooth((t - 0.72) / 0.28));
  const angle = t < 0.3 ? 1.28 * smooth(t / 0.22)
    : t < 0.76 ? THREE.MathUtils.lerp(1.28, 5.65, smooth((t - 0.3) / 0.46))
    : THREE.MathUtils.lerp(5.65, Math.PI * 2, smooth((t - 0.76) / 0.24));
  const direction = world.playerMotion.rollDirection;
  world.playerMesh.rotation.y = Math.atan2(direction.x, direction.z);
  resetPlayerRootLean();
  // Rotate about the hips rather than the feet to keep the tucked body above ground.
  const pivot = 2.6;
  rig.visualRoot.rotation.x = angle;
  rig.visualRoot.rotation.z = -0.14 * tuck;
  rig.visualRoot.position.set(0, pivot * (1 - Math.cos(angle)) - 0.7 * tuck + 0.35 * reach, -pivot * Math.sin(angle) + 0.65 * reach);
  rig.body.position.y = 3.15 - 0.35 * tuck;
  rig.body.rotation.set(0.25 * tuck, 0, 0);
  rig.chest.position.y = 3.65 - 0.45 * tuck;
  rig.chest.rotation.set(0.35 * tuck, 0, 0);
  rig.headGroup.position.set(0, 5.2 - 0.95 * tuck, 0.16 + 0.35 * tuck);
  rig.headGroup.rotation.set(0.6 * tuck - 0.25 * reach, 0, 0);
  for (const hand of ['left', 'right']) {
    const side = HAND_CONFIG[hand].side;
    const leg = rig[hand + 'Leg'];
    const arm = rig[hand + 'Arm'];
    leg.position.set(side * 0.42, 2.05 + 0.25 * tuck, 0.15 * tuck);
    leg.rotation.set(-1.65 * tuck + (hand === 'left' ? 0.22 : 0.4) * reach, 0, side * 0.08 * tuck);
    setLegJointPose(leg, 2.15 * tuck + 0.12 * reach, -0.35 * tuck - 0.28 * reach);
    arm.position.set(side * (0.92 - 0.25 * tuck), 4.35 - 0.45 * tuck, 0.02 + 0.3 * tuck);
    arm.rotation.set(-2.65 * reach - 0.65 * tuck, 0, side * (0.16 + 0.12 * tuck));
    setArmJointPose(arm, 0.12 + 1.65 * tuck, -0.15 * tuck, 0);
  }
  // Preserve the actual takeoff pose for the handoff, including an interrupted stride.
  const blend = 1 - smooth(t / 0.15);
  if (blend > 0) for (const { node, position, rotation } of world.playerMotion.rollBlendFrom ?? []) {
    node.position.lerp(position, blend);
    node.quaternion.slerp(rotation, blend);
  }
}

function setArmWalkPose(hand, swing) {
  const arm = hand === "left" ? world.playerRig.leftArm : world.playerRig.rightArm;
  const side = HAND_CONFIG[hand].side;

  arm.position.set(side * 0.92, 4.35, 0.02);
  arm.rotation.set(swing, 0, side * 0.16);
  setArmJointPose(arm, 0.12 + Math.abs(swing) * 0.36, -0.03, 0);
  const leg = hand === "left" ? world.playerRig.leftLeg : world.playerRig.rightLeg;
  leg.position.set(side * 0.42, 2.05, 0);
}

function updateShieldGuard(deltaSeconds) {
  const guard = world.guard;
  const wantsGuard = ['left', 'right'].some(hand =>
    (world.pointer.buttons & (hand === 'left' ? 1 : 2)) && isShield(getEquippedItem(state, hand)?.type)
    && getEquippedItem(state, hand).durability > 0);
  if (wantsGuard && state.elapsed >= guard.brokenUntil && Object.values(world.attacks).some(Boolean)
      && Object.values(world.attacks).every(canCancelIntoDefense)) {
    world.attacks = { left: null, right: null };
    world.comboChains = { left: null, right: null };
    world.weaveQueue = null;
    world.weaponTrails?.clear();
  }
  const available = !isPlayerRolling() && !world.flailCharge && !state.player.dead && !isCameraMenuOpen() && !world.outpostTower.active &&
    !world.attacks.left && !world.attacks.right && state.elapsed >= guard.brokenUntil;
  const hand = available ? ['left','right'].find(h =>
    (world.pointer.buttons & (h === 'left' ? 1 : 2)) &&
    isShield(getEquippedItem(state, h)?.type) && getEquippedItem(state, h).durability > 0) : null;
  if (hand && hand !== guard.hand) guard.raisedAt = state.elapsed;
  guard.hand = hand ?? null;
  if (!hand && state.elapsed >= guard.brokenUntil) guard.stamina = Math.min(100, guard.stamina + deltaSeconds * 24);
  let meter = document.querySelector('#combat-guard');
  if (!meter) {
    meter = document.createElement('div'); meter.id = 'combat-guard';
    meter.setAttribute('role', 'status'); meter.setAttribute('aria-live', 'polite');
    document.body.append(meter);
  }
  const equipped = ['left','right'].some(h => isShield(getEquippedItem(state,h)?.type));
  meter.hidden = !equipped;
  const label = state.elapsed < guard.brokenUntil ? 'Guard broken' : hand ? 'Blocking' : 'Hold shield button to defend';
  const text = `${label} · Guard ${Math.ceil(guard.stamina)}`;
  if (meter.textContent !== text) meter.textContent = text;
  meter.style.setProperty('--guard', `${guard.stamina}%`);
}

function applyShieldPose(hand) {
  const held = world.heldItems[hand].mesh;
  if (!held) return;
  const side = HAND_CONFIG[hand].side;
  // Idle facing owns guard yaw and applies the normal turn-rate limit.
  poseAttackArm(hand, -1.04, -side * .38, side * .16, .85, 0, 0);
  world.playerMesh.updateWorldMatrix(true, false);
  // Shield face is local X; align it with the character's forward direction.
  const forward = world.aimDirection.clone().setY(0).normalize().multiplyScalar(side);
  const rotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1,0,0), forward);
  held.quaternion.copy(held.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(rotation));
  held.position.set(0,0,0);
  world.playerRig.chest.rotation.x -= .08;
}

function blockLocalDamage(amount, sourcePosition, knockback = 0) {
  const guard = world.guard;
  const item = guard.hand ? getEquippedItem(state, guard.hand) : null;
  const result = resolveShieldBlock({ type: item?.type, raised: Boolean(guard.hand), stamina: guard.stamina,
    age: state.elapsed - guard.raisedAt, facing: { x: Math.sin(world.playerMesh.rotation.y), z: Math.cos(world.playerMesh.rotation.y) },
    position: state.player.position, source: sourcePosition, damage: amount, knockback });
  if (result.blocked) {
    combatAudio.impact(result.parried ? .85 : .55, true);
    guard.stamina = result.stamina;
    if (result.broken) { guard.brokenUntil = state.elapsed + 1.4; guard.hand = null; }
    const wear = damageInventoryItem(state, item, result.parried ? 1 : Math.max(1, Math.round(amount / 12)));
    if (wear.broken) guard.hand = null;
    markPlayerPersistenceDue();
    flash(result.broken ? 'Guard broken!' : result.parried ? 'Perfect block!' : 'Blocked');
    world.combatFeedback.cameraImpulse = Math.max(world.combatFeedback.cameraImpulse ?? 0, .014);
  }
  return result;
}

function updateAttackAnimations(deltaSeconds) {
  updateJumpSmashEffects(deltaSeconds);
  if (state.player.dead || isCameraMenuOpen() || isPlayerRolling()) {
    world.attacks = { left: null, right: null };
    world.comboChains = { left: null, right: null };
    world.weaveQueue = null;
    world.flailCharge = null;
    world.weaponTrails?.clear();
  }
  if (world.flailCharge && getEquippedItem(state,world.flailCharge.hand)?.id !== world.flailCharge.itemId) world.flailCharge = null;
  updateShieldGuard(deltaSeconds);
  let chargeMeter = document.querySelector('#combat-charge');
  if (world.flailCharge && !chargeMeter) {
    chargeMeter=document.createElement('div');chargeMeter.id='combat-charge';document.body.append(chargeMeter);
  }
  if (chargeMeter) {
    chargeMeter.hidden=!world.flailCharge;
    if (world.flailCharge) chargeMeter.textContent='Flail '+Math.round(flailChargePower(world.flailCharge.elapsed)*100)+'% · Release to strike';
  }
  // Expire before posing so a stale combo cannot hold the recovery animation.
  for (const chain of Object.values(world.comboChains)) {
    if (chain?.queued && state.elapsed > chain.inputExpiresAt) chain.queued = false;
  }
  animateHandAttack("left", world.leftHandMount, deltaSeconds);
  animateHandAttack("right", world.rightHandMount, deltaSeconds);
  const queued = world.weaveQueue;
  if (queued) {
    if (state.player.dead || isCameraMenuOpen() || state.elapsed > queued.expiresAt || getEquippedItem(state, queued.hand)?.id !== queued.itemId) world.weaveQueue = null;
    else if (state.elapsed >= (queued.readyAt ?? 0) && canWeaveAttack(world.attacks[queued.hand === 'left' ? 'right' : 'left'])) {
      const outgoing = world.attacks[queued.hand === 'left' ? 'right' : 'left'];
      world.weaveQueue = null;
      if (tryAttackFromPointer(queued.hand, queued.chargePower ?? 0, queued.expiresAt, queued.inputAim) && world.attacks[queued.hand]?.elapsed === 0) {
        if (outgoing?.frameBase) restoreCombatTransforms(outgoing.frameBase);
        animateHandAttack(queued.hand, queued.hand === 'left' ? world.leftHandMount : world.rightHandMount, 0);
      }
    }
  }
  for (const hand of ["left", "right"]) {
    const chain = world.comboChains[hand];
    if (!chain) continue;
    const item = getEquippedItem(state, hand);
    if (state.player.dead || chain.itemId !== item?.id || isCameraMenuOpen()) {
      world.comboChains[hand] = null;
      continue;
    }
    if (!chain.queued || state.elapsed < chain.readyAt) continue;
    const active = world.attacks[hand];
    if (active && (!active.hitResolved || active.elapsed < active.duration * (active.comboChainPoint ?? 1))) continue;
    chain.queued = false;
    if (tryAttackFromPointer(hand, chain.chargePower ?? 0, chain.inputExpiresAt, chain.inputAim)) {
      // Evaluate the new pose now, avoiding an idle frame between linked strokes.
      if (active?.frameBase) restoreCombatTransforms(active.frameBase);
      animateHandAttack(hand, hand === "left" ? world.leftHandMount : world.rightHandMount, 0);
    }
  }
}

function captureComboPose(hand) {
  const arm = hand === "left" ? world.playerRig.leftArm : world.playerRig.rightArm;
  return {
    transforms: captureCombatTransforms().filter(entry => entry.node !== world.playerMesh && entry.node !== world.playerVisualRoot),
    weapon: world.heldItems[hand].mesh?.quaternion.clone(),
    arm: arm.quaternion.clone(),
    forearm: arm.userData.forearm.quaternion.clone(),
    wrist: arm.userData.hand.quaternion.clone()
  };
}

function blendComboPose(hand, attack, progress) {
  const from = attack.comboBlendFrom;
  if (!from) return;
  const weight = 1 - easeInOut(progress / Math.max(.01, attack.profile.windup));
  if (weight <= 0) return;
  if (from.transforms) {
    for (const {node,position,rotation} of from.transforms) {
      node.position.lerp(position,weight);node.quaternion.slerp(rotation,weight);
    }
    return;
  }
  const arm = hand === "left" ? world.playerRig.leftArm : world.playerRig.rightArm;
  const held = world.heldItems[hand].mesh;
  if (held && from.weapon) held.quaternion.slerp(from.weapon, weight);
  arm.quaternion.slerp(from.arm, weight);
  arm.userData.forearm.quaternion.slerp(from.forearm, weight);
  arm.userData.hand.quaternion.slerp(from.wrist, weight);
}

function animateHandAttack(hand, mount, deltaSeconds) {
  const attack = world.attacks[hand];
  const base = getHandBasePose(hand);
  const side = HAND_CONFIG[hand].side;

  mount.position.copy(base.position);
  mount.rotation.copy(base.rotation);
  resetHeldItemPose(hand);

  updateHeldRangedModelState(mount, getEquippedItem(state, hand)?.type, 0, true);

  if (!attack) {
    if (world.guard.hand === hand) { applyShieldPose(hand); return; }
    if (getEquippedItem(state,hand)?.type === 'Flail') {
      if (world.flailCharge?.hand === hand) {
        const charge=world.flailCharge,previous=charge.elapsed;
        charge.elapsed += deltaSeconds;
        charge.angle = flailSpinAngle(charge.elapsed,side);
        applyFlailPose(hand, {chargePower:flailChargePower(charge.elapsed)}, 0, true);
        simulateFlailModel(world.heldItems[hand].mesh,deltaSeconds,{fromAngle:flailSpinAngle(previous,side),toAngle:charge.angle,tilt:.7,side,yaw:world.playerMesh.rotation.y,tension:Math.min(1,charge.elapsed/.55)});
        document.body.dataset.flailCharge = String(Math.round(flailChargePower(charge.elapsed)*100));
      } else simulateFlailModel(world.heldItems[hand].mesh,deltaSeconds);
    }
    updateFlailModel(world.heldItems[hand].mesh);
    animateRangedDraw(hand, mount, side);
    return;
  }

  attack.elapsed += deltaSeconds * (world.combatFeedback.hitstop > 0 ? 0.15 : 1);
  if (world.comboChains[hand]?.queued && attack.comboChainPoint < 1) {
    attack.elapsed = Math.min(attack.elapsed, attack.duration * attack.comboChainPoint);
  }
  if (attack.jumpAttack === 'smash') {
    const motion = world.playerMotion;
    if (motion.verticalOffset - motion.supportOffset > .15) attack.elapsed = Math.min(attack.elapsed, attack.duration * .55);
  }
  const progress = Math.min(1, attack.elapsed / attack.duration);
  const profile = attack.profile ?? getCombatProfile(attack.itemType);
  attack.frameBase = captureCombatTransforms();
  if (attack.jumpAttack) {
    applyJumpAttackPose(hand, attack, progress, deltaSeconds);
  } else if (attack.itemType === "Flail") {
    applyFlailPose(hand,attack,progress);
  } else if (attack.itemType === "Spear" || (attack.itemType === 'Staff' && attack.kind === 'thrust')) {
    applyCursorDirectedSpearAttack(hand, attack, progress);
  } else if (attack.kind === "thrust") {
    applyCursorDirectedDaggerStab(hand, attack, progress);
  } else if (profile.kind === "slash" || profile.kind === "chop") {
    applyFocusedMeleePose(hand, attack, progress);
  } else if (profile.family === "bow" || profile.family === "crossbow") {
    const release = getCombatReleaseMoment(attack.itemType, attack.chargePower ?? 0);
    const power = (attack.chargePower ?? 0) > .08 ? .28 + attack.chargePower * .72 : .52;
    const draw = progress < release ? power * (attack.chargePower > .08 ? 1 : easeOut(progress / release))
      : power * (1 - easeOut((progress - release) / .08));
    applyAimedRangedPose(hand, draw, progress < release, attack);
  } else {
    facePlayerTowardAttack(attack);
    applyProfiledWeaponPose(mount, attack, progress, {
      hand,
      side,
      trailRoot: world.heldItems?.[hand]?.mesh ?? mount
    });
    // The arm supplies all grip translation. Mount offsets would detach the weapon.
    mount.position.copy(base.position);
  }

  if ((profile.kind === "bow" || profile.kind === "crossbow") && !attack.projectileSpawned && progress >= getCombatReleaseMoment(attack.itemType, attack.chargePower)) {
    spawnProjectile(hand, attack);
  }

  updateFlailModel(world.heldItems[hand].mesh, progress, attack.itemType === "Flail", attack.slashDirection);
  blendComboPose(hand, attack, progress);
  // Return every joint to this frame's locomotion pose, including support arms
  // and wrist rotations introduced by aiming. No neutral-pose snap on walking.
  const recoverAt = attack.jumpAttack === 'flurry' ? .94 : profile.windup + profile.strike;
  const recovery = easeInOut((progress - recoverAt) / Math.max(.01, 1 - recoverAt));
  if (recovery > 0) for (const {node, position, rotation} of attack.frameBase) {
    if (node === world.playerMesh || node === world.playerVisualRoot) continue;
    node.position.lerp(position, recovery);
    node.quaternion.slerp(rotation, recovery);
  }
  if (attack.itemType === 'Flail' && !attack.jumpAttack) {
    const oldProgress=attack.flailProgress ?? 0;
    const elapsed=(progress-oldProgress)*attack.duration;
    attack.flailSegments=simulateFlailModel(world.heldItems[hand].mesh,elapsed,{
      fromAngle:getFlailReleaseAngle(attack,oldProgress,side),toAngle:getFlailReleaseAngle(attack,progress,side),tilt:.7*(1-easeInOut((progress-attack.profile.windup)/attack.profile.strike)),side,yaw:Math.atan2(attack.direction.x,attack.direction.z),tension:1
    }).filter(segment=>{const p=oldProgress+(progress-oldProgress)*segment.t;return p>=attack.profile.windup && p<=attack.profile.windup+attack.profile.strike;});
    attack.flailProgress=progress;
  }
  resolveMeleeHitAtSwingMoment(attack, progress);

  if (progress >= 1) {
    world.attacks[hand] = null;
    mount.position.copy(base.position);
    mount.rotation.copy(base.rotation);
    resetHeldItemPose(hand);
  }
}

function applyJumpAttackPose(hand, attack, progress, dt) {
  if (attack.jumpAttack === 'flurry') {
    applyCursorDirectedDaggerStab(hand, attack, (progress * 3) % 1);
    return;
  }
  const held = world.heldItems[hand].mesh;
  if (!held) return;
  facePlayerTowardAttack(attack);
  const stroke = easeInOut((progress - .12) / .43);
  const side = HAND_CONFIG[hand].side;
  poseAttackArm(hand, -2.6 + stroke * 2.3, side * .15, 0, .25 + stroke * .4, 0);
  world.playerRig.chest.rotation.x += stroke * .3;
  world.playerMesh.updateWorldMatrix(true, false);
  const grip = held.parent.getWorldPosition(new THREE.Vector3());
  const angle = -.45 + stroke * 2.9;
  const direction = attack.direction.clone().multiplyScalar(Math.sin(angle));
  direction.y = Math.cos(angle);
  if (attack.jumpAttack === 'plant') direction.copy(attack.direction).multiplyScalar(.22).setY(-1).normalize();
  setObjectWorldPoseAlongDirection(held, grip, direction.normalize());
  if (attack.itemType === 'Axe') held.rotateY(Math.PI / 2);
  seatWeaponInHand(held, world.playerRig[hand + 'Arm'].userData.hand);
  if (attack.jumpAttack === 'plant') {
    // Slide the palm toward the butt, leaving most of the shaft below it.
    // Local +Y points toward the spearhead (downward during the plant).
    const shaftLength = attack.profile?.modelProfile?.shaftLength ?? 5.45;
    const gripSlide = Math.max(0, shaftLength * .5 - 1.32 - .22);
    held.translateY(gripSlide * easeInOut(progress / .18));
  }
  if (attack.itemType === 'Flail') simulateFlailModel(held, dt);
}

function resolveJumpAttackHit(attack, progress) {
  if (attack.jumpAttack === 'plant') applySpearVaultLift(attack, world.playerMotion);
  if (attack.hitResolved) return;
  if (attack.jumpAttack === 'flurry') {
    // Each stab has its own hit set and server swing ID, with a small aerial hop.
    const pulse = Math.min(2, Math.floor(progress * 3));
    if (!consumeDaggerAirStrike(attack, world.playerMotion, pulse)) {
      attack.hitResolved = true;
      return;
    }
    if (pulse !== attack.jumpPulse) {
      attack.jumpPulse = pulse;
      attack.hitTargets.clear();
      attack.id = createId('air-stab');
      if (world.playerMotion.jumping) world.playerMotion.verticalVelocity = Math.max(world.playerMotion.verticalVelocity, 6);
    }
    if ((progress * 3) % 1 >= .18) damagePveEnemyFromMelee(attack);
    if (progress >= 1) attack.hitResolved = true;
    return;
  }
  if (progress >= .18 && progress <= .72) damagePveEnemyFromMelee(attack);
  if (attack.jumpAttack === 'smash' && !attack.groundImpact &&
      world.playerMotion.verticalOffset - world.playerMotion.supportOffset <= .15) {
    attack.groundImpact = true;
    const center = world.playerMesh.position.clone().addScaledVector(attack.direction, 1.5);
    const radius = GROUND_SMASH_RADIUS;
    spawnJumpSmashEffect(center, radius);
    for (const target of getActiveCombatTargets()) {
      const key = target.id ?? target.mesh?.uuid;
      const position = getCombatTargetBaseWorldPosition(target);
      if (target.dead || attack.hitTargets.has(key) || !isGroundSmashTarget(center, position, radius, target.radius)) continue;
      attack.hitTargets.add(key);
      wearWeaponOnHit(attack);
      const radialAttack = { ...attack, range: Math.max(attack.range, radius + 1.5),
        direction: position.clone().sub(world.playerMesh.position).setY(0).normalize(), impactPosition: position };
      triggerCombatImpactFeedback(target, radialAttack, position);
      damageCombatTarget(target, attack.damage, attack.itemName, radialAttack);
    }
  }
  if (progress >= .72) attack.hitResolved = true;
}

function resolveEarthRockSmash({ center, radius, damage, knockback, hand }) {
  spawnJumpSmashEffect(center, radius);
  combatAudio.impact(Math.min(3, radius / 4.8));
  const id = createId('earth-smash');
  const hitTargets = new Set();
  for (const target of getActiveCombatTargets()) {
    const key = target.id ?? target.mesh?.uuid;
    const position = getCombatTargetBaseWorldPosition(target);
    if (target.dead || target.removed || hitTargets.has(key) || !isGroundSmashTarget(center, position, radius, target.radius)) continue;
    hitTargets.add(key);
    const direction = position.clone().sub(target.isRemotePlayer ? world.playerMesh.position : center).setY(0);
    if (direction.lengthSq() < .001) direction.set(1, 0, 0);
    direction.normalize();
    const attack = { id, hand, itemType: 'Staff', itemName: 'Falling rock', sourceName: 'an earth-staff rock',
      damage, penetration: 0, knockback, direction, previousPosition: center, impactPosition: position,
      range: world.playerMesh.position.distanceTo(center) + radius, hitTargets,
      profile: getCombatProfile('Flail'), comboName: 'overheadFinish' };
    triggerCombatImpactFeedback(target, attack, position);
    damageCombatTarget(target, damage, 'elemental magic', attack);
  }
}

function spawnJumpSmashEffect(center, radius) {
  const effect = createGroundSmashEffect(center, radius);
  world.playerMesh.parent.add(effect.group);
  world.jumpSmashEffects ??= [];
  world.jumpSmashEffects.push(effect);
  world.combatFeedback.cameraImpulse = Math.max(world.combatFeedback.cameraImpulse ?? 0, .06);
}

function updateJumpSmashEffects(dt) {
  world.jumpSmashEffects = (world.jumpSmashEffects ?? []).filter(effect => updateGroundSmashEffect(effect, dt));
}

function startFlailCharge(hand) {
  const item = getEquippedItem(state, hand);
  if (item?.type !== 'Flail' || item.durability <= 0 || isPlayerRolling() || state.player.dead || isCameraMenuOpen() || world.flailCharge) return false;
  if (world.attacks[hand] || !canWeaveAttack(world.attacks[hand === 'left' ? 'right' : 'left'])) return false;
  world.attacks[hand === 'left' ? 'right' : 'left'] = null;
  world.flailCharge = { hand, itemId: item.id, elapsed: 0, angle: 0 };
  world.weaveQueue = null;
  world.comboChains = {left:null,right:null};
  return true;
}

function applyFlailPose(hand, attack, progress, charging = false) {
  const held=world.heldItems[hand].mesh;
  if (!held) return;
  const side=HAND_CONFIG[hand].side, arm=world.playerRig[hand+'Arm'];
  const aim=attack.direction ? attack : {direction:world.aimDirection.clone()};
  if (!charging) facePlayerTowardAttack(aim);
  const profile=attack.profile ?? getCombatProfile('Flail');
  const rise=charging ? easeInOut((attack.chargePower ?? 0)*2/.5) : 1;
  const drop=charging ? 0 : easeInOut((progress-profile.windup)/profile.strike);
  const recover=charging ? 0 : easeInOut((progress-profile.windup-profile.strike)/profile.recovery);
  const idle=arm.quaternion.clone(), elbow=arm.userData.forearm.quaternion.clone(), rest=held.quaternion.clone();
  if (!charging) applyPlayerBodyAttackPose(hand,profile,getAttackPhase(profile,progress),side,.85);
  const orbit=charging ? (world.flailCharge?.angle ?? flailSpinAngle((attack.chargePower ?? 0)*2,side)) : 0;
  const circle=charging ? rise : 0;
  const sweepYaw=side*(1.35-drop*3);
  const target=world.playerMesh.localToWorld(charging
    ? new THREE.Vector3(side*.85+Math.cos(orbit)*.1*circle,5.8+Math.sin(orbit)*.06*circle,.3+Math.sin(orbit)*.12*circle)
    : new THREE.Vector3(arm.position.x+Math.sin(sweepYaw*.7)*1.7,4.35+.25*(1-drop),.2+Math.cos(sweepYaw*.7)*1.75));
  if (charging) {world.playerRig.chest.rotation.y+=Math.sin(orbit)*.035*circle;world.playerRig.body.rotation.y+=Math.sin(orbit)*.018*circle;}
  reachHand(arm,target);
  arm.quaternion.slerp(idle,Math.max(1-rise,recover));
  arm.userData.forearm.quaternion.slerp(elbow,Math.max(1-rise,recover));
  world.playerMesh.updateWorldMatrix(true, false);
  const grip=held.parent.getWorldPosition(new THREE.Vector3());
  const forward=aim.direction.clone().setY(0).normalize();
  const direction=charging ? new THREE.Vector3(forward.z*side,.25,-forward.x*side).normalize()
    : forward.clone().applyAxisAngle(new THREE.Vector3(0,1,0),sweepYaw).setY(.12-.24*drop).normalize();
  if (charging) direction.applyAxisAngle(new THREE.Vector3(0,1,0),Math.sin(orbit)*.14*circle);
  setObjectWorldPoseAlongDirection(held,grip,direction);
  held.quaternion.slerp(rest,Math.max(1-rise,recover));
  seatWeaponInHand(held,arm.userData.hand);
}

function applyFocusedMeleePose(hand, attack, progress) {
  const held = world.heldItems[hand].mesh;
  if (!held) return;
  facePlayerTowardAttack(attack);
  const profile = attack.profile ?? getCombatProfile(attack.itemType);
  const side = HAND_CONFIG[hand].side;
  const angles = focusedSwingAngles(profile, progress, attack.slashDirection || side);
  const phase = getAttackPhase(profile, progress);
  const motion = sampleMeleeMotion(profile, progress, attack.slashDirection || side);
  const lift = motion.envelope;
  const activeArm = hand === 'left' ? world.playerRig.leftArm : world.playerRig.rightArm;
  const walkArm = activeArm.quaternion.clone(), walkElbow = activeArm.userData.forearm.quaternion.clone();
  const walkWrist = activeArm.userData.hand.quaternion.clone();
  poseAttackArm(hand, motion.shoulderX, motion.shoulderZ, motion.shoulderY, motion.elbow, -.03, 0);
  activeArm.quaternion.slerp(walkArm, 1 - lift);
  activeArm.userData.forearm.quaternion.slerp(walkElbow, 1 - lift);
  activeArm.userData.hand.quaternion.slerp(walkWrist, 1 - lift);
  applyPlayerBodyAttackPose(hand, profile, phase, attack.slashDirection || side, .45);
  {
    const arm = hand === "left" ? world.playerRig.leftArm : world.playerRig.rightArm;
    const overhead = attack.comboName === 'overheadFinish';
    const target = world.playerMesh.localToWorld(new THREE.Vector3(
      arm.position.x + Math.sin(angles.yaw*.65) * 1.65,
      4.05 + (overhead ? (1-motion.stroke)*1.7 : Math.sin(angles.pitch)*.55),
      .2 + Math.cos(angles.yaw*.65) * 1.75));
    const idle = arm.quaternion.clone();
    const elbowIdle = arm.userData.forearm.quaternion.clone();
    reachHand(arm, target);
    const blend = Math.max(1-easeInOut(progress / profile.windup), angles.recovery);
    arm.quaternion.slerp(idle, blend);
    arm.userData.forearm.quaternion.slerp(elbowIdle, blend);
  }
  world.playerMesh.updateWorldMatrix(true, false);
  const grip = held.parent.getWorldPosition(new THREE.Vector3());
  const direction = getCursorDirectedAttackVector(attack, grip);
  const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0), direction).normalize();
  direction.applyAxisAngle(new THREE.Vector3(0,1,0), angles.yaw).applyAxisAngle(right, -angles.pitch);
  const rest = held.quaternion.clone();
  setObjectWorldPoseAlongDirection(held, grip, direction);
  if (attack.itemType === 'Axe') held.rotateY((attack.slashDirection || side) * (Math.PI * .5 + .3));
  else if (attack.comboName === 'overheadFinish') held.rotateY(Math.PI / 2);
  const entry = easeInOut(progress / Math.max(.01, profile.windup));
  held.quaternion.slerp(rest, Math.max(1-entry, angles.recovery));
  seatWeaponInHand(held, (hand === 'left' ? world.playerRig.leftArm : world.playerRig.rightArm).userData.hand);
  if (attack.itemType === "Long Sword") supportWeaponGrip(hand, held, new THREE.Vector3(0,-.42,0), entry * (1-angles.recovery));
  updateWeaponTrailVisual(held, profile, phase.trailPulse, side);
}

function supportWeaponGrip(hand, held, localPoint, weight = 1) {
  const other = hand === "left" ? "right" : "left";
  if (world.attacks[other] || getEquippedItem(state, other)) return;
  held.updateWorldMatrix(true, false);
  const arm = other === "left" ? world.playerRig.leftArm : world.playerRig.rightArm;
  const rest = arm.quaternion.clone(), elbowRest = arm.userData.forearm.quaternion.clone();
  reachHand(arm, held.localToWorld(localPoint));
  arm.quaternion.slerp(rest, 1-weight);
  arm.userData.forearm.quaternion.slerp(elbowRest, 1-weight);
}

function applyAimedRangedPose(hand, draw, loaded, attack = null) {
  const held = world.heldItems[hand].mesh;
  if (!held) return;
  const type = attack?.itemType ?? getEquippedItem(state, hand)?.type;
  const profile = getCombatProfile(type);
  const side = HAND_CONFIG[hand].side;
  const aim = attack ?? { direction: world.aimDirection.clone() };
  facePlayerTowardAttack(aim);
  poseAttackArm(hand, -1.35, -side*.16, 0, .12, 0, 0);
  world.playerMesh.updateWorldMatrix(true, false);
  const grip = held.parent.getWorldPosition(new THREE.Vector3());
  const forward = getCursorDirectedAttackVector(aim, grip).normalize();
  const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0), forward).normalize();
  const up = new THREE.Vector3().crossVectors(forward, right).normalize();
  const rotation = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(right,up,forward));
  held.position.set(0,0,0);
  held.quaternion.copy(held.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(rotation));
  updateHeldRangedModelState(held, type, draw, loaded);
  const target = profile.family === "bow"
    ? new THREE.Vector3(0,0,-profile.modelProfile.height*.12-clamp(draw,0,1)*.85)
    : new THREE.Vector3(0,-.08,.55);
  supportWeaponGrip(hand, held, target);
}

function applyCursorDirectedSpearAttack(hand, attack, progress) {
  const held = world.heldItems?.[hand]?.mesh;
  const profile = attack.profile ?? getCombatProfile("Spear");
  const phase = getAttackPhase(profile, progress);
  const initialDirection = getCursorDirectedAttackVector(attack);

  if (!held || !held.parent || initialDirection.lengthSq() < 0.001) {
    return;
  }

  facePlayerTowardAttack(attack);

  const arm = hand === 'left' ? world.playerRig.leftArm : world.playerRig.rightArm;
  const idleArm = arm.quaternion.clone(), idleElbow = arm.userData.forearm.quaternion.clone(), idleHeld = held.quaternion.clone();
  const envelope = sampleMeleeMotion(profile, progress).envelope;
  poseCursorDirectedSpearArms(hand, phase);
  arm.quaternion.slerp(idleArm, 1-envelope);
  arm.userData.forearm.quaternion.slerp(idleElbow, 1-envelope);
  applyPlayerBodyAttackPose(hand, profile, phase, HAND_CONFIG[hand].side, profile.impactProfile?.weight ?? 0.8);
  world.playerMesh.updateWorldMatrix(true, false);

  // Anchor the weapon to its actual hand mount after the arm pose has been
  // applied. The spear still receives an independent world-space rotation, so
  // the arm moves the grip without steering the point away from the cursor.
  const handPosition = new THREE.Vector3();
  held.parent.getWorldPosition(handPosition);
  const direction = getCursorDirectedAttackVector(attack, handPosition);

  setObjectWorldPoseAlongDirection(held, handPosition, direction);
  held.quaternion.slerp(idleHeld, 1-envelope);
  seatWeaponInHand(held, arm.userData.hand);
  supportWeaponGrip(hand, held, new THREE.Vector3(0, .65, 0), envelope);
  updateWeaponTrailVisual(held, profile, phase.trailPulse, HAND_CONFIG[hand].side);
}

function applyCursorDirectedDaggerStab(hand, attack, progress) {
  const held = world.heldItems?.[hand]?.mesh;
  const profile = attack.profile ?? getCombatProfile("Dagger");
  const phase = getAttackPhase(profile, progress);
  const initialDirection = getCursorDirectedAttackVector(attack);

  if (!held || !held.parent || initialDirection.lengthSq() < 0.001) {
    return;
  }

  facePlayerTowardAttack(attack);
  const arm = hand === 'left' ? world.playerRig.leftArm : world.playerRig.rightArm;
  const idleArm = arm.quaternion.clone(), idleElbow = arm.userData.forearm.quaternion.clone(), idleHeld = held.quaternion.clone();
  const envelope = sampleMeleeMotion(profile, progress).envelope;
  poseCursorDirectedDaggerArm(hand, phase);
  arm.quaternion.slerp(idleArm, 1-envelope);
  arm.userData.forearm.quaternion.slerp(idleElbow, 1-envelope);
  applyPlayerBodyAttackPose(hand, profile, phase, HAND_CONFIG[hand].side, profile.impactProfile?.weight ?? 0.5);
  world.playerMesh.updateWorldMatrix(true, false);

  const handPosition = new THREE.Vector3();
  held.parent.getWorldPosition(handPosition);
  const direction = getCursorDirectedAttackVector(attack, handPosition);

  setObjectWorldPoseAlongDirection(held, handPosition, direction);
  held.quaternion.slerp(idleHeld, 1-envelope);
  seatWeaponInHand(held, arm.userData.hand);
  updateWeaponTrailVisual(held, profile, phase.trailPulse, HAND_CONFIG[hand].side);
}

function facePlayerTowardAttack(attack) {
  if (world.seatedOnThrone || isPlayerRolling()) {
    return;
  }

  const direction = attack?.direction?.clone?.() ?? world.aimDirection.clone();
  direction.y = 0;
  if (direction.lengthSq() > 0.001) {
    direction.normalize();
    const yaw = Math.atan2(direction.x, direction.z);
    if (Number.isFinite(attack?.startFacing) && attack.duration) {
      const progress = attack.elapsed / attack.duration;
      const blend = easeInOut(progress / Math.max(.01, attack.profile.windup * .65));
      const facing = attack.startFacing + angleDifference(attack.startFacing, yaw) * blend;
      // Keep the stroke heading through recovery. Idle turning resumes at its
      // normal rate afterward, without switching sides of a 180-degree blend.
      world.playerMesh.rotation.set(0, facing, 0);
    } else world.playerMesh.rotation.set(0, yaw, 0);
  }
}

function poseCursorDirectedDaggerArm(hand, phase) {
  const arm = hand === "left" ? world.playerRig?.leftArm : world.playerRig?.rightArm;
  const side = HAND_CONFIG[hand].side;

  if (!arm) {
    return;
  }

  const extension = phase.commit * (1 - phase.recover);
  const retraction = phase.anticipation * (1 - phase.commit);
  arm.position.set(side * 1.04, 4.3, 0.28);
  arm.rotation.set(
    -0.72 + retraction * 0.18 - extension * 0.62,
    side * 0.03,
    side * (0.14 - extension * 0.04)
  );
  setArmJointPose(
    arm,
    0.58 + retraction * 0.22 - extension * 0.48,
    -0.04 - extension * 0.04,
    side * 0.02
  );
}

function getCursorDirectedAttackVector(attack, gripOrigin = null) {
  const horizontal = attack?.direction?.clone?.() ?? world.aimDirection.clone();
  horizontal.y = 0;

  if (horizontal.lengthSq() < 0.001) {
    horizontal.set(0, 0, 1);
  } else {
    horizontal.normalize();
  }

  const grip = gripOrigin?.clone?.() ?? new THREE.Vector3();
  if (!gripOrigin) {
    world.playerMesh.getWorldPosition(grip);
    grip.y += attack?.profile?.pose?.gripHeight ?? 3.72;
  }
  const aimPoint = attack?.aimPoint;

  if (!aimPoint) {
    return horizontal;
  }

  const direction = aimPoint.clone().sub(grip);
  // A close aim point can pass behind the moving hand. Keep a committed
  // melee strike forward instead of flipping the blade through the wrist.
  if (attack?.profile?.family !== 'bow' && attack?.profile?.family !== 'crossbow') {
    // Melee aim is relative to the player at input time. Carry the point with
    // translation (including buffered movement and attack steps), so walking
    // toward it cannot shorten the aim vector and pitch the weapon downward.
    if (attack?.aimOrigin) {
      direction.add(world.playerMesh.getWorldPosition(new THREE.Vector3()).sub(attack.aimOrigin));
    }
    const forward = direction.x * horizontal.x + direction.z * horizontal.z;
    if (forward < .65) {
      direction.x += horizontal.x * (.65 - forward);
      direction.z += horizontal.z * (.65 - forward);
    }
    // Movement can carry a saved aim point sideways past the hand. Preserve
    // the committed heading instead of twisting the weapon toward that point.
    const reach = Math.max(.65, forward);
    const lateral = direction.x * horizontal.z - direction.z * horizontal.x;
    const limited = clamp(lateral, -reach * .3, reach * .3);
    direction.x += horizontal.z * (limited - lateral);
    direction.z -= horizontal.x * (limited - lateral);
  }
  return direction.lengthSq() > 0.001 ? direction.normalize() : horizontal;
}

function poseCursorDirectedSpearArms(hand, phase) {
  const activeArm = hand === "left" ? world.playerRig?.leftArm : world.playerRig?.rightArm;
  const supportHand = hand === "left" ? "right" : "left";
  const supportArm = supportHand === "left" ? world.playerRig?.leftArm : world.playerRig?.rightArm;
  const activeSide = HAND_CONFIG[hand].side;
  const supportSide = HAND_CONFIG[supportHand].side;
  const extension = phase.commit * (1 - phase.recover);
  const retraction = phase.anticipation * (1 - phase.commit);
  const brace = phase.anticipation * (1 - phase.recover * 0.7);

  if (activeArm) {
    activeArm.position.set(activeSide * 1.02, 4.28, 0.3);
    activeArm.rotation.set(
      -0.82 + retraction * 0.24 - extension * 0.46,
      activeSide * 0.035,
      activeSide * 0.12
    );
    setArmJointPose(
      activeArm,
      0.42 + retraction * 0.32 - extension * 0.34,
      -0.04,
      activeSide * 0.025 * brace
    );
  }

  if (supportArm && !world.attacks[supportHand] && !getEquippedItem(state, supportHand)) {
    supportArm.position.set(supportSide * 0.82, 4.18, 0.42 + extension * 0.06);
    supportArm.rotation.set(-0.86, supportSide * 0.06, supportSide * 0.2);
    setArmJointPose(supportArm, 0.5 - extension * 0.08 + phase.recover * 0.06, -0.05, supportSide * 0.03 * brace);
  }
}

function setObjectWorldPoseAlongDirection(object, worldPosition, direction) {
  const parent = object?.parent;

  if (!parent) {
    return;
  }

  const spearAxis = direction.clone().normalize();
  const rollUp = new THREE.Vector3(0, 1, 0).addScaledVector(spearAxis, -spearAxis.y);
  if (rollUp.lengthSq() < 0.001) {
    rollUp.set(0, 0, 1);
  } else {
    rollUp.normalize();
  }
  const right = new THREE.Vector3().crossVectors(spearAxis, rollUp).normalize();
  const rotationMatrix = new THREE.Matrix4().makeBasis(right, spearAxis, rollUp);
  const worldQuaternion = new THREE.Quaternion().setFromRotationMatrix(rotationMatrix);
  const parentQuaternion = new THREE.Quaternion();

  parent.updateWorldMatrix(true, false);
  parent.getWorldQuaternion(parentQuaternion);
  object.position.copy(parent.worldToLocal(worldPosition.clone()));
  object.quaternion.copy(parentQuaternion.invert().multiply(worldQuaternion));
}

function animateRangedDraw(hand, mount, side) {
  const chargePower = getRangedChargePower(hand);

  if (chargePower <= 0) {
    return;
  }

  const draw = 0.28 + chargePower * 0.72;
  applyAimedRangedPose(hand, draw, true);
  document.body.dataset.rangedCharge = chargePower.toFixed(2);
  document.body.dataset.rangedChargeHand = hand;
}

function resolveMeleeHitAtSwingMoment(attack, progress) {
  if (attack.jumpAttack) { resolveJumpAttackHit(attack, progress); return; }
  if (attack.hitResolved || isProjectileWeapon(attack.itemType)) return;
  if (attack.itemType === 'Flail') {
    damageCombatTargetFromWeaponSegments(getActiveCombatTargets(),attack,attack.flailSegments ?? []);
    if (progress >= attack.profile.windup+attack.profile.strike) attack.hitResolved=true;
    return;
  }
  if (attack.kind === 'unarmed') {
    if (progress >= getCombatHitMoment(attack.itemType)) { attack.hitResolved = true; damagePveEnemyFromMelee(attack); }
    return;
  }
  const window = getStrikeWindow(attack.profile);
  const previous = attack.sampledProgress ?? 0;
  const from = Math.max(window.start, previous), to = Math.min(window.end, progress);
  if (to >= from && progress >= window.start) {
    if (attack.itemType === 'Dagger' && !consumeDaggerAirStrike(attack, world.playerMotion)) {
      attack.hitResolved = true;
      return;
    }
    const finalPose = captureCombatTransforms();
    const steps = Math.max(1, Math.ceil((to - from) / .025));
    for (let i = 0; i <= steps; i++) {
      restoreCombatTransforms(attack.frameBase);
      const p = from + (to - from) * i / steps;
      if (attack.previousFramePosition && progress > previous) {
        world.playerMesh.position.lerpVectors(attack.previousFramePosition, finalPose.find(e => e.node === world.playerMesh).position,
          clamp((p - previous) / (progress - previous), 0, 1));
      }
      attack.contactSampleAge = Math.max(0, (progress - p) * (attack.duration ?? 0));
      attack.contactProgress = p;
      if (attack.itemType === 'Spear' || (attack.itemType === 'Staff' && attack.kind === 'thrust')) applyCursorDirectedSpearAttack(attack.hand, attack, p);
      else if (attack.kind === 'thrust') applyCursorDirectedDaggerStab(attack.hand, attack, p);
      else applyFocusedMeleePose(attack.hand, attack, p);
      updateFlailModel(world.heldItems[attack.hand].mesh, p, attack.itemType === 'Flail', attack.slashDirection);
      damagePveEnemyFromMelee(attack);
    }
    restoreCombatTransforms(finalPose);
    updateFlailModel(world.heldItems[attack.hand].mesh, progress, attack.itemType === 'Flail', attack.slashDirection);
  }
  attack.sampledProgress = progress;
  attack.previousFramePosition = world.playerMesh.position.clone();
  attack.contactSampleAge = 0;
  if (progress >= window.end) attack.hitResolved = true;
}

function captureCombatTransforms() {
  const rig = world.playerRig;
  const nodes = new Set([world.playerMesh, world.playerVisualRoot, ...Object.values(rig).filter(n => n?.isObject3D)]);
  for (const arm of [rig.leftArm, rig.rightArm, rig.leftLeg, rig.rightLeg]) {
    for (const node of Object.values(arm?.userData ?? {})) if (node?.isObject3D) nodes.add(node);
  }
  for (const hand of ['left','right']) if (world.heldItems[hand].mesh) nodes.add(world.heldItems[hand].mesh);
  return [...nodes].filter(Boolean).map(node => ({ node, position: node.position.clone(), rotation: node.quaternion.clone() }));
}

function restoreCombatTransforms(snapshot) {
  for (const {node, position, rotation} of snapshot) {
    node.position.copy(position);
    node.quaternion.copy(rotation);
    if (node === world.playerMesh) {
      // XYZ decomposition folds yaw beyond 90 degrees into X/Z flips.
      const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(rotation);
      node.rotation.set(0, Math.atan2(forward.x, forward.z), 0);
    }
  }
}

function spawnProjectile(hand, attack) {
  const direction = getHorizontalProjectileDirection(attack);
  const horizontalSpeed = getProjectileHorizontalSpeed(attack);
  const adjustedHorizontalSpeed = horizontalSpeed;
  const chargePower = attack.chargePower ?? 0;
  const gravity = attack.kind === "crossbow" ? 15 : 20 + chargePower * 6;

  const start = getRangedProjectileSpawnPoint(hand, attack, direction);
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
    damage: attack.damage * PROJECTILE_DAMAGE_MULTIPLIER,
    penetration: attack.penetration ?? 0,
    knockback: attack.knockback ?? 0,
    weaponItem: attack.weaponItem,
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

function spawnPveEnemyProjectile(enemy, attack, targetPosition) {
  const weapon = enemy?.mesh?.getObjectByName("pveWeaponVisual");
  const start = new THREE.Vector3();

  enemy.mesh.updateWorldMatrix(true, true);
  if (weapon) {
    weapon.getWorldPosition(start);
  } else {
    enemy.mesh.getWorldPosition(start);
    start.y += 3.25;
  }

  const aimPoint = new THREE.Vector3(
    targetPosition.x,
    getPlayerWorldElevation() + 3.15,
    targetPosition.z
  );
  const direction = attack.direction.clone().setY(0).normalize();
  // Ballistics must use the constrained bearing too, not reacquire the player.
  const aimDistance = Math.max(1, Math.hypot(aimPoint.x - start.x, aimPoint.z - start.z));
  aimPoint.x = start.x + direction.x * aimDistance;
  aimPoint.z = start.z + direction.z * aimDistance;
  start.addScaledVector(direction, attack.kind === "crossbow" ? 1 : 0.75);

  const horizontalSpeed = getProjectileHorizontalSpeed(attack);
  const gravity = attack.kind === "crossbow" ? 15 : 20;
  const launchAttack = { ...attack, aimPoint };
  const velocity = getProjectileLaunchVelocity(start, launchAttack, direction, horizontalSpeed, gravity);
  const projectile = {
    mesh: createProjectileMesh(attack.kind, 0.55),
    direction,
    velocity,
    gravity,
    age: 0,
    travelled: 0,
    range: attack.range,
    damage: attack.damage * PROJECTILE_DAMAGE_MULTIPLIER,
    penetration: attack.penetration,
    knockback: attack.knockback,
    itemName: attack.itemName,
    itemType: attack.itemType,
    profile: attack.profile,
    speed: horizontalSpeed,
    previousPosition: start.clone(),
    sourceType: "pve",
    sourceEnemyId: enemy.id,
    sourceName: enemy.name
  };

  projectile.mesh.position.copy(start);
  orientProjectileMesh(projectile);
  world.scene.add(projectile.mesh);
  world.projectiles.push(projectile);
  world.projectilesFired += 1;
  document.body.dataset.projectilesFired = String(world.projectilesFired);
  document.body.dataset.projectilesActive = String(world.projectiles.length);
  attack.projectileSpawned = true;
  attack.hitResolved = true;
}

function getRangedProjectileSpawnPoint(hand, attack, direction) {
  const held = world.heldItems?.[hand]?.mesh;
  const arrow = held?.getObjectByName(attack.kind === "crossbow" ? "crossbowBolt" : "bowArrow");
  if (arrow) {
    arrow.updateWorldMatrix(true, false);
    return arrow.getWorldPosition(new THREE.Vector3());
  }
  const mount = hand === "left" ? world.leftHandMount : world.rightHandMount;
  const start = new THREE.Vector3();

  mount.getWorldPosition(start);

  if (attack.kind === "crossbow") {
    return start.addScaledVector(direction, 1.2);
  }

  const side = HAND_CONFIG[hand]?.side ?? 1;
  const right = new THREE.Vector3(direction.z, 0, -direction.x);
  if (right.lengthSq() > 0.001) {
    right.normalize();
  }

  const playerElevation = getPlayerWorldElevation();
  start.set(state.player.position.x, Math.max(start.y, playerElevation + 3.15), state.player.position.z);
  start.addScaledVector(direction, 1.25);
  start.addScaledVector(right, side * 0.38);
  return start;
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

  const rayPoint = getPointOnAimRayAtDistance(start, attack, maxDistance);
  if (rayPoint) {
    return rayPoint;
  }

  const cappedDirection = horizontalOffset.normalize();
  return new THREE.Vector3(
    start.x + cappedDirection.x * maxDistance,
    start.y,
    start.z + cappedDirection.z * maxDistance
  );
}

function getPointOnAimRayAtDistance(start, attack, distance) {
  const rayOrigin = attack?.aimRayOrigin?.clone?.() ?? world.aimRayOrigin.clone();
  const rayDirection = attack?.aimRayDirection?.clone?.() ?? world.aimRayDirection.clone();

  if (rayDirection.lengthSq() < 0.001) {
    return null;
  }

  rayDirection.normalize();
  const originToStart = rayOrigin.clone().sub(start);
  const b = 2 * originToStart.dot(rayDirection);
  const c = originToStart.lengthSq() - distance * distance;
  const discriminant = b * b - 4 * c;

  if (discriminant < 0) {
    return null;
  }

  const root = Math.sqrt(discriminant);
  const t = Math.max((-b - root) / 2, (-b + root) / 2);

  if (!Number.isFinite(t) || t <= 0) {
    return null;
  }

  return rayOrigin.addScaledVector(rayDirection, t);
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
    damage: (18 + drawPower * 14) * PROJECTILE_DAMAGE_MULTIPLIER,
    knockback: 2 + drawPower * 2.5,
    speed,
    previousPosition: start.clone(),
    sourceStructureId: world.outpostTower.structureId
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
    damage: OUTPOST_ATTACK_DAMAGE * PROJECTILE_DAMAGE_MULTIPLIER,
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
      wearWeaponOnHit(projectile);
      projectile.travelled = projectile.range;
      continue;
    }

    const hit = getProjectileEnemyHit(projectile);

    if (hit) {
      wearWeaponOnHit(projectile);
      projectile.impactPosition ??= projectile.mesh.position.clone();
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
  const now = Date.now();
  state.deathDrops = pruneExpiredLoot(state.deathDrops, now);
  for (const drop of [...world.droppedItems]) {
    if (isLootExpired(drop, now)) { removeDroppedItem(drop.id); continue; }
    const layout = world.dungeons.get(drop.activePoiInteriorId)?.layout;
    if (!drop.shared && drop.sceneMode === 'poiInterior' && layout?.lava?.some(gap => inside(drop.position, gap))) removeDroppedItem(drop.id);
  }
  updateDungeonBarrels(deltaSeconds);
  for (const drop of world.droppedItems) {
    drop.mesh.visible = drop.sceneMode ? sameLootScene(world, drop) : world.sceneMode === 'outdoor';
    drop.mesh.rotation.y += deltaSeconds * 0.75;
    drop.mesh.position.y = drop.baseY + Math.sin(state.elapsed * 2.4 + drop.phase) * 0.08;
  }
}

function getProjectileEnemyHit(projectile) {
  const enemies = getProjectileCombatTargets(projectile);

  if (!enemies.length) {
    return null;
  }

  let nearest = null;
  for (const enemy of enemies) {
    if (enemy.dead) continue;
    const hit = getWeaponSegmentTargetHit({ start: projectile.previousPosition,
      end: projectile.mesh.position, radius: .12 }, enemy);
    if (!hit) continue;
    const distance = hit.point.distanceToSquared(projectile.previousPosition);
    if (!nearest || distance < nearest.distance) nearest = { enemy, point: hit.point, distance };
  }
  if (nearest) {
    projectile.impactPosition = nearest.point;
    return nearest.enemy;
  }

  return null;
}

function getProjectileCombatTargets(projectile) {
  if (projectile.sourceType === "pve" && world.sceneMode === "poiInterior" && getActivePoiInterior()?.type === "Dungeon" && isDungeonEntranceSafe()) return [];
  const targets = projectile.sourceType === "outpost"
    ? getOutpostProjectileTargets(projectile)
    : projectile.sourceType === "pve"
      ? getPveProjectileTargets()
      : getActiveCombatTargets();

  if (!projectile.sourceStructureId) {
    return targets;
  }

  return targets.filter((target) => !target.isStructure || target.structure?.id !== projectile.sourceStructureId);
}

function getPveProjectileTargets() {
  if (state.player.dead || world.outpostTower.active) {
    return [];
  }

  return [getLocalPlayerCombatTarget()];
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

  if (world.sceneMode === "poiInterior" && getActivePoiInterior()?.type === "Dungeon") {
    return world.pveEnemies;
  }

  if (world.sceneMode === "interior") {
    return world.outdoorMonsters.filter(mob => mob.raidInteriorType === "Castle" && mob.raidInteriorId === world.interiorFactionId);
  }

  if (world.sceneMode === "poiInterior") {
    return world.outdoorMonsters.filter(mob => mob.raidInteriorId === world.activePoiInteriorId);
  }

  if (world.sceneMode === "outdoor") {
    return world.outdoorMonsters.filter(mob => !mob.raidInteriorId);
  }

  return [];
}

function getActiveCombatTargets() {
  return [
    ...getActiveCombatEnemies(),
    ...getActiveDungeonBarrels(),
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
      const radius =
        structure.type === "wall"
          ? 6.4
          : structure.type === "depot"
            ? 5.5
            : structure.type === "street-lamp"
              ? 2.2
              : 4.6;
      const hitMaxY =
        structure.type === "outpost"
          ? 17
          : structure.type === "wall"
            ? 5.5
            : structure.type === "street-lamp"
              ? 9.5
              : 10.5;

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

  if (world.sceneMode === "poiInterior" && getActivePoiInterior()?.type === "Dungeon") {
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

  if (world.sceneMode === "interior" || (world.sceneMode === "poiInterior" && getActivePoiInterior()?.type !== "Dungeon")) {
    for (const monster of getActiveCombatEnemies()) {
      entries.push({ key: getPveStatusKey(monster.id), mesh: monster.mesh, sprite: monster.healthBar, dead: monster.dead });
    }
  }

  if (world.sceneMode === "outdoor") {
    for (const monster of world.outdoorMonsters.filter(mob => !mob.raidInteriorId)) {
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
  const hits = world.raycaster.intersectObjects(statusPickCandidates(entries, world.raycaster.ray), true);

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
  if (world.sceneMode === 'poiInterior' && getActivePoiInterior()?.type === 'Dungeon' && crossesBarrier(projectile.previousPosition, projectile.mesh.position, roomBarriers(world.dungeon.layout))) return { type:'sealedDoor' };
  if (world.sceneMode === "poiInterior" && getActivePoiInterior()?.type === "Dungeon" && crossesClosedDungeonGate(world.dungeon.gate, projectile.previousPosition, projectile.mesh.position)) return world.dungeon.gate;
  if (world.sceneMode !== "outdoor") {
    return null;
  }

  for (const collider of world.sceneryGrid.query(Math.min(projectile.previousPosition.x, projectile.mesh.position.x)-0.12, Math.min(projectile.previousPosition.z, projectile.mesh.position.z)-0.12, Math.max(projectile.previousPosition.x, projectile.mesh.position.x)+0.12, Math.max(projectile.previousPosition.z, projectile.mesh.position.z)+0.12)) {
    if (collider.earthAirborne) continue;
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

function wearWeaponOnHit(attack) {
  const item = attack.weaponItem;
  if (attack.durabilityConsumed || !item?.id || !state.player.inventory.includes(item)) return;
  attack.durabilityConsumed = true;
  const result = damageInventoryItem(state, item, 1);
  attack.broken = result.broken;
  markPlayerPersistenceDue();
  if (result.broken) {
    flash(item.name + ' broke and was removed from your inventory.');
    refreshUi();
  }
  // Ordinary wear is shown by the regular HUD refresh, not a full rebuild per hit.
}

function damagePveEnemyFromMelee(attack) {
  const enemies = getActiveCombatTargets();
  if (attack.kind === 'unarmed') { damageCombatTargetFromAimProfile(enemies, attack); return; }
  const segments = getAttackWeaponHitSegments(attack);
  damageCombatTargetFromWeaponSegments(enemies, attack, segments);
}

function getAttackWeaponHitSegments(attack) {
  if (!attack?.hand || attack.kind === "unarmed") {
    return [];
  }

  const held = world.heldItems?.[attack.hand]?.mesh;
  let segments = held?.userData?.weaponHitSegments;
  if (attack.kind === 'thrust' && attack.itemType !== 'Spear' && segments?.length) {
    segments = segments.map(s => ({ ...s, start: [s.end[0], s.end[1] - .6, s.end[2]], radius: .15 }));
  }

  if (!held || !Array.isArray(segments) || !segments.length) {
    return [];
  }

  held.updateWorldMatrix(true, false);
  return segments
    .map((segment) => {
      const start = new THREE.Vector3(...segment.start).applyMatrix4(held.matrixWorld);
      const end = new THREE.Vector3(...segment.end).applyMatrix4(held.matrixWorld);

      return {
        start,
        end,
        radius: Math.max(0.04, segment.radius ?? 0.16)
      };
    })
    .filter((segment) => segment.start.distanceToSquared(segment.end) > 0.0001);
}

function damageCombatTargetFromWeaponSegments(enemies, attack, weaponSegments) {
  world.weaponTrails?.sample(attack, weaponSegments, attack.contactSampleAge ?? 0);
  const padded = weaponSegments.map(segment => ({ ...segment, radius: segment.radius + meleeContactPadding(attack) }));
  weaponSegments = attack.itemType === 'Flail' || attack.jumpAttack ? padded
    : sweptWeaponSegments(attack.previousWeaponSegments, padded);
  attack.previousWeaponSegments = padded;
  showCombatDebugSegments(padded);
  attack.hitTargets ??= new Set();
  const maxTargets = attack.jumpAttack === 'plant' ? 1 : attack.itemType === 'Spear' ? 5 : attack.kind === 'thrust' ? 1 : (attack.profile.maxTargets ?? 1);
  const hits = [];
  for (const enemy of enemies) {
    const key = enemy.id ?? enemy.mesh?.uuid;
    if (enemy.dead || attack.hitTargets.has(key)) continue;
    for (const segment of weaponSegments) {
      const hit = getWeaponSegmentTargetHit(segment, enemy);
      if (hit) { hits.push({ enemy, key, hit, distance: hit.point.distanceTo(world.playerMesh.position) }); break; }
    }
    if (enemy === attack.assistTarget && !hits.some(entry => entry.enemy === enemy)
        && attack.contactProgress >= attack.profile.hitMoment) {
      const hit = lockedMeleeContact(attack, world.playerMesh.position, isMeleeAssistVisible);
      if (hit) hits.push({ enemy, key, hit, distance: hit.distance });
    }
  }
  hits.sort((a,b) => Number(b.enemy === attack.assistTarget) - Number(a.enemy === attack.assistTarget) || a.distance - b.distance);
  for (const {enemy, key, hit} of hits) {
    if (attack.hitTargets.size >= maxTargets) break;
    attack.hitTargets.add(key);
    wearWeaponOnHit(attack);
    attack.impactPosition = hit.point;
    triggerCombatImpactFeedback(enemy, attack, hit.point);
    damageCombatTarget(enemy, attack.damage, attack.itemName, attack);
  }
  return hits.length > 0;
}

function getWeaponSegmentTargetHit(segment, target) {
  const targetPosition = getCombatTargetBaseWorldPosition(target);
  const targetRadius = target.radius ?? 1.1;
  const baseY = targetPosition.y ?? 0;
  const minY = baseY + (target.hitMinY ?? 0.6) * (target.gremlinSize?.scale ?? 1);
  const maxY = baseY + (target.hitMaxY ?? 5.6) * (target.gremlinSize?.scale ?? 1);
  const verticalPadding = segment.radius + 0.18;

  // Clip to the target's vertical extent before finding horizontal distance.
  // A descending cut can intersect the torso even when its nearest XZ point
  // lies below the feet; testing only that point used to discard valid hits.
  const dy = segment.end.y - segment.start.y;
  let from = 0, to = 1;
  if (Math.abs(dy) < 1e-8) {
    if (segment.start.y < minY - verticalPadding || segment.start.y > maxY + verticalPadding) return null;
  } else {
    const a = (minY - verticalPadding - segment.start.y) / dy;
    const b = (maxY + verticalPadding - segment.start.y) / dy;
    from = Math.max(0, Math.min(a, b));
    to = Math.min(1, Math.max(a, b));
    if (from > to) return null;
  }
  const segmentHit = getHorizontalSegmentHit(segment.start.clone().lerp(segment.end, from),
    segment.start.clone().lerp(segment.end, to), targetPosition);

  if (segmentHit.distance > targetRadius + segment.radius) {
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
    return false;
  }

  direction.normalize();
  const right = new THREE.Vector3(direction.z, 0, -direction.x);
  const profile = getMeleeHitProfile(attack.itemType, attack.kind, attack.range);
  if (attack.comboHitVolume) {
    Object.assign(profile, attack.comboHitVolume);
    profile.reach = Math.max(0.6, Number(attack.range) || 1.4) + profile.reachBonus;
    profile.sweetSpot = Math.max(0.4, profile.reach * (attack.kind === "thrust" ? 0.72 : 0.58));
  }
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

    const lateralPenalty = Math.max(0, Math.abs(lateralDistance) - profile.halfWidth * 0.55) * 0.75;
    const score = Math.abs(forwardDistance - profile.sweetSpot) * 0.55 + lateralPenalty + distance * 0.1;

    if (!best || score < best.score) {
      best = { enemy, score };
    }
  }

  if (best) {
    triggerCombatImpactFeedback(best.enemy, attack, null);
    damageCombatTarget(best.enemy, attack.damage, attack.itemName, attack);
    return true;
  }

  return false;
}

function triggerCombatImpactFeedback(target, attack, impactPosition = null, options = {}) {
  const profile = attack?.profile ?? getCombatProfile(attack?.itemType ?? attack?.kind);
  const impact = profile.impactProfile ?? {};
  const weight = impact.weight ?? 0.55;

  if (options.hitstop !== false && !attack?.impactPauseApplied) {
    world.combatFeedback.hitstop = Math.max(world.combatFeedback.hitstop, clamp(impact.hitstop ?? .04, .03, .075));
    if (attack) attack.impactPauseApplied = true;
  }
  world.combatFeedback.cameraImpulse = Math.max(world.combatFeedback.cameraImpulse, impact.camera ?? 0.014);
  world.combatFeedback.cameraPhase = 0;
  document.body.dataset.lastCombatImpact = `${profile.family}:${Math.round(weight * 100)}`;

  if (attack?.hand) {
    showCombatHitMarker(attack);
    combatAudio.impact(weight, Boolean(target.isStructure));
  }

  if (impactPosition) {
    attack.impactPosition = impactPosition;
  }

  if (target?.mesh && !target.isBarrel && !target.isStructure && !target.isCourier) {
    const direction = attack?.direction?.clone?.() ?? new THREE.Vector3(0, 0, 1);
    target.hitReaction = {
      elapsed: 0,
      duration: .32 + (impact.flinch ?? .25) * .28,
      intensity: impact.flinch ?? 0.25,
      direction
    };
    // Light hits interrupt anticipation, not an already committed enemy blow.
    // A short immunity prevents rapid daggers from permanently locking a mob.
    const incoming = target.attackAnimation;
    if (!target.isRemotePlayer && !target.isLocalPlayer && !target.bossElement
        && state.elapsed >= (target.recoilImmuneUntil ?? 0)
        && (!incoming || incoming.elapsed / incoming.duration < incoming.profile.windup)) {
      const stagger = .12 + Math.min(.16, weight * .16);
      target.shoveStaggerTimer = Math.max(target.shoveStaggerTimer ?? 0, stagger);
      target.attackTimer = Math.max(target.attackTimer ?? 0, stagger + .18);
      target.recoilImmuneUntil = state.elapsed + .7;
      resetPveEnemyAttackState(target);
    }
  }
}

function showCombatHitMarker(attack) {
  const marker = ui.combatHitMarker;

  if (!marker) {
    return;
  }

  const screenX = Number.isFinite(attack.screenX) ? attack.screenX : window.innerWidth * 0.5;
  const screenY = Number.isFinite(attack.screenY) ? attack.screenY : window.innerHeight * 0.5;
  marker.style.left = `${screenX}px`;
  marker.style.top = `${screenY}px`;
  marker.classList.remove("is-active");
  void marker.offsetWidth;
  marker.classList.add("is-active");
}

function updateCombatHitReaction(entity, deltaSeconds) {
  const reaction = entity?.hitReaction;

  if (!reaction || !entity.mesh) {
    return;
  }

  reaction.elapsed += deltaSeconds;
  const progress = clamp(reaction.elapsed / Math.max(0.001, reaction.duration), 0, 1);
  applyRecoilPose(entity, reaction);

  if (progress >= 1) {
    clearRecoilPose(entity);
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
  if (world.sceneMode === "poiInterior" && getActivePoiInterior()?.type === "Dungeon" && isDungeonEntranceSafe()) return;
  if (!enemy || state.player.dead) {
    return;
  }

  const stats = enemy.attackAnimation ?? getPveEnemyAttackStats(enemy);
  const target = getLocalPlayerCombatTarget();
  const weapon = getWeaponVisualRoot(enemy.mesh.getObjectByName('pveWeaponVisual'));
  let contact = null;
  if (weapon) {
    weapon.updateWorldMatrix(true, false);
    for (const segment of weapon.userData?.weaponHitSegments ?? []) {
      contact = getWeaponSegmentTargetHit({
        start: new THREE.Vector3(...segment.start).applyMatrix4(weapon.matrixWorld),
        end: new THREE.Vector3(...segment.end).applyMatrix4(weapon.matrixWorld),
        radius: segment.radius ?? .16
      }, target);
      if (contact) break;
    }
  }
  // Range-based creature attacks without weapon geometry aim at the torso.
  const location = locateBodyHit(target, contact?.point);
  const rawDamage = locationDamage(Number(stats.damage) || 8, location);
  if (isPlayerDodging()) return;
  const block = blockLocalDamage(rawDamage, enemy.mesh.position, stats.knockback ?? 0);
  const damage = block.damage > 0 ? mitigateDamageWithArmor(block.damage, Number(stats.penetration) || 0, getEquippedArmorItems(), { wear: true, location }) : 0;
  if (block.parried) { enemy.attackTimer = Math.max(enemy.attackTimer, .8); enemy.shoveStaggerTimer = .55; }
  const previousHp = state.player.hp ?? state.player.maxHp ?? MULTIPLAYER_MAX_HEALTH;
  const attackDirection = new THREE.Vector3(
    state.player.position.x - enemy.mesh.position.x,
    0,
    state.player.position.z - enemy.mesh.position.z
  );

  if (attackDirection.lengthSq() > 0.001) {
    attackDirection.normalize();
  }

  applyKnockbackToLocalPlayer(enemy.mesh.position, block.knockback);
  triggerCombatImpactFeedback(getLocalPlayerCombatTarget(), {
    itemType: enemy.weapon?.type ?? "Empty Hand",
    profile: getCombatProfile(enemy.weapon?.type ?? "Empty Hand"),
    direction: attackDirection
  }, null, { hitstop: false });
  state.player.maxHp = state.player.maxHp ?? MULTIPLAYER_MAX_HEALTH;
  state.player.hp = Math.max(0, previousHp - damage);
  world.multiplayer.damageInputSequence = world.multiplayer.nextInputSequence;
  markPlayerPersistenceDue();
  if (damage > 0) spawnBloodSplat({ mesh: world.playerMesh, radius: 1.15, hitMinY: 0.8, hitMaxY: 5.4 }, null, damage);
  updatePlayerHealthBar();
  refreshUi();

  if (state.player.hp > 0) {
    return;
  }

  state.player.dead = true;
  loseCarriedResources();
  world.multiplayer.localDefeated = true;
  world.multiplayer.respawnAt = Date.now() + PLAYER_RESPAWN_DELAY_MS;
  showDeathScreen();
  flash("You were defeated.");
}

function getEquippedArmorItems() {
  return BODY_EQUIP_SLOTS
    .filter((slot) => !slot.hand)
    .map((slot) => getItemById(state.player.equipment[slot.stateKey]))
    .filter((item) => isArmorItem(item) && item.durability > 0);
}

function mitigateDamageWithArmor(amount, penetration = 0, armorItems = [], options = {}) {
  const location = options.location ?? 'chest';
  const protectedItems = armorForHit(armorItems, location);
  const mitigated = mitigateHitDamage(amount, penetration, protectedItems, location);
  if (options.wear && amount > 0) wearArmorItems(protectedItems, amount);
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
  const result = damageInventoryItem(state, item, wear);
  markPlayerPersistenceDue();

  if (result.broken) {
    flash(`${item.name} broke and was removed from your inventory.`);
  }
}

function damageCombatTarget(target, amount, source, attack) {
  if (target.isBarrel) { damageDungeonBarrel(target, amount); return; }
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

  amount = locationDamage(amount, locateBodyHit(target, attack?.impactPosition));
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
      attackId: attack?.id ?? null,
      targetId: target.id,
      damage: amount,
      hitLocation: locateBodyHit(target, attack?.impactPosition),
      status: attack?.status ?? null,
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
  if (state.player.dead || (!attack?.unavoidable && isPlayerDodging())) {
    return;
  }

  const location = locateBodyHit(target, attack?.impactPosition);
  const rawDamage = locationDamage(amount, location);
  const incoming = attack?.direction;
  const shieldSource = incoming ? { x: state.player.position.x - incoming.x * 10, z: state.player.position.z - incoming.z * 10 } : attack?.previousPosition;
  const block = attack?.unavoidable ? { damage: rawDamage, knockback: 0 } : blockLocalDamage(rawDamage, shieldSource, attack?.knockback ?? 0);
  const damage = attack?.statusTick ? amount : block.damage > 0 ? mitigateDamageWithArmor(block.damage, Number(attack?.penetration) || 0, getEquippedArmorItems(), { wear: true, location }) : 0;
  const previousHp = state.player.hp ?? state.player.maxHp ?? MULTIPLAYER_MAX_HEALTH;
  const sourcePosition = attack?.mesh?.position ?? attack?.previousPosition ?? null;

  if (sourcePosition) {
    applyKnockbackToLocalPlayer(sourcePosition, block.knockback);
  }

  state.player.maxHp = state.player.maxHp ?? MULTIPLAYER_MAX_HEALTH;
  state.player.hp = Math.max(0, previousHp - damage);
  if (damage > 0 && attack?.status && state.player.hp > 0) playerStatuses.apply(attack.status, attack.sourceName);
  world.multiplayer.damageInputSequence = world.multiplayer.nextInputSequence;
  markPlayerPersistenceDue();
  if (damage > 0 && !isBloodlessAttack(attack, source)) {
    spawnBloodSplat(target, attack, damage);
  }
  updatePlayerHealthBar();
  refreshUi();

  if (state.player.hp <= 0) {
    state.player.dead = true;
    loseCarriedResources();
    world.multiplayer.localDefeated = true;
    world.multiplayer.respawnAt = Date.now() + PLAYER_RESPAWN_DELAY_MS;
    showDeathScreen();
    flash(`You were defeated by ${attack?.sourceName ?? "an outpost"}.`);
  } else if (!attack?.statusTick) {
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

  const location = locateBodyHit(enemy, attack?.impactPosition);
  const damage = attack?.statusTick ? amount : mitigateDamageWithArmor(locationDamage(amount, location), Number(attack?.penetration) || 0, enemy.armor ?? [], { location });
  enemy.hp = Math.max(0, enemy.hp - damage);
  if (!isBloodlessAttack(attack, source)) {
    spawnBloodSplat(enemy, attack, damage);
  }
  applyKnockbackToPveEnemy(enemy, attack);
  updatePveEnemyHealthBar(enemy);
  if (enemy.hp > 0) {
    revealHealthBarSprite(enemy.healthBar, { persistent: true });
  }

  if (enemy.hp <= 0) {
    enemy.dead = true;
    enemy.deathTimer = 0;
    enemy.spells?.clear();
    if (enemy.bossElement) withDungeon(enemy.dungeonId, () => beginDungeonCollapse());
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
    const goldDrop = droppedItems.find((item) => item.goldAmount);
    const staffDrops = droppedItems.filter(item => enemy.bossElement && item.type === 'Staff');
    if (staffDrops.length) spawnDroppedLootItems(staffDrops, enemy.mesh.position, enemy.name);
    const equipmentDrops = droppedItems.filter((item) => !item.goldAmount && !staffDrops.includes(item));

    if (equipmentDrops.length) {
      state.player.inventory.push(...equipmentDrops);
      state.player.selectedGearItemId = equipmentDrops[0].id;
    }

    if (goldDrop) {
      state.player.gold += goldDrop.goldAmount;
    }

    state.player.prowess = (state.player.prowess || 0) + (renownGain);
    markPersistenceDirty();
    refreshUi();
    flash(droppedItems.length
      ? `${enemy.name} defeated. ${enemy.bossElement ? 'Gem collected; staff dropped nearby.' : `Looted ${formatLootNames(droppedItems)}.`} Gained ${renownGain} prowess.${enemy.bossElement ? " Dungeon collapsing! Escape within 4 minutes!" : ""}`
      : `${enemy.name} defeated. Gained ${renownGain} prowess.`);
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
  return attack?.statusTick || attack?.itemType === 'Staff' || source === 'Staff' || source === 'elemental magic' || attack?.itemType === "Empty Hand" || source === "Empty Hand";
}

function isBloodlessDamageSource(source = "") {
  return source === "Empty Hand";
}

function spawnBloodSplat(target, attack = null, amount = 1) {
  if (!target?.mesh) return;
  world.bloodEffects ??= new BloodEffects(world.scene, getBloodSplatTexture(), 24,
    BLOOD_SPLAT_DROPLET_COUNT, BLOOD_SPLAT_LIFETIME);
  const impact = getBloodImpactPosition(target, attack);
  world.bloodEffects.spawn(impact, getBloodSprayDirection(target, impact, attack), amount);
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
  world.bloodEffects?.update(deltaSeconds);
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
  const finisher = attack?.comboName === 'overheadFinish' || attack?.comboName === 'stab'
    || attack?.comboName === 'drivingThrust' || attack?.jumpAttack || attack?.itemType === 'Flail';
  const knockback = Math.max(0, Number(attack?.knockback) || 0) *
    (attack?.kind === 'unarmed' || finisher || isProjectileWeapon(attack?.itemType) ? 1 : .4);

  if (!enemy?.mesh || knockback <= 0) {
    return;
  }

  const isEmptyHandShove = attack?.itemType === "Empty Hand" || attack?.kind === "unarmed";
  const isSpearThrust = attack?.itemType === "Spear" && attack?.kind === "thrust";
  const direction = getKnockbackDirection(
    isEmptyHandShove ? null : attack?.direction,
    state.player.position,
    enemy.mesh.position
  );
  enemy.knockbackVelocity = enemy.knockbackVelocity ?? new THREE.Vector3(0, 0, 0);
  addKnockbackImpulse(
    enemy.knockbackVelocity,
    direction,
    knockback,
    isEmptyHandShove
      ? PVE_SHOVE_KNOCKBACK_IMPULSE_SCALE
      : isSpearThrust
        ? SPEAR_KNOCKBACK_IMPULSE_SCALE
        : PVE_KNOCKBACK_IMPULSE_SCALE,
    isEmptyHandShove
      ? PVE_SHOVE_KNOCKBACK_MAX_SPEED
      : isSpearThrust
        ? SPEAR_KNOCKBACK_MAX_SPEED
        : KNOCKBACK_MAX_SPEED
  );
  if (isEmptyHandShove || (isSpearThrust && finisher)) {
    const staggerDuration = isEmptyHandShove ? PVE_SHOVE_STAGGER_DURATION : SPEAR_HIT_STAGGER_DURATION;
    enemy.shoveStaggerTimer = Math.max(enemy.shoveStaggerTimer ?? 0, staggerDuration);
    enemy.attackTimer = Math.max(enemy.attackTimer ?? 0, staggerDuration);
    resetPveEnemyAttackState(enemy);
  }
}

function applyKnockbackToLocalPlayer(sourcePosition, knockback) {
  const amount = Math.max(0, Number(knockback) || 0);

  if (amount <= 0 || state.player.dead || world.outpostTower.active) {
    return;
  }

  const direction = getKnockbackDirection(null, sourcePosition, state.player.position);
  addKnockbackImpulse(world.playerMotion.knockbackVelocity, direction, amount, PLAYER_KNOCKBACK_IMPULSE_SCALE);
}

function addKnockbackImpulse(velocity, direction, amount, scale, maxSpeed = KNOCKBACK_MAX_SPEED) {
  if (!velocity || !direction || amount <= 0) {
    return;
  }

  const impulse = clamp(amount * scale, 1.8, maxSpeed);
  velocity.addScaledVector(direction, impulse);

  if (velocity.length() > maxSpeed) {
    velocity.setLength(maxSpeed);
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
    const radius = entity.radius ?? 1.1;
    const nextPosition = clampWorldPosition(position, 40);
    const ringResolved = options.dungeonExterior
      ? pushPositionOutsideOutdoorDungeonMonsterRing(nextPosition, getEbonHollowDungeon(), radius)
      : nextPosition;
    const sceneryResolved = resolveOutdoorSceneryCollision(ringResolved, radius);
    const resolved = options.dungeonExterior
      ? pushPositionOutsideOutdoorDungeonMonsterRing(sceneryResolved, getEbonHollowDungeon(), radius)
      : sceneryResolved;

    entity.mesh.position.x = resolved.x;
    entity.mesh.position.y = getTerrainHeightAt(resolved.x, resolved.z);
    entity.mesh.position.z = resolved.z;
    return;
  }

  if (entity.raidInteriorType === "Castle") {
    const resolved = resolveCastleInteriorMovementPosition(position);
    entity.mesh.position.x = resolved.x;
    entity.mesh.position.z = resolved.z;
    return;
  }

  if (!entity.raidInteriorId && world.sceneMode === "poiInterior" && getActivePoiInterior()?.type === "Dungeon") {
    const bounds = getInteriorMovementBounds();
    const resolved = resolveDungeonMovementPosition({
      x: clamp(position.x, bounds.minX, bounds.maxX),
      z: clamp(position.z, bounds.minZ, bounds.maxZ)
    });
    if (world.dungeon.layout && crossesBarrier(entity.mesh.position, resolved, roomBarriers(world.dungeon.layout), entity.radius ?? 1)) return;
    if (isDungeonEntranceSafe(resolved, (entity.radius ?? 1.2) + 1)) return;
    entity.mesh.position.x = resolved.x;
    entity.mesh.position.y = dungeonMobElevation(resolved, world.dungeon.layout);
    entity.mesh.position.z = resolved.z;
    return;
  }

  entity.mesh.position.x = clamp(position.x, -52, 52);
  entity.mesh.position.z = clamp(position.z, -38, 40);
}

function resolvePveMobCollisions(mobs, options = {}) {
  resolveNearbyMobPairs(mobs, (first, second) => separatePveMobPair(first, second, options), ACTOR_COLLISION_PADDING, 2, options.updatedMobs);
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
  const minimumDistance = firstRadius + secondRadius + ACTOR_COLLISION_PADDING;
  const distanceSquared = dx * dx + dz * dz;

  if (distanceSquared >= minimumDistance * minimumDistance) {
    return null;
  }

  const distance = Math.sqrt(distanceSquared);
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
  if (!item && world.attacks[hand]?.broken && held.mesh) return;

  if ((held.itemId ?? null) === (item?.id ?? null)) {
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
  world.attacks[hand] = null;
  world.comboChains[hand] = null;

  held.itemId = item?.id ?? null;
  held.mesh = item ? createHeldItemMesh(item, hand) : null;

  if (held.mesh) {
    held.mesh.userData.heldItemVisual = true;
    held.mesh.userData.restPosition = held.mesh.position.clone();
    held.mesh.userData.restQuaternion = held.mesh.quaternion.clone();
    held.mesh.userData.restScale = held.mesh.scale.clone();
    mount.add(held.mesh);
  } else {
    removeTaggedHandVisuals(mount, "heldItemVisual");
  }
}

function resetHeldItemPose(hand) {
  const mesh = world.heldItems?.[hand]?.mesh;
  const restPosition = mesh?.userData?.restPosition;
  const restQuaternion = mesh?.userData?.restQuaternion;
  const restScale = mesh?.userData?.restScale;

  if (!mesh || !restPosition || !restQuaternion || !restScale) {
    return;
  }

  mesh.position.copy(restPosition);
  mesh.quaternion.copy(restQuaternion);
  mesh.scale.copy(restScale);
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
  const root = createHeldItemBaseMesh(item, hand);
  attachEquipmentGem(root, item, item.type.includes('Shield') ? 'shield' : 'weapon', HAND_CONFIG[hand].side);
  return root;
}

function createHeldItemBaseMesh(item, hand) {
  if (item.type === 'Staff') {
    const staff = createStaffVisual(item.socketedGem ?? item.element, equipmentMaterial(item));
    staff.userData.weaponHitSegments = getHeldWeaponHitSegments('Staff', hand);
    staff.rotation.set(1.17, HAND_CONFIG[hand].side * .04, HAND_CONFIG[hand].side * -.18);
    return staff;
  }
  if (item.type === "Flail") {
    const flail=createFlailModel(), side=HAND_CONFIG[hand].side;
    flail.rotation.set(1.17,side*.04,side*-.18);
    return flail;
  }
  const registered = createRegisteredWeaponAsset(item, hand);

  if (registered) {
    registered.userData.sharedLootResources = true;
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

    const headAssembly = new THREE.Group();
    headAssembly.position.y = 1.9;
    headAssembly.rotation.y = -Math.PI / 2;
    group.add(headAssembly);

    const headWidth = model.headWidth ?? 1.18;
    const headHeight = model.headHeight ?? 0.76;
    const headDepth = 0.22;
    const bladeShape = new THREE.Shape();
    bladeShape.moveTo(0.02, headHeight * 0.26);
    bladeShape.lineTo(headWidth * 0.56, headHeight * 0.5);
    bladeShape.lineTo(headWidth, headHeight * 0.38);
    bladeShape.lineTo(headWidth * 1.06, -headHeight * 0.42);
    bladeShape.lineTo(headWidth * 0.46, -headHeight * 0.58);
    bladeShape.lineTo(headWidth * 0.1, -headHeight * 0.24);
    bladeShape.closePath();
    const bladeGeometry = new THREE.ExtrudeGeometry(bladeShape, {
      depth: headDepth,
      bevelEnabled: true,
      bevelSegments: 1,
      bevelSize: 0.035,
      bevelThickness: 0.025,
      curveSegments: 1
    });
    bladeGeometry.translate(0, 0, -headDepth * 0.5);
    const blade = new THREE.Mesh(bladeGeometry, darkMetal);
    blade.castShadow = true;
    headAssembly.add(blade);

    const cuttingEdge = new THREE.Mesh(
      new THREE.BoxGeometry(0.105, headHeight * 0.92, headDepth + 0.055),
      edgeMetal
    );
    cuttingEdge.position.set(headWidth * 1.025, -headHeight * 0.03, 0);
    cuttingEdge.rotation.z = -0.04;
    cuttingEdge.castShadow = true;
    headAssembly.add(cuttingEdge);

    const eye = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.18, 0.48, 10), darkMetal);
    eye.rotation.z = Math.PI * 0.5;
    eye.position.x = 0.02;
    eye.castShadow = true;
    headAssembly.add(eye);

    const poll = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.3, 0.25), darkMetal);
    poll.position.x = -0.24;
    poll.castShadow = true;
    headAssembly.add(poll);

    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.095, 0.34, 10), leather);
    collar.position.y = 1.62;
    collar.castShadow = true;
    group.add(collar);

    const endCap = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), brass);
    endCap.position.y = -1.08;
    endCap.scale.set(0.8, 0.8, 0.8);
    group.add(endCap);

    group.position.set(side * 0.04, -0.05, 0.12);
    group.rotation.set(1.17, side * .04, side * -.18);
  } else if (item.type === "Spear") {
    const shaftLength = model.shaftLength ?? 5.45;
    const tipLength = model.tipLength ?? 0.9;
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.07, shaftLength, 10), wood);
    shaft.position.y = 1.32;
    shaft.castShadow = true;
    group.add(shaft);

    const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.34, 10), darkMetal);
    socket.position.y = shaft.position.y + shaftLength * 0.5;
    socket.castShadow = true;
    group.add(socket);

    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.23, tipLength, 12), edgeMetal);
    tip.position.y = socket.position.y + 0.17 + tipLength * 0.5;
    tip.castShadow = true;
    group.add(tip);

    const pennant = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.24), new THREE.MeshStandardMaterial({ color: "#9f3535", roughness: 0.7, side: THREE.DoubleSide }));
    pennant.position.set(side * 0.24, socket.position.y - 0.22, 0);
    pennant.rotation.z = side * 0.24;
    group.add(pennant);

    group.position.set(side * 0.03, -0.42, 0.18);
    group.rotation.set(1.49, side * 0.012, side * -0.025);
  } else if (item.type === "Bow" || item.type === "Long Bow") {
    const height = model.height ?? (item.type === "Long Bow" ? 3.5 : 2.7);
    const limbOffset = -height * 0.12;
    const upperLimb = createBowLimb(
      [
        new THREE.Vector3(0, 0.14, 0),
        new THREE.Vector3(0, height * 0.24, limbOffset * 0.4),
        new THREE.Vector3(0, height * 0.42, limbOffset * 0.88),
        new THREE.Vector3(0, height * 0.5, limbOffset)
      ],
      wood
    );
    const lowerLimb = createBowLimb(
      [
        new THREE.Vector3(0, -0.14, 0),
        new THREE.Vector3(0, -height * 0.24, limbOffset * 0.4),
        new THREE.Vector3(0, -height * 0.42, limbOffset * 0.88),
        new THREE.Vector3(0, -height * 0.5, limbOffset)
      ],
      wood
    );
    upperLimb.name = "bowUpperLimb";
    lowerLimb.name = "bowLowerLimb";
    group.add(upperLimb, lowerLimb);

    const string = createBowString(height);
    group.add(string);

    const arrow = createArrowMesh(model.arrowLength ?? 1.5, edgeMetal, wood);
    arrow.name = "bowArrow";
    arrow.userData.arrowLength = model.arrowLength ?? 1.5;
    arrow.position.set(side * 0.12, 0, -0.1);
    arrow.rotation.x = Math.PI * 0.5;
    arrow.userData.baseX = arrow.position.x;
    arrow.userData.baseZ = arrow.position.z;
    arrow.userData.side = side;
    group.add(arrow);

    const gripWrap = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.42, 8), leather);
    gripWrap.rotation.z = 0;
    gripWrap.position.x = side * 0.02;
    group.add(gripWrap);

    for (const tipY of [-1, 1]) {
      const horn = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), brass);
      horn.position.set(0, tipY * height * 0.5, limbOffset);
      horn.scale.set(0.75, 1.35, 0.75);
      horn.castShadow = true;
      group.add(horn);
    }

    group.position.set(side * 0.02, -0.05, 0.04);
    group.rotation.set(0.08, side * 0.08, side * -0.12);
  } else if (item.type === "Crossbow") {
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.28, model.stockLength ?? 1.7, 0.26), wood);
    stock.rotation.x = Math.PI * 0.5;
    stock.castShadow = true;
    group.add(stock);

    const limb = new THREE.Mesh(new THREE.BoxGeometry(model.limbWidth ?? 1.9, 0.12, 0.18), wood);
    limb.position.z = 0.55;
    limb.castShadow = true;
    group.add(limb);

    const string = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, model.limbWidth ?? 1.9, 6),
      new THREE.MeshStandardMaterial({ color: "#a98b60", roughness: 1 }));
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
      isLong ? new THREE.BoxGeometry(.28, 2.9, 1.6) : new THREE.CylinderGeometry(1.08, 1.08, .24, 24),
      shieldFace
    );
    if (!isLong) shield.rotation.z = Math.PI / 2;
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

  if (item.category !== "Armor" && !item.type.includes("Shield")) {
    group.position.set(0, 0, 0);
    attachWeaponModel(group, model.assetKey);
    updateHeldRangedModelState(group, item.type, 0, true);
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
  const string = new THREE.MeshStandardMaterial({ color: "#a98b60", roughness: 1 });
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

function createBowLimb(points, material) {
  const curve = new THREE.CatmullRomCurve3(points);
  const limb = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.035, 8, false), material);
  limb.castShadow = true;
  return limb;
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
  // Keep the established shoulder framing; further upward input tilts the view.
  const framingPitch = Math.max(config.framingMinPitch, world.cameraPitch);
  const pitchFactor = clamp(
    (framingPitch - config.framingMinPitch) / (config.maxPitch - config.framingMinPitch),
    0,
    1
  );
  const cameraHeight = config.baseHeight + clamp(pitchFactor, 0, 1) * config.pitchHeight;
  const focusDistance = config.maxFocusDistance + (config.minFocusDistance - config.maxFocusDistance) * pitchFactor;
  const focusHeight = config.focusHeight - (framingPitch - 0.6) * config.pitchFocusOffset;
  const cameraPosition = target.clone()
    .addScaledVector(forward, -distance)
    .addScaledVector(right, config.shoulderOffset);
  cameraPosition.y += cameraHeight;

  const lookTarget = target.clone()
    .addScaledVector(forward, focusDistance)
    .addScaledVector(right, config.shoulderOffset * 0.18);
  lookTarget.y += focusHeight;

  if (world.cameraPitch < config.framingMinPitch) {
    const horizontalDistance = Math.hypot(lookTarget.x - cameraPosition.x, lookTarget.z - cameraPosition.z);
    const elevation = Math.atan2(lookTarget.y - cameraPosition.y, horizontalDistance)
      + config.framingMinPitch - world.cameraPitch;
    lookTarget.y = cameraPosition.y + Math.tan(elevation) * horizontalDistance;
  }

  return { cameraPosition, lookTarget };
}

function getOutpostTowerCameraOrigin() {
  return new THREE.Vector3(
    world.outpostTower.position.x,
    world.outpostTower.elevation + 0.85,
    world.outpostTower.position.z
  );
}

function updateCamera(deltaSeconds) {
  if (world.outpostTower.active) {
    const origin = getOutpostTowerCameraOrigin();
    const direction = world.outpostTower.aimDirection.lengthSq() > 0.001
      ? world.outpostTower.aimDirection
      : getOutpostTowerAimDirection();
    const lookTarget = origin.clone().addScaledVector(direction, 42);

    world.camera.position.lerp(origin, 1 - Math.exp(-deltaSeconds * 12));
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
    if (world.sceneMode === "outdoor") {
      const clearance = Math.max(0, getTerrainHeightAt(cameraPosition.x, cameraPosition.z) + 2 - cameraPosition.y);
      cameraPosition.y += clearance;
      lookTarget.y += clearance;
    }
    world.camera.position.copy(cameraPosition);
    world.camera.lookAt(lookTarget);
    applyCombatCameraImpulse();
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

  if (world.sceneMode === "outdoor") cameraTarget.y = Math.max(cameraTarget.y, getTerrainHeightAt(cameraTarget.x, cameraTarget.z) + 2);
  world.camera.position.lerp(cameraTarget, 1 - Math.exp(-deltaSeconds * 5));
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
  // Use the same eligibility as the hold-Space prompt, including range,
  // scene, player state, and closed dungeon entrances.
  const entranceAction = getAvailableLocationAction();
  for (const [id, castle] of world.meshes.factions) {
    const marker = castle.getObjectByName("castleDoorInteractionRing");
    if (marker) marker.visible = entranceAction?.type === "enterCastle" && entranceAction.factionId === id;
  }
  for (const poi of state.pois) {
    const mesh = world.meshes.pois.get(poi.id);
    const flag = mesh?.getObjectByName("flag");
    const ring = mesh?.getObjectByName("poiDoorInteractionRing");
    const faction = poi.ownerFactionId ? FACTION_LOOKUP[poi.ownerFactionId] : null;

    applyFlagMaterial(flag, faction?.flag);
    ring?.material.color.set(faction?.accent ?? "#d6a542");
    if (ring) ring.visible = entranceAction?.type === "enterPoi" && entranceAction.poiId === poi.id;
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
  applyFlagMaterial(flag, flagFaction?.flag);
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
      world.cameraOcclusion.register(mesh);
      world.meshes.structures.set(structure.id, mesh);
      addOutdoor(mesh);
    }

    updateStructureTransform(mesh, structure, getTerrainHeightAt);
    mesh.visible = structure.hp > 0;
    const health = mesh.userData.structureHealth;
    if (!health || health.hp !== structure.hp || health.maxHp !== structure.maxHp || health.type !== structure.type) {
      updateStructureHealthBar(structure);
      mesh.userData.structureHealth = { hp: structure.hp, maxHp: structure.maxHp, type: structure.type };
    }
  }
}

function createStructureMesh(structure) {
  const group = new THREE.Group();
  const faction = FACTION_LOOKUP[structure.ownerFactionId];
  const cloth = new THREE.MeshStandardMaterial({ color: faction?.color ?? "#d6a542", roughness: 0.7 });
  if (structure.type === "street-lamp") {
    group.add(createMedievalStreetLampMesh(structure.id === "placement-preview"));
  } else {
    group.add(createBuildableArchitecture(structure.type, WALL_BODY_SIZE));
  }

  const flag = new THREE.Mesh(new THREE.BoxGeometry(3.3, 2, 0.18), cloth.clone());
  flag.name = "factionBanner";
  applyFlagMaterial(flag, faction?.flag);
  flag.position.set(3, structure.type === "wall" ? 6.4 : 12, -3);
  if (structure.type !== "wall" && structure.type !== "street-lamp") {
    group.add(flag);
  }

  const structureName = BUILDING_LOOKUP[structure.type]?.name ?? capitalize(structure.type);
  const healthBar = createHealthBarSprite(structureName);
  healthBar.name = "healthBar";
  healthBar.position.set(0, getStructureHealthBarHeight(structure.type), 0);
  healthBar.visible = false;
  group.add(healthBar);
  updateHealthBarSprite(healthBar, structure.hp, structure.maxHp, structureName);
  tagEntityStatusTarget(group, getStructureStatusKey(structure.id));
  updateStreetLampMeshState(group, structure);

  return group;
}

function createMedievalStreetLampMesh(isPreview = false) {
  const group = new THREE.Group();
  const wood = surface("wood", "#795537");
  const darkWood = surface("wood", "#443025");
  const stone = surface("stone", "#b0a38b");
  const iron = new THREE.MeshStandardMaterial({ color: "#242424", roughness: 0.58, metalness: 0.38 });
  const glass = new THREE.MeshStandardMaterial({
    color: "#f2c56d",
    emissive: "#7a3a14",
    emissiveIntensity: 0,
    transparent: true,
    opacity: 0.42,
    roughness: 0.18,
    metalness: 0.02
  });
  const flameMaterial = new THREE.MeshStandardMaterial({
    color: "#f2b24b",
    emissive: "#e06422",
    emissiveIntensity: 0,
    roughness: 0.42
  });
  const haloMaterial = new THREE.MeshBasicMaterial({
    color: "#f5b65b",
    transparent: true,
    opacity: 0,
    depthWrite: false
  });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.55, 0.9, 8), stone);
  base.position.y = 0.45;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 7.5, 10), wood);
  post.position.y = 4.45;
  post.castShadow = true;
  group.add(post);

  const cap = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.26, 1.4), darkWood);
  cap.position.y = 8.25;
  cap.castShadow = true;
  group.add(cap);

  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.9, 8), iron);
  arm.position.set(1.2, 7.75, 0);
  arm.rotation.z = Math.PI * 0.5;
  arm.castShadow = true;
  group.add(arm);

  const brace = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.1, 8), iron);
  brace.position.set(0.73, 6.98, 0);
  brace.rotation.z = Math.PI * 0.27;
  brace.castShadow = true;
  group.add(brace);

  const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.74, 6), iron);
  chain.position.set(2.55, 7.28, 0);
  chain.castShadow = true;
  group.add(chain);

  const lantern = new THREE.Group();
  lantern.position.set(2.55, 6.42, 0);
  group.add(lantern);

  const lanternBody = new THREE.Mesh(new THREE.BoxGeometry(0.92, 1.2, 0.92), glass);
  lanternBody.name = "streetLampGlass";
  lanternBody.castShadow = true;
  lantern.add(lanternBody);

  const lanternTop = new THREE.Mesh(new THREE.ConeGeometry(0.78, 0.46, 4), iron);
  lanternTop.position.y = 0.82;
  lanternTop.rotation.y = Math.PI * 0.25;
  lanternTop.castShadow = true;
  lantern.add(lanternTop);

  const lanternBottom = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.18, 1.08), iron);
  lanternBottom.position.y = -0.7;
  lanternBottom.castShadow = true;
  lantern.add(lanternBottom);

  for (const [x, z] of [[-0.51, -0.51], [0.51, -0.51], [-0.51, 0.51], [0.51, 0.51]]) {
    const frame = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.34, 6), iron);
    frame.position.set(x, 0, z);
    frame.castShadow = true;
    lantern.add(frame);
  }

  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.78, 8), flameMaterial);
  flame.name = "streetLampFlame";
  flame.position.y = -0.08;
  lantern.add(flame);

  const halo = new THREE.Mesh(new THREE.SphereGeometry(1.55, 18, 12), haloMaterial);
  halo.name = "streetLampHalo";
  halo.position.y = -0.05;
  lantern.add(halo);

  const light = new THREE.PointLight("#f0a84a", isPreview ? 0 : 5.4, STREET_LAMP_POINT_LIGHT_RADIUS, 1.25);
  light.name = "streetLampLight";
  light.position.set(STREET_LAMP_LOCAL_LIGHT_OFFSET.x, STREET_LAMP_LOCAL_LIGHT_OFFSET.y, STREET_LAMP_LOCAL_LIGHT_OFFSET.z);
  light.visible = false;
  group.add(light);

  // Forged collars, carved plinth and a finial add detail without extra lights.
  for (const y of [1, 2, 6.2, 7.8]) {
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.15, 16), iron);
    collar.position.y = y; group.add(collar);
  }
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.35, 0.25, 16), stone);
  plinth.position.y = 1; group.add(plinth);
  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 8), iron);
  finial.position.set(0, 8.6, 0); group.add(finial);
  for (const y of [-0.35, 0.35]) {
    for (const z of [-0.52, 0.52]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.055, 0.06), iron);
      rail.position.set(0, y, z); lantern.add(rail);
    }
  }
  group.traverse(mesh => {
    if (!mesh.isMesh) return;
    if ([wood, darkWood, stone].includes(mesh.material)) interiorUv(mesh.geometry);
    mesh.receiveShadow = true;
  });
  return group;
}

function getStructureHealthBarHeight(type) {
  if (type === "outpost") {
    return 17.4;
  }

  if (type === "wall") {
    return 6.4;
  }

  if (type === "street-lamp") {
    return 10.8;
  }

  return 10.7;
}

function updateStructureLampStates() {
  for (const structure of state.structures) {
    const mesh = world.meshes.structures.get(structure.id);
    updateStreetLampMeshState(mesh, structure);
  }
}

function updateStreetLampMeshState(mesh, structure, options = {}) {
  if (!mesh || structure?.type !== "street-lamp") {
    return;
  }

  const nightAmount = world.lighting.nightAmount;
  const active = structure.id !== "placement-preview" && structure.hp > 0 && nightAmount > 0.5;
  const flicker = active ? getStreetLampFlicker(structure) : 0;
  const pointLightEnabled = Boolean(options.pointLightEnabled);
  const intensity = active && pointLightEnabled ? 5.4 * flicker : 0;
  const glow = active ? THREE.MathUtils.clamp((nightAmount - 0.45) / 0.55, 0, 1) : 0;
  const light = mesh.getObjectByName("streetLampLight");
  const flame = mesh.getObjectByName("streetLampFlame");
  const glass = mesh.getObjectByName("streetLampGlass");
  const halo = mesh.getObjectByName("streetLampHalo");

  if (light) {
    light.intensity = intensity;
    light.visible = intensity > 0.01;
  }

  if (flame?.material) {
    flame.material.emissiveIntensity = active ? 1.35 + flicker * 0.38 : 0;
    flame.visible = active || nightAmount > 0.32;
  }

  if (glass?.material) {
    glass.material.emissiveIntensity = active ? 0.62 + flicker * 0.16 : 0;
  }

  if (halo?.material) {
    halo.material.opacity = glow * 0.3;
    halo.visible = glow > 0.02;
  }
}

function updateStreetLampLightingSystem() {
  const lampStructures = state.structures.filter((structure) => structure.type === "street-lamp");
  const nightAmount = world.lighting.nightAmount;
  const candidates = [];

  for (const structure of lampStructures) {
    const mesh = world.meshes.structures.get(structure.id);

    if (!mesh || structure.hp <= 0 || nightAmount <= 0.05) {
      updateStreetLampMeshState(mesh, structure, { pointLightEnabled: false });
      continue;
    }

    const position = getStreetLampWorldLightPosition(structure, mesh);
    candidates.push({
      structure,
      mesh,
      position,
      distance: distance2D(state.player.position, position)
    });
  }

  candidates.sort((a, b) => a.distance - b.distance);
  updateTerrainLampUniforms(candidates);

  const activePointLightIds = new Set(
    candidates
      .filter((candidate) => candidate.distance <= STREET_LAMP_POINT_LIGHT_RADIUS * 2.2)
      .slice(0, MAX_STREET_LAMP_POINT_LIGHTS)
      .map((candidate) => candidate.structure.id)
  );
  document.body.dataset.terrainLampLights = String(Math.min(candidates.length, MAX_TERRAIN_LAMP_LIGHTS));
  document.body.dataset.streetLampPointLights = String(activePointLightIds.size);

  for (const candidate of candidates) {
    updateStreetLampMeshState(candidate.mesh, candidate.structure, {
      pointLightEnabled: activePointLightIds.has(candidate.structure.id)
    });
  }
}

function updateTerrainLampUniforms(candidates) {
  const uniforms = world.meshes.terrain?.material?.uniforms;

  if (!uniforms?.lampLights) {
    return;
  }

  const lights = uniforms.lampLights.value;
  const campCandidates = world.sceneMode === "outdoor" ? world.campModels.map(camp => ({
    position: camp.position,
    distance: distance2D(state.player.position, camp.position),
    fireStrength: 0.85 * campFireFlicker(state.elapsed, camp.userData.fire.phase)
  })).filter(camp => camp.distance < 180) : [];
  const activeLights = [...candidates, ...campCandidates].sort((a,b) => a.distance-b.distance).slice(0, MAX_TERRAIN_LAMP_LIGHTS);
  uniforms.lampCount.value = activeLights.length;

  for (let index = 0; index < MAX_TERRAIN_LAMP_LIGHTS; index += 1) {
    const light = activeLights[index];

    if (!light) {
      lights[index].set(0, 0, 1, 0);
      continue;
    }

    const strength = light.fireStrength ?? world.lighting.nightAmount * (0.52 + getStreetLampFlicker(light.structure) * 0.12);
    lights[index].set(light.position.x, light.position.z, light.fireStrength ? 38 : STREET_LAMP_TERRAIN_LIGHT_RADIUS, strength);
  }
}

function getStreetLampFlicker(structure) {
  return 0.88 + Math.sin(state.elapsed * 7.1 + structure.id.length) * 0.08 + Math.sin(state.elapsed * 13.7) * 0.04;
}

function getStreetLampWorldLightPosition(structure, mesh = null) {
  const light = mesh?.getObjectByName("streetLampLight");

  if (light?.getWorldPosition) {
    return light.getWorldPosition(new THREE.Vector3());
  }

  const rotation = Number.isFinite(Number(structure.rotation)) ? Number(structure.rotation) : 0;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  return new THREE.Vector3(
    structure.position.x + STREET_LAMP_LOCAL_LIGHT_OFFSET.x * cos + STREET_LAMP_LOCAL_LIGHT_OFFSET.z * sin,
    getTerrainHeightAt(structure.position.x, structure.position.z) + STREET_LAMP_LOCAL_LIGHT_OFFSET.y,
    structure.position.z - STREET_LAMP_LOCAL_LIGHT_OFFSET.x * sin + STREET_LAMP_LOCAL_LIGHT_OFFSET.z * cos
  );
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
  const serverTimeMs = estimateServerTime(world.serverClock);
  const rawProgress = world.persistence.online
    ? getCourierProgressAt(courier, serverTimeMs)
    : clamp(Number(courier.progress) || 0, 0, 1);
  const duration = Math.max(1, Number(courier.duration) || 1);
  let visual = world.courierVisuals.get(courier.id);

  if (!visual) {
    visual = {
      key,
      progress: rawProgress,
      serverProgress: rawProgress,
      serverElapsed: state.elapsed,
      lastFrameElapsed: state.elapsed
    };
    world.courierVisuals.set(courier.id, visual);
  } else if (visual.key !== key) {
    visual.key = key;
    visual.progress = 0;
    visual.serverProgress = rawProgress;
    visual.serverElapsed = state.elapsed;
    visual.lastFrameElapsed = state.elapsed;
  }

  if (Math.abs(rawProgress - visual.serverProgress) > 0.001) {
    visual.serverProgress = rawProgress;
    visual.serverElapsed = state.elapsed;
  }

  const frameDelta = Math.max(0, state.elapsed - visual.lastFrameElapsed);
  visual.lastFrameElapsed = state.elapsed;

  const estimatedProgress = world.persistence.online && Number.isFinite(Number(courier.routeStartedAt))
    ? getCourierProgressAt(courier, serverTimeMs)
    : clamp(
        visual.serverProgress + Math.max(0, state.elapsed - visual.serverElapsed) / duration,
        0,
        1
      );

  if (visual.progress < estimatedProgress) {
    const correctionMultiplier = 1 + Math.min(3, Math.max(0, estimatedProgress - visual.progress) * 8);
    visual.progress = Math.min(
      estimatedProgress,
      visual.progress + (frameDelta / duration) * correctionMultiplier
    );
  } else if (visual.progress > estimatedProgress + 0.03) {
    visual.progress = THREE.MathUtils.lerp(visual.progress, estimatedProgress, Math.min(1, frameDelta * 3));
  }

  mesh.userData.visualProgress = visual.progress;
  return visual.progress;
}

function getCourierRouteKey(courier) {
  if (courier.routeId) {
    return String(courier.routeId);
  }

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
  refreshFactionHeraldry();
  const faction = state.selectedFactionId ? FACTION_LOOKUP[state.selectedFactionId] : null;
  const zone = getZone(state);
  const interiorFaction = world.interiorFactionId ? FACTION_LOOKUP[world.interiorFactionId] : null;
  const interiorPoi = world.activePoiInteriorId ? state.pois.find((poi) => poi.id === world.activePoiInteriorId) : null;
  ui.hudFaction.textContent = faction?.name ?? "Unsworn";
  ui.hudFactionGold.textContent = faction ? `${Math.round(state.factionResources?.[state.selectedFactionId]?.gold ?? 0)} Gold` : "";
  ui.hudHouse.textContent = state.player.houseName ? `House ${formatHouseName(state.player.houseName)}` : "Unbound";
  ui.hudPlayer.textContent = state.player.name;
  const maxHp = state.player.maxHp ?? MULTIPLAYER_MAX_HEALTH;
  ui.hudPlayerHp.textContent = `${Math.round(state.player.hp ?? maxHp)} / ${Math.round(maxHp)} HP`;
  ui.hudRenown.textContent = String(state.player.renown);
  const statusLabel =
    world.sceneMode === "interior" && interiorFaction
      ? `${interiorFaction.name} Keep`
      : world.sceneMode === "poiInterior" && interiorPoi
        ? interiorPoi.name
        : zone.label === "Wildlands" ? getRegionAt(state.player.position.x, state.player.position.z).name : zone.label;
  ui.hudZone.textContent = statusLabel;
  ui.hudZone.title = world.sceneMode === "outdoor" ? `Grand Library: ${Math.round(Math.hypot(state.player.position.x, state.player.position.z))}m toward the centre of the island` : statusLabel;

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
  if (!ui.housePanel.classList.contains("is-hidden")) {
    renderHousePanel();
  }
  if (!ui.statusPanel.classList.contains("is-hidden")) {
    renderStatusPanel();
  }

  renderToasts();
}

function renderStructureList() {
  const activeStructures = state.structures.filter((entry) => entry.hp > 0);
  ui.structureCount.textContent = `${activeStructures.length} built`;

  if (activeStructures.length === 0) {
    ui.structureList.innerHTML = `<div class="notice">No placed buildings yet.</div>`;
    return;
  }

  const summaries = activeStructures.reduce((entries, structure) => {
    const building = BUILDING_LOOKUP[structure.type];
    const key = structure.type;
    const summary = entries.get(key) ?? {
      name: building?.name ?? capitalize(structure.type),
      count: 0,
      damaged: 0
    };
    const hp = Math.max(0, Number(structure.hp) || 0);
    const maxHp = Math.max(1, Number(structure.maxHp) || building?.maxHp || 1);

    summary.count += 1;
    if (hp < maxHp) {
      summary.damaged += 1;
    }

    entries.set(key, summary);
    return entries;
  }, new Map());

  ui.structureList.innerHTML = Array.from(summaries.values())
    .map((summary) => {
      const status = summary.damaged > 0 ? `${summary.damaged} damaged` : "All sound";

      return `
        <article class="structure-row structure-summary">
          <strong>${escapeHtml(summary.name)}</strong>
          <span>${summary.count}</span>
          <small>${status}</small>
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
  const earthControl = earthStaffControl(item), fireControl = fireStaffConfig(item);
  const gemDetails = item.socketedGem ? `<span>Gem socket</span><strong>${escapeHtml(item.socketedGem)}${earthControl || fireControl ? '' : ' (effect inactive)'}</strong>${earthControl ? `<span>Earth control</span><strong>Hold the staff's mouse button over a rock to lift and steer it. ${earthControl.duration}s control · responsiveness ${earthControl.response} · release to drop. Falls of ${ROCK_SMASH_MIN_DROP}+ units cause a ground smash. Bigger rocks deal more damage over a wider area.</strong>` : ''}` : "";

  if (item.category === "Treasure") {
    return `<article><header>${getItemIconMarkup(item)}<strong>${escapeHtml(item.name)}</strong></header><p>${escapeHtml(item.description ?? "Dungeon treasure")}</p><p>${escapeHtml(item.rarity)} treasure</p></article>`;
  }

  if (isArmorItem(item)) {
    return `
      <article>
        <header>
          ${getItemIconMarkup(item, { decorative: true })}
          <div>
            <strong>${escapeHtml(equipmentName(item))}</strong>
            <span>${escapeHtml(item.type)} · ${equipmentMaterial(item).name}${equipmentMaterial(item).tier ? ` · Tier ${equipmentMaterial(item).tier}/5` : ""}</span>
          </div>
        </header>
        <div class="stat-grid">
          <span>Material</span><strong>${escapeHtml(item.armor.material ?? "Unknown")}</strong>
          <span>Slot</span><strong>${escapeHtml(getArmorSlotLabel(item.armor.slot))}</strong>
          <span>Defense</span><strong>${formatStat(item.armor.defense)}</strong>
          <span>Resistance</span><strong>${formatStat(item.armor.resistance)}%</strong>
          <span>Toughness</span><strong>${formatStat(item.armor.toughness)}</strong>
          <span>Weight</span><strong>${formatStat(item.armor.weight)}</strong>
          <span>Durability</span><strong>${durability}</strong>${gemDetails}${fireControl ? `<span>Flamethrower</span><strong>Hold to spray fire · ${fireControl.damagePerSecond} damage/s before armour · applies Flaming for 5s.</strong>` : ""}
        </div>
      </article>
    `;
  }

  if (!isWeaponItem(item)) {
    return `
      <article>
        <header>
          ${getItemIconMarkup(item, { decorative: true })}
          <div>
            <strong>${escapeHtml(equipmentName(item))}</strong>
            <span>${escapeHtml(item.type)} · ${equipmentMaterial(item).name}${equipmentMaterial(item).tier ? ` · Tier ${equipmentMaterial(item).tier}/5` : ""}</span>
          </div>
        </header>
        <div class="stat-grid">
          ${isShield(item.type) ? `<span>Defend</span><strong>Hold its mouse button. Face the attack. Timed blocks cost less guard; attacks lower your shield.</strong>` : ""}
          <span>Category</span><strong>${escapeHtml(item.category)}</strong>
          <span>Durability</span><strong>${durability}</strong>${gemDetails}
        </div>
      </article>
    `;
  }

  return `
    <article>
      <header>
        ${getItemIconMarkup(item, { decorative: true })}
        <div>
          <strong>${escapeHtml(equipmentName(item))}</strong>
          <span>${escapeHtml(item.type)} · ${equipmentMaterial(item).name}${equipmentMaterial(item).tier ? ` · Tier ${equipmentMaterial(item).tier}/5` : ""}</span>
        </div>
      </header>
      <div class="stat-grid">
        <span>Style</span><strong>${MELEE_STYLES[item.type]?.description ?? "Aim and release to fire."}</strong>
        <span>Range</span><strong>${WEAPON_STATS[item.type]?.range ?? item.weapon.range}</strong>
        <span>Damage</span><strong>${item.weapon.damage}</strong>
        <span>Penetration</span><strong>${item.weapon.penetration}</strong>
        <span>Knockback</span><strong>${formatStat(item.weapon.knockback ?? 0)}</strong>
        <span>Frequency</span><strong>${item.weapon.frequency}/s</strong>
        <span>Speed</span><strong>${item.weapon.speed}</strong>
        <span>Durability</span><strong>${durability}</strong>${gemDetails}
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

let inventoryPreview;
function renderInventoryPanel() {
  if (ui.inventoryPanel.classList.contains("is-hidden")) return;
  const selectedGear = getSelectedGearItem(state);
  document.querySelector("#inventory-character-name").textContent = state.player.name;
  const inventoryScrollTop = ui.inventoryGrid.scrollTop;
  const inventoryScrollLeft = ui.inventoryGrid.scrollLeft;

  ui.inventoryGrid.innerHTML = state.player.inventory
    .map((item) => renderInventoryItemSlot(item, selectedGear))
    .join("") || `<div class="inventory-empty">Your pack is empty.<small>Equipment you collect will appear here.</small></div>`;

  // The general UI refresh rebuilds this grid twice per second. Keep that
  // background render from overriding the position chosen by the player.
  ui.inventoryGrid.scrollTop = inventoryScrollTop;
  ui.inventoryGrid.scrollLeft = inventoryScrollLeft;

  ui.inventoryDetails.classList.toggle("is-hidden", !selectedGear);
  ui.inventoryDetails.parentElement.classList.toggle("has-selection", Boolean(selectedGear));
  ui.inventoryDetails.innerHTML = selectedGear ? renderGearDetails(selectedGear) : "";
  renderEquipmentSlots();
  renderInventoryHotbar(selectedGear);
}

function renderInventoryItemSlot(item, selectedGear) {
  const equippedSlot = BODY_EQUIP_SLOTS.find((slot) => state.player.equipment[slot.stateKey] === item.id);
  const selected = selectedGear?.id === item.id;

  return `
    <button class="inventory-item-slot ${equippedSlot ? "is-equipped" : ""} ${selected ? "is-selected" : ""}" data-item-id="${item.id}" type="button" title="${escapeHtml(equipmentName(item))}" style="--material-color:${equipmentMaterial(item).color}">
      ${getItemIconMarkup(item)}
      <span>${escapeHtml(equipmentName(item))}</span>
      <small>${escapeHtml(equippedSlot?.label ?? (item.category === "Treasure" ? "Rare treasure" : equipmentMaterial(item).tier ? `Tier ${equipmentMaterial(item).tier} · ${equipmentMaterial(item).quality}` : equipmentMaterial(item).name))}</small>
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

    button.querySelector("strong").innerHTML = item ? getItemIconMarkup(item, { decorative: true }) : "Empty";
    button.title = item ? `${slot.label}: ${equipmentName(item)}` : `${slot.label}: empty`;
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
          <strong>${item ? getItemIconMarkup(item) : "Empty"}</strong>
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
          <strong>${item ? getItemIconMarkup(item) : "Empty"}</strong>
        </div>
      `;
    })
    .join("");
}

function renderGearSelection() {
  renderInventoryPanel();
}

function renderHandSlot(element, item, emptyLabel) {
  element.innerHTML = item ? getItemIconMarkup(item) : "Empty";
  element.title = item ? `${emptyLabel}: ${item.name}` : `${emptyLabel}: empty`;
  element.parentElement.classList.toggle("is-filled", Boolean(item));
}

function getItemIconMarkup(item, options = {}) {
  const label = escapeHtml(equipmentName(item));
  const aria = options.decorative ? 'aria-hidden="true"' : `role="img" aria-label="${label}"`;
  if (item.category === "Treasure" && SORCERERS[item.element]) {
    return `<span class="item-icon" ${aria}>${gemSvg(item.element)}</span>`;
  }
  return `<span class="item-icon" ${aria} style="--material-color:${equipmentMaterial(item).color}"><img src="${equipmentArtUrl(item)}" alt="" draggable="false"></span>`;
}

function itemIconClass(type) {
  return String(type)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "unknown";
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

function earthAimRay() {
  const caster = new THREE.Raycaster();
  caster.setFromCamera(getNdcFromPointer({ clientX: world.pointer.x, clientY: world.pointer.y }), world.camera);
  return caster.ray;
}



function startFireStaff(hand) {
  const item = getEquippedItem(state, hand), config = fireStaffConfig(item);
  if (!config || state.player.dead || isCameraMenuOpen() || isPlayerRolling() || world.fireCast || world.earthMagic?.active?.phase === 'held') return false;
  world.fireCast = { hand, itemId: item.id, config, age: 0, pulse: 0, scene: world.sceneMode, area: world.activePoiInteriorId };
  world.fireInputHand = hand;
  world.attacks.left = null; world.attacks.right = null;
  world.flailCharge = null; world.weaveQueue = null; world.guard.hand = null;
  world.comboChains = { left: null, right: null };
  return true;
}

function igniteTarget(target) {
  if (target.isRemotePlayer || target.isStructure || target.isBarrel || target.isLocalPlayer) return;
  const key = target.id ?? target.mesh.uuid;
  let entry = flamingTargets.get(key);
  if (!entry) {
    entry = { target, statuses: new StatusEffects(), visuals: new PlayerStatusVisuals(target.mesh) };
    flamingTargets.set(key, entry);
  }
  entry.statuses.apply('flaming', 'a fire staff');
}

function updateFlamingTargets(dt) {
  if (!flamingTargets.size) return;
  const active = new Set(getActiveCombatTargets().map(t => t.id ?? t.mesh?.uuid));
  for (const [key, entry] of flamingTargets) {
    const t = entry.target;
    if (!t.dead && !t.removed && active.has(key)) entry.statuses.update(dt, amount => {
      if (!t.dead) damageCombatTarget(t, amount, 'elemental magic', { statusTick: true, itemType: 'Staff', sourceName: 'Flaming' });
    });
    if (t.dead || t.removed || !active.has(key) || !entry.statuses.active.size) {
      entry.visuals.root.removeFromParent();
      const geometries = new Set(), materials = new Set();
      entry.visuals.root.traverse(n => { if (n.geometry) geometries.add(n.geometry); if (n.material) materials.add(n.material); });
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
      flamingTargets.delete(key);
    } else entry.visuals.update(dt, entry.statuses);
  }
}

function updateFireStaff(dt) {
  let cast = world.fireCast;
  if (cast && (!(world.pointer.buttons & (cast.hand === 'left' ? 1 : 2)) || state.player.dead ||
      isPlayerRolling() || isCameraMenuOpen() || cast.scene !== world.sceneMode || cast.area !== world.activePoiInteriorId ||
      getEquippedItem(state, cast.hand)?.id !== cast.itemId || !fireStaffConfig(getEquippedItem(state, cast.hand)))) {
    world.fireCast = null; cast = null;
  }
  const origin = new THREE.Vector3(), direction = new THREE.Vector3(0,0,1);
  let length = 0, emitting = false;
  if (cast) {
    cast.age += dt;
    const staff = world.heldItems[cast.hand]?.mesh, arm = world.playerRig?.[cast.hand + 'Arm'];
    const target = world.aimPoint.clone();
    if (target.distanceToSquared(world.playerMesh.position) < 64) target.copy(world.playerMesh.position).addScaledVector(world.aimDirection, 24).add(new THREE.Vector3(0,3,0));
    const tip = poseEarthStaff(arm, staff, target, Math.min(1, cast.age/.16));
    if (tip) {
      origin.copy(staff.localToWorld(new THREE.Vector3(0,4.45,0)));
      direction.set(0,1,0).applyQuaternion(staff.getWorldQuaternion(new THREE.Quaternion())).normalize();
      length = Math.min(cast.config.range, Math.max(0, cast.age-.1)*34);
      // The same clipped length drives rendering and damage.
      for (let d=.4; d<=length; d+=.4) {
        const point=origin.clone().addScaledVector(direction,d);
        const previous=origin.clone().addScaledVector(direction,d-.4);
        let blocked = getProjectileSceneryHit({previousPosition:previous,mesh:{position:point}});
        if (world.sceneMode === 'outdoor') {
          blocked ||= point.y < getTerrainHeightAt(point.x,point.z);
          blocked ||= [...world.poiExteriorColliders,...world.castleExteriorColliders].some(c =>
            Math.abs(point.x-c.x)<c.halfWidth && Math.abs(point.z-c.z)<c.halfDepth && point.y<getTerrainHeightAt(c.x,c.z)+(c.height??16));
        }
        if (blocked) { length=Math.max(0,d-.4); break; }
      }
      emitting = length > .1 && cast.age >= .1;
      cast.pulse += dt;
      if (emitting && cast.pulse >= cast.config.interval) {
        const elapsed = Math.min(cast.pulse, .3); cast.pulse = 0;
        const attack = { id:createId('flame'), hand:cast.hand, itemType:'Staff', itemName:'Flamethrower', sourceName:'a fire staff',
          status:'flaming', direction, penetration:0, knockback:0, range:cast.config.range+6, previousPosition:origin };
        for (const t of getActiveCombatTargets()) {
          if (t.dead || t.removed) continue;
          const scale=t.gremlinSize?.scale??1;
          if (!flameHitsBody(origin,direction,length,getCombatTargetBaseWorldPosition(t),t.radius??1,(t.hitMinY??.6)*scale,(t.hitMaxY??5.6)*scale)) continue;
          damageCombatTarget(t,cast.config.damagePerSecond*elapsed,'elemental magic',attack);
          if (!t.dead) igniteTarget(t);
        }
      }
    }
  }
  if (emitting && !world.flameJet) world.flameJet = new FlameJetVisual(world.scene);
  if (world.flameJet) {
    world.flameJet.update(dt,origin,direction,length,emitting);
    if (!cast && !world.flameJet.particles.length) { world.flameJet.dispose(); world.flameJet=null; }
  }
}

function startEarthRockControl(hand) {
  const item = getEquippedItem(state, hand), config = earthStaffControl(item);
  if (!config || world.sceneMode !== 'outdoor' || state.player.dead || isCameraMenuOpen() || isPlayerRolling()) return false;
  const ray = earthAimRay();
  const rock = world.earthMagic?.pick(ray, state.player.position, config.range, point => {
    // Reject rocks hidden behind terrain or building walls.
    const length = ray.origin.distanceTo(point);
    for (let d = 1; d < length - .5; d += 1) {
      const p = ray.at(d, new THREE.Vector3());
      if (getTerrainHeightAt(p.x, p.z) > p.y + .2) return true;
    }
    for (const c of [...world.poiExteriorColliders, ...world.castleExteriorColliders]) {
      const ground = getTerrainHeightAt(c.x, c.z);
      const box = new THREE.Box3(new THREE.Vector3(c.x - c.halfWidth, ground, c.z - c.halfDepth),
        new THREE.Vector3(c.x + c.halfWidth, ground + (c.height ?? 16), c.z + c.halfDepth));
      const hit = ray.intersectBox(box, new THREE.Vector3());
      if (hit && hit.distanceTo(ray.origin) < length - .2) return true;
    }
    return false;
  });
  if (!rock) return false;
  if (!world.earthMagic.start(rock, item, hand, ray)) {
    flash('Wait for the controlled rock to land.');
    world.earthInputHand = hand;
    return true;
  }
  world.earthInputHand = hand;
  world.weaveQueue = null;
  flash(`${equipmentName(item)}: hold to steer · release to drop · ${config.duration}s control.`);
  return true;
}

function updateEarthRockControl(dt) {
  const control = world.earthMagic;
  if (!control) return;
  const active = control.active;
  if (active) {
    const result = control.update(dt, {
      ray: earthAimRay(),
      playerPosition: new THREE.Vector3(state.player.position.x, getPlayerWorldElevation(), state.player.position.z),
      item: getEquippedItem(state, active.hand),
      held: Boolean(world.pointer.buttons & (active.hand === 'left' ? 1 : 2)) && !isCameraMenuOpen() && !isPlayerRolling(),
      valid: world.sceneMode === 'outdoor' && !state.player.dead
    });
    if (result === 'expired') flash('Earth control exhausted. Release the button before lifting another rock.');
  }
  let panel = document.getElementById('earth-control-status');
  if (!panel && control.active) {
    panel = document.createElement('div');
    panel.id = 'earth-control-status';
    panel.setAttribute('aria-label', 'Earth staff control');
    document.body.append(panel);
  }
  if (panel) {
    panel.hidden = !control.active;
    const a = control.active;
    if (a) panel.textContent = a.phase === 'held'
      ? `Earth control · ${a.config.material} · ${Math.max(0, a.config.duration - a.elapsed).toFixed(1)}s\nMove your aim to steer · release to drop`
      : 'Rock falling';
  }
}

function stepSimulation(deltaSeconds) {
  state.elapsed += deltaSeconds;
  updatePlayerStatuses(deltaSeconds);
  updateMovement(deltaSeconds);
  updateEarthRockControl(deltaSeconds);
  updateFlamingTargets(deltaSeconds);
  tickFactionIncome(state, deltaSeconds, { factionIncome: !world.persistence.online });
  if (!world.persistence.online) tickCouriers(state, deltaSeconds);
  tickEvent(state, deltaSeconds);
  if (tickLoreSystem(state)) markPersistenceDirty();
  updateWorld(deltaSeconds);
}

function updatePlayerStatuses(dt) {
  if (state.player.dead) playerStatuses.clear();
  else playerStatuses.update(dt, (damage, effect) => {
    damageLocalPlayerTarget({ mesh: world.playerMesh }, damage, 'elemental magic', { unavoidable: true, statusTick: true, sourceName: effect.source || STATUS_EFFECTS[effect.type].name });
    if (state.player.dead) playerStatuses.clear();
  });
  let panel = document.getElementById('player-status-effects');
  if (!panel) {
    panel = document.createElement('div');panel.id='player-status-effects';panel.setAttribute('aria-label','Temporary status effects');document.body.append(panel);
  }
  const text = [...playerStatuses.active.values()].map(effect => `${STATUS_EFFECTS[effect.type].name} · ${Math.ceil(effect.remaining)}s — ${STATUS_EFFECTS[effect.type].description}`).join('\n');
  if (panel.textContent !== text) panel.textContent=text;
  panel.hidden=!text;
}

function updateRaidRoutes() {
  // One shared budget per rendered frame, regardless of combat substep count.
  world.raidRoutePlanner?.step();
}

function updateOutdoorMobVisibility() {
  const frustum = world.mobVisualFrustum ??= new THREE.Frustum();
  const matrix = world.mobVisualMatrix ??= new THREE.Matrix4();
  const sphere = world.mobVisualSphere ??= new THREE.Sphere(new THREE.Vector3(), 18);
  world.camera.updateMatrixWorld();
  frustum.setFromProjectionMatrix(matrix.multiplyMatrices(world.camera.projectionMatrix, world.camera.matrixWorldInverse));
  for (const mob of world.outdoorMonsters) {
    // Interior mobs are cheap in number; retain poses there without mixing
    // local interior coordinates with outdoor camera space.
    if (mob.raidInteriorId) { mob.visualActive = world.sceneMode !== 'outdoor'; continue; }
    sphere.center.copy(mob.mesh.position); sphere.center.y += 5;
    mob.visualActive = world.sceneMode === 'outdoor' && frustum.intersectsSphere(sphere)
      && distance2D(mob.mesh.position, world.camera.position) < WORLD_RENDER_DISTANCE;
  }
}

function animate() {
  const rawDeltaSeconds = world.clock.getDelta();
  diagnostics.profiler.begin(document.hidden ? 0 : rawDeltaSeconds);
  const previousElapsed = state.elapsed;
  updatePersistence(Math.max(0, rawDeltaSeconds));
  updateHeldItemVisuals();
  updateOutdoorMobVisibility();
  const steps = simulationSteps(rawDeltaSeconds);
  for (const step of steps) {
    if (diagnostics.profiler.current) diagnostics.profiler.current.steps++;
    stepSimulation(step);
  }
  updateRaidRoutes();

  if (Math.floor(state.elapsed * 2) !== Math.floor(previousElapsed * 2)) {
    refreshUi();
  }

  updateFrameVisuals(steps.reduce((sum, step) => sum + step, 0));
  const earthCast = world.earthMagic?.active;
  if (earthCast?.phase === 'held') {
    const staff = world.heldItems[earthCast.hand]?.mesh;
    const arm = world.playerRig?.[earthCast.hand + 'Arm'];
    const target = earthCast.mesh.getWorldPosition(new THREE.Vector3());
    target.y += earthCast.centerHeight;
    const tip = poseEarthStaff(arm, staff, target, Math.min(1, earthCast.elapsed / .25));
    if (tip) {
      earthCast.effect.tip.position.copy(earthCast.effect.root.worldToLocal(tip));
      earthCast.effect.tip.visible = true;
    }
  }
  updateFireStaff(steps.reduce((sum, step) => sum + step, 0));
  updateWorldRenderDistance();
  updateEntityStatusVisibility();
  minimap.update(state.elapsed);
  world.cameraOcclusion.update(world.camera, world.playerMesh.position, !world.outpostTower.active, world.sceneMode !== "outdoor");
  world.worldLabels.update(world.scene, world.camera,
    world.cameraMenuSuspended ? null : document.pointerLockElement === canvas
      ? new THREE.Vector2(0, 0) : getEntityStatusHoverNdc());
  world.renderer.render(world.scene, world.camera);
  if (!ui.inventoryPanel.classList.contains("is-hidden")) {
    inventoryPreview ??= createInventoryPreview(document.querySelector("#inventory-character-preview"));
    inventoryPreview.render(world.playerMesh);
  }
  world.frames += 1;
  document.body.dataset.renderFrames = String(world.frames);
  updateRenderStats(rawDeltaSeconds);
  diagnostics.profiler.end(world.renderer.info.render);
  diagnostics.paint();
  requestAnimationFrame(animate);
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  world.camera.aspect = width / height;
  world.camera.updateProjectionMatrix();
  world.renderer.setPixelRatio(getRenderPixelRatio(width, height, window.devicePixelRatio));
  world.renderer.setSize(width, height, false);
}

function createChunkedTerrain() {
  const group = new THREE.Group();
  const material = createTerrainMaterial();
  // Retain a shared material for day/night and terrain lamp uniforms.
  group.material = material;
  group.userData.raycastMeshes = [];
  const size = 300;
  for (let z = -TERRAIN_HALF; z < TERRAIN_HALF; z += size) {
    for (let x = -TERRAIN_HALF; x < TERRAIN_HALF; x += size) {
      const tile = new THREE.Group();
      tile.userData.renderBounds = { x:x+size/2, z:z+size/2, radius:Math.SQRT2*size/2, distance:WORLD_RENDER_DISTANCE };
      const shoreline = tileTouchesLake(x, z, size);
      const detailed = new THREE.Mesh(createTerrainTile(x,z,size,shoreline ? 60 : 30,getTerrainHeightAt), material);
      detailed.receiveShadow = true;
      tile.add(detailed);
      if (!shoreline) {
        const coarse = new THREE.Mesh(createTerrainTile(x,z,size,10,getTerrainHeightAt), material);
        coarse.receiveShadow = true;
        tile.add(coarse);
        tile.userData.terrainDetail = { detailed, coarse };
      }
      group.userData.raycastMeshes.push(detailed);
      group.add(tile);
    }
  }
  return group;
}

function raycastTerrain() {
  // Each small mesh rejects the ray with its bounds before testing triangles.
  // Use full detail even when rendered at lower detail to keep targeting stable.
  const previousFar = world.raycaster.far;
  world.raycaster.far = WORLD_RENDER_DISTANCE;
  try {
    const candidates = terrainAimCandidates(world.meshes.terrain.userData.raycastMeshes, world.raycaster.ray, WORLD_RENDER_DISTANCE);
    return world.raycaster.intersectObjects(candidates, false)[0];
  } finally {
    world.raycaster.far = previousFar;
  }
}

function updateWorldRenderDistance() {
  if (world.sceneMode !== "outdoor") return;
  const camera = world.camera.position;
  const forward = world.renderForward ??= new THREE.Vector3();
  world.camera.getWorldDirection(forward);
  for (const object of world.renderChunks) {
    const bounds = object.userData.renderBounds;
    object.visible = isWithinRenderDistance(bounds, camera) && !isBeyondFog(bounds, camera, forward, world.scene.fog.far);
    if (object.visible) updateInstanceDetail(object, camera);
    const detail = object.userData.terrainDetail;
    if (detail) {
      const near = Math.hypot(camera.x-bounds.x,camera.z-bounds.z) < TERRAIN_DETAIL_DISTANCE+bounds.radius;
      detail.detailed.visible = near;
      detail.coarse.visible = !near;
    }
  }
}

function createTerrainMaterial() {
  const roadMask = new THREE.DataTexture(createRoadMask(WORLD_ROUTES, TERRAIN_SIZE), 4096, 4096, THREE.RedFormat);
  roadMask.minFilter = roadMask.magFilter = THREE.LinearFilter;
  roadMask.generateMipmaps = false;
  roadMask.needsUpdate = true;
  const footpathMask = new THREE.DataTexture(createRoadMask(FOOTPATHS, TERRAIN_SIZE, 4096, 1.8), 4096, 4096, THREE.RedFormat);
  footpathMask.minFilter = footpathMask.magFilter = THREE.LinearFilter;
  footpathMask.generateMipmaps = false; footpathMask.needsUpdate = true;
  return new THREE.ShaderMaterial({
    lights: true,
    uniforms: {
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.lights),
      sunDirection: { value: new THREE.Vector3(0, 1, 0) },
      sunColor: { value: new THREE.Color("#fff2d7") },
      sunStrength: { value: 1 },
      shadowAnchor: { value: new THREE.Vector2() },
      hazeNear: { value: 420 },
      hazeFar: { value: 1100 },
      roadMask: { value: roadMask },
      footpathMask: { value: footpathMask },
      grassMap: { value: createGrassTexture() },
      rockMap: { value: createRockTexture() },
      sandMap: { value: createSandTexture() },
      nightAmount: { value: 0 },
      lampCount: { value: 0 },
      lampLights: { value: Array.from({ length: MAX_TERRAIN_LAMP_LIGHTS }, () => new THREE.Vector4(0, 0, 1, 0)) }
    },
    vertexShader: `
      #include <common>
      #include <shadowmap_pars_vertex>
      varying vec2 vUv;
      varying vec3 vNormalWorld;
      varying vec3 vWorldPos;

      void main() {
        vUv = uv;
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vec3 transformedNormal = normalMatrix * normal;
        #include <shadowmap_vertex>
        vWorldPos = worldPosition.xyz;
        vNormalWorld = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      #include <common>
      #include <packing>
      #include <shadowmap_pars_fragment>
      uniform bool receiveShadow;
      #include <shadowmask_pars_fragment>
      uniform vec3 sunDirection;
      uniform vec3 sunColor;
      uniform float sunStrength;
      uniform vec2 shadowAnchor;
      uniform float hazeNear;
      uniform float hazeFar;
      uniform sampler2D roadMask;
      uniform sampler2D footpathMask;
      uniform sampler2D grassMap;
      uniform sampler2D rockMap;
      uniform sampler2D sandMap;
      uniform float nightAmount;
      uniform int lampCount;
      uniform vec4 lampLights[${MAX_TERRAIN_LAMP_LIGHTS}];
      varying vec2 vUv;
      varying vec3 vNormalWorld;
      varying vec3 vWorldPos;

      void main() {
        vec3 normal = normalize(vNormalWorld);
        float edgeDistance = length(vWorldPos.xz);
        float incline = smoothstep(0.045, 0.24, length(normal.xz));
        float highStone = smoothstep(7.5, 12.0, vWorldPos.y) * 0.12;
        float mountainStone = smoothstep(32.0, 90.0, vWorldPos.y) * 0.72;
        float riverbedStone = 0.0;
        float forestBiome = 1.0 - smoothstep(0.35, 1.55, length((vWorldPos.xz - vec2(${BIOME_REGIONS.kingswood.x.toFixed(1)}, ${BIOME_REGIONS.kingswood.z.toFixed(1)})) / vec2(${BIOME_REGIONS.kingswood.radiusX.toFixed(1)}, ${BIOME_REGIONS.kingswood.radiusZ.toFixed(1)})));
        float highlandBiome = 1.0 - smoothstep(0.68, 1.18, length((vWorldPos.xz - vec2(${BIOME_REGIONS.quarryHighlands.x.toFixed(1)}, ${BIOME_REGIONS.quarryHighlands.z.toFixed(1)})) / vec2(${BIOME_REGIONS.quarryHighlands.radiusX.toFixed(1)}, ${BIOME_REGIONS.quarryHighlands.radiusZ.toFixed(1)})));
        float sandAmount = 0.0;
        ${INLAND_LAKES.map(basin => `{
          vec2 delta = vWorldPos.xz - vec2(${basin.x.toFixed(1)}, ${basin.z.toFixed(1)});
          float c = cos(${(-basin.rotation).toFixed(4)}), s = sin(${(-basin.rotation).toFixed(4)});
          vec2 local = vec2(delta.x * c - delta.y * s, delta.x * s + delta.y * c) / vec2(${basin.radiusX.toFixed(1)}, ${basin.radiusZ.toFixed(1)});
          float angle = atan(local.y, local.x);
          float shore = 1.0 + sin(angle * 3.0 + 0.65) * 0.045 + sin(angle * 7.0 - 1.2) * 0.024 + cos(angle * 11.0 + 0.4) * 0.012;
          sandAmount = max(sandAmount, 1.0 - smoothstep(0.78, 1.36, length(local) / shore));
        }`).join("\n")}
        float rockAmount = clamp(incline + highStone + mountainStone + riverbedStone + highlandBiome * 0.26, 0.0, 1.0);
        vec3 grass = texture2D(grassMap, vWorldPos.xz * 0.028).rgb;
        vec3 rock = texture2D(rockMap, vWorldPos.xz * 0.055 + vec2(vWorldPos.y * 0.018, 0.0)).rgb;
        vec3 sand = texture2D(sandMap, vWorldPos.xz * 0.065).rgb;
        vec3 baseColor = mix(grass, rock, rockAmount);
        baseColor = mix(baseColor, baseColor * vec3(0.88, 0.96, 0.86), forestBiome * 0.22);
        baseColor = mix(baseColor, sand, sandAmount * 0.96);

        ${REGIONS.map(region => `baseColor = mix(baseColor, baseColor * vec3(${new THREE.Color(region.color).r.toFixed(3)}, ${new THREE.Color(region.color).g.toFixed(3)}, ${new THREE.Color(region.color).b.toFixed(3)}) * 1.65, (1.0 - smoothstep(0.15, 1.65, length((vWorldPos.xz - vec2(${region.x.toFixed(1)}, ${region.z.toFixed(1)})) / vec2(${region.radiusX.toFixed(1)}, ${region.radiusZ.toFixed(1)})))) * 0.22);`).join("\n")}
        float snow = smoothstep(${SNOW_LINE.toFixed(1)}, ${(SNOW_LINE + 25).toFixed(1)}, vWorldPos.y + sin(vWorldPos.x * 0.05) * 3.0) * smoothstep(0.38, 0.8, normal.y);
        baseColor = mix(baseColor, vec3(0.91, 0.95, 0.98), snow * 0.97);
        float coastAngle = atan(vWorldPos.z, vWorldPos.x);
        float coastRadius = 2300.0 * (1.0 + 0.085 * sin(coastAngle * 3.0 + 0.6) + 0.055 * sin(coastAngle * 5.0 - 1.1) + 0.025 * cos(coastAngle * 9.0));
        float coastalSand = (1.0 - smoothstep(30.0, 145.0, coastRadius - edgeDistance)) * (1.0 - smoothstep(-2.5, 5.0, vWorldPos.y));
        baseColor = mix(baseColor, sand, coastalSand);
        float roadAmount = texture2D(roadMask, (vWorldPos.xz + vec2(${TERRAIN_HALF.toFixed(1)})) / ${TERRAIN_SIZE.toFixed(1)}).r;
        vec3 roadColor = vec3(0.32, 0.25, 0.14) * (0.85 + sand.r * 0.3);
        float footpath = texture2D(footpathMask, (vWorldPos.xz + vec2(${TERRAIN_HALF.toFixed(1)})) / ${TERRAIN_SIZE.toFixed(1)}).r;
        float soilGrain = sin(vWorldPos.x * 1.9 + sin(vWorldPos.z * 2.7)) * sin(vWorldPos.z * 3.3);
        baseColor = mix(baseColor, roadColor * (1.14 + soilGrain * 0.08), footpath * (0.85 + soilGrain * 0.15) * (1.0 - snow) * (1.0 - sandAmount));
        baseColor = mix(baseColor, roadColor, roadAmount);
        vec3 lightDir = normalize(sunDirection);
        float diffuse = max(dot(normal, lightDir), 0.0);
        vec3 sky = vec3(1.0, 0.91, 0.72);
        vec3 ground = vec3(0.2, 0.28, 0.2);
        vec3 hemi = mix(ground, sky, normal.y * 0.5 + 0.5) * 0.62;
        // Shadows remove direct sun/moon light; sky fill and local lamps remain.
        hemi *= mix(vec3(1.0), vec3(0.22, 0.28, 0.42), nightAmount);
        float shadow = getShadowMask();
        vec3 color = baseColor * (hemi + sunColor * diffuse * 0.88 * sunStrength * shadow);
        float lampAmount = 0.0;
        for (int i = 0; i < ${MAX_TERRAIN_LAMP_LIGHTS}; i++) {
          if (i >= lampCount) break;
          vec4 lamp = lampLights[i];
          float range = max(lamp.z, 0.001);
          float distanceToLamp = length(vWorldPos.xz - lamp.xy);
          float normalizedDistance = clamp(distanceToLamp / range, 0.0, 1.0);
          float edgeFade = smoothstep(1.0, 0.0, normalizedDistance);
          float falloff = edgeFade / (1.0 + edgeFade * 0.65);
          lampAmount += falloff * lamp.w;
        }
        lampAmount = clamp(lampAmount, 0.0, 0.95);
        vec3 lampColor = vec3(1.0, 0.62, 0.28);
        color += lampColor * lampAmount * (0.18 + nightAmount * 0.48);
        float haze = smoothstep(hazeNear, hazeFar, distance(cameraPosition, vWorldPos));
        color = mix(color, mix(vec3(0.62, 0.70, 0.73), vec3(0.055, 0.07, 0.10), nightAmount), haze);
        gl_FragColor = vec4(color, 1.0);
      }
    `
  });
}

function getTerrainHeightAt(x, z) {
  let height = getNaturalHeight(x, z);
  // Broad, level foundations blend into the hills; doors and courtyards stay usable.
  for (const landmark of TERRAIN_FOUNDATIONS) {
    const d = Math.hypot(x - landmark.position.x, z - landmark.position.z);
    // Include the vertices of a coarse 30m terrain cell beyond the castle
    // apron, so interpolated triangles cannot rise through its flat paving.
    const radius = landmark.id === LIBRARY_ID ? 78 : CASTLES.some(castle => castle.id === landmark.id) ? CASTLE_FOUNDATION_RADIUS + 45 : 52;
    if (d < radius + 50) {
      const blend = 1 - smoothstep(radius, radius + 50, d);
      height = THREE.MathUtils.lerp(height, landmark.height, blend);
    }
  }
  for (const basin of INLAND_LAKES) {
    const distance = lakeDistance(x, z, basin);
    if (distance >= basin.bankScale) continue;
    const bed = THREE.MathUtils.lerp(basin.bedHeight, basin.waterHeight - 0.14, smoothstep(0.5, basin.surfaceScale, distance));
    height = THREE.MathUtils.lerp(bed, height, smoothstep(basin.surfaceScale, basin.bankScale, distance));
  }
  return height;
}

function getInlandLakeDistance(x, z) {
  return Math.min(...INLAND_LAKES.map(basin => lakeDistance(x, z, basin)));
}

function getInlandLakeShoreScale(angle) {
  return shoreScale(angle);
}

function isPositionInInlandLake(position) {
  return world.sceneMode === "outdoor" &&
    getInlandLakeDistance(position.x, position.z) < INLAND_LAKE.surfaceScale;
}

function getTerrainGrassAmountAt(x, z) {
  if (getInlandLakeDistance(x, z) < 1.34) {
    return 0;
  }

  const sample = 1.6;
  const height = getTerrainHeightAt(x, z);
  if (height > SNOW_LINE - 8 || distanceToCoast(x,z) < 80) return 0;
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

function createLakeWaterTexture() {
  const size = 256;
  const canvasTexture = document.createElement("canvas");
  canvasTexture.width = size;
  canvasTexture.height = size;
  const context = canvasTexture.getContext("2d");
  const image = context.createImageData(size, size);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const normalizedX = ((x + 0.5) / size - 0.5) * 2;
      const normalizedY = ((y + 0.5) / size - 0.5) * 2;
      const radius = Math.hypot(normalizedX, normalizedY);
      const edgeFade = 1 - smoothstep(0.86, 1, radius);
      const wave =
        Math.sin(x * 0.18 + y * 0.07) * 0.5 +
        Math.sin(x * 0.055 - y * 0.14 + 1.7) * 0.35 +
        Math.sin((x + y) * 0.035 - 0.8) * 0.15;
      const shallowAmount = smoothstep(0.48, 0.96, radius);
      const index = (y * size + x) * 4;

      image.data[index] = Math.round(22 + shallowAmount * 27 + wave * 5);
      image.data[index + 1] = Math.round(111 + shallowAmount * 35 + wave * 8);
      image.data[index + 2] = Math.round(145 + shallowAmount * 34 + wave * 10);
      image.data[index + 3] = Math.round(clamp(edgeFade * (0.78 + wave * 0.045), 0, 1) * 255);
    }
  }

  context.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvasTexture);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createSandTexture() {
  const canvasTexture = document.createElement("canvas");
  canvasTexture.width = 512;
  canvasTexture.height = 512;
  const context = canvasTexture.getContext("2d");
  context.fillStyle = "#c9aa6c";
  context.fillRect(0, 0, 512, 512);

  for (let index = 0; index < 5200; index += 1) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const radius = 0.35 + Math.random() * 1.45;
    const lightness = 48 + Math.random() * 24;
    context.fillStyle = `hsla(${34 + Math.random() * 16}, ${34 + Math.random() * 20}%, ${lightness}%, ${0.18 + Math.random() * 0.3})`;

    for (const offsetX of [-512, 0, 512]) {
      for (const offsetY of [-512, 0, 512]) {
        context.beginPath();
        context.arc(x + offsetX, y + offsetY, radius, 0, Math.PI * 2);
        context.fill();
      }
    }
  }

  for (let index = 0; index < 210; index += 1) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    context.strokeStyle = `hsla(34, 30%, ${38 + Math.random() * 18}%, 0.22)`;
    context.lineWidth = 0.8 + Math.random() * 1.5;
    context.beginPath();
    context.arc(x, y, 3 + Math.random() * 9, 0.2, Math.PI * (0.8 + Math.random() * 0.55));
    context.stroke();
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

  document.body.dataset.renderCalls = String(world.renderer.info.render.calls);
  document.body.dataset.renderTriangles = String(world.renderer.info.render.triangles);
  document.body.dataset.renderSize = `${world.renderer.domElement.width}x${world.renderer.domElement.height}`;
  // GPU readback stalls rendering; pixel diagnostics are explicitly opt-in.
  if (!new URLSearchParams(location.search).has("renderDiagnostics")) return;
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

function updateCastleRegeneration(deltaSeconds) {
  const player = { ...state.player, factionId: state.selectedFactionId,
    sceneMode: world.sceneMode, interiorFactionId: world.interiorFactionId };
  const active = isInOwnCastle(player) && player.hp > 0 && player.hp < player.maxHp;
  if (active && !world.multiplayer.enabled) {
    state.player.hp = regenerateHealth(player, deltaSeconds);
    markPlayerPersistenceDue();
  }
  if (!world.regenerationEffect && active) {
    const group = new THREE.Group();
    const material = new THREE.MeshBasicMaterial({ color: 0x76ffab, transparent: true,
      opacity: 0.5, depthWrite: false, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.15, 1.3, 40), material);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.12;
    group.add(ring);
    const geometry = new THREE.SphereGeometry(0.075, 6, 4);
    for (let i = 0; i < 14; i++) group.add(new THREE.Mesh(geometry, material));
    world.playerMesh.add(group);
    world.regenerationEffect = group;
  }
  const effect = world.regenerationEffect;
  if (!effect) return;
  effect.visible = active;
  if (!active) return;
  const pulse = 1 + Math.sin(state.elapsed * 4) * 0.08;
  effect.children[0].scale.set(pulse, pulse, pulse);
  effect.children.slice(1).forEach((particle, index) => {
    const phase = (state.elapsed * 0.45 + index / 14) % 1;
    const angle = index * 2.4 + state.elapsed * 0.6;
    particle.position.set(Math.cos(angle) * 1.05, 0.2 + phase * 4.8, Math.sin(angle) * 1.05);
    particle.scale.setScalar(Math.sin(phase * Math.PI));
  });
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
  context.font = "500 38px Segoe UI, Arial, sans-serif";
  const backgroundWidth = Math.min(492, context.measureText(text).width + 32);
  drawRoundedRect(context, (512 - backgroundWidth) / 2, 30, backgroundWidth, 68, 12, "rgba(8, 9, 8, 0.58)");
  context.fillStyle = color;
  context.font = "500 38px Segoe UI, Arial, sans-serif";
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
  sprite.scale.set(width * 0.3, width * 0.075, 1);
  sprite.center.set(0.5, 0);
  // Keep the whole billboard above its anchor, with extra headroom.
  sprite.addEventListener("added", () => {
    if (!sprite.userData.labelRaised) {
      sprite.position.y += 2.5;
      sprite.userData.labelRaised = true;
    }
  });
  world.worldLabels.register(sprite);
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

function renderFactionChoices() {
  ui.factionCards.innerHTML = `<button class="faction-card" data-faction="unsworn" type="button"><h2>Enter the realm</h2><p>Explore as an unsworn traveller. Find an abandoned castle and hold Space at its throne to found your faction.</p></button>` +
    FACTIONS.filter(f => state.factions[f.id]).map(f => `<button class="faction-card" data-faction="${f.id}" type="button">${flagIcon(f.flag)}<h2>${escapeHtml(f.name)}</h2><p>${escapeHtml(f.summary)}</p><span>Join this faction</span></button>`).join("");
}
function flagIcon(flag) { return `<img class="faction-flag-icon" alt="Faction flag" src="data:image/svg+xml,${encodeURIComponent(flagSvg(flag))}">`; }
function renderFoundingRecords() {
  return Object.values(state.factions).map(f => `<article class="founding-record">${flagIcon(f.flag)}<div><strong>${escapeHtml(f.name)}</strong><p>Founded by King ${escapeHtml(f.founderName)}</p><p>${escapeHtml(f.mission)}</p></div></article>`).join("");
}
function getFlagTexture(flag) {
  const key = JSON.stringify(normalizeFlag(flag));
  if (!heraldryTextures.has(key)) {
    const pixels = flagPixels(flag);
    const texture = new THREE.DataTexture(pixels.data, pixels.width, pixels.height, THREE.RGBAFormat);
    texture.flipY = true;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    texture.colorSpace = THREE.SRGBColorSpace;
    heraldryTextures.set(key, texture);
  }
  return heraldryTextures.get(key);
}
function applyFlagMaterial(mesh, flag) {
  if (!mesh) return;
  const texture = flag ? getFlagTexture(flag) : null;
  mesh.material.color.set(flag ? "#ffffff" : "#6f6a5f");
  if (mesh.material.map !== texture) { mesh.material.map = texture; mesh.material.needsUpdate = true; }
}
function refreshFactionHeraldry() {
  for (const structure of state.structures) {
    applyFlagMaterial(world.meshes.structures.get(structure.id)?.getObjectByName("factionBanner"), state.factions[structure.ownerFactionId]?.flag);
  }
  for (const f of FACTIONS) {
    const group = world.meshes.factions.get(f.id);
    if (!group) continue;
    const banner = group.getObjectByName("castleBanner");
    if (banner) {
      banner.visible = Boolean(state.factions[f.id]);
      if (banner.visible && banner.material.map !== getFlagTexture(f.flag)) {
        banner.material.color.set("#ffffff"); banner.material.map = getFlagTexture(f.flag); banner.material.needsUpdate = true;
      }
    }
    if (group.userData.factionName !== f.name) {
      const old = group.getObjectByName("castleLabel");
      if (old) { old.removeFromParent(); old.material.map?.dispose(); old.material.dispose(); }
      const label = createTextSprite(f.name, f.accent, 50); label.name = "castleLabel"; label.position.set(0,27,0); group.add(label);
      group.userData.factionName = f.name;
    }
  }
  if (!ui.factionSelect.classList.contains("is-hidden")) { renderFactionChoices(); updateHouseNameGate(); }
}
function updateRoyalCape(rig, factionId, crowned, deltaSeconds, motion) {
  if (!rig.royalCape && crowned) rig.royalCape = createRoyalCape(rig.body);
  if (!rig.royalCape) return;
  const faction = state.factions[factionId];
  rig.royalCape.visible = Boolean(crowned && faction);
  if (rig.royalCape.visible) animateRoyalCape(rig.royalCape, motion, deltaSeconds);
  if (faction && rig.royalCape.material.map !== getFlagTexture(faction.flag)) {
    rig.royalCape.material.map = getFlagTexture(faction.flag); rig.royalCape.material.needsUpdate = true;
  }
}
function openFoundingEditor(castleId, editing = false) {
  if (!canUseFactionThrone(state, castleId)) return;
  const dialog = document.querySelector("#founding-dialog");
  const form = dialog.querySelector("form");
  form.reset();
  const patternNames = { cross: "Cross +", saltire: "Saltire X", checked: "Checked", stripes: "Horizontal stripes", tricolour: "Horizontal tricolour", "vertical-tricolour": "Vertical tricolour", chevron: "Chevron", quartered: "Quartered medallion", diamond: "Diamond medallion", canton: "Canton" };
  form.elements.pattern.innerHTML = FLAG_PATTERNS.map(pattern => `<option value="${pattern}">${patternNames[pattern]}</option>`).join("");
  const existing = state.factions[castleId];
  dialog.querySelector("h2").textContent = editing ? "Edit your faction" : "Found a faction";
  dialog.querySelector("form > p").textContent = editing ? "Update your kingdom's name, mission and banner." : "Claim this abandoned castle and become its first king.";
  form.querySelector('[type="submit"]').textContent = editing ? "Save faction changes" : "Found faction & become king";
  dialog.querySelector("[data-cancel]").textContent = editing ? "Cancel" : "Leave throne";
  if (editing && existing) {
    form.elements.name.value = existing.name;
    form.elements.mission.value = existing.mission;
    for (const [key, value] of Object.entries(normalizeFlag(existing.flag))) form.elements[key].value = value;
  }
  const draft = () => ({ name: form.elements.name.value, mission: form.elements.mission.value,
    flag: { pattern: form.elements.pattern.value, background: form.elements.background.value, foreground: form.elements.foreground.value, third: form.elements.third.value, stripes: form.elements.stripes.value } });
  const preview = () => { dialog.querySelector(".flag-preview").innerHTML = flagIcon(draft().flag); form.elements.stripes.disabled = form.elements.pattern.value !== "stripes"; };
  form.oninput = preview;
  setupFlagColours(form, preview);
  dialog.querySelector(".founding-error").textContent = "";
  dialog.oncancel = () => { if (!editing) leaveRulerSeat(); };
  dialog.querySelector("[data-cancel]").onclick = () => { dialog.close(); if (!editing) leaveRulerSeat(); };
  form.onsubmit = async event => {
    event.preventDefault();
    const button = form.querySelector('[type="submit"]'); button.disabled = true;
    try {
      let result;
      if (world.persistence.enabled) {
        await publishLocalPlayer(true);
        const data = await fetchPersistentJson(editing ? "/api/world/update-faction" : "/api/world/found-faction", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...buildPersistentPayload(false), castleId, draft: draft(), seated: world.seatedOnThrone, interiorFactionId: world.interiorFactionId }) });
        result = data;
        if (data.ok) { applyPersistentPayload(data, { includePlayer: true }); state.selectedFactionId = castleId; }
      } else result = (editing ? updateFactionIdentity : foundFaction)(state, castleId, draft(), { castleId: world.interiorFactionId, seated: world.seatedOnThrone });
      if (!result.ok) { dialog.querySelector(".founding-error").textContent = result.message; return; }
      dialog.close(); runAction(result); publishLocalPlayer(true); setRulerPanelOpen(true);
    } catch { dialog.querySelector(".founding-error").textContent = "Could not confirm the claim. Please try again."; }
    finally { button.disabled = false; }
  };
  dialog.onclose = () => queueMicrotask(resumeLockedCameraAfterMenu);
  releaseLockedCameraForMenu();
  preview(); dialog.showModal();
}
