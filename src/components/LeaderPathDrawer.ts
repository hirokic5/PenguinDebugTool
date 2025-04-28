/**
 * リーダーペンギンの経路描画を担当するユーティリティクラス
 */

export interface PathPoint {
  x: number;
  z: number;
  timestamp: number;
}

export interface LeaderPathColors {
  [key: string]: string;
}

export class LeaderPathDrawer {
  private ctx: CanvasRenderingContext2D;
  private scaleX: (x: number) => number;
  private scaleZ: (z: number) => number;
  private pathColors: LeaderPathColors;

  constructor(
    ctx: CanvasRenderingContext2D, 
    scaleX: (x: number) => number, 
    scaleZ: (z: number) => number,
    pathColors: LeaderPathColors = {
      'Luca': '#9C27B0',  // 紫
      'Milo': '#2196F3',  // 青
      'Ellie': '#FF9800', // オレンジ
      'Sora': '#4CAF50'   // 緑
    }
  ) {
    this.ctx = ctx;
    this.scaleX = scaleX;
    this.scaleZ = scaleZ;
    this.pathColors = pathColors;
  }

  /**
   * リーダーペンギンの経路を描画する
   * @param leaderPaths リーダー名をキーとした経路ポイントの配列またはMap.entriesの配列
   */
  drawPaths(leaderPaths: Record<string, PathPoint[]> | [string, PathPoint[]][]): void {
    // 配列形式（Map.entriesの結果）の場合
    if (Array.isArray(leaderPaths)) {
      leaderPaths.forEach(([leaderName, path]) => {
        this.drawSinglePath(leaderName, path);
      });
    } 
    // オブジェクト形式の場合
    else {
      Object.entries(leaderPaths).forEach(([leaderName, path]) => {
        this.drawSinglePath(leaderName, path);
      });
    }
  }

  /**
   * 単一のリーダーペンギンの経路を描画する
   * @param leaderName リーダーの名前
   * @param path 経路ポイントの配列
   */
  private drawSinglePath(leaderName: string, path: PathPoint[]): void {
    if (path.length < 2) return; // 少なくとも2点必要
    
    const color = this.pathColors[leaderName] || '#000000';
    
    this.ctx.beginPath();
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([]);
    
    // 最初のポイントに移動
    const firstPoint = path[0];
    this.ctx.moveTo(this.scaleX(firstPoint.x), this.scaleZ(firstPoint.z));
    
    // 残りのポイントを線で結ぶ
    for (let i = 1; i < path.length; i++) {
      const point = path[i];
      this.ctx.lineTo(this.scaleX(point.x), this.scaleZ(point.z));
    }
    
    this.ctx.stroke();
    
    // 経路の終点（最新の位置）に小さな円を描画
    if (path.length > 0) {
      const lastPoint = path[path.length - 1];
      this.ctx.beginPath();
      this.ctx.arc(this.scaleX(lastPoint.x), this.scaleZ(lastPoint.z), 3, 0, Math.PI * 2);
      this.ctx.fillStyle = color;
      this.ctx.fill();
    }
  }

  /**
   * 経路の最大長を制限する
   * @param paths 現在の経路データ
   * @param maxLength 最大長
   * @returns 最大長に制限された経路データ
   */
  static limitPathsLength(
    paths: Record<string, PathPoint[]>, 
    maxLength: number
  ): Record<string, PathPoint[]> {
    const newPaths = { ...paths };
    
    Object.keys(newPaths).forEach(key => {
      newPaths[key] = newPaths[key].slice(-maxLength);
    });
    
    return newPaths;
  }

  /**
   * 新しい位置ポイントを経路に追加する
   * @param paths 現在の経路データ
   * @param leaderName リーダー名
   * @param x X座標
   * @param z Z座標
   * @param maxLength 経路の最大長
   * @returns 更新された経路データ
   */
  static addPointToPath(
    paths: Record<string, PathPoint[]>,
    leaderName: string,
    x: number,
    z: number,
    maxLength: number
  ): Record<string, PathPoint[]> {
    const newPaths = { ...paths };
    const currentTime = Date.now();
    
    // 前回の位置と同じ場合は追加しない（経路が冗長になるのを防ぐ）
    const prevPoints = paths[leaderName] || [];
    const lastPoint = prevPoints.length > 0 ? prevPoints[prevPoints.length - 1] : null;
    
    if (!lastPoint || (lastPoint.x !== x || lastPoint.z !== z)) {
      const newPoint: PathPoint = { x, z, timestamp: currentTime };
      
      // 新しい位置を追加し、最大長を超えたら古いポイントを削除
      newPaths[leaderName] = [
        ...(newPaths[leaderName] || []), 
        newPoint
      ].slice(-maxLength);
    }
    
    return newPaths;
  }
}