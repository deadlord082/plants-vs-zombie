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
  reward: { unlockPlants: ["cherryBomb"] },
  tiles: [
    ["normal", "normal", "normal", "normal", "normal", "normal"],
    ["normal", "normal", "normal", "normal", "normal", "normal"],
    ["normal", "normal", "normal", "normal", "normal", "normal"],
    ["normal", "normal", "normal", "normal", "normal", "normal"],
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
    {
      zombies: [
        { type: "cone", count: 8 },
        { type: "basic", count: 5 },
        { type: "imp", count: 5 },
      ], bossWaves: true
    },
  ],
};
