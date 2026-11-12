import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import type { FinancialTransaction, ProductVerification } from '../types.ts';

export function formatRupiah(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return 'Belum ditetapkan pemilik toko';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return 'Belum diisi';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export async function generateSha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return '0x' + hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function compressImageToDataUrl(file: File, maxWidth = 720, quality = 0.78): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Gagal memproses gambar.'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('File gambar tidak valid.'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.readAsDataURL(file);
  });
}

export function exportBChainCertificatePdf(v: ProductVerification): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  doc.setFillColor(0, 107, 104);
  doc.rect(0, 0, 210, 38, 'F');
  doc.setFillColor(248, 173, 60);
  doc.rect(0, 38, 210, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('BSI UMKM CENTER — SERTIFIKAT B-CHAIN', 18, 19);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistem Verifikasi Transparansi & Keaslian Produk UMKM Berbasis Blockchain', 18, 28);

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Status Verifikasi: ${v.status}`, 18, 54);

  const rows: [string, string][] = [
    ['Nama Produk', v.productName],
    ['Nama UMKM Binaan', v.storeName],
    ['Kode Produk', v.productCode],
    ['Nomor Batch Produksi', v.batchNumber || 'Belum diisi pemilik toko'],
    ['Tanggal Produksi', v.productionDate || 'Belum diisi pemilik toko'],
    ['Masa Simpan / Konsumsi', v.shelfLife || 'Belum diisi pemilik toko'],
    ['Tanggal Kedaluwarsa', v.expiryDate || 'Belum diisi pemilik toko'],
    ['Informasi Legalitas', v.legalityInfo || 'Belum diisi pemilik toko'],
    ['Jaringan Blockchain', v.network || 'BSI Permissioned Ledger'],
    ['Nomor Blok', `#${v.blockNumber}`],
    ['Transaction ID', v.txId],
    ['Blockchain Hash', v.blockchainHash],
    ['Waktu Pencatatan', formatDateTime(v.updatedAt || v.createdAt)],
  ];

  let y = 66;
  rows.forEach(([label, value], idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(244, 246, 246);
      doc.rect(16, y - 5, 178, 11, 'F');
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    doc.text(label, 18, y + 1.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    const wrapped = doc.splitTextToSize(value, 110);
    doc.text(wrapped, 78, y + 1.5);
    y += Math.max(11, wrapped.length * 5 + 4);
  });

  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Dokumen ini diterbitkan secara otomatis oleh modul B-CHAIN BSI UMKM Center. Keabsahan catatan dapat dipindai melalui QR Code pada platform.',
    18,
    276,
    { maxWidth: 174 }
  );

  doc.save(`Sertifikat-BCHAIN-${v.productCode}.pdf`);
}

export function exportFinancialReportPdf(
  storeName: string,
  transactions: FinancialTransaction[],
  summary: { totalIncome: number; totalExpense: number; netProfit: number; balance: number }
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  doc.setFillColor(0, 163, 157);
  doc.rect(0, 0, 210, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`LAPORAN KEUANGAN B-FINANCE — ${storeName}`, 16, 16);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Dicetak pada: ${formatDateTime(new Date().toISOString())}`, 16, 24);

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Ringkasan Laba Rugi & Arus Kas', 16, 44);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Total Pemasukan   : ${formatRupiah(summary.totalIncome)}`, 16, 53);
  doc.text(`Total Pengeluaran : ${formatRupiah(summary.totalExpense)}`, 16, 60);
  doc.text(`Laba / Rugi Bersih: ${formatRupiah(summary.netProfit)}`, 16, 67);
  doc.text(`Saldo Kas Tercatat: ${formatRupiah(summary.balance)}`, 16, 74);

  doc.setFont('helvetica', 'bold');
  doc.text('Rincian Transaksi', 16, 88);

  let y = 96;
  doc.setFontSize(8.5);
  doc.setFillColor(226, 232, 240);
  doc.rect(16, y - 5, 178, 8, 'F');
  doc.text('Tanggal', 18, y);
  doc.text('Jenis', 42, y);
  doc.text('Kategori', 68, y);
  doc.text('Keterangan', 102, y);
  doc.text('Nominal', 162, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  transactions.slice(0, 30).forEach((tx) => {
    if (y > 272) {
      doc.addPage();
      y = 20;
    }
    doc.text(tx.date.slice(0, 10), 18, y);
    doc.text(tx.type, 42, y);
    doc.text(tx.category.slice(0, 18), 68, y);
    doc.text((tx.description || '-').slice(0, 30), 102, y);
    doc.text(formatRupiah(tx.amount), 162, y);
    y += 7;
  });

  doc.save(`Laporan-Keuangan-${storeName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}

export function exportFinancialReportExcel(
  storeName: string,
  transactions: FinancialTransaction[],
  summary: { totalIncome: number; totalExpense: number; netProfit: number; balance: number }
): void {
  const summarySheet = XLSX.utils.json_to_sheet([
    { Metrik: 'Nama UMKM', Nilai: storeName },
    { Metrik: 'Total Pemasukan', Nilai: summary.totalIncome },
    { Metrik: 'Total Pengeluaran', Nilai: summary.totalExpense },
    { Metrik: 'Laba / Rugi Bersih', Nilai: summary.netProfit },
    { Metrik: 'Saldo Kas', Nilai: summary.balance },
  ]);

  const txRows = transactions.map((tx) => ({
    Tanggal: tx.date,
    Jenis: tx.type,
    Kategori: tx.category,
    Keterangan: tx.description,
    Sumber: tx.source,
    Nominal: tx.amount,
  }));
  const txSheet = XLSX.utils.json_to_sheet(txRows);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Ringkasan');
  XLSX.utils.book_append_sheet(wb, txSheet, 'Transaksi');
  XLSX.writeFile(wb, `Laporan-Keuangan-${storeName.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
}
