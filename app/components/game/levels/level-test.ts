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
  backgroundImage: "/other/bg-day.webp",
  musicTrack: "/sound/day.mp3",
  gloveRechargeMs: 0,
  challenges: [
    { type: "produceSun", amount: 50 },
    { type: "maxSunSpent", amount: 150 },
    { type: "maxPlantsLost", amount: 1 },
    { type: "maxPlantsOnLawn", amount: 4 },
    { type: "usePlant", plants: ["peaShooter", "wallNut", "sunflower"] },
    { type: "killZombiesWithin", count: 1, seconds: 10 },
  ],
  tiles: [
    ["normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark"],
    ["normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal"],
    ["normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "grave", "normalDark"],
    ["normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal"],
    ["normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark"],
    ["normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal"],
  ],
  // Each wave batch spawns together; boss waves use the boss spawn timing.
  waves: [
    { zombies: [{ type: "basic", count: 1 }] },
    { zombies: [{ type: "peashooterZombie", count: 1 }] },
  ],
};
