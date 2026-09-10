import { LEVEL_TUTO } from "./level-tuto";
import { LEVEL_1 } from "./level-1";
import { LEVEL_2 } from "./level-2";
import { LEVEL_3 } from "./level-3";
import { LEVEL_test } from "./level-test";
import { compileLevelDefinition, toLevelConfig } from "./loader";
import type { LevelConfig } from "../types";

// Compile all level definitions
const COMPILED_LEVELS = [LEVEL_TUTO, LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_test].map(compileLevelDefinition);

// Export as standard LevelConfig for backwards compatibility
export const LEVELS: LevelConfig[] = COMPILED_LEVELS.map(toLevelConfig);

// Export compiled levels for advanced features (zombie type tracking)
export const COMPILED_LEVELS_BY_ID = new Map(
  COMPILED_LEVELS.map((level) => [level.id, level])
);

export function getCompiledLevel(levelId: number) {
  return COMPILED_LEVELS_BY_ID.get(levelId);
}
