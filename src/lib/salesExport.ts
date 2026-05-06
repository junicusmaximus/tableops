import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  KRW, sumNet, dailyTrend, monthlyTrend, hourlyBreakdown, weekdayBreakdown,
  yearOverYear, computeInsights, filterByPeriod,
} from './salesAnalytics';

type Row = any;

interface ExportOptions {
  rows: Row[];
  from: string;
  to: string;
  storeLabel: string;
  stores: { id: string; name: string }[];
}

export function exportSalesExcel({ rows, from, to, storeLabel, stores }: ExportOptions) {
  const periodRows = filterByPeriod(rows, from, to);
  const wb = XLSX.utils.book_new();

  // Summary
  const yoy = yearOverYear(rows, new Date());
  const summary = [
    ['매출 분석 리포트'],
    ['기간', `${from} ~ ${to}`],
    ['매장', storeLabel],
    ['생성일시', new Date().toLocaleString('ko-KR')],
    [],
    ['항목', '값'],
    ['기간 합계', sumNet(periodRows)],
    ['거래 건수', periodRows.length],
    ['평균 일매출', Math.round(sumNet(periodRows) / (new Set(periodRows.map((r: Row) => r.business_date ?? r.date)).size || 1))],
    ['전년 동월 합계', yoy.hasPrev ? yoy.prevTotal : '데이터 없음'],
    ['이번 동월 합계', yoy.hasPrev ? yoy.currentTotal : '데이터 없음'],
    ['전년 대비 증감률(%)', yoy.hasPrev ? Number(yoy.growthPct.toFixed(2)) : '-'],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), '요약');

  // Daily
  const daily = dailyTrend(periodRows);
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([['일자', '매출'], ...daily.map((d: any) => [d.date, d.total])]),
    '일별 매출'
  );

  // Monthly
  const monthly = monthlyTrend(periodRows);
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([['월', '매출'], ...monthly.map((d: any) => [d.month, d.total])]),
    '월별 매출'
  );

  // Hourly
  const hourly = hourlyBreakdown(periodRows);
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([['시간대', '매출', '건수'], ...hourly.map((d: any) => [d.label, d.total, d.count ?? ''])]),
    '시간대별 매출'
  );

  // Weekday
  const weekday = weekdayBreakdown(periodRows);
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([['요일', '매출', '건수'], ...weekday.map((d: any) => [d.label, d.total, d.count ?? ''])]),
    '요일별 매출'
  );

  // Branch
  if (stores.length >= 2) {
    const map = new Map<string, number>();
    periodRows.forEach((r: Row) => {
      map.set(r.store_id, (map.get(r.store_id) ?? 0) + Number(r.net_sales ?? r.amount ?? 0));
    });
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([['매장', '매출'], ...stores.map((s) => [s.name, map.get(s.id) ?? 0])]),
      '매장별 매출'
    );
  }

  // Raw
  if (periodRows.length > 0) {
    const raw = periodRows.map((r: Row) => ({
      일자: r.business_date ?? r.date,
      매장ID: r.store_id,
      시간: r.sales_hour ?? '',
      결제수단: r.payment_method ?? '',
      판매채널: r.sales_channel ?? '',
      매출액: Number(r.net_sales ?? r.amount ?? 0),
      거래ID: r.transaction_id ?? '',
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(raw), '원본 데이터');
  }

  XLSX.writeFile(wb, `매출분석_${from}_${to}.xlsx`);
}

export async function exportSalesPDF(elementId: string, from: string, to: string, storeLabel: string) {
  const el = document.getElementById(elementId);
  if (!el) throw new Error('대시보드 요소를 찾을 수 없습니다.');

  const canvas = await html2canvas(el, {
    backgroundColor: getComputedStyle(document.body).backgroundColor || '#0a0a0a',
    scale: 2,
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const imgW = pageW - margin * 2;
  const imgH = (canvas.height * imgW) / canvas.width;

  // Header (use English to avoid font issues; Korean is in the rendered image)
  pdf.setFontSize(11);
  pdf.text(`Sales Report  |  ${from} ~ ${to}  |  ${storeLabel}`, margin, 8);

  let heightLeft = imgH;
  let position = 12;

  pdf.addImage(imgData, 'PNG', margin, position, imgW, imgH);
  heightLeft -= pageH - position;

  while (heightLeft > 0) {
    position = heightLeft - imgH + 12;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', margin, position, imgW, imgH);
    heightLeft -= pageH;
  }

  pdf.save(`매출분석_${from}_${to}.pdf`);
}

export { KRW };
