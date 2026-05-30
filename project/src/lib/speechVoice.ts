import type { AdvisoryLang } from './farmerAdvisory';

const FEMALE_NAME_HINTS =
  /female|woman|heera|lekha|veena|kanya|swara|zira|priya|telugu|te-|hi-|india/i;

export function loadSpeechVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve([]);
      return;
    }

    const synth = window.speechSynthesis;
    const existing = synth.getVoices();
    if (existing.length > 0) {
      resolve(existing);
      return;
    }

    const onVoices = () => {
      synth.removeEventListener('voiceschanged', onVoices);
      resolve(synth.getVoices());
    };
    synth.addEventListener('voiceschanged', onVoices);
    window.setTimeout(() => resolve(synth.getVoices()), 400);
  });
}

export function pickFemaleIndianVoice(
  voices: SpeechSynthesisVoice[],
  lang: AdvisoryLang
): SpeechSynthesisVoice | undefined {
  if (!voices.length) return undefined;

  const langPrefix = lang === 'te' ? 'te' : 'en';
  const ranked = voices
    .map((voice) => {
      let score = 0;
      const name = `${voice.name} ${voice.lang}`;
      if (voice.lang.toLowerCase().startsWith(langPrefix)) score += 40;
      if (/india|in\b/i.test(voice.lang)) score += 25;
      if (FEMALE_NAME_HINTS.test(name)) score += 30;
      if (lang === 'te' && /telugu|te-/i.test(name)) score += 35;
      if (voice.default && score < 50) score += 5;
      return { voice, score };
    })
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.score > 0 ? ranked[0].voice : voices.find((v) => v.lang.startsWith(langPrefix));
}
