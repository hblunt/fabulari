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
| Front-end styles | SCSS | (Angular CLI `--style=scss`) |
| API | Express | 5.2.1 |
| CORS | `cors` | 2.8.6 |
| API reload | nodemon (dev only) | 3.1.14 |

Phase 1 stores data in JSON files on the server. Phase 2 will replace that with MongoDB, add socket.io for real-time chat, image upload, and automated tests.

## Folder structure

```
Fabulari/
  client/          Angular front end (UI, routing, proxy to the API)
  server/          Node + Express API
    data/          JSON persistence files (users, groups, channels)
    server.js      Express entry point
  docs/            Storyboards, diagrams, and assignment spec
  README.md        This file
  .gitignore       Files that should not be committed
```

## Prerequisites

- Node.js **22.x** (this project was set up with `v22.22.3`; Angular 22 needs Node 20.19+ or 22.12+)
- npm (comes with Node; this machine used `10.9.8`)

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
- Health check: `GET http://localhost:3000/api/health` → `{ "ok": true }`

### Client

```bash
cd client
npm install
npm start
```

- Angular dev server: `http://localhost:4200`
- Requests to `/api` are proxied to `http://localhost:3000` (see `client/proxy.conf.json`)

## Phase 1 vs Phase 2 storage

Phase 1 writes users, groups, and channels to JSON files in `server/data/`. Those files are **not** gitignored — they are part of the submission. Phase 2 will move persistence to MongoDB.
