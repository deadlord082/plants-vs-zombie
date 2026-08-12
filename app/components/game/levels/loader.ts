import type { LevelConfig } from "../types";
import type { CompiledLevelConfig, LevelDefinition } from "./types";

/**
 * Compiles a level definition into a game-usable format
 */
export function compileLevelDefinition(def: LevelDefinition): CompiledLevelConfig {
  // Calculate total pre-wave zombies
  const preWaveCount = def.waves.reduce((sum, batch) => sum + batch.reduce((batchSum, spawn) => batchSum + spawn.count, 0), 0);

  // Build wave spawn batches (each batch spawns together at same time)
  const waveSpawns: Array<Array<{ type: "basic" | "imp" | "cone"; index: number }>> = [];
  let zombieIndex = 0;
  for (const batch of def.waves) {
    const batchZombies: Array<{ type: "basic" | "imp" | "cone"; index: number }> = [];
    for (const spawn of batch) {
      for (let i = 0; i < spawn.count; i++) {
        batchZombies.push({ type: spawn.type, index: zombieIndex });
        zombieIndex++;
      }
    }
    waveSpawns.push(batchZombies);
  }

  // Calculate boss wave counts
  const wave1Count = def.bossWaves[0] ? def.bossWaves[0].reduce((sum, spawn) => sum + spawn.count, 0) : 0;
  const midCount = def.bossWaves[1] ? def.bossWaves[1].reduce((sum, spawn) => sum + spawn.count, 0) : 0;
  const wave2Count = def.bossWaves[2] ? def.bossWaves[2].reduce((sum, spawn) => sum + spawn.count, 0) : 0;

  // Build boss wave sequences
  const bossWaveSequences: Array<Array<{ type: "basic" | "imp" | "cone"; index: number }>> = [];
  for (const bossWave of def.bossWaves) {
    const waveSequence: Array<{ type: "basic" | "imp" | "cone"; index: number }> = [];
    zombieIndex = 0;
    for (const spawn of bossWave) {
      for (let i = 0; i < spawn.count; i++) {
        waveSequence.push({ type: spawn.type, index: zombieIndex });
        zombieIndex++;
      }
    }
    bossWaveSequences.push(waveSequence);
  }

  return {
    id: def.id,
    title: def.title,
    description: def.description,
    initialDelayMs: def.initialDelayMs,
    regularSpawnIntervalMs: def.regularSpawnIntervalMs,
    betweenWaveDelayMs: def.betweenWaveDelayMs,
    waveSpawnIntervalMs: def.waveSpawnIntervalMs,
    preWaveCount,
    wave1Count,
    midCount,
    wave2Count,
    waveSpawns,
    bossWaveSequences,
  };
}

/**
 * Converts a compiled level config to the standard LevelConfig format
 * (Used for backwards compatibility)
 */
export function toLevelConfig(compiled: CompiledLevelConfig): LevelConfig {
  return {
    id: compiled.id,
    title: compiled.title,
    description: compiled.description,
    preWaveCount: compiled.preWaveCount,
    wave1Count: compiled.wave1Count,
    midCount: compiled.midCount,
    wave2Count: compiled.wave2Count,
    initialDelayMs: compiled.initialDelayMs,
    regularSpawnIntervalMs: compiled.regularSpawnIntervalMs,
    betweenWaveDelayMs: compiled.betweenWaveDelayMs,
    waveSpawnIntervalMs: compiled.waveSpawnIntervalMs,
  };
}
