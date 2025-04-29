/**
 * LeaderPathDrawer.ts
 * リーダーペンギンの移動経路を描画するためのクラス
 */

/**
 * 経路上の点を表すインターフェース
 */
export interface PathPoint {
  x: number;
  z: number;
  timestamp: number;
}

/**
 * リーダーペンギンの移動経路を描画するクラス
 */
export class LeaderPathDrawer {
  private ctx: CanvasRenderingContext2D;
  private mapX: (x: number) => number;
  private mapZ: (z: number) => number;
  private pathColors: Map<string, string>;

  /**
   * コンストラクタ
   * @param ctx キャンバスのコンテキスト
   * @param mapX X座標をキャンバス座標に変換する関数
   * @param mapZ Z座標をキャンバス座標に変換する関数
   */
  constructor(
    ctx: CanvasRenderingContext2D,
    mapX: (x: number) => number,
    mapZ: (z: number) => number
  ) {
    this.ctx = ctx;
    this.mapX = mapX;
    this.mapZ = mapZ;
    this.pathColors = new Map<string, string>();
    
    // リーダーごとの経路色を設定
    this.pathColors.set('Luca', '#9C27B0');    // 紫
    this.pathColors.set('Milo', '#2196F3');    // 青
    this.pathColors.set('Ellie', '#FF9800');   // オレンジ
    this.pathColors.set('Sora', '#4CAF50');    // 緑
  }

  /**
   * 経路を描画する
   * @param paths 経路データの配列 [リーダー名, 経路点の配列][]
   */
  drawPaths(paths: [string, PathPoint[]][]): void {
    if (!this.ctx) {
      // console.error('Canvas context is not available');
      return;
    }

    // Miloの経路と現在位置を特別にログ出力（キャンバス座標で）
    const miloPath = paths.find(([name]) => name === 'Milo');
    if (miloPath && miloPath[1] && miloPath[1].length > 0) {
      const latestPoint = miloPath[1][miloPath[1].length - 1];
      // ワールド座標をキャンバス座標に変換
      const canvasX = this.mapX(latestPoint.x);
      const canvasZ = this.mapZ(latestPoint.z);
      console.log('Milo path latest point:', {
        world: { x: latestPoint.x, z: latestPoint.z },
        canvas: { x: canvasX, y: canvasZ }, // キャンバスではzはy座標として描画
        timestamp: new Date(latestPoint.timestamp).toISOString(),
        age: (Date.now() - latestPoint.timestamp) / 1000 + 's ago'
      });
    }

    // 各リーダーの経路を描画
    paths.forEach(([leaderName, path]) => {
      if (!path || path.length < 2) {
        return; // 経路点が2つ未満の場合は描画しない
      }

      // 経路の色を取得（リーダー名に対応する色がない場合はランダムな色を生成）
      let color = this.pathColors.get(leaderName);
      if (!color) {
        color = this.generateRandomColor(leaderName);
        this.pathColors.set(leaderName, color);
      }

      // 経路の透明度を設定（古い点ほど透明に）
      const now = Date.now();
      const maxAge = 60000; // 60秒
      
      // 経路を描画
      this.ctx.beginPath();
      
      // 最初の点に移動
      const firstPoint = path[0];
      const firstX = this.mapX(firstPoint.x);
      const firstZ = this.mapZ(firstPoint.z);
      this.ctx.moveTo(firstX, firstZ);
      
      // 残りの点を線で結ぶ
      for (let i = 1; i < path.length; i++) {
        const point = path[i];
        const x = this.mapX(point.x);
        const z = this.mapZ(point.z);
        
        // 点間の距離が大きすぎる場合は線を引かない（テレポートなどの異常値対策）
        const prevPoint = path[i - 1];
        const prevX = this.mapX(prevPoint.x);
        const prevZ = this.mapZ(prevPoint.z);
        
        const distance = Math.sqrt(Math.pow(x - prevX, 2) + Math.pow(z - prevZ, 2));
        if (distance > 100) { // 画面上で100px以上離れている場合
          this.ctx.stroke(); // 現在のパスを描画
          this.ctx.beginPath(); // 新しいパスを開始
          this.ctx.moveTo(x, z);
          continue;
        }
        
        // 経過時間に基づいて透明度を計算
        const age = now - point.timestamp;
        const alpha = Math.max(0.1, 1 - (age / maxAge));
        
        this.ctx.strokeStyle = this.hexToRgba(color, alpha);
        this.ctx.lineWidth = 2;
        this.ctx.lineTo(x, z);
      }
      
      this.ctx.stroke();
      
      // 経路の終点（最新の位置）に円を描画
      const lastPoint = path[path.length - 1];
      const lastX = this.mapX(lastPoint.x);
      const lastZ = this.mapZ(lastPoint.z);
      
      this.ctx.beginPath();
      this.ctx.arc(lastX, lastZ, 4, 0, Math.PI * 2);
      this.ctx.fillStyle = color;
      this.ctx.fill();
    });
  }

  /**
   * リーダー名に基づいてランダムな色を生成する
   * @param name リーダー名
   * @returns 16進数カラーコード
   */
  private generateRandomColor(name: string): string {
    // 名前の文字コードを使って一貫性のある色を生成
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // HSLカラーモデルを使用して鮮やかな色を生成
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 70%, 50%)`;
  }

  /**
   * 16進数カラーコードをRGBA形式に変換する
   * @param hex 16進数カラーコード
   * @param alpha 透明度（0～1）
   * @returns RGBA形式の色文字列
   */
  private hexToRgba(hex: string, alpha: number): string {
    // HSL形式の場合はそのまま透明度を追加
    if (hex.startsWith('hsl')) {
      return hex.replace('hsl', 'hsla').replace(')', `, ${alpha})`);
    }
    
    // 16進数カラーコードの場合はRGBAに変換
    let r = 0, g = 0, b = 0;
    
    // #RGB または #RRGGBB 形式をチェック
    if (hex.length === 4) {
      // #RGB 形式
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      // #RRGGBB 形式
      r = parseInt(hex.substring(1, 3), 16);
      g = parseInt(hex.substring(3, 5), 16);
      b = parseInt(hex.substring(5, 7), 16);
    }
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}