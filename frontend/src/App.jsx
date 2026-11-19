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

function App()
{
  // keep the entered ingredients, recipes, and request status
  const [ingredients, setIngredients] = useState("");
  const [recipes, setRecipes] = useState([]);
  const [maxCookingTime, setMaxCookingTime] = useState("");
  const [diet, setDiet] = useState("none");
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
          ingredients,
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
        <label htmlFor="ingredients">Available ingredients</label>

        <textarea
          id="ingredients"
          placeholder="Example: eggs, spinach, cheese"
          value={ingredients}
          onChange={(event) => setIngredients(event.target.value)}
          maxLength={2000}
          disabled={isLoading}
          required
        />

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
          disabled={isLoading || ingredients.trim().length === 0}
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

      {/* display the recipes and ingredient comparisons */}
      {recipes.map((recipe, index) => (
        <article className="recipe-card" key={index}>
          <h2>{recipe.name}</h2>
          <p>Estimated cooking time: {recipe.cookingTime} minutes</p>

          <p>
            <strong>Matched ingredients:</strong>{" "}
            {recipe.matchedIngredients.join(", ") || "None"}
          </p>

          <p>
            <strong>Missing ingredients:</strong>{" "}
            {recipe.missingIngredients.join(", ") || "None"}
          </p>

          <h3>Ingredients</h3>
          <ul>
            {recipe.ingredients.map((ingredient, ingredientIndex) => (
              <li key={ingredientIndex}>{ingredient}</li>
            ))}
          </ul>

          <h3>Instructions</h3>
          <ol>
            {recipe.instructions.map((step, stepIndex) => (
              <li key={stepIndex}>{step}</li>
            ))}
          </ol>
        </article>
      ))}
    </main>
  );
}

export default App;
