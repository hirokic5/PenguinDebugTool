import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import sceneConfigs from '../config/sceneConfigs.json';
import { SceneConfig } from '../types/sceneConfig';

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
}

interface WebSocketMessage {
  type: 'penguinUpdate';
  penguins: PenguinData[];
}

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

const SceneSelector = styled.div`
  margin-bottom: 20px;
  select {
    padding: 8px;
    border-radius: 4px;
    border: 1px solid #ddd;
    font-size: 14px;
    background-color: white;
    &:focus {
      outline: none;
      border-color: #2196F3;
    }
  }
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
  const [currentScene, setCurrentScene] = useState<string>("Proto");
  const sceneConfig = sceneConfigs.scenes[currentScene] as SceneConfig;

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
          console.log('Received WebSocket message:', data);
          if (data.type === 'penguinUpdate') {
            console.log('Penguin data:', data.penguins);
            setPenguins(data.penguins);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          console.error('Raw message:', event.data);
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

    // シーン設定から座標範囲を取得
    const { xMin, xMax, zMin, zMax } = sceneConfig;

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

    // グリッド線の開始と終了位置を計算
    const xStart = Math.floor(xMin / 2) * 2;  // 2単位で切り捨て
    const xEnd = Math.ceil(xMax / 2) * 2;     // 2単位で切り上げ
    const zStart = Math.floor(zMin / 2) * 2;
    const zEnd = Math.ceil(zMax / 2) * 2;

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
    for (let x = Math.floor(xMin / 10) * 10; x <= Math.ceil(xMax / 10) * 10; x += 10) {
      const screenX = scaleX(x);
      // ラベルの位置を調整して、マイナス値も見やすく表示
      const labelWidth = ctx.measureText(x.toString()).width;
      ctx.fillText(x.toString(), screenX - labelWidth / 2, canvas.height - 5);
    }
    
    // Z軸のラベル（左側）
    for (let z = Math.floor(zMin / 10) * 10; z <= Math.ceil(zMax / 10) * 10; z += 10) {
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

    // リーダーの名前リスト
    const leaderNames = ['Luca', 'Miro', 'Ellie', 'Sora'];

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

    // ペンギンの位置をプロット
    penguins.forEach(penguin => {
      const x = scaleX(penguin.position.x);
      const z = scaleZ(penguin.position.z);
      const color = getPenguinColor(penguin);
      const baseSize = leaderNames.includes(penguin.name) ? 12 : 8; // リーダーはより大きく

      // プレイヤー操作中の場合の二重円
      if (penguin.isPlayable) {
        ctx.beginPath();
        ctx.arc(x, z, baseSize + 4, 0, Math.PI * 2);
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
            const x1 = x + radius * Math.cos(angle);
            const y1 = z + radius * Math.sin(angle);
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
          ctx.arc(x - baseSize - 4, z - baseSize - 4, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      } else {
        // 一般ペンギンは円で表示
        ctx.beginPath();
        ctx.arc(x, z, baseSize, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // ペンギンの名前を表示
      ctx.fillStyle = '#000';
      ctx.font = '14px Arial';
      ctx.fillText(penguin.name, x + baseSize + 4, z + 4);
    });

    // キャンバス上の凡例は削除
  }, [penguins]);

  return (
    <MapContainer>
      <ConnectionStatus isConnected={isConnected}>
        {isConnected ? 'Connected' : 'Disconnected'}
      </ConnectionStatus>
      
      <GridContainer>
        <SceneSelector>
          <select value={currentScene} onChange={(e) => setCurrentScene(e.target.value)}>
            {Object.entries(sceneConfigs.scenes).map(([name, config]) => (
              <option key={name} value={name}>
                {name} - {config.description}
              </option>
            ))}
          </select>
        </SceneSelector>
        <Canvas ref={canvasRef} width={800} height={800} />
        <CoordinateInfo>
          <h3>座標範囲</h3>
          <div>
            <div>
              <span>マップ範囲: </span>
              X: {sceneConfig.xMin} 〜 {sceneConfig.xMax}, Z: {sceneConfig.zMin} 〜 {sceneConfig.zMax}
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
          <h3>リーダー状態 (Luca, Miro, Ellie, Sora)</h3>
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: '#9C27B0' }} />
            <span>リーダー行動中 (Status: Leading)</span>
          </div>
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: '#607D8B' }} />
            <span>待機中 (Status: Waiting)</span>
          </div>
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: '#8E24AA' }} />
            <span>その他のリーダー状態</span>
          </div>
        </div>

        <div className="legend-section">
          <h3>一般ペンギン状態</h3>
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: '#2196F3' }} />
            <span>追従中 (Status: Following / Target: LEADER)</span>
          </div>
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: '#3F51B5' }} />
            <span>パトロール中 (Status: Patrol / Target: Patrol)</span>
          </div>
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: '#009688' }} />
            <span>次ステージへ (Status: NextStage / Target: NextStage)</span>
          </div>
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: '#1976D2' }} />
            <span>その他の状態</span>
          </div>
        </div>

        <div className="legend-section">
          <h3>一般ペンギン状態 (Normal Status)</h3>
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: '#2196F3' }} />
            <span>Following - 追従中</span>
          </div>
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: '#3F51B5' }} />
            <span>Patrol - パトロール中</span>
          </div>
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: '#607D8B' }} />
            <span>Idle - 待機中</span>
          </div>
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: '#009688' }} />
            <span>NextStage - 次ステージへ</span>
          </div>
        </div>

        <div className="legend-section">
          <h3>マーカーの種類</h3>
          <div className="legend-item">
            <div className="color-box" style={{ 
              backgroundColor: '#1976D2',
              borderRadius: '50%'
            }} />
            <span>一般ペンギン</span>
          </div>
          <div className="legend-item">
            <svg width="14" height="14" viewBox="0 0 14 14">
              <path
                d="M7 0L8.5 5.5L14 7L8.5 8.5L7 14L5.5 8.5L0 7L5.5 5.5L7 0Z"
                fill="#1976D2"
                stroke="#000"
              />
            </svg>
            <span>リーダーペンギン</span>
          </div>
          <div className="legend-item">
            <div style={{ 
              width: '14px', 
              height: '14px', 
              position: 'relative' 
            }}>
              <div style={{
                position: 'absolute',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#1976D2',
                border: '1px solid #000',
                top: '1px',
                left: '1px'
              }} />
              <div style={{
                position: 'absolute',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                border: '2px solid #FFD700',
                top: '-2px',
                left: '-2px'
              }} />
            </div>
            <span>プレイヤー操作中</span>
          </div>
        </div>
      </LegendContainer>
    </MapContainer>
  );
};

export default PenguinMap;