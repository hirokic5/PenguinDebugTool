/**
 * Maps a value from one range to another
 * @param value The value to map
 * @param inMin The minimum value of the input range
 * @param inMax The maximum value of the input range
 * @param outMin The minimum value of the output range
 * @param outMax The maximum value of the output range
 * @returns The mapped value
 */
export const mapValue = (
  value: number, 
  inMin: number, 
  inMax: number, 
  outMin: number, 
  outMax: number
): number => {
  return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
};

/**
 * Creates a color for a penguin based on its state
 * @param penguin The penguin data
 * @param leaderNames Array of leader names
 * @returns A color string
 */
export const getPenguinColor = (penguin: any, leaderNames: string[]): string => {
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

/**
 * Gets a color for an enemy based on its state
 * @param enemyId The enemy ID
 * @param isAttacking Whether the enemy is attacking
 * @returns A color string
 */
export const getEnemyColor = (enemyId: string, isAttacking: boolean): string => {
  // 攻撃中の敵は赤色
  if (isAttacking) return '#FF0000';
  
  // 通常の敵は暗い赤色
  return '#D02020';
};