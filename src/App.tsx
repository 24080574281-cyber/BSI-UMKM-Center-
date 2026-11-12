import React, { useEffect, useState } from 'react';
import {
  BatteryCharging,
  Maximize2,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Store,
  UserCheck,
  Wifi,
} from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { SplashAndAuth } from './components/SplashAndAuth.tsx';
import { CustomerPortal } from './components/customer/CustomerPortal.tsx';
import { UmkmPortal } from './components/umkm/UmkmPortal.tsx';
import { AdminPortal } from './components/admin/AdminPortal.tsx';
import { BinaChatbotDrawer } from './components/BinaChatbotDrawer.tsx';
import { OfflineIndicator, PWAInstallButton } from './components/PWAInstall.tsx';
import type { UserRole } from './types.ts';

function useIsMobileViewport() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return isMobile;
}

function AppShell() {
  const {
    activePortal,
    setActivePortal,
    isDemoMode,
    firebaseUser,
    enterDemoMode,
    resetDemoData,
    toast,
  } = useApp();

  const isMobileViewport = useIsMobileViewport();
  const [showOnboardingFlow, setShowOnboardingFlow] = useState<'splash' | 'onboarding' | 'auth' | null>('splash');
  const [preferApkFrame, setPreferApkFrame] = useState(true);
  const [clock, setClock] = useState(() =>
    new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setClock(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const handleQuickRoleSwitch = (role: UserRole) => {
    setShowOnboardingFlow(null);
    if (isDemoMode || !firebaseUser) {
      enterDemoMode(role);
    } else {
      setActivePortal(role);
    }
    if (role === 'admin' && !isMobileViewport) {
      setPreferApkFrame(false);
    }
  };

  // True when rendering inside the 430px desktop APK frame OR on an actual mobile device
  const isApkLayout = isMobileViewport || (preferApkFrame && activePortal !== 'admin');

  const content = (
    <>
      {showOnboardingFlow ? (
        <SplashAndAuth
          initialView={showOnboardingFlow}
          apkMode={isApkLayout}
          onComplete={() => setShowOnboardingFlow(null)}
        />
      ) : activePortal === 'admin' ? (
        <AdminPortal
          onOpenAuth={() => setShowOnboardingFlow('auth')}
          onSwitchToCustomer={() => handleQuickRoleSwitch('customer')}
          onSwitchToUmkm={() => handleQuickRoleSwitch('umkm')}
        />
      ) : activePortal === 'umkm' ? (
        <UmkmPortal
          apkMode={isApkLayout}
          onOpenAuth={() => setShowOnboardingFlow('auth')}
          onSwitchToCustomer={() => handleQuickRoleSwitch('customer')}
          onSwitchToAdmin={() => handleQuickRoleSwitch('admin')}
        />
      ) : (
        <CustomerPortal
          apkMode={isApkLayout}
          onOpenAuth={() => setShowOnboardingFlow('auth')}
          onSwitchToUmkm={() => handleQuickRoleSwitch('umkm')}
          onSwitchToAdmin={() => handleQuickRoleSwitch('admin')}
        />
      )}

      {!showOnboardingFlow && <BinaChatbotDrawer apkMode={isApkLayout} />}

      {toast && (
        <div className="fixed top-4 left-4 right-4 z-[80] flex justify-center pointer-events-none">
          <div
            className={`px-4 py-2.5 rounded-2xl shadow-xl border text-xs font-bold max-w-sm text-center pointer-events-auto ${
              toast.type === 'success'
                ? 'bg-[#006B68] text-white border-[#00A39D]'
                : toast.type === 'error'
                ? 'bg-rose-600 text-white border-rose-500'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}

      <OfflineIndicator />
    </>
  );

  // On real mobile viewports (<768px), render 100% edge-to-edge native-feeling APK layout
  if (isMobileViewport) {
    return <div className="min-h-screen w-full bg-[#F8FAFB]">{content}</div>;
  }

  // Desktop full-screen mode (for Admin Console or expanded workspace)
  if (!preferApkFrame || activePortal === 'admin') {
    return (
      <div className="min-h-screen bg-[#F8FAFB] flex flex-col">
        <div className="bg-slate-900 text-white px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 font-bold text-[#F8AD3C]">
              <Sparkles className="w-3.5 h-3.5" />
              BSI UMKM Center APK
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-300">
              {isDemoMode ? 'Mode Demo (Data Dummy Aktif)' : 'Firebase Cloud Terhubung'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-800 rounded-xl p-0.5">
              {(
                [
                  { id: 'customer', label: 'Customer', icon: ShoppingBag },
                  { id: 'umkm', label: 'UMKM Binaan', icon: Store },
                  { id: 'admin', label: 'Administrator', icon: UserCheck },
                ] as const
              ).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleQuickRoleSwitch(r.id)}
                  className={`px-2.5 py-1 rounded-lg font-bold inline-flex items-center gap-1 cursor-pointer ${
                    activePortal === r.id && !showOnboardingFlow
                      ? 'bg-[#00A39D] text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <r.icon className="w-3 h-3" />
                  {r.label}
                </button>
              ))}
            </div>

            {activePortal !== 'admin' && (
              <button
                type="button"
                onClick={() => setPreferApkFrame(true)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5 text-[#F8AD3C]" />
                Mode HP (APK)
              </button>
            )}

            {activePortal === 'admin' && (
              <button
                type="button"
                onClick={() => {
                  setPreferApkFrame(true);
                  handleQuickRoleSwitch('customer');
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5 text-[#F8AD3C]" />
                Kembali ke HP (APK)
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowOnboardingFlow('splash')}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold cursor-pointer"
            >
              Splash
            </button>
            <PWAInstallButton compact />
          </div>
        </div>
        <div className="flex-1">{content}</div>
      </div>
    );
  }

  // Desktop Smartphone APK Frame
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#043635] to-slate-900 flex flex-col items-center justify-center py-4 px-4 gap-3">
      {/* Desktop APK Control Bar */}
      <div className="w-full max-w-5xl bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-white text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#00A39D] flex items-center justify-center">
            <Smartphone className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-display font-extrabold text-sm leading-tight">
              BSI UMKM Center · Android APK Preview
            </p>
            <p className="text-[11px] text-white/75">
              {isDemoMode
                ? 'Mode Demo Data Dummy (5 UMKM, 17 Produk Foto & Video, B-AI, B-CHAIN)'
                : 'Mode Cloud Firebase Aktif'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-black/30 rounded-xl p-1">
            {(
              [
                { id: 'customer', label: 'Customer', icon: ShoppingBag },
                { id: 'umkm', label: 'UMKM Binaan', icon: Store },
                { id: 'admin', label: 'Admin', icon: UserCheck },
              ] as const
            ).map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => handleQuickRoleSwitch(r.id)}
                className={`px-2.5 py-1.5 rounded-lg font-bold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                  activePortal === r.id && !showOnboardingFlow
                    ? 'bg-[#F8AD3C] text-slate-900'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <r.icon className="w-3.5 h-3.5" />
                {r.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowOnboardingFlow('splash')}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 font-bold cursor-pointer"
          >
            Splash Screen
          </button>

          {isDemoMode && (
            <button
              type="button"
              onClick={resetDemoData}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 font-bold inline-flex items-center gap-1 cursor-pointer"
              title="Reset semua data dummy ke kondisi awal"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Dummy
            </button>
          )}

          <button
            type="button"
            onClick={() => setPreferApkFrame(false)}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 font-bold inline-flex items-center gap-1 cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Layar Penuh
          </button>

          <PWAInstallButton />
        </div>
      </div>

      {/* Android Device Bezel */}
      <div className="w-full max-w-[430px] h-[820px] max-h-[calc(100vh-96px)] rounded-[42px] border-[10px] border-slate-950 bg-[#F8FAFB] shadow-[0_25px_70px_-15px_rgba(0,0,0,0.65)] ring-1 ring-white/15 overflow-hidden flex flex-col">
        {/* Android Status Bar */}
        <div className="h-8 bg-[#006B68] text-white px-5 flex items-center justify-between text-[11px] font-semibold shrink-0 select-none">
          <span className="tabular-nums">{clock}</span>
          <div className="w-20 h-4 rounded-full bg-slate-950/90 flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-slate-800" />
          </div>
          <div className="flex items-center gap-1.5 tabular-nums">
            <ShieldCheck className="w-3 h-3 text-[#F8AD3C]" />
            <span>5G</span>
            <Wifi className="w-3 h-3" />
            <BatteryCharging className="w-3.5 h-3.5 text-[#F8AD3C]" />
          </div>
        </div>

        {/* Fixed-Containing Screen Viewport (transform traps position:fixed inside the phone frame) */}
        <div className="relative flex-1 overflow-hidden [transform:translateZ(0)] bg-[#F8FAFB]">
          <div className="h-full w-full overflow-y-auto overflow-x-hidden">
            {content}
          </div>
        </div>

        {/* Android Home Gesture Bar */}
        <div className="h-4 bg-white border-t border-slate-100 flex items-center justify-center shrink-0">
          <div className="w-28 h-1 rounded-full bg-slate-300" />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
