import React, { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Table from 'react-bootstrap/Table';
import ReactLoading from 'react-loading';
import {
  Link,
} from "react-router-dom";
import {
  fetchEventInfo,
} from '../../utils/Utils';
import './EventPage.css';

function EventPage() {
  const [eventInfo, setEventInfo] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const eid = Number(window.location.pathname.match(/\/(\d+)/)[1]);
    let loadEventInfo = async () => {
      setEventInfo(await fetchEventInfo(eid));
      setLoading(false);
    }

    loadEventInfo();
  }, []);

  const eventDate = new Date(eventInfo.edate);
  const eventDateString = `${eventDate.getMonth() + 1}/${eventDate.getDate()}/${eventDate.getFullYear()}`;

  return (
    <Container className="EventPage">
      {!loading ?
        <React.Fragment>
          <h1>{`${eventDateString} ${eventInfo.ename}`}</h1>
          <br/>
          <h1>Matches</h1>
          <Table striped bordered hover size="sm">
            <thead>
              <tr>
                <th>Winner</th>
                <th>Loser</th>
                <th>Score</th>
                <th>Rating Change</th>
              </tr>
            </thead>
            <tbody>
              {eventInfo.matches.map(matchInfo =>
                <tr key={`${matchInfo.winner_id}+${matchInfo.loser_id}`}>
                  <td><Link to = {`/player/${matchInfo.winner_id}`}>{matchInfo.winner_name}</Link></td>
                  <td><Link to = {`/player/${matchInfo.loser_id}`}>{matchInfo.loser_name}</Link></td>
                  <td>{`${matchInfo.winner_score}-${matchInfo.loser_score}`}</td>
                  <td>{matchInfo.rating_diff}</td>
                </tr>
              )}
            </tbody>
          </Table>
          <br/>
          <h1>Rating Changes</h1>
          <Table striped bordered hover size="sm">
            <thead>
              <tr>
                <th>Name</th>
                <th>Rating Before</th>
                <th>Rating After</th>
              </tr>
            </thead>
            <tbody>
              {eventInfo.ratings.map(ratingInfo =>
                <tr key={ratingInfo.pid}>
                  <td><Link to = {`/player/${ratingInfo.pid}`}>{ratingInfo.pname}</Link></td>
                  <td>{ratingInfo.rating_before}</td>
                  <td>{ratingInfo.rating_after}</td>
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

export default EventPage;
