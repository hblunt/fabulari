// server/routes/users.js
// User directory, own profile, self-delete, and hard-delete (Phase2.md §6
// "Users"). /me is registered before /:id so "me" is never treated as a user
// id. POST /me/picture is still later in Phase 2.

const express = require("express");
const { fail } = require("../errors");
const { requireAuth, requireSuperAdmin } = require("../middleware");
const { writeAudit } = require("../audit");
const { listVisibleUsers, applyUserDelete, applySelfDelete, applyMePatch, applyPasswordChange, toPublicUser } = require("../users");

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

router.delete("/me", (req, res) => {
  const result = applySelfDelete(req.user);
  if (result.error) return fail(res, result.status, result.error);
  writeUserRemovalAudit(req.user, result, "Deleted their own account.");
  res.status(204).end();
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
  writeUserRemovalAudit(
    req.user,
    result,
    `Deletion requested by ${result.tombstone.requestedBy}.`,
  );
  res.status(204).end();
});

function writeUserRemovalAudit(actor, result, detail) {
  writeAudit(
    actor,
    "USER_DELETED",
    `User: ${result.user.firstName} ${result.user.lastName} (${result.user.email})`,
    detail,
  );
  for (const title of result.emptiedGroups ?? []) {
    writeAudit(
      actor,
      "GROUP_DELETED",
      `Group: ${title}`,
      `Removed because ${result.user.firstName} ${result.user.lastName} was its last member.`,
    );
  }
  for (const row of result.appointed ?? []) {
    writeAudit(
      actor,
      "GROUP_ADMIN_APPOINTED",
      `User: ${row.name}`,
      `Became admin of ${row.groupTitle} after ${result.user.firstName} ${result.user.lastName} was deleted.`,
    );
  }
}

module.exports = router;
