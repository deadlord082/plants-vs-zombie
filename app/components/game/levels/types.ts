/**
 * Level definition types for easy level creation
 */

export interface ZombieSpawn {
  type: "basic" | "imp" | "cone";
  count: number;
}

export interface LevelDefinition {
  id: number;
  title: string;
  description: string;
  initialDelayMs: number;
  regularSpawnIntervalMs: number;
  betweenWaveDelayMs: number;
  waveSpawnIntervalMs: number;
  // Waves of pre-boss spawns (each sub-array spawns together, separate arrays are separated by regularSpawnIntervalMs)
  waves: ZombieSpawn[][];
  // Boss waves (harder waves that spawn after main waves)
  bossWaves: ZombieSpawn[][];
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
  // Total pre-wave zombies
  preWaveCount: number;
  // Total zombies in each boss wave
  wave1Count: number;
  midCount: number;
  wave2Count: number;
  // Spawn batches for pre-waves (each batch spawns together)
  waveSpawns: Array<Array<{ type: "basic" | "imp" | "cone"; index: number }>>;
  // Boss wave sequences
  bossWaveSequences: Array<Array<{ type: "basic" | "imp" | "cone"; index: number }>>;
}
