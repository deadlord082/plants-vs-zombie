import type { LevelDefinition } from "./types";

export const LEVEL_7: LevelDefinition = {
    id: 7,
    unlockAfterLevelId: 6,
    title: "Buckethead Arrival",
    description: "Buckethead zombies join the march. Chomper can help manage the pressure.",
    initialDelayMs: 20000,
    regularSpawnIntervalMs: 30000,
    betweenWaveDelayMs: 3000,
    waveSpawnIntervalMs: 1200,
    skySunIntervalMs: 10000,
    reward: { money: 100 },
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
        { zombies: [{ type: "bucket", count: 1 }] },
        { zombies: [{ type: "cone", count: 2 }] },
        { zombies: [{ type: "basic", count: 4 }, { type: "bucket", count: 1 }] },
        { zombies: [{ type: "cone", count: 3 }] },
        { zombies: [{ type: "basic", count: 5 }, { type: "bucket", count: 2 }], bossWaves: true },
    ],
};
