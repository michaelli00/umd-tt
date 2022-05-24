import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Table from 'react-bootstrap/Table';
import Multiselect from 'multiselect-react-dropdown';
import {
  Link,
} from "react-router-dom";
import './AdminPage.css';

function AdminList() {
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

  const [adminValidated, setAdminValidated] = useState(true);
  const [showResultsForm, setShowResultsForm] = useState(false);
  const [showAddPlayerForm, setShowAddPlayerForm] = useState(false);
  const [selectedPlayersInGroup, setSelectedPlayersInGroup] = useState([]);

  const onSignIn = event => {
    event.preventDefault();
    const password = event.target.elements.formBasicPassword.value;
    if (password !== process.env.REACT_APP_ADMIN_PASSWORD) {
      alert('Wrong password. Try again.');
    } else {
      setAdminValidated(true);
    }
  }

  const onOpenAddPlayerForm = () => {
    setShowAddPlayerForm(true);
  }

  const onCloseAddPlayerForm = () => {
    setShowAddPlayerForm(false);
  }

  const onSubmitAddPlayerForm = event => {
    event.preventDefault();
    const name = event.target.elements.formBasicName.value;
    const rating = event.target.elements.formBasicRating.value;
  }

  const onChangeSelectedGroupPlayers = selected => {
    setSelectedPlayersInGroup([...selected]);
  }

  const onOpenResultsForm = () => {
    setShowResultsForm(true);
  }

  const onCloseResultsForm = () => {
    setShowResultsForm(false);
    setSelectedPlayersInGroup([]);
  }

  const onSubmitResultsForm = event => {
    event.preventDefault();
    const name = event.target.elements.formBasicName.value;
    const players = selectedPlayersInGroup;
    const matchScores = [];

    setSelectedPlayersInGroup([]);
  }

  const renderMatchResultsForm = players => {
    const playerMatchPairs = players.map((player1, index) => players.slice(index + 1).map(player2 => [player1, player2])).flat();
    return playerMatchPairs.map((pair, index) =>
      <Form.Group controlId={`formBasicPair${index}`} className="admin-form" key={index}>
        <Form.Label>
          <h5>{pair[0].name} vs. {pair[1].name}</h5>
        </Form.Label>
      <Form.Control type="input" placeholder="0-3"/>
      </Form.Group>);
  }

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
    <Container className="AdminPage">
      <Modal size="lg" show={showAddPlayerForm} onHide={onCloseAddPlayerForm} backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>Add a New Player</Modal.Title>
        </Modal.Header>
          <Form onSubmit={onSubmitAddPlayerForm}>
            <Modal.Body>
              <Form.Group controlId="formBasicName" className="admin-form">
                <Form.Label><h5>Player Name</h5></Form.Label>
                <Form.Control
                  type="input"
                  placeholder="Name"
                />
              </Form.Group>
              <br/>
              <Form.Group controlId="formBasicRating" className="admin-form">
                <Form.Label><h5>Rating (Optional)</h5></Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Rating (Optional)"
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={onCloseAddPlayerForm}>
                Close
              </Button>
              <Button variant="primary" type="submit">
                Add Player
              </Button>
            </Modal.Footer>
          </Form>
      </Modal>
      <Modal size="lg" show={showResultsForm} onHide={onCloseResultsForm} backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>Add or Update an Event</Modal.Title>
        </Modal.Header>
          <Form onSubmit={onSubmitResultsForm}>
            <Modal.Body>
              <Form.Group controlId="formBasicName" className="admin-form">
                <Form.Label><h5>Event Name</h5></Form.Label>
                <Form.Control type="input" placeholder="Name"/>
              </Form.Group>
              <br/>
              <Form.Group controlId="formBasicSelectPlayers" className="admin-form">
                <Form.Label><h5>Select Players</h5></Form.Label>
                <Multiselect
                  options={playerList.map(player => {return {name: player.name, id: player.id}})}
                  selectedVluaes={selectedPlayersInGroup}
                  onSelect={onChangeSelectedGroupPlayers}
                  onRemove={onChangeSelectedGroupPlayers}
                  displayValue="name"
                />
              </Form.Group>
              <br/>
              <br/>
              <br/>
              {selectedPlayersInGroup.length > 1 && renderMatchResultsForm(selectedPlayersInGroup)}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={onCloseResultsForm}>
                Close
              </Button>
              <Button variant="primary" type="submit">
                Submit Event Results
              </Button>
            </Modal.Footer>
          </Form>
      </Modal>
      {adminValidated ?
        <div>
          <div className="admin-header">
            <h1>Player List</h1>
            <div className="change-button">
              <Button onClick={onOpenAddPlayerForm}>Add New Player</Button>
            </div>
          </div>
          <Table striped bordered hover size="sm">
            <thead>
              <tr>
                <th>Player Name</th>
                <th>Rating</th>
                <th>Active/Inactive</th>
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
          <br/>
          <div className="admin-header">
            <h1>Event List</h1>
            <div className="change-button">
              <Button onClick= {onOpenResultsForm}>Submit Event Results</Button>
            </div>
          </div>
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
        <Form onSubmit={onSignIn}>
          <h1>Enter the Admin Password</h1>
          <Form.Group controlId="formBasicPassword" className="admin-form">
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
