// server/server.js
// Phase 1 API only: CORS for the Angular origin, JSON bodies, and a health check.
// User management and JSON-file persistence will be added later; MongoDB/sockets in Phase 2.

const express = require("express");
const cors = require("cors");

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

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
