# 3813ICT Full Stack Development — Phase 1

**Name:** <!-- your name -->
**Student number:** s<!-- number -->
**Workshop:** <!-- day / time / campus or online -->
**Repository:** <!-- https://github.com/... -->

---

## 1. Project Overview

<!--
Rubric: contributes to Submission (1 pt).
Half a page max. Cover: what the app is, the MEAN stack + socket.io, the three
permission levels, and what is in scope for Phase 1 vs deferred to Phase 2.
Write this LAST — it's easier once everything else exists.
-->

---

## 2. Git Strategy

<!--
Rubric: Documentation - Git (1 pt) + GitHub commits (2 pts).
Must cover, explicitly:
- Repo structure (single repo, client/ + server/) and why
- Branching model you actually use (e.g. main + feature/* branches)
- Naming convention for branches and commit messages
- How and when you merge back (merge vs rebase, PRs to yourself?)
- Commit frequency/philosophy — small, working increments
- .gitignore contents and why (node_modules, dist, .angular, data/*.json?)
- Tags or releases if you use them (e.g. phase1-submission)
Include 2-3 real example commit messages from your own history.
The marker checks this section AGAINST your actual commit log — don't describe
a workflow you didn't follow.
-->

### Repository structure

```
/
├── client/          # Angular 20 front end
├── server/          # Node + Express API
│   └── data/        # JSON persistence
├── docs/            # storyboards, diagrams
├── Phase1.md
└── README.md
```

### Branching strategy

### Commit conventions

---

## 3. Specifications & Assumptions (Functional Requirements)

<!--
Rubric: contributes to Submission + underpins everything else.
Spec says TABLE LAYOUT PREFERRED — use the table.
Every row should be traceable to either (a) the assignment PDF, (b) the Week 2
client briefing, or (c) your own assumption. Say which in the Source column —
that is what "clear elicitation" means and it's cheap marks.
Aim for coverage of: auth, user CRUD, role assignment, group CRUD, channel CRUD,
membership assignment, permissions enforcement, persistence, logout behaviour.
-->

### Functional requirements

| ID | Requirement | Role(s) | Priority | Source | Phase |
|---|---|---|---|---|---|
| FR-01 | | | Must | Spec / Briefing / Assumption | 1 |
| FR-02 | | | | | |

### Non-functional requirements

| ID | Requirement | Notes |
|---|---|---|
| NFR-01 | Responsive layout down to 360px width | |
| NFR-02 | | |

### Assumptions

<!-- Numbered list. Anything the client did NOT specify that you decided yourself.
Markers reward explicit assumptions far more than silent guesses. -->

1.

### Permissions matrix

<!-- One small table = instant clarity for the marker on the User Login /
User Administration criteria. -->

| Action | Super Admin | Group Admin | Chat User |
|---|---|---|---|
| Create user | | | |
| Promote to Group Admin | | | |
| Create group | | | |
| Create channel | | | |
| Assign user to group | | | |
| Assign user to channel | | | |
| Remove user from group | | | |
| Delete own account | | | |

---

## 4. Data Structures

<!--
Rubric: Documentation - Data Structures (2 pts).
Full marks wants "comprehensive... readable format. ALL required fields described."
So for each entity give: a field table (name / type / required / description) AND
a JSON example. Then describe the relationships and how it's stored on disk.
Don't forget: what the ID scheme is, and what is stored in localStorage.
-->

### Entity relationships

<!-- One diagram or a short prose description: User ⇄ Group ⇄ Channel cardinality. -->

### User

| Field | Type | Required | Description |
|---|---|---|---|
| id | string | yes | |
| username | string | yes | |
| email | string | | |
| password | string | yes | Plain text for Phase 1 — hashed in Phase 2 |
| roles | string[] | yes | |
| groups | string[] | | |

```json
{
  "id": "u1",
  "username": "super",
  "email": "super@example.com",
  "password": "123",
  "roles": ["SUPER_ADMIN"],
  "groups": []
}
```

### Group

| Field | Type | Required | Description |
|---|---|---|---|

```json
```

### Channel

| Field | Type | Required | Description |
|---|---|---|---|

```json
```

### Message (Phase 2 — defined now)

| Field | Type | Required | Description |
|---|---|---|---|

### Server-side persistence

<!-- Rubric: JSON Serialisation (1 pt). Name the file(s), the shape of the top-level
object, when it is read (server start?) and when it is written (every mutation?). -->

### Client-side storage

<!-- Rubric: Local Storage (1 pt). Exactly what key(s), exactly what value,
when set (login) and when removed (logout). -->

---

## 5. Angular Architecture

<!--
Rubric: Documentation - Angular Architecture (3 pts) — the biggest documentation
criterion. Full marks needs components, services AND models listed, each with a
description of its ROLE in the application. Tables again.
-->

### Components

| Component | Route | Role in application | Accessible to |
|---|---|---|---|
| LoginComponent | `/login` | | All |
| DashboardComponent | | | |
| GroupListComponent | | | |
| ChannelListComponent | | | |
| ChatComponent | | | |
| AdminUsersComponent | | | |
| AdminGroupsComponent | | | |

### Services

| Service | Responsibility | Consumed by |
|---|---|---|
| AuthService | | |
| UserService | | |
| GroupService | | |
| ChannelService | | |
| SocketService (Phase 2) | | |

### Models

| Model | Fields | Used by |
|---|---|---|
| User | | |
| Group | | |
| Channel | | |
| Message | | |

### Routes

| Path | Component | Guard | Notes |
|---|---|---|---|
| `/login` | LoginComponent | — | |
| `/dashboard` | | AuthGuard | |
| `/admin` | | RoleGuard(SUPER_ADMIN) | |

### Route guards / permission enforcement

---

## 6. Server-side Endpoints (REST API)

<!--
Rubric: Documentation - REST API (2 pts). Full marks wants routes, PARAMETERS
and RETURN VALUES, comprehensively. A table alone may not carry the return
shapes — add a short example request/response for the important ones.
Mark which are implemented in Phase 1 vs planned.
-->

| Method | Route | Params / Body | Returns | Auth | Phase |
|---|---|---|---|---|---|
| POST | `/api/auth/login` | `{username, password}` | `{ok, user}` \| `{ok:false}` | — | 1 |
| POST | `/api/users` | | | Super Admin | 1 |
| GET | `/api/users` | | | Super Admin | 1 |
| DELETE | `/api/users/:id` | | | | 1 |
| GET | `/api/groups` | | | | 1 |
| POST | `/api/groups` | | | | 1 |
| POST | `/api/groups/:id/members` | | | | 1 |
| GET | `/api/channels` | | | | 1 |
| POST | `/api/channels` | | | | 1 |

### Example request / response

```http
POST /api/auth/login
{ "username": "super", "password": "123" }
```

```json
{ "ok": true, "user": { "id": "u1", "username": "super", "roles": ["SUPER_ADMIN"] } }
```

---

## 7. Design Documents

<!--
Rubric: Website Design (5 pts) — the single biggest code criterion, and it is
graded on how well the built UI MATCHES these storyboards. So: draw them first,
build to them, and if you change the build, update the storyboard.
Needs: storyboards for every screen × every permission level, plus evidence of a
RESPONSIVE methodology (show desktop AND mobile for at least the key screens,
and state your breakpoints).
Embed images from docs/ with relative paths so they render on GitHub.
-->

### Design principles & rationale

<!-- Colour, typography, layout grid, navigation model, accessibility choices. -->

### Responsive strategy

| Breakpoint | Width | Layout behaviour |
|---|---|---|
| Mobile | < 768px | |
| Tablet | 768–1024px | |
| Desktop | > 1024px | |

### Storyboards

#### Login
![Login](docs/storyboard-login.png)

#### Chat User — dashboard
![Chat User dashboard](docs/storyboard-user-dashboard.png)

#### Group Admin — group management
![Group Admin](docs/storyboard-group-admin.png)

#### Super Admin — user administration
![Super Admin](docs/storyboard-super-admin.png)

### Navigation flow

<!-- Simple flow diagram: which screen leads to which, per role. -->

---

## Appendix — Phase 1 scope

| Feature | Phase 1 status |
|---|---|
| Login / logout | Implemented |
| localStorage session | Implemented |
| User CRUD + role assignment | Implemented |
| Group / channel CRUD + assignment | Implemented |
| JSON file persistence | Implemented |
| Chat messaging | Mock data |
| Sockets | Phase 2 |
| Image upload | Phase 2 |
| MongoDB | Phase 2 |
