import React, { useRef, useState } from 'react';
import {
  FileSpreadsheet, FileText, UploadCloud, X, ShieldCheck, Upload,
  CheckCircle2, AlertTriangle, Info, KeyRound,
} from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import {
  downloadInventorySheet,
  importInventorySheet,
  type SheetFormat,
  type SheetImportResult,
} from '../../lib/services/inventory.service';

interface SheetSyncModalProps {
  open: boolean;
  onClose: () => void;
  /** Applied to the export so the sheet matches what the table is showing. */
  filters?: Record<string, string | number | boolean | undefined>;
  onImported: () => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

const MAX_MB = 10;

/**
 * Export inventory, edit it in Excel, upload it back.
 *
 * Rows are matched on their SKU ID, so the importer updates in place and can
 * never create a second copy of a SKU — renaming a product in the sheet is
 * safe, and re-uploading the same file twice changes nothing the second time.
 */
export default function SheetSyncModal({
  open,
  onClose,
  filters = {},
  onImported,
  onError,
  onSuccess,
}: SheetSyncModalProps) {
  const [busy, setBusy] = useState<'validate' | 'import' | SheetFormat | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<SheetImportResult | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setResult(null);
    setBusy(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const download = async (format: SheetFormat) => {
    setBusy(format);
    try {
      await downloadInventorySheet(format, filters);
      onSuccess(`${format.toUpperCase()} sheet downloaded`);
    } catch (err: any) {
      onError(err?.message ?? 'Export failed');
    } finally {
      setBusy(null);
    }
  };

  const acceptFile = (picked?: File | null) => {
    if (!picked) return;
    if (picked.size > MAX_MB * 1024 * 1024) {
      onError(`That file is larger than ${MAX_MB} MB.`);
      return;
    }
    setFile(picked);
    setResult(null);
  };

  const run = async (dryRun: boolean) => {
    if (!file) return;
    setBusy(dryRun ? 'validate' : 'import');
    try {
      const res = await importInventorySheet(file, dryRun);
      setResult(res);
      if (dryRun) {
        onSuccess(
          res.rows.failed
            ? `${res.rows.failed} row(s) would be skipped — nothing saved`
            : `${res.rows.updated} SKU(s) ready to update`
        );
      } else {
        onSuccess(`Updated ${res.rows.updated} SKU${res.rows.updated === 1 ? '' : 's'}`);
        onImported();
      }
    } catch (err: any) {
      onError(err?.message ?? 'Upload failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal open={open} onClose={close} title="Update inventory by sheet" size="lg">
      <div className="space-y-5">
        {/* How it works */}
        <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-primary-50/60 border border-primary-100">
          <KeyRound size={16} className="text-primary-600 shrink-0 mt-0.5" />
          <p className="text-xs text-primary-900 leading-relaxed">
            Every row carries a <span className="font-bold">SKU ID</span>. Rows are matched on that id, so you can
            rename a product in the sheet and it still updates the right SKU.{' '}
            <span className="font-semibold">Nothing is ever created or deleted here</span> — uploading the same file
            twice changes nothing the second time.
          </p>
        </div>

        {/* Step 1 — download */}
        <section>
          <StepTitle step={1} title="Download the current sheet" />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              icon={<FileSpreadsheet size={16} />}
              loading={busy === 'xlsx'}
              disabled={!!busy}
              onClick={() => download('xlsx')}
            >
              Excel (.xlsx)
            </Button>
            <Button
              variant="outline"
              icon={<FileText size={16} />}
              loading={busy === 'csv'}
              disabled={!!busy}
              onClick={() => download('csv')}
            >
              CSV (.csv)
            </Button>
          </div>
          <p className="text-xs text-neutral-400 mt-2">
            Editable columns: Selling Price, MRP, Stock Qty, Low Stock Alert At, Pack Active. The rest are there for
            reference and are ignored on upload.
          </p>
        </section>

        {/* Step 2 — upload */}
        <section>
          <StepTitle step={2} title="Upload the edited file" />
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              acceptFile(e.dataTransfer.files?.[0]);
            }}
            onClick={() => fileRef.current?.click()}
            className={`rounded-xl border border-dashed px-4 py-6 text-center cursor-pointer transition-colors ${
              dragging ? 'border-primary-400 bg-primary-50' : 'border-neutral-300 hover:border-primary-400'
            }`}
          >
            <UploadCloud size={22} className="mx-auto text-neutral-400 mb-1.5" />
            <p className="text-sm font-medium text-neutral-700">Choose a file or drop it here</p>
            <p className="text-xs text-neutral-400 mt-0.5">.xlsx or .csv · up to {MAX_MB} MB</p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xlsm,.tsv,.txt"
              className="hidden"
              onChange={(e) => {
                acceptFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </div>

          {file && (
            <div className="mt-3 flex items-center gap-3 px-3 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200">
              <FileSpreadsheet size={18} className="text-primary-600 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-neutral-800 truncate">{file.name}</p>
                <p className="text-xs text-neutral-400">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                onClick={reset}
                aria-label="Remove file"
                className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-200"
              >
                <X size={15} />
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-3">
            <Button
              variant="outline"
              icon={<ShieldCheck size={16} />}
              onClick={() => run(true)}
              loading={busy === 'validate'}
              disabled={!file || !!busy}
            >
              Check first
            </Button>
            <Button
              icon={<Upload size={16} />}
              onClick={() => run(false)}
              loading={busy === 'import'}
              disabled={!file || !!busy}
            >
              Apply changes
            </Button>
          </div>
          <p className="text-xs text-neutral-400 mt-2">
            "Check first" is a dry run — it reports every problem without saving anything.
          </p>
        </section>

        {result && <ResultPanel result={result} />}
      </div>
    </Modal>
  );
}

/* -------------------------------- Pieces --------------------------------- */

function StepTitle({ step, title }: { step: number; title: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-2">
      <span className="w-6 h-6 rounded-lg bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center">
        {step}
      </span>
      <h3 className="text-sm font-bold text-neutral-800">{title}</h3>
    </div>
  );
}

function ResultPanel({ result }: { result: SheetImportResult }) {
  const clean = result.rows.failed === 0;
  const tone = clean
    ? { bg: 'bg-primary-50', border: 'border-primary-200', text: 'text-primary-800', Icon: CheckCircle2 }
    : { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', Icon: AlertTriangle };

  return (
    <section className="border-t border-neutral-100 pt-4">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-bold text-neutral-800">
          {result.dryRun ? 'Check result (nothing saved)' : 'Applied'}
        </h3>
        <Badge className={result.dryRun ? 'bg-blue-100 text-blue-700' : 'bg-primary-100 text-primary-700'}>
          {result.dryRun ? 'Dry run' : 'Saved'}
        </Badge>
      </div>

      <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border mb-3 ${tone.bg} ${tone.border}`}>
        <tone.Icon size={18} className={`${tone.text} shrink-0 mt-0.5`} />
        <p className={`text-sm ${tone.text}`}>
          <span className="font-semibold">
            {result.rows.updated} of {result.rows.total} rows
          </span>{' '}
          {result.dryRun ? 'would change' : 'updated'}
          {result.rows.unchanged > 0 && ` · ${result.rows.unchanged} already matched`}
          {result.rows.failed > 0 && ` · ${result.rows.failed} skipped`}.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
        {([
          ['Stock', result.counts.stock],
          ['Prices', result.counts.price],
          ['Reorder point', result.counts.threshold],
          ['Availability', result.counts.availability],
        ] as const).map(([label, count]) => (
          <div key={label} className="rounded-xl border border-neutral-100 bg-neutral-50/60 px-3 py-2.5">
            <p className="text-xs font-medium text-neutral-500">{label}</p>
            <p className="text-lg font-bold text-neutral-800">{count}</p>
          </div>
        ))}
      </div>

      {result.unknownHeaders.length > 0 && (
        <p className="flex items-start gap-2 text-xs text-neutral-500 bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-2 mb-3">
          <Info size={14} className="shrink-0 mt-px" />
          <span>Ignored unrecognised column{result.unknownHeaders.length === 1 ? '' : 's'}: {result.unknownHeaders.map((h) => `"${h}"`).join(', ')}</span>
        </p>
      )}

      {result.errorsTruncated && (
        <p className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-3">
          <Info size={14} className="shrink-0 mt-px" />
          <span>
            {result.rows.failed} rows were skipped, but only the first {result.errors.length} problems are listed.
          </span>
        </p>
      )}

      {result.errors.length > 0 && (
        <div className="border border-neutral-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-neutral-50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left font-bold text-neutral-600 w-20">Row</th>
                <th className="px-3 py-2 text-left font-bold text-neutral-600 w-44">Column</th>
                <th className="px-3 py-2 text-left font-bold text-neutral-600">Problem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {result.errors.map((issue, i) => (
                <tr key={i}>
                  <td className="px-3 py-2 text-neutral-500 align-top">{issue.row}</td>
                  <td className="px-3 py-2 text-neutral-500 align-top">{issue.column}</td>
                  <td className="px-3 py-2 text-neutral-700">{issue.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
