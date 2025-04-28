// Original scene config from JSON file
export interface RawSceneConfig {
  xMin: number;
  xMax: number;
  zMin: number;
  zMax: number;
  description?: string;
}

// Processed scene config used in the application
export interface SceneConfig {
  worldBounds: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
  description?: string;
}

export interface SceneConfigs {
  scenes: {
    [key: string]: RawSceneConfig;
  };
}