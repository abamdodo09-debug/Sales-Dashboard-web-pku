import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  RotateCcw, 
  X, 
  Check, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Store, 
  MapPin, 
  Tag, 
  DollarSign, 
  Hash, 
  SlidersHorizontal,
  UserCheck,
  Building2,
  PackageCheck,
  FileSpreadsheet,
  ArrowRight
} from 'lucide-react';
import { FilterState, SalesRecord } from '../types/sales';

interface FilterToolbarProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  onResetFilters: () => void;
  data: SalesRecord[];
  filteredCount: number;
  totalCount: number;
  onOpenTransactionMenu?: () => void;
}

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  data,
  filteredCount,
  totalCount,
  onOpenTransactionMenu
}) => {
  // State for expanding full 20 columns panel
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeTabGroup, setActiveTabGroup] = useState<'all' | 'time' | 'sales_area' | 'product' | 'numbers'>('all');

  // Extract unique options from raw dataset for all 20 columns
  const uniqueDates = useMemo(() => Array.from(new Set(data.map(d => d.tanggal).filter(Boolean))).sort().reverse(), [data]);
  const uniqueMonths = useMemo(() => Array.from(new Set(data.map(d => d.bulan).filter(Boolean))).sort(), [data]);
  const uniqueYears = useMemo(() => Array.from(new Set(data.map(d => String(d.tahun)).filter(Boolean))).sort().reverse(), [data]);
  const uniqueBas = useMemo(() => Array.from(new Set(data.map(d => d.ba).filter(Boolean).filter(b => b !== '-'))).sort(), [data]);
  const uniqueBaNumbers = useMemo(() => Array.from(new Set(data.map(d => d.baNumber).filter(Boolean).filter(b => b !== '-'))).sort(), [data]);
  const uniqueCoverAreas = useMemo(() => Array.from(new Set(data.map(d => d.coverArea).filter(Boolean))).sort(), [data]);
  const uniqueSales = useMemo(() => Array.from(new Set(data.map(d => d.sales).filter(Boolean))).sort(), [data]);
  const uniqueSpvs = useMemo(() => Array.from(new Set(data.map(d => d.spv).filter(Boolean))).sort(), [data]);
  const uniqueBrands = useMemo(() => Array.from(new Set(data.map(d => d.brand).filter(Boolean))).sort(), [data]);
  const uniqueNoSkus = useMemo(() => Array.from(new Set(data.map(d => d.noSku).filter(Boolean))).sort(), [data]);
  const uniqueSpus = useMemo(() => Array.from(new Set(data.map(d => d.spu).filter(Boolean))).sort(), [data]);
  const uniqueSkus = useMemo(() => Array.from(new Set(data.map(d => d.sku).filter(Boolean))).sort(), [data]);
  const uniqueStores = useMemo(() => Array.from(new Set(data.map(d => d.namaStore).filter(Boolean))).sort(), [data]);
  const uniqueRegions = useMemo(() => Array.from(new Set(data.map(d => d.region).filter(Boolean))).sort(), [data]);
  const uniqueCategories = useMemo(() => Array.from(new Set(data.map(d => d.kategori).filter(Boolean))).sort(), [data]);

  // Calculate total active filters count
  const activeFilters = useMemo(() => {
    const list: { key: keyof FilterState; label: string; value: string; onClear: () => void }[] = [];
    
    if (filters.search) {
      list.push({ key: 'search', label: 'Cari', value: `"${filters.search}"`, onClear: () => onFilterChange({ ...filters, search: '' }) });
    }
    // 1. TANGGAL
    if (filters.tanggal) {
      list.push({ key: 'tanggal', label: '1. Tgl', value: filters.tanggal, onClear: () => onFilterChange({ ...filters, tanggal: '' }) });
    }
    if (filters.startDate || filters.endDate) {
      list.push({ 
        key: 'startDate', 
        label: '1. Rentang', 
        value: `${filters.startDate || '...'} s/d ${filters.endDate || '...'}`, 
        onClear: () => onFilterChange({ ...filters, startDate: '', endDate: '' }) 
      });
    }
    // 2. BULAN
    if (filters.bulan) {
      list.push({ key: 'bulan', label: '2. Bulan', value: filters.bulan, onClear: () => onFilterChange({ ...filters, bulan: '' }) });
    }
    // 3. TAHUN
    if (filters.tahun) {
      list.push({ key: 'tahun', label: '3. Tahun', value: String(filters.tahun), onClear: () => onFilterChange({ ...filters, tahun: '' }) });
    }
    // 4. BA
    if (filters.ba) {
      list.push({ key: 'ba', label: '4. BA', value: filters.ba, onClear: () => onFilterChange({ ...filters, ba: '' }) });
    }
    // 5. BA Number
    if (filters.baNumber) {
      list.push({ key: 'baNumber', label: '5. BA No', value: filters.baNumber, onClear: () => onFilterChange({ ...filters, baNumber: '' }) });
    }
    // 6. COVER AREA
    if (filters.coverArea) {
      list.push({ key: 'coverArea', label: '6. Cover Area', value: filters.coverArea, onClear: () => onFilterChange({ ...filters, coverArea: '' }) });
    }
    // 7. SALES
    if (filters.sales) {
      list.push({ key: 'sales', label: '7. Sales', value: filters.sales, onClear: () => onFilterChange({ ...filters, sales: '' }) });
    }
    // 8. SPV
    if (filters.spv) {
      list.push({ key: 'spv', label: '8. SPV', value: filters.spv, onClear: () => onFilterChange({ ...filters, spv: '' }) });
    }
    // 9. BRAND
    if (filters.brand) {
      list.push({ key: 'brand', label: '9. Brand', value: filters.brand, onClear: () => onFilterChange({ ...filters, brand: '' }) });
    }
    // 10. NO SKU
    if (filters.noSku) {
      list.push({ key: 'noSku', label: '10. No SKU', value: filters.noSku, onClear: () => onFilterChange({ ...filters, noSku: '' }) });
    }
    // 11. SPU
    if (filters.spu) {
      list.push({ key: 'spu', label: '11. SPU', value: filters.spu, onClear: () => onFilterChange({ ...filters, spu: '' }) });
    }
    // 12. SKU
    if (filters.sku) {
      list.push({ key: 'sku', label: '12. SKU', value: filters.sku, onClear: () => onFilterChange({ ...filters, sku: '' }) });
    }
    // 13. PRODUK FOKUS
    if (filters.produkFokus) {
      list.push({ key: 'produkFokus', label: '13. Fokus', value: filters.produkFokus, onClear: () => onFilterChange({ ...filters, produkFokus: '' }) });
    }
    // 14. PRODUK NEW
    if (filters.produkNew) {
      list.push({ key: 'produkNew', label: '14. New', value: filters.produkNew, onClear: () => onFilterChange({ ...filters, produkNew: '' }) });
    }
    // 15. NAMA STORE
    if (filters.namaStore) {
      list.push({ key: 'namaStore', label: '15. Store', value: filters.namaStore, onClear: () => onFilterChange({ ...filters, namaStore: '' }) });
    }
    // 16. REGION
    if (filters.region) {
      list.push({ key: 'region', label: '16. Region', value: filters.region, onClear: () => onFilterChange({ ...filters, region: '' }) });
    }
    // 17. KATEGORI
    if (filters.kategori) {
      list.push({ key: 'kategori', label: '17. Kategori', value: filters.kategori, onClear: () => onFilterChange({ ...filters, kategori: '' }) });
    }
    // 18. QTY
    if (filters.minQty || filters.maxQty) {
      list.push({ 
        key: 'minQty', 
        label: '18. Qty', 
        value: `${filters.minQty || '0'} - ${filters.maxQty || '∞'} pcs`, 
        onClear: () => onFilterChange({ ...filters, minQty: '', maxQty: '' }) 
      });
    }
    // 19. VALUE
    if (filters.minValue || filters.maxValue) {
      list.push({ 
        key: 'minValue', 
        label: '19. Value', 
        value: `Rp ${Number(filters.minValue || 0).toLocaleString()} - ${filters.maxValue ? 'Rp ' + Number(filters.maxValue).toLocaleString() : '∞'}`, 
        onClear: () => onFilterChange({ ...filters, minValue: '', maxValue: '' }) 
      });
    }
    // 20. KET
    if (filters.ket) {
      list.push({ key: 'ket', label: '20. KET', value: filters.ket, onClear: () => onFilterChange({ ...filters, ket: '' }) });
    }

    return list;
  }, [filters, onFilterChange]);

  const hasActiveFilters = activeFilters.length > 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3.5">
      
      {/* 1. TOP BAR: Search + Sell In/Out Toggles + Expand Button + Reset */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            placeholder="Cari cepat: nama SKU, No SKU, nama toko, sales, BA, cover area..."
            className="w-full pl-9 pr-8 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50/50 hover:bg-white"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ ...filters, search: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Toggles: 20. KET + 13. Fokus + 14. New */}
        <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto pb-1 sm:pb-0">
          
          {/* 20. KET (SELL IN / SELL OUT) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs" title="20. Filter KET (Sell In / Sell Out)">
            <button
              onClick={() => onFilterChange({ ...filters, ket: '' })}
              className={`px-2.5 py-1 font-semibold rounded-md transition-colors ${
                !filters.ket ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua KET
            </button>
            <button
              onClick={() => onFilterChange({ ...filters, ket: 'SELL IN' })}
              className={`px-2.5 py-1 font-semibold rounded-md transition-colors ${
                filters.ket === 'SELL IN' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sell In
            </button>
            <button
              onClick={() => onFilterChange({ ...filters, ket: 'SELL OUT' })}
              className={`px-2.5 py-1 font-semibold rounded-md transition-colors ${
                filters.ket === 'SELL OUT' ? 'bg-white text-blue-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sell Out
            </button>
          </div>

          {/* 13. Produk Fokus */}
          <button
            onClick={() => onFilterChange({ ...filters, produkFokus: filters.produkFokus ? '' : 'Fokus' })}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1 whitespace-nowrap ${
              filters.produkFokus 
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold' 
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="13. Filter Produk Fokus"
          >
            {filters.produkFokus && <Check className="w-3.5 h-3.5" />}
            <span>Fokus</span>
          </button>

          {/* 14. Produk New */}
          <button
            onClick={() => onFilterChange({ ...filters, produkNew: filters.produkNew ? '' : 'New' })}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1 whitespace-nowrap ${
              filters.produkNew 
                ? 'bg-rose-50 border-rose-300 text-rose-700 font-bold' 
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="14. Filter Produk New"
          >
            {filters.produkNew && <Check className="w-3.5 h-3.5" />}
            <span>New</span>
          </button>

          {/* Toggle Full 20 Filter Panel */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 whitespace-nowrap ${
              isExpanded 
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter 20 Kolom</span>
            {activeFilters.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                isExpanded ? 'bg-white text-indigo-700' : 'bg-indigo-600 text-white'
              }`}>
                {activeFilters.length}
              </span>
            )}
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

        </div>

      </div>

      {/* 2. ACTIVE FILTERS CHIPS (Easily clear each filter) */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-indigo-600" />
            Aktif ({activeFilters.length}):
          </span>
          {activeFilters.map((af, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-800 border border-indigo-200"
            >
              <span className="text-indigo-600 font-bold">{af.label}:</span>
              <span className="max-w-[120px] truncate" title={af.value}>{af.value}</span>
              <button
                onClick={af.onClear}
                className="text-indigo-400 hover:text-indigo-700 p-0.5 rounded-full hover:bg-indigo-100"
                title={`Hapus filter ${af.label}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <button
            onClick={onResetFilters}
            className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 ml-1.5 flex items-center gap-0.5 hover:underline"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Semua
          </button>
        </div>
      )}

      {/* 3. EXPANDED FULL 20 COLUMNS FILTER CONTAINER */}
      {isExpanded && (
        <div className="border border-indigo-100 rounded-xl bg-slate-50/70 p-3.5 space-y-4 pt-3">
          
          {/* Header Bar with Sub-Category Switcher */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                Panel Filter 20 Kolom Lengkap
              </span>
              <span className="text-[11px] text-slate-500">
                (TANGGAL · BULAN · TAHUN · BA · BA No · COVER AREA · SALES · SPV · BRAND · NO SKU · SPU · SKU · FOKUS · NEW · STORE · REGION · KATEGORI · QTY · VALUE · KET)
              </span>
            </div>

            {/* Filter Group Tabs */}
            <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-xs self-stretch sm:self-auto overflow-x-auto">
              <button
                onClick={() => setActiveTabGroup('all')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  activeTabGroup === 'all' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua (20)
              </button>
              <button
                onClick={() => setActiveTabGroup('time')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  activeTabGroup === 'time' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Periode (1-3)
              </button>
              <button
                onClick={() => setActiveTabGroup('sales_area')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  activeTabGroup === 'sales_area' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tim &amp; Wilayah (4-8, 15-16)
              </button>
              <button
                onClick={() => setActiveTabGroup('product')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  activeTabGroup === 'product' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Produk (9-14, 17, 20)
              </button>
              <button
                onClick={() => setActiveTabGroup('numbers')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  activeTabGroup === 'numbers' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Volume &amp; Omset (18-19)
              </button>
            </div>
          </div>

          {/* SUB-SECTION A: PERIODE & WAKTU (1. TANGGAL, 2. BULAN, 3. TAHUN) */}
          {(activeTabGroup === 'all' || activeTabGroup === 'time') && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>1. WAKTU &amp; PERIODE TRANSAKSI (TANGGAL · BULAN · TAHUN)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                
                {/* 1a. TANGGAL SPESIFIK */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    1. TANGGAL (Spesifik)
                  </label>
                  <select
                    value={filters.tanggal}
                    onChange={(e) => onFilterChange({ ...filters, tanggal: e.target.value })}
                    className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium"
                  >
                    <option value="">Semua Tanggal</option>
                    {uniqueDates.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* 1b. RENTANG TANGGAL (Dari - Sampai) */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    1. RENTANG TGL (Dari - Sampai)
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => onFilterChange({ ...filters, startDate: e.target.value })}
                      className="w-1/2 text-xs py-1 px-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                    />
                    <span className="text-slate-400 text-xs">-</span>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => onFilterChange({ ...filters, endDate: e.target.value })}
                      className="w-1/2 text-xs py-1 px-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                    />
                  </div>
                </div>

                {/* 2. BULAN */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    2. BULAN (Month)
                  </label>
                  <select
                    value={filters.bulan}
                    onChange={(e) => onFilterChange({ ...filters, bulan: e.target.value })}
                    className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium"
                  >
                    <option value="">Semua Bulan</option>
                    {uniqueMonths.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* 3. TAHUN */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    3. TAHUN (Year)
                  </label>
                  <select
                    value={filters.tahun}
                    onChange={(e) => onFilterChange({ ...filters, tahun: e.target.value })}
                    className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium"
                  >
                    <option value="">Semua Tahun</option>
                    {uniqueYears.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

              </div>
            </div>
          )}

          {/* SUB-SECTION B: TIM SALES & WILAYAH (4. BA, 5. BA Number, 6. COVER AREA, 7. SALES, 8. SPV, 15. NAMA STORE, 16. REGION) */}
          {(activeTabGroup === 'all' || activeTabGroup === 'sales_area') && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>2. TIM SALES, BEAUTY ADVISOR &amp; WILAYAH DISTRIBUSI (BA · SALES · SPV · AREA · STORE · REGION)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                
                {/* 4. BA */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    4. BA (Advisor)
                  </label>
                  <select
                    value={filters.ba}
                    onChange={(e) => onFilterChange({ ...filters, ba: e.target.value })}
                    className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium truncate"
                  >
                    <option value="">Semua BA</option>
                    {uniqueBas.map(ba => (
                      <option key={ba} value={ba}>{ba}</option>
                    ))}
                  </select>
                </div>

                {/* 5. BA NUMBER */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    5. BA Number (No BA)
                  </label>
                  <select
                    value={filters.baNumber}
                    onChange={(e) => onFilterChange({ ...filters, baNumber: e.target.value })}
                    className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium truncate"
                  >
                    <option value="">Semua No BA</option>
                    {uniqueBaNumbers.map(no => (
                      <option key={no} value={no}>{no}</option>
                    ))}
                  </select>
                </div>

                {/* 6. COVER AREA */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    6. COVER AREA
                  </label>
                  <select
                    value={filters.coverArea}
                    onChange={(e) => onFilterChange({ ...filters, coverArea: e.target.value })}
                    className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium truncate"
                  >
                    <option value="">Semua Cover Area</option>
                    {uniqueCoverAreas.map(ca => (
                      <option key={ca} value={ca}>{ca}</option>
                    ))}
                  </select>
                </div>

                {/* 7. SALES */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    7. SALES (Salesman)
                  </label>
                  <select
                    value={filters.sales}
                    onChange={(e) => onFilterChange({ ...filters, sales: e.target.value })}
                    className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium truncate"
                  >
                    <option value="">Semua Sales</option>
                    {uniqueSales.map(sales => (
                      <option key={sales} value={sales}>{sales}</option>
                    ))}
                  </select>
                </div>

                {/* 8. SPV */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    8. SPV (Supervisor)
                  </label>
                  <select
                    value={filters.spv}
                    onChange={(e) => onFilterChange({ ...filters, spv: e.target.value })}
                    className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium truncate"
                  >
                    <option value="">Semua SPV</option>
                    {uniqueSpvs.map(spv => (
                      <option key={spv} value={spv}>{spv}</option>
                    ))}
                  </select>
                </div>

                {/* 15. NAMA STORE */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    15. NAMA STORE (Outlet)
                  </label>
                  <select
                    value={filters.namaStore}
                    onChange={(e) => onFilterChange({ ...filters, namaStore: e.target.value })}
                    className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium truncate"
                  >
                    <option value="">Semua Toko</option>
                    {uniqueStores.map(store => (
                      <option key={store} value={store}>{store}</option>
                    ))}
                  </select>
                </div>

                {/* 16. REGION */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    16. REGION (Kota)
                  </label>
                  <select
                    value={filters.region}
                    onChange={(e) => onFilterChange({ ...filters, region: e.target.value })}
                    className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium truncate"
                  >
                    <option value="">Semua Region</option>
                    {uniqueRegions.map(reg => (
                      <option key={reg} value={reg}>{reg}</option>
                    ))}
                  </select>
                </div>

              </div>
            </div>
          )}

          {/* SUB-SECTION C: PRODUK & KATALOG (9. BRAND, 10. NO SKU, 11. SPU, 12. SKU, 13. PRODUK FOKUS, 14. PRODUK NEW, 17. KATEGORI, 20. KET) */}
          {(activeTabGroup === 'all' || activeTabGroup === 'product') && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <PackageCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>3. PRODUK, MEREK &amp; KATALOG (BRAND · NO SKU · SPU · SKU · FOKUS · NEW · KATEGORI · KET)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-2.5 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                
                {/* 9. BRAND */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    9. BRAND (Merek)
                  </label>
                  <select
                    value={filters.brand}
                    onChange={(e) => onFilterChange({ ...filters, brand: e.target.value })}
                    className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium truncate"
                  >
                    <option value="">Semua Brand</option>
                    {uniqueBrands.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                {/* 10. NO SKU */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    10. NO SKU (Kode)
                  </label>
                  <select
                    value={filters.noSku}
                    onChange={(e) => onFilterChange({ ...filters, noSku: e.target.value })}
                    className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium truncate font-mono"
                  >
                    <option value="">Semua No SKU</option>
                    {uniqueNoSkus.map(no => (
                      <option key={no} value={no}>{no}</option>
                    ))}
                  </select>
                </div>

                {/* 11. SPU */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    11. SPU (Series/Group)
                  </label>
                  <select
                    value={filters.spu}
                    onChange={(e) => onFilterChange({ ...filters, spu: e.target.value })}
                    className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium truncate"
                  >
                    <option value="">Semua SPU</option>
                    {uniqueSpus.map(spu => (
                      <option key={spu} value={spu}>{spu}</option>
                    ))}
                  </select>
                </div>

                {/* 12. SKU */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    12. SKU (Nama Produk)
                  </label>
                  <select
                    value={filters.sku}
                    onChange={(e) => onFilterChange({ ...filters, sku: e.target.value })}
                    className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium truncate"
                  >
                    <option value="">Semua SKU</option>
                    {uniqueSkus.map(sku => (
                      <option key={sku} value={sku}>{sku}</option>
                    ))}
                  </select>
                </div>

                {/* 13. PRODUK FOKUS */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    13. PRODUK FOKUS
                  </label>
                  <select
                    value={filters.produkFokus}
                    onChange={(e) => onFilterChange({ ...filters, produkFokus: e.target.value })}
                    className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium"
                  >
                    <option value="">Semua Status Fokus</option>
                    <option value="Fokus">⭐ Produk Fokus (Ya)</option>
                    <option value="-">Bukan Produk Fokus (-)</option>
                  </select>
                </div>

                {/* 14. PRODUK NEW */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    14. PRODUK NEW
                  </label>
                  <select
                    value={filters.produkNew}
                    onChange={(e) => onFilterChange({ ...filters, produkNew: e.target.value })}
                    className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium"
                  >
                    <option value="">Semua Status New</option>
                    <option value="New">✨ Produk Baru (New)</option>
                    <option value="-">Produk Reguler (-)</option>
                  </select>
                </div>

                {/* 17. KATEGORI */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    17. KATEGORI
                  </label>
                  <select
                    value={filters.kategori}
                    onChange={(e) => onFilterChange({ ...filters, kategori: e.target.value })}
                    className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium truncate"
                  >
                    <option value="">Semua Kategori</option>
                    {uniqueCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* 20. KET */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    20. KET (Tipe)
                  </label>
                  <select
                    value={filters.ket}
                    onChange={(e) => onFilterChange({ ...filters, ket: e.target.value })}
                    className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium"
                  >
                    <option value="">Semua (Sell In &amp; Out)</option>
                    <option value="SELL IN">SELL IN</option>
                    <option value="SELL OUT">SELL OUT</option>
                  </select>
                </div>

              </div>
            </div>
          )}

          {/* SUB-SECTION D: NILAI & KUANTITI (18. QTY, 19. VALUE) */}
          {(activeTabGroup === 'all' || activeTabGroup === 'numbers') && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                <span>4. KUANTITI &amp; NOMINAL OMSET (18. QTY · 19. VALUE)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                
                {/* 18a. MIN QTY */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    18. QTY Minimum (Pcs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={filters.minQty}
                    onChange={(e) => onFilterChange({ ...filters, minQty: e.target.value })}
                    placeholder="Contoh: 10"
                    className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-mono"
                  />
                </div>

                {/* 18b. MAX QTY */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    18. QTY Maksimum (Pcs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={filters.maxQty}
                    onChange={(e) => onFilterChange({ ...filters, maxQty: e.target.value })}
                    placeholder="Contoh: 100"
                    className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-mono"
                  />
                </div>

                {/* 19a. MIN VALUE */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    19. VALUE Minimal (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={filters.minValue}
                    onChange={(e) => onFilterChange({ ...filters, minValue: e.target.value })}
                    placeholder="Contoh: 500000"
                    className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-mono"
                  />
                </div>

                {/* 19b. MAX VALUE */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    19. VALUE Maksimal (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={filters.maxValue}
                    onChange={(e) => onFilterChange({ ...filters, maxValue: e.target.value })}
                    placeholder="Contoh: 10000000"
                    className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-mono"
                  />
                </div>

              </div>
            </div>
          )}

        </div>
      )}

      {/* 4. FOOTER STATUS BAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs pt-1 border-t border-slate-100 gap-2">
        <div className="text-slate-500 flex flex-wrap items-center gap-1.5">
          <span>Hasil Filter:</span>
          <span className="font-bold text-slate-800 font-mono tabular-nums bg-slate-100 px-2 py-0.5 rounded">
            {filteredCount}
          </span>
          <span>dari total</span>
          <span className="font-mono tabular-nums font-semibold text-slate-700">
            {totalCount}
          </span>
          <span>transaksi</span>
          {filteredCount < totalCount && (
            <span className="text-emerald-700 font-medium text-[11px] bg-emerald-50 px-1.5 py-0.5 rounded-sm border border-emerald-200">
              ({((filteredCount / totalCount) * 100).toFixed(1)}% cocok)
            </span>
          )}

          {/* Trigger Slide Menu Button */}
          {onOpenTransactionMenu && (
            <button
              onClick={onOpenTransactionMenu}
              className="ml-1 sm:ml-3 inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-colors shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
              <span>Buka Slide Menu Transaksi ({filteredCount})</span>
              <ArrowRight className="w-3 h-3 text-indigo-600" />
            </button>
          )}
        </div>

        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 transition-colors hover:underline self-end sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Seluruh Filter ({activeFilters.length})</span>
          </button>
        )}
      </div>

    </div>
  );
};
