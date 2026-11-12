import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '5mb' }));

const GEMINI_MODEL = 'gemini-4-hydrogen';
const GEMINI_FAST_MODEL = 'gemini-3.1-flash-lite';

const BASELINE_STORES_SUMMARY = [
  { id: 'botega', name: 'BOTEGA', category: 'Parfum & Pewangi', city: 'Surabaya', description: 'Rumah wewangian artisanal: Parfum Eau de Parfum, Body Mist, Reed Diffuser, dan Room Spray.', isVerifiedUmkm: true },
  { id: 'windrasari', name: 'Windrasari', category: 'Kriya & Fesyen', city: 'Sidoarjo', description: 'Studio kriya tekstil shibori handmade: Kain Shibori, Hijab Shibori, Scarf Shibori, dan Totebag Shibori.', isVerifiedUmkm: true },
  { id: 'lanjar-jaya-bopes', name: 'Lanjar Jaya / Bopes', category: 'Kuliner & Makanan', city: 'Malang', description: 'Spesialis Botok & Pepes tradisional: Lele Botok Pepes, Pindang Botok Pepes, dan Ayam Botok Pepes.', isVerifiedUmkm: true },
  { id: 'puya-kitchen', name: 'Puya Kitchen', category: 'Kue & Camilan', city: 'Mojokerto', description: 'Camilan stik kentang renyah aneka rasa: Keju, Balado, Matcha, dan Coklat.', isVerifiedUmkm: true },
  { id: 'depot-cheff-99', name: 'Depot Cheff 99', category: 'Kuliner & Makanan', city: 'Gresik', description: 'Kuliner rempah Nusantara & Timur Tengah: Nasi Kebuli Kambing Muda dan Bebek Goreng Rempah.', isVerifiedUmkm: true },
];

const BASELINE_PRODUCTS_SUMMARY = [
  { id: 'prod-botega-01', name: 'Parfum Eau de Parfum BOTEGA Senja 50ml', storeName: 'BOTEGA', category: 'Parfum & Pewangi', price: 165000, stock: 34, bchainStatus: 'VERIFIED', isPublished: true },
  { id: 'prod-botega-02', name: 'Body Mist BOTEGA Jasmine & Mint 100ml', storeName: 'BOTEGA', category: 'Parfum & Pewangi', price: 78000, stock: 46, bchainStatus: 'VERIFIED', isPublished: true },
  { id: 'prod-botega-03', name: 'Reed Diffuser BOTEGA Eucalyptus & Bergamot 100ml', storeName: 'BOTEGA', category: 'Parfum & Pewangi', price: 115000, stock: 28, bchainStatus: 'VERIFIED', isPublished: true },
  { id: 'prod-botega-04', name: 'Room Spray BOTEGA Lavender & Linen 250ml', storeName: 'BOTEGA', category: 'Parfum & Pewangi', price: 69000, stock: 39, bchainStatus: 'PENDING VERIFICATION', isPublished: true },
  { id: 'prod-windrasari-01', name: 'Kain Shibori Jumputan Artisanal Windrasari (2m)', storeName: 'Windrasari', category: 'Kriya & Fesyen', price: 185000, stock: 20, bchainStatus: 'VERIFIED', isPublished: true },
  { id: 'prod-windrasari-02', name: 'Hijab Shibori Voal Premium Windrasari 115x115cm', storeName: 'Windrasari', category: 'Kriya & Fesyen', price: 98000, stock: 32, bchainStatus: 'VERIFIED', isPublished: true },
  { id: 'prod-windrasari-03', name: 'Scarf Shibori Sutera Alam Windrasari', storeName: 'Windrasari', category: 'Kriya & Fesyen', price: 145000, stock: 18, bchainStatus: 'VERIFIED', isPublished: true },
  { id: 'prod-windrasari-04', name: 'Totebag Shibori Kanvas Eco-Dye Windrasari', storeName: 'Windrasari', category: 'Kriya & Fesyen', price: 125000, stock: 25, bchainStatus: 'PENDING VERIFICATION', isPublished: true },
  { id: 'prod-lanjar-01', name: 'Lele Botok Pepes Kemangi Lanjar Jaya / Bopes', storeName: 'Lanjar Jaya / Bopes', category: 'Kuliner & Makanan', price: 34000, stock: 38, bchainStatus: 'VERIFIED', isPublished: true },
  { id: 'prod-lanjar-02', name: 'Pindang Botok Pepes Rempah Khas Lanjar Jaya / Bopes', storeName: 'Lanjar Jaya / Bopes', category: 'Kuliner & Makanan', price: 36000, stock: 4, bchainStatus: 'VERIFIED', isPublished: true },
  { id: 'prod-lanjar-03', name: 'Ayam Botok Pepes Kampung Lanjar Jaya / Bopes', storeName: 'Lanjar Jaya / Bopes', category: 'Kuliner & Makanan', price: 39000, stock: 31, bchainStatus: 'VERIFIED', isPublished: true },
  { id: 'prod-puyakitchen-01', name: 'Stik Kentang Keju Renyah Puya Kitchen 150g', storeName: 'Puya Kitchen', category: 'Kue & Camilan', price: 26000, stock: 52, bchainStatus: 'VERIFIED', isPublished: true },
  { id: 'prod-puyakitchen-02', name: 'Stik Kentang Balado Pedas Manis Puya Kitchen 150g', storeName: 'Puya Kitchen', category: 'Kue & Camilan', price: 26000, stock: 44, bchainStatus: 'VERIFIED', isPublished: true },
  { id: 'prod-puyakitchen-03', name: 'Stik Kentang Matcha Glaze Puya Kitchen 150g', storeName: 'Puya Kitchen', category: 'Kue & Camilan', price: 29000, stock: 36, bchainStatus: 'PENDING VERIFICATION', isPublished: true },
  { id: 'prod-puyakitchen-04', name: 'Stik Kentang Coklat Lumer Puya Kitchen 150g', storeName: 'Puya Kitchen', category: 'Kue & Camilan', price: 29000, stock: 41, bchainStatus: 'VERIFIED', isPublished: true },
  { id: 'prod-depotcheff-01', name: 'Nasi Kebuli Kambing Muda Rempah Arab', storeName: 'Depot Cheff 99', category: 'Kuliner & Makanan', price: 52000, stock: 25, bchainStatus: 'VERIFIED', isPublished: true },
  { id: 'prod-depotcheff-02', name: 'Bebek Goreng Rempah Cheff 99 + Sambal Ijo', storeName: 'Depot Cheff 99', category: 'Kuliner & Makanan', price: 68000, stock: 19, bchainStatus: 'NOT VERIFIED', isPublished: true },
];

function safeParseJson<T extends Record<string, any>>(rawText: string | undefined, fallback: T): T {
  if (!rawText) return fallback;
  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed && typeof parsed === 'object') {
      return { ...fallback, ...parsed };
    }
    return fallback;
  } catch {
    return fallback;
  }
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function formatIdr(val: number | null | undefined): string {
  if (val === null || val === undefined || Number.isNaN(Number(val))) {
    return 'Belum ditetapkan';
  }
  return 'Rp ' + Number(val).toLocaleString('id-ID');
}

function buildLocalBAiReply(message: string, context: any): string {
  const q = message.toLowerCase();
  const stores: any[] =
    Array.isArray(context?.stores) && context.stores.length > 0 ? context.stores : BASELINE_STORES_SUMMARY;
  const products: any[] =
    Array.isArray(context?.products) && context.products.length > 0 ? context.products : BASELINE_PRODUCTS_SUMMARY;
  const verifications: any[] = Array.isArray(context?.verifications) ? context.verifications : [];
  const orders: any[] = Array.isArray(context?.orders) ? context.orders : [];

  const matchedProducts = products.filter(
    (p) =>
      q.includes((p.name || '').toLowerCase()) ||
      (p.name || '')
        .toLowerCase()
        .split(' ')
        .some((w: string) => w.length > 3 && q.includes(w))
  );

  if (matchedProducts.length > 0 && !q.includes('semua produk')) {
    const lines = matchedProducts.slice(0, 4).map((p) => {
      const v = verifications.find((x) => x.productId === p.id);
      return `• **${p.name}** (${p.storeName})\n  Harga: ${formatIdr(p.price)} | Stok: ${p.stock ?? '-'} unit | B-CHAIN: ${p.bchainStatus}${
        v ? ` (Kode: ${v.productCode}, Batch: ${v.batchNumber || '-'})` : ''
      }`;
    });
    return `Berikut informasi produk yang ditemukan di B-Market:\n\n${lines.join('\n')}\n\nAnda dapat langsung menambahkan ke keranjang, menonton video produknya, atau memeriksa sertifikat B-CHAIN-nya!`;
  }

  const matchedStores = stores.filter((s) =>
    q.includes((s.name || '').toLowerCase()) ||
    (s.name || '').toLowerCase().split(' ').some((w: string) => w.length > 3 && q.includes(w))
  );

  if (matchedStores.length > 0) {
    const s = matchedStores[0];
    const sp = products.filter((p) => p.storeId === s.id);
    return `🏪 **${s.name}** (${s.category})\nLokasi: ${s.city || 'Indonesia'}\nStatus: ${
      s.isVerifiedUmkm ? 'UMKM Binaan Terverifikasi BSI' : 'UMKM Binaan'
    }\n\nProduk unggulan (${sp.length}):\n${sp
      .map((p) => `• ${p.name} — ${formatIdr(p.price)} (Stok: ${p.stock ?? '-'})`)
      .join('\n')}`;
  }

  if (q.includes('toko') || q.includes('umkm')) {
    const list = stores
      .map((s) => `• **${s.name}** (${s.category} · ${s.city || '-'})`)
      .join('\n');
    return `Saat ini terdapat **${stores.length} Toko UMKM Binaan** di B-Market:\n\n${list}\n\nKlik salah satu kartu toko di B-Market untuk melihat etalase lengkap dan chat penjual langsung.`;
  }

  if (q.includes('chain') || q.includes('verifikasi') || q.includes('asli') || q.includes('qr') || q.includes('sertifikat')) {
    const verifiedCount = verifications.filter((v) => v.status === 'VERIFIED').length || 12;
    return `**B-CHAIN (Blockchain Product Verification)** menjamin transparansi produk UMKM:\n• Saat ini ada **${verifiedCount} produk** berstatus **VERIFIED**.\n• Cara cek: buka menu **B-Chain**, pilih produk atau pindai QR Code/masukkan kode produk (misal: \`BSI-BTG-001\`).\n• Anda bisa melihat nomor batch, tanggal kedaluwarsa, hash blockchain, serta **mengunduh Sertifikat PDF resmi**.`;
  }

  if (q.includes('pesan') || q.includes('order') || q.includes('status') || q.includes('kirim')) {
    if (orders.length === 0) {
      return 'Anda belum memiliki pesanan tercatat saat ini. Silakan pilih produk di **B-Market**, masukkan ke keranjang, lalu lakukan checkout!';
    }
    const latest = orders[0];
    return `Berikut ringkasan pesanan terakhir Anda:\n• No. Pesanan: **${latest.orderNumber}**\n• Toko: ${latest.storeName}\n• Total: **${formatIdr(latest.total)}** (${latest.paymentMethod})\n• Status: **${latest.status}**\n\nCek seluruh riwayat pesanan di tab **Profile → Riwayat Pesanan**.`;
  }

  if (q.includes('edu') || q.includes('poin') || q.includes('telur') || q.includes('streak') || q.includes('voucher')) {
    return `Di **B-Edu Customer**, Anda bisa:\n1. **Absen Streak Harian** untuk menjaga api streak & mendapat poin + tiket Pecah Telur.\n2. **Main Kuis Edukatif** (+25 poin per jawaban benar + 1 tiket Pecah Telur).\n3. **Mainkan Pecah Telur Berkah** (ketuk telur 3x untuk hadiah poin/voucher kejutan).\n4. Tukarkan poin di **Reward Center** menjadi voucher diskon belanja di B-Market!`;
  }

  if (q.includes('produk') || q.includes('beli') || q.includes('rekomendasi') || q.includes('promo') || q.includes('menu')) {
    const topProducts = products
      .filter((p) => p.price && (p.stock ?? 0) > 0)
      .slice(0, 6)
      .map((p) => `• **${p.name}** (${p.storeName}) — ${formatIdr(p.price)}`)
      .join('\n');
    return `Berikut **rekomendasi produk UMKM binaan** yang siap dibeli di B-Market:\n\n${topProducts}\n\nKetik nama produk atau toko tertentu untuk info komposisi, stok, dan status B-CHAIN-nya!`;
  }

  return `Assalamu'alaikum! Saya **BINA** (Asisten B-AI BSI UMKM Center).\n\nSaat ini tersedia **${stores.length} toko UMKM binaan** dan **${products.length} produk unggulan** di B-Market.\n\nAnda dapat bertanya kepada saya tentang:\n• Daftar & rekomendasi produk siap beli\n• Informasi toko (BOTEGA, Windrasari, Lanjar Jaya / Bopes, Puya Kitchen, Depot Cheff 99)\n• Cara cek keaslian produk via B-CHAIN\n• Status pesanan & cara mengumpulkan poin B-Edu`;
}

function buildLocalBSmartPack(store: any, product: any, goal: string, channel: string) {
  const storeName = store?.name || 'UMKM Binaan';
  const prodName = product?.name || 'Produk Unggulan';
  const priceText = product?.price ? formatIdr(product.price) : 'Harga terbaik langsung dari produsen';
  const cat = store?.category || 'UMKM Halal';

  return {
    contentIdeas: [
      `Video singkat di balik layar produksi higienis ${prodName} di dapur ${storeName}`,
      `Testimoni jujur pelanggan & keunggulan bahan baku lokal ${prodName}`,
      `Edukasi cek keaslian & kehalalan ${prodName} lewat QR B-CHAIN BSI UMKM Center`,
      `Promo paket bundling hemat akhir pekan khusus pembeli B-Market`,
    ],
    headline: `${prodName} Asli ${storeName} — Kualitas Terjaga & Terverifikasi B-CHAIN!`,
    instagramCaption: `✨ Pilihan terbaik ${cat} untuk keluarga tercinta!\n\nKenalan yuk dengan **${prodName}** dari **${storeName}**. Diproses higienis dengan bahan pilihan dan transparan di ekosistem BSI UMKM Center.\n\n💰 ${priceText}\n🎯 ${goal}\n\nPesan amanah langsung lewat B-Market BSI UMKM Center sekarang!\n#BSIUMKMCenter #${storeName.replace(/\s+/g, '')} #ProdukUMKM #BanggaBuatanIndonesia`,
    facebookCaption: `Assalamu'alaikum Sahabat UMKM!\n\nSedang mencari ${prodName} yang terjamin kualitas dan legalitasnya? ${storeName} menghadirkan produk unggulan dengan bahan pilihan (${priceText}).\n\nKunjungi etalase resmi ${storeName} di aplikasi BSI UMKM Center dan cek keaslian batch produksinya lewat fitur B-CHAIN!`,
    whatsappText: `Assalamu'alaikum Kak! 🙏\nPromo spesial dari *${storeName}*:\n✅ *${prodName}*\n💵 ${priceText}\n🔒 Terdaftar di B-Market BSI UMKM Center\n\nMau pesan hari ini? Balas pesan ini atau langsung checkout di B-Market ya Kak!`,
    cta: `Checkout ${prodName} di B-Market (${channel}) sekarang sebelum stok menipis!`,
    weeklyPlan: [
      { day: 'Senin', theme: 'Pengenalan produk & keunggulan bahan baku', channel: 'Instagram' },
      { day: 'Rabu', theme: 'Testimoni pelanggan & bukti verifikasi B-CHAIN', channel: 'WhatsApp Business' },
      { day: 'Jumat', theme: 'Promo Berkah Jumat & ajakan pre-order akhir pekan', channel: 'Facebook' },
      { day: 'Minggu', theme: 'Cerita usaha UMKM & paket bundling keluarga', channel: 'B-Market Promo' },
    ],
  };
}

function buildLocalBFinanceReply(summary: any, transactions: any[], question?: string) {
  const inc = Number(summary?.totalIncome || 0);
  const exp = Number(summary?.totalExpense || 0);
  const net = Number(summary?.netProfit ?? inc - exp);
  const margin = inc > 0 ? Math.round((net / inc) * 100) : 0;

  const expByCat = new Map<string, number>();
  transactions
    .filter((t) => t.type === 'PENGELUARAN')
    .forEach((t) => expByCat.set(t.category, (expByCat.get(t.category) || 0) + Number(t.amount || 0)));
  const topExp = Array.from(expByCat.entries()).sort((a, b) => b[1] - a[1])[0];

  return `📊 **Analisis Keuangan BINA (B-Finance)**${question ? `\n_Menjawab: "${question}"_\n` : '\n'}
• **Total Pemasukan:** ${formatIdr(inc)}
• **Total Pengeluaran:** ${formatIdr(exp)}
• **Laba / Saldo Bersih:** ${formatIdr(net)} (Margin: ${margin}%)
• **Jumlah Transaksi Tercatat:** ${transactions.length} transaksi${
    topExp ? `\n• **Pos Pengeluaran Terbesar:** ${topExp[0]} (${formatIdr(topExp[1])})` : ''
  }

**3 Rekomendasi Praktis:**
1. Pisahkan minimal 20% laba bersih (${formatIdr(Math.max(0, Math.round(net * 0.2)))}) ke rekening modal bahan baku agar arus kas tetap sehat.
2. Pantau biaya pada kategori pengeluaran terbesar${topExp ? ` (${topExp[0]})` : ''} melalui pembelian bahan baku terencana per minggu.
3. Maksimalkan promo produk margin tinggi lewat fitur **B-Smart** untuk mendorong repeat order pelanggan B-Market.`;
}

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'bsi-umkm-center',
    geminiConfigured: Boolean(getGeminiClient()),
  });
});

app.post('/api/blockchain/hash', (req, res) => {
  try {
    const payload = req.body || {};
    const canonical = JSON.stringify({
      productId: payload.productId || '',
      productCode: payload.productCode || '',
      batchNumber: payload.batchNumber || '',
      storeId: payload.storeId || '',
      status: payload.status || 'PENDING VERIFICATION',
      timestamp: payload.timestamp || new Date().toISOString(),
    });
    const hash = '0x' + crypto.createHash('sha256').update(canonical).digest('hex');
    const txId =
      'BCH-' +
      crypto
        .createHash('sha256')
        .update(hash + Date.now())
        .digest('hex')
        .slice(0, 12)
        .toUpperCase();
    const blockNumber = 1842000 + (parseInt(hash.slice(2, 8), 16) % 90000);
    res.json({
      blockchainHash: hash,
      txId,
      blockNumber,
      network: 'BSI Permissioned Ledger (Polygon Edge)',
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Gagal membuat hash blockchain.' });
  }
});

function buildEcosystemSystemInstruction(context: any, rolePersona?: string): string {
  const rawStores =
    Array.isArray(context?.stores) && context.stores.length > 0 ? context.stores : BASELINE_STORES_SUMMARY;
  const rawProducts =
    Array.isArray(context?.products) && context.products.length > 0 ? context.products : BASELINE_PRODUCTS_SUMMARY;

  const storesSummary = rawStores.map((s: any) => ({
    id: s.id,
    name: s.name,
    category: s.category,
    city: s.city || 'Indonesia',
    foundedYear: s.foundedYear || '-',
    description: s.description || 'UMKM binaan BSI UMKM Center',
    foundingStory: s.foundingStory ? String(s.foundingStory).slice(0, 280) : undefined,
    isVerifiedUmkm: !!s.isVerifiedUmkm,
  }));

  const productsSummary = rawProducts.map((p: any) => ({
    id: p.id,
    name: p.name,
    storeName: p.storeName,
    category: p.category,
    price: p.price !== null && p.price !== undefined ? p.price : 'Belum ditetapkan pemilik toko',
    stock: p.stock !== null && p.stock !== undefined ? p.stock : 'Belum diperbarui pemilik toko',
    composition: p.composition || 'Tersedia di detail produk B-Market',
    legalityNumber: p.legalityNumber || 'Terdaftar Binaan BSI',
    expiryDate: p.expiryDate || '-',
    bchainStatus: p.bchainStatus || 'NOT VERIFIED',
    isPublished: p.isPublished !== false,
  }));

  const verificationsSummary = (context?.verifications || []).map((v: any) => ({
    productName: v.productName,
    storeName: v.storeName,
    productCode: v.productCode,
    batchNumber: v.batchNumber || '-',
    status: v.status,
    txId: v.txId,
  }));

  const ordersSummary = (context?.orders || []).map((o: any) => ({
    orderNumber: o.orderNumber,
    storeName: o.storeName,
    total: o.total,
    status: o.status,
    createdAt: o.createdAt,
  }));

  let personaDirective =
    'Peran aktifmu adalah Asisten Belanja & Ekosistem B-Market yang membantu customer menemukan produk UMKM terbaik, mengetahui sejarah toko, memantau pesanan, serta memahami poin B-Edu.';
  if (rolePersona === 'umkm-mentor') {
    personaDirective =
      'Peran aktifmu adalah Mentor Pembinaan Bisnis & Keuangan Syariah bagi pelaku UMKM Binaan BSI. Berikan saran praktis seputar manajemen stok B-Save, strategi konten viral B-Smart, arus kas B-Finance, serta jadwal pembinaan & webinar B-Edu.';
  } else if (rolePersona === 'bchain-halal') {
    personaDirective =
      'Peran aktifmu adalah Spesialis Verifikasi B-CHAIN, Legalitas (NIB/PIRT/BPOM/Halal), dan Ketelusuran Produk UMKM. Jelaskan status verifikasi, nomor batch, serta cara membaca sertifikat transparansi B-CHAIN.';
  } else if (rolePersona === 'fast-assistant') {
    personaDirective =
      'Peran aktifmu adalah Asisten Kilat FAQ BSI UMKM Center. Jawab sangat ringkas, padat (maksimal 3-5 poin singkat), dan langsung ke inti pertanyaan.';
  }

  return `Kamu adalah BINA, chatbot AI resmi BSI UMKM Center yang ramah, hangat, amanah, dan profesional dalam Bahasa Indonesia.
${personaDirective}

ATURAN KETAT KEJUJURAN DATA:
1. Jawab berdasarkan data JSON ekosistem di bawah ini serta fitur resmi BSI UMKM Center (B-Market dengan foto, video produk, sejarah berdirinya UMKM, & chat penjual langsung tanpa nomor WA eksternal; B-Chain; B-AI; B-Edu dengan berita viral, webinar, streak & pecah telur; B-Save; B-Smart; B-Finance).
2. DILARANG mengarang harga, stok, komposisi, nomor legalitas (BPOM/Halal/PIRT), atau status pesanan di luar data di bawah.
3. Berikan rekomendasi spesifik menyebut nama produk, nama toko, tahun berdiri jika ditanyakan, dan harga Rupiah yang akurat dari data.
4. Jangan gunakan format rumus LaTeX ($...$ atau $$...$$).

DATA EKOSISTEM SAAT INI (${context?.portalRole || 'customer'}):
Toko UMKM Binaan: ${JSON.stringify(storesSummary)}
Produk B-Market: ${JSON.stringify(productsSummary)}
Verifikasi B-CHAIN: ${JSON.stringify(verificationsSummary)}
Pesanan Pengguna: ${JSON.stringify(ordersSummary)}`;
}

function buildGeminiHistory(history: any[]) {
  if (!Array.isArray(history)) return [];
  const valid = history
    .filter((h) => h && typeof h.text === 'string' && h.text.trim().length > 0 && h.id !== 'welcome-msg')
    .slice(-14)
    .map((h) => ({
      role: h.role === 'user' ? ('user' as const) : ('model' as const),
      parts: [{ text: h.text }],
    }));

  // Ensure history starts with a user turn and alternates cleanly
  const normalized: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
  for (const item of valid) {
    if (normalized.length === 0 && item.role !== 'user') continue;
    const prev = normalized[normalized.length - 1];
    if (prev && prev.role === item.role) {
      prev.parts[0].text += '\n' + item.parts[0].text;
    } else {
      normalized.push(item);
    }
  }
  if (normalized.length > 0 && normalized[normalized.length - 1].role === 'user') {
    normalized.pop();
  }
  return normalized;
}

function resolveChatModel(rolePersona?: string) {
  if (rolePersona === 'fast-assistant') {
    return {
      model: GEMINI_FAST_MODEL,
      thinkingLevel: ThinkingLevel.MINIMAL,
    };
  }
  return {
    model: GEMINI_MODEL,
    thinkingLevel: ThinkingLevel.LOW,
  };
}

app.post('/api/ai/b-ai', async (req, res) => {
  const { message, history = [], context = {}, rolePersona } = req.body || {};
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Pesan tidak boleh kosong.' });
  }

  const ai = getGeminiClient();
  if (!ai) {
    return res.json({
      reply: buildLocalBAiReply(message, context),
      provider: 'local-assistant',
      model: 'local',
    });
  }

  try {
    const systemInstruction = buildEcosystemSystemInstruction(context, rolePersona);
    const geminiHistory = buildGeminiHistory(history);
    const { model, thinkingLevel } = resolveChatModel(rolePersona);

    const chat = ai.chats.create({
      model,
      history: geminiHistory,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingLevel },
      },
    });

    const response = await chat.sendMessage({ message });

    res.json({
      reply: response.text || buildLocalBAiReply(message, context),
      provider: response.text ? 'gemini' : 'local-fallback',
      model,
    });
  } catch (err: any) {
    console.error('B-AI Chat Error (using data-grounded fallback):', err?.message || err);
    res.json({
      reply: buildLocalBAiReply(message, context),
      provider: 'local-fallback',
      model: 'local',
    });
  }
});

app.post('/api/ai/chat/stream', async (req, res) => {
  const { message, history = [], context = {}, rolePersona } = req.body || {};
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Pesan tidak boleh kosong.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendEvent = (payload: Record<string, any>) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  const ai = getGeminiClient();
  if (!ai) {
    const fallbackText = buildLocalBAiReply(message, context);
    sendEvent({ chunk: fallbackText, provider: 'local-assistant', model: 'local' });
    sendEvent({ done: true, provider: 'local-assistant', model: 'local' });
    return res.end();
  }

  try {
    const systemInstruction = buildEcosystemSystemInstruction(context, rolePersona);
    const geminiHistory = buildGeminiHistory(history);
    const { model, thinkingLevel } = resolveChatModel(rolePersona);

    const chat = ai.chats.create({
      model,
      history: geminiHistory,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingLevel },
      },
    });

    const stream = await chat.sendMessageStream({ message });
    let streamedAny = false;
    for await (const chunk of stream) {
      if (chunk.text) {
        streamedAny = true;
        sendEvent({ chunk: chunk.text, provider: 'gemini', model });
      }
    }

    if (!streamedAny) {
      sendEvent({ chunk: buildLocalBAiReply(message, context), provider: 'local-fallback', model: 'local' });
      sendEvent({ done: true, provider: 'local-fallback', model: 'local' });
    } else {
      sendEvent({ done: true, provider: 'gemini', model });
    }
    return res.end();
  } catch (err: any) {
    console.error('B-AI Stream Error (using fallback):', err?.message || err);
    sendEvent({ chunk: buildLocalBAiReply(message, context), provider: 'local-fallback', model: 'local' });
    sendEvent({ done: true, provider: 'local-fallback', model: 'local' });
    return res.end();
  }
});

app.post('/api/ai/b-smart', async (req, res) => {
  const { store, product, goal, channel } = req.body || {};
  const fallbackPack = buildLocalBSmartPack(store, product, goal, channel);
  const ai = getGeminiClient();
  if (!ai) {
    return res.json({ ...fallbackPack, provider: 'local-assistant' });
  }

  try {
    const prompt = `Buat paket materi pemasaran digital dalam Bahasa Indonesia untuk UMKM binaan BSI UMKM Center berikut:
Nama Toko: ${store?.name || 'UMKM Binaan'}
Kategori Usaha: ${store?.category || 'Umum'}
Deskripsi Usaha: ${store?.description || 'Produk unggulan UMKM'}
Produk Fokus: ${product?.name || 'Produk Unggulan Toko'}
Deskripsi Produk: ${product?.description || 'Produk berkualitas dari UMKM Binaan'}
Harga Produk: ${product?.price ? `Rp ${Number(product.price).toLocaleString('id-ID')}` : 'Hubungi toko untuk info harga terbaru'}
Kanal Utama: ${channel || 'Instagram'}
Tujuan Kampanye: ${goal || 'Meningkatkan penjualan dan kesadaran merek'}

Pastikan seluruh copywriting sopan, amanah, persuasif, dan TIDAK mengarang klaim legalitas/harga yang tidak diberikan di atas.`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            contentIdeas: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 sampai 4 ide konten kreatif sesuai jenis usaha',
            },
            headline: { type: Type.STRING, description: 'Headline promosi utama yang menarik' },
            instagramCaption: {
              type: Type.STRING,
              description: 'Caption siap unggah untuk Instagram lengkap dengan tagar relevan',
            },
            facebookCaption: { type: Type.STRING, description: 'Caption naratif ramah untuk Facebook' },
            whatsappText: {
              type: Type.STRING,
              description: 'Pesan singkat siap kirim ke pelanggan',
            },
            cta: { type: Type.STRING, description: 'Call to action yang kuat dan jelas' },
            weeklyPlan: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.STRING },
                  theme: { type: Type.STRING },
                  channel: { type: Type.STRING },
                },
              },
              description: 'Rencana konten mingguan 4 hari rekomendasi frekuensi unggahan',
            },
          },
          required: [
            'contentIdeas',
            'headline',
            'instagramCaption',
            'facebookCaption',
            'whatsappText',
            'cta',
            'weeklyPlan',
          ],
        },
      },
    });

    const parsed = safeParseJson(response.text, fallbackPack);
    res.json({ ...parsed, provider: 'gemini' });
  } catch (err: any) {
    console.error('B-Smart Error (using fallback):', err?.message || err);
    res.json({ ...fallbackPack, provider: 'local-fallback' });
  }
});

app.post('/api/ai/b-finance', async (req, res) => {
  const { mode, description, amount, summary, transactions, question } = req.body || {};
  const ai = getGeminiClient();

  if (mode === 'categorize') {
    const descLower = String(description || '').toLowerCase();
    const fallbackCategorize = () => {
      const isIncome =
        descLower.includes('jual') ||
        descLower.includes('order') ||
        descLower.includes('bazar') ||
        descLower.includes('terima') ||
        descLower.includes('masuk') ||
        descLower.includes('transfer pelanggan');
      return {
        type: isIncome ? 'PEMASUKAN' : 'PENGELUARAN',
        category: isIncome
          ? descLower.includes('jual') || descLower.includes('order') || descLower.includes('bazar')
            ? 'Penjualan'
            : 'Pemasukan Lainnya'
          : descLower.includes('bahan') || descLower.includes('kemasan') || descLower.includes('tepung') || descLower.includes('ikan')
          ? 'Pembelian Bahan'
          : 'Biaya Operasional',
        reason: isIncome
          ? 'Dikategorikan otomatis sebagai arus kas masuk penjualan/usaha.'
          : 'Dikategorikan otomatis sebagai pengeluaran bahan/operasional usaha.',
      };
    };

    const fallbackCat = fallbackCategorize();
    if (!ai) return res.json({ ...fallbackCat, provider: 'local-assistant' });

    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: `Kategorikan transaksi keuangan UMKM ini: "${description}" dengan nominal Rp ${amount || 0}.`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, description: 'Harus tepat PEMASUKAN atau PENGELUARAN' },
              category: {
                type: Type.STRING,
                description:
                  'Salah satu dari: Penjualan, Pemasukan Lainnya, Pembelian Bahan, Biaya Operasional, Biaya Lainnya',
              },
              reason: { type: Type.STRING, description: 'Penjelasan singkat dalam Bahasa Indonesia' },
            },
            required: ['type', 'category', 'reason'],
          },
        },
      });
      const parsed = safeParseJson(response.text, fallbackCat);
      return res.json({ ...parsed, provider: 'gemini' });
    } catch {
      return res.json({ ...fallbackCat, provider: 'local-fallback' });
    }
  }

  if (!ai) {
    return res.json({
      reply: buildLocalBFinanceReply(summary, transactions || [], question),
      provider: 'local-assistant',
    });
  }

  try {
    const prompt = `Kamu adalah Asisten Keuangan Syariah BINA pada fitur B-Finance BSI UMKM Center.
Analisis HANYA berdasarkan data keuangan nyata UMKM berikut (jangan mengarang angka):
Ringkasan Keuangan: ${JSON.stringify(summary || {})}
Daftar Transaksi Terbaru (${(transactions || []).length} data): ${JSON.stringify((transactions || []).slice(0, 30))}

${
  question
    ? `Pertanyaan pemilik UMKM: ${question}`
    : 'Berikan ringkasan kondisi arus kas, analisis pemasukan vs pengeluaran, serta 3 rekomendasi praktis pengelolaan keuangan UMKM.'
}

Jawab dalam Bahasa Indonesia yang rapi, terstruktur, dan akurat sesuai angka di atas. Jangan gunakan format rumus LaTeX ($...$ atau $$...$$); tulis perhitungan secara biasa dengan angka Rupiah dan persen yang mudah dibaca.`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });

    res.json({
      reply: response.text || buildLocalBFinanceReply(summary, transactions || [], question),
      provider: response.text ? 'gemini' : 'local-fallback',
    });
  } catch (err: any) {
    console.error('B-Finance AI Error (using fallback):', err?.message || err);
    res.json({
      reply: buildLocalBFinanceReply(summary, transactions || [], question),
      provider: 'local-fallback',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BSI UMKM Center server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
