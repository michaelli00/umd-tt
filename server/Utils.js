const get_points_exchanged = require('./rating_algo');

const {
  SELECT_FUTURE_EVENT_IDS_AND_DATES_QUERY,
  SELECT_FUTURE_EVENT_IDS_AND_DATES_EXCLUDING_EVENT_ID_QUERY,
  SELECT_LATEST_PLAYER_RATINGS_QUERY,
  SELECT_PLAYER_RATINGS_BEFORE_DATE_QUERY,
  UPDATE_MATCHES_RATING_QUERY,
  UPDATE_PLAYER_HISTORIES_WITHOUT_DATE_QUERY,
  SELECT_EVENTS_WITH_DATE_AND_EVENT_NUM_QUERY,
} = require('./Constant');

const calculateAndFormatMatches = (
  eventId,
  matches,
  oldPlayerRatings,
  updatedPlayerRatings
) => {
  const formattedMatches = [];
  matches.forEach(match => {
    const winnerRating = oldPlayerRatings[match.winner_id];
    const loserRating = oldPlayerRatings[match.loser_id];
    const ratingChange = get_points_exchanged(winnerRating, loserRating, 1);
    formattedMatches.push([
      eventId,
      match.winner_id,
      match.loser_id,
      match.winner_score,
      match.loser_score,
      ratingChange,
    ]);
    updatedPlayerRatings[match.winner_id] += ratingChange;
    updatedPlayerRatings[match.loser_id] = Math.max(
      updatedPlayerRatings[match.loser_id] - ratingChange,
      0
    );
  });
  return formattedMatches;
};

// Returns if two match lists are the same
const areMatchListsDifferent = (matches1, matches2) => {
  if (matches1.length !== matches2.length) {
    return true;
  }
  matches1.forEach(match1 => {
    if (
      !matches2.some(
        match2 =>
          match1.winner_id === match2.winner_id &&
          match1.loser_id === match2.loser_id &&
          match1.winner_score === match2.winner_score &&
          match1.loser_score === match2.loser_score
      )
    ) {
      return true;
    }
  });
  return false;
};

const getFutureEventIdsAndDates = async (client, eventDate, eventId = null) => {
  // For update events, we want to calculate the target event ID in the cascade update
  if (eventId === null) {
    return (
      await client.query(SELECT_FUTURE_EVENT_IDS_AND_DATES_QUERY, [eventDate])
    ).rows;
  }
  // For insert events, we DON'T want to calculate the target event ID since it has already been calculated
  return (
    await client.query(
      SELECT_FUTURE_EVENT_IDS_AND_DATES_EXCLUDING_EVENT_ID_QUERY,
      [eventDate, eventId]
    )
  ).rows;
};

const getPlayerRatingsBeforeDate = async (client, date) =>
  (
    await client.query(SELECT_PLAYER_RATINGS_BEFORE_DATE_QUERY, [date])
  ).rows.map(row => ({
    id: row.id,
    rating: row.adjusted_rating ? row.adjusted_rating : row.rating_after,
  }));

const getLatestPlayerRatings = async client =>
  (await client.query(SELECT_LATEST_PLAYER_RATINGS_QUERY)).rows.map(row => ({
    id: row.id,
    rating: row.adjusted_rating ? row.adjusted_rating : row.rating_after,
  }));

const updateEventResults = async (
  client,
  eventId,
  oldPlayerRatings,
  updatedPlayerRatings,
  matches
) => {
  // Update rating results for the match
  const formattedMatches = calculateAndFormatMatches(
    eventId,
    matches,
    oldPlayerRatings,
    updatedPlayerRatings
  );
  await client.query(UPDATE_MATCHES_RATING_QUERY(formattedMatches));

  const eventPlayers = Array.from(
    new Set(
      matches
        .map(match => match.winner_id)
        .concat(matches.map(match => match.loser_id))
    )
  );
  for (const id of eventPlayers) {
    await client.query(UPDATE_PLAYER_HISTORIES_WITHOUT_DATE_QUERY, [
      id,
      eventId,
      oldPlayerRatings[id],
      updatedPlayerRatings[id],
    ]);
  }
};

const isDuplicateEventNum = async (client, date, eventNum) =>
  (
    await client.query(
      SELECT_EVENTS_WITH_DATE_AND_EVENT_NUM_QUERY[(date, eventNum)]
    )
  ).rows.length > 0;

module.exports = {
  areMatchListsDifferent,
  calculateAndFormatMatches,
  getFutureEventIdsAndDates,
  getLatestPlayerRatings,
  getPlayerRatingsBeforeDate,
  isDuplicateEventNum,
  updateEventResults,
};
