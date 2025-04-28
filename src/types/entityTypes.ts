// 基本的なエンティティの共通インターフェース
export interface BaseEntityData {
  position: {
    x: number;
    y: number;
    z: number;
  };
  name: string;
  status: string;
  currentTarget: string;
  entityType?: string;
  lastUpdate: number;
}

// ペンギン固有のデータ
export interface PenguinData extends BaseEntityData {
  penguinId: string;
  isGoal: boolean;
  isPlayable: boolean;
  physicalState: string;
  leadership: number;
  stamina: number;
  speed: number;
  sensing: number;
  isMale: boolean;
  distanceToGoal: number;
  followerCount: number;
  followingLeaderId: string;
  trustLevel: number;
  entityType?: 'penguin';
}

// 敵固有のデータ
export interface EnemyData extends BaseEntityData {
  enemyId: string;
  isAttacking: boolean;
  attackCountdown: number;
  detectionRadius: number;
  guardRadius: number;
  areaGuardEnabled: boolean;
  enemyTimer: number;
  guardPosition: {
    x: number;
    y: number;
    z: number;
  };
  distanceToPlayer: number;
  distanceToInitial: number;
  entityType: 'enemy';
}

// WebSocketメッセージの型
export interface WebSocketMessage {
  type: 'entityUpdate';
  entities: (PenguinData | EnemyData)[];
  penguins: PenguinData[];
  enemies: EnemyData[];
}