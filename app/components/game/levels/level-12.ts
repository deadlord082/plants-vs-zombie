import type { LevelDefinition } from "./types";

export const LEVEL_12: LevelDefinition = {
    id: 12,
    category: "day",
    unlockAfterLevelId: 11,
    title: "Double Trouble",
    description: "Build economy and test plants that combine two matching roles.",
    introTexts: [
        "It seems the zombie too learned to used fusions.",
        "beware of the high health of the wall-nut zombie.",
    ],
    initialDelayMs: 8000,
    regularSpawnIntervalMs: 18000,
    betweenWaveDelayMs: 2500,
    waveSpawnIntervalMs: 850,
    skySunIntervalMs: 9000,
    reward: { money: 150 },
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
        { zombies: [{ type: "basic", count: 5 }] },
        { zombies: [{ type: "wallNutZombie", count: 1 }] },
        { zombies: [{ type: "cone", count: 4 }, { type: "basic", count: 4 }] },
        { zombies: [{ type: "imp", count: 5 }, { type: "cone", count: 3 }] },
        { zombies: [{ type: "basic", count: 10 }, { type: "wallNutZombie", count: 3 }, { type: "cone", count: 6 }], bossWaves: true },
    ],
};
