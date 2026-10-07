import type { LevelDefinition } from "./types";

export const LEVEL_16: LevelDefinition = {
    id: 16,
    category: "day",
    unlockAfterLevelId: 15,
    title: "Rapid Fire",
    description: "A fast level designed for projectile and Chomper fusions.",
    initialDelayMs: 20000,
    regularSpawnIntervalMs: 26000,
    betweenWaveDelayMs: 4500,
    waveSpawnIntervalMs: 800,
    skySunIntervalMs: 8500,
    reward: { money: 150 },
    tiles: [
        ["normal", "normalDark", "normal", "sunflowerStatue", "normal", "normalDark", "normal", "normalDark"],
        ["normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal"],
        ["normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark"],
        ["normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal"],
        ["normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark"],
        ["normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal"],
    ],
    waves: [
        { zombies: [{ type: "basic", count: 3 }] },
        { zombies: [{ type: "basic", count: 4 }] },
        { zombies: [{ type: "imp", count: 8 }] },
        { zombies: [{ type: "basic", count: 6 }, { type: "wallNutZombie", count: 2 }, { type: "cone", count: 4 }], bossWaves: true },
        { zombies: [{ type: "bucket", count: 5 }, { type: "imp", count: 8 }] },
        { zombies: [{ type: "imp", count: 10 }, { type: "cone", count: 7 }, { type: "bucket", count: 3 }], bossWaves: true },
        { zombies: [{ type: "basic", count: 14 }, { type: "wallNutZombie", count: 5 }] },
        { zombies: [{ type: "wallNutZombie", count: 10 }, { type: "imp", count: 12 }, { type: "cone", count: 10 }, { type: "bucket", count: 5 }], bossWaves: true }
    ],
};
