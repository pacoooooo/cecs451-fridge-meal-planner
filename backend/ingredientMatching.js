// recognize a few common variations without guessing substitutions
const aliases = {
  egg: "eggs",
  tomatoes: "tomato",
  onions: "onion",
  carrots: "carrot",
  potatoes: "potato",
  lemons: "lemon",
  limes: "lime",
  apples: "apple",
  bananas: "banana",
  avocados: "avocado",
  cucumbers: "cucumber",
  zucchinis: "zucchini",
  mushrooms: "mushroom",
  peppers: "pepper",
  "bell peppers": "bell pepper",
  "garlic cloves": "garlic",
  "green onions": "scallion",
  "chicken breasts": "chicken breast",
  "chicken thighs": "chicken thigh"
};

function normalizeIngredient(ingredient)
{
  const name = ingredient
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

  return Object.hasOwn(aliases, name) ? aliases[name] : name;
}

function addIngredientMatches(recipe, availableIngredients)
{
  const availableNames = availableIngredients.map(normalizeIngredient);
  const matchedIngredients = [];
  const missingIngredients = [];
  const checkedNames = [];
  const uniqueIngredients = [];

  // compare names and count each recipe ingredient once
  for (const ingredient of recipe.ingredients)
  {
    const name = normalizeIngredient(ingredient);

    if (checkedNames.includes(name))
    {
      continue;
    }

    checkedNames.push(name);
    uniqueIngredients.push(ingredient);

    if (availableNames.includes(name))
    {
      matchedIngredients.push(ingredient);
    }
    else
    {
      missingIngredients.push(ingredient);
    }
  }

  // copy the recipe and attach the ingredient comparison
  return {
    ...recipe,
    ingredients: uniqueIngredients,
    matchedIngredients: matchedIngredients,
    missingIngredients: missingIngredients
  };
}

module.exports = { addIngredientMatches, normalizeIngredient };
