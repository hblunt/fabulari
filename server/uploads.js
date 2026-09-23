// server/uploads.js
// Shared image save for profile pictures and chat images (Phase2.md §3).
// PNG, JPEG or GIF, 2MB. The file is checked by its bytes, not just the
// name the browser sent. Only the filename is stored on the user or message.

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const { fail } = require("./errors");

const UPLOAD_DIR = path.join(__dirname, "uploads");
const MAX_BYTES = 2 * 1024 * 1024;
const TYPES = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
};
const SAFE_NAME = /^[A-Za-z0-9._-]+$/;

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES },
  fileFilter(req, file, cb) {
    if (!TYPES[file.mimetype]) {
      cb(new Error("Images must be PNG, JPEG or GIF."));
      return;
    }
    cb(null, true);
  },
});

function sniff(buf) {
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return "png";
  }
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  const head = buf.subarray(0, 6).toString("ascii");
  if (head === "GIF87a" || head === "GIF89a") return "gif";
  return null;
}

function imageUpload(req, res, next) {
  upload.single("image")(req, res, (err) => {
    if (err) {
      const tooBig = err.code === "LIMIT_FILE_SIZE";
      return fail(res, 400, tooBig ? "Images must be 2MB or smaller." : err.message);
    }
    if (!req.file) return fail(res, 400, "An image file is required.");
    const ext = sniff(req.file.buffer);
    if (!ext || ext !== TYPES[req.file.mimetype]) {
      return fail(res, 400, "Images must be PNG, JPEG or GIF.");
    }
    req.file.ext = ext;
    next();
  });
}

function saveUpload(file) {
  const filename = `img-${crypto.randomUUID()}.${file.ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), file.buffer);
  return filename;
}

function removeUpload(filename) {
  if (typeof filename !== "string" || !SAFE_NAME.test(filename)) return;
  const full = path.join(UPLOAD_DIR, filename);
  if (fs.existsSync(full)) fs.unlinkSync(full);
}

function isStoredImage(filename) {
  if (typeof filename !== "string" || !SAFE_NAME.test(filename)) return false;
  return fs.existsSync(path.join(UPLOAD_DIR, filename));
}

module.exports = { UPLOAD_DIR, imageUpload, saveUpload, removeUpload, isStoredImage };
