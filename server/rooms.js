// server/rooms.js
// Room edit/delete helpers (Phase1.md §6). Creation is not here — rooms
// only appear by approving a ROOM_CREATE request.

const { db, save } = require("./storage");

function parseRoomPatch(body) {
  if (!body || typeof body !== "object") {
    return { status: 400, error: "No valid fields to update." };
  }

  const patch = {};
  if (body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim()) {
      return { status: 400, error: "Name is required." };
    }
    patch.name = body.name.trim();
  }
  if (body.description !== undefined) {
    if (typeof body.description !== "string") {
      return { status: 400, error: "Description must be a string." };
    }
    patch.description = body.description.trim();
  }

  if (Object.keys(patch).length === 0) {
    return { status: 400, error: "No valid fields to update." };
  }
  return { patch };
}

function applyRoomPatch(room, body) {
  const parsed = parseRoomPatch(body);
  if (parsed.error) return parsed;

  if (parsed.patch.description === "") {
    delete room.description;
    delete parsed.patch.description;
  }
  Object.assign(room, parsed.patch);
  save("rooms");
  return { room };
}

function deleteRoom(room) {
  db.rooms = db.rooms.filter((r) => r.id !== room.id);
  save("rooms");
}

module.exports = { applyRoomPatch, deleteRoom };
