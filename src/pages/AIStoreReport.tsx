import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { useIsManager } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Brain, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle,
  Users, ClipboardCheck, ShoppingCart, Loader2, Sparkles, ChevronRight,
  Calendar, BarChart3, AlertCircle, Lightbulb, RefreshCw, FileText,
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
  };
}

const TrendIcon = ({ trend }: { trend?: string }) => {
  if (trend === 'up') return <TrendingUp className="w-4 h-4 text-emerald-500" />;
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

  const handleGenerate = async () => {
    if (!profile?.store_id) {
      toast.error('매장 정보를 불러올 수 없습니다');
      return;
    }
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-store-report`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            store_id: profile.store_id,
            report_type: reportType,
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed');
      }

      const data: AIReport = await response.json();
      setReport(data);
    } catch (err: any) {
      toast.error(err.message || 'AI 리포트 생성에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const metrics = report?.raw_metrics;

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="w-6 h-6 text-primary" />
          AI 매장 리포트
        </h1>
        <p className="text-sm text-muted-foreground mt-1">AI가 매장 운영 데이터를 분석하여 종합 리포트를 제공합니다</p>
      </div>

      {/* Report type selector + generate */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex gap-2">
              {[
                { value: 'daily', label: '오늘 리포트', icon: Calendar },
                { value: 'weekly', label: '주간 리포트', icon: BarChart3 },
                { value: 'monthly', label: '월간 리포트', icon: FileText },
              ].map((opt) => (
                <Button
                  key={opt.value}
                  variant={reportType === opt.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setReportType(opt.value)}
                >
                  <opt.icon className="w-3.5 h-3.5 mr-1" />
                  {opt.label}
                </Button>
              ))}
            </div>
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
              {report ? '다시 생성' : '리포트 생성'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <Card className="py-16">
          <CardContent className="flex flex-col items-center text-center">
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Brain className="w-8 h-8 text-primary animate-pulse" />
              </div>
              <Loader2 className="w-6 h-6 text-primary animate-spin absolute -top-1 -right-1" />
            </div>
            <h3 className="text-lg font-semibold mb-2">AI가 매장 데이터를 분석 중입니다</h3>
            <p className="text-sm text-muted-foreground">매출, 인력, 체크리스트, 재고 데이터를 종합 분석하고 있습니다...</p>
          </CardContent>
        </Card>
      )}

      {/* Report result */}
      {!loading && report && (
        <div className="space-y-4">
          {/* Key summary */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card>
                <CardContent className="pt-4 pb-3 text-center">
                  <TrendingUp className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-lg font-bold">{metrics.total_sales.toLocaleString()}원</p>
                  <p className="text-[10px] text-muted-foreground">
                    매출 {metrics.sales_change !== 'N/A' ? `${metrics.sales_change}%` : '-'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3 text-center">
                  <Users className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-lg font-bold">{metrics.late_count}건</p>
                  <p className="text-[10px] text-muted-foreground">지각</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3 text-center">
                  <ClipboardCheck className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-lg font-bold">{metrics.checklist_rate}%</p>
                  <p className="text-[10px] text-muted-foreground">체크리스트 완료율</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3 text-center">
                  <ShoppingCart className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-lg font-bold">{metrics.low_stock_count}건</p>
                  <p className="text-[10px] text-muted-foreground">재고 부족</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Sections */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Sales */}
            {report.sections.sales && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendIcon trend={report.sections.sales.trend} />
                    {report.sections.sales.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">{report.sections.sales.summary}</p>
                  {report.sections.sales.highlights?.map((h, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" className="w-full mt-2" asChild>
                    <Link to="/sales">매출 관리 보기 <ChevronRight className="w-3 h-3 ml-1" /></Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Staffing */}
            {report.sections.staffing && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    {report.sections.staffing.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">{report.sections.staffing.summary}</p>
                  {report.sections.staffing.highlights?.map((h, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                  {(report.sections.staffing as any).issues?.map((issue: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-destructive">
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>{issue}</span>
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" className="w-full mt-2" asChild>
                    <Link to="/schedule-management">스케줄 관리 <ChevronRight className="w-3 h-3 ml-1" /></Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Checklist */}
            {report.sections.checklist && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4 text-primary" />
                    {report.sections.checklist.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">{report.sections.checklist.summary}</p>
                  {report.sections.checklist.highlights?.map((h, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" className="w-full mt-2" asChild>
                    <Link to="/checklists">체크리스트 보기 <ChevronRight className="w-3 h-3 ml-1" /></Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Inventory */}
            {report.sections.inventory && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-primary" />
                    {report.sections.inventory.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">{report.sections.inventory.summary}</p>
                  {report.sections.inventory.highlights?.map((h, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                  {report.sections.inventory.urgent_items && report.sections.inventory.urgent_items.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {report.sections.inventory.urgent_items.map((item, i) => (
                        <Badge key={i} variant="destructive" className="text-xs">{item}</Badge>
                      ))}
                    </div>
                  )}
                  <Button variant="ghost" size="sm" className="w-full mt-2" asChild>
                    <Link to="/purchase-orders">발주/입고 <ChevronRight className="w-3 h-3 ml-1" /></Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Risks */}
          {report.sections.risks && (report.sections.risks as any).items?.length > 0 && (
            <Card className="border-destructive/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
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
            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
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
        <Card className="py-16">
          <CardContent className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Brain className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">AI 리포트를 생성해보세요</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              매출, 인력, 체크리스트, 재고 데이터를 종합 분석하여<br />
              매장 운영 현황과 개선 제안을 제공합니다
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIStoreReport;
