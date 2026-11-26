# MW4 Camo Command — multi-user edition

React + Vite frontend, Vercel Functions and Upstash Redis. Each user registers a first name, last name, unique username and password, signs in and gets an independent tracker save. Existing camo assets, rules and backup format are unchanged. Some game data is provisional.

## Upgrade your existing Vercel project
1. Export a JSON backup from the previous tracker before updating it. Existing multi-user Redis saves remain associated with their original usernames. The old pre-login shared Redis save is not automatically assigned to any account.
2. Extract this ZIP and copy the contents of `mw4-react` into the root of your existing Git repository (including `api`, `server`, `src`, `test`, `package.json`, `vercel.json`, and hidden config files). Do not replace the `.git` directory or your local secrets.
3. In Vercel, keep the Vite preset, build command `npm run build`, output `dist`.
4. Connect an Upstash Redis database from Vercel Marketplace if you have not already done so. Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in project environment variables. Use a read/write token. `TRACKER_ACCESS_KEY` is no longer used and can be removed. Never expose the Redis token via a `VITE_` variable or Git.
5. Commit and push to the connected branch. Vercel builds automatically; redeploy if you changed environment variables.
6. Open your deployed app, create an account, then import your old JSON backup into that account. Each other user creates their own account.

## Local development
Install Node.js 22+, run `npm install` and `npm test`. Use `npx vercel dev` after linking your Vercel project and setting the Redis variables in a local `.env.local` (use a separate development database). `npm run dev` runs the Vite frontend only, so login will not work without the API. Production uses `npm run build`.

## Authentication and storage
- Username: 3–24 lowercase letters, digits or underscores; usernames are case insensitive. Password: at least 10 characters, at most 256 bytes.
- Passwords are salted and hashed with Node scrypt; opaque 14-day sessions are stored in Redis and delivered in HttpOnly, SameSite=Lax cookies (Secure on Vercel).
- Server derives the progress key from the authenticated session, not a client-supplied user ID. A stale tab cannot save to a different signed-in account. Auth POSTs and progress PUTs enforce same origin. Login and registration are rate limited.
- Progress saves automatically after edits (400ms debounce), with a per-user local recovery copy while a save is pending. The header shows saving/saved status; failed saves retry after five seconds. Existing accounts are asked to complete their names once, without changing their username or progress keys. Sign out flushes pending saves first; if cloud storage fails, retry or export a backup.
- This is a small personal/community app, not a fully hardened identity platform. No email verification, password recovery, MFA, or account deletion UI yet. Use distinct passwords. Multiple simultaneous editing sessions for the same user use last-write-wins; avoid editing from multiple devices at once. Local recovery copies may remain on a shared computer after a failed save; do not use a shared browser profile for sensitive data.
- Redis keys are prefixed `mw4:v2:`. Old shared progress remains untouched. Database credentials stay on the server.

## Tests
`npm test` runs progression and authentication tests with an in-memory mock of Redis, including independent account saves and unauthorized access. A real deployment and Redis connection must be verified after setup.

### Warzone Special camo update (November 25, 2026)
The game-mode selector defaults to Warzone; Multiplayer and DMZ remain selectable. Special objectives and numeric targets were matched by camo name using the community catalogs at https://codmunity.gg/camo-tracker and its individual MW4 weapon pages, https://mw4.gg/camo-tracker/ and https://livecamotracker.com/mw4/camos/warzone . These are community-reported, not individually publisher-certified. 105 Special targets across 35 weapons are included; JAK 12 and ZLR Talonhawk targets remain unknown and their Warzone Special counters are disabled. Existing save keys, API and other mode criteria remain unchanged; review any previously entered Warzone counts against the updated objective. Completionist targets were not changed in this update. No new environment variables required.

### Warzone Completionist update
Applies the previously requested Warzone targets (Gold 8, AR Platinum 25/Harmonic 15, SMG Platinum 15/Harmonic 25, Shotgun Platinum 25, Sniper Platinum/Harmonic 35). Five were already present; three were corrected. CODMunity's public catalogue (https://codmunity.gg/camo-tracker/wz-mw4) currently lists 35 weapons but does not expose detailed challenge text in the retrieved page; these numerical targets are carried forward from the approved comparison, not freshly independently verified. Remaining unknown targets are disabled. JAK 12 and ZLR Talonhawk remain as placeholders to preserve stable IDs and stored progress, excluded from default class Gold goals. Existing custom goals remain unchanged. Export a backup before deploying. No Redis schema or credentials changes.

### Screenshot-confirmed roster and level update
All 35 active weapons use the base caps shown in the November 25 in-game screenshots; 22 caps changed. Two unconfirmed weapons are hidden after assigning original IDs so existing save records remain compatible. All nine classes now have Warzone Gold, Platinum and Harmonic Break targets from the prior audit (not freshly independently verified). Prior Terminus thresholds are retained as provisional except CSG-35 (44, confirmed). Military and Special level milestones are still provisional; out-of-range milestones remain clamped. Existing accounts should sign in normally, without importing a backup unless recovery is needed. No Redis migration or new credentials needed. Preview and production build were not tested here.

## Admin panel

Create and sign in to your own account **before** enabling admin access. In Vercel Project > Environment Variables add `TRACKER_ADMIN_USERNAMES` with your exact existing username (comma-separated for multiple administrators). Use Production; do not use a `VITE_` prefix. Redeploy, then sign out and sign back in. The Admin panel button appears next to Sign out. All admin requests are authorized on the server. Admin accounts are protected from admin-panel mutations. Never allow an unclaimed username to be an admin.

The panel supports search, deleting accounts and cloud progress, resetting cloud progress, disabling/reactivating accounts, revoking sessions, and setting a new password. Reset passwords must be securely communicated to the user; no forced password-change or email recovery workflow is included. Account actions rotate the session epoch; prior session records expire normally, but are rejected immediately on subsequent session validation. Older browser recovery copies remain on the device but are no longer automatically loaded after an epoch change. Backups already downloaded cannot be remotely deleted. Only MW4 account and progress keys are modified; never flush the shared database. Avoid simultaneous account administration and user writes; an already in-flight request may finish. The admin API is intended for a small user roster. Preview and production share the configured database unless configured separately.

Run `npm test` for mocked Redis regression tests. Live deployment and production build require verification.
