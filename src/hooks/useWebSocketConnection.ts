import { useState, useEffect, useRef } from 'react';
import { PenguinData, EnemyData, WebSocketMessage } from '../types/entityTypes';
import { PathPoint } from '../components/LeaderPathDrawer';

interface WebSocketConnectionResult {
  penguins: PenguinData[];
  enemies: EnemyData[];
  isConnected: boolean;
  leaderPaths: Map<string, PathPoint[]>;
  coordinates: {
    x: { min: number; max: number };
    z: { min: number; max: number };
  };
}

/**
 * Custom hook for WebSocket connection and data handling
 * @param pathMaxLength Maximum length of leader paths
 * @returns Connection state and entity data
 */
export const useWebSocketConnection = (pathMaxLength: number): WebSocketConnectionResult => {
  const [penguins, setPenguins] = useState<PenguinData[]>([]);
  const [enemies, setEnemies] = useState<EnemyData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [leaderPaths, setLeaderPaths] = useState<Map<string, PathPoint[]>>(new Map());
  // useRefを使用して最新の状態を参照できるようにする
  const leaderPathsRef = useRef<Map<string, PathPoint[]>>(new Map());
  const [coordinates, setCoordinates] = useState({
    x: { min: 0, max: 0 },
    z: { min: 0, max: 0 }
  });

  // leaderPathsが更新されたらrefも更新
  useEffect(() => {
    leaderPathsRef.current = leaderPaths;
    // console.log('leaderPathsRef updated from state:', {
    //   mapSize: leaderPaths.size,
    //   paths: Array.from(leaderPaths.entries()).map(([key, path]) => ({
    //     name: key,
    //     length: path.length
    //   }))
    // });
  }, [leaderPaths]);

  useEffect(() => {
    const connectWebSocket = () => {
      const host = window.location.hostname;
      const socket = new WebSocket(`ws://${host}:52697`);

      socket.onopen = () => {
        // console.log('Connected to WebSocket server');
        setIsConnected(true);
      };

      socket.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          if (data.type === 'entityUpdate') {
            setPenguins(data.penguins || []);
            setEnemies(data.enemies || []);
            
            // Update leader paths - 深いコピーを作成
            const newLeaderPaths = new Map<string, PathPoint[]>();
            // 現在の経路データを深いコピーで複製
            leaderPathsRef.current.forEach((path, key) => {
              newLeaderPaths.set(key, [...path]); // 配列の新しいコピーを作成
            });
            
            console.log('Current leader paths before update (from ref):', {
              mapSize: leaderPathsRef.current.size,
              paths: Array.from(leaderPathsRef.current.entries()).map(([key, path]) => ({
                name: key,
                length: path.length
              }))
            });
            
            // リーダーペンギンの位置を記録
            const leaderNames = ['Luca', 'Milo', 'Ellie', 'Sora'];
            
            data.penguins.forEach(penguin => {
              // リーダーペンギンまたはプレイヤー操作中のペンギンの経路を記録
              if (leaderNames.includes(penguin.name) || penguin.isPlayable || penguin.followerCount > 0) {
                const pathKey = penguin.name || penguin.penguinId;
                const existingPath = newLeaderPaths.get(pathKey) || [];
                
                // Miloの場合は詳細なログを出力
                const isMilo = penguin.name === 'Milo';
                
                if (isMilo) {
                  console.log(`[WebSocket] Milo data received:`, {
                    position: penguin.position,
                    status: penguin.status,
                    currentTarget: penguin.currentTarget,
                    followerCount: penguin.followerCount,
                    existingPathLength: existingPath.length,
                    lastPathPoint: existingPath.length > 0 ? existingPath[existingPath.length - 1] : 'none'
                  });
                } else {
                  // console.log(`Processing penguin ${pathKey}:`, {
                  //   isLeader: leaderNames.includes(penguin.name),
                  //   isPlayable: penguin.isPlayable,
                  //   followerCount: penguin.followerCount,
                  //   position: penguin.position,
                  //   existingPathLength: existingPath.length
                  // });
                }
                
                // Add new point if position changed significantly
                const lastPoint = existingPath[existingPath.length - 1];
                if (!lastPoint || 
                    Math.abs(lastPoint.x - penguin.position.x) > 0.5 || 
                    Math.abs(lastPoint.z - penguin.position.z) > 0.5) {
                  
                  if (isMilo) {
                    console.log(`[WebSocket] Adding new point for Milo:`, {
                      position: penguin.position,
                      lastPoint: lastPoint ? { x: lastPoint.x, z: lastPoint.z, age: (Date.now() - lastPoint.timestamp) / 1000 + 's ago' } : 'none',
                      positionDiff: lastPoint ? { 
                        x: Math.abs(lastPoint.x - penguin.position.x), 
                        z: Math.abs(lastPoint.z - penguin.position.z) 
                      } : 'none'
                    });
                  } else {
                    // console.log(`Adding new point for ${pathKey}:`, {
                    //   position: penguin.position,
                    //   lastPoint: lastPoint ? { x: lastPoint.x, z: lastPoint.z } : 'none'
                    // });
                  }
                  
                  const newPath = [...existingPath, {
                    x: penguin.position.x,
                    z: penguin.position.z,
                    timestamp: Date.now()
                  }];
                  
                  // Limit path length
                  if (newPath.length > pathMaxLength) {
                    newPath.shift();
                    // console.log(`Path for ${pathKey} exceeded max length, shifted oldest point`);
                  }
                  
                  newLeaderPaths.set(pathKey, newPath);
                  
                  if (isMilo) {
                    console.log(`[WebSocket] Updated Milo's path, new length: ${newPath.length}, latest point:`, newPath[newPath.length - 1]);
                  } else {
                    // console.log(`Updated path for ${pathKey}, new length: ${newPath.length}`);
                  }
                } else {
                  if (isMilo) {
                    console.log(`[WebSocket] No significant position change for Milo, skipping point addition. Diff:`, {
                      x: lastPoint ? Math.abs(lastPoint.x - penguin.position.x) : 'no last point',
                      z: lastPoint ? Math.abs(lastPoint.z - penguin.position.z) : 'no last point'
                    });
                  } else {
                    // console.log(`No significant position change for ${pathKey}, skipping point addition`);
                  }
                }
              }
            });
            
            // console.log('Updated leader paths:', {
            //   mapSize: newLeaderPaths.size,
            //   paths: Array.from(newLeaderPaths.entries()).map(([key, path]) => ({
            //     name: key,
            //     length: path.length
            //   }))
            // });
            
            // 状態更新と同時にrefも更新（非同期更新の問題を回避）
            setLeaderPaths(newLeaderPaths);
            leaderPathsRef.current = newLeaderPaths;
            
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
            
            // 深いコピーを作成
            const newLeaderPaths = new Map<string, PathPoint[]>();
            leaderPathsRef.current.forEach((path, key) => {
              newLeaderPaths.set(key, [...path]); // 配列の新しいコピーを作成
            });
            
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
            
            // 状態更新と同時にrefも更新
            setLeaderPaths(newLeaderPaths);
            leaderPathsRef.current = newLeaderPaths;
            
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
          // console.error('Error parsing WebSocket message:', error);
        }
      };

      socket.onclose = () => {
        // console.log('Disconnected from WebSocket server');
        setIsConnected(false);
        setTimeout(connectWebSocket, 2000);
      };

      socket.onerror = (error) => {
        // console.error('WebSocket error:', error);
      };
    };

    connectWebSocket();
  }, []);

  return {
    penguins,
    enemies,
    isConnected,
    leaderPaths,
    coordinates
  };
};

export default useWebSocketConnection;