import { format, parseISO, startOfMonth, endOfMonth, subYears } from 'date-fns';

export interface SalesRow {
  id: string;
  store_id: string;
  business_date: string | null;
  date: string | null;
  sales_datetime: string | null;
  sales_hour: number | null;
  weekday: number | null;
  payment_method: string | null;
  sales_channel: string | null;
  net_sales: number | null;
  amount: number | null;
  card_sales: number | null;
  cash_sales: number | null;
  delivery_sales: number | null;
  alcohol_sales: number | null;
  source_type: string | null;
}

export const KRW = (n: number) => `₩${Math.round(n).toLocaleString()}`;

export const WEEKDAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

const amountOf = (r: SalesRow) => Number(r.net_sales ?? r.amount ?? 0);
const dateOf = (r: SalesRow) => r.business_date ?? r.date ?? (r.sales_datetime ? r.sales_datetime.slice(0, 10) : null);
const hourOf = (r: SalesRow) => {
  if (r.sales_hour != null) return r.sales_hour;
  if (r.sales_datetime) return new Date(r.sales_datetime).getHours();
  return null;
};
const weekdayOf = (r: SalesRow) => {
  if (r.weekday != null) return r.weekday;
  const d = dateOf(r);
  if (!d) return null;
  const wd = parseISO(d).getDay();
  return wd === 0 ? 6 : wd - 1; // Mon=0 .. Sun=6
};

export const filterByPeriod = (rows: SalesRow[], from: string, to: string) =>
  rows.filter((r) => {
    const d = dateOf(r);
    return d != null && d >= from && d <= to;
  });

export const sumNet = (rows: SalesRow[]) => rows.reduce((s, r) => s + amountOf(r), 0);

export const dailyTrend = (rows: SalesRow[]) => {
  const map = new Map<string, number>();
  rows.forEach((r) => {
    const d = dateOf(r);
    if (!d) return;
    map.set(d, (map.get(d) ?? 0) + amountOf(r));
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, total]) => ({ date, total }));
};

export const monthlyTrend = (rows: SalesRow[]) => {
  const map = new Map<string, number>();
  rows.forEach((r) => {
    const d = dateOf(r);
    if (!d) return;
    const ym = d.slice(0, 7);
    map.set(ym, (map.get(ym) ?? 0) + amountOf(r));
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({ month, total }));
};

export const hourlyBreakdown = (rows: SalesRow[]) => {
  const arr = Array.from({ length: 24 }, (_, h) => ({ hour: h, label: `${h}시`, total: 0, count: 0 }));
  rows.forEach((r) => {
    const h = hourOf(r);
    if (h == null) return;
    arr[h].total += amountOf(r);
    arr[h].count += 1;
  });
  return arr;
};

export const weekdayBreakdown = (rows: SalesRow[]) => {
  const arr = WEEKDAY_LABELS.map((label, idx) => ({ idx, label, total: 0, count: 0 }));
  rows.forEach((r) => {
    const w = weekdayOf(r);
    if (w == null) return;
    arr[w].total += amountOf(r);
    arr[w].count += 1;
  });
  return arr;
};

export interface YoYResult {
  currentTotal: number;
  prevTotal: number;
  diff: number;
  growthPct: number; // 0-100
  hasPrev: boolean;
}

export const yearOverYear = (rows: SalesRow[], referenceMonth: Date): YoYResult => {
  const curStart = format(startOfMonth(referenceMonth), 'yyyy-MM-dd');
  const curEnd = format(endOfMonth(referenceMonth), 'yyyy-MM-dd');
  const prevRef = subYears(referenceMonth, 1);
  const prevStart = format(startOfMonth(prevRef), 'yyyy-MM-dd');
  const prevEnd = format(endOfMonth(prevRef), 'yyyy-MM-dd');
  const cur = sumNet(filterByPeriod(rows, curStart, curEnd));
  const prev = sumNet(filterByPeriod(rows, prevStart, prevEnd));
  return {
    currentTotal: cur,
    prevTotal: prev,
    diff: cur - prev,
    growthPct: prev > 0 ? ((cur - prev) / prev) * 100 : 0,
    hasPrev: prev > 0,
  };
};

export const computeInsights = (rows: SalesRow[], referenceMonth: Date): string[] => {
  const insights: string[] = [];
  if (rows.length === 0) return insights;

  const yoy = yearOverYear(rows, referenceMonth);
  if (yoy.hasPrev) {
    const dir = yoy.growthPct >= 0 ? '증가' : '감소';
    insights.push(`이번달 매출은 전년 동일월 대비 ${Math.abs(yoy.growthPct).toFixed(1)}% ${dir}했습니다.`);
  }

  const hourly = hourlyBreakdown(rows).filter((h) => h.total > 0);
  if (hourly.length > 0) {
    const peak = [...hourly].sort((a, b) => b.total - a.total)[0];
    insights.push(`가장 매출이 높은 시간대는 ${peak.label}입니다.`);
    const eveningTotal = hourly.filter((h) => h.hour >= 17 && h.hour <= 21).reduce((s, h) => s + h.total, 0);
    const total = hourly.reduce((s, h) => s + h.total, 0);
    if (total > 0) {
      const pct = (eveningTotal / total) * 100;
      if (pct > 25) insights.push(`저녁 피크 시간대(17~21시) 매출 비중이 전체의 ${pct.toFixed(0)}%입니다.`);
    }
  }

  const wd = weekdayBreakdown(rows).filter((w) => w.total > 0);
  if (wd.length >= 2) {
    const best = [...wd].sort((a, b) => b.total - a.total)[0];
    const worst = [...wd].sort((a, b) => a.total - b.total)[0];
    insights.push(`${best.label}요일 매출이 가장 높고, ${worst.label}요일 매출이 가장 낮습니다.`);
    const weekend = wd.filter((w) => w.idx >= 5).reduce((s, w) => s + w.total, 0);
    const weekday = wd.filter((w) => w.idx < 5).reduce((s, w) => s + w.total, 0);
    if (weekday > 0 && weekend > 0) {
      const ratio = (weekend / (weekend + weekday)) * 100;
      insights.push(`주말 매출 비중은 전체의 ${ratio.toFixed(0)}%입니다.`);
    }
  }

  const alcoholTotal = rows.reduce((s, r) => s + Number(r.alcohol_sales ?? 0), 0);
  if (alcoholTotal > 0) {
    const total = sumNet(rows);
    if (total > 0) insights.push(`주류 매출 비중은 전체의 ${((alcoholTotal / total) * 100).toFixed(1)}%입니다.`);
  }

  return insights;
};

export const periodPresets = (today = new Date()) => {
  const f = (d: Date) => format(d, 'yyyy-MM-dd');
  const start = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const monday = (d: Date) => {
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff);
  };
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
  return {
    today: { from: f(today), to: f(today), label: '오늘' },
    thisWeek: { from: f(monday(today)), to: f(today), label: '이번 주' },
    thisMonth: { from: f(monthStart), to: f(monthEnd), label: '이번 달' },
    lastMonth: { from: f(lastMonthStart), to: f(lastMonthEnd), label: '지난 달' },
    thisYear: { from: f(new Date(today.getFullYear(), 0, 1)), to: f(new Date(today.getFullYear(), 11, 31)), label: '올해' },
  };
};
