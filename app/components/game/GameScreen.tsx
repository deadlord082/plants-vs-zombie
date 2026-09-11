"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import {
  INITIAL_SUN,
  PLANT_SPECS,
  PROJECTILE_SPEED_PER_TICK,
  SUNFLOWER_FIRST_BURST_MS,
  SUNFLOWER_GENERATION_MS,
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
  CHERRY_BOMB_FUSE_MS,
  CHOMPER_BITE_MS,
  CHOMPER_SLEEP_MS,
  BASE_PLANT_TYPES,
  FUSION_RECIPES,
} from "./constants";
import { getCompiledLevel } from "./levels";
import type {
  BasePlantTypeKey,
  GamePhase,
  LevelConfig,
  PlantInstance,
  PlantTypeKey,
  CoinInstance,
  Projectile,
  SunInstance,
  ZombieInstance,
  LevelCategory,
} from "./types";
import { LEVELS } from "./levels";
import { getTileDefinition, TILE_DEFINITIONS } from "./tiles";

const createId = () => Math.random().toString(36).slice(2, 9);

const tileKey = (row: number, col: number) => `${row}-${col}`;

const getPlantImage = (plantType: PlantTypeKey) => ({
  peaShooter: "/plants/plant_peashooter.webp",
  sunflower: "/plants/sunflower.webp",
  wallNut: "/plants/wall-nut.webp",
  chomper: "/plants/chomper.webp",
  cherryBomb: "/plants/cherry-bomb.webp",
  peanut: "/plants/peanut.webp",
  sunNut: "/plants/sun-nut.webp",
  tallNut: "/plants/tall-nut.webp",
  chompNut: "/plants/chomp-nut.webp",
  explodeONut: "/plants/explode-o-nut_1.webp",
  twinSunflower: "/plants/twin-sunflower.webp",
  sunBomb: "/plants/sun-bomb.webp",
  sunChomper: "/plants/sun-chomper.webp",
  sunshooter: "/plants/sunshooter.webp",
  repeater: "/plants/repeater.webp",
  chompShooter: "/plants/chomp-shooter.webp",
  cherryBomber: "/plants/cherry-bomber.webp",
  cherryChomper: "/plants/cherry-chomper.webp",
}[plantType]);

const getNutDamageImage = (plantType: PlantTypeKey, stage: number) => {
  if (stage === 0) return getPlantImage(plantType);
  const damagedImages: Partial<Record<PlantTypeKey, [string, string]>> = {
    wallNut: ["/plants/wall-nut-damaged.webp", "/plants/wall-nut-heavely-damaged.webp"],
    peanut: ["/plants/peanut-damaged.webp", "/plants/peanut-heavely-damaged.webp"],
    sunNut: ["/plants/sun-nut-damaged.webp", "/plants/sun-nut-heavenly-damaged.webp"],
    tallNut: ["/plants/tall-nut-damaged.webp", "/plants/tall-nut-heavely-damaged.webp"],
    explodeONut: ["/plants/explode-o-nut-damaged_1.webp", "/plants/explode-o-nut-heavely-damaged_1.webp"],
  };
  return damagedImages[plantType]?.[stage - 1] || getPlantImage(plantType);
};

const getFusionType = (first: PlantTypeKey, second: PlantTypeKey): PlantTypeKey | null => {
  if (PLANT_SPECS[first].fusionOf || PLANT_SPECS[second].fusionOf) return null;
  return FUSION_RECIPES[[first, second].sort().join("+")] || null;
};

const getPlantInstance = (type: PlantTypeKey, row: number, col: number, now: number): PlantInstance => {
  const spec = PLANT_SPECS[type];
  return {
    id: createId(),
    type,
    row,
    col,
    hp: spec.hp,
    plantedAt: now,
    nextSunAt: spec.generateMs ? now + (spec.firstBurstMs || SUNFLOWER_FIRST_BURST_MS) : undefined,
    nextShotAt: spec.shootMs ? now + (spec.shootMs || PEASHOOTER_SHOOT_MS) : undefined,
    lastContactAt: now,
    cherryBombExplodesAt: type === "cherryBomb" || type === "sunBomb" ? now + CHERRY_BOMB_FUSE_MS : undefined,
    sunIntervalMs: spec.generateMs ? randomizeInterval(spec.generateMs) : undefined,
    shootIntervalMs: spec.shootMs ? randomizeInterval(spec.shootMs) : undefined,
    pendingShots: 0,
    nextSunValue: type === "twinSunflower" ? 50 : undefined,
  };
};

const getNutDamageStage = (hp: number) => hp <= 1000 ? 2 : hp <= 2500 ? 1 : 0;

const getZombieImage = (zombieType: string) => zombieType === "imp" ? "/zombie/imp.webp" : zombieType === "gargantuar" ? "/zombie/gargantuar.webp" : "/zombie/zombie.webp";

const getZombieArmorImage = (zombieType: string, armor: number, armorBrokenAt?: number, now = Date.now()) => {
  const armorSpec = zombieType === "cone"
    ? { max: 360, stage: 120, damaged: "/zombie/cone-damaged.webp", heavilyDamaged: "/zombie/cone-heavely-damaged.webp" }
    : zombieType === "bucket"
      ? { max: 1000, stage: 350, damaged: "/zombie/bucket-damaged.webp", heavilyDamaged: "/zombie/bucket-heavely-damaged.webp" }
      : null;
  if (!armorSpec || (armor <= 0 && (!armorBrokenAt || now - armorBrokenAt >= 2000))) return null;
  if (armor <= armorSpec.stage || armorBrokenAt) return armorSpec.heavilyDamaged;
  if (armor <= armorSpec.max - armorSpec.stage) return armorSpec.damaged;
  return zombieType === "cone" ? "/zombie/cone.webp" : "/zombie/bucket.webp";
};

const getZombieLabel = (zombieType: string) => zombieType === "basic"
  ? "Basic zombie"
  : zombieType === "imp"
    ? "Imp"
    : zombieType === "cone"
      ? "Conehead zombie"
      : zombieType === "bucket"
        ? "Buckethead zombie"
        : "Gargantuar";

const applyZombieDamage = (zombie: ZombieInstance, damage: number, now: number): ZombieInstance => {
  const armorDamage = Math.min(zombie.armor, damage);
  const armor = zombie.armor - armorDamage;
  return {
    ...zombie,
    armor,
    hp: Math.max(0, zombie.hp - (damage - armorDamage)),
    armorBrokenAt: zombie.armor > 0 && armor === 0 ? now : zombie.armorBrokenAt,
  };
};

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
  gloveUnlocked: false,
};
type AlmanacCategory = "plants" | "zombies" | "tiles";
type RewardAnimation = "ground" | "unlocking" | "coins" | "transition";

interface RewardDrop {
  kind: "plant" | "money" | "glove";
  plantKey?: PlantTypeKey;
  value?: number;
  x: number;
  y: number;
}

interface ToolCursorPosition {
  x: number;
  y: number;
}

const LEVEL_CATEGORIES: Array<{ key: LevelCategory; name: string; description: string }> = [
  { key: "day", name: "Day", description: "Bright lawns and the beginning of the adventure." },
  { key: "night", name: "Night", description: "A quiet lawn with surprises waiting in the dark." },
  { key: "pool", name: "Pool", description: "Water changes the shape of the battle." },
  { key: "fog", name: "Fog", description: "Keep your eyes open through the mist." },
  { key: "roof", name: "Roof", description: "A rooftop battlefield with a different rhythm." },
  { key: "mini-game", name: "Mini-game", description: "Short challenges with their own rules." },
];

interface PlayerData {
  money: number;
  unlockedPlants: BasePlantTypeKey[];
  completedLevels: number[];
  seedBankSize: number;
  seedSlotsPurchased: number;
  gloveUnlocked: boolean;
}

const randomizeInterval = (interval: number): number => {
  const variance = 1 + (Math.random() - 0.5) * 0.2;
  return interval * variance;
};

export default function GameScreen() {
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [selectedPlant, setSelectedPlant] = useState<BasePlantTypeKey>("peaShooter");
  const [selectedLoadout, setSelectedLoadout] = useState<BasePlantTypeKey[]>([]);
  const [almanacCategory, setAlmanacCategory] = useState<AlmanacCategory>("plants");
  const [almanacPlantKey, setAlmanacPlantKey] = useState<BasePlantTypeKey | null>(null);
  const [selectedLevelCategory, setSelectedLevelCategory] = useState<LevelCategory>("day");
  const [shovelSelected, setShovelSelected] = useState(false);
  const [gloveSelected, setGloveSelected] = useState(false);
  const [movingPlantId, setMovingPlantId] = useState<string | null>(null);
  const [gloveReadyAt, setGloveReadyAt] = useState(0);
  const [toolCursorPosition, setToolCursorPosition] = useState<ToolCursorPosition | null>(null);
  const [isPaused, setIsPaused] = useState(false);
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
  const [spawnedZombieCount, setSpawnedZombieCount] = useState(0);
  const [waveActive, setWaveActive] = useState(false);
  const [plantReady, setPlantReady] = useState<Record<BasePlantTypeKey, number>>({
    sunflower: 0,
    peaShooter: 0,
    wallNut: 0,
    chomper: 0,
    cherryBomb: 0,
  });
  const [gameTime, setGameTime] = useState(Date.now());
  const [gameOver, setGameOver] = useState(false);
  const [showDebugHealth, setShowDebugHealth] = useState(false);
  const [playerData, setPlayerData] = useState<PlayerData>(DEFAULT_PLAYER_DATA);
  const [playerDataLoaded, setPlayerDataLoaded] = useState(false);
  const [rewardDrop, setRewardDrop] = useState<RewardDrop | null>(null);
  const [rewardAnimation, setRewardAnimation] = useState<RewardAnimation>("ground");
  const [rewardlessTransition, setRewardlessTransition] = useState(false);
  const [rewardlessReady, setRewardlessReady] = useState(false);

  const plantsRef = useRef<PlantInstance[]>([]);
  const zombiesRef = useRef<ZombieInstance[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const sunsRef = useRef<SunInstance[]>([]);
  const coinsRef = useRef<CoinInstance[]>([]);
  const sunRef = useRef(INITIAL_SUN);
  const regularSpawnedRef = useRef(0);
  const wave1SpawnedRef = useRef(0);
  const wave2SpawnedRef = useRef(0);
  const spawnedZombieCountRef = useRef(0);
  const waveActiveRef = useRef(false);
  const plantReadyRef = useRef<Record<BasePlantTypeKey, number>>({
    sunflower: 0,
    peaShooter: 0,
    wallNut: 0,
    chomper: 0,
    cherryBomb: 0,
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
  const regularBatchHealthRef = useRef<{ zombieIds: Set<string>; initialHealth: number } | null>(null);
  const suppressNextTileClickRef = useRef(false);

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
          ? parsed.unlockedPlants.filter((key): key is BasePlantTypeKey =>
            key === "peaShooter" || key === "sunflower" || key === "wallNut" || key === "chomper" || key === "cherryBomb")
          : DEFAULT_PLAYER_DATA.unlockedPlants;
        const loadedData: PlayerData = {
          money: Number.isInteger(storedMoney) && storedMoney >= 0 ? storedMoney : 0,
          unlockedPlants: Array.from(new Set(["peaShooter", ...unlockedPlants])) as BasePlantTypeKey[],
          completedLevels: Array.isArray(parsed.completedLevels)
            ? parsed.completedLevels.filter((levelId): levelId is number => Number.isInteger(levelId) && levelId >= 0)
            : [],
          seedBankSize: INITIAL_SEED_BANK_SIZE + Math.min(2, Math.max(0, Number.isInteger(storedSeedSlotsPurchased) ? storedSeedSlotsPurchased : 0)),
          seedSlotsPurchased: Math.min(2, Math.max(0, Number.isInteger(storedSeedSlotsPurchased) ? storedSeedSlotsPurchased : 0)),
          gloveUnlocked: parsed.gloveUnlocked === true,
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

  const setPlantReadyState = (next: Record<BasePlantTypeKey, number>) => {
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
    setSpawnedZombieCount(0);
    spawnedZombieCountRef.current = 0;
    setWaveActive(false);
    waveActiveRef.current = false;
    setPlantReadyState({ sunflower: 0, peaShooter: 0, wallNut: 0, chomper: 0, cherryBomb: 0 });
    setShovelSelected(false);
    setGloveSelected(false);
    setMovingPlantId(null);
    setGloveReadyAt(0);
    setToolCursorPosition(null);
    suppressNextTileClickRef.current = false;
    setIsPaused(false);
    setRewardDrop(null);
    setRewardAnimation("ground");
    setRewardlessTransition(false);
    setRewardlessReady(false);
    setGameOver(false);
    gameOverRef.current = false;
    completionHandledRef.current = false;
    defeatedZombieIdsRef.current.clear();
    regularBatchHealthRef.current = null;
  };

  const startLevel = (levelId: number) => {
    const levelToStart = LEVELS.find((level) => level.id === levelId) || LEVELS[0];
    if (levelToStart.unlockAfterLevelId !== undefined
      && !playerDataRef.current.completedLevels.includes(levelToStart.unlockAfterLevelId)) return;
    const compiledLevel = getCompiledLevel(levelId);
    const now = Date.now();

    resetGameState();
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

  const toggleLoadoutPlant = (plantKey: BasePlantTypeKey) => {
    setSelectedLoadout((current) => {
      if (current.includes(plantKey)) return current.filter((key) => key !== plantKey);
      if (current.length >= playerDataRef.current.seedBankSize) return current;
      return [...current, plantKey];
    });
  };

  const selectShovel = () => {
    setShovelSelected((selected) => !selected);
    setGloveSelected(false);
    setMovingPlantId(null);
    setToolCursorPosition(null);
  };

  const selectGlove = () => {
    if (gloveReadyAt > gameTime) return;
    setGloveSelected((selected) => !selected);
    setShovelSelected(false);
    setMovingPlantId(null);
    setToolCursorPosition(null);
  };

  const returnToMenu = () => {
    setPhase("menu");
    setRewardDrop(null);
    setRewardAnimation("ground");
    setRewardlessTransition(false);
    setRewardlessReady(false);
    setCurrentLevel(null);
    currentLevelRef.current = null;
    setGameOver(false);
    gameOverRef.current = false;
  };

  const returnToLevelSelect = () => {
    setPhase("level-select");
    setRewardDrop(null);
    setRewardAnimation("ground");
    setRewardlessTransition(false);
    setRewardlessReady(false);
    setCurrentLevel(null);
    currentLevelRef.current = null;
    setGameOver(false);
    gameOverRef.current = false;
  };

  const finishLevel = (lastDefeatedZombie: ZombieInstance | null) => {
    if (!currentLevelRef.current || completionHandledRef.current) return;
    completionHandledRef.current = true;
    const levelId = currentLevelRef.current.id;
    const alreadyCompleted = playerDataRef.current.completedLevels.includes(levelId);
    if (alreadyCompleted) {
      setPhase("complete");
      setRewardlessReady(true);
      return;
    }
    if (!alreadyCompleted) {
      const reward = currentLevelRef.current.reward;
      const moneyReward = reward?.money || 0;
      const unlockedPlants = reward?.unlockPlants || [];
      const nextData: PlayerData = {
        ...playerDataRef.current,
        money: playerDataRef.current.money + moneyReward,
        unlockedPlants: Array.from(new Set([...playerDataRef.current.unlockedPlants, ...unlockedPlants])),
        completedLevels: [...playerDataRef.current.completedLevels, levelId],
        gloveUnlocked: playerDataRef.current.gloveUnlocked || reward?.glove === true,
      };
      playerDataRef.current = nextData;
      setPlayerData(nextData);
      if (lastDefeatedZombie && reward) {
        const rewardPlant = unlockedPlants[0];
        setRewardDrop(rewardPlant
          ? { kind: "plant", plantKey: rewardPlant, x: lastDefeatedZombie.x, y: lastDefeatedZombie.row + 0.35 }
          : reward.glove
            ? { kind: "glove", x: lastDefeatedZombie.x, y: lastDefeatedZombie.row + 0.35 }
            : moneyReward > 0
              ? { kind: "money", value: moneyReward, x: lastDefeatedZombie.x, y: lastDefeatedZombie.row + 0.35 }
              : null);
      }
    }
    setPhase("complete");
    const hasReward = Boolean(currentLevelRef.current.reward?.money
      || currentLevelRef.current.reward?.glove
      || currentLevelRef.current.reward?.unlockPlants?.length);
    if (!hasReward) {
      setRewardlessReady(true);
    }
  };

  const startRewardlessTransition = () => {
    if (!rewardlessReady || rewardlessTransition) return;
    setRewardlessReady(false);
    setRewardlessTransition(true);
    window.setTimeout(() => {
      setPhase("level-select");
      setCurrentLevel(null);
      currentLevelRef.current = null;
    }, 700);
    window.setTimeout(() => {
      setRewardlessTransition(false);
    }, 1600);
  };

  const collectReward = () => {
    if (!rewardDrop || rewardAnimation !== "ground") return;
    if (rewardDrop.kind === "money") {
      setRewardAnimation("coins");
      window.setTimeout(() => {
        setRewardAnimation("transition");
        setPhase("level-select");
        setCurrentLevel(null);
        currentLevelRef.current = null;
        setGameOver(false);
        gameOverRef.current = false;
        window.setTimeout(() => {
          setRewardDrop(null);
          setRewardAnimation("ground");
        }, 1000);
      }, 1500);
      return;
    }
    setRewardAnimation("unlocking");
    window.setTimeout(() => {
      setRewardAnimation("transition");
      setPhase("level-select");
      setCurrentLevel(null);
      currentLevelRef.current = null;
      setGameOver(false);
      gameOverRef.current = false;
      window.setTimeout(() => {
        setRewardDrop(null);
        setRewardAnimation("ground");
      }, 1000);
    }, 3800);
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
    if (gloveSelected) return;
    const tile = currentLevelRef.current?.tiles[row]?.[col] || "normal";
    if (!getTileDefinition(tile).canPlant) return;
    const now = Date.now();
    const spec = PLANT_SPECS[selectedPlant];
    if (sunRef.current < spec.cost) return;
    if (plantReadyRef.current[selectedPlant] > now) return;

    const fusionType = existingPlant ? getFusionType(existingPlant.type, selectedPlant) : null;
    if (existingPlant && !fusionType) return;
    const newPlant = getPlantInstance(fusionType || selectedPlant, row, col, now);
    setPlantsState(existingPlant
      ? plantsRef.current.map((plant) => plant.id === existingPlant.id ? newPlant : plant)
      : [...plantsRef.current, newPlant]);
    setSunState(sunRef.current - spec.cost);
    setPlantReadyState({
      ...plantReadyRef.current,
      [selectedPlant]: now + spec.rechargeMs,
    });
  };

  const handleGlovePointerDown = (row: number, col: number) => {
    if (!gloveSelected || gloveReadyAt > Date.now()) return;
    const plant = plantsRef.current.find((item) => item.row === row && item.col === col);
    if (plant) setMovingPlantId(plant.id);
  };

  const handleGlovePointerUp = (row: number, col: number) => {
    if (!gloveSelected || !movingPlantId || gloveReadyAt > Date.now()) return;
    const destinationPlant = plantsRef.current.find((plant) => plant.row === row && plant.col === col);
    const movingPlant = plantsRef.current.find((plant) => plant.id === movingPlantId);
    const tile = currentLevelRef.current?.tiles[row]?.[col] || "normal";
    const fusionType = movingPlant && destinationPlant && movingPlant.id !== destinationPlant.id
      ? getFusionType(movingPlant.type, destinationPlant.type)
      : null;
    if (!movingPlant || (destinationPlant && !fusionType) || !getTileDefinition(tile).canPlant) {
      setMovingPlantId(null);
      return;
    }
    const now = Date.now();
    if (fusionType && destinationPlant) {
      const fusedPlant = getPlantInstance(fusionType, row, col, now);
      setPlantsState(plantsRef.current
        .filter((plant) => plant.id !== movingPlantId && plant.id !== destinationPlant.id)
        .concat(fusedPlant));
    } else {
      setPlantsState(plantsRef.current.map((plant) => plant.id === movingPlantId ? { ...plant, row, col, lastContactAt: now } : plant));
    }
    setMovingPlantId(null);
    setGloveSelected(false);
    setGloveReadyAt(now + (currentLevelRef.current?.gloveRechargeMs || 0));
    suppressNextTileClickRef.current = true;
  };

  const handleGloveBoardPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!gloveSelected || !movingPlantId) return;
    event.preventDefault();
    const tile = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-lawn-row]");
    if (!tile) {
      setMovingPlantId(null);
      return;
    }
    handleGlovePointerUp(Number(tile.dataset.lawnRow), Number(tile.dataset.lawnCol));
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

    const compiledLevel = compiledLevelRef.current;
    const nextWave = compiledLevel?.spawnWaves[spawnState.batchIndex];
    const regularBatchHealth = regularBatchHealthRef.current;
    const regularBatchBelowHalf = regularBatchHealth
      ? nextZombies
        .filter((zombie) => regularBatchHealth.zombieIds.has(zombie.id))
        .reduce((total, zombie) => total + zombie.hp, 0) <= regularBatchHealth.initialHealth * 0.5
      : false;

    const canStartRegularWave = nextWave && !nextWave.isBoss && (now >= spawnState.nextRegularSpawn || regularBatchBelowHalf);
    const canStartBossWave = nextWave?.isBoss && spawnState.nextWaveStart > 0 && now >= spawnState.nextWaveStart;
    if (!waveActiveRef.current && (canStartRegularWave || canStartBossWave)) {
      waveActiveRef.current = true;
      setWaveActive(true);
      spawnState.nextWaveSpawn = now;
      spawnState.nextWaveNumber = 0;
      if (!nextWave.isBoss) {
        regularBatchHealthRef.current = { zombieIds: new Set<string>(), initialHealth: 0 };
      }
    }

    if (waveActiveRef.current && nextWave && now >= spawnState.nextWaveSpawn) {
      const zombieSpawn = nextWave.zombies[spawnState.nextWaveNumber];
      const newZ = spawnZombie(nextWave.isBoss, zombieSpawn?.type || "basic");
      nextZombies.push(newZ);
      if (!nextWave.isBoss && regularBatchHealthRef.current) {
        regularBatchHealthRef.current.zombieIds.add(newZ.id);
        regularBatchHealthRef.current.initialHealth += newZ.hp;
        regularSpawnedRef.current += 1;
        setRegularSpawned(regularSpawnedRef.current);
      }
      spawnState.nextWaveNumber += 1;
      spawnedZombieCountRef.current += 1;
      setSpawnedZombieCount(spawnedZombieCountRef.current);
      if (spawnState.nextWaveNumber >= nextWave.zombies.length) {
        waveActiveRef.current = false;
        setWaveActive(false);
        spawnState.batchIndex += 1;
        spawnState.nextWaveSpawn = 0;
        spawnState.nextWaveStart = 0;
        if (compiledLevel?.spawnWaves[spawnState.batchIndex]) {
          const followingWave = compiledLevel.spawnWaves[spawnState.batchIndex];
          if (followingWave.isBoss) {
            spawnState.nextWaveStart = now + betweenDelay;
          } else {
            spawnState.nextRegularSpawn = now + (nextWave.isBoss ? betweenDelay : regularInterval);
          }
        }
        if (nextWave.isBoss) {
          regularBatchHealthRef.current = null;
        }
      } else {
        spawnState.nextWaveSpawn = now + waveInterval;
      }
    }

    const explodingCherryBombs = nextPlants.filter(
      (plant) => (plant.type === "cherryBomb" || plant.type === "sunBomb") && plant.cherryBombExplodesAt && now >= plant.cherryBombExplodesAt,
    );
    const getZombieImage = (zombieType: string) => zombieType === "imp" ? "/zombie/imp.webp" : zombieType === "gargantuar" ? "/zombie/gargantuar.webp" : "/zombie/zombie.webp";
    const getZombieArmorImage = (zombieType: string, armor: number, armorBrokenAt?: number, now = Date.now()) => {
      const armorSpec = zombieType === "cone"
        ? { max: 360, stage: 120, damaged: "/zombie/cone-damaged.webp", heavilyDamaged: "/zombie/cone-heavely-damaged.webp" }
        : zombieType === "bucket"
          ? { max: 1000, stage: 350, damaged: "/zombie/bucket-damaged.webp", heavilyDamaged: "/zombie/bucket-heavely-damaged.webp" }
          : null;
      if (!armorSpec || (armor <= 0 && (!armorBrokenAt || now - armorBrokenAt >= 2000))) return null;
      if (armor <= armorSpec.stage || armorBrokenAt) return armorSpec.heavilyDamaged;
      if (armor <= armorSpec.max - armorSpec.stage) return armorSpec.damaged;
      return zombieType === "cone" ? "/zombie/cone.webp" : "/zombie/bucket.webp";
    };
    const getZombieLabel = (zombieType: string) => zombieType === "basic"
      ? "Basic zombie"
      : zombieType === "imp"
        ? "Imp"
        : zombieType === "cone"
          ? "Conehead zombie"
          : zombieType === "bucket"
            ? "Buckethead zombie"
            : "Gargantuar";
    const applyZombieDamage = (zombie: ZombieInstance, damage: number, now: number): ZombieInstance => {
      const armorDamage = Math.min(zombie.armor, damage);
      const armor = zombie.armor - armorDamage;
      return {
        ...zombie,
        armor,
        hp: Math.max(0, zombie.hp - (damage - armorDamage)),
        armorBrokenAt: zombie.armor > 0 && armor === 0 ? now : zombie.armorBrokenAt,
      };
    };
    const markDamage = (zombie: ZombieInstance, damage: number, sunOnKill = 0) => {
      const damaged = applyZombieDamage(zombie, damage, now);
      return damaged.hp <= 0 && zombie.hp > 0 && sunOnKill > 0
        ? { ...damaged, sunOnKill }
        : damaged;
    };
    for (const cherryBomb of explodingCherryBombs) {
      nextZombies = nextZombies.map((zombie) => {
        const inBlast = Math.abs(zombie.row - cherryBomb.row) <= 1 && Math.abs(Math.floor(zombie.x) - cherryBomb.col) <= 1;
        return inBlast ? markDamage(zombie, 1000, cherryBomb.type === "sunBomb" ? 25 : 0) : zombie;
      });
    }
    if (explodingCherryBombs.length > 0) {
      const explodedIds = new Set(explodingCherryBombs.map((plant) => plant.id));
      nextPlants = nextPlants.filter((plant) => !explodedIds.has(plant.id));
    }

    nextPlants = nextPlants.map((plant) => {
      const plantSpec = PLANT_SPECS[plant.type];
      if ((plantSpec.generateMs && plant.nextSunAt && now >= plant.nextSunAt)
        && ["sunflower", "sunNut", "twinSunflower", "sunshooter"].includes(plant.type)) {
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
          value: plant.type === "twinSunflower" ? (plant.nextSunValue || 50) : (plantSpec.generateAmount || 50),
          expiresAt: now + SUN_LIFETIME_MS,
        });
        const interval = plant.sunIntervalMs || (plantSpec.generateMs || SUNFLOWER_GENERATION_MS);
        return {
          ...plant,
          nextSunAt: plant.nextSunAt + interval,
          nextSunValue: plant.type === "twinSunflower" ? (plant.nextSunValue === 50 ? 75 : 50) : plant.nextSunValue,
        };
      }

      const canShoot = ["peaShooter", "peanut", "sunshooter", "repeater", "cherryBomber"].includes(plant.type);
      if (canShoot && plant.nextShotAt && now >= plant.nextShotAt) {
        // Only shoot if there's at least one zombie ahead in the same row AND within grid bounds
        const anyAhead = zombiesRef.current.some(
          (z) => z.row === plant.row && z.x > plant.col && z.x >= 0 && z.x < gridCols && z.hp > 0
        );
        if (anyAhead) {
          const shots = Array.from({ length: plantSpec.shotsPerBurst || 1 }, (_, index): Projectile => ({
            id: createId(), row: plant.row, x: plant.col + 0.5,
            damage: plantSpec.damage || 20, pierces: plantSpec.pierces === true,
            image: plantSpec.projectileImage, blastDamage: plantSpec.projectileBlastDamage,
            blastRadius: plantSpec.projectileBlastRadius, launchAt: now + index * (plantSpec.shotDelayMs || 0),
          }));
          nextProjectiles = [...nextProjectiles, ...shots];
        }
        const interval = plant.shootIntervalMs || ((plantSpec.shootMs || PEASHOOTER_SHOOT_MS) * (plantSpec.fireRateMultiplier || 1));
        return {
          ...plant,
          nextShotAt: plant.nextShotAt + interval,
        };
      }

      if (["chomper", "chompNut", "sunChomper", "chompShooter", "cherryChomper"].includes(plant.type)) {
        if (plant.pendingShots && plant.pendingShots > 0 && plant.nextPendingShotAt && now >= plant.nextPendingShotAt) {
          const shot: Projectile = {
            id: createId(), row: plant.row, x: plant.col + 0.5,
            damage: plantSpec.eatProjectileDamage || 80, pierces: false,
            image: plantSpec.eatProjectileImage,
          };
          nextProjectiles = [...nextProjectiles, shot];
          return {
            ...plant,
            pendingShots: plant.pendingShots - 1,
            nextPendingShotAt: plant.pendingShots > 1 ? now + PEASHOOTER_SHOOT_MS : undefined,
          };
        }
        if (plant.sleepingUntil && now < plant.sleepingUntil) return plant;

        const target = nextZombies
          .filter((zombie) => zombie.hp > 0 && zombie.row === plant.row && zombie.x > plant.col && zombie.x <= plant.col + 1)
          .sort((a, b) => a.x - b.x)[0];
        if (!target) return plant;

        const targetMaxHp = ZOMBIE_SPECS[target.type]?.hp || target.hp;
        if (targetMaxHp <= 200) {
          nextZombies = nextZombies.map((zombie) => zombie.id === target.id ? { ...zombie, hp: 0 } : zombie);
          if (plantSpec.bonusSunOnEat) {
            nextSuns.push({ id: createId(), row: plant.row, x: plant.col + 0.5, y: plant.row + 0.25, value: plantSpec.bonusSunOnEat, expiresAt: now + SUN_LIFETIME_MS });
          }
          if (plantSpec.eatExplosionDamage) {
            nextZombies = nextZombies.map((zombie) => {
              const inBlast = Math.abs(zombie.row - plant.row) <= 1 && Math.abs(Math.floor(zombie.x) - plant.col) <= 1;
              return inBlast ? applyZombieDamage(zombie, plantSpec.eatExplosionDamage || 200, now) : zombie;
            });
          }
          return {
            ...plant,
            hp: Math.min(plantSpec.hp, plant.hp + (plantSpec.regeneration || 0)),
            sleepingUntil: now + CHOMPER_SLEEP_MS,
            lastContactAt: now,
            pendingShots: plantSpec.eatProjectileCount || plant.pendingShots,
            nextPendingShotAt: plantSpec.eatProjectileCount ? now + CHOMPER_SLEEP_MS : plant.nextPendingShotAt,
          };
        }

        if (now - (plant.lastContactAt || 0) >= CHOMPER_BITE_MS) {
          nextZombies = nextZombies.map((zombie) => zombie.id === target.id ? applyZombieDamage(zombie, plantSpec.damage || 40, now) : zombie);
          return { ...plant, lastContactAt: now };
        }
      }

      return plant;
    });

    nextPlants = nextPlants.filter((plant) => plant.hp > 0);

    // Move projectiles forward but do not affect zombies (zombies don't interact with grid)
    nextProjectiles = nextProjectiles.reduce<Projectile[]>((acc, projectile) => {
      if (projectile.launchAt && now < projectile.launchAt) {
        acc.push(projectile);
        return acc;
      }
      const moved = { ...projectile, x: projectile.x + PROJECTILE_SPEED_PER_TICK };
      // detect hit against nearest zombie in same row
      const hitZombies = nextZombies
        .filter((z) => z.row === moved.row && z.hp > 0 && moved.x >= z.x - 0.3 && !projectile.hitZombieIds?.includes(z.id))
        .sort((a, b) => a.x - b.x);

      if (hitZombies.length > 0) {
        if (moved.blastDamage && moved.blastRadius) {
          const blastCenter = hitZombies[0];
          nextZombies = nextZombies.map((z) => {
            const inBlast = Math.abs(z.row - blastCenter.row) <= moved.blastRadius! && Math.abs(Math.floor(z.x) - Math.floor(blastCenter.x)) <= moved.blastRadius!;
            return inBlast ? applyZombieDamage(z, moved.blastDamage!, now) : z;
          });
        } else {
          nextZombies = nextZombies.map((z) => hitZombies.some((hit) => hit.id === z.id) ? applyZombieDamage(z, moved.damage, now) : z);
        }
        if (!moved.pierces) return acc;
        const hitZombieIds = [...(moved.hitZombieIds || []), ...hitZombies.map((z) => z.id)];
        acc.push({ ...moved, hitZombieIds });
        return acc;
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
      if (plantIndex >= 0 && zombie.hp > 0) {
        // Establish contact first, then wait one attack interval before biting.
        const zombieSpec = ZOMBIE_SPECS[zombie.type] || ZOMBIE_SPECS.basic;
        if (zombie.contactStartedAt === undefined) {
          zombie = { ...zombie, contactStartedAt: now };
        } else if (now - zombie.contactStartedAt >= zombieSpec.attackMs && now - zombie.lastAttackAt >= zombieSpec.attackMs) {
          const plant = nextPlants[plantIndex];
          const nextHp = plant.type === "cherryBomb" ? plant.hp : Math.max(0, plant.hp - zombieSpec.damage);
          const stageChanged = plant.type === "explodeONut" && getNutDamageStage(plant.hp) !== getNutDamageStage(nextHp);
          nextPlants[plantIndex] = { ...plant, hp: nextHp };
          if (stageChanged) {
            nextZombies = nextZombies.map((target) => {
              const inBlast = Math.abs(target.row - plant.row) <= 1 && Math.abs(Math.floor(target.x) - plant.col) <= 1;
              return inBlast ? applyZombieDamage(target, 1000, now) : target;
            });
          }
          zombie = { ...zombie, lastAttackAt: now };
        }

        // plant deals contact damage (e.g., pea shooter)
        const plant = nextPlants[plantIndex];
        const spec = PLANT_SPECS[plant.type];
        const contactInterval = spec.shootMs || PEASHOOTER_SHOOT_MS;
        if (!["chomper", "chompNut", "sunChomper", "chompShooter", "cherryChomper"].includes(plant.type) && spec.damage && now - (plant.lastContactAt || 0) >= contactInterval) {
          zombie = applyZombieDamage(zombie, spec.damage, now);
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
      return { ...zombie, x: newX, contactStartedAt: undefined };
    });

    let lastDefeatedZombie: ZombieInstance | null = null;
    nextZombies.forEach((zombie) => {
      if (zombie.hp > 0 || defeatedZombieIdsRef.current.has(zombie.id)) return;
      defeatedZombieIdsRef.current.add(zombie.id);
      lastDefeatedZombie = zombie;
      if (zombie.sunOnKill) {
        nextSuns.push({
          id: createId(),
          row: zombie.row,
          x: zombie.x,
          y: zombie.row + 0.35,
          value: zombie.sunOnKill,
          expiresAt: now + SUN_LIFETIME_MS,
        });
      }
      const dropChance = ZOMBIE_SPECS[zombie.type]?.coinDropChance || 0;
      if (Math.random() >= dropChance) return;
      const isGold = Math.random() < 0.2;
      nextCoins.push({
        id: createId(),
        row: zombie.row,
        x: zombie.x,
        y: zombie.row + 0.35,
        value: isGold ? 20 : 10,
        image: isGold ? "/other/gold-coin.webp" : "/other/silver-coin.webp",
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
      compiledLevelRef.current &&
      spawnedZombieCountRef.current === compiledLevelRef.current.totalZombieCount &&
      nextZombies.length === 0 &&
      !waveActiveRef.current
    ) {
      finishLevel(lastDefeatedZombie);
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
  const compiledCurrentLevel = currentLevel ? getCompiledLevel(currentLevel.id) : null;

  const progressMax = currentLevel
    ? compiledCurrentLevel?.totalZombieCount || 1
    : 1;
  const zombiesSent = spawnedZombieCount;
  const progressPercent = currentLevel ? Math.round((zombiesSent / progressMax) * 100) : 0;
  const waveThresholds = compiledCurrentLevel
    ? compiledCurrentLevel.spawnWaves.reduce<number[]>((thresholds, wave, index) => {
      if (wave.isBoss && index > 0) thresholds.push(compiledCurrentLevel.spawnWaves.slice(0, index).reduce((total, previous) => total + previous.zombies.length, 0));
      return thresholds;
    }, [])
    : [];
  const title =
    phase === "menu"
      ? "Plants vs. Zombies"
      : phase === "category-select"
        ? "Select a Category"
        : phase === "level-select"
          ? "Select a Level"
          : phase === "shop"
            ? "Shop"
            : phase === "almanac"
              ? "Almanac"
              : phase === "credits"
                ? "Credits"
                : currentLevel
                  ? currentLevel.title
                  : "Level";
  const waveStageLabel = (() => {
    if (!currentLevel) return "";
    const nextWave = compiledCurrentLevel?.spawnWaves[spawnScheduleRef.current.batchIndex];
    if (waveActive && nextWave?.isBoss) return "Boss wave in progress.";
    if (nextWave?.isBoss) return "Preparing a boss wave...";
    return nextWave ? "Regular zombies are marching." : "";
  })();
  const zombieTypes = compiledCurrentLevel
    ? Array.from(
      new Set([
        ...compiledCurrentLevel.waveSpawns.flat().map((zombie) => zombie.type),
        ...compiledCurrentLevel.bossWaveSequences.flat().map((zombie) => zombie.type),
      ]),
    )
    : [];
  const movingPlant = movingPlantId ? plants.find((plant) => plant.id === movingPlantId) : null;

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 px-4 py-8 sm:px-8 ${phase === "credits" ? "credits-mode" : ""}`}>
      <div className="mx-auto max-w-7xl">
        <h1 className="text-4xl font-bold tracking-tight text-lime-300">{title}</h1>

        {phase === "menu" && (
          <div className="main-menu">
            <div className="menu-sunburst" aria-hidden="true"><img src="/other/sun.webp" alt="" /></div>
            <p className="menu-kicker">Welcome to the lawn</p>
            <h2>Choose your defense</h2>
            <p className="menu-copy">Plant wisely, collect sun, and stop the zombie waves before they reach the house.</p>
            <div className="mb-6 flex items-center justify-center gap-5 text-lg font-semibold text-amber-200">
              <span>Money: ${playerData.money}</span>
              <span>Seed slots: {playerData.seedBankSize}</span>
            </div>
            <div className="menu-actions">
              <button type="button" onClick={() => setPhase("category-select")} className="menu-primary">Start Game <span>→</span></button>
              <button type="button" onClick={() => setPhase("shop")} className="menu-secondary">Shop <span>◆</span></button>
              <button type="button" onClick={() => setPhase("almanac")} className="menu-secondary">Open Almanac <span>▣</span></button>
              <button type="button" onClick={() => setPhase("credits")} className="menu-secondary">Credits <span>✦</span></button>
            </div>
          </div>
        )}

        {phase === "credits" && (
          <div className="credits-screen">
            <div className="credits-scroll" aria-label="Credits">
              <div className="credits-content">
                <p className="credits-kicker">Plants vs. Zombies</p>
                <h2>Credits</h2>
                <p>This game is heavily inspired by the original Plants vs. Zombies from EA.</p>
                <p>Everything has been made by me.</p>
                <p className="credits-name">Gaboriau Lukas</p>
                <p className="credits-thanks">Thank you for playing.</p>
              </div>
            </div>
            <button type="button" onClick={() => setPhase("menu")} className="credits-back-button">Back to main menu</button>
          </div>
        )}

        {phase === "category-select" && (
          <div className="level-select-screen category-select-screen">
            <div className="screen-heading"><div><p className="menu-kicker">Choose your chapter</p><h2>Select a Category</h2><p>Every category brings a different kind of lawn.</p></div><button type="button" onClick={() => setPhase("menu")} className="text-button">Back to menu</button></div>
            <div className="category-card-grid">
              {LEVEL_CATEGORIES.map((category) => {
                const categoryLevels = LEVELS.filter((level) => level.category === category.key);
                const isCompleted = categoryLevels.length > 0 && categoryLevels.every((level) => playerData.completedLevels.includes(level.id));
                return (
                  <button key={category.key} type="button" onClick={() => { setSelectedLevelCategory(category.key); setPhase("level-select"); }} className={`category-card ${isCompleted ? "completed" : ""}`}>
                    {isCompleted && <span className="level-completed-ribbon">Completed</span>}
                    <span className="category-card-number">{categoryLevels.length || "-"}</span>
                    <span className="category-card-content"><strong>{category.name}</strong><small>{category.description}</small><em>{categoryLevels.length ? `${categoryLevels.length} level${categoryLevels.length === 1 ? "" : "s"}` : "Coming soon"}</em></span>
                    <span className="category-card-arrow">→</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {phase === "level-select" && (
          <div className="level-select-screen">
            <div className="screen-heading"><div><p className="menu-kicker">{LEVEL_CATEGORIES.find((category) => category.key === selectedLevelCategory)?.name} category</p><h2>Select a Level</h2><p>Each lawn brings a different layout and wave pattern.</p></div><button type="button" onClick={() => setPhase("category-select")} className="text-button">Back</button></div>
            <div className="level-card-grid">
              {LEVELS.filter((level) => level.category === selectedLevelCategory).map((level) => (
                <div key={level.id} className={`level-card ${level.unlockAfterLevelId !== undefined && !playerData.completedLevels.includes(level.unlockAfterLevelId) ? "locked" : ""}`}>
                  {playerData.completedLevels.includes(level.id) && <span className="level-completed-ribbon">Completed</span>}
                  <div className="level-card-content">
                    <div>
                      <h2 className="text-2xl font-semibold text-white">{level.title}</h2>
                      <p>{level.unlockAfterLevelId !== undefined && !playerData.completedLevels.includes(level.unlockAfterLevelId) ? "Complete the previous level to unlock this lawn." : level.description}</p>
                    </div>
                    <div className="level-card-actions">
                      <button type="button" onClick={() => startLevel(level.id)} disabled={level.unlockAfterLevelId !== undefined && !playerData.completedLevels.includes(level.unlockAfterLevelId)} className="menu-primary disabled:cursor-not-allowed disabled:opacity-50">{level.unlockAfterLevelId !== undefined && !playerData.completedLevels.includes(level.unlockAfterLevelId) ? "Locked" : "Play Level"} <span>{level.unlockAfterLevelId !== undefined && !playerData.completedLevels.includes(level.unlockAfterLevelId) ? "●" : "→"}</span></button>
                    </div>
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
              {almanacCategory === "plants" && !almanacPlantKey && BASE_PLANT_TYPES.map((plantKey) => {
                const spec = PLANT_SPECS[plantKey];
                return <article key={spec.key} className="almanac-card"><div className="almanac-art plant-art"><img src={getPlantImage(spec.key)} alt="" /></div><div><p className="almanac-type">Plant</p><h3>{spec.name}</h3><p>{spec.summary}</p><dl><div><dt>Cost</dt><dd>{spec.cost} sun</dd></div><div><dt>Health</dt><dd>{spec.hp} HP</dd></div><div><dt>Recharge</dt><dd>{spec.rechargeMs / 1000}s</dd></div>{spec.damage && <div><dt>Damage</dt><dd>{spec.damage}</dd></div>}</dl><button type="button" className="almanac-fusion-button" onClick={() => setAlmanacPlantKey(plantKey)}>View fusions</button></div></article>;
              })}
              {almanacCategory === "plants" && almanacPlantKey && <>
                <div className="almanac-fusion-heading"><button type="button" className="text-button" onClick={() => setAlmanacPlantKey(null)}>Back to plants</button><div><p className="almanac-type">Fusions</p><h3>{PLANT_SPECS[almanacPlantKey].name} combinations</h3></div></div>
                {Object.values(PLANT_SPECS).filter((spec) => spec.fusionOf?.includes(almanacPlantKey as never)).map((spec) => <article key={spec.key} className="almanac-card"><div className="almanac-art plant-art"><img src={getPlantImage(spec.key)} alt="" /></div><div><p className="almanac-type">Fusion plant</p><h3>{spec.name}</h3><p>{spec.summary}</p><p className="almanac-recipe">Requires {spec.fusionOf?.map((key) => PLANT_SPECS[key].name).join(" + ")}</p><dl><div><dt>Health</dt><dd>{spec.hp} HP</dd></div>{spec.damage && <div><dt>Damage</dt><dd>{spec.damage}</dd></div>}</dl></div></article>)}
              </>}
              {almanacCategory === "zombies" && Object.values(ZOMBIE_SPECS).map((spec) => <article key={spec.key} className="almanac-card"><div className="almanac-art zombie-art relative"><img src={getZombieImage(spec.key)} alt="" />{(spec.key === "cone" || spec.key === "bucket") && <img src={spec.key === "cone" ? "/zombie/cone.webp" : "/zombie/bucket.webp"} alt="" className="absolute object-contain" style={{ width: "33.333%", height: "33.333%", left: "40%", top: "18%", transform: "translateX(-50%)" }} />}</div><div><p className="almanac-type">Zombie</p><h3>{spec.name}</h3><p>{spec.summary}</p><dl><div><dt>Health</dt><dd>{spec.hp} HP</dd></div><div><dt>Speed</dt><dd>{Math.round(spec.moveMs / 100) / 10}s / tile</dd></div><div><dt>Damage</dt><dd>{spec.damage}</dd></div><div><dt>Attack</dt><dd>{spec.attackMs / 1000}s</dd></div><div><dt>Armor</dt><dd>{spec.armor}</dd></div></dl></div></article>)}
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
                <div className="loadout-heading-actions"><button type="button" onClick={() => setPhase("level-select")} className="text-button">Back</button><div className="loadout-count">{selectedLoadout.length} / {playerData.seedBankSize}</div></div>
              </div>
              <div className="plant-choice-grid">
                {playerData.unlockedPlants.map((plantKey) => {
                  const spec = PLANT_SPECS[plantKey];
                  const selected = selectedLoadout.includes(plantKey);
                  return (
                    <button key={plantKey} type="button" onClick={() => toggleLoadoutPlant(plantKey)} className={`plant-choice ${selected ? "selected" : ""}`} aria-pressed={selected}>
                      <div className="plant-choice-image"><img src={getPlantImage(plantKey)} alt="" /></div>
                      <div><h3>{spec.name}</h3><p>{spec.cost} sun</p></div>
                      <span className="plant-choice-check">{selected ? "✓" : "+"}</span>
                    </button>
                  );
                })}
              </div>
              <div className="loadout-seed-preview" style={{ gridTemplateColumns: `repeat(${playerData.seedBankSize}, minmax(3rem, 4.5rem))` }}>
                {Array.from({ length: playerData.seedBankSize }).map((_, index) => {
                  const plantKey = selectedLoadout[index];
                  return <div key={`preview-${index}`} className={`preview-slot ${plantKey ? "filled" : ""}`}>{plantKey && <img src={getPlantImage(plantKey)} alt={PLANT_SPECS[plantKey].name} />}</div>;
                })}
              </div>
            </section>
            <aside className="loadout-zombies">
              <div className="loadout-heading"><div><p className="loadout-kicker">Incoming threats</p><h2>Zombies</h2></div><span className="zombie-count">{zombieTypes.length}</span></div>
              <div className="zombie-choice-list">
                {zombieTypes.map((zombieType) => {
                  return <div key={zombieType} className="zombie-choice"><div className="zombie-choice-art"><img src={getZombieImage(zombieType)} alt="" />{(zombieType === "cone" || zombieType === "bucket") && <img src={zombieType === "cone" ? "/zombie/cone.webp" : "/zombie/bucket.webp"} alt="" className="zombie-choice-hat" />}</div><div><strong>{getZombieLabel(zombieType)}</strong></div></div>;
                })}
              </div>
            </aside>
            <button type="button" className="start-level-button" disabled={selectedLoadout.length === 0} onClick={beginLevel}>Start level <span>→</span></button>
          </div>
        )}

        {(phase === "playing" || phase === "complete") && (
          <div className="mt-6 space-y-4">
            <div className="game-toolbar">
              <div className="sun-counter" aria-label={`${sun} sun available`}><img src="/other/sun.webp" alt="" /> <strong>{sun}</strong></div>
              <div className="seed-tray" aria-label="Seed packet selection" style={{ gridTemplateColumns: `repeat(${playerData.seedBankSize}, minmax(3rem, 4.4rem))` }}>
                {selectedLoadout.map((plantKey) => {
                  const spec = PLANT_SPECS[plantKey];
                  const ready = plantReadyRef.current[plantKey] <= gameTime;
                  const enoughSun = sunRef.current >= spec.cost;
                  const disabled = !ready || !enoughSun;
                  const coolDown = Math.max(0, Math.ceil((plantReadyRef.current[plantKey] - gameTime) / 1000));
                  return (
                    <button key={plantKey} type="button" aria-label={`${spec.name}, costs ${spec.cost} sun`} onClick={() => { setSelectedPlant(plantKey); setShovelSelected(false); setGloveSelected(false); setMovingPlantId(null); }} className={`seed-slot ${selectedPlant === plantKey && !shovelSelected && !gloveSelected ? "selected" : ""} ${disabled ? "unavailable" : ""}`}>
                      <img src={getPlantImage(spec.key)} alt="" />
                      <span>{spec.cost}</span>
                      {!ready && <small>{coolDown}s</small>}
                    </button>
                  );
                })}
                {Array.from({ length: Math.max(0, playerData.seedBankSize - selectedLoadout.length) }).map((_, index) => <div key={`empty-${index}`} className="seed-slot empty" aria-hidden="true" />)}
              </div>
              <button type="button" aria-label="Select shovel" onClick={selectShovel} className={`shovel-button ${shovelSelected ? "selected" : ""}`}><img src="/other/shovel.webp" alt="" /></button>
              {playerData.gloveUnlocked && <button type="button" aria-label="Select glove" onClick={selectGlove} disabled={gloveReadyAt > gameTime} className={`shovel-button glove-button ${gloveSelected ? "selected" : ""} ${gloveReadyAt > gameTime ? "unavailable" : ""}`}><img src="/other/glove.webp" alt="" />{gloveReadyAt > gameTime && <small>{Math.ceil((gloveReadyAt - gameTime) / 1000)}s</small>}</button>}
              <button type="button" aria-label="Open pause menu" onClick={() => setIsPaused(true)} className="settings-button">⚙</button>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-700 bg-slate-900/90 p-4 shadow-xl">
              <div
                className={`relative grid gap-1 bg-slate-950 p-1 sm:p-2 ${shovelSelected ? "shovel-cursor" : gloveSelected ? "glove-cursor" : ""}`}
                onPointerMove={(event) => setToolCursorPosition({ x: event.clientX, y: event.clientY })}
                onPointerUp={handleGloveBoardPointerUp}
                onPointerLeave={() => setToolCursorPosition(null)}
                onClick={startRewardlessTransition}
                style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
              >
                {grid.flat().map(({ row, col }) => {
                  const plant = plants.find((item) => item.row === row && item.col === col);
                  const tile = getTileDefinition(currentLevel?.tiles[row]?.[col] || "normal");

                  return (
                    <button
                      key={tileKey(row, col)}
                      type="button"
                      onClick={(event) => {
                        if (gloveSelected || suppressNextTileClickRef.current) {
                          event.preventDefault();
                          suppressNextTileClickRef.current = false;
                          return;
                        }
                        handlePlacePlant(row, col);
                      }}
                      onPointerDown={(event) => {
                        if (gloveSelected) {
                          event.preventDefault();
                          handleGlovePointerDown(row, col);
                        }
                      }}
                      data-lawn-row={row}
                      data-lawn-col={col}
                      disabled={!tile.canPlant}
                      aria-label={tile.label || "Available lawn tile"}
                      className={`relative z-0 min-h-16 overflow-visible p-2 text-left transition ${tile.className}`}
                    >
                      {tile.label && !plant && <span className="text-xs font-semibold uppercase tracking-wide text-stone-200">{tile.label}</span>}
                      {plant && (
                        <div className="plant-idle relative z-10 h-full w-full text-xs text-lime-200">
                          {(() => {
                            const isNutPlant = ["wallNut", "peanut", "sunNut", "tallNut", "explodeONut"].includes(plant.type);
                            const nutStage = plant.type === "tallNut"
                              ? plant.hp <= 2000 ? 2 : plant.hp <= 4000 ? 1 : 0
                              : getNutDamageStage(plant.hp);
                            const wallNutImage = isNutPlant
                              ? getNutDamageImage(plant.type, nutStage)
                              : getPlantImage(plant.type);
                            const isSleeping = (plant.type === "chomper" || plant.type === "chompNut") && plant.sleepingUntil && plant.sleepingUntil > gameTime;
                            const cherryGrowth = (plant.type === "cherryBomb" || plant.type === "sunBomb") && plant.cherryBombExplodesAt
                              ? Math.min(1, Math.max(0, 1 - (plant.cherryBombExplodesAt - gameTime) / CHERRY_BOMB_FUSE_MS))
                              : 0;
                            return (
                              <img
                                src={wallNutImage}
                                alt={PLANT_SPECS[plant.type].name}
                                className="absolute inset-0 h-full w-full scale-125 object-contain"
                                style={{
                                  transform: plant.type === "cherryBomb" || plant.type === "sunBomb"
                                    ? `scale(${0.75 + cherryGrowth * 0.35})`
                                    : isSleeping ? "scale(1.05, 0.72)" : "scale(1.25)",
                                  filter: isSleeping ? "brightness(0.58)" : undefined,
                                  transition: `transform ${GAME_TICK_MS}ms ease-out, filter ${GAME_TICK_MS}ms ease-out`,
                                }}
                                onError={(event) => {
                                  event.currentTarget.remove();
                                  event.currentTarget.nextElementSibling?.classList.remove("hidden");
                                  event.currentTarget.parentElement?.querySelector("[data-image-debug-health]")?.classList.add("hidden");
                                }}
                              />
                            );
                          })()}
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
                      src="/other/sun.webp"
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

                {rewardDrop && (
                  <button
                    type="button"
                    aria-label={rewardDrop.kind === "money" ? `Collect $${rewardDrop.value}` : "Collect level reward"}
                    onClick={collectReward}
                    className={`reward-drop reward-${rewardDrop.kind} reward-${rewardAnimation}`}
                    style={{
                      left: `${(rewardDrop.x / gridCols) * 100}%`,
                      top: `${(rewardDrop.y / gridRows) * 100}%`,
                    }}
                  >
                    <span className="reward-card">
                      <img
                        src={rewardDrop.kind === "money"
                          ? "/other/money-bag.webp"
                          : rewardDrop.kind === "glove"
                            ? "/other/glove.webp"
                            : getPlantImage(rewardDrop.plantKey || "peaShooter")}
                        alt=""
                        className="reward-art"
                      />
                      {rewardDrop.kind === "money" && <strong>${rewardDrop.value}</strong>}
                    </span>
                    {rewardDrop.kind === "money" && rewardAnimation === "coins" && (
                      <span className="reward-coin-burst" aria-hidden="true">
                        {Array.from({ length: 8 }).map((_, index) => <img key={index} src="/other/gold-coin.webp" alt="" className="reward-coin" />)}
                      </span>
                    )}
                  </button>
                )}

                {/* Zombie overlay: render zombies absolutely so they can move smoothly (fractional x) */}
                {zombies.map((z) => {
                  const armorImage = getZombieArmorImage(z.type, z.armor, z.armorBrokenAt, gameTime);
                  const armorIsFalling = Boolean(z.armorBrokenAt && gameTime - z.armorBrokenAt < 2000);
                  const zombieImage = getZombieImage(z.type);
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
                      <div className={`relative ${z.type === "gargantuar" ? "h-32 w-32" : z.type === "imp" ? "h-16 w-16" : "h-20 w-20"}`}>
                        <img src={zombieImage} alt={getZombieLabel(z.type)} className="absolute inset-0 h-full w-full origin-bottom object-contain" />
                        {armorImage && <img src={armorImage} alt="" className={`absolute origin-bottom object-contain ${armorIsFalling ? "zombie-armor-falling" : ""}`} style={{ width: "45%", height: "45%", left: "38%", top: "-28%", transform: "translateX(-50%)" }} />}
                      </div>
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
                      src={p.image || "/plants/projectile-pea.webp"}
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

      {(rewardlessTransition || (rewardDrop && (rewardAnimation === "unlocking" || rewardAnimation === "transition"))) && (
        <div className={`reward-white-overlay reward-overlay-${rewardlessTransition ? "empty" : rewardAnimation}`} aria-hidden="true" />
      )}
      {toolCursorPosition && (shovelSelected || gloveSelected) && (
        <>
          {gloveSelected && movingPlant && (
            <img
              src={getPlantImage(movingPlant.type)}
              alt=""
              aria-hidden="true"
              className="tool-cursor-plant"
              style={{ left: toolCursorPosition.x, top: toolCursorPosition.y }}
            />
          )}
          <img
            src={shovelSelected ? "/other/shovel.webp" : "/other/glove.webp"}
            alt=""
            aria-hidden="true"
            className={`tool-cursor-image ${gloveSelected ? "tool-cursor-glove" : "tool-cursor-shovel"}`}
            style={{ left: toolCursorPosition.x, top: toolCursorPosition.y }}
          />
        </>
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
