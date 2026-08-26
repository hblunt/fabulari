// server/groups.js
// Group mutations shared by the groups routes (Phase1.md §6). Creation is
// not here — groups only appear by approving a GROUP_CREATE request.

const { db, save } = require("./storage");
const { GROUP_THEMES } = require("./requests");
const { toPublicUser } = require("./users");

function joinState(user, group) {
  if (group.members.includes(user.id)) return "member";
  if (user.age < group.ageLimit) return "blocked";
  const requested = db.requests.some(
    (r) =>
      r.type === "GROUP_JOIN" &&
      r.status === "PENDING" &&
      r.submittedBy === user.id &&
      r.targetId === group.id
  );
  return requested ? "requested" : "joinable";
}

function publicSummary(user, group) {
  return {
    id: group.id,
    title: group.title,
    description: group.description,
    ageLimit: group.ageLimit,
    memberCount: group.members.length,
    joinState: joinState(user, group),
  };
}

function parsePatch(body) {
  if (!body || typeof body !== "object") {
    return { status: 400, error: "No valid fields to update." };
  }

  const patch = {};
  if (body.title !== undefined) {
    if (typeof body.title !== "string" || !body.title.trim()) {
      return { status: 400, error: "Title is required." };
    }
    patch.title = body.title.trim();
  }
  if (body.description !== undefined) {
    if (typeof body.description !== "string" || !body.description.trim()) {
      return { status: 400, error: "Description is required." };
    }
    patch.description = body.description.trim();
  }
  if (body.ageLimit !== undefined) {
    if (typeof body.ageLimit !== "number" || !Number.isFinite(body.ageLimit) || body.ageLimit < 0) {
      return { status: 400, error: "Age limit must be a number of 0 or more." };
    }
    patch.ageLimit = body.ageLimit;
  }
  if (body.theme !== undefined) {
    if (!GROUP_THEMES.includes(body.theme)) {
      return { status: 400, error: "Theme must be one of the preset palettes." };
    }
    patch.theme = body.theme;
  }

  if (Object.keys(patch).length === 0) {
    return { status: 400, error: "No valid fields to update." };
  }
  return { patch };
}

function applyPatch(group, body) {
  const parsed = parsePatch(body);
  if (parsed.error) return parsed;

  const { patch } = parsed;
  let removed = [];

  if (patch.ageLimit !== undefined && patch.ageLimit > group.ageLimit) {
    removed = group.members
      .map((id) => db.users.find((u) => u.id === id))
      .filter((u) => u && u.age < patch.ageLimit);

    // A group must always keep at least one admin (§3). Age-out cannot orphan it.
    const remainingAdmins = group.admins.filter((id) => !removed.some((u) => u.id === id));
    if (remainingAdmins.length === 0) {
      return { status: 409, error: "This change would leave the group with no admin." };
    }

    for (const user of removed) {
      group.members = group.members.filter((id) => id !== user.id);
      group.admins = group.admins.filter((id) => id !== user.id);
      user.groups = user.groups.filter((id) => id !== group.id);
    }
    save("users");
  }

  Object.assign(group, patch);
  save("groups");
  return { group, removedMembers: removed.map(toPublicUser) };
}

module.exports = {
  publicSummary,
  applyPatch,
};
