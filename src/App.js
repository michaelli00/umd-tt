import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/NavBar';
import Nav from 'react-bootstrap/Nav';
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import EventPage from './components/EventPage/EventPage';
import RatingList from './components/RatingList/RatingList';
import LeagueList from './components/LeagueList/LeagueList';
import PlayerProfile from './components/PlayerProfile/PlayerProfile';

function App() {
  return (
    <Router>
      <Navbar bg="primary" variant="dark">
        <Container className="NavbarContainer" fluid>
          <Navbar.Brand href="/">UMD Table Tennis</Navbar.Brand>
          <Nav className="me-auto">
            <Nav.Link href="/">Home</Nav.Link>
            <Nav.Link href="/leagues">Past League Results</Nav.Link>
          </Nav>
        </Container>
      </Navbar>
      <Routes>
        <Route exact path="/" element={<RatingList/>}/>
        <Route path="/event/*" element={<EventPage/>}/>
        <Route path="/leagues" element={<LeagueList/>}/>
        <Route path="/player/*" element={<PlayerProfile/>}/>
        <Route path="/*" element={() => <Navigate to="/"/>}/>
      </Routes>
    </Router>
  );
}

export default App;
