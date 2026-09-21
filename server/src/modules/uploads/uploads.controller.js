import fs from 'node:fs';
import path from 'node:path';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { created, ok } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { env } from '../../config/env.js';
import { UPLOAD_ROOT, IMAGE_SUBDIR } from './uploads.storage.js';

/** Absolute URL for a stored file, so a client on another origin can load it. */
function publicUrlFor(req, filename) {
  const base = env.upload.publicUrl || `${req.protocol}://${req.get('host')}`;
  return `${base}/uploads/${IMAGE_SUBDIR}/${filename}`;
}

/**
 * Store one image and hand back its URL. The admin UI drops that URL straight
 * into the same `image` field a pasted link would fill, so nothing downstream
 * has to know whether a picture was uploaded or linked.
 */
export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('Choose an image to upload.');
  const { filename, size, mimetype } = req.file;
  return created(res, {
    url: publicUrlFor(req, filename),
    filename,
    size,
    mimetype,
  });
});

/**
 * Delete a previously uploaded image by its URL or filename. Only files inside
 * the upload folder can be removed — anything else (an external link the admin
 * merely pasted) is reported as a no-op rather than touching the filesystem.
 */
export const deleteImage = asyncHandler(async (req, res) => {
  const target = String(req.query.url || req.query.filename || '').trim();
  if (!target) throw ApiError.badRequest('Pass the image url to delete.');

  const name = path.basename(target.split('?')[0]);
  const marker = `/uploads/${IMAGE_SUBDIR}/`;
  if (!name || (target.includes('/') && !target.includes(marker))) {
    return ok(res, { deleted: false, reason: 'not an uploaded file' });
  }

  const fullPath = path.join(UPLOAD_ROOT, IMAGE_SUBDIR, name);
  // Re-check after joining: a crafted name must not escape the upload folder.
  if (!fullPath.startsWith(path.join(UPLOAD_ROOT, IMAGE_SUBDIR) + path.sep)) {
    throw ApiError.badRequest('Invalid file name.');
  }

  try {
    await fs.promises.unlink(fullPath);
    return ok(res, { deleted: true });
  } catch (err) {
    if (err.code === 'ENOENT') return ok(res, { deleted: false, reason: 'already gone' });
    throw err;
  }
});
