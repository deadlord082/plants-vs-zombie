import type { LevelDefinition } from "./types";

export const LEVEL_2_8: LevelDefinition = {
  id: 208,
  category: "night",
  unlockAfterLevelId: 207,
  initialSun: 150,
  title: "Graveyard Rows",
  description: "",
  initialDelayMs: 20000,
  regularSpawnIntervalMs: 30000,
  betweenWaveDelayMs: 3000,
  waveSpawnIntervalMs: 1200,
  backgroundImage: "/other/bg-night.webp",
  musicTrack: "/sound/night.mp3",
  reward: { money: 200 },
  tiles: [
    ["normal", "grave", "grave", "normalDark", "normal", "normalDark", "normal", "normalDark"],
    ["normalDark", "grave", "grave", "normal", "normalDark", "normal", "normalDark", "normal"],
    ["normal", "grave", "grave", "normalDark", "normal", "normalDark", "normal", "normalDark"],
    ["normalDark", "grave", "grave", "normal", "normalDark", "normal", "normalDark", "normal"],
    ["normal", "grave", "grave", "normalDark", "normal", "normalDark", "normal", "normalDark"],
    ["normalDark", "grave", "grave", "normal", "normalDark", "normal", "normalDark", "normal"],
  ],
  waves: [
    { zombies: [{ type: "basic", count: 2 }] },
    { zombies: [{ type: "basic", count: 3 }] },
    { zombies: [{ type: "cone", count: 2 }] },
    { zombies: [{ type: "basic", count: 6 }, { type: "cone", count: 4 }, { type: "bucket", count: 2 }, { type: "undyingWraith", count: 3 }], bossWaves: true },
    { zombies: [{ type: "basic", count: 6 }, { type: "poleVaulting", count: 3 }, { type: "screenDoorZombie", count: 3 }] },
    { zombies: [{ type: "basic", count: 6 }, { type: "bucket", count: 3 }, { type: "undyingWraith", count: 3 }, { type: "screenDoorZombie", count: 2 }], bossWaves: true },
  ],
};
