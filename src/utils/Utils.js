import {
  FETCH_PLAYERS_URL,
} from './Constants.js';

export const fetchPlayers = async () => {
  return fetch(FETCH_PLAYERS_URL).then(res => res.json());
}
