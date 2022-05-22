import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/NavBar';
import Nav from 'react-bootstrap/Nav';

function App() {
  return (
    <Navbar bg="primary" variant="dark">
      <Container className="App" fluid>
        <Navbar.Brand>UMD Table Tennis</Navbar.Brand>
        <Nav className="me-auto">
          <Nav.Link>Home</Nav.Link>
          <Nav.Link>Past League Results</Nav.Link>
        </Nav>
      </Container>
    </Navbar>
  );
}

export default App;
