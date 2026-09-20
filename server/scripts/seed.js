// server/scripts/seed.js
// `npm run seed` — restores the committed sample data.
// Copies server/seed/*.json into server/data/ so the live JSON API still
// works, and upserts the same documents into Mongo for Stage 0+.
//
// Every seed account signs in with the password "Passw0rd1" (the example
// password used in Phase1.md §6). The stored values are real bcrypt hashes.

const fs = require("fs");
const path = require("path");
const { COLLECTIONS: JSON_COLLECTIONS, DATA_DIR } = require("../storage");
const { COLLECTIONS, connect, collection, close } = require("../mongo");

const SEED_DIR = path.join(__dirname, "..", "seed");

async function seedMongo() {
  await connect();
  for (const name of COLLECTIONS) {
    const source = path.join(SEED_DIR, `${name}.json`);
    const docs = fs.existsSync(source) ? JSON.parse(fs.readFileSync(source, "utf8")) : [];
    await collection(name).deleteMany({});
    if (docs.length > 0) await collection(name).insertMany(docs);
    console.log(`Seeded Mongo collection ${name} (${docs.length})`);
  }
}

function seedJson() {
  for (const name of JSON_COLLECTIONS) {
    const source = path.join(SEED_DIR, `${name}.json`);
    fs.copyFileSync(source, path.join(DATA_DIR, `${name}.json`));
    console.log(`Seeded ${name}.json`);
  }
}

seedJson();
seedMongo()
  .then(() => {
    console.log("Seed complete.");
    return close();
  })
  .catch(async (err) => {
    console.error("Seed failed:", err.message);
    await close();
    process.exit(1);
  });
