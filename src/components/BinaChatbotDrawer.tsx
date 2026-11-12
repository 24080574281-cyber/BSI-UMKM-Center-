import React, { useEffect, useRef, useState } from 'react';
import { Bot, RotateCcw, Send, Sparkles, X } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { BinaExpression } from './BinaMascot.tsx';
import { CHAT_PERSONAS, streamGeminiChat, type ChatPersonaId } from '../lib/geminiChatClient.ts';
import type { AiChatMessage } from '../types.ts';

function renderInlineMarkdown(line: string, keyPrefix: string) {
  const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <React.Fragment key={keyPrefix}>
      {parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={`${keyPrefix}-${idx}`} className="font-bold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code
              key={`${keyPrefix}-${idx}`}
              className="px-1.5 py-0.5 rounded bg-black/10 font-mono text-[11px]"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return <React.Fragment key={`${keyPrefix}-${idx}`}>{part}</React.Fragment>;
      })}
    </React.Fragment>
  );
}

interface BinaChatbotDrawerProps {
  apkMode?: boolean;
}

export const BinaChatbotDrawer: React.FC<BinaChatbotDrawerProps> = ({ apkMode = true }) => {
  const {
    activePortal,
    stores,
    products,
    verifications,
    orders,
    showToast,
  } = useApp();

  const defaultPersona: ChatPersonaId =
    activePortal === 'umkm' ? 'umkm-mentor' : 'customer-guide';

  const [open, setOpen] = useState(false);
  const [persona, setPersona] = useState<ChatPersonaId>(defaultPersona);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [providerLabel, setProviderLabel] = useState<string>('Gemini 4 Hydrogen');
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      text: 'Assalamu’alaikum! Saya **BINA**, chatbot Gemini multi-turn BSI UMKM Center. Tanyakan produk, sejarah UMKM, B-CHAIN, strategi bisnis, atau webinar B-Edu!',
      createdAt: new Date().toISOString(),
    },
  ]);

  const threadEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setPersona(activePortal === 'umkm' ? 'umkm-mentor' : 'customer-guide');
  }, [activePortal]);

  useEffect(() => {
    if (open) {
      threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, open]);

  const activePersonaObj = CHAT_PERSONAS.find((p) => p.id === persona) || CHAT_PERSONAS[0];

  const handleReset = () => {
    setMessages([
      {
        id: 'welcome-msg',
        role: 'assistant',
        text: `Percakapan baru dimulai dalam peran **${activePersonaObj.label}**. Silakan ajukan pertanyaan Anda!`,
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const handleSend = async (overrideText?: string) => {
    const queryText = (overrideText ?? input).trim();
    if (!queryText || loading) return;

    const now = new Date().toISOString();
    const userMsg: AiChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: queryText,
      createdAt: now,
    };
    const streamMsgId = `a-${Date.now()}`;
    const placeholderAiMsg: AiChatMessage = {
      id: streamMsgId,
      role: 'assistant',
      text: '',
      createdAt: now,
    };

    const historySnapshot = [...messages, userMsg];
    setMessages([...historySnapshot, placeholderAiMsg]);
    if (!overrideText) setInput('');
    setLoading(true);

    try {
      const result = await streamGeminiChat({
        message: queryText,
        history: historySnapshot,
        rolePersona: persona,
        context: {
          portalRole: activePortal,
          stores,
          products: products.filter((p) => p.isPublished),
          verifications,
          orders,
        },
        onChunk: (accumulated, provider, model) => {
          if (provider === 'gemini') {
            setProviderLabel(
              model === 'gemini-3.1-flash-lite' ? 'Gemini 3.1 Flash Lite' : 'Gemini 4 Hydrogen'
            );
          } else if (provider) {
            setProviderLabel('Asisten Lokal');
          }
          setMessages((prev) =>
            prev.map((m) => (m.id === streamMsgId ? { ...m, text: accumulated } : m))
          );
        },
      });

      setMessages((prev) =>
        prev.map((m) => (m.id === streamMsgId ? { ...m, text: result.reply } : m))
      );
    } catch (err: any) {
      showToast(err?.message || 'Gagal menghubungi chatbot Gemini.', 'error');
      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamMsgId
            ? { ...m, text: `Maaf, terjadi kendala saat menjawab: ${err?.message || 'coba ulangi lagi.'}` }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating BINA Gemini Chatbot Launcher */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Buka Chatbot BINA Gemini"
          className={`fixed z-40 ${
            apkMode ? 'bottom-20 right-3.5' : 'bottom-20 md:bottom-6 right-4 sm:right-6'
          } group flex items-center gap-2 pl-2 pr-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#006B68] to-[#00A39D] text-white shadow-lg border border-white/25 hover:scale-105 active:scale-95 transition-transform cursor-pointer`}
        >
          <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden shrink-0">
            <BinaExpression mood="wave" className="w-8 h-8" />
          </span>
          <div className="text-left leading-tight">
            <span className="text-[11px] font-extrabold block">Chat BINA AI</span>
            <span className="text-[9px] text-[#F8AD3C] font-bold flex items-center gap-0.5">
              <Sparkles className="w-2.5 h-2.5" /> Gemini Chatbot
            </span>
          </div>
        </button>
      )}

      {/* Multi-turn Gemini Chat Drawer / Modal */}
      {open && (
        <div
          className={`fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex ${
            apkMode ? 'items-end justify-center p-2' : 'items-end sm:items-center justify-end sm:p-5'
          }`}
        >
          <div
            className={`bg-white w-full ${
              apkMode ? 'max-w-[410px] h-[82%]' : 'sm:max-w-md h-[85vh] sm:h-[620px]'
            } rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden`}
          >
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-[#006B68] to-[#00A39D] text-white flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center overflow-hidden shrink-0">
                  <BinaExpression mood={loading ? 'thinking' : 'idea'} className="w-9 h-9" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-display font-extrabold text-sm truncate">BINA Chatbot</h3>
                    <span className="px-1.5 py-0.5 rounded bg-white/15 text-[9px] font-bold text-[#F8AD3C] shrink-0">
                      {providerLabel}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/85 truncate">{activePersonaObj.shortDesc}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handleReset}
                  title="Mulai percakapan baru"
                  className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Tutup chatbot"
                  className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Role / System Instruction Switcher */}
            <div className="px-3 py-2 bg-[#F4F6F6] border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto shrink-0">
              <Bot className="w-3.5 h-3.5 text-[#006B68] shrink-0" />
              {CHAT_PERSONAS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPersona(p.id)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap cursor-pointer transition-colors ${
                    persona === p.id
                      ? 'bg-[#00A39D] text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-[#00A39D]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Scrollable Multi-Turn Message Thread */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-white">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.role === 'assistant' && (
                    <BinaExpression mood={loading && !m.text ? 'thinking' : 'wave'} className="w-7 h-7 mt-1 shrink-0" />
                  )}
                  <div
                    className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-[#006B68] text-white rounded-br-sm'
                        : 'bg-[#F4F6F6] text-[#1E293B] rounded-bl-sm border border-slate-200/70'
                    }`}
                  >
                    {m.text ? (
                      <div className="space-y-1">
                        {m.text.split('\n').map((line, i) => (
                          <div key={i} className={line.trim() === '' ? 'h-1' : ''}>
                            {line.trim() !== '' ? renderInlineMarkdown(line, `${m.id}-${i}`) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">BINA sedang mengetik...</span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={threadEndRef} />
            </div>

            {/* Quick Prompts */}
            <div className="px-3 py-1.5 bg-[#F8FAFB] border-t border-slate-100 flex gap-1.5 overflow-x-auto shrink-0">
              {activePersonaObj.quickPrompts.map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={loading}
                  onClick={() => handleSend(q)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-[#00A39D] text-[10px] font-semibold text-[#006B68] whitespace-nowrap cursor-pointer disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Tanya ${activePersonaObj.label}...`}
                className="flex-1 h-10 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#00A39D]"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="h-10 px-3.5 rounded-xl bg-[#00A39D] hover:bg-[#006B68] disabled:opacity-50 text-white font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Kirim
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
