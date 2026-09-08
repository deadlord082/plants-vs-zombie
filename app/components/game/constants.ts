import type { LevelConfig, PlantSpec, PlantTypeKey } from "./types";

export const INITIAL_SUN = 50;
export const ZOMBIE_HP = 200;
export const ZOMBIE_MOVE_MS = 6500;
export const ZOMBIE_SPAWN_OFFSET = 1; // spawn just right of the grid
export const ZOMBIE_LEFT_TRIGGER_X = -1; // when zombie x <= this -> game over
export const ZOMBIE_ATTACK_MS = 1000;
export const SUNFLOWER_GENERATION_MS = 30000;
export const SUNFLOWER_FIRST_BURST_MS = 10000;
export const SUN_LIFETIME_MS = 15000;
export const SKY_SUN_VALUE = 25;
export const SUN_FALL_SPEED_TILES_PER_MS = 0.003;
export const SKY_SUN_FALL_SPEED_TILES_PER_MS = SUN_FALL_SPEED_TILES_PER_MS / 4;
export const SUNFLOWER_ARC_DURATION_MS = 1400;
export const SUNFLOWER_ARC_HEIGHT_TILES = 0.275;
export const PEASHOOTER_SHOOT_MS = 1500;
export const PROJECTILE_SPEED_PER_TICK = 0.8;
export const GAME_TICK_MS = 200;

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
  armor: number;
}

export const ZOMBIE_SPECS: Record<string, ZombieSpec> = {
  basic: {
    key: "basic",
    hp: ZOMBIE_HP,
    moveMs: ZOMBIE_MOVE_MS,
    attackMs: ZOMBIE_ATTACK_MS,
    damage: 50,
    armor: 0,
  },
  imp: {
    key: "imp",
    hp: 120,
    moveMs: Math.round(ZOMBIE_MOVE_MS / 1.5),
    attackMs: ZOMBIE_ATTACK_MS,
    damage: 50,
    armor: 0,
  },
  cone: {
    key: "cone",
    hp: ZOMBIE_HP,
    moveMs: ZOMBIE_MOVE_MS,
    attackMs: ZOMBIE_ATTACK_MS,
    damage: 50,
    armor: 340,
  },
};
