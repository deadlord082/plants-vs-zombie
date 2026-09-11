import type { BasePlantTypeKey, PlantSpec, PlantTypeKey } from "./types";

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

export const BASE_PLANT_TYPES: BasePlantTypeKey[] = ["sunflower", "peaShooter", "wallNut", "chomper", "cherryBomb"];

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
    summary: "Explodes after 2 seconds, dealing 1,000 damage to every zombie in a 3x3 area.",
    damage: 1000,
  },
  peanut: {
    key: "peanut",
    name: "Peanut",
    hp: 4000,
    cost: 0,
    rechargeMs: 0,
    summary: "A Wall-nut fused with a Pea Shooter. It fires piercing nut projectiles for 20 damage.",
    damage: 20,
    shootMs: PEASHOOTER_SHOOT_MS,
    projectileImage: "/plants/peanut-projectile.png",
    fusionOf: ["peaShooter", "wallNut"],
    pierces: true,
  },
  sunNut: {
    key: "sunNut",
    name: "Sun-nut",
    hp: 4000,
    cost: 0,
    rechargeMs: 0,
    generateAmount: 50,
    generateMs: SUNFLOWER_GENERATION_MS,
    firstBurstMs: SUNFLOWER_FIRST_BURST_MS,
    summary: "A Wall-nut fused with a Sunflower. It generates sun like a Sunflower.",
    fusionOf: ["sunflower", "wallNut"],
  },
  tallNut: {
    key: "tallNut",
    name: "Tall-nut",
    hp: 8000,
    cost: 0,
    rechargeMs: 0,
    summary: "Two Wall-nuts fused together, creating a barrier with 8,000 HP.",
    fusionOf: ["wallNut", "wallNut"],
  },
  chompNut: {
    key: "chompNut",
    name: "Chomp-nut",
    hp: 4000,
    cost: 0,
    rechargeMs: 0,
    damage: 40,
    shootMs: PEASHOOTER_SHOOT_MS,
    summary: "A Wall-nut fused with a Chomper. It eats weak zombies and restores 200 HP each time it eats.",
    fusionOf: ["chomper", "wallNut"],
    regeneration: 200,
  },
  explodeONut: {
    key: "explodeONut",
    name: "Explode-o-nut",
    hp: 4000,
    cost: 0,
    rechargeMs: 0,
    summary: "A Wall-nut fused with a Cherry Bomb. Each damage stage change triggers a Cherry Bomb blast.",
    fusionOf: ["cherryBomb", "wallNut"],
    explosionOnDamageStage: true,
  },
  twinSunflower: {
    key: "twinSunflower", name: "Twin Sunflower", hp: 300, cost: 0, rechargeMs: 0,
    summary: "A Sunflower fused with another Sunflower. It produces 50 and 75 sun every 30 seconds.",
    generateAmount: 50, generateMs: SUNFLOWER_GENERATION_MS, firstBurstMs: SUNFLOWER_FIRST_BURST_MS,
    fusionOf: ["sunflower", "sunflower"],
  },
  sunBomb: {
    key: "sunBomb", name: "Sun Bomb", hp: 1, cost: 0, rechargeMs: 0,
    summary: "A Sunflower fused with a Cherry Bomb. Zombies killed by its blast become 25 sun.",
    damage: 1000, fusionOf: ["sunflower", "cherryBomb"],
  },
  sunChomper: {
    key: "sunChomper", name: "Sun Chomper", hp: 300, cost: 0, rechargeMs: 0,
    summary: "A Sunflower fused with a Chomper. It produces 50 sun after eating a zombie.",
    damage: 40, shootMs: PEASHOOTER_SHOOT_MS, bonusSunOnEat: 50, fusionOf: ["sunflower", "chomper"],
  },
  sunshooter: {
    key: "sunshooter", name: "Sunshooter", hp: 300, cost: 0, rechargeMs: 0,
    summary: "A Sunflower fused with a Pea Shooter. It produces sun and fires peas.",
    damage: 20, shootMs: PEASHOOTER_SHOOT_MS, generateAmount: 50, generateMs: SUNFLOWER_GENERATION_MS,
    firstBurstMs: SUNFLOWER_FIRST_BURST_MS, fusionOf: ["sunflower", "peaShooter"],
  },
  repeater: {
    key: "repeater", name: "Repeater", hp: 300, cost: 0, rechargeMs: 0,
    summary: "A Pea Shooter fused with another Pea Shooter. It fires two peas 100ms apart 20% faster.",
    damage: 20, shootMs: PEASHOOTER_SHOOT_MS, shotsPerBurst: 2, shotDelayMs: 100, fireRateMultiplier: 0.8,
    fusionOf: ["peaShooter", "peaShooter"],
  },
  chompShooter: {
    key: "chompShooter", name: "Chomp-shooter", hp: 300, cost: 0, rechargeMs: 0,
    summary: "A Chomper fused with a Pea Shooter. After eating, it fires three 80-damage projectiles before eating again.",
    damage: 40, shootMs: PEASHOOTER_SHOOT_MS, eatProjectileCount: 3, eatProjectileDamage: 80,
    eatProjectileImage: "/plants/chomp-shooter-projectile.webp", fusionOf: ["peaShooter", "chomper"],
  },
  cherryBomber: {
    key: "cherryBomber", name: "Cherry Bomber", hp: 300, cost: 0, rechargeMs: 0,
    summary: "A Pea Shooter fused with a Cherry Bomb. It fires Cherry Bomber projectiles that blast for 20 damage.",
    damage: 20, shootMs: PEASHOOTER_SHOOT_MS, projectileImage: "/plants/cherry-bomber-projectile.webp",
    projectileBlastDamage: 20, projectileBlastRadius: 1, fusionOf: ["peaShooter", "cherryBomb"],
  },
  cherryChomper: {
    key: "cherryChomper", name: "Cherry Chomper", hp: 300, cost: 0, rechargeMs: 0,
    summary: "A Chomper fused with a Cherry Bomb. Every zombie it eats triggers a 200-damage blast.",
    damage: 40, shootMs: PEASHOOTER_SHOOT_MS, eatExplosionDamage: 200, fusionOf: ["cherryBomb", "chomper"],
  },
};

export const FUSION_RECIPES: Record<string, PlantTypeKey> = {
  "peaShooter+wallNut": "peanut",
  "sunflower+wallNut": "sunNut",
  "wallNut+wallNut": "tallNut",
  "chomper+wallNut": "chompNut",
  "cherryBomb+wallNut": "explodeONut",
  "sunflower+sunflower": "twinSunflower",
  "cherryBomb+sunflower": "sunBomb",
  "chomper+sunflower": "sunChomper",
  "peaShooter+sunflower": "sunshooter",
  "peaShooter+peaShooter": "repeater",
  "chomper+peaShooter": "chompShooter",
  "cherryBomb+peaShooter": "cherryBomber",
  "cherryBomb+chomper": "cherryChomper",
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
    armor: 360,
  },
  bucket: {
    key: "bucket",
    name: "Buckethead Zombie",
    summary: "A durable zombie protected by a bucket that absorbs heavy damage.",
    coinDropChance: 0.02,
    hp: ZOMBIE_HP,
    moveMs: ZOMBIE_MOVE_MS,
    attackMs: ZOMBIE_ATTACK_MS,
    damage: 50,
    armor: 1000,
  },
  gargantuar: {
    key: "gargantuar",
    name: "Gargantuar",
    summary: "A massive zombie that moves slowly but hits plants with devastating force.",
    coinDropChance: 0.1,
    hp: 3600,
    moveMs: ZOMBIE_MOVE_MS * 1.5,
    attackMs: 2000,
    damage: 2000,
    armor: 0,
  },
};
