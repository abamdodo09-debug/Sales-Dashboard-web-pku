import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  ChevronUp, 
  ChevronDown, 
  ChevronsUpDown, 
  ChevronLeft, 
  ChevronRight, 
  FileSpreadsheet, 
  Download, 
  Eye, 
  Search,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { SalesRecord } from '../types/sales';
import { formatRupiah, formatNumber, formatDateIndo } from '../utils/formatters';
import { exportTransactionsToExcel } from '../utils/excelExporter';

interface TransactionSlideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  data: SalesRecord[];
  totalAllRecords: number;
}

type SortField = 'tanggal' | 'brand' | 'sku' | 'namaStore' | 'qty' | 'value' | 'ket';
type SortOrder = 'asc' | 'desc';

export const TransactionSlideMenu: React.FC<TransactionSlideMenuProps> = ({
  isOpen,
  onClose,
  data,
  totalAllRecords
}) => {
  const [internalSearch, setInternalSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('tanggal');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [selectedRecord, setSelectedRecord] = useState<SalesRecord | null>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (selectedRecord) {
          setSelectedRecord(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, selectedRecord]);

  // Prevent body scroll when slide menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Filter with internal table search if user types in slide menu
  const searchFilteredData = useMemo(() => {
    if (!internalSearch.trim()) return data;
    const q = internalSearch.toLowerCase().trim();
    return data.filter(r => 
      r.sku.toLowerCase().includes(q) ||
      r.noSku.toLowerCase().includes(q) ||
      r.namaStore.toLowerCase().includes(q) ||
      r.sales.toLowerCase().includes(q) ||
      r.brand.toLowerCase().includes(q) ||
      r.ba.toLowerCase().includes(q) ||
      r.coverArea.toLowerCase().includes(q)
    );
  }, [data, internalSearch]);

  // Sorting
  const sortedData = useMemo(() => {
    return [...searchFilteredData].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'qty' || sortField === 'value') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }

      aVal = String(aVal || '').toLowerCase();
      bVal = String(bVal || '').toLowerCase();
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [searchFilteredData, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Reset page when dataset or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [internalSearch, data.length]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'value' || field === 'qty' ? 'desc' : 'asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />;
    }
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-3.5 h-3.5 text-indigo-600" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 text-indigo-600" />
    );
  };

  // Aggregated totals
  const totalValue = useMemo(() => searchFilteredData.reduce((sum, item) => sum + (item.value || 0), 0), [searchFilteredData]);
  const totalQty = useMemo(() => searchFilteredData.reduce((sum, item) => sum + (item.qty || 0), 0), [searchFilteredData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-over Panel from Right */}
      <div className="fixed inset-y-0 right-0 max-w-5xl w-full flex pl-6 sm:pl-10">
        <div 
          className="w-full bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* Header */}
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600/40 text-indigo-300 rounded-lg border border-indigo-500/30">
                <FileSpreadsheet className="w-5 h-5 text-indigo-200" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    Slide Menu · Tabel Transaksi Penjualan
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/20">
                    {data.length} Baris Terfilter
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Data transaksi terperinci sesuai filter aktif (Total dataset: {totalAllRecords} transaksi)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => exportTransactionsToExcel(searchFilteredData)}
                title="Unduh Data Transaksi ke Excel (.xlsx)"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download Excel</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-1"
                title="Tutup Slide Menu (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar inside Slide Menu */}
          <div className="grid grid-cols-3 gap-3 px-6 py-3 bg-slate-50 border-b border-slate-200 shrink-0 text-xs">
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Transaksi
              </span>
              <span className="text-sm sm:text-base font-bold font-mono text-slate-900 tabular-nums">
                {formatNumber(searchFilteredData.length)}
              </span>
              <span className="text-[11px] text-slate-500 ml-1">baris</span>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Unit Terjual (Qty)
              </span>
              <span className="text-sm sm:text-base font-bold font-mono text-emerald-700 tabular-nums">
                {formatNumber(totalQty)}
              </span>
              <span className="text-[11px] text-slate-500 ml-1">pcs</span>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Realisasi Omset (Value)
              </span>
              <span className="text-sm sm:text-base font-bold font-mono text-indigo-700 tabular-nums">
                {formatRupiah(totalValue)}
              </span>
            </div>
          </div>

          {/* Search & Page Size Controller */}
          <div className="px-6 py-3 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white shrink-0">
            {/* Quick in-table search */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={internalSearch}
                onChange={(e) => setInternalSearch(e.target.value)}
                placeholder="Cari cepat di tabel transaksi (SKU, No SKU, Toko, Sales, BA, Brand)..."
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {internalSearch && (
                <button
                  onClick={() => setInternalSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600 self-end sm:self-auto">
              <span>Tampilkan per halaman:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value={10}>10 Baris</option>
                <option value={15}>15 Baris</option>
                <option value={25}>25 Baris</option>
                <option value={50}>50 Baris</option>
                <option value={100}>100 Baris</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 sticky top-0 z-10 select-none">
                <tr>
                  <th 
                    className="px-4 py-3 cursor-pointer hover:bg-slate-200 transition-colors whitespace-nowrap"
                    onClick={() => handleSort('tanggal')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Tanggal</span>
                      {getSortIcon('tanggal')}
                    </div>
                  </th>

                  <th 
                    className="px-4 py-3 cursor-pointer hover:bg-slate-200 transition-colors whitespace-nowrap"
                    onClick={() => handleSort('brand')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Brand</span>
                      {getSortIcon('brand')}
                    </div>
                  </th>

                  <th className="px-4 py-3 whitespace-nowrap font-mono">
                    <span>No SKU</span>
                  </th>

                  <th 
                    className="px-4 py-3 cursor-pointer hover:bg-slate-200 transition-colors min-w-[220px]"
                    onClick={() => handleSort('sku')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Deskripsi SKU</span>
                      {getSortIcon('sku')}
                    </div>
                  </th>

                  <th 
                    className="px-4 py-3 cursor-pointer hover:bg-slate-200 transition-colors min-w-[170px]"
                    onClick={() => handleSort('namaStore')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Nama Store</span>
                      {getSortIcon('namaStore')}
                    </div>
                  </th>

                  <th className="px-4 py-3 whitespace-nowrap">
                    <span>Sales / BA</span>
                  </th>

                  <th 
                    className="px-4 py-3 cursor-pointer hover:bg-slate-200 transition-colors whitespace-nowrap"
                    onClick={() => handleSort('ket')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Ket</span>
                      {getSortIcon('ket')}
                    </div>
                  </th>

                  <th 
                    className="px-4 py-3 cursor-pointer hover:bg-slate-200 transition-colors text-right whitespace-nowrap"
                    onClick={() => handleSort('qty')}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Qty</span>
                      {getSortIcon('qty')}
                    </div>
                  </th>

                  <th 
                    className="px-4 py-3 cursor-pointer hover:bg-slate-200 transition-colors text-right whitespace-nowrap"
                    onClick={() => handleSort('value')}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Value (Rp)</span>
                      {getSortIcon('value')}
                    </div>
                  </th>

                  <th className="px-3 py-3 text-center whitespace-nowrap">
                    <span>Aksi</span>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-16 text-center text-slate-500">
                      <p className="font-semibold text-slate-700 text-sm">Tidak ada transaksi yang cocok.</p>
                      <p className="text-xs text-slate-400 mt-1">Sesuaikan kata kunci pencarian atau buka filter 20 kolom di dashboard.</p>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row) => (
                    <tr 
                      key={row.id}
                      className="hover:bg-slate-50 transition-colors group cursor-pointer"
                      onClick={() => setSelectedRecord(row)}
                    >
                      <td className="px-4 py-2.5 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                        {formatDateIndo(row.tanggal)}
                      </td>

                      <td className="px-4 py-2.5 whitespace-nowrap font-medium text-slate-800">
                        <span className="font-semibold">{row.brand}</span>
                      </td>

                      <td className="px-4 py-2.5 font-mono text-slate-500 tabular-nums whitespace-nowrap">
                        {row.noSku}
                      </td>

                      <td className="px-4 py-2.5">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {row.sku}
                          </span>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                            <span>{row.kategori}</span>
                            {row.produkFokus && row.produkFokus !== '-' && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-indigo-600 font-semibold">Fokus</span>
                              </>
                            )}
                            {row.produkNew && row.produkNew !== '-' && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-rose-600 font-semibold">New</span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-2.5 text-slate-800 font-medium">
                        <div className="truncate max-w-[180px]" title={row.namaStore}>
                          {row.namaStore}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {row.region || row.coverArea}
                        </div>
                      </td>

                      <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">
                        <div className="font-medium text-slate-800">{row.sales}</div>
                        <div className="text-[10px] text-slate-400">BA: {row.ba || '-'}</div>
                      </td>

                      <td className="px-4 py-2.5 whitespace-nowrap font-medium">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.ket === 'SELL IN' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {row.ket}
                        </span>
                      </td>

                      <td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-800 font-semibold whitespace-nowrap">
                        {formatNumber(row.qty)}
                      </td>

                      <td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-900 font-bold whitespace-nowrap">
                        {formatRupiah(row.value)}
                      </td>

                      <td className="px-3 py-2.5 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedRecord(row)}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          title="Lihat Detail Transaksi Lengkap"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Pagination */}
          <div className="px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 bg-white shrink-0">
            <div>
              Halaman <span className="font-bold text-slate-900 font-mono tabular-nums">{currentPage}</span> dari{' '}
              <span className="font-bold text-slate-900 font-mono tabular-nums">{totalPages}</span> ({searchFilteredData.length} baris)
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-semibold font-mono tabular-nums transition-colors ${
                      currentPage === pageNum
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Row Detail Pop-up Modal */}
      {selectedRecord && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
          onClick={() => setSelectedRecord(null)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                  Detail Transaksi Penjualan Lengkap
                </span>
                <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                  {selectedRecord.sku}
                </h4>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-3.5 text-xs max-h-[75vh] overflow-y-auto">
              {/* Product Info */}
              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Merek (Brand)</span>
                  <span className="text-slate-900 font-bold">{selectedRecord.brand}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">No SKU</span>
                  <span className="font-mono text-slate-800 font-semibold">{selectedRecord.noSku}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">SPU / Series</span>
                  <span className="text-slate-800">{selectedRecord.spu || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Kategori</span>
                  <span className="text-slate-800">{selectedRecord.kategori}</span>
                </div>
              </div>

              {/* Transaction & Date Info */}
              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Tanggal Transaksi</span>
                  <span className="font-mono text-slate-800 font-semibold">
                    {selectedRecord.tanggal} ({selectedRecord.bulan} {selectedRecord.tahun})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Tipe Transaksi (KET)</span>
                  <span className={`font-bold ${selectedRecord.ket === 'SELL IN' ? 'text-emerald-700' : 'text-blue-700'}`}>
                    {selectedRecord.ket}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Kuantiti Terjual</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {formatNumber(selectedRecord.qty)} Pcs
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Nilai Omset (Value)</span>
                  <span className="font-mono font-bold text-indigo-700 text-sm">
                    {formatRupiah(selectedRecord.value)}
                  </span>
                </div>
              </div>

              {/* Outlet & Store */}
              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100">
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Nama Toko (Outlet)</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedRecord.namaStore}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Region</span>
                  <span className="text-slate-800 font-semibold">{selectedRecord.region}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Cover Area</span>
                  <span className="text-slate-800">{selectedRecord.coverArea}</span>
                </div>
              </div>

              {/* Sales Team & BA */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Sales Representative</span>
                  <span className="text-slate-800 font-semibold">{selectedRecord.sales}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Supervisor (SPV)</span>
                  <span className="text-slate-800 font-semibold">{selectedRecord.spv}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Beauty Advisor (BA)</span>
                  <span className="text-slate-800">{selectedRecord.ba || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">BA Number</span>
                  <span className="font-mono text-slate-800">{selectedRecord.baNumber || '-'}</span>
                </div>
              </div>

            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
