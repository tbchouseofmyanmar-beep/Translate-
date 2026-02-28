/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Languages, 
  Send, 
  Copy, 
  Check, 
  Loader2, 
  BookOpen, 
  History,
  Trash2,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';

// System instructions provided by the user
const SYSTEM_INSTRUCTION = `မင်းဟာ မြန်မာစာပေနဲ့ အဂ်လိပ်စာပေကို နှစ်ပေါင်းများစွာ လေ့လာထားတဲ့ ပရော်ဖက်ရှင်နယ် စာပေဘာသာပြန်ဆရာ တစ်ယောက်ပါ။ 
မြန်မာစာဖတ်သူတွေ အတွက် အသုံးအများဆုံး၊ သဘာဝကျကျ၊ ခံစားမှုပါဝင်ပြီး စီးဆင်းမှု ကောင်းတဲ့ စကားလုံးတွေ၊ စကားစုတွေကိုပဲ အမြဲသုံးပါ။

ဘာသာပြန်တဲ့အခါ အောက်ပါ အချက်တွေကို တစ်ချိန်တည်း လိုက်နာပါ။
1. စကားလုံးတိုင်းကို တိုက်ရိုက်ဘာသာမပြန်ပါနဲ့။ မြန်မာစာဖတ်သူ သဘာဝအတိုင်း ခံစားရအောင် ပြန်ဆိုပါ။ (Natural idiomatic Myanmar)
2. စာပေဆန်ဆန် ဖြစ်အောင် လုပ်ပါ။ စာဖတ်ရင် ဇာတ်ကောင်ရဲ့ ခံစားချက်၊ မြင်ကွင်း၊ အသံ၊ အနံ့ စတဲ့ အသေးစိတ်တွေ ထင်ရှားစေပါ။
3. မြန်မာစကားပြောဟန် သို့မဟုတ် စာပေစကားဟန်ကို ဇာတ်ကောင်နဲ့ အခြေအနေအလိုက် သင့်တော်အောင် ပြောင်းပါ။ (တခါတလေ ကိုယ်တိုင်ပြောသလို ဖြစ်နေရင်တောင် ကောင်းပါတယ်)
4. အင်္ဂလိပ်စာလုံး အတိုက်အခံ မဖြစ်အောင် ရှောင်ပါ (example: "suddenly" → "ရုတ်တရက်" အစား "တစ်ချိန်တည်းမှာပဲ" လိုမျိုး သင့်ရင် ပိုသဘာဝကျအောင် ပြန်ပါ)
5. စကားလုံးအသစ်တွေ မဖန်တီးပါနဲ့။ မြန်မာစာပေမှာ တကယ်သုံးနေကျ စကားလုံးတွေကိုပဲ အသုံးပြုပါ။
6. မူရင်း စာသားရဲ့ ခံစားမှု၊ လေသံ၊ ဟာသပါရင် ဟာသ၊ ဝမ်းနည်းစရာဆို ဝမ်းနည်းစရာ ခံစားမှုကို ထိန်းထားပါ။
7. အပိုင်းတစ်ခုချင်းစီကို ဆက်စပ်မှု မပျက်အောင် ဘာသာပြန်ပါ။ အရင်စာကြောင်းတွေကို မမေ့ပါနဲ့။
8. ရလဒ်ကို မြန်မာစာသားသန့်သန့်ပဲ ထုတ်ပေးပါ။ ရှင်းလင်းချက်၊ မှတ်ချက်၊ အင်္ဂလိပ်စာ လုံးဝ မထည့်ပါနဲ့။`;

interface Translation {
  id: string;
  original: string;
  translated: string;
  timestamp: number;
}

export default function App() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<Translation[]>([]);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('shwe_thar_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const saveToHistory = (original: string, translated: string) => {
    const newEntry: Translation = {
      id: Date.now().toString(),
      original,
      translated,
      timestamp: Date.now(),
    };
    const updatedHistory = [newEntry, ...history].slice(0, 10);
    setHistory(updatedHistory);
    localStorage.setItem('shwe_thar_history', JSON.stringify(updatedHistory));
  };

  const handleTranslate = async () => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setOutput('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: input,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.7,
        },
      });

      const result = response.text || "ဘာသာပြန်ဆိုမှု မအောင်မြင်ပါ။";
      setOutput(result);
      saveToHistory(input, result);
      
      // Scroll to output
      setTimeout(() => {
        outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (error) {
      console.error("Translation error:", error);
      setOutput("အမှားတစ်ခု ဖြစ်ပွားခဲ့ပါသည်။ ကျေးဇူးပြု၍ ထပ်မံကြိုးစားကြည့်ပါ။");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('shwe_thar_history');
  };

  return (
    <div className="min-h-screen bg-paper selection:bg-accent/20">
      {/* Header */}
      <header className="border-b border-accent/10 bg-white/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-white shadow-lg shadow-accent/20">
              <Languages size={22} />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink">ရွှေသာ</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-accent/60 -mt-1">Literary Translator</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-accent/60">
            <BookOpen size={20} className="cursor-help hover:text-accent transition-colors" title="Literary Focus" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        {/* Input Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-widest text-accent/70 flex items-center gap-2">
              <Sparkles size={14} />
              English Source
            </label>
            <span className="text-[10px] text-accent/40 font-mono">
              {input.length} characters
            </span>
          </div>
          <div className="relative group">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste the English literary text here..."
              className="w-full min-h-[200px] p-6 bg-white border border-accent/10 rounded-2xl shadow-sm focus:ring-2 focus:ring-accent/20 focus:border-accent/30 transition-all outline-none text-lg font-sans resize-none"
            />
            <button
              onClick={handleTranslate}
              disabled={!input.trim() || isLoading}
              className="absolute bottom-4 right-4 bg-accent text-white px-6 py-3 rounded-full font-medium flex items-center gap-2 shadow-lg shadow-accent/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Send size={20} />
              )}
              <span>{isLoading ? 'Translating...' : 'Translate'}</span>
            </button>
          </div>
        </section>

        {/* Output Section */}
        <AnimatePresence mode="wait">
          {output && (
            <motion.section
              key="output"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              ref={outputRef}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-widest text-accent/70">
                  Myanmar Translation
                </label>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 text-xs font-medium text-accent hover:text-accent/80 transition-colors bg-accent/5 px-3 py-1.5 rounded-full"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied' : 'Copy Text'}
                </button>
              </div>
              <div className="bg-white border border-accent/10 rounded-3xl p-8 md:p-12 shadow-xl shadow-accent/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-accent/20" />
                <div className="markdown-body prose prose-stone max-w-none">
                  <Markdown>{output}</Markdown>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* History Section */}
        {history.length > 0 && (
          <section className="pt-12 border-t border-accent/10 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-accent/70 flex items-center gap-2">
                <History size={14} />
                Recent Translations
              </h3>
              <button 
                onClick={clearHistory}
                className="text-[10px] uppercase tracking-wider text-red-500/60 hover:text-red-500 transition-colors flex items-center gap-1"
              >
                <Trash2 size={12} />
                Clear
              </button>
            </div>
            <div className="grid gap-4">
              {history.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white/50 border border-accent/5 rounded-xl p-4 hover:border-accent/20 transition-colors cursor-pointer group"
                  onClick={() => {
                    setInput(item.original);
                    setOutput(item.translated);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <p className="text-sm text-accent/60 line-clamp-1 italic mb-1">{item.original}</p>
                  <p className="text-ink font-serif line-clamp-2">{item.translated}</p>
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
