# Fate of Kingdoms

A browser-based 3D medieval faction prototype with a first playable slice of:

- AoE-style resource trading where each buy raises prices and each sell lowers them.
- Four abandoned castles: players found their own named factions at the thrones, with custom flags and mission statements. Founders become kings with crowns and heraldic capes.
- Claimable points of interest that generate wood, stone, wheat, iron, or gold.
- A roughly 4â€“5 km island with an irregular coastline, winding roads, and six regions: Scriptorium Vale, Kingswood Wilds, Frostspine, Ashen Marches, Amberfields, and Sunmere Coast. Walking across the island takes approximately four minutes before detours; sprinting is faster.
- Snow accumulates above 72 m, with rocky mountain slopes, alpine conifers, forests, cultivated fields, palms, a wadeable lake, and sandy shores. Thousands of scenery objects share instanced rendering batches.
- Nineteen named landmarks, including repeated quarries, mines, lumber camps, farms, and markets. Resource sites have matching interiors and surrounding scenery. Twelve separate named enemy camps begin populated and replenish locally. During the day, enemies stay leashed to their camps. At night, camps and abandoned castles support six mobs per source and send unleashed raiders toward the nearest claimed POI or occupied castle. Raiders reclaim POIs for the wilderness after an uninterrupted flag hold; castle raiders enter the keep and fight defenders without dissolving the faction. Abandoned-castle spawns stop when a faction is founded there, and their mobs disappear at dawn.
- The neutral Grand Library stands at the centre: twin archive towers outside, bookshelves and reading tables inside, and a large wall scroll displaying the continuously generated history.
- Renown measures written chapter appearances. Territory, construction and combat grant separate prowess.
- Loot durability and hub repairs.
- Two PvE mob classes: common unarmed creatures with articulated limb attacks, and rarer, tougher humanoid raiders that carry droppable weapons and armour. Both classes drop small amounts of gold.
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

- Enter an A-Z house name and enter the realm as an unsworn traveller, or join an already founded faction. Hold Space near an abandoned castle to enter, approach the throne, and hold Space to open the founding editor. Choose a name, mission, two colours and a cross, saltire, checked or 2–8 stripe flag. Founding immediately crowns you and raises your flag over the castle. Unsworn travellers can also join an existing kingdom at its throne.
- Click Faction or press F to review faction members, resources, and ruler-controlled relations with other factions.
- Click House or press H to review your house members and set other known houses as Ally, Neutral, or Enemy.
- Move in the 3D world with WASD or arrow keys. Press Space to jump; your takeoff trajectory is fixed while airborne, and double-tap Space within 0.3 seconds to dodge roll in your movement direction (or facing direction when still). The forward tumble briefly evades local melee/projectile damage, with vulnerable takeoff and recovery and a short cooldown.
- Jumping blends knee tuck and arm lift over the current walk/run stride, then eases back through a short landing compression. Weapon attack poses retain priority.
- POIs are full-scale building compounds: walk around their exteriors and hold Space at the marked front door to enter.
- Gather stone, wood, wheat, and iron at the labelled outdoor workbench beside each resource building. Stand close and aim at the bench while holding left or right click with an empty hand; holding both with free hands works faster. Moving away or aiming off the bench stops work. Markets have no workstation and cannot be clicked for gold; trading and passive faction income remain available.
- Drag with the middle mouse button to rotate the free camera. Double middle-click to toggle an over-the-shoulder locked third-person camera with a centered crosshair.
- Trees, rocks, buildings, and interior walls between the camera and player become see-through in a softly edged area around the player. The effect follows both camera modes automatically, using dithered transparency to preserve instanced scenery performance. Characters and the ground beneath your feet remain solid.
- Use the command panel to buy and sell resources, claim nearby POIs, and resolve dynamic events.
- Visit the Grand Library at the centre of the island. Hold Space at its south door to enter, then approach the wall scroll at the far end and hold Space to read the story so far. Escape closes the parchment. Press L anywhere for the existing chronicle view.
- The chronicle starts with a scene-setting opening, then appends completed batches of player kills, rulers taking thrones, ruler kills, and POI captures into one continuing story. Founding a faction immediately writes a volume naming the first king and recording the mission; its flag appears in the lore book. The mission is included in the history-generation prompt and ongoing story.
- Restart the Node server after this faction update, then reload clients. Castle IDs and locations remain stable; old premade faction selections no longer grant membership. Player-founded factions, heraldry and founding history persist in world snapshots. Claims are serialized on the server so a contested castle has one founder.
- Press B to open the build menu for depots, outposts, and walls. Choose Place, rotate the translucent preview with the mouse wheel, then left-click to build. Hold Space near a friendly depot to store resources or unequipped items for its automatic camel courier.
- In Gear, double left-click an item to equip it in your left hand, or double right-click it to equip it in your right hand.
- Equipped items are shown on the character's left and right hand in the 3D scene.
- Single-click a Gear item to inspect its stats. Click in the world with a weapon equipped to attack with that hand.
- Socketed equipment is named with its element, for example `Mithril Staff of Earth`, including items from existing saves. With an earth-gem staff equipped, aim at an outdoor landscape rock within 45 units and hold that hand's mouse button to lift and steer it. Release to drop it; a countdown shows the remaining control time. Bronze/Iron/Steel/Mithril/Adamant allow 4/7/10/14/18 seconds respectively, with progressively faster steering. Changing equipment, opening a menu, losing focus, or running out of time releases the rock. Death or leaving the outdoor scene restores an airborne rock safely. Rock movement is local to the current session; it is not saved or synchronized between players yet.
- Players on the same Node server can see each other in the world and damage each other with melee or ranged attacks.
- After updating the map, restart the Node server and reload clients so all players use the same landmark coordinates. Existing POI ownership and written history are retained by ID; newly added sites start neutral. Player-built structures stay at their saved coordinates.

## Database Persistence

The Node server reads `data/db-uri.json` by default and uses `dev_address` unless `KOK_DB_TARGET=prod` or `NODE_ENV=production` is set. You can also override it with `KOK_DATABASE_URL` or `DATABASE_URL`.

On startup/use, the server creates:

```text
kok_world_state      Shared market, faction vaults, POI ownership, structures, couriers, and events
kok_player_state     Per-player faction, resources, inventory, equipment, position, gold, and renown
```

If no PostgreSQL address is configured, saves are written atomically to `data/realm-save.json`. If a configured database is unavailable, loading and saving fail visibly; the game does not substitute a blank save.

## Project Layout

### Blender player character

Players use a Blender-authored **villager** with a plain linen tunic, brown wool
trousers, simple leather shoes, bare hands, and an uncovered head. No armor is
baked into the base character; inventory armor is added on top when equipped.
The GLB loads automatically for local and remote players. It uses the existing
combat joints, hand sockets, and equipment system; it does not alter armor stats.
If the asset cannot load, the prototype character remains playable.

- Editable source: `assets/characters/villager.blend`
- Runtime asset: `assets/characters/villager.glb`
- Studio render: `assets/characters/villager-preview.png`
- Rebuild: `blender --background --python tools/build-warrior.py`
- Integration: `src/warrior-model.js`; validation: `npm test`

The model uses articulated body sections rather than skin weights.
Clothing follows the joints; cloth simulation is not enabled.

```text
index.html          App shell and import map
styles.css          Responsive medieval HUD and faction selection
src/game-data.js    Factions, resources, POIs, event templates, build costs
src/world-layout.js Shared coastline, terrain, biomes, camp placement and road routes
src/world-art.js    Grand Library, instanced vegetation and themed landmark scenery
src/economy.js      Dynamic buy/sell market logic
src/state.js        Gameplay state mutations and simulation ticks
src/main.js         Three.js scene, input, UI wiring, and render loop
server.mjs          Static app server plus lightweight multiplayer state and PvP damage API
```

## World rendering performance

Terrain uses 300-unit tiles with 10-unit sampling nearby and 30-unit sampling at distance. Scenery batches are partitioned into 240-unit chunks. Terrain and landmarks have a 1,200-unit visibility budget (including overlapping chunk bounds), with fog obscuring the cutoff; grass uses a 220-unit budget. These limits do not shrink the playable world or stop distant gameplay simulation.

Over-the-shoulder terrain aiming uses bounded tile raycasts against full-detail geometry, including tiles currently drawn at lower detail. Static scenery collision searches use a spatial grid. Shadows follow the player within a local volume, and the renderer caps pixel ratio at 1.5.

Tune distances in `src/world-performance.js`. Live draw counts are exposed as `document.body.dataset.renderCalls` and `renderTriangles`. Expensive pixel readback diagnostics are disabled unless the URL includes `?renderDiagnostics`.

## Next Good Milestones

1. Expand server-authoritative actions for trades, buildings, politics, and event resolution.
2. Replace prototype meshes with authored medieval models and animation clips.
3. Expand combat with damage types and siege tools.
4. Build admin tools for inspecting and repairing persisted world/player state.
5. Build an admin-tunable event table for bosses, meteors, rare loot, and seasonal objectives.

Kings can sit on their throne and choose **Edit name, flag and mission** in the Factions menu. Changes persist and refresh world banners and royal capes; the original founding volume remains a historical record. World heraldry uses raster pixel textures so checker, cross, saltire and stripe designs render consistently in WebGL.

Captured resource POIs now pay their configured yield directly into the owning faction vault every five seconds: farms produce wheat, quarries stone, lumber camps wood, mines iron and markets gold. Each additional site adds its own production. Faction > Resources shows the total rate and site count. This passive production is independent of the existing worker delivery bonuses and personal dividends. The server owns online production and preserves it across frequent or stale saves.

## Weapon assets and animation review

The eight weapon meshes are authored in `assets/weapons/weapons.blend` and exported as individual GLBs. Rebuild with Blender in background mode using `--python tools/build-weapons.py`. Local origin is the palm grip; melee length follows +Y, ranged aim follows +Z, and bow strings are animated separately from the wooden limbs. The runtime retains procedural geometry if an asset cannot load.

Open `/tools/weapon-preview.html` on the local server to inspect the actual game pose functions without entering or changing a saved game. Select a weapon, scrub progress/draw, and compare both swing directions at Impact. Support-hand grips apply when the other hand is free. Attacks remain procedural so they can follow cursor elevation; the Blender file contains the editable models, not baked character animation clips.

## Weapon combat and defence

Left-click attacks with the left hand; right-click attacks with the right. Repeat clicks queue one follow-up. Alternating buttons queues the other weapon after the committed stroke and preserves each hand's combo position. Pausing resets the pattern; finishers require recovery. Movement slows during committed attacks.

- **Axe:** deliberate crossing sweeps, up to five targets, strong knockback. Slow windup and recovery leave openings.
- **Sword:** diagonal cut, return cut, angled overhead finisher, mirrored by hand. Cleaves up to three targets.
- **Long sword:** two broad cuts and an overhead finisher. Up to four targets and a stronger final hit; a free hand supports the grip.
- **Spear:** probing jab and driving thrust. Only the tip hits, up to five aligned targets per attack; enemies inside the shaft are difficult to hit.
- **Dagger:** quick inward/outward cuts and a high-damage stab. Short reach, one target and little knockback.
- **Flail:** hold the hand’s mouse button to whirl overhead, reaching full power after two seconds. Release for one wide sweep with up to 2.5× damage and 2.6× knockback. A simulated chain lets the iron head lag and swing; only its swept path deals damage. Available in weapon loot and blacksmith stock.
- **Empty hand:** short punches with low damage and strong knockback.
- **Shield / long shield:** hold its hand's mouse button to defend toward your aim. Frontal blocks reduce damage and knockback, and a block raised within 0.18 seconds of impact negates damage at a lower guard cost. Rear attacks bypass defence. Guard depletes on impact and regenerates while lowered; exhaustion breaks guard for 1.4 seconds. Attacking lowers the shield. Both shields are stocked at blacksmiths.

Melee contact is sampled throughout the active stroke against the actual blade, axe edge, spear point or flail head, including skipped frames. Each target can be damaged only once per swing. Windup and recovery do no melee damage. Hips, torso, shoulders, knees and wrists participate in attacks; weapons retain their palm grip and free hands support long weapons. Other players receive attack/guard poses over multiplayer snapshots.

Open `/tools/weapon-preview.html` to play or scrub the live pose functions, select combo steps and either hand, compare offhand equipment, hold to charge the flail, and display contact segments. The flail and shields use procedural meshes; the existing eight Blender weapon assets remain in use. These animations use the existing articulated rig rather than baked Blender clips.

Restart the Node server and reload clients after this update so multiplayer guard and cleave handling are active.

### Combat readability and input refinement

Moving the mouse during a click now keeps the attack. Overlapping left/right
buttons each release their own hand, and one buffered follow-up survives a
short recovery. Alternating weapons keeps each weapon's pattern alive; finishers
complete their recovery before handing control to the other hand.

Subtle world-space ribbons show the same sampled cutting edges used for damage.
Spear and dagger thrusts leave narrow point streaks; flail trails follow the
simulated head. Trails last 0.16 seconds, fade behind the stroke and respect scene
depth. They do not extend weapon reach. Blade contact matches the Blender blade
ends, and descending strokes test the whole target height. Close aim points no
longer flip a blade backward as the hand passes them. Sweeps maintain speed
through impact and all attack joints blend back into the current walking pose.

The weapon preview now includes a training target with adjustable distance,
contact counts, trails and walking. Spear points still require spacing; the shaft
does not deal invisible damage. Start a preview without loading any player saves
with `node tools/serve-preview.mjs`, then visit
`http://localhost:5199/tools/weapon-preview.html`.

`assets/combat-review/combat-review.blend` contains all 12 loadouts in both hands
with the actual runtime joint poses baked over a walking gait (frames 1–181).
These are review animations; gameplay continues to use the cursor-directed
procedural rig. Rebuild with `node tools/export-combat-review.mjs`, then
`blender --background --python tools/build-combat-review.py`.

Melee arms use inward elbow hinges and extended grip targets. Axe cuts carry
through a wider arc, and released flails continue past the aim line. Thrusts
use crossed contact ribbons so they remain visible from different camera angles.
Buffered hand switches leave a short follow-through before blending into the
next attack; cleaving several enemies applies one brief impact slowdown.
The review player's continuous clock avoids range-slider rounding stutter.


## FNM accounts and families

The entry screen offers FNM sign-in/registration or guest play. FNM accounts keep a stable player ID across browsers and server restarts. Choose a family surname once; each new life receives a different first name while retaining the family surname and existing game inheritance rules. Guests choose a first name only, can join or found factions, and continue through a signed browser cookie. Guest and account saves remain separate. Old session-ID saves are retained but are not automatically assigned to accounts because their ownership was never verified.

The game autosaves every four seconds and saves when the page is hidden or the player signs out. Empty inventories, current life, resources, equipment, faction membership, health and outdoor location are restored. Leaving while inside a building resumes outside its entrance. A failed initial load blocks entry so a blank character cannot overwrite an existing save. The account control links to FNM account management. Website embeds open gameplay in the top-level tab when choosing an identity, avoiding third-party cookie restrictions.

Deploy the FoK server and the updated FNM Website together. Configure:

- `FNM_WEBSITE_URL`: FNM origin (production default `https://fieldnotesmedia.uk`; local default `http://localhost:5000`).
- `FNM_GAME_AUTH_SECRET`: the same exchange secret as the website. Also supports `data/fnm-auth.json` with a `secret` field. Development defaults match Clusternauts; production requires an explicit secret.
- `FOK_PUBLIC_URL`: FoK's externally reachable origin, including HTTPS. It must match the website's `FATE_OF_KINGDOMS_URL`; required behind a reverse proxy.
- `KOK_SESSION_SECRET`: a stable random signing secret shared across FoK instances. Without it, a local `data/session-key` is generated. Keep this file private and persistent.
- `KOK_DATABASE_URL` / `DATABASE_URL`: PostgreSQL for production. Existing `kok_player_state` stores the account saves without a schema migration.
- `KOK_DATA_DIR`: writable persistent directory for local saves and the generated session key (default `data`). `KOK_STORAGE=disk` explicitly selects disk persistence for local testing. Disk storage is for a single server with a persistent volume, not ephemeral or multi-instance production hosting.

FoK retains the website's existing tester-only access rule. New FNM accounts must receive tester access before signing into this tester build. Guest access through the game itself remains available. No credentials or server data files are served as static assets.

Validation: `npm test`; website launch tests: `.venv/Scripts/python.exe -m unittest tests.test_app_launch` from the FNM Website directory.

## Cheat commands

Press `/` in the game, enter `imacheater`, then use `/` to reopen the command console. Suggestions include saved players and families, founded factions, and available spawn types. Type part of a name, use Up/Down to select, and Tab (or click) to complete. Enter executes; Escape closes. Unlocking lasts for the current server session.

- `/reset all` restores a fresh realm: all player and family progress, factions, claims, buildings, couriers, dropped loot, market prices, events, world time, and history. Login accounts remain intact. Connected clients reload to clear local mobs, chests, and combat state.
- `/reset factions` or `/reset faction {name}` dissolves kingdoms, releases their POIs, removes their structures/couriers, resets their vaults and diplomacy, and makes members unsworn.
- `/reset bloodlines` (also `/reset families`) or `/reset bloodline {name}` resets family members' progress, removes their surname and family relationships, and makes them unsworn. Accounts remain available.
- `/reset players` or `/reset player {name}` resets saved player progress, equipment, resources, and faction membership while retaining names and accounts.
- `/reset lore` returns the chronicle to its opening and clears recorded volumes and pending events.
- `/spawn weapon {type}` adds a fully durable weapon to your inventory.
- `/spawn building {type}` creates a free faction-owned building nearby; join a faction and go outdoors first.
- `/spawn mob {type}` creates a local PvE enemy nearby outdoors. Available types include gremlin, orc (`org` also works), and the named creature/raider variants. Gremlins and orcs use the existing creature and raider models. PvE must be enabled; mobs are local and are not saved.

Resets affect the shared saved realm, including offline players. Older client saves cannot restore the pre-reset state. Anyone who knows the cheat password can use these commands.
# Wearable armour assets

Player and remote-player equipment uses Blender-authored leather/hide and forged-plate kits in `assets/armour/`. All seven material finishes share cached geometry. Chest armour includes independently mounted shoulders; gloves include wrist-mounted hands; boots include shin-mounted greaves. The inventory preview mirrors the equipped character automatically.

Rebuild with `blender --background --python tools/build-armour.py`. The editable source is `assets/armour/armour.blend`. Run `node tools/serve-preview.mjs` and open `http://127.0.0.1:5199/tools/armour-preview.html` to inspect materials and joint motion. Existing primitive armour remains a loading/error fallback. Item stats and saves are unchanged.



## Library, bloodlines and recorded history

The Grand Library now has treasury charts on the left, history books in the centre, and the event scroll at the far wall. Approach a display and hold Space; L also opens the reader. Castle halls have three archive lecterns in the left aisle at x=-12, showing the castle's family holdings and local events. The reader includes a Bloodlines register, a contents page, and Previous/Next page controls.

The archive persists structured events separately from prose, with resource and membership samples every 60 simulation seconds. One calendar day follows the existing 600-second day/night cycle; months have 30 days and years 12 months. Statistics begin when this version is installed; missing past balances are not fabricated. Earlier template volumes remain readable as legacy books. Records are retained in the existing world save (disk or PostgreSQL); large long-running worlds will eventually need a separate paginated archive store.

A castle retains its identity while successive kingdoms receive separate reign records and historical flags. An × marks the fall of a kingdom. A registered ruler's bloodline inherits the crown first: the same account remains king through each new life, even as the kingdom's only member. The kingdom, claims, structures, couriers and vault survive the interval between death and respawn, and the next named life receives a succession entry in the history. Bloodlines follow account identity, not matching surnames across accounts. Without a bloodline, the crown passes to the surviving member with the most chapter appearances (renown), then earliest join time, then player ID. A ruler without a bloodline or surviving members leaves an abandoned castle: its claims, structures, couriers and vault are cleared. Going offline does not dissolve a kingdom. Registered accounts retain a surname and an entry for each life; guests have first names and no bloodline. Castle family balances are members' last recorded personal holdings, not allocations of the communal vault.

Renown is the number of written chapters that name a player, counted once per chapter. Combat and activity rewards are kept separately as prowess for equipment progression. The existing cheat-console command /reset lore clears the book and renown and starts a new edition from subsequent events; structured history and resource samples remain intact.

For generated narrative, configure OPENAI_API_KEY and FOK_LORE_MODEL on the server, choosing a text model available to your account. No key is sent to browsers. The narrator uses the OpenAI Responses API (https://developers.openai.com/api/docs/guides/text), recorded events, resource samples, preceding chapters and castle/family histories. Generation runs outside the gameplay save queue and is guarded against a concurrent lore reset. Until a narrative is ready, or if generation fails or is unconfigured, a factual chapter remains readable. Model calls have a 12-second timeout and are not automatically retried after a fallback. Live model quality requires testing with your configured account; automated tests use mocked responses.

Restart the game server and reload clients after this update. For a save-free reader demonstration, run node tools/serve-preview.mjs and open /tools/history-preview.html on its localhost port (default 5199).

### Refined mobs and gremlin sizes

Gremlins and orcs use original Blender assets in `assets/characters`, rebuilt with `blender --background --python tools/build-mobs.py`. Their articulated parts retain the existing movement and attack joints. Orcs wear the same material-specific Blender armour and wield the same weapon models as the player; their equipped items remain their kill drops.

Gremlin sizes are rolled for outdoor and dungeon spawns: Small (62%, 0.78 scale, 1x health, 1–4 gold), Large (26%, 1.0 scale, 1.8x health, 5–9 gold), Huge (10%, 1.3 scale, 3.2x health, 12–20 gold), and Colossal (2%, 1.65 scale, 5.5x health, 28–45 gold). Health multipliers apply to the existing creature template. Body collision, natural reach and health-bar height follow size. Dungeon resets retain the rolled size and its rewards. Gremlins carry no equipment. Balance values live in `src/gremlin-scaling.js`.

### Performance diagnostics

Press **Ctrl + `** (backquote, usually below Esc) to toggle the diagnostics overlay. Reload the game after updating. The game keeps running while the overlay is open. Profiling and counter collection stop when it is hidden.

The panel shows a rolling frame-time graph, FPS, average/p95/maximum frame intervals, slow-frame counts, CPU time, simulation substeps, draw calls, triangles, mob/effect/route counts, renderer resource counts, resolution, and JavaScript heap usage where the browser exposes it. CPU sections are ranked by exclusive time: **self** excludes instrumented child sections, **total** includes them, and **peak** is the largest per-frame total in the recent window. Do not add nested totals together. The slowest CPU frame since opening/resetting is retained separately.

Reproduce the lag with diagnostics open, press Esc if necessary to release pointer lock, then use **Freeze** and **Save report**. This downloads a local JSON file with the displayed summary, counters and recent frame samples (about five seconds, capped at 600 frames). Freeze holds the displayed/exported report while collection continues; Resume returns to live values. Reset clears the capture, and switching browser tabs clears suspended-tab timing.

Render submission measures synchronous CPU work, not GPU execution. High frame times with low measured CPU may come from GPU load, browser scheduling or work outside the measured animation loop. Network indicators show requests in flight, not request latency. GPU resource counts are object counts, not VRAM bytes. No GPU readback is added by this overlay; the older `?renderDiagnostics` option still enables a potentially expensive pixel readback and is flagged in the panel.

For an isolated layout/shortcut preview with synthetic data, run `node tools/serve-preview.mjs` and open `/tools/diagnostics-preview.html` on its preview port.

### Elemental sorcerer combat

Elemental sorcerer combat uses `src/dungeon-bosses.js`, `src/elemental-effects.js`, `src/status-effects.js`, and `src/staff.js`. Fire leaves three-second burning patches and ignites nearby barrels. Flaming deals 3 damage per second for 5 seconds; Drenched slows movement by 35% for 6 seconds. Refreshing either effect extends its duration without stacking its strength, and death/respawn clears it. Air gusts push away from the caster toward telegraphed spike traps; earth lifts and throws the outdoor rock meshes. The weak Staff weapon uses left swipe, right swipe, thrust, and the spear's jump-vault rules. Bosses award their gem and drop a staff on the floor for normal nearby click pickup.

For an isolated interactive preview, run `node tools/serve-preview.mjs` and open `/tools/elemental-preview.html`. It includes all four spells, staff combos, WASD target movement, jumping, and status feedback without touching saved games. `node tools/export-elemental-preview.mjs` followed by Blender's `--background --python tools/render-elemental-preview.py` regenerates the static effects contact sheet in `assets/effects`.

### Rendering and frame scheduling

Static camp scenery and the library exterior are merged into material batches, preserving chest/fire animation and picking. A camp now submits 46 meshes instead of 107, with the same geometry. Tree instance chunks switch to shared lower-detail geometry at distance, retain full detail nearby, and use a 60-unit hysteresis band to avoid repeated switching at the boundary. Reference variant triangle counts: broadleaf 2,460 → 420; conifer 756 → 222; palm 3,712 → 1,552. Near/far instance positions and collision geometry are unchanged. The tree preview has a Distant detail toggle.

Lighting, camera/aiming, interaction prompts, armour, scenery, loot and particle presentation now run once per rendered frame using the total simulated delta. Collision-safe substeps still update movement, attacks and the poses used by weapon hit detection. Camera smoothing uses elapsed time without snapping during catch-up. Animated shadow maps still refresh each frame; static batching also reduces submissions to the shadow pass.

Diagnostics now separate Frame visuals, Camera, Camera aiming, Interaction prompts, POI flags and Courier visuals, and show full/distant tree-batch counts. Capture the same outdoor position and fight again to measure the actual frame-time gain; geometry reductions are not FPS measurements.

Tree meshes now reuse vertices with matching positions, normals, UVs and colours in both the visible and shadow passes. For full-detail variant 0, stored vertices fall from 7,380 to 1,629 for broadleaf, 2,268 to 734 for conifers, and 11,136 to 4,041 for palms (64–78% fewer). Triangle counts, silhouettes, materials, shadow resolution, soft filtering and per-frame animated shadows are preserved. Distant geometry is indexed where sharing is possible; flat leaves with no reusable vertices retain their original representation. Regression tests compare every expanded triangle attribute across all species, variants and detail levels. These counts indicate reduced vertex work and storage, not measured FPS gains; reload and compare diagnostics in the same location to measure the effect on your device.
