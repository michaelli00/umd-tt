function get_points_exchanged(r1, r2, winner) {
  // r1 =  rating of player 1
  // r2 =  rating of player 2
  // winner = 1 or 2
  let higher = Math.max(r1, r2);
  let lower = Math.min(r1, r2);
  let diff = higher - lower;
  let upset = (r1 == higher && winner == 2) || (r2 == higher && winner == 1);

  if (diff >= 238) {
    return upset ? 50 : 0;
  }
  if (diff >= 213) {
    return upset ? 45 : 1;
  }
  if (diff >= 188) {
    return upset ? 40 : 1;
  }
  if (diff >= 163) {
    return upset ? 35 : 2;
  }
  if (diff >= 138) {
    return upset ? 30 : 2;
  }
  if (diff >= 113) {
    return upset ? 25 : 3;
  }
  if (diff >= 88) {
    return upset ? 20 : 4;
  }
  if (diff >= 63) {
    return upset ? 16 : 5;
  }
  if (diff >= 38) {
    return upset ? 13 : 6;
  }
  if (diff >= 13) {
    return upset ? 10 : 7;
  }
  return 8;
}

module.exports = get_points_exchanged;
