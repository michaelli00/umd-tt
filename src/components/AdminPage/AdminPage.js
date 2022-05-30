import React, { useEffect, useState } from 'react';
import Multiselect from 'multiselect-react-dropdown';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Table from 'react-bootstrap/Table';
import ReactLoading from 'react-loading';
import {
  Link,
} from "react-router-dom";
import {
  fetchPlayers,
} from '../../utils/Utils';
import './AdminPage.css';

function AdminList() {
  const [adminValidated, setAdminValidated] = useState(false);
  const [showResultsForm, setShowResultsForm] = useState(false);
  const [showAddPlayerForm, setShowAddPlayerForm] = useState(false);
  const [selectedPlayersInGroup, setSelectedPlayersInGroup] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    let loadPlayerData = async () => {
      setPlayers(await fetchPlayers());
    }

    loadPlayerData();
    setLoading(false);
  }, []);

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
      date: '5/22/2022',
      name: 'Group 1',
    },
    {
      id: 2,
      date: '5/22/2022',
      name: 'Group 2',
    },
    {
      id: 3,
      date: '5/22/2022',
      name: 'Group 3',
    },
    {
      id: 4,
      date: '5/22/2022',
      name: 'Group 4',
    },
    {
      id: 5,
      date: '5/21/2022',
      name: 'Group 1',
    },
    {
      id: 6,
      date: '5/21/2022',
      name: 'Group 2',
    },
    {
      id: 7,
      date: '5/21/2022',
      name: 'Group 3',
    },
  ];

  const eventIndicesWithDifferentDates = [];
  let currEventDate = "";
  eventList.forEach((event, index) => {
    if (event.date !== currEventDate) {
      currEventDate = event.date;
      eventIndicesWithDifferentDates.push(index);
    }
  });

  return (
    <Container className="AdminPage">
      {!loading ?
        <React.Fragment>
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
                      options={players.map(player => {return {name: player.pname, id: player.pid}})}
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
                  {players.map(player =>
                    <tr key={player.pid}>
                      <td><Link to = {`/player/${player.id}`}>{player.pname}</Link></td>
                      <td>{player.pr}</td>
                      <td><Button>{player.active ? 'Active' : 'Inactive'}</Button></td>
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
                    <th>Date</th>
                    <th>Event Name</th>
                    <th>Change Event Results</th>
                  </tr>
                </thead>
                <tbody>
                  {eventList.map((datum, index) =>
                    <tr key={datum.id}>
                      {eventIndicesWithDifferentDates.includes(index) ? <td>{datum.date}</td> : <td></td>}
                      <td><Link to={`/event/${datum.id}`}>{datum.name}</Link></td>
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
        </React.Fragment>
      :
        <ReactLoading type='spin' color='#C41E3A' className='react-loading'/>
      }
    </Container>
  );
}

export default AdminList;
