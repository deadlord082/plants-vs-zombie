<!-- BEGIN:nextjs-agent-rules -->

# Plants vs zombie games

This is a remake of the game plants vs zombie.
In this game each level can have differrent zombie, tiles an event for each level.

## Project Context

This repository is a Next.js remake of Plants vs. Zombies. The main game screen is implemented in `app/components/game/GameScreen.tsx`, with gameplay constants and plant/zombie specifications in `app/components/game/constants.ts`.

### Game Logic

- The game has menu, level selection, loadout, Almanac, playing, complete, and game-over phases.
- Starting a level from level selection opens the loadout screen first. Gameplay must not begin until the player selects at least one plant and clicks Start level.
- The loadout screen shows selectable unlocked plants, a level-specific roster of distinct zombie types, and a configurable seed bank. Keep the bank capacity in player data so future seed-slot upgrades can increase it without changing the UI structure.
- Completing a level commits its first-time reward immediately, then presents the reward in the world at the final defeated zombie's position. Plant and glove rewards use a clickable card that grows into the center through a white transition; money rewards use a money bag that shrinks while gold coins burst outward. After the screen is fully white, switch to level selection before fading back in.
- Levels with no reward, and replayed completed levels with no collectible reward remaining, wait for the player to click the completed lawn before running the same white transition to level selection. Do not show an empty reward card.
- Players spend sun to plant unlocked sunflowers, pea shooters, Wall-nuts, Chompers, and Cherry Bombs on available lawn tiles.
- Sunflowers generate sun over time. Pea shooters fire projectiles at zombies in the same row.
- Wall-nuts have 4,000 HP and use progressively damaged sprites as their HP falls.
- Chompers eat zombies with 200 maximum HP or less, ignoring armor, then sleep for their configured sleep duration. Against tougher zombies they bite targets within one tile for 40 damage with armor-first damage handling.
- Cherry Bombs are invulnerable while armed, grow during their fuse, then explode for 1,000 damage in a 3x3 tile area.
- Zombies move from the right toward the house, attack plants when they reach them, and cause game over when they cross the left boundary.
- Zombie attacks must follow contact -> wait for that zombie's `attackMs` -> attack -> wait -> attack. Contacting a plant must never cause an immediate first attack; reset the contact timer when the zombie leaves the plant.
- Basic zombies use 200 HP, 0 armor, 50 damage, and the shared basic movement and attack timing. Imps use 120 HP and move 1.5 times faster than basic zombies.
- Conehead zombies use 200 HP, 360 armor, 50 damage, and a 2% coin-drop chance. Buckethead zombies use 200 HP, 1,000 armor, 50 damage, and a 2% coin-drop chance. Gargantuars use 3,600 HP, no armor, 2,000 damage, movement 1.5 times slower than basic zombies, a 2-second attack interval, and a 10% coin-drop chance.
- Armor absorbs damage before HP for every damage source, including peas, plant contact damage, Chomper bites, and Cherry Bomb blasts. Cone armor changes stage every 120 armor damage and bucket armor changes stage every 350 armor damage. When armor reaches zero, the heavily damaged cone or bucket falls for 2 seconds before the armor sprite disappears.
- Zombie spawning is controlled by the single ordered `waves` list in each level definition. Each entry has a `zombies` array and may set `bossWaves: true` for progress-bar and visual boss markers. Regular and boss waves use the same staggered per-zombie spawn mechanism; regular batches also use the configured health threshold and timer fallback.
- Zombie rows must be selected randomly using the active level's row count.
- Keep gameplay state and simulation updates in `GameScreen.tsx` unless a new abstraction clearly belongs elsewhere.

### Plant Fusion System

- Plants fuse when a base plant is planted on an occupied plant tile or when the glove moves a plant onto another plant. Fusion recipes are order-independent.
- If a pair has no recipe, preserve the previous behavior: direct planting is rejected on an occupied tile, and glove movement is rejected onto an occupied tile.
- Fusion plants are runtime types, not base plants. Do not add them to player unlocks, seed packets, loadouts, or the seed bank. Show them in the Almanac through the relevant base plant's fusion view.
- Define fusion metadata in `PLANT_SPECS` and recipes in `FUSION_RECIPES` in `app/components/game/constants.ts`; do not duplicate recipe tables in `GameScreen.tsx`.
- Current recipes are: Pea Shooter + Wall-nut = Peanut; Sunflower + Wall-nut = Sun-nut; Wall-nut + Wall-nut = Tall-nut; Chomper + Wall-nut = Chomp-nut; Cherry Bomb + Wall-nut = Explode-o-nut; Sunflower + Sunflower = Twin Sunflower; Sunflower + Cherry Bomb = Sun Bomb; Sunflower + Chomper = Sun Chomper; Sunflower + Pea Shooter = Sunshooter; Pea Shooter + Pea Shooter = Repeater; Pea Shooter + Chomper = Chomp-shooter; Pea Shooter + Cherry Bomb = Cherry Bomber; Cherry Bomb + Chomper = Cherry Chomper.
- Peanut has 4,000 HP and fires 20-damage piercing nut projectiles. Sun-nut has 4,000 HP and generates sun like a Sunflower. Tall-nut has 8,000 HP. Chomp-nut has 4,000 HP, behaves like a Chomper, and regenerates 200 HP after eating. Explode-o-nut has 4,000 HP and triggers a Cherry Bomb blast whenever its damage sprite stage changes.
- Twin Sunflower produces 125 sun for every burst every 30 seconds, with the normal 10-second first burst. Sun Bomb uses a Cherry Bomb fuse and blast; each zombie killed by the blast creates a collectible 25-sun drop. Sun Chomper creates a 50-sun drop after eating.
- Sunshooter generates sun and fires pea projectiles. Repeater fires two peas 100 ms apart and 20% faster than a Pea Shooter. Chomp-shooter fires three 80-damage projectiles after eating, separated by the Pea Shooter attack interval, then resumes after sleeping. Cherry Bomber fires 20-damage 3x3 blast projectiles. Cherry Chomper creates a 200-damage 3x3 blast after eating.
- Fusion plants retain the existing armor-first damage behavior, plant contact timing, collectible sun behavior, and projectile collision rules unless their fusion specification changes that behavior.

### Player Progression and Money

- Persist player progression in browser `localStorage` under the `plants-vs-zombie-player` key. The stored player data contains integer `money`, `unlockedPlants`, completed level IDs, `seedBankSize`, `seedSlotsPurchased`, and boolean `gloveUnlocked`.
- A new player starts with zero money, only the `peaShooter` unlocked, no completed levels, and exactly five base-plant seed slots.
- Completion rewards are declared by each level's `reward` field. A reward may contain `money`, `unlockPlants`, or `glove`. Current levels unlock `sunflower` after the tutorial, `wallNut` after level 1, `chomper` after level 2, `cherryBomb` after level 3, and the glove after level 10.
- Completion rewards and plant unlocks are granted only the first time a level is completed. Replaying a completed level must not grant its reward again, though the level remains playable.
- A replayed completed level must still use the rewardless completion transition rather than returning abruptly to the level selector.
- The level selector displays completed levels, and the main menu displays the player's money and seed capacity.
- The player starts with five base-plant seed slots. The Shop offers exactly two one-time seed-slot purchases, costing `$50,000` and `$80,000`; no further purchases are available after both upgrades. Fusion plants never consume loadout slots.
- Money must remain a non-negative integer. Collectible coin money is added to the same persisted player balance.

### Zombie Coin Drops

- Coin-drop chances belong in each zombie's `ZombieSpec` definition in `app/components/game/constants.ts`, using a `coinDropChance` field. Do not maintain a separate drop-chance map in `GameScreen.tsx`.
- Basic zombies and imps have a `0.01` drop chance; conehead zombies have a `0.02` drop chance.
- Buckethead zombies have a `0.02` drop chance and Gargantuars have a `0.1` drop chance.
- Each defeated zombie may roll for at most one coin drop. A successful drop has a 20% chance to be gold worth `$20`, otherwise it is silver worth `$10`.
- Use `/public/other/silver-coin.webp` for silver coins and `/public/other/gold-coin.webp` for gold coins. Coins are collectible by mouse hover or keyboard focus and expire after 15 seconds.
- Coin drops are separate from sun drops and must not affect the sun counter. Keep coin motion, expiration, collection, and money synchronization in `GameScreen.tsx`.

### Sun System

- Sunflowers create collectible sun drops instead of adding currency directly.
- Sun drops are collected by mouse hover or keyboard focus and expire after 15 seconds.
- Sunflower drops launch from the plant center and follow a physics-based arc to a random landing point within the same tile.
- Sky drops fall vertically at the configured sky-drop speed and are enabled per level through `skySunIntervalMs`.
- Sun drop visuals use the transparent asset at `public/other/sun.webp`; drop size scales with its sun value.
- Keep sun motion, expiration, collection, and currency synchronization in `GameScreen.tsx`.

### Level Configuration

Level definitions are stored in `app/components/game/levels/`. They are compiled by `levels/loader.ts` and exported through `levels/index.ts`.

Each level must define a rectangular `tiles` matrix in its own level file:

- The number of rows in `tiles` defines the lawn height.
- The number of entries in each row defines the lawn width.
- Every row must have the same width and the matrix must not be empty.
- Do not reintroduce global fixed grid dimensions; derive dimensions from the active level.
- Each level has one ordered `waves` array. Every entry uses `{ zombies: [{ type, count }], bossWaves?: boolean }`; `bossWaves` is a marker for boss progress visuals, not a separate spawn collection.
- Level definitions may set `gloveRechargeMs`; compiled levels default to a 10-second glove cooldown. The test level belongs to the `mini-game` category and sets the glove cooldown to zero.
- Regular and boss zombies are compiled into one ordered runtime sequence. Zombies within every wave spawn at `waveSpawnIntervalMs`, so multiple zombies do not appear perfectly aligned.
- Regular waves advance when the previous regular batch's combined HP falls below 50%, with `regularSpawnIntervalMs` retained as the timer fallback. Boss waves use the same per-zombie timing and follow the same ordered sequence.
- Level rewards belong in the level definition's `reward` field rather than hard-coded level-ID conditions in `GameScreen.tsx`.
- Set `skySunIntervalMs` only for levels that should have periodic sky suns; omit it for levels without sky drops.
- Levels 11 through 20 are day-category fusion test levels and unlock sequentially after the previous level. Level 13 is a large basic-zombie and imp swarm. Level 18 is a large conehead and basic-zombie swarm.

### Menu and Almanac UI

- The main menu includes navigation to level selection and the Almanac.
- The Almanac has Plants, Zombies, and Tiles categories. Render its entries from `PLANT_SPECS`, `ZOMBIE_SPECS`, and `TILE_DEFINITIONS` rather than duplicating gameplay data in the UI.
- Plant specs include player-facing summaries and gameplay stats. Zombie specs include `name` and `summary` alongside combat stats. Tile definitions include a `description` alongside planting rules and visual classes.
- Keep zombie statistics out of the level loadout roster; the Almanac is the place for detailed zombie stats and descriptions.
- The Plants Almanac category lists only the five base plants. Each base plant has a fusion action that opens its associated fusion entries and displays the required partner plants and recipe.
- Fusion entries must show their summary, health and relevant combat/generation stats, and ingredients. Fusion entries must not appear in the plant selection screen or seed tray.

### Tile System

Tile types are declared in `app/components/game/tiles.ts`. Each tile definition owns its visual classes and whether plants can be placed on it.

- `normal` and `normalDark` are plantable lawn tiles used for checkerboard patterns.
- `obstructed` is not plantable.
- New tile types should be added to the tile registry with their planting rule and visual style, then used directly in level `tiles` matrices.
- Keep tile rendering square and avoid adding rounded corners to lawn cells.
- Plant placement must always consult the tile definition before spending sun or creating a plant.

### Visual Assets & Debug UI

- Keep assets organized in `public/plants`, `public/zombie`, `public/other`, and `public/sound`. The sound folder is reserved for future audio and is currently empty. Plant sprites and plant projectiles belong in `public/plants`; zombie sprites and armor overlays belong in `public/zombie`; tools, sun, coins, and reward assets belong in `public/other`.
- Pea projectiles render with the transparent asset at `public/plants/projectile-pea.webp`; fusion projectiles use their metadata-defined asset paths.
- Sun drops pulse for the last 5 seconds before they disappear, matching the original Plants vs. Zombies urgency effect.
- Base plant sprites are loaded from `public/plants/sunflower.webp`, `public/plants/plant_peashooter.webp`, `public/plants/wall-nut.webp`, `public/plants/wall-nut-damaged.webp`, `public/plants/wall-nut-heavely-damaged.webp`, `public/plants/chomper.webp`, and `public/plants/cherry-bomb.webp` when available. If an image fails to load, the original text-based tile fallback remains visible instead of breaking the UI.
- Fusion artwork is stored in `public/plants`, including Peanut, Sun-nut, Tall-nut, Chomp-nut, Explode-o-nut, Twin Sunflower, Sun Bomb, Sun Chomper, Sunshooter, Repeater, Chomp-shooter, Cherry Bomber, Cherry Chomper, and their available projectile and damage-state assets.
- Basic zombies render from `public/zombie/zombie.webp`. The sprite should be scaled larger than the original placeholder but kept from expanding downward; it should grow upward and sideways while staying grounded at the bottom edge.
- Plant image tiles should not render the old bordered container when the sprite is present; the image should visually fill the tile area more cleanly.
- Cone and bucket art is rendered as a small overlay on top of the normal zombie sprite, not as a replacement sprite. Keep the overlay positioned independently for the Almanac, loadout roster, and in-game zombie; the loadout and in-game overlays should remain above the zombie's head and aligned toward its center.
- The loadout roster must use a positioned image wrapper so cone and bucket overlays align with the zombie sprite rather than the whole roster row. The Almanac and loadout use `public/zombie/cone.webp` and `public/zombie/bucket.webp`.
- The shovel control uses `public/other/shovel.webp` as a centered icon-only button with no visible text label.
- Once unlocked, the glove control appears beside the shovel and uses `public/other/glove.webp`. Selecting either tool displays a small tool image cursor anchored by its bottom-left corner; the dragged plant preview appears beneath the glove cursor at twice the tool cursor size.
- The glove moves plants by pointer drag-and-drop: press a plant, release over an empty plantable tile, and reject occupied or obstructed destinations. A successful move starts the active level's glove cooldown.
- Plant sprites use a subtle idle deformation animation so the lawn feels alive. Preserve existing sprite-specific transforms for sleeping Chompers, growing Cherry Bombs, and damaged Wall-nuts.
- Plant sprites may extend beyond their lawn cell bounds so large artwork is not cropped by the cell border; keep the plant layer above the tile layer.
- The project uses a debug-only health overlay: press `H` to toggle health text for all plants and zombies, defaulting to hidden.

### Development Guidelines

- Preserve the existing level-definition and tile-registry patterns when adding gameplay features.
- Keep level-specific behavior in level data when possible rather than hard-coding level IDs in `GameScreen.tsx`.
- Run `npm run lint` after changes. Use `npm run build` for production validation when the local npm environment is available.

<!-- END:nextjs-agent-rules -->
