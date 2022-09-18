const get_points_exchanged = require('./rating_algo');

const {
  SELECT_PLAYER_RATINGS_BEFORE_DATE_TIME_QUERY,
  SELECT_FUTURE_EVENT_IDS_AND_DATE_TIME_WITH_EVENT_ID_QUERY,
  SELECT_FUTURE_EVENT_IDS_AND_DATE_TIME_WITHOUT_EVENT_ID_QUERY,
  SELECT_PLAYER_RATINGS_ON_DATE_TIME_QUERY,
  UPDATE_MATCHES_QUERY,
  UPDATE_PLAYER_HISTORIES_WITH_DATE_TIME_QUERY,
  UPDATE_PLAYER_HISTORIES_WITHOUT_DATE_TIME_QUERY,
} = require('./Constant');

const getPlayerRatingsBeforeDateTime = async (client, dateTime) => {
  return (await client.query(SELECT_PLAYER_RATINGS_BEFORE_DATE_TIME_QUERY(dateTime)))
    .rows;
};

const formatMatches = (
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

const getFutureEventIds = async (client, eventDateTime, eventId = null) => {
  if (eventId === null) {
    return (
      await client.query(
        SELECT_FUTURE_EVENT_IDS_AND_DATE_TIME_WITHOUT_EVENT_ID_QUERY(eventDateTime)
      )
    ).rows.map(row => row.id);
  }
  return (
    await client.query(
      SELECT_FUTURE_EVENT_IDS_AND_DATE_TIME_WITH_EVENT_ID_QUERY(eventDateTime, eventId)
    )
  ).rows.map(row => row.id);
};

const updateEventResults = async (
  client,
  eventId,
  oldPlayerRatings,
  updatedPlayerRatings,
  matches,
  dateTime,
  updatePlayerHistory
) => {
  const formattedMatches = formatMatches(
    matches,
    oldPlayerRatings,
    updatedPlayerRatings
  );

  await client.query(UPDATE_MATCHES_QUERY(formattedMatches));

  const selectPlayersQueryResults = (
    await client.query(SELECT_PLAYER_RATINGS_ON_DATE_TIME_QUERY(dateTime))
  ).rows;
  selectPlayersQueryResults.forEach(player => {
    oldPlayerRatings[player.id] = player.rating;
    updatedPlayerRatings[player.id] = player.rating;
  });

  let updatePlayerHistoriesQuery;
  if (updatePlayerHistory) {
    updatePlayerHistoriesQuery = UPDATE_PLAYER_HISTORIES_WITHOUT_DATE_TIME_QUERY(
      eventPlayers.map(id => [
        id,
        eventId,
        oldPlayerRatings[id],
        updatedPlayerRatings[id],
      ])
    );
  } else {
    updatePlayerHistoriesQuery = UPDATE_PLAYER_HISTORIES_WITH_DATE_TIME_QUERY(
      eventPlayers.map(id => [
        id,
        eventId,
        dateTime,
        oldPlayerRatings[id],
        updatedPlayerRatings[id],
      ])
    );
  }
  await client.query(updatePlayerHistoriesQuery);
};

module.exports = {
  getPlayerRatingsBeforeDateTime,
  formatMatches,
  getFutureEventIds,
  updateEventResults,
};
