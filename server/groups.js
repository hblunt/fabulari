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

function publicUsersByIds(ids) {
  return ids
    .map((id) => db.users.find((u) => u.id === id))
    .filter(Boolean)
    .map(toPublicUser)
    .sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName));
}

function removeFromGroup(group, userId) {
  group.members = group.members.filter((id) => id !== userId);
  group.admins = group.admins.filter((id) => id !== userId);
  const user = db.users.find((u) => u.id === userId);
  if (user) user.groups = user.groups.filter((id) => id !== group.id);
}

function wouldOrphanAdmins(group, userId) {
  return group.admins.includes(userId) && group.admins.length === 1;
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

    const remainingAdmins = group.admins.filter((id) => !removed.some((u) => u.id === id));
    if (remainingAdmins.length === 0) {
      return { status: 409, error: "This change would leave the group with no admin." };
    }

    for (const user of removed) {
      removeFromGroup(group, user.id);
    }
    save("users");
  }

  Object.assign(group, patch);
  save("groups");
  return { group, removedMembers: removed.map(toPublicUser) };
}

function removeMember(group, actor, targetId) {
  if (!group.members.includes(targetId)) {
    return { status: 404, error: "User is not a member of this group." };
  }
  const isAdmin = group.admins.includes(actor.id);
  const isSelf = actor.id === targetId;
  if (!isAdmin && !isSelf) {
    return { status: 403, error: "Group admin only, or leave as yourself." };
  }
  if (wouldOrphanAdmins(group, targetId)) {
    return { status: 409, error: "This change would leave the group with no admin." };
  }
  removeFromGroup(group, targetId);
  save("groups");
  save("users");
  return { ok: true };
}

function promote(group, targetId) {
  if (!group.members.includes(targetId)) {
    return { status: 404, error: "User is not a member of this group." };
  }
  if (group.admins.includes(targetId)) {
    return { status: 409, error: "User is already an admin of this group." };
  }
  group.admins.push(targetId);
  save("groups");
  return { ok: true };
}

function demote(group, targetId) {
  if (!group.admins.includes(targetId)) {
    return { status: 404, error: "User is not an admin of this group." };
  }
  if (wouldOrphanAdmins(group, targetId)) {
    return { status: 409, error: "This change would leave the group with no admin." };
  }
  group.admins = group.admins.filter((id) => id !== targetId);
  save("groups");
  return { ok: true };
}

function applyBan(group, actor, targetId, requestId) {
  if (typeof requestId !== "string" || !requestId.trim()) {
    return { status: 400, error: "An approved USER_REPORT requestId is required." };
  }
  const request = db.requests.find((r) => r.id === requestId.trim());
  if (!request) return { status: 404, error: "Request not found." };
  if (request.type !== "USER_REPORT") {
    return { status: 400, error: "Request is not a user report." };
  }
  if (request.status !== "APPROVED") {
    return { status: 409, error: "The report has not been approved." };
  }
  if (request.submittedBy === actor.id) {
    return { status: 403, error: "You cannot act on a report you submitted." };
  }
  if (request.targetId !== targetId) {
    return { status: 409, error: "This report does not target that user." };
  }
  if (request.payload?.groupId !== group.id) {
    return { status: 409, error: "This report is not for this group." };
  }
  if (group.bannedUsers.includes(targetId)) {
    return { status: 409, error: "User is already banned from this group." };
  }
  if (wouldOrphanAdmins(group, targetId)) {
    return { status: 409, error: "This change would leave the group with no admin." };
  }

  removeFromGroup(group, targetId);
  group.bannedUsers.push(targetId);
  save("groups");
  save("users");
  return { ok: true, request };
}

module.exports = {
  publicSummary,
  publicUsersByIds,
  applyPatch,
  removeMember,
  promote,
  demote,
  applyBan,
};
