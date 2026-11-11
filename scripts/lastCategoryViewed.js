/*
 * user.lastCategoryViewed
 * Returns: the most recent product category the visitor looked at, lowercased.
 * Needs:   pages to pass a category mbox parameter (or profile.category) on category and product views.
 */
try {
  var category = mbox.param('category') || profile.get('category') || '';
  category = String(category).toLowerCase();
  if (category.trim) {
    category = category.trim();
  }
  if (category) {
    return category.substring(0, 60);
  }
} catch (e) {
  return;
}
