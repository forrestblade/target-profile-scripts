/*
 * user.engagementSegment
 * Returns: new | active | returning | reactivated, judged at the start of each session.
 *          new: first session. active: back within 7 days. returning: 8 to 30 days. reactivated: over 30 days away.
 * Needs:   nothing from the page. Self-contained; does not read other profile scripts.
 */
try {
  var day = 86400000;
  var now = new Date().getTime();
  var last = parseInt(user.getLocal('lastSessionStart'), 10);
  var current = user.get('engagementSegment');
  if (!user.isNewSession && current) {
    return current;
  }
  user.setLocal('lastSessionStart', now);
  if (isNaN(last) || last <= 0) {
    return 'new';
  }
  var away = (now - last) / day;
  if (away <= 7) {
    return 'active';
  }
  if (away <= 30) {
    return 'returning';
  }
  return 'reactivated';
} catch (e) {
  return;
}
