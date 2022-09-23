const get_points_exchanged = require('./rating_algo');

const {
  SELECT_FUTURE_EVENT_IDS_AND_DATE_WITH_EVENT_ID_QUERY,
  SELECT_FUTURE_EVENT_IDS_AND_DATE_WITHOUT_EVENT_ID_QUERY,
  SELECT_PLAYER_RATINGS_BEFORE_DATE_QUERY,
  SELECT_PLAYER_RATINGS_BEFORE_DATE_EXCLUDING_EVENT_ID_QUERY,
  UPDATE_MATCHES_QUERY,
  UPDATE_PLAYER_HISTORIES_WITH_DATE_QUERY,
  UPDATE_PLAYER_HISTORIES_WITHOUT_DATE_QUERY,
} = require('./Constant');

const getPlayerRatingsBeforeDate = async (client, date, eventId = null) => {
  let rows = [];
  if (eventId === null) {
    rows = (await client.query(SELECT_PLAYER_RATINGS_BEFORE_DATE_QUERY, [date]))
      .rows;
  } else {
    rows = (
      await client.query(
        SELECT_PLAYER_RATINGS_BEFORE_DATE_EXCLUDING_EVENT_ID_QUERY,
        [date, eventId]
      )
    ).rows;
  }
  return rows.map(row => ({
    id: row.id,
    rating: row.adjusted_rating ? row.adjusted_rating : row.rating_after,
  }));
};

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

const getFutureEventIdsAndDates = async (client, eventDate, eventId = null) => {
  if (eventId === null) {
    return (
      await client.query(
        SELECT_FUTURE_EVENT_IDS_AND_DATE_WITHOUT_EVENT_ID_QUERY,
        [eventDate]
      )
    ).rows;
  }
  return (
    await client.query(SELECT_FUTURE_EVENT_IDS_AND_DATE_WITH_EVENT_ID_QUERY, [
      eventDate,
      eventId,
    ])
  ).rows;
};

const updateEventResults = async (
  client,
  eventId,
  oldPlayerRatings,
  updatedPlayerRatings,
  matches,
  date
) => {
  await calculateAndFormatMatches(
    eventId,
    matches,
    oldPlayerRatings,
    updatedPlayerRatings
  );
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

module.exports = {
  getPlayerRatingsBeforeDate,
  calculateAndFormatMatches,
  getFutureEventIdsAndDates,
  updateEventResults,
};
