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

### Player Progression and Money

- Persist player progression in browser `localStorage` under the `plants-vs-zombie-player` key. The stored player data contains integer `money`, `unlockedPlants`, completed level IDs, `seedBankSize`, and `seedSlotsPurchased`.
- A new player starts with zero money, only the `peaShooter` unlocked, no completed levels, and the initial six seed slots.
- Completion rewards are declared by each level's `reward` field. A reward may contain `money`, `unlockPlants`, or both. Current levels unlock `sunflower` after the tutorial, `wallNut` after level 1, `chomper` after level 2, and `cherryBomb` after level 3.
- Completion rewards and plant unlocks are granted only the first time a level is completed. Replaying a completed level must not grant its reward again, though the level remains playable.
- The level selector displays completed levels, and the main menu displays the player's money and seed capacity.
- The Shop offers exactly two one-time seed-slot purchases: the first costs `$50,000`, and the second costs `$80,000`. Once both are purchased, no further seed-slot purchase is available.
- Money must remain a non-negative integer. Collectible coin money is added to the same persisted player balance.

### Zombie Coin Drops

- Coin-drop chances belong in each zombie's `ZombieSpec` definition in `app/components/game/constants.ts`, using a `coinDropChance` field. Do not maintain a separate drop-chance map in `GameScreen.tsx`.
- Basic zombies and imps have a `0.01` drop chance; conehead zombies have a `0.02` drop chance.
- Buckethead zombies have a `0.02` drop chance and Gargantuars have a `0.1` drop chance.
- Each defeated zombie may roll for at most one coin drop. A successful drop has a 20% chance to be gold worth `$20`, otherwise it is silver worth `$10`.
- Use `/public/silver-coin.webp` for silver coins and `/public/gold-coin.webp` for gold coins. Coins are collectible by mouse hover or keyboard focus and expire after 15 seconds.
- Coin drops are separate from sun drops and must not affect the sun counter. Keep coin motion, expiration, collection, and money synchronization in `GameScreen.tsx`.

### Sun System

- Sunflowers create collectible sun drops instead of adding currency directly.
- Sun drops are collected by mouse hover or keyboard focus and expire after 15 seconds.
- Sunflower drops launch from the plant center and follow a physics-based arc to a random landing point within the same tile.
- Sky drops fall vertically at the configured sky-drop speed and are enabled per level through `skySunIntervalMs`.
- Sun drop visuals use the transparent asset at `public/sun.webp`; drop size scales with its sun value.
- Keep sun motion, expiration, collection, and currency synchronization in `GameScreen.tsx`.

### Level Configuration

Level definitions are stored in `app/components/game/levels/`. They are compiled by `levels/loader.ts` and exported through `levels/index.ts`.

Each level must define a rectangular `tiles` matrix in its own level file:

- The number of rows in `tiles` defines the lawn height.
- The number of entries in each row defines the lawn width.
- Every row must have the same width and the matrix must not be empty.
- Do not reintroduce global fixed grid dimensions; derive dimensions from the active level.
- Each level has one ordered `waves` array. Every entry uses `{ zombies: [{ type, count }], bossWaves?: boolean }`; `bossWaves` is a marker for boss progress visuals, not a separate spawn collection.
- Regular and boss zombies are compiled into one ordered runtime sequence. Zombies within every wave spawn at `waveSpawnIntervalMs`, so multiple zombies do not appear perfectly aligned.
- Regular waves advance when the previous regular batch's combined HP falls below 50%, with `regularSpawnIntervalMs` retained as the timer fallback. Boss waves use the same per-zombie timing and follow the same ordered sequence.
- Level rewards belong in the level definition's `reward` field rather than hard-coded level-ID conditions in `GameScreen.tsx`.
- Set `skySunIntervalMs` only for levels that should have periodic sky suns; omit it for levels without sky drops.

### Menu and Almanac UI

- The main menu includes navigation to level selection and the Almanac.
- The Almanac has Plants, Zombies, and Tiles categories. Render its entries from `PLANT_SPECS`, `ZOMBIE_SPECS`, and `TILE_DEFINITIONS` rather than duplicating gameplay data in the UI.
- Plant specs include player-facing summaries and gameplay stats. Zombie specs include `name` and `summary` alongside combat stats. Tile definitions include a `description` alongside planting rules and visual classes.
- Keep zombie statistics out of the level loadout roster; the Almanac is the place for detailed zombie stats and descriptions.

### Tile System

Tile types are declared in `app/components/game/tiles.ts`. Each tile definition owns its visual classes and whether plants can be placed on it.

- `normal` and `normalDark` are plantable lawn tiles used for checkerboard patterns.
- `obstructed` is not plantable.
- New tile types should be added to the tile registry with their planting rule and visual style, then used directly in level `tiles` matrices.
- Keep tile rendering square and avoid adding rounded corners to lawn cells.
- Plant placement must always consult the tile definition before spending sun or creating a plant.

### Visual Assets & Debug UI

- Pea projectiles render with the transparent asset at `public/projectile-pea.webp`; previous green-dot rendering remains commented in code as an immediate fallback if per-projectile image loading proves unreliable.
- Sun drops pulse for the last 5 seconds before they disappear, matching the original Plants vs. Zombies urgency effect.
- Plant sprites are loaded from `public/sunflower.webp`, `public/plant_peashooter.webp`, `public/wall-nut.webp`, `public/wall-nut-damaged.webp`, `public/wall-nut-heavely-damaged.webp`, `public/chomper.webp`, and `public/cherry-bomb.webp` when available. If an image fails to load, the original text-based tile fallback remains visible instead of breaking the UI.
- Basic zombies render from `public/zombie.webp`. The sprite should be scaled larger than the original placeholder but kept from expanding downward; it should grow upward and sideways while staying grounded at the bottom edge.
- Plant image tiles should not render the old bordered container when the sprite is present; the image should visually fill the tile area more cleanly.
- Cone and bucket art is rendered as a small overlay on top of the normal zombie sprite, not as a replacement sprite. Keep the overlay positioned independently for the Almanac, loadout roster, and in-game zombie; the loadout and in-game overlays should remain above the zombie's head and aligned toward its center.
- The loadout roster must use a positioned image wrapper so cone and bucket overlays align with the zombie sprite rather than the whole roster row. The Almanac and loadout use the supplied `cone.webp` and `bucket.webp` assets.
- The shovel control uses `public/shovel.webp` as a centered icon-only button with no visible text label.
- Plant sprites may extend beyond their lawn cell bounds so large artwork is not cropped by the cell border; keep the plant layer above the tile layer.
- The project uses a debug-only health overlay: press `H` to toggle health text for all plants and zombies, defaulting to hidden.

### Development Guidelines

- Preserve the existing level-definition and tile-registry patterns when adding gameplay features.
- Keep level-specific behavior in level data when possible rather than hard-coding level IDs in `GameScreen.tsx`.
- Run `npm run lint` after changes. Use `npm run build` for production validation when the local npm environment is available.

<!-- END:nextjs-agent-rules -->
