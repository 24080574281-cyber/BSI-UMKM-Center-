import React, { useEffect, useState } from 'react';
import { Download, Smartphone, WifiOff, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    install,
  };
}

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) return null;

  const handleClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={
          compact
            ? 'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#00A39D]/10 text-[#006B68] hover:bg-[#00A39D]/20 text-[11px] font-bold whitespace-nowrap cursor-pointer'
            : 'inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F8AD3C] hover:bg-[#e59a28] text-slate-900 text-xs font-bold shadow-sm whitespace-nowrap cursor-pointer'
        }
      >
        <Download className="w-3.5 h-3.5" />
        <span>{compact ? 'Install App' : 'Install APK / Web App'}</span>
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#00A39D]/10 text-[#006B68] flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="font-display font-extrabold text-sm text-[#1E293B]">
                  Pasang Aplikasi BSI UMKM Center
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
                <p>Untuk memasang di iPhone / iPad seperti aplikasi native:</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Ketuk tombol <strong>Bagikan (Share)</strong> di bilah Safari.</li>
                  <li>Gulir ke bawah dan pilih <strong>Tambah ke Layar Utama (Add to Home Screen)</strong>.</li>
                  <li>Ketuk <strong>Tambah</strong> dan buka ikon <strong>BSI UMKM</strong>.</li>
                </ol>
              </div>
            ) : (
              <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
                <p>Pasang aplikasi ini di HP Android atau Desktop agar berjalan layar penuh seperti APK:</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Buka menu browser (ikon <strong>⋮</strong> di Chrome Android atau ikon <strong>Install</strong> di address bar Desktop).</li>
                  <li>Pilih <strong>Instal Aplikasi / Tambahkan ke Layar Utama</strong>.</li>
                  <li>Aplikasi akan terpasang dengan ikon resmi <strong>BSI UMKM</strong> dan dukungan offline.</li>
                </ol>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full h-10 rounded-xl bg-[#00A39D] text-white font-bold text-xs cursor-pointer"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-3 right-3 z-[65] flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-slate-900 shadow-lg">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Mode Offline — Menampilkan data tersimpan lokal.</span>
    </div>
  );
};
