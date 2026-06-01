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

export const FACTIONS = [
  {
    id: "crownwardens",
    name: "Crownwardens",
    color: "#2d6ab3",
    accent: "#e3c65f",
    position: { x: -210, z: -210 },
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
    position: { x: 210, z: -210 },
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
    position: { x: -210, z: 210 },
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
    position: { x: 210, z: 210 },
    safeRadius: 25,
    bufferRadius: 37,
    trait: "Event hunters",
    summary: "An old order drawn to omens, meteors, relic bosses, and rare loot."
  }
];

export const POIS = [
  {
    id: "north-quarry",
    name: "Northwatch Quarry",
    type: "Quarry",
    resourceId: "stone",
    position: { x: -72, z: -118 },
    yield: 4,
    radius: 13
  },
  {
    id: "kingswood",
    name: "Kingswood Camp",
    type: "Lumber Camp",
    resourceId: "wood",
    position: { x: -132, z: 24 },
    yield: 5,
    radius: 14
  },
  {
    id: "millfield",
    name: "Millfield Farms",
    type: "Wheat Field",
    resourceId: "wheat",
    position: { x: 110, z: -84 },
    yield: 6,
    radius: 15
  },
  {
    id: "blackridge",
    name: "Blackridge Mine",
    type: "Iron Mine",
    resourceId: "iron",
    position: { x: 132, z: 52 },
    yield: 3,
    radius: 12
  },
  {
    id: "river-market",
    name: "Rivergate Market",
    type: "Trade Post",
    resourceId: "gold",
    position: { x: 0, z: 130 },
    yield: 18,
    radius: 14
  },
  {
    id: "ebon-hollow",
    name: "Ebon Hollow Dungeon",
    type: "Dungeon",
    resourceId: "gold",
    position: { x: 0, z: 0 },
    yield: 22,
    radius: 16
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
  }
];

export const STRUCTURE_COSTS = Object.fromEntries(
  BUILDING_DEFINITIONS.map((building) => [building.id, building.cost])
);

export const BUILDING_LOOKUP = Object.fromEntries(
  BUILDING_DEFINITIONS.map((building) => [building.id, building])
);

export const WEAPON_STATS = {
  "Empty Hand": { range: 1.35, damage: 6, penetration: 0, frequency: 1.35, speed: 1.25, knockback: 1.2 },
  Dagger: { range: 1.35, damage: 12, penetration: 4, frequency: 1.8, speed: 1.7, knockback: 0.9 },
  Sword: { range: 2, damage: 20, penetration: 7, frequency: 1.25, speed: 1.2, knockback: 1.8 },
  Axe: { range: 1.9, damage: 26, penetration: 11, frequency: 0.95, speed: 0.9, knockback: 3.2 },
  "Long Sword": { range: 2.65, damage: 30, penetration: 10, frequency: 0.9, speed: 0.95, knockback: 2.4 },
  Spear: { range: 3.35, damage: 22, penetration: 9, frequency: 1.05, speed: 1.05, knockback: 2.8 },
  Bow: { range: 10.5, damage: 18, penetration: 5, frequency: 0.85, speed: 0.9, knockback: 1.4 },
  Crossbow: { range: 24, damage: 34, penetration: 14, frequency: 0.48, speed: 0.72, knockback: 4 },
  "Long Bow": { range: 14.5, damage: 26, penetration: 8, frequency: 0.62, speed: 0.78, knockback: 2.2 }
};

export const ARMOR_STATS = {
  Helmet: { slot: "head", defense: 3, resistance: 2, toughness: 4, weight: 0.8 },
  Gloves: { slot: "gloves", defense: 2, resistance: 1, toughness: 3, weight: 0.55 },
  Chestplate: { slot: "chest", defense: 7, resistance: 4, toughness: 8, weight: 1.6 },
  Feet: { slot: "feet", defense: 3, resistance: 2, toughness: 4, weight: 0.9 }
};

export const ITEM_DEFINITIONS = [
  { type: "Dagger", name: "Iron Dagger", category: "Weapon", rarity: "Common", maxDurability: 80 },
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
