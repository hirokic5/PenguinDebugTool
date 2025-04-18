import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

interface PenguinData {
  penguinId: string;
  name: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
}

interface WebSocketMessage {
  type: 'penguinUpdate';
  penguins: PenguinData[];
}

const MapContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin: 20px;
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

const Canvas = styled.canvas`
  border: 1px solid #ddd;
  border-radius: 4px;
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

const PenguinMap = () => {
  const [penguins, setPenguins] = useState<PenguinData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [coordinates, setCoordinates] = useState({
    x: { min: 0, max: 0 },
    z: { min: 0, max: 0 }
  });

  // WebSocket接続の設定
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

  // マップの描画
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 座標の最大値と最小値を計算
    if (penguins.length > 0) {
      const xCoords = penguins.map(p => p.position.x);
      const zCoords = penguins.map(p => p.position.z);
      console.log('X座標範囲:', {
        min: Math.min(...xCoords),
        max: Math.max(...xCoords)
      });
      console.log('Z座標範囲:', {
        min: Math.min(...zCoords),
        max: Math.max(...zCoords)
      });
    }

    // キャンバスのクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 背景色を設定
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 固定の座標範囲を設定
    const xMin = -0.2;
    const xMax = 80;
    const zMin = -0.2;
    const zMax = 100;

    // 座標変換関数（Y軸は上下反転させる）
    const scaleX = (x: number) => {
      return ((x - xMin) / (xMax - xMin)) * canvas.width;
    };
    const scaleZ = (z: number) => {
      // Z座標は上下反転させる（Unityの座標系に合わせる）
      return canvas.height - ((z - zMin) / (zMax - zMin)) * canvas.height;
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

    // X軸のグリッド線
    for (let x = 0; x <= xMax; x += 1) {
      const screenX = scaleX(x);
      const isMajor = x % 10 === 0;
      if (isMajor || x % 2 === 0) {  // 2単位ごとに線を引く
        drawGridLine(screenX, 0, screenX, canvas.height, isMajor);
      }
    }

    // Z軸のグリッド線
    for (let z = 0; z <= zMax; z += 1) {
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
    for (let x = 0; x <= xMax; x += 10) {
      const screenX = scaleX(x);
      ctx.fillText(x.toString(), screenX - 10, canvas.height - 5);
    }
    
    // Z軸のラベル（左側）
    for (let z = 0; z <= zMax; z += 10) {
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
    
    // 座標情報を更新（実際のペンギンの位置も表示）
    if (penguins.length > 0) {
      const xCoords = penguins.map(p => p.position.x);
      const zCoords = penguins.map(p => p.position.z);
      setCoordinates({
        x: { min: Math.min(...xCoords), max: Math.max(...xCoords) },
        z: { min: Math.min(...zCoords), max: Math.max(...zCoords) }
      });
    }

    // ペンギンの位置をプロット
    penguins.forEach(penguin => {
      const x = scaleX(penguin.position.x);
      const z = scaleZ(penguin.position.z);

      // ペンギンを表す円を描画
      ctx.beginPath();
      ctx.arc(x, z, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#1976D2';
      ctx.fill();

      // ペンギンの名前を表示
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.fillText(penguin.name, x + 8, z + 4);
    });
  }, [penguins]);

  return (
    <MapContainer>
      <ConnectionStatus isConnected={isConnected}>
        {isConnected ? 'Connected' : 'Disconnected'}
      </ConnectionStatus>
      <Canvas ref={canvasRef} width={800} height={800} />
      <CoordinateInfo>
        <h3>座標範囲</h3>
        <div>
          <div>
            <span>マップ範囲: </span>
            X: -0.2 〜 80.0, Z: -0.2 〜 100.0
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
    </MapContainer>
  );
};

export default PenguinMap;