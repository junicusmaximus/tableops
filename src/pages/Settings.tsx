import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Settings as SettingsIcon, Store, Plug, Info, ShieldAlert, Bell, CalendarDays, ClipboardCheck, FileText, Megaphone, User } from 'lucide-react';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { useIsManager } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { useNotificationPreferences, useUpdateNotificationPreferences, type NotifPrefField } from '@/hooks/useNotificationPreferences';
import ProfileSettings from '@/components/profile/ProfileSettings';

const Settings = () => {
  const { data: profile } = useEmployeeProfile();
  const isManager = useIsManager();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const { data: notifPrefs } = useNotificationPreferences();
  const updatePrefs = useUpdateNotificationPreferences();

  const pref = (field: NotifPrefField) => notifPrefs?.[field] ?? true;
  const enableAll = pref('enable_all');

  const handleToggle = (field: NotifPrefField, value: boolean) => {
    updatePrefs.mutate(
      { [field]: value },
      {
        onSuccess: () => toast({ title: '저장 완료', description: '알림 설정이 변경되었습니다.' }),
        onError: (e) => toast({ title: '오류', description: e.message, variant: 'destructive' }),
      }
    );
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast({ title: '저장 완료', description: '매장 정보가 저장되었습니다.' });
    }, 800);
  };

  const handleTestConnection = (name: string) => {
    toast({ title: '연결 테스트', description: `${name} 연동은 현재 MVP 버전에서 지원되지 않습니다. 추후 업데이트에서 지원 예정입니다.` });
  };

  const ToggleRow = ({ field, label, description, disabled, managerOnly }: {
    field: NotifPrefField;
    label: string;
    description: string;
    disabled?: boolean;
    managerOnly?: boolean;
  }) => {
    if (managerOnly && !isManager) return null;
    return (
      <div className="flex items-center justify-between py-1">
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Switch
          checked={pref(field)}
          onCheckedChange={(v) => handleToggle(field, v)}
          disabled={disabled || !enableAll}
        />
      </div>
    );
  };

  const SectionHeader = ({ icon: Icon, title }: { icon: React.ElementType; title: string }) => (
    <div className="flex items-center gap-2 pt-2 pb-1">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</span>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">설정</h1>
        <p className="text-muted-foreground text-sm mt-1">시스템 및 연동 관리</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="flex-wrap">
          <TabsTrigger value="profile"><User className="w-4 h-4 mr-1" />프로필</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="w-4 h-4 mr-1" />알림</TabsTrigger>
          <TabsTrigger value="branch"><Store className="w-4 h-4 mr-1" />매장</TabsTrigger>
          <TabsTrigger value="integrations"><Plug className="w-4 h-4 mr-1" />연동</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <ProfileSettings />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">알림 설정</CardTitle>
              <CardDescription>알림 수신 여부를 카테고리별로 설정합니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Master toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">전체 알림 받기</p>
                  <p className="text-xs text-muted-foreground">모든 알림을 켜거나 끕니다</p>
                </div>
                <Switch
                  checked={enableAll}
                  onCheckedChange={(v) => handleToggle('enable_all', v)}
                />
              </div>

              <Separator />

              {/* Leave */}
              <SectionHeader icon={Bell} title="휴가" />
              <ToggleRow
                field="enable_leave_request"
                label="휴가 신청 알림 받기"
                description="직원이 휴가를 신청하면 알림을 받습니다"
                managerOnly
              />
              <ToggleRow
                field="enable_leave_result"
                label="휴가 승인/반려 결과 알림 받기"
                description="내 휴가 신청 결과를 알림으로 받습니다"
              />

              <Separator />

              {/* Schedule */}
              <SectionHeader icon={CalendarDays} title="스케줄" />
              <ToggleRow
                field="enable_schedule_new"
                label="새 스케줄 등록 알림 받기"
                description="내 스케줄이 새로 등록되면 알림을 받습니다"
              />
              <ToggleRow
                field="enable_schedule_change"
                label="스케줄 변경 알림 받기"
                description="내 스케줄이 변경되면 알림을 받습니다"
              />

              <Separator />

              {/* Operations */}
              <SectionHeader icon={ClipboardCheck} title="운영" />
              <ToggleRow
                field="enable_checklist"
                label="체크리스트 알림 받기"
                description="체크리스트 관련 알림을 받습니다"
                managerOnly
              />
              <ToggleRow
                field="enable_inventory"
                label="재고 / 발주 알림 받기"
                description="재고 부족, 발주 관련 알림을 받습니다"
                managerOnly
              />

              <Separator />

              {/* Documents */}
              <SectionHeader icon={FileText} title="서류" />
              <ToggleRow
                field="enable_document_sign"
                label="서류 서명 요청 알림 받기"
                description="서명이 필요한 서류가 있을 때 알림을 받습니다"
              />

              <Separator />

              {/* Announcements */}
              <SectionHeader icon={Megaphone} title="공지" />
              <ToggleRow
                field="enable_announcement"
                label="공지사항 알림 받기"
                description="새 공지사항이 등록되면 알림을 받습니다"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branch" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">매장 정보</CardTitle>
              <CardDescription>매장의 기본 정보를 관리합니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div><Label>매장 이름</Label><Input defaultValue={profile?.full_name ?? ''} placeholder="매장명" disabled={!isManager} /></div>
              <div><Label>주소</Label><Input placeholder="매장 주소" disabled={!isManager} /></div>
              <div><Label>전화번호</Label><Input placeholder="02-0000-0000" disabled={!isManager} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>영업 시작</Label><Input type="time" defaultValue="11:00" disabled={!isManager} /></div>
                <div><Label>영업 종료</Label><Input type="time" defaultValue="22:00" disabled={!isManager} /></div>
              </div>
              {isManager && <Button className="w-full" onClick={handleSave} disabled={saving}>{saving ? '저장 중...' : '저장'}</Button>}
              {!isManager && <p className="text-xs text-muted-foreground text-center">매니저 이상 권한이 필요합니다.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4 mt-4">
          {!isManager ? (
            <Card>
              <CardContent className="py-16 text-center">
                <ShieldAlert className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                <p className="text-base font-medium text-foreground">관리자 직급 이상부터 사용 가능한 영역입니다.</p>
                <p className="text-sm text-muted-foreground mt-2">대표, 사장님, 매니저 권한이 필요합니다.</p>
              </CardContent>
            </Card>
          ) : (
            [
              { name: 'POS 연동', desc: 'POS 시스템과 매출 데이터를 자동으로 동기화합니다', provider: 'POS 제공업체' },
              { name: 'VAN 연동', desc: 'VAN 사를 통해 카드 승인 내역을 자동으로 가져옵니다', provider: 'VAN 제공업체' },
              { name: '예약 플랫폼 연동', desc: '캐치테이블 등 외부 예약 플랫폼과 연동합니다', provider: '예약 플랫폼' },
            ].map((integration) => (
              <Card key={integration.name}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{integration.name}</CardTitle>
                    <Badge variant="outline" className="text-xs">미연동</Badge>
                  </div>
                  <CardDescription>{integration.desc}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div><Label>{integration.provider} 이름</Label><Input placeholder="예: 키오스크 프로" disabled /></div>
                  <div><Label>API Base URL</Label><Input placeholder="https://api.example.com" disabled /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>API Key</Label><Input placeholder="sk_..." disabled /></div>
                    <div><Label>Secret Key</Label><Input type="password" placeholder="••••" disabled /></div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => handleTestConnection(integration.name)}>연결 테스트</Button>
                  </div>
                  <div className="p-3 bg-muted rounded-lg flex items-start gap-2">
                    <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      현재 MVP 버전에서는 수동 입력 및 CSV 업로드를 지원합니다. API 연동은 추후 업데이트에서 지원됩니다.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
