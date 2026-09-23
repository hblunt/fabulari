// server/routes/rooms.js
// Room read, edit and delete by ID (Phase1.md §6). GET :id/messages returns
// the last five stored messages (Phase2.md §6). Create is POST
// /api/groups/:id/rooms for group admins; members still use ROOM_CREATE.

const express = require("express");
const { db } = require("../storage");
const { fail } = require("../errors");
const { requireAuth } = require("../middleware");
const { applyRoomPatch, deleteRoom } = require("../rooms");
const { lastFive } = require("../messages");
const { imageUpload, saveUpload } = require("../uploads");

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

router.post("/:id/images", (req, res) => {
  if (!loadRoom(req, res)) return;
  if (!req.group.members.includes(req.user.id)) {
    return fail(res, 403, "Members of this group only.");
  }
  imageUpload(req, res, () => {
    const filename = saveUpload(req.file);
    res.status(201).json({ filename });
  });
});

router.get("/:id/messages", (req, res) => {
  if (!loadRoom(req, res)) return;
  if (!req.group.members.includes(req.user.id)) {
    return fail(res, 403, "Members of this group only.");
  }
  res.json({ messages: lastFive(req.room.id) });
});

router.get("/:id", (req, res) => {
  if (!loadRoom(req, res)) return;
  if (!req.group.members.includes(req.user.id)) {
    return fail(res, 403, "Members of this group only.");
  }
  res.json({ room: req.room });
});

router.patch("/:id", async (req, res) => {
  if (!loadRoom(req, res)) return;
  if (!req.group.admins.includes(req.user.id)) {
    return fail(res, 403, "Group admin only.");
  }
  const result = await applyRoomPatch(req.room, req.body);
  if (result.error) return fail(res, result.status, result.error);
  res.json({ room: result.room });
});

router.delete("/:id", async (req, res) => {
  if (!loadRoom(req, res)) return;
  if (!req.group.admins.includes(req.user.id)) {
    return fail(res, 403, "Group admin only.");
  }
  await deleteRoom(req.room);
  res.status(204).end();
});

module.exports = router;
