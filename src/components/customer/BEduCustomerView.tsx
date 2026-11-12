import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  Egg,
  Flame,
  Gamepad2,
  Gift,
  History,
  Newspaper,
  Play,
  Sparkles,
  Ticket,
  Video,
  XCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { BinaExpression } from '../BinaMascot.tsx';
import { BEduMediaHub } from '../BEduMediaHub.tsx';
import { formatDateTime } from '../../lib/utils.ts';
import type { EducationalGame } from '../../types.ts';

interface BEduCustomerViewProps {
  onRequestAuth: () => void;
  onOpenStoreInMarket?: (storeId: string) => void;
}

export const BEduCustomerView: React.FC<BEduCustomerViewProps> = ({
  onRequestAuth,
  onOpenStoreInMarket,
}) => {
  const {
    isAuthenticated,
    userProfile,
    games,
    vouchers,
    userPoints,
    voucherRedemptions,
    settings,
    completeQuizGame,
    claimDailyStreak,
    crackEggReward,
    redeemVoucher,
  } = useApp();

  const [tab, setTab] = useState<'news' | 'webinar' | 'games' | 'pecahtelur' | 'rewards' | 'myvouchers' | 'history'>('news');
  const [selectedGame, setSelectedGame] = useState<EducationalGame | null>(null);
  const [quizActive, setQuizActive] = useState(false);
  const [qIndex, setQIndex] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [quizResult, setQuizResult] = useState<{ correct: number; total: number; earned: number } | null>(null);

  // Streak & Pecah Telur state
  const [claimingStreak, setClaimingStreak] = useState(false);
  const [eggTaps, setEggTaps] = useState(0);
  const [eggShaking, setEggShaking] = useState(false);
  const [eggReward, setEggReward] = useState<{
    type: 'points' | 'voucher';
    title: string;
    subtitle: string;
    amount?: number;
    voucherCode?: string;
  } | null>(null);

  const activeGames = games.filter((g) => g.isActive);
  const activeVouchers = vouchers.filter((v) => v.isActive);
  const currentPoints = userProfile?.points ?? 0;
  const streakCount = userProfile?.streakCount ?? 0;
  const eggTickets = userProfile?.eggTickets ?? 0;
  const todayStr = new Date().toISOString().slice(0, 10);
  const alreadyCheckedInToday = userProfile?.lastCheckInDate === todayStr;

  const handleClaimStreak = async () => {
    if (!isAuthenticated) {
      onRequestAuth();
      return;
    }
    setClaimingStreak(true);
    await claimDailyStreak();
    setClaimingStreak(false);
  };

  const handleTapEgg = async () => {
    if (!isAuthenticated) {
      onRequestAuth();
      return;
    }
    if (eggTickets <= 0 || eggReward) return;
    setEggShaking(true);
    setTimeout(() => setEggShaking(false), 260);
    const nextTap = eggTaps + 1;
    if (nextTap < 3) {
      setEggTaps(nextTap);
      return;
    }
    setEggTaps(3);
    const reward = await crackEggReward();
    if (reward) {
      setEggReward(reward);
    } else {
      setEggTaps(0);
    }
  };

  const resetEggStage = () => {
    setEggReward(null);
    setEggTaps(0);
  };

  const startQuiz = (game: EducationalGame) => {
    setSelectedGame(game);
    setQuizActive(true);
    setQIndex(0);
    setSelectedOpt(null);
    setAnswered(false);
    setCorrectCount(0);
    setQuizResult(null);
  };

  const handleChooseOption = (idx: number) => {
    if (answered || !selectedGame) return;
    setSelectedOpt(idx);
    setAnswered(true);
    if (idx === selectedGame.questions[qIndex].correctIndex) {
      setCorrectCount((c) => c + 1);
    }
  };

  const handleNextQuestion = async () => {
    if (!selectedGame) return;
    if (qIndex < selectedGame.questions.length - 1) {
      setQIndex((i) => i + 1);
      setSelectedOpt(null);
      setAnswered(false);
    } else {
      const earned = await completeQuizGame(selectedGame, correctCount);
      setQuizActive(false);
      setQuizResult({
        correct: correctCount,
        total: selectedGame.questions.length,
        earned,
      });
    }
  };

  // Quiz Runner Screen
  if (quizActive && selectedGame) {
    const q = selectedGame.questions[qIndex];
    const progress = Math.round(((qIndex + 1) / selectedGame.questions.length) * 100);

    return (
      <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-soft-card space-y-6">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-[#00A39D]">{selectedGame.title}</span>
          <span className="font-bold text-slate-500 tabular-nums">
            Pertanyaan {qIndex + 1} / {selectedGame.questions.length}
          </span>
        </div>

        <div className="w-full h-2.5 rounded-full bg-[#F4F6F6] overflow-hidden">
          <div className="h-full bg-[#00A39D] transition-all" style={{ width: `${progress}%` }} />
        </div>

        <h2 className="font-display text-lg sm:text-xl font-extrabold text-[#1E293B]">
          {q.question}
        </h2>

        <div className="space-y-2.5">
          {q.options.map((opt, idx) => {
            const isCorrect = idx === q.correctIndex;
            const isSelected = idx === selectedOpt;
            let cls = 'border-slate-200 bg-white hover:border-[#00A39D]';
            if (answered) {
              if (isCorrect) cls = 'border-[#00A39D] bg-[#00A39D]/10 text-[#006B68]';
              else if (isSelected) cls = 'border-rose-400 bg-rose-50 text-rose-700';
              else cls = 'border-slate-100 bg-slate-50 text-slate-400';
            }
            return (
              <button
                key={idx}
                disabled={answered}
                onClick={() => handleChooseOption(idx)}
                className={`w-full text-left p-4 rounded-2xl border text-sm font-semibold transition-all flex items-center justify-between gap-3 cursor-pointer ${cls}`}
              >
                <span>{opt}</span>
                {answered && isCorrect && <CheckCircle2 className="w-5 h-5 text-[#00A39D] shrink-0" />}
                {answered && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-500 shrink-0" />}
              </button>
            );
          })}
        </div>

        {answered && (
          <div className="p-4 rounded-2xl bg-[#F4F6F6] border border-slate-200/80 space-y-2">
            <p className="text-xs font-bold text-[#006B68]">Penjelasan BINA:</p>
            <p className="text-xs text-slate-700 leading-relaxed">{q.explanation}</p>
            <button
              onClick={handleNextQuestion}
              className="mt-2 w-full h-11 rounded-xl bg-[#00A39D] hover:bg-[#006B68] text-white font-bold text-sm cursor-pointer"
            >
              {qIndex < selectedGame.questions.length - 1 ? 'Pertanyaan Berikutnya' : 'Lihat Hasil Permainan'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Quiz Result Screen
  if (quizResult && selectedGame) {
    return (
      <div className="max-w-lg mx-auto bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-soft-card text-center space-y-4">
        <BinaExpression mood="celebrate" className="w-28 h-28 mx-auto" />
        <p className="text-xs font-bold text-[#00A39D] uppercase">Permainan Selesai!</p>
        <h2 className="font-display text-2xl font-extrabold text-[#1E293B]">
          Skor Anda: {quizResult.correct} / {quizResult.total} Benar
        </h2>
        <div className="bg-[#F4F6F6] rounded-2xl p-4 space-y-1">
          <p className="text-xs text-slate-500">Hadiah Didapatkan</p>
          <p className="font-display text-3xl font-extrabold text-[#F8AD3C] tabular-nums mt-1">
            +{quizResult.earned} Poin
          </p>
          <p className="text-xs font-bold text-[#006B68]">
            +1 Tiket Pecah Telur Berkah BINA!
          </p>
          {!isAuthenticated && (
            <p className="text-[11px] text-amber-700 mt-2">
              Masuk ke akun Customer untuk menyimpan poin dan menukarkannya dengan voucher!
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2.5 pt-2">
          <button
            onClick={() => {
              setQuizResult(null);
              setSelectedGame(null);
            }}
            className="flex-1 h-11 rounded-xl border border-slate-200 font-bold text-xs text-slate-700 cursor-pointer"
          >
            Daftar Kuis
          </button>
          <button
            onClick={() => {
              setQuizResult(null);
              setSelectedGame(null);
              setTab('pecahtelur');
            }}
            className="flex-1 h-11 rounded-xl bg-[#F8AD3C] text-slate-900 font-bold text-xs cursor-pointer"
          >
            Main Pecah Telur
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Points, Streak & Egg Tickets Hero */}
      <div className="rounded-3xl bg-gradient-to-r from-[#006B68] to-[#00A39D] text-white p-5 sm:p-6 shadow-soft-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <BinaExpression mood="celebrate" className="w-16 h-16" />
            <div>
              <p className="text-xs font-bold text-[#F8AD3C] uppercase">B-EDU · Berita Viral, Webinar & Gamifikasi</p>
              <h1 className="font-display text-xl sm:text-2xl font-extrabold leading-tight">
                Wawasan UMKM Viral, Webinar & Pecah Telur
              </h1>
              <p className="text-xs text-white/85 mt-0.5">
                Baca kabar UMKM viral (+10 poin), ikut webinar (+30 poin), main kuis & absen harian!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 shrink-0">
            <div className="bg-white/15 backdrop-blur rounded-2xl px-3 py-2.5 text-center border border-white/20">
              <span className="text-[10px] text-white/80 block">Total Poin</span>
              <span className="font-display text-lg font-extrabold text-[#F8AD3C] tabular-nums">
                {currentPoints}
              </span>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-2xl px-3 py-2.5 text-center border border-white/20">
              <span className="text-[10px] text-white/80 block">Streak Api</span>
              <span className="font-display text-lg font-extrabold text-white tabular-nums inline-flex items-center justify-center gap-1">
                <Flame className="w-4 h-4 text-[#F8AD3C] fill-[#F8AD3C]" />
                {streakCount}h
              </span>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-2xl px-3 py-2.5 text-center border border-white/20">
              <span className="text-[10px] text-white/80 block">Tiket Telur</span>
              <span className="font-display text-lg font-extrabold text-white tabular-nums inline-flex items-center justify-center gap-1">
                <Egg className="w-4 h-4 text-[#F8AD3C]" />
                {eggTickets}
              </span>
            </div>
          </div>
        </div>

        {/* Daily Streak 7-Day Bar */}
        <div className="bg-white/12 backdrop-blur-sm border border-white/20 rounded-2xl p-3.5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-extrabold text-white flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-[#F8AD3C] fill-[#F8AD3C]" />
                Absen Streak Harian BINA (Hari ke-{streakCount})
              </p>
              <p className="text-[11px] text-white/80">
                Absen rutin tiap hari untuk raih poin beruntun & tiket Pecah Telur!
              </p>
            </div>
            <button
              type="button"
              disabled={alreadyCheckedInToday || claimingStreak}
              onClick={handleClaimStreak}
              className={`px-3.5 py-2 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                alreadyCheckedInToday
                  ? 'bg-white/20 text-white/80 cursor-default'
                  : 'bg-[#F8AD3C] hover:bg-[#e59a28] text-slate-900 shadow-md active:scale-95'
              }`}
            >
              {alreadyCheckedInToday
                ? '✓ Sudah Absen Hari Ini'
                : claimingStreak
                ? 'Mengklaim...'
                : 'Klaim Absen (+15 Poin & +1 Telur)'}
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => {
              const done = day <= (streakCount % 7 === 0 && streakCount > 0 ? 7 : streakCount % 7);
              return (
                <div
                  key={day}
                  className={`rounded-xl py-2 px-1 text-center border transition-all ${
                    done
                      ? 'bg-[#F8AD3C] text-slate-900 border-[#F8AD3C] shadow-sm'
                      : 'bg-white/10 text-white/80 border-white/15'
                  }`}
                >
                  <span className="block text-[9px] font-bold">H-{day}</span>
                  <span className="block text-xs font-extrabold mt-0.5">
                    {done ? '✓' : day === 7 ? '🎁' : '+15'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sub-navigation tabs */}
      <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl overflow-x-auto">
        {[
          { id: 'news', label: 'Berita UMKM Viral', icon: Newspaper },
          { id: 'webinar', label: 'Webinar', icon: Video },
          { id: 'games', label: 'Kuis UMKM', icon: Gamepad2 },
          { id: 'pecahtelur', label: `Pecah Telur (${eggTickets})`, icon: Egg },
          { id: 'rewards', label: 'Reward Center', icon: Gift },
          { id: 'myvouchers', label: `Voucher Saya (${voucherRedemptions.length})`, icon: Ticket },
          { id: 'history', label: 'Riwayat Poin', icon: History },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              tab === t.id ? 'bg-[#00A39D] text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'news' && (
        <BEduMediaHub
          section="news"
          audience="customer"
          onRequestAuth={onRequestAuth}
          onOpenStoreInMarket={onOpenStoreInMarket}
        />
      )}

      {tab === 'webinar' && (
        <BEduMediaHub
          section="webinar"
          audience="customer"
          onRequestAuth={onRequestAuth}
          onOpenStoreInMarket={onOpenStoreInMarket}
        />
      )}

      {/* Gamifikasi Pecah Telur Berkah Tab */}
      {tab === 'pecahtelur' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-8 shadow-soft-card text-center space-y-5">
          <div className="max-w-md mx-auto space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F8AD3C]/20 text-[#9A5B00] text-[11px] font-extrabold">
              <Sparkles className="w-3.5 h-3.5" />
              Mini-Game Pecah Telur Berkah BINA
            </span>
            <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#1E293B]">
              {eggReward ? 'Selamat! Telur Berhasil Dipecahkan!' : 'Ketuk Telur 3x & Raih Hadiah Kejutan!'}
            </h2>
            <p className="text-xs text-slate-600">
              {eggReward
                ? 'Hadiah Anda langsung tersimpan ke akun BSI UMKM Center.'
                : `Tiket Pecah Telur tersisa: ${eggTickets} tiket. Dapatkan tiket ekstra dari absen Streak Harian atau menyelesaikan kuis B-Edu.`}
            </p>
          </div>

          {!eggReward ? (
            <div className="flex flex-col items-center justify-center py-3 space-y-4">
              <button
                type="button"
                disabled={eggTickets <= 0}
                onClick={handleTapEgg}
                className={`relative w-44 h-52 rounded-[999px] flex flex-col items-center justify-center transition-transform cursor-pointer select-none ${
                  eggTickets <= 0
                    ? 'opacity-50 grayscale cursor-not-allowed'
                    : 'hover:scale-105 active:scale-95'
                } ${eggShaking ? 'animate-bounce' : ''}`}
                aria-label="Ketuk Telur Berkah BINA"
              >
                {/* Illustrated Interactive Egg SVG */}
                <svg viewBox="0 0 180 220" className="w-40 h-48 drop-shadow-xl">
                  <defs>
                    <radialGradient id="eggGrad" cx="35%" cy="30%" r="70%">
                      <stop offset="0%" stopColor="#FFF7DF" />
                      <stop offset="45%" stopColor="#F8AD3C" />
                      <stop offset="100%" stopColor="#00A39D" />
                    </radialGradient>
                  </defs>
                  <path
                    d="M90 12 C135 12, 165 88, 165 138 C165 186, 132 210, 90 210 C48 210, 15 186, 15 138 C15 88, 45 12, 90 12 Z"
                    fill="url(#eggGrad)"
                    stroke="#006B68"
                    strokeWidth="5"
                  />
                  {/* Decorative Band */}
                  <path
                    d="M22 122 Q90 100 158 122 Q90 144 22 122 Z"
                    fill="#FFFFFF"
                    fillOpacity="0.35"
                  />
                  {/* Progressive Crack Lines */}
                  {eggTaps >= 1 && (
                    <polyline
                      points="72,62 90,82 78,100 98,118"
                      fill="none"
                      stroke="#1E293B"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                  {eggTaps >= 2 && (
                    <polyline
                      points="118,74 102,96 116,115 96,136 108,158"
                      fill="none"
                      stroke="#1E293B"
                      strokeWidth="4.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                </svg>
                <span className="mt-1 px-3 py-1 rounded-full bg-[#006B68] text-white text-xs font-extrabold shadow">
                  {eggTickets <= 0
                    ? 'Tiket Kosong'
                    : eggTaps === 0
                    ? 'Ketuk Telur! (0/3)'
                    : eggTaps === 1
                    ? 'Retak Halus! (1/3)'
                    : 'Hampir Pecah! (2/3)'}
                </span>
              </button>

              <div className="flex flex-wrap justify-center gap-2 text-[11px] text-slate-600">
                <span className="px-3 py-1 rounded-xl bg-[#F4F6F6] font-semibold">Hadiah: +35 s.d +100 Poin</span>
                <span className="px-3 py-1 rounded-xl bg-[#F4F6F6] font-semibold">Voucher Belanja Rp 15.000</span>
              </div>
            </div>
          ) : (
            <div className="max-w-md mx-auto bg-gradient-to-br from-[#FFF8EB] to-[#EEF9F8] border border-[#F8AD3C]/50 rounded-3xl p-6 space-y-4">
              <BinaExpression mood="celebrate" className="w-24 h-24 mx-auto" />
              <div>
                <h3 className="font-display text-xl font-extrabold text-[#006B68]">{eggReward.title}</h3>
                <p className="text-xs text-slate-600 mt-1">{eggReward.subtitle}</p>
                {eggReward.voucherCode && (
                  <p className="mt-2 inline-block px-4 py-1.5 rounded-xl bg-white border border-[#00A39D] font-mono text-sm font-extrabold text-[#006B68]">
                    Kode: {eggReward.voucherCode}
                  </p>
                )}
              </div>
              <div className="flex gap-2.5">
                {eggTickets > 0 && (
                  <button
                    type="button"
                    onClick={resetEggStage}
                    className="flex-1 h-11 rounded-xl bg-[#F8AD3C] hover:bg-[#e59a28] text-slate-900 font-bold text-xs cursor-pointer"
                  >
                    Pecahkan Telur Lagi ({eggTickets})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    resetEggStage();
                    setTab(eggReward.type === 'voucher' ? 'myvouchers' : 'rewards');
                  }}
                  className="flex-1 h-11 rounded-xl bg-[#00A39D] hover:bg-[#006B68] text-white font-bold text-xs cursor-pointer"
                >
                  {eggReward.type === 'voucher' ? 'Lihat Voucher Saya' : 'Ke Reward Center'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Content */}
      {tab === 'games' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {activeGames.map((g) => (
            <div key={g.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft-card flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-[#00A39D]">{g.category}</span>
                  <span className="font-bold text-[#F8AD3C] tabular-nums">
                    +{settings.pointsPerQuizCorrect || g.pointsPerCorrect} poin/soal
                  </span>
                </div>
                <h3 className="font-display font-bold text-base text-[#1E293B]">{g.title}</h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{g.description}</p>
                <p className="text-[11px] text-slate-400 mt-2">{g.questions.length} pertanyaan interaktif</p>
              </div>
              <button
                onClick={() => startQuiz(g)}
                className="w-full h-11 rounded-xl bg-[#00A39D] hover:bg-[#006B68] text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                Mainkan Kuis Sekarang
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'rewards' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {activeVouchers.map((v) => (
            <div key={v.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft-card flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-[#006B68]">{v.discountLabel}</span>
                  <span className="text-slate-400 tabular-nums">Kuota: {v.quota}</span>
                </div>
                <h3 className="font-display font-bold text-base text-[#1E293B]">{v.title}</h3>
                <p className="text-xs text-slate-600 mt-1.5">{v.description}</p>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="font-display font-extrabold text-sm text-[#F8AD3C] tabular-nums">
                  {v.pointsCost} Poin
                </span>
                <button
                  onClick={() => (isAuthenticated ? redeemVoucher(v) : onRequestAuth())}
                  disabled={v.quota <= 0}
                  className="px-4 py-2 rounded-xl bg-[#F8AD3C] hover:bg-[#e59a28] disabled:opacity-50 text-slate-900 font-bold text-xs cursor-pointer"
                >
                  Tukarkan Poin
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'myvouchers' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft-card">
          <h3 className="font-display font-bold text-base text-[#1E293B] mb-4">Voucher Saya</h3>
          {voucherRedemptions.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              Belum ada voucher yang ditukarkan. Kumpulkan poin dari kuis B-EDU atau belanja di B-Market!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {voucherRedemptions.map((r) => (
                <div key={r.id} className="p-4 rounded-2xl bg-[#F4F6F6] border border-slate-200 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-[#1E293B]">{r.voucherTitle}</p>
                    <p className="font-mono text-sm font-extrabold text-[#006B68] mt-1">{r.voucherCode}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Ditukar: {formatDateTime(r.redeemedAt)}</p>
                  </div>
                  <span
                    className={`text-xs font-bold ${
                      r.status === 'Aktif' ? 'text-[#00A39D]' : 'text-slate-400'
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft-card">
          <h3 className="font-display font-bold text-base text-[#1E293B] mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-[#F8AD3C]" />
            Riwayat Poin & Penukaran
          </h3>
          {userPoints.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">Belum ada riwayat poin.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {userPoints.map((pt) => (
                <div key={pt.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-semibold text-slate-800">{pt.reason}</p>
                    <p className="text-[11px] text-slate-400">{formatDateTime(pt.createdAt)}</p>
                  </div>
                  <span
                    className={`font-display font-extrabold tabular-nums ${
                      pt.amount >= 0 ? 'text-[#00A39D]' : 'text-rose-600'
                    }`}
                  >
                    {pt.amount >= 0 ? `+${pt.amount}` : pt.amount} Poin
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
