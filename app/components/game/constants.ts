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
export const CHOMPER_SLEEP_MS = 20000;
export const CHERRY_BOMB_FUSE_MS = 2000;
export const ICEBERG_LETTUCE_FUSE_MS = 1000;
export const PROJECTILE_SPEED_PER_TICK = 0.8;
export const GAME_TICK_MS = 200;

export const BASE_PLANT_TYPES: BasePlantTypeKey[] = ["sunflower", "peaShooter", "wallNut", "chomper", "cherryBomb", "icebergLettuce", "puffShroom", "fumeShroom", "hypnoShroom", "graveBuster"];

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
    cost: 150,
    rechargeMs: 10000,
    summary: "Eats zombies with 200 HP or less, or bites tougher zombies in the next tile for 40 damage.",
    damage: 40,
    shootMs: PEASHOOTER_SHOOT_MS,
  },
  cherryBomb: {
    key: "cherryBomb",
    name: "Cherry Bomb",
    hp: 300,
    cost: 150,
    rechargeMs: 20000,
    summary: "Explodes after 2 seconds, dealing 1,000 damage to every zombie in a 3x3 area.",
    damage: 1000,
  },
  icebergLettuce: {
    key: "icebergLettuce",
    name: "Iceberg Lettuce",
    hp: 300,
    cost: 25,
    rechargeMs: 15000,
    summary: "Waits for a zombie, then freezes every zombie in its tile for 10 seconds.",
    freezeDurationMs: 10000,
    freezeOnContact: true,
    triggerExplosion: true,
  },
  puffShroom: {
    key: "puffShroom", name: "Puff-shroom", hp: 80, cost: 0, rechargeMs: 5000,
    summary: "A free short-range shooter. Its spores reach up to three tiles and deal 5 damage.",
    damage: 5, shootMs: PEASHOOTER_SHOOT_MS, projectileImage: "/plants/spore2.webp",
    projectileRange: 3, puffStack: true,
  },
  fumeShroom: {
    key: "fumeShroom", name: "Fume-shroom", hp: 300, cost: 125, rechargeMs: 10000,
    summary: "Fires every 2 seconds, damaging all zombies from its tile through five tiles ahead.",
    damage: 30, shootMs: 2000, fumeAttack: true, fumeAttackRange: 5, animationDurationMs: 500,
  },
  hypnoShroom: {
    key: "hypnoShroom", name: "Hypno-shroom", hp: 300, cost: 100, rechargeMs: 10000,
    summary: "Converts a zombie that bites it into an ally, unless that attack destroys it.",
    hypnotizeOnBite: true,
  },
  graveBuster: {
    key: "graveBuster", name: "Grave Buster", hp: 300, cost: 50, rechargeMs: 15000,
    summary: "Consumes a statue or gravestone over five seconds. It can only be planted on an obstacle.",
    plantImage: "/plants/grave-buster.webp",
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
    blocksPoleVault: true,
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
    summary: "A Sunflower fused with another Sunflower. It produces 125 sun every 30 seconds.",
    generateAmount: 50, generateMs: SUNFLOWER_GENERATION_MS, firstBurstMs: SUNFLOWER_FIRST_BURST_MS,
    fusionOf: ["sunflower", "sunflower"],
  },
  sunBomb: {
    key: "sunBomb", name: "Sun Bomb", hp: 300, cost: 0, rechargeMs: 0,
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
    summary: "A Chomper fused with a Pea Shooter. It fires 20-damage peas while awake and eats nearby zombies.",
    damage: 40, projectileDamage: 20, shootMs: PEASHOOTER_SHOOT_MS,
    projectileImage: "/plants/chomp-shooter-projectile.webp", fusionOf: ["peaShooter", "chomper"],
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
  frozenCherry: {
    key: "frozenCherry", name: "Frozen Cherry", hp: 300, cost: 0, rechargeMs: 0,
    summary: "An Iceberg Lettuce fused with a Cherry Bomb. It explodes in a 3x3 area and freezes zombies.",
    damage: 1000, freezeDurationMs: 5000, freezeOnContact: true, triggerExplosion: true,
    fusionOf: ["cherryBomb", "icebergLettuce"],
  },
  snowPeashooter: {
    key: "snowPeashooter", name: "Snow Peashooter", hp: 300, cost: 0, rechargeMs: 0,
    summary: "An Iceberg Lettuce fused with a Pea Shooter. Its snow peas deal 20 damage and freeze zombies for 1 second.",
    damage: 20, shootMs: PEASHOOTER_SHOOT_MS, projectileImage: "/plants/snow-pea-projectile.webp", freezeOnHit: true,
    freezeDurationMs: 2000, fusionOf: ["peaShooter", "icebergLettuce"],
  },
  frostNut: {
    key: "frostNut", name: "Frost-nut", hp: 4000, cost: 0, rechargeMs: 0,
    summary: "An Iceberg Lettuce fused with a Wall-nut. Zombies that bite it are frozen for 5 seconds.",
    freezeOnContact: true, freezeDurationMs: 5000, fusionOf: ["wallNut", "icebergLettuce"],
  },
  iceShroom: {
    key: "iceShroom", name: "Ice-shroom", hp: 300, cost: 0, rechargeMs: 0,
    summary: "Waits for a zombie, then freezes every zombie on the lawn for 10 seconds.",
    freezeDurationMs: 10000, freezeOnContact: true, triggerExplosion: true, freezeAllZombies: true,
    plantImage: "/plants/Ice-shroom.webp", fusionOf: ["icebergLettuce", "icebergLettuce"],
  },
  sunShroom: {
    key: "sunShroom", name: "Sun-shroom", hp: 80, cost: 0, rechargeMs: 0,
    summary: "A Puff-shroom-sized sun producer. It gives 25 sun per burst, increasing to 50 after 100 seconds.",
    generateAmount: 25, generateMs: SUNFLOWER_GENERATION_MS, firstBurstMs: SUNFLOWER_FIRST_BURST_MS,
    generationGrowthMs: 100000, generationGrowthAmount: 50, puffStack: true, plantImage: "/plants/sun-shroom.webp",
    fusionOf: ["puffShroom", "sunflower"],
  },
  nibbleShroom: {
    key: "nibbleShroom", name: "Nibble-shroom", hp: 80, cost: 0, rechargeMs: 0,
    summary: "Jumps through nearby zombies for 80 damage, then lets the triggered zombies pass by.",
    puffStack: true, jumpAttack: true, damage: 80, shootMs: PEASHOOTER_SHOOT_MS,
    plantImage: "/plants/nibble-shroom.webp", fusionOf: ["chomper", "puffShroom"],
  },
  peaShroom: {
    key: "peaShroom", name: "Pea-shroom", hp: 80, cost: 0, rechargeMs: 0,
    summary: "A small Puff-shroom that fires 10-damage peas.",
    damage: 10, shootMs: PEASHOOTER_SHOOT_MS, projectileDamage: 10, puffStack: true,
    plantImage: "/plants/pea-shroom.webp", fusionOf: ["peaShooter", "puffShroom"],
  },
  miniNutShroom: {
    key: "miniNutShroom", name: "Mini-nut-shroom", hp: 1000, cost: 0, rechargeMs: 0,
    summary: "A Puff-shroom-sized defensive plant with 1,000 HP.",
    puffStack: true, plantImage: "/plants/mini-Nut-shroom.webp", fusionOf: ["puffShroom", "wallNut"],
  },
  miniIceShroom: {
    key: "miniIceShroom", name: "Mini-ice-shroom", hp: 80, cost: 0, rechargeMs: 0,
    summary: "A small Puff-shroom that freezes the zombie that touches it after a 0.4-second fuse.",
    puffStack: true, triggerExplosion: true, freezeOnContact: true, freezeDurationMs: 5000,
    plantImage: "/plants/mini-ice-shroom.webp", fusionOf: ["icebergLettuce", "puffShroom"],
  },
  miniHypnoShroom: {
    key: "miniHypnoShroom", name: "Mini-hypno-shroom", hp: 80, cost: 0, rechargeMs: 0,
    summary: "Converts a zombie that bites it into an ally with one-quarter of its usual stats.",
    puffStack: true, hypnotizeOnBite: true, hypnotizedHpMultiplier: 0.25, hypnotizedVisualScale: 0.7,
    plantImage: "/plants/mini-hypno-shroom.webp", fusionOf: ["hypnoShroom", "puffShroom"],
  },
  brightShroom: {
    key: "brightShroom", name: "Bright-shroom", hp: 300, cost: 0, rechargeMs: 0,
    summary: "Produces 200 sun every 45 seconds, with its first burst after 10 seconds.",
    generateAmount: 200, generateMs: 45000, firstBurstMs: SUNFLOWER_FIRST_BURST_MS,
    plantImage: "/plants/bright-shroom.png", fusionOf: ["fumeShroom", "sunflower"],
  },
  gluttonShroom: {
    key: "gluttonShroom", name: "Glutton-shroom", hp: 300, cost: 0, rechargeMs: 0,
    summary: "A Fume-shroom that can eat one nearby weak zombie; afterward it deals 60 damage twice as often.",
    damage: 30, shootMs: 2000, fumeAttack: true, fumeAttackRange: 5, animationDurationMs: 500,
    eatOnce: true, eatHpLimit: 200, plantImage: "/plants/glutton-shroom.png", fusionOf: ["chomper", "fumeShroom"],
  },
  triggerShroom: {
    key: "triggerShroom", name: "Trigger-shroom", hp: 300, cost: 0, rechargeMs: 0,
    summary: "Each zombie hit by its Fume-shroom attack triggers an additional 10-damage blast nearby.",
    damage: 30, shootMs: 2000, fumeAttack: true, fumeAttackRange: 5, animationDurationMs: 500,
    fumeBlastDamage: 10, plantImage: "/plants/trigger-shroom.webp", fusionOf: ["cherryBomb", "fumeShroom"],
  },
  rushShroom: {
    key: "rushShroom", name: "Rush-shroom", hp: 300, cost: 0, rechargeMs: 0,
    summary: "A Fume-shroom that attacks every 1.14 seconds with a shorter spore animation.",
    damage: 30, shootMs: 2000, fireRateMultiplier: 1 / 1.75, fumeAttack: true, fumeAttackRange: 5,
    animationDurationMs: 375, plantImage: "/plants/rush-shroom.webp", fusionOf: ["fumeShroom", "peaShooter"],
  },
  fumeNut: {
    key: "fumeNut", name: "Fume-nut", hp: 6000, cost: 0, rechargeMs: 0,
    summary: "A durable Wall-nut with 6,000 HP.",
    plantImage: "/plants/fume-nut.webp", fusionOf: ["fumeShroom", "wallNut"],
  },
  frostShroom: {
    key: "frostShroom", name: "Frost-shroom", hp: 300, cost: 0, rechargeMs: 0,
    summary: "A Fume-shroom that freezes every zombie hit for one second.",
    damage: 30, shootMs: 2000, fumeAttack: true, fumeAttackRange: 5, fumeFreezeDurationMs: 1000,
    animationDurationMs: 500, plantImage: "/plants/frost-shroom.webp", fusionOf: ["fumeShroom", "icebergLettuce"],
  },
  perfumeShroom: {
    key: "perfumeShroom", name: "Perfume-shroom", hp: 300, cost: 0, rechargeMs: 0,
    summary: "Each Fume-shroom attack has a 3% chance to hypnotize each zombie it hits.",
    damage: 30, shootMs: 2000, fumeAttack: true, fumeAttackRange: 5, hypnotizeChance: 0.03,
    animationDurationMs: 500, plantImage: "/plants/perfume-shroom.webp", fusionOf: ["fumeShroom", "hypnoShroom"],
  },
  gloomShroom: {
    key: "gloomShroom", name: "Gloom-shroom", hp: 300, cost: 0, rechargeMs: 0,
    summary: "Deals 50 damage every second to zombies in a 3-by-3 area while releasing spores in eight directions.",
    damage: 50, shootMs: 1000, fumeAttack: true, fumeAttackRange: 1, fumeAttackRadius: 1, animationDurationMs: 500,
    plantImage: "/plants/gloom-shroom.webp", fusionOf: ["fumeShroom", "fumeShroom"],
  },
  hypnoChomper: {
    key: "hypnoChomper", name: "Hypno-chomper", hp: 300, cost: 0, rechargeMs: 0,
    summary: "Eats weak zombies like a Chomper and returns them to battle as allies.",
    damage: 40, shootMs: PEASHOOTER_SHOOT_MS, hypnotizeOnEat: true,
    plantImage: "/plants/hypno-chomper.webp", fusionOf: ["chomper", "hypnoShroom"],
  },
  hypnoNut: {
    key: "hypnoNut", name: "Hypno-nut", hp: 4000, cost: 0, rechargeMs: 0,
    summary: "A Wall-nut that has a 3% chance to hypnotize a zombie each time it is attacked.",
    hypnotizeChance: 0.03, plantImage: "/plants/hypno-nut.webp", fusionOf: ["hypnoShroom", "wallNut"],
  },
  hypnoPea: {
    key: "hypnoPea", name: "Hypno-pea", hp: 300, cost: 0, rechargeMs: 0,
    summary: "A Pea Shooter whose peas have a 3% chance to hypnotize the zombie they hit.",
    damage: 20, shootMs: PEASHOOTER_SHOOT_MS, hypnotizeChance: 0.03,
    plantImage: "/plants/hypno-pea.webp", fusionOf: ["hypnoShroom", "peaShooter"],
  },
  cryonicShroom: {
    key: "cryonicShroom", name: "Cryonic-shroom", hp: 300, cost: 0, rechargeMs: 0,
    summary: "Hypnotizes the zombie that bites it and freezes it for five seconds.",
    hypnotizeOnBite: true, hypnotizeFreezes: true,
    plantImage: "/plants/cryonic-shroom.webp", fusionOf: ["hypnoShroom", "icebergLettuce"],
  },
  catalystShroom: {
    key: "catalystShroom", name: "Catalyst-shroom", hp: 300, cost: 0, rechargeMs: 0,
    summary: "Hypnotizes the zombie that bites it; that zombie explodes for 1,000 damage when defeated.",
    hypnotizeOnBite: true, deathExplosionOnHypnotize: true,
    plantImage: "/plants/catalyst-shroom.png", fusionOf: ["cherryBomb", "hypnoShroom"],
  },
  empressShroom: {
    key: "empressShroom", name: "Empress-shroom", hp: 300, cost: 0, rechargeMs: 0,
    summary: "Hypnotizes attackers and summons a random allied zombie every 30 seconds.",
    hypnotizeOnBite: true, spawnedHypnotizedZombieMs: 30000,
    plantImage: "/plants/empress-shroom.webp", fusionOf: ["hypnoShroom", "hypnoShroom"],
  },
  iceChomper: {
    key: "iceChomper", name: "Ice-chomper", hp: 300, cost: 0, rechargeMs: 0,
    summary: "Eats weak zombies and freezes every other zombie on the lawn for two seconds.",
    damage: 40, shootMs: PEASHOOTER_SHOOT_MS, eatHpLimit: 200, attackFreezeDurationMs: 2000,
    plantImage: "/plants/ice-chomper.webp", fusionOf: ["chomper", "icebergLettuce"],
  },
  chomperMaw: {
    key: "chomperMaw", name: "Chomper Maw", hp: 300, cost: 0, rechargeMs: 0,
    summary: "A Chomper that bites for 80 damage and eats zombies with up to 1,000 HP.",
    damage: 80, shootMs: PEASHOOTER_SHOOT_MS, eatHpLimit: 1000,
    plantImage: "/plants/chomper_maw.webp", fusionOf: ["chomper", "chomper"],
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
  "cherryBomb+icebergLettuce": "frozenCherry",
  "icebergLettuce+peaShooter": "snowPeashooter",
  "icebergLettuce+wallNut": "frostNut",
  "icebergLettuce+icebergLettuce": "iceShroom",
  "puffShroom+sunflower": "sunShroom",
  "chomper+puffShroom": "nibbleShroom",
  "peaShooter+puffShroom": "peaShroom",
  "puffShroom+wallNut": "miniNutShroom",
  "icebergLettuce+puffShroom": "miniIceShroom",
  "hypnoShroom+puffShroom": "miniHypnoShroom",
  "fumeShroom+sunflower": "brightShroom",
  "chomper+fumeShroom": "gluttonShroom",
  "cherryBomb+fumeShroom": "triggerShroom",
  "fumeShroom+peaShooter": "rushShroom",
  "fumeShroom+wallNut": "fumeNut",
  "fumeShroom+icebergLettuce": "frostShroom",
  "fumeShroom+hypnoShroom": "perfumeShroom",
  "fumeShroom+fumeShroom": "gloomShroom",
  "chomper+hypnoShroom": "hypnoChomper",
  "hypnoShroom+wallNut": "hypnoNut",
  "hypnoShroom+peaShooter": "hypnoPea",
  "hypnoShroom+icebergLettuce": "cryonicShroom",
  "cherryBomb+hypnoShroom": "catalystShroom",
  "hypnoShroom+hypnoShroom": "empressShroom",
  "chomper+icebergLettuce": "iceChomper",
  "chomper+chomper": "chomperMaw",
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
  wallNutZombie: {
    key: "wallNutZombie", name: "Wall-nut Zombie", summary: "A zombie with a Wall-nut's resilience and 2,000 health.", coinDropChance: 0.01,
    hp: 2000, moveMs: ZOMBIE_MOVE_MS, attackMs: ZOMBIE_ATTACK_MS, damage: 50, armor: 0,
  },
  peashooterZombie: {
    key: "peashooterZombie", name: "Peashooter Zombie", summary: "A zombie that fires peas down its lane at plants.", coinDropChance: 0.01,
    hp: ZOMBIE_HP, moveMs: ZOMBIE_MOVE_MS, attackMs: ZOMBIE_ATTACK_MS, damage: 50, armor: 0,
  },
  horseman: {
    key: "horseman", name: "Zombie Horseman", summary: "A fast zombie that runs twice as quickly as a Basic Zombie.", coinDropChance: 0.01,
    hp: 1200, moveMs: ZOMBIE_MOVE_MS / 2, attackMs: ZOMBIE_ATTACK_MS, damage: 50, armor: 0,
  },
  undyingWraith: {
    key: "undyingWraith", name: "Undying Wraith", summary: "A ghostly zombie that passes through plants without attacking them.", coinDropChance: 0.01,
    hp: ZOMBIE_HP, moveMs: ZOMBIE_MOVE_MS, attackMs: ZOMBIE_ATTACK_MS, damage: 50, armor: 0,
  },
  poleVaulting: {
    key: "poleVaulting", name: "Pole Vaulting Zombie", summary: "Runs like an Imp, vaults over the first plant, then walks at Basic Zombie speed.", coinDropChance: 0.01,
    hp: ZOMBIE_HP, moveMs: Math.round(ZOMBIE_MOVE_MS / 1.5), attackMs: ZOMBIE_ATTACK_MS, damage: 50, armor: 0,
  },
};
