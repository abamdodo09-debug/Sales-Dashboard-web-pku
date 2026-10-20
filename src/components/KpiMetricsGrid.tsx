import React from 'react';
import { 
  TrendingUp, 
  Package, 
  Store, 
  ShoppingBag, 
  Boxes, 
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { SalesRecord } from '../types/sales';
import { formatRupiah, formatNumber } from '../utils/formatters';

interface KpiMetricsGridProps {
  data: SalesRecord[];
  allData: SalesRecord[];
}

export const KpiMetricsGrid: React.FC<KpiMetricsGridProps> = ({ data, allData }) => {
  const totalValue = data.reduce((sum, item) => sum + (item.value || 0), 0);
  const totalQty = data.reduce((sum, item) => sum + (item.qty || 0), 0);
  
  const uniqueStores = new Set(data.map(i => i.namaStore.trim()).filter(Boolean)).size;
  const uniqueSkus = new Set(data.map(i => i.noSku.trim()).filter(Boolean)).size;
  
  const avgValuePerStore = uniqueStores > 0 ? Math.round(totalValue / uniqueStores) : 0;
  const avgPricePerUnit = totalQty > 0 ? Math.round(totalValue / totalQty) : 0;

  // Sell In vs Sell Out split
  const sellInVal = data.filter(i => i.ket === 'SELL IN').reduce((s, i) => s + (i.value || 0), 0);
  const sellOutVal = data.filter(i => i.ket === 'SELL OUT').reduce((s, i) => s + (i.value || 0), 0);
  const sellInPercent = totalValue > 0 ? Math.round((sellInVal / totalValue) * 100) : 0;

  // Focus Products share
  const focusVal = data.filter(i => i.produkFokus && i.produkFokus !== '-').reduce((s, i) => s + (i.value || 0), 0);
  const focusPercent = totalValue > 0 ? Math.round((focusVal / totalValue) * 100) : 0;

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      
      {/* KPI 1: Total Omset */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Total Penjualan (Value)</span>
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight font-mono tabular-nums">
          {formatRupiah(totalValue)}
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Sell-In: <span className="font-semibold text-slate-800 tabular-nums">{sellInPercent}%</span></span>
          <span aria-hidden="true">·</span>
          <span>Sell-Out: <span className="font-semibold text-slate-800 tabular-nums">{100 - sellInPercent}%</span></span>
        </div>
      </div>

      {/* KPI 2: Total Volume / Qty */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Total Volume Terjual</span>
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
            <Package className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight font-mono tabular-nums">
          {formatNumber(totalQty)} <span className="text-sm font-semibold text-slate-500">Pcs</span>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Rata-rata/Unit:</span>
          <span className="font-semibold text-slate-800 font-mono tabular-nums">
            {formatRupiah(avgPricePerUnit)}
          </span>
        </div>
      </div>

      {/* KPI 3: Toko / Outlets Aktif */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Toko / Outlet Terlayani</span>
          <div className="p-1.5 rounded-lg bg-purple-50 text-purple-700">
            <Store className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight font-mono tabular-nums">
          {formatNumber(uniqueStores)} <span className="text-sm font-semibold text-slate-500">Store</span>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Rata-rata/Toko:</span>
          <span className="font-semibold text-slate-800 font-mono tabular-nums">
            {formatRupiah(avgValuePerStore)}
          </span>
        </div>
      </div>

      {/* KPI 4: SKU & Produk Fokus */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Portofolio SKU Aktif</span>
          <div className="p-1.5 rounded-lg bg-rose-50 text-rose-700">
            <Boxes className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight font-mono tabular-nums">
          {formatNumber(uniqueSkus)} <span className="text-sm font-semibold text-slate-500">Varian SKU</span>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Porsi Produk Fokus:</span>
          <span className="font-semibold text-indigo-700 font-mono tabular-nums">
            {focusPercent}% dari omset
          </span>
        </div>
      </div>

    </section>
  );
};
