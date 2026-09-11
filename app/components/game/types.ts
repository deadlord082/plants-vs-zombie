export type BasePlantTypeKey = "sunflower" | "peaShooter" | "wallNut" | "chomper" | "cherryBomb";
export type FusionPlantTypeKey = "peanut" | "sunNut" | "tallNut" | "chompNut" | "explodeONut" | "twinSunflower" | "sunBomb" | "sunChomper" | "sunshooter" | "repeater" | "chompShooter" | "cherryBomber" | "cherryChomper";
export type PlantTypeKey = BasePlantTypeKey | FusionPlantTypeKey;
export type LevelCategory = "day" | "night" | "pool" | "fog" | "roof" | "mini-game";
export type GamePhase = "menu" | "category-select" | "level-select" | "shop" | "almanac" | "credits" | "loadout" | "playing" | "complete";
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
