import type { LevelDefinition } from "./types";

export const LEVEL_20: LevelDefinition = {
    id: 20,
    category: "day",
    unlockAfterLevelId: 19,
    title: "Fusion Gauntlet",
    description: "The final day challenge combines every threat for a full fusion showcase.",
    initialDelayMs: 25000,
    regularSpawnIntervalMs: 32000,
    betweenWaveDelayMs: 6000,
    waveSpawnIntervalMs: 700,
    skySunIntervalMs: 8000,
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
        { zombies: [{ type: "basic", count: 4 }] },
        { zombies: [{ type: "basic", count: 7 }, { type: "imp", count: 5 }] },
        { zombies: [{ type: "basic", count: 12 }, { type: "imp", count: 10 }, { type: "wallNutZombie", count: 3 }], bossWaves: true },
        { zombies: [{ type: "cone", count: 12 }, { type: "bucket", count: 5 }] },
        { zombies: [{ type: "wallNutZombie", count: 4 }, { type: "peashooterZombie", count: 4 }, { type: "horseman", count: 4 }, { type: "undyingWraith", count: 4 }], bossWaves: true },
        { zombies: [{ type: "basic", count: 18 }, { type: "imp", count: 14 }, { type: "cone", count: 14 }] },
        { zombies: [{ type: "bucket", count: 10 }, { type: "poleVaulting", count: 6 }, { type: "gargantuar", count: 2 }], bossWaves: true },
        { zombies: [{ type: "basic", count: 20 }, { type: "wallNutZombie", count: 8 }, { type: "peashooterZombie", count: 6 }, { type: "horseman", count: 6 }, { type: "undyingWraith", count: 6 }] },
        { zombies: [{ type: "basic", count: 30 }, { type: "imp", count: 24 }, { type: "cone", count: 20 }, { type: "bucket", count: 12 }, { type: "gargantuar", count: 4 }, { type: "wallNutZombie", count: 8 }, { type: "peashooterZombie", count: 8 }, { type: "horseman", count: 8 }, { type: "undyingWraith", count: 8 }, { type: "poleVaulting", count: 8 }], bossWaves: true }
    ],
};
