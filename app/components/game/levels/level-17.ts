import type { LevelDefinition } from "./types";

export const LEVEL_17: LevelDefinition = {
    id: 17,
    category: "day",
    unlockAfterLevelId: 16,
    title: "Armor Breaker",
    description: "Break through cones and buckets with your strongest fusions.",
    initialDelayMs: 21000,
    regularSpawnIntervalMs: 27000,
    betweenWaveDelayMs: 5000,
    waveSpawnIntervalMs: 800,
    skySunIntervalMs: 8500,
    reward: { money: 150 },
    tiles: [
        ["normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark"],
        ["normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal"],
        ["normal", "normalDark", "normal", "normalDark", "sunflowerStatue", "normalDark", "normal", "normalDark"],
        ["normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal"],
        ["normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark"],
        ["normalDark", "normal", "normalDark", "normal", "normalDark", "sunflowerStatue", "normalDark", "normal"],
    ],
    waves: [
        { zombies: [{ type: "basic", count: 3 }] },
        { zombies: [{ type: "basic", count: 4 }] },
        { zombies: [{ type: "basic", count: 6 }, { type: "peashooterZombie", count: 2 }, { type: "cone", count: 4 }], bossWaves: true },
        { zombies: [{ type: "bucket", count: 5 }, { type: "imp", count: 9 }] },
        { zombies: [{ type: "imp", count: 8 }, { type: "cone", count: 5 }, { type: "peashooterZombie", count: 3 }], bossWaves: true },
        { zombies: [{ type: "basic", count: 14 }, { type: "bucket", count: 6 }] },
        { zombies: [{ type: "basic", count: 18 }, { type: "peashooterZombie", count: 8 }, { type: "cone", count: 12 }, { type: "bucket", count: 8 }], bossWaves: true }
    ],
};
