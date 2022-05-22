import Container from 'react-bootstrap/Container';
import Table from 'react-bootstrap/Table';
import {
  Link,
} from "react-router-dom";

function LeagueList() {
  const data = [
    {
      date: "5/22/2022",
      events: [
        {
          id: 1,
          name: 'Group 1',
        },
        {
          id: 2,
          name: 'Group 2',
        },
        {
          id: 3,
          name: 'Group 3',
        },
        {
          id: 4,
          name: 'Group 4',
        },
      ],
    },
    {
      date: "5/21/2022",
      events: [
        {
          id: 5,
          name: 'Group 1',
        },
        {
          id: 6,
          name: 'Group 2',
        },
        {
          id: 7,
          name: 'Group 3',
        },
      ],
    },
  ];

  return (
    <Container>
      <Table striped bordered hover size="sm">
        <thead>
          <tr>
            <th>Date</th>
            <th>Events</th>
          </tr>
        </thead>
        <tbody>
          {data.map(datum =>
            <tr key={datum.events[0].id}>
              <td>{datum.date}</td>
              <td>{datum.events.map(event =>
                <Link to={`/event/${event.id}`} key={event.id}>{event.name}</Link>)}
            </td>
            </tr>
          )}
        </tbody>
      </Table>
    </Container>
  );
}

export default LeagueList;
