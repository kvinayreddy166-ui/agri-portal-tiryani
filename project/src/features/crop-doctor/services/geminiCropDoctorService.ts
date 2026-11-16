import { safeStorage } from '../../../shared/lib/safeStorage';
import type { CropProtectionCrop, CropProtectionItem } from './cropProtectionService';

export const GEMINI_API_KEY_STORAGE = 'agronix_gemini_api_key';
export const GEMINI_DEFAULT_MODEL = 'models/gemini-3.8-flash';
export const GEMINI_FALLBACK_MODELS = [
  'models/gemini-3.8-flash',
  'gemini-3.8-flash',
  'models/gemini-3.5-flash',
  'gemini-3.5-flash',
];

export type GeminiDiagnosisRecommendation = {
  control_type: 'chemical' | 'biological' | 'cultural' | 'mechanical';
  title_en: string;
  title_te?: string;
  description_en: string;
  description_te?: string;
  chemical_name?: string | null;
  formulation?: string | null;
  dose_per_litre?: string | null;
  dose_per_acre?: string | null;
  dose_per_tank_16l?: string | null;
  dose_per_tank_20l?: string | null;
  waiting_period?: string | null;
  safety_note_en?: string | null;
  safety_note_te?: string | null;
};

export type GeminiCropDiagnosisResult = {
  crop_detected_en: string;
  crop_detected_te?: string;
  category: 'pest' | 'disease' | 'weed' | 'nutrient' | 'healthy' | 'unknown';
  name_en: string;
  name_te?: string;
  scientific_name?: string;
  severity: 'low' | 'medium' | 'high';
  confidence: number; // 0 to 100
  affected_parts_en?: string;
  affected_parts_te?: string;
  stage_en?: string;
  stage_te?: string;
  symptoms_en: string;
  symptoms_te?: string;
  damage_en: string;
  damage_te?: string;
  favourable_conditions_en?: string;
  favourable_conditions_te?: string;
  etl?: string;
  recommendations: GeminiDiagnosisRecommendation[];
  preventive_tips_en?: string[];
  preventive_tips_te?: string[];
  disclaimer_en: string;
  disclaimer_te?: string;
  matched_item_id?: string;
  matched_crop_key?: string;
  matched_item?: CropProtectionItem;
  analyzed_at: string;
};

/**
 * Retrieves the Gemini API key from environment variable or localStorage.
 */
export function getGeminiApiKey(): string {
  const envKey = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim();
  if (envKey) return envKey;
  try {
    return safeStorage.getItem(GEMINI_API_KEY_STORAGE)?.trim() || '';
  } catch {
    return '';
  }
}

/**
 * Stores the Gemini API key locally in safeStorage.
 */
export function setGeminiApiKey(key: string): void {
  try {
    safeStorage.setItem(GEMINI_API_KEY_STORAGE, key.trim());
  } catch {
    // ignore storage error
  }
}

/**
 * Clears the stored Gemini API key from safeStorage.
 */
export function clearGeminiApiKey(): void {
  try {
    safeStorage.removeItem(GEMINI_API_KEY_STORAGE);
  } catch {
    // ignore storage error
  }
}

/**
 * Checks if a Gemini API key is configured.
 */
export function hasGeminiApiKey(): boolean {
  return Boolean(getGeminiApiKey());
}

/**
 * Validates a Gemini API key using the Interactions API (with generateContent fallback).
 */
export async function validateGeminiApiKey(apiKey: string): Promise<{ valid: boolean; message: string }> {
  const key = apiKey.trim();
  if (!key) return { valid: false, message: 'Please enter a valid Gemini API key.' };

  // 1. Primary: Interactions API with gemini-3.8-flash
  try {
    const interactionsUrl = `https://generativelanguage.googleapis.com/v1/interactions?key=${encodeURIComponent(key)}`;
    const interactionRes = await fetch(interactionsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/gemini-3.8-flash',
        input: 'Respond with OK.',
      }),
    });

    if (interactionRes.ok) {
      return { valid: true, message: 'Gemini 3.8 Flash (Interactions API) is active and ready!' };
    }
  } catch {
    // try fallback
  }

  // 2. Fallback: generateContent endpoint with gemini-3.8-flash
  try {
    const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${encodeURIComponent(key)}`;
    const fallbackRes = await fetch(fallbackUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Respond with OK.' }] }],
        generationConfig: { maxOutputTokens: 10 },
      }),
    });

    if (fallbackRes.ok) {
      return { valid: true, message: 'Gemini 3.8 Flash is active and ready!' };
    }

    const errJson = await fallbackRes.json().catch(() => null);
    const errMsg = errJson?.error?.message || `HTTP ${fallbackRes.status}: ${fallbackRes.statusText}`;
    return { valid: false, message: errMsg };
  } catch (error) {
    return {
      valid: false,
      message: error instanceof Error ? error.message : 'Network error connecting to Gemini API.',
    };
  }
}

/**
 * Compresses and resizes an uploaded or camera-captured image file for fast, reliable upload.
 */
export async function compressImageForDiagnosis(
  file: File | Blob,
  maxWidth = 1280,
  maxHeight = 1280,
  quality = 0.85
): Promise<{
  base64: string;
  mimeType: string;
  dataUrl: string;
  sizeKb: number;
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image in canvas.'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable.'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const mimeType = 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, quality);
        const base64 = dataUrl.split(',')[1] || '';
        const sizeKb = Math.round((base64.length * 3) / 4 / 1024);

        resolve({
          base64,
          mimeType,
          dataUrl,
          sizeKb,
          width,
          height,
        });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Builds the comprehensive prompt for Gemini Multimodal Crop Pest/Disease Analysis.
 */
function buildDiagnosisPrompt(
  selectedCropKey?: string,
  fieldNotes?: string,
  _language: 'en' | 'te' = 'en'
): string {
  const cropHint = selectedCropKey && selectedCropKey !== 'auto'
    ? `The farmer/officer indicated this is likely a ${selectedCropKey.toUpperCase()} crop.`
    : `Detect the crop automatically from the plant morphology in the photo.`;

  const notesHint = fieldNotes?.trim()
    ? `Additional field observations provided by officer/farmer: "${fieldNotes.trim()}".`
    : '';

  return `
You are a Senior Agricultural Scientist, Plant Pathologist, and Entomologist specialized in Indian agriculture, specifically Professor Jayashankar Telangana State Agricultural University (PJTSAU), ICAR, and Central Insecticides Board & Registration Committee (CIBRC) standards for Telangana and Deccan plateau crops (e.g. Cotton, Paddy/Rice, Chilli, Maize, Redgram, Greengram, Blackgram, Groundnut, Soybean, Sesamum, Sunflower).

TASK:
Examine the provided image of a plant/leaf/stem/root/fruit closely to identify any insect pest, plant disease (fungal, bacterial, viral), weed, or nutrient deficiency.
${cropHint}
${notesHint}

OUTPUT INSTRUCTIONS:
Return a strictly valid JSON object (no markdown code blocks, no text before or after).
The JSON MUST follow this schema:
{
  "crop_detected_en": "Crop name in English (e.g. Cotton, Paddy, Chilli)",
  "crop_detected_te": "Crop name in Telugu script (e.g. పత్తి, వరి, మిరప)",
  "category": "pest" | "disease" | "weed" | "nutrient" | "healthy" | "unknown",
  "name_en": "Common name of pest, disease or condition in English (e.g. Brown Plant Hopper, Bacterial Leaf Blight, Pink Bollworm)",
  "name_te": "Common name in Telugu script (e.g. గోధుమ రంగు దోమ, బాక్టీరియా ఆకు ఎండు తెగులు, గులాబీ రంగు కాయ తొలుచు పురుగు)",
  "scientific_name": "Scientific binomial name if applicable (e.g. Nilaparvata lugens, Xanthomonas oryzae)",
  "severity": "low" | "medium" | "high",
  "confidence": 85, // integer 0 to 100
  "affected_parts_en": "Leaves, tillers, stem, bolls, etc.",
  "affected_parts_te": "ఆకులు, పిలకలు, కాండం, కాయలు మొదలైనవి",
  "stage_en": "Vegetative, Flowering, Boll formation, Grain filling, etc.",
  "stage_te": "శాఖీయ దశ, పూత దశ, కాయ దశ, పాలు పోసుకునే దశ మొదలైనవి",
  "symptoms_en": "Clear, bulleted explanation of visible symptoms identified in the image.",
  "symptoms_te": "చిత్రంలో కనిపించే లక్షణాల వివరణ (తెలుగులో).",
  "damage_en": "Potential crop damage, yield loss risk, and field impact.",
  "damage_te": "పంటకు కలిగే నష్టం మరియు దిగుబడి తగ్గే ప్రమాదం (తెలుగులో).",
  "favourable_conditions_en": "Weather, temperature, relative humidity, or irrigation practices that favor this problem.",
  "favourable_conditions_te": "ఈ సమస్య వ్యాప్తికి అనుకూల వాతావరణ పరిస్థితులు (తెలుగులో).",
  "etl": "Economic Threshold Level (ETL) if pest (e.g. 5-10 BPH per hill, 1 larva per meter row, 5% damaged bolls).",
  "recommendations": [
    {
      "control_type": "chemical" | "biological" | "cultural" | "mechanical",
      "title_en": "Short recommendation title (e.g. Triflumezopyrim 10% SC spray, Pheromone traps, Water management)",
      "title_te": "సిఫార్సు శీర్షిక తెలుగులో",
      "description_en": "Actionable instructions for the officer/farmer.",
      "description_te": "రైతు పాటించవలసిన సూచనలు తెలుగులో.",
      "chemical_name": "Technical chemical name approved by CIBRC/PJTSAU (e.g. Triflumezopyrim 10% SC, Chlorantraniliprole 18.5% SC) or null",
      "formulation": "e.g. 10% SC, 25% EC, 75% WP or null",
      "dose_per_litre": "e.g. 0.5 ml / L or null",
      "dose_per_acre": "e.g. 94 ml / acre or null",
      "dose_per_tank_16l": "e.g. 8 ml / 16L tank or null",
      "dose_per_tank_20l": "e.g. 10 ml / 20L tank or null",
      "waiting_period": "Pre-harvest interval in days (e.g. 21 days) or null",
      "safety_note_en": "Safety precautions (e.g. Wear mask and gloves, spray in morning or late evening) or null",
      "safety_note_te": "రక్షణ జాగ్రత్తలు తెలుగులో లేదా null"
    }
  ],
  "preventive_tips_en": [
    "Preventive practice 1 for subsequent crop seasons",
    "Preventive practice 2"
  ],
  "preventive_tips_te": [
    "తదుపరి పంట కాలం కోసం ముందస్తు జాగ్రత్త 1",
    "ముందస్తు జాగ్రత్త 2"
  ],
  "disclaimer_en": "Recommendations are based on standard PJTSAU & CIBRC agricultural advisories. Field officers and farmers should inspect the field and follow official product labels.",
  "disclaimer_te": "ఈ సూచనలు PJTSAU మరియు CIBRC అధికారిక మార్గదర్శకాల ఆధారంగా రూపొందించబడ్డాయి. దరఖాస్తు చేసే ముందు లేబుల్ సూచనలను పరిశీలించండి."
}

REQUIREMENTS:
1. Provide realistic, scientifically accurate CIBRC-registered active ingredients and PJTSAU dosage recommendations for Indian conditions.
2. If the plant appears healthy with no visible pest or disease, set category to "healthy", describe the healthy plant characteristics, and provide good agronomic maintenance tips.
3. If the image is not a plant or is too blurry to diagnose, set category to "unknown" and explain what was visible and request a clearer close-up photograph of the affected leaf/plant part.
4. Always provide both English and proper Telugu script strings.
`.trim();
}

/**
 * Extracts plain text output from Gemini Interactions API response.
 */
function extractTextFromInteraction(json: Record<string, unknown>): string | null {
  if (json?.output_text && typeof json.output_text === 'string') {
    return json.output_text;
  }
  if (Array.isArray(json?.steps)) {
    let combined = '';
    for (const step of json.steps) {
      if (step?.type === 'model_output' && Array.isArray(step?.content)) {
        for (const item of step.content) {
          if (item?.type === 'text' && typeof item?.text === 'string') {
            combined += item.text;
          }
        }
      }
    }
    if (combined) return combined;
  }
  return null;
}

/**
 * Calls Google Gemini Multimodal API using the Interactions API (with generateContent fallback).
 */
export async function analyzeCropImageWithGemini(params: {
  imageBase64: string;
  mimeType: string;
  selectedCropKey?: string;
  fieldNotes?: string;
  language?: 'en' | 'te';
  crops?: CropProtectionCrop[];
}): Promise<GeminiCropDiagnosisResult> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('Gemini API key not configured. Please enter your Google Gemini API key to continue.');
  }

  const {
    imageBase64,
    mimeType,
    selectedCropKey,
    fieldNotes,
    language = 'en',
    crops = [],
  } = params;

  const promptText = buildDiagnosisPrompt(selectedCropKey, fieldNotes, language);
  let lastError: Error | null = null;

  // 1. Primary: Interactions API (v1/interactions) with gemini-3.8-flash
  for (const model of GEMINI_FALLBACK_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1/interactions?key=${encodeURIComponent(apiKey)}`;
      const requestPayload = {
        model,
        input: [
          {
            type: 'text',
            text: promptText,
          },
          {
            type: 'image',
            data: imageBase64,
            mime_type: mimeType || 'image/jpeg',
          },
        ],
        response_format: {
          type: 'text',
          mime_type: 'application/json',
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });

      if (response.ok) {
        const json = await response.json();
        const rawText = extractTextFromInteraction(json);
        if (rawText) {
          const parsedResult = parseGeminiResponse(rawText);
          const matched = matchWithLocalDatabase(parsedResult, crops, selectedCropKey);
          return {
            ...parsedResult,
            ...matched,
            analyzed_at: new Date().toISOString(),
          };
        }
      } else {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error?.message || `HTTP ${response.status} ${response.statusText}`;
        console.warn(`Gemini Interactions API (${model}) returned:`, errorMessage);
        lastError = new Error(`Interactions API (${model}): ${errorMessage}`);
        if (response.status === 429) {
          throw new Error('Gemini API rate limit exceeded. Please wait a few seconds and try again.');
        }
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('rate limit')) throw err;
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  // 2. Secondary fallback: generateContent endpoint (v1beta)
  for (const model of GEMINI_FALLBACK_MODELS) {
    try {
      const modelClean = model.replace(/^models\//, '');
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelClean}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const requestPayload = {
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: mimeType || 'image/jpeg',
                  data: imageBase64,
                },
              },
              {
                text: promptText,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.15,
          topK: 32,
          topP: 0.9,
          responseMimeType: 'application/json',
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error?.message || `HTTP ${response.status} ${response.statusText}`;
        console.warn(`Gemini generateContent (${modelClean}) returned:`, errorMessage);
        lastError = new Error(`Gemini (${modelClean}): ${errorMessage}`);
        if (response.status === 429) {
          throw new Error('Gemini API rate limit exceeded. Please wait a few seconds and try again.');
        }
        continue;
      }

      const json = await response.json();
      const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error('No diagnosis received from Gemini AI. Please try again with a clearer photo.');
      }

      const parsedResult = parseGeminiResponse(rawText);
      const matched = matchWithLocalDatabase(parsedResult, crops, selectedCropKey);

      return {
        ...parsedResult,
        ...matched,
        analyzed_at: new Date().toISOString(),
      };
    } catch (err) {
      if (err instanceof Error && err.message.includes('rate limit')) throw err;
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError || new Error('Failed to analyze image with Gemini API. Please check your network and API key.');
}

/**
 * Parses and sanitizes raw JSON text from Gemini.
 */
function parseGeminiResponse(rawText: string): GeminiCropDiagnosisResult {
  let cleaned = rawText.trim();
  // Strip Markdown code fencing if returned
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  try {
    const data = JSON.parse(cleaned);

    return {
      crop_detected_en: data.crop_detected_en || 'Field Crop',
      crop_detected_te: data.crop_detected_te || '',
      category: validateCategory(data.category),
      name_en: data.name_en || 'Unidentified Condition',
      name_te: data.name_te || '',
      scientific_name: data.scientific_name || '',
      severity: validateSeverity(data.severity),
      confidence: Math.min(100, Math.max(0, parseInt(data.confidence, 10) || 75)),
      affected_parts_en: data.affected_parts_en || '',
      affected_parts_te: data.affected_parts_te || '',
      stage_en: data.stage_en || '',
      stage_te: data.stage_te || '',
      symptoms_en: data.symptoms_en || 'No specific symptoms detailed.',
      symptoms_te: data.symptoms_te || '',
      damage_en: data.damage_en || 'Follow standard pest surveillance recommendations.',
      damage_te: data.damage_te || '',
      favourable_conditions_en: data.favourable_conditions_en || '',
      favourable_conditions_te: data.favourable_conditions_te || '',
      etl: data.etl || '',
      recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
      preventive_tips_en: Array.isArray(data.preventive_tips_en) ? data.preventive_tips_en : [],
      preventive_tips_te: Array.isArray(data.preventive_tips_te) ? data.preventive_tips_te : [],
      disclaimer_en: data.disclaimer_en || 'Recommendations are based on PJTSAU and CIBRC guidelines.',
      disclaimer_te: data.disclaimer_te || 'ఈ సూచనలు PJTSAU మరియు CIBRC అధికారిక మార్గదర్శకాల ఆధారంగా ఉన్నాయి.',
      analyzed_at: new Date().toISOString(),
    };
  } catch (err) {
    console.error('Failed to parse Gemini response JSON:', cleaned, err);
    throw new Error('Gemini response could not be parsed into structured diagnosis. Please retry.');
  }
}

function validateCategory(cat: unknown): GeminiCropDiagnosisResult['category'] {
  const valid = ['pest', 'disease', 'weed', 'nutrient', 'healthy', 'unknown'];
  const s = String(cat || '').toLowerCase().trim();
  return (valid.includes(s) ? s : 'unknown') as GeminiCropDiagnosisResult['category'];
}

function validateSeverity(sev: unknown): GeminiCropDiagnosisResult['severity'] {
  const valid = ['low', 'medium', 'high'];
  const s = String(sev || '').toLowerCase().trim();
  return (valid.includes(s) ? s : 'medium') as GeminiCropDiagnosisResult['severity'];
}

/**
 * Cross-references the Gemini AI diagnosis with the local Agronix verified crop protection database.
 */
function matchWithLocalDatabase(
  result: GeminiCropDiagnosisResult,
  crops: CropProtectionCrop[],
  selectedCropKey?: string
): {
  matched_item_id?: string;
  matched_crop_key?: string;
  matched_item?: CropProtectionItem;
} {
  if (!crops || !crops.length) return {};

  const detectedCropLower = (result.crop_detected_en || '').toLowerCase();
  const nameLower = (result.name_en || '').toLowerCase();
  const sciLower = (result.scientific_name || '').toLowerCase();

  // Find candidate crop
  let candidateCrop = crops.find(
    (c) =>
      c.crop_key === selectedCropKey ||
      c.crop_key.toLowerCase() === detectedCropLower ||
      detectedCropLower.includes(c.crop_key.toLowerCase()) ||
      c.name_en.toLowerCase().includes(detectedCropLower)
  );

  if (!candidateCrop && crops.length) {
    candidateCrop = crops[0];
  }

  if (!candidateCrop || !candidateCrop.items) return {};

  // Search items in candidate crop first, then across all crops
  const searchCrops = [candidateCrop, ...crops.filter((c) => c !== candidateCrop)];

  for (const crop of searchCrops) {
    for (const item of crop.items || []) {
      const itemNameLower = item.name_en.toLowerCase();
      const itemSciLower = (item.scientific_name || '').toLowerCase();

      // Check scientific name exact/partial match
      if (sciLower && itemSciLower && (sciLower.includes(itemSciLower) || itemSciLower.includes(sciLower))) {
        return {
          matched_item_id: item.id,
          matched_crop_key: crop.crop_key,
          matched_item: item,
        };
      }

      // Check common name match
      if (
        itemNameLower === nameLower ||
        itemNameLower.includes(nameLower) ||
        nameLower.includes(itemNameLower)
      ) {
        return {
          matched_item_id: item.id,
          matched_crop_key: crop.crop_key,
          matched_item: item,
        };
      }
    }
  }

  return {};
}

/**
 * Generates an offline / demo diagnosis using the verified PJTSAU database
 * without needing an external API key.
 */
export function getOfflineDemoDiagnosis(
  cropKey = 'cotton',
  _fieldNotes?: string,
  _language: 'en' | 'te' = 'en',
  crops: CropProtectionCrop[] = []
): GeminiCropDiagnosisResult {
  const targetCrop = crops.find((c) => c.crop_key === cropKey) || crops[0];
  const items = targetCrop?.items || [];
  
  // Pick an item from the crop (prefer verified or first pest/disease)
  const item = items.find((i) => i.is_verified) || items[0];

  const cropNameEn = targetCrop?.name_en || 'Cotton';
  const cropNameTe = targetCrop?.name_te || 'పత్తి';

  if (item) {
    const recs: GeminiDiagnosisRecommendation[] = (item.recommendations || []).map((r) => ({
      control_type: r.control_type as any,
      title_en: `${r.chemical_name || r.control_type} Spray / Application`,
      title_te: `${r.chemical_name || r.control_type} పిచికారీ సూచన`,
      description_en: r.recommendation_en,
      description_te: r.recommendation_te,
      chemical_name: r.chemical_name,
      formulation: r.formulation,
      dose_per_litre: r.dose_per_litre,
      dose_per_acre: r.dose_per_acre,
      dose_per_tank_16l: r.dose_per_tank_16l,
      dose_per_tank_20l: r.dose_per_tank_20l,
      waiting_period: r.waiting_period,
      safety_note_en: r.safety_note_en,
      safety_note_te: r.safety_note_te,
    }));

    return {
      crop_detected_en: cropNameEn,
      crop_detected_te: cropNameTe,
      category: item.category,
      name_en: item.name_en,
      name_te: item.name_te || item.name_en,
      scientific_name: item.scientific_name || 'Scientific identification verified',
      severity: item.severity_level,
      confidence: 94,
      affected_parts_en: 'Leaves, stems, and reproductive parts',
      affected_parts_te: 'ఆకులు, కాండం మరియు కాయలు/పూత',
      stage_en: item.stage || 'Vegetative to Reproductive stage',
      stage_te: 'శాఖీయ దశ నుండి పూత/కాయ దశ',
      symptoms_en: item.symptoms_en || 'Visual field symptoms observed on affected foliage.',
      symptoms_te: item.symptoms_te || 'బాధిత ఆకులపై కనిపించే క్షేత్ర లక్షణాలు.',
      damage_en: item.damage_en || 'Potential yield reduction if left unmanaged.',
      damage_te: item.damage_te || 'నిర్వహించకపోతే దిగుబడి తగ్గే అవకాశం ఉంది.',
      favourable_conditions_en: item.favourable_conditions_en || 'High humidity and warm conditions favor proliferation.',
      favourable_conditions_te: item.favourable_conditions_te || 'అధిక తేమ మరియు వెచ్చని వాతావరణం అనుకూలం.',
      etl: item.etl || 'Follow local agricultural surveillance advisory',
      recommendations: recs.length > 0 ? recs : [
        {
          control_type: 'chemical',
          title_en: 'Targeted Protection Spray',
          title_te: 'లక్షిత రక్షణ పిచికారీ',
          description_en: 'Apply recommended insecticide/fungicide as per latest PJTSAU schedule.',
          chemical_name: 'PJTSAU Recommended Formulation',
          dose_per_litre: '2 ml / L',
          dose_per_tank_16l: '32 ml / 16L tank',
          waiting_period: '14 days',
          safety_note_en: 'Wear protective mask and gloves while spraying.',
        }
      ],
      preventive_tips_en: [
        'Maintain clean field bunds and destroy alternate weed hosts.',
        'Use balanced nitrogen doses and adopt crop rotation.',
      ],
      preventive_tips_te: [
        'పొలం గట్లపై కలుపు మొక్కలను నివారించండి.',
        'సమతుల్య నత్రజని ఎరువులను వాడండి మరియు పంట మార్పిడి చేయండి.',
      ],
      disclaimer_en: 'Diagnosis generated from Agronix PJTSAU verified agricultural database.',
      disclaimer_te: 'ఈ నిర్ధారణ Agronix PJTSAU ధృవీకరించిన వ్యవసాయ డేటాబేస్ నుండి రూపొందించబడింది.',
      matched_item_id: item.id,
      matched_crop_key: targetCrop?.crop_key,
      matched_item: item,
      analyzed_at: new Date().toISOString(),
    };
  }

  // Fallback demo for cotton
  return {
    crop_detected_en: 'Cotton',
    crop_detected_te: 'పత్తి',
    category: 'pest',
    name_en: 'Pink Bollworm (PBW)',
    name_te: 'గులాబీ రంగు కాయ తొలుచు పురుగు',
    scientific_name: 'Pectinophora gossypiella',
    severity: 'high',
    confidence: 96,
    affected_parts_en: 'Bolls, squares, flowers (rosette flower symptom)',
    affected_parts_te: 'కాయలు, పూత (రోసెట్ పువ్వు లక్షణం)',
    stage_en: 'Flowering to boll maturation',
    stage_te: 'పూత నుండి కాయ పక్వ దశ',
    symptoms_en: '• Rosetted flowers with petals tied together.\n• Entrance hole closed by larva with excreta.\n• Premature boll opening and stained lint.',
    symptoms_te: '• పువ్వు రెక్కలు ముడుచుకుపోయి రోసెట్ ఆకారంలో కనిపించడం.\n• చిన్న కాయలపై రంధ్రాలు మరియు మలం.\n• కాయలు సరిగ్గా విచ్చుకోకపోవడం, దూది నాణ్యత దెబ్బతినడం.',
    damage_en: 'Can cause 40-70% yield and quality loss if untackled during squaring stage.',
    damage_te: 'నివారించకపోతే 40-70% వరకు దిగుబడి మరియు నాణ్యత నష్టం వాటిల్లుతుంది.',
    favourable_conditions_en: 'Continuous cloudy weather and late-sown un-topped cotton.',
    favourable_conditions_te: 'నిరంతర మేఘావృత వాతావరణం మరియు ఆలస్యంగా వేసిన పత్తి పంట.',
    etl: '8 moths per trap for 3 consecutive nights OR 10% damaged bolls/squares.',
    recommendations: [
      {
        control_type: 'chemical',
        title_en: 'Profenofos 50% EC spray',
        title_te: 'ప్రొఫెనోఫాస్ 50% EC పిచికారీ',
        description_en: 'Spray during peak larval emergence in evening hours.',
        description_te: 'సాయంత్రం వేళల్లో పిచికారీ చేయాలి.',
        chemical_name: 'Profenofos 50% EC',
        formulation: '50% EC',
        dose_per_litre: '2.0 ml / L',
        dose_per_acre: '400 ml / acre',
        dose_per_tank_16l: '32 ml / 16L tank',
        dose_per_tank_20l: '40 ml / 20L tank',
        waiting_period: '15 days',
        safety_note_en: 'Spray only when ETL is crossed. Avoid spraying in direct midday sun.',
      },
      {
        control_type: 'biological',
        title_en: 'Pheromone Traps installation',
        title_te: 'లింగాకర్షక బుట్టల ఏర్పాటు',
        description_en: 'Install 4-8 pheromone traps per acre for mass trapping and monitoring.',
        description_te: 'ఎకరాకు 4-8 లింగాకర్షక బుట్టలను అమర్చాలి.',
      },
    ],
    preventive_tips_en: [
      'Avoid continuous mono-cropping of cotton.',
      'Terminate the crop by December-January without extending into summer.',
    ],
    disclaimer_en: 'Advisory based on PJTSAU and CIBRC recommendations.',
    disclaimer_te: 'సిఫార్సులు PJTSAU మరియు CIBRC మార్గదర్శకాల ఆధారంగా ఉన్నాయి.',
    analyzed_at: new Date().toISOString(),
  };
}
