import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import sceneConfigs from '../config/sceneConfigs.json';
import { SceneConfig } from '../types/sceneConfig';
import { LeaderPathDrawer, PathPoint } from './LeaderPathDrawer';
import { PenguinData, EnemyData, WebSocketMessage } from '../types/entityTypes';

const MapContainer = styled.div`
  display: flex;
  gap: 20px;
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin: 20px;
`;

const GridContainer = styled.div`
  flex: 1;
`;

const LegendContainer = styled.div`
  width: 300px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  font-size: 12px;

  h3 {
    margin: 0 0 10px 0;
    font-size: 14px;
    color: #333;
    border-bottom: 1px solid #ddd;
    padding-bottom: 5px;
  }

  .legend-section {
    margin-bottom: 20px;
  }

  .legend-item {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    gap: 8px;
  }

  .color-box {
    width: 12px;
    height: 12px;
    border: 1px solid #000;
  }

  .state-name {
    color: #666;
  }
`;

const FollowersGraph = styled.div`
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;

  h3 {
    margin: 0 0 15px 0;
    font-size: 14px;
    color: #333;
    border-bottom: 1px solid #ddd;
    padding-bottom: 5px;
  }

  .graph-bar {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    gap: 10px;
  }

  .leader-name {
    width: 60px;
    font-size: 12px;
    color: #333;
  }

  .bar-container {
    flex-grow: 1;
    height: 20px;
    background-color: #e9ecef;
    border-radius: 4px;
    overflow: hidden;
  }

  .bar {
    height: 100%;
    background-color: #9C27B0;
    transition: width 0.3s ease;
  }

  .count {
    width: 30px;
    font-size: 12px;
    color: #666;
    text-align: right;
  }
`;

const CoordinateInfo = styled.div`
  margin-top: 20px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
  font-family: monospace;
  
  h3 {
    margin: 0 0 10px 0;
    color: #2c3e50;
  }
  
  div {
    display: flex;
    gap: 20px;
  }
  
  span {
    color: #666;
  }
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  justify-content: center;
`;

const FilterButton = styled.button<{ active: boolean }>`
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  background-color: ${props => props.active ? '#2c3e50' : '#e0e0e0'};
  color: ${props => props.active ? 'white' : 'black'};
  cursor: pointer;
  font-weight: bold;
  
  &:hover {
    background-color: ${props => props.active ? '#2c3e50' : '#c0c0c0'};
  }
`;

const PenguinMap = () => {
  const [penguins, setPenguins] = useState<PenguinData[]>([]);
  const [enemies, setEnemies] = useState<EnemyData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedScene, setSelectedScene] = useState<string>('Proto');
  const [showLeaderPaths, setShowLeaderPaths] = useState(true);
  const [showEnemies, setShowEnemies] = useState(true);
  const [showPenguins, setShowPenguins] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const leaderPathDrawerRef = useRef<LeaderPathDrawer | null>(null);
  const [leaderPaths, setLeaderPaths] = useState<Map<string, PathPoint[]>>(new Map());
  const [pathMaxLength, setPathMaxLength] = useState<number>(250); // 経路の最大ポイント数
  const [coordinates, setCoordinates] = useState({
    x: { min: 0, max: 0 },
    z: { min: 0, max: 0 }
  });

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

  useEffect(() => {
    const connectWebSocket = () => {
      const host = window.location.hostname;
      const socket = new WebSocket(`ws://${host}:52697`);

      socket.onopen = () => {
        console.log('Connected to WebSocket server');
        setIsConnected(true);
      };

      socket.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          if (data.type === 'entityUpdate') {
            setPenguins(data.penguins || []);
            setEnemies(data.enemies || []);
            
            // Update leader paths
            const newLeaderPaths = new Map<string, PathPoint[]>(leaderPaths);
            
            // リーダーペンギンの位置を記録
            const leaderNames = ['Luca', 'Milo', 'Ellie', 'Sora'];
            
            data.penguins.forEach(penguin => {
              // リーダーペンギンまたはプレイヤー操作中のペンギンの経路を記録
              if (leaderNames.includes(penguin.name) || penguin.isPlayable || penguin.followerCount > 0) {
                const pathKey = penguin.name || penguin.penguinId;
                const existingPath = newLeaderPaths.get(pathKey) || [];
                
                // Add new point if position changed significantly
                const lastPoint = existingPath[existingPath.length - 1];
                if (!lastPoint || 
                    Math.abs(lastPoint.x - penguin.position.x) > 0.5 || 
                    Math.abs(lastPoint.z - penguin.position.z) > 0.5) {
                  
                  const newPath = [...existingPath, {
                    x: penguin.position.x,
                    z: penguin.position.z,
                    timestamp: Date.now()
                  }];
                  
                  // Limit path length
                  if (newPath.length > pathMaxLength) {
                    newPath.shift();
                  }
                  
                  newLeaderPaths.set(pathKey, newPath);
                }
              }
            });
            setLeaderPaths(newLeaderPaths);
            
            // 座標情報を更新
            if (data.penguins.length > 0) {
              const xCoords = data.penguins.map(p => p.position.x);
              const zCoords = data.penguins.map(p => p.position.z);
              setCoordinates({
                x: { min: Math.min(...xCoords), max: Math.max(...xCoords) },
                z: { min: Math.min(...zCoords), max: Math.max(...zCoords) }
              });
            }
          } else if (data.type === 'penguinUpdate') {
            // Backward compatibility
            setPenguins(data.penguins || []);
            
            // リーダーペンギンの位置を記録
            const leaderNames = ['Luca', 'Milo', 'Ellie', 'Sora'];
            const newLeaderPaths = new Map<string, PathPoint[]>(leaderPaths);
            
            data.penguins.forEach(penguin => {
              if (leaderNames.includes(penguin.name)) {
                const pathKey = penguin.name;
                const existingPath = newLeaderPaths.get(pathKey) || [];
                
                // Add new point if position changed significantly
                const lastPoint = existingPath[existingPath.length - 1];
                if (!lastPoint || 
                    Math.abs(lastPoint.x - penguin.position.x) > 0.5 || 
                    Math.abs(lastPoint.z - penguin.position.z) > 0.5) {
                  
                  const newPath = [...existingPath, {
                    x: penguin.position.x,
                    z: penguin.position.z,
                    timestamp: Date.now()
                  }];
                  
                  // Limit path length
                  if (newPath.length > pathMaxLength) {
                    newPath.shift();
                  }
                  
                  newLeaderPaths.set(pathKey, newPath);
                }
              }
            });
            setLeaderPaths(newLeaderPaths);
            
            // 座標情報を更新
            if (data.penguins.length > 0) {
              const xCoords = data.penguins.map(p => p.position.x);
              const zCoords = data.penguins.map(p => p.position.z);
              setCoordinates({
                x: { min: Math.min(...xCoords), max: Math.max(...xCoords) },
                z: { min: Math.min(...zCoords), max: Math.max(...zCoords) }
              });
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      socket.onclose = () => {
        console.log('Disconnected from WebSocket server');
        setIsConnected(false);
        setTimeout(connectWebSocket, 2000);
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    };

    connectWebSocket();
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Initialize leader path drawer
    if (!leaderPathDrawerRef.current) {
      // Create mapping functions for coordinates
      const mapX = (x: number) => mapValue(x, currentConfig.worldBounds.minX, currentConfig.worldBounds.maxX, 0, canvas.width);
      const mapZ = (z: number) => mapValue(z, currentConfig.worldBounds.minZ, currentConfig.worldBounds.maxZ, 0, canvas.height);
      
      leaderPathDrawerRef.current = new LeaderPathDrawer(ctx, mapX, mapZ);
    }
    
    const draw = () => {
      if (!ctx || !canvas) return;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw background
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 座標変換関数（Y軸は上下反転させる）
      const scaleX = (x: number) => {
        return ((x - currentConfig.worldBounds.minX) / (currentConfig.worldBounds.maxX - currentConfig.worldBounds.minX)) * canvas.width;
      };
      const scaleZ = (z: number) => {
        // Z座標は上下反転させる（Unityの座標系に合わせる）
        return canvas.height - ((z - currentConfig.worldBounds.minZ) / (currentConfig.worldBounds.maxZ - currentConfig.worldBounds.minZ)) * canvas.height;
      };
      
      // グリッドを描画（10単位でメジャーライン、1単位でマイナーライン）
      const drawGridLine = (x1: number, y1: number, x2: number, y2: number, isMajor: boolean) => {
        ctx.beginPath();
        ctx.strokeStyle = isMajor ? '#ccc' : '#eee';
        ctx.lineWidth = isMajor ? 1 : 0.5;
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      };

      // グリッド線の開始と終了位置を計算
      const xStart = Math.floor(currentConfig.worldBounds.minX / 2) * 2;  // 2単位で切り捨て
      const xEnd = Math.ceil(currentConfig.worldBounds.maxX / 2) * 2;     // 2単位で切り上げ
      const zStart = Math.floor(currentConfig.worldBounds.minZ / 2) * 2;
      const zEnd = Math.ceil(currentConfig.worldBounds.maxZ / 2) * 2;

      // X軸のグリッド線
      for (let x = xStart; x <= xEnd; x += 1) {
        const screenX = scaleX(x);
        const isMajor = x % 10 === 0;
        if (isMajor || x % 2 === 0) {  // 2単位ごとに線を引く
          drawGridLine(screenX, 0, screenX, canvas.height, isMajor);
        }
      }

      // Z軸のグリッド線
      for (let z = zStart; z <= zEnd; z += 1) {
        const screenZ = scaleZ(z);
        const isMajor = z % 10 === 0;
        if (isMajor || z % 2 === 0) {  // 2単位ごとに線を引く
          drawGridLine(0, screenZ, canvas.width, screenZ, isMajor);
        }
      }

      // 軸ラベルの描画
      ctx.fillStyle = '#666';
      ctx.font = '12px Arial';
      
      // X軸のラベル（下側）
      for (let x = Math.floor(currentConfig.worldBounds.minX / 10) * 10; x <= Math.ceil(currentConfig.worldBounds.maxX / 10) * 10; x += 10) {
        const screenX = scaleX(x);
        // ラベルの位置を調整して、マイナス値も見やすく表示
        const labelWidth = ctx.measureText(x.toString()).width;
        ctx.fillText(x.toString(), screenX - labelWidth / 2, canvas.height - 5);
      }
      
      // Z軸のラベル（左側）
      for (let z = Math.floor(currentConfig.worldBounds.minZ / 10) * 10; z <= Math.ceil(currentConfig.worldBounds.maxZ / 10) * 10; z += 10) {
        const screenZ = scaleZ(z);
        // Z軸は上下が反転しているので、ラベルも反転した位置に表示
        ctx.fillText(z.toString(), 5, screenZ + 4);
      }
      
      // 原点（0,0）の位置を強調
      const originX = scaleX(0);
      const originZ = scaleZ(0);
      ctx.beginPath();
      ctx.arc(originX, originZ, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ff0000';
      ctx.fill();
      
      // Draw leader paths if enabled
      if (showLeaderPaths && leaderPathDrawerRef.current) {
        leaderPathDrawerRef.current.drawPaths(Array.from(leaderPaths.entries()));
      }
      
      // Draw penguins
      if (showPenguins) {
        // リーダーの名前リスト
        const leaderNames = ['Luca', 'Milo', 'Ellie', 'Sora'];

        // ペンギンの状態に応じた色を取得する関数
        const getPenguinColor = (penguin: PenguinData): string => {
          const isLeader = leaderNames.includes(penguin.name);

          // 状態の優先順位に基づいて色を決定
          
          // 1. 物理的状態（最優先）
          if (penguin.physicalState === 'DOWN' || penguin.physicalState === 'Down') return '#FF0000';     // 赤: ダウン状態
          if (penguin.physicalState === 'FLEEZE' || penguin.physicalState === 'Freeze') return '#00FFFF';   // 水色: 凍結状態

          // 2. 特殊な行動状態
          if (penguin.status === 'Leader_At_Goal' || penguin.currentTarget === 'LEADER_FOUND_GOAL') return '#FFD700';  // 金: ゴール到達
          if (penguin.status === 'Goal' || penguin.isGoal) return '#4CAF50';     // 緑: ゴールへ向かう
          if (penguin.status === 'RunAway' || penguin.currentTarget === 'RUNAWAY') return '#FF9800';  // オレンジ: 逃走中
          if (penguin.status === 'Chase') return '#FF6B6B';    // ピンク: 追跡中

          // 3. リーダー特有の状態
          if (isLeader) {
            if (penguin.status === 'Leading') return '#9C27B0';  // 紫: リーダー行動中
            if (penguin.status === 'Waiting') return '#607D8B';  // グレー: 待機中
            return '#8E24AA';  // 薄紫: その他のリーダー状態
          }

          // 4. 一般ペンギンの行動状態
          if (penguin.status === 'Following' || penguin.currentTarget === 'LEADER') return '#2196F3';  // 青: 追従中
          if (penguin.status === 'Patrol' || penguin.currentTarget === 'Patrol') return '#3F51B5';    // インディゴ: パトロール中
          if (penguin.status === 'Idle') return '#607D8B';      // グレー: 待機中
          if (penguin.status === 'NextStage' || penguin.currentTarget === 'NextStage') return '#009688'; // ティール: 次ステージへ

          // 5. デフォルト状態
          return '#1976D2';  // デフォルトの青
        };

        penguins.forEach(penguin => {
          const worldX = penguin.position.x;
          const worldZ = penguin.position.z;
          
          // Convert world coordinates to canvas coordinates
          const canvasX = mapValue(worldX, currentConfig.worldBounds.minX, currentConfig.worldBounds.maxX, 0, canvas.width);
          const canvasY = canvas.height - mapValue(worldZ, currentConfig.worldBounds.minZ, currentConfig.worldBounds.maxZ, 0, canvas.height);
          
          const color = getPenguinColor(penguin);
          const baseSize = leaderNames.includes(penguin.name) ? 12 : 8; // リーダーはより大きく

          // プレイヤー操作中の場合の二重円
          if (penguin.isPlayable) {
            ctx.beginPath();
            ctx.arc(canvasX, canvasY, baseSize + 4, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 215, 0, 0.3)'; // 薄い金色
            ctx.fill();
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.stroke();
          }

          if (leaderNames.includes(penguin.name)) {
            // リーダーペンギンは星形で表示
            const drawStar = (size: number) => {
              ctx.beginPath();
              for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                const radius = i % 2 === 0 ? size : size * 0.5;
                const x1 = canvasX + radius * Math.cos(angle);
                const y1 = canvasY + radius * Math.sin(angle);
                if (i === 0) {
                  ctx.moveTo(x1, y1);
                } else {
                  ctx.lineTo(x1, y1);
                }
              }
              ctx.closePath();
            };

            // 星を描画
            drawStar(baseSize);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // ゴール発見状態の表示
            if (penguin.currentTarget === 'LEADER_FOUND_GOAL') {
              ctx.fillStyle = '#FFD700';
              ctx.beginPath();
              ctx.arc(canvasX - baseSize - 4, canvasY - baseSize - 4, 4, 0, Math.PI * 2);
              ctx.fill();
              ctx.strokeStyle = '#000';
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          } else {
            // 一般ペンギンは円で表示
            ctx.beginPath();
            ctx.arc(canvasX, canvasY, baseSize, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }

          // ペンギンの名前を表示
          ctx.fillStyle = '#000';
          ctx.font = '14px Arial';
          ctx.fillText(penguin.name, canvasX + baseSize + 4, canvasY + 4);
        });
      }
      
      // Draw enemies
      if (showEnemies) {
        // Generate a unique color for each enemy based on their ID
        const getEnemyColor = (enemyId: string, isAttacking: boolean): string => {
          if (isAttacking) {
            return '#FF0000'; // Bright red for attacking enemies
          }
          
          // Create a hash from the enemy ID to generate a consistent color
          let hash = 0;
          for (let i = 0; i < enemyId.length; i++) {
            hash = enemyId.charCodeAt(i) + ((hash << 5) - hash);
          }
          
          // Generate a red shade (keeping R high, varying G and B in lower ranges)
          const r = 220 + (hash & 35);  // 220-255 range for red
          const g = 20 + (hash & 60);   // 20-80 range for green
          const b = 20 + (hash & 60);   // 20-80 range for blue
          
          return `rgb(${r}, ${g}, ${b})`;
        };
        
        enemies.forEach(enemy => {
          const worldX = enemy.position.x;
          const worldZ = enemy.position.z;
          
          // Convert world coordinates to canvas coordinates
          const canvasX = mapValue(worldX, currentConfig.worldBounds.minX, currentConfig.worldBounds.maxX, 0, canvas.width);
          const canvasY = canvas.height - mapValue(worldZ, currentConfig.worldBounds.minZ, currentConfig.worldBounds.maxZ, 0, canvas.height);
          
          // Get color based on enemy ID and state
          const enemyColor = getEnemyColor(enemy.enemyId, enemy.isAttacking);
          ctx.fillStyle = enemyColor;
          
          // Draw enemy as a triangle
          ctx.beginPath();
          ctx.moveTo(canvasX, canvasY - 8);
          ctx.lineTo(canvasX - 7, canvasY + 4);
          ctx.lineTo(canvasX + 7, canvasY + 4);
          ctx.closePath();
          ctx.fill();
          
          // Draw name with enemy ID for better identification
          ctx.fillStyle = '#000000';
          ctx.font = '10px Arial';
          ctx.fillText(`${enemy.name} (${enemy.enemyId.substring(0, 4)})`, canvasX + 8, canvasY + 4);
          
          // Draw guard radius if applicable
          if (enemy.areaGuardEnabled) {
            const guardRadiusCanvas = mapValue(enemy.guardRadius, 0, 
              currentConfig.worldBounds.maxX - currentConfig.worldBounds.minX, 
              0, canvas.width);
            
            ctx.beginPath();
            // Use a transparent version of the enemy color for the guard radius
            ctx.strokeStyle = `${enemyColor.replace('rgb', 'rgba').replace(')', ', 0.3)')}`;
            ctx.lineWidth = 1;
            ctx.arc(canvasX, canvasY, guardRadiusCanvas, 0, Math.PI * 2);
            ctx.stroke();
          }
        });
      }
      
      requestAnimationFrame(draw);
    };
    
    draw();
  }, [penguins, enemies, currentConfig, showLeaderPaths, showEnemies, showPenguins, leaderPaths]);

  // Helper function to map values from one range to another
  const mapValue = (value: number, inMin: number, inMax: number, outMin: number, outMax: number): number => {
    return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
  };

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
                リーダー経路表示
              </label>
            </div>
            
            <div>
              <label>
                <input 
                  type="checkbox" 
                  checked={showPenguins} 
                  onChange={(e) => setShowPenguins(e.target.checked)} 
                />
                ペンギン表示
              </label>
            </div>
            
            <div>
              <label>
                <input 
                  type="checkbox" 
                  checked={showEnemies} 
                  onChange={(e) => setShowEnemies(e.target.checked)} 
                />
                敵表示
              </label>
            </div>
            
            <div>
              <label>経路の長さ: </label>
              <select 
                value={pathMaxLength} 
                onChange={(e) => changePathMaxLength(Number(e.target.value))}
              >
                <option value="250">250 ポイント</option>
                <option value="500">500 ポイント</option>
                <option value="1000">1000 ポイント</option>
              </select>
            </div>
          </div>
        </div>
        
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={800} 
          style={{ border: '1px solid #ccc', borderRadius: '4px' }}
        />
        
        <CoordinateInfo>
          <h3>座標範囲</h3>
          <div>
            <div>
              <span>マップ範囲: </span>
              X: {currentConfig.worldBounds.minX} 〜 {currentConfig.worldBounds.maxX}, Z: {currentConfig.worldBounds.minZ} 〜 {currentConfig.worldBounds.maxZ}
            </div>
          </div>
          <div style={{ marginTop: '10px' }}>
            <div>
              <span>現在のペンギンの位置範囲: </span>
            </div>
            <div style={{ marginLeft: '20px' }}>
              <div>
                <span>X: </span>
                {coordinates.x.min.toFixed(2)} 〜 {coordinates.x.max.toFixed(2)}
              </div>
              <div>
                <span>Z: </span>
                {coordinates.z.min.toFixed(2)} 〜 {coordinates.z.max.toFixed(2)}
              </div>
            </div>
          </div>
        </CoordinateInfo>
      </GridContainer>
      
      <LegendContainer>
        <div style={{ marginBottom: '10px', padding: '8px 16px', borderRadius: '20px', backgroundColor: isConnected ? '#4CAF50' : '#F44336', color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
        
        <FollowersGraph>
          <h3>リーダーごとのフォロワー数</h3>
          {['Luca', 'Milo', 'Ellie', 'Sora'].map(leaderName => {
            const leader = penguins.find(p => p.name === leaderName);
            const followerCount = leader?.followerCount || 0;
            const maxFollowers = Math.max(...penguins.filter(p => ['Luca', 'Milo', 'Ellie', 'Sora'].includes(p.name)).map(p => p.followerCount || 0));
            const percentage = maxFollowers > 0 ? (followerCount / maxFollowers) * 100 : 0;

            return (
              <div key={leaderName} className="graph-bar">
                <div className="leader-name">{leaderName}</div>
                <div className="bar-container">
                  <div className="bar" style={{ width: `${percentage}%` }} />
                </div>
                <div className="count">{followerCount}</div>
              </div>
            );
          })}
        </FollowersGraph>
        
        <div className="legend-section">
          <h3>物理的状態 (PhysicalState)</h3>
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: '#FF0000' }} />
            <span>Down/DOWN - ダウン状態</span>
          </div>
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: '#00FFFF' }} />
            <span>Freeze/FLEEZE - 凍結状態</span>
          </div>
        </div>

        <div className="legend-section">
          <h3>ゴール関連状態</h3>
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: '#FFD700' }} />
            <span>ゴール発見 (Target: LEADER_FOUND_GOAL)</span>
          </div>
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: '#4CAF50' }} />
            <span>ゴールへ向かう (Status: Goal / isGoal: true)</span>
          </div>
        </div>

        <div className="legend-section">
          <h3>特殊な行動状態</h3>
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: '#FF9800' }} />
            <span>逃走中 (Status: RunAway / Target: RUNAWAY)</span>
          </div>
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: '#FF6B6B' }} />
            <span>追跡中 (Status: Chase)</span>
          </div>
        </div>

        <div className="legend-section">
          <h3>リーダー経路</h3>
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: '#9C27B0' }} />
            <span>Luca の経路</span>
          </div>
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: '#2196F3' }} />
            <span>Milo の経路</span>
          </div>
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: '#FF9800' }} />
            <span>Ellie の経路</span>
          </div>
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: '#4CAF50' }} />
            <span>Sora の経路</span>
          </div>
        </div>
        
        <div className="legend-section">
          <h3>敵の状態</h3>
          <div className="legend-item">
            <div style={{ width: '0', height: '0', borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderBottom: '20px solid #D02020', marginRight: '8px' }} />
            <span>通常の敵</span>
          </div>
          <div className="legend-item">
            <div style={{ width: '0', height: '0', borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderBottom: '20px solid #FF0000', marginRight: '8px' }} />
            <span>攻撃中の敵</span>
          </div>
        </div>
        
        <div className="legend-section">
          <h3>統計情報</h3>
          <div>ペンギン数: {penguins.length}</div>
          <div>敵の数: {enemies.length}</div>
        </div>
      </LegendContainer>
    </MapContainer>
  );
};

export default PenguinMap;