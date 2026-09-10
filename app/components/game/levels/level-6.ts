import type { LevelDefinition } from "./types";

export const LEVEL_6: LevelDefinition = {
    id: 6,
    unlockAfterLevelId: 5,
    title: "Hungry Defense",
    description: "Survive the conehead gauntlet and unlock Chomper when the lawn is clear.",
    initialDelayMs: 20000,
    regularSpawnIntervalMs: 30000,
    betweenWaveDelayMs: 3000,
    waveSpawnIntervalMs: 1200,
    skySunIntervalMs: 10000,
    reward: { unlockPlants: ["chomper"] },
    tiles: [
        ["normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark"],
        ["normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal"],
        ["normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark"],
        ["normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal"],
        ["normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark"],
        ["normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal"],
    ],
    waves: [
        { zombies: [{ type: "basic", count: 2 }] },
        { zombies: [{ type: "cone", count: 2 }] },
        { zombies: [{ type: "basic", count: 4 }] },
        { zombies: [{ type: "cone", count: 3 }] },
        { zombies: [{ type: "basic", count: 5 }, { type: "cone", count: 2 }] },
        { zombies: [{ type: "basic", count: 6 }, { type: "cone", count: 4 }], bossWaves: true },
    ],
};
