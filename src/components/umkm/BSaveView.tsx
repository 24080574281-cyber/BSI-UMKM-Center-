import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Edit3,
  Package,
  PlayCircle,
  Plus,
  ShieldCheck,
  Trash2,
  Upload,
  Video,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { ProductPlaceholder } from '../BinaMascot.tsx';
import { compressImageToDataUrl, formatDateTime, formatRupiah } from '../../lib/utils.ts';
import type { Product, UmkmStore } from '../../types.ts';

interface BSaveViewProps {
  store: UmkmStore;
}

export const BSaveView: React.FC<BSaveViewProps> = ({ store }) => {
  const {
    products,
    categories,
    inventoryMovements,
    saveProduct,
    removeProduct,
    adjustInventory,
    submitToBChain,
    showToast,
  } = useApp();

  const storeProducts = useMemo(
    () => products.filter((p) => p.storeId === store.id),
    [products, store.id]
  );

  const storeMovements = useMemo(
    () => inventoryMovements.filter((m) => m.storeId === store.id),
    [inventoryMovements, store.id]
  );

  const lowStockProducts = storeProducts.filter(
    (p) => p.stock !== null && p.stock <= 5
  );

  const [subTab, setSubTab] = useState<'products' | 'inventory'>('products');
  const [formOpen, setFormOpen] = useState(false);
  const [editingProd, setEditingProd] = useState<Product | null>(null);

  // Product Form fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState(store.category || 'Kuliner & Makanan');
  const [description, setDescription] = useState('');
  const [composition, setComposition] = useState('');
  const [specifications, setSpecifications] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [productionDate, setProductionDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [legalityNumber, setLegalityNumber] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [saving, setSaving] = useState(false);

  // Stock adjustment modal
  const [stockModalProd, setStockModalProd] = useState<Product | null>(null);
  const [adjType, setAdjType] = useState<'IN' | 'OUT'>('IN');
  const [adjQty, setAdjQty] = useState('10');
  const [adjNote, setAdjNote] = useState('');

  // B-CHAIN submit modal
  const [bchainProd, setBchainProd] = useState<Product | null>(null);
  const [productCode, setProductCode] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [bProdDate, setBProdDate] = useState('');
  const [bShelfLife, setBShelfLife] = useState('');
  const [bExpiryDate, setBExpiryDate] = useState('');
  const [bLegality, setBLegality] = useState('');

  const openNewProduct = () => {
    setEditingProd(null);
    setName('');
    setCategory(store.category || categories[0]?.name || 'Kuliner & Makanan');
    setDescription('');
    setComposition('');
    setSpecifications('');
    setPrice('');
    setStock('');
    setProductionDate('');
    setExpiryDate('');
    setLegalityNumber('');
    setPhotoUrl(null);
    setVideoUrl('');
    setVideoTitle('');
    setIsPublished(true);
    setFormOpen(true);
  };

  const openEditProduct = (p: Product) => {
    setEditingProd(p);
    setName(p.name);
    setCategory(p.category);
    setDescription(p.description);
    setComposition(p.composition || '');
    setSpecifications(p.specifications || '');
    setPrice(p.price !== null ? String(p.price) : '');
    setStock(p.stock !== null ? String(p.stock) : '');
    setProductionDate(p.productionDate || '');
    setExpiryDate(p.expiryDate || '');
    setLegalityNumber(p.legalityNumber || '');
    setPhotoUrl(p.photoUrl);
    setVideoUrl(p.videoUrl || '');
    setVideoTitle(p.videoTitle || '');
    setIsPublished(p.isPublished);
    setFormOpen(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await compressImageToDataUrl(file, 720, 0.78);
      setPhotoUrl(url);
    } catch (err: any) {
      showToast(err?.message || 'Gagal mengunggah foto produk.', 'error');
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Nama produk wajib diisi.', 'error');
      return;
    }
    setSaving(true);
    await saveProduct({
      id: editingProd?.id,
      storeId: store.id,
      storeName: store.name,
      name: name.trim(),
      category,
      description: description.trim(),
      composition: composition.trim() || null,
      specifications: specifications.trim() || null,
      price: price.trim() !== '' ? Number(price) : null,
      stock: stock.trim() !== '' ? Number(stock) : null,
      productionDate: productionDate.trim() || null,
      expiryDate: expiryDate.trim() || null,
      legalityNumber: legalityNumber.trim() || null,
      photoUrl,
      videoUrl: videoUrl.trim() || null,
      videoTitle: videoTitle.trim() || null,
      isPublished,
    });
    setSaving(false);
    setFormOpen(false);
  };

  const openBChainModal = (p: Product) => {
    setBchainProd(p);
    setProductCode(`BSI-${store.id.slice(0, 3).toUpperCase()}-${p.id.slice(-3).toUpperCase()}`);
    setBatchNumber(`BATCH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`);
    setBProdDate(p.productionDate || new Date().toISOString().slice(0, 10));
    setBShelfLife('');
    setBExpiryDate(p.expiryDate || '');
    setBLegality(p.legalityNumber || store.legalitySummary || '');
  };

  const handleSubmitBChain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bchainProd) return;
    await submitToBChain(bchainProd, {
      productCode: productCode.trim(),
      batchNumber: batchNumber.trim(),
      productionDate: bProdDate.trim(),
      shelfLife: bShelfLife.trim() || 'Sesuai kemasan',
      expiryDate: bExpiryDate.trim() || 'Tidak berlaku / non-pangan',
      legalityInfo: bLegality.trim() || 'Dalam proses pengurusan',
    });
    setBchainProd(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-soft-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-[#00A39D] uppercase">B-Save · Manajemen Produk & Persediaan</p>
          <h2 className="font-display text-xl font-extrabold text-[#1E293B]">
            Katalog & Gudang {store.name}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Setiap perubahan harga, deskripsi, dan stok yang dipublikasikan otomatis tersinkronisasi ke B-Market.
          </p>
        </div>
        <button
          onClick={openNewProduct}
          className="h-11 px-5 rounded-xl bg-[#00A39D] hover:bg-[#006B68] text-white font-bold text-xs sm:text-sm inline-flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Tambah Produk Baru
        </button>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900">
            <p className="font-bold">Notifikasi Stok Menipis ({lowStockProducts.length} produk)</p>
            <p className="mt-0.5">
              {lowStockProducts.map((p) => `${p.name} (sisa ${p.stock})`).join(', ')}. Segera lakukan penambahan stok.
            </p>
          </div>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl w-fit">
        <button
          onClick={() => setSubTab('products')}
          className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer ${
            subTab === 'products' ? 'bg-[#00A39D] text-white' : 'text-slate-600'
          }`}
        >
          Daftar Produk ({storeProducts.length})
        </button>
        <button
          onClick={() => setSubTab('inventory')}
          className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer ${
            subTab === 'inventory' ? 'bg-[#00A39D] text-white' : 'text-slate-600'
          }`}
        >
          Riwayat Mutasi Stok ({storeMovements.length})
        </button>
      </div>

      {subTab === 'products' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {storeProducts.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-soft-card flex flex-col justify-between">
              <div>
                <div className="aspect-[4/3] bg-[#F4F6F6] relative">
                  {p.photoUrl ? (
                    <img src={p.photoUrl} alt={p.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  ) : (
                    <ProductPlaceholder title={p.name} />
                  )}
                  <span
                    className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                      p.isPublished ? 'bg-[#00A39D] text-white' : 'bg-slate-700 text-white'
                    }`}
                  >
                    {p.isPublished ? 'Tayang di B-Market' : 'Draf'}
                  </span>
                  {p.videoUrl && (
                    <span className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-slate-900/75 text-white text-[10px] font-bold inline-flex items-center gap-1">
                      <PlayCircle className="w-3 h-3 text-[#F8AD3C]" /> Video
                    </span>
                  )}
                </div>
                <div className="p-4 space-y-1.5">
                  <p className="text-[11px] font-semibold text-slate-400">{p.category}</p>
                  <h3 className="font-display font-bold text-sm text-[#1E293B] line-clamp-1">{p.name}</h3>
                  <p className="font-display font-extrabold text-base text-[#006B68] tabular-nums">
                    {formatRupiah(p.price)}
                  </p>
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1 tabular-nums">
                    <span>Stok tersedia: <strong>{p.stock !== null ? p.stock : 'Belum diatur'}</strong></span>
                    <span>Terjual: {p.soldCount || 0}</span>
                  </div>
                  <p className="text-[11px] font-bold text-[#00A39D] pt-1">
                    B-CHAIN: {p.bchainStatus}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-[#F8FAFB] border-t border-slate-100 grid grid-cols-2 gap-2">
                <button
                  onClick={() => openEditProduct(p)}
                  className="h-9 rounded-lg border border-slate-200 bg-white hover:border-[#00A39D] text-xs font-bold text-slate-700 inline-flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => {
                    setStockModalProd(p);
                    setAdjType('IN');
                    setAdjQty('10');
                    setAdjNote('');
                  }}
                  className="h-9 rounded-lg border border-slate-200 bg-white hover:border-[#00A39D] text-xs font-bold text-slate-700 inline-flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Package className="w-3.5 h-3.5" /> Atur Stok
                </button>
                <button
                  onClick={() => openBChainModal(p)}
                  className="h-9 rounded-lg bg-[#00A39D]/10 hover:bg-[#00A39D]/20 text-[#006B68] text-xs font-bold inline-flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Kirim B-CHAIN
                </button>
                <button
                  onClick={() => removeProduct(p.id)}
                  className="h-9 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold inline-flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-soft-card">
          {storeMovements.length === 0 ? (
            <p className="text-xs text-slate-500 p-8 text-center">Belum ada mutasi stok tercatat.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F4F6F6] text-slate-600 font-bold">
                  <tr>
                    <th className="p-3.5">Waktu</th>
                    <th className="p-3.5">Produk</th>
                    <th className="p-3.5">Jenis</th>
                    <th className="p-3.5 text-right">Jumlah</th>
                    <th className="p-3.5 text-right">Stok Akhir</th>
                    <th className="p-3.5">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 tabular-nums">
                  {storeMovements.map((m) => (
                    <tr key={m.id}>
                      <td className="p-3.5 text-slate-500">{formatDateTime(m.createdAt)}</td>
                      <td className="p-3.5 font-bold text-slate-800">{m.productName}</td>
                      <td className="p-3.5">
                        <span className={`font-bold ${m.type === 'IN' || m.type === 'INITIAL' ? 'text-[#00A39D]' : 'text-amber-600'}`}>
                          {m.type}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-bold">{m.qty}</td>
                      <td className="p-3.5 text-right font-bold text-[#006B68]">{m.newStock}</td>
                      <td className="p-3.5 text-slate-600">{m.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveProduct}
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display font-extrabold text-lg text-[#1E293B]">
                {editingProd ? 'Edit Produk UMKM' : 'Tambah Produk Baru'}
              </h3>
              <button type="button" onClick={() => setFormOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2 space-y-2">
                <label className="block text-xs font-bold text-slate-700">Foto Produk</label>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="w-24 h-20 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                    {photoUrl ? (
                      <img src={photoUrl} alt="Preview" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    ) : (
                      <ProductPlaceholder compact />
                    )}
                  </div>
                  <div className="space-y-2 flex-1 min-w-[200px]">
                    <label className="px-4 py-2 rounded-xl border border-[#00A39D] text-[#006B68] text-xs font-bold inline-flex items-center gap-2 cursor-pointer hover:bg-[#00A39D]/5">
                      <Upload className="w-4 h-4" />
                      Unggah Foto Produk
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-semibold text-slate-500">Pilih cepat:</span>
                      {[
                        { label: 'Parfum', url: '/assets/products/botega-edp.jpg' },
                        { label: 'Shibori', url: '/assets/products/windrasari-kain-shibori.jpg' },
                        { label: 'Pepes', url: '/assets/products/lanjar-lele-botok.jpg' },
                        { label: 'Camilan', url: '/assets/products/puya-stik-keju.jpg' },
                        { label: 'Kebuli', url: '/assets/products/depotcheff-nasi-kebuli.jpg' },
                      ].map((preset) => (
                        <button
                          key={preset.url}
                          type="button"
                          onClick={() => setPhotoUrl(preset.url)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold border cursor-pointer ${
                            photoUrl === preset.url
                              ? 'bg-[#00A39D] text-white border-[#00A39D]'
                              : 'bg-[#F4F6F6] text-slate-700 border-slate-200 hover:border-[#00A39D]'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Produk *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategori *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Harga (Rp)</label>
                <input
                  type="number"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Contoh: 25000"
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Stok Tersedia</label>
                <input
                  type="number"
                  min={0}
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="Contoh: 30"
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Produk</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Komposisi Bahan</label>
                <input
                  type="text"
                  value={composition}
                  onChange={(e) => setComposition(e.target.value)}
                  placeholder="Opsional"
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Spesifikasi / Berat Bersih</label>
                <input
                  type="text"
                  value={specifications}
                  onChange={(e) => setSpecifications(e.target.value)}
                  placeholder="Contoh: 250 gram"
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Produksi</label>
                <input
                  type="date"
                  value={productionDate}
                  onChange={(e) => setProductionDate(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Kedaluwarsa</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Legalitas (Halal / PIRT / BPOM)</label>
                <input
                  type="text"
                  value={legalityNumber}
                  onChange={(e) => setLegalityNumber(e.target.value)}
                  placeholder="Isi nomor sertifikasi asli jika sudah tersedia"
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div className="sm:col-span-2 p-3.5 rounded-2xl bg-[#F4F6F6] border border-slate-200/80 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-[#006B68]">
                  <Video className="w-4 h-4 text-[#00A39D]" />
                  <span>Konten Video Produk (Tampil di B-Market)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">URL Video Produk (.mp4)</label>
                    <input
                      type="text"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="/assets/videos/botega-edp.mp4 atau link MP4"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Judul Klip Video</label>
                    <input
                      type="text"
                      value={videoTitle}
                      onChange={(e) => setVideoTitle(e.target.value)}
                      placeholder="Contoh: Demo Produk & Pengemasan"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs"
                    />
                  </div>
                </div>
                {videoUrl.trim() && (
                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-black aspect-video max-h-40">
                    <video
                      src={videoUrl.trim()}
                      controls
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
              <label className="sm:col-span-2 flex items-center gap-2.5 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 accent-[#00A39D]"
                />
                Publikasikan otomatis ke B-Market
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full h-12 rounded-xl bg-[#00A39D] hover:bg-[#006B68] text-white font-bold text-sm cursor-pointer"
            >
              {saving ? 'Menyimpan...' : 'Simpan & Sinkronkan Produk'}
            </button>
          </form>
        </div>
      )}

      {/* Stock Mutation Modal */}
      {stockModalProd && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await adjustInventory(stockModalProd, adjType, Number(adjQty) || 0, adjNote);
              setStockModalProd(null);
            }}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-[#1E293B]">
                Kelola Stok — {stockModalProd.name}
              </h3>
              <button type="button" onClick={() => setStockModalProd(null)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Stok saat ini: <strong className="text-[#006B68]">{stockModalProd.stock ?? 0} unit</strong>
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAdjType('IN')}
                className={`h-11 rounded-xl border text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                  adjType === 'IN' ? 'bg-[#00A39D] text-white border-[#00A39D]' : 'border-slate-200 text-slate-600'
                }`}
              >
                <ArrowUpCircle className="w-4 h-4" /> Tambah Stok
              </button>
              <button
                type="button"
                onClick={() => setAdjType('OUT')}
                className={`h-11 rounded-xl border text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                  adjType === 'OUT' ? 'bg-[#F8AD3C] text-slate-900 border-[#F8AD3C]' : 'border-slate-200 text-slate-600'
                }`}
              >
                <ArrowDownCircle className="w-4 h-4" /> Kurangi Stok
              </button>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah Unit</label>
              <input
                type="number"
                min={1}
                required
                value={adjQty}
                onChange={(e) => setAdjQty(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Keterangan</label>
              <input
                type="text"
                value={adjNote}
                onChange={(e) => setAdjNote(e.target.value)}
                placeholder="Contoh: Produksi batch pagi / Koreksi gudang"
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <button type="submit" className="w-full h-11 rounded-xl bg-[#00A39D] text-white font-bold text-sm cursor-pointer">
              Simpan Perubahan Stok
            </button>
          </form>
        </div>
      )}

      {/* Submit to B-CHAIN Modal */}
      {bchainProd && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSubmitBChain} className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-[#1E293B]">
                Teruskan ke Verifikasi B-CHAIN
              </h3>
              <button type="button" onClick={() => setBchainProd(null)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kode Produk *</label>
                <input type="text" required value={productCode} onChange={(e) => setProductCode(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-mono" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Batch Produksi *</label>
                <input type="text" required value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-mono" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Produksi *</label>
                <input type="date" required value={bProdDate} onChange={(e) => setBProdDate(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Kedaluwarsa</label>
                <input type="date" value={bExpiryDate} onChange={(e) => setBExpiryDate(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Masa Simpan / Konsumsi</label>
                <input type="text" value={bShelfLife} onChange={(e) => setBShelfLife(e.target.value)} placeholder="Mis: 3 Bulan suhu ruang" className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Legalitas (Halal / PIRT / NIB)</label>
                <input type="text" value={bLegality} onChange={(e) => setBLegality(e.target.value)} placeholder="Nomor sertifikat" className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs" />
              </div>
            </div>
            <button type="submit" className="w-full h-11 rounded-xl bg-[#00A39D] hover:bg-[#006B68] text-white font-bold text-sm cursor-pointer">
              Catat ke Smart Contract & Ajukan Verifikasi
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
