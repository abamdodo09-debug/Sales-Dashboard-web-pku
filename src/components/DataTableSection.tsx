import React, { useState, useMemo } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronsUpDown, 
  ChevronLeft, 
  ChevronRight, 
  FileSpreadsheet, 
  Info, 
  Eye, 
  Check, 
  Sparkles,
  Download
} from 'lucide-react';
import { SalesRecord } from '../types/sales';
import { formatRupiah, formatNumber, formatDateIndo } from '../utils/formatters';
import { exportTransactionsToExcel } from '../utils/excelExporter';

interface DataTableSectionProps {
  data: SalesRecord[];
  onSelectRecord?: (record: SalesRecord) => void;
}

type SortField = 'tanggal' | 'brand' | 'sku' | 'namaStore' | 'qty' | 'value' | 'ket';
type SortOrder = 'asc' | 'desc';

export const DataTableSection: React.FC<DataTableSectionProps> = ({ data, onSelectRecord }) => {
  const [sortField, setSortField] = useState<SortField>('tanggal');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [selectedRecord, setSelectedRecord] = useState<SalesRecord | null>(null);

  // Sorting
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
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
  }, [data, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Column sort toggle handler
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

  // Filtered Totals
  const totalValue = data.reduce((sum, item) => sum + (item.value || 0), 0);
  const totalQty = data.reduce((sum, item) => sum + (item.qty || 0), 0);

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
      
      {/* Table Header Controls */}
      <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-slate-700" />
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Data Penjualan Terperinci
          </h3>
          <span className="text-xs text-slate-500 font-mono tabular-nums">
            ({data.length} Transaksi)
          </span>
        </div>

        {/* Actions: Download Excel & Page size selector */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 self-end sm:self-auto">
          <button
            onClick={() => exportTransactionsToExcel(data)}
            title="Unduh Tabel Ini Langsung ke Excel (.xlsx)"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg font-semibold transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Unduh Excel ({data.length} Baris)</span>
            <Download className="w-3 h-3 text-emerald-600" />
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block"></div>

          <div className="flex items-center gap-1.5">
            <span>Tampilkan:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-white border border-slate-200 rounded-md text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value={10}>10 Baris</option>
              <option value={15}>15 Baris</option>
              <option value={25}>25 Baris</option>
              <option value={50}>50 Baris</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Viewport */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 select-none">
            <tr>
              <th 
                className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                onClick={() => handleSort('tanggal')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Tanggal</span>
                  {getSortIcon('tanggal')}
                </div>
              </th>

              <th 
                className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                onClick={() => handleSort('brand')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Brand</span>
                  {getSortIcon('brand')}
                </div>
              </th>

              <th className="px-4 py-3 whitespace-nowrap">
                <span>No SKU</span>
              </th>

              <th 
                className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors min-w-[240px]"
                onClick={() => handleSort('sku')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Deskripsi SKU</span>
                  {getSortIcon('sku')}
                </div>
              </th>

              <th 
                className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors min-w-[180px]"
                onClick={() => handleSort('namaStore')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Nama Store</span>
                  {getSortIcon('namaStore')}
                </div>
              </th>

              <th className="px-4 py-3 whitespace-nowrap">
                <span>Sales / SPV</span>
              </th>

              <th 
                className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                onClick={() => handleSort('ket')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Ket</span>
                  {getSortIcon('ket')}
                </div>
              </th>

              <th 
                className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors text-right whitespace-nowrap"
                onClick={() => handleSort('qty')}
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Qty</span>
                  {getSortIcon('qty')}
                </div>
              </th>

              <th 
                className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors text-right whitespace-nowrap"
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
                <td colSpan={10} className="px-4 py-12 text-center text-slate-500">
                  <p className="font-semibold text-slate-700">Tidak ada data yang sesuai filter.</p>
                  <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau reset filter.</p>
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => (
                <tr 
                  key={row.id}
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                  onClick={() => setSelectedRecord(row)}
                >
                  {/* Tanggal */}
                  <td className="px-4 py-3 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                    {formatDateIndo(row.tanggal)}
                  </td>

                  {/* Brand */}
                  <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-800">
                    <span className="font-semibold">{row.brand}</span>
                  </td>

                  {/* No SKU */}
                  <td className="px-4 py-3 font-mono text-slate-500 tabular-nums whitespace-nowrap">
                    {row.noSku}
                  </td>

                  {/* SKU Name & Flags */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {row.sku}
                      </span>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span>{row.kategori}</span>
                        {row.produkFokus && row.produkFokus !== '-' && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-indigo-600 font-semibold">Produk Fokus</span>
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

                  {/* Nama Store */}
                  <td className="px-4 py-3 text-slate-800 font-medium">
                    <div className="truncate max-w-[200px]" title={row.namaStore}>
                      {row.namaStore}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {row.region || row.coverArea}
                    </div>
                  </td>

                  {/* Sales & SPV */}
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    <div className="font-medium text-slate-800">{row.sales}</div>
                    <div className="text-[10px] text-slate-400">SPV: {row.spv}</div>
                  </td>

                  {/* KET */}
                  <td className="px-4 py-3 whitespace-nowrap font-medium">
                    <span className={row.ket === 'SELL IN' ? 'text-emerald-700' : 'text-blue-700'}>
                      {row.ket}
                    </span>
                  </td>

                  {/* Qty */}
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-800 font-semibold whitespace-nowrap">
                    {formatNumber(row.qty)}
                  </td>

                  {/* Value */}
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-900 font-bold whitespace-nowrap">
                    {formatRupiah(row.value)}
                  </td>

                  {/* Action */}
                  <td className="px-3 py-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setSelectedRecord(row)}
                      className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                      title="Lihat Detail Transaksi"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {/* Table Summary Footer */}
          <tfoot className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
            <tr>
              <td colSpan={7} className="px-4 py-3 text-right text-xs uppercase tracking-wider text-slate-500">
                Total Ringkasan ({data.length} Baris):
              </td>
              <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-900">
                {formatNumber(totalQty)} Pcs
              </td>
              <td className="px-4 py-3 text-right font-mono tabular-nums text-indigo-700 text-sm">
                {formatRupiah(totalValue)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 bg-white">
        <div>
          Halaman <span className="font-bold text-slate-900 font-mono tabular-nums">{currentPage}</span> dari{' '}
          <span className="font-bold text-slate-900 font-mono tabular-nums">{totalPages}</span>
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

      {/* Row Detail Modal */}
      {selectedRecord && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setSelectedRecord(null)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                  Detail Transaksi Penjualan
                </span>
                <h4 className="text-sm font-bold text-slate-900">
                  {selectedRecord.sku}
                </h4>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Merek (Brand)</span>
                  <span className="text-slate-800 font-semibold">{selectedRecord.brand}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Kode / No SKU</span>
                  <span className="font-mono text-slate-800">{selectedRecord.noSku}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Tanggal</span>
                  <span className="font-mono text-slate-800">{selectedRecord.tanggal} ({selectedRecord.bulan} {selectedRecord.tahun})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Tipe Transaksi</span>
                  <span className="font-semibold text-emerald-700">{selectedRecord.ket}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Outlet / Store</span>
                  <span className="font-semibold text-slate-800">{selectedRecord.namaStore}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Region &amp; Cover Area</span>
                  <span className="text-slate-800">{selectedRecord.region} · {selectedRecord.coverArea}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Sales Representative</span>
                  <span className="text-slate-800">{selectedRecord.sales}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Supervisor (SPV)</span>
                  <span className="text-slate-800">{selectedRecord.spv}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Beauty Advisor (BA)</span>
                  <span className="text-slate-800">{selectedRecord.ba || '-'} ({selectedRecord.baNumber || '-'})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Kategori Produk</span>
                  <span className="text-slate-800">{selectedRecord.kategori}</span>
                </div>
              </div>

              {/* Financial highlight */}
              <div className="bg-slate-50 p-3.5 rounded-lg flex items-center justify-between border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Kuantiti</span>
                  <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">
                    {formatNumber(selectedRecord.qty)} Pcs
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Nilai (Value)</span>
                  <span className="text-lg font-bold font-mono text-indigo-700 tabular-nums">
                    {formatRupiah(selectedRecord.value)}
                  </span>
                </div>
              </div>

            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 text-right">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
};
