import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  CartesianGrid,
  Legend
} from 'recharts';
import { SalesRecord } from '../types/sales';
import { formatRupiah, formatNumber, formatCompactRupiah } from '../utils/formatters';
import { exportChartsToExcel } from '../utils/excelExporter';
import { BarChart3, PieChart as PieIcon, Store, Layers, FileSpreadsheet, Filter } from 'lucide-react';

interface ChartsSectionProps {
  data: SalesRecord[];
}

const BRAND_COLORS: Record<string, string> = {
  'Y.O.U': '#0f172a',      // Slate 900
  'barenbliss': '#f43f5e', // Rose 500
  'lavojoy': '#d97706',    // Amber 600
  'DAZZLE ME': '#6366f1',  // Indigo 500
  'Lainnya': '#94a3b8'     // Slate 400
};

export const ChartsSection: React.FC<ChartsSectionProps> = ({ data }) => {
  const [metricMode, setMetricMode] = useState<'value' | 'qty'>('value');
  const [ketFilter, setKetFilter] = useState<'all' | 'SELL IN' | 'SELL OUT'>('all');

  // Filter base data by transaction type
  const scopedData = useMemo(() => {
    if (ketFilter === 'all') return data;
    return data.filter(r => (r.ket || '').trim().toUpperCase() === ketFilter);
  }, [data, ketFilter]);

  // 1. Timeline Data (grouped by date)
  const timelineData = useMemo(() => {
    const dateMap: Record<string, { tanggal: string; value: number; qty: number }> = {};
    scopedData.forEach((r) => {
      const d = r.tanggal || 'N/A';
      if (!dateMap[d]) {
        dateMap[d] = { tanggal: d, value: 0, qty: 0 };
      }
      dateMap[d].value += r.value || 0;
      dateMap[d].qty += r.qty || 0;
    });
    return Object.values(dateMap).sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  }, [scopedData]);

  // 2. Brand Share Data
  const brandData = useMemo(() => {
    const brandMap: Record<string, { name: string; value: number; qty: number }> = {};
    scopedData.forEach((r) => {
      const b = r.brand || 'Lainnya';
      if (!brandMap[b]) {
        brandMap[b] = { name: b, value: 0, qty: 0 };
      }
      brandMap[b].value += r.value || 0;
      brandMap[b].qty += r.qty || 0;
    });
    return Object.values(brandMap).sort((a, b) => b.value - a.value);
  }, [scopedData]);

  // 3. Top Stores Data
  const topStoresData = useMemo(() => {
    const storeMap: Record<string, { store: string; value: number; qty: number }> = {};
    scopedData.forEach((r) => {
      const s = r.namaStore || 'Lainnya';
      if (!storeMap[s]) {
        storeMap[s] = { store: s, value: 0, qty: 0 };
      }
      storeMap[s].value += r.value || 0;
      storeMap[s].qty += r.qty || 0;
    });
    return Object.values(storeMap)
      .sort((a, b) => b[metricMode] - a[metricMode])
      .slice(0, 6)
      .map(item => ({
        ...item,
        shortName: item.store.length > 18 ? item.store.slice(0, 18) + '...' : item.store
      }));
  }, [scopedData, metricMode]);

  // 4. Category Share Data
  const categoryData = useMemo(() => {
    const categoryMap: Record<string, { category: string; value: number; qty: number }> = {};
    scopedData.forEach((r) => {
      const cat = r.kategori || 'Lainnya';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { category: cat, value: 0, qty: 0 };
      }
      categoryMap[cat].value += r.value || 0;
      categoryMap[cat].qty += r.qty || 0;
    });
    return Object.values(categoryMap).sort((a, b) => b[metricMode] - a[metricMode]);
  }, [scopedData, metricMode]);

  // Export to Excel handler
  const handleExportExcel = () => {
    exportChartsToExcel(timelineData, brandData, topStoresData, categoryData, metricMode, ketFilter);
  };

  // Tooltip customizer
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-2.5 rounded-lg text-xs shadow-lg font-mono">
          <p className="font-sans font-semibold text-slate-200 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color || entry.fill }}>
              {entry.name}: {entry.name.toLowerCase().includes('qty') || entry.name.toLowerCase().includes('unit') ? `${formatNumber(entry.value)} Pcs` : formatRupiah(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <section className="space-y-4">
      
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Visualisasi &amp; Tren Penjualan
          </h3>
          <p className="text-xs text-slate-500">
            Analisis tren omset harian, kontribusi merek, dan ranking toko
          </p>
        </div>
        
        {/* Controls: Sell In/Out + Metric Mode + Excel Export */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Status Transaksi (SELL IN / SELL OUT) Toggle */}
          <div className="flex items-center gap-1.5 text-xs bg-slate-50 p-1 rounded-lg border border-slate-200">
            <span className="font-semibold text-slate-700 pl-1">Status:</span>
            <div className="flex items-center bg-white p-0.5 rounded-md border border-slate-200 shadow-2xs">
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

          {/* Toggle Value vs Qty */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setMetricMode('value')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                metricMode === 'value'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Omset (Rp)
            </button>
            <button
              onClick={() => setMetricMode('qty')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                metricMode === 'qty'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Qty (Pcs)
            </button>
          </div>

          {/* Unduh Excel Button */}
          <button
            onClick={handleExportExcel}
            title="Unduh Visualisasi & Tren ke Excel (.xlsx)"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Unduh Excel</span>
          </button>
        </div>
      </div>

      {/* Grid 2x2 Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Chart 1: Timeline Trend */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Tren Harian ({metricMode === 'value' ? 'Omset' : 'Volume'})
              </h4>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {timelineData.length} Periode
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timelineData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="tanggal" 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => metricMode === 'value' ? formatCompactRupiah(val) : formatNumber(val)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey={metricMode} 
                  name={metricMode === 'value' ? 'Total Omset' : 'Total Kuantiti'} 
                  fill="#4f46e5" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Brand Distribution Pie/Donut */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-rose-500" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Pangsa Merek (Brand Share)
              </h4>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {brandData.length} Brands
            </span>
          </div>

          <div className="h-64 w-full flex items-center">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={brandData}
                    dataKey={metricMode}
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {brandData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={BRAND_COLORS[entry.name] || '#64748b'} 
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Custom Legend */}
            <div className="w-1/2 space-y-2 pl-2">
              {brandData.map((item) => {
                const total = brandData.reduce((s, b) => s + b[metricMode], 0);
                const percent = total > 0 ? ((item[metricMode] / total) * 100).toFixed(1) : '0';
                return (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span 
                        className="w-2.5 h-2.5 rounded-full shrink-0" 
                        style={{ backgroundColor: BRAND_COLORS[item.name] || '#64748b' }} 
                      />
                      <span className="font-semibold text-slate-700 truncate">{item.name}</span>
                    </div>
                    <span className="font-mono tabular-nums text-slate-500 font-medium">
                      {percent}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chart 3: Top Stores Leaderboard */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Top Outlet / Toko Retail ({metricMode === 'value' ? 'Omset' : 'Volume'})
              </h4>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                layout="vertical" 
                data={topStoresData} 
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis 
                  type="number" 
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={(val) => metricMode === 'value' ? formatCompactRupiah(val) : formatNumber(val)}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis 
                  type="category" 
                  dataKey="shortName" 
                  tick={{ fontSize: 11, fill: '#334155' }} 
                  width={110}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey={metricMode} 
                  name={metricMode === 'value' ? 'Omset Toko' : 'Kuantiti Toko'} 
                  fill="#059669" 
                  radius={[0, 4, 4, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Kategori Produk */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Distribusi Kategori Produk ({metricMode === 'value' ? 'Omset' : 'Volume'})
              </h4>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="category" 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => metricMode === 'value' ? formatCompactRupiah(val) : formatNumber(val)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey={metricMode} 
                  name={metricMode === 'value' ? 'Nilai Penjualan' : 'Kuantiti'} 
                  fill="#d97706" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </section>
  );
};
