# Kastia — School Project Setup

## Files
- `index.html` — the page
- `style.css`  — all styles
- `index.js`   — app logic
- `db.json`    — your local fake API data

---

## How to run

### 1. Install JSON Server (once)
```
npm install -g json-server
```

### 2. Start the API
Open a terminal in the project folder and run:
```
json-server --watch db.json --port 3001
```
Leave this terminal open. Your API is now live at:
```
http://localhost:3001/markets
```

### 3. Open the app
Open `index.html` in your browser (or use Live Server in VS Code).

---

## API endpoints JSON Server gives you for free

| Method | URL                              | What it does         |
|--------|----------------------------------|----------------------|
| GET    | /markets                         | Get all markets      |
| GET    | /markets/1                       | Get market by id     |
| POST   | /markets                         | Add a new market     |
| PUT    | /markets/1                       | Replace a market     |
| PATCH  | /markets/1                       | Update part of it    |
| DELETE | /markets/1                       | Delete a market      |

---

## Adding more markets
Just edit `db.json` and add another object to the `"markets"` array.
JSON Server detects the change automatically — no restart needed.

---

## If the API is offline
The app shows fallback data automatically so the page never breaks.