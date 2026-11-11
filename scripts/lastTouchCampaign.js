/*
 * user.lastTouchCampaign
 * Returns: the most recent utm_campaign seen on any page. Overwritten each time one appears.
 * Needs:   nothing from the page; reads the current page URL Target already has.
 */
try {
  var campaign = page.param('utm_campaign');
  if (campaign) {
    return String(campaign).substring(0, 100).toLowerCase();
  }
} catch (e) {
  return;
}
