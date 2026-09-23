# 3813ICT Full Stack Development — Phase 2

**Name:** Holly Blunt
**Student number:** s5394008
**Workshop:** Friday Online Workshop
**Repository:** https://github.com/hblunt/fabulari

---

## 1. Project Overview

Fabulari is a full-stack chat application built on the MEAN stack (MongoDB,
Express, Angular 20+ and Node.js) with socket.io providing real-time
communication. Users login/register, join groups, and hold text and image
conversations in the rooms those groups contain.

Groups are self-contained communities with their own membership, theme and
minimum age limit, which users can join by request. There can be many rooms contained within a group, all of which members of a group have access to.
Group admins manage rooms, approve join requests and moderate
their members. A single super admin approves the creation and deletion of
groups and removes users from the platform, but takes no part in chat and has
no visibility into any group's contents.

---
## 2. Git Strategy

### Repository

A single private repository holds both applications. The client and server share
a set of interfaces and are only useful as a pair, so splitting them would mean
coordinating two histories for every change that crosses the API boundary.

```
fabulari/
├── client/          Angular front end
├── server/          Node + Express API
│   └── data/        JSON persistence (committed)
├── docs/            Storyboards and design documents
├── Phase1.md
├── Phase2.md
├── README.md
└── .gitignore
```

Not committed: `node_modules/`, build output (`dist/`,
`.angular/cache/`) and `server/uploads/`, which holds user-generated content
rather than source.

### Branching strategy

Trunk-based with short-lived feature branches. `main` stays in a working state,
and each slice of implementation work is developed on a branch and merged back
through a pull request.

Initial documentation and storyboards are committed directly to `main`. 

| Branch | Scope |
|---|---|
| `chore/project-setup` | Angular and Express scaffolding, proxy, Tailwind and spartan/ui, app shell, routing and guards |
| `feat/auth` | Bootstrap onboarding, registration, login, logout, local storage session |
| `feat/requests` | Request model, creation, administrator queue, approve and reject |
| `feat/groups-and-rooms` | Group browsing, detail, settings, membership and room management |
| `feat/admin` | Super admin user list, deletion, banned accounts, audit log |
| `feat/chat-ui` | Chat interface built against mock data, with no socket code |

Branch names follow `type/short-description`, using the same type prefixes as
commit messages.


### Pull requests

Each branch merges through a pull request, which records what changed and why
and gives a reviewable diff before it reaches `main`.

Pull requests are merged with a merge commit so history persists on `main`.

### Commit conventions

Messages follow the Conventional Commits format:

```
type(scope): summary in the imperative mood

- Specific change
- Specific change
```

Subject lines are kept to roughly 50 characters and written as an instruction
("add", not "added"). The body lists what changed and is omitted when the
subject says enough.

| Type | Used for |
|---|---|
| `feat` | New functionality |
| `fix` | Corrections to existing behaviour |
| `docs` | Documentation only |
| `style` | Formatting with no behavioural change |
| `refactor` | Restructuring that does not change behaviour |
| `test` | Tests |
| `chore` | Tooling, dependencies and configuration |

Scopes name the area affected: `auth`, `groups`, `rooms`, `requests`, `admin`,
`chat`, `api`, `ui`, `docs`.

```
feat(groups): add group creation request flow

- Add GroupRequestForm with reactive validation
- Wire RequestService to POST /api/requests
- Add server-side payload validation for GROUP_CREATE
```

```
fix(auth): clear local storage on logout
```

### Commit frequency

Commits are made in sub-units within the planned branches listed above. 

### Releases

Each phase is tagged on `main` at submission: `v1.0.0-phase1` and
`v2.0.0-phase2`. 

## 3. Specifications & Assumptions

Requirements below cover the full application. 

### System initialisation

| Requirement | Details |
|---|---|
| Bootstrap process | On startup, if no users exist in the system, an onboarding process runs to create the super admin. First name, last name, date of birth, email, and password will be requested. This process is one-time only and disabled once the singular super admin exists.

### Accounts and authentication

| Requirement | Details |
|---|---|
| Self-registration | Users create their own accounts. Administrators cannot create accounts on a user's behalf. |
| Registration fields | First name, last name, date of birth, email, password. Age is calculated from date of birth and is never stored. |
| Unique user identifier | Uses the email address. It is immutable and cannot be reused after a system-wide ban. A user who deletes their own account may register again with the same email. Email is not editable after account creation.|
| Password rules | Minimum 8 characters, at least one uppercase letter, alphanumeric. Stored hashed with bcrypt. |
| Login | Email and password. |
| Change password | Requires the current password plus the new password entered twice. |
| No account recovery | There is no forgot-password flow. A user who loses their password must register a new account. |
| Session persistence | The logged-in user is held in browser local storage and removed on logout. |
| Profile page | Users view and edit all of their own details except email, may delete their own account, and upload or replace a profile picture. This page is private. |
| Account self-deletion | A signed-in user may delete their own account from the profile page. This is not a ban: the email is not blacklisted. The super admin cannot delete themselves. The same group cascade as a system delete applies: a sole admin is succeeded alphabetically; empty groups are removed. |
| New accounts | A new account has no group access until it is accepted into a group. |

### Groups

| Requirement | Details |
|---|---|
| Group attributes | Title, description, minimum age limit, colour theme. |
| Group creation | A user submits a creation request containing all group details. Only the super admin can action it. |
| Approval outcome | On approval the group is created and the requesting user becomes its first group admin. |
| Rejection | The super admin may reject a request. A rejection must include a reason. |
| Editing | A group admin may change the title, description, age limit and colour theme of their group at any time, without a request. |
| Age limit changes | Raising the age limit immediately removes any existing members whose calculated age falls below the new limit. |
| Group browsing | All users can see a list of every group in the system, at any time, and request to join. |
| Join requests | Join requests are sent to the group's admins for approval or rejection. A rejection must include a reason. |
| Age gate | A join request from a user whose calculated age is below the group's age limit is rejected automatically by the system. |
| Multiple memberships | A user may belong to, and be an admin of, any number of groups. |
| Admin promotion | A group admin can promote any member of that group to group admin. |
| Admin demotion | Any group admin can demote another group admin of the same group, including themselves. |
| Minimum one admin | A group must always retain at least one admin. An admin cannot leave or self-demote unless another admin remains. |
| Group deletion | A group admin submits a deletion request to the super admin, who performs the deletion. |
| Leaving a group | Members may leave a group at any time, subject to the minimum-one-admin rule. |

### Rooms

| Requirement | Details |
|---|---|
| Ownership | Every room belongs to exactly one group. A group may have zero or any number of rooms. |
| Access | Group membership grants access to every room in that group. There is no separate room-level join or age limit. |
| Room proposals | Group members propose new rooms. The group admin approves or rejects, with a reason on rejection. |
| Room management | Group admins create, edit and delete rooms in their groups. |
| Theming | The group's colour theme applies to all rooms within it. |

### Chat

| Requirement | Details |
|---|---|
| Real-time messaging | Text messages are delivered in real time to all users in the room. |
| Message content | No length limit. Images may be sent as PNG, JPEG or GIF, maximum 2MB. No video, voice, or hyperlinks. |
| Message display | Every message shows the sender's profile picture, first and last name, and a timestamp. |
| Admin indicator | Group admins are visibly identified as such in the rooms of the groups they administer. |
| Message history | On entering a room a user sees the last 5 messages for context. The server retains only these 5 per room. |
| Local history | Each client stores the full history of messages it has received locally. |
| Message deletion | A user may delete their own messages. The deletion is broadcast to everyone in the room and removes the message from their local store. Messages cannot be edited. |
| Presence | While in a room, a user sees a list of the users currently in that room, sorted alphabetically. |
| Join and leave events | A pop-up notification appears in the room when a user enters or leaves. |
| Group member list | The group view shows the group's full membership separately from the in-room presence list. |
| Exclusions | No read receipts, no offline message delivery, no direct one-to-one messaging, no censoring, no parental controls. |

### Moderation and bans

| Requirement | Details |
|---|---|
| Reporting | A user reports another user to the group admins of the group they share. |
| Group ban | A group admin may ban a user from their group, but only in response to a report. A group admin cannot act on their own report. |
| Ban permanence | Bans are permanent. There is no un-ban process. |
| Effect of a group ban | The user loses access to the group and its rooms. Their account and other group memberships are unaffected. |
| Ban visibility | Group admins can see both the current members and the banned users for their groups. |
| System-wide ban | A group admin submits a request to the super admin to ban a user from the platform entirely. |
| Effect of a system ban | The super admin performs a hard delete of the account. The email address can never be registered again. |
| Admin protection | Deleting a user who is a group's sole admin automatically promotes a replacement admin from the remaining members. A group left with no members is deleted. |
| No direct escalation | Regular users cannot contact the super admin. All escalation runs through a group admin. |

### Requests

| Requirement | Details |
|---|---|
| Request types | Group creation (user to super admin), group join (user to group admin), room creation (member to group admin), system-wide ban (group admin to super admin). |
| No cancellation | Once submitted, a request cannot be withdrawn. |
| Rejection reasons | Every rejection must include a reason. |
| Request visibility | Users can see their own pending requests and their past rejected requests. |
| No self-approval | An administrator cannot approve a request they submitted themselves. |

### Administration and logging

| Requirement | Details |
|---|---|
| Super admin scope | The super admin actions group creation and deletion requests, actions system-wide ban requests, and reviews the audit log. |
| No chat access | The super admin does not participate in chat and does not join groups or rooms. |
| Audit log | Administrative actions are written to an audit log. |
| Log access | Only the super admin can view the audit log. It can be filtered by action type and is ordered by date. |
| Banned account visibility | The super admin can see accounts that have been permanently banned. |

### Non-functional requirements

| Requirement | Details |
|---|---|
| Stack | MongoDB, Express, Angular 20+, Node.js, with socket.io for real-time communication. |
| Responsive layout | The interface adapts across desktop and tablet screen sizes. |
| Transport security | The application is served over HTTPS in Phase 2. |
| Password security | Passwords are hashed with bcrypt and never stored or transmitted in plain text. |
| Upload limits | Uploaded images are restricted to PNG, JPEG and GIF at 2MB or less. |

### Extensions

Not required, implemented if time permits: message markup, user-level page
theming, and a link on the profile page to basic instructions for using the app.

### Assumptions

1. Date of birth is captured at registration (and may be edited on the profile page). Age is calculated from that calendar date whenever a group age limit is checked, so it updates as birthdays pass. Age is never stored.
2. Email is the account's unique identifier and cannot be changed after registration.
3. Users are displayed by their first and last name throughout the application, including in chat.
4. Deleting a group cascades to its rooms, memberships, pending requests and stored messages.
5. Only members of a group may propose new rooms for that group.
6. Group admins have no access to the audit log.
7. Notifications are in-application only. There is no email, push, or other external notification.
8. Reports and internal notifications are one-directional system messages.
9. A user's local message history is not synchronised across devices or restored after clearing browser storage.
10. The super admin cannot view the contents of any group or room.
12. On hard deletion of a user, a
    tombstone record retaining their email, name, ban date and reason is written to a
    separate collection, so the email can never be registered again and the super
    admin retains visibility of banned accounts. Audit log entries store a
    snapshot of the actor's name and email rather than a reference, so history survives.
13. Users and administrators can filter their request views by type.
14. Group colour themes are chosen from a fixed set of preset palettes.
15. When a deleted user was a group's only admin, the remaining member who
    comes first alphabetically (by last name, then first name) is automatically
    promoted to admin in their place.

### Permissions matrix

Group admin permissions apply only to the groups they administer.

| Action | Super Admin | Group Admin | User |
|---|---|---|---|
| Request group creation | — | Yes | Yes |
| Approve or reject group creation | Yes | — | — |
| Create a group directly | — | — | — |
| Edit group details | — | Yes | — |
| Request group deletion | — | Yes | — |
| Delete a group | Yes, on request | — | — |
| Request to join a group | — | Yes | Yes |
| Approve or reject join requests | — | Yes | — |
| Propose a new room | — | Yes | Yes, if a member |
| Create, edit or delete a room | — | Yes | — |
| Promote a member to group admin | — | Yes | — |
| Demote a group admin | — | Yes | — |
| View group members and banned users | — | Yes | — |
| Report a user | — | Yes | Yes |
| Ban a user from a group | — | Yes, on report | — |
| Request a system-wide ban | — | Yes | — |
| Delete a user from the system | Yes, on request | — | — |
| Delete own account | — | Yes | Yes |
| Send and delete own messages | — | Yes | Yes |
| View the audit log | Yes | — | — |

## 4. Data Structures

### Entity relationships

A user may belong to many groups, and a group has many users. Each user
holds one system-wide role. The group admin status is held per group rather than on the user record.

A **group** owns zero or many **rooms**. A room belongs to exactly one group.
Group membership grants access to every room in that group, so rooms carry no
membership of their own.

A **message** belongs to exactly one room and has exactly one author. A
**request** has one submitting user, one target entity, and optionally one
actioning administrator. An **audit entry** belongs to no entity. Snapshots are stored so it survives deletion of the records it
describes.


### Identifiers

Every entity carries a UUID `id` used for all internal references. Email is the
unique business identifier for a user: it is what they log in with, it cannot be
changed, and it is permanently blacklisted after a system ban. Collections store
IDs rather than embedded objects, so profile data exists in one place only.

### User

| Field | Type | Required | Description |
|---|---|---|---|
| id | string (UUID) | yes | Internal reference key |
| email | string | yes | Unique, immutable, used to log in |
| passwordHash | string | yes | bcrypt hash, never returned by the API |
| firstName | string | yes | Displayed throughout the application |
| lastName | string | yes | Displayed throughout the application |
| dateOfBirth | string (YYYY-MM-DD) | yes | Calendar date entered at registration; used to calculate age |
| age | number | yes (API only) | Calculated from dateOfBirth at response time. Not persisted. Checked against group age limits |
| role | string | yes | `SUPER_ADMIN` or `USER`. Group admin status is held on the group |
| profilePicture | string \| null | no | Filename of the uploaded image, or null for the default avatar |
| groups | string[] | yes | IDs of groups the user belongs to, denormalised for fast lookup |
| createdAt | ISO date string | yes | Registration timestamp |

```json
{
  "id": "u-8f14e45f",
  "email": "holly@example.com",
  "passwordHash": "$2b$10$N9qo8uLOickgx2ZMRZoMy...",
  "firstName": "Holly",
  "lastName": "Blunt",
  "dateOfBirth": "2005-09-20",
  "role": "USER",
  "profilePicture": "u-8f14e45f-avatar.png",
  "groups": ["g-c9f0f895", "g-45c48cce"],
  "createdAt": "2026-08-24T09:12:00.000Z"
}
```

The stored record holds `dateOfBirth`. API responses add a calculated `age` and
never return `passwordHash`.

The `groups` array duplicates information already held in each group's `members`
array. It is kept because the most frequent read in the application is "which
groups does the current user belong to", and holding it on the user avoids
scanning every group. 

### Group

| Field | Type | Required | Description |
|---|---|---|---|
| id | string (UUID) | yes | Internal reference key |
| title | string | yes | Display name |
| description | string | yes | Shown on the group browsing page |
| ageLimit | number | yes | Minimum calculated age required to join |
| theme | string | yes | Key of a preset colour palette, applied to the group and its rooms |
| members | string[] | yes | User IDs with access to the group |
| admins | string[] | yes | User IDs administering the group. Must always contain at least one |
| bannedUsers | string[] | yes | User IDs permanently barred from the group |
| createdBy | string (UUID) | yes | User who requested the group and became its first admin |
| createdAt | ISO date string | yes | Approval timestamp |

```json
{
  "id": "g-c9f0f895",
  "title": "Film Discussion",
  "description": "General chat about film and television.",
  "ageLimit": 15,
  "theme": "slate",
  "members": ["u-8f14e45f", "u-6512bd43", "u-c20ad4d7"],
  "admins": ["u-8f14e45f"],
  "bannedUsers": ["u-c51ce410"],
  "createdBy": "u-8f14e45f",
  "createdAt": "2026-08-20T14:02:00.000Z"
}
```

Membership is held as three ID arrays for fast lookups and changes (`members`, `admins`, and `bannedUsers`). The only per-user state a group carries is whether they are an admin
and whether they are banned, and both are expressed directly by which array the
ID sits in. Admins are also listed in `members`.

### Room

| Field | Type | Required | Description |
|---|---|---|---|
| id | string (UUID) | yes | Internal reference key, also used as the socket room name in Phase 2 |
| groupId | string (UUID) | yes | Owning group |
| name | string | yes | Display name, editable by a group admin |
| description | string | no | Optional short summary |
| createdAt | ISO date string | yes | Creation timestamp |

```json
{
  "id": "r-70efdf2e",
  "groupId": "g-c9f0f895",
  "name": "new-releases",
  "description": "Films currently in cinemas.",
  "createdAt": "2026-08-21T08:30:00.000Z"
}
```

Rooms are stored separately from groups rather than embedded within them. They are addressed
directly by REST routes and joined directly by socket ID in Phase 2, so they need
to be retrievable without loading the parent group.

### Message

| Field | Type | Required | Description |
|---|---|---|---|
| id | string (UUID) | yes | Referenced by the delete broadcast |
| roomId | string (UUID) | yes | Room the message belongs to |
| authorId | string (UUID) | yes | Sending user |
| authorName | string | yes | Sender's first and last name, snapshotted at send time |
| authorPicture | string \| null | no | Sender's profile picture filename at send time |
| type | string | yes | `TEXT` or `IMAGE` |
| content | string | yes | Message body, or the stored filename for an image |
| timestamp | ISO date string | yes | Send time, displayed on every message |

```json
{
  "id": "m-1f0e3dad",
  "roomId": "r-70efdf2e",
  "authorId": "u-8f14e45f",
  "authorName": "Holly Bennett",
  "authorPicture": "u-8f14e45f-avatar.png",
  "type": "TEXT",
  "content": "Has anyone seen the new one yet?",
  "timestamp": "2026-08-24T10:15:33.000Z"
}
```

Author name and picture are snapshotted onto the message so that historical
messages held in a client's local storage still render correctly without a lookup
against a user who may since have been deleted.

### Request

| Field | Type | Required | Description |
|---|---|---|---|
| id | string (UUID) | yes | Internal reference key |
| type | string | yes | `GROUP_CREATE`, `GROUP_JOIN`, `GROUP_DELETE`, `ROOM_CREATE`, `USER_REPORT`, `SYSTEM_BAN` |
| status | string | yes | `PENDING`, `APPROVED`, `REJECTED` |
| submittedBy | string (UUID) | yes | User who raised the request |
| targetId | string (UUID) \| null | no | Group, room or user the request concerns |
| payload | object | no | Type-specific fields, see below |
| reason | string \| null | no | Supplied by the requester for reports, or by the administrator on rejection |
| actionedBy | string (UUID) \| null | no | Administrator who approved or rejected |
| createdAt | ISO date string | yes | Submission timestamp |
| actionedAt | ISO date string \| null | no | Decision timestamp |

All request and report types share one collection, distinguished by `type`. A
user's view of their own pending and rejected requests is then a single query,
and a group admin's moderation queue is one filtered read rather than several
merged client side. Type-specific fields live in `payload`:

| Type | Payload contents |
|---|---|
| `GROUP_CREATE` | `title`, `description`, `ageLimit`, `theme` |
| `ROOM_CREATE` | `name`, `description`, `groupId` |
| `GROUP_JOIN` | none |
| `GROUP_DELETE` | none |
| `USER_REPORT` | `groupId` |
| `SYSTEM_BAN` | none |

```json
{
  "id": "q-98f13708",
  "type": "GROUP_CREATE",
  "status": "PENDING",
  "submittedBy": "u-6512bd43",
  "targetId": null,
  "payload": {
    "title": "Board Games",
    "description": "Tabletop gaming chat.",
    "ageLimit": 12,
    "theme": "moss"
  },
  "reason": null,
  "actionedBy": null,
  "createdAt": "2026-08-23T19:44:00.000Z",
  "actionedAt": null
}
```

### Banned account tombstone

| Field | Type | Required | Description |
|---|---|---|---|
| id | string (UUID) | yes | Internal reference key |
| email | string | yes | Blacklisted at registration, can never be reused |
| firstName | string | yes | Snapshot taken before deletion |
| lastName | string | yes | Snapshot taken before deletion |
| bannedAt | ISO date string | yes | Deletion timestamp |
| reason | string | yes | Reason given in the originating ban request |
| requestedBy | string | yes | Name and email of the group admin who raised the request |

```json
{
  "id": "b-3c59dc04",
  "email": "banned@example.com",
  "firstName": "Sam",
  "lastName": "Doyle",
  "bannedAt": "2026-08-22T11:05:00.000Z",
  "reason": "Repeated harassment across multiple groups.",
  "requestedBy": "Holly Bennett (holly@example.com)"
}
```

A system ban removes the user record entirely. The tombstone preserves the two
things the specification requires to survive that deletion: the email must never
be registered again, and the super admin must retain visibility of banned
accounts. Deletion cascades, stripping the user's ID from every group's
`members`, `admins` and `bannedUsers` arrays and clearing their pending requests.

### Audit entry

| Field | Type | Required | Description |
|---|---|---|---|
| id | string (UUID) | yes | Internal reference key |
| type | string | yes | Action performed, used as the filter key |
| actorName | string | yes | Name of the administrator, snapshotted |
| actorEmail | string | yes | Email of the administrator, snapshotted |
| targetLabel | string | yes | Human-readable description of what was acted on, snapshotted |
| detail | string | no | Free-text detail, such as a rejection reason |
| timestamp | ISO date string | yes | Ordering key for the log view |

```json
{
  "id": "a-b6d767d2",
  "type": "GROUP_DELETED",
  "actorName": "System Administrator",
  "actorEmail": "admin@example.com",
  "targetLabel": "Group: Board Games",
  "detail": "Deletion requested by Holly Blunt.",
  "timestamp": "2026-08-23T21:10:00.000Z"
}
```

Audit entries store snapshots rather than IDs. If they held references, deleting
a user would blank out their history in the log.

### Server-side persistence

Phase 2 persists to MongoDB collections (`users`, `groups`, `rooms`,
`requests`, `bannedAccounts`, `auditLog`, `messages`) using the native driver
(not mongoose). Each collection is loaded into memory once at server start and
written back in full after any mutation, so the database always matches the
running state. `server/seed/*.json` is sample data for `npm run seed` only.

Uploaded profile pictures are written to `server/uploads/` and only the filename
is stored on the user record.

### Client-side storage

On successful login the client writes a single `currentUser` key to browser local
storage, holding the authenticated user without the password hash.

This key is read on application start to restore the session and to drive route
guards and conditional UI, and is removed on logout.

In Phase 2 the client additionally stores its own message history, keyed by room:

```
messages:<roomId> → { <messageId>: Message, ... }
```

### Runtime structures

Three structures exist only in memory and are deliberately not persisted.

**Server message buffer.** The server holds the last five messages per room as a
fixed-capacity FIFO queue: pushing a sixth message shifts the oldest off. This is
the only server-side message state, and it exists solely to give a joining user
context.

**Socket presence.** Who is currently in each room is held as a map of room ID to
a set of user IDs, giving constant-time join, leave and membership checks.

**Client message history.** Messages are stored keyed by room ID and then by
message ID, rather than as one flat list. Opening a room reads only that room's
entry instead of scanning everything the client has ever received, and the delete
broadcast, which identifies a message by ID, becomes a direct key removal rather
than a linear search.

Elsewhere, membership lists, requests and audit entries are read from the
database and iterated as plain arrays. At the scale this application operates at,
the cost is dominated by the database query rather than the in-memory traversal,
and introducing specialised structures would add complexity without measurable
benefit.

## 5. Angular Architecture

### Approach

Standalone components, bootstrapped from `main.ts`. One shell hosts the nav and
router outlet; items appear or hide from the signed-in role, and from group-admin
status on a group page.

### State management

**Signals** hold current UI state (session, lists, presence). The session
signal lives in `AuthService`; each page owns the signals behind its own view.
**Observables** are only for HTTP, and for socket events in Phase 2.


### Libraries

| Library | Purpose | Rationale |
|---|---|---|
| Tailwind CSS | Utility-first styling and responsive breakpoints | Styling stays beside the markup it applies to, and responsive behaviour is expressed with breakpoint prefixes |
| spartan/ui | Accessible UI primitives | Supplies keyboard handling, focus management and ARIA behaviour for dialogs, dropdowns and form controls|


### Folder structure

```
client/src/app/
├── core/
│   ├── guards/          route guards
│   ├── interceptors/    attaches the X-User-Id header
│   ├── models/          TypeScript interfaces
│   └── services/        API and state services
├── shared/              reusable presentational components
├── features/
│   ├── auth/            bootstrap, login, register
│   ├── profile/
│   ├── groups/
│   ├── rooms/
│   ├── requests/
│   └── admin/           super admin screens
├── app.ts               root shell component
├── app.routes.ts
└── app.config.ts        providers
```

`core` holds things instantiated once for the lifetime of the application,
`shared` holds components reused across features, and
`features` holds one folder per area of the application, matching the route
structure.

---

### Components

#### Shell and shared

| Component | Role |
|---|---|
| `App` | Root shell. Hosts the navigation bar, the router outlet and the notification host |
| `NavBar` | Primary navigation. Shows or hides destinations based on the signed-in user's role |
| `NotificationHost` | Renders transient in-application notifications raised by any service |
| `NotFoundPage` | Catch-all view for unknown routes |
| `BrandMark` | Application logo, sized for the nav bar or the auth screens |
| `CountBadge` | Small count displayed beside section headings |

#### Authentication

| Component | Role |
|---|---|
| `BootstrapPage` | First-run onboarding. Collects the super admin's details when the system contains no users |
| `LoginPage` | Email and password sign-in |
| `RegisterPage` | Self-registration, including client-side password rule validation |

#### Profile

| Component | Role |
|---|---|
| `ProfilePage` | Displays and edits the signed-in user's own details, including date of birth, and lets them delete their own account |
| `ProfilePictureUpload` | Selects, validates and uploads a profile image |
| `ChangePasswordForm` | Current password plus new password entered twice |

#### Groups

| Component | Role |
|---|---|
| `GroupBrowsePage` | Lists every group in the system with its description and age limit, and allows a user to request to join |
| `GroupDetailPage` | A single group's landing view. Shows its rooms and members, and hosts the admin controls when the viewer administers it |
| `RoomList` | Rooms belonging to the group, with create, edit and delete controls for admins |
| `GroupMemberList` | The group's full membership, sorted alphabetically |
| `GroupSettingsForm` | Admin editing of title, description, age limit and theme |
| `GroupBanList` | Users banned from the group, visible to group admins |
| `RoomEditForm` | Admin editing of an existing room's name and description |
| `ConsequenceDialog` | Names the members who will be removed before an admin commits an age limit raise |

#### Rooms and chat

| Component | Role |
|---|---|
| `RoomPage` | Chat view for a single room. Coordinates the message list, composer and presence panel |
| `MessageList` | Renders messages in order with avatar, name and timestamp, and offers deletion on the viewer's own messages |
| `MessageItem` | A single message. Distinguishes text from image content and marks group admins |
| `MessageComposer` | Text entry and image attachment, enforcing the 2MB and file type limits |
| `RoomPresenceList` | Users currently in the room, sorted alphabetically |
| `SystemNotice` | In-room notice shown when a user enters or leaves |

#### Requests

| Component | Role |
|---|---|
| `MyRequestsPage` | The signed-in user's own submissions and their outcomes, filterable by type |
| `RequestQueue` | Administrator's pending queue, filterable by type. Reused by both group admins and the super admin |
| `RequestItem` | A single request with its payload and the approve and reject actions |
| `GroupRequestForm` | Captures title, description, age limit and theme for a group creation request |
| `RoomRequestForm` | Captures name and description for a room creation request |
| `ReportUserForm` | Reports a user to the administrators of a shared group |
| `ConfirmDialog` | Generic confirmation prompt for destructive actions |
| `ReasonDialog` | Captures the mandatory reason when an administrator rejects a request |

#### Super admin

| Component | Role |
|---|---|
| `AdminUsersPage` | Full user listing, with deletion on an approved ban request |
| `BannedAccountsPage` | Tombstone records of permanently banned accounts |
| `AuditLogPage` | Administrative action history, filterable by type and date |

The super admin has no chat or group views. Their navigation contains only the
request queue, the user list, banned accounts and the audit log.

---

### Services

| Service | Responsibility |
|---|---|
| `AuthService` | Bootstrap check, registration, login and logout. Owns the `currentUser` signal and reads and writes the local storage key |
| `UserService` | Profile reads and updates, password changes, the administrative user list and user deletion |
| `GroupService` | Group reads and updates, membership changes, admin promotion and demotion, and group bans |
| `RoomService` | Room reads, updates and deletion within a group |
| `RequestService` | Creating requests and reports, listing them scoped to the caller, and the approve and reject actions |
| `AuditService` | Retrieves audit entries with type and date filters |
| `NotificationService` | Raises transient in-application notifications, consumed by `NotificationHost` |
| `SocketService` | Phase 2. Wraps the socket connection, exposing incoming events as observables and providing typed emit methods |

`AuthService` is the only service that touches local storage. Every other
service that needs the signed-in user reads `AuthService.currentUser()`, so
there is one definition of who is signed in.

### Interceptor

| Interceptor | Purpose |
|---|---|
| `userIdInterceptor` | Attaches the signed-in user's ID to every outgoing request as an `X-User-Id` header |

A functional HTTP interceptor is used so no service constructs headers itself.
When Phase 2 replaces the header with a token, this file is the only one that
changes.

---

### Models

All models are TypeScript **interfaces**. Interfaces exist only at compile time
and describe the shape of JSON returned by the API.

| Interface | Description |
|---|---|
| `User` | Account record with `dateOfBirth`. The client-side type omits `passwordHash` and includes calculated `age`, which the API never stores |
| `Group` | Title, description, age limit, theme, and the member, admin and banned ID arrays |
| `Room` | Room within a group |
| `Message` | Chat message with its snapshotted author name and picture |
| `AppRequest` | A request or report of any type, with its status and type-specific payload |
| `BannedAccount` | Tombstone record for a permanently banned account |
| `AuditEntry` | A single logged administrative action |
| `SessionUser` | The reduced user object written to local storage |

Supporting union types keep the string fields constrained rather than accepting
any string:

| Type | Values |
|---|---|
| `Role` | `SUPER_ADMIN`, `USER` |
| `RequestType` | `GROUP_CREATE`, `GROUP_DELETE`, `GROUP_JOIN`, `ROOM_CREATE`, `USER_REPORT`, `SYSTEM_BAN` |
| `RequestStatus` | `PENDING`, `APPROVED`, `REJECTED` |
| `MessageType` | `TEXT`, `IMAGE` |
| `GroupTheme` | The keys of the preset colour palettes |

---

### Routes

| Path | Component | Guards | Loading |
|---|---|---|---|
| `/bootstrap` | `BootstrapPage` | `bootstrapGuard` | Lazy |
| `/login` | `LoginPage` | `guestGuard` | Lazy |
| `/register` | `RegisterPage` | `guestGuard` | Lazy |
| `/groups` | `GroupBrowsePage` | `authGuard` | Lazy |
| `/groups/:groupId` | `GroupDetailPage` | `authGuard`, `groupMemberGuard` | Lazy |
| `/groups/:groupId/rooms/:roomId` | `RoomPage` | `authGuard`, `groupMemberGuard` | Lazy |
| `/profile` | `ProfilePage` | `authGuard` | Lazy |
| `/requests` | `MyRequestsPage` | `authGuard` | Lazy |
| `/admin/requests` | `RequestQueue` | `authGuard`, `roleGuard('SUPER_ADMIN')` | Lazy |
| `/admin/users` | `AdminUsersPage` | `authGuard`, `roleGuard('SUPER_ADMIN')` | Lazy |
| `/admin/banned` | `BannedAccountsPage` | `authGuard`, `roleGuard('SUPER_ADMIN')` | Lazy |
| `/admin/audit` | `AuditLogPage` | `authGuard`, `roleGuard('SUPER_ADMIN')` | Lazy |
| `**` | `NotFoundPage` | — | Lazy |

Routes are lazily loaded with `loadComponent`, so a component's code is fetched
only when its route is first visited.

The default route redirects to `/groups` when signed in and `/login` otherwise.

### Guards

| Guard | Behaviour |
|---|---|
| `bootstrapGuard` | Permits `/bootstrap` only while the system reports that no users exist, and redirects away once onboarding is complete |
| `guestGuard` | Redirects an already signed-in user away from the login and registration pages |
| `authGuard` | Requires a signed-in user, redirecting to `/login` otherwise |
| `roleGuard(role)` | Requires the signed-in user to hold the given system role |
| `groupMemberGuard` | Requires membership of the group named in the route parameter, covering the room routes beneath it |

Guards control navigation only. Every permission they enforce is also checked on
the server since they only prevent a user reaching a screen they cannot use, but they do not prevent
anyone calling the API directly.

## 6. Server-side Endpoints

All routes are prefixed `/api`. Requests and responses are JSON. 

### Conventions

**Caller.** Phase 1 sends `X-User-Id` after login. Middleware attaches the user;
handlers check role and membership. The header is forgeable — it exists so
permission lives on the server, and so Phase 2 can swap it for a token.

**Errors.** `{ "error": "<message>" }` with:

| Status | Meaning |
|---|---|
| 400 | Validation failed |
| 401 | No caller, or bad credentials |
| 403 | Caller not permitted |
| 404 | Not found |
| 409 | Conflict (e.g. email taken or blacklisted) |

**Approve / reject.** Named action routes, not a status PATCH. Approval has
side effects (create the group, appoint the first admin, write audit).

**Password hashes** are never returned by any endpoint.

---

### Bootstrap

| Method | Route | Body / Params | Returns | Permitted |
|---|---|---|---|---|
| GET | `/api/bootstrap` | — | `{ required: boolean }` | Anyone |
| POST | `/api/bootstrap` | `{ firstName, lastName, dateOfBirth, email, password }` | `201` `{ user }` | Anyone, only while no users exist |

`GET` is whether onboarding is needed. `POST` creates the super admin; later
calls return `409`.

### Authentication

| Method | Route | Body / Params | Returns | Permitted |
|---|---|---|---|---|
| POST | `/api/auth/register` | `{ firstName, lastName, dateOfBirth, email, password }` | `201` `{ user }` | Anyone |
| POST | `/api/auth/login` | `{ email, password }` | `{ user }` | Anyone |

Register: `409` if the email is taken or banned, `400` if the password is weak.
Login returns the session user.

### Users

| Method | Route | Body / Params | Returns | Permitted |
|---|---|---|---|---|
| GET | `/api/users/me` | — | `{ user }` | Authenticated caller |
| PATCH | `/api/users/me` | Any of `{ firstName, lastName, dateOfBirth }` | `{ user }` | Authenticated caller |
| PATCH | `/api/users/me/password` | `{ currentPassword, newPassword }` | `204` | Authenticated caller |
| POST | `/api/users/me/picture` | `multipart/form-data`, image field | `{ profilePicture }` | Authenticated caller |
| DELETE | `/api/users/me/picture` | — | `{ profilePicture: null }` | Authenticated caller |
| GET | `/api/users` | Optional `?groupId=` | `{ users: [...] }` | Super admin, or group admin for their own group |
| DELETE | `/api/users/me` | — | `204` | Authenticated caller, not the super admin |
| DELETE | `/api/users/:id` | `{ requestId }` | `204` | Super admin |

`PATCH` rejects email and rejects `age` (age is calculated from date of birth).
Picture upload accepts PNG, JPEG or GIF up to 2MB and stores only the filename.
`DELETE /me/picture` clears it. `DELETE /me` removes the caller's account
without blacklisting the email. `DELETE /:id` needs an approved `SYSTEM_BAN`;
writes the tombstone and strips the user from every group. An empty group is
deleted; a sole admin with remaining members is succeeded.

### Banned accounts

| Method | Route | Body / Params | Returns | Permitted |
|---|---|---|---|---|
| GET | `/api/banned-accounts` | — | `{ bannedAccounts: [...] }` | Super admin |

### Groups

| Method | Route | Body / Params | Returns | Permitted |
|---|---|---|---|---|
| GET | `/api/groups` | — | `{ groups: [...] }` | Any authenticated user |
| GET | `/api/groups/:id` | — | `{ group }` | Members and admins of the group, or super admin |
| PATCH | `/api/groups/:id` | Any of `{ title, description, ageLimit, theme }` | `{ group, removedMembers }` | Group admin |
| DELETE | `/api/groups/:id` | `{ requestId }` | `204` | Super admin |

List is public fields (title, description, age limit, member count) so anyone
can browse and request to join. No `POST` — created by approving `GROUP_CREATE`.
Raising `ageLimit` returns who was removed. `DELETE` needs an approved
`GROUP_DELETE` and cascades rooms, messages and outstanding requests.

### Group membership

| Method | Route | Body / Params | Returns | Permitted |
|---|---|---|---|---|
| GET | `/api/groups/:id/members` | — | `{ members: [...] }` | Group admin |
| DELETE | `/api/groups/:id/members/:userId` | — | `204` | Group admin, or the user themselves to leave |
| POST | `/api/groups/:id/admins/:userId` | — | `204` | Group admin |
| DELETE | `/api/groups/:id/admins/:userId` | — | `204` | Group admin, including on themselves |
| GET | `/api/groups/:id/bans` | — | `{ bannedUsers: [...] }` | Group admin |
| POST | `/api/groups/:id/bans/:userId` | `{ requestId }` | `204` | Group admin |

No `POST` on members — join is `GROUP_JOIN`. Promote only existing members.
Leave or demote returns `409` if it would leave no admin. Ban needs a
`USER_REPORT` the acting admin did not submit.

### Rooms

| Method | Route | Body / Params | Returns | Permitted |
|---|---|---|---|---|
| GET | `/api/groups/:groupId/rooms` | — | `{ rooms: [...] }` | Members and admins of the group |
| POST | `/api/groups/:groupId/rooms` | `{ name, description }` | `201` `{ room }` | Group admin |
| GET | `/api/rooms/:id` | — | `{ room }` | Members and admins of the owning group |
| PATCH | `/api/rooms/:id` | Any of `{ name, description }` | `{ room }` | Group admin |
| DELETE | `/api/rooms/:id` | — | `204` | Group admin |

Listed and created under the group; addressed by ID after that. Admins create
directly. Members propose `ROOM_CREATE`.

### Requests and reports

| Method | Route | Body / Params | Returns | Permitted |
|---|---|---|---|---|
| GET | `/api/requests` | Optional `?type=` and `?status=` | `{ requests: [...] }` | Scoped to the caller, see below |
| GET | `/api/requests/:id` | — | `{ request }` | Submitter or the actioning administrator |
| POST | `/api/requests` | `{ type, targetId?, payload?, reason? }` | `201` `{ request }` | Varies by type |
| POST | `/api/requests/:id/approve` | — | `{ request, created? }` | Super admin or group admin, by type |
| POST | `/api/requests/:id/reject` | `{ reason }` | `{ request }` | Super admin or group admin, by type |

One collection, distinguished by `type`. List is scoped: own submissions; group
admins also see pending for their groups; super admin sees `GROUP_CREATE`,
`GROUP_DELETE` and `SYSTEM_BAN`.

Create: `400` missing fields, `403` not allowed to raise that type, `409`
duplicate pending. No withdraw. Reject needs a reason. Cannot action your own
request, or one already decided.

| Type | Approved by | Effect of approval |
|---|---|---|
| `GROUP_CREATE` | Super admin | Creates the group; submitter is first admin |
| `GROUP_DELETE` | Super admin | Permits the group to be deleted |
| `GROUP_JOIN` | Group admin | Adds the submitter to the group |
| `ROOM_CREATE` | Group admin | Creates the room |
| `USER_REPORT` | Group admin | Permits a group ban |
| `SYSTEM_BAN` | Super admin | Permits system deletion |

`GROUP_JOIN` auto-rejects at create if the submitter is under the age limit.

### Audit log

| Method | Route | Body / Params | Returns | Permitted |
|---|---|---|---|---|
| GET | `/api/audit` | Optional `?type=`, `?from=`, `?to=` | `{ entries: [...] }` | Super admin |

Date order, optional type and date filters. No write endpoint — entries are a
side effect of the actions they record.

### Messages

Phase 2.

| Method | Route | Body / Params | Returns | Permitted |
|---|---|---|---|---|
| GET | `/api/rooms/:id/messages` | — | `{ messages: [...] }` | Members of the owning group |
| POST | `/api/rooms/:id/images` | `multipart/form-data`, image field | `201` `{ filename }` | Members of the owning group |

`GET` returns at most the five messages the server keeps; the rest arrive over
sockets. Images go over HTTP because of the 2MB payload; the filename is then
sent as an `IMAGE` socket message.

### Socket events

Phase 2. socket.io, not REST.

| Direction | Event | Payload | Purpose |
|---|---|---|---|
| Client to server | `room:join` | `{ roomId }` | Subscribe to a room and register presence |
| Client to server | `room:leave` | `{ roomId }` | Unsubscribe and deregister presence |
| Client to server | `message:send` | `{ roomId, type, content }` | Send a text or image message |
| Client to server | `message:delete` | `{ roomId, messageId }` | Delete the caller's own message |
| Server to client | `message:new` | `{ message }` | Broadcast a new message to the room |
| Server to client | `message:deleted` | `{ messageId }` | Instruct clients to remove the message from local history |
| Server to client | `presence:update` | `{ roomId, users: [...] }` | Current occupants of the room, alphabetically ordered |
| Server to client | `presence:joined` | `{ roomId, userName }` | A user entered the room |
| Server to client | `presence:left` | `{ roomId, userName }` | A user left the room |

### Example exchanges

Login:

```http
POST /api/auth/login
Content-Type: application/json

{ "email": "holly@example.com", "password": "Passw0rd1" }
```

```json
{
  "user": {
    "id": "u-8f14e45f",
    "email": "holly@example.com",
    "firstName": "Holly",
    "lastName": "Bennett",
    "role": "USER",
    "profilePicture": "u-8f14e45f-avatar.png",
    "groups": ["g-c9f0f895"]
  }
}
```

Requesting a group:

```http
POST /api/requests
X-User-Id: u-6512bd43
Content-Type: application/json

{
  "type": "GROUP_CREATE",
  "payload": {
    "title": "Board Games",
    "description": "Tabletop gaming chat.",
    "ageLimit": 12,
    "theme": "moss"
  }
}
```

```json
{
  "request": {
    "id": "q-98f13708",
    "type": "GROUP_CREATE",
    "status": "PENDING",
    "submittedBy": "u-6512bd43",
    "createdAt": "2026-08-23T19:44:00.000Z"
  }
}
```

Rejecting it:

```http
POST /api/requests/q-98f13708/reject
X-User-Id: u-0000admin
Content-Type: application/json

{ "reason": "A group with this purpose already exists." }
```

```json
{
  "request": {
    "id": "q-98f13708",
    "status": "REJECTED",
    "reason": "A group with this purpose already exists.",
    "actionedBy": "u-0000admin",
    "actionedAt": "2026-08-23T20:02:00.000Z"
  }
}
```

## 7. Design Documents

### Design principles

**One shell, role-aware navigation.** Every signed-in view uses the same shell.
Role changes which destinations appear, not where anything sits.

**Semantic colour tokens.** Colour is expressed through spartan/ui's tokens
(`background`, `foreground`, `primary`, `muted`, `border`, `ring`). Group themes
are preset palettes that redefine those tokens, so a theme change propagates
without any component knowing about themes. Presets rather than free colour
selection guarantee contrast.

**Administrative controls sit in context.** A group admin edits a group from the
group's own page, not a separate administration area.

**Accessibility.** spartan/ui supplies keyboard navigation, focus management and
ARIA attributes. Colour is never the only carrier of meaning: admin status,
message ownership and request state each have a text or icon indicator.

**Restricted scale.** Four type sizes, a subset of Tailwind's spacing scale, and
one corner radius set in the theme configuration. Repeated values produce
consistency without a judgement call on every element.

### Responsive strategy

The application targets desktops and tablets. 

Tablet is Tailwind `md` (768px): two regions, supporting panels become toggles.
Desktop is `lg` (1024px): three regions, all panels visible. Below 768px the
layout stays at the tablet arrangement.

| Region | Desktop | Tablet |
|---|---|---|
| Navigation | Persistent sidebar | Collapsed to header menu |
| Room view | Room list, messages, presence panel | Messages fill width; list and presence become overlays |
| Group detail | Rooms and members side by side | Stacked, rooms first |
| Request queue | Table with inline actions | Cards with actions beneath |

The principle throughout: **supporting content collapses, primary content keeps
its space.** Layout uses Tailwind breakpoint prefixes on the elements being
changed, so no custom media queries are needed.

### Storyboard flow

Design documents were produced before implementation began and live in
[`docs/storyboards/`](docs/storyboards).
The map sequences every frame; numbers match the filenames. ***See docs/storyboards/fabulari_storyboard_flow.svg***

Who submits, who actions, and what approval creates:
***See docs/storyboards/fabulari_request_lifecycle.svg***

*Frames
05 and 06 are the same route. A member who administers the group sees the admin
controls appear in place, which is the single-shell principle in practice. No
path leads from the super admin branch into a group or room.

### Frames

| # | Frame | Shows |
|---|---|---|
| 01 | [Login](docs/storyboards/wf-01-login.png) | Email and password only. No username, no recovery. |
| 02 | [Register](docs/storyboards/wf-02-register.png) | Self-registration with date of birth (age is calculated) and password rules stated up front. |
| 03 | [Bootstrap](docs/storyboards/wf-03-bootstrap.png) | First-run onboarding, reachable only while no users exist. |
| 04 | [Group browse](docs/storyboards/wf-04-group-browse.png) | Four join states: member, joinable, requested, blocked by age limit. |
| 05 | [Group detail, member](docs/storyboards/wf-05-group-detail-member.png) | Rooms and full membership. Group membership grants access to every room. |
| 06 | [Group detail, admin](docs/storyboards/wf-06-group-detail-admin.png) | Same route as 05 with admin controls. Editing is direct; deletion is a request. |
| 07 | [Room, desktop](docs/storyboards/wf-07-room-desktop.png) | Three regions: room list, message stream, in-room presence. |
| 08 | [Room, tablet](docs/storyboards/wf-08-room-tablet.png) | The same screen at 768px. |
| 09 | [My requests](docs/storyboards/wf-09-my-requests.png) | All request types in one filterable view, with rejection reasons in place. |
| 10 | [Request queue](docs/storyboards/wf-10-request-queue.png) | Join, room and report requests for the groups an admin runs. |
| 11 | [Profile](docs/storyboards/wf-11-profile.png) | Editable details including date of birth, read-only email, password change, picture upload, and account self-deletion. |
| 12 | [Super admin requests](docs/storyboards/wf-12-admin-requests.png) | Group creation, deletion and system bans. Same component as 10. |
| 13 | [User administration](docs/storyboards/wf-13-admin-users.png) | Every account. Deleting a sole group admin automatically appoints a successor. |
| 14 | [Banned accounts](docs/storyboards/wf-14-banned-accounts.png) | Tombstone records retaining the email so it cannot be reused. |
| 15 | [Audit log](docs/storyboards/wf-15-audit-log.png) | Administrative actions, filterable by type and date. |
| 16 | [Dialogs](docs/storyboards/wf-16-dialogs.png) | Four shapes sharing one shell: form, reason, confirm, consequence. |

Each frame carries numbered callouts tying an interface element back to the
requirement that produced it. 

Frames 07 and 08 are the responsive pair: three regions at desktop, one at
tablet, with the room list and presence panel becoming toggles while the message
stream keeps its width.

***See docs/storyboards/wf-07-room-desktop.png and wf-08-room-tablet.png***
