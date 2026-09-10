import type { LevelDefinition } from "./types";

export const LEVEL_5: LevelDefinition = {
    id: 5,
    unlockAfterLevelId: 4,
    title: "The Long Push",
    description: "Coneheads return with larger, staggered groups across every lane.",
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
        { zombies: [{ type: "cone", count: 1 }] },
        { zombies: [{ type: "basic", count: 3 }] },
        { zombies: [{ type: "cone", count: 2 }] },
        { zombies: [{ type: "basic", count: 4 }, { type: "cone", count: 1 }] },
        { zombies: [{ type: "cone", count: 3 }] },
        { zombies: [{ type: "basic", count: 6 }, { type: "cone", count: 4 }], bossWaves: true },
    ],
};
