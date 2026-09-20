# Fabulari

**Student:** Holly Blunt — s5394008
**Workshop:** Online Friday
**GitHub:** https://github.com/hblunt/fabulari

A full-stack chat application for Griffith University 3813ICT Full Stack Development. Users sign in, belong to groups, and talk in channels. Three permission levels (Super Admin, Group Admin, Chat User) control who can manage users, groups, and channels.

## Tech stack

| Layer | Technology | Version installed |
| --- | --- | --- |
| Runtime | Node.js | 22.22.3 |
| Front end | Angular (CLI + core) | CLI 22.1.5 / `@angular/core` 22.1.3 |
| Front-end language | TypeScript | ~6.0 (from Angular 22 default) |
| Front-end styles | Tailwind CSS | 4.x |
| UI primitives | spartan/ui (`@spartan-ng/brain` + helm) | 1.x |
| Accessibility primitives | Angular CDK | (matches Angular version) |
| API | Express | 5.2.1 |
| Database | MongoDB (native `mongodb` driver, no mongoose) | 7.x |
| CORS | `cors` | 2.8.6 |
| API reload | nodemon (dev only) | 3.1.14 |

Phase 1 stores data in JSON files on the server. Phase 2 is moving that to MongoDB, then adding socket.io, image upload, and automated tests.

## Architecture at a glance

- **Standalone components.** No `AppModule`; the app is bootstrapped from `main.ts` and each component declares its own imports.
- **Signals for state, observables for events.** Services write HTTP results into signals; components read the signals rather than subscribing.
- **Single application shell.** One layout hosts navigation and the router outlet, with items shown or hidden by role.
- **Lazy-loaded routes.** Each route fetches its component only when first visited.
- **Functional guards.** Guards prevent navigation to unusable screens; every permission is also enforced server-side.

## Folder structure

```
Fabulari/
  client/          Angular front end (UI, routing, proxy to the API)
    src/app/
      core/        guards, interceptors, models, services
      shared/      reusable presentational components and copied spartan UI
      features/    one folder per area (auth, profile, groups, rooms, requests, admin)
  server/          Node + Express API
    data/          JSON persistence files (users, groups, channels)
    uploads/       Uploaded profile images (not committed)
    server.js      Express entry point
  docs/            Storyboards, diagrams, and assignment spec
  README.md        This file
  .gitignore       Files that should not be committed
```

## Prerequisites

- Node.js **22.x** (this project was set up with `v22.22.3`; Angular 22 needs Node 20.19+ or 22.12+)
- npm (comes with Node; this machine used `10.9.8`)
- **MongoDB** running locally or on Atlas (native driver only — mongoose is not used)

## MongoDB

The API connects on boot. If Mongo is down, the server will not start.

Default URL: `mongodb://127.0.0.1:27017/fabulari`

To override it, copy `server/.env.example` to `server/.env` (gitignored) and set `MONGODB_URI`.

Local install (Homebrew): `brew services start mongodb-community`. Or Docker:

```bash
docker run -d --name fabulari-mongo -p 27017:27017 mongo:7
```

Atlas: use the connection string from the cluster, with the database name `fabulari` in the path.

## Install and run

Run the **server** and the **client** in two separate terminals. Start the server first so `/api` has somewhere to go.

### Server

```bash
cd server
npm install
npm run dev
```

- `npm start` — run with Node (`node server.js`)
- `npm run dev` — same, but nodemon restarts on file changes
- API: `http://localhost:3000`
- Health check: `GET http://localhost:3000/api/health` → `{ "ok": true, "mongo": true }`
- `npm run seed` — loads sample data into JSON files **and** Mongo
- `npm run reset` — empties both; the next start requires bootstrap

### Client

```bash
cd client
npm install
npm start
```

- Angular dev server: `http://localhost:4200`
- Requests to `/api` are proxied to `http://localhost:3000` (see `client/proxy.conf.json`)

### First run

On first start the application detects that no users exist and redirects to the onboarding screen, which creates the single Super Admin account. This process runs once and is disabled permanently afterwards.

## Styling

The project uses **Tailwind CSS 4** for utility classes and responsive breakpoints, with **spartan/ui** supplying accessible UI primitives (keyboard navigation, focus management, ARIA behaviour) for dialogs, dropdowns and form controls.

spartan/ui has two layers:

- **Brain** — headless primitives installed from npm as `@spartan-ng/brain`
- **Helm** — the styled layer, which the CLI **copies into this repository** rather than resolving from `node_modules`

Helm files are therefore part of the source and are version controlled. Theme variables live in `client/src/styles.css`; group colour themes are defined as preset palettes built on those same CSS variables.

To add a spartan component:

```bash
cd client
ng g @spartan-ng/cli:ui
```

Colours should use the semantic tokens (`background`, `foreground`, `primary`, `muted`, `border`, `ring`) rather than hard-coded Tailwind colours, so theming stays consistent.

No animation library is used. Transitions rely on Tailwind's `transition` utilities.

### Responsive behaviour

The interface targets desktop and tablet, using Tailwind's `md` (768px), `lg` (1024px) and `xl` (1280px) breakpoints. Below 768px the layout holds at its tablet arrangement.

## Phase 1 vs Phase 2 storage

The live API still reads JSON in `server/data/` until the next slice. Mongo is
connected on startup, and `npm run seed` / `npm run reset` already write both
places. Uploaded images go to `server/uploads/`, which **is** gitignored.

## Documentation

- [`docs/Phase1.md`](./docs/Phase1.md) — Phase 1 specification
- [`docs/Phase2.md`](./docs/Phase2.md) — Phase 2 specification
- [`docs/`](./docs) — storyboards and design documents