import { SalesRecord } from '../types/sales';

export const APPS_SCRIPT_TEMPLATE = `/**
 * GOOGLE APPS SCRIPT: Beauty Sales Dashboard Data Connector
 * 
 * CARA PEMASANGAN:
 * 1. Buka Google Sheets Anda yang berisi tabel penjualan.
 * 2. Klik menu 'Ekstensi' (Extensions) -> 'Apps Script'.
 * 3. Hapus semua kode default di Code.gs, lalu paste seluruh kode di bawah ini.
 * 4. Klik tombol 'Deploy' (Terapkan) di kanan atas -> 'New deployment' (Terapkan baru).
 * 5. Pilih jenis deployment: 'Web app' (Aplikasi web).
 * 6. Setelan:
 *    - Description: Sales Dashboard API
 *    - Execute as (Jalankan sebagai): 'Me' (Saya - email Anda)
 *    - Who has access (Siapa yang memiliki akses): 'Anyone' (Siapa saja)  <-- PENTING!
 * 7. Klik 'Deploy', setujui perizinan akun Google Anda (Authorize Access).
 * 8. Salin 'Web App URL' yang berakhiran '/exec'.
 * 9. Tempelkan URL tersebut ke kolom koneksi di Dashboard Anda.
 */

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    // Cari sheet bernama "Data" atau sheet pertama yang aktif
    var sheet = ss.getSheetByName("Data") || ss.getSheetByName("Sheet1") || ss.getActiveSheet();
    var values = sheet.getDataRange().getValues();
    
    if (!values || values.length < 2) {
      return createJsonResponse({
        status: "success",
        sheetName: sheet.getName(),
        total: 0,
        data: []
      });
    }
    
    // Ambil header di baris pertama
    var headers = values[0].map(function(h) { 
      return String(h || '').trim(); 
    });
    
    var rows = [];
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      // Lewati baris kosong
      var isRowEmpty = row.every(function(cell) {
        return cell === "" || cell === null || cell === undefined;
      });
      if (isRowEmpty) continue;
      
      var item = {};
      for (var j = 0; j < headers.length; j++) {
        var colName = headers[j];
        if (!colName) continue;
        var cellVal = row[j];
        
        // Format tanggal jika objek Date
        if (cellVal instanceof Date) {
          var y = cellVal.getFullYear();
          var m = ("0" + (cellVal.getMonth() + 1)).slice(-2);
          var d = ("0" + cellVal.getDate()).slice(-2);
          cellVal = y + "-" + m + "-" + d;
        }
        
        item[colName] = cellVal;
      }
      rows.push(item);
    }
    
    return createJsonResponse({
      status: "success",
      timestamp: new Date().toISOString(),
      sheetName: sheet.getName(),
      total: rows.length,
      data: rows
    });
    
  } catch (err) {
    return createJsonResponse({
      status: "error",
      message: err.toString()
    });
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

// Local storage keys
const STORAGE_KEY_URL = 'beauty_sales_gas_url';
const STORAGE_KEY_CACHE = 'beauty_sales_gas_cache';
const STORAGE_KEY_LAST_SYNC = 'beauty_sales_last_sync';

export function getStoredScriptUrl(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_URL) || '';
  } catch {
    return '';
  }
}

export function saveStoredScriptUrl(url: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_URL, url.trim());
  } catch (err) {
    console.error('Failed to save script URL', err);
  }
}

export function getCachedSheetData(): SalesRecord[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CACHE);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveCachedSheetData(data: SalesRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CACHE, JSON.stringify(data));
    localStorage.setItem(STORAGE_KEY_LAST_SYNC, new Date().toISOString());
  } catch (err) {
    console.error('Failed to save cached sheet data', err);
  }
}

export function getLastSyncTime(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_LAST_SYNC);
  } catch {
    return null;
  }
}

/**
 * Normalizes raw Google Sheet row objects into typed SalesRecord objects.
 * Handles flexible header names (e.g., TANGGAL, tanggal, Date, NAMA STORE, Store, Toko, VALUE, Total, etc.)
 */
export function normalizeSheetRows(rawRows: Record<string, unknown>[]): SalesRecord[] {
  return rawRows.map((row, index) => {
    // Helper to find value from possible key matches
    const getVal = (...keys: string[]): unknown => {
      for (const k of keys) {
        if (row[k] !== undefined && row[k] !== null && row[k] !== '') {
          return row[k];
        }
        // case-insensitive check
        const lowerKey = k.toLowerCase().replace(/[\s_-]+/g, '');
        for (const actualKey of Object.keys(row)) {
          const actualLower = actualKey.toLowerCase().replace(/[\s_-]+/g, '');
          if (actualLower === lowerKey && row[actualKey] !== undefined && row[actualKey] !== null) {
            return row[actualKey];
          }
        }
      }
      return '';
    };

    const tanggalRaw = String(getVal('TANGGAL', 'Tanggal', 'DATE', 'Date', 'tgl') || '');
    let formattedTanggal = tanggalRaw;
    if (tanggalRaw.includes('/')) {
      const parts = tanggalRaw.split('/');
      if (parts.length === 3) {
        const m = parts[0].padStart(2, '0');
        const d = parts[1].padStart(2, '0');
        const y = parts[2].length === 2 ? '20' + parts[2] : parts[2];
        formattedTanggal = `${y}-${m}-${d}`;
      }
    }

    const qtyRaw = getVal('QTY', 'Qty', 'Jumlah', 'Quantity', 'qty');
    const parsedQty = typeof qtyRaw === 'number' ? qtyRaw : parseInt(String(qtyRaw).replace(/[^0-9.-]/g, ''), 10) || 0;

    const valRaw = getVal('VALUE', 'Value', 'Omset', 'Total', 'Harga', 'value');
    const parsedVal = typeof valRaw === 'number' ? valRaw : parseFloat(String(valRaw).replace(/[^0-9.-]/g, '')) || 0;

    const brandRaw = String(getVal('BRAND', 'Brand', 'Merek') || '').trim();
    // Normalize well-known brands
    let normalizedBrand = brandRaw || 'General';
    const lowerB = brandRaw.toLowerCase();
    if (lowerB.includes('y.o.u') || lowerB === 'you') normalizedBrand = 'Y.O.U';
    else if (lowerB.includes('barenbliss') || lowerB.includes('bnb')) normalizedBrand = 'barenbliss';
    else if (lowerB.includes('lavojoy')) normalizedBrand = 'lavojoy';
    else if (lowerB.includes('dazzle me') || lowerB.includes('dazzleme')) normalizedBrand = 'DAZZLE ME';

    const skuRaw = String(getVal('SKU', 'Sku', 'Nama Produk', 'Product') || '').trim();
    const spuRaw = String(getVal('SPU', 'Spu', 'Series', 'Group') || '').trim();
    const storeRaw = String(getVal('NAMA STORE', 'Nama Store', 'Store', 'Toko', 'Nama Toko', 'Outlet') || '').trim();
    const salesRaw = String(getVal('SALES', 'Sales', 'Salesman', 'Nama Sales') || 'ABDUL RAHIM').trim();
    const spvRaw = String(getVal('SPV', 'Spv', 'Supervisor') || 'WIDODO').trim();
    const ketRaw = String(getVal('KET', 'Ket', 'Keterangan', 'Status', 'Tipe') || 'SELL IN').trim().toUpperCase();

    // Determine category based on product title or category column
    let kategori = String(getVal('KATEGORI', 'Kategori', 'Category') || '').trim();
    if (!kategori) {
      const lowerSku = skuRaw.toLowerCase();
      if (lowerSku.includes('serum') || lowerSku.includes('sunscreen') || lowerSku.includes('cream') || lowerSku.includes('gel') || lowerSku.includes('acne') || lowerSku.includes('amino')) {
        kategori = 'Skincare';
      } else if (lowerSku.includes('lip') || lowerSku.includes('tint') || lowerSku.includes('velvet') || lowerSku.includes('balm')) {
        kategori = 'Lip';
      } else if (lowerSku.includes('body serum') || lowerSku.includes('lotion') || lowerSku.includes('glow body')) {
        kategori = 'Bodycare';
      } else if (lowerSku.includes('shampoo') || lowerSku.includes('hair') || lowerSku.includes('conditioner')) {
        kategori = 'Haircare';
      } else if (lowerSku.includes('cushion') || lowerSku.includes('primer') || lowerSku.includes('powder') || lowerSku.includes('foundation')) {
        kategori = 'Complexion';
      } else if (lowerSku.includes('eyeliner') || lowerSku.includes('mascara') || lowerSku.includes('eyebrow')) {
        kategori = 'Eye';
      } else {
        kategori = 'Beauty & Makeup';
      }
    }

    const tahunRaw = getVal('TAHUN', 'Tahun', 'Year');
    const parsedTahun = (typeof tahunRaw === 'number' || typeof tahunRaw === 'string') && tahunRaw ? tahunRaw : 2026;

    return {
      id: `sheet-row-${index + 1}-${Date.now()}`,
      tanggal: formattedTanggal || new Date().toISOString().split('T')[0],
      bulan: String(getVal('BULAN', 'Bulan', 'Month') || '01. Jan'),
      tahun: parsedTahun,
      ba: String(getVal('BA', 'Ba', 'Beauty Advisor') || '-'),
      baNumber: String(getVal('BA Number', 'BA No', 'No BA', 'baNumber') || '-'),
      coverArea: String(getVal('COVER AREA', 'Cover Area', 'Area') || 'AREA BARU'),
      sales: salesRaw,
      spv: spvRaw,
      brand: normalizedBrand,
      noSku: String(getVal('NO SKU', 'No SKU', 'SKU Code', 'Kode SKU') || `${10000 + index}`),
      spu: spuRaw || skuRaw.slice(0, 15),
      sku: skuRaw || `Produk SKU ${index + 1}`,
      produkFokus: String(getVal('PRODUK FOKUS', 'Produk Fokus', 'Fokus', 'Focus') || '-'),
      produkNew: String(getVal('PRODUK NEW', 'Produk New', 'New') || '-'),
      namaStore: storeRaw || 'Toko Retail',
      region: String(getVal('REGION', 'Region', 'Wilayah', 'Kota') || 'PEKAN BARU'),
      kategori,
      qty: parsedQty,
      value: parsedVal,
      ket: ketRaw.includes('OUT') ? 'SELL OUT' : 'SELL IN'
    };
  });
}

/**
 * Fetches data from Google Apps Script Web App URL
 */
export async function fetchGoogleSheetData(scriptUrl: string): Promise<{
  success: boolean;
  data: SalesRecord[];
  total: number;
  message?: string;
  sheetName?: string;
}> {
  if (!scriptUrl || !scriptUrl.trim()) {
    throw new Error('URL Google Apps Script tidak boleh kosong.');
  }

  const cleanUrl = scriptUrl.trim();
  if (!cleanUrl.startsWith('https://script.google.com/macros/s/')) {
    throw new Error('Format URL tidak valid. Pastikan URL diawali dengan https://script.google.com/macros/s/.../exec');
  }

  try {
    const response = await fetch(cleanUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      // Automatically follows the 302 redirect from Google Apps Script
      redirect: 'follow',
      cache: 'no-cache'
    });

    if (!response.ok) {
      throw new Error(`Gagal menghubungi server Apps Script (HTTP ${response.status}: ${response.statusText})`);
    }

    const payload = await response.json();

    if (payload.status === 'error') {
      throw new Error(payload.message || 'Apps Script mengembalikan status error.');
    }

    const rawData = Array.isArray(payload.data) ? payload.data : (Array.isArray(payload) ? payload : []);
    const normalized = normalizeSheetRows(rawData);

    // Cache the successful fetch
    saveStoredScriptUrl(cleanUrl);
    saveCachedSheetData(normalized);

    return {
      success: true,
      data: normalized,
      total: normalized.length,
      sheetName: payload.sheetName || 'Sheet1'
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Terjadi kesalahan saat memuat data Google Sheet.';
    console.error('Google Sheet fetch error:', error);
    throw new Error(msg);
  }
}
