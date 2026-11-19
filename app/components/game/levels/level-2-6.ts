import type { LevelDefinition } from "./types";

export const LEVEL_2_6: LevelDefinition = {
  id: 206,
  category: "night",
  unlockAfterLevelId: 205,
  initialSun: 150,
  title: "Screens of the Night",
  description: "",
  initialDelayMs: 20000,
  regularSpawnIntervalMs: 30000,
  betweenWaveDelayMs: 3000,
  waveSpawnIntervalMs: 1200,
  backgroundImage: "/other/bg-night.webp",
  musicTrack: "/sound/night.mp3",
  challenges: [
    { type: "maxPlantsLost", amount: 2 },
  ],
  reward: { money: 200 },
  tiles: [
    ["normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark"],
    ["normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal"],
    ["normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark"],
    ["normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal"],
    ["normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark"],
    ["normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal"],
  ],
  waves: [
    { zombies: [{ type: "basic", count: 5 }, { type: "cone", count: 2 }] },
    { zombies: [{ type: "basic", count: 4 }, { type: "bucket", count: 1 }, { type: "poleVaulting", count: 2 }] },
    { zombies: [{ type: "basic", count: 5 }, { type: "cone", count: 5 }, { type: "undyingWraith", count: 5 }], bossWaves: true },
    { zombies: [{ type: "basic", count: 5 }, { type: "screenDoorZombie", count: 4 }, { type: "undyingWraith", count: 2 }] },
    { zombies: [{ type: "basic", count: 5 }, { type: "screenDoorZombie", count: 8 }, { type: "poleVaulting", count: 4 }], bossWaves: true },
  ],
};
