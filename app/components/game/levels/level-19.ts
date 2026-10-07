import type { LevelDefinition } from "./types";

export const LEVEL_19: LevelDefinition = {
    id: 19,
    category: "day",
    unlockAfterLevelId: 18,
    title: "Full Arsenal",
    description: "Bring a complete five-plant loadout and test every fusion family.",
    initialDelayMs: 23000,
    regularSpawnIntervalMs: 29000,
    betweenWaveDelayMs: 5500,
    waveSpawnIntervalMs: 750,
    skySunIntervalMs: 8000,
    reward: { money: 150 },
    tiles: [
        ["normal", "normalDark", "normal", "normalDark", "sunflowerStatue", "normalDark", "normal", "normalDark"],
        ["normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal"],
        ["normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "sunflowerStatue", "normalDark"],
        ["normalDark", "sunflowerStatue", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal"],
        ["normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark"],
        ["normalDark", "normal", "normalDark", "sunflowerStatue", "normalDark", "normal", "normalDark", "normal"],
    ],
    waves: [
        { zombies: [{ type: "basic", count: 4 }] },
        { zombies: [{ type: "basic", count: 8 }, { type: "imp", count: 6 }] },
        { zombies: [{ type: "basic", count: 10 }, { type: "imp", count: 8 }, { type: "undyingWraith", count: 2 }], bossWaves: true },
        { zombies: [{ type: "cone", count: 12 }, { type: "bucket", count: 4 }] },
        { zombies: [{ type: "basic", count: 15 }, { type: "undyingWraith", count: 5 }, { type: "imp", count: 14 }, { type: "cone", count: 12 }], bossWaves: true },
        { zombies: [{ type: "bucket", count: 10 }, { type: "cone", count: 14 }, { type: "basic", count: 18 }] },
        { zombies: [{ type: "bucket", count: 14 }, { type: "undyingWraith", count: 10 }, { type: "cone", count: 20 }, { type: "basic", count: 25 }], bossWaves: true }
    ],
};
