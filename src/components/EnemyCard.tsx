import styled from 'styled-components';
import { EnemyData } from '../types/entityTypes';

const Card = styled.div<{ isAttacking: boolean }>`
  background-color: white;
  border-radius: 8px;
  padding: 16px;
  margin: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 2px solid ${props => props.isAttacking ? '#FF4136' : '#FF851B'};
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
      case 'attack': return '#FF4136';
      case 'attackwait': return '#FF851B';
      case 'playerchase': return '#FF851B';
      case 'penguinchase': return '#FF851B';
      case 'return': return '#2ECC40';
      default: return '#E0E0E0';
    }
  }};
  color: ${props => 
    ['attack', 'attackwait', 'playerchase', 'penguinchase'].includes(props.status.toLowerCase()) 
      ? 'white' 
      : 'black'
  };
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-top: 8px;
`;

const StatBar = styled.div<{ value: number, max: number }>`
  width: 100%;
  height: 8px;
  background-color: #E0E0E0;
  border-radius: 4px;
  overflow: hidden;
  
  &::after {
    content: '';
    display: block;
    width: ${props => (props.value / props.max) * 100}%;
    height: 100%;
    background-color: #FF4136;
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
  background-color: #FF4136;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.7em;
  font-weight: bold;
  text-transform: uppercase;
`;

interface EnemyCardProps {
  enemy: EnemyData;
}

const EnemyCard: React.FC<EnemyCardProps> = ({ enemy }) => {
  return (
    <Card isAttacking={enemy.isAttacking}>
      <EntityType>Enemy</EntityType>
      <Title>
        {enemy.name}
        <Status status={enemy.status}>{enemy.status}</Status>
      </Title>
      
      <Grid>
        <div>
          <div>Detection Radius</div>
          <StatBar value={enemy.detectionRadius} max={20} />
        </div>
        <div>
          <div>Guard Radius</div>
          <StatBar value={enemy.guardRadius} max={50} />
        </div>
        <div>
          <div>Attack Countdown</div>
          <StatBar value={enemy.attackCountdown} max={5} />
        </div>
        <div>
          <div>Enemy Timer</div>
          <StatBar value={enemy.enemyTimer} max={120} />
        </div>
      </Grid>

      <Position>
        Position: ({enemy.position.x.toFixed(1)}, {enemy.position.y.toFixed(1)}, {enemy.position.z.toFixed(1)})
      </Position>

      <div style={{ marginTop: '8px' }}>
        <div>Target: {enemy.currentTarget || 'None'}</div>
        <div>Area Guard: {enemy.areaGuardEnabled ? 'Enabled' : 'Disabled'}</div>
        <div>Distance to Player: {enemy.distanceToPlayer.toFixed(1)} units</div>
        <div>Distance to Guard Center: {enemy.distanceToInitial.toFixed(1)} units</div>
        <div>Attacking: {enemy.isAttacking ? 'Yes' : 'No'}</div>
      </div>
    </Card>
  );
};

export default EnemyCard;