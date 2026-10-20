import React, { useState, useMemo } from 'react';
import { 
  AlertOctagon, 
  PackageMinus, 
  HelpCircle, 
  ArrowRight, 
  Filter, 
  Download, 
  Sparkles,
  ShoppingBag,
  TrendingDown,
  Layers,
  Store,
  Tag,
  FileSpreadsheet
} from 'lucide-react';
import { SalesRecord } from '../types/sales';
import { formatRupiah, formatNumber, formatCompactRupiah } from '../utils/formatters';
import { exportSlowMovingToExcel } from '../utils/excelExporter';

interface SlowMovingSectionProps {
  data: SalesRecord[];
}

export const SlowMovingSection: React.FC<SlowMovingSectionProps> = ({ data }) => {
  // Threshold state (default max 6 pcs for slow-moving)
  const [qtyThreshold, setQtyThreshold] = useState<number>(6);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  // Status Transaksi filter (SELL IN / SELL OUT / Semua)
  const [ketFilter, setKetFilter] = useState<'all' | 'SELL IN' | 'SELL OUT'>('all');

  // Filter base records by transaction type
  const filteredBaseData = useMemo(() => {
    if (ketFilter === 'all') return data;
    return data.filter(r => (r.ket || '').trim().toUpperCase() === ketFilter);
  }, [data, ketFilter]);

  // Aggregate by SKU across the dataset
  const skuAggregates = useMemo(() => {
    const map = new Map<string, {
      noSku: string;
      sku: string;
      brand: string;
      kategori: string;
      spu: string;
      totalQty: number;
      totalValue: number;
      stores: Set<string>;
      isFocus: boolean;
      isNew: boolean;
      lastDate: string;
      transactionsCount: number;
    }>();

    filteredBaseData.forEach(item => {
      const key = item.noSku ? item.noSku.trim() : item.sku.trim();
      if (!map.has(key)) {
        map.set(key, {
          noSku: item.noSku || '-',
          sku: item.sku,
          brand: item.brand,
          kategori: item.kategori,
          spu: item.spu,
          totalQty: 0,
          totalValue: 0,
          stores: new Set<string>(),
          isFocus: Boolean(item.produkFokus && item.produkFokus !== '-'),
          isNew: Boolean(item.produkNew && item.produkNew !== '-'),
          lastDate: item.tanggal,
          transactionsCount: 0
        });
      }

      const entry = map.get(key)!;
      entry.totalQty += item.qty || 0;
      entry.totalValue += item.value || 0;
      if (item.namaStore) entry.stores.add(item.namaStore);
      entry.transactionsCount += 1;
      if (item.tanggal > entry.lastDate) entry.lastDate = item.tanggal;
    });

    return Array.from(map.values()).map(item => ({
      ...item,
      storesCount: item.stores.size
    }));
  }, [filteredBaseData]);

  // Total SKUs in portfolio
  const totalSkuCount = skuAggregates.length;
  const totalPortfolioValue = skuAggregates.reduce((s, i) => s + i.totalValue, 0);

  // Filter for Slow Moving SKUs (totalQty <= qtyThreshold)
  const slowMovingSkus = useMemo(() => {
    return skuAggregates
      .filter(item => {
        if (item.totalQty > qtyThreshold) return false;
        if (selectedBrand && item.brand.toLowerCase() !== selectedBrand.toLowerCase()) return false;
        if (selectedCategory && item.kategori.toLowerCase() !== selectedCategory.toLowerCase()) return false;
        return true;
      })
      .sort((a, b) => {
        // Sort lowest quantity first, then lowest value
        if (a.totalQty !== b.totalQty) return a.totalQty - b.totalQty;
        return a.totalValue - b.totalValue;
      });
  }, [skuAggregates, qtyThreshold, selectedBrand, selectedCategory]);

  // Aggregate Slow Moving Stats
  const slowCount = slowMovingSkus.length;
  const slowValue = slowMovingSkus.reduce((s, i) => s + i.totalValue, 0);
  const slowPercentageOfSkus = totalSkuCount > 0 ? (slowCount / totalSkuCount) * 100 : 0;
  const slowPercentageOfValue = totalPortfolioValue > 0 ? (slowValue / totalPortfolioValue) * 100 : 0;

  // Breakdown by brand for slow movers
  const brands = ['Y.O.U', 'barenbliss', 'lavojoy', 'DAZZLE ME'];
  const slowByBrand = brands.map(b => {
    const items = slowMovingSkus.filter(i => i.brand.toLowerCase() === b.toLowerCase());
    return {
      brand: b,
      count: items.length,
      value: items.reduce((s, i) => s + i.totalValue, 0)
    };
  });

  // Export Slow Moving CSV
  const handleExportSlowMoving = () => {
    const headers = ['NO SKU', 'BRAND', 'NAMA SKU', 'KATEGORI', 'TOTAL QTY', 'TOTAL VALUE', 'TOKO TERJANGKAU', 'STATUS PRODUK', 'REKOMENDASI'];
    const rows = slowMovingSkus.map(s => {
      let rec = 'Promo Bundling';
      if (s.totalQty <= 2) rec = 'Clearance / Discontinue';
      else if (s.isFocus) rec = 'Push Khusus Produk Fokus';

      return [
        `"${s.noSku}"`,
        `"${s.brand}"`,
        `"${s.sku.replace(/"/g, '""')}"`,
        `"${s.kategori}"`,
        s.totalQty,
        s.totalValue,
        s.storesCount,
        `"${s.isFocus ? 'Fokus' : s.isNew ? 'New' : '-'}"`,
        `"${rec}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const cleanKet = ketFilter === 'all' ? '' : `_${ketFilter.replace(/\s+/g, '_')}`;
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_SKU_Lambat_Gerak${cleanKet}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    exportSlowMovingToExcel(slowMovingSkus, qtyThreshold, ketFilter);
  };

  const uniqueCategories = Array.from(new Set(skuAggregates.map(i => i.kategori).filter(Boolean))).sort();

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
              <PackageMinus className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Analisis SKU Lambat Gerak (*Slow-Moving Inventory*)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Identifikasi varian produk dengan perputaran rendah untuk mencegah penumpukan stok (*dead stock*)
          </p>
        </div>

        {/* Action Toolbar: Threshold, Sell In/Out & Download Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Transaksi (SELL IN / SELL OUT) Toggle */}
          <div className="flex items-center gap-1.5 text-xs bg-slate-50 p-1 rounded-lg border border-slate-200">
            <span className="font-semibold text-slate-700 pl-1">Status:</span>
            <div className="flex items-center bg-white p-0.5 rounded-md border border-slate-200">
              <button
                onClick={() => setKetFilter('all')}
                className={`px-2 py-0.5 text-xs font-semibold rounded transition-all ${
                  ketFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setKetFilter('SELL IN')}
                className={`px-2 py-0.5 text-xs font-semibold rounded transition-all flex items-center gap-1 ${
                  ketFilter === 'SELL IN'
                    ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${ketFilter === 'SELL IN' ? 'bg-white' : 'bg-indigo-500'}`}></span>
                <span>Sell In</span>
              </button>
              <button
                onClick={() => setKetFilter('SELL OUT')}
                className={`px-2 py-0.5 text-xs font-semibold rounded transition-all flex items-center gap-1 ${
                  ketFilter === 'SELL OUT'
                    ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${ketFilter === 'SELL OUT' ? 'bg-white' : 'bg-emerald-500'}`}></span>
                <span>Sell Out</span>
              </button>
            </div>
          </div>

          {/* Threshold Controller */}
          <div className="flex items-center gap-2 text-xs bg-slate-50 p-1.5 rounded-lg border border-slate-200">
            <span className="font-semibold text-slate-700">Kriteria:</span>
            <select
              value={qtyThreshold}
              onChange={(e) => setQtyThreshold(Number(e.target.value))}
              className="px-2 py-1 bg-white border border-slate-300 rounded-md font-bold text-indigo-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value={3}>&le; 3 Pcs (Kritis / Dead)</option>
              <option value={6}>&le; 6 Pcs (Standar Lambat)</option>
              <option value={12}>&le; 12 Pcs (Di Bawah Rata-rata)</option>
            </select>
          </div>

          {/* Unduh Excel Button */}
          <button
            onClick={handleExportExcel}
            title="Unduh Data SKU Lambat Gerak ke Excel (.xlsx)"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Unduh Excel</span>
          </button>

          {/* Unduh CSV Button */}
          <button
            onClick={handleExportSlowMoving}
            title="Unduh Data SKU Lambat Gerak ke CSV"
            className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards for Slow Moving */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Count */}
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40">
          <div className="flex items-center justify-between text-xs text-rose-800 mb-1">
            <span className="font-semibold uppercase tracking-wider">Total SKU Lambat</span>
            <AlertOctagon className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-950 font-mono tabular-nums">
            {slowCount} <span className="text-sm font-semibold text-rose-700">SKU</span>
          </div>
          <div className="mt-2 pt-2 border-t border-rose-100 text-xs text-rose-700">
            <span className="font-bold">{slowPercentageOfSkus.toFixed(1)}%</span> dari total {totalSkuCount} SKU portofolio
          </div>
        </div>

        {/* Card 2: Value at risk */}
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40">
          <div className="flex items-center justify-between text-xs text-amber-800 mb-1">
            <span className="font-semibold uppercase tracking-wider">Nilai Omset Tertahan</span>
            <TrendingDown className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-950 font-mono tabular-nums">
            {formatRupiah(slowValue)}
          </div>
          <div className="mt-2 pt-2 border-t border-amber-100 text-xs text-amber-700">
            <span className="font-bold">{slowPercentageOfValue.toFixed(1)}%</span> dari total perputaran omset
          </div>
        </div>

        {/* Card 3: Slow Focus Products */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Produk Fokus / New Tertahan</span>
            <Sparkles className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {slowMovingSkus.filter(s => s.isFocus || s.isNew).length}{' '}
            <span className="text-sm font-semibold text-slate-500">Varian</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
            Produk prioritas yang perlu akselerasi promosi
          </div>
        </div>

        {/* Card 4: Quick Action */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col justify-between">
          <div className="text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider block mb-1">Rekomendasi Utama</span>
            <span className="text-slate-800 text-[11px] leading-relaxed">
              Buat paket bundling dengan produk Fast-Moving (*Sunbrella / Lip Velvet*) atau alokasikan sebagai tester toko.
            </span>
          </div>
          <button
            onClick={handleExportSlowMoving}
            className="mt-3 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor Data SKU Lambat (CSV)</span>
          </button>
        </div>

      </div>

      {/* Brand Breakdown Pills for Slow Movers */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-xs font-semibold text-slate-600 mr-1">Filter Brand:</span>
        <button
          onClick={() => setSelectedBrand('')}
          className={`px-2.5 py-1 text-xs rounded-md font-semibold transition-colors ${
            !selectedBrand ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Semua Merek ({slowCount})
        </button>
        {slowByBrand.map(b => (
          <button
            key={b.brand}
            onClick={() => setSelectedBrand(selectedBrand === b.brand ? '' : b.brand)}
            className={`px-2.5 py-1 text-xs rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
              selectedBrand === b.brand 
                ? 'bg-indigo-600 text-white' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>{b.brand}</span>
            <span className="text-[10px] opacity-80 font-mono">({b.count})</span>
          </button>
        ))}

        {/* Category filter */}
        <div className="ml-auto flex items-center gap-1.5 text-xs">
          <span className="text-slate-500">Kategori:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2 py-1 bg-white border border-slate-200 rounded-md text-xs font-medium focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Semua Kategori</option>
            {uniqueCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Slow Moving SKU Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-bold text-[10px] uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-center w-12">No</th>
                <th className="px-4 py-3 whitespace-nowrap">Brand</th>
                <th className="px-4 py-3 whitespace-nowrap">No SKU</th>
                <th className="px-4 py-3 min-w-[240px]">Deskripsi SKU</th>
                <th className="px-4 py-3 whitespace-nowrap">Kategori</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Total Terjual</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Total Omset (Rp)</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Jangkauan Toko</th>
                <th className="px-4 py-3 text-center whitespace-nowrap">Tingkat Risiko</th>
                <th className="px-4 py-3 min-w-[160px]">Rekomendasi Tindakan</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {slowMovingSkus.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-slate-500">
                    <p className="font-semibold text-slate-700">Tidak ada SKU yang memenuhi kriteria lambat gerak.</p>
                    <p className="text-xs text-slate-400 mt-1">Seluruh SKU Anda bergerak dengan kuantiti &gt; {qtyThreshold} pcs.</p>
                  </td>
                </tr>
              ) : (
                slowMovingSkus.map((item, index) => {
                  const isCritical = item.totalQty <= 2;
                  const isModerate = item.totalQty > 2 && item.totalQty <= 4;

                  // Strategic recommendation logic
                  let recText = 'Program promo bundling';
                  let recClass = 'text-amber-800 bg-amber-50 border-amber-200';
                  if (isCritical) {
                    recText = 'Clearance / Relokasi Tester';
                    recClass = 'text-rose-800 bg-rose-50 border-rose-200 font-semibold';
                  } else if (item.isFocus) {
                    recText = 'Push Khusus Produk Fokus';
                    recClass = 'text-indigo-800 bg-indigo-50 border-indigo-200 font-semibold';
                  } else if (item.storesCount <= 1) {
                    recText = 'Ekspansi Penawaran ke Toko Lain';
                    recClass = 'text-blue-800 bg-blue-50 border-blue-200';
                  }

                  return (
                    <tr key={item.noSku + item.sku} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 text-center font-bold font-mono text-slate-400">
                        {index + 1}
                      </td>

                      <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                        {item.brand}
                      </td>

                      <td className="px-4 py-3 font-mono text-slate-500 tabular-nums whitespace-nowrap">
                        {item.noSku}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{item.sku}</div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span>{item.spu}</span>
                          {item.isFocus && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-indigo-600 font-bold">Produk Fokus</span>
                            </>
                          )}
                          {item.isNew && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-rose-600 font-bold">New</span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {item.kategori}
                      </td>

                      <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-slate-900 whitespace-nowrap">
                        <span className={isCritical ? 'text-rose-600' : 'text-amber-600'}>
                          {formatNumber(item.totalQty)} pcs
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-800 font-semibold whitespace-nowrap">
                        {formatRupiah(item.totalValue)}
                      </td>

                      <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600 whitespace-nowrap">
                        {item.storesCount} toko
                      </td>

                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isCritical 
                            ? 'bg-rose-100 text-rose-800' 
                            : isModerate
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {isCritical ? 'Sangat Lambat (Dead)' : isModerate ? 'Lambat' : 'Di Bawah Rata-rata'}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-md text-[11px] border inline-block ${recClass}`}>
                          {recText}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-slate-500 gap-2">
          <span>
            Tips Distribusi: Jangan biarkan SKU lambat gerak menumpuk lebih dari 30-45 hari di gudang distributor atau etalase toko.
          </span>
          <span className="font-mono text-slate-700 font-bold">
            Menampilkan {slowMovingSkus.length} SKU lambat gerak
          </span>
        </div>
      </div>

    </section>
  );
};
