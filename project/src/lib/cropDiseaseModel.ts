/** PlantVillage-style class labels (subset for demo inference) */
export const DISEASE_CLASSES = [
  'Healthy',
  'Bacterial Spot',
  'Early Blight',
  'Late Blight',
  'Leaf Mold',
  'Septoria Leaf Spot',
  'Spider Mites',
  'Target Spot',
  'Mosaic Virus',
  'Yellow Leaf Curl Virus',
] as const;

export const MANAGEMENT_TIPS: Record<string, string> = {
  Healthy:
    'Crop appears healthy. Continue balanced fertilization, timely irrigation, and field scouting.',
  'Bacterial Spot':
    'Use copper-based bactericides, remove infected debris, rotate crops, and use disease-free seed.',
  'Early Blight':
    'Apply recommended fungicides (chlorothalonil/mancozeb), improve air circulation, and avoid overhead irrigation.',
  'Late Blight':
    'Urgent: apply metalaxyl or cymoxanil-based fungicides; destroy heavily infected plants; ensure drainage.',
  'Leaf Mold':
    'Reduce humidity in greenhouse; use fungicides; prune lower leaves; improve spacing.',
  'Septoria Leaf Spot':
    'Remove infected leaves; apply fungicide sprays at 7–10 day intervals; use resistant varieties where available.',
  'Spider Mites':
    'Spray neem oil or miticides; increase humidity; avoid drought stress; monitor undersides of leaves.',
  'Target Spot':
    'Rotate crops; apply fungicides; remove crop residue after harvest.',
  'Mosaic Virus':
    'Control aphid vectors; remove infected plants; use virus-free planting material.',
  'Yellow Leaf Curl Virus':
    'Control whitefly vectors with recommended insecticides; use resistant hybrids; rogue infected plants early.',
};

type TfModule = typeof import('@tensorflow/tfjs');
let tfModule: TfModule | null = null;
let cachedModel: import('@tensorflow/tfjs').LayersModel | null = null;
let modelLoadPromise: Promise<import('@tensorflow/tfjs').LayersModel> | null = null;

async function getTf(): Promise<TfModule> {
  if (!tfModule) {
    tfModule = await import('@tensorflow/tfjs');
  }
  return tfModule;
}

async function loadCropModel(url: string) {
  if (cachedModel) return cachedModel;
  const tf = await getTf();
  if (!modelLoadPromise) {
    modelLoadPromise = tf.loadLayersModel(url).then((model) => {
      cachedModel = model;
      return model;
    });
  }
  return modelLoadPromise;
}

/**
 * Lightweight color/texture heuristic classifier when no TF model URL is configured.
 * Replace with hosted PlantVillage TFJS model via VITE_CROP_MODEL_URL for production accuracy.
 */
export async function analyzeCropImage(imageElement: HTMLImageElement): Promise<{
  label: string;
  confidence: number;
  tip: string;
}> {
  const modelUrl = import.meta.env.VITE_CROP_MODEL_URL as string | undefined;

  if (modelUrl) {
    try {
      const tf = await getTf();
      const model = await loadCropModel(modelUrl);
      const tensor = tf.tidy(() => {
        const t = tf.browser.fromPixels(imageElement).resizeNearestNeighbor([224, 224]).toFloat().div(255);
        return t.expandDims(0);
      });
      const prediction = model.predict(tensor) as import('@tensorflow/tfjs').Tensor;
      const scores = await prediction.data();
      tensor.dispose();
      prediction.dispose();

      let maxIdx = 0;
      for (let i = 1; i < scores.length; i++) {
        if (scores[i] > scores[maxIdx]) maxIdx = i;
      }
      const label = DISEASE_CLASSES[maxIdx] ?? DISEASE_CLASSES[0];
      return {
        label,
        confidence: scores[maxIdx],
        tip: MANAGEMENT_TIPS[label] ?? MANAGEMENT_TIPS.Healthy,
      };
    } catch (err) {
      console.warn('TF model load failed, using heuristic:', err);
    }
  }

  const canvas = document.createElement('canvas');
  const size = 64;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(imageElement, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);

  let green = 0;
  let brown = 0;
  let yellow = 0;
  const pixels = size * size;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (g > r + 15 && g > b + 10) green++;
    if (r > 120 && g < 100 && b < 80) brown++;
    if (r > 150 && g > 120 && b < 80) yellow++;
  }

  const greenRatio = green / pixels;
  const brownRatio = brown / pixels;
  const yellowRatio = yellow / pixels;

  let label: (typeof DISEASE_CLASSES)[number] = 'Healthy';
  let confidence = 0.72;

  if (brownRatio > 0.12) {
    label = 'Early Blight';
    confidence = 0.65 + brownRatio;
  } else if (yellowRatio > 0.1) {
    label = 'Mosaic Virus';
    confidence = 0.62 + yellowRatio;
  } else if (greenRatio < 0.35) {
    label = 'Late Blight';
    confidence = 0.6;
  }

  return {
    label,
    confidence: Math.min(confidence, 0.92),
    tip: MANAGEMENT_TIPS[label],
  };
}
