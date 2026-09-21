/**
 * Image uploads — posts a file to the backend's `/uploads/image` endpoint and
 * gets back a URL that goes into the very same `image` field a pasted link
 * would fill, so nothing downstream cares how the picture arrived.
 */
import { api, apiUpload } from '../api';

export interface UploadedImage {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}

/** Extensions the backend accepts; also drives the file picker's filter. */
export const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/png,image/webp,image/gif,image/avif';

export const MAX_IMAGE_MB = 5;

export function uploadImage(file: File): Promise<UploadedImage> {
  const form = new FormData();
  form.append('file', file);
  return apiUpload<UploadedImage>('/uploads/image', form);
}

/**
 * Remove a file we uploaded. Best-effort: the backend ignores anything that is
 * not one of its own uploads, so passing an external link is harmless.
 */
export function deleteUploadedImage(url: string): Promise<{ deleted: boolean }> {
  return api.delete<{ deleted: boolean }>(`/uploads/image?url=${encodeURIComponent(url)}`);
}

/** True when this URL points at a file the backend stores (vs. a pasted link). */
export function isUploadedImage(url: string): boolean {
  return /\/uploads\/images\//.test(url);
}
