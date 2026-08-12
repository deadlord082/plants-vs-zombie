export type PlantTypeKey = "sunflower" | "peaShooter";
export type GamePhase = "menu" | "level-select" | "playing" | "complete";

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
  sunIntervalMs?: number; // randomized sun generation interval
  shootIntervalMs?: number; // randomized attack interval
}

export interface ZombieInstance {
  id: string;
  row: number;
  col: number;
  x: number;
  hp: number;
  lastMoveAt: number;
  lastAttackAt: number;
  isWave: boolean;
  spawnedAt: number;
}

export interface Projectile {
  id: string;
  row: number;
  x: number;
  damage: number;
}
