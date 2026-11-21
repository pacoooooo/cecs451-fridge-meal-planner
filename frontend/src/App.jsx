import { useState } from "react";
import "./App.css";

function isTextList(value)
{
  return Array.isArray(value) && value.every((item) =>
    typeof item === "string" && item.trim().length > 0
  );
}

function isValidRecipe(recipe)
{
  return recipe &&
    typeof recipe.name === "string" &&
    recipe.name.trim().length > 0 &&
    Number.isInteger(recipe.cookingTime) &&
    recipe.cookingTime > 0 &&
    isTextList(recipe.ingredients) &&
    recipe.ingredients.length > 0 &&
    isTextList(recipe.instructions) &&
    recipe.instructions.length > 0 &&
    isTextList(recipe.matchedIngredients) &&
    isTextList(recipe.missingIngredients);
}

const RATINGS_KEY = "fridge-meal-planner-ratings-v1";

function recipeId(recipe)
{
  // Include instructions so different versions of a dish keep separate ratings.
  return JSON.stringify([
    recipe.name.trim().toLowerCase(),
    recipe.ingredients.map((item) => item.trim().toLowerCase()).sort(),
    recipe.instructions,
    recipe.cookingTime
  ]);
}

function loadSavedMeals()
{
  try
  {
    const stored = window.localStorage.getItem(RATINGS_KEY);
    if (stored === null) return { meals: [], message: "" };
    const entries = JSON.parse(stored);
    if (!Array.isArray(entries)) throw new Error("Invalid saved meals");

    const meals = entries.filter((entry) =>
      entry && isValidRecipe(entry.recipe) &&
      Number.isInteger(entry.rating) && entry.rating >= 1 && entry.rating <= 5
    );
    // Ignore duplicates and recompute identities rather than trusting stored ids.
    const unique = new Map(meals.map((entry) =>
      [recipeId(entry.recipe), { recipe: entry.recipe, rating: entry.rating }]
    ));
    return {
      meals: [...unique.values()],
      message: meals.length !== entries.length
        ? "Some saved meals could not be read and were skipped." : ""
    };
  }
  catch
  {
    return { meals: [], message: "Saved meals could not be loaded from this browser." };
  }
}

function saveMeals(meals)
{
  try
  {
    window.localStorage.setItem(RATINGS_KEY, JSON.stringify(meals));
    return "Changes saved in this browser.";
  }
  catch
  {
    return "Browser storage is unavailable or full. Changes are available for this session only.";
  }
}

function RecipeCard({ recipe, rating, onRate, onRemove, showMatches = true })
{
  return (
    <article className="recipe-card">
      <h3>{recipe.name}</h3>
      <p>Estimated cooking time: {recipe.cookingTime} minutes</p>
      {showMatches && (
        <>
          <p><strong>Matched ingredients:</strong> {recipe.matchedIngredients.join(", ") || "None"}</p>
          <p><strong>Missing ingredients:</strong> {recipe.missingIngredients.join(", ") || "None"}</p>
        </>
      )}
      <h4>Ingredients</h4>
      <ul>
        {recipe.ingredients.map((ingredient, index) => <li key={index}>{ingredient}</li>)}
      </ul>
      <h4>Instructions</h4>
      <ol>
        {recipe.instructions.map((step, index) => <li key={index}>{step}</li>)}
      </ol>
      <div className="rating-controls">
        <label>
          Your rating for {recipe.name}
          <select value={rating || ""} onChange={(event) => onRate(recipe, Number(event.target.value))}>
            <option value="" disabled>Rate this meal</option>
            <option value="1">1 star — Disliked it</option>
            <option value="2">2 stars — Below average</option>
            <option value="3">3 stars — It was okay</option>
            <option value="4">4 stars — Liked it</option>
            <option value="5">5 stars — Loved it</option>
          </select>
        </label>
        {onRemove && (
          <button type="button" className="remove-meal" onClick={() => onRemove(recipe)}
            aria-label={`Remove ${recipe.name} from saved meals`}>
            Remove saved meal
          </button>
        )}
      </div>
    </article>
  );
}

function App()
{
  // keep the entered ingredients, recipes, and request status
  const [saved, setSaved] = useState(loadSavedMeals);
  const [ingredients, setIngredients] = useState([{ name: "", expiresOn: "" }]);
  const [recipes, setRecipes] = useState([]);
  const [maxCookingTime, setMaxCookingTime] = useState("");
  const [diet, setDiet] = useState("none");
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function rateMeal(recipe, rating)
  {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return;
    const id = recipeId(recipe);
    const existing = saved.meals.findIndex((entry) => recipeId(entry.recipe) === id);
    const meals = [...saved.meals];
    if (existing === -1) meals.unshift({ recipe, rating });
    else meals[existing] = { recipe, rating };
    setSaved({ meals, message: saveMeals(meals) });
  }

  function removeMeal(recipe)
  {
    const meals = saved.meals.filter((entry) => recipeId(entry.recipe) !== recipeId(recipe));
    setSaved({ meals, message: saveMeals(meals) });
  }

  function ratingFor(recipe)
  {
    return saved.meals.find((entry) => recipeId(entry.recipe) === recipeId(recipe))?.rating;
  }

  async function generateRecipes(event)
  {
    event.preventDefault();

    if (isLoading)
    {
      return;
    }

    setRecipes([]);
    setAppliedFilters(null);
    setStatus("Generating recipe ideas...");
    setIsLoading(true);

    // stop waiting if the backend request takes too long
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 65000);

    try
    {
      const response = await fetch("http://localhost:3001/api/recipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ingredients: ingredients
            .filter((ingredient) => ingredient.name.trim())
            .map((ingredient) => ({
              name: ingredient.name.trim(),
              expiresOn: ingredient.expiresOn || null
            })),
          diet,
          maxCookingTime: maxCookingTime === "" ? null : Number(maxCookingTime)
        }),
        signal: controller.signal
      });

      const data = await response.json();

      if (!response.ok)
      {
        const message = typeof data?.error === "string"
          ? data.error
          : "Could not generate recipes. Please try again.";

        throw new Error(message);
      }

      // check the recipe fields before displaying a response
      if (!data || !Array.isArray(data.recipes) ||
          !data.recipes.every(isValidRecipe))
      {
        throw new Error("The recipe service returned an unexpected response.");
      }

      setRecipes(data.recipes);
      setAppliedFilters({ diet, maxCookingTime });
      setStatus(data.recipes.length === 0
        ? (data.message || "No suitable recipes found. Try more ingredients or a longer cooking time.")
        : "");
    }
    catch (error)
    {
      if (error.name === "AbortError")
      {
        setStatus("The recipe request took too long. Please try again.");
      }
      else if (error instanceof TypeError)
      {
        setStatus("Could not reach the recipe service. Make sure the backend is running.");
      }
      else if (error instanceof SyntaxError)
      {
        setStatus("The recipe service returned an unreadable response. Please try again.");
      }
      else
      {
        setStatus(error.message || "Could not generate recipes. Please try again.");
      }
    }
    finally
    {
      clearTimeout(timeout);
      setIsLoading(false);
    }
  }

  return (
    <main className="page">
      <h1>AI Fridge Meal Planner</h1>
      <p>Find meal ideas using ingredients you already have.</p>

      <form onSubmit={generateRecipes}>
        <label>Available ingredients</label>
        <p className="filter-note">Add an expiration date when you know it. Recipes using ingredients that expire sooner will appear first.</p>
        <div className="ingredient-list">
          {ingredients.map((ingredient, index) => (
            <div className="ingredient-row" key={index}>
              <label className="visually-hidden" htmlFor={`ingredient-${index}`}>Ingredient {index + 1}</label>
              <input
                id={`ingredient-${index}`}
                type="text"
                placeholder="Example: spinach"
                value={ingredient.name}
                maxLength={100}
                disabled={isLoading}
                onChange={(event) => setIngredients((current) => current.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, name: event.target.value } : item))}
              />
              <label className="visually-hidden" htmlFor={`expiry-${index}`}>Expiration date for ingredient {index + 1} (optional)</label>
              <input
                id={`expiry-${index}`}
                type="date"
                aria-label={`Expiration date for ingredient ${index + 1} (optional)`}
                value={ingredient.expiresOn}
                disabled={isLoading}
                onChange={(event) => setIngredients((current) => current.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, expiresOn: event.target.value } : item))}
              />
              {ingredients.length > 1 && (
                <button type="button" className="remove-ingredient" aria-label={`Remove ingredient ${index + 1}`}
                  disabled={isLoading} onClick={() => setIngredients((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Remove</button>
              )}
            </div>
          ))}
        </div>
        <button type="button" className="add-ingredient" disabled={isLoading}
          onClick={() => setIngredients((current) => [...current, { name: "", expiresOn: "" }])}>Add ingredient</button>

        <div className="filter-row">
          <div>
            <label htmlFor="maxCookingTime">Maximum total time</label>
            <select
              id="maxCookingTime"
              value={maxCookingTime}
              onChange={(event) => setMaxCookingTime(event.target.value)}
              disabled={isLoading}
            >
              <option value="">No time limit</option>
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">60 minutes</option>
            </select>
          </div>
          <div>
            <label htmlFor="diet">Dietary preference</label>
            <select
              id="diet"
              value={diet}
              onChange={(event) => setDiet(event.target.value)}
              disabled={isLoading}
              aria-describedby="diet-note"
            >
              <option value="none">No restriction</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
            </select>
          </div>
        </div>
        <p id="diet-note" className="filter-note">
          Time includes preparation and cooking and is estimated. Dietary filters
          are basic checks; review every recipe and ingredient label for your needs.
          These filters do not check food allergies.
        </p>

        <button
          type="submit"
          disabled={isLoading || !ingredients.some((ingredient) => ingredient.name.trim().length > 0)}
        >
          {isLoading ? "Generating..." : "Generate recipes"}
        </button>
      </form>

      <p className="status" role="status">
        {status}
      </p>

      {recipes.length > 0 && appliedFilters && (
        <p className="results-summary">
          Showing {recipes.length} recipe{recipes.length === 1 ? "" : "s"} · {appliedFilters.diet === "none" ? "No dietary restriction" : appliedFilters.diet}
          {appliedFilters.maxCookingTime !== "" && ` · Up to ${appliedFilters.maxCookingTime} minutes`}
        </p>
      )}

      <p className="storage-status" role="status">{saved.message}</p>

      {recipes.length > 0 && (
        <section aria-labelledby="recipe-results-heading">
          <h2 id="recipe-results-heading">Recipe ideas</h2>
          <p className="filter-note">After trying a meal, rate it to save the recipe.</p>
          {recipes.map((recipe, index) => (
            <RecipeCard key={index} recipe={recipe} rating={ratingFor(recipe)} onRate={rateMeal} />
          ))}
        </section>
      )}

      <section className="saved-meals" aria-labelledby="saved-meals-heading">
        <h2 id="saved-meals-heading">Saved meals ({saved.meals.length})</h2>
        <p className="filter-note">
          Ratings and recipes are saved on this browser and device. Clearing browser
          data removes them. Ratings do not yet affect AI recommendations.
        </p>
        {saved.meals.length === 0 ? (
          <p>No saved meals yet. Generate recipes and rate a meal to save it here.</p>
        ) : saved.meals.map((entry) => (
          <details className="saved-meal" key={recipeId(entry.recipe)}>
            <summary>{entry.recipe.name} · {entry.rating}/5 stars</summary>
            <RecipeCard recipe={entry.recipe} rating={entry.rating}
              onRate={rateMeal} onRemove={removeMeal} showMatches={false} />
          </details>
        ))}
      </section>
    </main>
  );
}

export default App;
