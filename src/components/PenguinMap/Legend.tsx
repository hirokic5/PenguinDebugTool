import React from 'react';
import { PenguinData, EnemyData, AreaData } from '../../types/entityTypes';
import { LegendContainer } from './styles';

interface LegendProps {
  penguins: PenguinData[];
  enemies: EnemyData[];
  staticAreas?: AreaData[];
}

/**
 * Legend component for the penguin map
 */
const Legend: React.FC<LegendProps> = ({ penguins, enemies, staticAreas = [] }) => {
  return (
    <LegendContainer>
      <div className="legend-section">
        <h3>ペンギンの状態</h3>
        <div className="legend-item">
          <div className="color-box" style={{ backgroundColor: '#9C27B0' }} />
          <span>リーダー行動中</span>
        </div>
        <div className="legend-item">
          <div className="color-box" style={{ backgroundColor: '#2196F3' }} />
          <span>リーダー追従中</span>
        </div>
        <div className="legend-item">
          <div className="color-box" style={{ backgroundColor: '#3F51B5' }} />
          <span>パトロール中</span>
        </div>
        <div className="legend-item">
          <div className="color-box" style={{ backgroundColor: '#607D8B' }} />
          <span>待機中</span>
        </div>
        <div className="legend-item">
          <div className="color-box" style={{ backgroundColor: '#FF9800' }} />
          <span>逃走中</span>
        </div>
        <div className="legend-item">
          <div className="color-box" style={{ backgroundColor: '#FF0000' }} />
          <span>ダウン状態</span>
        </div>
        <div className="legend-item">
          <div className="color-box" style={{ backgroundColor: '#00FFFF' }} />
          <span>凍結状態</span>
        </div>
        <div className="legend-item">
          <div className="color-box" style={{ backgroundColor: '#4CAF50' }} />
          <span>ゴールへ向かう</span>
        </div>
        <div className="legend-item">
          <div className="color-box" style={{ backgroundColor: '#FFD700' }} />
          <span>ゴール到達</span>
        </div>
      </div>
      
      <div className="legend-section">
        <h3>リーダー経路</h3>
        <div className="legend-item">
          <div className="color-box" style={{ backgroundColor: '#9C27B0' }} />
          <span>Luca の経路</span>
        </div>
        <div className="legend-item">
          <div className="color-box" style={{ backgroundColor: '#2196F3' }} />
          <span>Milo の経路</span>
        </div>
        <div className="legend-item">
          <div className="color-box" style={{ backgroundColor: '#FF9800' }} />
          <span>Ellie の経路</span>
        </div>
        <div className="legend-item">
          <div className="color-box" style={{ backgroundColor: '#4CAF50' }} />
          <span>Sora の経路</span>
        </div>
      </div>
      
      <div className="legend-section">
        <h3>敵の状態</h3>
        <div className="legend-item">
          <div style={{ width: '0', height: '0', borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderBottom: '20px solid #D02020', marginRight: '8px' }} />
          <span>通常の敵</span>
        </div>
        <div className="legend-item">
          <div style={{ width: '0', height: '0', borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderBottom: '20px solid #FF0000', marginRight: '8px' }} />
          <span>攻撃中の敵</span>
        </div>
      </div>
      
      <div className="legend-section">
        <h3>静的エリア</h3>
        <div className="legend-item">
          <div className="color-box" style={{ backgroundColor: 'rgba(0, 255, 0, 0.3)' }} />
          <span>ゴールエリア</span>
        </div>
        <div className="legend-item">
          <div className="color-box" style={{ backgroundColor: 'rgba(255, 165, 0, 0.3)' }} />
          <span>協力エリア</span>
        </div>
        <div className="legend-item">
          <div className="color-box" style={{ backgroundColor: 'rgba(255, 215, 0, 0.3)' }} />
          <span>宝物エリア</span>
        </div>
      </div>
      
      <div className="legend-section">
        <h3>統計情報</h3>
        <div>ペンギン数: {penguins.length}</div>
        <div>敵の数: {enemies.length}</div>
        <div>静的エリア数: {staticAreas.length}</div>
      </div>
    </LegendContainer>
  );
};

export default Legend;