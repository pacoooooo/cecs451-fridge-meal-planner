const express = require("express");
const cors = require("cors");

const app = express();
const port = 3001;

// allow the react frontend to contact this server
app.use(cors({ origin: "http://localhost:5173" }));

// read json data sent by the frontend
app.use(express.json());

// return a message to check that the backend is running
app.get("/api/health", function (req, res) 
{
  res.json({message: "fridge meal planner backend is running"});
});

// start the server on the selected port
app.listen(port, function () 
{
  console.log("server running at http://localhost:" + port);
});