// server/server.js
// Express entry point. Stage 0 wires the foundations — storage, caller
// identification and the health check. Feature routes arrive per stage
// (auth in Stage 1, requests in Stage 2, ...). MongoDB/sockets are Phase 2.

const express = require("express");
const cors = require("cors");
const { load } = require("./storage");
const { identifyUser } = require("./middleware");
const bootstrapRouter = require("./routes/bootstrap");
const authRouter = require("./routes/auth");
const requestsRouter = require("./routes/requests");
const groupsRouter = require("./routes/groups");

// Read every JSON collection into memory before accepting requests, so route
// handlers can treat db.* arrays as the single source of truth.
load();

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
  res.json({ ok: true });
});

// Feature routes, one router per area (§6). Stage 1: onboarding and auth.
app.use("/api/bootstrap", bootstrapRouter);
app.use("/api/auth", authRouter);
app.use("/api/requests", requestsRouter);
app.use("/api/groups", groupsRouter);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
