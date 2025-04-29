import { useEffect, useRef } from 'react';
import { SceneConfig } from '../types/sceneConfig';
import { PenguinData, EnemyData } from '../types/entityTypes';
import { LeaderPathDrawer, PathPoint } from '../components/LeaderPathDrawer';
import { mapValue, getPenguinColor, getEnemyColor } from '../utils/mapUtils';

interface MapRendererProps {
  penguins: PenguinData[];
  enemies: EnemyData[];
  leaderPaths: Map<string, PathPoint[]>;
  currentConfig: SceneConfig;
  showLeaderPaths: boolean;
  showPenguins: boolean;
  showEnemies: boolean;
}

/**
 * Custom hook for rendering the map on canvas
 * @param props Rendering configuration and data
 * @returns Canvas reference
 */
export const useMapRenderer = (props: MapRendererProps) => {
  const {
    penguins,
    enemies,
    leaderPaths,
    currentConfig,
    showLeaderPaths,
    showPenguins,
    showEnemies
  } = props;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const leaderPathDrawerRef = useRef<LeaderPathDrawer | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Always initialize/update leader path drawer when currentConfig changes
    // Create mapping functions for coordinates
    const mapX = (x: number) => mapValue(x, currentConfig.worldBounds.minX, currentConfig.worldBounds.maxX, 0, canvas.width);
    const mapZ = (z: number) => canvas.height - mapValue(z, currentConfig.worldBounds.minZ, currentConfig.worldBounds.maxZ, 0, canvas.height);
    
    // 常に新しい設定で初期化する
    leaderPathDrawerRef.current = new LeaderPathDrawer(ctx, mapX, mapZ);
    
    console.log('LeaderPathDrawer re-initialized with new config:', {
      worldBounds: currentConfig.worldBounds,
      canvasSize: { width: canvas.width, height: canvas.height }
    });
    
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
        // デバッグログ: 経路データの内容を確認
        // console.log('Leader paths data:', {
        //   mapSize: leaderPaths.size,
        //   entries: Array.from(leaderPaths.entries()).map(([key, path]) => ({
        //     leaderName: key,
        //     pathLength: path.length,
        //     firstPoint: path.length > 0 ? path[0] : null,
        //     lastPoint: path.length > 0 ? path[path.length - 1] : null
        //   }))
        // });
        
        // 経路描画の呼び出し
        leaderPathDrawerRef.current.drawPaths(Array.from(leaderPaths.entries()));
        // console.log('drawPaths called with LeaderPathDrawer instance:', leaderPathDrawerRef.current);
      } else {
        // console.log('Leader paths not drawn because:', { 
        //   showLeaderPaths, 
        //   hasDrawer: !!leaderPathDrawerRef.current 
        // });
      }
      
      // Draw penguins
      if (showPenguins) {
        // リーダーの名前リスト
        const leaderNames = ['Luca', 'Milo', 'Ellie', 'Sora'];
        
        // Miloの現在位置をログに出力（キャンバス座標で）
        const milo = penguins.find(p => p.name === 'Milo');
        if (milo) {
          // ワールド座標をキャンバス座標に変換
          const worldX = milo.position.x;
          const worldZ = milo.position.z;
          const canvasX = mapValue(worldX, currentConfig.worldBounds.minX, currentConfig.worldBounds.maxX, 0, canvas.width);
          const canvasY = canvas.height - mapValue(worldZ, currentConfig.worldBounds.minZ, currentConfig.worldBounds.maxZ, 0, canvas.height);
          
          console.log('Milo current position:', {
            world: { x: worldX, z: worldZ },
            canvas: { x: canvasX, y: canvasY }, // キャンバスではzはy座標として描画
            status: milo.status,
            currentTarget: milo.currentTarget,
            followerCount: milo.followerCount
          });
        }

        penguins.forEach(penguin => {
          const worldX = penguin.position.x;
          const worldZ = penguin.position.z;
          
          // Convert world coordinates to canvas coordinates
          const canvasX = mapValue(worldX, currentConfig.worldBounds.minX, currentConfig.worldBounds.maxX, 0, canvas.width);
          const canvasY = canvas.height - mapValue(worldZ, currentConfig.worldBounds.minZ, currentConfig.worldBounds.maxZ, 0, canvas.height);
          
          const color = getPenguinColor(penguin, leaderNames);
          const baseSize = leaderNames.includes(penguin.name) ? 12 : 8; // リーダーはより大きく

          // プレイヤー操作中の場合の二重円
          if (penguin.isPlayable) {
            ctx.beginPath();
            ctx.arc(canvasX, canvasY, baseSize + 4, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
            ctx.fill();
          }
          
          // ペンギンの円を描画
          ctx.beginPath();
          ctx.arc(canvasX, canvasY, baseSize, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 1;
          ctx.stroke();
          
          // ゴール到達したペンギンには星マークを追加
          if (penguin.status === 'Leader_At_Goal' || penguin.isGoal) {
            const drawStar = (size: number) => {
              ctx.beginPath();
              for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                const x = canvasX + Math.cos(angle) * size;
                const y = canvasY + Math.sin(angle) * size;
                if (i === 0) {
                  ctx.moveTo(x, y);
                } else {
                  ctx.lineTo(x, y);
                }
              }
              ctx.closePath();
              ctx.fillStyle = '#FFD700';
              ctx.fill();
              ctx.strokeStyle = '#000';
              ctx.lineWidth = 0.5;
              ctx.stroke();
            };
            
            drawStar(baseSize / 2);
          }
          
          // ペンギン名を表示（リーダーのみ）
          if (leaderNames.includes(penguin.name) || penguin.isPlayable || penguin.followerCount > 0) {
            ctx.fillStyle = '#000';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(penguin.name || penguin.penguinId.substring(0, 4), canvasX, canvasY - baseSize - 5);
            
            // フォロワー数を表示（リーダーのみ）
            if (penguin.followerCount > 0) {
              ctx.fillStyle = '#9C27B0';
              ctx.font = 'bold 10px Arial';
              ctx.fillText(`${penguin.followerCount}`, canvasX, canvasY + baseSize + 10);
            }
          }
        });
      }
      
      // Draw enemies
      if (showEnemies) {
        enemies.forEach(enemy => {
          const worldX = enemy.position.x;
          const worldZ = enemy.position.z;
          
          // Convert world coordinates to canvas coordinates
          const canvasX = mapValue(worldX, currentConfig.worldBounds.minX, currentConfig.worldBounds.maxX, 0, canvas.width);
          const canvasY = canvas.height - mapValue(worldZ, currentConfig.worldBounds.minZ, currentConfig.worldBounds.maxZ, 0, canvas.height);
          
          const color = getEnemyColor(enemy.enemyId, enemy.isAttacking);
          
          // 敵を三角形で描画
          ctx.beginPath();
          ctx.moveTo(canvasX, canvasY - 10);
          ctx.lineTo(canvasX - 10, canvasY + 10);
          ctx.lineTo(canvasX + 10, canvasY + 10);
          ctx.closePath();
          ctx.fillStyle = color;
          ctx.fill();
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 1;
          ctx.stroke();
        });
      }
    };
    
    // Draw the map
    draw();
    
    // Set up animation frame for continuous drawing
    let animationFrameId: number;
    const animate = () => {
      draw();
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    
    // Clean up
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    penguins, 
    enemies, 
    leaderPaths, 
    currentConfig, 
    showLeaderPaths, 
    showPenguins, 
    showEnemies
  ]);

  return canvasRef;
};

export default useMapRenderer;