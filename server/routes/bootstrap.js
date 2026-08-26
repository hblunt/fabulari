// server/routes/bootstrap.js
// First-run onboarding (Phase1.md §6 "Bootstrap"). GET tells the client
// whether to show the onboarding screen; POST creates the single super admin.
// The whole flow is one-time only: any POST after a user exists returns 409,
// which is what permanently disables onboarding (§3 "System initialisation").

const express = require("express");
const { db } = require("../storage");
const { fail } = require("../errors");
const { validateNewUser, createUser, toPublicUser } = require("../users");

const router = express.Router();

// "Does the system need bootstrapping?" is simply "are there zero users?" —
// no flag to store, so it can never disagree with reality.
router.get("/", (req, res) => {
  res.json({ required: db.users.length === 0 });
});

router.post("/", (req, res) => {
  if (db.users.length > 0) {
    return fail(res, 409, "Bootstrap has already been completed.");
  }

  const problem = validateNewUser(req.body);
  if (problem) return fail(res, 400, problem);

  const user = createUser(req.body, "SUPER_ADMIN");
  res.status(201).json({ user: toPublicUser(user) });
});

module.exports = router;
