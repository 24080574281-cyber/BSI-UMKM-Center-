import React, { useEffect, useState } from 'react';
import {
  Bell,
  BookOpen,
  Bot,
  Heart,
  LogOut,
  Package,
  ShieldCheck,
  ShoppingBag,
  Star,
  User as UserIcon,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { BMarketView } from './BMarketView.tsx';
import { BChainView } from './BChainView.tsx';
import { BAiView } from './BAiView.tsx';
import { BEduCustomerView } from './BEduCustomerView.tsx';
import { BinaExpression, BrandLogo, ProductPlaceholder } from '../BinaMascot.tsx';
import { PWAInstallButton } from '../PWAInstall.tsx';
import { formatDateTime, formatRupiah } from '../../lib/utils.ts';

type CustomerTab = 'b-market' | 'b-chain' | 'b-ai' | 'b-edu' | 'profile';

interface CustomerPortalProps {
  onOpenAuth: () => void;
  onSwitchToUmkm?: () => void;
  onSwitchToAdmin?: () => void;
  apkMode?: boolean;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  onOpenAuth,
  onSwitchToUmkm,
  onSwitchToAdmin,
  apkMode = false,
}) => {
  const {
    isAuthenticated,
    isDemoMode,
    activeUid,
    userProfile,
    isAdminAccount,
    orders,
    favorites,
    products,
    reviews,
    notifications,
    logout,
    updateProfile,
    markNotificationRead,
    toggleFavorite,
  } = useApp();

  const [tab, setTab] = useState<CustomerTab>('b-market');
  const [bchainProductId, setBchainProductId] = useState<string | null>(null);
  const [pendingAiPrompt, setPendingAiPrompt] = useState<string | null>(null);
  const [pendingMarketStoreId, setPendingMarketStoreId] = useState<string | null>(null);
  const [profileSection, setProfileSection] = useState<'info' | 'orders' | 'favorites' | 'reviews' | 'notif'>('orders');

  const [editName, setEditName] = useState(userProfile?.displayName || '');
  const [editPhone, setEditPhone] = useState(userProfile?.phone || '');
  const [editAddress, setEditAddress] = useState(userProfile?.address || '');
  const [editCity, setEditCity] = useState(userProfile?.city || '');

  useEffect(() => {
    if (userProfile) {
      setEditName(userProfile.displayName || '');
      setEditPhone(userProfile.phone || '');
      setEditAddress(userProfile.address || '');
      setEditCity(userProfile.city || '');
    }
  }, [userProfile?.uid, userProfile?.updatedAt]);

  const unreadNotifs = notifications.filter((n) => !n.isRead).length;

  const handleOpenBChain = (productId?: string) => {
    setBchainProductId(productId || null);
    setTab('b-chain');
  };

  const navItems: { id: CustomerTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'b-market', label: 'B-Market', icon: ShoppingBag },
    { id: 'b-chain', label: 'B-Chain', icon: ShieldCheck },
    { id: 'b-ai', label: 'B-AI', icon: Bot },
    { id: 'b-edu', label: 'B-Edu', icon: BookOpen },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];

  return (
    <div className={`min-h-full bg-[#F8FAFB] ${apkMode ? 'pb-20' : 'min-h-screen pb-20 md:pb-10'}`}>
      {/* 3-Zone Top Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200/80">
        <div className={`max-w-7xl mx-auto px-3 sm:px-6 flex items-center justify-between gap-3 ${apkMode ? 'h-14' : 'h-16 gap-8'}`}>
          <button onClick={() => setTab('b-market')} className="cursor-pointer shrink-0">
            <BrandLogo className={apkMode ? 'h-8 w-8' : 'h-9 w-9'} />
          </button>

          {!apkMode && (
            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setTab(n.id)}
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
            <PWAInstallButton compact />
            {!apkMode && isAdminAccount && onSwitchToAdmin && (
              <button
                onClick={onSwitchToAdmin}
                className="px-3.5 py-2 rounded-xl border border-[#00A39D] text-[#006B68] text-xs font-bold hover:bg-[#00A39D]/5 whitespace-nowrap cursor-pointer"
              >
                Admin Panel
              </button>
            )}
            {!apkMode && (userProfile?.role === 'umkm' || isAdminAccount) && onSwitchToUmkm && (
              <button
                onClick={onSwitchToUmkm}
                className="px-3.5 py-2 rounded-xl border border-amber-400 text-amber-800 text-xs font-bold hover:bg-amber-50 whitespace-nowrap cursor-pointer"
              >
                Portal UMKM
              </button>
            )}
            {!isAuthenticated ? (
              <button
                onClick={onOpenAuth}
                className="px-3.5 py-1.5 rounded-xl bg-[#00A39D] hover:bg-[#006B68] text-white text-xs font-bold whitespace-nowrap cursor-pointer"
              >
                Masuk
              </button>
            ) : (
              <button
                onClick={() => setTab('profile')}
                className="px-3 py-1.5 rounded-xl bg-[#F4F6F6] hover:bg-slate-200/70 text-[11px] font-bold text-[#1E293B] max-w-[120px] truncate cursor-pointer"
              >
                {userProfile?.displayName || 'Akun Saya'}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`max-w-7xl mx-auto ${apkMode ? 'px-3 py-4' : 'px-4 sm:px-6 py-6'}`}>
        {tab === 'b-market' && (
          <BMarketView
            onNavigateBChain={handleOpenBChain}
            onAskBAi={(prompt?: string) => {
              if (prompt) setPendingAiPrompt(prompt);
              setTab('b-ai');
            }}
            onRequestAuth={onOpenAuth}
            apkMode={apkMode}
            initialStoreId={pendingMarketStoreId}
            onConsumeInitialStoreId={() => setPendingMarketStoreId(null)}
          />
        )}
        {tab === 'b-chain' && <BChainView initialProductId={bchainProductId} />}
        {tab === 'b-ai' && (
          <BAiView
            apkMode={apkMode}
            initialPrompt={pendingAiPrompt}
            onConsumeInitialPrompt={() => setPendingAiPrompt(null)}
          />
        )}
        {tab === 'b-edu' && (
          <BEduCustomerView
            onRequestAuth={onOpenAuth}
            onOpenStoreInMarket={(storeId) => {
              setPendingMarketStoreId(storeId);
              setTab('b-market');
            }}
          />
        )}
        {tab === 'profile' && (
          <div className="space-y-4">
            {!isAuthenticated ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center max-w-lg mx-auto space-y-4">
                <BinaExpression mood="wave" className="w-24 h-24 mx-auto" />
                <h2 className="font-display text-xl font-extrabold text-[#1E293B]">
                  Masuk ke Akun Customer Anda
                </h2>
                <p className="text-xs sm:text-sm text-slate-600">
                  Kelola profil, pantau riwayat pesanan B-Market, simpan produk favorit, dan kumpulkan poin B-Edu.
                </p>
                <button
                  onClick={onOpenAuth}
                  className="px-6 py-3 rounded-xl bg-[#00A39D] hover:bg-[#006B68] text-white font-bold text-sm cursor-pointer"
                >
                  Masuk / Registrasi Sekarang
                </button>
              </div>
            ) : (
              <div className={`grid grid-cols-1 gap-4 ${apkMode ? '' : 'lg:grid-cols-12 gap-6'}`}>
                <div className={`${apkMode ? '' : 'lg:col-span-4'} space-y-4`}>
                  <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-soft-card space-y-4">
                    {isDemoMode && (
                      <div className="p-2.5 rounded-xl bg-[#F8AD3C]/15 border border-[#F8AD3C]/40 flex items-center justify-between gap-2 text-[11px]">
                        <span className="font-bold text-amber-900">Mode Demo APK (Data Dummy)</span>
                        <button
                          type="button"
                          onClick={onOpenAuth}
                          className="font-bold text-[#006B68] underline cursor-pointer"
                        >
                          Login Cloud
                        </button>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#00A39D]/10 text-[#006B68] flex items-center justify-center font-display font-extrabold text-lg">
                        {(userProfile?.displayName || 'C').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-display font-bold text-base text-[#1E293B] truncate">
                          {userProfile?.displayName}
                        </h3>
                        <p className="text-xs text-slate-500 truncate">{userProfile?.email}</p>
                        <p className="text-xs font-bold text-[#F8AD3C] mt-0.5 tabular-nums">
                          {userProfile?.points || 0} Poin B-Edu
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-slate-100">
                      {[
                        { id: 'orders', label: `Riwayat Pesanan (${orders.length})`, icon: Package },
                        { id: 'favorites', label: `Produk Favorit (${favorites.length})`, icon: Heart },
                        { id: 'reviews', label: 'Riwayat Ulasan', icon: Star },
                        { id: 'notif', label: `Notifikasi (${unreadNotifs})`, icon: Bell },
                        { id: 'info', label: 'Edit Profil Saya', icon: UserIcon },
                      ].map((s) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setProfileSection(s.id as typeof profileSection);
                            if (s.id === 'info') {
                              setEditName(userProfile?.displayName || '');
                              setEditPhone(userProfile?.phone || '');
                              setEditAddress(userProfile?.address || '');
                              setEditCity(userProfile?.city || '');
                            }
                          }}
                          className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 cursor-pointer ${
                            profileSection === s.id
                              ? 'bg-[#00A39D] text-white'
                              : 'text-slate-600 hover:bg-[#F4F6F6]'
                          }`}
                        >
                          <s.icon className="w-4 h-4" />
                          {s.label}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={logout}
                      className="w-full h-10 rounded-xl border border-rose-200 text-rose-600 font-bold text-xs inline-flex items-center justify-center gap-1.5 hover:bg-rose-50 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Keluar Akun
                    </button>
                  </div>
                </div>

                <div className={`${apkMode ? '' : 'lg:col-span-8'} bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-soft-card`}>
                  {profileSection === 'orders' && (
                    <div className="space-y-4">
                      <h3 className="font-display font-bold text-base text-[#1E293B]">
                        Riwayat Pesanan B-Market
                      </h3>
                      {orders.length === 0 ? (
                        <p className="text-xs text-slate-500 py-8 text-center">
                          Belum ada riwayat pembelian. Jelajahi B-Market untuk mulai berbelanja.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {orders.map((ord) => (
                            <div key={ord.id} className="p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <span className="font-mono font-bold text-[#006B68]">{ord.orderNumber}</span>
                                  <span className="mx-2 text-slate-300">·</span>
                                  <span className="font-semibold text-slate-700">{ord.storeName}</span>
                                </div>
                                <span className="font-bold text-[#00A39D]">{ord.status}</span>
                              </div>
                              <div className="text-slate-600 space-y-0.5">
                                {ord.items.map((it) => (
                                  <div key={it.productId} className="flex justify-between">
                                    <span>{it.productName} × {it.quantity}</span>
                                    <span className="tabular-nums">{formatRupiah(it.price * it.quantity)}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                                <span className="text-slate-400">{formatDateTime(ord.createdAt)} · {ord.paymentMethod}</span>
                                <span className="font-display font-extrabold text-sm text-[#1E293B] tabular-nums">
                                  Total: {formatRupiah(ord.total)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {profileSection === 'favorites' && (
                    <div className="space-y-4">
                      <h3 className="font-display font-bold text-base text-[#1E293B]">
                        Produk Favorit Saya
                      </h3>
                      {favorites.length === 0 ? (
                        <p className="text-xs text-slate-500 py-8 text-center">Belum ada produk favorit.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {favorites.map((fav) => {
                            const prod = products.find((p) => p.id === fav.productId);
                            if (!prod) return null;
                            return (
                              <div key={fav.id} className="p-3 rounded-2xl border border-slate-200 flex gap-3 items-center">
                                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                                  {prod.photoUrl ? (
                                    <img src={prod.photoUrl} alt={prod.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                  ) : (
                                    <ProductPlaceholder compact />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-bold text-[#00A39D] truncate">{prod.storeName}</p>
                                  <p className="text-xs font-bold text-slate-800 truncate">{prod.name}</p>
                                  <p className="text-xs font-bold text-[#006B68] tabular-nums">{formatRupiah(prod.price)}</p>
                                </div>
                                <button
                                  onClick={() => toggleFavorite(prod.id)}
                                  className="text-rose-500 p-1.5 cursor-pointer"
                                >
                                  <Heart className="w-4 h-4 fill-rose-500" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {profileSection === 'reviews' && (
                    <div className="space-y-4">
                      <h3 className="font-display font-bold text-base text-[#1E293B]">Riwayat Ulasan Saya</h3>
                      {reviews.filter((r) => r.userId === activeUid).length === 0 ? (
                        <p className="text-xs text-slate-500 py-8 text-center">Anda belum menulis ulasan produk.</p>
                      ) : (
                        <div className="space-y-3">
                          {reviews
                            .filter((r) => r.userId === activeUid)
                            .map((r) => {
                              const prod = products.find((p) => p.id === r.productId);
                              return (
                                <div key={r.id} className="p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1">
                                  <div className="flex justify-between">
                                    <strong className="text-[#006B68]">{prod?.name || 'Produk'}</strong>
                                    <span className="text-slate-400">{formatDateTime(r.createdAt)}</span>
                                  </div>
                                  <p className="text-amber-500 font-bold">Rating: {r.rating} / 5</p>
                                  <p className="text-slate-600">{r.comment}</p>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  )}

                  {profileSection === 'notif' && (
                    <div className="space-y-4">
                      <h3 className="font-display font-bold text-base text-[#1E293B]">Notifikasi</h3>
                      {notifications.length === 0 ? (
                        <p className="text-xs text-slate-500 py-8 text-center">Belum ada notifikasi.</p>
                      ) : (
                        <div className="space-y-2.5">
                          {notifications.map((n) => (
                            <button
                              key={n.id}
                              onClick={() => markNotificationRead(n.id)}
                              className={`w-full text-left p-3.5 rounded-2xl border text-xs flex items-start gap-3 cursor-pointer ${
                                n.isRead ? 'bg-white border-slate-100' : 'bg-[#00A39D]/5 border-[#00A39D]/30'
                              }`}
                            >
                              <BinaExpression mood="wave" className="w-10 h-10" />
                              <div className="flex-1">
                                <p className="font-bold text-[#1E293B]">{n.title}</p>
                                <p className="text-slate-600 mt-0.5">{n.message}</p>
                                <p className="text-[10px] text-slate-400 mt-1">{formatDateTime(n.createdAt)}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {profileSection === 'info' && (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        await updateProfile({
                          displayName: editName,
                          phone: editPhone,
                          address: editAddress,
                          city: editCity,
                        });
                      }}
                      className="space-y-4"
                    >
                      <h3 className="font-display font-bold text-base text-[#1E293B]">Edit Profil Customer</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap</label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">No. Telepon / HP Aktif</label>
                          <input
                            type="tel"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Kota</label>
                          <input
                            type="text"
                            value={editCity}
                            onChange={(e) => setEditCity(e.target.value)}
                            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Pengiriman</label>
                          <input
                            type="text"
                            value={editAddress}
                            onChange={(e) => setEditAddress(e.target.value)}
                            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="px-6 h-11 rounded-xl bg-[#00A39D] hover:bg-[#006B68] text-white font-bold text-sm cursor-pointer"
                      >
                        Simpan Perubahan
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar: B-Market, B-Chain, B-AI, B-Edu, Profile */}
      <nav
        className={`${
          apkMode ? 'flex' : 'md:hidden grid'
        } fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 grid grid-cols-5 h-16`}
      >
        {navItems.map((n) => {
          const active = tab === n.id;
          return (
            <button
              key={n.id}
              onClick={() => setTab(n.id)}
              className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                active ? 'text-[#00A39D]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {active && <span className="absolute top-0 w-8 h-0.5 rounded-full bg-[#00A39D]" />}
              <n.icon className="w-5 h-5" />
              <span className="text-[10px] font-bold">{n.label}</span>
              {n.id === 'profile' && unreadNotifs > 0 && (
                <span className="absolute top-2 right-5 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
