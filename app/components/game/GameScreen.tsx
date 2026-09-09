"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  INITIAL_SUN,
  PLANT_SPECS,
  PROJECTILE_SPEED_PER_TICK,
  SUNFLOWER_FIRST_BURST_MS,
  SUNFLOWER_GENERATION_MS,
  ZOMBIE_ATTACK_MS,
  ZOMBIE_HP,
  ZOMBIE_MOVE_MS,
  ZOMBIE_SPAWN_OFFSET,
  ZOMBIE_LEFT_TRIGGER_X,
  GAME_TICK_MS,
  PEASHOOTER_SHOOT_MS,
  SKY_SUN_FALL_SPEED_TILES_PER_MS,
  SKY_SUN_VALUE,
  SUN_FALL_SPEED_TILES_PER_MS,
  SUN_LIFETIME_MS,
  SUNFLOWER_ARC_DURATION_MS,
  SUNFLOWER_ARC_HEIGHT_TILES,
  ZOMBIE_SPECS,
} from "./constants";
import { getCompiledLevel } from "./levels";
import type {
  GamePhase,
  LevelConfig,
  PlantInstance,
  PlantTypeKey,
  CoinInstance,
  Projectile,
  SunInstance,
  ZombieInstance,
} from "./types";
import { LEVELS } from "./levels";
import { getTileDefinition, TILE_DEFINITIONS } from "./tiles";

const createId = () => Math.random().toString(36).slice(2, 9);

const tileKey = (row: number, col: number) => `${row}-${col}`;

const getGridRows = (level: LevelConfig | null) => level?.tiles.length || 0;
const getGridCols = (level: LevelConfig | null) => level?.tiles[0]?.length || 0;
const INITIAL_SEED_BANK_SIZE = 6;
const SEED_SLOT_COSTS = [50000, 80000];
const COIN_LIFETIME_MS = 15000;
const PLAYER_DATA_STORAGE_KEY = "plants-vs-zombie-player";
const DEFAULT_PLAYER_DATA: PlayerData = {
  money: 0,
  unlockedPlants: ["peaShooter"],
  completedLevels: [],
  seedBankSize: INITIAL_SEED_BANK_SIZE,
  seedSlotsPurchased: 0,
};
type AlmanacCategory = "plants" | "zombies" | "tiles";

interface PlayerData {
  money: number;
  unlockedPlants: PlantTypeKey[];
  completedLevels: number[];
  seedBankSize: number;
  seedSlotsPurchased: number;
}

const randomizeInterval = (interval: number): number => {
  const variance = 1 + (Math.random() - 0.5) * 0.2;
  return interval * variance;
};

export default function GameScreen() {
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [selectedPlant, setSelectedPlant] = useState<PlantTypeKey>("peaShooter");
  const [selectedLoadout, setSelectedLoadout] = useState<PlantTypeKey[]>([]);
  const [almanacCategory, setAlmanacCategory] = useState<AlmanacCategory>("plants");
  const [shovelSelected, setShovelSelected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedLevelId, setSelectedLevelId] = useState(1);
  const [currentLevel, setCurrentLevel] = useState<LevelConfig | null>(null);
  const [sun, setSun] = useState(INITIAL_SUN);
  const [plants, setPlants] = useState<PlantInstance[]>([]);
  const [zombies, setZombies] = useState<ZombieInstance[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [suns, setSuns] = useState<SunInstance[]>([]);
  const [coins, setCoins] = useState<CoinInstance[]>([]);
  const [regularSpawned, setRegularSpawned] = useState(0);
  const [wave1Spawned, setWave1Spawned] = useState(0);
  const [wave2Spawned, setWave2Spawned] = useState(0);
  const [waveActive, setWaveActive] = useState(false);
  const [plantReady, setPlantReady] = useState<Record<PlantTypeKey, number>>({
    sunflower: 0,
    peaShooter: 0,
  });
  const [gameTime, setGameTime] = useState(Date.now());
  const [levelComplete, setLevelComplete] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [showDebugHealth, setShowDebugHealth] = useState(false);
  const [playerData, setPlayerData] = useState<PlayerData>(DEFAULT_PLAYER_DATA);
  const [playerDataLoaded, setPlayerDataLoaded] = useState(false);
  const [rewardMessage, setRewardMessage] = useState("");

  const plantsRef = useRef<PlantInstance[]>([]);
  const zombiesRef = useRef<ZombieInstance[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const sunsRef = useRef<SunInstance[]>([]);
  const coinsRef = useRef<CoinInstance[]>([]);
  const sunRef = useRef(INITIAL_SUN);
  const regularSpawnedRef = useRef(0);
  const wave1SpawnedRef = useRef(0);
  const wave2SpawnedRef = useRef(0);
  const waveActiveRef = useRef(false);
  const plantReadyRef = useRef<Record<PlantTypeKey, number>>({
    sunflower: 0,
    peaShooter: 0,
  });
  const currentLevelRef = useRef<LevelConfig | null>(null);
  const compiledLevelRef = useRef<ReturnType<typeof getCompiledLevel> | null>(null);
  const gameOverRef = useRef(false);
  const spawnScheduleRef = useRef({
    nextRegularSpawn: 0,
    nextWaveStart: 0,
    nextWaveSpawn: 0,
    nextWaveNumber: 1,
    batchIndex: 0,
  });
  const nextSkySunAtRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const playerDataRef = useRef<PlayerData>(DEFAULT_PLAYER_DATA);
  const completionHandledRef = useRef(false);
  const defeatedZombieIdsRef = useRef(new Set<string>());

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(PLAYER_DATA_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<PlayerData>;
        const storedMoney = typeof parsed.money === "number" ? parsed.money : 0;
        const storedSeedBankSize = typeof parsed.seedBankSize === "number" ? parsed.seedBankSize : INITIAL_SEED_BANK_SIZE;
        const storedSeedSlotsPurchased = typeof parsed.seedSlotsPurchased === "number"
          ? parsed.seedSlotsPurchased
          : storedSeedBankSize - INITIAL_SEED_BANK_SIZE;
        const unlockedPlants = Array.isArray(parsed.unlockedPlants)
          ? parsed.unlockedPlants.filter((key): key is PlantTypeKey => key === "peaShooter" || key === "sunflower")
          : DEFAULT_PLAYER_DATA.unlockedPlants;
        const loadedData: PlayerData = {
          money: Number.isInteger(storedMoney) && storedMoney >= 0 ? storedMoney : 0,
          unlockedPlants: Array.from(new Set(["peaShooter", ...unlockedPlants])) as PlantTypeKey[],
          completedLevels: Array.isArray(parsed.completedLevels)
            ? parsed.completedLevels.filter((levelId): levelId is number => Number.isInteger(levelId) && levelId >= 0)
            : [],
          seedBankSize: INITIAL_SEED_BANK_SIZE + Math.min(2, Math.max(0, Number.isInteger(storedSeedSlotsPurchased) ? storedSeedSlotsPurchased : 0)),
          seedSlotsPurchased: Math.min(2, Math.max(0, Number.isInteger(storedSeedSlotsPurchased) ? storedSeedSlotsPurchased : 0)),
        };
        playerDataRef.current = loadedData;
        setPlayerData(loadedData);
      }
    } catch {
      window.localStorage.removeItem(PLAYER_DATA_STORAGE_KEY);
    }
    setPlayerDataLoaded(true);
  }, []);

  useEffect(() => {
    if (playerDataLoaded) {
      window.localStorage.setItem(PLAYER_DATA_STORAGE_KEY, JSON.stringify(playerData));
    }
  }, [playerData, playerDataLoaded]);

  const setPlantsState = (next: PlantInstance[]) => {
    plantsRef.current = next;
    setPlants(next);
  };

  const setZombiesState = (next: ZombieInstance[]) => {
    zombiesRef.current = next;
    setZombies(next);
  };

  const setProjectilesState = (next: Projectile[]) => {
    projectilesRef.current = next;
    setProjectiles(next);
  };

  const setSunsState = (next: SunInstance[]) => {
    sunsRef.current = next;
    setSuns(next);
  };

  const setCoinsState = (next: CoinInstance[]) => {
    coinsRef.current = next;
    setCoins(next);
  };

  const setSunState = (next: number) => {
    sunRef.current = next;
    setSun(next);
  };

  const setPlantReadyState = (next: Record<PlantTypeKey, number>) => {
    plantReadyRef.current = next;
    setPlantReady(next);
  };

  const resetGameState = () => {
    setSunState(INITIAL_SUN);
    setPlantsState([]);
    setZombiesState([]);
    setProjectilesState([]);
    setSunsState([]);
    setCoinsState([]);
    setRegularSpawned(0);
    regularSpawnedRef.current = 0;
    setWave1Spawned(0);
    wave1SpawnedRef.current = 0;
    setWave2Spawned(0);
    wave2SpawnedRef.current = 0;
    setWaveActive(false);
    waveActiveRef.current = false;
    setPlantReadyState({ sunflower: 0, peaShooter: 0 });
    setShovelSelected(false);
    setIsPaused(false);
    setLevelComplete(false);
    setRewardMessage("");
    setGameOver(false);
    gameOverRef.current = false;
    completionHandledRef.current = false;
    defeatedZombieIdsRef.current.clear();
  };

  const startLevel = (levelId: number) => {
    const levelToStart = LEVELS.find((level) => level.id === levelId) || LEVELS[0];
    const compiledLevel = getCompiledLevel(levelId);
    const now = Date.now();

    resetGameState();
    setSelectedLevelId(levelId);
    setCurrentLevel(levelToStart);
    currentLevelRef.current = levelToStart;
    compiledLevelRef.current = compiledLevel;
    spawnScheduleRef.current = {
      nextRegularSpawn: now,
      nextWaveStart: 0,
      nextWaveSpawn: 0,
      nextWaveNumber: 1,
      batchIndex: 0,
    };
    nextSkySunAtRef.current = 0;
    setGameTime(now);
    setIsPaused(false);
    setSelectedLoadout([]);
    setPhase("loadout");
  };

  const beginLevel = () => {
    if (!currentLevelRef.current || selectedLoadout.length === 0) return;
    const now = Date.now();
    spawnScheduleRef.current = {
      nextRegularSpawn: now + currentLevelRef.current.initialDelayMs,
      nextWaveStart: 0,
      nextWaveSpawn: 0,
      nextWaveNumber: 1,
      batchIndex: 0,
    };
    nextSkySunAtRef.current = currentLevelRef.current.skySunIntervalMs ? now + currentLevelRef.current.skySunIntervalMs : 0;
    setGameTime(now);
    setPhase("playing");
  };

  const toggleLoadoutPlant = (plantKey: PlantTypeKey) => {
    setSelectedLoadout((current) => {
      if (current.includes(plantKey)) return current.filter((key) => key !== plantKey);
      if (current.length >= playerDataRef.current.seedBankSize) return current;
      return [...current, plantKey];
    });
  };

  const returnToMenu = () => {
    setPhase("menu");
    setLevelComplete(false);
    setCurrentLevel(null);
    currentLevelRef.current = null;
    setGameOver(false);
    gameOverRef.current = false;
  };

  const finishLevel = () => {
    if (!currentLevelRef.current || completionHandledRef.current) return;
    completionHandledRef.current = true;
    const levelId = currentLevelRef.current.id;
    const alreadyCompleted = playerDataRef.current.completedLevels.includes(levelId);
    if (!alreadyCompleted) {
      const reward = levelId === 0 ? 0 : levelId * 100;
      const nextData: PlayerData = {
        ...playerDataRef.current,
        money: playerDataRef.current.money + reward,
        unlockedPlants: levelId === 0
          ? Array.from(new Set([...playerDataRef.current.unlockedPlants, "sunflower"]))
          : playerDataRef.current.unlockedPlants,
        completedLevels: [...playerDataRef.current.completedLevels, levelId],
      };
      playerDataRef.current = nextData;
      setPlayerData(nextData);
      setRewardMessage(levelId === 0 ? "Sunflower unlocked!" : `Reward: $${reward}`);
    } else {
      setRewardMessage("This level has already been completed.");
    }
    setPhase("complete");
    setLevelComplete(true);
  };

  const buySeedSlot = () => {
    const purchaseIndex = playerDataRef.current.seedSlotsPurchased;
    const cost = SEED_SLOT_COSTS[purchaseIndex];
    if (cost === undefined || playerDataRef.current.money < cost) return;
    const nextData = {
      ...playerDataRef.current,
      money: playerDataRef.current.money - cost,
      seedBankSize: playerDataRef.current.seedBankSize + 1,
      seedSlotsPurchased: purchaseIndex + 1,
    };
    playerDataRef.current = nextData;
    setPlayerData(nextData);
  };

  const handlePlacePlant = (row: number, col: number) => {
    if (phase !== "playing") return;
    const existingPlant = plantsRef.current.find((plant) => plant.row === row && plant.col === col);
    if (shovelSelected) {
      if (existingPlant) {
        setPlantsState(plantsRef.current.filter((plant) => plant.id !== existingPlant.id));
        setShovelSelected(false);
      }
      return;
    }
    const tile = currentLevelRef.current?.tiles[row]?.[col] || "normal";
    if (!getTileDefinition(tile).canPlant) return;
    const now = Date.now();
    if (existingPlant) return;
    const spec = PLANT_SPECS[selectedPlant];
    if (sunRef.current < spec.cost) return;
    if (plantReadyRef.current[selectedPlant] > now) return;

    const newPlant: PlantInstance = {
      id: createId(),
      type: selectedPlant,
      row,
      col,
      hp: spec.hp,
      plantedAt: now,
      nextSunAt: selectedPlant === "sunflower" ? now + SUNFLOWER_FIRST_BURST_MS : undefined,
      nextShotAt: selectedPlant === "peaShooter" ? now + PEASHOOTER_SHOOT_MS : undefined,
      lastContactAt: now,
      sunIntervalMs: selectedPlant === "sunflower" ? randomizeInterval(spec.generateMs || SUNFLOWER_GENERATION_MS) : undefined,
      shootIntervalMs: selectedPlant === "peaShooter" ? randomizeInterval(spec.shootMs || PEASHOOTER_SHOOT_MS) : undefined,
    };

    setPlantsState([...plantsRef.current, newPlant]);
    setSunState(sunRef.current - spec.cost);
    setPlantReadyState({
      ...plantReadyRef.current,
      [selectedPlant]: now + spec.rechargeMs,
    });
  };

  const collectSun = (sunId: string) => {
    if (phase !== "playing") return;
    const collectedSun = sunsRef.current.find((item) => item.id === sunId);
    if (!collectedSun) return;
    setSunsState(sunsRef.current.filter((item) => item.id !== sunId));
    setSunState(sunRef.current + collectedSun.value);
  };

  const collectCoin = (coinId: string) => {
    if (phase !== "playing") return;
    const collectedCoin = coinsRef.current.find((coin) => coin.id === coinId);
    if (!collectedCoin) return;
    setCoinsState(coinsRef.current.filter((coin) => coin.id !== coinId));
    const nextData = {
      ...playerDataRef.current,
      money: playerDataRef.current.money + collectedCoin.value,
    };
    playerDataRef.current = nextData;
    setPlayerData(nextData);
  };

  const spawnZombie = (isWave: boolean, type: string = "basic") => {
    const now = Date.now();
    const spec = ZOMBIE_SPECS[type] || ZOMBIE_SPECS.basic;
    const gridCols = getGridCols(currentLevelRef.current);
    const gridRows = getGridRows(currentLevelRef.current);
    const newZombie: ZombieInstance = {
      id: createId(),
      row: Math.floor(Math.random() * gridRows),
      col: gridCols - 1,
      x: gridCols + ZOMBIE_SPAWN_OFFSET,
      hp: spec.hp,
      armor: spec.armor,
      lastMoveAt: now,
      lastAttackAt: now,
      isWave,
      spawnedAt: now,
      type,
    };
    return newZombie;
  };

  useEffect(() => {
    if (phase !== "playing" || gameOver || isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setGameTime(Date.now());
    }, GAME_TICK_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [phase, gameOver, isPaused]);

  useEffect(() => {
    const handleDebugKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "h" && !event.repeat) {
        setShowDebugHealth((visible) => !visible);
      }
    };

    window.addEventListener("keydown", handleDebugKey);
    return () => window.removeEventListener("keydown", handleDebugKey);
  }, []);

  useEffect(() => {
    if (phase !== "playing" || currentLevel === null || isPaused) return;

    const now = gameTime;
    const gridCols = getGridCols(currentLevel);
    const gridRows = getGridRows(currentLevel);
    let nextPlants = plantsRef.current.slice();
    let nextZombies = zombiesRef.current.slice();
    let nextProjectiles = projectilesRef.current.slice();
    let nextSuns = sunsRef.current
      .filter((sun) => sun.expiresAt > now)
      .map((sun) => {
        if (
          sun.launchAt !== undefined &&
          sun.velocityY !== undefined &&
          sun.gravity !== undefined &&
          sun.arcDurationMs !== undefined &&
          sun.startX !== undefined &&
          sun.targetX !== undefined &&
          sun.startY !== undefined
        ) {
          const elapsed = Math.min(sun.arcDurationMs, Math.max(0, now - sun.launchAt));
          const progress = elapsed / sun.arcDurationMs;
          return {
            ...sun,
            x: sun.startX + (sun.targetX - sun.startX) * progress,
            y: sun.startY + sun.velocityY * elapsed + 0.5 * sun.gravity * elapsed * elapsed,
          };
        }
        if (
          sun.startY !== undefined &&
          sun.startX !== undefined &&
          sun.targetX !== undefined &&
          sun.peakY !== undefined &&
          sun.targetY !== undefined &&
          sun.risingFrom !== undefined &&
          sun.risingUntil !== undefined &&
          sun.fallingUntil !== undefined
        ) {
          const fallSpeed = sun.fallSpeedTilesPerMs || SUN_FALL_SPEED_TILES_PER_MS;
          if (now < sun.risingUntil) {
            const progress = (now - sun.risingFrom) / (sun.risingUntil - sun.risingFrom);
            return {
              ...sun,
              x: sun.startX + (sun.targetX - sun.startX) * progress,
              y: sun.startY + (sun.peakY - sun.startY) * progress,
            };
          }
          if (now < sun.fallingUntil) {
            const fallDuration = (sun.targetY - sun.peakY) / fallSpeed;
            const progress = 1 - (sun.fallingUntil - now) / fallDuration;
            return {
              ...sun,
              x: sun.startX + (sun.targetX - sun.startX) * progress,
              y: sun.peakY + (sun.targetY - sun.peakY) * progress,
            };
          }
        }
        return sun.targetY === undefined || sun.targetX === undefined ? sun : { ...sun, x: sun.targetX, y: sun.targetY };
      });
    let nextCoins = coinsRef.current.filter((coin) => coin.expiresAt > now);

    const spawnState = spawnScheduleRef.current;
    const totalRegular = currentLevel.preWaveCount + currentLevel.midCount;
    const firstWaveTotal = currentLevel.wave1Count;
    const secondWaveTotal = currentLevel.wave2Count;
    const regularInterval = currentLevel.regularSpawnIntervalMs;
    const waveInterval = currentLevel.waveSpawnIntervalMs;
    const betweenDelay = currentLevel.betweenWaveDelayMs;

    if (currentLevel.skySunIntervalMs && now >= nextSkySunAtRef.current) {
      const plantableTiles = currentLevel.tiles.flatMap((tiles, row) =>
        tiles.map((tile, col) => ({ row, col })).filter(({ row, col }) => getTileDefinition(currentLevel.tiles[row][col]).canPlant),
      );
      const target = plantableTiles[Math.floor(Math.random() * plantableTiles.length)];
      if (target) {
        const targetY = target.row + 0.25 + Math.random() * 0.5;
        const startY = -0.5;
        const targetX = target.col + 0.25 + Math.random() * 0.5;
        const fallDuration = (targetY - startY) / SKY_SUN_FALL_SPEED_TILES_PER_MS;
        nextSuns.push({
          id: createId(),
          row: target.row,
          x: targetX,
          y: startY,
          startX: targetX,
          targetX,
          startY,
          peakY: startY,
          targetY,
          fallSpeedTilesPerMs: SKY_SUN_FALL_SPEED_TILES_PER_MS,
          risingFrom: now,
          risingUntil: now,
          fallingUntil: now + fallDuration,
          value: SKY_SUN_VALUE,
          expiresAt: now + SUN_LIFETIME_MS,
        });
      }
      nextSkySunAtRef.current += currentLevel.skySunIntervalMs;
    }

    if (!waveActiveRef.current && regularSpawnedRef.current < totalRegular && now >= spawnState.nextRegularSpawn) {
      // Spawn batch of zombies using compiled level's wave spawn batches
      if (compiledLevelRef.current && spawnState.batchIndex < compiledLevelRef.current.waveSpawns.length) {
        const batch = compiledLevelRef.current.waveSpawns[spawnState.batchIndex];
        // Spawn every zombie at a random row from the active level.
        for (const zombieSpawn of batch) {
          const newZ = spawnZombie(false, zombieSpawn.type);
          nextZombies.push(newZ);
          regularSpawnedRef.current += 1;
        }
        setRegularSpawned(regularSpawnedRef.current);
        spawnState.batchIndex += 1;
      }
      spawnState.nextRegularSpawn = now + regularInterval;

      if (regularSpawnedRef.current === currentLevel.preWaveCount && firstWaveTotal > 0) {
        spawnState.nextWaveStart = now + betweenDelay;
        spawnState.nextWaveNumber = 1;
      } else if (regularSpawnedRef.current === totalRegular && secondWaveTotal > 0 && wave1SpawnedRef.current >= firstWaveTotal) {
        spawnState.nextWaveStart = now + betweenDelay;
        spawnState.nextWaveNumber = 2;
      }
    }

    if (!waveActiveRef.current && spawnState.nextWaveStart > 0 && now >= spawnState.nextWaveStart) {
      waveActiveRef.current = true;
      setWaveActive(true);
      spawnState.nextWaveSpawn = now;
    }

    if (waveActiveRef.current && spawnState.nextWaveSpawn > 0) {
      const waveNumber = spawnState.nextWaveNumber;
      const waveTotal = waveNumber === 1 ? firstWaveTotal : secondWaveTotal;
      const waveSpawnedRef = waveNumber === 1 ? wave1SpawnedRef : wave2SpawnedRef;
      const setWaveSpawned = waveNumber === 1 ? setWave1Spawned : setWave2Spawned;

      if (waveSpawnedRef.current < waveTotal && now >= spawnState.nextWaveSpawn) {
        // Spawn zombie using compiled level's boss wave sequence for correct type
        let zombieType = "basic";
        const waveIdx = spawnState.nextWaveNumber - 1; // 1-indexed to 0-indexed
        if (
          compiledLevelRef.current &&
          waveIdx < compiledLevelRef.current.bossWaveSequences.length &&
          waveSpawnedRef.current < compiledLevelRef.current.bossWaveSequences[waveIdx].length
        ) {
          zombieType = compiledLevelRef.current.bossWaveSequences[waveIdx][waveSpawnedRef.current].type;
        }
        const newZ = spawnZombie(true, zombieType);
        nextZombies.push(newZ);
        waveSpawnedRef.current += 1;
        setWaveSpawned(waveSpawnedRef.current);
        spawnState.nextWaveSpawn = now + waveInterval;

        if (waveSpawnedRef.current === waveTotal) {
          waveActiveRef.current = false;
          setWaveActive(false);
          spawnState.nextWaveSpawn = 0;
          spawnState.nextWaveStart = 0;

          if (waveNumber === 1 && secondWaveTotal > 0) {
            spawnState.nextWaveStart = now + betweenDelay;
            spawnState.nextWaveNumber = 2;
          }
        }
      }
    }

    nextPlants = nextPlants.map((plant) => {
      if (plant.type === "sunflower" && plant.nextSunAt && now >= plant.nextSunAt) {
        const spec = PLANT_SPECS[plant.type];
        const startY = plant.row - 0.35;
        const startX = plant.col + 0.5;
        const targetX = plant.col + 0.1 + Math.random() * 0.8;
        const targetY = plant.row + 0.25 + Math.random() * 0.5;
        const arcDurationMs = SUNFLOWER_ARC_DURATION_MS;
        const peakHeight = SUNFLOWER_ARC_HEIGHT_TILES;
        const verticalDelta = targetY - startY;
        const gravity = (4 * (verticalDelta + 2 * peakHeight)) / (arcDurationMs * arcDurationMs);
        const velocityY = -(verticalDelta + 4 * peakHeight) / arcDurationMs;
        nextSuns.push({
          id: createId(),
          row: plant.row,
          x: startX,
          y: startY,
          startX,
          targetX,
          startY,
          targetY,
          launchAt: now,
          velocityY,
          gravity,
          arcDurationMs,
          risingFrom: now,
          risingUntil: now,
          fallingUntil: now + arcDurationMs,
          value: spec.generateAmount || 50,
          expiresAt: now + SUN_LIFETIME_MS,
        });
        const interval = plant.sunIntervalMs || (spec.generateMs || SUNFLOWER_GENERATION_MS);
        return {
          ...plant,
          nextSunAt: plant.nextSunAt + interval,
        };
      }

      if (plant.type === "peaShooter" && plant.nextShotAt && now >= plant.nextShotAt) {
        const spec = PLANT_SPECS[plant.type];
        // Only shoot if there's at least one zombie ahead in the same row AND within grid bounds
        const anyAhead = zombiesRef.current.some(
          (z) => z.row === plant.row && z.x > plant.col && z.x >= 0 && z.x < gridCols && z.hp > 0
        );
        if (anyAhead) {
          const shot: Projectile = {
            id: createId(),
            row: plant.row,
            x: plant.col + 0.5,
            damage: spec.damage || 20,
          };
          nextProjectiles = [...nextProjectiles, shot];
        }
        const interval = plant.shootIntervalMs || (spec.shootMs || PEASHOOTER_SHOOT_MS);
        return {
          ...plant,
          nextShotAt: plant.nextShotAt + interval,
        };
      }

      return plant;
    });

    nextPlants = nextPlants.filter((plant) => plant.hp > 0);

    // Move projectiles forward but do not affect zombies (zombies don't interact with grid)
    nextProjectiles = nextProjectiles.reduce<Projectile[]>((acc, projectile) => {
      const moved = { ...projectile, x: projectile.x + PROJECTILE_SPEED_PER_TICK };
      // detect hit against nearest zombie in same row
      const hitZombie = nextZombies
        .filter((z) => z.row === moved.row && z.hp > 0 && moved.x >= z.x - 0.3)
        .sort((a, b) => a.x - b.x)[0];

      if (hitZombie) {
        let damageToHP = moved.damage;
        let newArmor = hitZombie.armor;
        // Armor absorbs damage first
        if (newArmor > 0) {
          newArmor = Math.max(0, newArmor - moved.damage);
          damageToHP = moved.damage - (hitZombie.armor - newArmor);
        }
        nextZombies = nextZombies.map((z) =>
          z.id === hitZombie.id
            ? { ...z, armor: newArmor, hp: Math.max(0, z.hp - damageToHP) }
            : z
        );
        return acc; // projectile consumed
      }

      // keep projectile alive while it's roughly within screen bounds
      if (moved.x < gridCols + 5) {
        acc.push(moved);
      }
      return acc;
    }, []);

    // Move zombies smoothly leftward; do not interact with plants or projectiles
    const walkPeriodMs = 3000; // 1.5 second walking cycle
    nextZombies = nextZombies.map((zombie) => {
      const plantIndex = nextPlants.findIndex((plant) => plant.row === zombie.row && Math.floor(zombie.x) === plant.col);
      if (plantIndex >= 0) {
        // stop moving and attack the plant periodically
        if (now - zombie.lastAttackAt >= ZOMBIE_ATTACK_MS) {
          const plant = nextPlants[plantIndex];
          nextPlants[plantIndex] = { ...plant, hp: Math.max(0, plant.hp - (ZOMBIE_SPECS[zombie.type]?.damage || 50)) };
          zombie = { ...zombie, lastAttackAt: now };
        }

        // plant deals contact damage (e.g., pea shooter)
        const plant = nextPlants[plantIndex];
        const spec = PLANT_SPECS[plant.type];
        const contactInterval = spec.shootMs || PEASHOOTER_SHOOT_MS;
        if (spec.damage && now - (plant.lastContactAt || 0) >= contactInterval) {
          let damageToHP = spec.damage;
          let newArmor = zombie.armor;
          // Armor absorbs damage first
          if (newArmor > 0) {
            newArmor = Math.max(0, newArmor - spec.damage);
            damageToHP = spec.damage - (zombie.armor - newArmor);
          }
          nextZombies = nextZombies.map((z) =>
            z.id === zombie.id
              ? { ...z, armor: newArmor, hp: Math.max(0, z.hp - damageToHP) }
              : z
          );
          nextPlants[plantIndex] = { ...plant, lastContactAt: now };
        }

        return zombie;
      }

      // Move continuously towards left with marching gait (sine wave speed variation)
      // Each zombie type has its own speed from spec
      const zombieSpec = ZOMBIE_SPECS[zombie.type] || ZOMBIE_SPECS.basic;
      const speedPerTick = GAME_TICK_MS / zombieSpec.moveMs; // tiles per tick
      const elapsedMs = now - zombie.spawnedAt;
      const phase = (elapsedMs / walkPeriodMs) * Math.PI * 2;
      const speedMultiplier = 1 + 0.9 * Math.sin(phase); // varies from 0.65 to 1.35
      const newX = zombie.x - (speedPerTick * speedMultiplier);
      return { ...zombie, x: newX };
    });

    nextZombies.forEach((zombie) => {
      if (zombie.hp > 0 || defeatedZombieIdsRef.current.has(zombie.id)) return;
      defeatedZombieIdsRef.current.add(zombie.id);
      const dropChance = ZOMBIE_SPECS[zombie.type]?.coinDropChance || 0;
      if (Math.random() >= dropChance) return;
      const isGold = Math.random() < 0.2;
      nextCoins.push({
        id: createId(),
        row: zombie.row,
        x: zombie.x,
        y: zombie.row + 0.35,
        value: isGold ? 20 : 10,
        image: isGold ? "/gold-coin.png" : "/silver-coin.webp",
        expiresAt: now + COIN_LIFETIME_MS,
      });
    });

    nextPlants = nextPlants.filter((plant) => plant.hp > 0);
    // Check for game over: any zombie that crosses the left trigger X
    const anyReachedEnd = nextZombies.some((z) => z.x <= ZOMBIE_LEFT_TRIGGER_X);
    if (anyReachedEnd) {
      setGameOver(true);
      gameOverRef.current = true;
      // stop updating zombies and plants further for this tick
      setZombiesState(nextZombies.filter((z) => z.hp > 0));
      setPlantsState(nextPlants);
      setProjectilesState(nextProjectiles);
      setSunsState(nextSuns);
      setCoinsState(nextCoins);
      return;
    }

    nextZombies = nextZombies.filter((zombie) => zombie.hp > 0);

    setPlantsState(nextPlants);
    setZombiesState(nextZombies);
    setProjectilesState(nextProjectiles);
    setSunsState(nextSuns);
    setCoinsState(nextCoins);

    if (
      regularSpawnedRef.current === totalRegular &&
      wave1SpawnedRef.current === firstWaveTotal &&
      wave2SpawnedRef.current === secondWaveTotal &&
      nextZombies.length === 0 &&
      !waveActiveRef.current
    ) {
      finishLevel();
    }
  }, [gameTime, phase, currentLevel, isPaused]);

  const grid = useMemo(
    () =>
      Array.from({ length: getGridRows(currentLevel) }, (_, row) =>
        Array.from({ length: getGridCols(currentLevel) }, (_, col) => ({ row, col })),
      ),
    [currentLevel],
  );
  const gridRows = getGridRows(currentLevel);
  const gridCols = getGridCols(currentLevel);

  const progressMax = currentLevel
    ? currentLevel.preWaveCount + currentLevel.midCount + currentLevel.wave1Count + currentLevel.wave2Count
    : 1;
  const zombiesSent = regularSpawned + wave1Spawned + wave2Spawned;
  const progressPercent = currentLevel ? Math.round((zombiesSent / progressMax) * 100) : 0;
  const waveThresholds = currentLevel
    ? [currentLevel.preWaveCount].concat(currentLevel.midCount > 0 ? [currentLevel.preWaveCount + currentLevel.midCount] : [])
    : [];
  const title =
    phase === "menu"
      ? "Plants vs. Zombies"
      : phase === "level-select"
        ? "Select a Level"
        : phase === "shop"
          ? "Shop"
          : phase === "almanac"
            ? "Almanac"
            : currentLevel
              ? currentLevel.title
              : "Level";
  const waveStageLabel = (() => {
    if (!currentLevel) return "";
    if (regularSpawnedRef.current < currentLevel.preWaveCount) {
      return "Regular zombies are marching.";
    }
    if (waveActive && spawnScheduleRef.current.nextWaveNumber === 1) {
      return "First wave in progress.";
    }
    if (regularSpawnedRef.current < currentLevel.preWaveCount + currentLevel.midCount) {
      return "Extra zombies are coming before the final wave.";
    }
    if (currentLevel.wave2Count > 0 && !waveActive && wave1SpawnedRef.current === currentLevel.wave1Count) {
      return "Preparing the final wave...";
    }
    if (waveActive && spawnScheduleRef.current.nextWaveNumber === 2) {
      return "Second wave in progress.";
    }
    return "";
  })();
  const compiledCurrentLevel = currentLevel ? getCompiledLevel(currentLevel.id) : null;
  const zombieTypes = compiledCurrentLevel
    ? Array.from(
      new Set([
        ...compiledCurrentLevel.waveSpawns.flat().map((zombie) => zombie.type),
        ...compiledCurrentLevel.bossWaveSequences.flat().map((zombie) => zombie.type),
      ]),
    )
    : [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-4xl font-bold tracking-tight text-lime-300">{title}</h1>

        {phase === "menu" && (
          <div className="main-menu">
            <div className="menu-sunburst" aria-hidden="true"><img src="/sun.webp" alt="" /></div>
            <p className="menu-kicker">Welcome to the lawn</p>
            <h2>Choose your defense</h2>
            <p className="menu-copy">Plant wisely, collect sun, and stop the zombie waves before they reach the house.</p>
            <div className="mb-6 flex items-center justify-center gap-5 text-lg font-semibold text-amber-200">
              <span>Money: ${playerData.money}</span>
              <span>Seed slots: {playerData.seedBankSize}</span>
            </div>
            <div className="menu-actions">
              <button type="button" onClick={() => setPhase("level-select")} className="menu-primary">Start Game <span>→</span></button>
              <button type="button" onClick={() => setPhase("shop")} className="menu-secondary">Shop <span>◆</span></button>
              <button type="button" onClick={() => setPhase("almanac")} className="menu-secondary">Open Almanac <span>▣</span></button>
            </div>
          </div>
        )}

        {phase === "level-select" && (
          <div className="level-select-screen">
            <div className="screen-heading"><div><p className="menu-kicker">The backyard awaits</p><h2>Select a Level</h2><p>Each lawn brings a different layout and wave pattern.</p></div><button type="button" onClick={() => setPhase("menu")} className="text-button">Back</button></div>
            <div className="level-card-grid">
              {LEVELS.map((level) => (
                <div key={level.id} className="level-card">
                  <div className="level-card-number">{String(level.id).padStart(2, "0")}</div>
                  <div className="level-card-content">
                    <div>
                      <h2 className="text-2xl font-semibold text-white">{level.title}</h2>
                      <p>{level.description}</p>
                    </div>
                    <div className="level-card-actions">
                      <button type="button" onClick={() => startLevel(level.id)} className="menu-primary">Play Level <span>→</span></button>
                      <button type="button" onClick={() => setSelectedLevelId(level.id)} className={`level-preview-button ${selectedLevelId === level.id ? "active" : ""}`}>{selectedLevelId === level.id ? "Selected" : "Preview"}</button>
                    </div>
                    {playerData.completedLevels.includes(level.id) && <span className="mt-3 inline-block font-semibold text-lime-300">Completed</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {phase === "shop" && (
          <div className="level-select-screen">
            <div className="screen-heading"><div><p className="menu-kicker">Improve your defense</p><h2>Shop</h2><p>Spend your level rewards to expand your seed bank.</p></div><button type="button" onClick={() => setPhase("menu")} className="text-button">Back to menu</button></div>
            <div className="level-card max-w-xl">
              <div className="level-card-number">+</div>
              <div className="level-card-content">
                <div>
                  <h2 className="text-2xl font-semibold text-white">New seed slot</h2>
                  <p>Add one more plant to every loadout. Current capacity: {playerData.seedBankSize}.</p>
                  <p className="mt-2 font-semibold text-amber-200">Price: ${SEED_SLOT_COSTS[playerData.seedSlotsPurchased] || "-"} | Balance: ${playerData.money}</p>
                </div>
                <button type="button" onClick={buySeedSlot} disabled={playerData.seedSlotsPurchased >= SEED_SLOT_COSTS.length || playerData.money < (SEED_SLOT_COSTS[playerData.seedSlotsPurchased] || Infinity)} className="menu-primary disabled:cursor-not-allowed disabled:opacity-50">
                  {playerData.seedSlotsPurchased >= SEED_SLOT_COSTS.length ? "All slots purchased" : "Buy slot"}
                </button>
              </div>
            </div>
          </div>
        )}

        {phase === "almanac" && (
          <div className="almanac-screen">
            <div className="screen-heading"><div><p className="menu-kicker">Know your tools</p><h2>Almanac</h2><p>Everything discovered on the lawn, in one place.</p></div><button type="button" onClick={() => setPhase("menu")} className="text-button">Back to menu</button></div>
            <div className="almanac-tabs" role="tablist" aria-label="Almanac categories">
              {(["plants", "zombies", "tiles"] as AlmanacCategory[]).map((category) => <button key={category} type="button" role="tab" aria-selected={almanacCategory === category} onClick={() => setAlmanacCategory(category)} className={almanacCategory === category ? "active" : ""}>{category}</button>)}
            </div>
            <div className="almanac-grid">
              {almanacCategory === "plants" && Object.values(PLANT_SPECS).map((spec) => <article key={spec.key} className="almanac-card"><div className="almanac-art plant-art"><img src={spec.key === "peaShooter" ? "/plant_peashooter.webp" : "/sunflower.webp"} alt="" /></div><div><p className="almanac-type">Plant</p><h3>{spec.name}</h3><p>{spec.summary}</p><dl><div><dt>Cost</dt><dd>{spec.cost} sun</dd></div><div><dt>Health</dt><dd>{spec.hp} HP</dd></div><div><dt>Recharge</dt><dd>{spec.rechargeMs / 1000}s</dd></div>{spec.damage && <div><dt>Damage</dt><dd>{spec.damage}</dd></div>}</dl></div></article>)}
              {almanacCategory === "zombies" && Object.values(ZOMBIE_SPECS).map((spec) => <article key={spec.key} className="almanac-card"><div className="almanac-art zombie-art">{spec.key === "basic" ? <img src="/zombie.webp" alt="" /> : <span className={`zombie-placeholder ${spec.key}`}>{spec.key === "imp" ? "IMP" : "CONE"}</span>}</div><div><p className="almanac-type">Zombie</p><h3>{spec.name}</h3><p>{spec.summary}</p><dl><div><dt>Health</dt><dd>{spec.hp} HP</dd></div><div><dt>Speed</dt><dd>{Math.round(spec.moveMs / 100) / 10}s / tile</dd></div><div><dt>Damage</dt><dd>{spec.damage}</dd></div><div><dt>Armor</dt><dd>{spec.armor}</dd></div></dl></div></article>)}
              {almanacCategory === "tiles" && Object.values(TILE_DEFINITIONS).map((tile) => <article key={tile.key} className="almanac-card tile-card"><div className={`almanac-tile-swatch ${tile.key}`} /><div><p className="almanac-type">Tile</p><h3>{tile.key === "normalDark" ? "Dark lawn" : tile.key === "normal" ? "Lawn" : "Obstructed"}</h3><p>{tile.description}</p><dl><div><dt>Plantable</dt><dd>{tile.canPlant ? "Yes" : "No"}</dd></div><div><dt>Label</dt><dd>{tile.label || "None"}</dd></div></dl></div></article>)}
            </div>
          </div>
        )}

        {phase === "loadout" && currentLevel && (
          <div className="loadout-screen">
            <section className="loadout-plants">
              <div className="loadout-heading">
                <div>
                  <p className="loadout-kicker">Prepare your defense</p>
                  <h2>{currentLevel.title}</h2>
                  <p>{currentLevel.description}</p>
                </div>
                <div className="loadout-count">{selectedLoadout.length} / {playerData.seedBankSize}</div>
              </div>
              <div className="plant-choice-grid">
                {playerData.unlockedPlants.map((plantKey) => {
                  const spec = PLANT_SPECS[plantKey];
                  const selected = selectedLoadout.includes(plantKey);
                  return (
                    <button key={plantKey} type="button" onClick={() => toggleLoadoutPlant(plantKey)} className={`plant-choice ${selected ? "selected" : ""}`} aria-pressed={selected}>
                      <div className="plant-choice-image"><img src={plantKey === "peaShooter" ? "/plant_peashooter.webp" : "/sunflower.webp"} alt="" /></div>
                      <div><h3>{spec.name}</h3><p>{spec.cost} sun</p></div>
                      <span className="plant-choice-check">{selected ? "✓" : "+"}</span>
                    </button>
                  );
                })}
              </div>
              <div className="loadout-seed-preview" style={{ gridTemplateColumns: `repeat(${playerData.seedBankSize}, minmax(3rem, 4.5rem))` }}>
                {Array.from({ length: playerData.seedBankSize }).map((_, index) => {
                  const plantKey = selectedLoadout[index];
                  return <div key={`preview-${index}`} className={`preview-slot ${plantKey ? "filled" : ""}`}>{plantKey && <img src={plantKey === "peaShooter" ? "/plant_peashooter.webp" : "/sunflower.webp"} alt={PLANT_SPECS[plantKey].name} />}</div>;
                })}
              </div>
            </section>
            <aside className="loadout-zombies">
              <div className="loadout-heading"><div><p className="loadout-kicker">Incoming threats</p><h2>Zombies</h2></div><span className="zombie-count">{zombieTypes.length}</span></div>
              <div className="zombie-choice-list">
                {zombieTypes.map((zombieType) => {
                  const zombieLabel = zombieType === "basic" ? "Basic zombie" : zombieType === "imp" ? "Imp" : "Conehead zombie";
                  return <div key={zombieType} className="zombie-choice">{zombieType === "basic" ? <img src="/zombie.webp" alt="" /> : <span className={`zombie-placeholder ${zombieType}`}>{zombieType === "imp" ? "IMP" : "CONE"}</span>}<div><strong>{zombieLabel}</strong></div></div>;
                })}
              </div>
            </aside>
            <button type="button" className="start-level-button" disabled={selectedLoadout.length === 0} onClick={beginLevel}>Start level <span>→</span></button>
          </div>
        )}

        {(phase === "playing" || phase === "complete") && (
          <div className="mt-6 space-y-4">
            <div className="game-toolbar">
              <div className="sun-counter" aria-label={`${sun} sun available`}><img src="/sun.webp" alt="" /> <strong>{sun}</strong></div>
              <div className="seed-tray" aria-label="Seed packet selection" style={{ gridTemplateColumns: `repeat(${playerData.seedBankSize}, minmax(3rem, 4.4rem))` }}>
                {selectedLoadout.map((plantKey) => {
                  const spec = PLANT_SPECS[plantKey];
                  const ready = plantReadyRef.current[spec.key] <= gameTime;
                  const enoughSun = sunRef.current >= spec.cost;
                  const disabled = !ready || !enoughSun;
                  const coolDown = Math.max(0, Math.ceil((plantReadyRef.current[spec.key] - gameTime) / 1000));
                  return (
                    <button key={spec.key} type="button" aria-label={`${spec.name}, costs ${spec.cost} sun`} onClick={() => { setSelectedPlant(spec.key); setShovelSelected(false); }} className={`seed-slot ${selectedPlant === spec.key && !shovelSelected ? "selected" : ""} ${disabled ? "unavailable" : ""}`}>
                      <img src={spec.key === "peaShooter" ? "/plant_peashooter.webp" : "/sunflower.webp"} alt="" />
                      <span>{spec.cost}</span>
                      {!ready && <small>{coolDown}s</small>}
                    </button>
                  );
                })}
                {Array.from({ length: Math.max(0, playerData.seedBankSize - selectedLoadout.length) }).map((_, index) => <div key={`empty-${index}`} className="seed-slot empty" aria-hidden="true" />)}
              </div>
              <button type="button" aria-label="Select shovel" onClick={() => setShovelSelected((selected) => !selected)} className={`shovel-button ${shovelSelected ? "selected" : ""}`}>⌁<span>Shovel</span></button>
              <button type="button" aria-label="Open pause menu" onClick={() => setIsPaused(true)} className="settings-button">⚙</button>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-700 bg-slate-900/90 p-4 shadow-xl">
              <div className="relative grid gap-1 bg-slate-950 p-1 sm:p-2" style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}>
                {grid.flat().map(({ row, col }) => {
                  const plant = plants.find((item) => item.row === row && item.col === col);
                  const tile = getTileDefinition(currentLevel?.tiles[row]?.[col] || "normal");

                  return (
                    <button
                      key={tileKey(row, col)}
                      type="button"
                      onClick={() => handlePlacePlant(row, col)}
                      disabled={!tile.canPlant}
                      aria-label={tile.label || "Available lawn tile"}
                      className={`relative min-h-16 overflow-hidden p-2 text-left transition ${tile.className}`}
                    >
                      {tile.label && !plant && <span className="text-xs font-semibold uppercase tracking-wide text-stone-200">{tile.label}</span>}
                      {plant && (
                        <div className="relative h-full w-full text-xs text-lime-200">
                          <img
                            src={plant.type === "peaShooter" ? "/plant_peashooter.webp" : "/sunflower.webp"}
                            alt={PLANT_SPECS[plant.type].name}
                            className="absolute inset-0 h-full w-full scale-125 object-contain"
                            onError={(event) => {
                              event.currentTarget.remove();
                              event.currentTarget.nextElementSibling?.classList.remove("hidden");
                              event.currentTarget.parentElement?.querySelector("[data-image-debug-health]")?.classList.add("hidden");
                            }}
                          />
                          <div className="relative z-10 hidden h-full w-full flex-col justify-between border border-lime-500/20 bg-lime-500/10 p-2">
                            <span>{PLANT_SPECS[plant.type].name}</span>
                            {showDebugHealth && <span className="text-[11px] text-slate-200">HP: {plant.hp}</span>}
                          </div>
                          {showDebugHealth && <span data-image-debug-health className="absolute bottom-0 left-1/2 z-10 -translate-x-1/2 text-[11px] text-slate-200">HP: {plant.hp}</span>}
                        </div>
                      )}
                    </button>
                  );
                })}

                {suns.map((sunDrop) => (
                  <button
                    key={sunDrop.id}
                    type="button"
                    aria-label={`Collect ${sunDrop.value} sun`}
                    onMouseEnter={() => collectSun(sunDrop.id)}
                    onFocus={() => collectSun(sunDrop.id)}
                    className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 transition hover:scale-110 ${sunDrop.expiresAt - gameTime > 0 && sunDrop.expiresAt - gameTime <= 5000 ? "animate-pulse" : ""}`}
                    style={{
                      left: `${(sunDrop.x / gridCols) * 100}%`,
                      top: `${(sunDrop.y / gridRows) * 100}%`,
                      transition: `left ${GAME_TICK_MS}ms linear, top ${GAME_TICK_MS}ms linear, transform 150ms ease-out`,
                    }}
                  >
                    <img
                      src="/sun.webp"
                      alt=""
                      className="block object-contain drop-shadow-lg"
                      style={{
                        width: `${24 + sunDrop.value * 0.36}px`,
                        height: `${24 + sunDrop.value * 0.36}px`,
                      }}
                    />
                  </button>
                ))}

                {coins.map((coin) => (
                  <button
                    key={coin.id}
                    type="button"
                    aria-label={`Collect $${coin.value}`}
                    onMouseEnter={() => collectCoin(coin.id)}
                    onFocus={() => collectCoin(coin.id)}
                    className="absolute z-20 -translate-x-1/2 -translate-y-1/2 transition hover:scale-110"
                    style={{
                      left: `${(coin.x / gridCols) * 100}%`,
                      top: `${(coin.y / gridRows) * 100}%`,
                    }}
                  >
                    <img src={coin.image} alt="" className="h-9 w-9 object-contain drop-shadow-lg" />
                  </button>
                ))}

                {/* Zombie overlay: render zombies absolutely so they can move smoothly (fractional x) */}
                {zombies.map((z) => {
                  let zombieLabel = "Z";
                  let bgColor = "bg-rose-500/90";
                  if (z.type === "imp") {
                    zombieLabel = "IMP";
                    bgColor = "bg-purple-600/90";
                  } else if (z.type === "cone") {
                    zombieLabel = "CONE";
                    bgColor = "bg-yellow-600/90";
                  }
                  return (
                    <div
                      key={z.id}
                      className="absolute pointer-events-none"
                      style={{
                        left: `${(z.x / gridCols) * 100}%`,
                        top: `${((z.row + 0.5) / gridRows) * 100}%`,
                        transform: "translate(-50%, -50%)",
                        transition: `left ${GAME_TICK_MS}ms linear, top ${GAME_TICK_MS}ms linear`,
                      }}
                    >
                      {z.type === "basic" ? (
                        <>
                          <img
                            src="/zombie.webp"
                            alt="Basic zombie"
                            className="h-20 w-20 origin-bottom object-contain"
                            style={{ transform: "scale(1.1)" }}
                            onError={(event) => {
                              event.currentTarget.remove();
                              event.currentTarget.nextElementSibling?.classList.remove("hidden");
                            }}
                          />
                          <div className={`hidden rounded-full ${bgColor} px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white`}>{zombieLabel}</div>
                        </>
                      ) : (
                        <div className={`rounded-full ${bgColor} px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white`}>{zombieLabel}</div>
                      )}
                      {showDebugHealth && <div className="mt-1 text-[10px] text-white text-center bg-rose-500/80 rounded-full px-2 py-0.5">HP: {z.hp}{z.armor > 0 ? ` | A: ${z.armor}` : ""}</div>}
                    </div>
                  );
                })}

                {/* Projectile overlay: render projectiles absolutely for smooth movement */}
                {projectiles.map((p) => (
                  <div
                    key={p.id}
                    className="absolute pointer-events-none"
                    style={{
                      left: `${(p.x / gridCols) * 100}%`,
                      top: `${((p.row + 0.3) / gridRows) * 100}%`,
                      transform: "translate(-50%, -50%)",
                      transition: `left ${GAME_TICK_MS}ms linear, top ${GAME_TICK_MS}ms linear`,
                    }}
                  >
                    <img
                      src="/projectile-pea.webp"
                      alt=""
                      className="block h-5 w-5 object-contain"
                    />
                    {/* Previous projectile rendering, kept as a fallback if per-projectile images affect loading. */}
                    {/* <div className="h-2 w-2 rounded-full bg-cyan-300" /> */}
                  </div>
                ))}
              </div>
            </div>

            <div className="wave-progress" aria-label={`Zombie progress: ${zombiesSent} of ${progressMax} sent`}>
              <div className="wave-progress-label"><span>Zombie attack</span><span>{zombiesSent} / {progressMax}</span></div>
              <div className="wave-progress-track"><div className="wave-progress-fill" style={{ width: `${Math.min(100, progressPercent)}%` }} />{waveThresholds.map((threshold, index) => <i key={`${threshold}-${index}`} style={{ left: `${Math.min(100, Math.round((threshold / progressMax) * 100))}%` }} />)}</div>
              <p>{waveStageLabel}</p>
            </div>
          </div>
        )}
      </div>

      {isPaused && phase === "playing" && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4">
          <div className="pause-menu">
            <h2>Paused</h2>
            <button type="button" onClick={() => setIsPaused(false)}>Resume</button>
            <button type="button" onClick={() => currentLevelRef.current && startLevel(currentLevelRef.current.id)}>Restart level</button>
            <button type="button" onClick={returnToMenu}>Return to main menu</button>
          </div>
        </div>
      )}

      {levelComplete && phase !== "menu" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 px-4 py-8">
          <div className="w-full max-w-xl rounded-3xl border border-lime-400 bg-slate-900/95 p-8 text-center shadow-2xl">
            <h2 className="text-3xl font-semibold text-white">Level Complete!</h2>
            <p className="mt-4 text-slate-300">All zombies have been defeated. Great job on your first level.</p>
            <p className="mt-3 text-xl font-semibold text-amber-200">{rewardMessage}</p>
            <button
              type="button"
              onClick={returnToMenu}
              className="mt-8 inline-flex rounded-full bg-lime-500 px-6 py-3 text-lg font-semibold text-slate-950 transition hover:bg-lime-400"
            >
              Return to main menu
            </button>
          </div>
        </div>
      )}

      {gameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8">
          <div className="w-full max-w-xl rounded-3xl border border-rose-400 bg-slate-900/95 p-8 text-center shadow-2xl">
            <h2 className="text-3xl font-semibold text-white">Game Over</h2>
            <p className="mt-4 text-slate-300">A zombie reached your house. Try again!</p>
            <div className="mt-6 flex justify-center gap-4">
              <button
                type="button"
                onClick={() => {
                  // retry same level
                  if (currentLevelRef.current) startLevel(currentLevelRef.current.id);
                }}
                className="inline-flex rounded-full bg-rose-500 px-6 py-3 text-lg font-semibold text-slate-950 transition hover:bg-rose-400"
              >
                Retry Level
              </button>
              <button
                type="button"
                onClick={() => returnToMenu()}
                className="inline-flex rounded-full bg-slate-700 px-6 py-3 text-lg font-semibold text-white transition hover:bg-slate-600"
              >
                Main Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

//   return (
//     <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-8 sm:px-8">
//       <div className="mx-auto max-w-7xl">
//         <h1 className="text-4xl font-bold tracking-tight text-lime-300">{title}</h1>

//         {phase === "menu" && (
//           <div className="mt-12 flex flex-col items-center gap-6">
//             <p className="max-w-2xl text-lg text-slate-300">
//               This prototype includes a simple menu, a level selection screen, a 12x6 lawn grid, sun currency, two plant types, and a basic zombie wave system.
//             </p>
//             <button
//               type="button"
//               onClick={() => setPhase("level-select")}
//               className="rounded-full bg-lime-500 px-7 py-3 text-lg font-semibold text-slate-950 transition hover:bg-lime-400"
//             >
//               Start Game
//             </button>
//           </div>
//         )}

//         {phase === "level-select" && (
//           <div className="mt-12 grid gap-6 sm:grid-cols-2">
//             <div className="rounded-3xl border border-slate-700 bg-slate-900/80 p-6 shadow-xl">
//               <div className="flex items-center justify-between gap-4">
//                 <div>
//                   <h2 className="text-2xl font-semibold text-white">Level 1</h2>
//                   <p className="mt-2 text-slate-400">Easy introduction level with a small first wave and one big wave.</p>
//                 </div>
//                 <span className="rounded-full bg-lime-500 px-3 py-1 text-sm font-semibold text-slate-950">1</span>
//               </div>
//               <div className="mt-6 flex gap-3">
//                 <button
//                   type="button"
//                   onClick={startLevel}
//                   className="rounded-full bg-lime-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-lime-400"
//                 >
//                   Play Level 1
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//         {(phase === "playing" || phase === "complete") && (
//           <div className="mt-10 space-y-6">
//             <div className="grid gap-4 rounded-3xl border border-slate-700 bg-slate-900/80 p-6 shadow-xl sm:grid-cols-[1fr_auto]">
//               <div className="space-y-4">
//                 <div className="flex flex-wrap items-center gap-4">
//                   <div className="rounded-2xl bg-slate-800/90 px-4 py-3 text-slate-100">
//                     Sun: <span className="font-semibold text-lime-300">{sun}</span>
//                   </div>
//                   <div className="rounded-2xl bg-slate-800/90 px-4 py-3 text-slate-100">Selected: <span className="font-semibold text-lime-300">{selectedSpec.name}</span></div>
//                 </div>

//                 <div className="grid gap-4 sm:grid-cols-2">
//                   {Object.values(PLANT_SPECS).map((spec) => {
//                     const ready = plantReadyRef.current[spec.key] <= gameTime;
//                     const enoughSun = sunRef.current >= spec.cost;
//                     const disabled = !ready || !enoughSun;
//                     const coolDown = Math.max(0, Math.ceil((plantReadyRef.current[spec.key] - gameTime) / 1000));
//                     return (
//                       <button
//                         key={spec.key}
//                         type="button"
//                         disabled={disabled}
//                         onClick={() => setSelectedPlant(spec.key)}
//                         className={`rounded-3xl border px-4 py-4 text-left transition ${selectedPlant === spec.key ? "border-lime-400 bg-slate-800" : "border-slate-700 bg-slate-900/80"} ${disabled ? "cursor-not-allowed opacity-70" : "hover:border-lime-300"}`}
//                       >
//                         <div className="flex items-center justify-between gap-3">
//                           <div>
//                             <h3 className="text-lg font-semibold text-white">{spec.name}</h3>
//                             <p className="mt-1 text-sm text-slate-400">{spec.summary}</p>
//                           </div>
//                           <div className="rounded-full bg-slate-800 px-3 py-1 text-sm text-lime-300">{spec.cost}☀</div>
//                         </div>
//                         <div className="mt-3 text-sm text-slate-300">
//                           {ready ? "Ready to place" : `Recharge ${coolDown}s`}
//                         </div>
//                       </button>
//                     );
//                   })}
//                 </div>
//               </div>

//               <div className="space-y-4 rounded-3xl bg-slate-950/90 p-4">
//                 <div className="text-sm uppercase tracking-[0.24em] text-slate-400">Progress</div>
//                 <div className="relative h-4 overflow-hidden rounded-full bg-slate-800">
//                   <div className="h-full bg-lime-400 transition-all" style={{ width: `${Math.min(100, progressPercent)}%` }} />
//                   <div className="absolute right-0 top-0 h-full w-1 bg-orange-500" />
//                 </div>
//                 <div className="flex items-center justify-between text-sm text-slate-300">
//                   <span>{regularSpawned} / {REGULAR_ZOMBIE_COUNT} regular zombies sent</span>
//                   <span className="flex items-center gap-1 text-lime-300">🚩 Wave incoming</span>
//                 </div>
//                 <div className="rounded-3xl border border-slate-700 bg-slate-900/80 p-4 text-sm text-slate-300">
//                   <div className="font-semibold text-white">Wave status</div>
//                   <p className="mt-2">{waveActive ? "Big wave in progress" : regularSpawnedRef.current === REGULAR_ZOMBIE_COUNT ? "Preparing the final wave..." : "Regular zombies are marching."}</p>
//                   <p className="mt-2 text-sm text-slate-400">Warm-up: {WAVE_ZOMBIE_COUNT} zombies will arrive after the regular group.</p>
//                 </div>
//                 <button
//                   type="button"
//                   onClick={() => setPhase("menu")}
//                   className="rounded-full bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-600"
//                 >
//                   Back to menu
//                 </button>
//               </div>
//             </div>

//             <div className="overflow-hidden rounded-3xl border border-slate-700 bg-slate-900/90 p-4 shadow-xl">
//               <div className="grid gap-1 bg-slate-950 p-1 sm:p-2" style={{ gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))` }}>
//                 {grid.flat().map(({ row, col }) => {
//                   const plant = plants.find((item) => item.row === row && item.col === col);
//                   const zombie = zombies.find((item) => item.row === row && item.col === col);
//                   const projectile = projectiles.find((item) => item.row === row && Math.floor(item.x) === col);

//                   return (
//                     <button
//                       key={tileKey(row, col)}
//                       type="button"
//                       onClick={() => handlePlacePlant(row, col)}
//                       className="relative min-h-16 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 p-2 text-left transition hover:border-lime-400"
//                     >
//                       <div className="absolute inset-x-0 top-0 h-1 bg-slate-800" />
//                       {plant && (
//                         <div className="flex h-full w-full flex-col justify-between rounded-2xl border border-lime-500/20 bg-lime-500/10 p-2 text-xs text-lime-200">
//                           <span>{PLANT_SPECS[plant.type].name}</span>
//                           <span className="text-[11px] text-slate-200">HP: {plant.hp}</span>
//                         </div>
//                       )}
//                       {zombie && (
//                         <div className="absolute right-2 top-2 rounded-full bg-rose-500/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
//                           Zombie
//                         </div>
//                       )}
//                       {projectile && (
//                         <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-y-1/2 -translate-x-1/2 rounded-full bg-cyan-300" />
//                       )}
//                     </button>
//                   );
//                 })}
//               </div>
//             </div>
//           </div>
//         )}
//       </div>

//       {levelComplete && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 px-4 py-8">
//           <div className="w-full max-w-xl rounded-3xl border border-lime-400 bg-slate-900/95 p-8 text-center shadow-2xl">
//             <h2 className="text-3xl font-semibold text-white">Level Complete!</h2>
//             <p className="mt-4 text-slate-300">All zombies have been defeated. Great job on your first level.</p>
//             <button
//               type="button"
//               onClick={() => setPhase("menu")}
//               className="mt-8 inline-flex rounded-full bg-lime-500 px-6 py-3 text-lg font-semibold text-slate-950 transition hover:bg-lime-400"
//             >
//               Return to main menu
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
