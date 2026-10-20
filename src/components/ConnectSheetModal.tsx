import React, { useState } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ExternalLink,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { fetchGoogleSheetData } from '../services/googleSheetService';
import { DataSourceConfig, SalesRecord } from '../types/sales';

interface ConnectSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DataSourceConfig;
  onSaveConfig: (newConfig: DataSourceConfig, fetchedData?: SalesRecord[]) => void;
  onResetToSample: () => void;
  onOpenAppsScriptModal: () => void;
}

export const ConnectSheetModal: React.FC<ConnectSheetModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onResetToSample,
  onOpenAppsScriptModal
}) => {
  const [url, setUrl] = useState(config.scriptUrl || '');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    total?: number;
    sheetName?: string;
    sampleData?: SalesRecord[];
  } | null>(null);

  if (!isOpen) return null;

  const handleTestAndConnect = async () => {
    if (!url.trim()) {
      setTestResult({
        success: false,
        message: 'Silakan masukkan URL Web App Google Apps Script.'
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetchGoogleSheetData(url.trim());
      setTestResult({
        success: true,
        message: `Koneksi Berhasil! Ditemukan ${res.total} baris data dari spreadsheet "${res.sheetName || 'Aktif'}".`,
        total: res.total,
        sheetName: res.sheetName,
        sampleData: res.data
      });

      // Auto save if test succeeds
      onSaveConfig({
        ...config,
        type: 'google-apps-script',
        scriptUrl: url.trim(),
        lastSyncTime: new Date().toISOString()
      }, res.data);

    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Gagal menghubungi Google Apps Script.'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleResetToDemo = () => {
    onResetToSample();
    setTestResult({
      success: true,
      message: 'Berhasil beralih kembali ke data demo representatif kosmetik.'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-lg w-full flex flex-col border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Sambungkan Google Sheet
              </h2>
              <p className="text-xs text-slate-500">
                Sinkronisasi otomatis penjualan melalui Google Apps Script Web App
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              URL Web App Google Apps Script
            </label>
            <div className="space-y-1.5">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                className="w-full px-3.5 py-2.5 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="text-[11px] text-slate-500">
                URL diperoleh setelah melakukan "Deploy as Web App" di Google Apps Script (berakhiran <code>/exec</code>).
              </p>
            </div>
          </div>

          {/* Helper link */}
          <div className="flex items-center justify-between text-xs pt-1">
            <button
              type="button"
              onClick={onOpenAppsScriptModal}
              className="text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1 hover:underline"
            >
              <span>Belum punya script? Lihat panduan & kode script</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* Test Result Message */}
          {testResult && (
            <div
              className={`p-3.5 rounded-lg text-xs flex items-start gap-2.5 border ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-semibold">{testResult.message}</p>
                {!testResult.success && (
                  <p className="text-[11px] text-rose-700">
                    Tips: Pastikan saat deployment di Apps Script Anda memilih <b>Who has access: Anyone (Siapa saja)</b>.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Current Status Badge */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs text-slate-600">
              Status aktif:{' '}
              <span className="font-bold text-slate-900">
                {config.type === 'google-apps-script' ? 'Google Sheets Live' : 'Demo Dataset'}
              </span>
            </div>
            {config.type === 'google-apps-script' && (
              <button
                type="button"
                onClick={handleResetToDemo}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 hover:underline"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Gunakan Data Demo</span>
              </button>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleTestAndConnect}
            disabled={testing || !url.trim()}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-sm transition-all"
          >
            {testing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Menguji & Menyambungkan...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Uji & Sambungkan</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
