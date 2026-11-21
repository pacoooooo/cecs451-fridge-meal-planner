// Send only the small part of saved meals needed for recommendations.
export function createRatingHistory(meals)
{
  return meals.filter((entry) => entry.rating !== 3).slice(0, 10).map((entry) => ({
    name: entry.recipe.name.slice(0, 120),
    ingredients: entry.recipe.ingredients.slice(0, 20).map((name) => name.slice(0, 100)),
    rating: entry.rating
  }));
}

const aliases = {
  egg: 'eggs', tomatoes: 'tomato', onions: 'onion', carrots: 'carrot',
  potatoes: 'potato', lemons: 'lemon', limes: 'lime', apples: 'apple',
  bananas: 'banana', avocados: 'avocado', cucumbers: 'cucumber',
  zucchinis: 'zucchini', mushrooms: 'mushroom', peppers: 'pepper',
  'bell peppers': 'bell pepper', 'garlic cloves': 'garlic',
  'green onions': 'scallion', 'chicken breasts': 'chicken breast',
  'chicken thighs': 'chicken thigh'
};

export function buildShoppingList(recipes)
{
  const items = new Map();
  for (const recipe of recipes)
  {
    for (const ingredient of recipe.missingIngredients)
    {
      const raw = ingredient.toLowerCase().trim().replace(/\s+/g, ' ');
      const name = Object.hasOwn(aliases, raw) ? aliases[raw] : raw;
      if (!items.has(name)) items.set(name, { name, recipes: [] });
      const item = items.get(name);
      if (!item.recipes.includes(recipe.name)) item.recipes.push(recipe.name);
    }
  }
  return [...items.values()].sort((a, b) => a.name.localeCompare(b.name));
}
