/*
 * user.qaFlag
 * Returns: the adobeQA value from the URL or mbox so QA audiences can single out testers; cleared when absent.
 * Needs:   testers to open the site with ?adobeQA=<token>. Case-insensitive parameter name.
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
