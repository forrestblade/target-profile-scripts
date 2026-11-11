/*
 * user.lifetimeOrderValue
 * Returns: sum of orderTotal across the visitor's distinct orders, rounded to cents.
 * Needs:   the order confirmation mbox to pass orderId and orderTotal.
 */
try {
  var total = parseFloat(user.get('lifetimeOrderValue'));
  if (isNaN(total) || total < 0) {
    total = 0;
  }
  var orderId = mbox.param('orderId');
  var orderTotal = parseFloat(mbox.param('orderTotal'));
  if (orderId && orderId !== user.getLocal('lastOrderId') && !isNaN(orderTotal) && orderTotal >= 0) {
    user.setLocal('lastOrderId', orderId);
    return Math.round((total + orderTotal) * 100) / 100;
  }
  return total;
} catch (e) {
  return user.get('lifetimeOrderValue') || 0;
}
