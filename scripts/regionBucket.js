/*
 * user.regionBucket
 * Returns: northeast | midwest | south | west (US Census regions), intl for other countries, unknown if no geo.
 * Needs:   nothing from the page; uses the built-in profile.geolocation.
 */
try {
  var country = String(profile.geolocation.country || '').toUpperCase();
  var state = String(profile.geolocation.state || '').toUpperCase();
  if (!country) {
    return 'unknown';
  }
  if (country !== 'US') {
    return 'intl';
  }
  var regions = {
    CT: 'northeast', ME: 'northeast', MA: 'northeast', NH: 'northeast', RI: 'northeast', VT: 'northeast',
    NJ: 'northeast', NY: 'northeast', PA: 'northeast',
    IL: 'midwest', IN: 'midwest', MI: 'midwest', OH: 'midwest', WI: 'midwest', IA: 'midwest', KS: 'midwest',
    MN: 'midwest', MO: 'midwest', NE: 'midwest', ND: 'midwest', SD: 'midwest',
    DE: 'south', FL: 'south', GA: 'south', MD: 'south', NC: 'south', SC: 'south', VA: 'south', DC: 'south',
    WV: 'south', AL: 'south', KY: 'south', MS: 'south', TN: 'south', AR: 'south', LA: 'south', OK: 'south', TX: 'south',
    AZ: 'west', CO: 'west', ID: 'west', MT: 'west', NV: 'west', NM: 'west', UT: 'west', WY: 'west',
    AK: 'west', CA: 'west', HI: 'west', OR: 'west', WA: 'west'
  };
  return regions[state] || 'unknown';
} catch (e) {
  return 'unknown';
}
