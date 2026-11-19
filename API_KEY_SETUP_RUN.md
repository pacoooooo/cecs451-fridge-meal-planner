# Gemini API Key Setup
## 1. Get your API key

1. open Google AI Studio https://aistudio.google.com/apikey and sign in.
2. click Create API key
3. keep default settings
3. click API Key and copy 

## 2. Add the key to the project

1. Inside the backend folder create a file named .env . include the starting dot and make sure the file dosen't end in .txt
2. Add this line:

GEMINI_API_KEY= [your key]

3. Replace your key with your actual key and save the file.


## 3. Run the app

These commands are for Windows PowerShell. On macOS/Linux, use npm instead of npm.cmd

Open a terminal in the main project folder and run:


cd backend\
npm.cmd install\
npm.cmd start\


Open a second terminal in the main project folder and run:


cd frontend\
npm.cmd install\
npm.cmd run dev -- --port 5173 --strictPort\


Leave both terminals running. Open http://localhost:5173

## Keep your key private

Its important to keep the acutal API KEY off of github. when pushing changes make sure the .env file is not included. the way the backednd is set up it should exclude the .env file 
from being pushed onto github but just in case double check its not being pushed. 
