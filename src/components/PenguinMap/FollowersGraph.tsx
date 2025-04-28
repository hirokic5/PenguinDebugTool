import React from 'react';
import { PenguinData } from '../../types/entityTypes';
import { FollowersGraph as StyledFollowersGraph } from './styles';

interface FollowersGraphProps {
  penguins: PenguinData[];
}

/**
 * Followers graph component for the penguin map
 */
const FollowersGraph: React.FC<FollowersGraphProps> = ({ penguins }) => {
  // リーダーの名前リスト
  const leaderNames = ['Luca', 'Milo', 'Ellie', 'Sora'];
  
  // リーダーごとのフォロワー数を集計
  const leaderFollowers = leaderNames.map(name => {
    const leader = penguins.find(p => p.name === name);
    return {
      name,
      count: leader?.followerCount || 0
    };
  });
  
  // 最大フォロワー数を取得（グラフのスケーリング用）
  const maxFollowers = Math.max(...leaderFollowers.map(l => l.count), 1);
  
  return (
    <StyledFollowersGraph>
      <h3>リーダーフォロワー数</h3>
      {leaderFollowers.map(leader => (
        <div className="graph-bar" key={leader.name}>
          <div className="leader-name">{leader.name}</div>
          <div className="bar-container">
            <div 
              className="bar" 
              style={{ width: `${(leader.count / maxFollowers) * 100}%` }}
            />
          </div>
          <div className="count">{leader.count}</div>
        </div>
      ))}
    </StyledFollowersGraph>
  );
};

export default FollowersGraph;