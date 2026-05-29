import React, { useEffect, useMemo, useState } from 'react';
import { FolderOpen, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../context/LanguageContext';
import { PageHeader } from '../components/ui/PageHeader';
import { FileActionButtons } from '../components/ui/FileActionButtons';
import { getFileTypeIcon, getFileTypeLabel, inferFileTypeFromName } from '../lib/fileTypes';

interface UnifiedFile {
  id: string;
  title: string;
  fileUrl: string;
  fileType: string;
  source: string;
  createdAt: string;
}

export function FileDirectory() {
  const { t } = useLanguage();
  const [files, setFiles] = useState<UnifiedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    loadAllFiles();
  }, []);

  const loadAllFiles = async () => {
    try {
      const [excel, forms, crops, gos, farm] = await Promise.all([
        supabase.from('excel_uploads').select('*'),
        supabase.from('forms_downloads').select('*'),
        supabase.from('crop_data').select('*'),
        supabase.from('gos_circulars').select('*'),
        supabase.from('farm_mechanization_documents').select('*'),
      ]);

      const unified: UnifiedFile[] = [];

      (excel.data || []).forEach((row) => {
        unified.push({
          id: `excel-${row.id}`,
          title: row.file_name,
          fileUrl: row.file_url,
          fileType: inferFileTypeFromName(row.file_name, row.upload_type),
          source: t('Office Files', 'కార్యాలయ ఫైళ్లు'),
          createdAt: row.created_at,
        });
      });

      (forms.data || []).forEach((row) => {
        if (!row.file_url) return;
        unified.push({
          id: `form-${row.id}`,
          title: row.title,
          fileUrl: row.file_url,
          fileType: inferFileTypeFromName(row.title, row.file_type),
          source: `${t('Forms', 'ఫారాలు')} (${row.category})`,
          createdAt: row.created_at,
        });
      });

      (crops.data || []).forEach((row) => {
        if (!row.file_url) return;
        unified.push({
          id: `crop-${row.id}`,
          title: row.title,
          fileUrl: row.file_url,
          fileType: inferFileTypeFromName(row.title, row.file_type),
          source: t('Crop Documents', 'పంట పత్రాలు'),
          createdAt: row.created_at,
        });
      });

      (gos.data || []).forEach((row) => {
        if (!row.file_url) return;
        unified.push({
          id: `gos-${row.id}`,
          title: row.title,
          fileUrl: row.file_url,
          fileType: inferFileTypeFromName(row.title, row.file_type),
          source: t('GOs & Circulars', 'జీ.ఓలు'),
          createdAt: row.created_at,
        });
      });

      (farm.data || []).forEach((row) => {
        if (!row.file_url) return;
        unified.push({
          id: `farm-${row.id}`,
          title: row.title || row.document_type,
          fileUrl: row.file_url,
          fileType: inferFileTypeFromName(row.title || '', row.file_type),
          source: t('Farm Mechanization', 'యాంత్రీకరణ'),
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
  };

  const filtered = useMemo(() => {
    return files.filter((f) => {
      const matchesSearch =
        !search ||
        f.title.toLowerCase().includes(search.toLowerCase()) ||
        f.source.toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === 'all' || f.fileType === filterType;
      return matchesSearch && matchesType;
    });
  }, [files, search, filterType]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: files.length };
    files.forEach((f) => {
      counts[f.fileType] = (counts[f.fileType] || 0) + 1;
    });
    return counts;
  }, [files]);

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
        title={t('File Directory', 'ఫైల్ డైరెక్టరీ')}
        description={t(
          'All uploaded files across the portal with type indicators.',
          'పోర్టల్ అంతటా అప్లోడ్ చేసిన ఫైళ్లు రకం సూచికలతో.'
        )}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('Search files...', 'ఫైళ్లు వెతకండి...')}
            className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        >
          <option value="all">{t('All types', 'అన్ని రకాలు')} ({typeCounts.all || 0})</option>
          {['pdf', 'excel', 'image', 'doc'].map((type) =>
            typeCounts[type] ? (
              <option key={type} value={type}>
                {getFileTypeLabel(type)} ({typeCounts[type]})
              </option>
            ) : null
          )}
        </select>
      </div>

      <div className="portal-card divide-y divide-slate-100 overflow-hidden dark:divide-slate-700">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center p-12 text-slate-500">
            <FolderOpen className="mb-3 h-12 w-12 opacity-40" />
            <p>{t('No files match your search', 'మీ శోధనకు ఫైళ్లు లేవు')}</p>
          </div>
        ) : (
          filtered.map((file) => {
            const Icon = getFileTypeIcon(file.fileType);
            return (
              <div
                key={file.id}
                className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-900 dark:text-white">{file.title}</p>
                    <p className="text-xs text-slate-500">
                      {file.source} · {getFileTypeLabel(file.fileType)} ·{' '}
                      {new Date(file.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <FileActionButtons fileUrl={file.fileUrl} fileName={file.title} fileType={file.fileType} size="sm" />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
