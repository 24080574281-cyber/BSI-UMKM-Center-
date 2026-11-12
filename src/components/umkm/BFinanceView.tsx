import React, { useEffect, useMemo, useState } from 'react';
import {
  Bot,
  FileSpreadsheet,
  FileText,
  Plus,
  Send,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { BinaExpression } from '../BinaMascot.tsx';
import {
  exportFinancialReportExcel,
  exportFinancialReportPdf,
  formatDate,
  formatRupiah,
} from '../../lib/utils.ts';
import type { UmkmStore } from '../../types.ts';

interface BFinanceViewProps {
  store: UmkmStore;
}

export const BFinanceView: React.FC<BFinanceViewProps> = ({ store }) => {
  const { financialTransactions, addFinancialTx, deleteFinancialTx, showToast } = useApp();

  const storeTx = useMemo(
    () => financialTransactions.filter((t) => t.storeId === store.id),
    [financialTransactions, store.id]
  );

  const summary = useMemo(() => {
    const totalIncome = storeTx
      .filter((t) => t.type === 'PEMASUKAN')
      .reduce((s, t) => s + Number(t.amount || 0), 0);
    const totalExpense = storeTx
      .filter((t) => t.type === 'PENGELUARAN')
      .reduce((s, t) => s + Number(t.amount || 0), 0);
    const netProfit = totalIncome - totalExpense;
    return {
      totalIncome,
      totalExpense,
      netProfit,
      balance: netProfit,
    };
  }, [storeTx]);

  // Daily & Monthly recap aggregation
  const monthlyRecap = useMemo(() => {
    const map = new Map<string, { month: string; income: number; expense: number }>();
    storeTx.forEach((t) => {
      const m = t.date.slice(0, 7);
      const curr = map.get(m) || { month: m, income: 0, expense: 0 };
      if (t.type === 'PEMASUKAN') curr.income += t.amount;
      else curr.expense += t.amount;
      map.set(m, curr);
    });
    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [storeTx]);

  const [reportFilter, setReportFilter] = useState<'semua' | 'PEMASUKAN' | 'PENGELUARAN' | 'rekap'>('semua');

  // Form state
  const [txType, setTxType] = useState<'PEMASUKAN' | 'PENGELUARAN'>('PEMASUKAN');
  const [txCategory, setTxCategory] = useState('Penjualan');
  const [txDesc, setTxDesc] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().slice(0, 10));
  const [categorizing, setCategorizing] = useState(false);

  // AI Finance Assistant
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiReply, setAiReply] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    setAiReply('');
    setAiQuestion('');
  }, [store.id]);

  const handleAutoCategorize = async () => {
    if (!txDesc.trim()) {
      showToast('Tulis keterangan transaksi terlebih dahulu agar AI dapat mengategorikan.', 'info');
      return;
    }
    setCategorizing(true);
    try {
      const resp = await fetch('/api/ai/b-finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'categorize',
          description: txDesc,
          amount: Number(txAmount) || 0,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error);
      if (data.type === 'PEMASUKAN' || data.type === 'PENGELUARAN') {
        setTxType(data.type);
      }
      if (data.category) setTxCategory(data.category);
      showToast(`AI B-Finance: ${data.category} (${data.reason || 'terkategori'})`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Gagal mengategorikan otomatis.', 'error');
    } finally {
      setCategorizing(false);
    }
  };

  const handleAddTx = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(txAmount);
    if (!val || val <= 0) {
      showToast('Nominal harus lebih dari 0.', 'error');
      return;
    }
    await addFinancialTx({
      storeId: store.id,
      type: txType,
      category: txCategory,
      description: txDesc.trim() || txCategory,
      amount: val,
      date: txDate,
      source: 'Manual B-Finance',
    });
    setTxDesc('');
    setTxAmount('');
  };

  const handleAskAiFinance = async (customQ?: string) => {
    setAnalyzing(true);
    try {
      const resp = await fetch('/api/ai/b-finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'analyze',
          summary,
          transactions: storeTx,
          question: customQ || aiQuestion || undefined,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error);
      setAiReply(data.reply);
      if (!customQ) setAiQuestion('');
    } catch (err: any) {
      showToast(err?.message || 'Gagal menganalisis keuangan.', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const maxBar = Math.max(
    1,
    ...monthlyRecap.map((m) => Math.max(m.income, m.expense)),
    summary.totalIncome,
    summary.totalExpense
  );

  const visibleTx = storeTx.filter((t) =>
    reportFilter === 'PEMASUKAN' || reportFilter === 'PENGELUARAN' ? t.type === reportFilter : true
  );

  return (
    <div className="space-y-6">
      {/* Header & Exports */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-soft-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-[#00A39D] uppercase">B-Finance · Manajemen Keuangan AI</p>
          <h2 className="font-display text-xl font-extrabold text-[#1E293B]">
            Pembukuan & Laporan Keuangan {store.name}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Penjualan dari B-Market tercatat otomatis. Catat bahan baku, biaya operasional, dan ekspor PDF/Excel.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => exportFinancialReportPdf(store.name, storeTx, summary)}
            className="h-10 px-4 rounded-xl border border-[#00A39D] text-[#006B68] font-bold text-xs inline-flex items-center gap-1.5 hover:bg-[#00A39D]/5 cursor-pointer"
          >
            <FileText className="w-4 h-4" /> Ekspor PDF
          </button>
          <button
            onClick={() => exportFinancialReportExcel(store.name, storeTx, summary)}
            className="h-10 px-4 rounded-xl bg-[#006B68] hover:bg-[#004f4d] text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" /> Ekspor Excel
          </button>
        </div>
      </div>

      {/* 4 Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-soft-card">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Pemasukan</span>
            <TrendingUp className="w-4 h-4 text-[#00A39D]" />
          </div>
          <p className="font-display text-xl font-extrabold text-[#00A39D] mt-1 tabular-nums">
            {formatRupiah(summary.totalIncome)}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-soft-card">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Pengeluaran</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <p className="font-display text-xl font-extrabold text-rose-600 mt-1 tabular-nums">
            {formatRupiah(summary.totalExpense)}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-soft-card">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Laba / Rugi Bersih</span>
            <Wallet className="w-4 h-4 text-[#006B68]" />
          </div>
          <p
            className={`font-display text-xl font-extrabold mt-1 tabular-nums ${
              summary.netProfit >= 0 ? 'text-[#006B68]' : 'text-rose-600'
            }`}
          >
            {formatRupiah(summary.netProfit)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-[#00A39D] to-[#006B68] text-white rounded-2xl p-4 shadow-soft-card">
          <span className="text-xs text-white/80">Saldo Kas Tercatat</span>
          <p className="font-display text-xl font-extrabold mt-1 tabular-nums">
            {formatRupiah(summary.balance)}
          </p>
        </div>
      </div>

      {/* Record Transaction + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleAddTx}
          className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 p-5 shadow-soft-card space-y-3.5"
        >
          <h3 className="font-display font-bold text-base text-[#1E293B] flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#00A39D]" />
            Catat Transaksi Keuangan
          </h3>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setTxType('PEMASUKAN');
                setTxCategory('Penjualan');
              }}
              className={`h-10 rounded-xl text-xs font-bold border cursor-pointer ${
                txType === 'PEMASUKAN'
                  ? 'bg-[#00A39D] text-white border-[#00A39D]'
                  : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              Pemasukan
            </button>
            <button
              type="button"
              onClick={() => {
                setTxType('PENGELUARAN');
                setTxCategory('Pembelian Bahan');
              }}
              className={`h-10 rounded-xl text-xs font-bold border cursor-pointer ${
                txType === 'PENGELUARAN'
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              Pengeluaran
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">Keterangan Transaksi</label>
              <button
                type="button"
                onClick={handleAutoCategorize}
                disabled={categorizing}
                className="text-[11px] font-bold text-[#00A39D] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                {categorizing ? 'Mengkategorikan...' : 'Kategorikan Otomatis AI'}
              </button>
            </div>
            <input
              type="text"
              required
              value={txDesc}
              onChange={(e) => setTxDesc(e.target.value)}
              placeholder="Contoh: Beli tepung terigu & kemasan box"
              className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
              <select
                value={txCategory}
                onChange={(e) => setTxCategory(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-xs bg-white"
              >
                <option value="Penjualan">Penjualan</option>
                <option value="Pemasukan Lainnya">Pemasukan Lainnya</option>
                <option value="Pembelian Bahan">Pembelian Bahan</option>
                <option value="Biaya Operasional">Biaya Operasional</option>
                <option value="Biaya Lainnya">Biaya Lainnya</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal</label>
              <input
                type="date"
                required
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nominal (Rp)</label>
            <input
              type="number"
              min={1}
              required
              value={txAmount}
              onChange={(e) => setTxAmount(e.target.value)}
              placeholder="Contoh: 150000"
              className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm tabular-nums"
            />
          </div>

          <button
            type="submit"
            className="w-full h-11 rounded-xl bg-[#00A39D] hover:bg-[#006B68] text-white font-bold text-sm cursor-pointer"
          >
            Simpan Transaksi
          </button>
        </form>

        {/* Chart & AI Financial Assistant */}
        <div className="lg:col-span-7 space-y-5">
          {/* SVG Cashflow Chart */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-soft-card">
            <h3 className="font-display font-bold text-base text-[#1E293B] mb-4">
              Grafik Arus Kas (Pemasukan vs Pengeluaran)
            </h3>
            {storeTx.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">
                Grafik akan terbentuk otomatis setelah transaksi pertama dicatat.
              </p>
            ) : (
              <div className="space-y-3">
                {(monthlyRecap.length > 0 ? monthlyRecap : [{ month: 'Total', income: summary.totalIncome, expense: summary.totalExpense }]).map((m) => (
                  <div key={m.month} className="space-y-1.5 text-xs">
                    <div className="flex justify-between font-semibold text-slate-700">
                      <span>Periode {m.month}</span>
                      <span className="tabular-nums">
                        +{formatRupiah(m.income)} / -{formatRupiah(m.expense)}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-[#00A39D] rounded-full"
                          style={{ width: `${Math.max(4, Math.round((m.income / maxBar) * 100))}%` }}
                        />
                      </div>
                      <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-[#F8AD3C] rounded-full"
                          style={{ width: `${Math.max(4, Math.round((m.expense / maxBar) * 100))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-4 pt-2 text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#00A39D] inline-block" /> Pemasukan
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#F8AD3C] inline-block" /> Pengeluaran
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* AI Financial Assistant */}
          <div className="bg-white rounded-3xl border border-[#00A39D]/25 p-5 shadow-soft-card space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <BinaExpression mood="chart" className="w-12 h-12" />
                <div>
                  <h3 className="font-display font-bold text-sm text-[#1E293B]">
                    Asisten Keuangan AI BINA
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Analisis arus kas & rekomendasi berbasis transaksi nyata Anda
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleAskAiFinance('Buat ringkasan keuangan dan 3 rekomendasi penghematan atau peningkatan margin berdasarkan data transaksi saya.')}
                disabled={analyzing}
                className="px-3.5 py-2 rounded-xl bg-[#00A39D] hover:bg-[#006B68] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Bot className="w-3.5 h-3.5" />
                {analyzing ? 'Menganalisis...' : 'Ringkas Keuangan'}
              </button>
            </div>

            {aiReply && (
              <div className="p-4 rounded-2xl bg-[#F4F6F6] text-xs text-slate-700 leading-relaxed space-y-1">
                {aiReply.split('\n').map((line, idx) => (
                  <p key={idx} className={line.trim() === '' ? 'h-1' : ''}>
                    {line.split(/(\*\*[^*]+\*\*)/g).map((part, pIdx) =>
                      part.startsWith('**') && part.endsWith('**') ? (
                        <strong key={pIdx} className="font-bold text-[#1E293B]">
                          {part.slice(2, -2)}
                        </strong>
                      ) : (
                        <React.Fragment key={pIdx}>{part}</React.Fragment>
                      )
                    )}
                  </p>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAskAiFinance();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                placeholder="Tanya tentang laba rugi, biaya terbesar, atau kesehatan kas..."
                className="flex-1 h-10 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#00A39D]"
              />
              <button
                type="submit"
                disabled={analyzing || !aiQuestion.trim()}
                className="px-4 h-10 rounded-xl bg-[#006B68] disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" /> Tanya
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Reports & Ledger Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-soft-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-display font-bold text-base text-[#1E293B]">
            Laporan & Ringkasan Transaksi
          </h3>
          <div className="flex items-center gap-1 p-1 bg-[#F4F6F6] rounded-xl overflow-x-auto">
            {[
              { id: 'semua', label: 'Semua & Laba Rugi' },
              { id: 'PEMASUKAN', label: 'Laporan Pemasukan' },
              { id: 'PENGELUARAN', label: 'Laporan Pengeluaran' },
              { id: 'rekap', label: 'Rekap Bulanan' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setReportFilter(t.id as typeof reportFilter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer ${
                  reportFilter === t.id ? 'bg-white text-[#006B68] shadow-sm' : 'text-slate-600'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {reportFilter === 'rekap' ? (
          monthlyRecap.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">Belum ada transaksi untuk direkap per bulan.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs tabular-nums">
                <thead className="bg-[#F4F6F6] text-slate-600 font-bold">
                  <tr>
                    <th className="p-3">Bulan</th>
                    <th className="p-3 text-right">Pemasukan</th>
                    <th className="p-3 text-right">Pengeluaran</th>
                    <th className="p-3 text-right">Laba / Rugi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthlyRecap.map((m) => (
                    <tr key={m.month}>
                      <td className="p-3 font-bold text-slate-800">{m.month}</td>
                      <td className="p-3 text-right text-[#00A39D] font-bold">{formatRupiah(m.income)}</td>
                      <td className="p-3 text-right text-rose-600 font-bold">{formatRupiah(m.expense)}</td>
                      <td className="p-3 text-right font-extrabold text-[#006B68]">{formatRupiah(m.income - m.expense)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : visibleTx.length === 0 ? (
          <p className="text-xs text-slate-500 py-8 text-center">Belum ada transaksi tercatat.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs tabular-nums">
              <thead className="bg-[#F4F6F6] text-slate-600 font-bold">
                <tr>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Jenis</th>
                  <th className="p-3">Kategori</th>
                  <th className="p-3">Keterangan</th>
                  <th className="p-3 text-right">Nominal</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleTx.map((tx) => (
                  <tr key={tx.id}>
                    <td className="p-3 text-slate-500">{formatDate(tx.date)}</td>
                    <td className="p-3">
                      <span className={`font-bold ${tx.type === 'PEMASUKAN' ? 'text-[#00A39D]' : 'text-rose-600'}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-700">{tx.category}</td>
                    <td className="p-3 text-slate-600">{tx.description}</td>
                    <td className={`p-3 text-right font-bold ${tx.type === 'PEMASUKAN' ? 'text-[#006B68]' : 'text-rose-600'}`}>
                      {tx.type === 'PEMASUKAN' ? '+' : '-'}{formatRupiah(tx.amount)}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => deleteFinancialTx(tx.id)}
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
