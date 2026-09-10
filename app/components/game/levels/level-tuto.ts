import type { LevelDefinition } from "./types";

export const LEVEL_TUTO: LevelDefinition = {
  id: 0,
  title: "The First Sprout",
  description: "Learn the rhythm of planting, collecting sun, and defending one lane.",
  initialDelayMs: 20000,
  regularSpawnIntervalMs: 30000,
  betweenWaveDelayMs: 3000,
  waveSpawnIntervalMs: 1200,
  skySunIntervalMs: 10000,
  reward: { unlockPlants: ["sunflower"] },
  tiles: [
    ["normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark"],
  ],
  // Each wave batch spawns together; boss waves use the boss spawn timing.
  waves: [
    { zombies: [{ type: "basic", count: 1 }] },
    { zombies: [{ type: "basic", count: 1 }] },
    { zombies: [{ type: "basic", count: 1 }] },
    { zombies: [{ type: "basic", count: 1 }] },
    { zombies: [{ type: "basic", count: 2 }] },
    { zombies: [{ type: "basic", count: 1 }] },
    {
      zombies: [
        { type: "basic", count: 5 },
      ], bossWaves: true
    },
  ],
};
