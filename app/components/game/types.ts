export type BasePlantTypeKey = "sunflower" | "peaShooter" | "wallNut" | "chomper" | "cherryBomb" | "icebergLettuce" | "puffShroom" | "fumeShroom" | "hypnoShroom" | "graveBuster";
export type FusionPlantTypeKey = "peanut" | "sunNut" | "tallNut" | "chompNut" | "explodeONut" | "twinSunflower" | "sunBomb" | "sunChomper" | "sunshooter" | "repeater" | "chompShooter" | "cherryBomber" | "cherryChomper" | "frozenCherry" | "snowPeashooter" | "frostNut" | "sunShroom" | "nibbleShroom" | "peaShroom" | "miniNutShroom" | "miniIceShroom" | "miniHypnoShroom" | "brightShroom" | "gluttonShroom" | "triggerShroom" | "rushShroom" | "fumeNut" | "frostShroom" | "perfumeShroom" | "gloomShroom" | "hypnoChomper" | "hypnoNut" | "hypnoPea" | "cryonicShroom" | "catalystShroom" | "empressShroom" | "iceChomper" | "chomperMaw" | "iceShroom";
export type PlantTypeKey = BasePlantTypeKey | FusionPlantTypeKey;
export type LevelCategory = "day" | "night" | "pool" | "fog" | "roof" | "mini-game";
export type GamePhase = "menu" | "category-select" | "level-select" | "shop" | "almanac" | "credits" | "loadout" | "playing" | "complete";
export type LevelChallenge =
  | { type: "produceSun"; amount: number }
  | { type: "maxSunSpent"; amount: number }
  | { type: "maxPlantsLost"; amount: number }
  | { type: "maxPlantsOnLawn"; amount: number }
  | { type: "usePlant"; plants: BasePlantTypeKey[] }
  | { type: "killZombiesWithin"; count: number; seconds: number };
import type { TileType } from "./tiles";

export interface LevelReward {
  money?: number;
  unlockPlants?: BasePlantTypeKey[];
  glove?: boolean;
}

export interface LevelConfig {
  id: number;
  category: LevelCategory;
  unlockAfterLevelId?: number;
  title: string;
  description: string;
  introTexts?: string[];
  challenges?: LevelChallenge[];
  backgroundImage?: string;
  musicTrack?: string;
  preWaveCount: number;
  wave1Count: number;
  midCount: number;
  wave2Count: number;
  initialDelayMs: number;
  regularSpawnIntervalMs: number;
  betweenWaveDelayMs: number;
  waveSpawnIntervalMs: number;
  skySunIntervalMs?: number;
  gloveRechargeMs: number;
  reward?: LevelReward;
  tiles: TileType[][];
}

export interface PlantSpec {
  key: PlantTypeKey;
  name: string;
  hp: number;
  cost: number;
  rechargeMs: number;
  summary: string;
  damage?: number;
  generateAmount?: number;
  generateMs?: number;
  firstBurstMs?: number;
  shootMs?: number;
  fusionOf?: [BasePlantTypeKey, BasePlantTypeKey];
  pierces?: boolean;
  regeneration?: number;
  explosionOnDamageStage?: boolean;
  projectileImage?: string;
  projectileDamage?: number;
  projectileBlastDamage?: number;
  projectileBlastRadius?: number;
  projectileSunOnKill?: number;
  bonusSunOnEat?: number;
  shotsPerBurst?: number;
  shotDelayMs?: number;
  fireRateMultiplier?: number;
  eatProjectileCount?: number;
  eatProjectileDamage?: number;
  eatProjectileImage?: string;
  eatExplosionDamage?: number;
  freezeDurationMs?: number;
  freezeOnContact?: boolean;
  freezeOnHit?: boolean;
  triggerExplosion?: boolean;
  blocksPoleVault?: boolean;
  plantImage?: string;
  puffStack?: boolean;
  projectileRange?: number;
  fumeAttackRange?: number;
  fumeAttackRadius?: number;
  fumeAttack?: boolean;
  fumeBlastDamage?: number;
  fumeFreezeDurationMs?: number;
  animationDurationMs?: number;
  generationGrowthMs?: number;
  generationGrowthAmount?: number;
  hypnotizeChance?: number;
  hypnotizedHpMultiplier?: number;
  hypnotizedVisualScale?: number;
  hypnotizeOnBite?: boolean;
  hypnotizeOnEat?: boolean;
  hypnotizeFreezes?: boolean;
  deathExplosionOnHypnotize?: boolean;
  spawnedHypnotizedZombieMs?: number;
  eatHpLimit?: number;
  eatOnce?: boolean;
  jumpAttack?: boolean;
  attackFreezeDurationMs?: number;
  freezeAllZombies?: boolean;
}

export interface PlantInstance {
  id: string;
  type: PlantTypeKey;
  row: number;
  col: number;
  hp: number;
  plantedAt: number;
  nextSunAt?: number;
  nextShotAt?: number;
  lastContactAt?: number;
  sleepingUntil?: number;
  cherryBombExplodesAt?: number;
  sunIntervalMs?: number; // randomized sun generation interval
  shootIntervalMs?: number; // randomized attack interval
  pendingShots?: number;
  nextPendingShotAt?: number;
  nextSunValue?: number;
  obstacleDestroyAt?: number;
  jumpStartedAt?: number;
  jumpTargetX?: number;
  hasEaten?: boolean;
  nextAnimationShotAt?: number;
  fumeAnimatingUntil?: number;
  jumpAttack?: boolean;
  jumpHitZombieIds?: string[];
}

export interface StatueInstance {
  id: string;
  row: number;
  col: number;
  type: "sunflowerStatue" | "sunShroomStatue" | "grave";
  hp?: number;
  image?: string;
}

export interface ZombieInstance {
  id: string;
  row: number;
  col: number;
  x: number;
  hp: number;
  armor: number;
  lastMoveAt: number;
  lastAttackAt: number;
  isWave: boolean;
  spawnedAt: number;
  type: string;
  armorBrokenAt?: number;
  contactStartedAt?: number;
  sunOnKill?: number;
  nextShotAt?: number;
  poleVaulted?: boolean;
  poleVaultingUntil?: number;
  poleVaultStartedAt?: number;
  poleVaultStartX?: number;
  poleVaultTargetX?: number;
  frozenUntil?: number;
  hypnotized?: boolean;
  hypnotizedHpMultiplier?: number;
  hypnotizedStatMultiplier?: number;
  hypnotizedVisualScale?: number;
  hypnoDeathExplosion?: boolean;
  freezingAttacks?: boolean;
  ignoredPlantIds?: string[];
  nextAttackTargetId?: string;
  visualY?: number;
}

export interface Projectile {
  id: string;
  row: number;
  x: number;
  damage: number;
  pierces: boolean;
  hitZombieIds?: string[];
  image?: string;
  blastDamage?: number;
  blastRadius?: number;
  sunOnKill?: number;
  launchAt?: number;
  freezeDurationMs?: number;
  maxX?: number;
  visualOnly?: boolean;
  speedPerTick?: number;
  speedXPerTick?: number;
  speedYPerTick?: number;
  visualY?: number;
  originX?: number;
  originY?: number;
  maxDistance?: number;
  expiresAt?: number;
  hypnotizeChance?: number;
}

export interface SunInstance {
  id: string;
  row: number;
  x: number;
  y: number;
  value: number;
  expiresAt: number;
  startX?: number;
  targetX?: number;
  startY?: number;
  peakY?: number;
  targetY?: number;
  fallSpeedTilesPerMs?: number;
  launchAt?: number;
  velocityY?: number;
  gravity?: number;
  arcDurationMs?: number;
  risingFrom?: number;
  risingUntil?: number;
  fallingUntil?: number;
}

export interface CoinInstance {
  id: string;
  row: number;
  x: number;
  y: number;
  value: number;
  image: string;
  expiresAt: number;
}

export interface ZombieProjectile {
  id: string;
  row: number;
  x: number;
  damage: number;
  direction: -1 | 1;
  hypnotized?: boolean;
}
