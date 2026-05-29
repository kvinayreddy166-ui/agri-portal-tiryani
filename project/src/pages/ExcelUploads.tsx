import React, { useState, useEffect } from 'react';

import { Upload, FileSpreadsheet } from 'lucide-react';

import { supabase } from '../lib/supabase';

import { useAuth } from '../context/AuthContext';

import { useLanguage } from '../context/LanguageContext';

import { ExcelUpload } from '../types/database';

import { PageHeader } from '../components/ui/PageHeader';

import { FileActionButtons } from '../components/ui/FileActionButtons';

import { getContentType, getFileTypeIcon, getFileTypeLabel, inferFileTypeFromName, validateUploadFile } from '../lib/fileTypes';

import { parseExcelAndImportDealers } from '../lib/excelParser';



const ACCEPT_TYPES =

  '.pdf,.doc,.docx,.xlsx,.xls,.csv,image/*,.jpg,.jpeg,.png,.webp,.gif';



export function ExcelUploads() {

  const { isAdminUser, user } = useAuth();

  const { t } = useLanguage();

  const [uploads, setUploads] = useState<ExcelUpload[]>([]);

  const [loading, setLoading] = useState(true);

  const [uploading, setUploading] = useState(false);

  const [dragActive, setDragActive] = useState(false);

  const [fetchError, setFetchError] = useState<string | null>(null);

  const [importMessage, setImportMessage] = useState<string | null>(null);



  useEffect(() => {

    fetchUploads();

  }, []);



  const fetchUploads = async () => {

    setFetchError(null);

    try {

      const { data, error } = await supabase

        .from('excel_uploads')

        .select('*')

        .order('created_at', { ascending: false });



      if (error) throw error;

      setUploads(data || []);

    } catch (error) {

      console.error('Error fetching uploads:', error);

      setFetchError(

        error instanceof Error

          ? error.message

          : 'Unable to load uploaded files. Please sign in again and retry.'

      );

    } finally {

      setLoading(false);

    }

  };



  const uploadSingleFile = async (file: File) => {
    const validationError = validateUploadFile(file);
    if (validationError) throw new Error(validationError);

    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');

    const fileName = `${Date.now()}_${cleanName}`;

    const filePath = `office-files/${fileName}`;

    const contentType = getContentType(file);



    const { error: uploadError } = await supabase.storage

      .from('uploads')

      .upload(filePath, file, { upsert: true, contentType });



    if (uploadError) throw uploadError;



    const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(filePath);



    const fileType = inferFileTypeFromName(file.name, file.type);

    const { error: dbError } = await supabase.from('excel_uploads').insert([{

      file_name: file.name,

      file_url: publicUrl,

      upload_type: fileType,

      created_by: user?.email || 'unknown',

    }]);



    if (dbError) throw dbError;



    if (/\.(xlsx|xls|csv)$/i.test(file.name) && isAdminUser) {

      try {

        const { imported, errors } = await parseExcelAndImportDealers(file, 'fertilizer');

        if (imported > 0) {

          setImportMessage(

            t(

              `Imported ${imported} dealer row(s) from spreadsheet.`,

              `స్ప్రెడ్‌షీట్ నుండి ${imported} డీలర్ రికార్డులు దిగుమతి అయ్యాయి.`

            )

          );

        }

        if (errors.length > 0) {

          console.warn('Excel import warnings:', errors);

        }

      } catch (parseErr) {

        console.warn('Excel parse skipped:', parseErr);

      }

    }

  };



  const handleUploadBatch = async (files: FileList | File[]) => {

    const list = Array.from(files).filter((f) => f.size > 0);

    if (list.length === 0) return;



    setUploading(true);

    setImportMessage(null);

    try {

      for (const file of list) {

        await uploadSingleFile(file);

      }

      await fetchUploads();

    } catch (error) {

      console.error('Error uploading file:', error);

      const message =

        error instanceof Error

          ? error.message

          : 'Failed to upload file. Please make sure the Supabase uploads bucket and storage policies are applied.';

      alert(message);

    } finally {

      setUploading(false);

    }

  };



  const handleDrop = (e: React.DragEvent) => {

    e.preventDefault();

    e.stopPropagation();

    setDragActive(false);

    if (e.dataTransfer.files?.length) handleUploadBatch(e.dataTransfer.files);

  };



  const handleDrag = (e: React.DragEvent) => {

    e.preventDefault();

    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);

    else if (e.type === 'dragleave') setDragActive(false);

  };



  const handleDelete = async (id: string) => {

    if (!confirm('Are you sure you want to delete this upload?')) return;

    try {

      const { error } = await supabase.from('excel_uploads').delete().eq('id', id);

      if (error) throw error;

      fetchUploads();

    } catch (error) {

      console.error('Error deleting upload:', error);

      alert('Failed to delete upload');

    }

  };



  if (loading) {

    return (

      <div className="flex h-64 items-center justify-center">

        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600" />

      </div>

    );

  }



  return (

    <div className="space-y-6">

      <PageHeader

        eyebrow={t('Office files', 'కార్యాలయ ఫైళ్లు')}

        title={isAdminUser ? t('File Uploads', 'ఫైల్ అప్లోడ్లు') : t('Office Files', 'కార్యాలయ ఫైళ్లు')}

        description={

          isAdminUser

            ? t(

                'Upload PDF, Word, Excel, and images (single or multiple). Excel dealer sheets auto-import.',

                'PDF, Word, Excel, చిత్రాలను (ఒకటి లేదా అనేకం) అప్లోడ్ చేయండి. Excel డీలర్ షీట్లు స్వయంచాలకంగా దిగుమతి అవుతాయి.'

              )

            : t('View and download files shared by the agriculture office.', 'వ్యవసాయ కార్యాలయం పంచిన ఫైళ్లను చూడండి మరియు డౌన్లోడ్ చేసుకోండి.')

        }

      />



      {isAdminUser && (

        <div

          className={`portal-card border-2 border-dashed p-8 text-center transition ${

            dragActive ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' : 'border-slate-200 hover:border-emerald-400 dark:border-slate-600'

          }`}

          onDragEnter={handleDrag}

          onDragLeave={handleDrag}

          onDragOver={handleDrag}

          onDrop={handleDrop}

        >

          <Upload className={`mx-auto mb-4 h-10 w-10 ${dragActive ? 'text-emerald-600' : 'text-slate-400'}`} />

          <p className="font-semibold text-slate-800 dark:text-slate-200">

            {uploading ? t('Uploading...', 'అప్లోడ్ అవుతోంది...') : t('Drag and drop files here', 'ఫైళ్లను ఇక్కడ డ్రాగ్ చేయండి')}

          </p>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">

            {t('Multiple files supported', 'అనేక ఫైళ్లు సపోర్ట్')}

          </p>

          <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-800">

            <input

              type="file"

              className="hidden"

              accept={ACCEPT_TYPES}

              multiple

              onChange={(e) => e.target.files && handleUploadBatch(e.target.files)}

              disabled={uploading}

            />

            {t('Select Files', 'ఫైళ్లు ఎంచుకోండి')}

          </label>

        </div>

      )}



      {importMessage && (

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">

          {importMessage}

        </div>

      )}



      {fetchError && (

        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">

          {fetchError}

        </div>

      )}



      {uploads.length > 0 ? (

        <div className="portal-card divide-y divide-slate-100 overflow-hidden dark:divide-slate-700">

          {uploads.map((upload) => {
            const fileType = upload.upload_type || inferFileTypeFromName(upload.file_name);
            const Icon = getFileTypeIcon(fileType);
            return (
              <div
                key={upload.id}
                className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-900 dark:text-white">{upload.file_name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {getFileTypeLabel(fileType)} · {t('Uploaded by', 'అప్లోడ్')}: {upload.created_by} ·{' '}
                      {new Date(upload.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FileActionButtons
                    fileUrl={upload.file_url}
                    fileName={upload.file_name}
                    fileType={fileType}
                    size="sm"
                  />
                  {isAdminUser && (
                    <button
                      type="button"
                      onClick={() => handleDelete(upload.id)}
                      className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/40"
                    >
                      {t('Delete', 'తొలగించు')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

        </div>

      ) : (

        <div className="portal-card flex flex-col items-center p-16 text-center">

          <FileSpreadsheet className="mb-4 h-14 w-14 text-slate-300" />

          <p className="text-slate-600 dark:text-slate-400">{t('No files uploaded yet', 'ఇంకా ఫైళ్లు అప్లోడ్ కాలేదు')}</p>

        </div>

      )}

    </div>

  );

}


