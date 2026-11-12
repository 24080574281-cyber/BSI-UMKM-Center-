import React, { useEffect, useState } from 'react';
import {
  Activity,
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Database,
  FolderTree,
  GraduationCap,
  LayoutDashboard,
  Menu,
  Package,
  RefreshCw,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Store,
  Trash2,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { BinaExpression, BrandLogo } from '../BinaMascot.tsx';
import {
  exportBChainCertificatePdf,
  formatDateTime,
  formatRupiah,
} from '../../lib/utils.ts';
import type {
  BChainStatus,
  OrderStatus,
  UserRole,
} from '../../types.ts';

type AdminMenu =
  | 'dashboard'
  | 'pengguna'
  | 'customer'
  | 'umkm'
  | 'produk'
  | 'kategori'
  | 'pesanan'
  | 'bchain'
  | 'games'
  | 'pelatihan'
  | 'mentor'
  | 'edukasi'
  | 'laporan'
  | 'pengaturan';

interface AdminPortalProps {
  onOpenAuth: () => void;
  onSwitchToCustomer: () => void;
  onSwitchToUmkm: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  onOpenAuth,
  onSwitchToCustomer,
  onSwitchToUmkm,
}) => {
  const {
    firebaseUser,
    isAuthenticated,
    isDemoMode,
    userProfile,
    isAdminAccount,
    stores,
    categories,
    products,
    allUsers,
    allOrders,
    verifications,
    games,
    vouchers,
    trainings,
    mentors,
    materials,
    settings,
    auditLogs,
    verifyBChainRecord,
    saveCategory,
    deleteCategory,
    saveProduct,
    updateOrderStatus,
    saveGame,
    saveVoucher,
    saveTraining,
    saveMentor,
    saveMaterial,
    saveSystemSettings,
    adminUpdateUserRole,
    adminToggleStoreVerification,
    seedInitialDataToFirestore,
    resetDemoData,
  } = useApp();

  const [menu, setMenu] = useState<AdminMenu>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Category form
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');

  // Voucher form
  const [vchTitle, setVchTitle] = useState('');
  const [vchCost, setVchCost] = useState('50');
  const [vchLabel, setVchLabel] = useState('');
  const [vchQuota, setVchQuota] = useState('50');

  // Training form
  const [trnTitle, setTrnTitle] = useState('');
  const [trnMode, setTrnMode] = useState<'Online' | 'Offline'>('Online');
  const [trnSchedule, setTrnSchedule] = useState('');
  const [trnLocation, setTrnLocation] = useState('');
  const [trnQuota, setTrnQuota] = useState('50');

  // Mentor form
  const [mtrName, setMtrName] = useState('');
  const [mtrExpertise, setMtrExpertise] = useState('');
  const [mtrSchedule, setMtrSchedule] = useState('');

  // Material form
  const [matTitle, setMatTitle] = useState('');
  const [matCat, setMatCat] = useState('Pemasaran Digital');
  const [matType, setMatType] = useState<'Modul Digital' | 'Video Pembelajaran' | 'Program Pendampingan'>('Modul Digital');
  const [matSummary, setMatSummary] = useState('');

  // Settings form
  const [promoTitle, setPromoTitle] = useState(settings.promoBannerTitle);
  const [promoSub, setPromoSub] = useState(settings.promoBannerSubtitle);
  const [quizPts, setQuizPts] = useState(String(settings.pointsPerQuizCorrect));
  const [orderPts, setOrderPts] = useState(String(settings.pointsPerOrder));
  const [bchainNet, setBchainNet] = useState(settings.bchainNetwork);

  useEffect(() => {
    setPromoTitle(settings.promoBannerTitle);
    setPromoSub(settings.promoBannerSubtitle);
    setQuizPts(String(settings.pointsPerQuizCorrect));
    setOrderPts(String(settings.pointsPerOrder));
    setBchainNet(settings.bchainNetwork);
  }, [settings]);

  if (!isAuthenticated || !isAdminAccount) {
    return (
      <div className="min-h-screen bg-[#F8FAFB] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 shadow-soft-card">
          <BinaExpression mood="thinking" className="w-24 h-24 mx-auto" />
          <h2 className="font-display text-xl font-extrabold text-[#1E293B]">
            Akses Khusus Administrator
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Dashboard Administrator hanya dapat diakses oleh akun pengelola resmi BSI UMKM Center.
          </p>
          <div className="flex flex-col gap-2.5">
            <button onClick={onOpenAuth} className="h-11 rounded-xl bg-[#00A39D] text-white font-bold text-sm cursor-pointer">
              Masuk Akun Administrator
            </button>
            <button onClick={onSwitchToCustomer} className="h-11 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm cursor-pointer">
              Kembali ke B-Market
            </button>
          </div>
        </div>
      </div>
    );
  }

  const sidebarItems: { id: AdminMenu; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pengguna', label: 'Pengguna', icon: Users },
    { id: 'customer', label: 'Customer', icon: UserCheck },
    { id: 'umkm', label: 'UMKM Binaan', icon: Store },
    { id: 'produk', label: 'Produk', icon: ShoppingBag },
    { id: 'kategori', label: 'Kategori', icon: FolderTree },
    { id: 'pesanan', label: 'Pesanan', icon: Package },
    { id: 'bchain', label: 'B-CHAIN Verification', icon: ShieldCheck },
    { id: 'games', label: 'Games dan Rewards', icon: Award },
    { id: 'pelatihan', label: 'Pelatihan', icon: GraduationCap },
    { id: 'mentor', label: 'Mentor', icon: Users },
    { id: 'edukasi', label: 'Konten Edukasi', icon: BookOpen },
    { id: 'laporan', label: 'Laporan', icon: BarChart3 },
    { id: 'pengaturan', label: 'Pengaturan', icon: Settings },
  ];

  const totalGmv = allOrders.reduce((s, o) => s + o.total, 0);

  return (
    <div className="min-h-screen bg-[#F8FAFB] flex">
      {/* Desktop & Mobile Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <BrandLogo className="h-8 w-8" />
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setMenu(item.id);
                setSidebarOpen(false);
              }}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-colors cursor-pointer ${
                menu === item.id
                  ? 'bg-[#00A39D] text-white'
                  : 'text-slate-600 hover:bg-[#F4F6F6] hover:text-[#1E293B]'
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-100 space-y-2">
          <button
            onClick={onSwitchToCustomer}
            className="w-full h-9 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:border-[#00A39D] cursor-pointer"
          >
            Buka Portal Customer
          </button>
          <button
            onClick={onSwitchToUmkm}
            className="w-full h-9 rounded-xl bg-[#F8AD3C] text-slate-900 text-xs font-bold hover:bg-[#e59a28] cursor-pointer"
          >
            Buka Portal UMKM
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-slate-200"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-display font-extrabold text-base sm:text-lg text-[#1E293B]">
              Administrator · {sidebarItems.find((s) => s.id === menu)?.label}
            </h1>
          </div>
          <span className="text-xs font-semibold text-[#006B68] hidden sm:inline">
            {firebaseUser?.email || userProfile?.email || 'admin-demo@bsiumkm.id'}
          </span>
        </header>

        <main className="p-4 sm:p-6 space-y-6 max-w-6xl w-full">
          {menu === 'dashboard' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-soft-card flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-[#006B68]">
                    {isDemoMode ? 'Mode Demo APK Aktif (Data Dummy Lokal)' : 'Terhubung ke Firebase Cloud Firestore'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Kelola data dummy, sinkronisasi katalog 5 UMKM binaan, atau reset status uji coba.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {isDemoMode && (
                    <button
                      type="button"
                      onClick={resetDemoData}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 hover:border-[#00A39D] text-xs font-bold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-[#00A39D]" />
                      Reset Data Dummy APK
                    </button>
                  )}
                  {firebaseUser && isAdminAccount && (
                    <button
                      type="button"
                      onClick={() => seedInitialDataToFirestore(true)}
                      className="px-3.5 py-2 rounded-xl bg-[#00A39D] hover:bg-[#006B68] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Database className="w-3.5 h-3.5" />
                      Sinkronkan Data Dummy ke Firestore
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatBox label="Total UMKM Binaan" value={String(stores.length)} />
                <StatBox label="Total Produk" value={String(products.length)} />
                <StatBox label="Total Pesanan" value={String(allOrders.length)} />
                <StatBox label="Nilai Transaksi (GMV)" value={formatRupiah(totalGmv)} accent="text-[#00A39D]" />
              </div>

              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-soft-card space-y-3">
                <h2 className="font-display font-bold text-base text-[#1E293B] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#00A39D]" />
                  Audit Log Aktivitas Penting ({auditLogs.length})
                </h2>
                {auditLogs.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4">Belum ada log aktivitas tercatat.</p>
                ) : (
                  <div className="divide-y divide-slate-100 text-xs">
                    {auditLogs.slice(0, 12).map((log) => (
                      <div key={log.id} className="py-2.5 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-[#006B68]">{log.action}</span>
                          <span className="mx-1.5 text-slate-300">·</span>
                          <span className="text-slate-700">{log.details}</span>
                        </div>
                        <span className="text-slate-400">
                          {log.actorName} ({log.actorRole}) · {formatDateTime(log.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {(menu === 'pengguna' || menu === 'customer') && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-soft-card overflow-x-auto">
              <h2 className="font-display font-bold text-base text-[#1E293B] mb-4">
                {menu === 'customer' ? 'Daftar Akun Customer' : 'Manajemen Pengguna Ekosistem'}
              </h2>
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F4F6F6] text-slate-600 font-bold">
                  <tr>
                    <th className="p-3">Nama</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Peran</th>
                    <th className="p-3 text-right">Poin B-Edu</th>
                    <th className="p-3 text-right">Ubah Peran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allUsers
                    .filter((u) => (menu === 'customer' ? u.role === 'customer' : true))
                    .map((u) => (
                      <tr key={u.uid}>
                        <td className="p-3 font-bold text-slate-800">{u.displayName}</td>
                        <td className="p-3 text-slate-500">{u.email}</td>
                        <td className="p-3 font-bold uppercase text-[#006B68]">{u.role}</td>
                        <td className="p-3 text-right tabular-nums">{u.points || 0}</td>
                        <td className="p-3 text-right">
                          <select
                            value={u.role}
                            onChange={(e) => adminUpdateUserRole(u.uid, e.target.value as UserRole)}
                            className="h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs"
                          >
                            <option value="customer">customer</option>
                            <option value="umkm">umkm</option>
                            <option value="admin">admin</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {menu === 'umkm' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-soft-card space-y-4">
              <h2 className="font-display font-bold text-base text-[#1E293B]">
                Kelola & Verifikasi UMKM Binaan ({stores.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {stores.map((s) => (
                  <div key={s.id} className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-sm text-[#1E293B]">{s.name}</p>
                      <p className="text-xs text-slate-500">{s.category} · Pemilik: {s.ownerName || 'Belum diklaim'}</p>
                    </div>
                    <button
                      onClick={() => adminToggleStoreVerification(s.id, !s.isVerifiedUmkm)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                        s.isVerifiedUmkm
                          ? 'bg-[#00A39D]/10 text-[#006B68]'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {s.isVerifiedUmkm ? 'Terverifikasi' : 'Verifikasi UMKM'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {menu === 'produk' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-soft-card overflow-x-auto">
              <h2 className="font-display font-bold text-base text-[#1E293B] mb-4">
                Moderasi Produk B-Market ({products.length})
              </h2>
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F4F6F6] text-slate-600 font-bold">
                  <tr>
                    <th className="p-3">Produk</th>
                    <th className="p-3">UMKM</th>
                    <th className="p-3">Harga</th>
                    <th className="p-3">Stok</th>
                    <th className="p-3">B-CHAIN</th>
                    <th className="p-3 text-right">Status Tayang</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 tabular-nums">
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td className="p-3 font-bold text-slate-800">{p.name}</td>
                      <td className="p-3 text-slate-600">{p.storeName}</td>
                      <td className="p-3">{formatRupiah(p.price)}</td>
                      <td className="p-3">{p.stock ?? '-'}</td>
                      <td className="p-3 font-bold text-[#00A39D]">{p.bchainStatus}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() =>
                            saveProduct({
                              ...p,
                              isPublished: !p.isPublished,
                            })
                          }
                          className={`px-3 py-1 rounded-lg font-bold cursor-pointer ${
                            p.isPublished ? 'bg-[#00A39D] text-white' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {p.isPublished ? 'Published' : 'Hidden'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {menu === 'kategori' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!catName.trim()) return;
                  await saveCategory({ name: catName.trim(), description: catDesc.trim() });
                  setCatName('');
                  setCatDesc('');
                }}
                className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 p-5 shadow-soft-card space-y-3"
              >
                <h3 className="font-display font-bold text-base text-[#1E293B]">Tambah Kategori Produk</h3>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Nama Kategori"
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"
                />
                <input
                  type="text"
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Deskripsi singkat"
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"
                />
                <button type="submit" className="w-full h-11 rounded-xl bg-[#00A39D] text-white font-bold text-sm cursor-pointer">
                  Simpan Kategori
                </button>
              </form>

              <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-5 shadow-soft-card space-y-2.5">
                <h3 className="font-display font-bold text-base text-[#1E293B]">Daftar Kategori ({categories.length})</h3>
                {categories.map((c) => (
                  <div key={c.id} className="p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{c.name}</p>
                      <p className="text-slate-500">{c.description}</p>
                    </div>
                    <button onClick={() => deleteCategory(c.id)} className="text-rose-500 p-1.5 cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {menu === 'pesanan' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-soft-card space-y-3">
              <h2 className="font-display font-bold text-base text-[#1E293B]">
                Monitor Pesanan Marketplace ({allOrders.length})
              </h2>
              {allOrders.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">Belum ada pesanan di sistem.</p>
              ) : (
                allOrders.map((o) => (
                  <div key={o.id} className="p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <p className="font-bold text-[#006B68]">{o.orderNumber} · {o.storeName}</p>
                      <p className="text-slate-600">{o.customerName} · {formatRupiah(o.total)}</p>
                    </div>
                    <select
                      value={o.status}
                      onChange={(e) => updateOrderStatus(o.id, e.target.value as OrderStatus)}
                      className="h-9 px-3 rounded-xl border border-slate-200 font-bold bg-[#F8FAFB]"
                    >
                      <option value="Menunggu Konfirmasi">Menunggu Konfirmasi</option>
                      <option value="Diproses">Diproses</option>
                      <option value="Dikirim">Dikirim</option>
                      <option value="Selesai">Selesai</option>
                      <option value="Dibatalkan">Dibatalkan</option>
                    </select>
                  </div>
                ))
              )}
            </div>
          )}

          {menu === 'bchain' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-soft-card space-y-4">
              <h2 className="font-display font-bold text-base text-[#1E293B]">
                Konsol Verifikasi Blockchain B-CHAIN ({verifications.length})
              </h2>
              <div className="space-y-3">
                {verifications.map((v) => (
                  <div key={v.id} className="p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-mono font-bold text-[#00A39D]">{v.productCode}</span>
                        <span className="mx-2 text-slate-300">·</span>
                        <strong className="text-sm text-[#1E293B]">{v.productName}</strong> ({v.storeName})
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={v.status}
                          onChange={(e) =>
                            verifyBChainRecord(v, e.target.value as BChainStatus, 'Verifikasi Administrator')
                          }
                          className="h-9 px-3 rounded-xl border border-slate-200 font-bold bg-[#F8FAFB]"
                        >
                          <option value="VERIFIED">VERIFIED</option>
                          <option value="PENDING VERIFICATION">PENDING VERIFICATION</option>
                          <option value="NOT VERIFIED">NOT VERIFIED</option>
                        </select>
                        <button
                          onClick={() => exportBChainCertificatePdf(v)}
                          className="h-9 px-3 rounded-xl bg-[#00A39D] text-white font-bold cursor-pointer"
                        >
                          PDF
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-500">
                      Batch: {v.batchNumber || 'Belum diisi'} · Legalitas: {v.legalityInfo || 'Belum diisi'} · Kadaluwarsa: {v.expiryDate || 'Belum diisi'}
                    </p>
                    <p className="font-mono text-[11px] text-slate-400 truncate">
                      Hash: {v.blockchainHash}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {menu === 'games' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!vchTitle.trim()) return;
                  await saveVoucher({
                    id: `vch-${Date.now()}`,
                    title: vchTitle.trim(),
                    description: 'Voucher resmi B-Market dikelola Administrator',
                    pointsCost: Number(vchCost) || 50,
                    discountLabel: vchLabel.trim() || 'Diskon Spesial',
                    quota: Number(vchQuota) || 20,
                    isActive: true,
                    createdAt: new Date().toISOString(),
                  });
                  setVchTitle('');
                  setVchLabel('');
                }}
                className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 p-5 shadow-soft-card space-y-3"
              >
                <h3 className="font-display font-bold text-base text-[#1E293B]">Tambah Voucher Reward Center</h3>
                <input type="text" required value={vchTitle} onChange={(e) => setVchTitle(e.target.value)} placeholder="Nama Voucher" className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs" />
                <input type="text" required value={vchLabel} onChange={(e) => setVchLabel(e.target.value)} placeholder="Label Diskon (mis. Diskon Rp 15.000)" className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" required value={vchCost} onChange={(e) => setVchCost(e.target.value)} placeholder="Biaya Poin" className="h-10 px-3 rounded-xl border border-slate-200 text-xs" />
                  <input type="number" required value={vchQuota} onChange={(e) => setVchQuota(e.target.value)} placeholder="Kuota" className="h-10 px-3 rounded-xl border border-slate-200 text-xs" />
                </div>
                <button type="submit" className="w-full h-10 rounded-xl bg-[#F8AD3C] text-slate-900 font-bold text-xs cursor-pointer">
                  Simpan Voucher
                </button>
              </form>

              <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-5 shadow-soft-card space-y-4">
                <h3 className="font-display font-bold text-base text-[#1E293B]">
                  Daftar Games ({games.length}) & Voucher ({vouchers.length})
                </h3>
                <div className="space-y-2">
                  {games.map((g) => (
                    <div key={g.id} className="p-3 rounded-xl bg-[#F4F6F6] flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{g.title} ({g.questions.length} soal)</span>
                      <button
                        onClick={() => saveGame({ ...g, isActive: !g.isActive })}
                        className="font-bold text-[#00A39D] cursor-pointer"
                      >
                        {g.isActive ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </div>
                  ))}
                  {vouchers.map((v) => (
                    <div key={v.id} className="p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <span><strong>{v.title}</strong> · {v.pointsCost} poin · Kuota {v.quota}</span>
                      <button
                        onClick={() => saveVoucher({ ...v, isActive: !v.isActive })}
                        className="font-bold text-[#006B68] cursor-pointer"
                      >
                        {v.isActive ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {menu === 'pelatihan' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await saveTraining({
                    id: `trn-${Date.now()}`,
                    title: trnTitle,
                    mode: trnMode,
                    schedule: trnSchedule,
                    location: trnLocation,
                    description: 'Program pelatihan resmi BSI UMKM Center',
                    quota: Number(trnQuota) || 50,
                    registeredCount: 0,
                    isActive: true,
                    createdAt: new Date().toISOString(),
                  });
                  setTrnTitle('');
                  setTrnSchedule('');
                  setTrnLocation('');
                }}
                className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 p-5 shadow-soft-card space-y-3"
              >
                <h3 className="font-display font-bold text-base text-[#1E293B]">Tambah Program Pelatihan</h3>
                <input type="text" required value={trnTitle} onChange={(e) => setTrnTitle(e.target.value)} placeholder="Judul Pelatihan" className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs" />
                <select value={trnMode} onChange={(e) => setTrnMode(e.target.value as 'Online' | 'Offline')} className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs bg-white">
                  <option value="Online">Online</option>
                  <option value="Offline">Offline</option>
                </select>
                <input type="text" required value={trnSchedule} onChange={(e) => setTrnSchedule(e.target.value)} placeholder="Jadwal (mis. 10 Des 2026 · 10.00 WIB)" className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs" />
                <input type="text" required value={trnLocation} onChange={(e) => setTrnLocation(e.target.value)} placeholder="Lokasi / Link" className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs" />
                <input type="number" required value={trnQuota} onChange={(e) => setTrnQuota(e.target.value)} placeholder="Kuota" className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs" />
                <button type="submit" className="w-full h-10 rounded-xl bg-[#00A39D] text-white font-bold text-xs cursor-pointer">Simpan Pelatihan</button>
              </form>
              <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-5 shadow-soft-card space-y-2.5">
                <h3 className="font-display font-bold text-base text-[#1E293B]">Daftar Pelatihan ({trainings.length})</h3>
                {trainings.map((t) => (
                  <div key={t.id} className="p-3.5 rounded-2xl border border-slate-200 text-xs flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800">{t.title}</p>
                      <p className="text-slate-500">{t.mode} · {t.schedule} · Peserta {t.registeredCount}/{t.quota}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {menu === 'mentor' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await saveMentor({
                    id: `mtr-${Date.now()}`,
                    name: mtrName,
                    expertise: mtrExpertise,
                    bio: 'Mentor pendamping UMKM binaan BSI UMKM Center',
                    schedule: mtrSchedule,
                    isActive: true,
                    createdAt: new Date().toISOString(),
                  });
                  setMtrName('');
                  setMtrExpertise('');
                  setMtrSchedule('');
                }}
                className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 p-5 shadow-soft-card space-y-3"
              >
                <h3 className="font-display font-bold text-base text-[#1E293B]">Tambah Mentor Pendamping</h3>
                <input type="text" required value={mtrName} onChange={(e) => setMtrName(e.target.value)} placeholder="Nama Mentor" className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs" />
                <input type="text" required value={mtrExpertise} onChange={(e) => setMtrExpertise(e.target.value)} placeholder="Bidang Keahlian" className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs" />
                <input type="text" required value={mtrSchedule} onChange={(e) => setMtrSchedule(e.target.value)} placeholder="Jadwal Konsultasi" className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs" />
                <button type="submit" className="w-full h-10 rounded-xl bg-[#00A39D] text-white font-bold text-xs cursor-pointer">Simpan Mentor</button>
              </form>
              <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-5 shadow-soft-card space-y-2.5">
                <h3 className="font-display font-bold text-base text-[#1E293B]">Daftar Mentor ({mentors.length})</h3>
                {mentors.map((m) => (
                  <div key={m.id} className="p-3.5 rounded-2xl border border-slate-200 text-xs">
                    <p className="font-bold text-slate-800">{m.name}</p>
                    <p className="text-[#00A39D] font-semibold">{m.expertise}</p>
                    <p className="text-slate-500">{m.schedule}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {menu === 'edukasi' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await saveMaterial({
                    id: `mat-${Date.now()}`,
                    title: matTitle,
                    category: matCat,
                    type: matType,
                    duration: '15 Menit',
                    summary: matSummary,
                    content: matSummary,
                    createdAt: new Date().toISOString(),
                  });
                  setMatTitle('');
                  setMatSummary('');
                }}
                className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 p-5 shadow-soft-card space-y-3"
              >
                <h3 className="font-display font-bold text-base text-[#1E293B]">Tambah Konten Edukasi</h3>
                <input type="text" required value={matTitle} onChange={(e) => setMatTitle(e.target.value)} placeholder="Judul Materi" className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs" />
                <input type="text" required value={matCat} onChange={(e) => setMatCat(e.target.value)} placeholder="Kategori" className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs" />
                <select value={matType} onChange={(e) => setMatType(e.target.value as any)} className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs bg-white">
                  <option value="Modul Digital">Modul Digital</option>
                  <option value="Video Pembelajaran">Video Pembelajaran</option>
                  <option value="Program Pendampingan">Program Pendampingan</option>
                </select>
                <textarea rows={3} required value={matSummary} onChange={(e) => setMatSummary(e.target.value)} placeholder="Ringkasan & isi materi" className="w-full p-3 rounded-xl border border-slate-200 text-xs" />
                <button type="submit" className="w-full h-10 rounded-xl bg-[#00A39D] text-white font-bold text-xs cursor-pointer">Publikasikan Materi</button>
              </form>
              <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-5 shadow-soft-card space-y-2.5">
                <h3 className="font-display font-bold text-base text-[#1E293B]">Konten Edukasi Aktif ({materials.length})</h3>
                {materials.map((m) => (
                  <div key={m.id} className="p-3.5 rounded-2xl border border-slate-200 text-xs">
                    <p className="font-bold text-slate-800">{m.title}</p>
                    <p className="text-slate-500">{m.type} · {m.category}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {menu === 'laporan' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-soft-card space-y-4">
              <h2 className="font-display font-bold text-base text-[#1E293B]">
                Laporan Ringkas Ekosistem BSI UMKM Center
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-[#F4F6F6]">
                  <p className="text-slate-500">Produk Terverifikasi B-CHAIN</p>
                  <p className="font-display text-2xl font-extrabold text-[#00A39D] mt-1 tabular-nums">
                    {verifications.filter((v) => v.status === 'VERIFIED').length} / {verifications.length}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-[#F4F6F6]">
                  <p className="text-slate-500">Pesanan Selesai</p>
                  <p className="font-display text-2xl font-extrabold text-[#006B68] mt-1 tabular-nums">
                    {allOrders.filter((o) => o.status === 'Selesai').length}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-[#F4F6F6]">
                  <p className="text-slate-500">Total Pendaftar Pelatihan</p>
                  <p className="font-display text-2xl font-extrabold text-[#F8AD3C] mt-1 tabular-nums">
                    {trainings.reduce((s, t) => s + t.registeredCount, 0)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {menu === 'pengaturan' && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await saveSystemSettings({
                  id: 'global',
                  promoBannerTitle: promoTitle,
                  promoBannerSubtitle: promoSub,
                  pointsPerQuizCorrect: Number(quizPts) || 25,
                  pointsPerOrder: Number(orderPts) || 20,
                  bchainNetwork: bchainNet,
                  updatedAt: new Date().toISOString(),
                });
              }}
              className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-soft-card max-w-2xl space-y-4"
            >
              <h2 className="font-display font-bold text-base text-[#1E293B]">
                Pengaturan Ekosistem & Aturan Poin
              </h2>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Judul Banner Promosi B-Market</label>
                <input type="text" value={promoTitle} onChange={(e) => setPromoTitle(e.target.value)} className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subjudul Banner Promosi</label>
                <input type="text" value={promoSub} onChange={(e) => setPromoSub(e.target.value)} className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Poin per Jawaban Benar Kuis B-EDU</label>
                  <input type="number" value={quizPts} onChange={(e) => setQuizPts(e.target.value)} className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Poin per Transaksi B-Market</label>
                  <input type="number" value={orderPts} onChange={(e) => setOrderPts(e.target.value)} className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jaringan Blockchain B-CHAIN</label>
                <input type="text" value={bchainNet} onChange={(e) => setBchainNet(e.target.value)} className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm" />
              </div>
              <button type="submit" className="px-6 h-11 rounded-xl bg-[#00A39D] hover:bg-[#006B68] text-white font-bold text-sm cursor-pointer">
                Simpan Pengaturan Sistem
              </button>
            </form>
          )}
        </main>
      </div>
    </div>
  );
};

const StatBox: React.FC<{ label: string; value: string; accent?: string }> = ({
  label,
  value,
  accent = 'text-[#1E293B]',
}) => (
  <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-soft-card">
    <p className="text-[11px] font-semibold text-slate-500">{label}</p>
    <p className={`font-display text-xl font-extrabold mt-1 tabular-nums ${accent}`}>{value}</p>
  </div>
);
