import {
  FETCH_EVENTS_URL,
  FETCH_EVENT_INFO_URL,
  FETCH_PLAYERS_URL,
  FETCH_PLAYER_INFO_URL,
  POST_CREATE_NEW_PLAYER_URL,
  POST_UPDATE_PLAYER_INFO_URL,
  POST_SUBMIT_EVENT_RESULTS,
} from './Constants.js';

export const formatDate = input => {
  const date = new Date(input);
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}

export const formatMatchResults = matches => {
  const formattedResults = {};
  matches.forEach(match => {
    const winnerID = match.winner_id;
    const loserID = match.loser_id;
    if (!(winnerID in formattedResults)) {
      formattedResults[winnerID] = {};
    }
    if (!(loserID in formattedResults)) {
      formattedResults[loserID] = {};
    }
    formattedResults[winnerID][loserID] = `${match.winner_score}-${match.loser_score}`;
    formattedResults[loserID][winnerID] = `${match.loser_score}-${match.winner_score}`;
  });
  return formattedResults;
}

export const fetchEvents = async () => {
  return fetch(FETCH_EVENTS_URL).then(res => res.json()).then(data => data.all_events);
}

export const fetchEventInfo = async eid => {
  return fetch(`${FETCH_EVENT_INFO_URL}/${eid}`).then(res => res.json());
}

export const fetchPlayers = async () => {
  return fetch(FETCH_PLAYERS_URL).then(res => res.json()).then(data => data.list);
}

export const fetchPlayerInfo = async pid => {
  return fetch(`${FETCH_PLAYER_INFO_URL}/${pid}`).then(res => res.json());
}

export const postCreateNewPlayer = async body => {
  return fetch(POST_CREATE_NEW_PLAYER_URL, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {'Content-Type': 'application/json'},
  }).then(res => res.json());
}

export const postUpdatePlayerInfo = async body => {
  return fetch(POST_UPDATE_PLAYER_INFO_URL, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {'Content-Type': 'application/json'},
  }).then(res => res.json());
}

export const postSubmitEventResults = async body => {
  return fetch(POST_SUBMIT_EVENT_RESULTS, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {'Content-Type': 'application/json'},
  }).then(res => res.json());
}
