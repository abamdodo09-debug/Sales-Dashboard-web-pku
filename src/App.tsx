/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { KpiMetricsGrid } from './components/KpiMetricsGrid';
import { BrandCards } from './components/BrandCards';
import { ChartsSection } from './components/ChartsSection';
import { AchievementChartsSection } from './components/AchievementChartsSection';
import { PeriodComparisonSection } from './components/PeriodComparisonSection';
import { SlowMovingSection } from './components/SlowMovingSection';
import { TopSkuPerBrandSection } from './components/TopSkuPerBrandSection';
import { FilterToolbar } from './components/FilterToolbar';
import { TransactionSlideMenu } from './components/TransactionSlideMenu';
import { AppsScriptModal } from './components/AppsScriptModal';
import { ConnectSheetModal } from './components/ConnectSheetModal';
import { AddTransactionModal } from './components/AddTransactionModal';

import { SalesRecord, FilterState, DataSourceConfig, INITIAL_FILTER_STATE } from './types/sales';
import { INITIAL_SALES_DATA } from './data/initialData';
import { 
  getStoredScriptUrl, 
  getCachedSheetData, 
  getLastSyncTime, 
  fetchGoogleSheetData 
} from './services/googleSheetService';
import { CheckCircle2, AlertCircle, Sparkles, FileSpreadsheet, ArrowRight } from 'lucide-react';
import { exportAllDashboardToExcel, exportTransactionsToExcel } from './utils/excelExporter';

export default function App() {
  // 1. Data Source State
  const [config, setConfig] = useState<DataSourceConfig>(() => {
    const savedUrl = getStoredScriptUrl();
    const lastSync = getLastSyncTime();
    return {
      type: savedUrl ? 'google-apps-script' : 'sample',
      scriptUrl: savedUrl,
      lastSyncTime: lastSync || undefined,
      autoRefresh: false,
      refreshIntervalMinutes: 5
    };
  });

  // 2. Sales Records Data
  const [data, setData] = useState<SalesRecord[]>(() => {
    const cached = getCachedSheetData();
    if (cached && cached.length > 0) {
      return cached;
    }
    return INITIAL_SALES_DATA;
  });

  // 3. UI and Modal State
  const [isAppsScriptModalOpen, setIsAppsScriptModalOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTransactionMenuOpen, setIsTransactionMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 4. Filters State (20 Kolom Lengkap)
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTER_STATE);

  const [activeTab, setActiveTab] = useState<'all' | 'achievement' | 'top_sku' | 'comparison' | 'slow_moving' | 'charts'>('all');

  const showToast = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  // Sync data from Google Apps Script
  const handleRefresh = useCallback(async () => {
    if (config.type !== 'google-apps-script' || !config.scriptUrl) {
      // Just simulate refreshing sample data
      setIsRefreshing(true);
      setTimeout(() => {
        setIsRefreshing(false);
        showToast('Data demo berhasil diperbarui ulang.');
      }, 500);
      return;
    }

    setIsRefreshing(true);
    try {
      const res = await fetchGoogleSheetData(config.scriptUrl);
      setData(res.data);
      setConfig(prev => ({
        ...prev,
        lastSyncTime: new Date().toISOString()
      }));
      showToast(`Berhasil menyinkronkan ${res.total} baris data dari Google Sheet!`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal sinkronisasi data Google Sheet.';
      showToast(msg, 'error');
    } finally {
      setIsRefreshing(false);
    }
  }, [config.type, config.scriptUrl, showToast]);

  // Handle saving new config from Connect modal
  const handleSaveConfig = (newConfig: DataSourceConfig, fetchedData?: SalesRecord[]) => {
    setConfig(newConfig);
    if (fetchedData && fetchedData.length > 0) {
      setData(fetchedData);
      showToast(`Koneksi aktif! ${fetchedData.length} baris data berhasil dimuat.`);
    }
  };

  // Reset to sample initial data
  const handleResetToSample = () => {
    setData(INITIAL_SALES_DATA);
    setConfig({
      type: 'sample',
      scriptUrl: '',
      lastSyncTime: undefined,
      autoRefresh: false,
      refreshIntervalMinutes: 5
    });
    localStorage.removeItem('beauty_sales_gas_url');
    localStorage.removeItem('beauty_sales_gas_cache');
    localStorage.removeItem('beauty_sales_last_sync');
    showToast('Beralih ke data demo kosmetik Riau.');
  };

  // Add new transaction
  const handleAddTransaction = (newRecord: SalesRecord) => {
    setData(prev => [newRecord, ...prev]);
    showToast(`Transaksi baru "${newRecord.sku}" berhasil ditambahkan!`);
  };

  // Filtered dataset computation across all 20 columns
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Global Search
      if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        const matchSku = item.sku.toLowerCase().includes(q);
        const matchNoSku = item.noSku.toLowerCase().includes(q);
        const matchStore = item.namaStore.toLowerCase().includes(q);
        const matchSales = item.sales.toLowerCase().includes(q);
        const matchBrand = item.brand.toLowerCase().includes(q);
        const matchSpu = item.spu.toLowerCase().includes(q);
        const matchBa = item.ba.toLowerCase().includes(q);
        const matchArea = item.coverArea.toLowerCase().includes(q);
        if (!matchSku && !matchNoSku && !matchStore && !matchSales && !matchBrand && !matchSpu && !matchBa && !matchArea) {
          return false;
        }
      }

      // 1. TANGGAL
      if (filters.tanggal && item.tanggal !== filters.tanggal) {
        return false;
      }
      if (filters.startDate && item.tanggal < filters.startDate) {
        return false;
      }
      if (filters.endDate && item.tanggal > filters.endDate) {
        return false;
      }

      // 2. BULAN
      if (filters.bulan && item.bulan !== filters.bulan) {
        return false;
      }

      // 3. TAHUN
      if (filters.tahun && String(item.tahun) !== String(filters.tahun)) {
        return false;
      }

      // 4. BA
      if (filters.ba && item.ba !== filters.ba) {
        return false;
      }

      // 5. BA Number
      if (filters.baNumber && item.baNumber.toLowerCase() !== filters.baNumber.toLowerCase()) {
        return false;
      }

      // 6. COVER AREA
      if (filters.coverArea && item.coverArea.toLowerCase() !== filters.coverArea.toLowerCase()) {
        return false;
      }

      // 7. SALES
      if (filters.sales && item.sales.toLowerCase() !== filters.sales.toLowerCase()) {
        return false;
      }

      // 8. SPV
      if (filters.spv && item.spv.toLowerCase() !== filters.spv.toLowerCase()) {
        return false;
      }

      // 9. BRAND
      if (filters.brand && item.brand.toLowerCase() !== filters.brand.toLowerCase()) {
        return false;
      }

      // 10. NO SKU
      if (filters.noSku && item.noSku !== filters.noSku) {
        return false;
      }

      // 11. SPU
      if (filters.spu && item.spu !== filters.spu) {
        return false;
      }

      // 12. SKU
      if (filters.sku && item.sku !== filters.sku) {
        return false;
      }

      // 13. PRODUK FOKUS
      if (filters.produkFokus) {
        if (filters.produkFokus === 'Ya' || filters.produkFokus === 'Fokus') {
          if (!item.produkFokus || item.produkFokus === '-') return false;
        } else if (filters.produkFokus === '-') {
          if (item.produkFokus && item.produkFokus !== '-') return false;
        } else if (item.produkFokus !== filters.produkFokus) {
          return false;
        }
      }

      // 14. PRODUK NEW
      if (filters.produkNew) {
        if (filters.produkNew === 'Ya' || filters.produkNew === 'New') {
          if (!item.produkNew || item.produkNew === '-') return false;
        } else if (filters.produkNew === '-') {
          if (item.produkNew && item.produkNew !== '-') return false;
        } else if (item.produkNew !== filters.produkNew) {
          return false;
        }
      }

      // 15. NAMA STORE
      if (filters.namaStore && item.namaStore !== filters.namaStore) {
        return false;
      }

      // 16. REGION
      if (filters.region && item.region.toLowerCase() !== filters.region.toLowerCase()) {
        return false;
      }

      // 17. KATEGORI
      if (filters.kategori && item.kategori.toLowerCase() !== filters.kategori.toLowerCase()) {
        return false;
      }

      // 18. QTY (min / max)
      if (filters.minQty !== '') {
        const minQ = Number(filters.minQty);
        if (!isNaN(minQ) && item.qty < minQ) return false;
      }
      if (filters.maxQty !== '') {
        const maxQ = Number(filters.maxQty);
        if (!isNaN(maxQ) && item.qty > maxQ) return false;
      }

      // 19. VALUE (min / max)
      if (filters.minValue !== '') {
        const minV = Number(filters.minValue);
        if (!isNaN(minV) && item.value < minV) return false;
      }
      if (filters.maxValue !== '') {
        const maxV = Number(filters.maxValue);
        if (!isNaN(maxV) && item.value > maxV) return false;
      }

      // 20. KET
      if (filters.ket && item.ket !== filters.ket) {
        return false;
      }

      return true;
    });
  }, [data, filters]);

  // CSV Export
  const handleExportCsv = () => {
    const headers = [
      'TANGGAL', 'BULAN', 'TAHUN', 'BA', 'BA Number', 'COVER AREA', 
      'SALES', 'SPV', 'BRAND', 'NO SKU', 'SPU', 'SKU', 
      'PRODUK FOKUS', 'PRODUK NEW', 'NAMA STORE', 'REGION', 'KATEGORI', 'QTY', 'VALUE', 'KET'
    ];

    const rows = filteredData.map(r => [
      `"${r.tanggal}"`,
      `"${r.bulan}"`,
      r.tahun,
      `"${r.ba}"`,
      `"${r.baNumber}"`,
      `"${r.coverArea}"`,
      `"${r.sales}"`,
      `"${r.spv}"`,
      `"${r.brand}"`,
      `"${r.noSku}"`,
      `"${r.spu}"`,
      `"${r.sku.replace(/"/g, '""')}"`,
      `"${r.produkFokus}"`,
      `"${r.produkNew}"`,
      `"${r.namaStore.replace(/"/g, '""')}"`,
      `"${r.region}"`,
      `"${r.kategori}"`,
      r.qty,
      r.value,
      `"${r.ket}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Penjualan_Kosmetik_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Laporan CSV berhasil diunduh.');
  };

  const handleExportExcel = () => {
    try {
      exportTransactionsToExcel(filteredData);
      showToast('Data transaksi Excel (.xlsx) berhasil diunduh.');
    } catch (e) {
      console.error(e);
      showToast('Gagal mengunduh file Excel.', 'error');
    }
  };

  const handleExportAllExcel = () => {
    try {
      exportAllDashboardToExcel(data, filteredData, {
        ketFilter: filters.ket || undefined,
        brandFilter: filters.brand || undefined
      });
      showToast('Seluruh workbook Dashboard Excel (.xlsx) berhasil diunduh.');
    } catch (e) {
      console.error(e);
      showToast('Gagal mengunduh Excel workbook.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* 1. Header Navigation */}
      <Navbar
        config={config}
        onOpenConnectModal={() => setIsConnectModalOpen(true)}
        onOpenAppsScriptModal={() => setIsAppsScriptModalOpen(true)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onExportCsv={handleExportCsv}
        onExportExcel={handleExportExcel}
        onExportAllExcel={handleExportAllExcel}
        totalRecords={data.length}
        filteredRecords={filteredData.length}
        onOpenTransactionMenu={() => setIsTransactionMenuOpen(true)}
      />

      {/* 2. Main Content Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Banner if using demo data to invite connecting real Google Sheets */}
        {config.type === 'sample' && (
          <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-900 text-white rounded-xl p-4 sm:p-5 shadow-sm border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                  Integrasi Google Apps Script Tersedia
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Hubungkan Spreadsheet Google Sheet Anda Langsung ke Dashboard Ini
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl">
                Gunakan Google Apps Script Web App untuk membaca data spreadsheet secara otomatis tanpa ribet. Anda juga bisa melihat panduan langkah demi langkah dan salin script siap pakai.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsAppsScriptModalOpen(true)}
                className="px-3.5 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-all"
              >
                Lihat Panduan &amp; Script
              </button>
              <button
                onClick={() => setIsConnectModalOpen(true)}
                className="px-3.5 py-2 text-xs font-semibold bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg shadow-sm transition-all"
              >
                Sambungkan Sekarang
              </button>
            </div>
          </div>
        )}

        {/* 2. FILTER LETAK PALING ATAS (20 Kolom Lengkap) */}
        <FilterToolbar
          filters={filters}
          onFilterChange={setFilters}
          onResetFilters={() => setFilters(INITIAL_FILTER_STATE)}
          data={data}
          filteredCount={filteredData.length}
          totalCount={data.length}
          onOpenTransactionMenu={() => setIsTransactionMenuOpen(true)}
        />

        {/* 3. Executive KPI Metric Cards */}
        <KpiMetricsGrid 
          data={filteredData} 
          allData={data} 
        />

        {/* 4. Brand Performance Cards */}
        <BrandCards
          data={filteredData}
          selectedBrand={filters.brand}
          onSelectBrand={(brand) => setFilters(prev => ({ ...prev, brand }))}
        />

        {/* 5. View Mode Switcher */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-slate-200 pb-2 gap-2">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Modul
            </button>
            <button
              onClick={() => setActiveTab('achievement')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'achievement'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Growth &amp; Pencapaian (All &amp; Per Brand)</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            </button>
            <button
              onClick={() => setActiveTab('top_sku')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'top_sku'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Top 10 SKU per Brand</span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'comparison'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Komparasi (WoW · MoM · YoY)</span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
            </button>
            <button
              onClick={() => setActiveTab('slow_moving')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'slow_moving'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>SKU Lambat Gerak</span>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            </button>
            <button
              onClick={() => setActiveTab('charts')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'charts'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tren &amp; Outlet
            </button>
          </div>

          {/* Quick Trigger Slide Menu Transaksi in Tab Header */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTransactionMenuOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-lg shadow-2xs transition-colors"
              title="Buka Slide Menu Tabel Transaksi Penjualan"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
              <span>Slide Menu Transaksi</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-indigo-600 text-white">
                {filteredData.length}
              </span>
              <ArrowRight className="w-3 h-3 text-indigo-600" />
            </button>
          </div>
        </div>

        {/* 6. Achievement Charts Section (Daily, Monthly, Yearly) */}
        {(activeTab === 'all' || activeTab === 'achievement') && (
          <AchievementChartsSection data={data} />
        )}

        {/* 7. Top 10 SKU per Brand Section */}
        {(activeTab === 'all' || activeTab === 'top_sku') && (
          <TopSkuPerBrandSection data={data} />
        )}

        {/* 7. Period Comparison Section (WoW, MoM, YoY) */}
        {(activeTab === 'all' || activeTab === 'comparison') && (
          <PeriodComparisonSection data={data} />
        )}

        {/* 8. Slow Moving SKUs Section */}
        {(activeTab === 'all' || activeTab === 'slow_moving') && (
          <SlowMovingSection data={data} />
        )}

        {/* 8. Visual Charts Section (Daily Trend, Brand Share, Outlets) */}
        {(activeTab === 'all' || activeTab === 'charts') && (
          <ChartsSection data={filteredData} />
        )}

      </main>

      {/* Floating Trigger Button for Transaction Slide Menu */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsTransactionMenuOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-xl hover:shadow-2xl border border-slate-700 font-semibold text-xs transition-all transform hover:-translate-y-0.5 active:translate-y-0 group cursor-pointer"
          title="Buka Slide Menu Tabel Transaksi Penjualan"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span>Tabel Transaksi</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-600 text-white">
            {filteredData.length}
          </span>
        </button>
      </div>

      {/* Transaction Slide Menu Drawer */}
      <TransactionSlideMenu
        isOpen={isTransactionMenuOpen}
        onClose={() => setIsTransactionMenuOpen(false)}
        data={filteredData}
        totalAllRecords={data.length}
      />

      </main>

      {/* 8. Quiet Clean Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            Beauty Sales Intelligence · Distribusi Resmi Pekanbaru &amp; Riau
          </div>
          <div className="flex items-center gap-4">
            <span>Y.O.U · barenbliss · lavojoy · DAZZLE ME</span>
            <span aria-hidden="true">·</span>
            <button 
              onClick={() => setIsAppsScriptModalOpen(true)} 
              className="text-indigo-600 hover:underline font-medium"
            >
              Panduan Google Apps Script
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AppsScriptModal
        isOpen={isAppsScriptModalOpen}
        onClose={() => setIsAppsScriptModalOpen(false)}
        onOpenConnectModal={() => setIsConnectModalOpen(true)}
      />

      <ConnectSheetModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
        onResetToSample={handleResetToSample}
        onOpenAppsScriptModal={() => {
          setIsConnectModalOpen(false);
          setIsAppsScriptModalOpen(true);
        }}
      />

      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddTransaction={handleAddTransaction}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-xl text-xs border border-slate-800 transition-all animate-bounce">
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

    </div>
  );
}
