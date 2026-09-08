import type { LevelDefinition } from "./types";

export const LEVEL_TUTO: LevelDefinition = {
  id: 0,
  title: "Level Tutorial",
  description: "",
  initialDelayMs: 20000,
  regularSpawnIntervalMs: 30000,
  betweenWaveDelayMs: 3000,
  waveSpawnIntervalMs: 1200,
  tiles: [
    ["normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal"],
  ],
  // Waves: each batch spawns together, separated by regularSpawnIntervalMs
  waves: [
    [{ type: "basic", count: 1 }],
    [{ type: "basic", count: 1 }],
    [{ type: "basic", count: 1 }],
    [{ type: "basic", count: 1 }],
    [{ type: "basic", count: 2 }],
  ],
  // Boss waves: harder waves after main waves
  bossWaves: [
    // Boss wave 1: Big wave with basics and cones
    [
      { type: "basic", count: 10 },
    ],
  ],
};
