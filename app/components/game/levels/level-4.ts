import type { LevelDefinition } from "./types";

export const LEVEL_4: LevelDefinition = {
    id: 4,
    unlockAfterLevelId: 3,
    title: "Conehead Crossing",
    description: "Conehead zombies make their first appearance on the six-lane lawn.",
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
        { zombies: [{ type: "basic", count: 1 }] },
        { zombies: [{ type: "cone", count: 1 }] },
        { zombies: [{ type: "basic", count: 2 }] },
        { zombies: [{ type: "cone", count: 1 }] },
        { zombies: [{ type: "basic", count: 3 }] },
        { zombies: [{ type: "cone", count: 2 }] },
        { zombies: [{ type: "basic", count: 4 }, { type: "cone", count: 2 }], bossWaves: true },
    ],
};
