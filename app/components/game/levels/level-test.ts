import type { LevelDefinition } from "./types";

export const LEVEL_test: LevelDefinition = {
  id: 99999,
  category: "mini-game",
  title: "test level",
  description: "a test level for dev purpose, isn't push in prod",
  initialDelayMs: 5000,
  regularSpawnIntervalMs: 30000,
  betweenWaveDelayMs: 3000,
  waveSpawnIntervalMs: 1200,
  skySunIntervalMs: 1000,
  gloveRechargeMs: 0,
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
    { zombies: [{ type: "bucket", count: 1 }] },
  ],
};
