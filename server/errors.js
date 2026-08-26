// server/errors.js
// Error responses follow one shape everywhere: a status code plus
// { "error": "<message>" } (Phase1.md §6 "Conventions"). Centralising it
// keeps handlers to one line and guarantees the client can always read
// body.error regardless of which endpoint failed.
//
// Status codes used across the API:
//   400 validation failure   401 no caller / bad credentials
//   403 not permitted        404 entity does not exist
//   409 conflict

function fail(res, status, message) {
  res.status(status).json({ error: message });
}

module.exports = { fail };
