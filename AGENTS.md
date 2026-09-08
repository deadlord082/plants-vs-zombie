<!-- BEGIN:nextjs-agent-rules -->

# Plants vs zombie games

This is a remake of the game plants vs zombie.
In this game each level can have differrent zombie, tiles an event for each level.

<!-- END:nextjs-agent-rules -->

## Project Context

This repository is a Next.js remake of Plants vs. Zombies. The main game screen is implemented in `app/components/game/GameScreen.tsx`, with gameplay constants and plant/zombie specifications in `app/components/game/constants.ts`.

### Game Logic

- The game has menu, level selection, playing, complete, and game-over phases.
- Players spend sun to plant sunflowers and pea shooters on available lawn tiles.
- Sunflowers generate sun over time. Pea shooters fire projectiles at zombies in the same row.
- Zombies move from the right toward the house, attack plants when they reach them, and cause game over when they cross the left boundary.
- Zombie spawning is controlled by each level's regular waves and boss waves. Zombie rows must be selected randomly using the active level's row count.
- Keep gameplay state and simulation updates in `GameScreen.tsx` unless a new abstraction clearly belongs elsewhere.

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
- Waves contain regular zombie batches. `bossWaves` contains the later wave sequences.
- Set `skySunIntervalMs` only for levels that should have periodic sky suns; omit it for levels without sky drops.

### Tile System

Tile types are declared in `app/components/game/tiles.ts`. Each tile definition owns its visual classes and whether plants can be placed on it.

- `normal` and `normalDark` are plantable lawn tiles used for checkerboard patterns.
- `obstructed` is not plantable.
- New tile types should be added to the tile registry with their planting rule and visual style, then used directly in level `tiles` matrices.
- Keep tile rendering square and avoid adding rounded corners to lawn cells.
- Plant placement must always consult the tile definition before spending sun or creating a plant.

### Development Guidelines

- Preserve the existing level-definition and tile-registry patterns when adding gameplay features.
- Keep level-specific behavior in level data when possible rather than hard-coding level IDs in `GameScreen.tsx`.
- Run `npm run lint` after changes. Use `npm run build` for production validation when the local npm environment is available.
