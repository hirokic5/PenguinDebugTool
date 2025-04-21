export interface SceneConfig {
  xMin: number;
  xMax: number;
  zMin: number;
  zMax: number;
  description: string;
}

export interface SceneConfigs {
  scenes: {
    [key: string]: SceneConfig;
  };
}