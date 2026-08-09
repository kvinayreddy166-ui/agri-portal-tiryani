import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Edit2,
  FileUp,
  Leaf,
  Save,
  Sprout,
  Trash2,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { uploadPortalFile } from '../lib/uploadFile';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getCropIntelligence } from '../lib/cropIntelligence';

interface CropPageProps {
  cropType: string;
}

interface LocalizedText {
  en: string;
  te: string;
}

interface CropPractice {
  key: string;
  title: LocalizedText;
  body: LocalizedText;
}

interface CropRisk {
  type: string;
  name: LocalizedText;
  symptoms: LocalizedText;
  control: LocalizedText;
  chemicals: string[];
  newChemicals: string[];
  image_url: string;
  image_source_url?: string;
}

interface CropIntelligenceRecord {
  id?: string;
  slug: string;
  name_en: string;
  name_te: string;
  scientific_name: string;
  crop_image_url: string;
  source_pdf_name?: string;
  source_pdf_url?: string;
  content: {
    soil: LocalizedText;
    duration: LocalizedText;
    varieties: Array<{ name: string; duration?: string; notes: LocalizedText }>;
    practices: CropPractice[];
  };
  risks: CropRisk[];
}

const cropImages: Record<string, string> = {
  cotton: '/images/cotton.webp',
  paddy: '/images/paddy.webp',
  rice: '/images/paddy.webp',
  maize: '/images/maize.webp',
  redgram: '/images/pulses.webp',
  greengram: '/images/greengram.webp',
  pulses: '/images/pulses.webp',
  oilseeds: '/images/oilseeds.webp',
};
const CROP_PAGE_CACHE_PREFIX = 'tiryani-crop-page-cache:';
const CROP_PAGE_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

export function CropPage({ cropType }: CropPageProps) {
  const { isAdminUser } = useAuth();
  const { language, t } = useLanguage();
  const [record, setRecord] = useState<CropIntelligenceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editText, setEditText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const slug = cropType === 'paddy' ? 'rice' : cropType;
  const fallback = useMemo(() => buildFallbackRecord(slug), [slug]);
  const visibleRecord = record || fallback;
  const locale = language === 'te' ? 'te' : 'en';

  const fetchCropIntelligence = useCallback(async () => {
    const cachedRecord = readCropPageCache(slug);
    if (cachedRecord) {
      setRecord(cachedRecord);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const { data, error } = await supabase
        .from('crop_intelligence')
        .select('id, slug, name_en, name_te, scientific_name, crop_image_url, source_pdf_name, source_pdf_url, content, risks')
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;
      setRecord(data as CropIntelligenceRecord | null);
      if (data) writeCropPageCache(slug, data as CropIntelligenceRecord);
    } catch (error) {
      console.error('Error loading crop intelligence:', error);
      if (!cachedRecord) setRecord(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void fetchCropIntelligence();
  }, [fetchCropIntelligence]);

  const openEditor = () => {
    setEditText(JSON.stringify(visibleRecord, null, 2));
    setEditOpen(true);
  };

  const saveRecord = async () => {
    setSaving(true);
    try {
      const parsed = JSON.parse(editText) as CropIntelligenceRecord;
      const payload = {
        slug: parsed.slug || slug,
        name_en: parsed.name_en,
        name_te: parsed.name_te,
        scientific_name: parsed.scientific_name,
        crop_image_url: parsed.crop_image_url,
        source_pdf_name: parsed.source_pdf_name || null,
        source_pdf_url: parsed.source_pdf_url || null,
        content: parsed.content,
        risks: parsed.risks,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('crop_intelligence')
        .upsert(payload, { onConflict: 'slug' });

      if (error) throw error;
      clearCropPageCache(slug);
      setEditOpen(false);
      void fetchCropIntelligence();
    } catch (error) {
      console.error('Error saving crop intelligence:', error);
      alert(error instanceof Error ? error.message : 'Unable to save crop intelligence.');
    } finally {
      setSaving(false);
    }
  };

  const deleteRecord = async () => {
    if (!record?.id || !confirm('Delete this crop intelligence record?')) return;
    try {
      const { error } = await supabase.from('crop_intelligence').delete().eq('id', record.id);
      if (error) throw error;
      clearCropPageCache(slug);
      setRecord(null);
    } catch (error) {
      console.error('Error deleting crop intelligence:', error);
      alert('Unable to delete crop intelligence record.');
    }
  };

  const uploadSourcePdf = async (file: File) => {
    setUploading(true);
    try {
      const uploaded = await uploadPortalFile(file, `crop-intelligence/${slug}`);
      const nextRecord = {
        ...visibleRecord,
        source_pdf_name: file.name,
        source_pdf_url: uploaded.publicUrl,
      };
      const { error } = await supabase.from('crop_intelligence').upsert({
        slug: nextRecord.slug,
        name_en: nextRecord.name_en,
        name_te: nextRecord.name_te,
        scientific_name: nextRecord.scientific_name,
        crop_image_url: nextRecord.crop_image_url,
        source_pdf_name: nextRecord.source_pdf_name,
        source_pdf_url: nextRecord.source_pdf_url,
        content: nextRecord.content,
        risks: nextRecord.risks,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'slug' });
      if (error) throw error;
      clearCropPageCache(slug);
      void fetchCropIntelligence();
    } catch (error) {
      console.error('Error uploading source PDF:', error);
      alert(error instanceof Error ? error.message : 'Unable to upload source PDF.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-xl">
        <img
          src={visibleRecord.crop_image_url || cropImages[slug] || cropImages.cotton}
          alt={visibleRecord.name_en}
          width={1200}
          height={400}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-emerald-900/80 to-slate-900/55" />
        <div className="relative p-5 text-white md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-1.5 text-sm font-black">
                <Leaf className="h-4 w-4" />
                Crop Intelligence
              </div>
              <h1 className="text-3xl font-black tracking-tight">
                {locale === 'te' ? visibleRecord.name_te : visibleRecord.name_en}
              </h1>
              <p className="mt-1 text-sm italic text-emerald-100">{visibleRecord.scientific_name}</p>
              <p className="mt-3 max-w-3xl text-sm font-semibold text-emerald-50">
                {text(visibleRecord.content.soil, locale)}
              </p>
            </div>
            {isAdminUser && (
              <div className="flex flex-wrap gap-2">
                <button onClick={openEditor} className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-black text-emerald-800">
                  <Edit2 className="h-4 w-4" />
                  Edit
                </button>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-sm font-black text-white ring-1 ring-white/25">
                  <FileUp className="h-4 w-4" />
                  {uploading ? 'Uploading...' : 'Upload PDF'}
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadSourcePdf(file);
                    }}
                  />
                </label>
                {record?.id && (
                  <button onClick={deleteRecord} className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-sm font-black text-white">
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-3 flex items-center gap-2 text-xl font-black text-slate-950 dark:text-white">
            <Sprout className="h-5 w-5 text-emerald-700" />
            {t('Production Guide', 'ఉత్పత్తి మార్గదర్శిని')}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoCard label={t('Duration', 'పంట కాలం')} value={text(visibleRecord.content.duration, locale)} />
            <InfoCard label={t('Source PDF', 'మూల పీడీఎఫ్')} value={visibleRecord.source_pdf_name || 'PJTAU crop PDF'} />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {visibleRecord.content.practices.map((practice) => (
              <article key={practice.key} className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                <h3 className="text-sm font-black text-emerald-800 dark:text-emerald-300">{text(practice.title, locale)}</h3>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-700 dark:text-slate-200">{text(practice.body, locale)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-3 flex items-center gap-2 text-xl font-black text-slate-950 dark:text-white">
            <CheckCircle2 className="h-5 w-5 text-emerald-700" />
            {t('Varieties', 'రకాలు')}
          </h2>
          <div className="space-y-2">
            {visibleRecord.content.varieties.map((variety) => (
              <article key={variety.name} className="rounded-lg border border-slate-100 p-3 dark:border-slate-700">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-black text-slate-950 dark:text-white">{variety.name}</h3>
                  {variety.duration && <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700">{variety.duration}</span>}
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">{text(variety.notes, locale)}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="mb-3 flex items-center gap-2 text-xl font-black text-slate-950 dark:text-white">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          {t('Pests, Diseases and Control', 'పురుగులు, తెగుళ్లు మరియు నియంత్రణ')}
        </h2>
        <div className="grid gap-3 lg:grid-cols-2">
          {visibleRecord.risks.map((risk) => (
            <article key={`${risk.type}-${risk.name.en}`} className="overflow-hidden rounded-lg border border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex gap-3 p-3">
                <img
                  src={risk.image_url}
                  alt={text(risk.name, locale)}
                  width={80}
                  height={80}
                  loading="lazy"
                  decoding="async"
                  onClick={() => setSelectedImage(risk.image_url)}
                  className="h-20 w-20 shrink-0 cursor-pointer rounded-full object-cover ring-2 ring-emerald-200 dark:ring-emerald-800"
                />
                <div className="flex-1">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <h3 className="font-black text-slate-950 dark:text-white">{text(risk.name, locale)}</h3>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black uppercase text-emerald-700 dark:bg-slate-900">{risk.type}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{text(risk.symptoms, locale)}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-100">{text(risk.control, locale)}</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <PillList label={t('PDF chemicals', 'పీడీఎఫ్ రసాయనాలు')} items={risk.chemicals} />
                    <PillList label={t('Newer options', 'కొత్త ఎంపికలు')} items={risk.newChemicals} />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-xl bg-white shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-700">
              <div>
                <h2 className="text-xl font-black text-slate-950 dark:text-white">Edit Crop Intelligence JSON</h2>
                <p className="text-sm text-slate-500">Update bilingual text, varieties, risks, chemicals, or image URLs.</p>
              </div>
              <button onClick={() => setEditOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <textarea
              value={editText}
              onChange={(event) => setEditText(event.target.value)}
              className="min-h-[55vh] flex-1 resize-none border-0 bg-slate-950 p-4 font-mono text-xs leading-5 text-slate-100 outline-none"
              spellCheck={false}
            />
            <div className="flex gap-3 border-t border-slate-200 p-4 dark:border-slate-700">
              <button onClick={() => setEditOpen(false)} className="flex-1 rounded-lg border border-slate-300 px-4 py-2 font-bold text-slate-700">
                Cancel
              </button>
              <button onClick={saveRecord} disabled={saving} className="flex-1 rounded-lg bg-emerald-700 px-4 py-2 font-bold text-white disabled:opacity-60">
                <Save className="mr-2 inline h-4 w-4" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -right-4 -top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-950 shadow-lg hover:bg-slate-100"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={selectedImage}
              alt="Pest/Disease"
              className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function text(value: LocalizedText, locale: 'en' | 'te') {
  return value?.[locale] || value?.en || '';
}

function readCropPageCache(slug: string) {
  try {
    const raw = window.localStorage.getItem(`${CROP_PAGE_CACHE_PREFIX}${slug}`);
    if (!raw) return null;

    const cached = JSON.parse(raw);
    if (!cached || cached.expiresAt < Date.now()) {
      window.localStorage.removeItem(`${CROP_PAGE_CACHE_PREFIX}${slug}`);
      return null;
    }

    return cached.value as CropIntelligenceRecord;
  } catch {
    return null;
  }
}

function writeCropPageCache(slug: string, value: CropIntelligenceRecord) {
  try {
    window.localStorage.setItem(
      `${CROP_PAGE_CACHE_PREFIX}${slug}`,
      JSON.stringify({
        value,
        expiresAt: Date.now() + CROP_PAGE_CACHE_TTL_MS,
      })
    );
  } catch {
    // If local storage is full or unavailable, live fetching still works.
  }
}

function clearCropPageCache(slug: string) {
  try {
    window.localStorage.removeItem(`${CROP_PAGE_CACHE_PREFIX}${slug}`);
  } catch {
    // Cache cleanup should not block writes.
  }
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  );
}

function PillList({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-1 flex flex-wrap gap-1">
        {items.map((item) => (
          <span key={item} className="rounded-full bg-white px-2 py-1 text-[11px] font-bold text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-200">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function buildFallbackRecord(slug: string): CropIntelligenceRecord {
  const fallback = getCropIntelligence(slug === 'rice' ? 'paddy' : slug);
  return {
    slug,
    name_en: fallback?.label || slug,
    name_te: fallback?.label || slug,
    scientific_name: fallback?.scientificName || '',
    crop_image_url: fallback?.image || cropImages[slug] || cropImages.cotton,
    source_pdf_name: `${slug}.pdf`,
    content: {
      soil: { en: fallback?.soil || '', te: fallback?.soil || '' },
      duration: { en: fallback?.duration || '', te: fallback?.duration || '' },
      varieties: (fallback?.varieties || []).map((name) => ({ name, notes: { en: 'Recommended for local conditions.', te: 'స్థానిక పరిస్థితులకు అనుకూలం.' } })),
      practices: [
        { key: 'nursery', title: { en: 'Nursery / Sowing', te: 'నారు / విత్తడం' }, body: { en: fallback?.management.nursery || '', te: fallback?.management.nursery || '' } },
        { key: 'fertilizer', title: { en: 'Fertilizer', te: 'ఎరువులు' }, body: { en: fallback?.management.fertilizer || '', te: fallback?.management.fertilizer || '' } },
        { key: 'weed', title: { en: 'Weed Control', te: 'కలుపు నియంత్రణ' }, body: { en: fallback?.management.weed || '', te: fallback?.management.weed || '' } },
        { key: 'irrigation', title: { en: 'Irrigation', te: 'నీటి నిర్వహణ' }, body: { en: fallback?.management.irrigation || '', te: fallback?.management.irrigation || '' } },
      ],
    },
    risks: (fallback?.risks || []).map((risk) => ({
      type: risk.type,
      name: { en: risk.name, te: risk.name },
      symptoms: { en: risk.symptoms, te: risk.symptoms },
      control: { en: risk.action, te: risk.action },
      chemicals: [],
      newChemicals: [],
      image_url: risk.image,
    })),
  };
}
