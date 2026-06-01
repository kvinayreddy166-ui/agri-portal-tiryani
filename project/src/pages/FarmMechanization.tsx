import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  FileText,
  FileUp,
  Plus,
  Trash2,
  Tractor,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getContentType } from '../lib/fileTypes';
import { FileActionButtons } from '../components/ui/FileActionButtons';
import { FileTypeIcon } from '../components/ui/FileTypeIcon';
import { useAuth } from '../context/AuthContext';
import { FarmMechanizationDocument } from '../types/database';

const financialYears = ['2025-2026', '2026-2027', '2027-2028', '2028-2029', '2029-2030'];

const documentTypes = [
  { id: 'applications_received', label: 'Applications Received' },
  { id: 'proceedings_generated', label: 'Proceedings Generated' },
] as const;

export function FarmMechanization() {
  const { isAdminUser, user } = useAuth();
  const [financialYear, setFinancialYear] = useState(financialYears[0]);
  const [documents, setDocuments] = useState<FarmMechanizationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [documentType, setDocumentType] =
    useState<FarmMechanizationDocument['document_type']>('applications_received');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const counts = useMemo(() => {
    return {
      applications: documents.filter((doc) => doc.document_type === 'applications_received').length,
      proceedings: documents.filter((doc) => doc.document_type === 'proceedings_generated').length,
    };
  }, [documents]);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('farm_mechanization_documents')
        .select('*')
        .eq('financial_year', financialYear)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching farm mechanization documents:', error);
    } finally {
      setLoading(false);
    }
  }, [financialYear]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const saveDocument = async () => {
    if (!title.trim() || !file) {
      alert('Please enter a title and select a file');
      return;
    }

    setSaving(true);
    try {
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `farm-mechanization/${financialYear}/${documentType}/${Date.now()}_${cleanName}`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file, { upsert: true, contentType: getContentType(file) });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      const { error } = await supabase
        .from('farm_mechanization_documents')
        .insert([{
          document_type: documentType,
          financial_year: financialYear,
          title: title.trim(),
          file_name: file.name,
          file_url: publicUrl,
          created_by: user?.email || 'admin',
        }]);

      if (error) throw error;

      setShowUpload(false);
      setTitle('');
      setFile(null);
      setDocumentType('applications_received');
      fetchDocuments();
    } catch (error) {
      console.error('Error saving farm mechanization document:', error);
      alert('Failed to upload document. Please check storage/database setup.');
    } finally {
      setSaving(false);
    }
  };

  const deleteDocument = async (id: string) => {
    if (!confirm('Delete this farm mechanization document?')) return;

    try {
      const { error } = await supabase
        .from('farm_mechanization_documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting farm mechanization document:', error);
      alert('Failed to delete document');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-gradient-to-r from-emerald-700 via-lime-700 to-cyan-700 p-5 text-white shadow-lg md:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-emerald-100">Admin Uploads</p>
            <h1 className="mt-1 flex items-center gap-3 text-3xl font-black tracking-tight">
              <Tractor className="h-8 w-8" />
              Farm Mechanization
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-emerald-50">
              Maintain applications received and proceedings generated for each financial year.
            </p>
          </div>
          <div className="min-w-52">
            <label className="mb-2 block text-sm font-bold text-emerald-50">Financial Year</label>
            <select
              value={financialYear}
              onChange={(e) => setFinancialYear(e.target.value)}
              className="w-full rounded-lg border border-white/20 bg-white px-3 py-2 font-bold text-gray-950 outline-none"
            >
              {financialYears.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SummaryCard label="Applications Received" count={counts.applications} />
        <SummaryCard label="Proceedings Generated" count={counts.proceedings} />
      </div>

      <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-gray-950">Documents</h2>
            <p className="text-sm text-gray-500">Farm mechanization records for {financialYear}</p>
          </div>
          {isAdminUser && (
            <button
              onClick={() => setShowUpload(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 font-bold text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-800"
            >
              <Plus className="h-5 w-5" />
              Upload Document
            </button>
          )}
        </div>

        {documents.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-gray-100">
            <div className="divide-y divide-gray-100">
              {documents.map((document) => (
                <div key={document.id} className="grid grid-cols-[1fr_auto] gap-2 p-3 transition hover:bg-gray-50 lg:grid-cols-[1fr_1fr_auto] lg:items-center">
                  <div className="flex min-w-0 items-center gap-3">
                    <FileTypeIcon fileName={document.file_name || document.title} fileUrl={document.file_url} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-gray-950">{document.title}</p>
                      <p className="truncate text-xs text-gray-500">{document.file_name}</p>
                    </div>
                  </div>
                  <div className="col-start-1 space-y-1 text-xs text-gray-600 lg:col-start-auto lg:text-sm">
                    <p className="font-semibold">
                      {documentTypes.find((type) => type.id === document.document_type)?.label}
                    </p>
                    <p className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-emerald-600" />
                      {new Date(document.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="row-span-2 flex items-center gap-1 lg:row-span-1">
                    <FileActionButtons
                      fileUrl={document.file_url}
                      fileName={document.file_name || document.title}
                    />
                    {isAdminUser && (
                      <button
                        onClick={() => deleteDocument(document.id)}
                        className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                        aria-label="Delete document"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p className="font-semibold text-gray-600">No farm mechanization documents uploaded for this year yet.</p>
          </div>
        )}
      </section>

      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-gray-950">Upload Farm Mechanization Document</h2>
                <p className="text-sm text-gray-500">{financialYear}</p>
              </div>
              <button onClick={() => setShowUpload(false)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-bold text-gray-700">Document Type</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value as FarmMechanizationDocument['document_type'])}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                >
                  {documentTypes.map((type) => (
                    <option key={type.id} value={type.id}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold text-gray-700">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  placeholder="Enter document title"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold text-gray-700">File</label>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-4 hover:border-emerald-400 hover:bg-emerald-50">
                  <FileUp className="h-5 w-5 text-emerald-700" />
                  <span className="truncate text-sm font-semibold text-gray-700">
                    {file ? file.name : 'Upload application or proceeding file'}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.xlsx,.xls,.csv"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowUpload(false)}
                className="flex-1 rounded-xl border border-gray-300 px-4 py-3 font-bold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveDocument}
                disabled={saving}
                className="flex-1 rounded-xl bg-emerald-700 px-4 py-3 font-bold text-white hover:bg-emerald-800 disabled:opacity-60"
              >
                {saving ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, count }: { label: string; count: number }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-3 w-fit rounded-lg bg-emerald-50 p-2 text-emerald-700">
        <FileText className="h-5 w-5" />
      </div>
      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-black text-gray-950">{count}</p>
    </div>
  );
}
