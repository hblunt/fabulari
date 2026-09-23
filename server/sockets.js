// server/sockets.js
// Live room events (Phase2.md §6). Presence is a map of room ID to user IDs
// and lives only in memory. Messages still go through messages.js / Mongo.

const { Server } = require("socket.io");
const { db } = require("./storage");
const { identifySocket } = require("./middleware");
const { persistMessage, deleteOwnMessage } = require("./messages");

// roomId -> userId -> set of socket ids (so two tabs count as one person).
const occupancy = new Map();

function displayName(user) {
  return `${user.firstName} ${user.lastName}`;
}

function reply(ack, payload = {}) {
  if (typeof ack === "function") ack(payload);
}

function findRoomContext(roomId, user) {
  const room = db.rooms.find((r) => r.id === roomId);
  if (!room) return { error: "Room not found." };
  const group = db.groups.find((g) => g.id === room.groupId);
  if (!group) return { error: "Group not found." };
  if (!group.members.includes(user.id)) {
    return { error: "Members of this group only." };
  }
  return { room, group };
}

function occupants(roomId, group) {
  const ids = [...(occupancy.get(roomId)?.keys() ?? [])];
  return ids
    .map((id) => db.users.find((u) => u.id === id))
    .filter(Boolean)
    .sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName))
    .map((u) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      isAdmin: group.admins.includes(u.id),
      profilePicture: u.profilePicture ?? null,
    }));
}

function addOccupant(roomId, userId, socketId) {
  if (!occupancy.has(roomId)) occupancy.set(roomId, new Map());
  const room = occupancy.get(roomId);
  if (!room.has(userId)) room.set(userId, new Set());
  const sockets = room.get(userId);
  const first = sockets.size === 0;
  sockets.add(socketId);
  return first;
}

function removeOccupant(roomId, userId, socketId) {
  const room = occupancy.get(roomId);
  if (!room) return false;
  const sockets = room.get(userId);
  if (!sockets) return false;
  sockets.delete(socketId);
  if (sockets.size > 0) return false;
  room.delete(userId);
  if (room.size === 0) occupancy.delete(roomId);
  return true;
}

function attachSockets(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: "http://localhost:4200" },
  });

  io.use(identifySocket);

  io.on("connection", (socket) => {
    const user = socket.data.user;

    socket.on("room:join", (payload, ack) => {
      const roomId = payload?.roomId;
      if (typeof roomId !== "string") return reply(ack, { error: "roomId is required." });
      const ctx = findRoomContext(roomId, user);
      if (ctx.error) return reply(ack, { error: ctx.error });

      socket.join(roomId);
      const first = addOccupant(roomId, user.id, socket.id);
      const users = occupants(roomId, ctx.group);
      socket.emit("presence:update", { roomId, users });
      if (first) {
        socket.to(roomId).emit("presence:joined", { roomId, userName: displayName(user) });
        socket.to(roomId).emit("presence:update", { roomId, users });
      }
      reply(ack, { ok: true });
    });

    socket.on("room:leave", (payload, ack) => {
      const roomId = payload?.roomId;
      if (typeof roomId !== "string") return reply(ack, { error: "roomId is required." });
      leaveRoom(io, socket, user, roomId);
      reply(ack, { ok: true });
    });

    socket.on("message:send", async (payload, ack) => {
      const roomId = payload?.roomId;
      if (typeof roomId !== "string") return reply(ack, { error: "roomId is required." });
      if (!socket.rooms.has(roomId)) return reply(ack, { error: "Join the room before sending." });
      const ctx = findRoomContext(roomId, user);
      if (ctx.error) return reply(ack, { error: ctx.error });

      const result = await persistMessage(ctx.room, user, payload);
      if (result.error) return reply(ack, { error: result.error });
      io.to(roomId).emit("message:new", { message: result.message });
      reply(ack, { ok: true });
    });

    socket.on("message:delete", async (payload, ack) => {
      const roomId = payload?.roomId;
      const messageId = payload?.messageId;
      if (typeof roomId !== "string" || typeof messageId !== "string") {
        return reply(ack, { error: "roomId and messageId are required." });
      }
      if (!socket.rooms.has(roomId)) return reply(ack, { error: "Join the room first." });
      const ctx = findRoomContext(roomId, user);
      if (ctx.error) return reply(ack, { error: ctx.error });

      const result = await deleteOwnMessage(roomId, messageId, user.id);
      if (result.error) return reply(ack, { error: result.error });
      io.to(roomId).emit("message:deleted", { messageId });
      reply(ack, { ok: true });
    });

    socket.on("disconnecting", () => {
      for (const roomId of socket.rooms) {
        if (roomId === socket.id) continue;
        leaveRoom(io, socket, user, roomId);
      }
    });
  });

  return io;
}

function leaveRoom(io, socket, user, roomId) {
  const last = removeOccupant(roomId, user.id, socket.id);
  socket.leave(roomId);
  if (!last) return;
  const room = db.rooms.find((r) => r.id === roomId);
  const group = room ? db.groups.find((g) => g.id === room.groupId) : null;
  io.to(roomId).emit("presence:left", { roomId, userName: displayName(user) });
  if (group) io.to(roomId).emit("presence:update", { roomId, users: occupants(roomId, group) });
}

module.exports = { attachSockets };
