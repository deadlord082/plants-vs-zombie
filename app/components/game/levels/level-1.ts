import type { LevelDefinition } from "./types";

export const LEVEL_1: LevelDefinition = {
  id: 1,
  title: "Level 1",
  description: "Easy introduction level with mixed zombie types.",
  initialDelayMs: 20000,
  regularSpawnIntervalMs: 30000,
  betweenWaveDelayMs: 3000,
  waveSpawnIntervalMs: 1200,
  skySunIntervalMs: 10000,
  reward: { unlockPlants: ["wallNut"] },
  tiles: [
    ["normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark"],
    ["normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal"],
    ["normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark"],
    ["normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal"],
    ["normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark"],
    ["normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal"],
  ],
  // Each wave batch spawns together; boss waves use the boss spawn timing.
  waves: [
    { zombies: [{ type: "basic", count: 1 }] },
    { zombies: [{ type: "basic", count: 1 }] },
    { zombies: [{ type: "basic", count: 1 }] },
    { zombies: [{ type: "imp", count: 1 }] },
    { zombies: [{ type: "basic", count: 2 }] },
    { zombies: [{ type: "cone", count: 1 }] },
    { zombies: [{ type: "basic", count: 1 }] },
    { zombies: [{ type: "imp", count: 2 }] },
    {
      zombies: [
        { type: "basic", count: 5 },
        { type: "cone", count: 5 },
        { type: "basic", count: 5 },
      ], bossWaves: true
    },
  ],
};
