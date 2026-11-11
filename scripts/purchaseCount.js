/*
 * user.purchaseCount
 * Returns: number of orders this visitor has placed.
 * Needs:   the order confirmation mbox to pass orderId (the standard Target order parameter).
 *          A reload of the confirmation page is not counted twice.
 */
try {
  var orderId = mbox.param('orderId');
  var count = parseInt(user.get('purchaseCount'), 10);
  if (isNaN(count) || count < 0) {
    count = 0;
  }
  if (orderId && orderId !== user.getLocal('lastOrderId')) {
    user.setLocal('lastOrderId', orderId);
    return count + 1;
  }
  return count;
} catch (e) {
  return user.get('purchaseCount') || 0;
}
