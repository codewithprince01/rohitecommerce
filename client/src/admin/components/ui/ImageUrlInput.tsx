import React, { useEffect, useRef, useState } from 'react';
import { ImageOff, Loader2, Link2, UploadCloud, X } from 'lucide-react';
import { Input } from './FormField';
import {
  uploadImage,
  deleteUploadedImage,
  isUploadedImage,
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_MB,
} from '../../lib/services/uploads.service';

interface ImageUrlInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

type Mode = 'upload' | 'link';

/**
 * Image field with two equal ways in: upload a file from the device, or paste a
 * link. Both end up as a URL in the same `value`, so every form that stores an
 * `image` string keeps working untouched.
 *
 * Nothing is ever filled in automatically — an empty field stays empty until
 * the admin picks a picture, because an invented stock photo would misrepresent
 * what is actually being sold.
 */
export default function ImageUrlInput({ value, onChange, placeholder, disabled }: ImageUrlInputProps) {
  const [mode, setMode] = useState<Mode>('upload');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [broken, setBroken] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // A new URL deserves a fresh attempt at loading it: without this a single
  // failed preview would keep showing the error tile for every later value.
  useEffect(() => {
    setBroken(false);
  }, [value]);

  const handleFile = async (file: File | undefined | null) => {
    if (!file) return;
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('That file is not an image.');
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setError(`The image is larger than ${MAX_IMAGE_MB} MB.`);
      return;
    }
    setBusy(true);
    try {
      const uploaded = await uploadImage(file);
      onChange(uploaded.url);
    } catch (err: any) {
      setError(err?.message ?? 'Upload failed. Try again.');
    } finally {
      setBusy(false);
      // Let the same file be chosen again after a failure.
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const clear = () => {
    const current = value;
    setError(null);
    onChange('');
    // Best-effort cleanup so cancelled uploads don't pile up on disk; a pasted
    // link is left alone by the backend.
    if (current && isUploadedImage(current)) deleteUploadedImage(current).catch(() => undefined);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (disabled || busy) return;
    handleFile(e.dataTransfer.files?.[0]);
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-start gap-3">
        {/* Preview */}
        <div className="relative w-20 h-20 flex-shrink-0">
          <div className="w-full h-full rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center overflow-hidden">
            {busy ? (
              <Loader2 size={20} className="animate-spin text-primary-600" />
            ) : value && !broken ? (
              <img
                src={value}
                alt="preview"
                className="w-full h-full object-cover"
                onError={() => setBroken(true)}
              />
            ) : (
              <ImageOff size={20} className="text-neutral-300" />
            )}
          </div>
          {value && !busy && !disabled && (
            <button
              type="button"
              onClick={clear}
              title="Remove image"
              aria-label="Remove image"
              className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-white border border-neutral-200 shadow-sm flex items-center justify-center text-neutral-500 hover:text-rose-600 hover:border-rose-200"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          {/* Source switch */}
          <div className="inline-flex p-0.5 bg-neutral-100 rounded-lg">
            {([
              ['upload', 'Upload', UploadCloud],
              ['link', 'Paste link', Link2],
            ] as const).map(([key, label, Icon]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setMode(key);
                  setError(null);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  mode === key ? 'bg-white text-neutral-800 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>

          {mode === 'upload' ? (
            <>
              <input
                ref={fileRef}
                type="file"
                accept={ACCEPTED_IMAGE_TYPES}
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              <button
                type="button"
                disabled={disabled || busy}
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-dashed text-sm transition-colors disabled:opacity-60 ${
                  dragging
                    ? 'border-primary-400 bg-primary-50 text-primary-700'
                    : 'border-neutral-300 text-neutral-500 hover:border-primary-400 hover:text-primary-700'
                }`}
              >
                {busy ? <Loader2 size={15} className="animate-spin" /> : <UploadCloud size={15} />}
                {busy ? 'Uploading…' : 'Choose a file or drop it here'}
              </button>
              {value ? (
                <p className="text-xs text-neutral-400 truncate" title={value}>
                  {isUploadedImage(value) ? 'Uploaded: ' : 'Current: '}
                  {value.split('/').pop()}
                </p>
              ) : (
                <p className="text-xs text-neutral-400">
                  JPG, PNG, WEBP, GIF or AVIF · up to {MAX_IMAGE_MB} MB
                </p>
              )}
            </>
          ) : (
            <Input
              value={value}
              disabled={disabled || busy}
              onChange={(e) => {
                setError(null);
                onChange(e.target.value);
              }}
              placeholder={placeholder ?? 'https://…/image.jpg'}
            />
          )}
        </div>
      </div>

      {error && <p className="text-xs text-rose-500">{error}</p>}
      {!error && broken && value && (
        <p className="text-xs text-amber-600">That link did not load — check the URL or upload the file instead.</p>
      )}
    </div>
  );
}
