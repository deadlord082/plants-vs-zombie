import type { LevelConfig, PlantSpec, PlantTypeKey } from "./types";

export const GRID_COLS = 12;
export const GRID_ROWS = 6;
export const INITIAL_SUN = 50;
export const ZOMBIE_HP = 200;
export const ZOMBIE_MOVE_MS = 3000;
export const ZOMBIE_SPAWN_OFFSET = 1; // spawn just right of the grid
export const ZOMBIE_LEFT_TRIGGER_X = -1; // when zombie x <= this -> game over
export const ZOMBIE_ATTACK_MS = 1000;
export const SUNFLOWER_GENERATION_MS = 30000;
export const SUNFLOWER_FIRST_BURST_MS = 10000;
export const PEASHOOTER_SHOOT_MS = 1500;
export const PROJECTILE_SPEED_PER_TICK = 0.8;
export const GAME_TICK_MS = 200;

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    title: "Level 1",
    description: "Easy introduction level with a small first wave.",
    preWaveCount: 5,
    wave1Count: 10,
    midCount: 0,
    wave2Count: 0,
    initialDelayMs: 30000,
    regularSpawnIntervalMs: 30000,
    betweenWaveDelayMs: 3000,
    waveSpawnIntervalMs: 1200,
  },
  {
    id: 2,
    title: "Level 2",
    description: "Two-wave level with a first wave after 10 zombies, then 5 more before the final big wave.",
    preWaveCount: 10,
    wave1Count: 10,
    midCount: 5,
    wave2Count: 20,
    initialDelayMs: 30000,
    regularSpawnIntervalMs: 30000,
    betweenWaveDelayMs: 3000,
    waveSpawnIntervalMs: 1200,
  },
];

export const PLANT_SPECS: Record<PlantTypeKey, PlantSpec> = {
  sunflower: {
    key: "sunflower",
    name: "Sunflower",
    hp: 300,
    cost: 50,
    rechargeMs: 5000,
    summary: "Generates sun every 30s after the first burst at 10s.",
    generateAmount: 50,
    generateMs: SUNFLOWER_GENERATION_MS,
    firstBurstMs: SUNFLOWER_FIRST_BURST_MS,
  },
  peaShooter: {
    key: "peaShooter",
    name: "Pea Shooter",
    hp: 300,
    cost: 100,
    rechargeMs: 5000,
    summary: "Shoots every 1.5s and deals 20 damage to the first zombie.",
    damage: 20,
    shootMs: PEASHOOTER_SHOOT_MS,
  },
};

export interface ZombieSpec {
  key: string;
  hp: number;
  moveMs: number;
  attackMs: number;
  damage: number;
}

export const ZOMBIE_SPECS: Record<string, ZombieSpec> = {
  basic: {
    key: "basic",
    hp: ZOMBIE_HP,
    moveMs: ZOMBIE_MOVE_MS,
    attackMs: ZOMBIE_ATTACK_MS,
    damage: 50,
  },
};
