import moment from 'moment-timezone';
import Container from 'react-bootstrap/Container';
import { Navbar } from 'react-bootstrap'; // Navbar needs to be imported like this way, was causing build issues otherwise
import Nav from 'react-bootstrap/Nav';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';
import AdminPage from './components/AdminPage/AdminPage';
import EventPage from './components/EventPage/EventPage';
import LeagueList from './components/LeagueList/LeagueList';
import PlayerList from './components/PlayerList/PlayerList';
import PlayerProfile from './components/PlayerProfile/PlayerProfile';
import './App.css';

function App() {
  const pathname = window.location.pathname;
  moment.tz.setDefault("UTC");
  return (
    <div className='App'>
      <BrowserRouter>
        <Navbar id='main-navbar' expand='lg'>
          <Navbar.Brand href='/'>UMD Table Tennis</Navbar.Brand>
          <Navbar.Toggle aria-controls='basic-navbar-nav' />
          <Navbar.Collapse id='basic-navbar-nav'>
            <Container className='NavbarContainer' fluid>
              <Nav
                className='me-auto'
                variant='pills'
                defaultActiveKey={pathname}
              >
                <Nav.Item>
                  <Nav.Link href='/'>Home</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link href='/leagues'>Past League Results</Nav.Link>
                </Nav.Item>
              </Nav>
            </Container>
          </Navbar.Collapse>
        </Navbar>
        <Routes>
          <Route exact path='/' element={<PlayerList />} />
          <Route path='/admin' element={<AdminPage />} />
          <Route path='/event/*' element={<EventPage />} />
          <Route path='/leagues' element={<LeagueList />} />
          <Route path='/player/*' element={<PlayerProfile />} />
          <Route path='/*' element={<Navigate to='/' />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
