// server/age.js
// Date of birth is stored as YYYY-MM-DD. Age is never persisted — every gate
// and public user object calculates it from that calendar date so it moves
// with birthdays (Phase2.md assumption 1).

const DATE_OF_BIRTH_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseDateOfBirth(value) {
  if (typeof value !== "string") return null;
  const match = DATE_OF_BIRTH_PATTERN.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  // UTC construction plus a round-trip check rejects overflow dates such as
  // 2020-02-31, which the Date constructor would otherwise roll forward.
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day, iso: value };
}

function todayParts(now = new Date()) {
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  };
}

// Whole years completed as of local today. Uses the stored calendar date, not
// a timestamp, so timezone offset cannot shift someone across a birthday.
function ageFromDob(dateOfBirth, now = new Date()) {
  const parsed = parseDateOfBirth(dateOfBirth);
  if (!parsed) return null;
  const today = todayParts(now);
  let age = today.year - parsed.year;
  if (today.month < parsed.month || (today.month === parsed.month && today.day < parsed.day)) {
    age -= 1;
  }
  return age;
}

function validateDateOfBirth(dateOfBirth) {
  const parsed = parseDateOfBirth(dateOfBirth);
  if (!parsed) return "Date of birth must be a valid calendar date (YYYY-MM-DD).";

  const today = todayParts();
  const isFuture =
    parsed.year > today.year ||
    (parsed.year === today.year && parsed.month > today.month) ||
    (parsed.year === today.year && parsed.month === today.month && parsed.day > today.day);
  if (isFuture) return "Date of birth cannot be in the future.";

  const age = ageFromDob(parsed.iso);
  if (age === null || age < 1) return "You must be at least one year old.";
  return null;
}

module.exports = { ageFromDob, validateDateOfBirth };
