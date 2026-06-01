# King of Kingdoms 3D

A browser-based 3D medieval faction prototype with a first playable slice of:

- AoE-style resource trading where each buy raises prices and each sell lowers them.
- Four joinable factions with hubs, safe zones, and tracked faction resources.
- Claimable points of interest that generate wood, stone, wheat, iron, or gold.
- Renown gain from territory, building, depots, couriers, and dynamic events.
- Loot durability and hub repairs.
- Destructible player outposts and resource depots.
- Outposts periodically fire on nearby PvE mobs and players whose faction is marked as an enemy.
- Depot camel couriers that move gathered resources back to the faction hub.
- Dynamic events with one-off generated loot.
- Weapons are a subset of items with range, damage, penetration, frequency, speed, and durability.
- Armor can now appear as helmets, gloves, chestplates, and feet pieces, with material-driven defense, resistance, toughness, weight, and durability.
- Defined item types include dagger, sword, axe, long sword, spear, bow, crossbow, long bow, shield, long shield, helmet, gloves, chestplate, and feet armor.

## Run

Install dependencies once if `node_modules` is missing:

From this folder:

```powershell
npm install
npm start
```

Then open:

```text
http://localhost:5173
```

Use the LAN URL printed by `npm start` when joining from another computer on the same network. The Node server provides the multiplayer API; a plain static file server will not sync other players.

Dungeon PvE mobs are enabled by default. Add `?pve=false` to the URL to turn off the dungeon enemies and outdoor dungeon monster spawns, or use `?pve=true` to force them on.

## Play

- Pick a faction banner to start at that faction hub.
- Move in the 3D world with WASD or arrow keys. Press Space to jump, then press Space while airborne to dive.
- Drag with the middle mouse button to rotate the free camera. Double middle-click to toggle an over-the-shoulder locked third-person camera with a centered crosshair.
- Use the command panel to buy and sell resources, claim nearby POIs, and resolve dynamic events.
- Press B to open the build menu for depots, outposts, and walls. Choose Place, rotate the translucent preview with the mouse wheel, then left-click to build. Hold Space near a friendly depot to store resources or unequipped items for its automatic camel courier.
- In Gear, double left-click an item to equip it in your left hand, or double right-click it to equip it in your right hand.
- Equipped items are shown on the character's left and right hand in the 3D scene.
- Single-click a Gear item to inspect its stats. Click in the world with a weapon equipped to attack with that hand.
- Players on the same Node server can see each other in the world and damage each other with melee or ranged attacks.

## Database Persistence

The Node server reads `data/db-uri.json` by default and uses `dev_address` unless `KOK_DB_TARGET=prod` or `NODE_ENV=production` is set. You can also override it with `KOK_DATABASE_URL` or `DATABASE_URL`.

On startup/use, the server creates:

```text
kok_world_state      Shared market, faction vaults, POI ownership, structures, couriers, and events
kok_player_state     Per-player faction, resources, inventory, equipment, position, gold, and renown
```

If PostgreSQL is unavailable, the app keeps running with in-memory persistence and logs a warning.

## Project Layout

```text
index.html          App shell and import map
styles.css          Responsive medieval HUD and faction selection
src/game-data.js    Factions, resources, POIs, event templates, build costs
src/economy.js      Dynamic buy/sell market logic
src/state.js        Gameplay state mutations and simulation ticks
src/main.js         Three.js scene, input, UI wiring, and render loop
server.mjs          Static app server plus lightweight multiplayer state and PvP damage API
```

## Next Good Milestones

1. Expand server-authoritative actions for trades, buildings, politics, and event resolution.
2. Replace prototype meshes with authored medieval models and animation clips.
3. Add combat, damage types, arrows, blocking, and siege tools.
4. Build admin tools for inspecting and repairing persisted world/player state.
5. Build an admin-tunable event table for bosses, meteors, rare loot, and seasonal objectives.
