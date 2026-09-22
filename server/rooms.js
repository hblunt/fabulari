// server/rooms.js
// Room create/edit/delete (Phase1.md §6). Members propose via ROOM_CREATE;
// group admins also POST a room directly.

const { db, save } = require("./storage");
const { newId } = require("./ids");
const { deleteMessagesForRoom } = require("./messages");

async function createRoom(group, { name, description }) {
  if (typeof name !== "string" || !name.trim()) {
    return { status: 400, error: "Name is required." };
  }
  if (description !== undefined && typeof description !== "string") {
    return { status: 400, error: "Description must be a string." };
  }
  const room = {
    id: newId("room"),
    groupId: group.id,
    name: name.trim(),
    createdAt: new Date().toISOString(),
  };
  const desc = description?.trim();
  if (desc) room.description = desc;
  db.rooms.push(room);
  await save("rooms");
  return { room };
}

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

async function applyRoomPatch(room, body) {
  const parsed = parseRoomPatch(body);
  if (parsed.error) return parsed;

  if (parsed.patch.description === "") {
    delete room.description;
    delete parsed.patch.description;
  }
  Object.assign(room, parsed.patch);
  await save("rooms");
  return { room };
}

async function deleteRoom(room) {
  await deleteMessagesForRoom(room.id);
  db.rooms = db.rooms.filter((r) => r.id !== room.id);
  await save("rooms");
}

module.exports = { createRoom, applyRoomPatch, deleteRoom };
