import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  BarChart,
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend
} from 'recharts';
import { 
  Target, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Sparkles,
  DollarSign,
  Package,
  Layers,
  Download,
  Filter,
  CheckCircle2,
  AlertCircle,
  Trophy,
  FileSpreadsheet,
  User,
  MapPin,
  RotateCcw,
  X
} from 'lucide-react';
import { SalesRecord } from '../types/sales';
import { formatRupiah, formatNumber, formatCompactRupiah } from '../utils/formatters';
import { parseDateSafe } from '../utils/periodUtils';
import { exportAchievementMatrixToExcel } from '../utils/excelExporter';

interface AchievementChartsSectionProps {
  data: SalesRecord[];
}

type PeriodTimeframe = 'daily' | 'monthly' | 'yearly';
type ChartDisplayMode = 'target_vs_actual' | 'brand_stacked' | 'brand_growth';

export interface TimeframeBrandItem {
  key: string;               // e.g. "2026-01-30" or "2026-01" or "2026"
  label: string;             // Display name (e.g. "30 Jan", "Januari 2026", "Tahun 2026")
  rawDate: string;           // Sort key
  // Overall metrics
  totalActualValue: number;
  totalTargetValue: number;
  totalActualQty: number;
  totalTargetQty: number;
  totalAchievementRate: number;
  totalGrowthDiff: number;
  totalGrowthPercent: number;
  // Per Brand breakdown
  brands: {
    [brandKey: string]: {
      value: number;
      qty: number;
      growthDiff: number;
      growthPercent: number;
      share: number;
    };
  };
  // Specific properties for Recharts stacked/multi-bar
  val_you: number;
  val_bnb: number;
  val_lav: number;
  val_daz: number;
  growth_you: number;
  growth_bnb: number;
  growth_lav: number;
  growth_daz: number;
  transactions: number;
}

const BRANDS = ['Y.O.U', 'barenbliss', 'lavojoy', 'DAZZLE ME'];

const BRAND_COLORS: Record<string, { primary: string; light: string; border: string; text: string }> = {
  'Y.O.U': {
    primary: '#e11d48',
    light: '#ffe4e6',
    border: '#fecdd3',
    text: '#9f1239'
  },
  'barenbliss': {
    primary: '#ec4899',
    light: '#fdf2f8',
    border: '#fbcfe8',
    text: '#9d174d'
  },
  'lavojoy': {
    primary: '#059669',
    light: '#ecfdf5',
    border: '#a7f3d0',
    text: '#065f46'
  },
  'DAZZLE ME': {
    primary: '#f59e0b',
    light: '#fffbeb',
    border: '#fde68a',
    text: '#92400e'
  }
};

export const AchievementChartsSection: React.FC<AchievementChartsSectionProps> = ({ data }) => {
  // 1. Timeframe selection (Harian, Bulanan, Tahunan)
  const [timeframe, setTimeframe] = useState<PeriodTimeframe>('daily');
  
  // 2. Brand selection (All Brands or specific brand)
  const [selectedBrand, setSelectedBrand] = useState<string>('all');

  // 3. Metric mode (Value Rp or Qty Pcs)
  const [metricMode, setMetricMode] = useState<'value' | 'qty'>('value');

  // 4. Target baseline buffer percent (e.g. +10%)
  const [targetMarginPercent, setTargetMarginPercent] = useState<number>(10);

  // 5. Chart display type when viewing "All"
  const [chartMode, setChartMode] = useState<ChartDisplayMode>('target_vs_actual');

  // 6. Sales representative filter
  const [selectedSales, setSelectedSales] = useState<string>('all');

  // 7. Region filter
  const [selectedRegion, setSelectedRegion] = useState<string>('all');

  // 8. Transaction Type filter (SELL IN / SELL OUT / Semua)
  const [selectedKet, setSelectedKet] = useState<'all' | 'SELL IN' | 'SELL OUT'>('all');

  // Extract unique Sales list
  const uniqueSalesList = useMemo(() => {
    return Array.from(new Set(data.map(d => (d.sales || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }, [data]);

  // Extract unique Region list
  const uniqueRegionList = useMemo(() => {
    return Array.from(new Set(data.map(d => (d.region || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }, [data]);

  // Scoped dataset filtered by Sales, Region & Transaction Type (Sell In / Sell Out)
  const scopedData = useMemo(() => {
    return data.filter(r => {
      if (selectedKet !== 'all' && (r.ket || '').trim().toUpperCase() !== selectedKet) {
        return false;
      }
      if (selectedSales !== 'all' && (r.sales || '').trim().toLowerCase() !== selectedSales.toLowerCase()) {
        return false;
      }
      if (selectedRegion !== 'all' && (r.region || '').trim().toLowerCase() !== selectedRegion.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [data, selectedKet, selectedSales, selectedRegion]);

  // Helper to compute growth deltas
  const calcGrowth = (curr: number, prev: number) => {
    const diff = curr - prev;
    if (prev === 0) return { diff, percent: curr > 0 ? 100 : 0 };
    const percent = (diff / prev) * 100;
    return { diff, percent };
  };

  // =========================================================================
  // 1. DAILY AGGREGATION (Growth & Achievement DoD)
  // =========================================================================
  const dailyDataset: TimeframeBrandItem[] = useMemo(() => {
    // Map date -> brand -> { value, qty }
    const dateMap = new Map<string, {
      date: string;
      totalVal: number;
      totalQty: number;
      brandData: Record<string, { value: number; qty: number }>;
      tx: number;
    }>();

    scopedData.forEach(r => {
      const d = r.tanggal || '2026-01-30';
      if (!dateMap.has(d)) {
        const initialBrands: Record<string, { value: number; qty: number }> = {};
        BRANDS.forEach(b => { initialBrands[b] = { value: 0, qty: 0 }; });
        dateMap.set(d, {
          date: d,
          totalVal: 0,
          totalQty: 0,
          brandData: initialBrands,
          tx: 0
        });
      }

      const entry = dateMap.get(d)!;
      const v = r.value || 0;
      const q = r.qty || 0;
      entry.totalVal += v;
      entry.totalQty += q;
      entry.tx += 1;

      // Find brand match
      const matchedBrand = BRANDS.find(b => b.toLowerCase() === (r.brand || '').toLowerCase());
      if (matchedBrand) {
        entry.brandData[matchedBrand].value += v;
        entry.brandData[matchedBrand].qty += q;
      }
    });

    const sortedDates = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // Baseline target calculation based on average daily value
    const avgDailyVal = sortedDates.length > 0
      ? Math.round(sortedDates.reduce((s, i) => s + i.totalVal, 0) / sortedDates.length)
      : 0;
    const avgDailyQty = sortedDates.length > 0
      ? Math.round(sortedDates.reduce((s, i) => s + i.totalQty, 0) / sortedDates.length)
      : 0;

    const result: TimeframeBrandItem[] = [];

    for (let i = 0; i < sortedDates.length; i++) {
      const curr = sortedDates[i];
      const prev = i > 0 ? sortedDates[i - 1] : null;

      const dateObj = parseDateSafe(curr.date);
      const label = dateObj 
        ? dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) 
        : curr.date;

      const targetVal = Math.round(avgDailyVal * (1 + targetMarginPercent / 100));
      const targetQty = Math.round(avgDailyQty * (1 + targetMarginPercent / 100));
      const achieve = targetVal > 0 ? (curr.totalVal / targetVal) * 100 : 0;

      const overallGrowth = prev ? calcGrowth(curr.totalVal, prev.totalVal) : { diff: 0, percent: 0 };

      // Per brand growth
      const brandsDetail: TimeframeBrandItem['brands'] = {};
      BRANDS.forEach(b => {
        const bCurrVal = curr.brandData[b]?.value || 0;
        const bCurrQty = curr.brandData[b]?.qty || 0;
        const bPrevVal = prev?.brandData[b]?.value || 0;
        const bGrowth = prev ? calcGrowth(bCurrVal, bPrevVal) : { diff: 0, percent: 0 };
        const share = curr.totalVal > 0 ? (bCurrVal / curr.totalVal) * 100 : 0;

        brandsDetail[b] = {
          value: bCurrVal,
          qty: bCurrQty,
          growthDiff: bGrowth.diff,
          growthPercent: bGrowth.percent,
          share
        };
      });

      result.push({
        key: curr.date,
        label,
        rawDate: curr.date,
        totalActualValue: curr.totalVal,
        totalTargetValue: targetVal,
        totalActualQty: curr.totalQty,
        totalTargetQty: targetQty,
        totalAchievementRate: achieve,
        totalGrowthDiff: overallGrowth.diff,
        totalGrowthPercent: overallGrowth.percent,
        brands: brandsDetail,
        val_you: brandsDetail['Y.O.U']?.value || 0,
        val_bnb: brandsDetail['barenbliss']?.value || 0,
        val_lav: brandsDetail['lavojoy']?.value || 0,
        val_daz: brandsDetail['DAZZLE ME']?.value || 0,
        growth_you: brandsDetail['Y.O.U']?.growthPercent || 0,
        growth_bnb: brandsDetail['barenbliss']?.growthPercent || 0,
        growth_lav: brandsDetail['lavojoy']?.growthPercent || 0,
        growth_daz: brandsDetail['DAZZLE ME']?.growthPercent || 0,
        transactions: curr.tx
      });
    }

    return result;
  }, [scopedData, targetMarginPercent]);

  // =========================================================================
  // 2. MONTHLY AGGREGATION (Growth & Achievement MoM)
  // =========================================================================
  const monthlyDataset: TimeframeBrandItem[] = useMemo(() => {
    const monthMap = new Map<string, {
      key: string;
      label: string;
      totalVal: number;
      totalQty: number;
      brandData: Record<string, { value: number; qty: number }>;
      tx: number;
    }>();

    scopedData.forEach(r => {
      let year = Number(r.tahun) || 2026;
      let month = 1;
      const d = parseDateSafe(r.tanggal);
      if (d) {
        year = d.getFullYear();
        month = d.getMonth() + 1;
      }
      const key = `${year}-${String(month).padStart(2, '0')}`;
      if (!monthMap.has(key)) {
        const dateObj = new Date(year, month - 1, 1);
        const label = dateObj.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
        const initialBrands: Record<string, { value: number; qty: number }> = {};
        BRANDS.forEach(b => { initialBrands[b] = { value: 0, qty: 0 }; });

        monthMap.set(key, {
          key,
          label,
          totalVal: 0,
          totalQty: 0,
          brandData: initialBrands,
          tx: 0
        });
      }

      const entry = monthMap.get(key)!;
      const v = r.value || 0;
      const q = r.qty || 0;
      entry.totalVal += v;
      entry.totalQty += q;
      entry.tx += 1;

      const matchedBrand = BRANDS.find(b => b.toLowerCase() === (r.brand || '').toLowerCase());
      if (matchedBrand) {
        entry.brandData[matchedBrand].value += v;
        entry.brandData[matchedBrand].qty += q;
      }
    });

    const sortedMonths = Array.from(monthMap.values()).sort((a, b) => a.key.localeCompare(b.key));
    const result: TimeframeBrandItem[] = [];

    for (let i = 0; i < sortedMonths.length; i++) {
      const curr = sortedMonths[i];
      const prev = i > 0 ? sortedMonths[i - 1] : null;

      // Target is monthly baseline + margin
      const targetVal = Math.round(curr.totalVal * (1 + targetMarginPercent / 100));
      const targetQty = Math.round(curr.totalQty * (1 + targetMarginPercent / 100));
      const achieve = targetVal > 0 ? (curr.totalVal / targetVal) * 100 : 0;

      const overallGrowth = prev ? calcGrowth(curr.totalVal, prev.totalVal) : { diff: 0, percent: 0 };

      const brandsDetail: TimeframeBrandItem['brands'] = {};
      BRANDS.forEach(b => {
        const bCurrVal = curr.brandData[b]?.value || 0;
        const bCurrQty = curr.brandData[b]?.qty || 0;
        const bPrevVal = prev?.brandData[b]?.value || 0;
        const bGrowth = prev ? calcGrowth(bCurrVal, bPrevVal) : { diff: 0, percent: 0 };
        const share = curr.totalVal > 0 ? (bCurrVal / curr.totalVal) * 100 : 0;

        brandsDetail[b] = {
          value: bCurrVal,
          qty: bCurrQty,
          growthDiff: bGrowth.diff,
          growthPercent: bGrowth.percent,
          share
        };
      });

      result.push({
        key: curr.key,
        label: curr.label,
        rawDate: curr.key,
        totalActualValue: curr.totalVal,
        totalTargetValue: targetVal,
        totalActualQty: curr.totalQty,
        totalTargetQty: targetQty,
        totalAchievementRate: achieve,
        totalGrowthDiff: overallGrowth.diff,
        totalGrowthPercent: overallGrowth.percent,
        brands: brandsDetail,
        val_you: brandsDetail['Y.O.U']?.value || 0,
        val_bnb: brandsDetail['barenbliss']?.value || 0,
        val_lav: brandsDetail['lavojoy']?.value || 0,
        val_daz: brandsDetail['DAZZLE ME']?.value || 0,
        growth_you: brandsDetail['Y.O.U']?.growthPercent || 0,
        growth_bnb: brandsDetail['barenbliss']?.growthPercent || 0,
        growth_lav: brandsDetail['lavojoy']?.growthPercent || 0,
        growth_daz: brandsDetail['DAZZLE ME']?.growthPercent || 0,
        transactions: curr.tx
      });
    }

    return result;
  }, [scopedData, targetMarginPercent]);

  // =========================================================================
  // 3. YEARLY AGGREGATION (Growth & Achievement YoY)
  // =========================================================================
  const yearlyDataset: TimeframeBrandItem[] = useMemo(() => {
    const yearMap = new Map<number, {
      year: number;
      totalVal: number;
      totalQty: number;
      brandData: Record<string, { value: number; qty: number }>;
      tx: number;
    }>();

    scopedData.forEach(r => {
      const d = parseDateSafe(r.tanggal);
      const y = d ? d.getFullYear() : (Number(r.tahun) || 2026);
      if (!yearMap.has(y)) {
        const initialBrands: Record<string, { value: number; qty: number }> = {};
        BRANDS.forEach(b => { initialBrands[b] = { value: 0, qty: 0 }; });

        yearMap.set(y, {
          year: y,
          totalVal: 0,
          totalQty: 0,
          brandData: initialBrands,
          tx: 0
        });
      }

      const entry = yearMap.get(y)!;
      const v = r.value || 0;
      const q = r.qty || 0;
      entry.totalVal += v;
      entry.totalQty += q;
      entry.tx += 1;

      const matchedBrand = BRANDS.find(b => b.toLowerCase() === (r.brand || '').toLowerCase());
      if (matchedBrand) {
        entry.brandData[matchedBrand].value += v;
        entry.brandData[matchedBrand].qty += q;
      }
    });

    const sortedYears = Array.from(yearMap.values()).sort((a, b) => a.year - b.year);
    const result: TimeframeBrandItem[] = [];

    for (let i = 0; i < sortedYears.length; i++) {
      const curr = sortedYears[i];
      const prev = i > 0 ? sortedYears[i - 1] : null;

      const targetVal = Math.round(curr.totalVal * 1.15); // +15% annual target
      const targetQty = Math.round(curr.totalQty * 1.15);
      const achieve = targetVal > 0 ? (curr.totalVal / targetVal) * 100 : 0;

      const overallGrowth = prev ? calcGrowth(curr.totalVal, prev.totalVal) : { diff: 0, percent: 0 };

      const brandsDetail: TimeframeBrandItem['brands'] = {};
      BRANDS.forEach(b => {
        const bCurrVal = curr.brandData[b]?.value || 0;
        const bCurrQty = curr.brandData[b]?.qty || 0;
        const bPrevVal = prev?.brandData[b]?.value || 0;
        const bGrowth = prev ? calcGrowth(bCurrVal, bPrevVal) : { diff: 0, percent: 0 };
        const share = curr.totalVal > 0 ? (bCurrVal / curr.totalVal) * 100 : 0;

        brandsDetail[b] = {
          value: bCurrVal,
          qty: bCurrQty,
          growthDiff: bGrowth.diff,
          growthPercent: bGrowth.percent,
          share
        };
      });

      result.push({
        key: String(curr.year),
        label: `Tahun ${curr.year}`,
        rawDate: String(curr.year),
        totalActualValue: curr.totalVal,
        totalTargetValue: targetVal,
        totalActualQty: curr.totalQty,
        totalTargetQty: targetQty,
        totalAchievementRate: achieve,
        totalGrowthDiff: overallGrowth.diff,
        totalGrowthPercent: overallGrowth.percent,
        brands: brandsDetail,
        val_you: brandsDetail['Y.O.U']?.value || 0,
        val_bnb: brandsDetail['barenbliss']?.value || 0,
        val_lav: brandsDetail['lavojoy']?.value || 0,
        val_daz: brandsDetail['DAZZLE ME']?.value || 0,
        growth_you: brandsDetail['Y.O.U']?.growthPercent || 0,
        growth_bnb: brandsDetail['barenbliss']?.growthPercent || 0,
        growth_lav: brandsDetail['lavojoy']?.growthPercent || 0,
        growth_daz: brandsDetail['DAZZLE ME']?.growthPercent || 0,
        transactions: curr.tx
      });
    }

    return result;
  }, [scopedData]);

  // Active base dataset according to timeframe
  const activeDataset: TimeframeBrandItem[] = useMemo(() => {
    if (timeframe === 'daily') return dailyDataset;
    if (timeframe === 'monthly') return monthlyDataset;
    return yearlyDataset;
  }, [timeframe, dailyDataset, monthlyDataset, yearlyDataset]);

  // Derived dataset filtered by Selected Brand (if specific brand chosen)
  const displayDataset = useMemo(() => {
    if (selectedBrand === 'all') {
      return activeDataset.map(item => ({
        ...item,
        actualValue: item.totalActualValue,
        targetValue: item.totalTargetValue,
        actualQty: item.totalActualQty,
        targetQty: item.totalTargetQty,
        achievementRate: item.totalAchievementRate,
        growthDiff: item.totalGrowthDiff,
        growthPercent: item.totalGrowthPercent
      }));
    }

    // When a specific brand is selected
    return activeDataset.map((item, idx) => {
      const bInfo = item.brands[selectedBrand] || { value: 0, qty: 0, growthDiff: 0, growthPercent: 0, share: 0 };
      const brandVal = bInfo.value;
      const brandQty = bInfo.qty;

      // Brand-specific target
      const targetVal = Math.round(brandVal * (1 + targetMarginPercent / 100));
      const targetQty = Math.round(brandQty * (1 + targetMarginPercent / 100));
      const achieve = targetVal > 0 ? (brandVal / targetVal) * 100 : 0;

      return {
        ...item,
        actualValue: brandVal,
        targetValue: targetVal,
        actualQty: brandQty,
        targetQty: targetQty,
        achievementRate: achieve,
        growthDiff: bInfo.growthDiff,
        growthPercent: bInfo.growthPercent,
        share: bInfo.share
      };
    });
  }, [activeDataset, selectedBrand, targetMarginPercent]);

  // Executive Metric Aggregates
  const totalActual = displayDataset.reduce((s, i) => s + (i.actualValue || 0), 0);
  const totalTarget = displayDataset.reduce((s, i) => s + (i.targetValue || 0), 0);
  const totalQty = displayDataset.reduce((s, i) => s + (i.actualQty || 0), 0);

  const overallAchievement = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 100;

  // Average Growth rate across periods (excluding first baseline)
  const averageGrowth = useMemo(() => {
    const validGrowths = displayDataset.slice(1).map(i => i.growthPercent);
    if (validGrowths.length === 0) return 0;
    return validGrowths.reduce((s, g) => s + g, 0) / validGrowths.length;
  }, [displayDataset]);

  // Latest Period Growth
  const latestPeriod = displayDataset.length > 0 ? displayDataset[displayDataset.length - 1] : null;

  // Best Growing Brand across the active timeframe
  const topGrowthBrand = useMemo(() => {
    if (activeDataset.length < 2) return null;
    const lastItem = activeDataset[activeDataset.length - 1];
    
    let bestBrand = 'Y.O.U';
    let maxGrowth = -Infinity;

    BRANDS.forEach(b => {
      const g = lastItem.brands[b]?.growthPercent || 0;
      if (g > maxGrowth) {
        maxGrowth = g;
        bestBrand = b;
      }
    });

    return {
      name: bestBrand,
      growthPercent: maxGrowth,
      value: lastItem.brands[bestBrand]?.value || 0
    };
  }, [activeDataset]);

  // Render Delta Badge
  const renderGrowthBadge = (diff: number, percent: number, isCurrency = true) => {
    if (diff === 0) {
      return (
        <span className="inline-flex items-center gap-1 font-mono text-xs text-slate-400">
          <Minus className="w-3.5 h-3.5" />
          <span>0.0%</span>
        </span>
      );
    }

    const isPositive = diff > 0;
    return (
      <span className={`inline-flex items-center gap-1 font-mono text-xs font-bold ${
        isPositive ? 'text-emerald-700' : 'text-rose-600'
      }`}>
        {isPositive ? <TrendingUp className="w-3.5 h-3.5 shrink-0" /> : <TrendingDown className="w-3.5 h-3.5 shrink-0" />}
        <span>
          {isPositive ? '+' : ''}{percent.toFixed(1)}%
          <span className="font-normal text-[10px] ml-1 opacity-75">
            ({isPositive ? '+' : ''}{isCurrency ? formatCompactRupiah(diff) : formatNumber(diff)})
          </span>
        </span>
      </span>
    );
  };

  // CSV Export for Growth Matrix
  const handleExportGrowthCsv = () => {
    const headers = [
      'PERIODE', 
      'TOTAL ALL (RP)', 
      'GROWTH ALL (RP)', 
      'GROWTH ALL (%)',
      'Y.O.U (RP)', 
      'GROWTH Y.O.U (%)',
      'BARENBLISS (RP)', 
      'GROWTH BNB (%)',
      'LAVOJOY (RP)', 
      'GROWTH LAV (%)',
      'DAZZLE ME (RP)', 
      'GROWTH DAZ (%)',
      'TARGET ALL (RP)', 
      'CAPAIAN (%)'
    ];

    const rows = activeDataset.map(item => [
      `"${item.label}"`,
      item.totalActualValue,
      item.totalGrowthDiff,
      item.totalGrowthPercent.toFixed(2),
      item.val_you,
      (item.brands['Y.O.U']?.growthPercent || 0).toFixed(2),
      item.val_bnb,
      (item.brands['barenbliss']?.growthPercent || 0).toFixed(2),
      item.val_lav,
      (item.brands['lavojoy']?.growthPercent || 0).toFixed(2),
      item.val_daz,
      (item.brands['DAZZLE ME']?.growthPercent || 0).toFixed(2),
      item.totalTargetValue,
      item.totalAchievementRate.toFixed(2)
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const cleanSales = selectedSales === 'all' ? 'SemuaSales' : selectedSales.replace(/[^a-zA-Z0-9]/g, '_');
    const cleanRegion = selectedRegion === 'all' ? 'SemuaRegion' : selectedRegion.replace(/[^a-zA-Z0-9]/g, '_');
    const cleanKet = selectedKet === 'all' ? '' : `_${selectedKet.replace(/\s+/g, '_')}`;
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Pertumbuhan_Penjualan_${timeframe.toUpperCase()}_${cleanSales}_${cleanRegion}${cleanKet}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to Excel (.xlsx)
  const handleExportGrowthExcel = () => {
    exportAchievementMatrixToExcel(activeDataset, timeframe, targetMarginPercent, selectedSales, selectedRegion, selectedKet);
  };

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-6">
      
      {/* 1. Header with Timeframe, Brand, and Mode Selectors */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
              <Target className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Pencapaian &amp; Growth Penjualan (Harian · Bulanan · Tahunan)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Analisis pertumbuhan omset aktual terhadap periode sebelumnya serta target distribusi kosmetik
          </p>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Timeframe selector: Harian, Bulanan, Tahunan */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setTimeframe('daily')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                timeframe === 'daily'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Harian (DoD)
            </button>
            <button
              onClick={() => setTimeframe('monthly')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                timeframe === 'monthly'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bulanan (MoM)
            </button>
            <button
              onClick={() => setTimeframe('yearly')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                timeframe === 'yearly'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tahunan (YoY)
            </button>
          </div>

          {/* Value vs Qty Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs">
            <button
              onClick={() => setMetricMode('value')}
              className={`px-2.5 py-1 font-semibold rounded-md transition-colors ${
                metricMode === 'value' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Rp (Omset)
            </button>
            <button
              onClick={() => setMetricMode('qty')}
              className={`px-2.5 py-1 font-semibold rounded-md transition-colors ${
                metricMode === 'qty' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Pcs (Unit)
            </button>
          </div>

          {/* Unduh Excel (.xlsx) Button */}
          <button
            onClick={handleExportGrowthExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg shadow-2xs transition-colors"
            title="Unduh data growth & pencapaian target ke Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Unduh Excel</span>
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleExportGrowthCsv}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
            title="Unduh data growth & pencapaian ke CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Brand Selector Bar: Semua Brand (All) + Individual Brands */}
      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-600 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-400" />
            Tinjau Brand:
          </span>

          {/* "Semua Brand (All)" Option */}
          <button
            onClick={() => setSelectedBrand('all')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              selectedBrand === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Semua Brand (All Brands Combined)</span>
          </button>

          {/* Individual Brand Buttons */}
          {BRANDS.map(brandName => {
            const isSelected = selectedBrand === brandName;
            const bColor = BRAND_COLORS[brandName];

            return (
              <button
                key={brandName}
                onClick={() => setSelectedBrand(brandName)}
                style={{
                  backgroundColor: isSelected ? bColor.primary : undefined,
                  borderColor: isSelected ? bColor.primary : undefined,
                  color: isSelected ? '#ffffff' : bColor.text
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all border ${
                  isSelected 
                    ? 'shadow-xs font-bold' 
                    : 'bg-white hover:bg-slate-50'
                }`}
              >
                <span>{brandName}</span>
              </button>
            );
          })}
        </div>

        {/* Baseline Target Multiplier Buffer */}
        <div className="flex items-center gap-2 text-xs text-slate-500 ml-auto">
          <span className="text-[11px]">Ambang Target:</span>
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-md p-0.5">
            {[5, 10, 15, 20].map(pct => (
              <button
                key={pct}
                onClick={() => setTargetMarginPercent(pct)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold transition-colors ${
                  targetMarginPercent === pct
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                +{pct}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2b. Filter Bar: Sales Representative, Region & Tipe Transaksi (Sell In / Sell Out) */}
      <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Label Filter */}
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mr-1">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            <span>Filter Analisis:</span>
          </span>

          {/* Filter Tipe Transaksi (SELL IN / SELL OUT) */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-600 shrink-0">Tipe:</span>
            <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-300 shadow-2xs text-xs">
              <button
                onClick={() => setSelectedKet('all')}
                className={`px-2.5 py-1 font-semibold rounded-md transition-all ${
                  selectedKet === 'all'
                    ? 'bg-slate-900 text-white shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua Status
              </button>
              <button
                onClick={() => setSelectedKet('SELL IN')}
                className={`px-2.5 py-1 font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                  selectedKet === 'SELL IN'
                    ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${selectedKet === 'SELL IN' ? 'bg-white' : 'bg-indigo-500'}`}></span>
                <span>SELL IN</span>
              </button>
              <button
                onClick={() => setSelectedKet('SELL OUT')}
                className={`px-2.5 py-1 font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                  selectedKet === 'SELL OUT'
                    ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${selectedKet === 'SELL OUT' ? 'bg-white' : 'bg-emerald-500'}`}></span>
                <span>SELL OUT</span>
              </button>
            </div>
          </div>

          {/* Filter Sales */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1 shrink-0">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              <span>Sales:</span>
            </label>
            <select
              value={selectedSales}
              onChange={(e) => setSelectedSales(e.target.value)}
              className="text-xs py-1.5 px-3 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs min-w-[170px]"
            >
              <option value="all">Semua Sales ({uniqueSalesList.length})</option>
              {uniqueSalesList.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Region */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1 shrink-0">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>Region:</span>
            </label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="text-xs py-1.5 px-3 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs min-w-[160px]"
            >
              <option value="all">Semua Region ({uniqueRegionList.length})</option>
              {uniqueRegionList.map(r => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Reset Button if active */}
          {(selectedSales !== 'all' || selectedRegion !== 'all' || selectedKet !== 'all') && (
            <button
              onClick={() => {
                setSelectedSales('all');
                setSelectedRegion('all');
                setSelectedKet('all');
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200 shadow-2xs"
              title="Reset semua filter analisis ini"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          )}

        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[11px] font-mono text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-md shadow-2xs">
            {scopedData.length} Transaksi Terpilih
            {(selectedSales !== 'all' || selectedRegion !== 'all' || selectedKet !== 'all') && (
              <span className="font-sans font-medium text-indigo-700 ml-1.5">
                ({selectedKet !== 'all' ? selectedKet : 'All KET'} · {selectedSales !== 'all' ? selectedSales : 'Semua Sales'} · {selectedRegion !== 'all' ? selectedRegion : 'Semua Region'})
              </span>
            )}
          </span>
        </div>
      </div>

      {/* 3. Executive KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Realisasi Omset Terkini + Growth Delta */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">
              {selectedBrand === 'all' ? 'Total Realisasi Omset' : `Omset ${selectedBrand}`}
            </span>
            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">
            {metricMode === 'value' ? formatRupiah(totalActual) : `${formatNumber(totalQty)} Pcs`}
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-400">Growth Periode Terakhir:</span>
            {latestPeriod 
              ? renderGrowthBadge(latestPeriod.growthDiff, latestPeriod.growthPercent, metricMode === 'value')
              : <span className="text-slate-400">-</span>
            }
          </div>
        </div>

        {/* Metric 2: Rata-Rata Pertumbuhan (Average Growth) */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">
              Rata-rata Growth ({timeframe.toUpperCase()})
            </span>
            {averageGrowth >= 0 ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
            )}
          </div>
          <div className="text-xl font-bold font-mono tabular-nums">
            <span className={averageGrowth >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
              {averageGrowth >= 0 ? '+' : ''}{averageGrowth.toFixed(1)}%
            </span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Basis:</span>
            <span className="font-semibold text-slate-700">{displayDataset.length} Periode Data</span>
          </div>
        </div>

        {/* Metric 3: % Pencapaian Target */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">% Capaian Target</span>
            {overallAchievement >= 100 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600" />
            )}
          </div>
          <div className="text-xl font-bold font-mono tabular-nums">
            <span className={overallAchievement >= 100 ? 'text-emerald-700' : 'text-amber-600'}>
              {overallAchievement.toFixed(1)}%
            </span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100">
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  overallAchievement >= 100 ? 'bg-emerald-600' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(100, overallAchievement)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Metric 4: Juara Pertumbuhan (Top Growth Brand) */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Top Growth Brand</span>
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-base font-bold text-slate-900 truncate">
            {topGrowthBrand?.name || 'Y.O.U'}
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="text-xs font-mono font-bold text-emerald-700">
              +{topGrowthBrand?.growthPercent ? topGrowthBrand.growthPercent.toFixed(1) : '0.0'}%
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              ({formatCompactRupiah(topGrowthBrand?.value || 0)})
            </span>
          </div>
          <div className="mt-2 pt-1 border-t border-slate-100 text-[10px] text-slate-400">
            Merek lonjakan tercepat periode ini
          </div>
        </div>

      </div>

      {/* 4. Main Chart Section */}
      <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-xs space-y-4">
        
        {/* Chart Header & Sub-Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {selectedBrand === 'all' 
                ? (chartMode === 'target_vs_actual' 
                    ? `Grafik Pencapaian Omset All Brands (${timeframe.toUpperCase()})` 
                    : chartMode === 'brand_stacked'
                    ? `Komposisi Omset Per Brand (${timeframe.toUpperCase()})`
                    : `Laju Pertumbuhan Growth (%) Per Brand`)
                : `Grafik Pencapaian & Target ${selectedBrand} (${timeframe.toUpperCase()})`
              }
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {selectedBrand === 'all'
                ? 'Visualisasi komparasi tren pendapatan antar brand dan deviasi target penjualan'
                : `Analisis pergerakan faktur dan target penjualan khusus portofolio ${selectedBrand}`
              }
            </p>
          </div>

          {/* Sub-toggles when 'all' is selected */}
          {selectedBrand === 'all' && (
            <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs">
              <button
                onClick={() => setChartMode('target_vs_actual')}
                className={`px-2.5 py-1 font-semibold rounded-md transition-colors ${
                  chartMode === 'target_vs_actual' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Realisasi vs Target
              </button>
              <button
                onClick={() => setChartMode('brand_stacked')}
                className={`px-2.5 py-1 font-semibold rounded-md transition-colors ${
                  chartMode === 'brand_stacked' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Omset Per Brand
              </button>
              <button
                onClick={() => setChartMode('brand_growth')}
                className={`px-2.5 py-1 font-semibold rounded-md transition-colors ${
                  chartMode === 'brand_growth' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Growth (%) Per Brand
              </button>
            </div>
          )}
        </div>

        {displayDataset.length === 0 ? (
          <div className="h-72 w-full flex flex-col items-center justify-center bg-slate-50/50 rounded-lg border border-dashed border-slate-200 text-slate-500">
            <Filter className="w-8 h-8 text-slate-300 mb-2" />
            <p className="font-semibold text-xs text-slate-700">Tidak ada transaksi yang cocok untuk filter yang dipilih</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Silakan pilih sales atau region lain untuk menampilkan visualisasi grafik pertumbuhan.</p>
            {(selectedSales !== 'all' || selectedRegion !== 'all') && (
              <button
                onClick={() => {
                  setSelectedSales('all');
                  setSelectedRegion('all');
                }}
                className="mt-3 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200"
              >
                Reset Filter Sales &amp; Region
              </button>
            )}
          </div>
        ) : (
          <>
            {/* CHART 1: Realisasi vs Target (All or Single Brand) */}
            {(selectedBrand !== 'all' || chartMode === 'target_vs_actual') && (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={displayDataset} margin={{ top: 15, right: 15, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                      dataKey="label" 
                      tick={{ fontSize: 11, fill: '#475569' }} 
                      axisLine={{ stroke: '#e2e8f0' }} 
                      tickLine={false} 
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fill: '#64748b' }} 
                      axisLine={false} 
                      tickLine={false}
                      tickFormatter={(val) => metricMode === 'value' ? formatCompactRupiah(val) : formatNumber(val)} 
                    />
                    <Tooltip
                      formatter={(value: any, name: any) => [
                        metricMode === 'value' ? formatRupiah(Number(value)) : `${formatNumber(Number(value))} Pcs`,
                        name
                      ]}
                      labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    
                    <Bar 
                      dataKey={metricMode === 'value' ? 'actualValue' : 'actualQty'} 
                      name={selectedBrand === 'all' ? 'Realisasi Total All' : `Realisasi ${selectedBrand}`} 
                      fill={selectedBrand === 'all' ? '#4f46e5' : (BRAND_COLORS[selectedBrand]?.primary || '#4f46e5')} 
                      radius={[4, 4, 0, 0]} 
                      barSize={32}
                    />
                    
                    <Line 
                      type="monotone" 
                      dataKey={metricMode === 'value' ? 'targetValue' : 'targetQty'} 
                      name="Garis Target Penjualan" 
                      stroke="#e11d48" 
                      strokeWidth={2} 
                      strokeDasharray="4 4"
                      dot={{ r: 4, fill: '#e11d48' }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* CHART 2: Omset Per Brand (Grouped/Stacked Bar) */}
            {selectedBrand === 'all' && chartMode === 'brand_stacked' && (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={displayDataset} margin={{ top: 15, right: 15, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                      dataKey="label" 
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
                      formatter={(value: any, name: any) => [formatRupiah(Number(value)), name]}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    
                    <Bar dataKey="val_you" name="Y.O.U" fill={BRAND_COLORS['Y.O.U'].primary} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="val_bnb" name="barenbliss" fill={BRAND_COLORS['barenbliss'].primary} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="val_lav" name="lavojoy" fill={BRAND_COLORS['lavojoy'].primary} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="val_daz" name="DAZZLE ME" fill={BRAND_COLORS['DAZZLE ME'].primary} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* CHART 3: Growth (%) Trajectory Per Brand */}
            {selectedBrand === 'all' && chartMode === 'brand_growth' && (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={displayDataset} margin={{ top: 15, right: 15, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                      dataKey="label" 
                      tick={{ fontSize: 11, fill: '#475569' }} 
                      axisLine={{ stroke: '#e2e8f0' }} 
                      tickLine={false} 
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fill: '#64748b' }} 
                      axisLine={false} 
                      tickLine={false}
                      tickFormatter={(val) => `${val}%`} 
                    />
                    <Tooltip
                      formatter={(value: any, name: any) => [`${Number(value).toFixed(1)}%`, name]}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

                    <Line type="monotone" dataKey="growth_you" name="Growth Y.O.U (%)" stroke={BRAND_COLORS['Y.O.U'].primary} strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="growth_bnb" name="Growth barenbliss (%)" stroke={BRAND_COLORS['barenbliss'].primary} strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="growth_lav" name="Growth lavojoy (%)" stroke={BRAND_COLORS['lavojoy'].primary} strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="growth_daz" name="Growth DAZZLE ME (%)" stroke={BRAND_COLORS['DAZZLE ME'].primary} strokeWidth={2} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}

      </div>

      {/* 5. Comprehensive Growth & Achievement Matrix Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
        
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Tabel Matriks Pertumbuhan Omset (All &amp; Per Brand) · {timeframe.toUpperCase()}
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Rincian realisasi, selisih pertumbuhan terhadap periode sebelumnya, dan persentase capaian target
            </p>
          </div>
          <span className="text-[11px] text-slate-500 font-mono bg-white px-2.5 py-1 rounded-md border border-slate-200">
            {displayDataset.length} Periode Tercatat
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/75 text-slate-600 font-bold text-[10px] uppercase tracking-wider border-b border-slate-200 select-none">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">Periode</th>
                <th className="px-4 py-3 text-right whitespace-nowrap bg-indigo-50/40 text-indigo-900">Total Omset All</th>
                <th className="px-4 py-3 text-right whitespace-nowrap bg-indigo-50/40 text-indigo-900">Growth All (%)</th>
                
                {/* Per Brand Columns */}
                <th className="px-4 py-3 text-right whitespace-nowrap text-rose-800">Y.O.U</th>
                <th className="px-4 py-3 text-right whitespace-nowrap text-rose-800">Growth Y.O.U</th>

                <th className="px-4 py-3 text-right whitespace-nowrap text-pink-800">barenbliss</th>
                <th className="px-4 py-3 text-right whitespace-nowrap text-pink-800">Growth BNB</th>

                <th className="px-4 py-3 text-right whitespace-nowrap text-emerald-800">lavojoy</th>
                <th className="px-4 py-3 text-right whitespace-nowrap text-emerald-800">Growth LAV</th>

                <th className="px-4 py-3 text-right whitespace-nowrap text-amber-800">DAZZLE ME</th>
                <th className="px-4 py-3 text-right whitespace-nowrap text-amber-800">Growth DAZ</th>

                {/* Target & Status */}
                <th className="px-4 py-3 text-right whitespace-nowrap">Target Omset</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Capaian (%)</th>
                <th className="px-4 py-3 text-center whitespace-nowrap">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-normal">
              {activeDataset.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-4 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Filter className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-slate-700">Tidak ada data transaksi yang cocok</p>
                      <p className="text-xs text-slate-400">Coba ubah kombinasi filter Sales atau Region untuk melihat data pencapaian matriks.</p>
                      {(selectedSales !== 'all' || selectedRegion !== 'all') && (
                        <button
                          onClick={() => {
                            setSelectedSales('all');
                            setSelectedRegion('all');
                          }}
                          className="mt-2 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200"
                        >
                          Reset Filter Sales &amp; Region
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                activeDataset.map((row, idx) => {
                  const isHit = row.totalActualValue >= row.totalTargetValue;
                  const achieve = row.totalAchievementRate;

                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Period Label */}
                    <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">
                      {row.label}
                    </td>

                    {/* Total All Omset */}
                    <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-indigo-900 bg-indigo-50/20 whitespace-nowrap">
                      {formatRupiah(row.totalActualValue)}
                    </td>

                    {/* Total Growth */}
                    <td className="px-4 py-3 text-right font-mono tabular-nums bg-indigo-50/20 whitespace-nowrap">
                      {idx === 0 ? (
                        <span className="text-slate-400 text-[11px]">-</span>
                      ) : (
                        renderGrowthBadge(row.totalGrowthDiff, row.totalGrowthPercent, false)
                      )}
                    </td>

                    {/* Y.O.U */}
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-800 whitespace-nowrap">
                      {formatCompactRupiah(row.val_you)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums whitespace-nowrap">
                      {idx === 0 ? <span className="text-slate-400">-</span> : (
                        <span className={`text-[11px] font-semibold ${row.growth_you >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {row.growth_you >= 0 ? '+' : ''}{row.growth_you.toFixed(1)}%
                        </span>
                      )}
                    </td>

                    {/* barenbliss */}
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-800 whitespace-nowrap">
                      {formatCompactRupiah(row.val_bnb)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums whitespace-nowrap">
                      {idx === 0 ? <span className="text-slate-400">-</span> : (
                        <span className={`text-[11px] font-semibold ${row.growth_bnb >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {row.growth_bnb >= 0 ? '+' : ''}{row.growth_bnb.toFixed(1)}%
                        </span>
                      )}
                    </td>

                    {/* lavojoy */}
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-800 whitespace-nowrap">
                      {formatCompactRupiah(row.val_lav)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums whitespace-nowrap">
                      {idx === 0 ? <span className="text-slate-400">-</span> : (
                        <span className={`text-[11px] font-semibold ${row.growth_lav >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {row.growth_lav >= 0 ? '+' : ''}{row.growth_lav.toFixed(1)}%
                        </span>
                      )}
                    </td>

                    {/* DAZZLE ME */}
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-800 whitespace-nowrap">
                      {formatCompactRupiah(row.val_daz)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums whitespace-nowrap">
                      {idx === 0 ? <span className="text-slate-400">-</span> : (
                        <span className={`text-[11px] font-semibold ${row.growth_daz >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {row.growth_daz >= 0 ? '+' : ''}{row.growth_daz.toFixed(1)}%
                        </span>
                      )}
                    </td>

                    {/* Target Omset */}
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-500 whitespace-nowrap">
                      {formatCompactRupiah(row.totalTargetValue)}
                    </td>

                    {/* % Capaian */}
                    <td className="px-4 py-3 text-right font-mono tabular-nums font-bold whitespace-nowrap">
                      <span className={achieve >= 100 ? 'text-emerald-700' : 'text-amber-600'}>
                        {achieve.toFixed(1)}%
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isHit ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isHit ? 'Tercapai' : 'Di Bawah'}
                      </span>
                    </td>

                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

    </section>
  );
};
