// server/storage.js
// In-memory store backed by MongoDB. Same shape as Phase 1: collections are
// loaded once at startup, handlers mutate db.*, then save() rewrites that
// collection. Mongo's _id is stripped so the rest of the app still uses `id`.

const { COLLECTIONS, collection } = require("./mongo");

const db = {};

function withoutMongoId(doc) {
  const { _id, ...rest } = doc;
  return rest;
}

async function load() {
  for (const name of COLLECTIONS) {
    const docs = await collection(name).find().toArray();
    db[name] = docs.map(withoutMongoId);
  }
}

async function save(name) {
  if (!COLLECTIONS.includes(name)) {
    throw new Error(`Unknown collection: ${name}`);
  }
  const col = collection(name);
  await col.deleteMany({});
  const docs = (db[name] ?? []).map(withoutMongoId);
  if (docs.length > 0) await col.insertMany(docs);
}

module.exports = { db, load, save, COLLECTIONS };
