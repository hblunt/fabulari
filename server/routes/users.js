// server/routes/users.js
// User directory, own profile, and hard-delete (Phase1.md §6 "Users").
// /me is registered before /:id so "me" is never treated as a user id.
// POST /me/picture is Phase 2.

const express = require("express");
const { fail } = require("../errors");
const { requireAuth, requireSuperAdmin } = require("../middleware");
const { writeAudit } = require("../audit");
const { listVisibleUsers, applyUserDelete, applyMePatch, applyPasswordChange, toPublicUser } = require("../users");

const router = express.Router();

router.use(requireAuth);

router.get("/me", (req, res) => {
  res.json({ user: toPublicUser(req.user) });
});

router.patch("/me/password", (req, res) => {
  const result = applyPasswordChange(req.user, req.body);
  if (result.error) return fail(res, result.status, result.error);
  res.status(204).end();
});

router.patch("/me", (req, res) => {
  const result = applyMePatch(req.user, req.body);
  if (result.error) return fail(res, result.status, result.error);
  res.json({ user: toPublicUser(result.user) });
});

router.get("/", (req, res) => {
  const groupId = req.query.groupId;
  if (Array.isArray(groupId)) {
    return fail(res, 400, "groupId must be a single id.");
  }
  const result = listVisibleUsers(req.user, groupId);
  if (result.error) return fail(res, result.status, result.error);
  res.json({ users: result.users });
});

// Super admin only. The SYSTEM_BAN request must already be approved;
// approval itself does not delete the account (same pattern as GROUP_DELETE).
router.delete("/:id", requireSuperAdmin, (req, res) => {
  const result = applyUserDelete(req.params.id, req.body?.requestId);
  if (result.error) return fail(res, result.status, result.error);
  writeAudit(
    req.user,
    "USER_DELETED",
    `User: ${result.user.firstName} ${result.user.lastName} (${result.user.email})`,
    `Deletion requested by ${result.tombstone.requestedBy}.`,
  );
  res.status(204).end();
});

module.exports = router;
