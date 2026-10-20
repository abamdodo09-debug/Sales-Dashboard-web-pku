import React from 'react';
import { SalesRecord } from '../types/sales';
import { formatRupiah, formatNumber } from '../utils/formatters';
import { Sparkles, ArrowRight } from 'lucide-react';

interface BrandCardsProps {
  data: SalesRecord[];
  selectedBrand: string;
  onSelectBrand: (brand: string) => void;
}

interface BrandProfile {
  name: string;
  tagline: string;
  accentColor: string;
  badgeBg: string;
  badgeText: string;
}

const BRAND_PROFILES: Record<string, BrandProfile> = {
  'Y.O.U': {
    name: 'Y.O.U',
    tagline: 'Skincare & Sunscreen Anti-Aging',
    accentColor: 'border-slate-800',
    badgeBg: 'bg-slate-900',
    badgeText: 'text-white'
  },
  'barenbliss': {
    name: 'barenbliss',
    tagline: 'K-Beauty Makeup, Lips & Cushions',
    accentColor: 'border-rose-400',
    badgeBg: 'bg-rose-500',
    badgeText: 'text-white'
  },
  'lavojoy': {
    name: 'lavojoy',
    tagline: 'Fragrant Body Serum & Haircare',
    accentColor: 'border-amber-400',
    badgeBg: 'bg-amber-600',
    badgeText: 'text-white'
  },
  'DAZZLE ME': {
    name: 'DAZZLE ME',
    tagline: 'Gen-Z Mascara, Eyeliner & Trends',
    accentColor: 'border-indigo-400',
    badgeBg: 'bg-indigo-600',
    badgeText: 'text-white'
  }
};

export const BrandCards: React.FC<BrandCardsProps> = ({
  data,
  selectedBrand,
  onSelectBrand
}) => {
  const totalAllValue = data.reduce((sum, item) => sum + (item.value || 0), 0);

  // Group by brand
  const brands = ['Y.O.U', 'barenbliss', 'lavojoy', 'DAZZLE ME'];

  const brandStats = brands.map(brandName => {
    const brandRows = data.filter(r => r.brand.toLowerCase() === brandName.toLowerCase());
    const value = brandRows.reduce((sum, r) => sum + (r.value || 0), 0);
    const qty = brandRows.reduce((sum, r) => sum + (r.qty || 0), 0);
    const stores = new Set(brandRows.map(r => r.namaStore)).size;
    const share = totalAllValue > 0 ? (value / totalAllValue) * 100 : 0;

    // Top selling SKU in this brand
    const skuMap: Record<string, number> = {};
    brandRows.forEach(r => {
      skuMap[r.sku] = (skuMap[r.sku] || 0) + r.qty;
    });
    let topSku = '-';
    let maxSkuQty = 0;
    Object.entries(skuMap).forEach(([skuName, skuQty]) => {
      if (skuQty > maxSkuQty) {
        maxSkuQty = skuQty;
        topSku = skuName;
      }
    });

    return {
      name: brandName,
      value,
      qty,
      stores,
      share,
      topSku,
      profile: BRAND_PROFILES[brandName]
    };
  });

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Performa Merek (Brand Performance)
          </h3>
          <p className="text-xs text-slate-500">
            Klik kartu untuk memfilter analisis berdasarkan brand
          </p>
        </div>
        {selectedBrand && (
          <button
            onClick={() => onSelectBrand('')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
          >
            Tampilkan Semua Merek
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {brandStats.map((item) => {
          const isSelected = selectedBrand.toLowerCase() === item.name.toLowerCase();

          return (
            <button
              key={item.name}
              type="button"
              onClick={() => onSelectBrand(isSelected ? '' : item.name)}
              className={`text-left p-4 rounded-xl border transition-all relative overflow-hidden bg-white ${
                isSelected 
                  ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md' 
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              {/* Header badge */}
              <div className="flex items-center justify-between mb-3">
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase ${item.profile.badgeBg} ${item.profile.badgeText}`}>
                  {item.name}
                </span>
                <span className="text-xs font-semibold text-slate-500 font-mono tabular-nums">
                  {item.share.toFixed(1)}% Share
                </span>
              </div>

              {/* Tagline */}
              <p className="text-[11px] text-slate-500 line-clamp-1 mb-2">
                {item.profile.tagline}
              </p>

              {/* Value & Qty */}
              <div className="text-lg font-bold text-slate-900 font-mono tabular-nums mb-1">
                {formatRupiah(item.value)}
              </div>
              
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                <span className="font-mono tabular-nums font-semibold text-slate-700">{formatNumber(item.qty)} pcs</span>
                <span aria-hidden="true">·</span>
                <span>{item.stores} Toko</span>
              </div>

              {/* Top product preview */}
              <div className="pt-2.5 border-t border-slate-100 text-[11px] text-slate-600 flex items-center justify-between">
                <span className="truncate pr-2 font-medium" title={item.topSku}>
                  Top: {item.topSku.replace(item.name, '').trim() || item.topSku}
                </span>
                <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
              </div>

            </button>
          );
        })}
      </div>
    </section>
  );
};
