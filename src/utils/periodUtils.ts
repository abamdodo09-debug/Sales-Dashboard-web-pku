import { SalesRecord } from '../types/sales';

export interface PeriodItem {
  id: string;          // e.g. "2026-W05" or "2026-01" or "2026"
  label: string;       // e.g. "Minggu 05 (Feb 2026)" or "Januari 2026" or "Tahun 2026"
  year: number;
  month?: number;
  week?: number;
}

/**
 * Returns ISO week number for a given date
 */
export function getISOWeek(date: Date): { year: number; week: number } {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7; // Monday = 0
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  return { year: target.getFullYear(), week: weekNumber };
}

export function parseDateSafe(dateStr: string): Date | null {
  if (!dateStr) return null;
  // Check YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const [y, m, d] = dateStr.split('T')[0].split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  // Check M/D/YYYY or D/M/YYYY
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const m = parseInt(parts[0], 10);
      const d = parseInt(parts[1], 10);
      const y = parseInt(parts[2].length === 2 ? '20' + parts[2] : parts[2], 10);
      return new Date(y, m - 1, d);
    }
  }
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Extract all unique weeks available in the dataset
 */
export function getAvailableWeeks(data: SalesRecord[]): PeriodItem[] {
  const map = new Map<string, PeriodItem>();

  data.forEach((r) => {
    const d = parseDateSafe(r.tanggal);
    if (!d) return;
    const { year, week } = getISOWeek(d);
    const id = `${year}-W${String(week).padStart(2, '0')}`;
    if (!map.has(id)) {
      const monthName = d.toLocaleDateString('id-ID', { month: 'short' });
      map.set(id, {
        id,
        label: `Minggu ${week} (${monthName} ${year})`,
        year,
        week
      });
    }
  });

  return Array.from(map.values()).sort((a, b) => b.id.localeCompare(a.id));
}

/**
 * Extract all unique months available in the dataset
 */
export function getAvailableMonths(data: SalesRecord[]): PeriodItem[] {
  const map = new Map<string, PeriodItem>();

  data.forEach((r) => {
    let year = Number(r.tahun) || 2026;
    let monthNum = 1;

    const d = parseDateSafe(r.tanggal);
    if (d) {
      year = d.getFullYear();
      monthNum = d.getMonth() + 1;
    } else if (r.bulan) {
      const bLower = r.bulan.toLowerCase();
      if (bLower.includes('jan') || bLower.includes('01')) monthNum = 1;
      else if (bLower.includes('feb') || bLower.includes('02')) monthNum = 2;
      else if (bLower.includes('mar') || bLower.includes('03')) monthNum = 3;
      else if (bLower.includes('apr') || bLower.includes('04')) monthNum = 4;
      else if (bLower.includes('mei') || bLower.includes('may') || bLower.includes('05')) monthNum = 5;
      else if (bLower.includes('jun') || bLower.includes('06')) monthNum = 6;
      else if (bLower.includes('jul') || bLower.includes('07')) monthNum = 7;
      else if (bLower.includes('agu') || bLower.includes('aug') || bLower.includes('08')) monthNum = 8;
      else if (bLower.includes('sep') || bLower.includes('09')) monthNum = 9;
      else if (bLower.includes('okt') || bLower.includes('oct') || bLower.includes('10')) monthNum = 10;
      else if (bLower.includes('nov') || bLower.includes('11')) monthNum = 11;
      else if (bLower.includes('des') || bLower.includes('dec') || bLower.includes('12')) monthNum = 12;
    }

    const id = `${year}-${String(monthNum).padStart(2, '0')}`;
    if (!map.has(id)) {
      const dateSample = new Date(year, monthNum - 1, 1);
      const monthLabel = dateSample.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      map.set(id, {
        id,
        label: monthLabel,
        year,
        month: monthNum
      });
    }
  });

  return Array.from(map.values()).sort((a, b) => b.id.localeCompare(a.id));
}

/**
 * Extract all unique years available in the dataset
 */
export function getAvailableYears(data: SalesRecord[]): PeriodItem[] {
  const set = new Set<number>();

  data.forEach((r) => {
    const d = parseDateSafe(r.tanggal);
    if (d) {
      set.add(d.getFullYear());
    } else if (r.tahun) {
      set.add(Number(r.tahun));
    }
  });

  const years = Array.from(set).filter(Boolean).sort((a, b) => b - a);
  return years.map((y) => ({
    id: String(y),
    label: `Tahun ${y}`,
    year: y
  }));
}

/**
 * Filter data by specific period
 */
export function filterRecordsByPeriod(
  data: SalesRecord[],
  periodType: 'wow' | 'mom' | 'yoy',
  periodId: string
): SalesRecord[] {
  if (!periodId) return [];

  if (periodType === 'wow') {
    return data.filter((r) => {
      const d = parseDateSafe(r.tanggal);
      if (!d) return false;
      const { year, week } = getISOWeek(d);
      return `${year}-W${String(week).padStart(2, '0')}` === periodId;
    });
  }

  if (periodType === 'mom') {
    return data.filter((r) => {
      const d = parseDateSafe(r.tanggal);
      let y = Number(r.tahun) || 2026;
      let m = 1;
      if (d) {
        y = d.getFullYear();
        m = d.getMonth() + 1;
      }
      return `${y}-${String(m).padStart(2, '0')}` === periodId;
    });
  }

  if (periodType === 'yoy') {
    const targetYear = Number(periodId);
    return data.filter((r) => {
      const d = parseDateSafe(r.tanggal);
      const y = d ? d.getFullYear() : Number(r.tahun);
      return y === targetYear;
    });
  }

  return [];
}
