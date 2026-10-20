import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Calendar, 
  ArrowRight, 
  Layers, 
  Sparkles,
  BarChart2,
  Package,
  Store,
  DollarSign,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  UserCheck,
  Tag,
  Users,
  Filter,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { SalesRecord } from '../types/sales';
import { exportPeriodComparisonToExcel } from '../utils/excelExporter';
import { 
  getAvailableWeeks, 
  getAvailableMonths, 
  getAvailableYears, 
  filterRecordsByPeriod, 
  PeriodItem 
} from '../utils/periodUtils';
import { formatRupiah, formatNumber, formatCompactRupiah } from '../utils/formatters';

interface PeriodComparisonSectionProps {
  data: SalesRecord[];
}

type ComparisonMode = 'wow' | 'mom' | 'yoy';
type ComparisonDimension = 'brand' | 'category' | 'sales' | 'stores';

export const PeriodComparisonSection: React.FC<PeriodComparisonSectionProps> = ({ data }) => {
  const [mode, setMode] = useState<ComparisonMode>('wow');
  const [activeDimension, setActiveDimension] = useState<ComparisonDimension>('brand');
  const [storeViewMode, setStoreViewMode] = useState<'droppers' | 'gainers'>('droppers');
  const [ketFilter, setKetFilter] = useState<'all' | 'SELL IN' | 'SELL OUT'>('all');

  // Filter records by transaction type (SELL IN / SELL OUT)
  const filteredBaseData = useMemo(() => {
    if (ketFilter === 'all') return data;
    return data.filter(r => (r.ket || '').toUpperCase() === ketFilter);
  }, [data, ketFilter]);

  // Available periods for each mode based on filteredBaseData
  const weeks = useMemo(() => getAvailableWeeks(filteredBaseData), [filteredBaseData]);
  const months = useMemo(() => getAvailableMonths(filteredBaseData), [filteredBaseData]);
  const years = useMemo(() => getAvailableYears(filteredBaseData), [filteredBaseData]);

  // Current options list based on active mode
  const currentOptions: PeriodItem[] = useMemo(() => {
    if (mode === 'wow') return weeks;
    if (mode === 'mom') return months;
    return years;
  }, [mode, weeks, months, years]);

  // Selected period IDs (Primary / Current vs Benchmark / Prior)
  const [primaryId, setPrimaryId] = useState<string>('');
  const [compareId, setCompareId] = useState<string>('');

  // Auto-initialize selected periods when mode changes or data arrives
  React.useEffect(() => {
    if (currentOptions.length >= 2) {
      setPrimaryId(currentOptions[0].id);
      setCompareId(currentOptions[1].id);
    } else if (currentOptions.length === 1) {
      setPrimaryId(currentOptions[0].id);
      setCompareId(currentOptions[0].id);
    } else {
      setPrimaryId('');
      setCompareId('');
    }
  }, [mode, currentOptions]);

  // Filtered records for both periods
  const primaryData = useMemo(() => {
    return filterRecordsByPeriod(filteredBaseData, mode, primaryId);
  }, [filteredBaseData, mode, primaryId]);

  const compareData = useMemo(() => {
    return filterRecordsByPeriod(filteredBaseData, mode, compareId);
  }, [filteredBaseData, mode, compareId]);

  // Aggregate metrics for Primary
  const primaryValue = primaryData.reduce((sum, r) => sum + (r.value || 0), 0);
  const primaryQty = primaryData.reduce((sum, r) => sum + (r.qty || 0), 0);
  const primaryStores = new Set(primaryData.map(r => r.namaStore)).size;
  const primaryAov = primaryStores > 0 ? Math.round(primaryValue / primaryStores) : 0;

  // Aggregate metrics for Compare
  const compareValue = compareData.reduce((sum, r) => sum + (r.value || 0), 0);
  const compareQty = compareData.reduce((sum, r) => sum + (r.qty || 0), 0);
  const compareStores = new Set(compareData.map(r => r.namaStore)).size;
  const compareAov = compareStores > 0 ? Math.round(compareValue / compareStores) : 0;

  // Percentage and absolute changes helper
  const calcGrowth = (curr: number, prev: number) => {
    const diff = curr - prev;
    if (prev === 0) return { diff, percent: curr > 0 ? 100 : 0 };
    const percent = (diff / prev) * 100;
    return { diff, percent };
  };

  const valueGrowth = calcGrowth(primaryValue, compareValue);
  const qtyGrowth = calcGrowth(primaryQty, compareQty);
  const storeGrowth = calcGrowth(primaryStores, compareStores);
  const aovGrowth = calcGrowth(primaryAov, compareAov);

  // 1. BRAND COMPARISON DATA
  const brandComparisonData = useMemo(() => {
    const brands = ['Y.O.U', 'barenbliss', 'lavojoy', 'DAZZLE ME'];
    return brands.map(brandName => {
      const pBrand = primaryData.filter(r => r.brand.toLowerCase() === brandName.toLowerCase());
      const cBrand = compareData.filter(r => r.brand.toLowerCase() === brandName.toLowerCase());

      const pVal = pBrand.reduce((s, r) => s + (r.value || 0), 0);
      const cVal = cBrand.reduce((s, r) => s + (r.value || 0), 0);
      const pQ = pBrand.reduce((s, r) => s + (r.qty || 0), 0);
      const cQ = cBrand.reduce((s, r) => s + (r.qty || 0), 0);

      const pStores = new Set(pBrand.map(r => r.namaStore)).size;
      const cStores = new Set(cBrand.map(r => r.namaStore)).size;

      const growth = calcGrowth(pVal, cVal);
      const qtyG = calcGrowth(pQ, cQ);
      const share = primaryValue > 0 ? (pVal / primaryValue) * 100 : 0;

      return {
        name: brandName,
        primaryValue: pVal,
        compareValue: cVal,
        primaryQty: pQ,
        compareQty: cQ,
        primaryStores: pStores,
        compareStores: cStores,
        diffValue: growth.diff,
        growthPercent: growth.percent,
        diffQty: qtyG.diff,
        share
      };
    });
  }, [primaryData, compareData, primaryValue]);

  // 2. CATEGORY COMPARISON DATA
  const categoryComparisonData = useMemo(() => {
    const allCategories = Array.from(new Set([
      ...primaryData.map(r => r.kategori),
      ...compareData.map(r => r.kategori)
    ])).filter(Boolean);

    return allCategories.map(catName => {
      const pCat = primaryData.filter(r => r.kategori === catName);
      const cCat = compareData.filter(r => r.kategori === catName);

      const pVal = pCat.reduce((s, r) => s + (r.value || 0), 0);
      const cVal = cCat.reduce((s, r) => s + (r.value || 0), 0);
      const pQ = pCat.reduce((s, r) => s + (r.qty || 0), 0);
      const cQ = cCat.reduce((s, r) => s + (r.qty || 0), 0);

      const pStores = new Set(pCat.map(r => r.namaStore)).size;
      const cStores = new Set(cCat.map(r => r.namaStore)).size;

      const growth = calcGrowth(pVal, cVal);
      const qtyG = calcGrowth(pQ, cQ);
      const share = primaryValue > 0 ? (pVal / primaryValue) * 100 : 0;

      return {
        name: catName,
        primaryValue: pVal,
        compareValue: cVal,
        primaryQty: pQ,
        compareQty: cQ,
        primaryStores: pStores,
        compareStores: cStores,
        diffValue: growth.diff,
        growthPercent: growth.percent,
        diffQty: qtyG.diff,
        share
      };
    }).sort((a, b) => b.primaryValue - a.primaryValue);
  }, [primaryData, compareData, primaryValue]);

  // 3. SALES REPRESENTATIVE COMPARISON DATA
  const salesComparisonData = useMemo(() => {
    const allSales = Array.from(new Set([
      ...primaryData.map(r => r.sales),
      ...compareData.map(r => r.sales)
    ])).filter(Boolean);

    return allSales.map(salesName => {
      const pSales = primaryData.filter(r => r.sales === salesName);
      const cSales = compareData.filter(r => r.sales === salesName);

      const pVal = pSales.reduce((s, r) => s + (r.value || 0), 0);
      const cVal = cSales.reduce((s, r) => s + (r.value || 0), 0);
      const pQ = pSales.reduce((s, r) => s + (r.qty || 0), 0);
      const cQ = cSales.reduce((s, r) => s + (r.qty || 0), 0);

      const pStores = new Set(pSales.map(r => r.namaStore)).size;
      const cStores = new Set(cSales.map(r => r.namaStore)).size;
      const spvName = pSales[0]?.spv || cSales[0]?.spv || 'Widodo';

      const growth = calcGrowth(pVal, cVal);
      const qtyG = calcGrowth(pQ, cQ);
      const share = primaryValue > 0 ? (pVal / primaryValue) * 100 : 0;

      return {
        name: salesName,
        spv: spvName,
        primaryValue: pVal,
        compareValue: cVal,
        primaryQty: pQ,
        compareQty: cQ,
        primaryStores: pStores,
        compareStores: cStores,
        diffValue: growth.diff,
        growthPercent: growth.percent,
        diffQty: qtyG.diff,
        share
      };
    }).sort((a, b) => b.primaryValue - a.primaryValue);
  }, [primaryData, compareData, primaryValue]);

  // 4. STORE PERFORMANCE COMPARISON DATA
  const storeComparisonList = useMemo(() => {
    const allStoreNames = Array.from(new Set([
      ...primaryData.map(r => r.namaStore),
      ...compareData.map(r => r.namaStore)
    ])).filter(Boolean);

    return allStoreNames.map(storeName => {
      const pRows = primaryData.filter(r => r.namaStore === storeName);
      const cRows = compareData.filter(r => r.namaStore === storeName);

      const pVal = pRows.reduce((s, r) => s + (r.value || 0), 0);
      const cVal = cRows.reduce((s, r) => s + (r.value || 0), 0);
      const pQty = pRows.reduce((s, r) => s + (r.qty || 0), 0);
      const cQty = cRows.reduce((s, r) => s + (r.qty || 0), 0);

      const diff = pVal - cVal;
      const diffQty = pQty - cQty;
      const percent = cVal > 0 ? (diff / cVal) * 100 : (pVal > 0 ? 100 : 0);

      const sampleRow = pRows[0] || cRows[0];
      const region = sampleRow ? (sampleRow.region || sampleRow.coverArea || 'Pekanbaru') : 'Pekanbaru';
      const sales = sampleRow ? sampleRow.sales : 'Abdul Rahim';
      const spv = sampleRow ? sampleRow.spv : 'Widodo';

      const brandDrops: Record<string, number> = {};
      cRows.forEach(r => {
        brandDrops[r.brand] = (brandDrops[r.brand] || 0) + (r.value || 0);
      });
      pRows.forEach(r => {
        brandDrops[r.brand] = (brandDrops[r.brand] || 0) - (r.value || 0);
      });

      let topDecliningBrand = '-';
      let maxDrop = 0;
      Object.entries(brandDrops).forEach(([bName, bDrop]) => {
        if (bDrop > maxDrop) {
          maxDrop = bDrop;
          topDecliningBrand = bName;
        }
      });

      return {
        storeName,
        region,
        sales,
        spv,
        primaryValue: pVal,
        compareValue: cVal,
        primaryQty: pQty,
        compareQty: cQty,
        diff,
        diffQty,
        percent,
        topDecliningBrand: topDecliningBrand !== '-' ? topDecliningBrand : (sampleRow?.brand || 'General')
      };
    });
  }, [primaryData, compareData]);

  // Top 10 Declining Stores
  const topDecliningStores = useMemo(() => {
    return storeComparisonList
      .filter(s => s.diff < 0)
      .sort((a, b) => a.diff - b.diff)
      .slice(0, 10);
  }, [storeComparisonList]);

  // Top 10 Growing Stores
  const topGrowingStores = useMemo(() => {
    return storeComparisonList
      .filter(s => s.diff > 0)
      .sort((a, b) => b.diff - a.diff)
      .slice(0, 10);
  }, [storeComparisonList]);

  const activeStoresList = storeViewMode === 'droppers' ? topDecliningStores : topGrowingStores;

  const totalDeclineLoss = useMemo(() => {
    return topDecliningStores.reduce((sum, s) => sum + Math.abs(s.diff), 0);
  }, [topDecliningStores]);

  const totalQtyLoss = useMemo(() => {
    return topDecliningStores.reduce((sum, s) => sum + Math.abs(s.diffQty), 0);
  }, [topDecliningStores]);

  const getPrimaryLabel = () => {
    return currentOptions.find(o => o.id === primaryId)?.label || primaryId || 'Periode Utama';
  };

  const getCompareLabel = () => {
    return currentOptions.find(o => o.id === compareId)?.label || compareId || 'Pembanding';
  };

  const renderGrowthBadge = (growth: { diff: number; percent: number }, isCurrency = false) => {
    const isPositive = growth.diff > 0;
    const isNeutral = growth.diff === 0;

    if (isNeutral) {
      return (
        <span className="flex items-center gap-1 text-slate-500 font-mono text-xs">
          <Minus className="w-3.5 h-3.5" />
          <span>0.0%</span>
        </span>
      );
    }

    return (
      <span className={`flex items-center gap-1 font-mono text-xs font-semibold ${
        isPositive ? 'text-emerald-700' : 'text-rose-600'
      }`}>
        {isPositive ? <TrendingUp className="w-3.5 h-3.5 shrink-0" /> : <TrendingDown className="w-3.5 h-3.5 shrink-0" />}
        <span>
          {isPositive ? '+' : ''}{growth.percent.toFixed(1)}%
          <span className="font-normal text-[11px] ml-1 text-slate-500">
            ({isPositive ? '+' : ''}{isCurrency ? formatCompactRupiah(growth.diff) : formatNumber(growth.diff)})
          </span>
        </span>
      </span>
    );
  };

  // Determine active chart data based on active dimension
  const activeChartData = useMemo(() => {
    if (activeDimension === 'brand') return brandComparisonData;
    if (activeDimension === 'category') return categoryComparisonData;
    if (activeDimension === 'sales') return salesComparisonData;
    return [];
  }, [activeDimension, brandComparisonData, categoryComparisonData, salesComparisonData]);

  // Export Period Comparison to Excel (.xlsx)
  const handleExportExcel = () => {
    exportPeriodComparisonToExcel(
      brandComparisonData,
      categoryComparisonData,
      salesComparisonData,
      topDecliningStores,
      topGrowingStores,
      mode,
      getPrimaryLabel(),
      getCompareLabel(),
      ketFilter
    );
  };

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-6">
      
      {/* Header and Mode Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Analisis Pertumbuhan Periode
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluasi pergerakan performa <span className="font-semibold text-slate-700">Merek</span>, <span className="font-semibold text-slate-700">Kategori</span>, dan <span className="font-semibold text-slate-700">Tim Sales</span>
          </p>
        </div>

        {/* Action Controls: SELL IN / SELL OUT Filter + Mode Tabs (WoW, MoM, YoY) */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Filter SELL IN / SELL OUT */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs">
            <span className="text-[11px] font-bold text-slate-500 px-2 flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-400" />
              Tipe:
            </span>
            <button
              onClick={() => setKetFilter('all')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                ketFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Status
            </button>
            <button
              onClick={() => setKetFilter('SELL IN')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                ketFilter === 'SELL IN'
                  ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${ketFilter === 'SELL IN' ? 'bg-white' : 'bg-indigo-500'}`}></span>
              <span>SELL IN</span>
            </button>
            <button
              onClick={() => setKetFilter('SELL OUT')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                ketFilter === 'SELL OUT'
                  ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${ketFilter === 'SELL OUT' ? 'bg-white' : 'bg-emerald-500'}`}></span>
              <span>SELL OUT</span>
            </button>
          </div>

          {/* 3 Buttons Mode Tabs: WoW, MoM, YoY */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setMode('wow')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                mode === 'wow'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Week vs Week (WoW)
            </button>
            
            <button
              onClick={() => setMode('mom')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                mode === 'mom'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Month vs Month (MoM)
            </button>
            
            <button
              onClick={() => setMode('yoy')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                mode === 'yoy'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Year vs Year (YoY)
            </button>
          </div>

          {/* Unduh Excel Button */}
          <button
            onClick={handleExportExcel}
            title="Unduh Data Pertumbuhan Periode & 10 Toko Penurunan ke Excel (.xlsx)"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Unduh Excel</span>
          </button>

        </div>
      </div>

      {/* Active Filter Indicator Banner */}
      <div className="flex flex-wrap items-center justify-between text-xs px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg gap-2">
        <div className="flex items-center gap-2 text-slate-600">
          <span className="font-semibold text-slate-700">Filter Transaksi Aktif:</span>
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold ${
            ketFilter === 'all'
              ? 'bg-slate-200 text-slate-800'
              : ketFilter === 'SELL IN'
              ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              ketFilter === 'all' ? 'bg-slate-500' : ketFilter === 'SELL IN' ? 'bg-indigo-600' : 'bg-emerald-600'
            }`}></span>
            {ketFilter === 'all' 
              ? 'Semua Faktur (SELL IN & SELL OUT)' 
              : ketFilter === 'SELL IN' 
              ? 'SELL IN (Faktur Distribusi Masuk ke Toko)' 
              : 'SELL OUT (Penjualan Toko ke Konsumen Akhir)'}
          </span>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">
          {filteredBaseData.length} Baris Data Ditemukan
        </span>
      </div>

      {/* Period Pickers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
            Periode Utama (Current Period)
          </label>
          <select
            value={primaryId}
            onChange={(e) => setPrimaryId(e.target.value)}
            className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {currentOptions.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
            Periode Pembanding (Prior / Benchmark Period)
          </label>
          <select
            value={compareId}
            onChange={(e) => setCompareId(e.target.value)}
            className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {currentOptions.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Overall Growth Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Value Growth */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Omset (Value)</span>
            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-lg font-bold text-slate-900 font-mono tabular-nums">
            {formatRupiah(primaryValue)}
          </div>
          <div className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
            vs {formatRupiah(compareValue)}
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Pertumbuhan:</span>
            {renderGrowthBadge(valueGrowth, true)}
          </div>
        </div>

        {/* Metric 2: Quantity Growth */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Volume (Qty)</span>
            <Package className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-lg font-bold text-slate-900 font-mono tabular-nums">
            {formatNumber(primaryQty)} <span className="text-xs font-normal text-slate-500">Pcs</span>
          </div>
          <div className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
            vs {formatNumber(compareQty)} Pcs
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Pertumbuhan:</span>
            {renderGrowthBadge(qtyGrowth)}
          </div>
        </div>

        {/* Metric 3: Active Stores */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Penetrasi Toko</span>
            <Store className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-lg font-bold text-slate-900 font-mono tabular-nums">
            {formatNumber(primaryStores)} <span className="text-xs font-normal text-slate-500">Toko</span>
          </div>
          <div className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
            vs {formatNumber(compareStores)} Toko
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Pertumbuhan:</span>
            {renderGrowthBadge(storeGrowth)}
          </div>
        </div>

        {/* Metric 4: Average Order Value */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Rata-rata / Toko</span>
            <Layers className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-lg font-bold text-slate-900 font-mono tabular-nums">
            {formatRupiah(primaryAov)}
          </div>
          <div className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
            vs {formatRupiah(compareAov)}
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Pertumbuhan:</span>
            {renderGrowthBadge(aovGrowth, true)}
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4 SUB-TABS: BRAND vs CATEGORY vs SALES vs STORES */}
      {/* ========================================================================= */}
      <div className="space-y-4 pt-2">
        
        {/* Sub-Dimension Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
            
            <button
              onClick={() => setActiveDimension('brand')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeDimension === 'brand'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Komparasi Brand / Merek</span>
            </button>

            <button
              onClick={() => setActiveDimension('category')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeDimension === 'category'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Tag className="w-3.5 h-3.5 text-amber-600" />
              <span>Komparasi Kategori</span>
            </button>

            <button
              onClick={() => setActiveDimension('sales')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeDimension === 'sales'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-purple-600" />
              <span>Komparasi Tim Sales</span>
            </button>

            <button
              onClick={() => setActiveDimension('stores')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeDimension === 'stores'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Store className="w-3.5 h-3.5 text-emerald-600" />
              <span>Evaluasi Toko (10 Droppers &amp; Gainers)</span>
            </button>

          </div>

          <span className="hidden md:inline-block text-[11px] text-slate-400 font-mono">
            {mode.toUpperCase()} Comparison Matrix
          </span>
        </div>

        {/* VIEW 1: BRAND COMPARISON */}
        {activeDimension === 'brand' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Chart */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Grafik Omset Brand ({mode.toUpperCase()})
                  </h4>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 bg-indigo-600 rounded-sm"></span>
                    <span className="text-slate-700 font-medium">Utama</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 bg-slate-400 rounded-sm"></span>
                    <span className="text-slate-700 font-medium">Pembanding</span>
                  </span>
                </div>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={brandComparisonData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 11, fill: '#475569' }} 
                      axisLine={{ stroke: '#e2e8f0' }} 
                      tickLine={false} 
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fill: '#64748b' }} 
                      axisLine={false} 
                      tickLine={false}
                      tickFormatter={(val) => formatCompactRupiah(val)} 
                    />
                    <Tooltip
                      formatter={(value: any) => formatRupiah(Number(value))}
                      labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                    />
                    <Bar dataKey="primaryValue" name={getPrimaryLabel()} fill="#4f46e5" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="compareValue" name={getCompareLabel()} fill="#94a3b8" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white flex flex-col">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Matriks Pertumbuhan Merek
                </h4>
                <span className="text-[11px] text-slate-500 font-mono">4 Brand Resmi</span>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50/50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-100">
                    <tr>
                      <th className="px-3 py-2.5">Merek</th>
                      <th className="px-3 py-2.5 text-right">Omset Utama</th>
                      <th className="px-3 py-2.5 text-right">Pembanding</th>
                      <th className="px-3 py-2.5 text-right">Pertumbuhan</th>
                      <th className="px-3 py-2.5 text-right">Unit (Pcs)</th>
                      <th className="px-3 py-2.5 text-right">Toko</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-normal">
                    {brandComparisonData.map(item => {
                      const isPos = item.diffValue > 0;
                      const isZero = item.diffValue === 0;

                      return (
                        <tr key={item.name} className="hover:bg-slate-50">
                          <td className="px-3 py-2.5 font-bold text-slate-900">
                            {item.name}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-800">
                            {formatCompactRupiah(item.primaryValue)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-500">
                            {formatCompactRupiah(item.compareValue)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono tabular-nums font-semibold">
                            <span className={isZero ? 'text-slate-500' : isPos ? 'text-emerald-700' : 'text-rose-600'}>
                              {isPos ? '+' : ''}{item.growthPercent.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-600">
                            {formatNumber(item.primaryQty)} pcs
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-600">
                            {item.primaryStores} toko
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: CATEGORY COMPARISON */}
        {activeDimension === 'category' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Chart */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-amber-600" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Grafik Omset Kategori ({mode.toUpperCase()})
                  </h4>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 bg-amber-500 rounded-sm"></span>
                    <span className="text-slate-700 font-medium">Utama</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 bg-slate-400 rounded-sm"></span>
                    <span className="text-slate-700 font-medium">Pembanding</span>
                  </span>
                </div>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryComparisonData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 10, fill: '#475569' }} 
                      axisLine={{ stroke: '#e2e8f0' }} 
                      tickLine={false} 
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fill: '#64748b' }} 
                      axisLine={false} 
                      tickLine={false}
                      tickFormatter={(val) => formatCompactRupiah(val)} 
                    />
                    <Tooltip
                      formatter={(value: any) => formatRupiah(Number(value))}
                      labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                    />
                    <Bar dataKey="primaryValue" name={getPrimaryLabel()} fill="#d97706" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="compareValue" name={getCompareLabel()} fill="#94a3b8" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white flex flex-col">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Matriks Pertumbuhan Kategori Produk
                </h4>
                <span className="text-[11px] text-slate-500 font-mono">{categoryComparisonData.length} Kategori</span>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50/50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-100">
                    <tr>
                      <th className="px-3 py-2.5">Kategori</th>
                      <th className="px-3 py-2.5 text-right">Omset Utama</th>
                      <th className="px-3 py-2.5 text-right">Pembanding</th>
                      <th className="px-3 py-2.5 text-right">Pertumbuhan</th>
                      <th className="px-3 py-2.5 text-right">Volume (Qty)</th>
                      <th className="px-3 py-2.5 text-right">Porsi (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-normal">
                    {categoryComparisonData.map(item => {
                      const isPos = item.diffValue > 0;
                      const isZero = item.diffValue === 0;

                      return (
                        <tr key={item.name} className="hover:bg-slate-50">
                          <td className="px-3 py-2.5 font-bold text-slate-900">
                            {item.name}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-800">
                            {formatCompactRupiah(item.primaryValue)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-500">
                            {formatCompactRupiah(item.compareValue)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono tabular-nums font-semibold">
                            <span className={isZero ? 'text-slate-500' : isPos ? 'text-emerald-700' : 'text-rose-600'}>
                              {isPos ? '+' : ''}{item.growthPercent.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-600">
                            {formatNumber(item.primaryQty)} pcs
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono tabular-nums text-indigo-700 font-medium">
                            {item.share.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: SALES REPRESENTATIVE COMPARISON */}
        {activeDimension === 'sales' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Chart */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-purple-600" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Pencapaian Omset Tim Sales ({mode.toUpperCase()})
                  </h4>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 bg-purple-600 rounded-sm"></span>
                    <span className="text-slate-700 font-medium">Utama</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 bg-slate-400 rounded-sm"></span>
                    <span className="text-slate-700 font-medium">Pembanding</span>
                  </span>
                </div>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesComparisonData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 11, fill: '#475569' }} 
                      axisLine={{ stroke: '#e2e8f0' }} 
                      tickLine={false} 
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fill: '#64748b' }} 
                      axisLine={false} 
                      tickLine={false}
                      tickFormatter={(val) => formatCompactRupiah(val)} 
                    />
                    <Tooltip
                      formatter={(value: any) => formatRupiah(Number(value))}
                      labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                    />
                    <Bar dataKey="primaryValue" name={getPrimaryLabel()} fill="#9333ea" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="compareValue" name={getCompareLabel()} fill="#94a3b8" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white flex flex-col">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Matriks Performa Sales Representative
                </h4>
                <span className="text-[11px] text-slate-500 font-mono">Team Pekanbaru &amp; Riau</span>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50/50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-100">
                    <tr>
                      <th className="px-3 py-2.5">Nama Sales</th>
                      <th className="px-3 py-2.5">SPV</th>
                      <th className="px-3 py-2.5 text-right">Omset Utama</th>
                      <th className="px-3 py-2.5 text-right">Pembanding</th>
                      <th className="px-3 py-2.5 text-right">Pertumbuhan</th>
                      <th className="px-3 py-2.5 text-right">Toko</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-normal">
                    {salesComparisonData.map(item => {
                      const isPos = item.diffValue > 0;
                      const isZero = item.diffValue === 0;

                      return (
                        <tr key={item.name} className="hover:bg-slate-50">
                          <td className="px-3 py-2.5 font-bold text-slate-900">
                            {item.name}
                          </td>
                          <td className="px-3 py-2.5 text-slate-500">
                            {item.spv}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-800">
                            {formatCompactRupiah(item.primaryValue)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-500">
                            {formatCompactRupiah(item.compareValue)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono tabular-nums font-semibold">
                            <span className={isZero ? 'text-slate-500' : isPos ? 'text-emerald-700' : 'text-rose-600'}>
                              {isPos ? '+' : ''}{item.growthPercent.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-600">
                            {item.primaryStores} toko
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: STORE COMPARISON (TOP 10 DROPPERS / GAINERS) */}
        {activeDimension === 'stores' && (
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
            
            {/* Header with Switcher */}
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${storeViewMode === 'droppers' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {storeViewMode === 'droppers' ? <AlertTriangle className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                    {storeViewMode === 'droppers' ? '10 Toko Mengalami Penurunan Tertinggi' : '10 Toko Mengalami Kenaikan Tertinggi'}
                  </h4>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Perbandingan omset toko antara <span className="font-semibold text-slate-700">{getPrimaryLabel()}</span> vs <span className="font-semibold text-slate-700">{getCompareLabel()}</span> · <span className="font-bold text-slate-800">{ketFilter === 'all' ? 'Semua Faktur' : ketFilter}</span>
                </p>
              </div>

              {/* Toggle Droppers vs Gainers */}
              <div className="flex items-center bg-white p-1 rounded-lg border border-slate-200 text-xs shadow-2xs">
                <button
                  onClick={() => setStoreViewMode('droppers')}
                  className={`px-3 py-1.5 font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                    storeViewMode === 'droppers'
                      ? 'bg-rose-50 text-rose-800 border border-rose-200 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
                  <span>10 Penurunan Tertinggi</span>
                </button>
                <button
                  onClick={() => setStoreViewMode('gainers')}
                  className={`px-3 py-1.5 font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                    storeViewMode === 'gainers'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                  <span>10 Kenaikan Tertinggi</span>
                </button>
              </div>
            </div>

            {/* Highlight Banner for Droppers */}
            {storeViewMode === 'droppers' && topDecliningStores.length > 0 && (
              <div className="px-5 py-3 bg-rose-50/60 border-b border-rose-100 flex flex-wrap items-center justify-between text-xs gap-3">
                <div className="flex items-center gap-2 text-rose-900">
                  <span className="font-bold">Total Kehilangan Omset di 10 Toko Ini:</span>
                  <span className="font-mono tabular-nums font-bold text-sm text-rose-700">
                    -{formatRupiah(totalDeclineLoss)}
                  </span>
                </div>
                <div className="text-rose-700 text-[11px]">
                  Penurunan Volume: <span className="font-mono font-bold">-{formatNumber(totalQtyLoss)} Pcs</span> · Rekomendasi: Segera jadwalkan kunjungan SPV &amp; Sales.
                </div>
              </div>
            )}

            {/* Table List */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold text-[10px] uppercase tracking-wider border-b border-slate-200 select-none">
                  <tr>
                    <th className="px-4 py-3 text-center w-12"># Rank</th>
                    <th className="px-4 py-3 min-w-[200px]">Nama Toko / Outlet</th>
                    <th className="px-4 py-3 whitespace-nowrap">Wilayah &amp; PIC Sales</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">Periode Utama</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">Pembanding</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">Selisih Nominal</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">% Pertumbuhan</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">Selisih Unit</th>
                    <th className="px-4 py-3 whitespace-nowrap">Brand Terdampak</th>
                    <th className="px-4 py-3 min-w-[160px]">Tindakan Rekomendasi</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {activeStoresList.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-10 text-center text-slate-500">
                        <p className="font-semibold text-slate-700">
                          {storeViewMode === 'droppers'
                            ? 'Tidak ada toko yang mengalami penurunan pada perbandingan periode ini.'
                            : 'Tidak ada toko yang mengalami kenaikan pada perbandingan periode ini.'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Pilih rentang periode lain pada dropdown di atas untuk membandingkan.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    activeStoresList.map((store, index) => {
                      const isDrop = store.diff < 0;
                      const absDiff = Math.abs(store.diff);
                      const absQty = Math.abs(store.diffQty);

                      let actionText = 'Monitoring stok rutin';
                      let actionClass = 'text-slate-600 bg-slate-50';
                      if (store.percent <= -60) {
                        actionText = 'Kunjungan Darurat SPV (Drop > 60%)';
                        actionClass = 'text-rose-700 bg-rose-50 border border-rose-200 font-semibold';
                      } else if (store.percent < -25) {
                        actionText = 'Follow-up Promo & Reorder';
                        actionClass = 'text-amber-800 bg-amber-50 border border-amber-200 font-medium';
                      } else if (store.percent > 50) {
                        actionText = 'Tingkatkan Alokasi Stok';
                        actionClass = 'text-emerald-800 bg-emerald-50 border border-emerald-200 font-semibold';
                      }

                      return (
                        <tr key={store.storeName} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 text-center font-bold font-mono text-slate-500">
                            #{index + 1}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[220px]" title={store.storeName}>
                                {store.storeName}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                            <div className="font-medium text-slate-800">{store.region}</div>
                            <div className="text-[10px] text-slate-400">Sales: {store.sales}</div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-900 font-medium whitespace-nowrap">
                            {formatRupiah(store.primaryValue)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-500 whitespace-nowrap">
                            {formatRupiah(store.compareValue)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums font-bold whitespace-nowrap">
                            <span className={isDrop ? 'text-rose-600' : 'text-emerald-700'}>
                              {isDrop ? '-' : '+'}{formatRupiah(absDiff)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums font-semibold whitespace-nowrap">
                            <span className={`inline-flex items-center gap-0.5 ${isDrop ? 'text-rose-600' : 'text-emerald-700'}`}>
                              {isDrop ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                              {store.percent.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap">
                            <span className={isDrop ? 'text-rose-600 font-medium' : 'text-slate-800 font-medium'}>
                              {isDrop ? '-' : '+'}{formatNumber(absQty)} pcs
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-semibold text-[11px]">
                              {store.topDecliningBrand}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-md text-[11px] inline-block ${actionClass}`}>
                              {actionText}
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
              <div className="flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>Tindakan follow-up toko ditugaskan ke PIC Sales di bawah supervisi SPV Widodo &amp; Hendra.</span>
              </div>
              <span className="text-slate-400 font-mono">
                Menampilkan {activeStoresList.length} toko
              </span>
            </div>

          </div>
        )}

      </div>

    </section>
  );
};
