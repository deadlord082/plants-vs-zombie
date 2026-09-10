import type { LevelDefinition } from "./types";

export const LEVEL_3: LevelDefinition = {
  id: 3,
  unlockAfterLevelId: 2,
  title: "Six-Lane Stand",
  description: "Your full lawn opens up. Wall-nut joins the defense after this level.",
  initialDelayMs: 20000,
  regularSpawnIntervalMs: 30000,
  betweenWaveDelayMs: 3000,
  waveSpawnIntervalMs: 1200,
  skySunIntervalMs: 10000,
  reward: { unlockPlants: ["wallNut"] },
  tiles: [
    ["normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normal"],
    ["normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal"],
    ["normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normal"],
    ["normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal"],
    ["normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normal"],
    ["normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal"],
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
