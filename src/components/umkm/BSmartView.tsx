import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Copy,
  Megaphone,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { BinaExpression } from '../BinaMascot.tsx';
import type { ContentStatus, MarketingContent, UmkmStore } from '../../types.ts';

interface BSmartViewProps {
  store: UmkmStore;
}

interface GeneratedMarketingPack {
  contentIdeas?: string[];
  headline?: string;
  instagramCaption?: string;
  facebookCaption?: string;
  whatsappText?: string;
  cta?: string;
  weeklyPlan?: { day: string; theme: string; channel: string }[];
  provider?: string;
}

export const BSmartView: React.FC<BSmartViewProps> = ({ store }) => {
  const {
    products,
    marketingContents,
    allOrders,
    saveMarketingContent,
    updateMarketingStatus,
    deleteMarketingContent,
    showToast,
  } = useApp();

  const storeProducts = useMemo(
    () => products.filter((p) => p.storeId === store.id),
    [products, store.id]
  );

  const storeContents = useMemo(
    () => marketingContents.filter((c) => c.storeId === store.id),
    [marketingContents, store.id]
  );

  const storeOrdersCount = useMemo(
    () => allOrders.filter((o) => o.storeId === store.id).length,
    [allOrders, store.id]
  );

  const [selectedProdId, setSelectedProdId] = useState(storeProducts[0]?.id || '');
  const [channel, setChannel] = useState<MarketingContent['channel']>('Instagram');
  const [goal, setGoal] = useState('Meningkatkan penjualan harian dan memperkenalkan keunggulan produk');
  const [generating, setGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<GeneratedMarketingPack | null>(null);

  // Save to Calendar fields
  const [calTitle, setCalTitle] = useState('');
  const [calDate, setCalDate] = useState(new Date().toISOString().slice(0, 10));
  const [calStatus, setCalStatus] = useState<ContentStatus>('Scheduled');

  useEffect(() => {
    setSelectedProdId(storeProducts[0]?.id || '');
    setAiResult(null);
  }, [store.id]);

  useEffect(() => {
    if (!selectedProdId && storeProducts.length > 0) {
      setSelectedProdId(storeProducts[0].id);
    }
  }, [selectedProdId, storeProducts]);

  const selectedProduct = storeProducts.find((p) => p.id === selectedProdId) || storeProducts[0];

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const resp = await fetch('/api/ai/b-smart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store,
          product: selectedProduct,
          goal,
          channel,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Gagal membuat konten AI.');
      setAiResult(data);
      setCalTitle(data.headline || `Promosi ${selectedProduct?.name || store.name}`);
      showToast('Materi pemasaran AI B-Smart siap digunakan!', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Gagal menghubungi B-Smart AI.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Teks promosi disalin ke clipboard!', 'success');
  };

  const handleSaveToCalendar = async (captionText: string, ch: MarketingContent['channel']) => {
    await saveMarketingContent({
      storeId: store.id,
      productId: selectedProduct?.id || null,
      productName: selectedProduct?.name || null,
      channel: ch,
      title: calTitle || `Kampanye ${ch} — ${store.name}`,
      headline: aiResult?.headline || calTitle || store.name,
      caption: captionText,
      cta: aiResult?.cta || 'Pesan sekarang melalui B-Market BSI UMKM Center!',
      scheduledDate: calDate,
      status: calStatus,
    });
  };

  const publishedCount = storeContents.filter((c) => c.status === 'Published').length;
  const scheduledCount = storeContents.filter((c) => c.status === 'Scheduled').length;
  const draftCount = storeContents.filter((c) => c.status === 'Draft').length;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-soft-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <BinaExpression mood="idea" className="w-16 h-16" />
          <div>
            <p className="text-xs font-bold text-[#F8AD3C] uppercase">B-Smart · AI Digital Marketing</p>
            <h2 className="font-display text-xl font-extrabold text-[#1E293B]">
              Asisten Promosi & Kalender Konten {store.name}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Buat ide konten, caption Instagram, Facebook, WhatsApp Business, dan jadwal promosi otomatis.
            </p>
          </div>
        </div>
      </div>

      {/* Real Performance Metrics (Zero fictional data) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Total Konten Tersimpan" value={String(storeContents.length)} />
        <MetricCard label="Konten Published" value={String(publishedCount)} accent="text-[#00A39D]" />
        <MetricCard label="Terjadwal (Scheduled)" value={String(scheduledCount)} accent="text-[#F8AD3C]" />
        <MetricCard label="Konversi Order B-Market" value={String(storeOrdersCount)} accent="text-[#006B68]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* AI Generator Form */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 p-5 shadow-soft-card space-y-4">
          <h3 className="font-display font-bold text-base text-[#1E293B] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#F8AD3C]" />
            Generator Konten & Copywriting AI
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Produk Fokus</label>
            <select
              value={selectedProdId}
              onChange={(e) => setSelectedProdId(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm bg-white"
            >
              {storeProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Kanal Promosi Utama</label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as MarketingContent['channel'])}
              className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm bg-white"
            >
              <option value="Instagram">Instagram</option>
              <option value="Facebook">Facebook</option>
              <option value="WhatsApp Business">WhatsApp Business</option>
              <option value="B-Market Promo">B-Market Promo</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tujuan & Tema Kampanye</label>
            <textarea
              rows={3}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full h-12 rounded-xl bg-[#00A39D] hover:bg-[#006B68] disabled:opacity-60 text-white font-bold text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Megaphone className="w-4 h-4" />
            {generating ? 'BINA Sedang Merancang Materi...' : 'Buat Materi Promosi dengan AI'}
          </button>

          {/* Schedule Controls */}
          <div className="pt-3 border-t border-slate-100 space-y-2.5">
            <p className="text-xs font-bold text-slate-700">Pengaturan Penyimpanan Kalender</p>
            <input
              type="text"
              value={calTitle}
              onChange={(e) => setCalTitle(e.target.value)}
              placeholder="Judul kampanye konten"
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={calDate}
                onChange={(e) => setCalDate(e.target.value)}
                className="h-10 px-3 rounded-xl border border-slate-200 text-xs"
              />
              <select
                value={calStatus}
                onChange={(e) => setCalStatus(e.target.value as ContentStatus)}
                className="h-10 px-3 rounded-xl border border-slate-200 text-xs bg-white"
              >
                <option value="Draft">Draft</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Published">Published</option>
              </select>
            </div>
          </div>
        </div>

        {/* AI Output & Content Calendar */}
        <div className="lg:col-span-7 space-y-5">
          {aiResult && (
            <div className="bg-white rounded-3xl border border-[#00A39D]/30 p-5 shadow-soft-card space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display font-bold text-base text-[#006B68]">
                  Hasil Materi Promosi AI B-Smart
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-[#EEF9F8] text-[#006B68] text-[10px] font-bold">
                  {aiResult.provider === 'gemini' ? 'Gemini AI Aktif' : 'Asisten B-Smart'}
                </span>
              </div>

              {aiResult.headline && (
                <div className="p-3.5 rounded-2xl bg-[#F4F6F6] space-y-1">
                  <span className="text-[11px] font-bold text-slate-500">Headline & CTA</span>
                  <p className="text-sm font-extrabold text-[#1E293B]">{aiResult.headline}</p>
                  {aiResult.cta && <p className="text-xs font-semibold text-[#00A39D]">{aiResult.cta}</p>}
                </div>
              )}

              {aiResult.contentIdeas && aiResult.contentIdeas.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-700">Ide Konten Kreatif:</span>
                  <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
                    {aiResult.contentIdeas.map((idea, idx) => (
                      <li key={idx}>{idea}</li>
                    ))}
                  </ul>
                </div>
              )}

              {[
                { label: 'Caption Instagram', text: aiResult.instagramCaption, ch: 'Instagram' as const },
                { label: 'Caption Facebook', text: aiResult.facebookCaption, ch: 'Facebook' as const },
                { label: 'Pesan WhatsApp Business', text: aiResult.whatsappText, ch: 'WhatsApp Business' as const },
              ].map(
                (item) =>
                  item.text && (
                    <div key={item.label} className="p-3.5 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#006B68]">{item.label}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCopy(item.text!)}
                            className="text-xs font-semibold text-slate-600 hover:text-[#00A39D] inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" /> Salin
                          </button>
                          <button
                            onClick={() => handleSaveToCalendar(item.text!, item.ch)}
                            className="text-xs font-bold text-[#00A39D] hover:underline cursor-pointer"
                          >
                            + Simpan ke Kalender
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {item.text}
                      </p>
                    </div>
                  )
              )}

              {aiResult.weeklyPlan && aiResult.weeklyPlan.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-700">Rencana Konten Mingguan (Rekomendasi Frekuensi 4x/Minggu):</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {aiResult.weeklyPlan.map((wp, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-[#F4F6F6] text-xs">
                        <span className="font-bold text-[#006B68]">{wp.day} · {wp.channel}</span>
                        <p className="text-slate-600 mt-0.5">{wp.theme}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Content Calendar Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-soft-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-[#1E293B] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#00A39D]" />
                Kalender Pemasaran & Jadwal Unggahan ({storeContents.length})
              </h3>
              <span className="text-xs text-slate-500">Draf: {draftCount}</span>
            </div>

            {storeContents.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">
                Belum ada jadwal konten tersimpan. Buat materi dengan AI B-Smart lalu klik &ldquo;Simpan ke Kalender&rdquo;.
              </p>
            ) : (
              <div className="space-y-3">
                {storeContents.map((mc) => (
                  <div key={mc.id} className="p-4 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-bold text-[#00A39D]">
                          {mc.channel} · {mc.scheduledDate}
                        </span>
                        <h4 className="font-bold text-sm text-[#1E293B]">{mc.title}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={mc.status}
                          onChange={(e) => updateMarketingStatus(mc.id, e.target.value as ContentStatus)}
                          className="h-8 px-2.5 rounded-lg border border-slate-200 text-xs font-bold bg-[#F8FAFB]"
                        >
                          <option value="Draft">Draft</option>
                          <option value="Scheduled">Scheduled</option>
                          <option value="Published">Published</option>
                        </select>
                        <button
                          onClick={() => deleteMarketingContent(mc.id)}
                          className="text-rose-500 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-3 whitespace-pre-wrap">{mc.caption}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>CTA: {mc.cta}</span>
                      {mc.status === 'Published' && (
                        <span className="inline-flex items-center gap-1 text-[#00A39D] font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Terbit
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ label: string; value: string; accent?: string }> = ({
  label,
  value,
  accent = 'text-[#1E293B]',
}) => (
  <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-soft-card">
    <p className="text-[11px] font-semibold text-slate-500">{label}</p>
    <p className={`font-display text-2xl font-extrabold mt-1 tabular-nums ${accent}`}>{value}</p>
  </div>
);
