import React, { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Table from 'react-bootstrap/Table';
import ReactLoading from 'react-loading';
import {
  Link,
} from "react-router-dom";
import {
  fetchPlayerInfo,
  formatDate,
} from '../../utils/Utils';
import './PlayerProfile.css';

function PlayerProfile() {
  const [playerInfo, setPlayerInfo] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pid = Number(window.location.pathname.match(/\/(\d+)/)[1]);
    let loadPlayerInfo = async () => {
      setPlayerInfo(await fetchPlayerInfo(pid));
      setLoading(false);
    }

    loadPlayerInfo();
  }, []);
  console.log(playerInfo);

  return (
    <Container className="PlayerProfile">
      {!loading ?
        <React.Fragment>
          <h1> {playerInfo.pname} </h1>
          <div className="player-info"><b>Player ID</b>: &nbsp; {playerInfo.pid} </div>
          <div className="player-info"><b>Player Rating</b>: &nbsp; {playerInfo.pr} </div>
          <div className="player-info"><b>Player Active</b>: &nbsp; {playerInfo.active ? 'Active' : 'Inactive'} </div>
          <br/>
          <h1> Past Results </h1>
          <Table striped bordered hover size="sm">
            <thead>
              <tr>
                <th>Date</th>
                <th>Event Name</th>
                <th>Rating Before</th>
                <th>Rating After</th>
              </tr>
            </thead>
            <tbody>
              {playerInfo.events.map(eventInfo =>
                <tr key={eventInfo.eid}>
                  <td>{formatDate(eventInfo.edate)}</td>
                  <td><Link to = {`/event/${eventInfo.eid}`}>{eventInfo.ename}</Link></td>
                  <td>{eventInfo.rating_before}</td>
                  <td>{eventInfo.rating_after}</td>
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

export default PlayerProfile;
