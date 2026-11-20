import type { LevelDefinition } from "../types";

export const LEVEL_2_2: LevelDefinition = {
  id: 202,
  category: "night",
  unlockAfterLevelId: 201,
  initialSun: 150,
  title: "Graveyard Shift",
  description: "",
  initialDelayMs: 20000,
  regularSpawnIntervalMs: 30000,
  betweenWaveDelayMs: 3000,
  waveSpawnIntervalMs: 1200,
  backgroundImage: "/other/bg-night.webp",
  musicTrack: "/sound/night.mp3",
  reward: { unlockPlants: ["graveBuster"] },
  tiles: [
    ["normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "grave", "normalDark"],
    ["normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "grave"],
    ["normal", "normalDark", "normal", "normalDark", "normal", "grave", "normal", "normalDark"],
    ["normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal"],
    ["normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "grave", "normalDark"],
    ["normalDark", "normal", "normalDark", "normal", "normalDark", "grave", "normalDark", "normal"],
  ],
  waves: [
    { zombies: [{ type: "basic", count: 2 }] },
    { zombies: [{ type: "basic", count: 2 }] },
    { zombies: [{ type: "basic", count: 3 }, { type: "cone", count: 2 }] },
    { zombies: [{ type: "basic", count: 5 }, { type: "cone", count: 5 }], bossWaves: true },
    { zombies: [{ type: "bucket", count: 2 }] },
    { zombies: [{ type: "basic", count: 4 }, { type: "undyingWraith", count: 2 }] },
    { zombies: [{ type: "bucket", count: 5 }, { type: "undyingWraith", count: 8 }, { type: "basic", count: 4 }], bossWaves: true },
  ],
};
