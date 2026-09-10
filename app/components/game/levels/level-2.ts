import type { LevelDefinition } from "./types";

export const LEVEL_2: LevelDefinition = {
  id: 2,
  unlockAfterLevelId: 1,
  title: "Five-Lane Meadow",
  description: "Hold five lanes as basic zombies arrive in larger groups.",
  initialDelayMs: 20000,
  regularSpawnIntervalMs: 30000,
  betweenWaveDelayMs: 3000,
  waveSpawnIntervalMs: 1200,
  skySunIntervalMs: 10000,
  reward: { money: 100 },
  tiles: [
    ["normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normal"],
    ["normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal"],
    ["normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normal"],
    ["normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal"],
    ["normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normal"],
  ],
  // Each wave batch spawns together; boss waves use the boss spawn timing.
  waves: [
    { zombies: [{ type: "basic", count: 1 }] },
    { zombies: [{ type: "basic", count: 1 }] },
    { zombies: [{ type: "basic", count: 2 }] },
    { zombies: [{ type: "basic", count: 2 }] },
    { zombies: [{ type: "basic", count: 2 }] },
    {
      zombies: [
        { type: "basic", count: 5 },
        { type: "basic", count: 5 },
      ], bossWaves: true
    },
  ],
};
