import type { LevelDefinition } from "./types";

export const LEVEL_3: LevelDefinition = {
  id: 3,
  title: "Level 3",
  description: "Even more challenging level with advanced zombie strategies.",
  initialDelayMs: 20000,
  regularSpawnIntervalMs: 30000,
  betweenWaveDelayMs: 3000,
  waveSpawnIntervalMs: 1200,
  skySunIntervalMs: 10000,
  tiles: [
    ["normal", "normal", "normal", "normal", "normal", "normal"],
    ["normal", "normal", "normal", "normal", "normal", "normal"],
    ["normal", "normal", "normal", "normal", "normal", "normal"],
    ["normal", "normal", "normal", "normal", "normal", "normal"],
  ],
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
