# API Dash — Performance Profiling (App Report 4)

Interactive version of the profiling results for API Dash (Team 36, ISIS-3510).
Static site with interactive charts (Plotly) built from the real DevTools exports:
frame timings, heap snapshot and CPU samples. Each chart sits next to the analysis
and conclusions from the written report.

## Run locally

```bash
npm install
npm start
# open http://localhost:3000
```

## Deploy to Render

1. Push this `web/` folder to a GitHub repo (it can be the repo root, or a subfolder).
2. On Render: **New → Web Service**, connect the repo.
3. Render reads `render.yaml` automatically. If you set it up by hand instead:
   - **Runtime:** Node
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Health check path:** `/healthz`
4. Deploy. Render gives you a public URL to share with the professors.

> If you push the whole `AppReport` folder, set Render's **Root Directory** to `web`.

## Files

- `public/index.html` — page structure and the written analysis next to each figure.
- `public/style.css` — academic print-style design (no template look).
- `public/app.js` — draws the interactive charts from `public/data.json`.
- `public/data.json` — the real profiling data extracted from the DevTools exports.
- `server.js` — minimal Express static server (what Render runs).
# apidash-profiling-web
