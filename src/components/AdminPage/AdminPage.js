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
  fetchAllPlayers,
  fetchEventInfo,
  fetchEvents,
  fetchPlayerInfo,
  formatDate,
  formatDateForDatePicker,
  formatDateForRequest,
  formatMatchResults,
  postAddEvent,
  postAddPlayer,
  putUpdatePlayer,
  putUpdateEvent,
} from '../../utils/Utils';
import 'react-datepicker/dist/react-datepicker.css';
import './AdminPage.css';

function AdminPage() {
  // TODO set validated to false
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
      setPlayerList(await fetchAllPlayers());
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

  const onSubmitAddPlayeForm = async event => {
    event.preventDefault();
    const name = event.target.elements.formBasicName.value;
    const rating = Number(event.target.elements.formBasicRating.value);
    const reqBody = {
      name: name,
      rating: rating,
    };
    const updatedPlayersResponse = await postAddPlayer(reqBody);
    if (updatedPlayersResponse !== null) {
      setPlayerList(updatedPlayersResponse);
      setShowAddPlayerForm(false);
    }
  };

  const onOpenUpdatePlayerInfoForm = async id => {
    const playerInfo = await fetchPlayerInfo(id);
    setPlayerInfo(playerInfo);
    setShowUpdatePlayerInfoForm(true);
  };

  const onCloseUpdatePlayerInfoForm = () => {
    setShowUpdatePlayerInfoForm(false);
  };

  const onSubmitUpdatePlayerInfoForm = async event => {
    event.preventDefault();
    const name = event.target.elements.formBasicName.value;
    const rating = event.target.elements.formBasicRating.value;
    const reqBody = {
      id: playerInfo.id,
      name: name,
      rating: rating,
      active: playerInfo.active,
    };
    const updatedPlayersResponse = await putUpdatePlayer(reqBody);
    if (updatedPlayersResponse !== null) {
      setPlayerList(updatedPlayersResponse);
      setShowUpdatePlayerInfoForm(false);
    }
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

  const onOpenOldEventResultsForm = async id => {
    const eventInfo = await fetchEventInfo(id);
    const playersObj = {};
    eventInfo.matches.forEach(match => {
      playersObj[match.winner_id] = match.winner_name;
      playersObj[match.loser_id] = match.loser_name;
    });
    const selectedPlayers = Object.keys(playersObj).map(id => ({
      id: Number(id),
      name: playersObj[id],
    }));
    setEventInfo({
      ...eventInfo,
      id: id,
      selectedPlayers: selectedPlayers,
    });
    setShowUpdateResultsForm(true);
  };

  const onSubmitResultsForm = async event => {
    event.preventDefault();
    const groupNumber = event.target.elements.formBasicGroupNumber.value;
    const date = eventInfo.date;
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
              winner_id: playerMatchPairs[i][0].id,
              winner_score: p1Score,
              loser_id: playerMatchPairs[i][1].id,
              loser_score: p2Score,
            };
          } else if (p2Score > p1Score) {
            match = {
              winner_id: playerMatchPairs[i][1].id,
              winner_score: p2Score,
              loser_id: playerMatchPairs[i][0].id,
              loser_score: p1Score,
            };
          } else {
            alert('Invalid score. There must be a winner!');
            return;
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
      date: formatDateForRequest(date),
      event_num: groupNumber,
      matches: matches,
    };

    let updatedEventsResponse = null;
    if (showAddResultsForm) {
      updatedEventsResponse = await postAddEvent(reqBody);
    } else if (showUpdateResultsForm) {
      reqBody.id = eventInfo.id;
      updatedEventsResponse = await putUpdateEvent(reqBody);
    }
    if (updatedEventsResponse !== null) {
      setLeagueList(updatedEventsResponse);
      setShowAddResultsForm(false);
      setPlayerList(await fetchAllPlayers());
      setEventInfo({});
    }
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
        pair[0].id in formattedMatchResults
          ? formattedMatchResults[pair[0].id][pair[1].id]
          : '';
      return (
        <Form.Group
          controlId={`formBasicPair${index}`}
          className='admin-form'
          key={index}
        >
          <Form.Label>
            <h5>
              {pair[0].name} vs. {pair[1].name}
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
        date: formatDate(new Date(league.date)),
        id: event.id,
        event_num: event.event_num,
        diffDate: index === 0 ? true : false,
      }))
    )
  );

  const activeInactiveRadios = [
    { name: 'Active', value: true },
    { name: 'Inactive', value: false },
  ];

  const addOrUpdateNewEventString = showUpdateResultsForm
    ? 'Update Event Results'
    : 'Add New Event Results';

  return (
    <Container className='AdminPage'>
      {!loading && playerList !== null && leagueList !== null ? (
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
            <Form onSubmit={onSubmitAddPlayeForm}>
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
                    defaultValue={playerInfo.name}
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
                    defaultValue={playerInfo.rating}
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
                    onChange={val =>
                      setPlayerInfo({ ...playerInfo, active: val })
                    }
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
                <Form.Group
                  controlId='formBasicGroupNumber'
                  className='admin-form'
                >
                  <Form.Label>
                    <h5>Event Group Number</h5>
                  </Form.Label>
                  <Form.Control
                    type='number'
                    placeholder='Group Number'
                    defaultValue={eventInfo.event_num}
                    required
                  />
                </Form.Group>
                <br />
                <Form.Group controlId='formBasicDate' className='admin-form'>
                  <Form.Label>
                    <h5>Event Date</h5>
                  </Form.Label>
                  <DatePicker
                    selected={
                      eventInfo.date
                        ? formatDateForDatePicker(eventInfo.date)
                        : ''
                    }
                    onChange={date =>
                      setEventInfo({
                        ...eventInfo,
                        date: formatDateForRequest(date),
                      })
                    }
                    minDate={new Date('2000-01-01')}
                    maxDate={new Date()}
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
                    options={playerList
                      .filter(player => player.active)
                      .map(player => {
                        return { name: player.name, id: player.id };
                      })}
                    selectedValues={eventInfo.selectedPlayers}
                    onSelect={onChangeSelectedGroupPlayers}
                    onRemove={onChangeSelectedGroupPlayers}
                    displayValue='name'
                    className='multi-select'
                  />
                </Form.Group>
                <br />
                <br />
                {eventInfo.selectedPlayers &&
                  eventInfo.selectedPlayers.length > 1 && (
                    <h5>
                      If there are no match results b/w two players, you can
                      leave the field empty.
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
                  {addOrUpdateNewEventString}
                </Button>
              </Modal.Footer>
            </Form>
          </Modal>
          {adminValidated ? (
            <div>
              <div className='admin-header'>
                <h1>Player Rating List</h1>
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
                    <tr key={player.id}>
                      <td>
                        <Link to={`/player/${player.id}`}>{player.name}</Link>
                      </td>
                      <td>{player.rating}</td>
                      <td>{player.active ? 'Active' : 'Inactive'}</td>
                      <td>
                        <Button
                          onClick={() => onOpenUpdatePlayerInfoForm(player.id)}
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
                    Add New Event Results
                  </Button>
                </div>
              </div>
              <Table striped bordered hover size='sm'>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Event Group Number</th>
                    <th>Change Event Results</th>
                  </tr>
                </thead>
                <tbody>
                  {flatLeagueList.map(event => (
                    <tr key={event.id}>
                      {event.diffDate ? (
                        <td>{formatDate(event.date)}</td>
                      ) : (
                        <td></td>
                      )}
                      <td>
                        <Link to={`/event/${event.id}`}>
                          Group{event.event_num}
                        </Link>
                      </td>
                      <td>
                        <Button
                          onClick={() => onOpenOldEventResultsForm(event.id)}
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
