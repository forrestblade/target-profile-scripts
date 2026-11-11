/*
 * user.qaFlag
 * Returns: a QA token held for the current session, cleared on the next session without a token.
 * Needs:   ?adobeQA=<token>, ?adobeqa=<token>, or the adobeQA mbox parameter.
 */
try {
  var flag = page.param('adobeQA') || page.param('adobeqa') || mbox.param('adobeQA') || '';
  flag = String(flag).substring(0, 50);
  if (flag) {
    user.setLocal('flag', flag);
    return flag;
  }
  var kept = user.getLocal('flag');
  if (kept && user.isNewSession) {
    user.setLocal('flag', '');
    return '';
  }
  if (kept) {
    return kept;
  }
} catch (e) {
  return;
}
