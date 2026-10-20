import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Code2, 
  RefreshCw, 
  Download, 
  PlusCircle, 
  CheckCircle2, 
  ExternalLink,
  Layers
} from 'lucide-react';
import { DataSourceConfig } from '../types/sales';

interface NavbarProps {
  config: DataSourceConfig;
  onOpenConnectModal: () => void;
  onOpenAppsScriptModal: () => void;
  onOpenAddModal: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onExportCsv: () => void;
  onExportExcel: () => void;
  onExportAllExcel: () => void;
  totalRecords: number;
  filteredRecords: number;
  onOpenTransactionMenu: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  config,
  onOpenConnectModal,
  onOpenAppsScriptModal,
  onOpenAddModal,
  onRefresh,
  isRefreshing,
  onExportCsv,
  onExportExcel,
  onExportAllExcel,
  totalRecords,
  filteredRecords,
  onOpenTransactionMenu
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand & Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              <Layers className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
                  Beauty Sales Intelligence
                </span>
                <span className="hidden sm:inline-block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Distribusi Riau
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden md:block">
                Dashboard Penjualan Kosmetik (Y.O.U · barenbliss · lavojoy · DAZZLE ME)
              </p>
            </div>
          </div>

          {/* Source Status & Quick Info */}
          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <span className="font-medium">Sumber:</span>
            {config.type === 'google-apps-script' ? (
              <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Google Sheets Live ({totalRecords} Baris)
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-slate-700">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Dataset Internal ({totalRecords} Baris)
              </span>
            )}
            {config.lastSyncTime && (
              <>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500 text-[11px]">
                  Sync: {new Date(config.lastSyncTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            
            {/* Apps Script Code Modal */}
            <button
              onClick={onOpenAppsScriptModal}
              title="Lihat Kode Google Apps Script & Cara Pasang"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
            >
              <Code2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Script Google</span>
            </button>

            {/* Connect Google Sheet */}
            <button
              onClick={onOpenConnectModal}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                config.type === 'google-apps-script'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{config.type === 'google-apps-script' ? 'Sheet Terhubung' : 'Sambungkan Sheet'}</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Refresh / Muat Ulang Data"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
            </button>

            {/* Export Excel / CSV Menu */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                title="Unduh Data ke Excel (.xlsx) atau CSV"
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors whitespace-nowrap shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Download Excel</span>
                <span className="sm:hidden">Excel</span>
                <Download className="w-3 h-3 text-emerald-600 opacity-80" />
              </button>

              {showExportMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowExportMenu(false)}
                  />
                  <div className="absolute right-0 mt-1 w-64 bg-white rounded-xl shadow-lg border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-1">
                    <div className="px-2 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      Pilihan Unduh Format Excel
                    </div>
                    
                    <button
                      onClick={() => {
                        setShowExportMenu(false);
                        onExportAllExcel();
                      }}
                      className="w-full text-left px-2.5 py-2 text-xs rounded-lg hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 flex items-start gap-2.5 transition-colors group"
                    >
                      <div className="p-1 rounded bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200 shrink-0 mt-0.5">
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 group-hover:text-emerald-900">
                          Semua Data Dashboard (.xlsx)
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Multi-Sheet: Ringkasan, Transaksi, Top SKU, Slow Moving
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setShowExportMenu(false);
                        onExportExcel();
                      }}
                      className="w-full text-left px-2.5 py-2 text-xs rounded-lg hover:bg-slate-50 text-slate-700 hover:text-slate-900 flex items-start gap-2.5 transition-colors group"
                    >
                      <div className="p-1 rounded bg-slate-100 text-slate-600 group-hover:bg-slate-200 shrink-0 mt-0.5">
                        <Download className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">
                          Data Transaksi Aktif (.xlsx)
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Hanya baris transaksi yang sesuai filter aktif
                        </div>
                      </div>
                    </button>

                    <div className="pt-1 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setShowExportMenu(false);
                          onExportCsv();
                        }}
                        className="w-full text-left px-2.5 py-1.5 text-[11px] rounded-md hover:bg-slate-50 text-slate-500 hover:text-slate-800 flex items-center justify-between"
                      >
                        <span>Unduh Format CSV Alternatif</span>
                        <span className="font-mono text-[10px] text-slate-400">.CSV</span>
                      </button>
                    </div>

                  </div>
                </>
              )}
            </div>

            {/* Slide Menu Tabel Transaksi Button */}
            <button
              onClick={onOpenTransactionMenu}
              title="Buka Slide Menu Tabel Transaksi Penjualan"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors whitespace-nowrap shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Tabel Transaksi</span>
              <span className="sm:hidden">Transaksi</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-600 text-white font-mono">
                {filteredRecords}
              </span>
            </button>

            {/* Input Data Baru */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors whitespace-nowrap"
            >
              <PlusCircle className="w-3.5 h-3.5 text-rose-300" />
              <span className="hidden sm:inline">Tambah Transaksi</span>
              <span className="sm:hidden">+ Data</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
