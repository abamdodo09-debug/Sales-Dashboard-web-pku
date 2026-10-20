import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Code2, 
  FileSpreadsheet, 
  HelpCircle, 
  AlertCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { APPS_SCRIPT_TEMPLATE } from '../services/googleSheetService';

interface AppsScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenConnectModal: () => void;
}

export const AppsScriptModal: React.FC<AppsScriptModalProps> = ({
  isOpen,
  onClose,
  onOpenConnectModal
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'script' | 'steps' | 'columns'>('script');

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_TEMPLATE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const columnsList = [
    { name: 'TANGGAL', sample: '1/30/2026 atau 2026-01-30', desc: 'Tanggal transaksi penjualan' },
    { name: 'BULAN', sample: '01. Jan', desc: 'Kode atau nama bulan' },
    { name: 'TAHUN', sample: '2026', desc: 'Tahun transaksi' },
    { name: 'BA', sample: 'Dina Lestari', desc: 'Nama Beauty Advisor / Sales counter' },
    { name: 'BA Number', sample: 'BA-012', desc: 'Kode identifikasi BA' },
    { name: 'COVER AREA', sample: 'AREA BARU', desc: 'Wilayah penugasan (Panam, Dumai, dll)' },
    { name: 'SALES', sample: 'ABDUL RAHIM', desc: 'Nama Sales Representative' },
    { name: 'SPV', sample: 'WIDODO', desc: 'Nama Supervisor' },
    { name: 'BRAND', sample: 'Y.O.U, barenbliss, lavojoy, DAZZLE ME', desc: 'Merek kosmetik' },
    { name: 'NO SKU', sample: '13655, 672440', desc: 'Kode nomor SKU item' },
    { name: 'SPU', sample: 'Y.O.U AcnePlus S', desc: 'Kategori lini produk / varian' },
    { name: 'SKU', sample: 'Y.O.U ACNEPLUS SPOT CARE PRO SERUM 15G', desc: 'Nama lengkap SKU' },
    { name: 'PRODUK FOKUS', sample: 'Fokus / Ya / -', desc: 'Indikator produk prioritas' },
    { name: 'PRODUK NEW', sample: 'New / Ya / -', desc: 'Indikator produk baru launching' },
    { name: 'NAMA STORE', sample: 'ANNISA KOSMETIK PEKAN BARU', desc: 'Nama toko / outlet retail' },
    { name: 'REGION', sample: 'PEKAN BARU, DURI, DUMAI', desc: 'Kota / Wilayah distribusi' },
    { name: 'KATEGORI', sample: 'Skincare, Lip, Bodycare, Haircare, Eye', desc: 'Kategori produk kosmetik' },
    { name: 'QTY', sample: '24', desc: 'Jumlah kuantiti barang terjual' },
    { name: 'VALUE', sample: '766080', desc: 'Nilai omset penjualan dalam Rupiah' },
    { name: 'KET', sample: 'SELL IN / SELL OUT', desc: 'Jenis transaksi penjualan' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Panduan Integrasi Google Apps Script
              </h2>
              <p className="text-xs text-slate-500">
                Hubungkan data langsung dari Google Sheets ke Dashboard ini secara real-time
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 bg-white">
          <button
            onClick={() => setActiveTab('script')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'script'
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Kode Script (Code.gs)</span>
          </button>
          
          <button
            onClick={() => setActiveTab('steps')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'steps'
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>5 Langkah Pemasangan</span>
          </button>

          <button
            onClick={() => setActiveTab('columns')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'columns'
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Struktur Kolom Header</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* TAB 1: SCRIPT */}
          {activeTab === 'script' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    File: <code className="text-indigo-600 font-mono">Code.gs</code>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Salin script di bawah ini ke editor Google Apps Script spreadsheet Anda.
                  </p>
                </div>
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition-all ${
                    copied 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Kode Apps Script'}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs overflow-x-auto leading-relaxed max-h-[380px] border border-slate-800">
                  {APPS_SCRIPT_TEMPLATE}
                </pre>
              </div>

              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Perhatian Saat Deploy:</span> Pada opsi <i>Who has access (Siapa yang memiliki akses)</i>, pastikan memilih <b>Anyone (Siapa saja)</b> agar dashboard dapat membaca data JSON tanpa terhalang otentikasi login.
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STEPS */}
          {activeTab === 'steps' && (
            <div className="space-y-4">
              <div className="grid gap-3">
                
                <div className="p-4 rounded-lg border border-slate-200 bg-white hover:border-indigo-300 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Buka Menu Apps Script di Google Sheets</h4>
                      <p className="text-xs text-slate-600 mt-1">
                        Buka dokumen Google Sheet data penjualan Anda. Klik menu bar atas: <b>Ekstensi (Extensions)</b> &rarr; <b>Apps Script</b>. Jendela editor Google Apps Script baru akan terbuka.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-slate-200 bg-white hover:border-indigo-300 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Paste Kode Script</h4>
                      <p className="text-xs text-slate-600 mt-1">
                        Hapus semua baris teks default di file <code>Code.gs</code>, kemudian paste seluruh kode dari tab <b>Kode Script (Code.gs)</b> di modal ini. Klik icon simpan (Save/Ctrl+S).
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-slate-200 bg-white hover:border-indigo-300 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Terapkan sebagai Web App (New Deployment)</h4>
                      <p className="text-xs text-slate-600 mt-1">
                        Klik tombol biru <b>Deploy (Terapkan)</b> di pojok kanan atas &rarr; pilih <b>New deployment (Terapkan baru)</b>. Klik icon gerigi di samping 'Select type' lalu pilih <b>Web app (Aplikasi web)</b>.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-slate-200 bg-white hover:border-indigo-300 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      4
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Konfigurasi Hak Akses (Sangat Penting)</h4>
                      <p className="text-xs text-slate-600 mt-1">
                        Atur opsi:
                        <br />• <b>Execute as:</b> <code>Me (email-anda@gmail.com)</code>
                        <br />• <b>Who has access:</b> <code>Anyone (Siapa saja)</code>
                        <br />Klik <b>Deploy</b>. Jika muncul pop-up izin akun Google, klik <i>Authorize access</i> &rarr; pilih akun Google Anda &rarr; klik <i>Advanced</i> &rarr; klik <i>Go to Project (unsafe)</i> &rarr; klik <i>Allow</i>.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-slate-200 bg-white hover:border-indigo-300 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      5
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Salin URL & Masukkan ke Dashboard</h4>
                      <p className="text-xs text-slate-600 mt-1">
                        Salin <b>Web app URL</b> yang berakhiran <code>/exec</code>. Lalu klik tombol "Masukkan URL Sekarang" di bawah ini untuk menghubungkan langsung ke dashboard!
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: COLUMNS */}
          {activeTab === 'columns' && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                Format kolom di Google Sheet Anda harus sesuai atau memuat kolom-kolom berikut di baris pertama (Header):
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2">Nama Kolom (Header)</th>
                      <th className="px-3 py-2">Contoh Nilai</th>
                      <th className="px-3 py-2">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-normal">
                    {columnsList.map((col, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-3 py-1.5 font-mono font-semibold text-indigo-700">{col.name}</td>
                        <td className="px-3 py-1.5 text-slate-700">{col.sample}</td>
                        <td className="px-3 py-1.5 text-slate-500">{col.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Koneksi real-time aman tanpa perlu login ulang setiap saat.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Tutup
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenConnectModal();
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <span>Masukkan URL Apps Script</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
