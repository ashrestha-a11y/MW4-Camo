# MW4 Camo Command — React

React + Vite frontend, Vercel serverless storage endpoint, optional Upstash Redis. Single-user tracker with local browser storage as the default. No external assets needed: existing screenshot crops are embedded in `src/model.js`.

## Run locally

Install Node.js 22+, open this folder in VS Code, then:

```sh
npm install
npm run dev
```

Open the URL Vite prints. Local storage works immediately. `npm test` tests progression without dependencies; `npm run build` builds the frontend. The optional cloud API requires Vercel's runtime (use `npx vercel dev` for local API testing after configuring environment variables).

## Deploy to Vercel

1. Extract ZIP, open the extracted `mw4-react` folder. Upload its **contents** to a new GitHub repository, including `src`, `api`, `package.json`, `index.html` and `vercel.json`.
2. In Vercel, Add New → Project → Import the GitHub repo. Root directory should be the folder containing `package.json`. Framework preset: Vite; build command: `npm run build`; output directory: `dist`. Deploy.
3. Local saving works as soon as the site loads. For cloud saving, create an Upstash Redis database via Vercel Marketplace or https://console.upstash.com/.
4. In Vercel project Settings → Environment Variables, set these three server-only variables for Production (and Preview if desired):

| Name | Value |
| --- | --- |
| `UPSTASH_REDIS_REST_URL` | Redis REST URL from Upstash |
| `UPSTASH_REDIS_REST_TOKEN` | Redis read/write REST token |
| `TRACKER_ACCESS_KEY` | A long, unique random secret of your choosing |

Never prefix these with `VITE_`, commit them to GitHub, or share your access key. Redeploy after setting the variables. If the integration already added the two Redis variables, only add the access key.

5. Open your deployed app, expand **Cloud storage**, enter your `TRACKER_ACCESS_KEY`, and click **Connect cloud**. If a cloud save exists, confirm loading it; if empty, confirm uploading your local progress. Subsequent edits auto-save after a short debounce. Use **Save now** and wait for `Cloud saved ✓` before closing or switching devices. Reconnect on a new browser or after reload to resume cloud saving. The key is held only in memory for the current session.

This is a single private progress record per database, not a multi-user account system. Use one editing session at a time: concurrent sessions can overwrite one another. Cloud failures retain the local save. Back up periodically. No account with Activision is required and no game data is fetched automatically.

## Move existing progress

Open the old HTML tracker, click Export backup, then Import backup on the new React site. Import before connecting to an empty cloud database. If a cloud record already exists, connect first, then import (confirm replacing the loaded record) and click Save now. Local storage is per website/origin, so old file-based progress is not transferred automatically.

## Project structure

- `src/main.jsx`: React components and storage controls
- `src/model.js`: weapon data, embedded camo/weapon icons, progression rules and state helpers
- `src/style.css`: responsive styling from previous tracker
- `api/progress.js`: authenticated GET/PUT endpoint, Redis persistence
- `test/model.test.js`: core progression regression tests

Existing data from the HTML version is retained, including provisional requirements and illustrative textures. CSG-35 Terminus is confirmed at Prestige Master 44; other Terminus thresholds are provisional. Base caps and acquisition requirements are not newly verified in this conversion. Unknown weapons remain marked unverified. Divergence is a shared unlock tracked separately.

References: https://vercel.com/docs/frameworks/frontend/vite ; https://vercel.com/docs/marketplace-storage ; https://upstash.com/docs/redis/features/restapi
