import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ShieldAlert } from 'lucide-react';
import { useCompanySettings, useUpsertCompanySettings } from '@/hooks/useCompanySettings';
import { useSalesPermissions } from '@/hooks/useSalesPermissions';
import { toast } from 'sonner';

const SalesAccessSettings = () => {
  const perms = useSalesPermissions();
  const { data: settings } = useCompanySettings();
  const upsert = useUpsertCompanySettings();

  if (!perms.canManageSettings) {
    return (
      <Card><CardContent className="py-16 text-center">
        <ShieldAlert className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
        <p className="text-base font-medium">대표 권한이 필요합니다.</p>
        <p className="text-sm text-muted-foreground mt-2">매출 데이터 접근 권한 설정은 대표만 변경할 수 있습니다.</p>
      </CardContent></Card>
    );
  }

  const update = (patch: any) => {
    upsert.mutate(patch, {
      onSuccess: () => toast.success('권한 설정이 저장되었습니다.'),
      onError: (e: any) => toast.error(e.message ?? '저장 실패'),
    });
  };

  const Row = ({ field, label, desc }: { field: string; label: string; desc: string }) => (
    <div className="flex items-center justify-between py-2">
      <div className="flex-1 pr-3">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch
        checked={(settings as any)?.[field] ?? (field === 'allow_manager_sales_access')}
        onCheckedChange={(v) => update({ [field]: v })}
      />
    </div>
  );

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">매출 데이터 접근 권한</h1>
        <p className="text-muted-foreground text-sm mt-1">대표만 변경할 수 있는 매출 데이터 권한 설정입니다.</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">매니저 권한 제어</CardTitle>
          <CardDescription>대표/사장님은 항상 매출 데이터를 조회할 수 있습니다. 정직원/파트타이머는 항상 접근이 차단됩니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <Row field="allow_manager_sales_access" label="매니저 매출 분석 접근 허용" desc="OFF 시 매니저는 매출 분석 페이지에 접근할 수 없습니다." />
          <Separator />
          <Row field="allow_manager_sales_detail_access" label="매니저 매출 상세 데이터 접근 허용" desc="거래 단위 상세 데이터 열람 권한을 부여합니다." />
          <Separator />
          <Row field="allow_manager_branch_comparison" label="매니저 지점별 매출 비교 접근 허용" desc="여러 지점의 매출을 비교하는 화면을 매니저에게도 노출합니다." />
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesAccessSettings;
