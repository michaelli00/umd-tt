import {
  FETCH_EVENT_INFO_URL,
  FETCH_EVENTS_URL,
  FETCH_PLAYER_INFO_URL,
  FETCH_ACTIVE_PLAYERS_URL,
  FETCH_ALL_PLAYERS_URL,
  POST_ADD_EVENT,
  POST_ADD_PLAYER_URL,
  PUT_UPDATE_EVENT_URL,
  PUT_UPDATE_PLAYER_INFO_URL,
} from './Constants.js';

// Stupid javascript timezone issues
export const formatDate = input => {
  const date = new Date(input);
  return `
    ${date.getUTCMonth() + 1}/${date.getUTCDate()}/${date.getUTCFullYear()}
  `;
};

export const formatDateForRequest = input => {
  const date = new Date(input);
  return `
    ${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}
  `;
};

export const formatDateForDatePicker = input => {
  // Stupid javascript timezone issues
  // I really hate javascript dates
  // Like I really really despise javascript dates
  const dateFieldsList = input.split(/[-]/);
  const date = new Date(
    dateFieldsList[0],
    dateFieldsList[1] - 1,
    dateFieldsList[2]
  );
  const utcDate = new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  );
  return Date.parse(utcDate);
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

export const fetchActivePlayers = async () => {
  return fetch(FETCH_ACTIVE_PLAYERS_URL).then(res => {
    if (res.status === 200) {
      return res.json();
    } else {
      // TODO REMOVE
      console.log(res);
      alert(
        'Something went wrong with the app when retrieving active players. Please refresh the page and try again.'
      );
      return null;
    }
  });
};

export const fetchAllPlayers = async () => {
  return fetch(FETCH_ALL_PLAYERS_URL).then(res => {
    if (res.status === 200) {
      return res.json();
    } else {
      // TODO REMOVE
      console.log(res);
      alert(
        'Something went wrong with the app when retrieving all players. Please refresh the page and try again.'
      );
      return null;
    }
  });
};

export const fetchEventInfo = async id => {
  return fetch(`${FETCH_EVENT_INFO_URL}/${id}`).then(res => {
    if (res.status === 200) {
      return res.json();
    } else if (res.status === 404) {
      alert('Invalid event id. Nothing to show.');
      return null;
    } else {
      // TODO REMOVE
      console.log(res);
      alert(
        'Something went wrong with the app when retrieving event info. Please refresh the page and try again.'
      );
      return null;
    }
  });
};

export const fetchEvents = async () => {
  return fetch(FETCH_EVENTS_URL).then(res => {
    if (res.status === 200) {
      return res.json();
    } else {
      // TODO REMOVE
      console.log(res);
      alert(
        'Something went wrong with the app when retrieving all events. Please refresh the page and try again.'
      );
      return null;
    }
  });
};

export const fetchPlayerInfo = async id => {
  return fetch(`${FETCH_PLAYER_INFO_URL}/${id}`).then(res => {
    if (res.status === 200) {
      return res.json();
    } else if (res.status === 404) {
      alert('Invalid player id. Nothing to show.');
      return null;
    } else {
      // TODO REMOVE
      console.log(res);
      alert(
        'Something went wrong with the app when retrieving event info. Please refresh the page and try again.'
      );
      return null;
    }
  });
};

export const postAddEvent = async body => {
  return fetch(POST_ADD_EVENT, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  }).then(res => {
    if (res.status === 200) {
      return res.json();
    } else if (res.status === 403) {
      alert(
        'Event Group Number already exists for this date. Please select another group number or date.'
      );
      return null;
    } else {
      // TODO REMOVE
      console.log(res);
      alert(
        'Something went wrong with the app when adding an event. Please refresh the page and try again.'
      );
      return null;
    }
  });
};

export const postAddPlayer = async body => {
  return fetch(POST_ADD_PLAYER_URL, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  }).then(res => {
    if (res.status === 200) {
      return res.json();
    } else {
      // TODO REMOVE
      console.log(res);
      alert(
        'Something went wrong with the app when add a player. Please refresh the page and try again.'
      );
      return null;
    }
  });
};

export const putUpdatePlayer = async body => {
  return fetch(PUT_UPDATE_PLAYER_INFO_URL, {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  }).then(res => {
    if (res.status === 200) {
      return res.json();
    } else {
      // TODO REMOVE
      console.log(res);
      alert(
        'Something went wrong with the app when updating a player. Please refresh the page and try again.'
      );
      return null;
    }
  });
};

export const putUpdateEvent = async body => {
  return fetch(PUT_UPDATE_EVENT_URL, {
    method: 'post',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  }).then(res => {
    if (res.status === 200) {
      return res.json();
    } else if (res.status === 403) {
      alert(
        'Event Group Number already exists for this date. Please select another group number or date.'
      );
      return null;
    } else if (res.status === 404) {
      alert(
        "App doesn't support updating event dates that have player rating adjustments."
      );
      return null;
    } else {
      // TODO REMOVE
      console.log(res);
      alert(
        'Something went wrong with the app when updating an event. Please refresh the page and try again.'
      );
      return null;
    }
  });
};
