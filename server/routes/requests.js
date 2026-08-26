// server/routes/requests.js
// All six request types share one collection and these routes, distinguished
// by `type` (Phase1.md §6). There is no DELETE — once submitted, a request
// cannot be withdrawn.

const express = require("express");
const { db } = require("../storage");
const { fail } = require("../errors");
const { requireAuth } = require("../middleware");
const {
  REQUEST_TYPES,
  STATUSES,
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
  res.json({ requests: visibleRequests(req.user, type, status) });
});

router.post("/", (req, res) => {
  const { type, targetId, payload, reason } = req.body ?? {};
  const result = authoriseCreate(req.user, type, targetId ?? null, payload, reason);
  if (result.error) return fail(res, result.status, result.error);

  // Age-gated joins are rejected here so they never appear in an admin queue.
  if (type === "GROUP_JOIN" && req.user.age < result.group.ageLimit) {
    const request = persistRequest(
      buildRequest(req.user, type, result.targetId, result.payload, null, {
        status: "REJECTED",
        reason: `You must be at least ${result.group.ageLimit} to join this group.`,
        actionedAt: new Date().toISOString(),
      })
    );
    return res.status(201).json({ request });
  }

  const request = persistRequest(
    buildRequest(req.user, type, result.targetId, result.payload, result.reason)
  );
  res.status(201).json({ request });
});

router.post("/:id/approve", (req, res) => {
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

  const outcome = applyApproval(req.user, request);
  if (outcome?.error) return fail(res, outcome.status, outcome.error);

  finalise(request, req.user, "APPROVED", request.reason);
  const body = { request };
  if (outcome.created) body.created = outcome.created;
  res.json(body);
});

router.post("/:id/reject", (req, res) => {
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

  applyRejection(req.user, request, reason.trim());
  finalise(request, req.user, "REJECTED", reason.trim());
  res.json({ request });
});

router.get("/:id", (req, res) => {
  const request = db.requests.find((r) => r.id === req.params.id);
  if (!request) return fail(res, 404, "Request not found.");
  if (!canView(req.user, request)) {
    return fail(res, 403, "Not permitted to view this request.");
  }
  res.json({ request });
});

module.exports = router;
