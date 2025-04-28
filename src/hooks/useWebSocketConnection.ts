import { useState, useEffect } from 'react';
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
  const [coordinates, setCoordinates] = useState({
    x: { min: 0, max: 0 },
    z: { min: 0, max: 0 }
  });

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

  return {
    penguins,
    enemies,
    isConnected,
    leaderPaths,
    coordinates
  };
};

export default useWebSocketConnection;