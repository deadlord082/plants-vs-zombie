import type { LevelDefinition } from "./types";

export const LEVEL_11: LevelDefinition = {
    id: 11,
    category: "day",
    unlockAfterLevelId: 10,
    title: "Fusion Workshop",
    description: "A balanced lawn for practicing the first fusion combinations.",
    introTexts: [
        "You just unlocked the glove.",
        "Use it to move plants around the lawn.",
        "Planting or moving a plant on top of another create a plant fusion",
        "Use these fusion to beat the ever stronger zombies.",
    ],
    initialDelayMs: 20000,
    regularSpawnIntervalMs: 26000,
    betweenWaveDelayMs: 4500,
    waveSpawnIntervalMs: 1000,
    skySunIntervalMs: 10000,
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
        { zombies: [{ type: "basic", count: 2 }] },
        { zombies: [{ type: "basic", count: 4 }] },
        { zombies: [{ type: "imp", count: 3 }, { type: "basic", count: 3 }] },
        { zombies: [{ type: "cone", count: 3 }] },
        { zombies: [{ type: "basic", count: 5 }, { type: "cone", count: 2 }] },
        { zombies: [{ type: "imp", count: 4 }, { type: "cone", count: 3 }], bossWaves: true },
        { zombies: [{ type: "basic", count: 7 }, { type: "cone", count: 3 }] },
        { zombies: [{ type: "imp", count: 8 }, { type: "cone", count: 5 }, { type: "wallNutZombie", count: 2 }], bossWaves: true },
    ],
};
