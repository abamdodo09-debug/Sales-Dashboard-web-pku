import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  Sparkles, 
  TrendingUp, 
  Download, 
  Package, 
  Store, 
  ArrowUpRight,
  Medal,
  Check,
  Filter,
  Calendar,
  Layers,
  ShoppingBag,
  FileSpreadsheet
} from 'lucide-react';
import { SalesRecord } from '../types/sales';
import { formatRupiah, formatNumber, formatCompactRupiah } from '../utils/formatters';
import { exportTop10SkuToExcel } from '../utils/excelExporter';
import { 
  getAvailableYears, 
  getAvailableMonths, 
  getAvailableWeeks,
  filterRecordsByPeriod,
  PeriodItem,
  parseDateSafe
} from '../utils/periodUtils';

interface TopSkuPerBrandSectionProps {
  data: SalesRecord[];
}

export const TopSkuPerBrandSection: React.FC<TopSkuPerBrandSectionProps> = ({ data }) => {
  const [selectedBrand, setSelectedBrand] = useState<string>('Y.O.U');
  const [rankMetric, setRankMetric] = useState<'value' | 'qty'>('value');
  
  // 1. Transaction Type filter (SELL IN / SELL OUT / Semua)
  const [ketFilter, setKetFilter] = useState<'all' | 'SELL IN' | 'SELL OUT'>('all');

  // 2. Period selector state
  // Value format: "all" OR "year:2026" OR "month:2026-01" OR "week:2026-W05"
  const [periodFilter, setPeriodFilter] = useState<string>('all');

  const brands = ['Y.O.U', 'barenbliss', 'lavojoy', 'DAZZLE ME'];

  // Available options from dataset
  const availableYears = useMemo(() => getAvailableYears(data), [data]);
  const availableMonths = useMemo(() => getAvailableMonths(data), [data]);
  const availableWeeks = useMemo(() => getAvailableWeeks(data), [data]);

  // 1. Filter data by Transaction Type (SELL IN / SELL OUT)
  const statusFilteredData = useMemo(() => {
    if (ketFilter === 'all') return data;
    return data.filter(r => (r.ket || '').toUpperCase() === ketFilter);
  }, [data, ketFilter]);

  // 2. Filter data by Selected Period
  const fullyFilteredData = useMemo(() => {
    if (periodFilter === 'all') return statusFilteredData;

    const [type, id] = periodFilter.split(':');
    if (type === 'year') {
      return filterRecordsByPeriod(statusFilteredData, 'yoy', id);
    }
    if (type === 'month') {
      return filterRecordsByPeriod(statusFilteredData, 'mom', id);
    }
    if (type === 'week') {
      return filterRecordsByPeriod(statusFilteredData, 'wow', id);
    }
    return statusFilteredData;
  }, [statusFilteredData, periodFilter]);

  // Current active period human-readable label
  const activePeriodLabel = useMemo(() => {
    if (periodFilter === 'all') return 'Semua Periode (All Time)';
    const [type, id] = periodFilter.split(':');
    if (type === 'year') {
      const found = availableYears.find(y => y.id === id);
      return found ? found.label : `Tahun ${id}`;
    }
    if (type === 'month') {
      const found = availableMonths.find(m => m.id === id);
      return found ? found.label : id;
    }
    if (type === 'week') {
      const found = availableWeeks.find(w => w.id === id);
      return found ? found.label : id;
    }
    return periodFilter;
  }, [periodFilter, availableYears, availableMonths, availableWeeks]);

  // Aggregate SKUs for the selected brand from fullyFilteredData
  const brandSkus = useMemo(() => {
    const brandRows = fullyFilteredData.filter(r => r.brand.toLowerCase() === selectedBrand.toLowerCase());
    const brandTotalValue = brandRows.reduce((sum, r) => sum + (r.value || 0), 0);
    const brandTotalQty = brandRows.reduce((sum, r) => sum + (r.qty || 0), 0);

    const map = new Map<string, {
      noSku: string;
      sku: string;
      spu: string;
      brand: string;
      kategori: string;
      totalQty: number;
      totalValue: number;
      stores: Set<string>;
      isFocus: boolean;
      isNew: boolean;
      transactionsCount: number;
    }>();

    brandRows.forEach(item => {
      const key = item.noSku ? item.noSku.trim() : item.sku.trim();
      if (!map.has(key)) {
        map.set(key, {
          noSku: item.noSku || '-',
          sku: item.sku,
          spu: item.spu,
          brand: item.brand,
          kategori: item.kategori,
          totalQty: 0,
          totalValue: 0,
          stores: new Set<string>(),
          isFocus: Boolean(item.produkFokus && item.produkFokus !== '-'),
          isNew: Boolean(item.produkNew && item.produkNew !== '-'),
          transactionsCount: 0
        });
      }

      const entry = map.get(key)!;
      entry.totalQty += item.qty || 0;
      entry.totalValue += item.value || 0;
      if (item.namaStore) entry.stores.add(item.namaStore);
      entry.transactionsCount += 1;
    });

    const skuList = Array.from(map.values()).map(item => {
      const share = brandTotalValue > 0 ? (item.totalValue / brandTotalValue) * 100 : 0;
      const avgPrice = item.totalQty > 0 ? Math.round(item.totalValue / item.totalQty) : 0;
      return {
        ...item,
        storesCount: item.stores.size,
        share,
        avgPrice
      };
    });

    // Sort by rankMetric descending and take top 10
    const sorted = skuList.sort((a, b) => {
      if (rankMetric === 'value') return b.totalValue - a.totalValue;
      return b.totalQty - a.totalQty;
    });

    return {
      top10: sorted.slice(0, 10),
      brandTotalValue,
      brandTotalQty,
      totalSkuCount: skuList.length,
      brandRowsCount: brandRows.length
    };
  }, [fullyFilteredData, selectedBrand, rankMetric]);

  // Contribution of top 10 SKUs to brand total
  const top10TotalValue = brandSkus.top10.reduce((s, i) => s + i.totalValue, 0);
  const top10Share = brandSkus.brandTotalValue > 0 
    ? (top10TotalValue / brandSkus.brandTotalValue) * 100 
    : 0;

  // Max value among top 10 for relative bar rendering
  const maxMetricVal = brandSkus.top10.length > 0 
    ? brandSkus.top10[0][rankMetric === 'value' ? 'totalValue' : 'totalQty']
    : 1;

  // Export Top 10 to CSV
  const handleExportTop10 = () => {
    const headers = [
      'RANK', 
      'BRAND', 
      'PERIODE',
      'STATUS_FAKTUR',
      'NO SKU', 
      'NAMA SKU', 
      'KATEGORI', 
      'TOTAL QTY', 
      'TOTAL VALUE (RP)', 
      'SHARE (%)', 
      'TOKO', 
      'STATUS_PRODUK'
    ];

    const rows = brandSkus.top10.map((s, idx) => [
      idx + 1,
      `"${s.brand}"`,
      `"${activePeriodLabel}"`,
      `"${ketFilter === 'all' ? 'SEMUA' : ketFilter}"`,
      `"${s.noSku}"`,
      `"${s.sku.replace(/"/g, '""')}"`,
      `"${s.kategori}"`,
      s.totalQty,
      s.totalValue,
      `${s.share.toFixed(1)}%`,
      s.storesCount,
      `"${s.isFocus ? 'Fokus' : s.isNew ? 'New' : '-'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const cleanPeriod = activePeriodLabel.replace(/[^a-zA-Z0-9]/g, '_');
    link.setAttribute('download', `Top10_SKU_${selectedBrand}_${ketFilter}_${cleanPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to Excel (.xlsx)
  const handleExportTop10Excel = () => {
    exportTop10SkuToExcel(
      brandSkus.top10,
      selectedBrand,
      rankMetric,
      activePeriodLabel,
      ketFilter
    );
  };

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5">
      
      {/* 1. Header with Title & Action Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
              <Trophy className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Top 10 SKU per Brand (*Produk Unggulan*)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Peringkat produk terlaris dan kontribusi omset berdasarkan merek, tipe transaksi, dan periode
          </p>
        </div>

        {/* Toolbar: Metric Toggle & Export Buttons (Excel & CSV) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle Metric Mode */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs">
            <button
              onClick={() => setRankMetric('value')}
              className={`px-3 py-1 font-semibold rounded-md transition-colors ${
                rankMetric === 'value'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Berdasarkan Omset (Rp)
            </button>
            <button
              onClick={() => setRankMetric('qty')}
              className={`px-3 py-1 font-semibold rounded-md transition-colors ${
                rankMetric === 'qty'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Berdasarkan Kuantiti (Pcs)
            </button>
          </div>

          {/* Download Excel Button */}
          <button
            onClick={handleExportTop10Excel}
            title="Unduh Data Top 10 SKU ke file Excel (.xlsx)"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Unduh Excel</span>
          </button>

          {/* Download CSV Button */}
          <button
            onClick={handleExportTop10}
            title="Unduh Data Top 10 SKU ke CSV"
            className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Bar: SELL IN / SELL OUT + Periode Picker */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Left: SELL IN / SELL OUT Selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-600 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            Status Transaksi:
          </span>
          <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200 text-xs shadow-2xs">
            <button
              onClick={() => setKetFilter('all')}
              className={`px-2.5 py-1 font-semibold rounded-md transition-all ${
                ketFilter === 'all'
                  ? 'bg-slate-900 text-white font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Status
            </button>
            <button
              onClick={() => setKetFilter('SELL IN')}
              className={`px-2.5 py-1 font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                ketFilter === 'SELL IN'
                  ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${ketFilter === 'SELL IN' ? 'bg-white' : 'bg-indigo-500'}`}></span>
              <span>SELL IN</span>
            </button>
            <button
              onClick={() => setKetFilter('SELL OUT')}
              className={`px-2.5 py-1 font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                ketFilter === 'SELL OUT'
                  ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${ketFilter === 'SELL OUT' ? 'bg-white' : 'bg-emerald-500'}`}></span>
              <span>SELL OUT</span>
            </button>
          </div>
        </div>

        {/* Right: Periode Picker */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-600 flex items-center gap-1 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Periode:
          </label>
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="text-xs py-1.5 px-3 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs min-w-[200px]"
          >
            <option value="all">Semua Periode (All Time)</option>
            
            {/* Years Group */}
            <optgroup label="Tahun">
              {availableYears.map(y => (
                <option key={`year:${y.id}`} value={`year:${y.id}`}>
                  {y.label}
                </option>
              ))}
            </optgroup>

            {/* Months Group */}
            <optgroup label="Bulan">
              {availableMonths.map(m => (
                <option key={`month:${m.id}`} value={`month:${m.id}`}>
                  {m.label}
                </option>
              ))}
            </optgroup>

            {/* Weeks Group */}
            <optgroup label="Minggu (WoW)">
              {availableWeeks.map(w => (
                <option key={`week:${w.id}`} value={`week:${w.id}`}>
                  {w.label}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

      </div>

      {/* 3. Brand Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3 overflow-x-auto">
        <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          Merek:
        </span>
        {brands.map(bName => {
          const isSel = selectedBrand.toLowerCase() === bName.toLowerCase();
          return (
            <button
              key={bName}
              onClick={() => setSelectedBrand(bName)}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                isSel
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <span>{bName}</span>
              {isSel && <Check className="w-3.5 h-3.5 text-rose-300" />}
            </button>
          );
        })}
      </div>

      {/* 4. Active Filters Indicator Summary Banner */}
      <div className="flex flex-wrap items-center justify-between text-xs px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg gap-2">
        <div className="flex flex-wrap items-center gap-2 text-slate-600">
          <span className="font-semibold text-slate-700">Filter Aktif:</span>
          
          {/* Brand Badge */}
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-white text-slate-900 border border-slate-300 shadow-2xs">
            Brand: {selectedBrand}
          </span>

          {/* Status Badge */}
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
            ketFilter === 'all'
              ? 'bg-slate-200 text-slate-800'
              : ketFilter === 'SELL IN'
              ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              ketFilter === 'all' ? 'bg-slate-500' : ketFilter === 'SELL IN' ? 'bg-indigo-600' : 'bg-emerald-600'
            }`}></span>
            {ketFilter === 'all' ? 'Semua Faktur' : ketFilter}
          </span>

          {/* Period Badge */}
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200 shadow-2xs">
            {activePeriodLabel}
          </span>
        </div>

        <span className="text-[11px] text-slate-500 font-mono">
          {brandSkus.brandRowsCount} Transaksi Ditemukan
        </span>
      </div>

      {/* 5. KPI Overview for Selected Brand & Filter Scope */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
        <div>
          <span className="text-slate-500 uppercase font-bold text-[10px] block">
            Total Omset {selectedBrand} ({activePeriodLabel})
          </span>
          <span className="text-lg font-bold font-mono tabular-nums text-slate-900">
            {formatRupiah(brandSkus.brandTotalValue)}
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            Total {formatNumber(brandSkus.brandTotalQty)} pcs terjual
          </span>
        </div>

        <div>
          <span className="text-slate-500 uppercase font-bold text-[10px] block">
            Dominasi Top 10 SKU
          </span>
          <span className="text-lg font-bold font-mono tabular-nums text-indigo-700">
            {top10Share.toFixed(1)}%
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            Menyumbang {formatRupiah(top10TotalValue)} dari omset brand
          </span>
        </div>

        <div>
          <span className="text-slate-500 uppercase font-bold text-[10px] block">
            Produk Terlaris #1 (Hero Item)
          </span>
          <span className="text-xs font-bold text-slate-900 line-clamp-1 mt-1" title={brandSkus.top10[0]?.sku}>
            {brandSkus.top10[0]?.sku || '-'}
          </span>
          <span className="text-[11px] text-emerald-700 font-semibold font-mono tabular-nums block mt-0.5">
            {formatRupiah(brandSkus.top10[0]?.totalValue || 0)} ({brandSkus.top10[0]?.share.toFixed(1)}% Share)
          </span>
        </div>
      </div>

      {/* 6. Top 10 Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-bold text-[10px] uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-center w-12"># Rank</th>
                <th className="px-4 py-3 whitespace-nowrap">No SKU</th>
                <th className="px-4 py-3 min-w-[240px]">Deskripsi SKU Produk</th>
                <th className="px-4 py-3 whitespace-nowrap">Kategori</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Volume Terjual</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Total Omset (Rp)</th>
                <th className="px-4 py-3 min-w-[140px]">Kontribusi Omset</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Penetrasi Toko</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Harga Rata-rata</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {brandSkus.top10.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                    <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">
                      Tidak ada data SKU untuk brand {selectedBrand} pada filter ini.
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Coba ubah filter Status Transaksi ({ketFilter}) atau Periode ({activePeriodLabel}) pada kontrol di atas.
                    </p>
                  </td>
                </tr>
              ) : (
                brandSkus.top10.map((item, index) => {
                  const metricVal = rankMetric === 'value' ? item.totalValue : item.totalQty;
                  const barPercent = maxMetricVal > 0 ? (metricVal / maxMetricVal) * 100 : 0;

                  return (
                    <tr key={item.noSku + item.sku} className="hover:bg-slate-50/80 transition-colors">
                      {/* Rank */}
                      <td className="px-4 py-3 text-center font-bold font-mono">
                        {index === 0 ? (
                          <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold mx-auto">
                            1
                          </span>
                        ) : index === 1 ? (
                          <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-xs font-bold mx-auto">
                            2
                          </span>
                        ) : index === 2 ? (
                          <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-800 flex items-center justify-center text-xs font-bold mx-auto">
                            3
                          </span>
                        ) : (
                          <span className="text-slate-400">#{index + 1}</span>
                        )}
                      </td>

                      {/* No SKU */}
                      <td className="px-4 py-3 font-mono text-slate-500 tabular-nums whitespace-nowrap">
                        {item.noSku}
                      </td>

                      {/* SKU Name & Flags */}
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

                      {/* Kategori */}
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {item.kategori}
                      </td>

                      {/* Qty */}
                      <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-slate-800 whitespace-nowrap">
                        {formatNumber(item.totalQty)} pcs
                      </td>

                      {/* Value */}
                      <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-slate-900 whitespace-nowrap">
                        {formatRupiah(item.totalValue)}
                      </td>

                      {/* Contribution Bar */}
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
                            <span className="font-semibold text-slate-700">{item.share.toFixed(1)}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                              style={{ width: `${barPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Penetrasi Toko */}
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600 whitespace-nowrap">
                        {item.storesCount} toko
                      </td>

                      {/* Harga Rata-rata */}
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-500 whitespace-nowrap">
                        {formatRupiah(item.avgPrice)}
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
            Portofolio {selectedBrand} memiliki total {brandSkus.totalSkuCount} varian SKU terdata ({activePeriodLabel} · {ketFilter === 'all' ? 'Semua Faktur' : ketFilter}).
          </span>
          <span className="font-mono text-slate-700 font-bold">
            Peringkat dihitung berdasarkan {rankMetric === 'value' ? 'Total Omset (Rp)' : 'Total Kuantiti (Pcs)'}
          </span>
        </div>
      </div>

    </section>
  );
};
