# 🔐 Crack the Code — Participant Console (React + Vite)

React/Vite team console for the Crack the Code event platform, deployed separately
from its backend (e.g. this app on Vercel, `server/` on Render).

## ⚠️ Required setup: point this app at your backend

This app and the backend in `server/` are **two separate deployments with two separate
URLs**. The frontend has no way to know where the backend lives unless you tell it.

1. Deploy `server/` (or reuse the backend you already deployed for the admin console)
   and copy its public URL, e.g. `https://your-app.onrender.com`.
2. In your **Vercel project settings → Environment Variables**, add:
   ```
   VITE_API_BASE = https://your-app.onrender.com
   ```
   (no trailing slash) — use the *same* backend URL as your admin console.
3. **Redeploy** after adding/changing this variable. Vite bakes environment variables
   into the built JavaScript at *build time* — saving the variable alone does nothing
   until the app is rebuilt.

If you skip this, the join screen shows a warning banner instead of failing silently,
and any request gives a clear message about what's wrong.

## What was fixed in this version

- **`src/api.js`** — removed a fallback that guessed the API was hosted at
  `window.location.origin` (this app's own Vercel URL). On a split deployment that
  guess is always wrong and caused every request to fail with a generic "Request
  failed". It now requires `VITE_API_BASE` explicitly (or falls back to
  `localhost:4000` only when actually running on localhost), and gives specific error
  messages for network failures vs. wrong-URL vs. server-side errors.
- **`src/components/Timer.jsx`** — the countdown could keep firing `onExpire` every
  second after hitting zero (instead of once), which could trigger duplicate
  submissions if a submit request was still in flight. It now fires exactly once per
  round.
- **`src/App.jsx`** —
  - Teams could get permanently stuck on the "Round submitted, waiting for the next
    round…" screen if a `round-released` Socket.IO event was missed (brief
    disconnect, backgrounded tab, etc.), because background polling was disabled
    while a result was showing. Polling now continues in the background regardless,
    so a team always recovers within a few seconds even if a live event is missed.
  - Added a `connect`/reconnect handler that re-syncs state from the server, for the
    same reason.
  - When the admin clicks **Close Now** on a round early, the app now immediately
    forces that team's timer to expire (auto-submitting whatever they've entered so
    far), instead of just showing an alert while the old, later countdown kept
    running — which previously meant a team's genuine answers could be rejected by
    the server as "time's up" once they got around to submitting.

## Local development

```bash
npm install
cp .env.example .env.local   # then edit VITE_API_BASE to your local server, e.g. http://localhost:4000
npm run dev
```

## Deploying the backend (`server/`)

See `server/.env.example` for required environment variables (`ADMIN_KEY`,
optionally `GEMINI_API_KEY`). On Render: create a Web Service with root directory
`server`, build command `npm install`, start command `npm start`.

## Deploying this frontend

`vercel.json` is already configured for a Vite SPA. Connect the repo to Vercel and
set `VITE_API_BASE` as described above.
