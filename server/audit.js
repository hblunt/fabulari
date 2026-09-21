// server/audit.js
// Audit log writer (Phase1.md §4 "Audit entry").
//
// Entries snapshot the actor's name and email rather than referencing the user
// by ID: if they held references, deleting a user would blank their history in
// the very log the super admin reviews. targetLabel is likewise a plain string
// ("Group: Board Games") so the entry outlives the entity it describes.

const { db, save } = require("./storage");
const { newId } = require("./ids");

function writeAudit(actor, type, targetLabel, detail = "") {
  db.auditLog.push({
    id: newId("auditEntry"),
    type,
    actorName: `${actor.firstName} ${actor.lastName}`,
    actorEmail: actor.email,
    targetLabel,
    detail,
    timestamp: new Date().toISOString(),
  });
  return save("auditLog");
}

module.exports = { writeAudit };
