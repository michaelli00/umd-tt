import {
  FETCH_EVENT_INFO_URL,
  FETCH_EVENTS_URL,
  FETCH_PLAYER_INFO_URL,
  FETCH_PLAYERS_URL,
  POST_ADD_EVENT,
  POST_ADD_PLAYER_URL,
  PUT_UPDATE_EVENT,
  PUT_UPDATE_PLAYER_INFO_URL,
} from './Constants.js';

export const formatDate = input => {
  const date = new Date(input);
  return `${date.getMonth() + 1}/${date.getDate() + 1}/${date.getFullYear()}`;
};

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
    formattedResults[winnerID][
      loserID
    ] = `${match.winner_score}-${match.loser_score}`;
    formattedResults[loserID][
      winnerID
    ] = `${match.loser_score}-${match.winner_score}`;
  });
  return formattedResults;
};

export const fetchEventInfo = async id => {
  console.log(`${FETCH_EVENT_INFO_URL}/${id}`);
  return fetch(`${FETCH_EVENT_INFO_URL}/${id}`).then(res => res.json());
};

export const fetchEvents = async () => {
  return fetch(FETCH_EVENTS_URL)
    .then(res => res.json());
};

export const fetchPlayerInfo = async id => {
  return fetch(`${FETCH_PLAYER_INFO_URL}/${id}`).then(res => res.json());
};

export const fetchPlayers = async () => {
  return fetch(FETCH_PLAYERS_URL)
    .then(res => res.json());
};

export const postAddEvent = async body => {
  return fetch(POST_ADD_EVENT, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  }).then(res => res.json());
};

export const postAddPlayer = async body => {
  return fetch(POST_ADD_PLAYER_URL, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  }).then(res => res.json());
};

export const putAddPlayer = async body => {
  return fetch(PUT_UPDATE_PLAYER_INFO_URL, {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  }).then(res => res.json());
};

export const putUpdateEvent = async body => {
  return fetch(PUT_UPDATE_EVENT, {
    method: 'post',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  }).then(res => res.json());
};
