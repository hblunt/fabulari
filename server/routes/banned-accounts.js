// server/routes/banned-accounts.js
// Tombstone list (Phase1.md §6 "Banned accounts"). Super admin only.
// There is no un-ban and no write route — records appear on DELETE /api/users/:id.

const express = require("express");
const { db } = require("../storage");
const { requireSuperAdmin } = require("../middleware");

const router = express.Router();

router.use(requireSuperAdmin);

router.get("/", (req, res) => {
  const bannedAccounts = [...db.bannedAccounts].sort((a, b) =>
    b.bannedAt.localeCompare(a.bannedAt)
  );
  res.json({ bannedAccounts });
});

module.exports = router;
