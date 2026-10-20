import * as XLSX from 'xlsx';
import { SalesRecord } from '../types/sales';

/**
 * Format currency number as clean integer/decimal for Excel cells
 */
function cleanNumber(val: any): number {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

/**
 * Helper to auto-fit or set reasonable column widths
 */
function setColWidths(ws: XLSX.WorkSheet, colWidths: number[]) {
  ws['!cols'] = colWidths.map(w => ({ wch: w }));
}

/**
 * 1. EXPORT ALL DASHBOARD DATA INTO A COMPREHENSIVE MULTI-SHEET WORKBOOK (.xlsx)
 */
export function exportAllDashboardToExcel(
  allData: SalesRecord[],
  filteredData: SalesRecord[],
  options?: {
    ketFilter?: string;
    brandFilter?: string;
  }
) {
  const wb = XLSX.utils.book_new();
  const dateStr = new Date().toISOString().slice(0, 10);

  // -------------------------------------------------------------
  // Sheet 1: RINGKASAN EKSEKUTIF (Executive Summary & KPIs)
  // -------------------------------------------------------------
  const totalOmset = filteredData.reduce((s, r) => s + (r.value || 0), 0);
  const totalQty = filteredData.reduce((s, r) => s + (r.qty || 0), 0);
  const uniqueStores = new Set(filteredData.map(r => r.namaStore).filter(Boolean)).size;
  const uniqueBA = new Set(filteredData.map(r => r.ba).filter(Boolean)).size;
  const aov = uniqueStores > 0 ? Math.round(totalOmset / uniqueStores) : 0;

  // Breakdown per Brand
  const brands = ['Y.O.U', 'barenbliss', 'lavojoy', 'DAZZLE ME'];
  const brandSummary = brands.map(b => {
    const bRows = filteredData.filter(r => (r.brand || '').toLowerCase() === b.toLowerCase());
    const val = bRows.reduce((s, r) => s + (r.value || 0), 0);
    const qty = bRows.reduce((s, r) => s + (r.qty || 0), 0);
    const share = totalOmset > 0 ? (val / totalOmset) * 100 : 0;
    const stores = new Set(bRows.map(r => r.namaStore)).size;
    return {
      Brand: b,
      'Total Omset (Rp)': val,
      'Total Volume (Pcs)': qty,
      'Share Omset (%)': Number(share.toFixed(1)),
      'Toko Terjangkau': stores
    };
  });

  const summaryAoa: any[][] = [
    ['RINGKASAN EKSEKUTIF PENJUALAN KOSMETIK (BEAUTY SALES INTELLIGENCE)'],
    ['Tanggal Export:', new Date().toLocaleString('id-ID')],
    ['Total Baris Data:', filteredData.length],
    [],
    ['METRIK UTAMA (KPI)', 'NILAI', 'SATUAN'],
    ['Total Omset Penjualan (Value)', totalOmset, 'Rupiah'],
    ['Total Volume Penjualan (Qty)', totalQty, 'Pieces'],
    ['Jumlah Toko Aktif Berbelanja', uniqueStores, 'Toko/Outlet'],
    ['Jumlah Beauty Advisor (BA)', uniqueBA, 'Personil'],
    ['Rata-rata Transaksi per Toko (AOV)', aov, 'Rupiah/Toko'],
    [],
    ['KOMPOSISI OMSET PER BRAND:'],
    ['Merek', 'Total Omset (Rp)', 'Total Volume (Pcs)', 'Share (%)', 'Toko Terjangkau'],
    ...brandSummary.map(b => [b.Brand, b['Total Omset (Rp)'], b['Total Volume (Pcs)'], `${b['Share Omset (%)']}%`, b['Toko Terjangkau']])
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryAoa);
  setColWidths(wsSummary, [35, 25, 20, 15, 18]);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Eksekutif');

  // -------------------------------------------------------------
  // Sheet 2: DATA TRANSAKSI LENGKAP (Filtered Transactions)
  // -------------------------------------------------------------
  const transactionRows = filteredData.map((r, idx) => ({
    'No': idx + 1,
    'Tanggal': r.tanggal,
    'Bulan': r.bulan,
    'Tahun': r.tahun,
    'Brand': r.brand,
    'No SKU': r.noSku || '-',
    'SPU': r.spu || '-',
    'Nama SKU': r.sku,
    'Kategori': r.kategori,
    'Nama Store': r.namaStore,
    'Region': r.region,
    'Cover Area': r.coverArea,
    'Sales': r.sales,
    'SPV': r.spv,
    'BA': r.ba,
    'BA Number': r.baNumber || '-',
    'Qty (Pcs)': cleanNumber(r.qty),
    'Value (Rp)': cleanNumber(r.value),
    'Status (KET)': r.ket || 'SELL IN',
    'Produk Fokus': r.produkFokus || '-',
    'Produk New': r.produkNew || '-'
  }));

  const wsTx = XLSX.utils.json_to_sheet(transactionRows);
  setColWidths(wsTx, [6, 12, 10, 8, 14, 14, 14, 38, 16, 28, 14, 16, 18, 18, 18, 14, 12, 16, 12, 14, 14]);
  XLSX.utils.book_append_sheet(wb, wsTx, 'Data Transaksi');

  // -------------------------------------------------------------
  // Sheet 3: TOP 10 SKU PER BRAND (Produk Unggulan)
  // -------------------------------------------------------------
  const topSkuRows: any[] = [];
  brands.forEach(b => {
    const bRows = filteredData.filter(r => (r.brand || '').toLowerCase() === b.toLowerCase());
    const bTotalVal = bRows.reduce((s, r) => s + (r.value || 0), 0);

    const skuMap = new Map<string, {
      noSku: string;
      sku: string;
      kategori: string;
      qty: number;
      val: number;
      stores: Set<string>;
      isFocus: boolean;
      isNew: boolean;
    }>();

    bRows.forEach(r => {
      const key = r.noSku ? r.noSku.trim() : r.sku.trim();
      if (!skuMap.has(key)) {
        skuMap.set(key, {
          noSku: r.noSku || '-',
          sku: r.sku,
          kategori: r.kategori,
          qty: 0,
          val: 0,
          stores: new Set(),
          isFocus: Boolean(r.produkFokus && r.produkFokus !== '-'),
          isNew: Boolean(r.produkNew && r.produkNew !== '-')
        });
      }
      const item = skuMap.get(key)!;
      item.qty += r.qty || 0;
      item.val += r.value || 0;
      if (r.namaStore) item.stores.add(r.namaStore);
    });

    const top10 = Array.from(skuMap.values())
      .sort((a, b) => b.val - a.val)
      .slice(0, 10);

    top10.forEach((item, idx) => {
      topSkuRows.push({
        'Brand': b,
        'Rank': idx + 1,
        'No SKU': item.noSku,
        'Nama SKU': item.sku,
        'Kategori': item.kategori,
        'Total Qty (Pcs)': item.qty,
        'Total Omset (Rp)': item.val,
        'Kontribusi Omset (%)': bTotalVal > 0 ? Number(((item.val / bTotalVal) * 100).toFixed(1)) : 0,
        'Jumlah Toko': item.stores.size,
        'Produk Fokus': item.isFocus ? 'Fokus' : '-',
        'Produk Baru': item.isNew ? 'New' : '-'
      });
    });
  });

  const wsTopSku = XLSX.utils.json_to_sheet(topSkuRows);
  setColWidths(wsTopSku, [14, 6, 14, 40, 16, 14, 18, 18, 12, 14, 14]);
  XLSX.utils.book_append_sheet(wb, wsTopSku, 'Top 10 SKU per Brand');

  // -------------------------------------------------------------
  // Sheet 4: SKU LAMBAT GERAK (Slow-Moving Inventory)
  // -------------------------------------------------------------
  const slowMap = new Map<string, {
    noSku: string;
    brand: string;
    sku: string;
    kategori: string;
    qty: number;
    val: number;
    stores: Set<string>;
    isFocus: boolean;
    isNew: boolean;
  }>();

  filteredData.forEach(r => {
    const key = r.noSku ? r.noSku.trim() : r.sku.trim();
    if (!slowMap.has(key)) {
      slowMap.set(key, {
        noSku: r.noSku || '-',
        brand: r.brand,
        sku: r.sku,
        kategori: r.kategori,
        qty: 0,
        val: 0,
        stores: new Set(),
        isFocus: Boolean(r.produkFokus && r.produkFokus !== '-'),
        isNew: Boolean(r.produkNew && r.produkNew !== '-')
      });
    }
    const item = slowMap.get(key)!;
    item.qty += r.qty || 0;
    item.val += r.value || 0;
    if (r.namaStore) item.stores.add(r.namaStore);
  });

  const slowRows = Array.from(slowMap.values())
    .filter(i => i.qty <= 5) // threshold slow moving
    .sort((a, b) => a.qty - b.qty)
    .map((s, idx) => {
      let rekomendasi = 'Promo Bundling & Cross-Selling';
      if (s.qty <= 1) rekomendasi = 'Clearance Sale / Discontinue';
      else if (s.isFocus) rekomendasi = 'Review Display & Push BA Khusus';

      return {
        'No': idx + 1,
        'Brand': s.brand,
        'No SKU': s.noSku,
        'Nama SKU': s.sku,
        'Kategori': s.kategori,
        'Total Qty Terjual': s.qty,
        'Total Omset (Rp)': s.val,
        'Jumlah Toko': s.stores.size,
        'Status Produk': s.isFocus ? 'Fokus' : s.isNew ? 'New' : 'Reguler',
        'Rekomendasi Tindakan': rekomendasi
      };
    });

  const wsSlow = XLSX.utils.json_to_sheet(slowRows);
  setColWidths(wsSlow, [6, 14, 14, 40, 16, 16, 18, 12, 14, 30]);
  XLSX.utils.book_append_sheet(wb, wsSlow, 'SKU Lambat Gerak');

  // Trigger download file .xlsx
  const filename = `BeautySales_Semua_Data_${dateStr}.xlsx`;
  XLSX.writeFile(wb, filename);
  return filename;
}

/**
 * 2. EXPORT RAW/FILTERED TRANSACTION TABLE TO EXCEL
 */
export function exportTransactionsToExcel(data: SalesRecord[], customFilename?: string) {
  const wb = XLSX.utils.book_new();
  const dateStr = new Date().toISOString().slice(0, 10);

  const rows = data.map((r, idx) => ({
    'No': idx + 1,
    'Tanggal': r.tanggal,
    'Bulan': r.bulan,
    'Tahun': r.tahun,
    'Brand': r.brand,
    'No SKU': r.noSku || '-',
    'SPU': r.spu || '-',
    'Nama SKU': r.sku,
    'Kategori': r.kategori,
    'Nama Store': r.namaStore,
    'Region': r.region,
    'Cover Area': r.coverArea,
    'Sales': r.sales,
    'SPV': r.spv,
    'BA': r.ba,
    'BA Number': r.baNumber || '-',
    'Qty (Pcs)': cleanNumber(r.qty),
    'Value (Rp)': cleanNumber(r.value),
    'Status (KET)': r.ket || 'SELL IN',
    'Produk Fokus': r.produkFokus || '-',
    'Produk New': r.produkNew || '-'
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  setColWidths(ws, [6, 12, 10, 8, 14, 14, 14, 38, 16, 28, 14, 16, 18, 18, 18, 14, 12, 16, 12, 14, 14]);
  XLSX.utils.book_append_sheet(wb, ws, 'Transaksi Penjualan');

  const filename = customFilename || `Data_Transaksi_Penjualan_${dateStr}.xlsx`;
  XLSX.writeFile(wb, filename);
  return filename;
}

/**
 * 3. EXPORT TOP 10 SKU PER BRAND TO EXCEL
 */
export function exportTop10SkuToExcel(
  items: any[],
  brand: string,
  metric: 'value' | 'qty',
  periodLabel: string,
  ketFilter: string
) {
  const wb = XLSX.utils.book_new();
  const dateStr = new Date().toISOString().slice(0, 10);

  const rows = items.map((s, idx) => ({
    'Peringkat': idx + 1,
    'Brand': s.brand,
    'Periode': periodLabel,
    'Tipe Transaksi': ketFilter === 'all' ? 'SEMUA STATUS' : ketFilter,
    'No SKU': s.noSku || '-',
    'Nama SKU': s.sku,
    'Kategori': s.kategori,
    'Total Kuantiti (Pcs)': cleanNumber(s.totalQty),
    'Total Omset (Rp)': cleanNumber(s.totalValue),
    'Kontribusi Omset (%)': Number((s.share || 0).toFixed(1)),
    'Toko Terjangkau': s.storesCount || 0,
    'Status': s.isFocus ? 'Produk Fokus' : s.isNew ? 'Produk Baru' : '-'
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  setColWidths(ws, [10, 14, 20, 16, 14, 40, 16, 18, 18, 18, 15, 15]);
  XLSX.utils.book_append_sheet(wb, ws, `Top 10 ${brand}`);

  const cleanBrand = brand.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Top10_SKU_${cleanBrand}_${dateStr}.xlsx`;
  XLSX.writeFile(wb, filename);
  return filename;
}

/**
 * 4. EXPORT SLOW-MOVING SKUS TO EXCEL
 */
export function exportSlowMovingToExcel(
  items: any[],
  threshold: number,
  ketFilter: string
) {
  const wb = XLSX.utils.book_new();
  const dateStr = new Date().toISOString().slice(0, 10);
  const cleanKet = ketFilter && ketFilter !== 'all' ? `_${ketFilter.replace(/\s+/g, '_')}` : '';

  const rows = items.map((s, idx) => {
    let rec = 'Promo Bundling & Cross-Selling';
    if (s.totalQty <= 2) rec = 'Clearance Sale / Discontinue';
    else if (s.isFocus) rec = 'Push Khusus Display & BA';

    return {
      'No': idx + 1,
      'Brand': s.brand,
      'Tipe Transaksi': ketFilter === 'all' ? 'SEMUA TRANSAKSI' : ketFilter,
      'No SKU': s.noSku || '-',
      'Nama SKU': s.sku,
      'Kategori': s.kategori,
      'Total Qty Terjual': cleanNumber(s.totalQty),
      'Total Omset (Rp)': cleanNumber(s.totalValue),
      'Toko Terjangkau': s.storesCount || 0,
      'Status': s.isFocus ? 'Fokus' : s.isNew ? 'New' : '-',
      'Rekomendasi Tindakan': rec
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  setColWidths(ws, [6, 14, 18, 14, 40, 16, 16, 18, 15, 12, 30]);
  XLSX.utils.book_append_sheet(wb, ws, 'SKU Lambat Gerak');

  const filename = `Laporan_SKU_Lambat_Gerak${cleanKet}_${dateStr}.xlsx`;
  XLSX.writeFile(wb, filename);
  return filename;
}

/**
 * 5. EXPORT PERIOD COMPARISON (WoW, MoM, YoY) TO EXCEL
 */
export function exportPeriodComparisonToExcel(
  brandData: any[],
  categoryData: any[],
  salesData: any[],
  decliningStores: any[],
  gainingStores: any[],
  mode: string,
  primaryLabel: string,
  compareLabel: string,
  ketFilter: string
) {
  const wb = XLSX.utils.book_new();
  const dateStr = new Date().toISOString().slice(0, 10);
  const modeTitle = mode === 'wow' ? 'Week vs Week' : mode === 'mom' ? 'Month vs Month' : 'Year vs Year';

  // Sheet 1: 10 Toko Penurunan Tertinggi
  const dropperRows = decliningStores.map((s, idx) => ({
    'Peringkat': idx + 1,
    'Nama Toko': s.namaStore,
    'Brand Dominan': s.brand,
    'Sales Rep': s.sales,
    'Region': s.region,
    [`Omset ${primaryLabel} (Rp)`]: cleanNumber(s.primaryValue),
    [`Omset ${compareLabel} (Rp)`]: cleanNumber(s.compareValue),
    'Penurunan Omset (Rp)': cleanNumber(s.diff),
    'Penurunan (%)': Number((s.percent || 0).toFixed(1)),
    'Selisih Volume (Qty)': cleanNumber(s.diffQty)
  }));
  const wsDroppers = XLSX.utils.json_to_sheet(dropperRows);
  setColWidths(wsDroppers, [10, 30, 14, 18, 14, 22, 22, 20, 15, 18]);
  XLSX.utils.book_append_sheet(wb, wsDroppers, '10 Toko Penurunan Tertinggi');

  // Sheet 2: 10 Toko Kenaikan Tertinggi
  const gainerRows = gainingStores.map((s, idx) => ({
    'Peringkat': idx + 1,
    'Nama Toko': s.namaStore,
    'Brand Dominan': s.brand,
    'Sales Rep': s.sales,
    'Region': s.region,
    [`Omset ${primaryLabel} (Rp)`]: cleanNumber(s.primaryValue),
    [`Omset ${compareLabel} (Rp)`]: cleanNumber(s.compareValue),
    'Kenaikan Omset (Rp)': cleanNumber(s.diff),
    'Kenaikan (%)': Number((s.percent || 0).toFixed(1)),
    'Pertambahan Qty (Pcs)': cleanNumber(s.diffQty)
  }));
  const wsGainers = XLSX.utils.json_to_sheet(gainerRows);
  setColWidths(wsGainers, [10, 30, 14, 18, 14, 22, 22, 20, 15, 18]);
  XLSX.utils.book_append_sheet(wb, wsGainers, '10 Toko Kenaikan Tertinggi');

  // Sheet 3: Perbandingan Brand
  const brandRows = brandData.map(b => ({
    'Merek': b.name,
    [`Omset ${primaryLabel} (Rp)`]: cleanNumber(b.primaryValue),
    [`Omset ${compareLabel} (Rp)`]: cleanNumber(b.compareValue),
    'Pertumbuhan Omset (Rp)': cleanNumber(b.diff),
    'Pertumbuhan (%)': Number((b.growthPercent || 0).toFixed(1)),
    [`Qty ${primaryLabel}`]: cleanNumber(b.primaryQty),
    [`Qty ${compareLabel}`]: cleanNumber(b.compareQty),
    'Selisih Qty': cleanNumber(b.diffQty)
  }));
  const wsBrand = XLSX.utils.json_to_sheet(brandRows);
  setColWidths(wsBrand, [16, 22, 22, 20, 15, 16, 16, 14]);
  XLSX.utils.book_append_sheet(wb, wsBrand, 'Pertumbuhan per Merek');

  // Sheet 4: Perbandingan Kategori
  const catRows = categoryData.map(c => ({
    'Kategori': c.name,
    [`Omset ${primaryLabel} (Rp)`]: cleanNumber(c.primaryValue),
    [`Omset ${compareLabel} (Rp)`]: cleanNumber(c.compareValue),
    'Pertumbuhan Omset (Rp)': cleanNumber(c.diff),
    'Pertumbuhan (%)': Number((c.growthPercent || 0).toFixed(1)),
    'Selisih Qty': cleanNumber(c.diffQty)
  }));
  const wsCat = XLSX.utils.json_to_sheet(catRows);
  setColWidths(wsCat, [20, 22, 22, 20, 15, 14]);
  XLSX.utils.book_append_sheet(wb, wsCat, 'Pertumbuhan per Kategori');

  const filename = `Komparasi_Periode_${mode.toUpperCase()}_${dateStr}.xlsx`;
  XLSX.writeFile(wb, filename);
  return filename;
}

/**
 * 6. EXPORT GROWTH & ACHIEVEMENT MATRIX TO EXCEL
 */
export function exportAchievementMatrixToExcel(
  items: any[],
  timeframe: string,
  targetMarginPercent: number,
  salesFilter?: string,
  regionFilter?: string,
  ketFilter?: string
) {
  const wb = XLSX.utils.book_new();
  const dateStr = new Date().toISOString().slice(0, 10);
  const cleanSales = salesFilter && salesFilter !== 'all' ? salesFilter.replace(/[^a-zA-Z0-9]/g, '_') : 'SemuaSales';
  const cleanRegion = regionFilter && regionFilter !== 'all' ? regionFilter.replace(/[^a-zA-Z0-9]/g, '_') : 'SemuaRegion';
  const cleanKet = ketFilter && ketFilter !== 'all' ? `_${ketFilter.replace(/\s+/g, '_')}` : '';

  const rows = items.map(item => ({
    'Periode': item.label,
    'Filter Transaksi': ketFilter && ketFilter !== 'all' ? ketFilter : 'SEMUA TRANSAKSI (SELL IN & SELL OUT)',
    'Filter Sales': salesFilter && salesFilter !== 'all' ? salesFilter : 'SEMUA SALES',
    'Filter Region': regionFilter && regionFilter !== 'all' ? regionFilter : 'SEMUA REGION',
    'Total Omset All (Rp)': cleanNumber(item.totalActualValue),
    'Growth All (Rp)': cleanNumber(item.totalGrowthDiff),
    'Growth All (%)': Number((item.totalGrowthPercent || 0).toFixed(2)),
    'Omset Y.O.U (Rp)': cleanNumber(item.val_you),
    'Growth Y.O.U (%)': Number((item.brands?.['Y.O.U']?.growthPercent || 0).toFixed(2)),
    'Omset barenbliss (Rp)': cleanNumber(item.val_bnb),
    'Growth BNB (%)': Number((item.brands?.['barenbliss']?.growthPercent || 0).toFixed(2)),
    'Omset lavojoy (Rp)': cleanNumber(item.val_lav),
    'Growth LAV (%)': Number((item.brands?.['lavojoy']?.growthPercent || 0).toFixed(2)),
    'Omset DAZZLE ME (Rp)': cleanNumber(item.val_daz),
    'Growth DAZ (%)': Number((item.brands?.['DAZZLE ME']?.growthPercent || 0).toFixed(2)),
    'Target Omset (Rp)': cleanNumber(item.totalTargetValue),
    'Pencapaian Target (%)': Number((item.totalAchievementRate || 0).toFixed(1)),
    'Status Target': item.totalAchievementRate >= 100 ? 'TERCAPAI' : 'BELUM TERCAPAI'
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  setColWidths(ws, [16, 22, 18, 16, 20, 18, 15, 18, 15, 18, 15, 18, 15, 18, 15, 18, 18, 16]);
  XLSX.utils.book_append_sheet(wb, ws, `Pencapaian ${timeframe}`);

  const filename = `Growth_Pencapaian_${timeframe.toUpperCase()}_${cleanSales}_${cleanRegion}${cleanKet}_${dateStr}.xlsx`;
  XLSX.writeFile(wb, filename);
  return filename;
}

/**
 * 7. EXPORT VISUAL CHARTS & TREND ANALYSIS TO EXCEL
 */
export function exportChartsToExcel(
  timelineData: any[],
  brandData: any[],
  topStoresData: any[],
  categoryData: any[],
  metricMode: 'value' | 'qty',
  ketFilter: string
) {
  const wb = XLSX.utils.book_new();
  const dateStr = new Date().toISOString().slice(0, 10);
  const cleanKet = ketFilter && ketFilter !== 'all' ? `_${ketFilter.replace(/\s+/g, '_')}` : '';

  // Sheet 1: Tren Harian
  const tRows = timelineData.map(t => ({
    'Tanggal': t.tanggal,
    'Tipe Transaksi': ketFilter === 'all' ? 'SEMUA TRANSAKSI' : ketFilter,
    'Total Omset (Rp)': cleanNumber(t.value),
    'Total Volume (Pcs)': cleanNumber(t.qty)
  }));
  const wsTime = XLSX.utils.json_to_sheet(tRows);
  setColWidths(wsTime, [16, 20, 20, 18]);
  XLSX.utils.book_append_sheet(wb, wsTime, 'Tren Harian');

  // Sheet 2: Pangsa Merek
  const totalVal = brandData.reduce((s, b) => s + (b.value || 0), 0);
  const bRows = brandData.map(b => ({
    'Brand': b.name,
    'Total Omset (Rp)': cleanNumber(b.value),
    'Total Volume (Pcs)': cleanNumber(b.qty),
    'Kontribusi Omset (%)': totalVal > 0 ? Number(((b.value / totalVal) * 100).toFixed(2)) : 0
  }));
  const wsBrand = XLSX.utils.json_to_sheet(bRows);
  setColWidths(wsBrand, [18, 20, 18, 20]);
  XLSX.utils.book_append_sheet(wb, wsBrand, 'Pangsa Merek');

  // Sheet 3: Top Toko
  const sRows = topStoresData.map((s, idx) => ({
    'Peringkat': idx + 1,
    'Nama Toko': s.store,
    'Total Omset (Rp)': cleanNumber(s.value),
    'Total Volume (Pcs)': cleanNumber(s.qty)
  }));
  const wsStore = XLSX.utils.json_to_sheet(sRows);
  setColWidths(wsStore, [10, 32, 20, 18]);
  XLSX.utils.book_append_sheet(wb, wsStore, 'Top Toko');

  // Sheet 4: Kategori
  const cRows = categoryData.map(c => ({
    'Kategori': c.category,
    'Total Omset (Rp)': cleanNumber(c.value),
    'Total Volume (Pcs)': cleanNumber(c.qty)
  }));
  const wsCat = XLSX.utils.json_to_sheet(cRows);
  setColWidths(wsCat, [20, 20, 18]);
  XLSX.utils.book_append_sheet(wb, wsCat, 'Kategori Produk');

  const filename = `Visualisasi_Tren_Penjualan${cleanKet}_${dateStr}.xlsx`;
  XLSX.writeFile(wb, filename);
  return filename;
}
