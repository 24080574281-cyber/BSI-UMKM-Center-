import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  UserCheck,
} from 'lucide-react';
import { BinaExpression, BinaWelcome, BrandLogo } from './BinaMascot.tsx';
import { PWAInstallButton } from './PWAInstall.tsx';
import { useApp } from '../context/AppContext.tsx';
import type { UserRole } from '../types.ts';

interface SplashAndAuthProps {
  onComplete: () => void;
  initialView?: 'splash' | 'onboarding' | 'auth';
  apkMode?: boolean;
}

const ONBOARDING_SLIDES = [
  {
    mood: 'wave' as const,
    title: 'Belanja Produk UMKM Terpercaya di B-Market',
    desc: 'Temukan produk unggulan dari BOTEGA, Windrasari, Lanjar Jaya / Bopes, Depot Cheff 99, dan Puya Kitchen dengan mudah dan amanah.',
    highlight: 'Marketplace Terintegrasi & Asisten B-AI',
  },
  {
    mood: 'idea' as const,
    title: 'Transparansi Keaslian Produk via B-CHAIN',
    desc: 'Pindai QR Code pada setiap produk untuk memeriksa kode batch, tanggal produksi, kedaluwarsa, informasi legalitas, serta unduh sertifikat resmi.',
    highlight: 'Verifikasi Blockchain & Sertifikat PDF',
  },
  {
    mood: 'chart' as const,
    title: 'Tumbuh Bersama B-Save, B-Smart, B-Finance & B-Edu',
    desc: 'Pelaku UMKM binaan dapat mengelola stok produk, membuat konten promosi AI, mencatat pembukuan keuangan syariah, dan mengikuti jadwal pembinaan mentor.',
    highlight: 'Ekosistem Digital Lengkap Untuk UMKM',
  },
];

export const SplashAndAuth: React.FC<SplashAndAuthProps> = ({
  onComplete,
  initialView = 'splash',
  apkMode = false,
}) => {
  const { signInWithGoogle, enterDemoMode, stores, categories } = useApp();
  const [step, setStep] = useState<'splash' | 'onboarding' | 'auth'>(initialView);
  const [slideIdx, setSlideIdx] = useState(0);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [selectedRole, setSelectedRole] = useState<UserRole>('customer');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [umkmMode, setUmkmMode] = useState<'claim' | 'new'>('claim');
  const [storeIdToClaim, setStoreIdToClaim] = useState('botega');
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreCategory, setNewStoreCategory] = useState('Kuliner & Makanan');
  const [submitting, setSubmitting] = useState(false);

  const unclaimedStores = stores.filter((s) => !s.ownerUid);

  const handleQuickDemo = (role: UserRole) => {
    enterDemoMode(role, role === 'umkm' ? storeIdToClaim : undefined);
    onComplete();
  };

  const handleGoogleAuth = async () => {
    setSubmitting(true);
    const prof = await signInWithGoogle(selectedRole, {
      displayName: displayName.trim() || undefined,
      phone: phone.trim() || undefined,
      storeIdToClaim: selectedRole === 'umkm' && umkmMode === 'claim' ? storeIdToClaim : undefined,
      newStoreName: selectedRole === 'umkm' && umkmMode === 'new' ? newStoreName : undefined,
      newStoreCategory: selectedRole === 'umkm' && umkmMode === 'new' ? newStoreCategory : undefined,
    });
    setSubmitting(false);
    if (prof) {
      onComplete();
    }
  };

  if (step === 'splash') {
    return (
      <div
        className={`${
          apkMode ? 'min-h-full p-5' : 'min-h-screen p-6 sm:p-10'
        } relative overflow-hidden bg-gradient-to-b from-[#006B68] via-[#00A39D] to-[#007D79] text-white flex flex-col justify-between`}
      >
        {/* Subtle decorative light orbs */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 rounded-full bg-[#F8AD3C]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-white/15 blur-3xl" />

        {/* Top Utility Strip (No Bottom Nav!) */}
        <div className="relative z-10 max-w-4xl w-full mx-auto flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/85">
            <ShieldCheck className="w-3.5 h-3.5 text-[#F8AD3C]" />
            <span>Platform Ekosistem UMKM</span>
          </div>
          <PWAInstallButton compact />
        </div>

        {/* Centered Iconic Splash Brand: Logo + App Name + Tagline + BINA Mascot */}
        <div className="relative z-10 max-w-xl w-full mx-auto flex flex-col items-center text-center my-auto py-6">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-[32px] bg-white p-3 shadow-2xl border-4 border-white/40 flex items-center justify-center mb-5">
            <img
              src="/assets/aistudio/BSI_UMKM_Center_Logo_14700028.png"
              alt="Logo BSI UMKM Center"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain"
            />
          </div>

          <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#F8AD3C] mb-1.5">
            Selamat Datang Di
          </span>

          <h1
            className={`font-display font-extrabold tracking-tight leading-tight text-white ${
              apkMode ? 'text-3xl' : 'text-4xl sm:text-5xl'
            }`}
          >
            BSI UMKM Center
          </h1>

          <p className={`${apkMode ? 'text-sm' : 'text-base sm:text-lg'} font-semibold text-white/95 mt-2 max-w-md`}>
            Empowering MSMEs Through Digital Innovation
          </p>

          {/* Compact BINA Welcome Bubble */}
          <div className="mt-6 w-full max-w-sm bg-white/12 backdrop-blur-md border border-white/25 rounded-3xl p-3.5 flex items-center gap-3 text-left shadow-xl">
            <BinaWelcome className="w-16 h-16 shrink-0 drop-shadow-lg" />
            <div>
              <p className="text-xs font-extrabold text-[#F8AD3C]">Halo, Saya BINA!</p>
              <p className="text-[11px] text-white/90 leading-snug mt-0.5">
                Siap menemani belanja produk lokal amanah, cek keaslian B-CHAIN, hingga pendampingan UMKM binaan.
              </p>
            </div>
          </div>

          {/* Primary Interactive Transition to Screen Log In */}
          <div className="w-full max-w-sm mt-6 space-y-2.5">
            <button
              type="button"
              onClick={() => setStep('auth')}
              className="w-full h-12 rounded-2xl bg-[#F8AD3C] hover:bg-[#e59a28] text-slate-900 font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl transition-transform active:scale-[0.98] cursor-pointer"
            >
              <span>Masuk ke Layar Login</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setStep('onboarding')}
              className="w-full h-11 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Lihat Panduan Fitur BINA</span>
            </button>
          </div>
        </div>

        {/* Clean Tagline Footer (Zero Bottom Navigation) */}
        <div className="relative z-10 text-center text-[11px] font-medium text-white/75">
          B-Market · B-Chain · B-AI · B-Smart · B-Finance · B-Edu
        </div>
      </div>
    );
  }

  if (step === 'onboarding') {
    const slide = ONBOARDING_SLIDES[slideIdx];
    return (
      <div className={`${apkMode ? 'min-h-full p-4' : 'min-h-screen p-5 sm:p-8'} bg-[#F8FAFB] flex flex-col justify-between`}>
        <div className="max-w-3xl w-full mx-auto flex items-center justify-between">
          <BrandLogo className="h-8 w-8" />
          <button
            type="button"
            onClick={() => setStep('auth')}
            className="text-xs font-bold text-[#006B68] hover:underline cursor-pointer"
          >
            Lewati
          </button>
        </div>

        <div className={`max-w-2xl w-full mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-soft-card my-4 ${apkMode ? 'p-5' : 'p-6 sm:p-10'}`}>
          <div className="flex flex-col items-center text-center">
            <BinaExpression mood={slide.mood} className={apkMode ? 'w-24 h-24 mb-3' : 'w-28 h-28 sm:w-32 sm:h-32 mb-5'} />
            <span className="text-[11px] font-bold text-[#00A39D] tracking-wide uppercase">
              {slide.highlight}
            </span>
            <h2 className={`font-display font-extrabold text-[#1E293B] mt-2 text-balance ${apkMode ? 'text-xl' : 'text-2xl sm:text-3xl'}`}>
              {slide.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed max-w-xl">
              {slide.desc}
            </p>

            <div className="flex items-center gap-2 mt-6">
              {ONBOARDING_SLIDES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSlideIdx(i)}
                  aria-label={`Slide ${i + 1}`}
                  className={`h-2.5 rounded-full transition-all cursor-pointer ${
                    i === slideIdx ? 'w-8 bg-[#00A39D]' : 'w-2.5 bg-slate-200'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-3 w-full max-w-md mt-7">
              {slideIdx > 0 && (
                <button
                  type="button"
                  onClick={() => setSlideIdx((i) => i - 1)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-50 cursor-pointer"
                >
                  Sebelumnya
                </button>
              )}
              {slideIdx < ONBOARDING_SLIDES.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setSlideIdx((i) => i + 1)}
                  className="flex-1 py-3 rounded-xl bg-[#00A39D] hover:bg-[#006B68] text-white font-bold text-xs sm:text-sm cursor-pointer"
                >
                  Lanjut
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStep('auth')}
                  className="flex-1 py-3 rounded-xl bg-[#F8AD3C] hover:bg-[#e59a28] text-slate-900 font-bold text-xs sm:text-sm cursor-pointer"
                >
                  Mulai Aplikasi
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-400">
          BSI UMKM Center · Empowering MSMEs Through Digital Innovation
        </div>
      </div>
    );
  }

  return (
    <div className={`${apkMode ? 'min-h-full p-3' : 'min-h-screen p-4 sm:p-8'} bg-[#F8FAFB] flex flex-col justify-center`}>
      <div
        className={`max-w-4xl w-full mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-soft-card overflow-hidden grid grid-cols-1 ${
          apkMode ? '' : 'lg:grid-cols-12'
        }`}
      >
        <div className={`${apkMode ? 'p-4' : 'lg:col-span-5 p-6 sm:p-8'} bg-gradient-to-br from-[#006B68] to-[#00A39D] text-white flex flex-col justify-between`}>
          <div className="flex items-center justify-between gap-2">
            <div className="bg-white/95 rounded-2xl px-3 py-1.5 inline-block">
              <BrandLogo className="h-7 w-7" />
            </div>
            <PWAInstallButton compact />
          </div>
          <div className={apkMode ? 'mt-3' : 'mt-6'}>
            <h2 className={`font-display font-extrabold leading-snug ${apkMode ? 'text-lg' : 'text-2xl'}`}>
              {authTab === 'login' ? 'Masuk ke Ekosistem Digital' : 'Registrasi Akun Baru'}
            </h2>
            <p className="text-xs text-white/85 mt-1.5 leading-relaxed">
              Pilih Mode Demo APK untuk mencoba langsung seluruh data dummy, atau masuk dengan akun Google Cloud Anda.
            </p>
          </div>

          {!apkMode && (
            <div className="mt-6 flex flex-col items-center bg-white/10 rounded-2xl p-4 border border-white/15">
              <BinaWelcome className="w-36 h-36" />
              <p className="text-xs text-center text-white/90 mt-2">
                Autentikasi aman terenkripsi dengan kontrol akses berbasis peran (RBAC).
              </p>
            </div>
          )}
        </div>

        <div className={`${apkMode ? 'p-4' : 'lg:col-span-7 p-6 sm:p-8'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex bg-[#F4F6F6] p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setAuthTab('login')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  authTab === 'login' ? 'bg-white text-[#006B68] shadow-sm' : 'text-slate-600'
                }`}
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => setAuthTab('register')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  authTab === 'register' ? 'bg-white text-[#006B68] shadow-sm' : 'text-slate-600'
                }`}
              >
                Registrasi
              </button>
            </div>
            <button
              type="button"
              onClick={() => setStep('splash')}
              className="text-xs font-semibold text-[#00A39D] hover:underline cursor-pointer"
            >
              Kembali ke Splash
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Pilih Jenis Akses Pengguna
              </label>
              <div className={`grid gap-2 ${apkMode ? 'grid-cols-3' : 'grid-cols-1 sm:grid-cols-3'}`}>
                {[
                  {
                    role: 'customer' as UserRole,
                    title: 'Customer',
                    desc: 'B-Market, B-Chain, B-AI',
                    icon: ShoppingBag,
                  },
                  {
                    role: 'umkm' as UserRole,
                    title: 'UMKM Binaan',
                    desc: 'B-Save, B-Smart, Finance',
                    icon: Store,
                  },
                  {
                    role: 'admin' as UserRole,
                    title: 'Administrator',
                    desc: 'Kontrol Ekosistem',
                    icon: UserCheck,
                  },
                ].map((opt) => (
                  <button
                    key={opt.role}
                    type="button"
                    onClick={() => setSelectedRole(opt.role)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedRole === opt.role
                        ? 'border-[#00A39D] bg-[#00A39D]/5 ring-2 ring-[#00A39D]/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <opt.icon
                      className={`w-4 h-4 mb-1 ${
                        selectedRole === opt.role ? 'text-[#00A39D]' : 'text-slate-400'
                      }`}
                    />
                    <p className="text-xs font-bold text-[#1E293B] leading-tight">{opt.title}</p>
                    {!apkMode && (
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{opt.desc}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {selectedRole === 'umkm' && (
              <div className="p-3.5 rounded-2xl bg-[#F4F6F6] border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#006B68]">Toko UMKM Binaan</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setUmkmMode('claim')}
                      className={`px-2 py-1 rounded-lg text-[10px] font-semibold cursor-pointer ${
                        umkmMode === 'claim' ? 'bg-[#00A39D] text-white' : 'bg-white text-slate-600'
                      }`}
                    >
                      Pilih Toko
                    </button>
                    <button
                      type="button"
                      onClick={() => setUmkmMode('new')}
                      className={`px-2 py-1 rounded-lg text-[10px] font-semibold cursor-pointer ${
                        umkmMode === 'new' ? 'bg-[#00A39D] text-white' : 'bg-white text-slate-600'
                      }`}
                    >
                      Toko Baru
                    </button>
                  </div>
                </div>

                {umkmMode === 'claim' ? (
                  <select
                    value={storeIdToClaim}
                    onChange={(e) => setStoreIdToClaim(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#00A39D]"
                  >
                    {(unclaimedStores.length > 0 ? unclaimedStores : stores).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.category})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    <input
                      type="text"
                      value={newStoreName}
                      onChange={(e) => setNewStoreName(e.target.value)}
                      placeholder="Nama Usaha / Toko UMKM"
                      className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs"
                    />
                    <select
                      value={newStoreCategory}
                      onChange={(e) => setNewStoreCategory(e.target.value)}
                      className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* 1-Tap Demo Launch */}
            <button
              type="button"
              onClick={() => handleQuickDemo(selectedRole)}
              className="w-full h-11 rounded-xl bg-[#F8AD3C] hover:bg-[#e59a28] text-slate-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Masuk Mode Demo APK ({selectedRole === 'customer' ? 'Customer' : selectedRole === 'umkm' ? 'UMKM Binaan' : 'Administrator'})
            </button>

            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-slate-200" />
              <span className="shrink mx-3 text-[11px] font-semibold text-slate-400">atau login akun Cloud</span>
              <div className="flex-grow border-t border-slate-200" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Nama Lengkap (Opsional)
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Contoh: Siti Aminah"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#00A39D]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  No. Telepon / HP (Opsional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812xxxxxxxx"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#00A39D]"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={submitting}
              onClick={handleGoogleAuth}
              className="w-full h-11 rounded-xl bg-[#00A39D] hover:bg-[#006B68] disabled:opacity-60 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting
                ? 'Memverifikasi Akun...'
                : `${authTab === 'login' ? 'Masuk' : 'Daftar'} Google Cloud (${
                    selectedRole === 'customer'
                      ? 'Customer'
                      : selectedRole === 'umkm'
                      ? 'UMKM Binaan'
                      : 'Administrator'
                  })`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
