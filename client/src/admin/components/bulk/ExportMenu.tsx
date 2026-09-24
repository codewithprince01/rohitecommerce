import React, { useEffect, useRef, useState } from 'react';
import { FileSpreadsheet, FileText, ChevronDown, Download, Loader2 } from 'lucide-react';
import Button from '../ui/Button';
import { useToast } from '../../hooks/useToast';
import { downloadInventorySheet, type SheetFormat } from '../../lib/services/inventory.service';

interface ExportMenuProps {
  /** Applied to the export so the file matches what the table is showing. */
  filters?: Record<string, string | number | boolean | undefined>;
  label?: string;
}

/**
 * Download the editable sheet.
 *
 * Kept separate from the template menu on purpose: this file carries the ids of
 * things that already exist, the template is blank and makes new ones. Two
 * buttons, two files, no chance of feeding one to the other's importer.
 */
export default function ExportMenu({ filters = {}, label = 'Export' }: ExportMenuProps) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<SheetFormat | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

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

  const download = async (format: SheetFormat) => {
    setBusy(format);
    try {
      await downloadInventorySheet(format, filters);
      toast.success(`${format.toUpperCase()} sheet downloaded`);
      setOpen(false);
    } catch (err: any) {
      toast.error(err?.message ?? 'Export failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="relative" ref={wrapRef}>
      <Button
        variant="outline"
        icon={<Download size={16} />}
        onClick={() => setOpen((v) => !v)}
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
            <p className="text-sm font-semibold text-neutral-800">Editable sheet</p>
            <p className="text-xs text-neutral-500 mt-0.5">
              Everything you already have, with its ids. Edit it and upload it back to update in place.
            </p>
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
              <p className="text-xs text-neutral-400">With a "How to use" sheet</p>
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
        </div>
      )}
    </div>
  );
}
