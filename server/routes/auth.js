// server/routes/auth.js
// Registration and login (Phase1.md §6 "Authentication"). Phase 1 is
// deliberately simple: no tokens and no sessions — login just verifies the
// password and returns the user object the client stores in local storage.

const express = require("express");
const bcrypt = require("bcrypt");
const { db } = require("../storage");
const { fail } = require("../errors");
const {
  validateNewUser,
  normaliseEmail,
  createUser,
  toPublicUser,
} = require("../users");

const router = express.Router();

router.post("/register", (req, res) => {
  const problem = validateNewUser(req.body);
  if (problem) return fail(res, 400, problem);

  const email = normaliseEmail(req.body.email);

  // A system-banned email can never be reused (§3 "Moderation and bans"),
  // so the tombstone list is checked exactly like a live account.
  const isBanned = db.bannedAccounts.some((b) => b.email === email);
  const isTaken = db.users.some((u) => u.email === email);
  if (isBanned || isTaken) {
    return fail(res, 409, "This email address cannot be used.");
  }

  const user = createUser(req.body, "USER");
  res.status(201).json({ user: toPublicUser(user) });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== "string" || typeof password !== "string") {
    return fail(res, 400, "Email and password are required.");
  }

  const user = db.users.find((u) => u.email === normaliseEmail(email));

  // One message for both "no such user" and "wrong password", so the response
  // doesn't reveal which emails have accounts.
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return fail(res, 401, "Invalid email or password.");
  }

  res.json({ user: toPublicUser(user) });
});

module.exports = router;
