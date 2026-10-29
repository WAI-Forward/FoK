export const RESOURCE_TYPES = [
  {
    id: "wood",
    name: "Wood",
    color: "#8f5f32",
    baseBuy: 34,
    baseSell: 24,
    floor: 8,
    ceiling: 145,
    volatility: 2.8
  },
  {
    id: "stone",
    name: "Stone",
    color: "#9aa0a4",
    baseBuy: 46,
    baseSell: 33,
    floor: 12,
    ceiling: 180,
    volatility: 3.4
  },
  {
    id: "wheat",
    name: "Wheat",
    color: "#d8b955",
    baseBuy: 26,
    baseSell: 18,
    floor: 6,
    ceiling: 110,
    volatility: 2.2
  },
  {
    id: "iron",
    name: "Iron",
    color: "#6f7785",
    baseBuy: 78,
    baseSell: 55,
    floor: 24,
    ceiling: 280,
    volatility: 4.6
  }
];

// Outdoor landmarks use human-scale buildings now, so the crownlands need
// enough breathing room for those compounds and the roads between them.
export const OUTDOOR_WORLD_SCALE = 5;

export const FACTIONS = [
  {
    id: "crownwardens",
    name: "Crownwardens",
    color: "#2d6ab3",
    accent: "#e3c65f",
    position: { x: -1320, z: -850 },
    safeRadius: 26,
    bufferRadius: 38,
    trait: "Fortified markets",
    summary: "A disciplined realm of stone keeps, armored patrols, and steady trade."
  },
  {
    id: "ironvale",
    name: "Ironvale Clans",
    color: "#a94335",
    accent: "#cfc3aa",
    position: { x: 1130, z: -1020 },
    safeRadius: 24,
    bufferRadius: 36,
    trait: "Forge advantage",
    summary: "Hard mountain lords who turn ore and renown into battlefield pressure."
  },
  {
    id: "verdant",
    name: "Verdant Concord",
    color: "#347f4f",
    accent: "#ecd081",
    position: { x: -1120, z: 1060 },
    safeRadius: 25,
    bufferRadius: 37,
    trait: "Harvest economy",
    summary: "A woodland alliance that expands through lumber, wheat, and fast outposts."
  },
  {
    id: "ashen",
    name: "Ashen Covenant",
    color: "#5b477f",
    accent: "#d88b4a",
    position: { x: 1270, z: 1070 },
    safeRadius: 25,
    bufferRadius: 37,
    trait: "Event hunters",
    summary: "An old order drawn to omens, meteors, relic bosses, and rare loot."
  }
];

export const POIS = [
  {
    "id": "grand-library",
    "name": "The Grand Library",
    "type": "Library",
    "resourceId": null,
    "position": {
      "x": 0,
      "z": 0
    },
    "yield": 0,
    "radius": 36
  },
  {
    "id": "north-quarry",
    "name": "Northwatch Quarry",
    "type": "Quarry",
    "resourceId": "stone",
    "position": {
      "x": -620,
      "z": -1120
    },
    "yield": 4,
    "radius": 36
  },
  {
    "id": "kingswood",
    "name": "Kingswood Camp",
    "type": "Lumber Camp",
    "resourceId": "wood",
    "position": {
      "x": -1380,
      "z": 80
    },
    "yield": 5,
    "radius": 36
  },
  {
    "id": "millfield",
    "name": "Millfield Farms",
    "type": "Wheat Field",
    "resourceId": "wheat",
    "position": {
      "x": -260,
      "z": 1050
    },
    "yield": 6,
    "radius": 36
  },
  {
    "id": "blackridge",
    "name": "Blackridge Mine",
    "type": "Iron Mine",
    "resourceId": "iron",
    "position": {
      "x": 1450,
      "z": -190
    },
    "yield": 3,
    "radius": 36
  },
  {
    "id": "river-market",
    "name": "Sunmere Market",
    "type": "Trade Post",
    "resourceId": "gold",
    "position": {
      "x": 930,
      "z": 1140
    },
    "yield": 18,
    "radius": 36
  },
  {
    "id": "ebon-hollow",
    "name": "Ebon Hollow Dungeon",
    "type": "Dungeon",
    "resourceId": "gold",
    "position": {
      "x": -260,
      "z": -740
    },
    "yield": 22,
    "radius": 36
  },
  {
    "id": "thornroot-depths", "name": "Thornroot Depths", "type": "Dungeon",
    "resourceId": "gold", "position": { "x": -1240, "z": 800 }, "yield": 22, "radius": 36
  },
  {
    "id": "ashen-vault", "name": "Ashen Vault", "type": "Dungeon",
    "resourceId": "gold", "position": { "x": 1200, "z": 850 }, "yield": 22, "radius": 36
  },
  {
    "id": "pale-cut",
    "name": "Pale Cut Quarry",
    "type": "Quarry",
    "resourceId": "stone",
    "position": {
      "x": 570,
      "z": -950
    },
    "yield": 4,
    "radius": 36
  },
  {
    "id": "redstone",
    "name": "Redstone Quarry",
    "type": "Quarry",
    "resourceId": "stone",
    "position": {
      "x": 1660,
      "z": 360
    },
    "yield": 4,
    "radius": 36
  },
  {
    "id": "mosswood",
    "name": "Mosswood Timberyard",
    "type": "Lumber Camp",
    "resourceId": "wood",
    "position": {
      "x": -1740,
      "z": -360
    },
    "yield": 5,
    "radius": 36
  },
  {
    "id": "willow-rest",
    "name": "Willowrest Camp",
    "type": "Lumber Camp",
    "resourceId": "wood",
    "position": {
      "x": -720,
      "z": 730
    },
    "yield": 5,
    "radius": 36
  },
  {
    "id": "amberfield",
    "name": "Amberfield Grange",
    "type": "Wheat Field",
    "resourceId": "wheat",
    "position": {
      "x": 160,
      "z": 1470
    },
    "yield": 6,
    "radius": 36
  },
  {
    "id": "windmere",
    "name": "Windmere Farms",
    "type": "Wheat Field",
    "resourceId": "wheat",
    "position": {
      "x": -1110,
      "z": 1530
    },
    "yield": 6,
    "radius": 36
  },
  {
    "id": "frostvein",
    "name": "Frostvein Mine",
    "type": "Iron Mine",
    "resourceId": "iron",
    "position": {
      "x": 230,
      "z": -1530
    },
    "yield": 3,
    "radius": 36
  },
  {
    "id": "cinder-vein",
    "name": "Cindervein Mine",
    "type": "Iron Mine",
    "resourceId": "iron",
    "position": {
      "x": 1130,
      "z": 410
    },
    "yield": 3,
    "radius": 36
  },
  {
    "id": "wayfarer",
    "name": "Wayfarer Exchange",
    "type": "Trade Post",
    "resourceId": "gold",
    "position": {
      "x": -960,
      "z": -600
    },
    "yield": 18,
    "radius": 36
  },
  {
    "id": "high-pass",
    "name": "Highpass Market",
    "type": "Trade Post",
    "resourceId": "gold",
    "position": {
      "x": 790,
      "z": -480
    },
    "yield": 18,
    "radius": 36
  },
  {
    "id": "salt-meadow",
    "name": "Saltmeadow Farms",
    "type": "Wheat Field",
    "resourceId": "wheat",
    "position": {
      "x": 1340,
      "z": 1510
    },
    "yield": 6,
    "radius": 36
  },
  {
    "id": "elderwood",
    "name": "Elderwood Timberyard",
    "type": "Lumber Camp",
    "resourceId": "wood",
    "position": {
      "x": -1740,
      "z": 870
    },
    "yield": 5,
    "radius": 36
  }
];

export const EVENT_TEMPLATES = [
  {
    id: "meteor",
    name: "Meteor Strike",
    rewardResources: ["iron", "stone"],
    itemRoots: ["Starfallen", "Meteor-Forged", "Skybrand"],
    itemTypes: ["Long Sword", "Axe", "Shield", "Helmet", "Chestplate"],
    danger: 3
  },
  {
    id: "boss",
    name: "Warlord Challenge",
    rewardResources: ["gold", "iron"],
    itemRoots: ["Oathbreaker", "Bannerlord's", "Red Keep"],
    itemTypes: ["Sword", "Bow", "Long Shield", "Chestplate", "Gloves"],
    danger: 4
  },
  {
    id: "caravan",
    name: "Lost Caravan",
    rewardResources: ["wood", "wheat", "gold"],
    itemRoots: ["Wayfarer's", "Silk Road", "Sunmarked"],
    itemTypes: ["Dagger", "Crossbow", "Long Bow", "Gloves", "Feet"],
    danger: 2
  }
];

export const BUILDING_DEFINITIONS = [
  {
    id: "depot",
    name: "Depot",
    description:
      "Stores gathered resources in the wildlands. Each depot maintains a camel courier that walks between the depot and its faction hub, hauling stored resources into the faction vault.",
    cost: { wood: 35, stone: 25, wheat: 10, iron: 0 },
    maxHp: 240,
    renown: 12
  },
  {
    id: "outpost",
    name: "Outpost",
    description:
      "A faction watchtower. Friendly players can hold Space nearby to climb into the tower and fire a bow from a first-person vantage point. It also periodically fires at nearby PvE mobs and players from factions marked as enemies.",
    cost: { wood: 25, stone: 10, wheat: 0, iron: 0 },
    maxHp: 180,
    renown: 8
  },
  {
    id: "wall",
    name: "Wall",
    description:
      "A simple defensive barrier that blocks players from passing through it and can be destroyed by sustained attacks.",
    cost: { wood: 18, stone: 32, wheat: 0, iron: 4 },
    maxHp: 300,
    renown: 5
  },
  {
    id: "street-lamp",
    name: "Street Lamp",
    description:
      "A medieval roadside lantern. It stays dark during the day, then burns warmly through the night to light nearby paths and defenses.",
    cost: { wood: 12, stone: 6, wheat: 0, iron: 3 },
    maxHp: 90,
    renown: 3
  }
];

export const STRUCTURE_COSTS = Object.fromEntries(
  BUILDING_DEFINITIONS.map((building) => [building.id, building.cost])
);

export const BUILDING_LOOKUP = Object.fromEntries(
  BUILDING_DEFINITIONS.map((building) => [building.id, building])
);

export const WEAPON_STATS = {
  "Empty Hand": { range: 1.85, damage: 4, penetration: 0, frequency: 1.35, speed: 1.25, knockback: 3.6 },
  Dagger: { range: 1.35, damage: 17, penetration: 6, frequency: 2, speed: 1.85, knockback: 0.5 },
  Sword: { range: 2.75, damage: 20, penetration: 7, frequency: 1.4, speed: 1.3, knockback: 1.8 },
  Axe: { range: 3.1, damage: 29, penetration: 11, frequency: 0.95, speed: 0.9, knockback: 5.2 },
  Flail: { range: 3.4, damage: 27, penetration: 12, frequency: 0.85, speed: 1, knockback: 3.8 },
  "Long Sword": { range: 2.65, damage: 30, penetration: 10, frequency: 0.9, speed: 0.95, knockback: 2.4 },
  Spear: { range: 5.25, damage: 22, penetration: 9, frequency: 1.05, speed: 1.05, knockback: 3.6 },
  Bow: { range: 28, damage: 18, penetration: 5, frequency: 0.85, speed: 0.9, knockback: 1.4 },
  Crossbow: { range: 24, damage: 34, penetration: 14, frequency: 0.48, speed: 0.72, knockback: 4 },
  "Long Bow": { range: 60, damage: 26, penetration: 8, frequency: 0.62, speed: 0.78, knockback: 2.2 }
};

export const ARMOR_STATS = {
  Helmet: { slot: "head", defense: 3, resistance: 2, toughness: 4, weight: 0.8 },
  Gloves: { slot: "gloves", defense: 2, resistance: 1, toughness: 3, weight: 0.55 },
  Chestplate: { slot: "chest", defense: 7, resistance: 4, toughness: 8, weight: 1.6 },
  Feet: { slot: "feet", defense: 3, resistance: 2, toughness: 4, weight: 0.9 }
};

export const ITEM_DEFINITIONS = [
  { type: "Dagger", name: "Iron Dagger", category: "Weapon", rarity: "Common", maxDurability: 80 },
  { type: "Flail", name: "Iron Chain Flail", category: "Weapon", rarity: "Uncommon", maxDurability: 105 },
  { type: "Sword", name: "Militia Sword", category: "Weapon", rarity: "Common", maxDurability: 100 },
  { type: "Axe", name: "Border Axe", category: "Weapon", rarity: "Common", maxDurability: 105 },
  { type: "Long Sword", name: "Knight Long Sword", category: "Weapon", rarity: "Uncommon", maxDurability: 118 },
  { type: "Spear", name: "Ashwood Spear", category: "Weapon", rarity: "Common", maxDurability: 95 },
  { type: "Bow", name: "Yew Bow", category: "Weapon", rarity: "Common", maxDurability: 90 },
  { type: "Crossbow", name: "Guard Crossbow", category: "Weapon", rarity: "Uncommon", maxDurability: 96 },
  { type: "Long Bow", name: "Ranger Long Bow", category: "Weapon", rarity: "Uncommon", maxDurability: 100 },
  { type: "Helmet", name: "Leather Helmet", category: "Armor", rarity: "Common", maxDurability: 90 },
  { type: "Gloves", name: "Leather Gloves", category: "Armor", rarity: "Common", maxDurability: 75 },
  { type: "Chestplate", name: "Leather Chestplate", category: "Armor", rarity: "Common", maxDurability: 120 },
  { type: "Feet", name: "Leather Boots", category: "Armor", rarity: "Common", maxDurability: 85 },
  { type: "Shield", name: "Round Shield", category: "Armor", rarity: "Common", maxDurability: 125 },
  { type: "Long Shield", name: "Tower Long Shield", category: "Armor", rarity: "Uncommon", maxDurability: 150 }
];

export const RESOURCE_LOOKUP = Object.fromEntries(
  RESOURCE_TYPES.map((resource) => [resource.id, resource])
);

export const FACTION_LOOKUP = Object.fromEntries(
  FACTIONS.map((faction) => [faction.id, faction])
);
