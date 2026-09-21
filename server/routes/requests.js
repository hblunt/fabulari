// server/routes/requests.js
// All six request types share one collection and these routes, distinguished
// by `type` (Phase1.md §6). There is no DELETE — once submitted, a request
// cannot be withdrawn.

const express = require("express");
const { db } = require("../storage");
const { fail } = require("../errors");
const { requireAuth } = require("../middleware");
const { ageFromDob } = require("../age");
const {
  REQUEST_TYPES,
  STATUSES,
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
} = require("../requests");

function displayName(userId) {
  const user = db.users.find((u) => u.id === userId);
  return user ? `${user.firstName} ${user.lastName}` : userId;
}

// Names and counts are display-only: the stored request still holds IDs, and
// the UI should not need a second users round-trip to render a queue row.
function withDisplay(request) {
  const user = db.users.find((u) => u.id === request.submittedBy);
  const extra = {
    submitterName: displayName(request.submittedBy),
    submitterAge: user ? ageFromDob(user.dateOfBirth) : null,
    groupId: groupIdFor(request),
  };

  if (request.type === "GROUP_CREATE") {
    extra.targetName = request.payload?.title ?? "";
  }

  if (request.type === "GROUP_JOIN" || request.type === "GROUP_DELETE") {
    const group = db.groups.find((g) => g.id === request.targetId);
    extra.targetName = group?.title ?? "(deleted group)";
    extra.groupAgeLimit = group?.ageLimit ?? null;
    extra.memberCount = group?.members.length ?? null;
    extra.roomCount = group
      ? db.rooms.filter((r) => r.groupId === group.id).length
      : null;
    extra.wasBanned = group ? group.bannedUsers.includes(request.submittedBy) : false;
  }

  if (request.type === "ROOM_CREATE") {
    extra.targetName = request.payload?.name ?? "";
    extra.groupName = db.groups.find((g) => g.id === request.payload?.groupId)?.title ?? "";
  }

  if (request.type === "USER_REPORT" || request.type === "SYSTEM_BAN") {
    extra.targetName = displayName(request.targetId);
    extra.groupName = db.groups.find((g) => g.id === request.payload?.groupId)?.title ?? "";
  }

  return { ...request, ...extra };
}

const router = express.Router();

router.use(requireAuth);

router.get("/", (req, res) => {
  const { type, status } = req.query;
  if (type && !REQUEST_TYPES.includes(type)) {
    return fail(res, 400, "Unknown request type.");
  }
  if (status && !STATUSES.includes(status)) {
    return fail(res, 400, "Unknown status.");
  }
  res.json({ requests: visibleRequests(req.user, type, status).map(withDisplay) });
});

router.post("/", async (req, res) => {
  const { type, targetId, payload, reason } = req.body ?? {};
  const result = authoriseCreate(req.user, type, targetId ?? null, payload, reason);
  if (result.error) return fail(res, result.status, result.error);

  // Age-gated joins are rejected here so they never appear in an admin queue.
  if (type === "GROUP_JOIN" && ageFromDob(req.user.dateOfBirth) < result.group.ageLimit) {
    const request = await persistRequest(
      buildRequest(req.user, type, result.targetId, result.payload, null, {
        status: "REJECTED",
        reason: `You must be at least ${result.group.ageLimit} to join this group.`,
        actionedAt: new Date().toISOString(),
      })
    );
    return res.status(201).json({ request: withDisplay(request) });
  }

  const request = await persistRequest(
    buildRequest(req.user, type, result.targetId, result.payload, result.reason)
  );
  res.status(201).json({ request: withDisplay(request) });
});

router.post("/:id/approve", async (req, res) => {
  const request = db.requests.find((r) => r.id === req.params.id);
  if (!request) return fail(res, 404, "Request not found.");
  if (request.submittedBy === req.user.id) {
    return fail(res, 403, "You cannot action a request you submitted.");
  }
  if (request.status !== "PENDING") {
    return fail(res, 409, "This request has already been actioned.");
  }
  if (!canAction(req.user, request)) {
    return fail(res, 403, "Not permitted to approve this request.");
  }

  const outcome = await applyApproval(req.user, request);
  if (outcome?.error) return fail(res, outcome.status, outcome.error);

  await finalise(request, req.user, "APPROVED", request.reason);
  const body = { request: withDisplay(request) };
  if (outcome.created) body.created = outcome.created;
  res.json(body);
});

router.post("/:id/reject", async (req, res) => {
  const reason = req.body?.reason;
  if (typeof reason !== "string" || !reason.trim()) {
    return fail(res, 400, "A rejection reason is required.");
  }

  const request = db.requests.find((r) => r.id === req.params.id);
  if (!request) return fail(res, 404, "Request not found.");
  if (request.submittedBy === req.user.id) {
    return fail(res, 403, "You cannot action a request you submitted.");
  }
  if (request.status !== "PENDING") {
    return fail(res, 409, "This request has already been actioned.");
  }
  if (!canAction(req.user, request)) {
    return fail(res, 403, "Not permitted to reject this request.");
  }

  await applyRejection(req.user, request, reason.trim());
  await finalise(request, req.user, "REJECTED", reason.trim());
  res.json({ request: withDisplay(request) });
});

router.get("/:id", (req, res) => {
  const request = db.requests.find((r) => r.id === req.params.id);
  if (!request) return fail(res, 404, "Request not found.");
  if (!canView(req.user, request)) {
    return fail(res, 403, "Not permitted to view this request.");
  }
  res.json({ request: withDisplay(request) });
});

module.exports = router;
