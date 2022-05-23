import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';
import {
  Link,
} from "react-router-dom";

function AdminList() {
  const [adminValidated, setAdminValidated] = useState(false);

  const signIn = event => {
    event.preventDefault();
    const password = event.target.elements.formBasicPassword.value;
    if (password !== process.env.REACT_APP_ADMIN_PASSWORD) {
      alert('Wrong password. Try again.');
    } else {
      setAdminValidated(true);
    }
  }

  const playerList = [
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

  const eventList = [
    {
      id: 1,
      name: '5/22/2022 Group 1',
    },
    {
      id: 2,
      name: '5/22/2022 Group 2',
    },
    {
      id: 3,
      name: '5/22/2022 Group 3',
    },
    {
      id: 4,
      name: '5/22/2022 Group 4',
    },
    {
      id: 5,
      name: '5/21/2022 Group 1',
    },
    {
      id: 6,
      name: '5/21/2022 Group 2',
    },
    {
      id: 7,
      name: '5/21/2022 Group 3',
    },
  ];

  return (
    <Container>
      {adminValidated ?
        <div>
          Player List
          <Table striped bordered hover size="sm">
            <thead>
              <tr>
                <th>Player Name</th>
                <th>Rating</th>
                <th>Active/Deactive</th>
              </tr>
            </thead>
            <tbody>
              {playerList.map(datum =>
                <tr key={datum.id}>
                  <td><Link to = {`/player/${datum.id}`}>{datum.name}</Link></td>
                  <td>{datum.rating}</td>
                  <td><Button>{datum.active ? 'Active' : 'Inactive'}</Button></td>
                </tr>
              )}
            </tbody>
          </Table>
          Event List
          <Table striped bordered hover size="sm">
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Change Event Results</th>
              </tr>
            </thead>
            <tbody>
              {eventList.map(datum =>
                <tr key={datum.id}>
                  <td>{datum.name}</td>
                  <td><Button>Change Results</Button></td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
        :
        <Form onSubmit={signIn}>
          <Form.Group controlId="formBasicPassword">
            <Form.Label>Enter the Admin Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Password"
            />
            <Button type="submit">Submit</Button>
          </Form.Group>
        </Form>
      }
    </Container>
  );
}

export default AdminList;
