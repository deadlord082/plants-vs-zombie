import type { LevelDefinition } from "./types";

export const LEVEL_2: LevelDefinition = {
  id: 2,
  title: "Level 2",
  description: "Challenging level with more zombie variety and bigger waves.",
  initialDelayMs: 20000,
  regularSpawnIntervalMs: 30000,
  betweenWaveDelayMs: 3000,
  waveSpawnIntervalMs: 1200,
  skySunIntervalMs: 10000,
  reward: { unlockPlants: ["chomper"] },
  tiles: [
    ["obstructed", "normal", "normal", "normal", "normal", "normal", "normal", "normal"],
    ["obstructed", "normal", "normal", "normal", "normal", "normal", "normal", "normal"],
    ["obstructed", "normal", "normal", "normal", "normal", "normal", "normal", "normal"],
    ["obstructed", "normal", "normal", "normal", "normal", "normal", "normal", "normal"],
    ["obstructed", "normal", "normal", "normal", "normal", "normal", "normal", "normal"],
    ["obstructed", "normal", "normal", "normal", "normal", "normal", "normal", "normal"],
  ],
  // Each wave batch spawns together; boss waves use the boss spawn timing.
  waves: [
    { zombies: [{ type: "basic", count: 1 }] },
    { zombies: [{ type: "imp", count: 1 }] },
    { zombies: [{ type: "basic", count: 2 }] },
    { zombies: [{ type: "basic", count: 2 }] },
    { zombies: [{ type: "cone", count: 1 }] },
    {
      zombies: [
        { type: "basic", count: 8 },
        { type: "cone", count: 5 },
      ], bossWaves: true
    },
    {
      zombies: [
        { type: "cone", count: 5 },
        { type: "basic", count: 4 },
        { type: "imp", count: 1 },
      ], bossWaves: true
    },
    { zombies: [{ type: "basic", count: 2 }] },
    { zombies: [{ type: "basic", count: 2 }] },
    {
      zombies: [
        { type: "cone", count: 8 },
        { type: "basic", count: 5 },
        { type: "imp", count: 5 },
      ], bossWaves: true
    },
  ],
};
