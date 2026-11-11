/*
 * user.daysSinceLastPurchase
 * Returns: whole days since the visitor's most recent order, or nothing if they never ordered.
 * Needs:   the order confirmation mbox to pass orderId.
 */
try {
  var dayInMillis = 86400000;
  var now = new Date().getTime();
  if (mbox.param('orderId')) {
    user.setLocal('lastPurchaseTime', now);
  }
  var last = parseInt(user.getLocal('lastPurchaseTime'), 10);
  if (!isNaN(last) && last > 0 && last <= now) {
    return Math.floor((now - last) / dayInMillis);
  }
} catch (e) {
  return;
}
