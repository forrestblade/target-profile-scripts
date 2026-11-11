/*
 * user.loyaltyTier
 * Returns: the visitor's loyalty tier (none | silver | gold | platinum), remembered across pages
 *          that do not send it, so tier audiences work site-wide. Only accepts known values.
 * Needs:   signed-in pages to pass a loyaltyTier mbox parameter (or profile.loyaltyTier).
 */
try {
  var allowed = { none: 1, silver: 1, gold: 1, platinum: 1 };
  var tier = mbox.param('loyaltyTier') || profile.get('loyaltyTier') || '';
  tier = String(tier).toLowerCase();
  if (tier.trim) {
    tier = tier.trim();
  }
  if (allowed[tier] === 1) {
    return tier;
  }
} catch (e) {
  return;
}
