import type { LevelDefinition } from "./types";

export const LEVEL_9: LevelDefinition = {
    id: 9,
    unlockAfterLevelId: 8,
    title: "Explosive Finish",
    description: "Clear the heavy wave and unlock Cherry Bomb for the final challenge.",
    initialDelayMs: 20000,
    regularSpawnIntervalMs: 30000,
    betweenWaveDelayMs: 3000,
    waveSpawnIntervalMs: 1200,
    skySunIntervalMs: 10000,
    reward: { unlockPlants: ["cherryBomb"] },
    tiles: [
        ["normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark"],
        ["normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal"],
        ["normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark"],
        ["normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal"],
        ["normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark"],
        ["normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal"],
    ],
    waves: [
        { zombies: [{ type: "basic", count: 3 }] },
        { zombies: [{ type: "cone", count: 2 }] },
        { zombies: [{ type: "bucket", count: 1 }] },
        { zombies: [{ type: "basic", count: 5 }, { type: "cone", count: 3 }] },
        { zombies: [{ type: "bucket", count: 2 }] },
        { zombies: [{ type: "basic", count: 7 }, { type: "cone", count: 6 }, { type: "bucket", count: 6 }], bossWaves: true },
    ],
};
