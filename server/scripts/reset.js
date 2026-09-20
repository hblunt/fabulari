// server/scripts/reset.js
// `npm run reset` — empties JSON data files and Mongo collections.
// With no users the client's bootstrap check comes back { required: true },
// so a reset is also how you re-run first-time onboarding.

const fs = require("fs");
const path = require("path");
const { COLLECTIONS: JSON_COLLECTIONS, DATA_DIR } = require("../storage");
const { COLLECTIONS, connect, collection, close } = require("../mongo");

function resetJson() {
  for (const name of JSON_COLLECTIONS) {
    fs.writeFileSync(path.join(DATA_DIR, `${name}.json`), "[]\n");
    console.log(`Emptied ${name}.json`);
  }
}

async function resetMongo() {
  await connect();
  for (const name of COLLECTIONS) {
    const result = await collection(name).deleteMany({});
    console.log(`Emptied Mongo collection ${name} (${result.deletedCount})`);
  }
}

resetJson();
resetMongo()
  .then(() => {
    console.log("Reset complete. The next app start will require bootstrap.");
    return close();
  })
  .catch(async (err) => {
    console.error("Reset failed:", err.message);
    await close();
    process.exit(1);
  });
