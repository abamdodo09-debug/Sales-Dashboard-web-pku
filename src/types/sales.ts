export interface SalesRecord {
  id: string;
  tanggal: string;       // e.g. "2026-01-30" or "1/30/2026"
  bulan: string;         // e.g. "01. Jan"
  tahun: number | string;// e.g. 2026
  ba: string;            // Beauty Advisor name
  baNumber: string;      // BA code / ID
  coverArea: string;     // e.g. "AREA BARU", "PEKANBARU KOTA"
  sales: string;         // e.g. "ABDUL RAHIM"
  spv: string;           // e.g. "WIDODO"
  brand: string;         // e.g. "Y.O.U", "lavojoy", "DAZZLE ME", "barenbliss"
  noSku: string;         // SKU Code e.g. "13655"
  spu: string;           // Product line e.g. "Y.O.U AcnePlus S"
  sku: string;           // Full SKU Name
  produkFokus: string;   // e.g. "Ya" or "-"
  produkNew: string;     // e.g. "Ya" or "-"
  namaStore: string;     // Store name e.g. "ANNISA KOSMETIK PEKAN BARU"
  region: string;        // e.g. "PEKANBARU"
  kategori: string;      // e.g. "Skincare", "Makeup", "Bodycare", "Haircare", "Lip", "Eye"
  qty: number;           // Numeric qty sold
  value: number;         // Sales amount in Rupiah
  ket: string;           // "SELL IN" or "SELL OUT"
}

export interface FilterState {
  search: string;
  // 1. TANGGAL
  tanggal: string;
  startDate: string;
  endDate: string;
  // 2. BULAN
  bulan: string;
  // 3. TAHUN
  tahun: string;
  // 4. BA
  ba: string;
  // 5. BA Number
  baNumber: string;
  // 6. COVER AREA
  coverArea: string;
  // 7. SALES
  sales: string;
  // 8. SPV
  spv: string;
  // 9. BRAND
  brand: string;
  // 10. NO SKU
  noSku: string;
  // 11. SPU
  spu: string;
  // 12. SKU
  sku: string;
  // 13. PRODUK FOKUS
  produkFokus: string;
  // 14. PRODUK NEW
  produkNew: string;
  // 15. NAMA STORE
  namaStore: string;
  // 16. REGION
  region: string;
  // 17. KATEGORI
  kategori: string;
  // 18. QTY
  minQty: string;
  maxQty: string;
  // 19. VALUE
  minValue: string;
  maxValue: string;
  // 20. KET
  ket: string;
}

export const INITIAL_FILTER_STATE: FilterState = {
  search: '',
  tanggal: '',
  startDate: '',
  endDate: '',
  bulan: '',
  tahun: '',
  ba: '',
  baNumber: '',
  coverArea: '',
  sales: '',
  spv: '',
  brand: '',
  noSku: '',
  spu: '',
  sku: '',
  produkFokus: '',
  produkNew: '',
  namaStore: '',
  region: '',
  kategori: '',
  minQty: '',
  maxQty: '',
  minValue: '',
  maxValue: '',
  ket: ''
};

export interface DataSourceConfig {
  type: 'sample' | 'google-apps-script';
  scriptUrl: string;
  lastSyncTime?: string;
  autoRefresh: boolean;
  refreshIntervalMinutes: number;
}
