import type { LevelDefinition } from "./types";

export const LEVEL_1: LevelDefinition = {
  id: 1,
  unlockAfterLevelId: 0,
  title: "Three-Lane Lawn",
  description: "Expand your defense across three lanes against basic zombies.",
  initialDelayMs: 20000,
  regularSpawnIntervalMs: 30000,
  betweenWaveDelayMs: 3000,
  waveSpawnIntervalMs: 1200,
  skySunIntervalMs: 10000,
  reward: { money: 100 },
  tiles: [
    ["normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark"],
    ["normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal"],
    ["normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark"],
  ],
  // Each wave batch spawns together; boss waves use the boss spawn timing.
  waves: [
    { zombies: [{ type: "basic", count: 1 }] },
    { zombies: [{ type: "basic", count: 1 }] },
    { zombies: [{ type: "basic", count: 1 }] },
    { zombies: [{ type: "basic", count: 2 }] },
    { zombies: [{ type: "basic", count: 2 }] },
    {
      zombies: [
        { type: "basic", count: 3 },
        { type: "basic", count: 3 },
      ], bossWaves: true
    },
  ],
};
