import React from 'react';
import { FilterContainer, FilterButton } from './styles';

interface FiltersProps {
  showLeaderPaths: boolean;
  setShowLeaderPaths: (show: boolean) => void;
  showPenguins: boolean;
  setShowPenguins: (show: boolean) => void;
  showEnemies: boolean;
  setShowEnemies: (show: boolean) => void;
  showStaticAreas?: boolean;
  setShowStaticAreas?: (show: boolean) => void;
}

/**
 * Filters component for the penguin map
 */
const Filters: React.FC<FiltersProps> = ({
  showLeaderPaths,
  setShowLeaderPaths,
  showPenguins,
  setShowPenguins,
  showEnemies,
  setShowEnemies,
  showStaticAreas,
  setShowStaticAreas
}) => {
  return (
    <FilterContainer>
      <FilterButton
        active={showPenguins}
        onClick={() => setShowPenguins(!showPenguins)}
      >
        ペンギン {showPenguins ? '✓' : '✗'}
      </FilterButton>
      <FilterButton
        active={showEnemies}
        onClick={() => setShowEnemies(!showEnemies)}
      >
        敵 {showEnemies ? '✓' : '✗'}
      </FilterButton>
      <FilterButton
        active={showLeaderPaths}
        onClick={() => setShowLeaderPaths(!showLeaderPaths)}
      >
        リーダー経路 {showLeaderPaths ? '✓' : '✗'}
      </FilterButton>
      {setShowStaticAreas && (
        <FilterButton
          active={showStaticAreas || false}
          onClick={() => setShowStaticAreas(!showStaticAreas)}
        >
          静的エリア {showStaticAreas ? '✓' : '✗'}
        </FilterButton>
      )}
    </FilterContainer>
  );
};

export default Filters;