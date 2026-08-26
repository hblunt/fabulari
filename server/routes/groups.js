// server/routes/groups.js
// Pulled forward from group CRUD so join/create requests have a group list
// to target. Only the two GETs from §6: the public browse list, and the
// full record for members. Mutations stay for Stage 3.

const express = require("express");
const { db } = require("../storage");
const { fail } = require("../errors");
const { requireAuth } = require("../middleware");
const { toPublicUser } = require("../users");

const router = express.Router();

router.use(requireAuth);

// Four join states from wireframe 04, computed here so the client does not
// have to store age in localStorage (spec keeps age server-side).
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

router.get("/", (req, res) => {
  res.json({
    groups: db.groups.map((g) => ({
      id: g.id,
      title: g.title,
      description: g.description,
      ageLimit: g.ageLimit,
      memberCount: g.members.length,
      joinState: joinState(req.user, g),
    })),
  });
});

router.get("/:id", (req, res) => {
  const group = db.groups.find((g) => g.id === req.params.id);
  if (!group) return fail(res, 404, "Group not found.");
  const allowed =
    req.user.role === "SUPER_ADMIN" || group.members.includes(req.user.id);
  if (!allowed) return fail(res, 403, "Members of this group only.");

  // memberList is display-only so report/ban forms can show names without
  // a separate users endpoint. The stored group still holds ID arrays.
  res.json({
    group,
    memberList: group.members
      .map((id) => db.users.find((u) => u.id === id))
      .filter(Boolean)
      .map(toPublicUser),
  });
});

module.exports = router;
