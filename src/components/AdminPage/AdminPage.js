import React, { useEffect, useState } from 'react';
import Multiselect from 'multiselect-react-dropdown';
import Button from 'react-bootstrap/Button';
import ToggleButtonGroup from 'react-bootstrap/ToggleButtonGroup';
import ToggleButton from 'react-bootstrap/ToggleButton';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Table from 'react-bootstrap/Table';
import DatePicker from 'react-datepicker';
import ReactLoading from 'react-loading';
import { Link } from 'react-router-dom';
import { LOADING_COLOR } from '../../utils/Constants';
import {
  formatDate,
  formatMatchResults,
  fetchEvents,
  fetchEventInfo,
  fetchPlayerInfo,
  fetchPlayers,
  postCreateNewPlayer,
  postSubmitEventResults,
  putUpdatePlayerInfo,
  putUpdateEventResults,
} from '../../utils/Utils';
import 'react-datepicker/dist/react-datepicker.css';
import './AdminPage.css';

function AdminPage() {
  const [adminValidated, setAdminValidated] = useState(true); // admin page validation
  const [loading, setLoading] = useState(true); // is the page loading

  const [showAddPlayerForm, setShowAddPlayerForm] = useState(false);
  const [showUpdatePlayerInfoForm, setShowUpdatePlayerInfoForm] =
    useState(false);
  const [showAddResultsForm, setShowAddResultsForm] = useState(false);
  const [showUpdateResultsForm, setShowUpdateResultsForm] = useState(false);

  const [playerList, setPlayerList] = useState([]); // all players list
  const [leagueList, setLeagueList] = useState([]); // all leagues/events list

  const [playerInfo, setPlayerInfo] = useState({}); // selected player info
  const [eventInfo, setEventInfo] = useState({}); // selected event info

  useEffect(() => {
    let loadAdminPageData = async () => {
      setPlayerList(await fetchPlayers());
      setLeagueList(await fetchEvents());
      setLoading(false);
    };

    loadAdminPageData();
  }, []);

  const onSignIn = event => {
    event.preventDefault();
    const password = event.target.elements.formBasicPassword.value;
    if (password !== process.env.REACT_APP_ADMIN_PASSWORD) {
      alert('Wrong password. Try again.');
    } else {
      setAdminValidated(true);
    }
  };

  const onOpenAddPlayerForm = () => {
    setShowAddPlayerForm(true);
  };

  const onCloseAddPlayerForm = () => {
    setShowAddPlayerForm(false);
  };

  const onSubmitAddPlayerForm = async event => {
    event.preventDefault();
    const name = event.target.elements.formBasicName.value;
    const rating = Number(event.target.elements.formBasicRating.value);
    const reqBody = {
      players: [
        {
          pname: name,
          init_rating: rating,
        },
      ],
    };
    const updatedPlayersResponse = await postCreateNewPlayer(reqBody);
    setPlayerList(updatedPlayersResponse.players);
    setShowAddPlayerForm(false);
  };

  const onOpenUpdatePlayerInfoForm = async pid => {
    const playerInfo = await fetchPlayerInfo(pid);
    setPlayerInfo(playerInfo);
    setShowUpdatePlayerInfoForm(true);
  };

  const onCloseUpdatePlayerInfoForm = () => {
    setShowUpdatePlayerInfoForm(false);
  };

  const onSubmitUpdatePlayerInfoForm = async event => {
    event.preventDefault();
    const name = event.target.elements.formBasicName.value;
    const rating = Number(event.target.elements.formBasicRating.value);
    const reqBody = {
      players: [
        {
          pid: playerInfo.pid,
          pname: name,
          rating: rating,
          active: playerInfo.active,
        },
      ],
    };
    const updatedPlayersResponse = await putUpdatePlayerInfo(reqBody);
    setPlayerList(updatedPlayersResponse.players);
    setShowUpdatePlayerInfoForm(false);
  };

  const onChangeSelectedGroupPlayers = selected => {
    setEventInfo({ ...eventInfo, selectedPlayers: selected });
  };

  const onOpenResultsForm = () => {
    setShowAddResultsForm(true);
  };

  const onCloseResultsForm = () => {
    setShowUpdateResultsForm(false);
    setShowAddResultsForm(false);
    setEventInfo({});
  };

  const onOpenOldEventResultsForm = async eid => {
    const eventInfo = await fetchEventInfo(eid);
    const eventDate = new Date(eventInfo.edate);
    const playersObj = {};
    eventInfo.matches.forEach(match => {
      playersObj[match.winner_id] = match.winner_name;
      playersObj[match.loser_id] = match.loser_name;
    });
    const selectedPlayers = Object.keys(playersObj).map(pid => ({
      pid: Number(pid),
      pname: playersObj[pid],
    }));
    setEventInfo({
      ...eventInfo,
      eid: eid,
      eventDate: eventDate,
      selectedPlayers: selectedPlayers,
    });
    setShowUpdateResultsForm(true);
  };

  const onSubmitResultsForm = async event => {
    event.preventDefault();
    const name = event.target.elements.formBasicName.value;
    const date = eventInfo.eventDate;
    if (!date) {
      alert('Please enter event date.');
      return;
    }
    const players = eventInfo.selectedPlayers;
    if (!players || players.length < 2) {
      alert('Please choose at least 2 players.');
      return;
    }
    const playerMatchPairs = players
      .map((player1, index) =>
        players.slice(index + 1).map(player2 => [player1, player2])
      )
      .flat();
    const matches = [];
    for (let i = 0; i < (players.length * (players.length - 1)) / 2; i++) {
      const score = event.target.elements[`formBasicPair${i}`].value;
      if (score.match(/(\d).*-.*(\d)/)) {
        const points = score
          .match(/(\d).*-.*(\d)/)
          .slice(1)
          .map(point => Number(point));
        if (points.length === 2) {
          const p1Score = points[0];
          const p2Score = points[1];
          let match = {};
          if (p1Score > p2Score) {
            match = {
              winner_id: playerMatchPairs[i][0].pid,
              winner_score: p1Score,
              loser_id: playerMatchPairs[i][1].pid,
              loser_score: p2Score,
            };
          } else if (p2Score > p1Score) {
            match = {
              winner_id: playerMatchPairs[i][1].pid,
              winner_score: p2Score,
              loser_id: playerMatchPairs[i][0].pid,
              loser_score: p1Score,
            };
          }
          matches.push(match);
        }
      } else if (score !== '') {
        alert('Please format match scores correctly. For example 3-0');
        return;
      }
    }

    if (matches.length === 0) {
      alert('Please enter at least 1 match result.');
      return;
    }

    const reqBody = {
      edate: date,
      ename: name,
      matches: matches,
    };

    if (showAddResultsForm) {
      const updatedEventsResponse = await postSubmitEventResults(reqBody);
      setLeagueList(updatedEventsResponse.all_events);
      setShowAddResultsForm(false);
    } else if (showUpdateResultsForm) {
      reqBody['eid'] = eventInfo['eid'];
      const updatedEventsResponse = await putUpdateEventResults(reqBody);
      setLeagueList(updatedEventsResponse.all_events);
      setShowUpdateResultsForm(false);
    }
    setPlayerList(await fetchPlayers());
    setEventInfo({});
  };

  const renderMatchResultsForm = players => {
    const playerMatchPairs = players
      .map((player1, index) =>
        players.slice(index + 1).map(player2 => [player1, player2])
      )
      .flat();
    const formattedMatchResults = eventInfo.matches
      ? formatMatchResults(eventInfo.matches)
      : [];
    return playerMatchPairs.map((pair, index) => {
      const matchScore =
        pair[0].pid in formattedMatchResults
          ? formattedMatchResults[pair[0].pid][pair[1].pid]
          : '';
      return (
        <Form.Group
          controlId={`formBasicPair${index}`}
          className='admin-form'
          key={index}
        >
          <Form.Label>
            <h5>
              {pair[0].pname} vs. {pair[1].pname}
            </h5>
          </Form.Label>
          <Form.Control
            type='input'
            placeholder='0-3'
            defaultValue={matchScore}
          />
        </Form.Group>
      );
    });
  };

  const flatLeagueList = [];
  leagueList.forEach(league =>
    flatLeagueList.push.apply(
      flatLeagueList,
      league.events.map((event, index) => ({
        date: league.date,
        eid: event.eid,
        ename: event.ename,
        diffDate: index === 0 ? true : false,
      }))
    )
  );

  const activeInactiveRadios = [
    { name: 'Active', value: true },
    { name: 'Inactive', value: false },
  ];

  return (
    <Container className='AdminPage'>
      {!loading ? (
        <React.Fragment>
          <Modal
            size='lg'
            show={showAddPlayerForm}
            onHide={onCloseAddPlayerForm}
            backdrop='static'
          >
            <Modal.Header closeButton>
              <Modal.Title>Add a New Player</Modal.Title>
            </Modal.Header>
            <Form onSubmit={onSubmitAddPlayerForm}>
              <Modal.Body>
                <Form.Group controlId='formBasicName' className='admin-form'>
                  <Form.Label>
                    <h5>Player Name</h5>
                  </Form.Label>
                  <Form.Control type='input' placeholder='Name' required />
                </Form.Group>
                <br />
                <Form.Group controlId='formBasicRating' className='admin-form'>
                  <Form.Label>
                    <h5>Rating</h5>
                  </Form.Label>
                  <Form.Control type='number' placeholder='Rating' required />
                </Form.Group>
              </Modal.Body>
              <Modal.Footer>
                <Button variant='secondary' onClick={onCloseAddPlayerForm}>
                  Close
                </Button>
                <Button variant='primary' type='submit'>
                  Add Player
                </Button>
              </Modal.Footer>
            </Form>
          </Modal>
          <Modal
            size='lg'
            show={showUpdatePlayerInfoForm}
            onHide={onCloseUpdatePlayerInfoForm}
            backdrop='static'
          >
            <Modal.Header closeButton>
              <Modal.Title>Update an Existing Player Info</Modal.Title>
            </Modal.Header>
            <Form onSubmit={onSubmitUpdatePlayerInfoForm}>
              <Modal.Body>
                <Form.Group controlId='formBasicName' className='admin-form'>
                  <Form.Label>
                    <h5>Player Name</h5>
                  </Form.Label>
                  <Form.Control
                    type='input'
                    placeholder='Name'
                    defaultValue={playerInfo.pname}
                    required
                  />
                </Form.Group>
                <br />
                <Form.Group controlId='formBasicRating' className='admin-form'>
                  <Form.Label>
                    <h5>Rating</h5>
                  </Form.Label>
                  <Form.Control
                    type='number'
                    placeholder='Rating'
                    defaultValue={playerInfo.pr}
                    required
                  />
                </Form.Group>
                <br />
                <Form.Group controlId='formBasicActive' className='admin-form'>
                  <Form.Label>
                    <h5>Active/Inactive</h5>
                  </Form.Label>
                  <ToggleButtonGroup
                    type='radio'
                    name='activeOptions'
                    defaultValue={playerInfo.active}
                    onChange={v => setPlayerInfo({ ...playerInfo, active: v })}
                  >
                    {activeInactiveRadios.map((radio, idx) => (
                      <ToggleButton
                        key={idx}
                        id={`radio-${idx}`}
                        variant={idx % 2 ? 'outline-danger' : 'outline-success'}
                        value={radio.value}
                      >
                        {radio.name}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </Form.Group>
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant='secondary'
                  onClick={onCloseUpdatePlayerInfoForm}
                >
                  Close
                </Button>
                <Button variant='primary' type='submit'>
                  Update Player
                </Button>
              </Modal.Footer>
            </Form>
          </Modal>
          <Modal
            size='lg'
            show={showAddResultsForm || showUpdateResultsForm}
            onHide={onCloseResultsForm}
            backdrop='static'
          >
            <Modal.Header closeButton>
              <Modal.Title>Add or Update an Event</Modal.Title>
            </Modal.Header>
            <Form onSubmit={onSubmitResultsForm}>
              <Modal.Body>
                <Form.Group controlId='formBasicName' className='admin-form'>
                  <Form.Label>
                    <h5>Event Name</h5>
                  </Form.Label>
                  <Form.Control
                    type='input'
                    placeholder='Name'
                    defaultValue={eventInfo.ename}
                    required
                  />
                </Form.Group>
                <br />
                <Form.Group controlId='formBasicDate' className='admin-form'>
                  <Form.Label>
                    <h5>Event Date</h5>
                  </Form.Label>
                  <DatePicker
                    selected={eventInfo.eventDate}
                    onChange={date =>
                      setEventInfo({ ...eventInfo, eventDate: date })
                    }
                  />
                </Form.Group>
                <br />
                <Form.Group
                  controlId='formBasicSelectPlayers'
                  className='admin-form-multiselect'
                >
                  <Form.Label>
                    <h5>Select Players</h5>
                  </Form.Label>
                  <Multiselect
                    options={playerList.map(player => {
                      return { pname: player.pname, pid: player.pid };
                    })}
                    selectedValues={eventInfo.selectedPlayers}
                    onSelect={onChangeSelectedGroupPlayers}
                    onRemove={onChangeSelectedGroupPlayers}
                    displayValue='pname'
                    className='multi-select'
                  />
                </Form.Group>
                <br />
                <br />
                {eventInfo.selectedPlayers &&
                  eventInfo.selectedPlayers.length > 1 && (
                    <h5>
                      If no match results b/w two players, you can leave the
                      field empty.
                    </h5>
                  )}
                <br />
                {eventInfo.selectedPlayers &&
                  eventInfo.selectedPlayers.length > 1 &&
                  renderMatchResultsForm(eventInfo.selectedPlayers)}
              </Modal.Body>
              <Modal.Footer>
                <Button variant='secondary' onClick={onCloseResultsForm}>
                  Close
                </Button>
                <Button variant='primary' type='submit'>
                  Submit Event Results
                </Button>
              </Modal.Footer>
            </Form>
          </Modal>
          {adminValidated ? (
            <div>
              <div className='admin-header'>
                <h1>Player List</h1>
                <div className='change-button'>
                  <Button onClick={onOpenAddPlayerForm}>Add New Player</Button>
                </div>
              </div>
              <Table striped bordered hover size='sm'>
                <thead>
                  <tr>
                    <th>Player Name</th>
                    <th>Rating</th>
                    <th>Active/Inactive</th>
                    <th>Change Player Info</th>
                  </tr>
                </thead>
                <tbody>
                  {playerList.map(player => (
                    <tr key={player.pid}>
                      <td>
                        <Link to={`/player/${player.pid}`}>{player.pname}</Link>
                      </td>
                      <td>{player.pr}</td>
                      <td>{player.active ? 'Active' : 'Inactive'}</td>
                      <td>
                        <Button
                          onClick={() => onOpenUpdatePlayerInfoForm(player.pid)}
                        >
                          Change
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <br />
              <div className='admin-header'>
                <h1>Event List</h1>
                <div className='change-button'>
                  <Button onClick={onOpenResultsForm}>
                    Submit Event Results
                  </Button>
                </div>
              </div>
              <Table striped bordered hover size='sm'>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Event Name</th>
                    <th>Change Event Results</th>
                  </tr>
                </thead>
                <tbody>
                  {flatLeagueList.map(event => (
                    <tr key={event.eid}>
                      {event.diffDate ? (
                        <td>{formatDate(event.date)}</td>
                      ) : (
                        <td></td>
                      )}
                      <td>
                        <Link to={`/event/${event.eid}`}>{event.ename}</Link>
                      </td>
                      <td>
                        <Button
                          onClick={() => onOpenOldEventResultsForm(event.eid)}
                        >
                          Change Results
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <Form onSubmit={onSignIn}>
              <h1>Enter the Admin Password</h1>
              <Form.Group controlId='formBasicPassword' className='admin-form'>
                <Form.Control type='password' placeholder='Password' />
                <Button type='submit'>Submit</Button>
              </Form.Group>
            </Form>
          )}
        </React.Fragment>
      ) : (
        <ReactLoading
          type='spin'
          color={LOADING_COLOR}
          className='react-loading'
        />
      )}
    </Container>
  );
}

export default AdminPage;
