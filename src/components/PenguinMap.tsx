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
  const [selectedScene, setSelectedScene] = useState<string>('default');
  const [showLeaderPaths, setShowLeaderPaths] = useState(true);
  const [showEnemies, setShowEnemies] = useState(true);
  const [showPenguins, setShowPenguins] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const leaderPathDrawerRef = useRef<LeaderPathDrawer | null>(null);
  const [leaderPaths, setLeaderPaths] = useState<Map<string, PathPoint[]>>(new Map());

  // Get available scene configurations
  const sceneOptions = Object.keys(sceneConfigs);
  const currentConfig: SceneConfig = (sceneConfigs as any)[selectedScene] || (sceneConfigs as any).default;

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
            data.penguins.forEach(penguin => {
              if (penguin.isPlayable || penguin.followerCount > 0) {
                const pathKey = penguin.penguinId;
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
                  if (newPath.length > 100) {
                    newPath.shift();
                  }
                  
                  newLeaderPaths.set(pathKey, newPath);
                }
              }
            });
            setLeaderPaths(newLeaderPaths);
          } else if (data.type === 'penguinUpdate') {
            // Backward compatibility
            setPenguins(data.penguins || []);
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
      leaderPathDrawerRef.current = new LeaderPathDrawer(canvas);
    }
    
    const draw = () => {
      if (!ctx || !canvas) return;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw background
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw grid
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;
      
      const gridSize = 10;
      const gridSpacing = canvas.width / gridSize;
      
      for (let i = 0; i <= gridSize; i++) {
        const pos = i * gridSpacing;
        
        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, canvas.height);
        ctx.stroke();
        
        // Horizontal lines
        ctx.beginPath();
        ctx.moveTo(0, pos);
        ctx.lineTo(canvas.width, pos);
        ctx.stroke();
      }
      
      // Draw leader paths if enabled
      if (showLeaderPaths && leaderPathDrawerRef.current) {
        leaderPathDrawerRef.current.drawPaths(Array.from(leaderPaths.entries()));
      }
      
      // Draw penguins
      if (showPenguins) {
        penguins.forEach(penguin => {
          const worldX = penguin.position.x;
          const worldZ = penguin.position.z;
          
          // Convert world coordinates to canvas coordinates
          const canvasX = mapValue(worldX, currentConfig.worldBounds.minX, currentConfig.worldBounds.maxX, 0, canvas.width);
          const canvasY = mapValue(worldZ, currentConfig.worldBounds.minZ, currentConfig.worldBounds.maxZ, 0, canvas.height);
          
          // Draw penguin
          ctx.beginPath();
          
          // Different colors for different penguin types
          if (penguin.isPlayable) {
            ctx.fillStyle = '#4CAF50'; // Green for playable
          } else if (penguin.followerCount > 0) {
            ctx.fillStyle = '#2196F3'; // Blue for leaders
          } else {
            ctx.fillStyle = '#9E9E9E'; // Gray for regular penguins
          }
          
          ctx.arc(canvasX, canvasY, 5, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw name for important penguins
          if (penguin.isPlayable || penguin.followerCount > 0) {
            ctx.fillStyle = '#000000';
            ctx.font = '10px Arial';
            ctx.fillText(penguin.name, canvasX + 8, canvasY + 4);
          }
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
          const canvasY = mapValue(worldZ, currentConfig.worldBounds.minZ, currentConfig.worldBounds.maxZ, 0, canvas.height);
          
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
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={800} 
          style={{ border: '1px solid #ccc', borderRadius: '4px' }}
        />
      </GridContainer>
      
      <LegendContainer>
        <h3>Map Controls</h3>
        
        <div>
          <label>Scene: </label>
          <select 
            value={selectedScene} 
            onChange={(e) => setSelectedScene(e.target.value)}
          >
            {sceneOptions.map(scene => (
              <option key={scene} value={scene}>{scene}</option>
            ))}
          </select>
        </div>
        
        <div style={{ marginTop: '20px' }}>
          <label>
            <input 
              type="checkbox" 
              checked={showLeaderPaths} 
              onChange={(e) => setShowLeaderPaths(e.target.checked)} 
            />
            Show Leader Paths
          </label>
        </div>
        
        <div>
          <label>
            <input 
              type="checkbox" 
              checked={showPenguins} 
              onChange={(e) => setShowPenguins(e.target.checked)} 
            />
            Show Penguins
          </label>
        </div>
        
        <div>
          <label>
            <input 
              type="checkbox" 
              checked={showEnemies} 
              onChange={(e) => setShowEnemies(e.target.checked)} 
            />
            Show Enemies
          </label>
        </div>
        
        <div style={{ marginTop: '20px' }}>
          <h4>Legend</h4>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#4CAF50', marginRight: '8px' }}></div>
            <span>Playable Penguin</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#2196F3', marginRight: '8px' }}></div>
            <span>Leader Penguin</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#9E9E9E', marginRight: '8px' }}></div>
            <span>Regular Penguin</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ width: '0', height: '0', borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderBottom: '20px solid #D02020', marginRight: '8px' }}></div>
            <span>Enemy (Red Shades)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ width: '0', height: '0', borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderBottom: '20px solid #FF0000', marginRight: '8px' }}></div>
            <span>Attacking Enemy</span>
          </div>
        </div>
        
        <div style={{ marginTop: '20px' }}>
          <h4>Stats</h4>
          <div>Penguins: {penguins.length}</div>
          <div>Enemies: {enemies.length}</div>
          <div>Connection: {isConnected ? 'Connected' : 'Disconnected'}</div>
        </div>
      </LegendContainer>
    </MapContainer>
  );
};

export default PenguinMap;