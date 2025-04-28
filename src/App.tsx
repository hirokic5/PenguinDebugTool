import styled from 'styled-components';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import PenguinMonitor from './components/PenguinMonitor';
import PenguinMap from './components/PenguinMap';

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

const Navigation = styled.nav`
  margin-bottom: 20px;
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    gap: 20px;
  }
  a {
    color: #2c3e50;
    text-decoration: none;
    padding: 8px 16px;
    border-radius: 4px;
    background-color: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    &:hover {
      background-color: #f8f9fa;
    }
  }
`;

function App() {
  return (
    <Router>
      <AppContainer>
        <Header>
          <h1>Game Entity Monitor</h1>
        </Header>
        <Navigation>
          <ul>
            <li>
              <Link to="/">Entity Status</Link>
            </li>
            <li>
              <Link to="/map">2D Map</Link>
            </li>
          </ul>
        </Navigation>
        <Routes>
          <Route path="/" element={<PenguinMonitor />} />
          <Route path="/map" element={<PenguinMap />} />
        </Routes>
      </AppContainer>
    </Router>
  );
}

export default App;