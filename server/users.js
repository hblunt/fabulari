// server/users.js
// User create, list, profile and hard-delete (Phase1.md §6). Password hashing
// lives here so bootstrap, register and password-change cannot drift.

const bcrypt = require("bcrypt");
const { db, save } = require("./storage");
const { newId } = require("./ids");
const { deleteGroupCascade } = require("./requests");

// 10 rounds is the bcrypt default cost: slow enough to resist brute force,
// fast enough not to make login sluggish.
const BCRYPT_ROUNDS = 10;

// Password rules (§3 "Accounts and authentication"): minimum 8 characters,
// at least one uppercase letter, alphanumeric.
function validatePassword(password) {
  if (typeof password !== "string" || password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (!/^[A-Za-z0-9]+$/.test(password)) {
    return "Password must contain letters and numbers only.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter.";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number.";
  }
  return null; // Valid.
}

// Registration field checks shared by bootstrap and register. Returns the
// first problem found, or null when the payload is acceptable.
function validateNewUser({ firstName, lastName, age, email, password }) {
  if (!firstName?.trim() || !lastName?.trim()) {
    return "First name and last name are required.";
  }
  // Age is self-reported (§3 assumption 1) but must still be a usable number,
  // because group age limits compare against it.
  if (typeof age !== "number" || !Number.isFinite(age) || age < 1) {
    return "Age must be a positive number.";
  }
  if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    return "A valid email address is required.";
  }
  return validatePassword(password);
}

// Emails are compared case-insensitively everywhere (login, uniqueness,
// ban blacklist), so they are stored normalised once at creation.
function normaliseEmail(email) {
  return email.trim().toLowerCase();
}

// Creates and persists a user. Assumes the payload has passed validateNewUser.
function createUser({ firstName, lastName, age, email, password }, role) {
  const user = {
    id: newId("user"),
    email: normaliseEmail(email),
    passwordHash: bcrypt.hashSync(password, BCRYPT_ROUNDS),
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    age,
    role,
    profilePicture: null,
    groups: [],
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  save("users");
  return user;
}

// The API never returns the hash (§6 conventions) — every route that responds
// with a user must pass it through here.
function toPublicUser(user) {
  const { passwordHash, ...publicUser } = user;
  return publicUser;
}

function publicUsersByIds(ids) {
  return ids
    .map((id) => db.users.find((u) => u.id === id))
    .filter(Boolean)
    .map(toPublicUser);
}

function isSoleAdminAnywhere(userId) {
  // Block only when other members would be left without an admin. A last
  // remaining member can be deleted — that group is removed with them.
  return db.groups.some(
    (g) =>
      g.admins.includes(userId) &&
      g.admins.length === 1 &&
      g.members.some((id) => id !== userId),
  );
}

// Super admin sees everyone (optional groupId narrows). A group admin only
// sees members of groups they administer — never the whole directory.
function listVisibleUsers(actor, groupId) {
  if (actor.role === "SUPER_ADMIN") {
    if (!groupId) return { users: db.users.map(toPublicUser) };
    const group = db.groups.find((g) => g.id === groupId);
    if (!group) return { status: 404, error: "Group not found." };
    return { users: publicUsersByIds(group.members) };
  }

  const administered = db.groups.filter((g) => g.admins.includes(actor.id));
  if (administered.length === 0) {
    return { status: 403, error: "Super admin or group admin only." };
  }

  if (groupId) {
    const group = db.groups.find((g) => g.id === groupId);
    if (!group) return { status: 404, error: "Group not found." };
    if (!group.admins.includes(actor.id)) {
      return { status: 403, error: "Group admin only." };
    }
    return { users: publicUsersByIds(group.members) };
  }

  const ids = [...new Set(administered.flatMap((g) => g.members))];
  return { users: publicUsersByIds(ids) };
}

function requesterLabel(userId) {
  const user = db.users.find((u) => u.id === userId);
  return user ? `${user.firstName} ${user.lastName} (${user.email})` : userId;
}

// Hard-delete. The tombstone is written first so the email stays blacklisted
// even if a later step fails. Pending requests they submitted or that name
// them as the target are dropped; the approved SYSTEM_BAN is kept.
function applyUserDelete(userId, requestId) {
  if (typeof requestId !== "string" || !requestId.trim()) {
    return { status: 400, error: "An approved SYSTEM_BAN requestId is required." };
  }

  const request = db.requests.find((r) => r.id === requestId.trim());
  if (!request) return { status: 404, error: "Request not found." };
  if (request.type !== "SYSTEM_BAN") {
    return { status: 400, error: "Request is not a system ban." };
  }
  if (request.status !== "APPROVED") {
    return { status: 409, error: "The ban request has not been approved." };
  }
  if (request.targetId !== userId) {
    return { status: 409, error: "This request does not target that user." };
  }

  const user = db.users.find((u) => u.id === userId);
  if (!user) return { status: 404, error: "User not found." };
  if (user.role === "SUPER_ADMIN") {
    return { status: 403, error: "The super admin cannot be deleted." };
  }
  if (isSoleAdminAnywhere(userId)) {
    return { status: 409, error: "This user is the sole admin of a group." };
  }

  const tombstone = {
    id: newId("bannedAccount"),
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    bannedAt: new Date().toISOString(),
    reason: request.reason?.trim() || "No reason given.",
    requestedBy: requesterLabel(request.submittedBy),
  };
  db.bannedAccounts.push(tombstone);
  save("bannedAccounts");

  for (const group of db.groups) {
    group.members = group.members.filter((id) => id !== userId);
    group.admins = group.admins.filter((id) => id !== userId);
    group.bannedUsers = group.bannedUsers.filter((id) => id !== userId);
  }
  save("groups");

  const emptiedGroups = db.groups.filter((g) => g.members.length === 0);
  const emptiedTitles = emptiedGroups.map((g) => g.title);
  for (const group of emptiedGroups) {
    deleteGroupCascade(group.id, request.id);
  }

  db.requests = db.requests.filter((r) => {
    if (r.id === request.id) return true;
    if (r.status !== "PENDING") return true;
    return r.submittedBy !== userId && r.targetId !== userId;
  });
  save("requests");

  const snapshot = { firstName: user.firstName, lastName: user.lastName, email: user.email };
  db.users = db.users.filter((u) => u.id !== userId);
  save("users");

  return { ok: true, request, user: snapshot, tombstone, emptiedGroups: emptiedTitles };
}

function applyMePatch(user, body) {
  if (!body || typeof body !== "object") {
    return { status: 400, error: "No valid fields to update." };
  }
  if (Object.prototype.hasOwnProperty.call(body, "email")) {
    return { status: 400, error: "Email cannot be changed." };
  }

  const patch = {};
  if (body.firstName !== undefined) {
    if (typeof body.firstName !== "string" || !body.firstName.trim()) {
      return { status: 400, error: "First name is required." };
    }
    patch.firstName = body.firstName.trim();
  }
  if (body.lastName !== undefined) {
    if (typeof body.lastName !== "string" || !body.lastName.trim()) {
      return { status: 400, error: "Last name is required." };
    }
    patch.lastName = body.lastName.trim();
  }
  if (body.age !== undefined) {
    if (typeof body.age !== "number" || !Number.isFinite(body.age) || body.age < 1) {
      return { status: 400, error: "Age must be a positive number." };
    }
    patch.age = body.age;
  }

  if (Object.keys(patch).length === 0) {
    return { status: 400, error: "No valid fields to update." };
  }
  Object.assign(user, patch);
  save("users");
  return { user };
}

function applyPasswordChange(user, body) {
  const currentPassword = body?.currentPassword;
  const newPassword = body?.newPassword;
  if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
    return { status: 400, error: "Current password and new password are required." };
  }
  if (!bcrypt.compareSync(currentPassword, user.passwordHash)) {
    return { status: 401, error: "Current password is incorrect." };
  }
  const problem = validatePassword(newPassword);
  if (problem) return { status: 400, error: problem };
  user.passwordHash = bcrypt.hashSync(newPassword, BCRYPT_ROUNDS);
  save("users");
  return { ok: true };
}

module.exports = {
  validatePassword,
  validateNewUser,
  normaliseEmail,
  createUser,
  toPublicUser,
  listVisibleUsers,
  applyUserDelete,
  applyMePatch,
  applyPasswordChange,
};
