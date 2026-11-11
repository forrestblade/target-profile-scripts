/*
 * user.firstTouchCampaign
 * Returns: the first utm_campaign this visitor ever arrived with. Set once, never overwritten.
 * Needs:   nothing from the page; reads the landing page URL Target already has.
 */
try {
  var existing = user.get('firstTouchCampaign');
  if (existing) {
    return existing;
  }
  var campaign = landing.param('utm_campaign') || page.param('utm_campaign');
  if (campaign) {
    return String(campaign).substring(0, 100).toLowerCase();
  }
} catch (e) {
  return;
}
