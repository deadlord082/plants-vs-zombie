import type { LevelDefinition } from "./types";

export const LEVEL_10: LevelDefinition = {
    id: 10,
    unlockAfterLevelId: 9,
    title: "Gargantuar's Yard",
    description: "The final lawn brings the Gargantuar. Spend every tool wisely.",
    initialDelayMs: 20000,
    regularSpawnIntervalMs: 30000,
    betweenWaveDelayMs: 3000,
    waveSpawnIntervalMs: 1400,
    skySunIntervalMs: 10000,
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
        { zombies: [{ type: "basic", count: 3 }] },
        { zombies: [{ type: "cone", count: 2 }] },
        { zombies: [{ type: "bucket", count: 1 }] },
        { zombies: [{ type: "basic", count: 5 }, { type: "cone", count: 3 }] },
        { zombies: [{ type: "bucket", count: 2 }] },
        { zombies: [{ type: "gargantuar", count: 1 }, { type: "basic", count: 6 }, { type: "cone", count: 4 }, { type: "bucket", count: 3 }], bossWaves: true },
    ],
};
