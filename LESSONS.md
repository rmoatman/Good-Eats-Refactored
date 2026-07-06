# Problems Solved & Lessons Learned

Refactoring Good Eats from a static class project into a live, full-stack,
deployed app surfaced a series of real-world problems — the kind that don't show
up in tutorials. This document records each one: the **symptom**, the **root
cause**, the **fix**, and the **takeaway**. It doubles as a debugging reference
and a record of the engineering decisions behind the app.

---

## Part 1 — Recipe data & third-party APIs

### 1. The recipe API returned incomplete, dirty ingredient data

- **Symptom:** Recipes showed only a few ingredients (a chicken pot pie listed 4
  when the real recipe had 18), some ingredient lines contained junk like
  `* glaze:` or stray markdown, and about half of "View full recipe" links were
  dead (404 / paywalled / bot-blocked).
- **Root cause:** The original API (Edamam) aggregates third-party blogs and its
  data was frequently partial, badly parsed, or pointed at stale URLs. Our code
  was faithfully displaying exactly what the API returned — the problem was the
  data source, not the app.
- **Fix:** Migrated the recipe source to **Spoonacular**, which returns complete,
  structured ingredients and hosts cooking instructions itself (so steps can be
  shown in-app instead of relying on a link that may be dead).
- **Takeaway:** When the data looks wrong, verify whether *your code* or the
  *upstream source* is at fault before "fixing" anything. Here, a few controlled
  API calls proved the app was correct and the source was the problem.

### 2. Burning through the API's daily quota

- **Symptom:** Recipe search suddenly failed with "your daily points limit has
  been reached."
- **Root cause:** Spoonacular's free tier allows only 50 points/day, and each
  search was fetching *full* details (ingredients, steps, etc.) for all 20
  results up front — expensive, and mostly wasted since users open only a few.
- **Fix:** Made search cheap — it now fetches just the list (id, title, image),
  and full details load **per-recipe when a modal opens**. Also replaced the raw
  error with a friendly "kitchen's closed for restocking" message.
- **Takeaway:** Pay for data when it's actually needed, not speculatively. Match
  API usage to the user's real path through the app.

---

## Part 2 — Deployment (Render + MongoDB Atlas)

### 3. The production build failed: `vite: not found`

- **Symptom:** Render's build failed at `npm run build` with `sh: 1: vite: not
  found`. The client install had added only ~8 packages.
- **Root cause:** Render sets `NODE_ENV=production`, and in that mode `npm
  install` **skips `devDependencies` by default**. Vite (the build tool) lives in
  `devDependencies`, so it was never installed.
- **Fix:** Install the client with `npm install --include=dev` in the build
  command, forcing dev dependencies to build the front end.
- **Takeaway:** Build tools you need at *build time* must be installed even under
  `NODE_ENV=production`. This bites almost everyone deploying a Vite/webpack app.

### 4. The build script polluted `package.json` with a self-dependency

- **Symptom:** After a build, both `client/package.json` and
  `server/package.json` had a mysterious `"good-eats": "file:.."` dependency.
- **Root cause:** Running `npm install --prefix client` (and `--prefix server`)
  from the repo root made npm treat the root package as a dependency to install
  into each subfolder.
- **Fix:** Switched the root build script from `--prefix` to plain `cd client &&
  npm install && ...` so each install runs from inside its own directory.
- **Takeaway:** `npm --prefix` behaves surprisingly when the current directory is
  itself a package. Prefer `cd`-ing into the target directory.

### 5. Sign-up / log-in failed with a CORS error — on a same-origin app

- **Symptom:** On the deployed site, register/login failed with
  `Origin https://good-eats-….onrender.com not allowed by CORS` — even though
  the client and API are served from the *same* origin. Recipe **search** (a GET)
  worked fine.
- **Root cause:** Browsers attach an `Origin` header to same-origin **POST**
  requests (login/register) but not to same-origin GETs. The server's CORS
  allowlist only contained the dev origin (`localhost:5173`), so it rejected the
  deployed site's own origin on POSTs.
- **Fix:** Allow a request when its `Origin` host matches the request's own
  `Host` (i.e. it's genuinely same-origin) — works on Render, a custom domain,
  anywhere, with no per-URL config. Cross-origin requests not in `CLIENT_ORIGIN`
  are still rejected.
- **Takeaway:** "Same-origin" doesn't mean "no `Origin` header." A permissive
  server-side CORS check that only allowlisted the dev URL silently broke
  production writes. Also: a testing lesson — an early end-to-end test passed
  because it ran from Node (no `Origin` header) and never exercised the broken
  browser path. **Test the layer that's actually broken.**

### 6. `bad auth` connecting to MongoDB Atlas

- **Symptom:** The server deployed but crashed on start with `bad auth :
  authentication failed`.
- **Root cause:** The `MONGODB_URI` username/password didn't match an Atlas
  **database user** (a common mix-up with the Atlas *account* login), and the
  connection string was missing the database name.
- **Fix:** Created a database user with a clean (no special-character) password,
  allowed network access from anywhere (`0.0.0.0/0`, since Render's egress IPs
  aren't fixed on the free tier), and put the database name in the URI:
  `…mongodb.net/goodeats?…`.
- **Takeaway:** An Atlas *database user* is not your Atlas login. Special
  characters in the password need URL-encoding, and the DB name belongs in the
  connection string.

### 7. A corrupted environment variable (pasted twice)

- **Symptom:** Restaurant search failed only in production with a Yelp
  `VALIDATION_ERROR`. The exact same key worked locally.
- **Root cause:** When the Yelp key was pasted into Render's dashboard, part of
  it was **duplicated** — the key plus a repeat of its own tail. The start
  matched the real key, so it "looked" correct at a glance.
- **Fix:** Cleared the field and pasted the single, correct key.
- **Takeaway:** When a secret works in one environment but not another, suspect a
  copy-paste corruption (duplication, trailing whitespace/newline, or hidden
  characters) before anything else. The upstream service's error often shows the
  exact value it received — read it.

### 8. The `onrender.com` URL couldn't be renamed

- **Symptom:** Renaming the Render service didn't change its
  `good-eats-z0fw.onrender.com` URL.
- **Root cause:** Render decouples a service's display name from its
  `onrender.com` subdomain. The subdomain (with a random suffix for uniqueness)
  is fixed at creation and can't be changed.
- **Fix:** Accepted the URL as-is (it's a fully working, shareable address); a
  custom domain is the only route to a cleaner URL.
- **Takeaway:** Know your platform's constraints before promising a clean URL.

### 9. Email hung forever and never sent (the big one)

- **Symptom:** "Forgot password" showed "Sending…" for an inordinately long time,
  then no email arrived. The exact same Gmail credentials sent mail instantly
  from a local machine.
- **Root cause:** **Render's free tier blocks all outbound SMTP** (ports 25, 465,
  587), as of Sept 2025, to prevent spam. Nodemailer/Gmail uses SMTP, so the
  connection hung until it timed out. (This also silently broke the
  "email my shopping list" feature.)
- **Fix:** Stopped using SMTP entirely and switched to an **HTTPS email API**,
  which the free tier allows.
  - First tried **SendGrid**, but its new-account gate never granted the
    `mail.send` scope — even a *full-access* API key (207 scopes) came back
    without it, proving the block was at the account level, not the key.
  - Switched to **Brevo**, which activated immediately after verifying a sender
    email and worked on the first try.
- **Takeaway:** Managed hosts commonly block SMTP; use a transactional email
  **API over HTTPS** in the cloud. And when *every* key fails identically —
  including a full-access one — stop swapping keys and look one level up (the
  account/platform), then don't be afraid to switch providers.

---

## Meta-lessons

- **Reproduce before you fix.** Nearly every bug here was pinned down by a small,
  targeted test (a couple of API calls, a curl with a specific header) that
  proved *where* the failure lived before changing any code.
- **"Works locally" hides environment-specific failures.** CORS headers, SMTP
  egress, `NODE_ENV`, and pasted secrets all behaved differently in production.
- **Read the upstream error.** The Yelp duplicated-key, the Spoonacular quota,
  the Mongo `bad auth`, and the SendGrid scope list each pointed straight at the
  real cause once actually read.
