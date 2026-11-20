import type { LevelDefinition } from "../types";

export const LEVEL_2_7: LevelDefinition = {
  id: 207,
  category: "night",
  unlockAfterLevelId: 206,
  mode: "prepare-defense",
  initialSun: 4000,
  title: "Hold the Night",
  description: "",
  initialDelayMs: 20000,
  regularSpawnIntervalMs: 30000,
  betweenWaveDelayMs: 3000,
  waveSpawnIntervalMs: 1200,
  backgroundImage: "/other/bg-night.webp",
  musicTrack: "/sound/night.mp3",
  challenges: [
    { type: "usePlant", plants: ["peaShooter", "wallNut", "chomper", "cherryBomb", "icebergLettuce", "graveBuster", "puffShroom", "fumeShroom"] },
  ],
  reward: { money: 200 },
  tiles: [
    ["normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "grave", "normalDark"],
    ["normalDark", "normal", "normalDark", "normal", "normalDark", "grave", "normalDark", "normal"],
    ["normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "grave", "normalDark"],
    ["normalDark", "normal", "normalDark", "normal", "normalDark", "grave", "normalDark", "normal"],
    ["normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "grave", "normalDark"],
    ["normalDark", "normal", "normalDark", "normal", "normalDark", "grave", "normalDark", "normal"],
  ],
  waves: [
    { zombies: [{ type: "basic", count: 5 }, { type: "cone", count: 3 }, { type: "poleVaulting", count: 2 }] },
    { zombies: [{ type: "basic", count: 5 }, { type: "undyingWraith", count: 3 }, { type: "screenDoorZombie", count: 2 }] },
    { zombies: [{ type: "basic", count: 6 }, { type: "cone", count: 3 }, { type: "bucket", count: 2 }, { type: "undyingWraith", count: 2 }], bossWaves: true },
    { zombies: [{ type: "basic", count: 5 }, { type: "poleVaulting", count: 3 }, { type: "screenDoorZombie", count: 2 }] },
    { zombies: [{ type: "basic", count: 5 }, { type: "screenDoorZombie", count: 5 }, { type: "gargantuar", count: 1 }], bossWaves: true },
    { zombies: [{ type: "basic", count: 5 }, { type: "poleVaulting", count: 3 }, { type: "screenDoorZombie", count: 2 }] },
    { zombies: [{ type: "basic", count: 6 }, { type: "bucket", count: 5 }, { type: "screenDoorZombie", count: 8 }, { type: "gargantuar", count: 1 }], bossWaves: true },
  ],
};
