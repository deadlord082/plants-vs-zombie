import type { LevelDefinition } from "./types";

export const LEVEL_15: LevelDefinition = {
    id: 15,
    category: "day",
    unlockAfterLevelId: 14,
    title: "Explosive Combinations",
    description: "Practice blast fusions while mixed waves close in.",
    initialDelayMs: 20000,
    regularSpawnIntervalMs: 25000,
    betweenWaveDelayMs: 4500,
    waveSpawnIntervalMs: 800,
    skySunIntervalMs: 9000,
    reward: { unlockPlants: ["icebergLettuce"] },
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
        { zombies: [{ type: "basic", count: 7 }] },
        { zombies: [{ type: "imp", count: 6 }, { type: "cone", count: 3 }] },
        { zombies: [{ type: "bucket", count: 2 }] },
        { zombies: [{ type: "basic", count: 8 }, { type: "cone", count: 4 }], bossWaves: true },
        { zombies: [{ type: "bucket", count: 5 }, { type: "imp", count: 8 }] },
        { zombies: [{ type: "basic", count: 16 }, { type: "cone", count: 10 }, { type: "bucket", count: 6 }], bossWaves: true }
    ],
};
