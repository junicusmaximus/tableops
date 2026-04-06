import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { useIsManager } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Brain, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle,
  Users, ClipboardCheck, ShoppingCart, Loader2, Sparkles, ChevronRight,
  Calendar, BarChart3, AlertCircle, Lightbulb, FileText, Clock,
  Package, UserX, RefreshCw,
} from 'lucide-react';

interface ReportSection {
  title: string;
  summary: string;
  highlights?: string[];
  issues?: string[];
  trend?: string;
  change_percent?: number;
  completion_rate?: string;
  urgent_items?: string[];
  items?: Array<{ level: string; message: string; action: string; link?: string }> |
          Array<{ suggestion: string; priority: string; link?: string }>;
}

interface AIReport {
  key_summary: string;
  data_completeness?: {
    has_sales: boolean;
    has_attendance: boolean;
    has_checklists: boolean;
    has_inventory: boolean;
    missing_data_message?: string;
  };
  sections: Record<string, ReportSection>;
  raw_metrics: {
    total_sales: number;
    prev_sales: number;
    sales_change: string;
    late_count: number;
    early_leave_count: number;
    checklist_rate: string;
    low_stock_count: number;
    pending_purchases: number;
    total_staff?: number;
    absent_count?: number;
    approved_leaves?: number;
  };
  cached?: boolean;
  cached_at?: string;
}

const TrendIcon = ({ trend }: { trend?: string }) => {
  if (trend === 'up') return <TrendingUp className="w-4 h-4 text-primary" />;
  if (trend === 'down') return <TrendingDown className="w-4 h-4 text-destructive" />;
  return <Minus className="w-4 h-4 text-muted-foreground" />;
};

const LevelBadge = ({ level }: { level: string }) => {
  const variants: Record<string, string> = {
    high: 'bg-destructive/10 text-destructive border-destructive/20',
    medium: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
    low: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  };
  const labels: Record<string, string> = { high: '높음', medium: '보통', low: '낮음' };
  return <span className={`text-[10px] px-1.5 py-0.5 rounded border ${variants[level] || variants.low}`}>{labels[level] || level}</span>;
};

const MetricCard = ({ icon: Icon, value, label, sub }: { icon: any; value: string; label: string; sub?: string }) => (
  <Card className="glass-card">
    <CardContent className="pt-4 pb-3 text-center">
      <Icon className="w-5 h-5 text-primary mx-auto mb-1" />
      <p className="text-lg font-bold font-heading">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      {sub && <p className="text-[10px] text-primary mt-0.5">{sub}</p>}
    </CardContent>
  </Card>
);

const SectionCard = ({ section, icon: Icon, linkTo, linkLabel }: {
  section: ReportSection;
  icon: any;
  linkTo: string;
  linkLabel: string;
}) => (
  <Card className="glass-card">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        {section.title}
        {section.trend && <TrendIcon trend={section.trend} />}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      <p className="text-sm text-muted-foreground">{section.summary}</p>
      {section.highlights?.map((h, i) => (
        <div key={i} className="flex items-start gap-2 text-sm">
          <CheckCircle className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
          <span>{h}</span>
        </div>
      ))}
      {section.issues?.map((issue, i) => (
        <div key={i} className="flex items-start gap-2 text-sm text-destructive">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{issue}</span>
        </div>
      ))}
      {section.urgent_items && section.urgent_items.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {section.urgent_items.map((item, i) => (
            <Badge key={i} variant="destructive" className="text-xs">{item}</Badge>
          ))}
        </div>
      )}
      <Button variant="ghost" size="sm" className="w-full mt-2" asChild>
        <Link to={linkTo}>{linkLabel} <ChevronRight className="w-3 h-3 ml-1" /></Link>
      </Button>
    </CardContent>
  </Card>
);

const AIStoreReport = () => {
  const { data: profile } = useEmployeeProfile();
  const isManager = useIsManager();
  const [reportType, setReportType] = useState('daily');
  const [report, setReport] = useState<AIReport | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isManager) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <AlertTriangle className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-lg font-semibold">관리자 직급 이상부터 사용 가능한 영역입니다</p>
      </div>
    );
  }

  const handleGenerate = async (forceRegenerate = false) => {
    if (!profile?.store_id) {
      toast.error('매장 정보를 불러올 수 없습니다');
      return;
    }
    setLoading(true);
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke('ai-store-report', {
        body: {
          store_id: profile.store_id,
          report_type: reportType,
          force_regenerate: forceRegenerate,
        },
      });

      if (fnError) throw fnError;
      if (result?.error) throw new Error(result.error);

      setReport(result as AIReport);
      if (result?.cached) {
        toast.info('캐시된 리포트를 불러왔습니다. 새로 생성하려면 "새로 생성" 버튼을 눌러주세요.');
      }
    } catch (err: any) {
      if (err.message?.includes('데이터가 부족')) {
        toast.error('리포트를 생성할 데이터가 부족합니다.');
      } else {
        toast.error(err.message || 'AI 리포트 생성 중 문제가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  const metrics = report?.raw_metrics;

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-heading flex items-center gap-2">
          <Brain className="w-6 h-6 text-primary" />
          AI 매장 리포트
        </h1>
        <p className="text-sm text-muted-foreground mt-1">실제 운영 데이터 기반 AI 종합 분석 리포트</p>
      </div>

      {/* Report type selector + generate */}
      <Card className="glass-card">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex gap-2">
              {[
                { value: 'daily', label: '오늘', icon: Calendar },
                { value: 'weekly', label: '주간', icon: BarChart3 },
                { value: 'monthly', label: '월간', icon: FileText },
              ].map((opt) => (
                <Button
                  key={opt.value}
                  variant={reportType === opt.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setReportType(opt.value); setReport(null); }}
                >
                  <opt.icon className="w-3.5 h-3.5 mr-1" />
                  {opt.label}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              {report && (
                <Button variant="outline" size="sm" onClick={() => handleGenerate(true)} disabled={loading}>
                  <RefreshCw className="w-3.5 h-3.5 mr-1" />
                  새로 생성
                </Button>
              )}
              <Button onClick={() => handleGenerate(false)} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
                {report ? '리포트 보기' : '리포트 생성'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <Card className="py-16 glass-card">
          <CardContent className="flex flex-col items-center text-center">
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Brain className="w-8 h-8 text-primary animate-pulse" />
              </div>
              <Loader2 className="w-6 h-6 text-primary animate-spin absolute -top-1 -right-1" />
            </div>
            <h3 className="text-lg font-semibold font-heading mb-2">AI가 매장 데이터를 분석 중입니다</h3>
            <p className="text-sm text-muted-foreground">매출, 인력, 체크리스트, 재고 데이터를 수집하고 분석하고 있습니다...</p>
            <div className="flex gap-2 mt-4 flex-wrap justify-center">
              {['매출 데이터 수집', '출근 기록 분석', '체크리스트 확인', '재고 상태 점검', 'AI 분석 중'].map((step, i) => (
                <Badge key={i} variant="secondary" className="text-xs animate-pulse" style={{ animationDelay: `${i * 0.3}s` }}>
                  {step}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report result */}
      {!loading && report && (
        <div className="space-y-4">
          {/* Cached indicator */}
          {report.cached && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
              <Clock className="w-3.5 h-3.5" />
              캐시된 리포트 · {report.cached_at ? new Date(report.cached_at).toLocaleString('ko-KR') : ''}
              <Button variant="link" size="sm" className="h-auto p-0 text-xs ml-auto" onClick={() => handleGenerate(true)}>
                새로 생성
              </Button>
            </div>
          )}

          {/* Data completeness warning */}
          {report.data_completeness?.missing_data_message && (
            <Card className="border-yellow-500/20 bg-yellow-500/5">
              <CardContent className="py-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
                <p className="text-sm text-yellow-700">{report.data_completeness.missing_data_message}</p>
              </CardContent>
            </Card>
          )}

          {/* Key summary */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                핵심 요약
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{report.key_summary}</p>
            </CardContent>
          </Card>

          {/* Metric cards */}
          {metrics && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <MetricCard
                icon={TrendingUp}
                value={`${metrics.total_sales.toLocaleString()}원`}
                label="매출"
                sub={metrics.sales_change !== 'N/A' ? `전기 대비 ${metrics.sales_change}%` : undefined}
              />
              <MetricCard icon={Users} value={`${metrics.total_staff ?? '-'}명`} label="총 직원" />
              <MetricCard icon={AlertTriangle} value={`${metrics.late_count}건`} label="지각" />
              <MetricCard icon={UserX} value={`${metrics.absent_count ?? 0}명`} label="결근" />
              <MetricCard
                icon={ClipboardCheck}
                value={`${metrics.checklist_rate}%`}
                label="체크리스트 완료율"
              />
              <MetricCard icon={Package} value={`${metrics.low_stock_count}건`} label="재고 부족" />
            </div>
          )}

          {/* Sections grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {report.sections.sales && (
              <SectionCard section={report.sections.sales} icon={TrendingUp} linkTo="/sales" linkLabel="매출 관리 보기" />
            )}
            {report.sections.staffing && (
              <SectionCard section={report.sections.staffing} icon={Users} linkTo="/schedule-management" linkLabel="스케줄 관리" />
            )}
            {report.sections.checklist && (
              <SectionCard section={report.sections.checklist} icon={ClipboardCheck} linkTo="/checklists" linkLabel="체크리스트 보기" />
            )}
            {report.sections.inventory && (
              <SectionCard section={report.sections.inventory} icon={ShoppingCart} linkTo="/purchase-orders" linkLabel="발주/입고" />
            )}
          </div>

          {/* Risks */}
          {report.sections.risks && (report.sections.risks as any).items?.length > 0 && (
            <Card className="border-destructive/20 glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-heading flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  {report.sections.risks.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {((report.sections.risks as any).items as Array<{ level: string; message: string; action: string; link?: string }>).map((item, i) => (
                  <div key={i} className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <LevelBadge level={item.level} />
                        <p className="text-sm font-medium">{item.message}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{item.action}</p>
                    </div>
                    {item.link && (
                      <Button variant="ghost" size="sm" asChild className="shrink-0">
                        <Link to={item.link}>확인 <ChevronRight className="w-3 h-3 ml-1" /></Link>
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Suggestions */}
          {report.sections.suggestions && (report.sections.suggestions as any).items?.length > 0 && (
            <Card className="border-primary/20 glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-heading flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-primary" />
                  {report.sections.suggestions.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {((report.sections.suggestions as any).items as Array<{ suggestion: string; priority: string; link?: string }>).map((item, i) => (
                  <div key={i} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <LevelBadge level={item.priority} />
                      </div>
                      <p className="text-sm">{item.suggestion}</p>
                    </div>
                    {item.link && (
                      <Button variant="ghost" size="sm" asChild className="shrink-0">
                        <Link to={item.link}>이동 <ChevronRight className="w-3 h-3 ml-1" /></Link>
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && !report && (
        <Card className="py-16 glass-card">
          <CardContent className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Brain className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold font-heading mb-2">AI 리포트를 생성해보세요</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              실제 매출, 출근, 체크리스트, 재고 데이터를 수집하고 분석하여<br />
              매장 운영 현황과 구체적인 개선 제안을 제공합니다
            </p>
            <Button className="mt-6" onClick={() => handleGenerate(false)}>
              <Sparkles className="w-4 h-4 mr-2" />
              첫 리포트 생성하기
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIStoreReport;
