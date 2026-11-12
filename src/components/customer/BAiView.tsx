import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, MessageSquare, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { BinaExpression } from '../BinaMascot.tsx';
import { CHAT_PERSONAS, streamGeminiChat, type ChatPersonaId } from '../../lib/geminiChatClient.ts';
import type { AiChatMessage, AiConversation } from '../../types.ts';

function renderFormattedLine(line: string, keyPrefix: string) {
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

function FormattedAiText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => (
        <div key={i} className={line.trim() === '' ? 'h-1.5' : ''}>
          {line.trim() !== '' ? renderFormattedLine(line, `l-${i}`) : null}
        </div>
      ))}
    </div>
  );
}

interface BAiViewProps {
  apkMode?: boolean;
  initialPrompt?: string | null;
  onConsumeInitialPrompt?: () => void;
}

export const BAiView: React.FC<BAiViewProps> = ({
  apkMode = false,
  initialPrompt = null,
  onConsumeInitialPrompt,
}) => {
  const {
    isAuthenticated,
    activeUid,
    stores,
    products,
    verifications,
    orders,
    aiConversations,
    saveAiConversation,
    showToast,
  } = useApp();

  const [activeConvId, setActiveConvId] = useState<string>('conv-active');
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      text: 'Assalamu’alaikum! Saya **BINA**, asisten **B-AI** bertenaga Gemini AI di BSI UMKM Center. Tanyakan seputar produk BOTEGA, Windrasari, Lanjar Jaya / Bopes, Puya Kitchen, Depot Cheff 99, cara cek B-CHAIN, atau pesanan Anda!',
      createdAt: new Date().toISOString(),
    },
  ]);
  const [persona, setPersona] = useState<ChatPersonaId>('customer-guide');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiProvider, setAiProvider] = useState<string>('gemini');
  const [aiModelLabel, setAiModelLabel] = useState<string>('Gemini 4 Hydrogen');
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const consumedPromptRef = useRef<string | null>(null);
  const activePersona = CHAT_PERSONAS.find((p) => p.id === persona) || CHAT_PERSONAS[0];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const startNewChat = () => {
    const newId = `conv-${Date.now()}`;
    setActiveConvId(newId);
    setMessages([
      {
        id: 'welcome-msg-' + Date.now(),
        role: 'assistant',
        text: 'Halo! Percakapan baru dengan **BINA** siap dimulai. Ada yang bisa BINA bantu hari ini?',
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const loadConversation = (conv: AiConversation) => {
    setActiveConvId(conv.id);
    setMessages(conv.messages);
  };

  const sendMessage = async (textToSend?: string) => {
    const queryText = (textToSend ?? input).trim();
    if (!queryText || loading) return;

    const now = new Date().toISOString();
    const userMsg: AiChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: queryText,
      createdAt: now,
    };
    const aiMsgId = `a-${Date.now()}`;
    const placeholderAiMsg: AiChatMessage = {
      id: aiMsgId,
      role: 'assistant',
      text: '',
      createdAt: now,
    };

    const nextMessages = [...messages, userMsg];
    setMessages([...nextMessages, placeholderAiMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const result = await streamGeminiChat({
        message: queryText,
        history: nextMessages,
        rolePersona: persona,
        context: {
          portalRole: 'customer',
          stores,
          products: products.filter((p) => p.isPublished),
          verifications,
          orders,
        },
        onChunk: (accumulated, provider, model) => {
          if (provider) setAiProvider(provider);
          if (model) {
            setAiModelLabel(
              model === 'gemini-3.1-flash-lite'
                ? 'Gemini 3.1 Flash Lite'
                : model === 'local'
                ? 'Asisten Lokal'
                : 'Gemini 4 Hydrogen'
            );
          }
          setMessages((prev) =>
            prev.map((m) => (m.id === aiMsgId ? { ...m, text: accumulated } : m))
          );
        },
      });

      const finalAiMsg: AiChatMessage = {
        id: aiMsgId,
        role: 'assistant',
        text: result.reply,
        createdAt: new Date().toISOString(),
      };
      const finalMessages = [...nextMessages, finalAiMsg];
      setMessages(finalMessages);

      if (isAuthenticated && activeUid) {
        await saveAiConversation({
          id: activeConvId,
          userId: activeUid,
          title: queryText.slice(0, 48),
          messages: finalMessages,
          createdAt: now,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      showToast(err?.message || 'Gagal menghubungi B-AI.', 'error');
      setMessages([
        ...nextMessages,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          text: `Maaf, BINA mengalami kendala: ${err?.message || 'Layanan belum tersedia.'}`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialPrompt && initialPrompt !== consumedPromptRef.current) {
      consumedPromptRef.current = initialPrompt;
      sendMessage(initialPrompt);
      onConsumeInitialPrompt?.();
    }
  }, [initialPrompt]);

  return (
    <div className={`grid grid-cols-1 gap-4 ${apkMode ? '' : 'lg:grid-cols-12 gap-5'}`}>
      {/* Sidebar Riwayat */}
      <div className={`${apkMode ? '' : 'lg:col-span-4'} space-y-3`}>
        <div className={`bg-white rounded-3xl border border-slate-200/80 shadow-soft-card space-y-3 ${apkMode ? 'p-4' : 'p-5'}`}>
          <div className="flex items-center gap-3">
            <BinaExpression mood="idea" className={apkMode ? 'w-12 h-12' : 'w-16 h-16'} />
            <div>
              <p className="text-xs font-bold text-[#00A39D] uppercase inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#F8AD3C]" />
                B-AI · Asisten Pintar
              </p>
              <h2 className={`font-display font-extrabold text-[#1E293B] ${apkMode ? 'text-base' : 'text-lg'}`}>
                Tanya BINA
              </h2>
              <p className="text-[11px] text-slate-500">
                Terhubung langsung dengan data B-Market & B-CHAIN
              </p>
            </div>
          </div>

          <button
            onClick={startNewChat}
            className="w-full h-10 rounded-xl bg-[#00A39D] hover:bg-[#006B68] text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Percakapan Baru
          </button>

          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-500 uppercase">Peran Asisten Gemini</p>
            <div className="grid grid-cols-2 gap-1.5">
              {CHAT_PERSONAS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPersona(p.id)}
                  className={`text-left p-2 rounded-xl border text-[11px] transition-colors cursor-pointer ${
                    persona === p.id
                      ? 'bg-[#00A39D] text-white border-[#00A39D] font-bold'
                      : 'bg-[#F4F6F6] text-slate-700 border-slate-200/70 hover:border-[#00A39D]'
                  }`}
                >
                  <span className="block truncate">{p.label}</span>
                  <span className={`block text-[9px] truncate ${persona === p.id ? 'text-white/80' : 'text-slate-400'}`}>
                    {p.modelLabel}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-500 uppercase">Pertanyaan Cepat</p>
            <div className={apkMode ? 'flex gap-2 overflow-x-auto pb-1' : 'space-y-1.5'}>
              {activePersona.quickPrompts.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className={`${
                    apkMode ? 'shrink-0 max-w-[230px] truncate' : 'w-full'
                  } text-left p-2.5 rounded-xl bg-[#F4F6F6] hover:bg-[#00A39D]/10 text-xs text-slate-700 font-medium transition-colors cursor-pointer`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {aiConversations.length > 0 && !apkMode && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-soft-card space-y-2">
            <p className="text-xs font-bold text-slate-600 px-1">Riwayat Percakapan</p>
            {aiConversations.slice(0, 6).map((c) => (
              <button
                key={c.id}
                onClick={() => loadConversation(c)}
                className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer ${
                  activeConvId === c.id
                    ? 'bg-[#00A39D]/10 text-[#006B68] font-bold'
                    : 'hover:bg-slate-50 text-slate-600'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{c.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chat Viewport */}
      <div
        className={`${
          apkMode ? 'h-[450px]' : 'lg:col-span-8 h-[70vh] min-h-[480px]'
        } bg-white rounded-3xl border border-slate-200/80 shadow-soft-card flex flex-col overflow-hidden`}
      >
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-2 bg-[#F8FAFB]">
          <div className="flex items-center gap-2.5 min-w-0">
            <BinaExpression mood={loading ? 'thinking' : 'wave'} className="w-10 h-10" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#1E293B] truncate">BINA — Asisten B-AI</p>
              <p className="text-[11px] text-[#00A39D] font-medium truncate">
                {loading ? 'Sedang berpikir & memeriksa data...' : 'Aktif · Siap membantu Anda'}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EEF9F8] border border-[#00A39D]/25 text-[10px] font-bold text-[#006B68] shrink-0">
            {aiProvider === 'gemini' ? `${aiModelLabel} · Aktif` : 'Asisten Lokal'}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <BinaExpression mood={loading && !m.text ? 'thinking' : 'wave'} className="w-9 h-9 mt-1" />
              )}
              <div
                className={`max-w-[82%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-[#006B68] text-white rounded-br-sm'
                    : 'bg-[#F4F6F6] text-[#1E293B] rounded-bl-sm border border-slate-200/60'
                }`}
              >
                {m.text ? (
                  <FormattedAiText text={m.text} />
                ) : (
                  <span className="text-slate-400 italic">BINA sedang mengetik jawaban...</span>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2.5 items-center">
              <BinaExpression mood="thinking" className="w-9 h-9" />
              <div className="bg-[#F4F6F6] rounded-2xl px-4 py-3 text-xs text-slate-500">
                BINA sedang mengetik jawaban...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="p-3 sm:p-4 border-t border-slate-100 flex gap-2 bg-white"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tulis pertanyaan Anda tentang produk, toko UMKM, atau B-CHAIN..."
            className="flex-1 h-12 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#00A39D]"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="h-12 px-5 rounded-xl bg-[#00A39D] hover:bg-[#006B68] disabled:opacity-50 text-white font-bold text-sm inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Kirim</span>
          </button>
        </form>
      </div>
    </div>
  );
};
