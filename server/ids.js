// server/ids.js
// ID generator. Every entity carries a UUID prefixed by its type (§4):
// u- user, g- group, r- room, q- request, b- banned account, a- audit entry,
// m- message. The prefix makes IDs self-describing in logs.

const crypto = require("crypto");

const PREFIXES = {
  user: "u",
  group: "g",
  room: "r",
  request: "q",
  bannedAccount: "b",
  auditEntry: "a",
  message: "m",
};

// randomUUID gives collision-safe IDs without another dependency.
function newId(entity) {
  const prefix = PREFIXES[entity];
  if (!prefix) throw new Error(`Unknown entity type: ${entity}`);
  return `${prefix}-${crypto.randomUUID()}`;
}

module.exports = { newId };
