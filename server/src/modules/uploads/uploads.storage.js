/**
 * Disk storage for admin image uploads.
 *
 * Images land in `<UPLOAD_DIR>/images` and are served read-only by the static
 * `/uploads` mount in app.js. Names are generated rather than taken from the
 * client, so an upload can never overwrite an existing file or smuggle a path
 * segment into the folder.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';

export const UPLOAD_ROOT = path.resolve(process.cwd(), env.upload.dir);
export const IMAGE_SUBDIR = 'images';
const IMAGE_DIR = path.join(UPLOAD_ROOT, IMAGE_SUBDIR);

// SVG is deliberately excluded: it can carry script, and these files are served
// from the API origin where a stored script would run with its privileges.
const ALLOWED_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
};

export const MAX_MB = Math.max(1, env.upload.maxMb);

fs.mkdirSync(IMAGE_DIR, { recursive: true });

/** `banner-1712-3f9a2c.webp` — readable in the folder, impossible to collide. */
function generateName(originalname, mimetype) {
  const base = path
    .basename(originalname, path.extname(originalname))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'image';
  const ext = ALLOWED_MIME[mimetype] ?? '.jpg';
  return `${base}-${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}${ext}`;
}

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, IMAGE_DIR);
  },
  filename(_req, file, cb) {
    cb(null, generateName(file.originalname, file.mimetype));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_MB * 1024 * 1024, files: 1 },
  fileFilter(_req, file, cb) {
    if (!ALLOWED_MIME[file.mimetype]) {
      return cb(
        ApiError.badRequest(
          `"${file.originalname}" is not a supported image. Use JPG, PNG, WEBP, GIF or AVIF.`
        )
      );
    }
    return cb(null, true);
  },
});

/** Translate multer's own errors into the API's error envelope. */
export const uploadSingleImage = (req, res, next) =>
  upload.single('file')(req, res, (err) => {
    if (!err) return next();
    if (err instanceof ApiError) return next(err);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(ApiError.badRequest(`The image is too large. Maximum size is ${MAX_MB} MB.`));
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(ApiError.badRequest('Send the image in a form field named "file".'));
    }
    return next(ApiError.badRequest(err.message || 'The uploaded image could not be read.'));
  });
