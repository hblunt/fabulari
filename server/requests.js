// server/requests.js
// Shared request rules (Phase1.md §4 payload table, §6 approve/reject).
// The HTTP layer in routes/requests.js stays thin: this file decides who may
// raise a type, what "equivalent" means, who may action it, and what approval
// actually creates. USER_REPORT and SYSTEM_BAN only grant permission — the
// ban/delete themselves are later endpoints that require an approved request.

const { db, save } = require("./storage");
const { newId } = require("./ids");
const { writeAudit } = require("./audit");

const REQUEST_TYPES = [
  "GROUP_CREATE",
  "GROUP_DELETE",
  "GROUP_JOIN",
  "ROOM_CREATE",
  "USER_REPORT",
  "SYSTEM_BAN",
];

const STATUSES = ["PENDING", "APPROVED", "REJECTED"];

// Must stay in lockstep with the client GroupTheme union and styles.css.
const GROUP_THEMES = ["slate", "moss", "ocean", "plum", "ember", "sand"];

const SUPER_ADMIN_TYPES = ["GROUP_CREATE", "GROUP_DELETE", "SYSTEM_BAN"];

function groupsAdministeredBy(userId) {
  return db.groups.filter((g) => g.admins.includes(userId));
}

function isGroupAdminOf(userId, groupId) {
  const group = db.groups.find((g) => g.id === groupId);
  return Boolean(group && group.admins.includes(userId));
}

function groupIdFor(request) {
  if (request.type === "GROUP_JOIN" || request.type === "GROUP_DELETE") {
    return request.targetId;
  }
  if (request.type === "ROOM_CREATE" || request.type === "USER_REPORT") {
    return request.payload?.groupId ?? null;
  }
  return null;
}

// Super admin types are actioned by the super admin; the rest by an admin of
// the group the request targets. Used by both approve/reject and GET :id.
function canAction(user, request) {
  if (user.role === "SUPER_ADMIN") {
    return SUPER_ADMIN_TYPES.includes(request.type);
  }
  const groupId = groupIdFor(request);
  return groupId ? isGroupAdminOf(user.id, groupId) : false;
}

function canView(user, request) {
  if (request.submittedBy === user.id) return true;
  if (request.actionedBy === user.id) return true;
  return canAction(user, request);
}

// GET /api/requests is one query scoped by role, then optionally filtered.
function visibleRequests(user, typeFilter, statusFilter) {
  const own = db.requests.filter((r) => r.submittedBy === user.id);
  let extra = [];

  if (user.role === "SUPER_ADMIN") {
    extra = db.requests.filter((r) => SUPER_ADMIN_TYPES.includes(r.type));
  } else {
    const adminIds = groupsAdministeredBy(user.id).map((g) => g.id);
    extra = db.requests.filter(
      (r) =>
        r.status === "PENDING" &&
        ["GROUP_JOIN", "ROOM_CREATE", "USER_REPORT"].includes(r.type) &&
        adminIds.includes(groupIdFor(r))
    );
  }

  const seen = new Set();
  let list = [...own, ...extra].filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });

  if (typeFilter) list = list.filter((r) => r.type === typeFilter);
  if (statusFilter) list = list.filter((r) => r.status === statusFilter);
  return list;
}

function validatePayload(type, payload) {
  if (type === "GROUP_CREATE") {
    if (!payload?.title?.trim() || !payload?.description?.trim()) {
      return "Title and description are required.";
    }
    if (typeof payload.ageLimit !== "number" || payload.ageLimit < 0) {
      return "Age limit must be a number of 0 or more.";
    }
    if (!GROUP_THEMES.includes(payload.theme)) {
      return "Theme must be one of the preset palettes.";
    }
    return null;
  }
  if (type === "ROOM_CREATE") {
    if (!payload?.name?.trim() || !payload?.groupId) {
      return "Room name and groupId are required.";
    }
    return null;
  }
  if (type === "USER_REPORT") {
    if (!payload?.groupId) return "groupId is required.";
    return null;
  }
  return null;
}

function hasEquivalentPending(type, submitterId, targetId, payload) {
  return db.requests.some((r) => {
    if (r.status !== "PENDING" || r.type !== type) return false;
    if (type === "GROUP_CREATE") {
      return (
        r.submittedBy === submitterId &&
        r.payload.title.trim().toLowerCase() === payload.title.trim().toLowerCase()
      );
    }
    if (type === "GROUP_JOIN") {
      return r.submittedBy === submitterId && r.targetId === targetId;
    }
    if (type === "GROUP_DELETE") return r.targetId === targetId;
    if (type === "ROOM_CREATE") {
      return (
        r.submittedBy === submitterId &&
        r.payload.groupId === payload.groupId &&
        r.payload.name.trim().toLowerCase() === payload.name.trim().toLowerCase()
      );
    }
    if (type === "USER_REPORT") {
      return (
        r.submittedBy === submitterId &&
        r.targetId === targetId &&
        r.payload.groupId === payload.groupId
      );
    }
    if (type === "SYSTEM_BAN") return r.targetId === targetId;
    return false;
  });
}

// Returns a 400/403/409 problem, or null plus the normalised target/payload
// the caller should store. Super admins raise nothing — the matrix gives
// them no submit column.
function authoriseCreate(user, type, targetId, payload, reason) {
  if (!REQUEST_TYPES.includes(type)) return { status: 400, error: "Unknown request type." };
  if (user.role === "SUPER_ADMIN") {
    return { status: 403, error: "The super admin cannot raise requests." };
  }

  const payloadProblem = validatePayload(type, payload);
  if (payloadProblem) return { status: 400, error: payloadProblem };

  if (type === "GROUP_CREATE") {
    const normalised = {
      title: payload.title.trim(),
      description: payload.description.trim(),
      ageLimit: payload.ageLimit,
      theme: payload.theme,
    };
    if (hasEquivalentPending(type, user.id, null, normalised)) {
      return { status: 409, error: "An equivalent request is already pending." };
    }
    return { targetId: null, payload: normalised, reason: null };
  }

  if (type === "GROUP_JOIN") {
    const group = db.groups.find((g) => g.id === targetId);
    if (!group) return { status: 404, error: "Group not found." };
    if (group.members.includes(user.id)) {
      return { status: 409, error: "You are already a member of this group." };
    }
    if (hasEquivalentPending(type, user.id, targetId, null)) {
      return { status: 409, error: "An equivalent request is already pending." };
    }
    return { targetId, payload: undefined, reason: null, group };
  }

  if (type === "GROUP_DELETE") {
    const group = db.groups.find((g) => g.id === targetId);
    if (!group) return { status: 404, error: "Group not found." };
    if (!group.admins.includes(user.id)) {
      return { status: 403, error: "Only a group admin can request deletion." };
    }
    if (hasEquivalentPending(type, user.id, targetId, null)) {
      return { status: 409, error: "An equivalent request is already pending." };
    }
    return { targetId, payload: undefined, reason: null };
  }

  if (type === "ROOM_CREATE") {
    const group = db.groups.find((g) => g.id === payload.groupId);
    if (!group) return { status: 404, error: "Group not found." };
    if (!group.members.includes(user.id)) {
      return { status: 403, error: "Only members of the group may propose a room." };
    }
    const normalised = {
      name: payload.name.trim(),
      description: payload.description?.trim() || undefined,
      groupId: payload.groupId,
    };
    if (hasEquivalentPending(type, user.id, payload.groupId, normalised)) {
      return { status: 409, error: "An equivalent request is already pending." };
    }
    return { targetId: payload.groupId, payload: normalised, reason: null };
  }

  if (type === "USER_REPORT") {
    if (!targetId) return { status: 400, error: "targetId (the reported user) is required." };
    if (!reason?.trim()) return { status: 400, error: "A reason is required." };
    const group = db.groups.find((g) => g.id === payload.groupId);
    if (!group) return { status: 404, error: "Group not found." };
    if (!group.members.includes(user.id)) {
      return { status: 403, error: "You can only report users in a group you belong to." };
    }
    if (targetId === user.id) return { status: 403, error: "You cannot report yourself." };
    const target = db.users.find((u) => u.id === targetId);
    if (!target) return { status: 404, error: "User not found." };
    if (hasEquivalentPending(type, user.id, targetId, payload)) {
      return { status: 409, error: "An equivalent request is already pending." };
    }
    return { targetId, payload: { groupId: payload.groupId }, reason: reason.trim() };
  }

  if (type === "SYSTEM_BAN") {
    if (!targetId) return { status: 400, error: "targetId (the user to ban) is required." };
    if (groupsAdministeredBy(user.id).length === 0) {
      return { status: 403, error: "Only a group admin can request a system-wide ban." };
    }
    if (targetId === user.id) return { status: 403, error: "You cannot request a ban on yourself." };
    const target = db.users.find((u) => u.id === targetId);
    if (!target) return { status: 404, error: "User not found." };
    if (target.role === "SUPER_ADMIN") {
      return { status: 403, error: "The super admin cannot be banned." };
    }
    if (hasEquivalentPending(type, user.id, targetId, null)) {
      return { status: 409, error: "An equivalent request is already pending." };
    }
    return { targetId, payload: undefined, reason: reason?.trim() || null };
  }

  return { status: 400, error: "Unknown request type." };
}

function persistRequest(record) {
  db.requests.push(record);
  save("requests");
  return record;
}

function buildRequest(user, type, targetId, payload, reason, extras = {}) {
  return {
    id: newId("request"),
    type,
    status: extras.status ?? "PENDING",
    submittedBy: user.id,
    targetId,
    payload,
    reason: extras.reason ?? reason,
    actionedBy: extras.actionedBy ?? null,
    createdAt: new Date().toISOString(),
    actionedAt: extras.actionedAt ?? null,
  };
}

function addMembership(userId, group) {
  if (!group.members.includes(userId)) group.members.push(userId);
  const user = db.users.find((u) => u.id === userId);
  if (user && !user.groups.includes(group.id)) user.groups.push(group.id);
  save("groups");
  save("users");
}

function requestConcernsGroup(request, groupId) {
  return groupIdFor(request) === groupId;
}

function deleteGroupCascade(groupId, keepRequestId) {
  db.rooms = db.rooms.filter((r) => r.groupId !== groupId);
  save("rooms");

  db.requests = db.requests.filter((r) => {
    if (r.id === keepRequestId) return true;
    if (r.status !== "PENDING") return true;
    return !requestConcernsGroup(r, groupId);
  });
  save("requests");

  for (const user of db.users) {
    user.groups = user.groups.filter((id) => id !== groupId);
  }
  save("users");

  db.groups = db.groups.filter((g) => g.id !== groupId);
  save("groups");
}

function applyApproval(actor, request) {
  let created = undefined;

  if (request.type === "GROUP_CREATE") {
    const group = {
      id: newId("group"),
      title: request.payload.title,
      description: request.payload.description,
      ageLimit: request.payload.ageLimit,
      theme: request.payload.theme,
      members: [request.submittedBy],
      admins: [request.submittedBy],
      bannedUsers: [],
      createdBy: request.submittedBy,
      createdAt: new Date().toISOString(),
    };
    db.groups.push(group);
    save("groups");
    addMembership(request.submittedBy, group);
    created = group;
    writeAudit(actor, "GROUP_CREATED", `Group: ${group.title}`, `Requested by ${actorName(request.submittedBy)}.`);
  }

  if (request.type === "GROUP_DELETE") {
    const group = db.groups.find((g) => g.id === request.targetId);
    const title = group ? group.title : request.targetId;
    writeAudit(
      actor,
      "GROUP_DELETE_APPROVED",
      `Group: ${title}`,
      `Deletion requested by ${actorName(request.submittedBy)}.`
    );
  }

  if (request.type === "GROUP_JOIN") {
    const group = db.groups.find((g) => g.id === request.targetId);
    if (!group) return { status: 404, error: "Group not found." };
    if (group.bannedUsers.includes(request.submittedBy)) {
      return { status: 409, error: "This user is banned from the group." };
    }
    addMembership(request.submittedBy, group);
    writeAudit(actor, "GROUP_JOIN_APPROVED", `Group: ${group.title}`, `${actorName(request.submittedBy)} joined.`);
  }

  if (request.type === "ROOM_CREATE") {
    const group = db.groups.find((g) => g.id === request.payload.groupId);
    if (!group) return { status: 404, error: "Group not found." };
    const room = {
      id: newId("room"),
      groupId: group.id,
      name: request.payload.name,
      description: request.payload.description,
      createdAt: new Date().toISOString(),
    };
    db.rooms.push(room);
    save("rooms");
    created = room;
    writeAudit(actor, "ROOM_CREATED", `Room: ${room.name}`, `In group ${group.title}.`);
  }

  if (request.type === "USER_REPORT") {
    writeAudit(
      actor,
      "USER_REPORT_APPROVED",
      `User: ${actorName(request.targetId)}`,
      "Permits a group ban."
    );
  }

  if (request.type === "SYSTEM_BAN") {
    writeAudit(
      actor,
      "SYSTEM_BAN_APPROVED",
      `User: ${actorName(request.targetId)}`,
      `Ban requested by ${actorName(request.submittedBy)}.`
    );
  }

  return { created };
}

function applyRejection(actor, request, reason) {
  const labels = {
    GROUP_CREATE: `Group request: ${request.payload?.title ?? ""}`,
    GROUP_DELETE: `Group: ${db.groups.find((g) => g.id === request.targetId)?.title ?? request.targetId}`,
    GROUP_JOIN: `Join: ${db.groups.find((g) => g.id === request.targetId)?.title ?? request.targetId}`,
    ROOM_CREATE: `Room: ${request.payload?.name ?? ""}`,
    USER_REPORT: `User: ${actorName(request.targetId)}`,
    SYSTEM_BAN: `User: ${actorName(request.targetId)}`,
  };
  writeAudit(actor, `${request.type}_REJECTED`, labels[request.type] ?? request.type, reason);
}

function actorName(userId) {
  const user = db.users.find((u) => u.id === userId);
  return user ? `${user.firstName} ${user.lastName}` : userId;
}

function finalise(request, actor, status, reason) {
  request.status = status;
  request.actionedBy = actor.id;
  request.actionedAt = new Date().toISOString();
  if (reason !== undefined) request.reason = reason;
  save("requests");
  return request;
}

module.exports = {
  REQUEST_TYPES,
  STATUSES,
  GROUP_THEMES,
  groupIdFor,
  canAction,
  canView,
  visibleRequests,
  authoriseCreate,
  persistRequest,
  buildRequest,
  applyApproval,
  applyRejection,
  finalise,
  deleteGroupCascade,
  actorName,
};
