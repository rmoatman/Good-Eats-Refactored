# Deploying Good Eats

Good Eats deploys as a **single web service** on [Render](https://render.com):
the Express API also serves the built React client, so there's one URL, no CORS,
and no separate client host. Config lives in [`render.yaml`](render.yaml).

You'll need free accounts on **Render** and **MongoDB Atlas**, plus the API keys
listed below.

---

## 1. Set up MongoDB Atlas (the database)

1. Create a free account at <https://www.mongodb.com/atlas> and create a project.
2. **Build a Database** → choose the **free M0** shared cluster → create it.
3. **Database Access** → *Add New Database User* → username + password
   (save these; they go into the connection string).
4. **Network Access** → *Add IP Address* → **Allow access from anywhere**
   (`0.0.0.0/0`). Render's outbound IPs aren't fixed on the free tier, so this
   is required.
5. **Database → Connect → Drivers** → copy the connection string. It looks like:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/goodeats?retryWrites=true&w=majority
   ```
   Replace `<user>`/`<password>`, and add the database name (`goodeats`) before
   the `?` as shown. This is your **`MONGODB_URI`**.

## 2. Gather the API keys

| Env var | Where to get it | Required? |
| --- | --- | --- |
| `MONGODB_URI` | Step 1 above | Yes |
| `SPOONACULAR_API_KEY` | <https://spoonacular.com/food-api> (free: 50 pts/day) | Yes (recipes) |
| `YELP_API_KEY` | <https://www.yelp.com/developers> | Optional (restaurant finder) |
| `GMAIL_USER` + `GMAIL_APP_PASSWORD` | A Gmail address + a Google **App Password** (Account → Security → 2-Step Verification → App passwords) | Optional ("email my list") |
| `JWT_SECRET` | Render generates this automatically | — |

Optional keys can be left unset — those features simply return a friendly error
until configured.

## 3. Deploy on Render

1. Push the code to GitHub (the `main` branch is what Render will read).
2. Render dashboard → **New +** → **Blueprint** → connect this repository.
3. Render detects [`render.yaml`](render.yaml) and shows the `good-eats` service.
   It will prompt for the secrets marked `sync: false` — paste in `MONGODB_URI`,
   `SPOONACULAR_API_KEY`, and any optional keys. `JWT_SECRET` is generated for you.
4. Click **Apply / Deploy**. Render runs `npm run build` (installs + builds the
   client, installs the server) then `npm start`.
5. First build takes a few minutes. When it's live you'll get a URL like
   `https://good-eats.onrender.com`.

**Health check:** Render pings `/api/health`; a healthy deploy returns
`{"status":"ok"}`.

## 4. Verify

- Open the Render URL — the app loads and recipe search works.
- Register an account, save a favorite, build a shopping list.
- It's served over HTTPS, so the **PWA install** works: look for the install
  icon in Chrome/Edge, or use the in-app **Install** button.

---

## Notes & limitations

- **Free tier sleeps** after ~15 minutes of inactivity; the first request after
  that takes ~30–60s to wake. Fine for a portfolio demo.
- **Spoonacular free tier is 50 points/day.** Roughly ~1 point per search and
  ~1 per recipe you open. When it's exhausted the app shows a friendly
  "kitchen closed" message and favorites still work; it resets daily. Upgrade
  the Spoonacular plan for real traffic.
- **Secrets** live only in Render's dashboard and your local `server/.env`
  (gitignored) — never in the repo.
- To run locally, see the setup steps in [README.md](README.md).
