/*
 * user.lifetimeOrderValue
 * Returns: total order value, rounded to cents. Consecutive reloads of the same order are ignored.
 * Needs:   the order confirmation mbox to pass orderId and orderTotal.
 */
try {
  var total = parseFloat(user.get('lifetimeOrderValue'));
  if (!isFinite(total) || total < 0) {
    total = 0;
  }
  var orderId = mbox.param('orderId');
  var raw = mbox.param('orderTotal');
  var orderTotal = raw ? Number(raw) : NaN;
  if (orderId && orderId !== user.getLocal('lastOrderId') && isFinite(orderTotal) && orderTotal >= 0) {
    user.setLocal('lastOrderId', orderId);
    return Math.round((total + orderTotal) * 100) / 100;
  }
  return total;
} catch (e) {
  return user.get('lifetimeOrderValue') || 0;
}
