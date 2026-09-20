import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Upload, FileSpreadsheet, FileText, Download, CheckCircle2, AlertTriangle, XCircle,
  Layers, FolderTree, Tag, Package, Boxes, X, ShieldCheck, ListChecks, ChevronDown, Info,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Switch } from '../../components/ui/FormField';
import { Loader, ErrorState } from '../../components/ui/States';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../hooks/useToast';
import { useConfirm } from '../../hooks/useConfirm';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  getBulkSchema,
  downloadTemplate,
  importBulkFile,
  downloadIssueReport,
  type BulkUploadType,
  type TemplateFormat,
  type BulkResult,
  type BulkTypeSchema,
} from '../../lib/services/bulkUpload.service';

const ACCEPT = '.csv,.xlsx,.xlsm,.tsv,.txt';
const MAX_MB = 10;

const TYPE_META: Record<BulkUploadType, { title: string; blurb: string; icon: typeof Layers }> = {
  products: {
    title: 'Products (full catalog)',
    blurb: 'Products, pack sizes, prices, stock and images — missing categories are created automatically.',
    icon: Package,
  },
  catalog: {
    title: 'Categories only',
    blurb: 'Category → subcategory → sub-sub category hierarchy with images, without any products.',
    icon: FolderTree,
  },
};

const isType = (value: string | null): value is BulkUploadType =>
  value === 'products' || value === 'catalog';

export default function BulkUploadPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const { can } = useAdminAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: schema, loading: schemaLoading, error: schemaError, reload } = useAsync(() => getBulkSchema(), []);

  const initialType = isType(searchParams.get('type')) ? (searchParams.get('type') as BulkUploadType) : 'products';
  const [type, setTypeState] = useState<BulkUploadType>(initialType);
  const [file, setFile] = useState<File | null>(null);
  const [withSample, setWithSample] = useState(true);
  const [updateExisting, setUpdateExisting] = useState(true);
  const [busy, setBusy] = useState<'validate' | 'import' | TemplateFormat | null>(null);
  const [result, setResult] = useState<BulkResult | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const canImport = can('categories.manage') && (type !== 'products' || can('products.create'));
  const activeSchema: BulkTypeSchema | undefined = schema?.types.find((t) => t.type === type);

  // Keep the URL in sync so Products/Categories can deep-link to the right mode.
  const setType = (next: BulkUploadType) => {
    setTypeState(next);
    setResult(null);
    setSearchParams(next === 'products' ? {} : { type: next }, { replace: true });
  };

  const acceptFile = useCallback(
    (candidate: File | null | undefined) => {
      if (!candidate) return;
      const ext = candidate.name.slice(candidate.name.lastIndexOf('.')).toLowerCase();
      if (!ACCEPT.split(',').includes(ext)) {
        toast.error(`"${candidate.name}" is not a spreadsheet. Upload a .xlsx or .csv file.`);
        return;
      }
      if (candidate.size > MAX_MB * 1024 * 1024) {
        toast.error(`The file is too large. Maximum size is ${MAX_MB} MB.`);
        return;
      }
      setFile(candidate);
      setResult(null);
    },
    [toast]
  );

  const handleTemplate = async (format: TemplateFormat) => {
    setBusy(format);
    try {
      await downloadTemplate(type, format, withSample);
      toast.success(`${format.toUpperCase()} template downloaded`);
    } catch (err: any) {
      toast.error(err?.message ?? 'Template download failed');
    } finally {
      setBusy(null);
    }
  };

  const run = async (dryRun: boolean) => {
    if (!file) return toast.error('Choose a file first');

    if (!dryRun) {
      const ok = await confirm({
        title: 'Import into the catalog',
        message:
          `Import "${file.name}" into your live catalog? ` +
          (updateExisting
            ? 'Existing records matched by slug will be updated with the values in the file.'
            : 'Existing records will be kept as they are — only new records get created.'),
        confirmLabel: 'Import now',
      });
      if (!ok) return;
    }

    setBusy(dryRun ? 'validate' : 'import');
    try {
      const res = await importBulkFile(file, { type, dryRun, updateExisting });
      setResult(res);
      if (dryRun) {
        toast.info(
          res.errors.length
            ? `${res.errors.length} problem${res.errors.length === 1 ? '' : 's'} found — nothing was saved`
            : 'File looks good — no problems found'
        );
      } else if (res.errors.length) {
        toast.info(`Imported ${res.rows.imported} of ${res.rows.total} rows — ${res.rows.failed} row(s) skipped`);
      } else {
        toast.success(`Imported all ${res.rows.imported} rows successfully`);
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Upload failed');
    } finally {
      setBusy(null);
    }
  };

  if (schemaLoading && !schema) return <Loader label="Loading the column reference…" />;
  if (schemaError && !schema) return <ErrorState message={schemaError} onRetry={reload} />;

  return (
    <div>
      <PageHeader
        title="Bulk Upload"
        subtitle="Build your whole catalog from one Excel or CSV file — categories, subcategories, sub-sub categories, products, pack sizes and images."
      />

      {/* What are we importing? */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        {(Object.keys(TYPE_META) as BulkUploadType[]).map((key) => {
          const meta = TYPE_META[key];
          const Icon = meta.icon;
          const active = type === key;
          return (
            <button
              key={key}
              onClick={() => setType(key)}
              className={`flex items-start gap-3 p-4 rounded-2xl border text-left transition-colors ${
                active
                  ? 'bg-primary-50 border-primary-300 ring-2 ring-primary-100'
                  : 'bg-white border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  active ? 'bg-primary-500 text-white' : 'bg-neutral-100 text-neutral-500'
                }`}
              >
                <Icon size={18} />
              </div>
              <div>
                <p className={`text-sm font-semibold ${active ? 'text-primary-800' : 'text-neutral-800'}`}>
                  {meta.title}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">{meta.blurb}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        {/* Step 1 — template */}
        <section className="bg-white rounded-2xl shadow-card p-5">
          <StepTitle step={1} title="Download the template" />
          <p className="text-sm text-neutral-500 mb-4">
            {activeSchema?.description ?? 'Fill your data into the template and upload it back.'}
          </p>

          <div className="flex flex-wrap gap-2 mb-3">
            <Button
              variant="primary"
              icon={<FileSpreadsheet size={16} />}
              onClick={() => handleTemplate('xlsx')}
              loading={busy === 'xlsx'}
              disabled={!!busy}
            >
              Excel (.xlsx)
            </Button>
            <Button
              variant="outline"
              icon={<FileText size={16} />}
              onClick={() => handleTemplate('csv')}
              loading={busy === 'csv'}
              disabled={!!busy}
            >
              CSV (.csv)
            </Button>
          </div>

          <Switch checked={withSample} onChange={setWithSample} label="Include example rows" />

          <ul className="mt-4 space-y-1.5 text-xs text-neutral-500">
            <li>• Columns marked <span className="font-semibold text-rose-600">*</span> are required; the rest are optional.</li>
            <li>• Column order can be changed and extra columns are ignored.</li>
            <li>• Images are links — paste an <code className="text-neutral-600">https://…</code> URL or an <code className="text-neutral-600">/uploads/…</code> path.</li>
            {type === 'products' && <li>• Repeat a product on several rows to add multiple pack sizes.</li>}
            {schema && <li>• Up to {schema.maxRows.toLocaleString()} rows per file.</li>}
          </ul>
        </section>

        {/* Step 2 — upload */}
        <section className="bg-white rounded-2xl shadow-card p-5">
          <StepTitle step={2} title="Upload your filled file" />

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
            onClick={() => inputRef.current?.click()}
            className={`rounded-xl border-2 border-dashed px-4 py-7 text-center cursor-pointer transition-colors ${
              dragging ? 'border-primary-400 bg-primary-50' : 'border-neutral-200 hover:border-primary-300 hover:bg-neutral-50'
            }`}
          >
            <Upload size={22} className="mx-auto text-neutral-400 mb-2" />
            <p className="text-sm font-semibold text-neutral-700">Drag a file here, or click to browse</p>
            <p className="text-xs text-neutral-400 mt-1">.xlsx or .csv — up to {MAX_MB} MB</p>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={(e) => {
                acceptFile(e.target.files?.[0]);
                e.target.value = ''; // allow re-picking the same file after a fix
              }}
            />
          </div>

          {file && (
            <div className="mt-3 flex items-center gap-3 px-3 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200">
              <FileSpreadsheet size={18} className="text-primary-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-neutral-800 truncate">{file.name}</p>
                <p className="text-xs text-neutral-400">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                onClick={() => {
                  setFile(null);
                  setResult(null);
                }}
                className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-200"
                aria-label="Remove file"
              >
                <X size={15} />
              </button>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-neutral-100">
            <Switch
              checked={updateExisting}
              onChange={setUpdateExisting}
              label="Update records that already exist"
            />
            <p className="text-xs text-neutral-400 mt-1.5">
              {updateExisting
                ? 'Matched by slug — names, images, prices and stock are refreshed from the file. Blank cells are left untouched.'
                : 'Existing records stay exactly as they are; only new ones are created.'}
            </p>
          </div>

          {!canImport && (
            <p className="mt-4 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              Your role can view the template but not import. Ask a manager to run the import.
            </p>
          )}

          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              variant="outline"
              icon={<ShieldCheck size={16} />}
              onClick={() => run(true)}
              loading={busy === 'validate'}
              disabled={!file || !!busy || !canImport}
            >
              Validate file
            </Button>
            <Button
              icon={<Upload size={16} />}
              onClick={() => run(false)}
              loading={busy === 'import'}
              disabled={!file || !!busy || !canImport}
            >
              Import now
            </Button>
          </div>
          <p className="text-xs text-neutral-400 mt-2">
            Validate is a dry run — it reports every problem without saving anything.
          </p>
        </section>
      </div>

      {result && <ResultPanel result={result} />}

      {activeSchema && <ColumnReference schema={activeSchema} />}
    </div>
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

const COUNT_META = [
  { key: 'categories', label: 'Categories', icon: Layers },
  { key: 'subcategories', label: 'Subcategories', icon: FolderTree },
  { key: 'brands', label: 'Sub-Sub Categories', icon: Tag },
  { key: 'products', label: 'Products', icon: Package },
  { key: 'variants', label: 'Pack sizes', icon: Boxes },
] as const;

function ResultPanel({ result }: { result: BulkResult }) {
  const clean = result.errors.length === 0;
  const tone = clean
    ? { bg: 'bg-primary-50', border: 'border-primary-200', text: 'text-primary-800', Icon: CheckCircle2 }
    : { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', Icon: AlertTriangle };

  return (
    <section className="bg-white rounded-2xl shadow-card p-5 mb-5">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div className="flex items-center gap-2.5">
          <ListChecks size={18} className="text-neutral-500" />
          <h3 className="text-sm font-bold text-neutral-800">
            {result.dryRun ? 'Validation result (nothing was saved)' : 'Import result'}
          </h3>
          <Badge className={result.dryRun ? 'bg-blue-100 text-blue-700' : 'bg-primary-100 text-primary-700'}>
            {result.dryRun ? 'Dry run' : 'Saved'}
          </Badge>
        </div>
        {(result.errors.length > 0 || result.warnings.length > 0) && (
          <Button size="sm" variant="outline" icon={<Download size={14} />} onClick={() => downloadIssueReport(result)}>
            Download issue report
          </Button>
        )}
      </div>

      <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border mb-4 ${tone.bg} ${tone.border}`}>
        <tone.Icon size={18} className={`${tone.text} flex-shrink-0 mt-0.5`} />
        <p className={`text-sm ${tone.text}`}>
          <span className="font-semibold">
            {result.rows.imported} of {result.rows.total} rows
          </span>{' '}
          {result.dryRun ? 'are ready to import' : 'imported'}
          {result.rows.failed > 0 && ` — ${result.rows.failed} row${result.rows.failed === 1 ? '' : 's'} skipped`}.
          {clean && ' No problems found.'}
        </p>
      </div>

      {/* What was (or would be) written */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        {COUNT_META.map(({ key, label, icon: Icon }) => {
          const count = result.counts[key];
          return (
            <div key={key} className="rounded-xl border border-neutral-100 bg-neutral-50/60 px-3.5 py-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Icon size={14} className="text-neutral-400" />
                <p className="text-xs font-medium text-neutral-500">{label}</p>
              </div>
              <p className="text-lg font-bold text-neutral-800">
                {count.created}
                <span className="text-xs font-medium text-neutral-400 ml-1">new</span>
              </p>
              <p className="text-xs text-neutral-500">{count.updated} updated</p>
            </div>
          );
        })}
      </div>

      {result.unknownHeaders.length > 0 && (
        <p className="flex items-start gap-2 text-xs text-neutral-500 bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-2 mb-3">
          <Info size={14} className="flex-shrink-0 mt-px" />
          <span>
            Ignored unrecognised column{result.unknownHeaders.length === 1 ? '' : 's'}:{' '}
            {result.unknownHeaders.map((header) => `"${header}"`).join(', ')}
          </span>
        </p>
      )}

      <IssueTable title="Problems" issues={result.errors} tone="error" />
      <IssueTable title="Warnings" issues={result.warnings} tone="warning" />
    </section>
  );
}

function IssueTable({
  title,
  issues,
  tone,
}: {
  title: string;
  issues: BulkResult['errors'];
  tone: 'error' | 'warning';
}) {
  if (!issues.length) return null;
  const Icon = tone === 'error' ? XCircle : AlertTriangle;
  const iconClass = tone === 'error' ? 'text-rose-500' : 'text-amber-500';

  return (
    <div className="mt-4">
      <p className="text-xs font-semibold text-neutral-600 mb-2">
        {title} ({issues.length})
      </p>
      <div className="rounded-xl border border-neutral-100 overflow-hidden max-h-72 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 sticky top-0">
            <tr className="text-left text-xs text-neutral-500">
              <th className="px-3 py-2 font-medium w-20">File row</th>
              <th className="px-3 py-2 font-medium w-56">Column</th>
              <th className="px-3 py-2 font-medium">What to fix</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {issues.map((issue, index) => (
              <tr key={`${issue.row}-${issue.column}-${index}`}>
                <td className="px-3 py-2 text-neutral-500 align-top">
                  <span className="inline-flex items-center gap-1.5">
                    <Icon size={13} className={iconClass} />
                    {issue.row}
                  </span>
                </td>
                <td className="px-3 py-2 text-neutral-600 align-top">{issue.column || '—'}</td>
                <td className="px-3 py-2 text-neutral-700 align-top">{issue.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ColumnReference({ schema }: { schema: BulkTypeSchema }) {
  const [open, setOpen] = useState(false);
  const required = useMemo(() => schema.columns.filter((c) => c.required).length, [schema]);

  return (
    <section className="bg-white rounded-2xl shadow-card overflow-hidden">
      <button
        onClick={() => setOpen((value) => !value)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-neutral-50"
      >
        <div>
          <h3 className="text-sm font-bold text-neutral-800">Column guide — {schema.label}</h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            {schema.columns.length} columns, {required} required. Sheet name: “{schema.sheet}”.
          </p>
        </div>
        <ChevronDown size={18} className={`text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-neutral-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50">
              <tr className="text-left text-xs text-neutral-500">
                <th className="px-5 py-2.5 font-medium">Column header</th>
                <th className="px-3 py-2.5 font-medium w-24">Required</th>
                <th className="px-3 py-2.5 font-medium w-24">Type</th>
                <th className="px-3 py-2.5 font-medium">What to fill</th>
                <th className="px-5 py-2.5 font-medium w-56">Example</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {schema.columns.map((column) => (
                <tr key={column.key}>
                  <td className="px-5 py-2.5 font-medium text-neutral-800 align-top">
                    {column.header}
                    {column.required && <span className="text-rose-500 ml-0.5">*</span>}
                  </td>
                  <td className="px-3 py-2.5 align-top">
                    {column.required ? (
                      <Badge className="bg-rose-100 text-rose-700">Yes</Badge>
                    ) : (
                      <Badge className="bg-neutral-100 text-neutral-500">No</Badge>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-neutral-500 align-top">{column.type}</td>
                  <td className="px-3 py-2.5 text-neutral-600 align-top">{column.hint}</td>
                  <td className="px-5 py-2.5 align-top">
                    <code className="text-xs text-neutral-500 break-all">{column.example}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
