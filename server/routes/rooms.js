// server/routes/rooms.js
// Room read, edit and delete by ID (Phase1.md §6). There is no POST —
// rooms are created only by approving a ROOM_CREATE request.

const express = require("express");
const { db } = require("../storage");
const { fail } = require("../errors");
const { requireAuth } = require("../middleware");
const { applyRoomPatch, deleteRoom } = require("../rooms");

const router = express.Router();

router.use(requireAuth);

function loadRoom(req, res) {
  const room = db.rooms.find((r) => r.id === req.params.id);
  if (!room) {
    fail(res, 404, "Room not found.");
    return null;
  }
  const group = db.groups.find((g) => g.id === room.groupId);
  if (!group) {
    fail(res, 404, "Group not found.");
    return null;
  }
  req.room = room;
  req.group = group;
  return room;
}

router.get("/:id", (req, res) => {
  if (!loadRoom(req, res)) return;
  if (!req.group.members.includes(req.user.id)) {
    return fail(res, 403, "Members of this group only.");
  }
  res.json({ room: req.room });
});

router.patch("/:id", (req, res) => {
  if (!loadRoom(req, res)) return;
  if (!req.group.admins.includes(req.user.id)) {
    return fail(res, 403, "Group admin only.");
  }
  const result = applyRoomPatch(req.room, req.body);
  if (result.error) return fail(res, result.status, result.error);
  res.json({ room: result.room });
});

router.delete("/:id", (req, res) => {
  if (!loadRoom(req, res)) return;
  if (!req.group.admins.includes(req.user.id)) {
    return fail(res, 403, "Group admin only.");
  }
  deleteRoom(req.room);
  res.status(204).end();
});

module.exports = router;
