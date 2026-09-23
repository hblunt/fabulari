// server/messages.js
// Chat messages (Phase2.md §4 Message, §6 GET last 5).
// Every message is stored in Mongo. GET still returns at most five so a
// joining user has context; older rows stay in the database and in the
// client's own history.

const { db, save } = require("./storage");
const { newId } = require("./ids");
const { isStoredImage, removeUpload } = require("./uploads");

const MESSAGE_TYPES = ["TEXT", "IMAGE"];

function lastFive(roomId) {
  return db.messages
    .filter((m) => m.roomId === roomId)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .slice(-5);
}

async function persistMessage(room, author, { type, content }) {
  if (!MESSAGE_TYPES.includes(type)) {
    return { status: 400, error: "Message type must be TEXT or IMAGE." };
  }
  if (typeof content !== "string" || !content.trim()) {
    return { status: 400, error: "Message content is required." };
  }
  const body = content.trim();
  if (type === "IMAGE" && !isStoredImage(body)) {
    return { status: 400, error: "Upload the image before sending it." };
  }

  const message = {
    id: newId("message"),
    roomId: room.id,
    authorId: author.id,
    authorName: `${author.firstName} ${author.lastName}`,
    authorPicture: author.profilePicture ?? null,
    type,
    content: body,
    timestamp: new Date().toISOString(),
  };
  db.messages.push(message);
  await save("messages");
  return { message };
}

async function deleteOwnMessage(roomId, messageId, userId) {
  const message = db.messages.find((m) => m.id === messageId && m.roomId === roomId);
  if (!message) return { status: 404, error: "Message not found." };
  if (message.authorId !== userId) {
    return { status: 403, error: "You can only delete your own messages." };
  }
  if (message.type === "IMAGE") removeUpload(message.content);
  db.messages = db.messages.filter((m) => m.id !== messageId);
  await save("messages");
  return { ok: true };
}

async function deleteMessagesForRoom(roomId) {
  const gone = db.messages.filter((m) => m.roomId === roomId);
  if (gone.length === 0) return;
  for (const message of gone) {
    if (message.type === "IMAGE") removeUpload(message.content);
  }
  db.messages = db.messages.filter((m) => m.roomId !== roomId);
  await save("messages");
}

module.exports = { lastFive, persistMessage, deleteOwnMessage, deleteMessagesForRoom };
