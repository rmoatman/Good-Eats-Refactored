# Good Eats

**🔗 Live app: [good-eats-z0fw.onrender.com](https://good-eats-z0fw.onrender.com)**
*(hosted on Render's free tier — the first visit after a while may take ~30–60s to wake up)*

Find recipes that fit real dietary needs, save your favorites, build a shopping
list, and discover restaurants nearby.

Good Eats began as a class project (a static jQuery/Foundation site) and is being
refactored into a living, full-stack web app. This repository holds the
refactored version: a React front end and an Express/MongoDB back end that keeps
all third-party API keys server-side.

> **Curious about the engineering behind it?** [LESSONS.md](LESSONS.md) documents
> the real-world problems solved along the way — a same-origin CORS bug, a
> `NODE_ENV=production` build gotcha, MongoDB Atlas auth, a corrupted env-var
> paste, and getting transactional email working when the host blocks SMTP.

## Features

- **Recipe search** with dietary-restriction filters (gluten-, dairy-, egg-,
  peanut-, and wheat-free), powered by the Spoonacular API.
- **Recipe details** in a popup: full ingredient list, step-by-step
  instructions loaded on demand, and a link/credit to the original source.
- **Accounts** — register and log in (JWT auth; passwords hashed with bcrypt).
- **Favorites** — save recipes to your account and revisit them later.
- **Shopping list** — add a recipe's ingredients, check items off, print, or
  email the list to yourself; grouped by recipe.
- **Restaurant finder** — nearby restaurants by geolocation or ZIP code (Yelp
  Fusion API).
- **Account deletion** — permanently remove your account and all of your data
  from the Privacy page.

## Tech stack

| Layer      | Technology                                             |
| ---------- | ------------------------------------------------------ |
| Front end  | React 18, React Router, Vite                           |
| Back end   | Node.js, Express                                       |
| Database   | MongoDB (via Mongoose)                                  |
| Auth       | JSON Web Tokens, bcrypt password hashing               |
| APIs       | Spoonacular (recipes), Yelp Fusion (restaurants)       |
| Email      | Nodemailer (Gmail App Password)                         |

The client talks only to the Express API; the server proxies Spoonacular and
Yelp so their keys never reach the browser.

## Project structure

```
Good-Eats-Refactored/
├── client/            # React + Vite front end
│   └── src/
│       ├── api/       # fetch wrapper + endpoint helpers
│       ├── components/# NavBar, Footer, RecipeCard, RecipeModal, ...
│       ├── context/   # Auth, Favorites, ShoppingList React contexts
│       └── pages/     # Home, Favorites, ShoppingList, About, Install, Privacy, ...
└── server/            # Express API
    └── src/
        ├── config/    # MongoDB connection
        ├── middleware/# JWT auth
        ├── models/    # User (with embedded favorites + shopping list)
        ├── routes/    # auth, recipes, restaurants, favorites, shopping-list
        └── utils/     # email sender
```

## Getting started

### Prerequisites

- Node.js 20+
- MongoDB running locally (or a MongoDB Atlas connection string)
- A free [Spoonacular API key](https://spoonacular.com/food-api)
- (Optional) a [Yelp Fusion API key](https://www.yelp.com/developers) for the
  restaurant finder, and a Gmail App Password for emailing the shopping list

### 1. Server

```bash
cd server
npm install
cp .env.example .env      # then fill in the values (see below)
npm run dev               # starts the API on http://localhost:5000
```

Environment variables (`server/.env`):

| Variable              | Purpose                                            |
| --------------------- | -------------------------------------------------- |
| `PORT`                | API port (default 5000)                            |
| `CLIENT_ORIGIN`       | Allowed front-end origin(s) for CORS               |
| `MONGODB_URI`         | MongoDB connection string                          |
| `JWT_SECRET`          | Secret used to sign login tokens                   |
| `SPOONACULAR_API_KEY` | Recipe search + details                            |
| `YELP_API_KEY`        | Restaurant finder (optional)                       |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` | Emailing the shopping list (optional)|

`.env` is gitignored — your keys are never committed. `.env.example` is a
placeholder template only.

### 2. Client

```bash
cd client
npm install
npm run dev               # starts Vite on http://localhost:5173
```

In development, Vite proxies `/api` requests to the Express server, so the
browser talks to a single origin (no CORS setup needed). The Render deployment
also serves the client and API from one origin, so no `VITE_API_URL` is needed
there — set it only if you host the client separately from the API.

## Deployment

Good Eats deploys to [Render](https://render.com) as a **single web service**:
the Express server serves the built React client, so there's one origin and no
CORS setup. Configuration lives in [`render.yaml`](render.yaml), and
[DEPLOY.md](DEPLOY.md) has the full step-by-step walkthrough (MongoDB Atlas,
environment variables, and the Render Blueprint).

## License

This is free and unencumbered software released into the public domain
(Unlicense). See <https://unlicense.org>.

## Credits

**Original team** (class project):

- Tyler Wheeler — [github.com/twheeler92](https://github.com/twheeler92)
- Raemarie Oatman — [github.com/rmoatman](https://github.com/rmoatman)
- Celina Lind — [github.com/clind3](https://github.com/clind3)
- Nicholas Herold — [github.com/Nicholas-Herold](https://github.com/Nicholas-Herold)

The refactor into a full-stack app is an ongoing effort by Raemarie Oatman using Claude Code (Anthropic)
