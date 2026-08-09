import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FolderOpen, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../context/LanguageContext';
import { PageHeader } from '../components/ui/PageHeader';
import { FileActionButtons } from '../components/ui/FileActionButtons';
import { FileTypeIcon } from '../components/ui/FileTypeIcon';
import { inferFileTypeFromName, getFileTypeLabel } from '../lib/fileTypes';
import { cachedSupabaseRows } from '../lib/offlineCache';

interface UnifiedFile {
  id: string;
  title: string;
  fileUrl: string;
  fileType: string;
  folder: string;
  subfolder?: string;
  createdAt: string;
}

interface ExcelFileRow {
  id: string;
  file_name: string;
  file_url: string | null;
  upload_type?: string | null;
  created_at: string;
}

interface FormFileRow {
  id: string;
  title: string;
  file_url: string | null;
  file_type?: string | null;
  category?: string | null;
  created_at: string;
}

interface FarmFileRow {
  id: string;
  title?: string | null;
  file_name?: string | null;
  file_url: string | null;
  document_type?: string | null;
  created_at: string;
}

interface SubsidyFileRow {
  id: string;
  program: string;
  financial_year: string;
  beneficiary_list_url: string | null;
  created_at: string;
}

interface QualityFileRow {
  id: string;
  category: string;
  dealer_name?: string | null;
  license_number?: string | null;
  form_url: string | null;
  created_at: string;
}

const FILE_DIRECTORY_LIMIT = 240;
const FILES_PAGE_SIZE = 80;

export function FileDirectory() {
  const { t } = useLanguage();
  const [files, setFiles] = useState<UnifiedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(0);

  const loadAllFiles = useCallback(async () => {
    try {
      const [excel, forms, crops, gos, farm, subsidy, quality] = await Promise.all([
        cachedSupabaseRows<ExcelFileRow>(
          'file-directory:excel:v2',
          () => supabase.from('excel_uploads').select('id, file_name, file_url, upload_type, created_at').order('created_at', { ascending: false }).limit(FILE_DIRECTORY_LIMIT),
          []
        ),
        cachedSupabaseRows<FormFileRow>(
          'file-directory:forms:v2',
          () => supabase.from('forms_downloads').select('id, title, file_url, file_type, category, created_at').order('created_at', { ascending: false }).limit(FILE_DIRECTORY_LIMIT),
          []
        ),
        cachedSupabaseRows<FormFileRow>(
          'file-directory:crops:v2',
          () => supabase.from('crop_data').select('id, title, file_url, file_type, created_at').order('created_at', { ascending: false }).limit(FILE_DIRECTORY_LIMIT),
          []
        ),
        cachedSupabaseRows<FormFileRow>(
          'file-directory:gos:v2',
          () => supabase.from('gos_circulars').select('id, title, file_url, file_type, created_at').order('created_at', { ascending: false }).limit(FILE_DIRECTORY_LIMIT),
          []
        ),
        cachedSupabaseRows<FarmFileRow>(
          'file-directory:farm:v2',
          () => supabase.from('farm_mechanization_documents').select('id, title, file_name, file_url, document_type, created_at').order('created_at', { ascending: false }).limit(FILE_DIRECTORY_LIMIT),
          []
        ),
        cachedSupabaseRows<SubsidyFileRow>(
          'file-directory:subsidy:v2',
          () => supabase.from('subsidy_cell_records').select('id, program, financial_year, beneficiary_list_url, created_at').order('created_at', { ascending: false }).limit(FILE_DIRECTORY_LIMIT),
          []
        ),
        cachedSupabaseRows<QualityFileRow>(
          'file-directory:quality:v2',
          () => supabase.from('quality_control_samples').select('id, category, dealer_name, license_number, form_url, created_at').order('created_at', { ascending: false }).limit(FILE_DIRECTORY_LIMIT),
          []
        ),
      ]);

      const unified: UnifiedFile[] = [];

      excel.forEach((row) => {
        if (!row.file_url) return;
        unified.push({
          id: `excel-${row.id}`,
          title: row.file_name,
          fileUrl: row.file_url,
          fileType: inferFileTypeFromName(row.file_name, row.upload_type || undefined),
          folder: t('Office Records', 'కార్యాలయ రికార్డులు'),
          createdAt: row.created_at,
        });
      });

      forms.forEach((row) => {
        if (!row.file_url) return;
        unified.push({
          id: `form-${row.id}`,
          title: row.title,
          fileUrl: row.file_url,
          fileType: inferFileTypeFromName(row.title, row.file_type || undefined),
          folder: t('Statutory Forms', 'Statutory Forms'),
          subfolder: row.category || undefined,
          createdAt: row.created_at,
        });
      });

      crops.forEach((row) => {
        if (!row.file_url) return;
        unified.push({
          id: `crop-${row.id}`,
          title: row.title,
          fileUrl: row.file_url,
          fileType: inferFileTypeFromName(row.title, row.file_type || undefined),
          folder: t('Crop Intelligence', 'పంట ఇంటెలిజెన్స్'),
          createdAt: row.created_at,
        });
      });

      gos.forEach((row) => {
        if (!row.file_url) return;
        unified.push({
          id: `gos-${row.id}`,
          title: row.title,
          fileUrl: row.file_url,
          fileType: inferFileTypeFromName(row.title, row.file_type || undefined),
          folder: t('GOs & Circulars', 'జీ.ఓలు & సర్క్యులర్లు'),
          createdAt: row.created_at,
        });
      });

      farm.forEach((row) => {
        if (!row.file_url) return;
        unified.push({
          id: `farm-${row.id}`,
          title: row.title || row.file_name || row.document_type || 'Farm mechanization document',
          fileUrl: row.file_url,
          fileType: inferFileTypeFromName(row.file_name || row.title || row.file_url),
          folder: t('Farm Mechanization', 'వ్యవసాయ యాంత్రీకరణ'),
          subfolder: row.document_type || undefined,
          createdAt: row.created_at,
        });
      });

      subsidy.forEach((row) => {
        if (!row.beneficiary_list_url) return;
        unified.push({
          id: `subsidy-${row.id}`,
          title: `${row.program} ${row.financial_year} beneficiaries`,
          fileUrl: row.beneficiary_list_url,
          fileType: inferFileTypeFromName(row.beneficiary_list_url),
          folder: t('Subsidy & Schemes', 'సబ్సిడీ & పథకాలు'),
          subfolder: row.program,
          createdAt: row.created_at,
        });
      });

      quality.forEach((row) => {
        if (!row.form_url) return;
        unified.push({
          id: `quality-${row.id}`,
          title: `${row.category} sample ${row.dealer_name || row.license_number || ''}`.trim(),
          fileUrl: row.form_url,
          fileType: inferFileTypeFromName(row.form_url),
          folder: t('Quality Control', 'నాణ్యత నియంత్రణ'),
          subfolder: row.category,
          createdAt: row.created_at,
        });
      });

      unified.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setFiles(unified);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadAllFiles();
  }, [loadAllFiles]);

  const filtered = useMemo(() => {
    return files.filter((file) => {
      const query = search.toLowerCase();
      const matchesSearch =
        !query ||
        file.title.toLowerCase().includes(query) ||
        file.folder.toLowerCase().includes(query) ||
        (file.subfolder || '').toLowerCase().includes(query);
      const matchesType = filterType === 'all' || file.fileType === filterType;
      return matchesSearch && matchesType;
    });
  }, [files, search, filterType]);

  const folderCards = useMemo(() => {
    const grouped = new Map<string, { name: string; total: number; subfolders: Record<string, number> }>();
    files.forEach((file) => {
      const card = grouped.get(file.folder) || { name: file.folder, total: 0, subfolders: {} };
      card.total += 1;
      if (file.subfolder) card.subfolders[file.subfolder] = (card.subfolders[file.subfolder] || 0) + 1;
      grouped.set(file.folder, card);
    });
    return Array.from(grouped.values()).sort((a, b) => b.total - a.total);
  }, [files]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: files.length };
    files.forEach((file) => {
      counts[file.fileType] = (counts[file.fileType] || 0) + 1;
    });
    return counts;
  }, [files]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / FILES_PAGE_SIZE));
  const paginatedFiles = filtered.slice(
    currentPage * FILES_PAGE_SIZE,
    currentPage * FILES_PAGE_SIZE + FILES_PAGE_SIZE
  );

  useEffect(() => {
    setCurrentPage(0);
  }, [filterType, search]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('Documents', 'పత్రాలు')}
        title={t('Document Repository', 'పత్రాల భాండాగారం')}
        description={t(
          'All uploaded files across the portal with folder cards and file type symbols.',
          'పోర్టల్ అంతటా అప్లోడ్ చేసిన ఫైళ్లు ఫోల్డర్ కార్డులు మరియు ఫైల్ రకం గుర్తులతో.'
        )}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('Search files, folders, or subfolders...', 'ఫైళ్లు, ఫోల్డర్లు లేదా సబ్ ఫోల్డర్లు వెతకండి...')}
            className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        >
          <option value="all">
            {t('All types', 'అన్ని రకాలు')} ({typeCounts.all || 0})
          </option>
          {['pdf', 'excel', 'image', 'doc'].map((type) =>
            typeCounts[type] ? (
              <option key={type} value={type}>
                {getFileTypeLabel(type)} ({typeCounts[type]})
              </option>
            ) : null
          )}
        </select>
      </div>

      <div className="grid gap-3 lg:grid-cols-[15rem_1fr]">
        <aside className="space-y-2">
          {folderCards.map((folder) => (
            <div key={folder.name} className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="rounded-md bg-slate-100 p-1.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <FolderOpen className="h-4 w-4" />
                  </div>
                  <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{folder.name}</p>
                </div>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {folder.total}
                </span>
              </div>
              {Object.keys(folder.subfolders).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {Object.entries(folder.subfolders).map(([name, count]) => (
                    <span
                      key={name}
                      className="rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {name}: {count}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </aside>

        <div className="portal-card divide-y divide-slate-100 overflow-hidden dark:divide-slate-700">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center p-12 text-slate-500">
              <FolderOpen className="mb-3 h-12 w-12 opacity-40" />
              <p>{t('No files match your search', 'మీ శోధనకు ఫైళ్లు లేవు')}</p>
            </div>
          ) : (
            paginatedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <FileTypeIcon fileName={file.title} fileType={file.fileType} fileUrl={file.fileUrl} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate font-bold text-slate-900 dark:text-white">{file.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {file.folder}
                        {file.subfolder ? ` / ${file.subfolder}` : ''} ·{' '}
                        {new Date(file.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <FileActionButtons fileUrl={file.fileUrl} fileName={file.title} fileType={file.fileType} size="sm" />
                </div>
              ))
          )}
          {filtered.length > FILES_PAGE_SIZE && (
            <ListPagination
              currentPage={currentPage}
              pageCount={pageCount}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ListPagination({
  currentPage,
  pageCount,
  onPageChange,
}: {
  currentPage: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-3 py-2 text-xs font-black text-slate-600 dark:border-slate-700 dark:text-slate-300">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(0, currentPage - 1))}
        disabled={currentPage === 0}
        className="rounded-md border border-slate-200 px-2.5 py-1.5 disabled:opacity-50 dark:border-slate-700"
      >
        Previous
      </button>
      <span className="uppercase tracking-wide">
        Page {currentPage + 1} / {pageCount}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(Math.min(pageCount - 1, currentPage + 1))}
        disabled={currentPage >= pageCount - 1}
        className="rounded-md border border-slate-200 px-2.5 py-1.5 disabled:opacity-50 dark:border-slate-700"
      >
        Next
      </button>
    </div>
  );
}
