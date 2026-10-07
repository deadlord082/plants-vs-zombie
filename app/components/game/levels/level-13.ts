import type { LevelDefinition } from "./types";

export const LEVEL_13: LevelDefinition = {
    id: 13,
    category: "day",
    unlockAfterLevelId: 12,
    title: "Basic Swarm",
    description: "A fusion stress test against a huge swarm of basic zombies and imps.",
    initialDelayMs: 22000,
    regularSpawnIntervalMs: 26000,
    betweenWaveDelayMs: 5000,
    waveSpawnIntervalMs: 650,
    skySunIntervalMs: 7000,
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
        { zombies: [{ type: "basic", count: 8 }, { type: "imp", count: 8 }] },
        { zombies: [{ type: "basic", count: 20 }, { type: "imp", count: 20 }], bossWaves: true },
        { zombies: [{ type: "basic", count: 20 }, { type: "imp", count: 20 }] },
        { zombies: [{ type: "basic", count: 40 }, { type: "imp", count: 40 }], bossWaves: true },
    ],
};
