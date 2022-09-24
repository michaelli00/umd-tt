import React, { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Table from 'react-bootstrap/Table';
import ReactLoading from 'react-loading';
import { Link } from 'react-router-dom';
import { LOADING_COLOR } from '../../utils/Constants';
import { fetchPlayerInfo, formatDate } from '../../utils/Utils';
import './PlayerProfile.css';

function PlayerProfile() {
  const [playerInfo, setPlayerInfo] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = Number(window.location.pathname.match(/\/(\d+)/)[1]);
    let loadPlayerInfo = async () => {
      setPlayerInfo(await fetchPlayerInfo(id));
      setLoading(false);
    };

    loadPlayerInfo();
  }, []);

  return (
    <Container className='PlayerProfile'>
      {!loading && playerInfo !== null ? (
        <React.Fragment>
          <h1> {playerInfo.name} </h1>
          <div className='player-info'>
            <b>Player ID</b>: &nbsp; {playerInfo.id}
          </div>
          <div className='player-info'>
            <b>Player Rating</b>: &nbsp; {playerInfo.rating}
          </div>
          <div className='player-info'>
            <b>Player Active</b>: &nbsp;
            {playerInfo.active ? 'Active' : 'Inactive'}
          </div>
          <br />
          <h1> Past Results </h1>
          <Table striped bordered hover size='sm'>
            <thead>
              <tr>
                <th>Date</th>
                <th>Event Name</th>
                <th>Rating Before</th>
                <th>Rating After</th>
              </tr>
            </thead>
            <tbody>
              {playerInfo.events.map(eventInfo => (
                <tr key={eventInfo.id}>
                  <td>{formatDate(eventInfo.date)}</td>
                  <td>
                    <Link to={`/event/${eventInfo.id}`}>
                      Group{eventInfo.event_num}
                    </Link>
                  </td>
                  <td>{eventInfo.rating_before}</td>
                  <td>{eventInfo.rating_after}</td>
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

export default PlayerProfile;
