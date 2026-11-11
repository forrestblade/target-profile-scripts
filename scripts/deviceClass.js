/*
 * user.deviceClass
 * Returns: phone | tablet | desktop.
 * Needs:   nothing from the page; uses Target's built-in profile.mobile flags.
 */
try {
  if (profile.mobile.isMobilePhone) {
    return 'phone';
  }
  if (profile.mobile.isTablet) {
    return 'tablet';
  }
  return 'desktop';
} catch (e) {
  return 'desktop';
}
