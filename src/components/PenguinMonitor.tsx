import { useEffect, useState } from 'react';
import styled from 'styled-components';
import PenguinCard from './PenguinCard';

interface PenguinData {
  penguinId: string;
  name: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  status: string;
  currentTarget: string;
  isGoal: boolean;
  isPlayable: boolean;
  physicalState: string;
  leadership: number;
  stamina: number;
  speed: number;
  sensing: number;
  isMale: boolean;
  distanceToGoal: number;
  lastUpdate: number;
  followerCount: number;
  followingLeaderId: string;
  trustLevel: number;
}

interface WebSocketMessage {
  type: 'penguinUpdate';
  penguins: PenguinData[];
}

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

const PenguinMonitor = () => {
  const [penguins, setPenguins] = useState<PenguinData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);

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
          if (data.type === 'penguinUpdate') {
            setPenguins(data.penguins);
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

  return (
    <>
      <ConnectionStatus isConnected={isConnected}>
        {isConnected ? 'Connected' : 'Disconnected'}
      </ConnectionStatus>
      <Container>
        {penguins.map(penguin => (
          <PenguinCard
            key={penguin.penguinId}
            penguin={penguin}
          />
        ))}
      </Container>
    </>
  );
};

export default PenguinMonitor;