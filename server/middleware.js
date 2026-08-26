// server/middleware.js
// Caller identification and permission checks (Phase1.md §6 "Conventions").
//
// Phase 1 has no tokens: the client sends the signed-in user's ID in an
// X-User-Id header, and identifyUser resolves it to the user record. This
// identifies the caller — it does not secure the endpoint — but it means every
// permission rule lives on the server, and Phase 2 can swap the header for a
// signed token by changing only this file.

const { db } = require("./storage");
const { fail } = require("./errors");

// Runs on every request. Attaches req.user when the header names a real user;
// leaves it undefined otherwise so public routes (login, register) still work.
function identifyUser(req, res, next) {
  const userId = req.header("X-User-Id");
  if (userId) {
    req.user = db.users.find((u) => u.id === userId);
  }
  next();
}

// 401 when no caller was identified. Guards the "any signed-in user" routes.
function requireAuth(req, res, next) {
  if (!req.user) return fail(res, 401, "Not signed in.");
  next();
}

// 403 unless the caller holds the SUPER_ADMIN system role.
function requireSuperAdmin(req, res, next) {
  if (!req.user) return fail(res, 401, "Not signed in.");
  if (req.user.role !== "SUPER_ADMIN") {
    return fail(res, 403, "Super admin only.");
  }
  next();
}

// Group-scoped checks are factories: the route says which URL parameter holds
// the group ID (e.g. requireGroupAdmin("id") for /api/groups/:id), and the
// returned middleware looks the group up and checks the caller against it.

function findGroup(req, res, paramName) {
  const group = db.groups.find((g) => g.id === req.params[paramName]);
  if (!group) {
    fail(res, 404, "Group not found.");
    return null;
  }
  // Attach the group so handlers don't repeat the lookup.
  req.group = group;
  return group;
}

// 403 unless the caller administers the group named in the route.
function requireGroupAdmin(paramName) {
  return (req, res, next) => {
    if (!req.user) return fail(res, 401, "Not signed in.");
    const group = findGroup(req, res, paramName);
    if (!group) return;
    if (!group.admins.includes(req.user.id)) {
      return fail(res, 403, "Group admin only.");
    }
    next();
  };
}

// 403 unless the caller is a member (admins are also members, §4 Group).
function requireGroupMember(paramName) {
  return (req, res, next) => {
    if (!req.user) return fail(res, 401, "Not signed in.");
    const group = findGroup(req, res, paramName);
    if (!group) return;
    if (!group.members.includes(req.user.id)) {
      return fail(res, 403, "Members of this group only.");
    }
    next();
  };
}

module.exports = {
  identifyUser,
  requireAuth,
  requireSuperAdmin,
  requireGroupAdmin,
  requireGroupMember,
};
