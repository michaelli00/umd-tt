import React, { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';
import ReactLoading from 'react-loading';
import { Link } from 'react-router-dom';
import { LOADING_COLOR } from '../../utils/Constants';
import { fetchActivePlayers } from '../../utils/Utils';
import './PlayerList.css';

function PlayerList() {
  const [players, setPlayers] = useState([]);
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
          <Container >
          <h1>Player Rating List</h1>
          <Form className="d-flex"> <Form.Control type="search" placeholder="Search" className="me-2" aria-label="Search" />  </Form>
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
                .filter(player => player.active)
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
