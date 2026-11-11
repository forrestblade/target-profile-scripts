/*
 * user.visitCount
 * Returns: number of sessions this visitor has had, counting the current one.
 * Needs:   nothing passed from the page; uses Target's built-in user.isNewSession.
 */
try {
  var count = parseInt(user.get('visitCount'), 10);
  if (isNaN(count) || count < 0) {
    count = 0;
  }
  if (user.isNewSession || count === 0) {
    return count + 1;
  }
  return count;
} catch (e) {
  return 1;
}
