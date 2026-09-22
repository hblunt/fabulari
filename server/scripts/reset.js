// server/scripts/reset.js
// `npm run reset` — empties Mongo collections.
// With no users the client's bootstrap check comes back { required: true },
// so a reset is also how you re-run first-time onboarding.

const { COLLECTIONS, connect, collection, close } = require("../mongo");

async function resetMongo() {
  await connect();
  for (const name of COLLECTIONS) {
    const result = await collection(name).deleteMany({});
    console.log(`Emptied Mongo collection ${name} (${result.deletedCount})`);
  }
}

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
