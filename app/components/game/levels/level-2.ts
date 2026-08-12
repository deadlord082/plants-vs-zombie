import type { LevelDefinition } from "./types";

export const LEVEL_2: LevelDefinition = {
  id: 2,
  title: "Level 2",
  description: "Challenging level with more zombie variety and bigger waves.",
  initialDelayMs: 20000,
  regularSpawnIntervalMs: 30000,
  betweenWaveDelayMs: 3000,
  waveSpawnIntervalMs: 1200,
  // Waves: each batch spawns together, separated by regularSpawnIntervalMs
  waves: [
    [{ type: "basic", count: 1 }],
    [{ type: "imp", count: 1 }],
    [{ type: "basic", count: 2 }],
    [{ type: "basic", count: 2 }],
    [{ type: "cone", count: 1 }],
  ],
  // Boss waves: harder waves after main waves
  bossWaves: [
    // Boss wave 1
    [
      { type: "basic", count: 8 },
      { type: "cone", count: 5 },
    ],
    // Boss wave 2: Mixed composition
    [
      { type: "cone", count: 5 },
      { type: "basic", count: 4 },
      { type: "imp", count: 1 },
    ],
    // Boss wave 3: Final huge wave
    [
      { type: "cone", count: 8 },
      { type: "basic", count: 5 },
      { type: "imp", count: 5 },
    ],
  ],
};
