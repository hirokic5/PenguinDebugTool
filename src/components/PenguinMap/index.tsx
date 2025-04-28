import React, { useState } from 'react';
import sceneConfigs from '../../config/sceneConfigs.json';
import { SceneConfig } from '../../types/sceneConfig';
import { PathPoint } from '../LeaderPathDrawer';
import { MapContainer, GridContainer } from './styles';
import useWebSocketConnection from '../../hooks/useWebSocketConnection';
import useMapRenderer from '../../hooks/useMapRenderer';
import Legend from './Legend';
import Filters from './Filters';
import CoordinateDisplay from './CoordinateDisplay';
import FollowersGraph from './FollowersGraph';

/**
 * Main PenguinMap component
 */
const PenguinMap: React.FC = () => {
  const [selectedScene, setSelectedScene] = useState<string>('Proto');
  const [showLeaderPaths, setShowLeaderPaths] = useState(true);
  const [showEnemies, setShowEnemies] = useState(true);
  const [showPenguins, setShowPenguins] = useState(true);
  const [pathMaxLength, setPathMaxLength] = useState<number>(250); // 経路の最大ポイント数

  // Get available scene configurations
  const sceneOptions = Object.keys((sceneConfigs as any).scenes || {});
  
  // Create a properly formatted config object from the JSON structure
  const getConfigFromScene = (sceneName: string): SceneConfig => {
    const sceneData = (sceneConfigs as any).scenes?.[sceneName];
    if (!sceneData) {
      // Default fallback if scene not found
      return {
        worldBounds: {
          minX: -50,
          maxX: 50,
          minZ: -50,
          maxZ: 50
        }
      };
    }
    
    return {
      worldBounds: {
        minX: sceneData.xMin,
        maxX: sceneData.xMax,
        minZ: sceneData.zMin,
        maxZ: sceneData.zMax
      },
      description: sceneData.description
    };
  };
  
  const currentConfig: SceneConfig = getConfigFromScene(selectedScene);
  
  // 経路の最大長を変更
  const changePathMaxLength = (newLength: number) => {
    setPathMaxLength(newLength);
    // 既存の経路を新しい最大長に調整
    const newPaths = new Map<string, PathPoint[]>();
    leaderPaths.forEach((path, key) => {
      newPaths.set(key, path.slice(-newLength));
    });
    setLeaderPaths(newPaths);
  };

  // WebSocket接続とデータ取得
  const {
    penguins,
    enemies,
    isConnected,
    leaderPaths,
    coordinates
  } = useWebSocketConnection(pathMaxLength);

  // マップ描画
  const canvasRef = useMapRenderer({
    penguins,
    enemies,
    leaderPaths,
    currentConfig,
    showLeaderPaths,
    showPenguins,
    showEnemies
  });

  return (
    <MapContainer>
      <GridContainer>
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <label>シーン: </label>
            <select 
              value={selectedScene} 
              onChange={(e) => setSelectedScene(e.target.value)}
            >
              {sceneOptions.map(scene => (
                <option key={scene} value={scene}>
                  {scene} - {(sceneConfigs as any).scenes[scene].description || ''}
                </option>
              ))}
            </select>
          </div>
          
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div>
              <label>
                <input 
                  type="checkbox" 
                  checked={showLeaderPaths} 
                  onChange={(e) => setShowLeaderPaths(e.target.checked)} 
                />
                リーダー経路を表示
              </label>
            </div>
            
            <div>
              <label>
                経路の長さ: 
                <select 
                  value={pathMaxLength} 
                  onChange={(e) => changePathMaxLength(Number(e.target.value))}
                >
                  <option value="50">短 (50)</option>
                  <option value="250">中 (250)</option>
                  <option value="500">長 (500)</option>
                </select>
              </label>
            </div>
          </div>
          
          <div>
            <span style={{ color: isConnected ? 'green' : 'red', fontWeight: 'bold' }}>
              {isConnected ? '接続中' : '未接続'}
            </span>
          </div>
        </div>
        
        <Filters 
          showLeaderPaths={showLeaderPaths}
          setShowLeaderPaths={setShowLeaderPaths}
          showPenguins={showPenguins}
          setShowPenguins={setShowPenguins}
          showEnemies={showEnemies}
          setShowEnemies={setShowEnemies}
        />
        
        <div style={{ position: 'relative' }}>
          <canvas 
            ref={canvasRef} 
            width={800} 
            height={600} 
            style={{ border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>
        
        <CoordinateDisplay coordinates={coordinates} />
        
        <FollowersGraph penguins={penguins} />
      </GridContainer>
      
      <Legend penguins={penguins} enemies={enemies} />
    </MapContainer>
  );
};

export default PenguinMap;