import Container from 'react-bootstrap/Container';
import Table from 'react-bootstrap/Table';
import {
  Link,
} from "react-router-dom";

function PlayerList() {
  const data = [
    {
      id: 1,
      name: "Michael",
      rating: 2000,
      active: false,
    },
    {
      id: 2,
      name: "Yash",
      rating: 1000,
      active: true,
    }
  ];

  return (
    <Container>
      <Table striped bordered hover size="sm">
        <thead>
          <tr>
            <th>Player Name</th>
            <th>Rating</th>
          </tr>
        </thead>
        <tbody>
          {data.map(datum =>
            <tr key={datum.id}>
              <td><Link to = {`/player/${datum.id}`}>{datum.name}</Link></td>
              <td>{datum.rating}</td>
            </tr>
          )}
        </tbody>
      </Table>
    </Container>
  );
}

export default PlayerList;
