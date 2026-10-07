import type { LevelDefinition } from "./types";

export const LEVEL_18: LevelDefinition = {
    id: 18,
    category: "day",
    unlockAfterLevelId: 17,
    title: "Conehead Swarm",
    description: "A huge conehead and basic zombie swarm built to test piercing and blast fusions.",
    initialDelayMs: 22000,
    regularSpawnIntervalMs: 28000,
    betweenWaveDelayMs: 5000,
    waveSpawnIntervalMs: 700,
    skySunIntervalMs: 7000,
    reward: { money: 150 },
    tiles: [
        ["normal", "normalDark", "sunflowerStatue", "normalDark", "normal", "normalDark", "normal", "normalDark"],
        ["normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal"],
        ["normal", "normalDark", "normal", "normalDark", "sunflowerStatue", "normalDark", "normal", "normalDark"],
        ["normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal"],
        ["normal", "normalDark", "normal", "normalDark", "normal", "normalDark", "normal", "normalDark"],
        ["normalDark", "normal", "normalDark", "normal", "normalDark", "sunflowerStatue", "normalDark", "normal"],
    ],
    waves: [
        { zombies: [{ type: "basic", count: 3 }] },
        { zombies: [{ type: "basic", count: 5 }, { type: "horseman", count: 2 }] },
        { zombies: [{ type: "basic", count: 8 }, { type: "cone", count: 12 }], bossWaves: true },
        { zombies: [{ type: "basic", count: 10 }, { type: "cone", count: 16 }] },
        { zombies: [{ type: "cone", count: 24 }, { type: "basic", count: 20 }], bossWaves: true },
        { zombies: [{ type: "basic", count: 20 }, { type: "horseman", count: 6 }, { type: "cone", count: 18 }] },
        { zombies: [{ type: "cone", count: 45 }, { type: "basic", count: 45 }, { type: "horseman", count: 10 }], bossWaves: true }
    ],
};
