import type { LevelDefinition } from "./types";

export const LEVEL_14: LevelDefinition = {
    id: 14,
    category: "day",
    unlockAfterLevelId: 13,
    title: "Sun and Steel",
    description: "Use economy fusions to withstand armored pressure.",
    initialDelayMs: 20000,
    regularSpawnIntervalMs: 25000,
    betweenWaveDelayMs: 4500,
    waveSpawnIntervalMs: 800,
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
        { zombies: [{ type: "basic", count: 4 }] },
        { zombies: [{ type: "basic", count: 6 }] },
        { zombies: [{ type: "cone", count: 5 }] },
        { zombies: [{ type: "imp", count: 6 }, { type: "cone", count: 3 }] },
        { zombies: [{ type: "basic", count: 8 }, { type: "cone", count: 6 }], bossWaves: true },
        { zombies: [{ type: "imp", count: 8 }, { type: "cone", count: 8 }] },
        { zombies: [{ type: "basic", count: 18 }, { type: "cone", count: 14 }], bossWaves: true }
    ],
};
