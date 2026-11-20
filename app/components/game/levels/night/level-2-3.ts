import type { LevelDefinition } from "../types";

export const LEVEL_2_3: LevelDefinition = {
  id: 203,
  category: "night",
  unlockAfterLevelId: 202,
  initialSun: 150,
  title: "Moonlit Graves",
  description: "",
  initialDelayMs: 20000,
  regularSpawnIntervalMs: 30000,
  betweenWaveDelayMs: 3000,
  waveSpawnIntervalMs: 1200,
  backgroundImage: "/other/bg-night.webp",
  musicTrack: "/sound/night.mp3",
  challenges: [
    { type: "maxSunSpent", amount: 1500 },
  ],
  reward: { money: 200 },
  tiles: [
    ["normal", "normalDark", "normal", "grave", "normal", "normalDark", "normal", "normalDark"],
    ["normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "grave", "normal"],
    ["normal", "normalDark", "normal", "grave", "normal", "normalDark", "normal", "normalDark"],
    ["normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal"],
    ["normal", "normalDark", "normal", "normalDark", "normal", "grave", "normal", "normalDark"],
    ["normalDark", "normal", "normalDark", "normal", "grave", "normal", "normalDark", "normal"],
  ],
  waves: [
    { zombies: [{ type: "basic", count: 2 }] },
    { zombies: [{ type: "basic", count: 2 }] },
    { zombies: [{ type: "basic", count: 4 }, { type: "cone", count: 2 }] },
    { zombies: [{ type: "basic", count: 4 }, { type: "undyingWraith", count: 2 }] },
    { zombies: [{ type: "basic", count: 4 }, { type: "cone", count: 3 }, { type: "bucket", count: 1 }] },
    { zombies: [{ type: "basic", count: 5 }, { type: "cone", count: 3 }, { type: "undyingWraith", count: 2 }], bossWaves: true },
    { zombies: [{ type: "basic", count: 5 }, { type: "poleVaulting", count: 2 }] },
    { zombies: [{ type: "basic", count: 4 }, { type: "bucket", count: 2 }, { type: "undyingWraith", count: 2 }], bossWaves: true },
  ],
};
