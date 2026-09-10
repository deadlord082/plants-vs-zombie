import type { LevelConfig } from "../types";
import type { CompiledLevelConfig, LevelDefinition } from "./types";

const validateTileMap = (tiles: LevelDefinition["tiles"], levelId: number) => {
  const width = tiles[0]?.length || 0;
  if (width === 0 || tiles.some((row) => row.length !== width)) {
    throw new Error(`Level ${levelId} must define a non-empty rectangular tile map.`);
  }
};

/**
 * Compiles a level definition into a game-usable format
 */
export function compileLevelDefinition(def: LevelDefinition): CompiledLevelConfig {
  validateTileMap(def.tiles, def.id);

  // Calculate total pre-wave zombies
  const regularWaves = def.waves.filter((wave) => !wave.bossWaves);
  const bossWaves = def.waves.filter((wave) => wave.bossWaves);
  const spawnWaves: CompiledLevelConfig["spawnWaves"] = [];
  const preWaveCount = regularWaves.reduce((sum, wave) => sum + wave.zombies.reduce((batchSum, spawn) => batchSum + spawn.count, 0), 0);

  // Build wave spawn batches; the scheduler releases each zombie at the wave interval.
  const waveSpawns: Array<Array<{ type: "basic" | "imp" | "cone"; index: number }>> = [];
  let zombieIndex = 0;
  for (const wave of def.waves) {
    const batchZombies: Array<{ type: "basic" | "imp" | "cone"; index: number }> = [];
    for (const spawn of wave.zombies) {
      for (let i = 0; i < spawn.count; i++) {
        batchZombies.push({ type: spawn.type, index: zombieIndex });
        zombieIndex++;
      }
    }
    if (wave.bossWaves) {
      spawnWaves.push({ zombies: batchZombies, isBoss: true });
    } else {
      waveSpawns.push(batchZombies);
      spawnWaves.push({ zombies: batchZombies, isBoss: false });
    }
  }

  // Calculate boss wave counts
  const wave1Count = bossWaves[0] ? bossWaves[0].zombies.reduce((sum, spawn) => sum + spawn.count, 0) : 0;
  const midCount = bossWaves[1] ? bossWaves[1].zombies.reduce((sum, spawn) => sum + spawn.count, 0) : 0;
  const wave2Count = bossWaves[2] ? bossWaves[2].zombies.reduce((sum, spawn) => sum + spawn.count, 0) : 0;

  // Build boss wave sequences
  const bossWaveSequences: Array<Array<{ type: "basic" | "imp" | "cone"; index: number }>> = [];
  for (const bossWave of bossWaves) {
    const waveSequence: Array<{ type: "basic" | "imp" | "cone"; index: number }> = [];
    zombieIndex = 0;
    for (const spawn of bossWave.zombies) {
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
    skySunIntervalMs: def.skySunIntervalMs,
    reward: def.reward,
    tiles: def.tiles,
    preWaveCount,
    wave1Count,
    midCount,
    wave2Count,
    waveSpawns,
    bossWaveSequences,
    spawnWaves,
    totalZombieCount: spawnWaves.reduce((total, wave) => total + wave.zombies.length, 0),
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
    skySunIntervalMs: compiled.skySunIntervalMs,
    reward: compiled.reward,
    tiles: compiled.tiles,
  };
}
