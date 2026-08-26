// server/scripts/reset.js
// `npm run reset` — empties every data file back to a top-level empty array.
// With no users in the system the client's bootstrap check comes back
// { required: true }, so a reset is also how you re-run first-time onboarding.

const fs = require("fs");
const path = require("path");
const { COLLECTIONS, DATA_DIR } = require("../storage");

for (const name of COLLECTIONS) {
  fs.writeFileSync(path.join(DATA_DIR, `${name}.json`), "[]\n");
  console.log(`Emptied ${name}.json`);
}
console.log("Reset complete. The next app start will require bootstrap.");
