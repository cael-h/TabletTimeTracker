# TabletTimeTracker — Claude Context

## Project Overview
Mobile-first PWA for tracking kids' screen time. React 19 + TypeScript + Vite + Firebase (Firestore + Auth) + Tailwind CSS + vite-plugin-pwa.

## Termux / Shared Storage Build Setup
The project lives on Android shared storage (FAT filesystem), which **cannot hold symlinks or the `node_modules` directory**. Workaround already in place:

- `node_modules` lives at `~/node_modules` (not in the project dir)
- All `package.json` scripts use absolute `$HOME/node_modules/.bin/` paths
- `tsconfig*.json` files have `typeRoots` pointing to `~/node_modules/@types` (4 levels up)
- `tsBuildInfoFile` is set to project root (not inside node_modules)

To build: `npm run build` from the project directory. This runs tsc then vite.

## Git Workflow
- Default branch: `main`
- Claude feature branches follow the pattern: `claude/<feature>-<sessionId>`
- PRs are opened via the Gitea API at `http://127.0.0.1:<port>/api/v1/...` (port changes each session)
- `gh` CLI is not available — use `curl` against the Gitea API or open PRs manually in the web UI

## Recent Work
- **Hide family members** (`claude/hide-family-members-Fgy1F`): Added a per-device toggle in Settings to hide specific family members from the UI. PR opened, awaiting merge to main.
- **Build fixes**: Updated vite-plugin-pwa, fixed triggerAlarm hoisting error, moved node_modules paths to `~/node_modules/.bin/`.

## Key Files
- `src/` — all source code
- `vite.config.ts` — Vite + PWA config
- `tsconfig.app.json` / `tsconfig.node.json` — TypeScript configs (note the shared storage typeRoots)
- `firebase.json` — Firebase hosting config
- `IMPLEMENTATION_PLAN.md` — feature planning notes
