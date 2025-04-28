import React from 'react';
import { CoordinateInfo } from './styles';

interface CoordinateDisplayProps {
  coordinates: {
    x: { min: number; max: number };
    z: { min: number; max: number };
  };
}

/**
 * Coordinate display component for the penguin map
 */
const CoordinateDisplay: React.FC<CoordinateDisplayProps> = ({ coordinates }) => {
  return (
    <CoordinateInfo>
      <h3>座標範囲</h3>
      <div>
        <span>X: {coordinates.x.min.toFixed(2)} 〜 {coordinates.x.max.toFixed(2)}</span>
        <span>Z: {coordinates.z.min.toFixed(2)} 〜 {coordinates.z.max.toFixed(2)}</span>
      </div>
    </CoordinateInfo>
  );
};

export default CoordinateDisplay;