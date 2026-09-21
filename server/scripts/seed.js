// server/scripts/seed.js
// `npm run seed` — restores the committed sample data into Mongo.
// Source files live in server/seed/*.json; they are not the live store.
//
// Every seed account signs in with the password "Passw0rd1" (the example
// password used in Phase1.md §6). The stored values are real bcrypt hashes.

const fs = require("fs");
const path = require("path");
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
