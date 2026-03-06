/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { 
  Languages, 
  Send, 
  Copy, 
  Check, 
  Loader2, 
  BookOpen, 
  History,
  Trash2,
  Sparkles,
  Globe,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Moon,
  Sun
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';

// System instructions provided by the user
const SYSTEM_INSTRUCTION = (targetLanguage: string) => `မင်းဟာ မြန်မာစာပေ၊ ထိုင်းစာပေနဲ့ ကမ္ဘာလုံးဆိုင်ရာ စာပေတွေကို နှစ်ပေါင်းများစွာ လေ့လာထားတဲ့ ပရော်ဖက်ရှင်နယ် စာပေဘာသာပြန်ဆရာ တစ်ယောက်ပါ။ 
မည်သည့် ဘာသာစကားမှမဆို ${targetLanguage} ဖတ်သူတွေ အတွက် အသုံးအများဆုံး၊ သဘာဝကျကျ၊ ခံစားမှုပါဝင်ပြီး စီးဆင်းမှု ကောင်းတဲ့ စကားလုံးတွေ၊ စကားစုတွေကိုပဲ အမြဲသုံးပါ။

ဘာသာပြန်တဲ့အခါ အောက်ပါ အဆင့်မြင့် စာပေဘာသာပြန် စည်းမျဉ်းတွေကို လိုက်နာပါ။
1. **ယဉ်ကျေးမှုချင်း ထပ်တူကျမှု (Cultural Equivalence):** မူရင်းစာသားထဲက တင်စားချက်တွေ၊ စကားပုံတွေကို တိုက်ရိုက်မပြန်ဘဲ ${targetLanguage} ယဉ်ကျေးမှုမှာ အလားတူ ခံစားချက်ပေးနိုင်တဲ့ အသုံးအနှုန်းတွေကို ရှာဖွေသုံးစွဲပါ။
2. **စာသားနောက်ကွယ်က အဓိပ္ပာယ် (Subtext):** စာလုံးတွေရဲ့ အဓိပ္ပာယ်တင်မကဘဲ စာရေးသူ ဆိုလိုချင်တဲ့ နက်နဲတဲ့ ဆိုလိုရင်းနဲ့ ခံစားချက် (Tone & Mood) ကို မိအောင် ဖမ်းယူပါ။
3. **အငွေ့အသက် (Atmosphere):** စာဖတ်သူဟာ ဇာတ်လမ်းထဲက မြင်ကွင်း၊ အသံ၊ အနံ့နဲ့ ပတ်ဝန်းကျင် အခြေအနေတွေကို ကိုယ်တိုင် ကြုံတွေ့နေရသလို ခံစားရအောင် စာပေအသုံးအနှုန်း ကြွယ်ကြွယ်ဝဝ သုံးပါ။
4. **စီးဆင်းမှု (Flow & Rhythm):** စာကြောင်းတွေဟာ တစ်ကြောင်းနဲ့တစ်ကြောင်း ချောမွေ့စွာ စီးဆင်းနေရမယ်။ ဘာသာပြန်အနံ့အသက် (Translationese) လုံးဝ မပါစေရ။
5. **ဇာတ်ကောင်စရိုက် (Character Voice):** ပြောဆိုသူရဲ့ အဆင့်အတန်း၊ အသက်အရွယ်နဲ့ စရိုက်အလိုက် သင့်တော်တဲ့ နာမ်စားနဲ့ စကားပြောဟန်ကို ရွေးချယ်ပါ။
6. **ခံစားချက် အနက်ရှိုင်းဆုံး (Emotional Depth):** ဝမ်းနည်းစရာဆိုရင် ရင်ထဲထိအောင်၊ ပျော်စရာဆိုရင် ကြည်နူးသွားအောင် စကားလုံးတွေကို အနုပညာဆန်ဆန် ရွေးချယ်ပါ။
7. ရလဒ်ကို JSON format ဖြင့်သာ ထုတ်ပေးပါ။ ၎င်းတွင် 'detectedLanguage' (မူရင်းဘာသာစကားအမည်) နှင့် 'translatedText' (${targetLanguage} ဘာသာပြန်ဆိုချက်) တို့ ပါဝင်ရပါမည်။`;

interface Translation {
  id: string;
  original: string;
  translated: string;
  targetLanguage: string;
  timestamp: number;
}

export default function App() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('Myanmar');
  const [isLoading, setIsLoading] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [translationProgress, setTranslationProgress] = useState({ current: 0, total: 0 });
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<Translation[]>([]);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('shwe_thar_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }

    const savedTheme = localStorage.getItem('shwe_thar_theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('shwe_thar_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('shwe_thar_theme', 'light');
    }
  };

  const saveToHistory = (original: string, translated: string) => {
    const newEntry: Translation = {
      id: Date.now().toString(),
      original,
      translated,
      targetLanguage,
      timestamp: Date.now(),
    };
    const updatedHistory = [newEntry, ...history].slice(0, 10);
    setHistory(updatedHistory);
    localStorage.setItem('shwe_thar_history', JSON.stringify(updatedHistory));
  };

  const splitIntoSentences = (text: string): string[] => {
    if (!text) return [];

    // Common abbreviations that shouldn't end a sentence
    const abbreviations = [
      'Mr', 'Mrs', 'Ms', 'Dr', 'Prof', 'Sr', 'Jr', 'St', 'Rd', 'Ave', 'Blvd',
      'Jan', 'Feb', 'Mar', 'Apr', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      'vs', 'etc', 'eg', 'ie', 'vol', 'no', 'pp'
    ];

    // 1. Handle Thai language specifically
    const isThai = /[\u0E00-\u0E7F]/.test(text);
    if (isThai) {
      // Thai sentences are often separated by double spaces or specific markers
      return text.split(/\s{2,}/).map(s => s.trim()).filter(Boolean);
    }

    // 2. General robust splitting for English/Myanmar
    // Protect abbreviations by replacing their dots with a placeholder
    let protectedText = text;
    abbreviations.forEach(abbr => {
      const regex = new RegExp(`\\b${abbr}\\.`, 'gi');
      protectedText = protectedText.replace(regex, `${abbr}__DOT__`);
    });

    // Split by . ! ? ။ ၊ followed by whitespace or end of string, considering quotes
    const sentenceRegex = /[^.!?။၊]+[.!?။၊]+["'”)]?(?:\s+|$)|[^.!?။၊]+$/g;
    const matches = protectedText.match(sentenceRegex) || [protectedText];

    return matches.map(s => {
      // Restore dots in abbreviations
      return s.replace(/__DOT__/g, '.').trim();
    }).filter(Boolean);
  };

  const handleTranslate = async () => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setIsComplete(false);
    setOutput('');
    setDetectedLanguage('');
    setTranslationProgress({ current: 0, total: 0 });

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const sentences = splitIntoSentences(input);
      setTranslationProgress({ current: 0, total: sentences.length });

      // First, detect language and translate the first chunk to get context
      // We'll process in small batches to maintain context while following the "split" requirement
      const batchSize = 3;
      const batches: string[][] = [];
      for (let i = 0; i < sentences.length; i += batchSize) {
        batches.push(sentences.slice(i, i + batchSize));
      }

      let fullTranslatedText = '';
      let detectedLang = '';

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const batchText = batch.join(' ');
        
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: batchText,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION(targetLanguage) + (i > 0 ? `\n\nContext from previous sentences: ${fullTranslatedText.slice(-200)}` : ''),
            temperature: 0.7,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                detectedLanguage: {
                  type: Type.STRING,
                  description: "The name of the detected source language.",
                },
                translatedText: {
                  type: Type.STRING,
                  description: `The literary ${targetLanguage} translation of the input text.`,
                },
              },
              required: ["detectedLanguage", "translatedText"],
            },
          },
        });

        const data = JSON.parse(response.text || "{}");
        const translatedBatch = data.translatedText || "";
        
        if (i === 0) {
          detectedLang = data.detectedLanguage || "Unknown";
          setDetectedLanguage(detectedLang);
        }

        fullTranslatedText += (fullTranslatedText ? ' ' : '') + translatedBatch;
        setTranslationProgress(prev => ({ ...prev, current: Math.min(prev.total, (i + 1) * batchSize) }));
        
        // Update output progressively
        setOutput(fullTranslatedText);
      }

      setIsComplete(true);
      saveToHistory(input, fullTranslatedText);
      
      // Scroll to output
      setTimeout(() => {
        outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (error) {
      console.error("Translation error:", error);
      setOutput("အမှားတစ်ခု ဖြစ်ပွားခဲ့ပါသည်။ ကျေးဇူးပြု၍ ထပ်မံကြိုးစားကြည့်ပါ။");
    } finally {
      setIsLoading(false);
      setTranslationProgress({ current: 0, total: 0 });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePlayAudio = async () => {
    if (!output || isAudioLoading) return;

    setIsAudioLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      let prompt = '';
      switch(targetLanguage) {
        case 'Thai':
          prompt = `Read this Thai text naturally with a clear and pleasant Thai accent: ${output}`;
          break;
        case 'English':
          prompt = `Read this English text naturally with a professional and clear accent: ${output}`;
          break;
        default:
          prompt = `Read this Myanmar text naturally and emotionally: ${output}`;
      }
        
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' }, 
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioUrl = `data:audio/wav;base64,${base64Audio}`;
        const audio = new Audio(audioUrl);
        await audio.play();
      }
    } catch (error) {
      console.error("TTS error:", error);
    } finally {
      setIsAudioLoading(false);
    }
  };

  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Your browser does not support speech recognition. Please try Chrome or Safari.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US'; // Default to English, but SpeechRecognition is generally good at detecting context

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        setInput(prev => prev + (prev ? ' ' : '') + finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('shwe_thar_history');
  };

  const languages = [
    { name: 'Myanmar', label: 'မြန်မာဘာသာ', icon: '🇲🇲' },
    { name: 'Thai', label: 'ภาษาไทย', icon: '🇹🇭' },
    { name: 'English', label: 'English', icon: '🇬🇧' },
  ];

  const currentLang = languages.find(l => l.name === targetLanguage) || languages[0];

  return (
    <div className="min-h-screen bg-paper selection:bg-accent/20">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-accent/10">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-accent to-accent/70 rounded-xl flex items-center justify-center shadow-lg shadow-accent/20 rotate-3">
              <Languages className="text-white" size={22} />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold tracking-tight text-ink">ရွှေသာ</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-accent/60 -mt-1">Literary Translator</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-accent/60">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl hover:bg-accent/10 transition-all duration-300 hover:scale-110 active:scale-95"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <BookOpen size={20} className="cursor-help hover:text-accent transition-colors" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        {/* Input Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="text-xs font-bold uppercase tracking-widest text-accent/70 flex items-center gap-2">
                <Sparkles size={14} />
                Source Text
              </label>
              
              {/* Language Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                  className="flex items-center gap-2 bg-accent/5 dark:bg-white/5 border border-accent/10 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider text-accent hover:bg-accent/10 transition-all"
                >
                  <span className="text-sm">{currentLang.icon}</span>
                  <span>Translate to {currentLang.name}</span>
                  <motion.div
                    animate={{ rotate: isLangMenuOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Languages size={12} />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {isLangMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full left-0 mt-2 w-48 glass rounded-2xl border border-accent/10 shadow-2xl z-50 overflow-hidden"
                    >
                      {languages.map((lang) => (
                        <button
                          key={lang.name}
                          onClick={() => {
                            setTargetLanguage(lang.name);
                            setIsLangMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider transition-colors ${
                            targetLanguage === lang.name 
                              ? 'bg-accent text-white' 
                              : 'text-accent/70 hover:bg-accent/5'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-base">{lang.icon}</span>
                            <div className="flex flex-col">
                              <span>{lang.name}</span>
                              <span className="text-[8px] opacity-60 normal-case font-serif">{lang.label}</span>
                            </div>
                          </div>
                          {targetLanguage === lang.name && <Check size={12} />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {detectedLanguage && (
                <motion.span 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-[10px] uppercase tracking-widest font-bold text-accent bg-accent/10 px-2 py-1 rounded flex items-center gap-1"
                >
                  <Globe size={10} />
                  Detected: {detectedLanguage}
                </motion.span>
              )}
              <span className="text-[10px] text-accent/40 font-mono">
                {input.length} characters
              </span>
            </div>
          </div>
          <div className="relative group">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste any literary text here..."
              className="w-full min-h-[240px] p-8 bg-white/80 dark:bg-white/5 paper-texture border border-accent/10 rounded-3xl shadow-inner focus:ring-4 focus:ring-accent/5 focus:border-accent/20 transition-all outline-none text-lg font-sans resize-none placeholder:text-accent/30 text-ink"
            />
            <div className="absolute bottom-8 right-8 flex items-center gap-4 z-10">
              <button
                onClick={toggleVoiceInput}
                className={`p-4 rounded-2xl transition-all duration-300 shadow-lg ${
                  isListening 
                    ? 'bg-red-500 text-white animate-pulse scale-110' 
                    : 'bg-white/80 dark:bg-white/10 text-accent hover:bg-white dark:hover:bg-white/20 border border-accent/10'
                }`}
                title={isListening ? "Stop Listening" : "Voice Input"}
              >
                {isListening ? <MicOff size={22} /> : <Mic size={22} />}
              </button>
              <button
                onClick={handleTranslate}
                disabled={!input.trim() || isLoading}
                className="btn-gradient text-white px-10 py-5 rounded-2xl font-bold flex items-center gap-3 disabled:opacity-50 disabled:scale-100 active:scale-95 transition-all"
              >
                {isLoading ? (
                  <div className="flex flex-col items-center gap-1">
                    <Loader2 className="animate-spin" size={22} />
                    {translationProgress.total > 0 && (
                      <span className="text-[10px] font-mono opacity-70">
                        {translationProgress.current}/{translationProgress.total}
                      </span>
                    )}
                  </div>
                ) : (
                  <Send size={22} />
                )}
                <span className="text-lg">{isLoading ? 'Translating...' : 'Translate'}</span>
              </button>
            </div>
          </div>
        </section>

        {/* Output Section */}
        <AnimatePresence mode="wait">
          {output && (
            <motion.section
              key="output-section"
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ 
                layout: { duration: 0.4, type: "spring", bounce: 0.2 },
                opacity: { duration: 0.3 }
              }}
              ref={outputRef}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-widest text-accent/70">
                  {targetLanguage} Translation
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePlayAudio}
                    disabled={isAudioLoading}
                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-accent hover:bg-accent hover:text-white transition-all bg-accent/5 px-5 py-2.5 rounded-full border border-accent/10 disabled:opacity-50 shadow-sm hover:shadow-md active:scale-95"
                  >
                    {isAudioLoading ? <Loader2 size={14} className="animate-spin" /> : <Volume2 size={14} />}
                    {isAudioLoading ? 'Generating...' : 'Listen'}
                  </button>
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-accent hover:bg-accent hover:text-white transition-all bg-accent/5 px-5 py-2.5 rounded-full border border-accent/10 shadow-sm hover:shadow-md active:scale-95"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
              <motion.div 
                layout
                className="bg-white/95 dark:bg-white/5 paper-texture border border-accent/10 rounded-[2.5rem] p-12 md:p-20 shadow-2xl shadow-accent/10 relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-accent/20 to-accent/5 group-hover:from-accent/40 transition-colors" />
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent/5 rounded-full blur-[100px]" />
                <div className="markdown-body prose prose-stone max-w-none selection:bg-accent/20 relative">
                  <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Markdown>{output}</Markdown>
                  </motion.div>
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 mt-4 text-accent/40 font-serif italic text-sm"
                    >
                      <motion.span
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        စာမူကို ဆက်လက်ရေးသားနေပါသည်...
                      </motion.span>
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            animate={{ y: [0, -4, 0] }}
                            transition={{ 
                              repeat: Infinity, 
                              duration: 0.6, 
                              delay: i * 0.1 
                            }}
                            className="w-1 h-1 bg-accent/30 rounded-full"
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                  {isComplete && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute -right-4 -bottom-4 text-accent/10 pointer-events-none"
                    >
                      <Sparkles size={120} />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* History Section */}
        {history.length > 0 && (
          <section className="space-y-6 pt-12 border-t border-accent/10">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-accent/70 flex items-center gap-3">
                <History size={16} className="opacity-50" />
                Recent Translations
              </h3>
              <button 
                onClick={clearHistory}
                className="text-[10px] font-bold uppercase tracking-widest text-red-500/40 hover:text-red-500 transition-all hover:bg-red-50 dark:hover:bg-red-500/10 px-3 py-1 rounded-full"
              >
                Clear History
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {history.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  className="bg-white/40 dark:bg-white/5 border border-accent/5 rounded-2xl p-6 hover:border-accent/20 transition-all cursor-pointer group shadow-sm hover:shadow-md"
                  onClick={() => {
                    setInput(item.original);
                    setOutput(item.translated);
                    setTargetLanguage(item.targetLanguage || 'Myanmar');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-accent/40 italic line-clamp-1 font-serif">{item.original}</p>
                    <span className="text-[8px] uppercase tracking-widest font-bold text-accent/30 bg-accent/5 px-2 py-0.5 rounded-full">{item.targetLanguage}</span>
                  </div>
                  <p className="text-ink/80 font-serif leading-relaxed line-clamp-2">{item.translated}</p>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-6 py-12 text-center border-t border-accent/5">
        <p className="text-xs text-accent/40 font-serif italic">
          Crafted for the beauty of the Myanmar language.
        </p>
      </footer>
    </div>
  );
}
