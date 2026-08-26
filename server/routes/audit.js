// server/routes/audit.js
// Read-only audit log (Phase1.md §6 "Audit log"). Super admin only.
// Entries are written as a side effect of other actions, never through here.

const express = require("express");
const { db } = require("../storage");
const { fail } = require("../errors");
const { requireSuperAdmin } = require("../middleware");

const router = express.Router();

router.use(requireSuperAdmin);

function bound(value, endOfDay) {
  if (value == null || value === "") return null;
  if (Array.isArray(value)) return { error: "Date filters must be a single value." };
  if (typeof value !== "string") return { error: "Date filters must be strings." };
  // Date-only `to` is inclusive of that day; ISO timestamps compare as strings.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return endOfDay ? `${value}T23:59:59.999Z` : value;
  }
  if (Number.isNaN(Date.parse(value))) return { error: "Date filters must be valid dates." };
  return value;
}

router.get("/", (req, res) => {
  const type = req.query.type;
  if (Array.isArray(type)) return fail(res, 400, "type must be a single value.");

  const from = bound(req.query.from, false);
  if (from?.error) return fail(res, 400, from.error);
  const to = bound(req.query.to, true);
  if (to?.error) return fail(res, 400, to.error);

  const entries = db.auditLog
    .filter((e) => !type || e.type === type)
    .filter((e) => !from || e.timestamp >= from)
    .filter((e) => !to || e.timestamp <= to)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  res.json({ entries });
});

module.exports = router;
