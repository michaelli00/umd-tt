import Container from 'react-bootstrap/Container';
import Table from 'react-bootstrap/Table';
import {
  Link,
} from "react-router-dom";

function EventPage() {
  const data = {
    name: '5/22/22 Group 1',
    date: '5/22/22',
    matches: [
      {
        winner_id: 2,
        winner_name: 'Yash',
        winner_score: 3,
        loser_id: 1,
        loser_name: 'Michael',
        loser_score: 0,
        rating_change: 20,
      }
    ],
    ratings: [
      {
        id: 1,
        name: 'Michael',
        rating_before: 2000,
        rating_after: 1980,
      },
      {
        id: 2,
        name: 'Yash',
        rating_before: 1000,
        rating_after: 1020,
      }
    ]
  }

  return (
    <Container>
      {data.name}
      <Table striped bordered hover size="sm">
        <thead>
          <tr>
            <th>Winner</th>
            <th>Loser</th>
            <th>Score</th>
            <th>Rating Change</th>
          </tr>
        </thead>
        <tbody>
          {data.matches.map(match_datum =>
            <tr key={`${match_datum.winner_id}+${match_datum.loser_id}`}>
              <td><Link to = {`/player/${match_datum.winner_id}`}>{match_datum.winner_name}</Link></td>
              <td><Link to = {`/player/${match_datum.loser_id}`}>{match_datum.loser_name}</Link></td>
              <td>{`${match_datum.winner_score}-${match_datum.loser_score}`}</td>
              <td>{match_datum.rating_change}</td>
            </tr>
          )}
        </tbody>
      </Table>
      Ratings
      <Table striped bordered hover size="sm">
        <thead>
          <tr>
            <th>Name</th>
            <th>Rating Before</th>
            <th>Rating After</th>
          </tr>
        </thead>
        <tbody>
          {data.ratings.map(rating_datum =>
            <tr key={rating_datum.id}>
              <td><Link to = {`/player/${rating_datum.id}`}>{rating_datum.name}</Link></td>
              <td>{rating_datum.rating_before}</td>
              <td>{rating_datum.rating_after}</td>
            </tr>
          )}
        </tbody>
      </Table>
    </Container>
  );
}

export default EventPage;
