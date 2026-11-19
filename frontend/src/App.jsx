import { useState } from "react";
import "./App.css";

function App()
{
  // store the user's ingredients, generated recipes, and request status
  const [ingredients, setIngredients] = useState("");
  const [recipes, setRecipes] = useState([]);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function generateRecipes(event)
  {
    event.preventDefault();

    setRecipes([]);
    setStatus("Generating recipe ideas...");
    setIsLoading(true);

    try
    {
      // send the ingredients to our backend
      const response = await fetch("http://localhost:3001/api/recipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ingredients: ingredients
        })
      });

      const data = await response.json();

      if (!response.ok)
      {
        throw new Error(data.error || "Could not generate recipes.");
      }

      setRecipes(data.recipes);

      if (data.recipes.length === 0)
      {
        setStatus("No suitable recipes found. Try different ingredients.");
      }
      else
      {
        setStatus("");
      }
    }
    catch (error)
    {
      setStatus("Request failed: " + error.message);
    }
    finally
    {
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
          required
        />

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

      {/* display each recipe returned by the backend */}
      {recipes.map((recipe, index) => (
        <article className="recipe-card" key={index}>
          <h2>{recipe.name}</h2>
          <p>Estimated cooking time: {recipe.cookingTime} minutes</p>

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