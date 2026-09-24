import React, { useEffect, useRef, useState } from 'react';
import { FileSpreadsheet, FileText, ChevronDown, UploadCloud, Loader2 } from 'lucide-react';
import Button from '../ui/Button';
import { useToast } from '../../hooks/useToast';
import { downloadTemplate, type BulkUploadType, type TemplateFormat } from '../../lib/services/bulkUpload.service';

interface TemplateMenuProps {
  /** Which template this page works with. */
  type: BulkUploadType;
  /** Shown above the format choices so it is obvious what the file covers. */
  label?: string;
  /** Opens the import dialog — the upload no longer lives on its own page. */
  onUpload?: () => void;
}

const COPY: Record<BulkUploadType, { title: string; hint: string }> = {
  products: {
    title: 'Product upload template',
    hint: 'Categories, sub-sub categories, products, pack sizes, prices & images.',
  },
  catalog: {
    title: 'Category upload template',
    hint: 'Category → subcategory → sub-sub category hierarchy with images.',
  },
};

/**
 * Download-template dropdown shared by the Products and Categories pages, so
 * the template is reachable from wherever the admin is already working instead
 * of only from the Bulk Upload screen.
 */
export default function TemplateMenu({ type, label = 'Template', onUpload }: TemplateMenuProps) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<TemplateFormat | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape, like the rest of the console's popovers.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const download = async (format: TemplateFormat) => {
    setBusy(format);
    try {
      await downloadTemplate(type, format, true);
      toast.success(`${format.toUpperCase()} template downloaded`);
      setOpen(false);
    } catch (err: any) {
      toast.error(err?.message ?? 'Template download failed');
    } finally {
      setBusy(null);
    }
  };

  const copy = COPY[type];

  return (
    <div className="relative" ref={wrapRef}>
      <Button
        variant="outline"
        icon={<FileSpreadsheet size={16} />}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {label}
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </Button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-card-hover border border-neutral-100 p-2 z-50"
        >
          <div className="px-3 py-2">
            <p className="text-sm font-semibold text-neutral-800">{copy.title}</p>
            <p className="text-xs text-neutral-500 mt-0.5">{copy.hint}</p>
          </div>

          <button
            role="menuitem"
            onClick={() => download('xlsx')}
            disabled={!!busy}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-neutral-50 disabled:opacity-60"
          >
            {busy === 'xlsx' ? (
              <Loader2 size={16} className="animate-spin text-primary-600" />
            ) : (
              <FileSpreadsheet size={16} className="text-primary-600" />
            )}
            <div>
              <p className="text-sm font-medium text-neutral-800">Excel (.xlsx)</p>
              <p className="text-xs text-neutral-400">With instructions sheet &amp; examples</p>
            </div>
          </button>

          <button
            role="menuitem"
            onClick={() => download('csv')}
            disabled={!!busy}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-neutral-50 disabled:opacity-60"
          >
            {busy === 'csv' ? (
              <Loader2 size={16} className="animate-spin text-neutral-500" />
            ) : (
              <FileText size={16} className="text-neutral-500" />
            )}
            <div>
              <p className="text-sm font-medium text-neutral-800">CSV (.csv)</p>
              <p className="text-xs text-neutral-400">Plain text, opens anywhere</p>
            </div>
          </button>

          {onUpload && (
            <div className="border-t border-neutral-100 mt-1 pt-1">
              <button
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onUpload();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-neutral-50"
              >
                <UploadCloud size={16} className="text-neutral-500" />
                <p className="text-sm font-medium text-neutral-800">Upload a filled file…</p>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
