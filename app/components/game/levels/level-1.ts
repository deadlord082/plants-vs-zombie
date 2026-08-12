import type { LevelDefinition } from "./types";

export const LEVEL_1: LevelDefinition = {
  id: 1,
  title: "Level 1",
  description: "Easy introduction level with mixed zombie types.",
  initialDelayMs: 20000,
  regularSpawnIntervalMs: 30000,
  betweenWaveDelayMs: 3000,
  waveSpawnIntervalMs: 1200,
  // Waves: each batch spawns together, separated by regularSpawnIntervalMs
  waves: [
    [{ type: "basic", count: 1 }],
    [{ type: "basic", count: 1 }],
    [{ type: "basic", count: 1 }],
    [{ type: "imp", count: 1 }],
    [{ type: "basic", count: 2 }],
    [{ type: "cone", count: 1 }],
    [{ type: "basic", count: 1 }],
    [{ type: "imp", count: 2 }],
  ],
  // Boss waves: harder waves after main waves
  bossWaves: [
    // Boss wave 1: Big wave with basics and cones
    [
      { type: "basic", count: 10 },
      { type: "cone", count: 5 },
    ],
  ],
};
