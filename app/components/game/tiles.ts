export type TileType = "normal" | "obstructed";

export interface TileDefinition {
  key: TileType;
  canPlant: boolean;
  className: string;
  label?: string;
}

export const TILE_DEFINITIONS: Record<TileType, TileDefinition> = {
  normal: {
    key: "normal",
    canPlant: true,
    className: "bg-lime-700/80 hover:bg-lime-600/90",
  },
  obstructed: {
    key: "obstructed",
    canPlant: false,
    className: "cursor-not-allowed bg-stone-600/90",
    label: "Obstructed",
  },
};

export const getTileDefinition = (tileType: TileType) => TILE_DEFINITIONS[tileType];