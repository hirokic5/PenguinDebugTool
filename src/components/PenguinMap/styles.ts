import styled from 'styled-components';

export const MapContainer = styled.div`
  display: flex;
  gap: 20px;
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin: 20px;
`;

export const GridContainer = styled.div`
  flex: 1;
`;

export const LegendContainer = styled.div`
  width: 300px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  font-size: 12px;

  h3 {
    margin: 0 0 10px 0;
    font-size: 14px;
    color: #333;
    border-bottom: 1px solid #ddd;
    padding-bottom: 5px;
  }

  .legend-section {
    margin-bottom: 20px;
  }

  .legend-item {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    gap: 8px;
  }

  .color-box {
    width: 12px;
    height: 12px;
    border: 1px solid #000;
  }

  .state-name {
    color: #666;
  }
`;

export const FollowersGraph = styled.div`
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;

  h3 {
    margin: 0 0 15px 0;
    font-size: 14px;
    color: #333;
    border-bottom: 1px solid #ddd;
    padding-bottom: 5px;
  }

  .graph-bar {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    gap: 10px;
  }

  .leader-name {
    width: 60px;
    font-size: 12px;
    color: #333;
  }

  .bar-container {
    flex-grow: 1;
    height: 20px;
    background-color: #e9ecef;
    border-radius: 4px;
    overflow: hidden;
  }

  .bar {
    height: 100%;
    background-color: #9C27B0;
    transition: width 0.3s ease;
  }

  .count {
    width: 30px;
    font-size: 12px;
    color: #666;
    text-align: right;
  }
`;

export const CoordinateInfo = styled.div`
  margin-top: 20px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
  font-family: monospace;
  
  h3 {
    margin: 0 0 10px 0;
    color: #2c3e50;
  }
  
  div {
    display: flex;
    gap: 20px;
  }
  
  span {
    color: #666;
  }
`;

export const FilterContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  justify-content: center;
`;

export const FilterButton = styled.button<{ active: boolean }>`
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  background-color: ${props => props.active ? '#2c3e50' : '#e0e0e0'};
  color: ${props => props.active ? 'white' : 'black'};
  cursor: pointer;
  font-weight: bold;
  
  &:hover {
    background-color: ${props => props.active ? '#2c3e50' : '#c0c0c0'};
  }
`;