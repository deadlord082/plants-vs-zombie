/**
 * Level definition types for easy level creation
 */

import type { TileType } from "../tiles";
import type { LevelReward } from "../types";

export interface ZombieSpawn {
  type: "basic" | "imp" | "cone";
  count: number;
}

export interface WaveDefinition {
  zombies: ZombieSpawn[];
  bossWaves?: boolean;
}

export interface LevelDefinition {
  id: number;
  title: string;
  description: string;
  initialDelayMs: number;
  regularSpawnIntervalMs: number;
  betweenWaveDelayMs: number;
  waveSpawnIntervalMs: number;
  skySunIntervalMs?: number;
  reward?: LevelReward;
  tiles: TileType[][];
  // Each wave spawns together unless it is marked as a boss wave.
  waves: WaveDefinition[];
}

/**
 * Converted level config that the game uses
 */
export interface CompiledLevelConfig {
  id: number;
  title: string;
  description: string;
  initialDelayMs: number;
  regularSpawnIntervalMs: number;
  betweenWaveDelayMs: number;
  waveSpawnIntervalMs: number;
  skySunIntervalMs?: number;
  reward?: LevelReward;
  tiles: TileType[][];
  // Total pre-wave zombies
  preWaveCount: number;
  // Total zombies in each boss wave
  wave1Count: number;
  midCount: number;
  wave2Count: number;
  // Compiled regular wave batches, retained for progress and Almanac data.
  waveSpawns: Array<Array<{ type: "basic" | "imp" | "cone"; index: number }>>;
  // Boss wave sequences
  bossWaveSequences: Array<Array<{ type: "basic" | "imp" | "cone"; index: number }>>;
  spawnWaves: Array<{
    zombies: Array<{ type: "basic" | "imp" | "cone"; index: number }>;
    isBoss: boolean;
  }>;
  totalZombieCount: number;
}
