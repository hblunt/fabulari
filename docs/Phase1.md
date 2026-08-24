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

## 3. Specifications & Assumptions

Requirements below cover the full application. Section 8 lists what is actually
built for Phase 1.

### System initialisation

| Requirement | Details |
|---|---|
| Bootstrap process | On startup, if no users exist in the system, an onboarding process runs to create the super admin. First name, last name, age, email, and password will be requested. This process is one-time only and disabled once the singular super admin exists.

### Accounts and authentication

| Requirement | Details |
|---|---|
| Self-registration | Users create their own accounts. Administrators cannot create accounts on a user's behalf. |
| Registration fields | First name, last name, age, email, password. Age is self-reported. |
| Unique user identifier | Uses the email address. It is immutable and cannot be reused after a system-wide ban. Email is not editable after account creation.|
| Password rules | Minimum 8 characters, at least one uppercase letter, alphanumeric. Stored hashed with bcrypt. |
| Login | Email and password. |
| Change password | Requires the current password plus the new password entered twice. |
| No account recovery | There is no forgot-password flow. A user who loses their password must register a new account. |
| Session persistence | The logged-in user is held in browser local storage and removed on logout. |
| Profile page | Users view and edit all of their own details except email, and upload or replace a profile picture. This page is private|
| New accounts | A new account has no group access until it is accepted into a group. |

### Groups

| Requirement | Details |
|---|---|
| Group attributes | Title, description, minimum age limit, colour theme. |
| Group creation | A user submits a creation request containing all group details. Only the super admin can action it. |
| Approval outcome | On approval the group is created and the requesting user becomes its first group admin. |
| Rejection | The super admin may reject a request. A rejection must include a reason. |
| Editing | A group admin may change the title, description, age limit and colour theme of their group at any time, without a request. |
| Age limit changes | Raising the age limit immediately removes any existing members who fall below the new limit. |
| Group browsing | All users can see a list of every group in the system, at any time, and request to join. |
| Join requests | Join requests are sent to the group's admins for approval or rejection. A rejection must include a reason. |
| Age gate | A join request from a user below the group's age limit is rejected automatically by the system. |
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
| Admin protection | A user who is a group admin cannot be deleted until a replacement admin has been assigned to each of their groups. |
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

Not required, implemented only if time permits: message markup, user-level page
theming, and a link on the profile page to basic instructions for using the app.

### Assumptions

1. Age is captured as a self-reported number at registration rather than a date of birth, so it does not update over time.
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

```
User ── < membership > ── Group ── < Room ── < Message
                          │                  │
                          └── theme          └── author (User)

Request ── submittedBy (User) ── target (Group | Room | User)
AuditEntry ── (snapshots only, no references)
```

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
| age | number | yes | Self-reported at registration, checked against group age limits |
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
  "age": 21,
  "role": "USER",
  "profilePicture": "u-8f14e45f-avatar.png",
  "groups": ["g-c9f0f895", "g-45c48cce"],
  "createdAt": "2026-08-24T09:12:00.000Z"
}
```

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
| ageLimit | number | yes | Minimum self-reported age required to join |
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

Membership is held as three ID arrays for fast lookups and changes. The only per-user state a group carries is whether they are an admin
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
  "detail": "Deletion requested by Holly Bennett.",
  "timestamp": "2026-08-23T21:10:00.000Z"
}
```

Audit entries store snapshots rather than IDs. If they held references, deleting
a user would blank out their history in the very log the super admin is meant to
review.

### Server-side persistence

Phase 1 persists to JSON files in `server/data/`, one file per entity, each
holding a top-level array of records:

```
server/data/
├── users.json
├── groups.json
├── rooms.json
├── requests.json
├── bannedAccounts.json
└── auditLog.json
```

Each file is read into memory once at server start and written back in full
after any mutation, so the on-disk state always matches the running state.

Uploaded profile pictures are written to `server/uploads/` and only the filename
is stored on the user record.

### Client-side storage

On successful login the client writes a single `currentUser` key to browser local
storage, holding the authenticated user without the password hash:

```json
{
  "id": "u-8f14e45f",
  "email": "holly@example.com",
  "firstName": "Holly",
  "lastName": "Blunt",
  "role": "USER",
  "profilePicture": "u-8f14e45f-avatar.png",
  "groups": ["g-c9f0f895", "g-45c48cce"]
}
```

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
a set of user IDs, giving constant-time join, leave and membership checks. It is
not persisted because presence is meaningless across a server restart since every socket connection is severed anyway.

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