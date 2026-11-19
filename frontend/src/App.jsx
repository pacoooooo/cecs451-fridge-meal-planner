import { useState } from "react";
import "./App.css";

function App()
{
  // store the entered ingredients and connection status
  const [ingredients, setIngredients] = useState("");
  const [status, setStatus] = useState("Connection has not been checked.");
  const [isChecking, setIsChecking] = useState(false);

  async function checkConnection()
  {
    setIsChecking(true);
    setStatus("Checking connection...");

    try
    {
      // request the health message from our backend
      const response = await fetch("http://localhost:3001/api/health");

      if (!response.ok)
      {
        throw new Error("backend request failed");
      }

      const data = await response.json();
      setStatus(data.message);
    }
    catch
    {
      // show a helpful message if the request fails
      setStatus("Could not connect. Make sure the backend is running.");
    }
    finally
    {
      setIsChecking(false);
    }
  }

  return (
    <main className="page">
      <h1>AI Fridge Meal Planner</h1>
      <p>Find meal ideas using ingredients you already have.</p>

      <label htmlFor="ingredients">Available ingredients</label>

      <textarea
        id="ingredients"
        placeholder="Example: chicken, rice, spinach"
        value={ingredients}
        onChange={(event) => setIngredients(event.target.value)}
      />

      <button
        type="button"
        onClick={checkConnection}
        disabled={isChecking}
      >
        {isChecking ? "Checking..." : "Check connection"}
      </button>

      <p className="status" role="status">
        {status}
      </p>
    </main>
  );
}

export default App;