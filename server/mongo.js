// server/mongo.js
// Native MongoDB driver connection (Phase 2 Stage 0). One client, one database,
// named collections. Mongoose is not used — the assignment forbids it.
// The live API still reads JSON until Stage 1; this module is the connection
// seed/reset/health use, and Stage 1 will switch storage over to it.

const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");

const COLLECTIONS = [
  "users",
  "groups",
  "rooms",
  "requests",
  "bannedAccounts",
  "auditLog",
  "messages",
];

const DEFAULT_URI = "mongodb://127.0.0.1:27017/fabulari";

let client;
let db;

function loadEnv() {
  const envPath = path.join(__dirname, ".env");
  if (fs.existsSync(envPath)) process.loadEnvFile(envPath);
}

function uri() {
  return process.env.MONGODB_URI || DEFAULT_URI;
}

async function connect() {
  if (db) return db;
  loadEnv();
  client = new MongoClient(uri());
  await client.connect();
  db = client.db();
  await ensureIndexes();
  return db;
}

function isConnected() {
  return Boolean(db);
}

function collection(name) {
  if (!db) throw new Error("Mongo is not connected.");
  if (!COLLECTIONS.includes(name)) throw new Error(`Unknown collection: ${name}`);
  return db.collection(name);
}

// Indexes for the lists that will grow: unique login email, chat history by
// room, request queues by type/status, audit by date.
async function ensureIndexes() {
  await collection("users").createIndex({ email: 1 }, { unique: true });
  await collection("messages").createIndex({ roomId: 1, timestamp: 1 });
  await collection("requests").createIndex({ type: 1, status: 1 });
  await collection("auditLog").createIndex({ timestamp: 1 });
}

async function close() {
  if (!client) return;
  await client.close();
  client = undefined;
  db = undefined;
}

module.exports = { COLLECTIONS, connect, collection, isConnected, close, loadEnv, uri };
