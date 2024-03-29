import React, { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Table from 'react-bootstrap/Table';
import ReactLoading from 'react-loading';
import { Link } from 'react-router-dom';
import { LOADING_COLOR } from '../../utils/Constants';
import { formatDate, fetchEvents } from '../../utils/Utils';
import './LeagueList.css';

function LeagueList() {
  const [leagueList, setLeagueList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let loadLeagues = async () => {
      setLeagueList(await fetchEvents());
      setLoading(false);
    };

    loadLeagues();
  }, []);

  return (
    <Container className='LeagueList'>
      {!loading && leagueList !== null ? (
        <React.Fragment>
          <h1>List of Previous Leagues</h1>
          <Table striped bordered hover size='sm'>
            <thead>
              <tr>
                <th>Date</th>
                <th>Events</th>
              </tr>
            </thead>
            <tbody>
              {leagueList.map(league => (
                <tr key={league.events[0].id}>
                  <td>{formatDate(league.date)}</td>
                  <td>
                    {league.events.map(event => (
                      <Link to={`/event/${event.id}`} key={event.id}>
                        <span className='event-name'>
                          Group{event.event_num}
                        </span>
                      </Link>
                    ))}
                  </td>
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

export default LeagueList;
