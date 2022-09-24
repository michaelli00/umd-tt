import React, { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';
import ReactLoading from 'react-loading';
import { Link } from 'react-router-dom';
import { LOADING_COLOR } from '../../utils/Constants';
import { fetchActivePlayers } from '../../utils/Utils';
import './PlayerList.css';

function PlayerList() {
  const [players, setPlayers] = useState([]);
  const [playerFilter, setPlayerFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let loadPlayerData = async () => {
      setPlayers(await fetchActivePlayers());
      setLoading(false);
    };

    loadPlayerData();
  }, []);

  return (
    <Container className='PlayerList'>
      {!loading && players !== null ? (
        <React.Fragment>
          <Container>
            <Row>
              <Col md={3} />
              <Col md={6}>
                <h1>Player Rating List</h1>
              </Col>
              <Col md={3}>
                <Form>
                  <Form.Control
                    type='search'
                    placeholder='Search Players'
                    className='text-truncate'
                    onChange={val => setPlayerFilter(val.target.value)}
                  />
                </Form>
              </Col>
            </Row>
          </Container>
          <Table striped bordered hover size='sm'>
            <thead>
              <tr>
                <th>Player Name</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {players
                .filter(
                  player =>
                    player.active &&
                    (playerFilter === '' || player.name.toLowerCase().includes(playerFilter.toLowerCase()))
                )
                .map(player => (
                  <tr key={player.id}>
                    <td>
                      <Link to={`/player/${player.id}`}>{player.name}</Link>
                    </td>
                    <td>{player.rating}</td>
                  </tr>
                ))}
            </tbody>
          </Table>
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

export default PlayerList;
