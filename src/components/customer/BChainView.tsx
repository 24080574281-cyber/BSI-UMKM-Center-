import React, { useEffect, useMemo, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Camera,
  CheckCircle2,
  Clock,
  Download,
  FileCheck2,
  Link2,
  QrCode,
  Search,
  ShieldAlert,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { exportBChainCertificatePdf, formatDateTime } from '../../lib/utils.ts';
import type { ProductVerification } from '../../types.ts';

interface BChainViewProps {
  initialProductId?: string | null;
}

export const BChainView: React.FC<BChainViewProps> = ({ initialProductId }) => {
  const { verifications, verificationHistory, products, showToast } = useApp();
  const [searchCode, setSearchCode] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerStatus, setScannerStatus] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (initialProductId) {
      const match = verifications.find((v) => v.productId === initialProductId);
      if (match) setSelectedId(match.id);
    } else if (!selectedId && verifications.length > 0) {
      setSelectedId(verifications[0].id);
    }
  }, [initialProductId, verifications, selectedId]);

  const filteredVerifications = useMemo(() => {
    if (!searchCode.trim()) return verifications;
    const q = searchCode.toLowerCase();
    return verifications.filter(
      (v) =>
        v.productCode.toLowerCase().includes(q) ||
        v.productName.toLowerCase().includes(q) ||
        v.storeName.toLowerCase().includes(q) ||
        v.txId.toLowerCase().includes(q) ||
        v.blockchainHash.toLowerCase().includes(q)
    );
  }, [verifications, searchCode]);

  const activeVerification: ProductVerification | undefined =
    verifications.find((v) => v.id === selectedId) || filteredVerifications[0];

  const activeHistory = useMemo(
    () =>
      activeVerification
        ? verificationHistory.filter((h) => h.verificationId === activeVerification.id)
        : [],
    [verificationHistory, activeVerification]
  );

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScannerOpen(false);
  };

  const startScanner = async () => {
    setScannerOpen(true);
    setScannerStatus('Mengaktifkan kamera untuk memindai QR Code produk...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      if ('BarcodeDetector' in window) {
        const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        const interval = setInterval(async () => {
          if (!videoRef.current || !streamRef.current) {
            clearInterval(interval);
            return;
          }
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const raw = barcodes[0].rawValue as string;
              handleQrPayload(raw);
              clearInterval(interval);
              stopCamera();
            }
          } catch {
            // Continue scanning
          }
        }, 500);
        setScannerStatus('Arahkan kamera ke QR Code pada kemasan produk B-CHAIN.');
      } else {
        setScannerStatus('Kamera aktif. Gunakan input manual kode QR di bawah jika browser tidak mendukung BarcodeDetector.');
      }
    } catch {
      setScannerStatus('Akses kamera tidak tersedia. Masukkan kode produk / hash secara manual atau pilih produk di daftar.');
    }
  };

  const handleQrPayload = (raw: string) => {
    const cleaned = raw.replace('BCHAIN:', '').trim();
    const found = verifications.find(
      (v) =>
        v.productCode.toLowerCase() === cleaned.toLowerCase() ||
        v.txId.toLowerCase() === cleaned.toLowerCase() ||
        v.id.toLowerCase() === cleaned.toLowerCase()
    );
    if (found) {
      setSelectedId(found.id);
      setSearchCode(found.productCode);
      showToast(`Produk ditemukan: ${found.productName} (${found.status})`, 'success');
    } else {
      setSearchCode(cleaned);
      showToast('Kode QR dipindai, menampilkan hasil pencarian.', 'info');
    }
  };

  const qrPayload = activeVerification
    ? `BCHAIN:${activeVerification.productCode}|TX:${activeVerification.txId}`
    : '';

  return (
    <div className="space-y-6">
      {/* Header & Scanner Trigger */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-soft-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-[#00A39D] uppercase tracking-wide">
            B-CHAIN · Blockchain Product Verification
          </p>
          <h1 className="font-display text-2xl font-extrabold text-[#1E293B] mt-1">
            Verifikasi Keaslian & Legalitas Produk UMKM
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Periksa kode batch, tanggal produksi, kedaluwarsa, status verifikasi smart contract, dan unduh sertifikat resmi.
          </p>
        </div>
        <button
          onClick={startScanner}
          className="h-12 px-5 rounded-xl bg-[#00A39D] hover:bg-[#006B68] text-white font-bold text-sm inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <Camera className="w-4 h-4" />
          Pindai QR Code Produk
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#00A39D] absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="search"
          value={searchCode}
          onChange={(e) => setSearchCode(e.target.value)}
          placeholder="Cari kode produk (mis. BSI-BTG-001), nama produk, Transaction ID, atau hash..."
          className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white border border-slate-200 text-sm focus:outline-none focus:border-[#00A39D]"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left List of Verifications */}
        <div className="lg:col-span-5 space-y-2.5">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            Daftar Produk Tercatat ({filteredVerifications.length})
          </h2>
          {filteredVerifications.map((v) => {
            const prodPhoto = products.find((p) => p.id === v.productId)?.photoUrl;
            return (
              <button
                key={v.id}
                onClick={() => setSelectedId(v.id)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  activeVerification?.id === v.id
                    ? 'bg-white border-[#00A39D] shadow-bchain'
                    : 'bg-white border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 justify-between">
                  {prodPhoto && (
                    <img
                      src={prodPhoto}
                      alt={v.productName}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-[#006B68] truncate">{v.storeName}</p>
                    <p className="font-display font-bold text-sm text-[#1E293B] truncate">{v.productName}</p>
                    <p className="text-xs font-mono text-slate-500 mt-0.5">{v.productCode}</p>
                  </div>
                  <StatusText status={v.status} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Certificate & Verification Detail */}
        <div className="lg:col-span-7 space-y-5">
          {activeVerification ? (
            <>
              <div className="bg-white rounded-3xl border border-[#00A39D]/25 p-5 sm:p-6 shadow-bchain space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    {(() => {
                      const activePhoto = products.find((p) => p.id === activeVerification.productId)?.photoUrl;
                      return activePhoto ? (
                        <img
                          src={activePhoto}
                          alt={activeVerification.productName}
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shrink-0"
                        />
                      ) : null;
                    })()}
                    <div className="min-w-0">
                      <StatusText status={activeVerification.status} large />
                      <h3 className="font-display text-xl font-extrabold text-[#1E293B] mt-1.5">
                        {activeVerification.productName}
                      </h3>
                      <p className="text-xs text-slate-500">
                        UMKM Binaan: <strong className="text-slate-700">{activeVerification.storeName}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center p-3 rounded-2xl bg-[#F4F6F6] border border-slate-200 shrink-0">
                    <QRCodeSVG value={qrPayload} size={96} level="M" fgColor="#006B68" />
                    <span className="text-[10px] font-mono text-slate-500 mt-1.5">
                      {activeVerification.productCode}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <InfoCell label="Kode Produk" value={activeVerification.productCode} mono />
                  <InfoCell label="Nomor Batch Produksi" value={activeVerification.batchNumber || 'Belum diisi pemilik toko'} />
                  <InfoCell label="Tanggal Produksi" value={activeVerification.productionDate || 'Belum diisi pemilik toko'} />
                  <InfoCell label="Masa Simpan / Konsumsi" value={activeVerification.shelfLife || 'Belum diisi pemilik toko'} />
                  <InfoCell label="Tanggal Kedaluwarsa" value={activeVerification.expiryDate || 'Belum diisi pemilik toko'} />
                  <InfoCell label="Informasi Legalitas" value={activeVerification.legalityInfo || 'Belum diisi pemilik toko'} />
                </div>

                <div className="rounded-2xl bg-[#F4F6F6] p-4 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-[#006B68]">
                    <Link2 className="w-4 h-4" />
                    <span>Integrasi Smart Contract & Ledger</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500">Jaringan Blockchain</span>
                    <span className="font-semibold text-slate-800">{activeVerification.network}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500">Transaction ID</span>
                    <span className="font-mono font-bold text-slate-800">{activeVerification.txId}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500">Nomor Blok</span>
                    <span className="font-mono font-semibold text-slate-800 tabular-nums">
                      #{activeVerification.blockNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">Blockchain Hash (SHA-256)</span>
                    <code className="block p-2.5 rounded-xl bg-white border border-slate-200 font-mono text-[11px] text-[#006B68] break-all">
                      {activeVerification.blockchainHash}
                    </code>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => exportBChainCertificatePdf(activeVerification)}
                    className="h-11 px-5 rounded-xl bg-[#00A39D] hover:bg-[#006B68] text-white font-bold text-xs sm:text-sm inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Unduh Sertifikat B-CHAIN (PDF)
                  </button>
                </div>
              </div>

              {/* Verification History */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-soft-card">
                <h4 className="font-display font-bold text-base text-[#1E293B] mb-4 flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-[#00A39D]" />
                  Riwayat Pencatatan Verifikasi
                </h4>
                {activeHistory.length === 0 ? (
                  <p className="text-xs text-slate-500">Belum ada riwayat perubahan tambahan untuk produk ini.</p>
                ) : (
                  <div className="space-y-3">
                    {activeHistory.map((h) => (
                      <div key={h.id} className="p-3.5 rounded-2xl bg-[#F8FAFB] border border-slate-100 space-y-1 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <strong className="text-[#1E293B]">{h.action}</strong>
                          <span className="text-slate-400">{formatDateTime(h.createdAt)}</span>
                        </div>
                        <p className="text-slate-600">{h.note}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 pt-1">
                          <span>Oleh: {h.actorName}</span>
                          <span className="font-mono">Tx: {h.txId}</span>
                          <span className="font-mono truncate max-w-[260px]">Hash: {h.blockchainHash}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
              <QrCode className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Pilih produk untuk melihat detail verifikasi B-CHAIN.</p>
            </div>
          )}
        </div>
      </div>

      {/* QR Scanner Modal */}
      {scannerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-[#1E293B]">Pemindai QR Code B-CHAIN</h3>
              <button
                onClick={stopCamera}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="aspect-square rounded-2xl bg-slate-900 overflow-hidden relative flex items-center justify-center">
              <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
              <div className="absolute inset-8 border-2 border-[#00A39D] rounded-2xl pointer-events-none" />
            </div>
            <p className="text-xs text-slate-600 text-center">{scannerStatus}</p>
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700">
                Atau Masukkan Kode Produk / Simulasi Scan QR:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Contoh: BSI-BTG-001"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleQrPayload((e.target as HTMLInputElement).value);
                      stopCamera();
                    }
                  }}
                  className="flex-1 h-10 px-3 rounded-xl border border-slate-200 text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (verifications[0]) handleQrPayload(verifications[0].productCode);
                    stopCamera();
                  }}
                  className="px-3.5 h-10 rounded-xl bg-[#00A39D] text-white text-xs font-bold cursor-pointer"
                >
                  Simulasi Scan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatusText: React.FC<{ status: ProductVerification['status']; large?: boolean }> = ({
  status,
  large = false,
}) => {
  if (status === 'VERIFIED') {
    return (
      <span className={`inline-flex items-center gap-1 font-bold text-[#00A39D] ${large ? 'text-xs' : 'text-[10px]'}`}>
        <CheckCircle2 className={large ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
        VERIFIED
      </span>
    );
  }
  if (status === 'PENDING VERIFICATION') {
    return (
      <span className={`inline-flex items-center gap-1 font-bold text-amber-600 ${large ? 'text-xs' : 'text-[10px]'}`}>
        <Clock className={large ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
        PENDING VERIFICATION
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 font-bold text-rose-600 ${large ? 'text-xs' : 'text-[10px]'}`}>
      <ShieldAlert className={large ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
      NOT VERIFIED
    </span>
  );
};

const InfoCell: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => (
  <div className="p-3 rounded-xl bg-[#F8FAFB] border border-slate-100">
    <span className="text-[11px] text-slate-500 block">{label}</span>
    <span className={`text-xs font-bold text-slate-800 mt-0.5 block ${mono ? 'font-mono' : ''}`}>
      {value}
    </span>
  </div>
);
