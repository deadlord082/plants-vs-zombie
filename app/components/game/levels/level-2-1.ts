import type { LevelDefinition } from "./types";

export const LEVEL_2_1: LevelDefinition = {
  id: 201,
  category: "night",
  unlockAfterLevelId: 0,
  title: "Your first-night",
  description: "",
  introTexts: [
    "During the night, sun does not fall from the sky.",
    "You must rely on sunflowers to generate sun.",
  ],
  initialDelayMs: 20000,
  regularSpawnIntervalMs: 30000,
  betweenWaveDelayMs: 3000,
  waveSpawnIntervalMs: 1200,
  backgroundImage: "/other/bg-night.webp",
  musicTrack: "/sound/night.mp3",
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
  ],
};
