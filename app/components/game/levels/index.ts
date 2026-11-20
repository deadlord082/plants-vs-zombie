import { LEVEL_TUTO } from "./day/level-tuto";
import { LEVEL_1 } from "./day/level-1";
import { LEVEL_2 } from "./day/level-2";
import { LEVEL_3 } from "./day/level-3";
import { LEVEL_4 } from "./day/level-4";
import { LEVEL_5 } from "./day/level-5";
import { LEVEL_6 } from "./day/level-6";
import { LEVEL_7 } from "./day/level-7";
import { LEVEL_8 } from "./day/level-8";
import { LEVEL_9 } from "./day/level-9";
import { LEVEL_10 } from "./day/level-10";
import { LEVEL_11 } from "./day/level-11";
import { LEVEL_12 } from "./day/level-12";
import { LEVEL_13 } from "./day/level-13";
import { LEVEL_14 } from "./day/level-14";
import { LEVEL_15 } from "./day/level-15";
import { LEVEL_16 } from "./day/level-16";
import { LEVEL_17 } from "./day/level-17";
import { LEVEL_18 } from "./day/level-18";
import { LEVEL_19 } from "./day/level-19";
import { LEVEL_20 } from "./day/level-20";
import { LEVEL_12Lanes } from "./minigame/level-12lanes";
import { LEVEL_test } from "./minigame/level-test";
import { compileLevelDefinition, toLevelConfig } from "./loader";
import type { LevelConfig } from "../types";
import { LEVEL_2_1 } from "./night/level-2-1";
import { LEVEL_2_2 } from "./night/level-2-2";
import { LEVEL_2_3 } from "./night/level-2-3";
import { LEVEL_2_4 } from "./night/level-2-4";
import { LEVEL_2_6 } from "./night/level-2-6";
import { LEVEL_2_5 } from "./night/level-2-5";
import { LEVEL_2_7 } from "./night/level-2-7";
import { LEVEL_2_8 } from "./night/level-2-8";
import { LEVEL_2_9 } from "./night/level-2-9";
import { LEVEL_2_10 } from "./night/level-2-10";

// Compile all level definitions
const COMPILED_LEVELS = [
  LEVEL_TUTO,
  LEVEL_1,
  LEVEL_2,
  LEVEL_3,
  LEVEL_4,
  LEVEL_5,
  LEVEL_6,
  LEVEL_7,
  LEVEL_8,
  LEVEL_9,
  LEVEL_10,
  LEVEL_11,
  LEVEL_12,
  LEVEL_13,
  LEVEL_14,
  LEVEL_15,
  LEVEL_16,
  LEVEL_17,
  LEVEL_18,
  LEVEL_19,
  LEVEL_20,
  LEVEL_2_1,
  LEVEL_2_2,
  LEVEL_2_3,
  LEVEL_2_4,
  LEVEL_2_5,
  LEVEL_2_6,
  LEVEL_2_7,
  LEVEL_2_8,
  LEVEL_2_9,
  LEVEL_2_10,
  LEVEL_12Lanes,
  LEVEL_test,
].map(compileLevelDefinition);

// Export as standard LevelConfig for backwards compatibility
export const LEVELS: LevelConfig[] = COMPILED_LEVELS.map(toLevelConfig);

// Export compiled levels for advanced features (zombie type tracking)
export const COMPILED_LEVELS_BY_ID = new Map(
  COMPILED_LEVELS.map((level) => [level.id, level])
);

export function getCompiledLevel(levelId: number) {
  return COMPILED_LEVELS_BY_ID.get(levelId);
}
