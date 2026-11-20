import type { LevelDefinition } from "../types";

export const LEVEL_8: LevelDefinition = {
    id: 8,
    category: "day",
    unlockAfterLevelId: 7,
    mode: "prepare-defense",
    initialSun: 3500,
    title: "Heavy Traffic",
    description: "Coneheads and bucketheads press the full lawn from several directions.",
    initialDelayMs: 10000,
    regularSpawnIntervalMs: 30000,
    betweenWaveDelayMs: 3000,
    waveSpawnIntervalMs: 1200,
    // skySunIntervalMs: 10000,
    challenges: [
        { type: "usePlant", plants: ["peaShooter", "wallNut", "chomper"] },
    ],
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
        { zombies: [{ type: "basic", count: 3 }] },
        { zombies: [{ type: "cone", count: 2 }] },
        { zombies: [{ type: "bucket", count: 1 }] },
        { zombies: [{ type: "basic", count: 5 }, { type: "cone", count: 2 }] },
        { zombies: [{ type: "bucket", count: 2 }] },
        { zombies: [{ type: "basic", count: 6 }, { type: "cone", count: 4 }, { type: "bucket", count: 2 }], bossWaves: true },
    ],
};
