import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Coffee,
  Cookie,
  Film,
  Flame,
  Heart,
  History,
  Image as ImageIcon,
  LayoutGrid,
  MapPin,
  MessageCircle,
  Minus,
  Package,
  Play,
  Plus,
  Search,
  Send,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Star,
  Store,
  Trash2,
  Upload,
  Utensils,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { BinaExpression, ProductPlaceholder } from '../BinaMascot.tsx';
import { compressImageToDataUrl, formatDate, formatDateTime, formatRupiah } from '../../lib/utils.ts';
import type { Order, Product, UmkmStore } from '../../types.ts';

interface BMarketViewProps {
  onNavigateBChain: (productId?: string) => void;
  onAskBAi?: (prompt?: string) => void;
  onRequestAuth: () => void;
  apkMode?: boolean;
  initialStoreId?: string | null;
  onConsumeInitialStoreId?: () => void;
}

export const BMarketView: React.FC<BMarketViewProps> = ({
  onNavigateBChain,
  onAskBAi,
  onRequestAuth,
  apkMode = false,
  initialStoreId,
  onConsumeInitialStoreId,
}) => {
  const {
    isAuthenticated,
    activeUid,
    userProfile,
    stores,
    categories,
    products,
    reviews,
    favorites,
    cart,
    storeChats,
    voucherRedemptions,
    settings,
    toggleFavorite,
    addToCart,
    updateCartQty,
    removeFromCart,
    placeOrder,
    submitReview,
    sendStoreChatMessage,
    showToast,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [sortTab, setSortTab] = useState<'rekomendasi' | 'terbaru' | 'terlaris' | 'favorit'>('rekomendasi');
  const [activeStoreId, setActiveStoreId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [detailMediaMode, setDetailMediaMode] = useState<'photo' | 'video'>('photo');
  const [videoShowcaseProductId, setVideoShowcaseProductId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    if (initialStoreId) {
      setActiveStoreId(initialStoreId);
      setSelectedProductId(null);
      onConsumeInitialStoreId?.();
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [initialStoreId, onConsumeInitialStoreId]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);

  // Direct In-App Store Chat state
  const [chatTarget, setChatTarget] = useState<{
    storeId: string;
    storeName: string;
    product?: Product | null;
  } | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Checkout state
  const [recipientName, setRecipientName] = useState(userProfile?.displayName || '');
  const [recipientPhone, setRecipientPhone] = useState(userProfile?.phone || '');
  const [shippingAddress, setShippingAddress] = useState(userProfile?.address || '');
  const [paymentMethod, setPaymentMethod] = useState('BSI Virtual Account');
  const [selectedVoucherId, setSelectedVoucherId] = useState('');
  const [checkingOut, setCheckingOut] = useState(false);

  // Review state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewPhoto, setReviewPhoto] = useState<string | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  const publishedProducts = useMemo(
    () => products.filter((p) => p.isPublished),
    [products]
  );

  const favoriteIds = useMemo(
    () => new Set(favorites.map((f) => f.productId)),
    [favorites]
  );

  const videoProducts = useMemo(
    () => publishedProducts.filter((p) => Boolean(p.videoUrl)),
    [publishedProducts]
  );

  const filteredProducts = useMemo(() => {
    let list = [...publishedProducts];
    if (activeStoreId) {
      list = list.filter((p) => p.storeId === activeStoreId);
    }
    if (selectedCategory !== 'Semua') {
      list = list.filter((p) => p.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.storeName.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }
    if (sortTab === 'favorit') {
      list = list.filter((p) => favoriteIds.has(p.id));
    } else if (sortTab === 'terbaru') {
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } else if (sortTab === 'terlaris') {
      list.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0));
    } else {
      list.sort((a, b) => {
        const scoreA = (a.bchainStatus === 'VERIFIED' ? 10 : 0) + (a.ratingAvg || 0);
        const scoreB = (b.bchainStatus === 'VERIFIED' ? 10 : 0) + (b.ratingAvg || 0);
        return scoreB - scoreA;
      });
    }
    return list;
  }, [publishedProducts, activeStoreId, selectedCategory, searchQuery, sortTab, favoriteIds]);

  const activeStore: UmkmStore | undefined = stores.find((s) => s.id === activeStoreId);
  const selectedProduct: Product | undefined = products.find((p) => p.id === selectedProductId);
  const videoShowcaseProduct: Product | undefined = products.find((p) => p.id === videoShowcaseProductId);

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const cartSubtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const activeVouchers = voucherRedemptions.filter((v) => v.status === 'Aktif');
  const selectedVoucherObj = activeVouchers.find((v) => v.id === selectedVoucherId);
  const voucherDiscount = useMemo(() => {
    if (!selectedVoucherObj) return 0;
    const t = selectedVoucherObj.voucherTitle.toLowerCase();
    if (t.includes('50.000')) return Math.min(cartSubtotal, 50000);
    if (t.includes('20.000')) return Math.min(cartSubtotal, 20000);
    return Math.min(cartSubtotal, 15000);
  }, [selectedVoucherObj, cartSubtotal]);
  const checkoutTotal = Math.max(0, cartSubtotal - voucherDiscount);

  const storeCityMap = useMemo(() => {
    const map = new Map<string, string>();
    stores.forEach((s) => {
      if (s.city) map.set(s.id, s.city);
    });
    return map;
  }, [stores]);

  const promoHighlights = useMemo(
    () =>
      [...publishedProducts]
        .filter((p) => p.price && (p.stock ?? 0) > 0)
        .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
        .slice(0, 6),
    [publishedProducts]
  );

  const activeChatMessages = useMemo(() => {
    if (!chatTarget) return [];
    const uid = activeUid || 'demo-customer-01';
    return storeChats
      .filter((m) => m.storeId === chatTarget.storeId && m.customerUid === uid)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }, [chatTarget, storeChats, activeUid]);

  const openProductDetail = (productId: string, initialMedia: 'photo' | 'video' = 'photo') => {
    setSelectedProductId(productId);
    setDetailMediaMode(initialMedia);
  };

  const openDirectStoreChat = (storeId: string, storeName: string, product?: Product | null) => {
    if (!isAuthenticated) {
      onRequestAuth();
      return;
    }
    setChatTarget({ storeId, storeName, product: product || null });
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleSendStoreChat = async (customText?: string) => {
    if (!chatTarget || !activeUid) return;
    const textToSend = (customText ?? chatInput).trim();
    if (!textToSend) return;
    setSendingChat(true);
    if (!customText) setChatInput('');
    await sendStoreChatMessage({
      storeId: chatTarget.storeId,
      storeName: chatTarget.storeName,
      customerUid: activeUid,
      customerName: userProfile?.displayName || 'Pelanggan B-Market',
      productId: chatTarget.product?.id || null,
      productName: chatTarget.product?.name || null,
      senderRole: 'customer',
      text: textToSend,
    });
    setSendingChat(false);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
  };

  const handleOpenCheckout = () => {
    if (!isAuthenticated) {
      onRequestAuth();
      return;
    }
    setRecipientName(userProfile?.displayName || '');
    setRecipientPhone(userProfile?.phone || '');
    setShippingAddress(userProfile?.address || '');
    setCartOpen(false);
    setCheckoutOpen(true);
  };

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim() || !recipientPhone.trim() || !shippingAddress.trim()) {
      showToast('Lengkapi nama penerima, nomor telepon, dan alamat pengiriman.', 'error');
      return;
    }
    setCheckingOut(true);
    const created = await placeOrder({
      customerName: recipientName.trim(),
      customerPhone: recipientPhone.trim(),
      shippingAddress: shippingAddress.trim(),
      paymentMethod,
      voucherRedemptionId: selectedVoucherId || undefined,
    });
    setCheckingOut(false);
    if (created) {
      setCheckoutOpen(false);
      setSuccessOrder(created);
    }
  };

  const handleBuyNow = async (product: Product) => {
    if (!isAuthenticated) {
      onRequestAuth();
      return;
    }
    await addToCart(product, 1);
    if (product.price !== null && product.price > 0 && product.stock !== null && product.stock > 0) {
      setSelectedProductId(null);
      setCartOpen(true);
    }
  };

  const handleReviewPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageToDataUrl(file, 600, 0.72);
      setReviewPhoto(compressed);
    } catch (err: any) {
      showToast(err?.message || 'Gagal mengunggah foto ulasan.', 'error');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (!isAuthenticated) {
      onRequestAuth();
      return;
    }
    if (!reviewComment.trim()) {
      showToast('Tuliskan ulasan Anda terlebih dahulu.', 'error');
      return;
    }
    setSubmittingReview(true);
    await submitReview(
      selectedProduct.id,
      selectedProduct.storeId,
      reviewRating,
      reviewComment.trim(),
      reviewPhoto
    );
    setSubmittingReview(false);
    setReviewComment('');
    setReviewPhoto(null);
    setReviewRating(5);
  };

  const selectedProductReviews = useMemo(() => {
    if (!selectedProduct) return [];
    return reviews
      .filter((r) => r.productId === selectedProduct.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [reviews, selectedProduct]);

  return (
    <div className="space-y-6">
      {/* Storefront Dedicated View OR Marketplace Home */}
      {activeStore ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setActiveStoreId(null)}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#006B68] hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke B-Market
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => openDirectStoreChat(activeStore.id, activeStore.name)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#00A39D] hover:bg-[#006B68] text-white text-xs font-bold cursor-pointer shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                Chat Penjual
              </button>
              <button
                onClick={() => setCartOpen(true)}
                className="relative inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 hover:border-[#00A39D] cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4 text-[#00A39D]" />
                <span>Keranjang</span>
                {cartCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-[#F8AD3C] text-slate-900 text-xs font-bold tabular-nums">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Store Header Card (No WhatsApp Number Exposed — In-App Chat Instead) */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-7 shadow-soft-card">
            <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 shrink-0">
                {activeStore.photoUrl ? (
                  <img
                    src={activeStore.photoUrl}
                    alt={activeStore.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ProductPlaceholder title={activeStore.name} compact isStore />
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-2xl font-extrabold text-[#1E293B]">
                    {activeStore.name}
                  </h1>
                  {activeStore.isVerifiedUmkm && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#00A39D]">
                      <BadgeCheck className="w-4 h-4" /> UMKM Binaan Terverifikasi
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span>{activeStore.category}</span>
                  {activeStore.foundedYear && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-[#006B68]">
                        <Calendar className="w-3.5 h-3.5 text-[#00A39D]" />
                        Berdiri sejak {activeStore.foundedYear}
                      </span>
                    </>
                  )}
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {activeStore.city || 'Indonesia'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 text-amber-600 font-semibold tabular-nums">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {activeStore.ratingAvg > 0 ? activeStore.ratingAvg : '4.9'} ({reviews.filter((r) => r.storeId === activeStore.id).length} ulasan)
                  </span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed pt-1">
                  {activeStore.description || 'Produk unggulan UMKM binaan resmi BSI UMKM Center.'}
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-500">
                  <span>
                    Pemilik: <strong className="text-slate-700">{activeStore.ownerName || 'Pemilik UMKM'}</strong>
                  </span>
                  <span>
                    Legalitas: <strong className="text-slate-700">{activeStore.legalitySummary || 'Terdaftar Binaan BSI'}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => openDirectStoreChat(activeStore.id, activeStore.name)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00A39D]/10 text-[#006B68] font-bold hover:bg-[#00A39D]/20 cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Tanya Penjual via Chat B-Market
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sejarah Berdirinya UMKM & Jejak Langkah */}
          <section className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-7 shadow-soft-card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#00A39D]/10 text-[#006B68] flex items-center justify-center shrink-0">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#00A39D]">
                    Profil & Sejarah UMKM
                  </p>
                  <h2 className="font-display text-lg font-extrabold text-[#1E293B]">
                    Sejarah Berdirinya {activeStore.name}
                  </h2>
                </div>
              </div>
              {activeStore.foundedYear && (
                <span className="px-3 py-1.5 rounded-xl bg-[#F8AD3C]/15 text-[#8B5300] text-xs font-extrabold tabular-nums">
                  Berdiri Tahun {activeStore.foundedYear}
                </span>
              )}
            </div>

            <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-[#F8FAFB] rounded-2xl p-4 sm:p-5 border border-slate-100">
              {activeStore.foundingStory ||
                `${activeStore.name} dirintis oleh ${activeStore.ownerName || 'pelaku usaha lokal'} di ${activeStore.city || 'Indonesia'} dengan semangat menghadirkan produk lokal berkualitas dan terstandar halal bersama pendampingan BSI UMKM Center.`}
            </div>

            {activeStore.milestones && activeStore.milestones.length > 0 && (
              <div className="space-y-2.5 pt-1">
                <p className="text-xs font-extrabold text-[#006B68]">Jejak Perjalanan & Tonggak Pertumbuhan:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {activeStore.milestones.map((ms, idx) => (
                    <div
                      key={`${ms.year}-${idx}`}
                      className="p-3.5 rounded-2xl bg-[#F4F6F6] border border-slate-200/70 space-y-1"
                    >
                      <span className="inline-block text-[11px] font-extrabold text-[#00A39D] tabular-nums">
                        {ms.year}
                      </span>
                      <h3 className="font-display font-bold text-xs text-[#1E293B]">{ms.title}</h3>
                      <p className="text-[11px] text-slate-600 leading-relaxed">{ms.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Store Products */}
          {(() => {
            const storeProducts = publishedProducts.filter((p) => p.storeId === activeStore.id);
            const storeReviews = reviews
              .filter((r) => r.storeId === activeStore.id)
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

            return (
              <>
                <div>
                  <h2 className="font-display text-lg font-bold text-[#1E293B] mb-4">
                    Etalase Produk {activeStore.name} ({storeProducts.length})
                  </h2>
                  {storeProducts.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                      <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-700">Belum ada produk dipublikasikan</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Pemilik toko dapat menambahkan produk melalui fitur B-Save.
                      </p>
                    </div>
                  ) : (
                    <div className={apkMode ? 'grid grid-cols-2 gap-2.5' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'}>
                      {storeProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          reviewCount={reviews.filter((r) => r.productId === product.id).length || product.reviewCount}
                          compact={apkMode}
                          isLiked={favoriteIds.has(product.id)}
                          onToggleLike={() => toggleFavorite(product.id)}
                          onOpenDetail={() => openProductDetail(product.id, 'photo')}
                          onOpenVideo={() => setVideoShowcaseProductId(product.id)}
                          onChatSeller={() => openDirectStoreChat(product.storeId, product.storeName, product)}
                          onAddToCart={() => addToCart(product, 1)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Store Reviews */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft-card">
                  <h3 className="font-display text-base font-bold text-[#1E293B] mb-3">
                    Ulasan Pelanggan Toko {activeStore.name} ({storeReviews.length})
                  </h3>
                  {storeReviews.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      Belum ada ulasan untuk toko ini. Jadilah yang pertama mengulas produk {activeStore.name}.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {storeReviews.map((rev) => {
                        const prodName = products.find((p) => p.id === rev.productId)?.name;
                        return (
                          <div key={rev.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-800">{rev.userName}</span>
                                <span className="text-[10px] font-semibold text-[#00A39D]">Pembeli Terverifikasi</span>
                              </div>
                              <span className="text-slate-400">{formatDate(rev.createdAt)}</span>
                            </div>
                            {prodName && (
                              <p className="text-[11px] font-semibold text-[#006B68] mt-0.5">Produk: {prodName}</p>
                            )}
                            <div className="flex items-center gap-0.5 my-1">
                              {[1, 2, 3, 4, 5].map((n) => (
                                <Star
                                  key={n}
                                  className={`w-3.5 h-3.5 ${n <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                                />
                              ))}
                            </div>
                            <p className="text-xs text-slate-600">{rev.comment}</p>
                            {rev.photoUrl && (
                              <img
                                src={rev.photoUrl}
                                alt={`Foto ulasan ${prodName || 'produk'}`}
                                referrerPolicy="no-referrer"
                                className="mt-2 w-20 h-20 rounded-lg object-cover border border-slate-200"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      ) : (
        <>
          {/* Top Search, Chat Toko & Cart Row */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#00A39D] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari Parfum BOTEGA, Shibori Windrasari, Botok Pepes, Stik Kentang..."
                className="w-full h-12 pl-11 pr-4 rounded-full bg-white border border-slate-200 text-sm focus:outline-none focus:border-[#00A39D] shadow-sm"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => openDirectStoreChat(stores[0]?.id || 'botega', stores[0]?.name || 'BOTEGA')}
                className="h-12 px-4 rounded-full bg-white border border-slate-200 hover:border-[#00A39D] flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold text-[#006B68] shadow-sm cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-[#00A39D]" />
                <span>Chat Penjual</span>
              </button>
              <button
                onClick={() => setCartOpen(true)}
                className="h-12 px-4 sm:px-5 rounded-full bg-white border border-slate-200 hover:border-[#00A39D] flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-[#1E293B] shadow-sm cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4 text-[#00A39D]" />
                <span>Keranjang</span>
                <span className="px-2 py-0.5 rounded-full bg-[#F8AD3C] text-slate-900 text-xs font-extrabold tabular-nums">
                  {cartCount}
                </span>
              </button>
            </div>
          </div>

          {/* Promo Hero Banner */}
          <div
            className={`rounded-3xl bg-gradient-to-r from-[#006B68] via-[#00A39D] to-[#0D9488] text-white shadow-soft-card flex flex-col ${
              apkMode ? 'p-4 gap-3' : 'p-5 sm:p-7 md:flex-row items-center justify-between gap-5'
            }`}
          >
            <div className="space-y-1.5 max-w-xl">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#F8AD3C]">
                B-Market · Promo & Kurasi Resmi
              </p>
              <h2 className={`font-display font-extrabold leading-snug text-balance ${apkMode ? 'text-lg' : 'text-xl sm:text-2xl'}`}>
                {settings.promoBannerTitle}
              </h2>
              <p className="text-xs text-white/90 leading-relaxed">
                {settings.promoBannerSubtitle}
              </p>
              <div className="pt-1.5 flex flex-wrap gap-2">
                <button
                  onClick={() => onNavigateBChain()}
                  className="px-3.5 py-2 rounded-full bg-white text-[#006B68] font-bold text-[11px] inline-flex items-center gap-1.5 hover:bg-slate-50 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Cek Verifikasi B-CHAIN
                </button>
                <button
                  onClick={() => {
                    if (videoProducts[0]) setVideoShowcaseProductId(videoProducts[0].id);
                  }}
                  className="px-3.5 py-2 rounded-full bg-[#F8AD3C] text-slate-900 font-bold text-[11px] inline-flex items-center gap-1.5 hover:bg-[#e59a28] cursor-pointer"
                >
                  <Film className="w-3.5 h-3.5" />
                  Tonton Video Produk
                </button>
                {onAskBAi && (
                  <button
                    onClick={() =>
                      onAskBAi('Rekomendasikan produk unggulan BOTEGA, Windrasari, Lanjar Jaya / Bopes, dan Puya Kitchen beserta harganya!')
                    }
                    className="px-3.5 py-2 rounded-full bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-[11px] inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#F8AD3C]" />
                    Tanya BINA AI
                  </button>
                )}
              </div>
            </div>
            {!apkMode && (
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-3.5 shrink-0">
                <BinaExpression mood="wave" className="w-16 h-16" />
                <div className="max-w-[190px]">
                  <p className="text-xs font-bold text-[#F8AD3C]">Info BINA</p>
                  <p className="text-[11px] text-white/90 leading-snug">
                    Tonton video asli tiap produk, baca ulasan pelanggan, dan chat penjual langsung di B-Market!
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Marketplace Quick Category Strip */}
          <section className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[
              { label: 'Semua', value: 'Semua', icon: LayoutGrid },
              { label: 'Parfum', value: 'Parfum & Pewangi', icon: Sparkles },
              { label: 'Kriya Shibori', value: 'Kriya & Fesyen', icon: Store },
              { label: 'Kuliner', value: 'Kuliner & Makanan', icon: Utensils },
              { label: 'Camilan', value: 'Kue & Camilan', icon: Cookie },
              { label: 'Minuman', value: 'Minuman & Herbal', icon: Coffee },
            ].map((item) => {
              const active = selectedCategory === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setSelectedCategory(item.value)}
                  className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all cursor-pointer ${
                    active
                      ? 'bg-[#00A39D] text-white border-[#00A39D] shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200/80 hover:border-[#00A39D]'
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${active ? 'text-[#F8AD3C]' : 'text-[#00A39D]'}`} />
                  <span className="text-[10px] font-bold leading-tight line-clamp-1">{item.label}</span>
                </button>
              );
            })}
          </section>

          {/* Video Konten Per Produk Carousel */}
          {videoProducts.length > 0 && !searchQuery.trim() && (
            <section className="bg-white rounded-3xl border border-slate-200/80 p-3.5 sm:p-4 shadow-soft-card space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-[#00A39D]" />
                  <h3 className="font-display font-extrabold text-sm text-[#1E293B]">
                    Konten Video Produk UMKM ({videoProducts.length})
                  </h3>
                </div>
                <span className="text-[10px] font-semibold text-slate-500">Klik untuk putar video</span>
              </div>
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {videoProducts.map((vp) => (
                  <button
                    key={`vid-${vp.id}`}
                    type="button"
                    onClick={() => setVideoShowcaseProductId(vp.id)}
                    className="w-36 sm:w-40 shrink-0 rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 relative group text-left cursor-pointer hover:border-[#00A39D]"
                  >
                    <div className="aspect-[4/3] relative overflow-hidden">
                      <img
                        src={vp.photoUrl || ''}
                        alt={vp.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent flex flex-col justify-between p-2">
                        <span className="self-end w-7 h-7 rounded-full bg-[#00A39D] text-white flex items-center justify-center shadow">
                          <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                        </span>
                        <div>
                          <p className="text-[9px] font-bold text-[#F8AD3C] truncate">{vp.storeName}</p>
                          <p className="text-[10px] font-bold text-white line-clamp-1">{vp.name}</p>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Flash Promo / Pilihan Terlaris BINA */}
          {promoHighlights.length > 0 && !searchQuery.trim() && selectedCategory === 'Semua' && (
            <section className="bg-gradient-to-r from-[#FFF8EB] via-white to-[#EEF9F8] rounded-3xl border border-[#F8AD3C]/40 p-3.5 sm:p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-[#F8AD3C] fill-[#F8AD3C]" />
                  <h3 className="font-display font-extrabold text-sm text-[#1E293B]">
                    Pilihan Terlaris BINA Hari Ini
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSortTab('terlaris')}
                  className="text-[11px] font-bold text-[#006B68] hover:underline cursor-pointer"
                >
                  Lihat Semua →
                </button>
              </div>
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {promoHighlights.map((p) => (
                  <div
                    key={`promo-${p.id}`}
                    onClick={() => openProductDetail(p.id, 'photo')}
                    className="w-44 shrink-0 bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm hover:border-[#00A39D] cursor-pointer flex flex-col justify-between"
                  >
                    <div className="relative h-24 bg-[#F4F6F6]">
                      {p.photoUrl ? (
                        <img
                          src={p.photoUrl}
                          alt={p.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ProductPlaceholder title={p.name} compact />
                      )}
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-[#F8AD3C] text-slate-900 text-[9px] font-extrabold">
                        Terlaris · {p.soldCount}+
                      </span>
                    </div>
                    <div className="p-2.5 space-y-1">
                      <p className="text-[11px] font-bold text-[#1E293B] line-clamp-1">{p.name}</p>
                      <p className="text-xs font-extrabold text-[#006B68] tabular-nums">{formatRupiah(p.price)}</p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(p, 1);
                        }}
                        className="w-full py-1 rounded-lg bg-[#00A39D]/10 hover:bg-[#00A39D] text-[#006B68] hover:text-white text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        + Keranjang Cepat
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 5 Initial & Registered UMKM Storefronts Directory */}
          <section>
            <div className="flex items-center justify-between mb-2.5">
              <div>
                <h3 className={`font-display font-extrabold text-[#1E293B] ${apkMode ? 'text-base' : 'text-lg'}`}>
                  Toko UMKM Binaan ({stores.length})
                </h3>
                {!apkMode && (
                  <p className="text-xs text-slate-500">
                    Kunjungi etalase masing-masing UMKM atau chat langsung dengan penjual tanpa nomor WA eksternal
                  </p>
                )}
              </div>
            </div>
            <div
              className={
                apkMode
                  ? 'flex gap-2.5 overflow-x-auto pb-1'
                  : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3'
              }
            >
              {stores.map((store) => {
                const count = publishedProducts.filter((p) => p.storeId === store.id).length;
                return (
                  <div
                    key={store.id}
                    onClick={() => setActiveStoreId(store.id)}
                    className={`${
                      apkMode ? 'w-40 shrink-0 p-3' : 'p-4'
                    } bg-white rounded-2xl border border-slate-200/80 text-left hover:border-[#00A39D] hover:shadow-soft-card transition-all group cursor-pointer flex flex-col justify-between`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-100 bg-[#F4F6F6] flex items-center justify-center shrink-0">
                          {store.photoUrl ? (
                            <img
                              src={store.photoUrl}
                              alt={store.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Store className="w-4 h-4 text-[#00A39D]" />
                          )}
                        </div>
                        {store.isVerifiedUmkm && (
                          <BadgeCheck className="w-4 h-4 text-[#00A39D]" aria-label="Terverifikasi" />
                        )}
                      </div>
                      <h4 className="font-display font-bold text-xs sm:text-sm text-[#1E293B] group-hover:text-[#00A39D] transition-colors line-clamp-1">
                        {store.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                        {store.category}{store.foundedYear ? ` · Berdiri ${store.foundedYear}` : ''}
                      </p>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-semibold text-[#006B68]">
                      <span>{count} Produk</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDirectStoreChat(store.id, store.name);
                        }}
                        className="inline-flex items-center gap-0.5 text-[#00A39D] hover:underline cursor-pointer"
                      >
                        <MessageCircle className="w-3 h-3" /> Chat
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Filters & Segmented Tabs */}
          <section className="space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl overflow-x-auto">
                {[
                  { id: 'rekomendasi', label: 'Rekomendasi' },
                  { id: 'terbaru', label: 'Produk Terbaru' },
                  { id: 'terlaris', label: 'Produk Terlaris' },
                  { id: 'favorit', label: `Favorit (${favorites.length})` },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSortTab(t.id as typeof sortTab)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                      sortTab === t.id
                        ? 'bg-[#00A39D] text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                <button
                  onClick={() => setSelectedCategory('Semua')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border cursor-pointer ${
                    selectedCategory === 'Semua'
                      ? 'bg-[#006B68] text-white border-[#006B68]'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-[#00A39D]'
                  }`}
                >
                  Semua Kategori
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border cursor-pointer ${
                      selectedCategory === cat.name
                        ? 'bg-[#006B68] text-white border-[#006B68]'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-[#00A39D]'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Grid */}
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
                <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">Tidak ada produk yang sesuai filter</p>
                <p className="text-xs text-slate-500 mt-1">
                  Coba ubah kata kunci pencarian atau pilih kategori lain.
                </p>
              </div>
            ) : (
              <div className={apkMode ? 'grid grid-cols-2 gap-2.5' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'}>
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    reviewCount={reviews.filter((r) => r.productId === product.id).length || product.reviewCount}
                    city={storeCityMap.get(product.storeId)}
                    compact={apkMode}
                    isLiked={favoriteIds.has(product.id)}
                    onToggleLike={() => toggleFavorite(product.id)}
                    onOpenDetail={() => openProductDetail(product.id, 'photo')}
                    onOpenVideo={() => setVideoShowcaseProductId(product.id)}
                    onChatSeller={() => openDirectStoreChat(product.storeId, product.storeName, product)}
                    onAddToCart={() => addToCart(product, 1)}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* Video Showcase Modal per Product */}
      {videoShowcaseProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-[#00A39D] flex items-center gap-1">
                  <Film className="w-3 h-3" /> Video Produk · {videoShowcaseProduct.storeName}
                </p>
                <h3 className="font-display font-bold text-sm text-[#1E293B] truncate">
                  {videoShowcaseProduct.videoTitle || videoShowcaseProduct.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setVideoShowcaseProductId(null)}
                aria-label="Tutup video produk"
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer shrink-0"
              >
                <X className="w-4 h-4 text-slate-700" />
              </button>
            </div>
            <div className="bg-slate-950 aspect-[4/3] relative">
              {videoShowcaseProduct.videoUrl ? (
                <video
                  key={videoShowcaseProduct.videoUrl}
                  src={videoShowcaseProduct.videoUrl}
                  poster={videoShowcaseProduct.photoUrl || undefined}
                  controls
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={videoShowcaseProduct.photoUrl || ''}
                  alt={videoShowcaseProduct.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-display font-bold text-sm text-[#1E293B] truncate">{videoShowcaseProduct.name}</p>
                  <p className="font-display font-extrabold text-base text-[#006B68] tabular-nums">
                    {formatRupiah(videoShowcaseProduct.price)}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 shrink-0">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {videoShowcaseProduct.ratingAvg || 4.9}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const p = videoShowcaseProduct;
                    setVideoShowcaseProductId(null);
                    openDirectStoreChat(p.storeId, p.storeName, p);
                  }}
                  className="h-10 rounded-xl border border-[#00A39D] text-[#006B68] text-xs font-bold inline-flex items-center justify-center gap-1 cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> Chat
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const id = videoShowcaseProduct.id;
                    setVideoShowcaseProductId(null);
                    openProductDetail(id, 'video');
                  }}
                  className="h-10 rounded-xl bg-[#F4F6F6] hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer"
                >
                  Ulasan & Detail
                </button>
                <button
                  type="button"
                  onClick={() => addToCart(videoShowcaseProduct, 1)}
                  className="h-10 rounded-xl bg-[#00A39D] hover:bg-[#006B68] text-white text-xs font-bold cursor-pointer"
                >
                  + Keranjang
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-100 px-5 py-3.5 flex items-center justify-between z-10">
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-[#00A39D] truncate">{selectedProduct.storeName}</p>
                <h3 className="font-display font-extrabold text-base text-[#1E293B] truncate">
                  {selectedProduct.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedProductId(null)}
                aria-label="Tutup detail produk"
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4 text-slate-700" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  {/* Photo vs Video Toggle */}
                  {selectedProduct.videoUrl && (
                    <div className="flex items-center gap-1.5 p-1 bg-[#F4F6F6] rounded-xl">
                      <button
                        type="button"
                        onClick={() => setDetailMediaMode('photo')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                          detailMediaMode === 'photo' ? 'bg-white text-[#006B68] shadow-sm' : 'text-slate-600'
                        }`}
                      >
                        <ImageIcon className="w-3.5 h-3.5" /> Foto Produk
                      </button>
                      <button
                        type="button"
                        onClick={() => setDetailMediaMode('video')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                          detailMediaMode === 'video' ? 'bg-[#00A39D] text-white shadow-sm' : 'text-slate-600'
                        }`}
                      >
                        <Film className="w-3.5 h-3.5" /> Video Produk
                      </button>
                    </div>
                  )}

                  <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200 bg-[#F4F6F6] relative">
                    {detailMediaMode === 'video' && selectedProduct.videoUrl ? (
                      <video
                        key={selectedProduct.videoUrl}
                        src={selectedProduct.videoUrl}
                        poster={selectedProduct.photoUrl || undefined}
                        controls
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover bg-slate-950"
                      />
                    ) : selectedProduct.photoUrl ? (
                      <img
                        src={selectedProduct.photoUrl}
                        alt={selectedProduct.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ProductPlaceholder title={selectedProduct.name} />
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                    <span>{selectedProduct.category}</span>
                    <button
                      onClick={() => onNavigateBChain(selectedProduct.id)}
                      className="inline-flex items-center gap-1 font-bold text-[#00A39D] hover:underline cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      B-CHAIN: {selectedProduct.bchainStatus}
                    </button>
                  </div>

                  <h2 className="font-display text-xl font-extrabold text-[#1E293B]">
                    {selectedProduct.name}
                  </h2>

                  <p className="font-display text-2xl font-extrabold text-[#006B68] tabular-nums">
                    {formatRupiah(selectedProduct.price)}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-slate-600 tabular-nums">
                    <span className="inline-flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {selectedProduct.ratingAvg > 0 ? selectedProduct.ratingAvg : '4.9'} (
                      {selectedProductReviews.length || selectedProduct.reviewCount} ulasan)
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Terjual {selectedProduct.soldCount || 0}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      Stok: {selectedProduct.stock !== null ? `${selectedProduct.stock} unit` : 'Belum diperbarui'}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {selectedProduct.description}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveStoreId(selectedProduct.storeId);
                        setSelectedProductId(null);
                      }}
                      className="p-2.5 rounded-xl bg-[#F4F6F6] hover:bg-slate-200/70 flex items-center justify-between text-xs cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5 font-bold text-[#1E293B] truncate">
                        <Store className="w-4 h-4 text-[#00A39D] shrink-0" />
                        {selectedProduct.storeName}
                      </span>
                      <span className="text-[#006B68] font-semibold shrink-0">Toko →</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const prod = selectedProduct;
                        setSelectedProductId(null);
                        openDirectStoreChat(prod.storeId, prod.storeName, prod);
                      }}
                      className="p-2.5 rounded-xl bg-[#EEF9F8] hover:bg-[#00A39D]/20 border border-[#00A39D]/30 flex items-center justify-center gap-1.5 text-xs font-bold text-[#006B68] cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4 text-[#00A39D]" />
                      Chat Penjual Langsung
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <button
                      onClick={() => addToCart(selectedProduct, 1)}
                      className="h-11 rounded-xl border-2 border-[#00A39D] text-[#006B68] font-bold text-xs sm:text-sm hover:bg-[#00A39D]/5 cursor-pointer"
                    >
                      + Keranjang
                    </button>
                    <button
                      onClick={() => handleBuyNow(selectedProduct)}
                      className="h-11 rounded-xl bg-[#F8AD3C] hover:bg-[#e59a28] text-slate-900 font-bold text-xs sm:text-sm cursor-pointer"
                    >
                      Beli Sekarang
                    </button>
                  </div>
                  {onAskBAi && (
                    <button
                      type="button"
                      onClick={() => {
                        const p = selectedProduct;
                        setSelectedProductId(null);
                        onAskBAi(
                          `Jelaskan keunggulan, komposisi, stok, dan status verifikasi B-CHAIN untuk produk "${p.name}" dari toko ${p.storeName}.`
                        );
                      }}
                      className="w-full h-10 rounded-xl bg-[#F4F6F6] hover:bg-[#00A39D]/10 border border-slate-200 text-xs font-bold text-[#006B68] inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#F8AD3C]" />
                      Tanya BINA AI tentang Produk Ini
                    </button>
                  )}
                </div>
              </div>

              {/* Detailed Specs & Traceability Table */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#F4F6F6] rounded-2xl p-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Komposisi</span>
                  <strong className="text-slate-800">{selectedProduct.composition || 'Belum diisi pemilik toko'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Spesifikasi</span>
                  <strong className="text-slate-800">{selectedProduct.specifications || 'Belum diisi pemilik toko'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Tanggal Produksi</span>
                  <strong className="text-slate-800">{selectedProduct.productionDate || 'Belum diisi pemilik toko'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Masa Simpan / Kedaluwarsa</span>
                  <strong className="text-slate-800">{selectedProduct.expiryDate || 'Belum diisi pemilik toko'}</strong>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-500 block">Nomor Legalitas / Sertifikasi</span>
                  <strong className="text-slate-800">{selectedProduct.legalityNumber || 'Belum diisi pemilik toko'}</strong>
                </div>
              </div>

              {/* Product Reviews & Add Review Form */}
              <div className="border-t border-slate-100 pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-base text-[#1E293B]">
                    Ulasan & Rating Pelanggan ({selectedProductReviews.length})
                  </h4>
                  <div className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {selectedProduct.ratingAvg || 4.9} / 5.0
                  </div>
                </div>

                <form onSubmit={handleSubmitReview} className="bg-[#F8FAFB] rounded-2xl p-4 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Berikan Ulasan Anda</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="p-0.5 cursor-pointer"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    rows={2}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Bagikan pengalaman Anda mengenai produk ini..."
                    className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#00A39D]"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#006B68] cursor-pointer hover:underline">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{reviewPhoto ? 'Foto Ulasan Terlampir' : 'Unggah Foto Ulasan'}</span>
                      <input type="file" accept="image/*" onChange={handleReviewPhotoUpload} className="hidden" />
                    </label>
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="px-4 py-2 rounded-xl bg-[#00A39D] hover:bg-[#006B68] text-white text-xs font-bold cursor-pointer"
                    >
                      {submittingReview ? 'Mengirim...' : 'Kirim Ulasan'}
                    </button>
                  </div>
                </form>

                <div className="space-y-3">
                  {selectedProductReviews.length === 0 ? (
                    <p className="text-xs text-slate-500">Belum ada ulasan tertulis untuk produk ini.</p>
                  ) : (
                    selectedProductReviews.map((rev) => (
                      <div key={rev.id} className="p-3.5 rounded-xl border border-slate-100 bg-white">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{rev.userName}</span>
                            <span className="text-[10px] font-semibold text-[#00A39D]">Pembeli B-Market</span>
                          </div>
                          <span className="text-slate-400">{formatDate(rev.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-0.5 my-1">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              className={`w-3.5 h-3.5 ${n <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-slate-600">{rev.comment}</p>
                        {rev.photoUrl && (
                          <img
                            src={rev.photoUrl}
                            alt="Foto ulasan pelanggan"
                            referrerPolicy="no-referrer"
                            className="mt-2 w-20 h-20 rounded-lg object-cover border border-slate-200"
                          />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Direct In-App Store Chat Drawer/Modal (No WhatsApp Numbers!) */}
      {chatTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md h-[86vh] sm:h-[600px] sm:rounded-3xl rounded-t-3xl flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Chat Header */}
            <div className="px-4 py-3.5 bg-gradient-to-r from-[#006B68] to-[#00A39D] text-white flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <Store className="w-5 h-5 text-[#F8AD3C]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-display font-bold text-sm truncate">{chatTarget.storeName}</h3>
                    <BadgeCheck className="w-3.5 h-3.5 text-[#F8AD3C] shrink-0" />
                  </div>
                  <p className="text-[10px] text-white/85">Chat Langsung B-Market · Privasi Aman Tanpa No. WA</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <select
                  aria-label="Pilih toko chat"
                  value={chatTarget.storeId}
                  onChange={(e) => {
                    const nextStore = stores.find((s) => s.id === e.target.value);
                    if (nextStore) {
                      setChatTarget({ storeId: nextStore.id, storeName: nextStore.name, product: null });
                    }
                  }}
                  className="h-8 px-2 rounded-lg bg-white/15 text-white text-[10px] font-bold border border-white/25 focus:outline-none"
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id} className="text-slate-900">
                      {s.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setChatTarget(null)}
                  aria-label="Tutup chat penjual"
                  className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Product Context Banner inside Chat */}
            {chatTarget.product && (
              <div className="px-4 py-2.5 bg-[#EEF9F8] border-b border-slate-200/80 flex items-center gap-2.5">
                {chatTarget.product.photoUrl && (
                  <img
                    src={chatTarget.product.photoUrl}
                    alt={chatTarget.product.name}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-[#00A39D]">Menanyakan Produk:</p>
                  <p className="text-xs font-bold text-[#1E293B] truncate">{chatTarget.product.name}</p>
                  <p className="text-[11px] font-extrabold text-[#006B68] tabular-nums">
                    {formatRupiah(chatTarget.product.price)}
                  </p>
                </div>
              </div>
            )}

            {/* Message Thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFB]">
              {activeChatMessages.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <BinaExpression mood="wave" className="w-16 h-16 mx-auto" />
                  <p className="text-xs font-bold text-[#1E293B]">
                    Mulai Percakapan dengan {chatTarget.storeName}
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    Tanyakan stok, detail varian, atau pengiriman langsung di aplikasi tanpa perlu bertukar nomor WhatsApp.
                  </p>
                </div>
              ) : (
                activeChatMessages.map((msg) => {
                  const isMe = msg.senderRole === 'customer';
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      {msg.productName && (
                        <span className="text-[9px] font-semibold text-slate-400 mb-0.5 px-1">
                          Produk: {msg.productName}
                        </span>
                      )}
                      <div
                        className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                          isMe
                            ? 'bg-[#00A39D] text-white rounded-br-sm'
                            : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-sm'
                        }`}
                      >
                        <p className={`text-[10px] font-bold mb-0.5 ${isMe ? 'text-white/80' : 'text-[#006B68]'}`}>
                          {msg.senderName}
                        </p>
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                        <p className={`text-[9px] mt-1 ${isMe ? 'text-white/70 text-right' : 'text-slate-400'}`}>
                          {formatDateTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Prompts & Input */}
            <div className="p-3 bg-white border-t border-slate-100 space-y-2">
              <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                {[
                  'Apakah stok masih tersedia Kak?',
                  'Bisa dikirim hari ini ya?',
                  'Apakah bisa request ucapan kado?',
                ].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleSendStoreChat(q)}
                    className="px-2.5 py-1 rounded-full bg-[#F4F6F6] hover:bg-[#EEF9F8] text-[#006B68] text-[10px] font-semibold whitespace-nowrap border border-slate-200 cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendStoreChat();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={`Tulis pesan ke ${chatTarget.storeName}...`}
                  className="flex-1 h-10 px-3.5 rounded-full border border-slate-200 text-xs focus:outline-none focus:border-[#00A39D]"
                />
                <button
                  type="submit"
                  disabled={sendingChat || !chatInput.trim()}
                  aria-label="Kirim pesan"
                  className="w-10 h-10 rounded-full bg-[#00A39D] hover:bg-[#006B68] disabled:opacity-50 text-white flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Shopping Cart Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#00A39D]" />
                <h3 className="font-display font-bold text-base text-[#1E293B]">
                  Keranjang Belanja ({cartCount})
                </h3>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">Keranjang masih kosong</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Tambahkan produk dari UMKM binaan yang telah menetapkan harga & stok.
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.productId} className="p-3 rounded-2xl border border-slate-200 flex gap-3 items-center">
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-100 shrink-0">
                      {item.photoUrl ? (
                        <img
                          src={item.photoUrl}
                          alt={item.productName}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ProductPlaceholder compact />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-[#00A39D] truncate">{item.storeName}</p>
                      <p className="text-xs font-bold text-slate-800 truncate">{item.productName}</p>
                      <p className="text-xs font-bold text-[#006B68] mt-0.5 tabular-nums">
                        {formatRupiah(item.price)}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 bg-[#F4F6F6] rounded-lg px-2 py-1">
                          <button
                            onClick={() => updateCartQty(item.productId, item.quantity - 1)}
                            className="p-0.5 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-bold tabular-nums w-5 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQty(item.productId, item.quantity + 1)}
                            className="p-0.5 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-4 border-t border-slate-100 space-y-3 bg-[#F8FAFB]">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Subtotal Pembayaran</span>
                  <span className="font-display font-extrabold text-lg text-[#006B68] tabular-nums">
                    {formatRupiah(cartSubtotal)}
                  </span>
                </div>
                <button
                  onClick={handleOpenCheckout}
                  className="w-full h-12 rounded-xl bg-[#00A39D] hover:bg-[#006B68] text-white font-bold text-sm cursor-pointer"
                >
                  Lanjut ke Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmOrder}
            className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-extrabold text-[#1E293B]">
                Checkout Pesanan B-Market
              </h3>
              <button
                type="button"
                onClick={() => setCheckoutOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Penerima</label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">No. Telepon / HP Kurir</label>
                <input
                  type="tel"
                  required
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Pengiriman Lengkap</label>
                <textarea
                  rows={2}
                  required
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Metode Pembayaran (Simulasi Amanah)</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm bg-white"
                >
                  <option value="BSI Virtual Account">BSI Virtual Account</option>
                  <option value="QRIS Syariah">QRIS Syariah</option>
                  <option value="Transfer Bank BSI">Transfer Bank BSI</option>
                  <option value="COD (Bayar di Tempat)">COD (Bayar di Tempat)</option>
                </select>
              </div>
              {activeVouchers.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gunakan Voucher B-Edu</label>
                  <select
                    value={selectedVoucherId}
                    onChange={(e) => setSelectedVoucherId(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm bg-white"
                  >
                    <option value="">Tidak menggunakan voucher</option>
                    {activeVouchers.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.voucherTitle} ({v.voucherCode})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="bg-[#F4F6F6] rounded-2xl p-4 space-y-2 text-xs">
              <p className="font-bold text-slate-700">Ringkasan Pesanan ({cart.length} item)</p>
              {cart.map((c) => (
                <div key={c.productId} className="flex justify-between text-slate-600">
                  <span>
                    {c.productName} × {c.quantity}
                  </span>
                  <span className="font-semibold tabular-nums">{formatRupiah(c.price * c.quantity)}</span>
                </div>
              ))}
              {voucherDiscount > 0 && (
                <div className="flex justify-between text-[#00A39D] font-bold">
                  <span>Diskon Voucher ({selectedVoucherObj?.voucherCode})</span>
                  <span className="tabular-nums">- {formatRupiah(voucherDiscount)}</span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-extrabold text-[#006B68]">
                <span>Total Pembayaran</span>
                <span className="tabular-nums">{formatRupiah(checkoutTotal)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={checkingOut}
              className="w-full h-12 rounded-xl bg-[#F8AD3C] hover:bg-[#e59a28] text-slate-900 font-bold text-sm cursor-pointer"
            >
              {checkingOut ? 'Memproses Transaksi...' : 'Konfirmasi & Bayar Sekarang'}
            </button>
          </form>
        </div>
      )}

      {/* Transaction Success Modal with BINA Mascot */}
      {successOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl">
            <BinaExpression mood="celebrate" className="w-24 h-24 mx-auto" />
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00A39D]">
              <CheckCircle2 className="w-4 h-4" /> Transaksi Berhasil Dikonfirmasi!
            </div>
            <h3 className="font-display text-xl font-extrabold text-[#1E293B]">
              Terima Kasih Telah Mendukung UMKM Binaan
            </h3>
            <div className="bg-[#F4F6F6] rounded-2xl p-4 text-xs text-left space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Nomor Pesanan</span>
                <strong className="font-mono text-slate-800">{successOrder.orderNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Toko UMKM</span>
                <strong className="text-slate-800">{successOrder.storeName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Metode Bayar</span>
                <strong className="text-slate-800">{successOrder.paymentMethod}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Dibayar</span>
                <strong className="text-[#006B68] tabular-nums">{formatRupiah(successOrder.total)}</strong>
              </div>
            </div>
            <button
              onClick={() => setSuccessOrder(null)}
              className="w-full h-11 rounded-xl bg-[#00A39D] hover:bg-[#006B68] text-white font-bold text-sm cursor-pointer"
            >
              Selesai
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const ProductCard: React.FC<{
  product: Product;
  reviewCount: number;
  city?: string;
  compact?: boolean;
  isLiked: boolean;
  onToggleLike: () => void;
  onOpenDetail: () => void;
  onOpenVideo: () => void;
  onChatSeller: () => void;
  onAddToCart: () => void;
}> = ({
  product,
  reviewCount,
  city,
  compact = false,
  isLiked,
  onToggleLike,
  onOpenDetail,
  onOpenVideo,
  onChatSeller,
  onAddToCart,
}) => {
  const isAvailableToBuy =
    product.price !== null && product.price > 0 && product.stock !== null && product.stock > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-soft-card hover:-translate-y-0.5 transition-transform flex flex-col justify-between">
      <div>
        <div className="relative aspect-[4/3] bg-[#F4F6F6] cursor-pointer" onClick={onOpenDetail}>
          {product.photoUrl ? (
            <img
              src={product.photoUrl}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <ProductPlaceholder title={product.name} />
          )}

          {product.videoUrl && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenVideo();
              }}
              aria-label={`Putar video ${product.name}`}
              className="absolute top-2 left-2 px-2 py-1 rounded-full bg-slate-900/80 hover:bg-[#00A39D] text-white text-[9px] font-bold inline-flex items-center gap-1 shadow-sm cursor-pointer"
            >
              <Play className="w-2.5 h-2.5 fill-white" />
              Video
            </button>
          )}

          {product.bchainStatus === 'VERIFIED' && (
            <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-[#006B68]/90 text-white text-[9px] font-bold inline-flex items-center gap-1 shadow-sm">
              <ShieldCheck className="w-2.5 h-2.5 text-[#F8AD3C]" />
              B-CHAIN
            </span>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleLike();
            }}
            aria-label="Sukai produk"
            className={`absolute top-2 right-2 rounded-full bg-white/95 shadow-sm flex items-center justify-center cursor-pointer ${
              compact ? 'w-7 h-7' : 'w-9 h-9'
            }`}
          >
            <Heart
              className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} ${
                isLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-500'
              }`}
            />
          </button>
        </div>

        <div className={`${compact ? 'p-2.5 space-y-1' : 'p-4 space-y-1.5'} cursor-pointer`} onClick={onOpenDetail}>
          <div className="flex items-center justify-between gap-1 text-[10px] text-slate-500">
            <span className="font-semibold text-[#00A39D] truncate">{product.storeName}</span>
            {city && (
              <span className="inline-flex items-center gap-0.5 text-[9px] text-slate-400 shrink-0">
                <MapPin className="w-2.5 h-2.5" />
                {city}
              </span>
            )}
          </div>
          <h4 className={`font-display font-bold text-[#1E293B] line-clamp-1 ${compact ? 'text-xs' : 'text-sm'}`}>
            {product.name}
          </h4>
          <p className={`font-display font-extrabold text-[#006B68] tabular-nums ${compact ? 'text-sm' : 'text-base'}`}>
            {formatRupiah(product.price)}
          </p>
          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5 tabular-nums">
            <span className="inline-flex items-center gap-0.5">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {product.ratingAvg > 0 ? product.ratingAvg : '4.9'} ({reviewCount}) · {product.soldCount || 0} terjual
            </span>
            {!compact && (
              <span>{product.stock !== null ? `Stok ${product.stock}` : 'Stok belum diatur'}</span>
            )}
          </div>
        </div>
      </div>

      <div className={`${compact ? 'px-2.5 pb-2.5 pt-0.5' : 'px-4 pb-4 pt-1'} flex items-center gap-1.5`}>
        <button
          type="button"
          onClick={onChatSeller}
          aria-label={`Chat penjual ${product.storeName}`}
          className={`${compact ? 'px-2 py-1.5' : 'px-2.5 py-2'} rounded-xl border border-slate-200 hover:border-[#00A39D] text-[#006B68] text-[10px] font-bold inline-flex items-center justify-center gap-1 cursor-pointer shrink-0`}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          {!compact && <span>Chat</span>}
        </button>
        <button
          type="button"
          onClick={isAvailableToBuy ? onAddToCart : onOpenDetail}
          className={`flex-1 ${compact ? 'py-1.5 text-[11px]' : 'px-3.5 py-2 text-xs'} rounded-xl font-bold cursor-pointer ${
            isAvailableToBuy
              ? 'bg-[#00A39D] hover:bg-[#006B68] text-white'
              : 'bg-[#F4F6F6] hover:bg-slate-200 text-slate-700'
          }`}
        >
          {isAvailableToBuy ? '+ Keranjang' : 'Lihat Detail'}
        </button>
      </div>
    </div>
  );
};
