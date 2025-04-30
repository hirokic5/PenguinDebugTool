import { useEffect, useState } from 'react';
import styled from 'styled-components';
import PenguinCard from './PenguinCard';
import EnemyCard from './EnemyCard';
import StaticAreaCard from './StaticAreaCard';
import { PenguinData, EnemyData, AreaData, WebSocketMessage } from '../types/entityTypes';

const Container = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
`;

const ConnectionStatus = styled.div<{ isConnected: boolean }>`
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 8px 16px;
  border-radius: 20px;
  background-color: ${props => props.isConnected ? '#4CAF50' : '#F44336'};
  color: white;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
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

const EntityCounter = styled.div`
  text-align: center;
  margin-bottom: 10px;
  font-size: 0.9em;
  color: #666;
`;

type FilterType = 'all' | 'penguins' | 'enemies' | 'areas';

const PenguinMonitor = () => {
  const [penguins, setPenguins] = useState<PenguinData[]>([]);
  const [enemies, setEnemies] = useState<EnemyData[]>([]);
  const [staticAreas, setStaticAreas] = useState<AreaData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    const connectWebSocket = () => {
      // 現在のホストのIPアドレスまたはホスト名を使用
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
            setStaticAreas(data.staticAreas || []);
          } else if (data.type === 'penguinUpdate') {
            // 後方互換性のため
            setPenguins(data.penguins || []);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      socket.onclose = () => {
        console.log('Disconnected from WebSocket server');
        setIsConnected(false);
        // Try to reconnect after 2 seconds
        setTimeout(connectWebSocket, 2000);
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      setWs(socket);
    };

    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  // フィルタリングされたエンティティを取得
  const filteredEntities = () => {
    switch (filter) {
      case 'penguins':
        return { penguins, enemies: [], staticAreas: [] };
      case 'enemies':
        return { penguins: [], enemies, staticAreas: [] };
      case 'areas':
        return { penguins: [], enemies: [], staticAreas };
      case 'all':
      default:
        return { penguins, enemies, staticAreas };
    }
  };

  const { penguins: filteredPenguins, enemies: filteredEnemies, staticAreas: filteredStaticAreas } = filteredEntities();

  return (
    <>
      <ConnectionStatus isConnected={isConnected}>
        {isConnected ? 'Connected' : 'Disconnected'}
      </ConnectionStatus>
      
      <FilterContainer>
        <FilterButton 
          active={filter === 'all'} 
          onClick={() => setFilter('all')}
        >
          All Entities
        </FilterButton>
        <FilterButton 
          active={filter === 'penguins'} 
          onClick={() => setFilter('penguins')}
        >
          Penguins Only
        </FilterButton>
        <FilterButton 
          active={filter === 'enemies'} 
          onClick={() => setFilter('enemies')}
        >
          Enemies Only
        </FilterButton>
        <FilterButton 
          active={filter === 'areas'} 
          onClick={() => setFilter('areas')}
        >
          Areas Only
        </FilterButton>
      </FilterContainer>
      
      <EntityCounter>
        Showing {filteredPenguins.length} penguins, {filteredEnemies.length} enemies, and {filteredStaticAreas.length} areas
      </EntityCounter>
      
      <Container>
        {filteredPenguins.map(penguin => (
          <PenguinCard
            key={penguin.penguinId}
            penguin={penguin}
          />
        ))}
        
        {filteredEnemies.map(enemy => (
          <EnemyCard
            key={enemy.enemyId}
            enemy={enemy}
          />
        ))}
        
        {filteredStaticAreas.map(area => (
          <StaticAreaCard
            key={area.areaId}
            area={area}
          />
        ))}
      </Container>
    </>
  );
};

export default PenguinMonitor;