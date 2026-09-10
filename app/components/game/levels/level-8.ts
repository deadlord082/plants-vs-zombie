import type { LevelDefinition } from "./types";

export const LEVEL_8: LevelDefinition = {
    id: 8,
    unlockAfterLevelId: 7,
    title: "Heavy Traffic",
    description: "Coneheads and bucketheads press the full lawn from several directions.",
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
        { zombies: [{ type: "basic", count: 3 }] },
        { zombies: [{ type: "cone", count: 2 }] },
        { zombies: [{ type: "bucket", count: 1 }] },
        { zombies: [{ type: "basic", count: 5 }, { type: "cone", count: 2 }] },
        { zombies: [{ type: "bucket", count: 2 }] },
        { zombies: [{ type: "basic", count: 6 }, { type: "cone", count: 4 }, { type: "bucket", count: 2 }], bossWaves: true },
    ],
};
