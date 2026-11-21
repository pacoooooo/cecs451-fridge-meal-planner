const { normalizeIngredient } = require('./ingredientMatching');

// A small, inspectable preference model. Ratings are evidence about dishes,
// not proof that the user likes or dislikes every ingredient in those dishes.
const staples = new Set(['salt', 'pepper', 'black pepper', 'water', 'oil',
  'olive oil', 'vegetable oil', 'canola oil', 'cooking oil', 'butter']);

function isValidRatingHistory(history)
{
  return Array.isArray(history) && history.length <= 10 && history.every((entry) =>
    entry && typeof entry.name === 'string' && entry.name.trim().length > 0 &&
    entry.name.length <= 120 && Number.isInteger(entry.rating) &&
    entry.rating >= 1 && entry.rating <= 5 &&
    Array.isArray(entry.ingredients) && entry.ingredients.length > 0 &&
    entry.ingredients.length <= 20 && entry.ingredients.every((name) =>
      typeof name === 'string' && name.trim().length > 0 && name.length <= 100)
  );
}

function buildPreferenceProfile(history)
{
  const profile = new Map();
  for (const meal of history)
  {
    const weight = (meal.rating - 3) / 2;
    if (weight === 0) continue;
    for (const name of new Set(meal.ingredients.map(normalizeIngredient)))
    {
      if (staples.has(name)) continue;
      const previous = profile.get(name) || { total: 0, count: 0 };
      profile.set(name, { total: previous.total + weight, count: previous.count + 1 });
    }
  }
  return profile;
}

function preferenceDetails(recipe, profile)
{
  let total = 0;
  const positive = [], negative = [];
  for (const name of new Set(recipe.ingredients.map(normalizeIngredient)))
  {
    const evidence = profile.get(name);
    if (!evidence) continue;
    // Shrink single-meal evidence toward neutral to avoid strong conclusions.
    const score = evidence.total / (evidence.count + 1);
    total += score;
    if (score > 0) positive.push(name);
    if (score < 0) negative.push(name);
  }
  const count = positive.length + negative.length;
  const preferenceScore = count ? Number((total / count).toFixed(3)) : 0;
  const notes = [];
  if (positive.length) notes.push('Shares ingredients with highly rated meals: ' + positive.join(', ') + '.');
  if (negative.length) notes.push('Shares ingredients with lower-rated meals: ' + negative.join(', ') + '.');
  return { preferenceScore, preferenceNote: notes.join(' ') ||
    (profile.size ? 'No ingredient preference match in your rating history.' : '') };
}

module.exports = { isValidRatingHistory, buildPreferenceProfile, preferenceDetails };
