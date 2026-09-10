export type PlantTypeKey = "sunflower" | "peaShooter" | "wallNut" | "chomper" | "cherryBomb";
export type GamePhase = "menu" | "level-select" | "shop" | "loadout" | "almanac" | "playing" | "complete";
import type { TileType } from "./tiles";

export interface LevelReward {
  money?: number;
  unlockPlants?: PlantTypeKey[];
}

export interface LevelConfig {
  id: number;
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
}

export interface Projectile {
  id: string;
  row: number;
  x: number;
  damage: number;
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
