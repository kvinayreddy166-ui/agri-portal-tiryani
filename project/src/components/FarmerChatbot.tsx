import React, { useEffect, useRef, useState } from 'react';
import { Bot, Mic, MicOff, Send, Volume2, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { detectLanguage, getAdvisoryReply, type AdvisoryLang } from '../lib/farmerAdvisory';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

function speakText(text: string, lang: AdvisoryLang) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang === 'te' ? 'te-IN' : 'en-IN';
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}

interface FarmerChatbotProps {
  showOnLoginPage?: boolean;
}

export function FarmerChatbot({ showOnLoginPage = false }: FarmerChatbotProps) {
  const { language, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const [voiceReply, setVoiceReply] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text:
        language === 'te' || showOnLoginPage
          ? 'నమస్కారం! పంట పురుగులు, వ్యాధులు, ఎరువులు, నీరు గురించి తెలుగులో లేదా ఇంగ్లీష్‌లో అడగండి. మైక్ బటన్ తో మాట్లాడవచ్చు.'
          : t(
              'Namaste! Ask about crop pests, diseases, fertilizers, or irrigation in Telugu or English.',
              'నమస్కారం! పంట పురుగులు, వ్యాధులు, ఎరువులు, నీరు గురించి తెలుగు లేదా ఇంగ్లీష్‌లో అడగండి.'
            ),
    },
  ]);
  const listRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  useEffect(() => {
    const w = window as Window & {
      SpeechRecognition?: new () => SpeechRecognition;
      webkitSpeechRecognition?: new () => SpeechRecognition;
    };
    const SpeechRecognitionCtor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language === 'te' ? 'te-IN' : 'en-IN';
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) setInput(transcript);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [language]);

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const preferredLang: AdvisoryLang =
      language === 'te' || showOnLoginPage ? 'te' : detectLanguage(trimmed);
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', text: trimmed };
    const reply = getAdvisoryReply(trimmed, preferredLang);
    const assistantMsg: ChatMessage = {
      id: `a-${Date.now()}`,
      role: 'assistant',
      text: reply.text,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput('');
    if (voiceReply) speakText(reply.text, reply.lang);
  };

  const toggleListen = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      alert(t('Voice input is not supported in this browser.', 'ఈ బ్రౌజర్‌లో వాయిస్ ఇన్‌పుట్ సపోర్ట్ లేదు.'));
      return;
    }
    if (listening) {
      recognition.stop();
      setListening(false);
      return;
    }
    setListening(true);
    recognition.lang = language === 'te' ? 'te-IN' : 'en-IN';
    recognition.start();
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`fixed z-50 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-700 to-emerald-700 px-5 py-3 text-sm font-black text-white shadow-xl shadow-emerald-950/25 transition hover:from-teal-800 hover:to-emerald-800 ${
          showOnLoginPage ? 'bottom-20 left-4 right-auto' : 'bottom-20 right-4'
        }`}
        aria-label={t('Open farmer assistant', 'రైతు సహాయకాన్ని తెరవండి')}
      >
        <Bot className="h-5 w-5" />
        {t('Ask AI', 'ఏఐ అడగండి')}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-[min(100vw-2rem,24rem)] flex-col overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-2xl dark:border-emerald-900 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-2 bg-gradient-to-r from-emerald-700 to-teal-700 px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <div>
            <p className="text-sm font-black">{t('Farmer Assistant', 'రైతు సహాయకుడు')}</p>
            <p className="text-[10px] text-emerald-100">{t('Pest · Disease · Crops', 'పురుగు · వ్యాధి · పంట')}</p>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setVoiceReply((v) => !v)}
            className={`rounded-lg p-1.5 ${voiceReply ? 'bg-white/25' : 'hover:bg-white/15'}`}
            title={t('Voice replies', 'వాయిస్ సమాధానాలు')}
          >
            <Volume2 className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1.5 hover:bg-white/15" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div ref={listRef} className="max-h-72 space-y-3 overflow-y-auto p-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`rounded-xl px-3 py-2 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'ml-6 bg-emerald-100 text-emerald-950 dark:bg-emerald-900/50 dark:text-emerald-50'
                : 'mr-4 bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>

      <form
        className="border-t border-slate-200 p-3 dark:border-slate-700"
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
      >
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleListen}
            className={`shrink-0 rounded-lg p-2 ${listening ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
            title={t('Voice input', 'వాయిస్ ఇన్‌పుట్')}
          >
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('Type your question…', 'మీ ప్రశ్న టైప్ చేయండి…')}
            className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-emerald-700 p-2 text-white hover:bg-emerald-800"
            aria-label={t('Send', 'పంపు')}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
