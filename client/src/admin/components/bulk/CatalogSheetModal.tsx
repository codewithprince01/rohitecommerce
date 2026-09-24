import React, { useEffect, useRef, useState } from 'react';
import {
  FileSpreadsheet, FileText, UploadCloud, X, ShieldCheck, Upload, Download,
  CheckCircle2, AlertTriangle, Info, KeyRound, Pencil, PlusCircle, ChevronDown,
} from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { useAsync } from '../../hooks/useAsync';
import {
  downloadInventorySheet,
  importInventorySheet,
  type SheetFormat,
  type SheetImportResult,
} from '../../lib/services/inventory.service';
import {
  getBulkSchema,
  downloadTemplate,
  importBulkFile,
  downloadIssueReport,
  type BulkUploadType,
  type BulkResult,
} from '../../lib/services/bulkUpload.service';

interface CatalogSheetModalProps {
  open: boolean;
  onClose: () => void;
  /** Which template the "Add new" tab works with. */
  type: BulkUploadType;
  /** Applied to the edit-sheet export so it matches what the table shows. */
  filters?: Record<string, string | number | boolean | undefined>;
  /** Which job the caller's button is for; the dialog opens on that tab. */
  initialTab?: Tab;
  onDone: () => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

export type Tab = 'update' | 'add';
const MAX_MB = 10;

/**
 * Everything sheet-shaped in one place.
 *
 * The two jobs look alike and were easy to confuse — an export edited and sent
 * to the "add new" importer just failed on missing template columns. Putting
 * them side by side, each with its own download button, makes it obvious which
 * file belongs to which door.
 */
export default function CatalogSheetModal({
  open,
  onClose,
  type,
  filters = {},
  initialTab = 'update',
  onDone,
  onError,
  onSuccess,
}: CatalogSheetModalProps) {
  const [tab, setTab] = useState<Tab>(initialTab);

  // The caller picks the tab when it opens, so the Template button lands on
  // "Add new" and the Export button on "Update existing".
  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

  return (
    <Modal open={open} onClose={onClose} title="Import / Export" size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <TabButton
            active={tab === 'update'}
            icon={Pencil}
            title="Update existing"
            blurb="Export, edit, upload back"
            onClick={() => setTab('update')}
          />
          <TabButton
            active={tab === 'add'}
            icon={PlusCircle}
            title="Add new"
            blurb="Fill a blank template"
            onClick={() => setTab('add')}
          />
        </div>

        {tab === 'update' ? (
          <UpdateTab filters={filters} onDone={onDone} onError={onError} onSuccess={onSuccess} />
        ) : (
          <AddTab type={type} onDone={onDone} onError={onError} onSuccess={onSuccess} />
        )}
      </div>
    </Modal>
  );
}

/* --------------------------------- Tabs ---------------------------------- */

function TabButton({
  active, icon: Icon, title, blurb, onClick,
}: {
  active: boolean;
  icon: typeof Pencil;
  title: string;
  blurb: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-colors ${
        active
          ? 'border-primary-500 bg-primary-50/60 text-primary-900'
          : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
      }`}
    >
      <Icon size={18} className={active ? 'text-primary-600' : 'text-neutral-400'} />
      <div className="min-w-0">
        <div className="text-xs font-bold">{title}</div>
        <div className="text-[11px] text-neutral-500 font-normal">{blurb}</div>
      </div>
    </button>
  );
}

/** Export-with-ids → edit → upload. Updates only; cannot create duplicates. */
function UpdateTab({
  filters, onDone, onError, onSuccess,
}: {
  filters: Record<string, string | number | boolean | undefined>;
  onDone: () => void;
  onError: (m: string) => void;
  onSuccess: (m: string) => void;
}) {
  const [busy, setBusy] = useState<'validate' | 'import' | SheetFormat | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<SheetImportResult | null>(null);

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

  const run = async (dryRun: boolean) => {
    if (!file) return;
    setBusy(dryRun ? 'validate' : 'import');
    try {
      const res = await importInventorySheet(file, dryRun);
      setResult(res);
      if (dryRun) {
        onSuccess(res.rows.failed ? `${res.rows.failed} row(s) would be skipped` : 'Sheet looks good');
      } else {
        onSuccess(`Updated ${res.rows.updated} SKU${res.rows.updated === 1 ? '' : 's'}`);
        onDone();
      }
    } catch (err: any) {
      onError(err?.message ?? 'Upload failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <Note icon={KeyRound}>
        Every row carries a <b>SKU ID</b>, so rows are matched by id — renaming a product in the sheet is safe.
        Nothing is created or deleted here, so this can never make a duplicate.
      </Note>

      <Step n={1} title="Download the current sheet">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" icon={<FileSpreadsheet size={16} />} loading={busy === 'xlsx'} disabled={!!busy} onClick={() => download('xlsx')}>
            Excel (.xlsx)
          </Button>
          <Button variant="outline" icon={<FileText size={16} />} loading={busy === 'csv'} disabled={!!busy} onClick={() => download('csv')}>
            CSV (.csv)
          </Button>
        </div>
        <p className="text-xs text-neutral-400 mt-2">
          Editable: Product, Description, Image URL, Tags, Product Active, Pack Size, Selling Price, MRP, Stock Qty,
          Low Stock Alert At, Pack Active.
        </p>
      </Step>

      <Step n={2} title="Upload the edited file">
        <DropZone file={file} onPick={setFile} onClear={() => { setFile(null); setResult(null); }} onError={onError} />
        <div className="flex flex-wrap gap-2 mt-3">
          <Button variant="outline" icon={<ShieldCheck size={16} />} onClick={() => run(true)} loading={busy === 'validate'} disabled={!file || !!busy}>
            Check first
          </Button>
          <Button icon={<Upload size={16} />} onClick={() => run(false)} loading={busy === 'import'} disabled={!file || !!busy}>
            Apply changes
          </Button>
        </div>
      </Step>

      {result && <UpdateResult result={result} />}
    </div>
  );
}

/** Blank template → fill → upload. This is the one that creates records. */
function AddTab({
  type, onDone, onError, onSuccess,
}: {
  type: BulkUploadType;
  onDone: () => void;
  onError: (m: string) => void;
  onSuccess: (m: string) => void;
}) {
  const { data: schema } = useAsync(() => getBulkSchema(), []);
  const [busy, setBusy] = useState<'validate' | 'import' | SheetFormat | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [withSample, setWithSample] = useState(false);
  const [updateExisting, setUpdateExisting] = useState(true);
  const [result, setResult] = useState<BulkResult | null>(null);
  const [showColumns, setShowColumns] = useState(false);

  const activeSchema = schema?.types.find((t) => t.type === type);

  const download = async (format: SheetFormat) => {
    setBusy(format);
    try {
      await downloadTemplate(type, format, withSample);
      onSuccess(`${format.toUpperCase()} template downloaded`);
    } catch (err: any) {
      onError(err?.message ?? 'Template download failed');
    } finally {
      setBusy(null);
    }
  };

  const run = async (dryRun: boolean) => {
    if (!file) return;
    setBusy(dryRun ? 'validate' : 'import');
    try {
      const res = await importBulkFile(file, { type, dryRun, updateExisting });
      setResult(res);
      if (dryRun) {
        onSuccess(res.rows.failed ? `${res.rows.failed} row(s) would be skipped` : 'File looks good');
      } else {
        onSuccess(`Imported ${res.rows.imported} of ${res.rows.total} rows`);
        onDone();
      }
    } catch (err: any) {
      onError(err?.message ?? 'Upload failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <Note icon={Info} tone="amber">
        This creates records that do not exist yet, matched by name. To change things you already have, use{' '}
        <b>Update existing</b> — editing an export and uploading it here will not work.
      </Note>

      <Step n={1} title="Download a blank template">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" icon={<FileSpreadsheet size={16} />} loading={busy === 'xlsx'} disabled={!!busy} onClick={() => download('xlsx')}>
            Excel (.xlsx)
          </Button>
          <Button variant="outline" icon={<FileText size={16} />} loading={busy === 'csv'} disabled={!!busy} onClick={() => download('csv')}>
            CSV (.csv)
          </Button>
        </div>
        <label className="flex items-center gap-2 mt-2.5 text-xs text-neutral-600 cursor-pointer">
          <input type="checkbox" checked={withSample} onChange={(e) => setWithSample(e.target.checked)} className="rounded text-primary-600" />
          Include example rows
        </label>

        {activeSchema && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setShowColumns((v) => !v)}
              className="flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-700"
            >
              <ChevronDown size={13} className={`transition-transform ${showColumns ? 'rotate-180' : ''}`} />
              What goes in each column?
            </button>
            {showColumns && (
              <div className="mt-2 border border-neutral-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-neutral-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-bold text-neutral-600">Column</th>
                      <th className="px-3 py-2 text-left font-bold text-neutral-600 w-20">Required</th>
                      <th className="px-3 py-2 text-left font-bold text-neutral-600">Meaning</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {activeSchema.columns.map((c) => (
                      <tr key={c.key}>
                        <td className="px-3 py-2 font-medium text-neutral-800 align-top">{c.header}</td>
                        <td className="px-3 py-2 align-top">
                          {c.required ? <span className="text-rose-600 font-bold">Yes</span> : <span className="text-neutral-400">No</span>}
                        </td>
                        <td className="px-3 py-2 text-neutral-600">{c.hint}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Step>

      <Step n={2} title="Upload the filled file">
        <DropZone file={file} onPick={setFile} onClear={() => { setFile(null); setResult(null); }} onError={onError} />

        <label className="flex items-center gap-2 mt-3 text-xs text-neutral-600 cursor-pointer">
          <input type="checkbox" checked={updateExisting} onChange={(e) => setUpdateExisting(e.target.checked)} className="rounded text-primary-600" />
          Also refresh records that already exist
        </label>

        <div className="flex flex-wrap gap-2 mt-3">
          <Button variant="outline" icon={<ShieldCheck size={16} />} onClick={() => run(true)} loading={busy === 'validate'} disabled={!file || !!busy}>
            Check first
          </Button>
          <Button icon={<Upload size={16} />} onClick={() => run(false)} loading={busy === 'import'} disabled={!file || !!busy}>
            Import
          </Button>
        </div>
      </Step>

      {result && <AddResult result={result} />}
    </div>
  );
}

/* -------------------------------- Pieces --------------------------------- */

function Note({ icon: Icon, tone = 'primary', children }: { icon: typeof Info; tone?: 'primary' | 'amber'; children: React.ReactNode }) {
  const cls = tone === 'amber'
    ? 'bg-amber-50/70 border-amber-200 text-amber-900'
    : 'bg-primary-50/60 border-primary-100 text-primary-900';
  const iconCls = tone === 'amber' ? 'text-amber-600' : 'text-primary-600';
  return (
    <div className={`flex items-start gap-2.5 px-3.5 py-3 rounded-xl border ${cls}`}>
      <Icon size={16} className={`${iconCls} shrink-0 mt-0.5`} />
      <p className="text-xs leading-relaxed">{children}</p>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-2.5 mb-2">
        <span className="w-6 h-6 rounded-lg bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center">{n}</span>
        <h3 className="text-sm font-bold text-neutral-800">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function DropZone({
  file, onPick, onClear, onError,
}: {
  file: File | null;
  onPick: (f: File) => void;
  onClear: () => void;
  onError: (m: string) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const accept = (picked?: File | null) => {
    if (!picked) return;
    if (picked.size > MAX_MB * 1024 * 1024) return onError(`That file is larger than ${MAX_MB} MB.`);
    onPick(picked);
  };

  return (
    <>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); accept(e.dataTransfer.files?.[0]); }}
        onClick={() => ref.current?.click()}
        className={`rounded-xl border border-dashed px-4 py-5 text-center cursor-pointer transition-colors ${
          dragging ? 'border-primary-400 bg-primary-50' : 'border-neutral-300 hover:border-primary-400'
        }`}
      >
        <UploadCloud size={20} className="mx-auto text-neutral-400 mb-1.5" />
        <p className="text-sm font-medium text-neutral-700">Choose a file or drop it here</p>
        <p className="text-xs text-neutral-400 mt-0.5">.xlsx or .csv · up to {MAX_MB} MB</p>
        <input
          ref={ref}
          type="file"
          accept=".csv,.xlsx,.xlsm,.tsv,.txt"
          className="hidden"
          onChange={(e) => { accept(e.target.files?.[0]); e.target.value = ''; }}
        />
      </div>

      {file && (
        <div className="mt-3 flex items-center gap-3 px-3 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200">
          <FileSpreadsheet size={18} className="text-primary-600 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-neutral-800 truncate">{file.name}</p>
            <p className="text-xs text-neutral-400">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
          <button onClick={onClear} aria-label="Remove file" className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-200">
            <X size={15} />
          </button>
        </div>
      )}
    </>
  );
}

function Summary({ clean, children }: { clean: boolean; children: React.ReactNode }) {
  const tone = clean
    ? { bg: 'bg-primary-50', border: 'border-primary-200', text: 'text-primary-800', Icon: CheckCircle2 }
    : { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', Icon: AlertTriangle };
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border mb-3 ${tone.bg} ${tone.border}`}>
      <tone.Icon size={18} className={`${tone.text} shrink-0 mt-0.5`} />
      <p className={`text-sm ${tone.text}`}>{children}</p>
    </div>
  );
}

function IssueTable({ issues }: { issues: { row: number; column: string; message: string }[] }) {
  if (issues.length === 0) return null;
  return (
    <div className="border border-neutral-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
      <table className="w-full text-xs">
        <thead className="bg-neutral-50 sticky top-0">
          <tr>
            <th className="px-3 py-2 text-left font-bold text-neutral-600 w-16">Row</th>
            <th className="px-3 py-2 text-left font-bold text-neutral-600 w-40">Column</th>
            <th className="px-3 py-2 text-left font-bold text-neutral-600">Problem</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {issues.map((issue, i) => (
            <tr key={i}>
              <td className="px-3 py-2 text-neutral-500 align-top">{issue.row}</td>
              <td className="px-3 py-2 text-neutral-500 align-top">{issue.column}</td>
              <td className="px-3 py-2 text-neutral-700">{issue.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UpdateResult({ result }: { result: SheetImportResult }) {
  return (
    <section className="border-t border-neutral-100 pt-4">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-bold text-neutral-800">{result.dryRun ? 'Check result (nothing saved)' : 'Applied'}</h3>
        <Badge className={result.dryRun ? 'bg-blue-100 text-blue-700' : 'bg-primary-100 text-primary-700'}>
          {result.dryRun ? 'Dry run' : 'Saved'}
        </Badge>
      </div>
      <Summary clean={result.rows.failed === 0}>
        <span className="font-semibold">{result.rows.updated} of {result.rows.total} SKU rows</span>{' '}
        {result.dryRun ? 'would change' : 'updated'}
        {result.counts.products > 0 && ` · ${result.counts.products} product${result.counts.products === 1 ? '' : 's'}`}
        {result.rows.unchanged > 0 && ` · ${result.rows.unchanged} already matched`}
        {result.rows.failed > 0 && ` · ${result.rows.failed} skipped`}.
      </Summary>
      <IssueTable issues={result.errors} />
    </section>
  );
}

function AddResult({ result }: { result: BulkResult }) {
  return (
    <section className="border-t border-neutral-100 pt-4">
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-neutral-800">{result.dryRun ? 'Check result (nothing saved)' : 'Imported'}</h3>
          <Badge className={result.dryRun ? 'bg-blue-100 text-blue-700' : 'bg-primary-100 text-primary-700'}>
            {result.dryRun ? 'Dry run' : 'Saved'}
          </Badge>
        </div>
        {(result.errors.length > 0 || result.warnings.length > 0) && (
          <Button size="sm" variant="outline" icon={<Download size={14} />} onClick={() => downloadIssueReport(result)}>
            Issue report
          </Button>
        )}
      </div>
      <Summary clean={result.rows.failed === 0}>
        <span className="font-semibold">{result.rows.imported} of {result.rows.total} rows</span>{' '}
        {result.dryRun ? 'are ready' : 'imported'}
        {result.rows.failed > 0 && ` · ${result.rows.failed} skipped`}
        {result.rows.carried > 0 && ` · ${result.rows.carried} took the group from the row above`}.
      </Summary>
      {result.errorsTruncated && (
        <p className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-3">
          <Info size={14} className="shrink-0 mt-px" />
          <span>{result.rows.failed} rows failed, but only the first {result.errors.length} problems are listed.</span>
        </p>
      )}
      <IssueTable issues={result.errors} />
    </section>
  );
}
