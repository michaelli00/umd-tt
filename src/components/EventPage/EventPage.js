import React, { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Table from 'react-bootstrap/Table';
import ReactLoading from 'react-loading';
import { Link } from 'react-router-dom';
import { LOADING_COLOR } from '../../utils/Constants';
import { formatDate, fetchEventInfo } from '../../utils/Utils';
import './EventPage.css';

function EventPage() {
  const [eventInfo, setEventInfo] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = Number(window.location.pathname.match(/\/(\d+)/)[1]);
    let loadEventInfo = async () => {
      setEventInfo(await fetchEventInfo(id));
      setLoading(false);
    };

    loadEventInfo();
  }, []);

  return (
    <Container className='EventPage'>
      {!loading && eventInfo !== null ? (
        <React.Fragment>
          <h1>{`${formatDate(eventInfo.date)} Group${eventInfo.event_num}`}</h1>
          <br />
          <h1>Matches</h1>
          <Table striped bordered hover size='sm'>
            <thead>
              <tr>
                <th>Winner</th>
                <th>Loser</th>
                <th>Score</th>
                <th>Rating Change</th>
              </tr>
            </thead>
            <tbody>
              {eventInfo.matches.map(matchInfo => (
                <tr key={`${matchInfo.winner_id}+${matchInfo.loser_id}`}>
                  <td>
                    <Link to={`/player/${matchInfo.winner_id}`}>
                      {matchInfo.winner_name}
                    </Link>
                  </td>
                  <td>
                    <Link to={`/player/${matchInfo.loser_id}`}>
                      {matchInfo.loser_name}
                    </Link>
                  </td>
                  <td>{`${matchInfo.winner_score}-${matchInfo.loser_score}`}</td>
                  <td>{matchInfo.rating_change}</td>
                </tr>
              ))}
            </tbody>
          </Table>
          <br />
          <h1>Rating Changes</h1>
          <Table striped bordered hover size='sm'>
            <thead>
              <tr>
                <th>Name</th>
                <th>Rating Before</th>
                <th>Rating After</th>
              </tr>
            </thead>
            <tbody>
              {eventInfo.ratings.map(ratingInfo => (
                <tr key={ratingInfo.player_id}>
                  <td>
                    <Link to={`/player/${ratingInfo.player_id}`}>
                      {ratingInfo.name}
                    </Link>
                  </td>
                  <td>{ratingInfo.rating_before}</td>
                  <td>{ratingInfo.rating_after}</td>
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

export default EventPage;
