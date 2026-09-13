import React from 'react';
import { ImageOff } from 'lucide-react';
import { Input } from './FormField';

interface ImageUrlInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// Paste-a-URL image field with live preview (no upload backend needed).
export default function ImageUrlInput({ value, onChange, placeholder }: ImageUrlInputProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-16 h-16 rounded-xl bg-neutral-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-neutral-200">
        {value ? (
          <img
            src={value}
            alt="preview"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <ImageOff size={20} className="text-neutral-300" />
        )}
      </div>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'https://…/image.jpg'}
      />
    </div>
  );
}
