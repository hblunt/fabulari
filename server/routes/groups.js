// server/routes/groups.js
// Group list, detail, edit and delete (Phase1.md §6). There is no POST —
// groups are created only by approving a GROUP_CREATE request.

const express = require("express");
const { db } = require("../storage");
const { fail } = require("../errors");
const { writeAudit } = require("../audit");
const {
  requireAuth,
  requireSuperAdmin,
  requireGroupAdmin,
} = require("../middleware");
const { toPublicUser } = require("../users");
const { publicSummary, applyPatch } = require("../groups");
const { deleteGroupCascade, actorName } = require("../requests");

const router = express.Router();

router.use(requireAuth);

router.get("/", (req, res) => {
  res.json({ groups: db.groups.map((g) => publicSummary(req.user, g)) });
});

router.get("/:id", (req, res) => {
  const group = db.groups.find((g) => g.id === req.params.id);
  if (!group) return fail(res, 404, "Group not found.");
  const allowed =
    req.user.role === "SUPER_ADMIN" || group.members.includes(req.user.id);
  if (!allowed) return fail(res, 403, "Members of this group only.");

  // memberList is display-only so report forms can show names without a
  // separate users endpoint. The stored group still holds ID arrays.
  res.json({
    group,
    memberList: group.members
      .map((id) => db.users.find((u) => u.id === id))
      .filter(Boolean)
      .map(toPublicUser),
  });
});

router.patch("/:id", requireGroupAdmin("id"), (req, res) => {
  const result = applyPatch(req.group, req.body);
  if (result.error) return fail(res, result.status, result.error);
  res.json({ group: result.group, removedMembers: result.removedMembers });
});

// Super admin only. The GROUP_DELETE request must already be approved;
// approval itself does not remove the group (same pattern as SYSTEM_BAN).
router.delete("/:id", requireSuperAdmin, (req, res) => {
  const requestId = req.body?.requestId;
  if (typeof requestId !== "string" || !requestId.trim()) {
    return fail(res, 400, "An approved GROUP_DELETE requestId is required.");
  }

  const request = db.requests.find((r) => r.id === requestId.trim());
  if (!request) return fail(res, 404, "Request not found.");
  if (request.type !== "GROUP_DELETE") {
    return fail(res, 400, "Request is not a group deletion.");
  }
  if (request.status !== "APPROVED") {
    return fail(res, 409, "The deletion request has not been approved.");
  }
  if (request.targetId !== req.params.id) {
    return fail(res, 409, "This request does not target that group.");
  }

  const group = db.groups.find((g) => g.id === req.params.id);
  if (!group) return fail(res, 404, "Group not found.");

  const title = group.title;
  deleteGroupCascade(group.id, request.id);
  writeAudit(
    req.user,
    "GROUP_DELETED",
    `Group: ${title}`,
    `Deletion requested by ${actorName(request.submittedBy)}.`
  );
  res.status(204).end();
});

module.exports = router;
