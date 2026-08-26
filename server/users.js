// server/users.js
// User creation and validation shared by the two account-creation paths
// (bootstrap and register, Phase1.md §6). Both must apply identical password
// rules and hashing, so the logic lives once here rather than in each route.

const bcrypt = require("bcrypt");
const { db, save } = require("./storage");
const { newId } = require("./ids");

// 10 rounds is the bcrypt default cost: slow enough to resist brute force,
// fast enough not to make login sluggish.
const BCRYPT_ROUNDS = 10;

// Password rules (§3 "Accounts and authentication"): minimum 8 characters,
// at least one uppercase letter, alphanumeric.
function validatePassword(password) {
  if (typeof password !== "string" || password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (!/^[A-Za-z0-9]+$/.test(password)) {
    return "Password must contain letters and numbers only.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter.";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number.";
  }
  return null; // Valid.
}

// Registration field checks shared by bootstrap and register. Returns the
// first problem found, or null when the payload is acceptable.
function validateNewUser({ firstName, lastName, age, email, password }) {
  if (!firstName?.trim() || !lastName?.trim()) {
    return "First name and last name are required.";
  }
  // Age is self-reported (§3 assumption 1) but must still be a usable number,
  // because group age limits compare against it.
  if (typeof age !== "number" || !Number.isFinite(age) || age < 1) {
    return "Age must be a positive number.";
  }
  if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    return "A valid email address is required.";
  }
  return validatePassword(password);
}

// Emails are compared case-insensitively everywhere (login, uniqueness,
// ban blacklist), so they are stored normalised once at creation.
function normaliseEmail(email) {
  return email.trim().toLowerCase();
}

// Creates and persists a user. Assumes the payload has passed validateNewUser.
function createUser({ firstName, lastName, age, email, password }, role) {
  const user = {
    id: newId("user"),
    email: normaliseEmail(email),
    passwordHash: bcrypt.hashSync(password, BCRYPT_ROUNDS),
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    age,
    role,
    profilePicture: null,
    groups: [],
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  save("users");
  return user;
}

// The API never returns the hash (§6 conventions) — every route that responds
// with a user must pass it through here.
function toPublicUser(user) {
  const { passwordHash, ...publicUser } = user;
  return publicUser;
}

module.exports = {
  validatePassword,
  validateNewUser,
  normaliseEmail,
  createUser,
  toPublicUser,
};
