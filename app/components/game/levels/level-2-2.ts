import type { LevelDefinition } from "./types";

export const LEVEL_2_2: LevelDefinition = {
  id: 202,
  category: "night",
  unlockAfterLevelId: 201,
  title: "The night of the dead",
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
  ],
};
