"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  GRID_COLS,
  GRID_ROWS,
  INITIAL_SUN,
  LEVELS,
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
  ZOMBIE_SPECS,
} from "./constants";
import type {
  GamePhase,
  LevelConfig,
  PlantInstance,
  PlantTypeKey,
  Projectile,
  ZombieInstance,
} from "./types";

const createId = () => Math.random().toString(36).slice(2, 9);

const tileKey = (row: number, col: number) => `${row}-${col}`;

const randomRow = () => Math.floor(Math.random() * GRID_ROWS);

const randomizeInterval = (interval: number): number => {
  const variance = 1 + (Math.random() - 0.5) * 0.2;
  return interval * variance;
};

export default function GameScreen() {
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [selectedPlant, setSelectedPlant] = useState<PlantTypeKey>("sunflower");
  const [selectedLevelId, setSelectedLevelId] = useState(1);
  const [currentLevel, setCurrentLevel] = useState<LevelConfig | null>(null);
  const [sun, setSun] = useState(INITIAL_SUN);
  const [plants, setPlants] = useState<PlantInstance[]>([]);
  const [zombies, setZombies] = useState<ZombieInstance[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
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

  const plantsRef = useRef<PlantInstance[]>([]);
  const zombiesRef = useRef<ZombieInstance[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
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
  const gameOverRef = useRef(false);
  const spawnScheduleRef = useRef({
    nextRegularSpawn: 0,
    nextWaveStart: 0,
    nextWaveSpawn: 0,
    nextWaveNumber: 1,
  });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
    setRegularSpawned(0);
    regularSpawnedRef.current = 0;
    setWave1Spawned(0);
    wave1SpawnedRef.current = 0;
    setWave2Spawned(0);
    wave2SpawnedRef.current = 0;
    setWaveActive(false);
    waveActiveRef.current = false;
    setPlantReadyState({ sunflower: 0, peaShooter: 0 });
    setLevelComplete(false);
    setGameOver(false);
    gameOverRef.current = false;
  };

  const startLevel = (levelId: number) => {
    const levelToStart = LEVELS.find((level) => level.id === levelId) || LEVELS[0];
    const now = Date.now();

    resetGameState();
    setSelectedLevelId(levelId);
    setCurrentLevel(levelToStart);
    currentLevelRef.current = levelToStart;
    spawnScheduleRef.current = {
      nextRegularSpawn: now + levelToStart.initialDelayMs,
      nextWaveStart: 0,
      nextWaveSpawn: 0,
      nextWaveNumber: 1,
    };
    setGameTime(now);
    setPhase("playing");
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
    setPhase("complete");
    setLevelComplete(true);
  };

  const handlePlacePlant = (row: number, col: number) => {
    if (phase !== "playing") return;
    const now = Date.now();
    if (plantsRef.current.some((plant) => plant.row === row && plant.col === col)) return;
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

  const spawnZombie = (isWave: boolean, type: string = "basic") => {
    const now = Date.now();
    const spec = ZOMBIE_SPECS[type] || ZOMBIE_SPECS.basic;
    const newZombie: ZombieInstance = {
      id: createId(),
      row: randomRow(),
      col: GRID_COLS - 1,
      x: GRID_COLS + ZOMBIE_SPAWN_OFFSET,
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
    if (phase !== "playing" || gameOver) {
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
  }, [phase, gameOver]);

  useEffect(() => {
    if (phase !== "playing" || currentLevel === null) return;

    const now = gameTime;
    let nextPlants = plantsRef.current.slice();
    let nextZombies = zombiesRef.current.slice();
    let nextProjectiles = projectilesRef.current.slice();
    let nextSun = sunRef.current;

    const spawnState = spawnScheduleRef.current;
    const totalRegular = currentLevel.preWaveCount + currentLevel.midCount;
    const firstWaveTotal = currentLevel.wave1Count;
    const secondWaveTotal = currentLevel.wave2Count;
    const regularInterval = currentLevel.regularSpawnIntervalMs;
    const waveInterval = currentLevel.waveSpawnIntervalMs;
    const betweenDelay = currentLevel.betweenWaveDelayMs;

    if (!waveActiveRef.current && regularSpawnedRef.current < totalRegular && now >= spawnState.nextRegularSpawn) {
      // Spawn different zombie types based on count
      let zombieType = "basic";
      if (regularSpawnedRef.current >= 5 && regularSpawnedRef.current < 7) {
        zombieType = "imp";
      } else if (regularSpawnedRef.current >= 7) {
        zombieType = "cone";
      }
      const newZ = spawnZombie(false, zombieType);
      nextZombies.push(newZ);
      regularSpawnedRef.current += 1;
      setRegularSpawned(regularSpawnedRef.current);
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
        const newZ = spawnZombie(true);
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
        nextSun += spec.generateAmount || 50;
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
          (z) => z.row === plant.row && z.x > plant.col && z.x >= 0 && z.x < GRID_COLS && z.hp > 0
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
      if (moved.x < GRID_COLS + 5) {
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
      return;
    }

    nextZombies = nextZombies.filter((zombie) => zombie.hp > 0);

    setSunState(nextSun);
    setPlantsState(nextPlants);
    setZombiesState(nextZombies);
    setProjectilesState(nextProjectiles);

    if (
      regularSpawnedRef.current === totalRegular &&
      wave1SpawnedRef.current === firstWaveTotal &&
      wave2SpawnedRef.current === secondWaveTotal &&
      nextZombies.length === 0 &&
      !waveActiveRef.current
    ) {
      finishLevel();
    }
  }, [gameTime, phase, currentLevel]);

  const grid = useMemo(
    () =>
      Array.from({ length: GRID_ROWS }, (_, row) =>
        Array.from({ length: GRID_COLS }, (_, col) => ({ row, col })),
      ),
    [],
  );

  const selectedSpec = PLANT_SPECS[selectedPlant];
  const progressMax = currentLevel ? currentLevel.preWaveCount + currentLevel.midCount : 1;
  const progressPercent = currentLevel ? Math.round((regularSpawned / progressMax) * 100) : 0;
  const waveThresholds = currentLevel
    ? [currentLevel.preWaveCount].concat(currentLevel.midCount > 0 ? [currentLevel.preWaveCount + currentLevel.midCount] : [])
    : [];
  const title =
    phase === "menu"
      ? "Plants vs Zombie Prototype"
      : phase === "level-select"
      ? "Select a Level"
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-4xl font-bold tracking-tight text-lime-300">{title}</h1>

        {phase === "menu" && (
          <div className="mt-12 flex flex-col items-center gap-6">
            <p className="max-w-2xl text-lg text-slate-300">
              This prototype includes a simple menu, a level selection screen, a 12x6 lawn grid, sun currency, two plant types, and a basic zombie wave system.
            </p>
            <button
              type="button"
              onClick={() => setPhase("level-select")}
              className="rounded-full bg-lime-500 px-7 py-3 text-lg font-semibold text-slate-950 transition hover:bg-lime-400"
            >
              Start Game
            </button>
          </div>
        )}

        {phase === "level-select" && (
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {LEVELS.map((level) => (
              <div key={level.id} className="rounded-3xl border border-slate-700 bg-slate-900/80 p-6 shadow-xl">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">{level.title}</h2>
                    <p className="mt-2 text-slate-400">{level.description}</p>
                  </div>
                  <span className="rounded-full bg-lime-500 px-3 py-1 text-sm font-semibold text-slate-950">{level.id}</span>
                </div>
                <div className="mt-6 flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => startLevel(level.id)}
                    className="rounded-full bg-lime-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-lime-400"
                  >
                    Play {level.title}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedLevelId(level.id)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${selectedLevelId === level.id ? "border-lime-400 bg-slate-800 text-white" : "border-slate-700 bg-slate-900 text-slate-300 hover:border-lime-300"}`}
                  >
                    Select for preview
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {(phase === "playing" || phase === "complete") && (
          <div className="mt-10 space-y-6">
            <div className="grid gap-4 rounded-3xl border border-slate-700 bg-slate-900/80 p-6 shadow-xl sm:grid-cols-[1fr_auto]">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="rounded-2xl bg-slate-800/90 px-4 py-3 text-slate-100">
                    Sun: <span className="font-semibold text-lime-300">{sun}</span>
                  </div>
                  <div className="rounded-2xl bg-slate-800/90 px-4 py-3 text-slate-100">
                    Selected: <span className="font-semibold text-lime-300">{selectedSpec.name}</span>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {Object.values(PLANT_SPECS).map((spec) => {
                    const ready = plantReadyRef.current[spec.key] <= gameTime;
                    const enoughSun = sunRef.current >= spec.cost;
                    const disabled = !ready || !enoughSun;
                    const coolDown = Math.max(0, Math.ceil((plantReadyRef.current[spec.key] - gameTime) / 1000));
                    return (
                      <button
                        key={spec.key}
                        type="button"
                        disabled={disabled}
                        onClick={() => setSelectedPlant(spec.key)}
                        className={`rounded-3xl border px-4 py-4 text-left transition ${selectedPlant === spec.key ? "border-lime-400 bg-slate-800" : "border-slate-700 bg-slate-900/80"} ${disabled ? "cursor-not-allowed opacity-70" : "hover:border-lime-300"}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-semibold text-white">{spec.name}</h3>
                            <p className="mt-1 text-sm text-slate-400">{spec.summary}</p>
                          </div>
                          <div className="rounded-full bg-slate-800 px-3 py-1 text-sm text-lime-300">{spec.cost}☀</div>
                        </div>
                        <div className="mt-3 text-sm text-slate-300">
                          {ready ? "Ready to place" : `Recharge ${coolDown}s`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4 rounded-3xl bg-slate-950/90 p-4">
                <div className="text-sm uppercase tracking-[0.24em] text-slate-400">Progress</div>
                <div className="relative h-4 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full bg-lime-400 transition-all" style={{ width: `${Math.min(100, progressPercent)}%` }} />
                  {waveThresholds.map((threshold, index) => (
                    <div
                      key={`${threshold}-${index}`}
                      className="absolute inset-y-0 w-px bg-orange-500"
                      style={{ left: `${Math.min(100, Math.round((threshold / progressMax) * 100))}%` }}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>{regularSpawned} / {progressMax} regular zombies sent</span>
                  <span className="flex items-center gap-1 text-lime-300">🚩 {waveThresholds.length} wave marker{waveThresholds.length === 1 ? "" : "s"}</span>
                </div>
                <div className="rounded-3xl border border-slate-700 bg-slate-900/80 p-4 text-sm text-slate-300">
                  <div className="font-semibold text-white">Wave status</div>
                  <p className="mt-2">{waveStageLabel}</p>
                  <p className="mt-2 text-sm text-slate-400">
                    {currentLevel && currentLevel.wave1Count > 0 && `First wave: ${currentLevel.wave1Count} zombies.`}
                    {currentLevel && currentLevel.wave2Count > 0 && ` Second wave: ${currentLevel.wave2Count} zombies.`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={returnToMenu}
                  className="rounded-full bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-600"
                >
                  Back to menu
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-700 bg-slate-900/90 p-4 shadow-xl">
              <div className="relative grid gap-1 bg-slate-950 p-1 sm:p-2" style={{ gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))` }}>
                {grid.flat().map(({ row, col }) => {
                  const plant = plants.find((item) => item.row === row && item.col === col);

                  return (
                    <button
                      key={tileKey(row, col)}
                      type="button"
                      onClick={() => handlePlacePlant(row, col)}
                      className={`relative min-h-16 overflow-hidden rounded-2xl border p-2 text-left transition ${"border-slate-800 bg-slate-950/80 hover:border-lime-400"}`}
                    >
                      <div className="absolute inset-x-0 top-0 h-1 bg-slate-800" />
                      {plant && (
                        <div className="flex h-full w-full flex-col justify-between rounded-2xl border border-lime-500/20 bg-lime-500/10 p-2 text-xs text-lime-200">
                          <span>{PLANT_SPECS[plant.type].name}</span>
                          <span className="text-[11px] text-slate-200">HP: {plant.hp}</span>
                        </div>
                      )}
                    </button>
                  );
                })}

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
                        left: `${(z.x / GRID_COLS) * 100}%`,
                        top: `${((z.row + 0.5) / GRID_ROWS) * 100}%`,
                        transform: "translate(-50%, -50%)",
                        transition: `left ${GAME_TICK_MS}ms linear, top ${GAME_TICK_MS}ms linear`,
                      }}
                    >
                      <div className={`rounded-full ${bgColor} px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white`}>{zombieLabel}</div>
                      <div className="mt-1 text-[10px] text-white text-center bg-rose-500/80 rounded-full px-2 py-0.5">
                        HP: {z.hp}{z.armor > 0 ? ` | A: ${z.armor}` : ""}
                      </div>
                    </div>
                  );
                })}

                {/* Projectile overlay: render projectiles absolutely for smooth movement */}
                {projectiles.map((p) => (
                  <div
                    key={p.id}
                    className="absolute pointer-events-none"
                    style={{
                      left: `${(p.x / GRID_COLS) * 100}%`,
                      top: `${((p.row + 0.5) / GRID_ROWS) * 100}%`,
                      transform: "translate(-50%, -50%)",
                      transition: `left ${GAME_TICK_MS}ms linear, top ${GAME_TICK_MS}ms linear`,
                    }}
                  >
                    <div className="h-2 w-2 rounded-full bg-cyan-300" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {levelComplete && phase !== "menu" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 px-4 py-8">
          <div className="w-full max-w-xl rounded-3xl border border-lime-400 bg-slate-900/95 p-8 text-center shadow-2xl">
            <h2 className="text-3xl font-semibold text-white">Level Complete!</h2>
            <p className="mt-4 text-slate-300">All zombies have been defeated. Great job on your first level.</p>
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
