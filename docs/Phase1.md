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