// server/storage.js
// In-memory store backed by JSON files (Phase1.md §4 "Server-side persistence").
// Every collection is read into memory once at startup; after any mutation the
// whole file is written back, so the disk always matches the running state.
// Phase 2 replaces this module with MongoDB — nothing else should touch the fs.

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");

// One file per entity, each holding a top-level array (§4).
const COLLECTIONS = [
  "users",
  "groups",
  "rooms",
  "requests",
  "bannedAccounts",
  "auditLog",
];

// The single in-memory copy of the database. Route handlers read and mutate
// these arrays directly, then call save() to flush the change to disk.
const db = {};

function fileFor(collection) {
  return path.join(DATA_DIR, `${collection}.json`);
}

// Load every collection at startup. A missing or corrupt file is a setup
// error, so failing loudly here beats limping on with silent data loss.
function load() {
  for (const name of COLLECTIONS) {
    db[name] = JSON.parse(fs.readFileSync(fileFor(name), "utf8"));
  }
}

// Write one collection back in full. Files are small in Phase 1, so a full
// rewrite is simpler and safer than tracking partial diffs.
function save(collection) {
  if (!COLLECTIONS.includes(collection)) {
    throw new Error(`Unknown collection: ${collection}`);
  }
  // Two-space indent keeps the committed files readable in the marking repo.
  fs.writeFileSync(fileFor(collection), JSON.stringify(db[collection], null, 2) + "\n");
}

module.exports = { db, load, save, COLLECTIONS, DATA_DIR };
