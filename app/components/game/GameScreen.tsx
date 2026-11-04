"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import {
  INITIAL_SUN,
  PLANT_SPECS,
  PROJECTILE_SPEED_PER_TICK,
  SUNFLOWER_FIRST_BURST_MS,
  SUNFLOWER_GENERATION_MS,
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
  ICEBERG_LETTUCE_FUSE_MS,
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
  PlantSpec,
  PlantTypeKey,
  CoinInstance,
  Projectile,
  SunInstance,
  ZombieInstance,
  LevelCategory,
  LevelChallenge,
  StatueInstance,
  ZombieProjectile,
} from "./types";
import { LEVELS } from "./levels";
import { getTileDefinition, TILE_DEFINITIONS } from "./tiles";

const createId = () => Math.random().toString(36).slice(2, 9);
const random = () => Math.random();
const currentTime = () => Date.now();

const tileKey = (row: number, col: number) => `${row}-${col}`;

const PLANT_IMAGES: Partial<Record<PlantTypeKey, string>> = {
  peaShooter: "/plants/plant_peashooter.webp",
  sunflower: "/plants/sunflower.webp",
  wallNut: "/plants/wall-nut.webp",
  chomper: "/plants/chomper.webp",
  cherryBomb: "/plants/cherry-bomb.webp",
  icebergLettuce: "/plants/iceberg_lettuce.webp",
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
  frozenCherry: "/plants/frozen-cherry.webp",
  snowPeashooter: "/plants/snow-peashooter.webp",
  frostNut: "/plants/frost-nut.webp",
  puffShroom: "/plants/puff-shroom.webp",
  fumeShroom: "/plants/fume-shroom.webp",
  hypnoShroom: "/plants/hypno-shroom.webp",
};

const getPlantImage = (plantType: PlantTypeKey) =>
  PLANT_SPECS[plantType].plantImage || PLANT_IMAGES[plantType] || "/plants/puff-shroom.webp";

const getNutDamageImage = (plantType: PlantTypeKey, stage: number) => {
  if (stage === 0) return getPlantImage(plantType);
  const damagedImages: Partial<Record<PlantTypeKey, [string, string]>> = {
    wallNut: ["/plants/wall-nut-damaged.webp", "/plants/wall-nut-heavely-damaged.webp"],
    peanut: ["/plants/peanut-damaged.webp", "/plants/peanut-heavely-damaged.webp"],
    sunNut: ["/plants/sun-nut-damaged.webp", "/plants/sun-nut-heavenly-damaged.webp"],
    tallNut: ["/plants/tall-nut-damaged.webp", "/plants/tall-nut-heavely-damaged.webp"],
    explodeONut: ["/plants/explode-o-nut-damaged_1.webp", "/plants/explode-o-nut-heavely-damaged_1.webp"],
    frostNut: ["/plants/frost-nut-damaged.webp", "/plants/frost-nut-heavely-damaged.webp"],
    fumeNut: ["/plants/fume-nut-damaged.webp", "/plants/fume-nut-heavely-damaged.webp"],
  };
  return damagedImages[plantType]?.[stage - 1] || getPlantImage(plantType);
};

const getFusionType = (first: PlantTypeKey, second: PlantTypeKey): PlantTypeKey | null => {
  if (PLANT_SPECS[first].fusionOf || PLANT_SPECS[second].fusionOf) return null;
  return FUSION_RECIPES[[first, second].sort().join("+")] || null;
};

const getPuffFusionType = (first: PlantTypeKey, second: PlantTypeKey): PlantTypeKey | null => {
  return FUSION_RECIPES[[first, second].sort().join("+")] || null;
};
const canFusePlants = (first: PlantTypeKey, second: PlantTypeKey) =>
  getFusionType(first, second) !== null || getPuffFusionType(first, second) !== null;
const describeChallenge = (challenge: LevelChallenge) => {
  switch (challenge.type) {
    case "produceSun":
      return `Collect at least ${challenge.amount} sun before the level ends.`;
    case "maxSunSpent":
      return `Spend no more than ${challenge.amount} sun on plants.`;
    case "maxPlantsLost":
      return `Lose no more than ${challenge.amount} plants. Shoveling a plant counts as losing it.`;
    case "maxPlantsOnLawn":
      return `Never have more than ${challenge.amount} plants on the lawn.`;
    case "usePlant":
      return `Use at least one of these plants to beat the level: ${challenge.plants.map((plant) => PLANT_SPECS[plant].name).join(", ")}.`;
    case "killZombiesWithin":
      return `Defeat ${challenge.count} zombies within ${challenge.seconds} seconds.`;
  }
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
    nextSunAt: spec.generateMs ? now + (spec.firstBurstMs || SUNFLOWER_FIRST_BURST_MS)
      : spec.spawnedHypnotizedZombieMs ? now + spec.spawnedHypnotizedZombieMs : undefined,
    nextShotAt: spec.shootMs ? now + (spec.shootMs || PEASHOOTER_SHOOT_MS) : undefined,
    lastContactAt: now,
    cherryBombExplodesAt: type === "cherryBomb" || type === "sunBomb" ? now + CHERRY_BOMB_FUSE_MS
      : type === "frozenCherry" ? now + ICEBERG_LETTUCE_FUSE_MS : undefined,
    sunIntervalMs: spec.generateMs ? randomizeInterval(spec.generateMs) : undefined,
    shootIntervalMs: spec.shootMs ? randomizeInterval(spec.shootMs) : undefined,
    pendingShots: 0,
    nextSunValue: type === "twinSunflower" ? 50 : undefined,
    obstacleDestroyAt: type === "graveBuster" ? now + 5000 : undefined,
    nextAnimationShotAt: spec.fumeAttack ? now + (spec.shootMs || 2000) - (spec.animationDurationMs || 500) : undefined,
  };
};

const getNutDamageStage = (hp: number) => hp <= 1000 ? 2 : hp <= 2500 ? 1 : 0;
const getPlantDamageStage = (plantType: PlantTypeKey, hp: number) =>
  plantType === "tallNut" || plantType === "fumeNut"
    ? hp <= 2000 ? 2 : hp <= 4000 ? 1 : 0
    : getNutDamageStage(hp);

const getZombieImage = (zombieType: string) => ({
  imp: "/zombie/imp.webp",
  gargantuar: "/zombie/gargantuar.webp",
  wallNutZombie: "/zombie/wall-nut-zombie.webp",
  peashooterZombie: "/zombie/peashooter-zombie.webp",
  horseman: "/zombie/zombie-horseman.webp",
  undyingWraith: "/zombie/undying-wraith.webp",
  poleVaulting: "/zombie/pole-vaulting-zombie.webp",
}[zombieType] || "/zombie/zombie.webp");

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
    : zombieType === "cone"
      ? "Conehead zombie"
      : zombieType === "bucket"
        ? "Buckethead zombie"
          : ZOMBIE_SPECS[zombieType]?.name || zombieType;

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

const hypnotizeZombie = (zombie: ZombieInstance, now: number, plantSpec: PlantSpec): ZombieInstance => {
  const hpMultiplier = plantSpec.hypnotizedHpMultiplier ?? 1;
  return {
    ...zombie,
    hp: Math.max(1, Math.round(zombie.hp * hpMultiplier)),
    armor: Math.round(zombie.armor * hpMultiplier),
    hypnotized: true,
    hypnotizedHpMultiplier: hpMultiplier,
    hypnotizedStatMultiplier: hpMultiplier,
    hypnotizedVisualScale: plantSpec.hypnotizedVisualScale ?? zombie.hypnotizedVisualScale,
    hypnoDeathExplosion: plantSpec.deathExplosionOnHypnotize || zombie.hypnoDeathExplosion,
    freezingAttacks: plantSpec.hypnotizeFreezes || zombie.freezingAttacks,
    frozenUntil: plantSpec.hypnotizeFreezes ? now + 5000 : zombie.frozenUntil,
    contactStartedAt: undefined,
    nextAttackTargetId: undefined,
    lastAttackAt: now,
  };
};

const getGridRows = (level: LevelConfig | null) => level?.tiles.length || 0;
const getGridCols = (level: LevelConfig | null) => level?.tiles[0]?.length || 0;
const PLANT_HITBOX_HALF_WIDTH = 0.28;
const ZOMBIE_HITBOX_HALF_WIDTH = 0.18;
const PLANT_PROJECTILE_Y_OFFSET = 0.36;
const isZombieTouchingPlant = (zombie: ZombieInstance, plant: PlantInstance) =>
  zombie.row === plant.row
  && Math.abs(zombie.x - (plant.col + 0.5)) <= PLANT_HITBOX_HALF_WIDTH + ZOMBIE_HITBOX_HALF_WIDTH;
const isZombieInChomperRange = (zombie: ZombieInstance, plant: PlantInstance) =>
  zombie.row === plant.row && zombie.x >= plant.col && zombie.x < plant.col + 2;
const INITIAL_SEED_BANK_SIZE = 5;
const SEED_SLOT_COSTS = [5000, 8000];
const COIN_LIFETIME_MS = 15000;
const INTRO_TEXT_DURATION_MS = 4000;
const PLAYER_DATA_STORAGE_KEY = "plants-vs-zombie-player";
const MUSIC_SETTINGS_STORAGE_KEY = "plants-vs-zombie-music-volume";
const DEFAULT_PLAYER_DATA: PlayerData = {
  money: 0,
  zombieKills: {},
  unlockedPlants: ["peaShooter"],
  completedLevels: [],
  difficulty: "normal",
  levelTrophies: {},
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

interface PickupAnimation {
  id: string;
  image: string;
  kind: "coin" | "sun";
  startX: number;
  startY: number;
  deltaX: number;
  deltaY: number;
}

interface ExplosionEffect {
  id: string;
  row: number;
  col: number;
  startedAt: number;
  expiresAt: number;
  particles: Array<{
    id: string;
    offsetX: number;
    offsetY: number;
    driftX: number;
    driftY: number;
    delayMs: number;
    rotation: number;
  }>;
}

interface ChallengeRunState {
  sunProduced: number;
  sunSpent: number;
  plantsLost: number;
  zombieKillTimes: number[];
  completedTimedKillChallenges: Set<number>;
  usedPlants: Set<BasePlantTypeKey>;
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
  zombieKills: Record<string, number>;
  unlockedPlants: BasePlantTypeKey[];
  completedLevels: number[];
  difficulty: Difficulty;
  levelTrophies: Record<number, Difficulty>;
  seedBankSize: number;
  seedSlotsPurchased: number;
  gloveUnlocked: boolean;
}

type Difficulty = "easy" | "normal" | "hard" | "impossible";

const DIFFICULTIES: Array<{ key: Difficulty; label: string; color: string }> = [
  { key: "easy", label: "Easy", color: "#58b947" },
  { key: "normal", label: "Normal", color: "#ffffff" },
  { key: "hard", label: "Hard", color: "#ed4545" },
  { key: "impossible", label: "Impossible", color: "#171717" },
];
const DIFFICULTY_RANK: Record<Difficulty, number> = { easy: 0, normal: 1, hard: 2, impossible: 3 };
const DIFFICULTY_SETTINGS: Record<Difficulty, {
  damageTakenMultiplier: number;
  moveDurationMultiplier: number;
  damageDealtMultiplier: number;
  interWaveDelayMultiplier: number;
  interWaveDelayAdjustmentMs: number;
}> = {
  easy: { damageTakenMultiplier: 1.3, moveDurationMultiplier: 1.2, damageDealtMultiplier: 1, interWaveDelayMultiplier: 2, interWaveDelayAdjustmentMs: 0 },
  normal: { damageTakenMultiplier: 1, moveDurationMultiplier: 1, damageDealtMultiplier: 1, interWaveDelayMultiplier: 1, interWaveDelayAdjustmentMs: 0 },
  hard: { damageTakenMultiplier: 0.8, moveDurationMultiplier: 1, damageDealtMultiplier: 1, interWaveDelayMultiplier: 1, interWaveDelayAdjustmentMs: -2000 },
  impossible: { damageTakenMultiplier: 0.5, moveDurationMultiplier: 0.8, damageDealtMultiplier: 1.5, interWaveDelayMultiplier: 1, interWaveDelayAdjustmentMs: -4000 },
};
const TROPHY_IMAGES: Record<Difficulty, string> = {
  easy: "/other/trophy-easy.webp",
  normal: "/other/trophy-normal.webp",
  hard: "/other/trophy-hard.webp",
  impossible: "/other/trophy-impossible.webp",
};
const isDifficulty = (value: unknown): value is Difficulty =>
  DIFFICULTIES.some(({ key }) => key === value);
const getTrophyImage = (difficulty: Difficulty | undefined) =>
  difficulty ? TROPHY_IMAGES[difficulty] : null;

const randomizeInterval = (interval: number): number => {
  const variance = 1 + (random() - 0.5) * 0.2;
  return interval * variance;
};

export default function GameScreen() {
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [selectedPlant, setSelectedPlant] = useState<BasePlantTypeKey | null>(null);
  const [selectedLoadout, setSelectedLoadout] = useState<BasePlantTypeKey[]>([]);
  const [almanacCategory, setAlmanacCategory] = useState<AlmanacCategory>("plants");
  const [almanacPlantKey, setAlmanacPlantKey] = useState<BasePlantTypeKey | null>(null);
  const [almanacReturnPhase, setAlmanacReturnPhase] = useState<"menu" | "playing">("menu");
  const [selectedLevelCategory, setSelectedLevelCategory] = useState<LevelCategory>("day");
  const [shovelSelected, setShovelSelected] = useState(false);
  const [gloveSelected, setGloveSelected] = useState(false);
  const [movingPlantId, setMovingPlantId] = useState<string | null>(null);
  const [gloveReadyAt, setGloveReadyAt] = useState(0);
  const [toolCursorPosition, setToolCursorPosition] = useState<ToolCursorPosition | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.5);
  const [musicSettingsLoaded, setMusicSettingsLoaded] = useState(false);
  const [currentLevel, setCurrentLevel] = useState<LevelConfig | null>(null);
  const [sun, setSun] = useState(INITIAL_SUN);
  const [plants, setPlants] = useState<PlantInstance[]>([]);
  const [zombies, setZombies] = useState<ZombieInstance[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [suns, setSuns] = useState<SunInstance[]>([]);
  const [coins, setCoins] = useState<CoinInstance[]>([]);
  const [pickupAnimations, setPickupAnimations] = useState<PickupAnimation[]>([]);
  const [explosionEffects, setExplosionEffects] = useState<ExplosionEffect[]>([]);
  const [statues, setStatues] = useState<StatueInstance[]>([]);
  const [zombieProjectiles, setZombieProjectiles] = useState<ZombieProjectile[]>([]);
  const [regularSpawned, setRegularSpawned] = useState(0);
  const [wave1Spawned, setWave1Spawned] = useState(0);
  const [wave2Spawned, setWave2Spawned] = useState(0);
  const [spawnedZombieCount, setSpawnedZombieCount] = useState(0);
  const [waveActive, setWaveActive] = useState(false);
  const [showBossWaveWarning, setShowBossWaveWarning] = useState(false);
  const [plantReady, setPlantReady] = useState<Record<BasePlantTypeKey, number>>({
    sunflower: 0,
    peaShooter: 0,
    wallNut: 0,
    chomper: 0,
    cherryBomb: 0,
    icebergLettuce: 0,
    puffShroom: 0,
    fumeShroom: 0,
    hypnoShroom: 0,
    graveBuster: 0,
  });
  const [gameTime, setGameTime] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameOverMessage, setGameOverMessage] = useState("A zombie reached your house. Try again!");
  const [challengeBriefingOpen, setChallengeBriefingOpen] = useState(false);
  const [challengeProgress, setChallengeProgress] = useState({
    sunProduced: 0,
    sunSpent: 0,
    plantsLost: 0,
    zombieKillCounts: [] as number[],
    completedTimedKillChallenges: [] as number[],
  });
  const [introTextIndex, setIntroTextIndex] = useState<number | null>(null);
  const [readyCountdownIndex, setReadyCountdownIndex] = useState<number | null>(null);
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
  const statuesRef = useRef<StatueInstance[]>([]);
  const zombieProjectilesRef = useRef<ZombieProjectile[]>([]);
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
    icebergLettuce: 0,
    puffShroom: 0,
    fumeShroom: 0,
    hypnoShroom: 0,
    graveBuster: 0,
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
  const bossWarningBatchRef = useRef(-1);
  const bossWarningUntilRef = useRef(0);
  const nextSkySunAtRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const playerDataRef = useRef<PlayerData>(DEFAULT_PLAYER_DATA);
  const completionHandledRef = useRef(false);
  const challengeRunRef = useRef<ChallengeRunState>({
    sunProduced: 0,
    sunSpent: 0,
    plantsLost: 0,
    zombieKillTimes: [],
    completedTimedKillChallenges: new Set(),
    usedPlants: new Set(),
  });
  const defeatedZombieIdsRef = useRef(new Set<string>());
  const regularBatchHealthRef = useRef<{ zombieIds: Set<string>; initialHealth: number; isBoss: boolean } | null>(null);
  const suppressNextTileClickRef = useRef(false);
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);
  const musicRestartTimerRef = useRef<number | null>(null);
  const coinBalanceRef = useRef<HTMLDivElement | null>(null);
  const sunCounterRef = useRef<HTMLDivElement | null>(null);
  const explosionEffectsRef = useRef<ExplosionEffect[]>([]);
  const cheatCodeBufferRef = useRef("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const storedValue = window.localStorage.getItem(MUSIC_SETTINGS_STORAGE_KEY);
      const storedVolume = storedValue === null ? null : Number(storedValue);
      if (storedVolume !== null && Number.isFinite(storedVolume)) {
        setMusicVolume(Math.min(1, Math.max(0, Math.round(storedVolume * 10) / 10)));
      }
      setMusicSettingsLoaded(true);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (musicSettingsLoaded) {
      window.localStorage.setItem(MUSIC_SETTINGS_STORAGE_KEY, String(musicVolume));
    }
  }, [musicVolume, musicSettingsLoaded]);

  useEffect(() => {
    const musicTrack = currentLevel?.musicTrack;
    if (!musicTrack || (phase !== "playing" && phase !== "complete")) return;

    const audio = new Audio(musicTrack);
    audio.addEventListener("ended", () => {
      musicRestartTimerRef.current = window.setTimeout(() => {
        audio.currentTime = 0;
        void audio.play().catch(() => undefined);
      }, 1000);
    });
    musicAudioRef.current = audio;
    void audio.play().catch(() => undefined);

    return () => {
      if (musicRestartTimerRef.current !== null) window.clearTimeout(musicRestartTimerRef.current);
      musicRestartTimerRef.current = null;
      audio.pause();
      audio.removeAttribute("src");
      musicAudioRef.current = null;
    };
  }, [currentLevel?.musicTrack, phase]);

  useEffect(() => {
    if (musicAudioRef.current) musicAudioRef.current.volume = musicVolume;
  }, [musicVolume]);

  useEffect(() => {
    const audio = musicAudioRef.current;
    if (!audio) return;
    if (isPaused) {
      audio.pause();
      if (musicRestartTimerRef.current !== null) window.clearTimeout(musicRestartTimerRef.current);
      musicRestartTimerRef.current = null;
    } else if (phase === "playing" || phase === "complete") {
      void audio.play().catch(() => undefined);
    }
  }, [isPaused, phase]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(PLAYER_DATA_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<PlayerData>;
          const storedMoney = typeof parsed.money === "number" ? parsed.money : 0;
          const storedSeedSlotsPurchased = typeof parsed.seedSlotsPurchased === "number"
            ? parsed.seedSlotsPurchased
            : typeof parsed.seedBankSize === "number" ? parsed.seedBankSize - INITIAL_SEED_BANK_SIZE : 0;
          const seedSlotsPurchased = Math.min(2, Math.max(0, Number.isInteger(storedSeedSlotsPurchased) ? storedSeedSlotsPurchased : 0));
          const storedZombieKills = parsed.zombieKills && typeof parsed.zombieKills === "object" && !Array.isArray(parsed.zombieKills)
            ? Object.fromEntries(Object.entries(parsed.zombieKills).filter(([type, count]) => type in ZOMBIE_SPECS && Number.isInteger(count) && count > 0))
            : {};
          const unlockedPlants = Array.isArray(parsed.unlockedPlants)
            ? parsed.unlockedPlants.filter((key): key is BasePlantTypeKey =>
              BASE_PLANT_TYPES.some((plantType) => plantType === key))
            : DEFAULT_PLAYER_DATA.unlockedPlants;
          const storedLevelTrophies = parsed.levelTrophies && typeof parsed.levelTrophies === "object" && !Array.isArray(parsed.levelTrophies)
            ? Object.fromEntries(Object.entries(parsed.levelTrophies)
              .filter(([levelId, difficulty]) => Number.isInteger(Number(levelId)) && isDifficulty(difficulty)))
            : {};
          const completedLevels = Array.isArray(parsed.completedLevels)
            ? parsed.completedLevels.filter((levelId): levelId is number => Number.isInteger(levelId) && levelId >= 0)
            : [];
          const levelTrophies: Record<number, Difficulty> = Object.fromEntries(completedLevels.map((levelId) => [
            levelId,
            isDifficulty(storedLevelTrophies[levelId]) ? storedLevelTrophies[levelId] : "normal",
          ]));
          const loadedData: PlayerData = {
            money: Number.isInteger(storedMoney) && storedMoney >= 0 ? storedMoney : 0,
            zombieKills: storedZombieKills,
            unlockedPlants: Array.from(new Set(["peaShooter", ...unlockedPlants])) as BasePlantTypeKey[],
            completedLevels,
            difficulty: isDifficulty(parsed.difficulty) ? parsed.difficulty : "normal",
            levelTrophies,
            seedBankSize: INITIAL_SEED_BANK_SIZE + seedSlotsPurchased,
            seedSlotsPurchased,
            gloveUnlocked: parsed.gloveUnlocked === true,
          };
          playerDataRef.current = loadedData;
          setPlayerData(loadedData);
        }
      } catch {
        window.localStorage.removeItem(PLAYER_DATA_STORAGE_KEY);
      }
      setPlayerDataLoaded(true);
    }, 0);
    return () => window.clearTimeout(timeout);
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

  const getPlayableTile = (row: number, col: number) => {
    const obstacle = statuesRef.current.find((item) => item.row === row && item.col === col);
    if (obstacle) return obstacle.type;
    const configuredTile = currentLevelRef.current?.tiles[row]?.[col] || "normal";
    if (configuredTile === "grave" || configuredTile === "sunflowerStatue" || configuredTile === "sunShroomStatue") {
      return (row + col) % 2 === 0 ? "normal" : "normalDark";
    }
    return configuredTile;
  };

  const failChallenge = (message: string) => {
    if (gameOverRef.current) return;
    gameOverRef.current = true;
    setGameOverMessage(`Challenge failed: ${message}`);
    setGameOver(true);
  };

  const refreshChallengeProgress = (now = currentTime()) => {
    const challenges = currentLevelRef.current?.challenges || [];
    setChallengeProgress({
      sunProduced: challengeRunRef.current.sunProduced,
      sunSpent: challengeRunRef.current.sunSpent,
      plantsLost: challengeRunRef.current.plantsLost,
      zombieKillCounts: challenges.map((challenge) => challenge.type === "killZombiesWithin"
        ? challengeRunRef.current.zombieKillTimes.filter((killTime) => now - killTime <= challenge.seconds * 1000).length
        : 0),
      completedTimedKillChallenges: [...challengeRunRef.current.completedTimedKillChallenges],
    });
  };

  const startChallengeCountdown = () => {
    setChallengeBriefingOpen(false);
    setReadyCountdownIndex(0);
  };

  const resetGameState = () => {
    setSunState(INITIAL_SUN);
    setPlantsState([]);
    setZombiesState([]);
    setProjectilesState([]);
    setSunsState([]);
    setCoinsState([]);
    statuesRef.current = [];
    setStatues([]);
    zombieProjectilesRef.current = [];
    setZombieProjectiles([]);
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
    setShowBossWaveWarning(false);
    bossWarningBatchRef.current = -1;
    bossWarningUntilRef.current = 0;
    setPlantReadyState({
      sunflower: 0, peaShooter: 0, wallNut: 0, chomper: 0, cherryBomb: 0, icebergLettuce: 0,
      puffShroom: 0, fumeShroom: 0, hypnoShroom: 0, graveBuster: 0,
    });
    setShovelSelected(false);
    setGloveSelected(false);
    setSelectedPlant(null);
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
    setGameOverMessage("A zombie reached your house. Try again!");
    setChallengeBriefingOpen(false);
    setIntroTextIndex(null);
    setReadyCountdownIndex(null);
    setPickupAnimations([]);
    explosionEffectsRef.current = [];
    setExplosionEffects([]);
    gameOverRef.current = false;
    completionHandledRef.current = false;
    challengeRunRef.current = {
      sunProduced: 0,
      sunSpent: 0,
      plantsLost: 0,
      zombieKillTimes: [],
      completedTimedKillChallenges: new Set(),
      usedPlants: new Set(),
    };
    setChallengeProgress({
      sunProduced: 0,
      sunSpent: 0,
      plantsLost: 0,
      zombieKillCounts: [],
      completedTimedKillChallenges: [],
    });
    defeatedZombieIdsRef.current.clear();
    regularBatchHealthRef.current = null;
  };

  const startLevel = (levelId: number) => {
    const levelToStart = LEVELS.find((level) => level.id === levelId) || LEVELS[0];
    if (levelToStart.unlockAfterLevelId !== undefined
      && !playerDataRef.current.completedLevels.includes(levelToStart.unlockAfterLevelId)) return;
    const compiledLevel = getCompiledLevel(levelId);
    const now = currentTime();

    resetGameState();
    setCurrentLevel(levelToStart);
    currentLevelRef.current = levelToStart;
    compiledLevelRef.current = compiledLevel;
    const levelStatues = levelToStart.tiles.flatMap((tiles, row) => tiles
      .map((tile, col): StatueInstance | null => {
        if (tile === "sunflowerStatue" || tile === "sunShroomStatue") {
          return { id: createId(), row, col, type: tile, hp: 1000 };
        }
        return tile === "grave"
          ? { id: createId(), row, col, type: tile, image: `/other/grave${Math.floor(random() * 3) + 1}.webp` }
          : null;
      })
      .filter((obstacle): obstacle is StatueInstance => obstacle !== null));
    statuesRef.current = levelStatues;
    setStatues(levelStatues);
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
    const requiredPlantSets = currentLevelRef.current.challenges
      ?.filter((challenge): challenge is Extract<LevelChallenge, { type: "usePlant" }> => challenge.type === "usePlant")
      .map((challenge) => challenge.plants) || [];
    if (requiredPlantSets.some((plantSet) => !plantSet.some((plant) => selectedLoadout.includes(plant)))) return;
    const now = currentTime();
    spawnScheduleRef.current = {
      nextRegularSpawn: now + currentLevelRef.current.initialDelayMs,
      nextWaveStart: 0,
      nextWaveSpawn: 0,
      nextWaveNumber: 1,
      batchIndex: 0,
    };
    nextSkySunAtRef.current = currentLevelRef.current.skySunIntervalMs ? now + currentLevelRef.current.skySunIntervalMs : 0;
    challengeRunRef.current = {
      sunProduced: 0,
      sunSpent: 0,
      plantsLost: 0,
      zombieKillTimes: [],
      completedTimedKillChallenges: new Set(),
      usedPlants: new Set(),
    };
    refreshChallengeProgress(now);
    setGameTime(now);
    setChallengeBriefingOpen(!currentLevelRef.current.introTexts?.length && Boolean(currentLevelRef.current.challenges?.length));
    setIntroTextIndex(currentLevelRef.current.introTexts?.length ? 0 : null);
    setReadyCountdownIndex(currentLevelRef.current.introTexts?.length || currentLevelRef.current.challenges?.length ? null : 0);
    setPhase("playing");
  };

  const toggleLoadoutPlant = (plantKey: BasePlantTypeKey) => {
    const requiredPlants = currentLevelRef.current?.challenges
      ?.filter((challenge): challenge is Extract<LevelChallenge, { type: "usePlant" }> => challenge.type === "usePlant")
      .flatMap((challenge) => challenge.plants) || [];
    if (requiredPlants.length > 0 && !requiredPlants.includes(plantKey)) return;
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

  const openAlmanac = (returnPhase: "menu" | "playing") => {
    setAlmanacReturnPhase(returnPhase);
    setAlmanacPlantKey(null);
    setShowSettings(false);
    setPhase("almanac");
  };

  const finishLevel = (lastDefeatedZombie: ZombieInstance | null) => {
    if (!currentLevelRef.current || completionHandledRef.current) return;
    completionHandledRef.current = true;
    setShovelSelected(false);
    setGloveSelected(false);
    setMovingPlantId(null);
    setToolCursorPosition(null);
    const levelId = currentLevelRef.current.id;
    const difficulty = playerDataRef.current.difficulty;
    const previousTrophy = playerDataRef.current.levelTrophies[levelId];
    if (!previousTrophy || DIFFICULTY_RANK[difficulty] > DIFFICULTY_RANK[previousTrophy]) {
      const nextData = {
        ...playerDataRef.current,
        levelTrophies: { ...playerDataRef.current.levelTrophies, [levelId]: difficulty },
      };
      playerDataRef.current = nextData;
      setPlayerData(nextData);
    }
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

  const selectDifficulty = (difficulty: Difficulty) => {
    const nextData = { ...playerDataRef.current, difficulty };
    playerDataRef.current = nextData;
    setPlayerData(nextData);
  };

  const activateCheatCode = useCallback(() => {
    const completedLevels = Array.from(new Set([
      ...playerDataRef.current.completedLevels,
      ...LEVELS.map((level) => level.id),
    ]));
    const levelTrophies = {
      ...playerDataRef.current.levelTrophies,
      ...Object.fromEntries(LEVELS.map((level) => [level.id, "impossible" as const])),
    };
    const nextData: PlayerData = {
      ...playerDataRef.current,
      money: 99999,
      unlockedPlants: Array.from(new Set([...playerDataRef.current.unlockedPlants, ...BASE_PLANT_TYPES])),
      completedLevels,
      difficulty: "impossible",
      levelTrophies,
      gloveUnlocked: playerDataRef.current.gloveUnlocked || LEVELS.some((level) => level.reward?.glove),
    };
    playerDataRef.current = nextData;
    setPlayerData(nextData);
  }, []);

  useEffect(() => {
    cheatCodeBufferRef.current = "";
    if (phase !== "menu" || !playerDataLoaded) return;

    const cheatCode = "iamthelord";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.altKey || event.metaKey) return;
      if (!/^[a-z]$/i.test(event.key)) {
        cheatCodeBufferRef.current = "";
        return;
      }

      cheatCodeBufferRef.current = `${cheatCodeBufferRef.current}${event.key.toLowerCase()}`.slice(-cheatCode.length);
      if (cheatCodeBufferRef.current === cheatCode) {
        cheatCodeBufferRef.current = "";
        activateCheatCode();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activateCheatCode, phase, playerDataLoaded]);

  const handlePlacePlant = (row: number, col: number) => {
    if (phase !== "playing") return;
    const tilePlants = plantsRef.current.filter((plant) => plant.row === row && plant.col === col);
    const obstacle = statuesRef.current.find((item) => item.row === row && item.col === col);
    if (shovelSelected) {
      if (tilePlants.length > 0) {
        setPlantsState(plantsRef.current.filter((plant) => plant.row !== row || plant.col !== col));
        challengeRunRef.current.plantsLost += tilePlants.length;
        const lossLimit = currentLevelRef.current?.challenges
          ?.find((challenge): challenge is Extract<LevelChallenge, { type: "maxPlantsLost" }> => challenge.type === "maxPlantsLost");
        if (lossLimit && challengeRunRef.current.plantsLost > lossLimit.amount) {
          failChallenge(describeChallenge(lossLimit));
        }
        refreshChallengeProgress(gameTime);
        setShovelSelected(false);
      }
      return;
    }
    if (gloveSelected) return;
    if (!selectedPlant) return;
    const tile = getPlayableTile(row, col);
    const isGraveBuster = selectedPlant === "graveBuster";
    if (obstacle && !isGraveBuster) return;
    if (!obstacle && !getTileDefinition(tile).canPlant) return;
    if (obstacle?.type === "grave" && isGraveBuster === false) return;
    if (isGraveBuster && !obstacle) return;
    if (tilePlants.length > 0 && isGraveBuster) return;
    const now = gameTime;
    const spec = PLANT_SPECS[selectedPlant];
    if (sunRef.current < spec.cost) return;
    if (plantReadyRef.current[selectedPlant] > now) return;

    let nextPlants = plantsRef.current.slice();
    if (tilePlants.length === 0 || (spec.puffStack && tilePlants.every((plant) => PLANT_SPECS[plant.type].puffStack))) {
      if (spec.puffStack && tilePlants.length >= 4) return;
      nextPlants.push(getPlantInstance(selectedPlant, row, col, now));
    } else if (tilePlants.every((plant) => PLANT_SPECS[plant.type].puffStack)) {
      const compatiblePlants = tilePlants
        .map((plant) => ({ plant, type: getPuffFusionType(plant.type, selectedPlant) }))
        .filter((entry): entry is { plant: PlantInstance; type: PlantTypeKey } => entry.type !== null);
      if (compatiblePlants.length === 0) return;
      const fusedIds = new Set(compatiblePlants.map(({ plant }) => plant.id));
      const fusedPlants = compatiblePlants.map(({ type }) => getPlantInstance(type, row, col, now));
      nextPlants = nextPlants.filter((plant) => !fusedIds.has(plant.id)).concat(fusedPlants);
    } else {
      if (tilePlants.length !== 1) return;
      const existingPlant = tilePlants[0];
      const fusionType = getFusionType(existingPlant.type, selectedPlant);
      if (!fusionType) return;
      const newPlant = getPlantInstance(fusionType, row, col, now);
      nextPlants = nextPlants.map((plant) => plant.id === existingPlant.id ? newPlant : plant);
    }
    setPlantsState(nextPlants);
    setSunState(sunRef.current - spec.cost);
    challengeRunRef.current.sunSpent += spec.cost;
    challengeRunRef.current.usedPlants.add(selectedPlant);
    setPlantReadyState({
      ...plantReadyRef.current,
      [selectedPlant]: now + spec.rechargeMs,
    });
    setSelectedPlant(null);
    const sunSpendLimit = currentLevelRef.current?.challenges
      ?.find((challenge): challenge is Extract<LevelChallenge, { type: "maxSunSpent" }> => challenge.type === "maxSunSpent");
    if (sunSpendLimit && challengeRunRef.current.sunSpent > sunSpendLimit.amount) {
      failChallenge(describeChallenge(sunSpendLimit));
    }
    refreshChallengeProgress(now);
    const plantCountLimit = currentLevelRef.current?.challenges
      ?.find((challenge): challenge is Extract<LevelChallenge, { type: "maxPlantsOnLawn" }> => challenge.type === "maxPlantsOnLawn");
    if (plantCountLimit && nextPlants.length > plantCountLimit.amount) {
      failChallenge(describeChallenge(plantCountLimit));
    }
  };

  const handleGlovePointerDown = (row: number, col: number) => {
    if (!gloveSelected || gloveReadyAt > gameTime) return;
    const plant = plantsRef.current.find((item) => item.row === row && item.col === col);
    if (plant) setMovingPlantId(plant.id);
  };

  const handleGlovePointerUp = (row: number, col: number) => {
    if (!gloveSelected || !movingPlantId || gloveReadyAt > gameTime) return;
    const movingPlant = plantsRef.current.find((plant) => plant.id === movingPlantId);
    const sourcePlants = movingPlant && PLANT_SPECS[movingPlant.type].puffStack
      ? plantsRef.current.filter((plant) => plant.row === movingPlant.row && plant.col === movingPlant.col && PLANT_SPECS[plant.type].puffStack)
      : movingPlant ? [movingPlant] : [];
    const destinationPlants = plantsRef.current.filter((plant) => plant.row === row && plant.col === col && !sourcePlants.some((source) => source.id === plant.id));
    const destinationPlant = destinationPlants[0];
    const obstacle = statuesRef.current.some((item) => item.row === row && item.col === col);
    const tile = getPlayableTile(row, col);
    if (!movingPlant || obstacle || (!getTileDefinition(tile).canPlant && destinationPlants.length === 0) || (destinationPlants.length > 0 && !sourcePlants.every((plant) => PLANT_SPECS[plant.type].puffStack) && !PLANT_SPECS[destinationPlant?.type || movingPlant.type].puffStack)) {
      setMovingPlantId(null);
      return;
    }
    const now = gameTime;
    const isPuffFusion = destinationPlants.some((plant) => PLANT_SPECS[plant.type].puffStack);
    if (destinationPlants.length > 0 && isPuffFusion) {
      const unusedDestinations = new Set(destinationPlants.map((plant) => plant.id));
      const compatiblePlants: Array<{ source: PlantInstance; destination: PlantInstance; type: PlantTypeKey }> = [];
      const unmatchedSources: PlantInstance[] = [];
      for (const source of sourcePlants) {
        const compatibleDestination = destinationPlants.find((destination) =>
          unusedDestinations.has(destination.id) && getPuffFusionType(source.type, destination.type) !== null);
        if (!compatibleDestination) {
          unmatchedSources.push(source);
          continue;
        }
        const type = getPuffFusionType(source.type, compatibleDestination.type);
        if (type) {
          compatiblePlants.push({ source, destination: compatibleDestination, type });
          unusedDestinations.delete(compatibleDestination.id);
        }
      }
      if (compatiblePlants.length === 0) {
        setMovingPlantId(null);
        return;
      }
      const consumedIds = new Set([
        ...compatiblePlants.map(({ source }) => source.id),
        ...compatiblePlants.map(({ destination }) => destination.id),
      ]);
      const fusedPlants = compatiblePlants.map(({ type }) => getPlantInstance(type, row, col, now));
      const movedUnmatched = unmatchedSources.map((plant) => ({ ...plant, row, col, lastContactAt: now }));
      setPlantsState(plantsRef.current.filter((plant) => !consumedIds.has(plant.id)).concat(fusedPlants, movedUnmatched));
    } else if (destinationPlant && sourcePlants.length > 1) {
      const compatibleTypes = sourcePlants.map((plant) => getPuffFusionType(plant.type, destinationPlant.type));
      if (compatibleTypes.every((type) => type === null)) {
        setMovingPlantId(null);
        return;
      }
      const consumedIds = new Set([
        ...sourcePlants.filter((_, index) => compatibleTypes[index] !== null).map((plant) => plant.id),
        destinationPlant.id,
      ]);
      const fusedPlants = compatibleTypes
        .filter((type): type is PlantTypeKey => type !== null)
        .map((type) => getPlantInstance(type, row, col, now));
      const movedUnmatched = sourcePlants
        .filter((_, index) => compatibleTypes[index] === null)
        .map((plant) => ({ ...plant, row, col, lastContactAt: now }));
      setPlantsState(plantsRef.current.filter((plant) => !consumedIds.has(plant.id)).concat(fusedPlants, movedUnmatched));
    } else if (destinationPlant) {
      const fusionType = getFusionType(movingPlant.type, destinationPlant.type);
      if (!fusionType) {
        setMovingPlantId(null);
        return;
      }
      const fusedPlant = getPlantInstance(fusionType, row, col, now);
      setPlantsState(plantsRef.current.filter((plant) => plant.id !== movingPlantId && plant.id !== destinationPlant.id).concat(fusedPlant));
    } else {
      const movingIds = new Set(sourcePlants.map((plant) => plant.id));
      setPlantsState(plantsRef.current.map((plant) => movingIds.has(plant.id) ? { ...plant, row, col, lastContactAt: now } : plant));
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

  const animatePickup = (image: string, kind: PickupAnimation["kind"], source: HTMLElement, target: HTMLElement | null) => {
    if (!target) return;
    const sourceBounds = source.getBoundingClientRect();
    const targetBounds = target.getBoundingClientRect();
    const pickupId = createId();
    setPickupAnimations((current) => [...current, {
      id: pickupId,
      image,
      kind,
      startX: sourceBounds.left + sourceBounds.width / 2,
      startY: sourceBounds.top + sourceBounds.height / 2,
      deltaX: targetBounds.left + targetBounds.width / 2 - sourceBounds.left - sourceBounds.width / 2,
      deltaY: targetBounds.top + targetBounds.height / 2 - sourceBounds.top - sourceBounds.height / 2,
    }]);
    window.setTimeout(() => {
      setPickupAnimations((current) => current.filter((pickup) => pickup.id !== pickupId));
    }, 700);
  };

  const collectSun = (sunId: string, source: HTMLElement) => {
    if (phase !== "playing") return;
    const collectedSun = sunsRef.current.find((item) => item.id === sunId);
    if (!collectedSun) return;
    setSunsState(sunsRef.current.filter((item) => item.id !== sunId));
    setSunState(sunRef.current + collectedSun.value);
    challengeRunRef.current.sunProduced += collectedSun.value;
    refreshChallengeProgress(gameTime);
    animatePickup("/other/sun.webp", "sun", source, sunCounterRef.current);
  };

  const collectCoin = (coinId: string, source: HTMLElement) => {
    if (phase !== "playing" && phase !== "complete") return;
    const collectedCoin = coinsRef.current.find((coin) => coin.id === coinId);
    if (!collectedCoin) return;
    setCoinsState(coinsRef.current.filter((coin) => coin.id !== coinId));
    animatePickup(collectedCoin.image, "coin", source, coinBalanceRef.current);
    const nextData = {
      ...playerDataRef.current,
      money: playerDataRef.current.money + collectedCoin.value,
    };
    playerDataRef.current = nextData;
    setPlayerData(nextData);
  };

  const spawnZombie = (isWave: boolean, type: string = "basic", row?: number, col?: number, hypnotized = false) => {
    const now = gameTime;
    const spec = ZOMBIE_SPECS[type] || ZOMBIE_SPECS.basic;
    const gridCols = getGridCols(currentLevelRef.current);
    const gridRows = getGridRows(currentLevelRef.current);
    const newZombie: ZombieInstance = {
      id: createId(),
      row: row ?? Math.floor(random() * gridRows),
      col: col ?? gridCols - 1,
      x: col === undefined ? gridCols + ZOMBIE_SPAWN_OFFSET : col + 0.5,
      hp: spec.hp,
      armor: spec.armor,
      lastMoveAt: now,
      lastAttackAt: now,
      isWave,
      spawnedAt: now,
      type,
      hypnotized,
      contactStartedAt: undefined,
      nextShotAt: type === "peashooterZombie" ? now + PEASHOOTER_SHOOT_MS : undefined,
    };
    return newZombie;
  };

  useEffect(() => {
    if (phase !== "playing" || gameOver || isPaused || introTextIndex !== null || challengeBriefingOpen || readyCountdownIndex !== null) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setGameTime((time) => time + GAME_TICK_MS);
    }, GAME_TICK_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [phase, gameOver, isPaused, introTextIndex, challengeBriefingOpen, readyCountdownIndex]);

  useEffect(() => {
    if (phase !== "playing" || isPaused || introTextIndex === null || currentLevel === null) return;

    const timeout = window.setTimeout(() => {
      if (!currentLevel.introTexts || introTextIndex + 1 >= currentLevel.introTexts.length) {
        setIntroTextIndex(null);
        if (currentLevel.challenges?.length) {
          setChallengeBriefingOpen(true);
          setReadyCountdownIndex(null);
        } else {
          setReadyCountdownIndex(0);
        }
      } else {
        setIntroTextIndex(introTextIndex + 1);
      }
    }, INTRO_TEXT_DURATION_MS);

    return () => window.clearTimeout(timeout);
  }, [phase, isPaused, introTextIndex, currentLevel]);

  useEffect(() => {
    if (phase !== "playing" || isPaused || readyCountdownIndex === null) return;

    const timeout = window.setTimeout(() => {
      if (readyCountdownIndex >= 2) {
        const startedAt = currentTime();
        if (currentLevelRef.current) {
          spawnScheduleRef.current.nextRegularSpawn = startedAt + currentLevelRef.current.initialDelayMs;
          nextSkySunAtRef.current = currentLevelRef.current.skySunIntervalMs
            ? startedAt + currentLevelRef.current.skySunIntervalMs
            : 0;
        }
        setGameTime(startedAt);
        setReadyCountdownIndex(null);
      } else {
        setReadyCountdownIndex(readyCountdownIndex + 1);
      }
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [phase, isPaused, readyCountdownIndex]);

  useEffect(() => {
    const handleDebugKey = (event: KeyboardEvent) => {
      if (event.repeat) return;
      const target = event.target;
      if (target instanceof HTMLElement && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;

      if (event.key.toLowerCase() === "h" && !event.repeat) {
        setShowDebugHealth((visible) => !visible);
      }
      if (phase !== "playing") return;
      if (event.key === "Escape") {
        setShowSettings(false);
        setIsPaused((paused) => !paused);
      } else if (event.key === "1") {
        setShovelSelected(!shovelSelected);
        setGloveSelected(false);
        setMovingPlantId(null);
        setToolCursorPosition(null);
      } else if (event.key === "2" && playerData.gloveUnlocked && gameTime >= gloveReadyAt) {
        setGloveSelected(!gloveSelected);
        setShovelSelected(false);
        setMovingPlantId(null);
        setToolCursorPosition(null);
      }
    };

    window.addEventListener("keydown", handleDebugKey);
    return () => window.removeEventListener("keydown", handleDebugKey);
  }, [phase, shovelSelected, gloveSelected, playerData.gloveUnlocked, gloveReadyAt, gameTime]);

  useEffect(() => {
    if (phase !== "playing" || currentLevel === null || isPaused || introTextIndex !== null || challengeBriefingOpen || readyCountdownIndex !== null) return;

    const now = gameTime;
    const gridCols = getGridCols(currentLevel);
    const gridRows = getGridRows(currentLevel);
    let nextPlants = plantsRef.current.slice();
    let nextZombies = zombiesRef.current.slice();
    let nextProjectiles = projectilesRef.current.slice();
    let nextZombieProjectiles = zombieProjectilesRef.current.slice();
    const nextExplosionEffects = explosionEffectsRef.current.filter((effect) => effect.expiresAt > now);
    const recordPlantLosses = () => {
      const deadPlants = nextPlants.filter((plant) => plant.hp <= 0);
      if (deadPlants.length === 0) return;
      challengeRunRef.current.plantsLost += deadPlants.length;
      const lossLimit = currentLevel.challenges
        ?.find((challenge): challenge is Extract<LevelChallenge, { type: "maxPlantsLost" }> => challenge.type === "maxPlantsLost");
      if (lossLimit && challengeRunRef.current.plantsLost > lossLimit.amount) {
        failChallenge(describeChallenge(lossLimit));
      }
    };
    const nextSuns = sunsRef.current
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
    const nextCoins = coinsRef.current.filter((coin) => coin.expiresAt > now);

    const spawnState = spawnScheduleRef.current;
    const difficultySettings = DIFFICULTY_SETTINGS[playerData.difficulty];
    const regularInterval = currentLevel.regularSpawnIntervalMs;
    const waveInterval = currentLevel.waveSpawnIntervalMs;
    const betweenDelay = currentLevel.betweenWaveDelayMs;

    if (currentLevel.skySunIntervalMs && now >= nextSkySunAtRef.current) {
      const plantableTiles = currentLevel.tiles.flatMap((tiles, row) =>
        tiles.map((tile, col) => ({ row, col })).filter(({ row, col }) => getTileDefinition(currentLevel.tiles[row][col]).canPlant),
      );
      const target = plantableTiles[Math.floor(random() * plantableTiles.length)];
      if (target) {
        const targetY = target.row + 0.25 + random() * 0.5;
        const startY = -0.5;
        const targetX = target.col + 0.25 + random() * 0.5;
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
    const previousWaveHealth = regularBatchHealthRef.current;
    const previousWaveRemainingHealth = previousWaveHealth
      ? nextZombies
        .filter((zombie) => !zombie.hypnotized && previousWaveHealth.zombieIds.has(zombie.id))
        .reduce((total, zombie) => total + zombie.hp + (previousWaveHealth.isBoss ? zombie.armor : 0), 0)
      : 0;
    const previousWaveHealthThreshold = previousWaveHealth?.isBoss ? 0.25 : 0.5;
    const previousWaveHealthThresholdReached = Boolean(previousWaveHealth
      && previousWaveRemainingHealth <= previousWaveHealth.initialHealth * previousWaveHealthThreshold);

    const canStartRegularWave = Boolean(nextWave && !nextWave.isBoss && (
      previousWaveHealth?.isBoss
        ? now >= spawnState.nextRegularSpawn && previousWaveHealthThresholdReached
        : now >= spawnState.nextRegularSpawn || previousWaveHealthThresholdReached
    ));
    const lawnCleared = !nextZombies.some((zombie) => !zombie.hypnotized && zombie.hp > 0);
    let canStartBossWave = Boolean(nextWave?.isBoss && lawnCleared);
    if (canStartBossWave && nextWave?.isBoss) {
      if (bossWarningBatchRef.current !== spawnState.batchIndex) {
        bossWarningBatchRef.current = spawnState.batchIndex;
        bossWarningUntilRef.current = now + 3000;
        setShowBossWaveWarning(true);
      }
      if (now < bossWarningUntilRef.current) {
        canStartBossWave = false;
      } else {
        setShowBossWaveWarning(false);
      }
    }
    if (!waveActiveRef.current && nextWave && (canStartRegularWave || canStartBossWave)) {
      setShowBossWaveWarning(false);
      waveActiveRef.current = true;
      setWaveActive(true);
      spawnState.nextWaveSpawn = now;
      spawnState.nextWaveNumber = 0;
      regularBatchHealthRef.current = { zombieIds: new Set<string>(), initialHealth: 0, isBoss: nextWave.isBoss };
      if (nextWave.isBoss) {
        for (const grave of statuesRef.current.filter((item) => item.type === "grave")) {
          const roll = random();
          const type = roll < 0.6 ? "basic" : roll < 0.9 ? "cone" : "bucket";
          nextZombies.push(spawnZombie(true, type, grave.row, grave.col));
        }
      }
    }

    if (waveActiveRef.current && nextWave && now >= spawnState.nextWaveSpawn) {
      const zombieSpawn = nextWave.zombies[spawnState.nextWaveNumber];
      const newZ = spawnZombie(nextWave.isBoss, zombieSpawn?.type || "basic");
      nextZombies.push(newZ);
      if (regularBatchHealthRef.current) {
        regularBatchHealthRef.current.zombieIds.add(newZ.id);
        regularBatchHealthRef.current.initialHealth += newZ.hp + (nextWave.isBoss ? newZ.armor : 0);
        if (!nextWave.isBoss) {
          regularSpawnedRef.current += 1;
          setRegularSpawned(regularSpawnedRef.current);
        }
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
          const baseWaveDelay = Math.max(regularInterval, betweenDelay);
          const nextWaveDelay = Math.max(
            0,
            baseWaveDelay * difficultySettings.interWaveDelayMultiplier + difficultySettings.interWaveDelayAdjustmentMs,
          );
          if (followingWave.isBoss) {
            spawnState.nextWaveStart = now + nextWaveDelay;
          } else {
            spawnState.nextRegularSpawn = now + nextWaveDelay;
          }
        }
      } else {
        spawnState.nextWaveSpawn = now + waveInterval;
      }
    }

    const explodingCherryBombs = nextPlants.filter(
      (plant) => (PLANT_SPECS[plant.type].triggerExplosion || plant.type === "cherryBomb" || plant.type === "sunBomb")
        && plant.cherryBombExplodesAt && now >= plant.cherryBombExplodesAt,
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
      const adjustedDamage = Math.max(0, Math.round(damage * difficultySettings.damageTakenMultiplier));
      const armorDamage = Math.min(zombie.armor, adjustedDamage);
      const armor = zombie.armor - armorDamage;
      return {
        ...zombie,
        armor,
        hp: Math.max(0, zombie.hp - (adjustedDamage - armorDamage)),
        armorBrokenAt: zombie.armor > 0 && armor === 0 ? now : zombie.armorBrokenAt,
      };
    };
    const markDamage = (zombie: ZombieInstance, damage: number, sunOnKill = 0) => {
      const damaged = zombie.hypnotized ? zombie : applyZombieDamage(zombie, damage, now);
      return damaged.hp <= 0 && zombie.hp > 0 && sunOnKill > 0
        ? { ...damaged, sunOnKill }
        : damaged;
    };
    const damageStatuesInArea = (centerRow: number, centerCol: number, radius: number, damage: number) => {
      const nextStatues = statuesRef.current
        .map((statue) => statue.hp !== undefined && Math.abs(statue.row - centerRow) <= radius && Math.abs(statue.col - centerCol) <= radius
          ? { ...statue, hp: statue.hp - damage }
          : statue)
        .filter((statue) => statue.hp === undefined || statue.hp > 0);
      statuesRef.current = nextStatues;
      setStatues(nextStatues);
    };
    const createCherryExplosionEffect = (row: number, col: number) => {
      const startedAt = now;
      nextExplosionEffects.push({
        id: createId(),
        row,
        col,
        startedAt,
        expiresAt: now + 1650,
        particles: Array.from({ length: 10 }, () => {
          const angle = random() * Math.PI * 2;
          const distance = 0.15 + random() * 0.25;
          const drift = 0.3 + random() * 0.35;
          return {
            id: createId(),
            offsetX: Math.cos(angle) * distance,
            offsetY: Math.sin(angle) * distance,
            driftX: Math.cos(angle) * drift,
            driftY: Math.sin(angle) * drift,
            delayMs: random() * 120,
            rotation: Math.round(random() * 720 - 360),
          };
        }),
      });
    };
    for (const cherryBomb of explodingCherryBombs) {
      const blastRadius = ["icebergLettuce", "iceShroom", "miniIceShroom"].includes(cherryBomb.type) ? 0 : 1;
      const blastDamage = cherryBomb.type === "cherryBomb" || cherryBomb.type === "sunBomb" || cherryBomb.type === "frozenCherry" ? 1000 : 0;
      if (cherryBomb.type === "cherryBomb" || cherryBomb.type === "sunBomb" || cherryBomb.type === "frozenCherry") {
        createCherryExplosionEffect(cherryBomb.row, cherryBomb.col + 0.5);
      }
      damageStatuesInArea(cherryBomb.row, cherryBomb.col, blastRadius, blastDamage);
      nextZombies = nextZombies.map((zombie) => {
        const inBlast = PLANT_SPECS[cherryBomb.type].freezeAllZombies
          || Math.abs(zombie.row - cherryBomb.row) <= blastRadius && Math.abs(Math.floor(zombie.x) - cherryBomb.col) <= blastRadius;
        const spec = PLANT_SPECS[cherryBomb.type];
        const frozen = inBlast && spec.freezeDurationMs
          ? { ...zombie, frozenUntil: Math.max(zombie.frozenUntil || 0, now + spec.freezeDurationMs) }
          : zombie;
        return inBlast ? markDamage(frozen, blastDamage, cherryBomb.type === "sunBomb" ? 25 : 0) : zombie;
      });
    }
    if (explodingCherryBombs.length > 0) {
      const explodedIds = new Set(explodingCherryBombs.map((plant) => plant.id));
      nextPlants = nextPlants.filter((plant) => !explodedIds.has(plant.id));
    }

    nextPlants = nextPlants.filter((plant) => {
      if (plant.type !== "graveBuster" || !plant.obstacleDestroyAt || now < plant.obstacleDestroyAt) return true;
      const obstacle = statuesRef.current.find((item) => item.row === plant.row && item.col === plant.col);
      if (obstacle) {
        const remaining = statuesRef.current.filter((item) => item.id !== obstacle.id);
        statuesRef.current = remaining;
        setStatues(remaining);
      }
      return false;
    });

    nextPlants = nextPlants.map((plant) => {
      const plantSpec = PLANT_SPECS[plant.type];
      if (plant.type === "empressShroom" && plant.nextSunAt && now >= plant.nextSunAt) {
        const roll = random();
        const zombieType = roll < 0.6 ? "basic" : roll < 0.9 ? "cone" : "bucket";
        const summoned = spawnZombie(false, zombieType, plant.row, plant.col);
        nextZombies.push({ ...summoned, hypnotized: true });
        return { ...plant, nextSunAt: plant.nextSunAt + (plantSpec.spawnedHypnotizedZombieMs || 30000) };
      }
      const touchingZombie = nextZombies.some((zombie) => !zombie.hypnotized
        && zombie.type !== "undyingWraith" && zombie.hp > 0 && isZombieTouchingPlant(zombie, plant));
      if (touchingZombie && plantSpec.triggerExplosion && !plant.cherryBombExplodesAt) {
        const fuseDuration = plant.type === "icebergLettuce" || plant.type === "iceShroom" || plant.type === "frozenCherry"
          ? ICEBERG_LETTUCE_FUSE_MS
          : plant.type === "miniIceShroom" ? 400 : CHERRY_BOMB_FUSE_MS;
        return { ...plant, cherryBombExplodesAt: now + fuseDuration };
      }
      if (plantSpec.generateMs && plant.nextSunAt && now >= plant.nextSunAt) {
        const startY = plant.row - 0.35;
        const startX = plant.col + 0.5;
        const targetX = plant.col + 0.1 + random() * 0.8;
        const targetY = plant.row + 0.25 + random() * 0.5;
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
          value: plant.type === "twinSunflower" ? 125
            : plant.type === "sunShroom" && now - plant.plantedAt >= (plantSpec.generationGrowthMs || 100000)
              ? plantSpec.generationGrowthAmount || 50
              : plantSpec.generateAmount || 50,
          expiresAt: now + SUN_LIFETIME_MS,
        });
        const interval = plant.type === "sunShroom"
          ? plantSpec.generateMs
          : plant.sunIntervalMs || plantSpec.generateMs || SUNFLOWER_GENERATION_MS;
        return {
          ...plant,
          nextSunAt: plant.nextSunAt + interval,
          nextSunValue: plant.nextSunValue,
        };
      }

      const canShoot = ["peaShooter", "peanut", "sunshooter", "repeater", "cherryBomber", "snowPeashooter", "chompShooter", "puffShroom", "peaShroom", "hypnoPea"].includes(plant.type)
        && !(plant.type === "chompShooter" && plant.sleepingUntil && now < plant.sleepingUntil);
      if (canShoot && plant.nextShotAt && now >= plant.nextShotAt) {
        const maxX = plantSpec.projectileRange === undefined ? gridCols : Math.min(gridCols, plant.col + plantSpec.projectileRange);
        const anyAhead = nextZombies.some(
          (z) => !z.hypnotized && z.row === plant.row && z.x > plant.col && z.x <= maxX && z.x >= 0 && z.hp > 0
        ) || statuesRef.current.some((statue) => statue.type !== "grave" && statue.row === plant.row && statue.col > plant.col && statue.col <= maxX);
        if (anyAhead) {
          const shots = Array.from({ length: plantSpec.shotsPerBurst || 1 }, (_, index): Projectile => ({
            id: createId(), row: plant.row, x: plant.col + 0.5, visualY: plant.row + PLANT_PROJECTILE_Y_OFFSET,
            damage: plantSpec.projectileDamage || plantSpec.damage || 20, pierces: plantSpec.pierces === true,
            image: plantSpec.projectileImage, blastDamage: plantSpec.projectileBlastDamage,
            blastRadius: plantSpec.projectileBlastRadius, launchAt: now + index * (plantSpec.shotDelayMs || 0),
            freezeDurationMs: plantSpec.freezeOnHit ? plantSpec.freezeDurationMs : undefined,
            maxX, hypnotizeChance: plantSpec.hypnotizeChance,
          }));
          nextProjectiles = [...nextProjectiles, ...shots];
        }
        const interval = plant.shootIntervalMs || ((plantSpec.shootMs || PEASHOOTER_SHOOT_MS) * (plantSpec.fireRateMultiplier || 1));
        return {
          ...plant,
          nextShotAt: plant.nextShotAt + interval,
        };
      }

      if (plantSpec.fumeAttack && plant.nextShotAt) {
        const range = plantSpec.fumeAttackRange || 5;
        const radius = plantSpec.fumeAttackRadius || 0;
        const attackInterval = plant.type === "gluttonShroom" && plant.hasEaten
          ? (plantSpec.shootMs || 2000) / 2
          : (plantSpec.shootMs || 2000) * (plantSpec.fireRateMultiplier || 1);
        const animationDuration = plantSpec.animationDurationMs || 500;
        const emitSporeTrail = () => {
          const particleCount = radius > 0 ? 8 : 4;
          for (let index = 0; index < particleCount; index += 1) {
            const direction = radius > 0 ? index * Math.PI / 4 : 0;
            const angle = direction + (random() - 0.5) * (radius > 0 ? 0.22 : 0.18);
            const speed = (radius > 0 ? 2.2 + random() * 0.6 : 9.5 + random()) * GAME_TICK_MS / 1000;
            nextProjectiles.push({
              id: createId(),
              row: plant.row,
              x: plant.col + 0.5,
              damage: 0,
              pierces: false,
              image: random() < 0.5 ? "/plants/spore.webp" : "/plants/spore2.webp",
              launchAt: now,
              speedXPerTick: Math.cos(angle) * speed,
              speedYPerTick: Math.sin(angle) * speed,
              visualY: plant.row + PLANT_PROJECTILE_Y_OFFSET,
              originX: plant.col + 0.5,
              originY: plant.row + PLANT_PROJECTILE_Y_OFFSET,
              maxDistance: range,
              expiresAt: now + animationDuration,
              visualOnly: true,
            });
          }
        };
        const targetColMin = plant.col - radius;
        const targetColMax = plant.col + range;
        const hitTargets = nextZombies.filter((zombie) => !zombie.hypnotized && zombie.hp > 0
          && Math.abs(zombie.row - plant.row) <= radius
          && Math.floor(zombie.x) >= targetColMin && Math.floor(zombie.x) <= targetColMax);

        if (plant.type === "gluttonShroom" && !plant.hasEaten) {
          const eatTarget = hitTargets
            .filter((zombie) => isZombieInChomperRange(zombie, plant)
              && (ZOMBIE_SPECS[zombie.type]?.hp || zombie.hp) <= (plantSpec.eatHpLimit || 200))
            .sort((first, second) => first.x - second.x)[0];
          if (eatTarget) {
            nextZombies = nextZombies.map((zombie) => zombie.id === eatTarget.id ? { ...zombie, hp: 0 } : zombie);
            return {
              ...plant,
              hasEaten: true,
              sleepingUntil: now + CHOMPER_SLEEP_MS,
              nextShotAt: now + CHOMPER_SLEEP_MS,
              fumeAnimatingUntil: undefined,
            };
          }
        }

        if (plant.fumeAnimatingUntil && now < plant.fumeAnimatingUntil) {
          if (hitTargets.length > 0) {
            emitSporeTrail();
            return plant;
          }
          return { ...plant, fumeAnimatingUntil: undefined };
        }
        if (now < (plant.sleepingUntil || 0)) return plant;
        if (now < plant.nextShotAt || hitTargets.length === 0) {
          return hitTargets.length === 0 && now >= plant.nextShotAt
            ? { ...plant, nextShotAt: now }
            : plant;
        }

        for (const target of hitTargets) {
          nextZombies = nextZombies.map((zombie) => {
            if (zombie.id !== target.id) return zombie;
            const fumeDamage = plant.type === "gluttonShroom" && plant.hasEaten
              ? (plantSpec.damage || 30) * 2
              : plantSpec.damage || 30;
            let damaged = applyZombieDamage(zombie, fumeDamage, now);
            if (plantSpec.fumeFreezeDurationMs) {
              damaged = { ...damaged, frozenUntil: Math.max(damaged.frozenUntil || 0, now + plantSpec.fumeFreezeDurationMs) };
            }
            if (damaged.hp > 0 && plantSpec.hypnotizeChance && random() < plantSpec.hypnotizeChance) {
              damaged = hypnotizeZombie(damaged, now, plantSpec);
            }
            return damaged;
          });
          if (plantSpec.fumeBlastDamage) {
            createCherryExplosionEffect(target.row, target.x);
            nextZombies = nextZombies.map((zombie) => !zombie.hypnotized
              && Math.abs(zombie.row - target.row) <= 1
              && Math.abs(Math.floor(zombie.x) - Math.floor(target.x)) <= 1
              ? applyZombieDamage(zombie, plantSpec.fumeBlastDamage || 0, now)
              : zombie);
          }
        }
        emitSporeTrail();
        return {
          ...plant,
          nextShotAt: now + attackInterval,
          fumeAnimatingUntil: now + animationDuration,
        };
      }

      if (plantSpec.jumpAttack && plant.jumpStartedAt && plant.jumpTargetX !== undefined) {
        const progress = Math.min(1, Math.max(0, (now - plant.jumpStartedAt) / 700));
        const startX = plant.col + 0.5;
        const endX = plant.jumpTargetX;
        const currentX = startX + (endX - startX) * progress;
        const hitIds = new Set(plant.jumpHitZombieIds || []);
        nextZombies = nextZombies.map((zombie) => {
          if (Math.abs(zombie.x - currentX) >= 0.5 || zombie.row !== plant.row || zombie.hypnotized || hitIds.has(zombie.id)) return zombie;
          hitIds.add(zombie.id);
          return applyZombieDamage(zombie, plantSpec.damage || 80, now);
        });
        if (progress >= 1) return {
          ...plant,
          col: Math.min(gridCols - 1, Math.floor(endX)),
          jumpStartedAt: undefined,
          jumpTargetX: undefined,
          jumpHitZombieIds: undefined,
          sleepingUntil: now + CHOMPER_SLEEP_MS,
        };
        return { ...plant, jumpHitZombieIds: [...hitIds] };
      }

      if (["chomper", "chompNut", "sunChomper", "chompShooter", "cherryChomper", "hypnoChomper", "iceChomper", "chomperMaw", "gluttonShroom"].includes(plant.type)) {
        if (plant.pendingShots && plant.pendingShots > 0 && plant.nextPendingShotAt && now >= plant.nextPendingShotAt) {
          const shot: Projectile = {
            id: createId(), row: plant.row, x: plant.col + 0.5, visualY: plant.row + PLANT_PROJECTILE_Y_OFFSET,
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
          .filter((zombie) => !zombie.hypnotized && zombie.hp > 0 && isZombieInChomperRange(zombie, plant))
          .sort((a, b) => a.x - b.x)[0];
        if (!target) return plant;

        const targetMaxHp = ZOMBIE_SPECS[target.type]?.hp || target.hp;
        if (plantSpec.eatOnce && plant.hasEaten) return plant;
        if (plantSpec.jumpAttack && !plant.sleepingUntil) {
          const triggeringIds = nextZombies
            .filter((zombie) => !zombie.hypnotized && zombie.hp > 0 && isZombieInChomperRange(zombie, plant))
            .map((zombie) => zombie.id);
          nextZombies = nextZombies.map((zombie) => triggeringIds.includes(zombie.id)
            ? { ...zombie, ignoredPlantIds: [...(zombie.ignoredPlantIds || []), plant.id] }
            : zombie);
          return { ...plant, jumpStartedAt: now, jumpTargetX: plant.col + 1, jumpHitZombieIds: [], sleepingUntil: now + 700 + CHOMPER_SLEEP_MS };
        }
        if (targetMaxHp <= (plantSpec.eatHpLimit || 200)) {
          nextZombies = nextZombies.map((zombie) => zombie.id === target.id
            ? plantSpec.hypnotizeOnEat ? hypnotizeZombie(zombie, now, plantSpec) : { ...zombie, hp: 0 }
            : zombie);
          if (plantSpec.attackFreezeDurationMs) {
            nextZombies = nextZombies.map((zombie) => ({ ...zombie, frozenUntil: Math.max(zombie.frozenUntil || 0, now + plantSpec.attackFreezeDurationMs!) }));
          }
          if (plantSpec.bonusSunOnEat) {
            nextSuns.push({ id: createId(), row: plant.row, x: plant.col + 0.5, y: plant.row + 0.25, value: plantSpec.bonusSunOnEat, expiresAt: now + SUN_LIFETIME_MS });
          }
          if (plantSpec.eatExplosionDamage) {
            createCherryExplosionEffect(plant.row, plant.col + 0.5);
            damageStatuesInArea(plant.row, plant.col, 1, plantSpec.eatExplosionDamage);
            nextZombies = nextZombies.map((zombie) => {
              const inBlast = Math.abs(zombie.row - plant.row) <= 1 && Math.abs(Math.floor(zombie.x) - plant.col) <= 1;
              return inBlast && !zombie.hypnotized ? applyZombieDamage(zombie, plantSpec.eatExplosionDamage || 200, now) : zombie;
            });
          }
          return {
            ...plant,
            hp: Math.min(plantSpec.hp, plant.hp + (plantSpec.regeneration || 0)),
            sleepingUntil: now + CHOMPER_SLEEP_MS,
            hasEaten: plantSpec.eatOnce ? true : plant.hasEaten,
            lastContactAt: now,
            nextShotAt: plant.type === "chompShooter" ? now + CHOMPER_SLEEP_MS : plant.nextShotAt,
            pendingShots: plantSpec.eatProjectileCount || plant.pendingShots,
            nextPendingShotAt: plantSpec.eatProjectileCount ? now + CHOMPER_SLEEP_MS : plant.nextPendingShotAt,
          };
        }

        if (now - (plant.lastContactAt || 0) >= CHOMPER_BITE_MS) {
          nextZombies = nextZombies.map((zombie) => {
            if (zombie.id !== target.id) return zombie;
            let damaged = applyZombieDamage(zombie, plantSpec.damage || 40, now);
            if (damaged.hp > 0 && plantSpec.hypnotizeChance && random() < plantSpec.hypnotizeChance) damaged = hypnotizeZombie(damaged, now, plantSpec);
            return damaged;
          });
          return { ...plant, lastContactAt: now };
        }
      }

      return plant;
    });

    recordPlantLosses();
    nextPlants = nextPlants.filter((plant) => plant.hp > 0);
    nextZombieProjectiles = nextZombieProjectiles.reduce<ZombieProjectile[]>((acc, projectile) => {
      const moved = { ...projectile, x: projectile.x + projectile.direction * PROJECTILE_SPEED_PER_TICK };
      if (projectile.hypnotized) {
        const hitZombie = nextZombies
          .filter((zombie) => !zombie.hypnotized && zombie.hp > 0 && zombie.row === moved.row
            && Math.abs(zombie.x - moved.x) <= ZOMBIE_HITBOX_HALF_WIDTH)
          .sort((first, second) => Math.abs(first.x - moved.x) - Math.abs(second.x - moved.x))[0];
        if (hitZombie) {
          nextZombies = nextZombies.map((zombie) => zombie.id === hitZombie.id
            ? applyZombieDamage(zombie, moved.damage, now)
            : zombie);
          return acc;
        }
      } else {
        const hitPlant = nextPlants
          .filter((plant) => plant.row === moved.row
            && Math.abs(moved.x - (plant.col + 0.5)) <= PLANT_HITBOX_HALF_WIDTH)
          .sort((first, second) => Math.abs(first.col + 0.5 - moved.x) - Math.abs(second.col + 0.5 - moved.x))[0];
        if (hitPlant) {
          nextPlants = nextPlants.map((plant) => plant.id === hitPlant.id
            ? { ...plant, hp: Math.max(0, plant.hp - moved.damage) }
            : plant);
          return acc;
        }
      }
      if (moved.x > -1 && moved.x < gridCols + 1) acc.push(moved);
      return acc;
    }, []);

    // Move projectiles forward but do not affect zombies (zombies don't interact with grid)
    nextProjectiles = nextProjectiles.reduce<Projectile[]>((acc, projectile) => {
      if (projectile.visualOnly) {
        const expiresAt = projectile.expiresAt || now;
        if (now >= expiresAt) return acc;
        const speedX = projectile.speedXPerTick ?? projectile.speedPerTick ?? PROJECTILE_SPEED_PER_TICK;
        const speedY = projectile.speedYPerTick ?? 0;
        const moved = { ...projectile, x: projectile.x + speedX, visualY: (projectile.visualY ?? projectile.row + 0.3) + speedY };
        const distance = Math.hypot(
          moved.x - (projectile.originX ?? projectile.x),
          (moved.visualY ?? moved.row) - (projectile.originY ?? projectile.visualY ?? projectile.row),
        );
        if (distance > (projectile.maxDistance ?? gridCols + 1) || moved.x > gridCols + 1 || moved.x < -1) return acc;
        acc.push(moved);
        return acc;
      }
      if (projectile.launchAt && now < projectile.launchAt) {
        acc.push(projectile);
        return acc;
      }
      const moved = { ...projectile, x: projectile.x + PROJECTILE_SPEED_PER_TICK };
      if (moved.maxX !== undefined && moved.x > moved.maxX) return acc;
      const blockingStatue = statuesRef.current
        .filter((statue) => statue.row === moved.row && statue.col + 0.8 >= projectile.x && statue.col - 0.3 <= moved.x)
        .sort((a, b) => a.col - b.col)[0];
      if (blockingStatue) {
        const blastDamage = moved.blastDamage || moved.damage;
        const blastRadius = moved.blastRadius || 0;
        damageStatuesInArea(blockingStatue.row, blockingStatue.col, blastRadius, blastDamage);
        if (moved.blastDamage && moved.blastRadius) {
          createCherryExplosionEffect(blockingStatue.row, blockingStatue.col + 0.5);
          nextZombies = nextZombies.map((zombie) => {
            const inBlast = Math.abs(zombie.row - blockingStatue.row) <= moved.blastRadius! && Math.abs(Math.floor(zombie.x) - blockingStatue.col) <= moved.blastRadius!;
            const damaged = inBlast && !zombie.hypnotized ? applyZombieDamage(zombie, moved.blastDamage!, now) : zombie;
            return inBlast && moved.freezeDurationMs ? { ...damaged, frozenUntil: Math.max(damaged.frozenUntil || 0, now + moved.freezeDurationMs) } : damaged;
          });
        }
        return acc;
      }
      // detect hit against nearest zombie in same row
      const hitZombies = nextZombies
        .filter((z) => !z.hypnotized && z.row === moved.row && z.hp > 0
          && z.x + ZOMBIE_HITBOX_HALF_WIDTH >= projectile.x
          && z.x - ZOMBIE_HITBOX_HALF_WIDTH <= moved.x
          && !projectile.hitZombieIds?.includes(z.id))
        .sort((a, b) => a.x - b.x);

      if (hitZombies.length > 0) {
        if (moved.blastDamage && moved.blastRadius) {
          const blastCenter = hitZombies[0];
          createCherryExplosionEffect(blastCenter.row, blastCenter.x);
          nextZombies = nextZombies.map((z) => {
            const inBlast = Math.abs(z.row - blastCenter.row) <= moved.blastRadius! && Math.abs(Math.floor(z.x) - Math.floor(blastCenter.x)) <= moved.blastRadius!;
            const damaged = inBlast && !z.hypnotized ? applyZombieDamage(z, moved.blastDamage!, now) : z;
            return inBlast && moved.freezeDurationMs ? { ...damaged, frozenUntil: Math.max(damaged.frozenUntil || 0, now + moved.freezeDurationMs) } : damaged;
          });
        } else {
          nextZombies = nextZombies.map((z) => {
            if (!hitZombies.some((hit) => hit.id === z.id)) return z;
            const damaged = z.hypnotized ? z : applyZombieDamage(z, moved.damage, now);
            let result = moved.freezeDurationMs ? { ...damaged, frozenUntil: Math.max(damaged.frozenUntil || 0, now + moved.freezeDurationMs) } : damaged;
            if (result.hp > 0 && moved.hypnotizeChance && random() < moved.hypnotizeChance) result = hypnotizeZombie(result, now, PLANT_SPECS.hypnoPea);
            return result;
          });
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
      const zombieSpec = ZOMBIE_SPECS[zombie.type] || ZOMBIE_SPECS.basic;
      if (zombie.poleVaultStartedAt !== undefined && zombie.poleVaultTargetX !== undefined && zombie.poleVaultingUntil) {
        const progress = Math.min(1, (now - zombie.poleVaultStartedAt) / 2000);
        if (progress >= 1) {
          return {
            ...zombie,
            x: zombie.poleVaultTargetX,
            poleVaultingUntil: undefined,
            poleVaultStartedAt: undefined,
            poleVaultStartX: undefined,
            poleVaultTargetX: undefined,
            contactStartedAt: undefined,
          };
        }
        const startX = zombie.poleVaultStartX ?? zombie.x;
        return {
          ...zombie,
          x: startX + (zombie.poleVaultTargetX - startX) * progress,
          contactStartedAt: undefined,
        };
      }
      if (zombie.type === "peashooterZombie" && zombie.nextShotAt && now >= zombie.nextShotAt) {
        nextZombieProjectiles.push({
          id: createId(),
          row: zombie.row,
          x: zombie.x,
          damage: Math.round(20 * difficultySettings.damageDealtMultiplier),
          direction: zombie.hypnotized ? 1 : -1,
          hypnotized: zombie.hypnotized,
        });
        const shotInterval = zombie.frozenUntil && zombie.frozenUntil > now ? PEASHOOTER_SHOOT_MS * 2 : PEASHOOTER_SHOOT_MS;
        zombie = { ...zombie, nextShotAt: zombie.nextShotAt + shotInterval };
      }
      const opposingZombie = nextZombies
        .filter((enemy) => enemy.id !== zombie.id && enemy.hp > 0 && Boolean(enemy.hypnotized) !== Boolean(zombie.hypnotized)
          && enemy.row === zombie.row && Math.abs(enemy.x - zombie.x) <= ZOMBIE_HITBOX_HALF_WIDTH * 2)
        .sort((first, second) => Math.abs(first.x - zombie.x) - Math.abs(second.x - zombie.x))[0];
      if (opposingZombie) {
        if (zombie.nextAttackTargetId !== opposingZombie.id) {
          return { ...zombie, nextAttackTargetId: opposingZombie.id, contactStartedAt: now };
        }
        return zombie;
      }
      const statue = statuesRef.current.find((item) => item.type !== "grave" && item.row === zombie.row && Math.floor(zombie.x) === item.col);
      if (statue && zombie.hp > 0) {
        const statueTargetId = `statue:${statue.id}`;
        if (zombie.nextAttackTargetId !== statueTargetId) {
          return { ...zombie, nextAttackTargetId: statueTargetId, contactStartedAt: now };
        }
        const attackInterval = zombie.frozenUntil && zombie.frozenUntil > now ? zombieSpec.attackMs * 2 : zombieSpec.attackMs;
        if (zombie.contactStartedAt === undefined) zombie = { ...zombie, contactStartedAt: now };
        else if (now - zombie.contactStartedAt >= attackInterval && now - zombie.lastAttackAt >= attackInterval) {
          const zombieDamage = Math.round(zombieSpec.damage * difficultySettings.damageDealtMultiplier);
          const nextStatues = statuesRef.current.map((item) => item.id === statue.id && item.hp !== undefined ? { ...item, hp: item.hp - zombieDamage } : item).filter((item) => item.hp === undefined || item.hp > 0);
          statuesRef.current = nextStatues;
          setStatues(nextStatues);
          zombie = { ...zombie, lastAttackAt: now };
        }
        return zombie;
      }
      const plantIndex = zombie.hypnotized || zombie.type === "undyingWraith"
        ? -1
        : nextPlants.findIndex((plant) => isZombieTouchingPlant(zombie, plant)
          && !zombie.ignoredPlantIds?.includes(plant.id));
      if (plantIndex >= 0 && zombie.hp > 0) {
        if (zombie.type === "poleVaulting" && !zombie.poleVaulted) {
          const plant = nextPlants[plantIndex];
          if (!PLANT_SPECS[plant.type].blocksPoleVault) {
            return {
              ...zombie,
              x: zombie.x,
              poleVaulted: true,
              poleVaultingUntil: now + 2000,
              poleVaultStartedAt: now,
              poleVaultStartX: zombie.x,
              poleVaultTargetX: plant.col - 0.2,
              contactStartedAt: undefined,
              nextAttackTargetId: undefined,
            };
          }
        }
        const plantTargetId = `plant:${nextPlants[plantIndex].id}`;
        if (zombie.nextAttackTargetId !== plantTargetId) {
          return { ...zombie, nextAttackTargetId: plantTargetId, contactStartedAt: now };
        }
        // Establish contact first, then wait one attack interval before biting.
        const attackInterval = zombie.frozenUntil && zombie.frozenUntil > now ? zombieSpec.attackMs * 2 : zombieSpec.attackMs;
        if (zombie.contactStartedAt === undefined) {
          zombie = { ...zombie, contactStartedAt: now };
        } else if (now - zombie.contactStartedAt >= attackInterval && now - zombie.lastAttackAt >= attackInterval) {
          const plant = nextPlants[plantIndex];
          const zombieDamage = Math.round(zombieSpec.damage * difficultySettings.damageDealtMultiplier);
          const nextHp = Math.max(0, plant.hp - zombieDamage);
          const plantSpec = PLANT_SPECS[plant.type];
          const hypnotizeChance = plantSpec.hypnotizeChance;
          const stageChanged = plant.type === "explodeONut" && getNutDamageStage(plant.hp) !== getNutDamageStage(nextHp);
          nextPlants[plantIndex] = { ...plant, hp: nextHp };
          const convertsOnBite = plantSpec.hypnotizeOnBite
            || (hypnotizeChance !== undefined && random() < hypnotizeChance);
          if (convertsOnBite && nextHp > 0) {
            zombie = hypnotizeZombie(zombie, now, plantSpec);
            if (!plantSpec.hypnotizeOnBite) zombie.ignoredPlantIds = [...(zombie.ignoredPlantIds || []), plant.id];
            nextPlants[plantIndex] = { ...plant, hp: plantSpec.hypnotizeOnBite ? 0 : nextHp };
          }
          if (plantSpec.hypnotizeFreezes && zombie.hypnotized) zombie.frozenUntil = now + 5000;
          if (plantSpec.freezeOnContact) zombie = { ...zombie, frozenUntil: Math.max(zombie.frozenUntil || 0, now + (plantSpec.freezeDurationMs || 5000)) };
          if (stageChanged) {
            createCherryExplosionEffect(plant.row, plant.col + 0.5);
            nextZombies = nextZombies.map((target) => {
              const inBlast = Math.abs(target.row - plant.row) <= 1 && Math.abs(Math.floor(target.x) - plant.col) <= 1;
              return inBlast && !target.hypnotized ? applyZombieDamage(target, 1000, now) : target;
            });
          }
          zombie = { ...zombie, lastAttackAt: now };
        }

        // plant deals contact damage (e.g., pea shooter)
        const plant = nextPlants[plantIndex];
        const spec = PLANT_SPECS[plant.type];
        const contactInterval = spec.shootMs || PEASHOOTER_SHOOT_MS;
        if (!zombie.hypnotized && !PLANT_SPECS[plant.type].triggerExplosion && plant.type !== "cherryBomb" && plant.type !== "sunBomb" && !["chomper", "chompNut", "sunChomper", "chompShooter", "cherryChomper", "hypnoChomper", "iceChomper", "chomperMaw"].includes(plant.type) && spec.damage && now - (plant.lastContactAt || 0) >= contactInterval) {
          zombie = applyZombieDamage(zombie, spec.damage, now);
          nextPlants[plantIndex] = { ...plant, lastContactAt: now };
        }

        return zombie;
      }

      zombie = { ...zombie, contactStartedAt: undefined, nextAttackTargetId: undefined };
      // Move continuously towards left with marching gait (sine wave speed variation)
      // Each zombie type has its own speed from spec
      const statMultiplier = zombie.hypnotizedStatMultiplier || 1;
      const moveInterval = (zombie.frozenUntil && zombie.frozenUntil > now ? zombieSpec.moveMs * 2 : zombieSpec.moveMs)
        * difficultySettings.moveDurationMultiplier / statMultiplier;
      const speedPerTick = GAME_TICK_MS / moveInterval; // tiles per tick
      const elapsedMs = now - zombie.spawnedAt;
      const phase = (elapsedMs / walkPeriodMs) * Math.PI * 2;
      const speedMultiplier = 1 + 0.9 * Math.sin(phase); // varies from 0.65 to 1.35
      const newX = zombie.x + (zombie.hypnotized ? 1 : -1) * speedPerTick * speedMultiplier;
      return { ...zombie, x: newX, contactStartedAt: undefined };
    });

    for (let index = 0; index < nextZombies.length; index += 1) {
      const attacker = nextZombies[index];
      if (attacker.hp <= 0 || !attacker.nextAttackTargetId || attacker.nextAttackTargetId.startsWith("statue:")
        || attacker.nextAttackTargetId.startsWith("plant:")) continue;
      const target = nextZombies.find((zombie) => zombie.id === attacker.nextAttackTargetId
        && zombie.hp > 0 && Boolean(zombie.hypnotized) !== Boolean(attacker.hypnotized)
        && zombie.row === attacker.row && Math.abs(zombie.x - attacker.x) <= ZOMBIE_HITBOX_HALF_WIDTH * 2);
      if (!target) {
        nextZombies[index] = { ...attacker, nextAttackTargetId: undefined, contactStartedAt: undefined };
        continue;
      }
      const zombieSpec = ZOMBIE_SPECS[attacker.type] || ZOMBIE_SPECS.basic;
      const statMultiplier = attacker.hypnotizedStatMultiplier || 1;
      const attackInterval = (attacker.frozenUntil && attacker.frozenUntil > now ? zombieSpec.attackMs * 2 : zombieSpec.attackMs)
        / statMultiplier;
      if (attacker.contactStartedAt === undefined
        || now - attacker.contactStartedAt < attackInterval
        || now - attacker.lastAttackAt < attackInterval) continue;
      const damage = Math.round(zombieSpec.damage * statMultiplier * difficultySettings.damageDealtMultiplier);
      nextZombies = nextZombies.map((zombie) => zombie.id === target.id
        ? {
          ...applyZombieDamage(zombie, damage, now),
          frozenUntil: attacker.freezingAttacks ? now + 5000 : zombie.frozenUntil,
        }
        : zombie);
      nextZombies[index] = { ...attacker, lastAttackAt: now, contactStartedAt: now };
    }

    let lastDefeatedZombie: ZombieInstance | null = null;
    const deathExplosions = nextZombies.filter((zombie) =>
      zombie.hp <= 0 && zombie.hypnoDeathExplosion && !defeatedZombieIdsRef.current.has(zombie.id));
    for (const explodedZombie of deathExplosions) {
      nextZombies = nextZombies.map((target) => {
        const inBlast = target.id !== explodedZombie.id && !target.hypnotized
          && Math.abs(target.row - explodedZombie.row) <= 1
          && Math.abs(Math.floor(target.x) - Math.floor(explodedZombie.x)) <= 1;
        return inBlast ? applyZombieDamage(target, 1000, now) : target;
      });
    }

    nextZombies.forEach((zombie) => {
      if (zombie.hp > 0 || defeatedZombieIdsRef.current.has(zombie.id)) return;
      defeatedZombieIdsRef.current.add(zombie.id);
      if (zombie.hypnotized) return;
      lastDefeatedZombie = zombie;
      const zombieKills = {
        ...playerDataRef.current.zombieKills,
        [zombie.type]: (playerDataRef.current.zombieKills[zombie.type] || 0) + 1,
      };
      const nextPlayerData = { ...playerDataRef.current, zombieKills };
      playerDataRef.current = nextPlayerData;
      setPlayerData(nextPlayerData);
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
      challengeRunRef.current.zombieKillTimes.push(now);
      const dropChance = ZOMBIE_SPECS[zombie.type]?.coinDropChance || 0;
      if (random() >= dropChance) return;
      const isGold = random() < 0.2;
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

    const timedKillChallenges = currentLevel.challenges
      ?.map((challenge, index) => ({ challenge, index }))
      .filter((entry): entry is { challenge: Extract<LevelChallenge, { type: "killZombiesWithin" }>; index: number } =>
        entry.challenge.type === "killZombiesWithin") || [];
    for (const { challenge, index } of timedKillChallenges) {
      const recentKillCount = challengeRunRef.current.zombieKillTimes
        .filter((killTime) => now - killTime <= challenge.seconds * 1000).length;
      if (recentKillCount >= challenge.count) {
        challengeRunRef.current.completedTimedKillChallenges.add(index);
      }
    }
    const longestKillWindowMs = Math.max(0, ...timedKillChallenges.map(({ challenge }) => challenge.seconds * 1000));
    challengeRunRef.current.zombieKillTimes = challengeRunRef.current.zombieKillTimes
      .filter((killTime) => now - killTime <= longestKillWindowMs);
    refreshChallengeProgress(now);

    recordPlantLosses();
    nextPlants = nextPlants.filter((plant) => plant.hp > 0);
    // Check for game over: any zombie that crosses the left trigger X
    const anyReachedEnd = nextZombies.some((z) => !z.hypnotized && z.x <= ZOMBIE_LEFT_TRIGGER_X);
    if (anyReachedEnd) {
      setGameOver(true);
      gameOverRef.current = true;
      // stop updating zombies and plants further for this tick
      setZombiesState(nextZombies.filter((z) => z.hp > 0));
      setPlantsState(nextPlants);
      setProjectilesState(nextProjectiles);
      zombieProjectilesRef.current = nextZombieProjectiles;
      setZombieProjectiles(nextZombieProjectiles);
      setSunsState(nextSuns);
      setCoinsState(nextCoins);
      explosionEffectsRef.current = nextExplosionEffects;
      setExplosionEffects(nextExplosionEffects);
      return;
    }

    nextZombies = nextZombies.filter((zombie) => zombie.hp > 0 && (!zombie.hypnotized || zombie.x < gridCols + 1));

    setPlantsState(nextPlants);
    setZombiesState(nextZombies);
    setProjectilesState(nextProjectiles);
    zombieProjectilesRef.current = nextZombieProjectiles;
    setZombieProjectiles(nextZombieProjectiles);
    setSunsState(nextSuns);
    setCoinsState(nextCoins);
    explosionEffectsRef.current = nextExplosionEffects;
    setExplosionEffects(nextExplosionEffects);

    if (
      !gameOverRef.current &&
      compiledLevelRef.current &&
      spawnedZombieCountRef.current === compiledLevelRef.current.totalZombieCount &&
      !nextZombies.some((zombie) => !zombie.hypnotized && zombie.hp > 0) &&
      !waveActiveRef.current
    ) {
      const failedChallenge = currentLevel.challenges?.find((challenge, index) =>
        (challenge.type === "produceSun" && challengeRunRef.current.sunProduced < challenge.amount)
        || (challenge.type === "usePlant" && !challenge.plants.some((plant) => challengeRunRef.current.usedPlants.has(plant)))
        || (challenge.type === "killZombiesWithin" && !challengeRunRef.current.completedTimedKillChallenges.has(index)));
      if (failedChallenge) {
        failChallenge(describeChallenge(failedChallenge));
        return;
      }
      finishLevel(lastDefeatedZombie);
    }
  }, [gameTime, phase, currentLevel, isPaused, introTextIndex, challengeBriefingOpen, readyCountdownIndex, playerData.difficulty]);

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
  const movingPlant = movingPlantId ? plants.find((plant) => plant.id === movingPlantId) || null : null;
  const gloveFusionSources = movingPlant
    ? PLANT_SPECS[movingPlant.type].puffStack
      ? plants.filter((plant) => plant.row === movingPlant.row && plant.col === movingPlant.col && PLANT_SPECS[plant.type].puffStack)
      : [movingPlant]
    : [];
  const getCategoryTrophy = (category: LevelCategory): Difficulty | undefined => {
    const categoryLevels = LEVELS.filter((level) => level.category === category);
    if (categoryLevels.length === 0 || categoryLevels.some((level) => !playerData.completedLevels.includes(level.id))) return undefined;
    const trophies = categoryLevels.map((level) => playerData.levelTrophies[level.id]);
    if (trophies.some((difficulty) => !difficulty)) return undefined;
    return trophies.filter(isDifficulty).reduce<Difficulty>((lowest, difficulty) =>
      DIFFICULTY_RANK[difficulty] < DIFFICULTY_RANK[lowest] ? difficulty : lowest, "impossible");
  };
  const selectedDifficultyIndex = DIFFICULTIES.findIndex(({ key }) => key === playerData.difficulty);
  const selectedDifficulty = DIFFICULTIES[selectedDifficultyIndex];
  const requiredLoadoutPlants = currentLevel?.challenges
    ?.filter((challenge): challenge is Extract<LevelChallenge, { type: "usePlant" }> => challenge.type === "usePlant")
    .flatMap((challenge) => challenge.plants) || [];
  const requiredLoadoutPlantSets = currentLevel?.challenges
    ?.filter((challenge): challenge is Extract<LevelChallenge, { type: "usePlant" }> => challenge.type === "usePlant")
    .map((challenge) => challenge.plants) || [];

  const zombiesSent = spawnedZombieCount;
  let zombiesBeforeWave = 0;
  const waveProgressSegments = compiledCurrentLevel?.spawnWaves.map((wave) => {
    const waveZombieCount = wave.zombies.length;
    const spawnedInWave = Math.min(waveZombieCount, Math.max(0, zombiesSent - zombiesBeforeWave));
    zombiesBeforeWave += waveZombieCount;
    return {
      isBoss: wave.isBoss,
      progress: waveZombieCount ? (spawnedInWave / waveZombieCount) * 100 : 100,
    };
  }) || [];
  const completedWaveCount = waveProgressSegments.filter((segment) => segment.progress >= 100).length;
  const nextWaveProgressIndex = waveProgressSegments.findIndex((segment) => segment.progress < 100);
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
    const nextWave = nextWaveProgressIndex >= 0 ? compiledCurrentLevel?.spawnWaves[nextWaveProgressIndex] : null;
    if (!nextWave) return "All waves have spawned. Clear the remaining zombies.";
    if (waveActive && nextWave.isBoss) return "Boss wave in progress.";
    if (nextWave.isBoss) return "Boss wave approaching. Clear the lawn.";
    return waveActive ? "Regular zombies are marching." : "Preparing the next wave.";
  })();
  const zombieTypes = compiledCurrentLevel
    ? Array.from(
      new Set([
        ...compiledCurrentLevel.waveSpawns.flat().map((zombie) => zombie.type),
        ...compiledCurrentLevel.bossWaveSequences.flat().map((zombie) => zombie.type),
      ]),
    )
    : [];
  const levelBackgroundStyle = currentLevel && phase !== "menu" && currentLevel.backgroundImage
    ? {
      backgroundImage: `linear-gradient(rgb(5 12 8 / 48%), rgb(5 12 8 / 48%)), url("${currentLevel.backgroundImage}")`,
      backgroundPosition: "center",
      backgroundSize: "cover",
      backgroundAttachment: "fixed" as const,
    }
    : undefined;

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 px-4 py-8 sm:px-8 ${phase === "credits" ? "credits-mode" : ""}`} style={levelBackgroundStyle}>
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
              <button type="button" onClick={() => openAlmanac("menu")} className="menu-secondary">Open Almanac <span className="almanac-menu-icon"><img src="/other/almanac.webp" alt="" /></span></button>
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
                const categoryTrophy = getCategoryTrophy(category.key);
                return (
                  <button key={category.key} type="button" onClick={() => { setSelectedLevelCategory(category.key); setPhase("level-select"); }} className={`category-card ${isCompleted ? "completed" : ""}`}>
                    {isCompleted && <span className="level-completed-ribbon">Completed</span>}
                    <span className="category-card-number">{categoryLevels.length || "-"}</span>
                    <span className="category-card-content"><strong>{category.name}</strong><small>{category.description}</small><em>{categoryLevels.length ? `${categoryLevels.length} level${categoryLevels.length === 1 ? "" : "s"}` : "Coming soon"}</em></span>
                    <span className="category-card-trailing">
                      {categoryTrophy && <img className="difficulty-trophy category-difficulty-trophy" src={TROPHY_IMAGES[categoryTrophy]} alt={`${categoryTrophy} category trophy`} />}
                      <span className="category-card-arrow">→</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {phase === "level-select" && (
          <div className="level-select-screen">
            <div className="screen-heading"><div><p className="menu-kicker">{LEVEL_CATEGORIES.find((category) => category.key === selectedLevelCategory)?.name} category</p><h2>Select a Level</h2><p>Each lawn brings a different layout and wave pattern.</p></div><button type="button" onClick={() => setPhase("category-select")} className="text-button">Back</button></div>
            <section className={`difficulty-selector difficulty-${playerData.difficulty}`} aria-labelledby="difficulty-title" style={{ "--difficulty-color": selectedDifficulty.color } as CSSProperties}>
              <div className="difficulty-selector-heading">
                <div><h3 id="difficulty-title">Difficulty</h3><p>Changes apply to your next level.</p></div>
                <output className={`difficulty-current difficulty-current-${playerData.difficulty}`} htmlFor="difficulty-slider">{selectedDifficulty.label}</output>
              </div>
              <input
                id="difficulty-slider"
                type="range"
                min="0"
                max={DIFFICULTIES.length - 1}
                step="1"
                value={selectedDifficultyIndex}
                aria-label="Difficulty"
                aria-valuetext={selectedDifficulty.label}
                onChange={(event) => selectDifficulty(DIFFICULTIES[Number(event.currentTarget.value)].key)}
              />
              <div className="difficulty-ticks" aria-hidden="true">
                {DIFFICULTIES.map((difficulty) => <span key={difficulty.key} className={`difficulty-tick difficulty-tick-${difficulty.key} ${difficulty.key === playerData.difficulty ? "selected" : ""}`}>{difficulty.label}</span>)}
              </div>
            </section>
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
                      {getTrophyImage(playerData.levelTrophies[level.id]) && <img className="difficulty-trophy level-difficulty-trophy" src={getTrophyImage(playerData.levelTrophies[level.id])!} alt={`${playerData.levelTrophies[level.id]} difficulty trophy`} />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {phase === "shop" && (
          <div className="level-select-screen">
            <div className="screen-heading"><div><p className="menu-kicker">Improve your defense</p><h2>Shop</h2><p>Start with five base plant slots, then spend rewards to expand your seed bank.</p></div><button type="button" onClick={() => setPhase("menu")} className="text-button">Back to menu</button></div>
            <div className="level-card max-w-xl">
              <div className="level-card-number">+</div>
              <div className="level-card-content">
                <div>
                  <h2 className="text-2xl font-semibold text-white">Expand your seed bank</h2>
                  <p>Start with five base plant slots. Two one-time upgrades are available.</p>
                  <p className="mt-2 font-semibold text-amber-200">Price: ${SEED_SLOT_COSTS[playerData.seedSlotsPurchased] || "-"} | Balance: ${playerData.money} | Capacity: {playerData.seedBankSize}</p>
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
            <div className="screen-heading"><div><p className="menu-kicker">Know your tools</p><h2>Almanac</h2><p>Everything discovered on the lawn, in one place.</p></div><button type="button" onClick={() => { setPhase(almanacReturnPhase); if (almanacReturnPhase === "menu") setIsPaused(false); }} className="text-button">{almanacReturnPhase === "playing" ? "Back to pause menu" : "Back to main menu"}</button></div>
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
                {Object.values(PLANT_SPECS).filter((spec) => spec.fusionOf?.includes(almanacPlantKey as never)).map((spec) => <article key={spec.key} className="almanac-card"><div className="almanac-art plant-art"><img src={getPlantImage(spec.key)} alt="" /></div><div><p className="almanac-type">Fusion plant</p><h3>{spec.name}</h3><p>{spec.summary}</p><p className="almanac-recipe">Requires {spec.fusionOf?.map((key) => PLANT_SPECS[key].name).join(" + ")}</p><dl><div><dt>Health</dt><dd>{spec.hp} HP</dd></div>{spec.damage !== undefined && <div><dt>Damage</dt><dd>{spec.damage}</dd></div>}{spec.shootMs && <div><dt>Attack interval</dt><dd>{Math.round(spec.shootMs * (spec.fireRateMultiplier || 1) / 100) / 10}s</dd></div>}{spec.generateAmount && <div><dt>Sun per burst</dt><dd>{spec.generateAmount}</dd></div>}{spec.generateMs && <div><dt>Sun interval</dt><dd>{spec.generateMs / 1000}s</dd></div>}{spec.hypnotizeChance && <div><dt>Hypnotize chance</dt><dd>{spec.hypnotizeChance * 100}%</dd></div>}{spec.freezeDurationMs && <div><dt>Freeze duration</dt><dd>{spec.freezeDurationMs / 1000}s</dd></div>}</dl></div></article>)}
              </>}
              {almanacCategory === "zombies" && Object.values(ZOMBIE_SPECS).filter((spec) => (playerData.zombieKills[spec.key] || 0) > 0).map((spec) => <article key={spec.key} className="almanac-card"><div className="almanac-art zombie-art relative"><img src={getZombieImage(spec.key)} alt="" />{(spec.key === "cone" || spec.key === "bucket") && <img src={spec.key === "cone" ? "/zombie/cone.webp" : "/zombie/bucket.webp"} alt="" className="absolute object-contain" style={{ width: "33.333%", height: "33.333%", left: "40%", top: "18%", transform: "translateX(-50%)" }} />}</div><div><p className="almanac-type">Zombie</p><h3>{spec.name}</h3><p>{spec.summary}</p><dl><div><dt>Defeated</dt><dd>{playerData.zombieKills[spec.key]}</dd></div><div><dt>Health</dt><dd>{spec.hp} HP</dd></div><div><dt>Speed</dt><dd>{Math.round(spec.moveMs / 100) / 10}s / tile</dd></div><div><dt>Damage</dt><dd>{spec.damage}</dd></div><div><dt>Attack</dt><dd>{spec.attackMs / 1000}s</dd></div><div><dt>Armor</dt><dd>{spec.armor}</dd></div></dl></div></article>)}
              {almanacCategory === "zombies" && !Object.values(ZOMBIE_SPECS).some((spec) => (playerData.zombieKills[spec.key] || 0) > 0) && <p className="almanac-empty">No zombies defeated yet.</p>}
              {almanacCategory === "tiles" && Object.values(TILE_DEFINITIONS).map((tile) => <article key={tile.key} className="almanac-card tile-card"><div className={`almanac-tile-swatch ${tile.key}`} /><div><p className="almanac-type">Tile</p><h3>{{ normal: "Lawn", normalDark: "Dark lawn", obstructed: "Obstructed", sunflowerStatue: "Sunflower statue", sunShroomStatue: "Sun-shroom statue", grave: "Gravestone" }[tile.key]}</h3><p>{tile.description}</p><dl><div><dt>Plantable</dt><dd>{tile.canPlant ? "Yes" : "No"}</dd></div><div><dt>Label</dt><dd>{tile.label || "None"}</dd></div></dl></div></article>)}
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
                  const disabledByChallenge = requiredLoadoutPlants.length > 0 && !requiredLoadoutPlants.includes(plantKey);
                  return (
                    <button key={plantKey} type="button" onClick={() => toggleLoadoutPlant(plantKey)} disabled={disabledByChallenge} className={`plant-choice ${selected ? "selected" : ""} ${disabledByChallenge ? "unavailable" : ""}`} aria-pressed={selected}>
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
            <button type="button" className="start-level-button" disabled={selectedLoadout.length === 0 || requiredLoadoutPlantSets.some((plantSet) => !plantSet.some((plant) => selectedLoadout.includes(plant)))} onClick={beginLevel}>Start level <span>→</span></button>
          </div>
        )}

        {(phase === "playing" || phase === "complete") && (
          <div className="mt-6 space-y-4">
            <div className="game-toolbar">
              <div ref={sunCounterRef} className="sun-counter" aria-label={`${sun} sun available`}><img className="sun-token" src="/other/sun.webp" alt="" /> <strong>{sun}</strong></div>
              <div className="seed-tray" aria-label="Seed packet selection" style={{ gridTemplateColumns: `repeat(${playerData.seedBankSize}, minmax(3rem, 4.4rem))` }}>
                {selectedLoadout.map((plantKey) => {
                  const spec = PLANT_SPECS[plantKey];
                  const ready = plantReady[plantKey] <= gameTime;
                  const enoughSun = sun >= spec.cost;
                  const disabled = !ready || !enoughSun;
                  const coolDown = Math.max(0, Math.ceil((plantReady[plantKey] - gameTime) / 1000));
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
              <button type="button" aria-label="Select shovel" aria-keyshortcuts="1" onClick={selectShovel} className={`shovel-button ${shovelSelected ? "selected" : ""}`}><img src="/other/shovel.webp" alt="" /><kbd className="shortcut-hint">1</kbd></button>
              {playerData.gloveUnlocked && <button type="button" aria-label="Select glove" aria-keyshortcuts="2" onClick={selectGlove} disabled={gloveReadyAt > gameTime} className={`shovel-button glove-button ${gloveSelected ? "selected" : ""} ${gloveReadyAt > gameTime ? "unavailable" : ""}`}><img src="/other/glove.webp" alt="" /><kbd className="shortcut-hint">2</kbd>{gloveReadyAt > gameTime && <small>{Math.ceil((gloveReadyAt - gameTime) / 1000)}s</small>}</button>}
              <button type="button" aria-label="Open pause menu" aria-keyshortcuts="Escape" onClick={() => setIsPaused(true)} className="settings-button">⚙<kbd className="shortcut-hint">Esc</kbd></button>
            </div>
            {currentLevel?.challenges && currentLevel.challenges.some((challenge) => challenge.type !== "usePlant") && (
              <div className="challenge-tags" aria-label="Level challenges">
                {currentLevel.challenges.map((challenge, index) => {
                  if (challenge.type === "usePlant") return null;
                  let label: ReactNode;
                  let valid = false;
                  if (challenge.type === "produceSun") {
                    valid = challengeProgress.sunProduced >= challenge.amount;
                    label = <>{challengeProgress.sunProduced} / {challenge.amount} <img src="/other/sun.webp" alt="" /></>;
                  } else if (challenge.type === "maxSunSpent") {
                    valid = challengeProgress.sunSpent <= challenge.amount;
                    label = <>{challengeProgress.sunSpent} / {challenge.amount} <img src="/other/sun.webp" alt="" /></>;
                  } else if (challenge.type === "maxPlantsLost") {
                    valid = challengeProgress.plantsLost <= challenge.amount;
                    const plantsLeft = Math.max(0, challenge.amount - challengeProgress.plantsLost);
                    label = <>{plantsLeft} plant left</>;
                  } else if (challenge.type === "maxPlantsOnLawn") {
                    valid = plants.length <= challenge.amount;
                    label = <>{plants.length} / {challenge.amount} plants</>;
                  } else {
                    const recentKills = challengeProgress.zombieKillCounts[index] || 0;
                    valid = challengeProgress.completedTimedKillChallenges.includes(index)
                      || recentKills >= challenge.count;
                    label = <>{recentKills} / {challenge.count} <img src="/zombie/basic-head.webp" alt="" /></>;
                  }
                  return <span key={`${challenge.type}-${index}`} className={`challenge-tag ${valid ? "valid" : ""}`}>{label}</span>;
                })}
              </div>
            )}

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
                  const tilePlants = plants.filter((item) => item.row === row && item.col === col);
                  const statue = statues.find((item) => item.row === row && item.col === col);
                  const configuredTile = currentLevel?.tiles[row]?.[col] || "normal";
                  const removedObstacleTile = !statue && (configuredTile === "grave"
                    || configuredTile === "sunflowerStatue" || configuredTile === "sunShroomStatue");
                  const tileType = statue?.type || (removedObstacleTile
                    ? (row + col) % 2 === 0 ? "normal" : "normalDark"
                    : configuredTile);
                  const tile = getTileDefinition(tileType);
                  const tileExplosionEffects = explosionEffects.filter((effect) =>
                    effect.row === row && Math.floor(effect.col) === col);

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
                      disabled={Boolean(statue) && selectedPlant !== "graveBuster" || !tile.canPlant && selectedPlant !== "graveBuster"}
                      aria-label={tile.label || "Available lawn tile"}
                      className={`relative min-h-16 overflow-visible p-2 text-left transition ${tile.className}`}
                    >
                      {statue && statue.type !== "grave" && (
                        <div className="absolute inset-0 z-10 pointer-events-none">
                          <img src={statue.type === "sunShroomStatue" ? "/other/sun-shroom-statue.webp" : "/other/sunflower-statue.webp"} alt={statue.type === "sunShroomStatue" ? "Sun-shroom statue" : "Sunflower statue"} className="h-full w-full object-contain" />
                          {showDebugHealth && statue.hp !== undefined && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded bg-slate-950/80 px-1 text-[10px] text-white">HP: {statue.hp}</span>}
                        </div>
                      )}
                      {statue?.type === "grave" && (
                        <div className="absolute inset-0 z-10 pointer-events-none">
                          <img src={statue.image} alt="Gravestone" className="h-full w-full object-contain" />
                        </div>
                      )}
                      {tilePlants.map((tilePlant, plantIndex) => {
                        const spec = PLANT_SPECS[tilePlant.type];
                        const fusionTarget = tilePlant.id !== movingPlantId && (gloveSelected
                          ? Boolean(movingPlant && (movingPlant.row !== row || movingPlant.col !== col)
                            && gloveFusionSources.some((source) => canFusePlants(source.type, tilePlant.type)))
                          : !shovelSelected && selectedPlant !== null && canFusePlants(selectedPlant, tilePlant.type));
                        const stacked = tilePlants.length > 1 && tilePlants.every((item) => PLANT_SPECS[item.type].puffStack);
                        const offset = stacked
                          ? { left: `${(plantIndex % 2) * 50}%`, top: `${Math.floor(plantIndex / 2) * 50}%`, width: "50%", height: "50%" }
                          : spec.puffStack
                            ? { left: "25%", top: "25%", width: "50%", height: "50%" }
                          : { inset: 0, width: "100%", height: "100%" };
                        const sleeping = ["chomper", "chompNut", "sunChomper", "chompShooter", "cherryChomper", "hypnoChomper", "iceChomper", "chomperMaw", "gluttonShroom"].includes(tilePlant.type)
                          && tilePlant.sleepingUntil && tilePlant.sleepingUntil > gameTime;
                        const nut = ["wallNut", "peanut", "sunNut", "tallNut", "explodeONut", "frostNut", "fumeNut", "hypnoNut", "miniNutShroom"].includes(tilePlant.type);
                        const stage = getPlantDamageStage(tilePlant.type, tilePlant.hp);
                        const bombFuse = tilePlant.type === "icebergLettuce" || tilePlant.type === "iceShroom" || tilePlant.type === "frozenCherry" || tilePlant.type === "miniIceShroom" ? (tilePlant.type === "miniIceShroom" ? 400 : ICEBERG_LETTUCE_FUSE_MS) : CHERRY_BOMB_FUSE_MS;
                        const growth = tilePlant.cherryBombExplodesAt
                          ? Math.min(1, Math.max(0, 1 - (tilePlant.cherryBombExplodesAt - gameTime) / bombFuse))
                          : 0;
                        const jumpProgress = tilePlant.jumpStartedAt ? Math.min(1, (gameTime - tilePlant.jumpStartedAt) / 700) : 0;
                        const graveBusterSink = tilePlant.type === "graveBuster" && tilePlant.obstacleDestroyAt
                          ? Math.min(1, Math.max(0, 1 - (tilePlant.obstacleDestroyAt - gameTime) / 5000))
                          : 0;
                        const sunShroomGrown = tilePlant.type === "sunShroom" && gameTime - tilePlant.plantedAt >= (spec.generationGrowthMs || 100000);
                        const isFumeAnimating = Boolean(spec.fumeAttack && tilePlant.fumeAnimatingUntil && tilePlant.fumeAnimatingUntil > gameTime);
                        return (
                        <div key={tilePlant.id} className={`plant-idle absolute inset-0 z-10 h-full w-full text-xs text-lime-200 ${fusionTarget ? "plant-fusion-ready" : ""}`}>
                          <img
                            src={nut ? getNutDamageImage(tilePlant.type, stage) : getPlantImage(tilePlant.type)}
                            alt={spec.name}
                            className={`absolute h-full w-full object-contain ${sleeping ? "plant-sprite-sleeping" : ""}`}
                            style={{
                              ...offset,
                              transform: tilePlant.type === "graveBuster"
                                ? `translateY(${-30 + graveBusterSink * 25}%) scale(${1 - graveBusterSink * 0.1})`
                                : sunShroomGrown ? "scale(2)"
                                : isFumeAnimating ? "scale(0.85)" : tilePlant.jumpStartedAt
                                ? `translate(${jumpProgress * 50}%, ${-4 * 0.25 * jumpProgress * (1 - jumpProgress) * 100}%) scale(0.85)`
                                : ["cherryBomb", "sunBomb", "icebergLettuce", "iceShroom", "frozenCherry", "miniIceShroom"].includes(tilePlant.type)
                                  ? `scale(${0.75 + growth * 0.35})`
                                  : sleeping ? "scale(1.0, 0.72)"
                                      : stacked ? "scale(1.0)" : "scale(1.0)",
                              transition: `transform ${GAME_TICK_MS}ms ease-out, filter ${GAME_TICK_MS}ms ease-out`,
                            }}
                            onError={(event) => {
                              event.currentTarget.remove();
                              event.currentTarget.nextElementSibling?.classList.remove("hidden");
                              event.currentTarget.parentElement?.querySelector("[data-image-debug-health]")?.classList.add("hidden");
                            }}
                          />
                          {sleeping && plantIndex === 0 && <span className="plant-sleeping-indicator" aria-label="Sleeping">Zzz</span>}
                          <div className="relative z-10 hidden h-full w-full flex-col justify-between border border-lime-500/20 bg-lime-500/10 p-2">
                            <span>{spec.name}</span>
                            {showDebugHealth && <span className="text-[11px] text-slate-200">HP: {tilePlant.hp}</span>}
                          </div>
                          {showDebugHealth && <span data-image-debug-health className="absolute bottom-0 left-1/2 z-10 -translate-x-1/2 text-[11px] text-slate-200">{tilePlant.hp}</span>}
                        </div>
                        );
                      })}
                      {tileExplosionEffects.flatMap((effect) => effect.particles.map((particle) => (
                        <img
                          key={`${effect.id}-${particle.id}`}
                          src="/plants/cherry-explosion.webp"
                          alt=""
                          aria-hidden="true"
                          className="absolute z-20 pointer-events-none cherry-explosion-particle"
                          style={{
                            left: `${((effect.col - col) + particle.offsetX) * 100}%`,
                            top: `${50 + particle.offsetY * 100}%`,
                            width: "150%",
                            height: "150%",
                            "--explosion-drift-x": `${particle.driftX / 1.5 * 100}%`,
                            "--explosion-drift-y": `${particle.driftY / 1.5 * 100}%`,
                            "--explosion-rotation": `${particle.rotation}deg`,
                            animationDelay: `${particle.delayMs}ms`,
                          } as CSSProperties}
                        />
                      )))}
                    </button>
                  );
                })}

                {introTextIndex !== null && currentLevel?.introTexts?.[introTextIndex] && (
                  <div className="lawn-intro-overlay" role="status" aria-live="polite">
                    <p>{currentLevel?.introTexts?.[introTextIndex]}</p>
                  </div>
                )}

                {readyCountdownIndex !== null && (
                  <div className="lawn-countdown-overlay" role="status" aria-live="assertive">
                    <img
                      src={`/other/${["ready", "set", "plant"][readyCountdownIndex]}.webp`}
                      alt={["Ready", "Set", "Plant"][readyCountdownIndex]}
                    />
                  </div>
                )}

                {suns.map((sunDrop) => (
                  <button
                    key={sunDrop.id}
                    type="button"
                    aria-label={`Collect ${sunDrop.value} sun`}
                    onMouseEnter={(event) => collectSun(sunDrop.id, event.currentTarget)}
                    onFocus={(event) => collectSun(sunDrop.id, event.currentTarget)}
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
                      className="sun-token block object-contain drop-shadow-lg"
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
                    onMouseEnter={(event) => collectCoin(coin.id, event.currentTarget)}
                    onFocus={(event) => collectCoin(coin.id, event.currentTarget)}
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

                <div
                  className="pointer-events-none absolute inset-1 z-20 grid gap-1 overflow-visible sm:inset-2"
                  aria-hidden="true"
                  style={{
                    gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${gridRows}, minmax(4rem, 1fr))`,
                  }}
                >
                  {projectiles.filter((projectile) => {
                    const visualY = projectile.visualY ?? projectile.row + PLANT_PROJECTILE_Y_OFFSET;
                    return projectile.x >= 0 && projectile.x < gridCols && visualY >= 0 && visualY < gridRows;
                  }).map((projectile) => {
                    const visualY = projectile.visualY ?? projectile.row + PLANT_PROJECTILE_Y_OFFSET;
                    const xRatio = projectile.x / gridCols;
                    const yRatio = visualY / gridRows;
                    const xGapCorrection = Math.floor(projectile.x) * 4 - xRatio * (gridCols - 1) * 4;
                    const yGapCorrection = Math.floor(visualY) * 4 - yRatio * (gridRows - 1) * 4;
                    return (
                      <img
                        key={projectile.id}
                        src={projectile.image || "/plants/projectile-pea.webp"}
                        alt=""
                        className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 object-contain"
                        style={{
                          left: `calc(${xRatio * 100}% ${xGapCorrection < 0 ? "-" : "+"} ${Math.abs(xGapCorrection)}px)`,
                          top: `calc(${yRatio * 100}% ${yGapCorrection < 0 ? "-" : "+"} ${Math.abs(yGapCorrection)}px)`,
                          transition: `left ${GAME_TICK_MS}ms linear, top ${GAME_TICK_MS}ms linear`,
                        }}
                      />
                    );
                  })}
                </div>

                {/* Zombie overlay: render zombies absolutely so they can move smoothly (fractional x) */}
                {zombies.map((z) => {
                  const armorImage = getZombieArmorImage(z.type, z.armor, z.armorBrokenAt, gameTime);
                  const armorIsFalling = Boolean(z.armorBrokenAt && gameTime - z.armorBrokenAt < 2000);
                  const vaultProgress = z.poleVaultStartedAt !== undefined && z.poleVaultingUntil
                    ? Math.min(1, Math.max(0, (gameTime - z.poleVaultStartedAt) / 2000))
                    : 0;
                  const vaultLift = 4 * 0.85 * vaultProgress * (1 - vaultProgress);
                  const zombieImage = z.type === "poleVaulting" && z.poleVaulted
                    ? "/zombie/pole_vaulting_zombie-2.webp"
                    : z.type === "wallNutZombie"
                      ? z.hp <= 700 ? "/zombie/wall-nut-zombie-heavely-damaged.webp" : z.hp <= 1300 ? "/zombie/wall-nut-zombie-damaged.webp" : getZombieImage(z.type)
                      : getZombieImage(z.type);
                  return (
                    <div
                      key={z.id}
                      className={`absolute z-10 pointer-events-none ${z.hypnotized ? "zombie-hypnotized" : ""} ${z.frozenUntil && z.frozenUntil > gameTime ? "zombie-frozen" : ""}`}
                      style={{
                        left: `${(z.x / gridCols) * 100}%`,
                        top: `${(((z.visualY ?? z.row + (z.type === "gargantuar" || z.type === "horseman" ? 0.05 : 0.5)) - vaultLift) / gridRows) * 100}%`,
                        transform: "translate(-50%, -50%)",
                        transition: `left ${GAME_TICK_MS}ms linear, top ${GAME_TICK_MS}ms linear`,
                      }}
                    >
                      <div
                        className={`relative ${z.type === "gargantuar" || z.type === "horseman" ? "h-32 w-32" : z.type === "poleVaulting" ? "h-28 w-28" : z.type === "imp" ? "h-16 w-16" : "h-20 w-20"}`}
                        style={{ transform: `scale(${z.hypnotizedVisualScale || 1})`, transformOrigin: "bottom center" }}
                      >
                        <img src={zombieImage} alt={getZombieLabel(z.type)} className="absolute inset-0 h-full w-full origin-bottom object-contain" />
                        {armorImage && (
                          <span
                            className="absolute origin-bottom"
                            style={{
                              width: "45%",
                              height: "45%",
                              left: z.hypnotized ? "62%" : "38%",
                              top: "-28%",
                              transform: `translateX(-50%)${z.hypnotized ? " scaleX(-1)" : ""}`,
                            }}
                          >
                            <img src={armorImage} alt="" className={`absolute inset-0 h-full w-full origin-bottom object-contain ${armorIsFalling ? "zombie-armor-falling" : ""}`} />
                          </span>
                        )}
                      </div>
                      {showDebugHealth && <div className="mt-1 text-[10px] text-white text-center bg-rose-500/80 rounded-full px-2 py-0.5">HP: {z.hp}{z.armor > 0 ? ` | A: ${z.armor}` : ""}</div>}
                    </div>
                  );
                })}

                {zombieProjectiles.map((projectile) => (
                  <div
                    key={projectile.id}
                    className="absolute pointer-events-none"
                    style={{
                      left: `${(projectile.x / gridCols) * 100}%`,
                      top: `${((projectile.row + 0.3) / gridRows) * 100}%`,
                      transform: "translate(-50%, -50%)",
                      transition: `left ${GAME_TICK_MS}ms linear`,
                    }}
                  >
                    <img src="/plants/projectile-pea.webp" alt="" className={`block h-5 w-5 object-contain ${projectile.hypnotized ? "" : "-scale-x-100"}`} />
                  </div>
                ))}

                {showBossWaveWarning && (
                  <div className="boss-wave-warning" aria-hidden="true">
                    <img src="/other/wave-text.webp" alt="" />
                  </div>
                )}
              </div>
            </div>

            <div className="wave-status-row">
              <div ref={coinBalanceRef} className="coin-balance" aria-label={`Player money: $${playerData.money}`}>
                <img src="/other/silver-coin.webp" alt="" />
                <strong>{playerData.money}</strong>
                <span>$</span>
              </div>
              <div className="wave-progress" aria-label={`Wave progress: ${completedWaveCount} of ${waveProgressSegments.length} waves spawned`}>
                <div className="wave-progress-label"><span>Wave progress</span><span>{completedWaveCount} / {waveProgressSegments.length} waves</span></div>
                <div className="wave-progress-track">
                  {waveProgressSegments.map((segment, index) => (
                    <div key={`wave-${index}`} className="wave-progress-segment" aria-label={`${segment.isBoss ? "Boss " : ""}wave ${index + 1}`}>
                      <div className={`wave-progress-segment-fill ${segment.isBoss ? "boss" : ""}`} style={{ width: `${segment.progress}%` }} />
                    </div>
                  ))}
                </div>
                <p>{waveStageLabel}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {pickupAnimations.map((pickup) => (
        <img
          key={pickup.id}
          src={pickup.image}
          alt=""
          aria-hidden="true"
          className={`pickup-animation ${pickup.kind}-pickup-animation`}
          style={{
            left: pickup.startX,
            top: pickup.startY,
            "--coin-delta-x": `${pickup.deltaX}px`,
            "--coin-delta-y": `${pickup.deltaY}px`,
          } as CSSProperties}
        />
      ))}

      {challengeBriefingOpen && phase === "playing" && currentLevel?.challenges?.length && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4" role="dialog" aria-modal="true" aria-labelledby="challenge-briefing-title">
          <section className="challenge-briefing">
            <p className="loadout-kicker">Mission objectives</p>
            <h2 id="challenge-briefing-title">{currentLevel.title} challenges</h2>
            <ul>
              {currentLevel.challenges.map((challenge, index) => <li key={`${challenge.type}-${index}`}>{describeChallenge(challenge)}</li>)}
            </ul>
            <button type="button" className="start-level-button" onClick={startChallengeCountdown}>Start level <span>→</span></button>
          </section>
        </div>
      )}

      {isPaused && phase === "playing" && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4">
          <div className="pause-menu">
            <h2>Paused</h2>
            <button type="button" onClick={() => { setShowSettings(false); setIsPaused(false); }}>Resume</button>
            <button type="button" onClick={() => setShowSettings(true)}>Settings</button>
            <button type="button" onClick={() => openAlmanac("playing")}><img src="/other/almanac.webp" alt="" /> Almanac</button>
            <button type="button" onClick={() => currentLevelRef.current && startLevel(currentLevelRef.current.id)}>Restart level</button>
            <button type="button" onClick={returnToMenu}>Return to main menu</button>
          </div>
        </div>
      )}

      {isPaused && showSettings && phase === "playing" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4" role="dialog" aria-modal="true" aria-labelledby="settings-title">
          <div className="pause-menu settings-menu">
            <h2 id="settings-title">Settings</h2>
            <label className="music-volume-control">
              <span>Music volume</span>
              <strong>{Math.round(musicVolume * 100)}%</strong>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={musicVolume}
                aria-label="Music volume"
                onChange={(event) => setMusicVolume(Number(event.currentTarget.value))}
              />
            </label>
            <button type="button" onClick={() => setShowSettings(false)}>Back to pause menu</button>
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
            <p className="mt-4 text-slate-300">{gameOverMessage}</p>
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
