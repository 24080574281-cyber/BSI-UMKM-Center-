import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  LogOut,
  Megaphone,
  MessageCircle,
  Package,
  Send,
  Star,
  Store,
  Upload,
  User as UserIcon,
  Wallet,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { BSaveView } from './BSaveView.tsx';
import { BSmartView } from './BSmartView.tsx';
import { BFinanceView } from './BFinanceView.tsx';
import { BEduUmkmView } from './BEduUmkmView.tsx';
import { BinaExpression, BrandLogo, ProductPlaceholder } from '../BinaMascot.tsx';
import { PWAInstallButton } from '../PWAInstall.tsx';
import { compressImageToDataUrl, formatDateTime, formatRupiah } from '../../lib/utils.ts';
import type { OrderStatus } from '../../types.ts';

type UmkmTab = 'b-save' | 'b-smart' | 'b-finance' | 'b-edu' | 'profile';

interface UmkmPortalProps {
  onOpenAuth: () => void;
  onSwitchToCustomer: () => void;
  onSwitchToAdmin?: () => void;
  apkMode?: boolean;
}

export const UmkmPortal: React.FC<UmkmPortalProps> = ({
  onOpenAuth,
  onSwitchToCustomer,
  onSwitchToAdmin,
  apkMode = false,
}) => {
  const {
    isAuthenticated,
    isDemoMode,
    activeUid,
    userProfile,
    isAdminAccount,
    stores,
    categories,
    products,
    allOrders,
    reviews,
    financialTransactions,
    notifications,
    storeChats,
    claimStore,
    createStore,
    updateStore,
    updateOrderStatus,
    sendStoreChatMessage,
    switchDemoStore,
    logout,
    showToast,
  } = useApp();

  const [tab, setTab] = useState<UmkmTab>('b-save');
  const [profileSection, setProfileSection] = useState<'store' | 'chats' | 'orders' | 'reviews' | 'notif'>('store');
  const [selectedChatCustomerUid, setSelectedChatCustomerUid] = useState<string>('');
  const [umkmChatInput, setUmkmChatInput] = useState('');
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreCat, setNewStoreCat] = useState('Kuliner & Makanan');

  const isAuthorizedUmkm =
    isAdminAccount || userProfile?.role === 'umkm';

  // Find store managed by current UMKM user (or let admin pick any store)
  const myStore = useMemo(() => {
    if (!isAuthenticated) return undefined;
    if (userProfile?.managedStoreId) {
      const found = stores.find((s) => s.id === userProfile.managedStoreId);
      if (found) return found;
    }
    return stores.find((s) => s.ownerUid === activeUid);
  }, [isAuthenticated, activeUid, userProfile, stores]);

  const [adminPickedStoreId, setAdminPickedStoreId] = useState<string>('botega');
  const activeStore = myStore || (isAdminAccount || isDemoMode ? stores.find((s) => s.id === adminPickedStoreId) || stores[0] : undefined);

  // Store editor state
  const [editDesc, setEditDesc] = useState(activeStore?.description || '');
  const [editCity, setEditCity] = useState(activeStore?.city || '');
  const [editAddress, setEditAddress] = useState(activeStore?.address || '');
  const [editWa, setEditWa] = useState(activeStore?.whatsapp || '');
  const [editOwnerName, setEditOwnerName] = useState(activeStore?.ownerName || '');
  const [editLegality, setEditLegality] = useState(activeStore?.legalitySummary || '');
  const [editCategory, setEditCategory] = useState(activeStore?.category || 'Kuliner & Makanan');
  const [editFoundedYear, setEditFoundedYear] = useState(activeStore?.foundedYear || '');
  const [editFoundingStory, setEditFoundingStory] = useState(activeStore?.foundingStory || '');

  const syncFormFields = (storeObj = activeStore) => {
    if (!storeObj) return;
    setEditDesc(storeObj.description || '');
    setEditCity(storeObj.city || '');
    setEditAddress(storeObj.address || '');
    setEditWa(storeObj.whatsapp || '');
    setEditOwnerName(storeObj.ownerName || '');
    setEditLegality(storeObj.legalitySummary || '');
    setEditCategory(storeObj.category || 'Kuliner & Makanan');
    setEditFoundedYear(storeObj.foundedYear || '');
    setEditFoundingStory(storeObj.foundingStory || '');
  };

  useEffect(() => {
    if (activeStore) {
      syncFormFields(activeStore);
    }
  }, [activeStore?.id, activeStore?.updatedAt]);

  if (!isAuthenticated || !isAuthorizedUmkm) {
    return (
      <div className="min-h-screen bg-[#F8FAFB] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 shadow-soft-card">
          <BinaExpression mood="thinking" className="w-24 h-24 mx-auto" />
          <h2 className="font-display text-xl font-extrabold text-[#1E293B]">
            Akses Khusus UMKM Binaan
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Halaman ini dilindungi kontrol akses berbasis peran. Masuk atau daftar sebagai akun UMKM Binaan untuk mengelola toko, B-Save, B-Smart, dan B-Finance.
          </p>
          <div className="flex flex-col gap-2.5 pt-2">
            <button
              onClick={onOpenAuth}
              className="h-11 rounded-xl bg-[#00A39D] text-white font-bold text-sm cursor-pointer"
            >
              Masuk / Daftar UMKM Binaan
            </button>
            <button
              onClick={onSwitchToCustomer}
              className="h-11 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm cursor-pointer"
            >
              Kembali ke B-Market Customer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If UMKM user has not claimed or created a store yet
  if (!activeStore) {
    const unclaimed = stores.filter((s) => !s.ownerUid);
    return (
      <div className="min-h-screen bg-[#F8FAFB] flex items-center justify-center p-4">
        <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-soft-card">
          <div className="flex items-center gap-3">
            <BinaExpression mood="wave" className="w-16 h-16" />
            <div>
              <h2 className="font-display text-xl font-extrabold text-[#1E293B]">
                Pilih atau Daftarkan Toko UMKM Anda
              </h2>
              <p className="text-xs text-slate-500">
                Hubungkan akun Anda dengan salah satu toko binaan awal atau buat toko baru.
              </p>
            </div>
          </div>

          {unclaimed.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-[#006B68]">Klaim Toko UMKM Binaan Awal:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {unclaimed.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => claimStore(s.id)}
                    className="p-3.5 rounded-2xl border border-slate-200 hover:border-[#00A39D] text-left cursor-pointer"
                  >
                    <p className="font-bold text-sm text-[#1E293B]">{s.name}</p>
                    <p className="text-[11px] text-slate-500">{s.category}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!newStoreName.trim()) return;
              await createStore({ name: newStoreName.trim(), category: newStoreCat });
            }}
            className="pt-4 border-t border-slate-100 space-y-3"
          >
            <p className="text-xs font-bold text-slate-700">Atau Daftarkan Toko UMKM Baru:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                required
                value={newStoreName}
                onChange={(e) => setNewStoreName(e.target.value)}
                placeholder="Nama Toko / Usaha"
                className="h-11 px-3 rounded-xl border border-slate-200 text-sm"
              />
              <select
                value={newStoreCat}
                onChange={(e) => setNewStoreCat(e.target.value)}
                className="h-11 px-3 rounded-xl border border-slate-200 text-sm bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="w-full h-11 rounded-xl bg-[#00A39D] text-white font-bold text-sm cursor-pointer">
              Buat Toko UMKM Baru
            </button>
          </form>
        </div>
      </div>
    );
  }

  const storeProducts = products.filter((p) => p.storeId === activeStore.id);
  const storeOrders = allOrders.filter((o) => o.storeId === activeStore.id);
  const storeReviews = reviews.filter((r) => r.storeId === activeStore.id);
  const storeChatMessages = storeChats.filter((c) => c.storeId === activeStore.id);
  const chatThreads = useMemo(() => {
    const map = new Map<
      string,
      {
        customerUid: string;
        customerName: string;
        lastMessage: string;
        lastTime: string;
        messages: typeof storeChatMessages;
      }
    >();
    storeChatMessages.forEach((msg) => {
      const existing = map.get(msg.customerUid);
      if (existing) {
        existing.messages.push(msg);
        if (msg.createdAt >= existing.lastTime) {
          existing.lastMessage = msg.text;
          existing.lastTime = msg.createdAt;
        }
      } else {
        map.set(msg.customerUid, {
          customerUid: msg.customerUid,
          customerName: msg.customerName,
          lastMessage: msg.text,
          lastTime: msg.createdAt,
          messages: [msg],
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.lastTime.localeCompare(a.lastTime));
  }, [storeChatMessages]);

  const activeThread =
    chatThreads.find((t) => t.customerUid === selectedChatCustomerUid) || chatThreads[0] || null;

  const storeTx = financialTransactions.filter((t) => t.storeId === activeStore.id);
  const totalSales = storeTx
    .filter((t) => t.type === 'PEMASUKAN')
    .reduce((s, t) => s + t.amount, 0);
  const totalExpenses = storeTx
    .filter((t) => t.type === 'PENGELUARAN')
    .reduce((s, t) => s + t.amount, 0);

  const navItems: { id: UmkmTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'b-save', label: 'B-Save', icon: Package },
    { id: 'b-smart', label: 'B-Smart', icon: Megaphone },
    { id: 'b-finance', label: 'B-Finance', icon: Wallet },
    { id: 'b-edu', label: 'B-Edu', icon: BookOpen },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];

  const handleStorePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await compressImageToDataUrl(file, 600, 0.78);
      await updateStore(activeStore.id, { photoUrl: url });
    } catch (err: any) {
      showToast(err?.message || 'Gagal mengunggah logo toko.', 'error');
    }
  };

  return (
    <div className={`min-h-full bg-[#F8FAFB] ${apkMode ? 'pb-20' : 'min-h-screen pb-20 md:pb-10'}`}>
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200/80">
        <div className={`max-w-7xl mx-auto px-3 sm:px-6 flex items-center justify-between gap-2 ${apkMode ? 'h-14' : 'h-16 gap-6'}`}>
          <div className="flex items-center gap-2 shrink-0">
            <BrandLogo className={apkMode ? 'h-8 w-8' : 'h-9 w-9'} />
          </div>

          {!apkMode && (
            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    setTab(n.id);
                    if (n.id === 'profile') syncFormFields();
                  }}
                  className={`text-sm font-semibold whitespace-nowrap shrink-0 pb-1 border-b-2 transition-colors cursor-pointer ${
                    tab === n.id
                      ? 'text-[#006B68] border-[#00A39D]'
                      : 'text-slate-600 border-transparent hover:text-[#1E293B]'
                  }`}
                >
                  {n.label}
                </button>
              ))}
            </nav>
          )}

          <div className="flex items-center gap-2 shrink-0">
            {(isAdminAccount || isDemoMode) && (
              <select
                aria-label="Pilih toko UMKM binaan"
                value={activeStore.id}
                onChange={(e) => {
                  const id = e.target.value;
                  if (isDemoMode) {
                    switchDemoStore(id);
                  } else {
                    setAdminPickedStoreId(id);
                  }
                  const next = stores.find((s) => s.id === id);
                  if (next) syncFormFields(next);
                }}
                className="h-9 px-2 rounded-xl border border-slate-200 text-[11px] font-bold bg-[#F4F6F6] max-w-[140px]"
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}
            <PWAInstallButton compact />
            {!apkMode && (
              <button
                onClick={onSwitchToCustomer}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:border-[#00A39D] whitespace-nowrap cursor-pointer"
              >
                B-Market
              </button>
            )}
            {!apkMode && isAdminAccount && onSwitchToAdmin && (
              <button
                onClick={onSwitchToAdmin}
                className="px-3 py-2 rounded-xl bg-[#006B68] text-white text-xs font-bold whitespace-nowrap cursor-pointer"
              >
                Admin
              </button>
            )}
          </div>
        </div>
      </header>

      <main className={`max-w-7xl mx-auto ${apkMode ? 'px-3 py-4 space-y-4' : 'px-4 sm:px-6 py-6 space-y-6'}`}>
        {/* UMKM Dashboard Overview Strip */}
        <section className={`grid gap-2.5 ${apkMode ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-5 gap-3'}`}>
          <div className={`col-span-2 ${apkMode ? '' : 'lg:col-span-1'} bg-gradient-to-br from-[#006B68] to-[#00A39D] text-white rounded-2xl p-3.5 shadow-soft-card`}>
            <p className="text-[10px] text-white/80">Toko Dikelola</p>
            <p className="font-display font-extrabold text-base truncate mt-0.5">{activeStore.name}</p>
            <p className="text-[11px] text-[#F8AD3C] font-semibold mt-0.5">{activeStore.category}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-soft-card">
            <p className="text-[10px] text-slate-500">Total Pemasukan</p>
            <p className="font-display font-extrabold text-sm sm:text-base text-[#00A39D] mt-0.5 tabular-nums">
              {formatRupiah(totalSales)}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-soft-card">
            <p className="text-[10px] text-slate-500">Saldo Keuangan</p>
            <p className="font-display font-extrabold text-sm sm:text-base text-[#006B68] mt-0.5 tabular-nums">
              {formatRupiah(totalSales - totalExpenses)}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-soft-card">
            <p className="text-[10px] text-slate-500">Produk & Stok</p>
            <p className="font-display font-extrabold text-sm sm:text-base text-[#1E293B] mt-0.5 tabular-nums">
              {storeProducts.length} Produk
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-soft-card">
            <p className="text-[10px] text-slate-500">Pesanan Masuk</p>
            <p className="font-display font-extrabold text-sm sm:text-base text-[#F8AD3C] mt-0.5 tabular-nums">
              {storeOrders.length} Pesanan
            </p>
          </div>
        </section>

        {tab === 'b-save' && <BSaveView store={activeStore} />}
        {tab === 'b-smart' && <BSmartView store={activeStore} />}
        {tab === 'b-finance' && <BFinanceView store={activeStore} />}
        {tab === 'b-edu' && <BEduUmkmView />}
        {tab === 'profile' && (
          <div className={`grid grid-cols-1 gap-4 ${apkMode ? '' : 'lg:grid-cols-12 gap-6'}`}>
            <div className={`${apkMode ? '' : 'lg:col-span-4'} space-y-4`}>
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-soft-card space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-200 shrink-0">
                    {activeStore.photoUrl ? (
                      <img src={activeStore.photoUrl} alt={activeStore.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    ) : (
                      <ProductPlaceholder compact isStore />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display font-bold text-base text-[#1E293B] truncate">
                      {activeStore.name}
                    </h3>
                    <p className="text-xs text-slate-500 truncate">{userProfile?.email}</p>
                  </div>
                </div>

                <div className="space-y-1 pt-2 border-t border-slate-100">
                  {[
                    { id: 'store', label: 'Profil & Pengaturan Toko', icon: Store },
                    { id: 'chats', label: `Chat Pelanggan (${chatThreads.length})`, icon: MessageCircle },
                    { id: 'orders', label: `Proses Pesanan (${storeOrders.length})`, icon: Package },
                    { id: 'reviews', label: `Ulasan Pelanggan (${storeReviews.length})`, icon: Star },
                    { id: 'notif', label: `Notifikasi (${notifications.length})`, icon: UserIcon },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setProfileSection(item.id as typeof profileSection);
                        if (item.id === 'store') syncFormFields();
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer ${
                        profileSection === item.id ? 'bg-[#00A39D] text-white' : 'text-slate-600 hover:bg-[#F4F6F6]'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={logout}
                  className="w-full h-10 rounded-xl border border-rose-200 text-rose-600 font-bold text-xs inline-flex items-center justify-center gap-1.5 hover:bg-rose-50 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> Keluar Akun
                </button>
              </div>
            </div>

            <div className={`${apkMode ? '' : 'lg:col-span-8'} bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-soft-card`}>
              {profileSection === 'store' && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await updateStore(activeStore.id, {
                      description: editDesc || null,
                      city: editCity || null,
                      address: editAddress || null,
                      whatsapp: editWa || null,
                      ownerName: editOwnerName || null,
                      legalitySummary: editLegality || null,
                      category: editCategory,
                      foundedYear: editFoundedYear || null,
                      foundingStory: editFoundingStory || null,
                    });
                  }}
                  className="space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-display font-bold text-base text-[#1E293B]">
                      Kelola Profil Toko — {activeStore.name}
                    </h3>
                    <label className="px-3.5 py-2 rounded-xl border border-[#00A39D] text-[#006B68] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer hover:bg-[#00A39D]/5">
                      <Upload className="w-3.5 h-3.5" />
                      Unggah Foto / Logo Toko
                      <input type="file" accept="image/*" onChange={handleStorePhotoUpload} className="hidden" />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Usaha</label>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm bg-white"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nama Pemilik Toko</label>
                      <input
                        type="text"
                        value={editOwnerName}
                        onChange={(e) => setEditOwnerName(e.target.value)}
                        placeholder="Nama lengkap pemilik"
                        className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Kota / Kabupaten</label>
                      <input
                        type="text"
                        value={editCity}
                        onChange={(e) => setEditCity(e.target.value)}
                        placeholder="Contoh: Surabaya"
                        className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Kontak Internal Toko (Privasi)
                      </label>
                      <input
                        type="text"
                        value={editWa}
                        onChange={(e) => setEditWa(e.target.value)}
                        placeholder="08xxxxxxxxxx (tidak ditampilkan di B-Market)"
                        className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Lengkap Usaha</label>
                      <input
                        type="text"
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Legalitas (NIB / Halal / PIRT)</label>
                      <input
                        type="text"
                        value={editLegality}
                        onChange={(e) => setEditLegality(e.target.value)}
                        placeholder="Isi nomor legalitas resmi usaha Anda"
                        className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Tahun Berdiri UMKM</label>
                      <input
                        type="text"
                        value={editFoundedYear}
                        onChange={(e) => setEditFoundedYear(e.target.value)}
                        placeholder="Contoh: 2018"
                        className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Singkat Toko</label>
                      <textarea
                        rows={2}
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        placeholder="Ringkasan produk unggulan toko Anda..."
                        className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Sejarah Berdirinya UMKM</label>
                      <textarea
                        rows={4}
                        value={editFoundingStory}
                        onChange={(e) => setEditFoundingStory(e.target.value)}
                        placeholder="Ceritakan awal mula berdirinya usaha, latar belakang pendiri, hingga pencapaian bersama BSI UMKM Center..."
                        className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="px-6 h-11 rounded-xl bg-[#00A39D] hover:bg-[#006B68] text-white font-bold text-sm cursor-pointer"
                  >
                    Simpan Profil Toko
                  </button>
                </form>
              )}

              {profileSection === 'chats' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="font-display font-bold text-base text-[#1E293B]">
                        Chat Langsung Pelanggan B-Market
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Balas pertanyaan produk & stok langsung di dalam aplikasi tanpa nomor pribadi.
                      </p>
                    </div>
                  </div>
                  {chatThreads.length === 0 ? (
                    <div className="py-10 text-center space-y-2">
                      <MessageCircle className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="text-xs text-slate-500">
                        Belum ada pesan masuk dari pelanggan untuk {activeStore.name}.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      <div className="md:col-span-4 space-y-1.5 border border-slate-200 rounded-2xl p-2 bg-[#F8FAFB]">
                        {chatThreads.map((t) => {
                          const selected = activeThread?.customerUid === t.customerUid;
                          return (
                            <button
                              key={t.customerUid}
                              type="button"
                              onClick={() => setSelectedChatCustomerUid(t.customerUid)}
                              className={`w-full text-left p-2.5 rounded-xl transition-colors cursor-pointer ${
                                selected ? 'bg-[#00A39D] text-white' : 'bg-white hover:bg-slate-100 text-slate-800'
                              }`}
                            >
                              <p className="text-xs font-bold truncate">{t.customerName}</p>
                              <p className={`text-[11px] truncate mt-0.5 ${selected ? 'text-white/85' : 'text-slate-500'}`}>
                                {t.lastMessage}
                              </p>
                            </button>
                          );
                        })}
                      </div>

                      {activeThread && (
                        <div className="md:col-span-8 border border-slate-200 rounded-2xl flex flex-col overflow-hidden">
                          <div className="px-4 py-2.5 bg-[#F4F6F6] border-b border-slate-200 flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-[#1E293B]">{activeThread.customerName}</p>
                              <p className="text-[10px] text-[#00A39D] font-semibold">Chat B-Market Terenkripsi</p>
                            </div>
                          </div>

                          <div className="p-3.5 space-y-2.5 max-h-72 overflow-y-auto bg-white flex-1">
                            {activeThread.messages.map((m) => (
                              <div
                                key={m.id}
                                className={`flex ${m.senderRole === 'umkm' ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-xs space-y-1 ${
                                    m.senderRole === 'umkm'
                                      ? 'bg-[#00A39D] text-white rounded-br-sm'
                                      : 'bg-[#F4F6F6] text-slate-800 rounded-bl-sm'
                                  }`}
                                >
                                  {m.productName && (
                                    <p
                                      className={`text-[10px] font-bold ${
                                        m.senderRole === 'umkm' ? 'text-[#F8AD3C]' : 'text-[#006B68]'
                                      }`}
                                    >
                                      Produk: {m.productName}
                                    </p>
                                  )}
                                  <p>{m.text}</p>
                                  <p
                                    className={`text-[9px] ${
                                      m.senderRole === 'umkm' ? 'text-white/75' : 'text-slate-400'
                                    }`}
                                  >
                                    {formatDateTime(m.createdAt)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="px-3 py-1.5 bg-[#F8FAFB] border-t border-slate-100 flex flex-wrap gap-1.5">
                            {[
                              'Halo Kak! Produk siap kirim hari ini ya.',
                              'Stok masih ready, silakan langsung checkout.',
                              'Terima kasih sudah menghubungi toko kami!',
                            ].map((quick) => (
                              <button
                                key={quick}
                                type="button"
                                onClick={() => setUmkmChatInput(quick)}
                                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[10px] font-semibold text-[#006B68] hover:border-[#00A39D] cursor-pointer"
                              >
                                {quick}
                              </button>
                            ))}
                          </div>

                          <form
                            onSubmit={async (e) => {
                              e.preventDefault();
                              if (!umkmChatInput.trim()) return;
                              const txt = umkmChatInput.trim();
                              setUmkmChatInput('');
                              await sendStoreChatMessage({
                                storeId: activeStore.id,
                                storeName: activeStore.name,
                                customerUid: activeThread.customerUid,
                                customerName: activeThread.customerName,
                                senderRole: 'umkm',
                                text: txt,
                              });
                            }}
                            className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2"
                          >
                            <input
                              type="text"
                              value={umkmChatInput}
                              onChange={(e) => setUmkmChatInput(e.target.value)}
                              placeholder="Tulis balasan ke pelanggan..."
                              className="flex-1 h-10 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#00A39D]"
                            />
                            <button
                              type="submit"
                              className="h-10 px-4 rounded-xl bg-[#00A39D] hover:bg-[#006B68] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" /> Kirim
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {profileSection === 'orders' && (
                <div className="space-y-4">
                  <h3 className="font-display font-bold text-base text-[#1E293B]">
                    Pesanan Pelanggan ({storeOrders.length})
                  </h3>
                  {storeOrders.length === 0 ? (
                    <p className="text-xs text-slate-500 py-8 text-center">Belum ada pesanan masuk untuk toko ini.</p>
                  ) : (
                    <div className="space-y-3">
                      {storeOrders.map((ord) => (
                        <div key={ord.id} className="p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <span className="font-mono font-bold text-[#006B68]">{ord.orderNumber}</span>
                              <span className="mx-2 text-slate-300">·</span>
                              <strong>{ord.customerName}</strong> ({ord.customerPhone})
                            </div>
                            <select
                              value={ord.status}
                              onChange={(e) => updateOrderStatus(ord.id, e.target.value as OrderStatus)}
                              className="h-8 px-2.5 rounded-lg border border-slate-200 font-bold bg-[#F8FAFB]"
                            >
                              <option value="Menunggu Konfirmasi">Menunggu Konfirmasi</option>
                              <option value="Diproses">Diproses</option>
                              <option value="Dikirim">Dikirim</option>
                              <option value="Selesai">Selesai</option>
                              <option value="Dibatalkan">Dibatalkan</option>
                            </select>
                          </div>
                          <p className="text-slate-500">Alamat: {ord.shippingAddress}</p>
                          <div className="text-slate-700">
                            {ord.items.map((it) => `${it.productName} × ${it.quantity}`).join(', ')}
                          </div>
                          <div className="flex justify-between pt-1 border-t border-slate-100">
                            <span className="text-slate-400">{formatDateTime(ord.createdAt)}</span>
                            <strong className="text-[#006B68] tabular-nums">{formatRupiah(ord.total)}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {profileSection === 'reviews' && (
                <div className="space-y-4">
                  <h3 className="font-display font-bold text-base text-[#1E293B]">Ulasan Pelanggan</h3>
                  {storeReviews.length === 0 ? (
                    <p className="text-xs text-slate-500 py-8 text-center">Belum ada ulasan pelanggan.</p>
                  ) : (
                    <div className="space-y-3">
                      {storeReviews.map((rev) => (
                        <div key={rev.id} className="p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1">
                          <div className="flex justify-between">
                            <strong>{rev.userName}</strong>
                            <span className="text-slate-400">{formatDateTime(rev.createdAt)}</span>
                          </div>
                          <p className="text-amber-500 font-bold">Rating: {rev.rating} / 5</p>
                          <p className="text-slate-600">{rev.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {profileSection === 'notif' && (
                <div className="space-y-3">
                  <h3 className="font-display font-bold text-base text-[#1E293B]">Notifikasi UMKM</h3>
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-500 py-8 text-center">Belum ada notifikasi.</p>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="p-3.5 rounded-2xl bg-[#F4F6F6] text-xs space-y-1">
                        <p className="font-bold text-[#1E293B]">{n.title}</p>
                        <p className="text-slate-600">{n.message}</p>
                        <p className="text-[10px] text-slate-400">{formatDateTime(n.createdAt)}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar: B-Save, B-Smart, B-Finance, B-Edu, Profile */}
      <nav
        className={`${
          apkMode ? 'grid' : 'md:hidden grid'
        } fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 grid-cols-5 h-16`}
      >
        {navItems.map((n) => {
          const active = tab === n.id;
          return (
            <button
              key={n.id}
              onClick={() => {
                setTab(n.id);
                if (n.id === 'profile') syncFormFields();
              }}
              className={`relative flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                active ? 'text-[#00A39D]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {active && <span className="absolute top-0 w-8 h-0.5 rounded-full bg-[#00A39D]" />}
              <n.icon className="w-5 h-5" />
              <span className="text-[10px] font-bold">{n.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
