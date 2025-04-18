import styled from 'styled-components';
import PenguinMonitor from './components/PenguinMonitor';

const AppContainer = styled.div`
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
`;

const Header = styled.header`
  margin-bottom: 20px;
  h1 {
    color: #2c3e50;
    margin: 0;
  }
`;

function App() {
  return (
    <AppContainer>
      <Header>
        <h1>Penguin Monitor</h1>
      </Header>
      <PenguinMonitor />
    </AppContainer>
  );
}

export default App;