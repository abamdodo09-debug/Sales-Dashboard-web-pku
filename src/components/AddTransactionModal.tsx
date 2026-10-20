import React, { useState } from 'react';
import { X, PlusCircle, Check } from 'lucide-react';
import { SalesRecord } from '../types/sales';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (record: SalesRecord) => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction
}) => {
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    bulan: '01. Jan',
    tahun: 2026,
    ba: 'Dina Lestari',
    baNumber: 'BA-012',
    coverArea: 'PEKANBARU KOTA',
    sales: 'ABDUL RAHIM',
    spv: 'WIDODO',
    brand: 'Y.O.U',
    noSku: '898836',
    spu: 'Y.O.U SUNBRELL',
    sku: 'Y.O.U SUNBRELLA TRIPLE UV ELIXIR SUNSCREEN 30G',
    produkFokus: 'Fokus',
    produkNew: 'New',
    namaStore: 'ANNISA KOSMETIK PEKAN BARU',
    region: 'PEKAN BARU',
    kategori: 'Skincare',
    qty: 12,
    value: 575040,
    ket: 'SELL IN'
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: SalesRecord = {
      id: `manual-entry-${Date.now()}`,
      tanggal: formData.tanggal,
      bulan: formData.bulan,
      tahun: formData.tahun,
      ba: formData.ba,
      baNumber: formData.baNumber,
      coverArea: formData.coverArea,
      sales: formData.sales,
      spv: formData.spv,
      brand: formData.brand,
      noSku: formData.noSku,
      spu: formData.spu,
      sku: formData.sku,
      produkFokus: formData.produkFokus,
      produkNew: formData.produkNew,
      namaStore: formData.namaStore,
      region: formData.region,
      kategori: formData.kategori,
      qty: Number(formData.qty) || 0,
      value: Number(formData.value) || 0,
      ket: formData.ket
    };

    onAddTransaction(newRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-slate-900 text-white rounded-lg">
              <PlusCircle className="w-4 h-4 text-rose-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Tambah Transaksi Penjualan Baru
              </h3>
              <p className="text-xs text-slate-500">
                Input data baru langsung ke dashboard
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tanggal</label>
              <input
                type="date"
                required
                value={formData.tanggal}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Brand</label>
              <select
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
              >
                <option value="Y.O.U">Y.O.U</option>
                <option value="barenbliss">barenbliss</option>
                <option value="lavojoy">lavojoy</option>
                <option value="DAZZLE ME">DAZZLE ME</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">No SKU</label>
              <input
                type="text"
                required
                value={formData.noSku}
                onChange={(e) => setFormData({ ...formData, noSku: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div className="col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Nama SKU Lengkap</label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Store / Toko</label>
              <input
                type="text"
                required
                value={formData.namaStore}
                onChange={(e) => setFormData({ ...formData, namaStore: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
              <select
                value={formData.kategori}
                onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                <option value="Skincare">Skincare</option>
                <option value="Lip">Lip</option>
                <option value="Complexion">Complexion</option>
                <option value="Eye">Eye</option>
                <option value="Bodycare">Bodycare</option>
                <option value="Haircare">Haircare</option>
                <option value="Makeup">Makeup</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sales</label>
              <input
                type="text"
                value={formData.sales}
                onChange={(e) => setFormData({ ...formData, sales: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">SPV</label>
              <input
                type="text"
                value={formData.spv}
                onChange={(e) => setFormData({ ...formData, spv: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Jenis (KET)</label>
              <select
                value={formData.ket}
                onChange={(e) => setFormData({ ...formData, ket: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                <option value="SELL IN">SELL IN</option>
                <option value="SELL OUT">SELL OUT</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Kuantiti (Qty / Pcs)</label>
              <input
                type="number"
                min="1"
                required
                value={formData.qty}
                onChange={(e) => {
                  const q = Number(e.target.value);
                  setFormData({ 
                    ...formData, 
                    qty: q,
                    // automatically estimate value if applicable
                    value: q * 47920
                  });
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 mb-1">Nilai Omset (Value Rp)</label>
              <input
                type="number"
                min="0"
                required
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.produkFokus === 'Fokus'}
                onChange={(e) => setFormData({ ...formData, produkFokus: e.target.checked ? 'Fokus' : '-' })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-slate-700">Tandai sebagai Produk Fokus</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.produkNew === 'New'}
                onChange={(e) => setFormData({ ...formData, produkNew: e.target.checked ? 'New' : '-' })}
                className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              <span className="text-slate-700">Tandai sebagai Produk Baru (New)</span>
            </label>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Simpan Transaksi</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
