import React from 'react';
import styled from 'styled-components';
import { AreaData } from '../types/entityTypes';

const Card = styled.div`
  background-color: #f0f8ff; /* 静的エリア用の薄い青色 */
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 8px;
`;

const AreaType = styled.h3`
  margin: 0;
  font-size: 1.2em;
  color: #2c3e50;
`;

const AreaId = styled.span`
  font-size: 0.8em;
  color: #7f8c8d;
`;

const InfoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
`;

const InfoLabel = styled.span`
  font-weight: bold;
  color: #34495e;
`;

const InfoValue = styled.span`
  color: #2c3e50;
`;

const Position = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 8px;
  padding: 8px;
  background-color: #e8f4f8;
  border-radius: 4px;
`;

const PositionRow = styled.div`
  display: flex;
  justify-content: space-between;
`;

interface StaticAreaCardProps {
  area: AreaData;
}

const StaticAreaCard: React.FC<StaticAreaCardProps> = ({ area }) => {
  return (
    <Card>
      <CardHeader>
        <AreaType>{area.areaType}</AreaType>
        <AreaId>ID: {area.areaId.substring(0, 8)}</AreaId>
      </CardHeader>
      
      <InfoSection>
        <InfoRow>
          <InfoLabel>Type:</InfoLabel>
          <InfoValue>{area.areaType}</InfoValue>
        </InfoRow>
      </InfoSection>
      
      <Position>
        <PositionRow>
          <InfoLabel>Position:</InfoLabel>
        </PositionRow>
        <PositionRow>
          <InfoLabel>X:</InfoLabel>
          <InfoValue>{area.position.x.toFixed(2)}</InfoValue>
        </PositionRow>
        <PositionRow>
          <InfoLabel>Y:</InfoLabel>
          <InfoValue>{area.position.y.toFixed(2)}</InfoValue>
        </PositionRow>
        <PositionRow>
          <InfoLabel>Z:</InfoLabel>
          <InfoValue>{area.position.z.toFixed(2)}</InfoValue>
        </PositionRow>
      </Position>
    </Card>
  );
};

export default StaticAreaCard;