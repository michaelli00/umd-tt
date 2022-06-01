import {
  FETCH_EVENT_INFO_URL,
  FETCH_PLAYERS_URL,
  FETCH_PLAYER_INFO_URL,
} from './Constants.js';

export const fetchPlayers = async () => {
  return fetch(FETCH_PLAYERS_URL).then(res => res.json()).then(data => data.list);
}

export const fetchPlayerInfo = async pid => {
  return fetch(`${FETCH_PLAYER_INFO_URL}/${pid}`).then(res => res.json());
}

export const fetchEventInfo = async eid => {
  return fetch(`${FETCH_EVENT_INFO_URL}/${eid}`).then(res => res.json());
}
