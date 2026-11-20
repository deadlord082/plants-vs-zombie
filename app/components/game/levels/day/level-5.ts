import type { LevelDefinition } from "../types";

export const LEVEL_5: LevelDefinition = {
    id: 5,
    category: "day",
    unlockAfterLevelId: 4,
    mode: "wall-nut-bowling",
    conveyor: {
        spawnIntervalMs: 5000,
        capacity: 10,
        plants: [
            { type: "wallNut", chance: 40, maxCount: 10 },
            { type: "explodeONut", chance: 20, maxCount: 4 },
        ],
    },
    title: "The Long Push",
    description: "Coneheads return with larger, staggered groups across every lane.",
    initialDelayMs: 10000,
    regularSpawnIntervalMs: 30000,
    betweenWaveDelayMs: 3000,
    waveSpawnIntervalMs: 1200,
    // skySunIntervalMs: 10000,
    backgroundImage: "/other/bg-day.webp",
    musicTrack: "/sound/day.mp3",
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
