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
export const CHOMPER_BITE_MS = 1500;
export const CHOMPER_SLEEP_MS = 10000;
export const CHERRY_BOMB_FUSE_MS = 2000;
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
  wallNut: {
    key: "wallNut",
    name: "Wall-nut",
    hp: 4000,
    cost: 50,
    rechargeMs: 15000,
    summary: "A sturdy defensive plant with 4,000 HP that changes appearance as it takes damage.",
  },
  chomper: {
    key: "chomper",
    name: "Chomper",
    hp: 300,
    cost: 100,
    rechargeMs: 10000,
    summary: "Eats zombies with 200 HP or less, or bites tougher zombies in the next tile for 40 damage.",
    damage: 40,
    shootMs: PEASHOOTER_SHOOT_MS,
  },
  cherryBomb: {
    key: "cherryBomb",
    name: "Cherry Bomb",
    hp: 1,
    cost: 150,
    rechargeMs: 20000,
    summary: "Explodes after 3 seconds, dealing 1,000 damage to every zombie in a 3x3 area.",
    damage: 1000,
  },
};

export interface ZombieSpec {
  key: string;
  name: string;
  summary: string;
  coinDropChance: number;
  hp: number;
  moveMs: number;
  attackMs: number;
  damage: number;
  armor: number;
}

export const ZOMBIE_SPECS: Record<string, ZombieSpec> = {
  basic: {
    key: "basic",
    name: "Basic Zombie",
    summary: "A steady walker that advances toward the house and attacks plants at close range.",
    coinDropChance: 0.01,
    hp: ZOMBIE_HP,
    moveMs: ZOMBIE_MOVE_MS,
    attackMs: ZOMBIE_ATTACK_MS,
    damage: 50,
    armor: 0,
  },
  imp: {
    key: "imp",
    name: "Imp",
    summary: "A smaller, faster zombie that reaches the lawn sooner but has less health.",
    coinDropChance: 0.01,
    hp: 120,
    moveMs: Math.round(ZOMBIE_MOVE_MS / 1.5),
    attackMs: ZOMBIE_ATTACK_MS,
    damage: 50,
    armor: 0,
  },
  cone: {
    key: "cone",
    name: "Conehead Zombie",
    summary: "A durable zombie protected by a traffic cone that absorbs extra damage.",
    coinDropChance: 0.02,
    hp: ZOMBIE_HP,
    moveMs: ZOMBIE_MOVE_MS,
    attackMs: ZOMBIE_ATTACK_MS,
    damage: 50,
    armor: 340,
  },
};
