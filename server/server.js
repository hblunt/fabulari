// server/server.js
// Express entry point. Mongo is the source of truth: connect, load collections
// into memory, then listen. A missing database is a hard start failure.

const http = require("http");
const express = require("express");
const cors = require("cors");
const { load } = require("./storage");
const { connect, isConnected } = require("./mongo");
const { identifyUser } = require("./middleware");
const { attachSockets } = require("./sockets");
const bootstrapRouter = require("./routes/bootstrap");
const authRouter = require("./routes/auth");
const requestsRouter = require("./routes/requests");
const groupsRouter = require("./routes/groups");
const roomsRouter = require("./routes/rooms");
const usersRouter = require("./routes/users");
const bannedAccountsRouter = require("./routes/banned-accounts");
const auditRouter = require("./routes/audit");

const app = express();
const PORT = 3000;

// Allow browser requests from `ng serve` (http://localhost:4200).
// During normal Angular development the proxy is used instead, so CORS is not hit.
app.use(
  cors({
    origin: "http://localhost:4200",
  })
);

app.use(express.json());

// Resolve the X-User-Id header to a user record on every request (§6).
app.use(identifyUser);

app.get("/api/health", (req, res) => {
  res.json({ ok: true, mongo: isConnected() });
});

// Feature routes, one router per area (§6). Stage 1: onboarding and auth.
app.use("/api/bootstrap", bootstrapRouter);
app.use("/api/auth", authRouter);
app.use("/api/requests", requestsRouter);
app.use("/api/groups", groupsRouter);
app.use("/api/rooms", roomsRouter);
app.use("/api/users", usersRouter);
app.use("/api/banned-accounts", bannedAccountsRouter);
app.use("/api/audit", auditRouter);

async function start() {
  await connect();
  await load();
  const httpServer = http.createServer(app);
  attachSockets(httpServer);
  httpServer.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start. Is MongoDB running?", err.message);
  process.exit(1);
});
