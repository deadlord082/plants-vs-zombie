export type TileType = "normal" | "normalDark" | "obstructed";

export interface TileDefinition {
  key: TileType;
  canPlant: boolean;
  className: string;
  description: string;
  label?: string;
}

export const TILE_DEFINITIONS: Record<TileType, TileDefinition> = {
  normal: {
    key: "normal",
    canPlant: true,
    className: "bg-lime-700/80 hover:bg-lime-600/90",
    description: "A sunny lawn tile where plants can be placed.",
  },
  normalDark: {
    key: "normalDark",
    canPlant: true,
    className: "bg-green-800/90 hover:bg-green-700/90",
    description: "A darker checkerboard lawn tile that supports planting.",
  },
  obstructed: {
    key: "obstructed",
    canPlant: false,
    className: "cursor-not-allowed bg-stone-600/90",
    description: "An obstructed tile that cannot hold a plant.",
    label: "Obstructed",
  },
};

export const getTileDefinition = (tileType: TileType) => TILE_DEFINITIONS[tileType];