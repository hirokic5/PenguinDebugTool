import styled from 'styled-components';
import { PenguinData } from '../types/entityTypes';

const Card = styled.div<{ isPlayable: boolean }>`
  background-color: white;
  border-radius: 8px;
  padding: 16px;
  margin: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 2px solid ${props => props.isPlayable ? '#4CAF50' : '#9E9E9E'};
`;

const Title = styled.h3`
  margin: 0 0 8px 0;
  color: #2c3e50;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Status = styled.span<{ status: string }>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8em;
  background-color: ${props => {
    switch (props.status.toLowerCase()) {
      case 'idle': return '#E0E0E0';
      case 'moving': return '#81D4FA';
      case 'following': return '#FFB74D';
      default: return '#E0E0E0';
    }
  }};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-top: 8px;
`;

const StatBar = styled.div<{ value: number }>`
  width: 100%;
  height: 8px;
  background-color: #E0E0E0;
  border-radius: 4px;
  overflow: hidden;
  
  &::after {
    content: '';
    display: block;
    width: ${props => props.value}%;
    height: 100%;
    background-color: #2196F3;
  }
`;

const Position = styled.div`
  font-family: monospace;
  background-color: #f5f5f5;
  padding: 4px 8px;
  border-radius: 4px;
  margin-top: 8px;
`;

const EntityType = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: #4CAF50;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.7em;
  font-weight: bold;
  text-transform: uppercase;
`;

interface PenguinCardProps {
  penguin: PenguinData;
}

const PenguinCard: React.FC<PenguinCardProps> = ({ penguin }) => {
  return (
    <Card isPlayable={penguin.isPlayable}>
      <EntityType>Penguin</EntityType>
      <Title>
        {penguin.name}
        <Status status={penguin.status}>{penguin.status}</Status>
      </Title>
      
      <Grid>
        <div>
          <div>Leadership</div>
          <StatBar value={penguin.leadership} />
        </div>
        <div>
          <div>Stamina</div>
          <StatBar value={penguin.stamina} />
        </div>
        <div>
          <div>Speed</div>
          <StatBar value={penguin.speed} />
        </div>
        <div>
          <div>Sensing</div>
          <StatBar value={penguin.sensing} />
        </div>
      </Grid>

      <Position>
        Position: ({penguin.position.x.toFixed(1)}, {penguin.position.y.toFixed(1)}, {penguin.position.z.toFixed(1)})
      </Position>

      <div style={{ marginTop: '8px' }}>
        <div>Target: {penguin.currentTarget || 'None'}</div>
        <div>Physical State: {penguin.physicalState}</div>
        <div>Gender: {penguin.isMale ? 'Male' : 'Female'}</div>
        <div>Goal: {penguin.isGoal ? 'Yes' : 'No'}</div>
        <div>Distance to Goal: {penguin.distanceToGoal === Number.POSITIVE_INFINITY ? '∞' : penguin.distanceToGoal.toFixed(1)} units</div>
        {penguin.followingLeaderId ? (
          <>
            <div>Following Leader: {penguin.followingLeaderId}</div>
            <div>Trust Level: {(penguin.trustLevel * 100).toFixed(1)}%</div>
          </>
        ) : (
          <div>Followers: {penguin.followerCount}</div>
        )}
      </div>
    </Card>
  );
};

export default PenguinCard;