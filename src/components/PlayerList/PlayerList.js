import React, { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Table from 'react-bootstrap/Table';
import ReactLoading from 'react-loading';
import {
  Link,
} from "react-router-dom";
import {
  fetchPlayers,
} from '../../utils/Utils';
import './PlayerList.css';

function PlayerList() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let loadPlayerData = async () => {
      setPlayers(await fetchPlayers());
      setLoading(false);
    }

    loadPlayerData();
  }, []);

  return (
    <Container className="PlayerList">
      {!loading ?
        <React.Fragment>
          <h1>Player/Rating List</h1>
          <Table striped bordered hover size="sm">
            <thead>
              <tr>
                <th>Player Name</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {players.map(player =>
                <tr key={player.pid}>
                  <td><Link to = {`/player/${player.pid}`}>{player.pname}</Link></td>
                  <td>{player.pr}</td>
                </tr>
              )}
            </tbody>
          </Table>
        </React.Fragment>
      :
        <ReactLoading type='spin' color='#C41E3A' className='react-loading'/>
      }
    </Container>
  );
}

export default PlayerList;
