// server/scripts/seed.js
// `npm run seed` — overwrites the live data files with the committed sample
// data in server/seed/. Used to get a demonstrable state back quickly during
// marking, and after `npm run reset` while developing.
//
// Every seed account signs in with the password "Passw0rd1" (the example
// password used in Phase1.md §6). The stored values are real bcrypt hashes.

const fs = require("fs");
const path = require("path");
const { COLLECTIONS, DATA_DIR } = require("../storage");

const SEED_DIR = path.join(__dirname, "..", "seed");

for (const name of COLLECTIONS) {
  const source = path.join(SEED_DIR, `${name}.json`);
  fs.copyFileSync(source, path.join(DATA_DIR, `${name}.json`));
  console.log(`Seeded ${name}.json`);
}
console.log("Seed complete.");
