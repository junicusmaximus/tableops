import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User, Shield, Bell, Palette } from 'lucide-react';

const AdminSettings = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">설정</h1>
        <p className="text-muted-foreground text-sm mt-1">계정 및 시스템 설정</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="w-4 h-4" />계정 정보</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">이메일</span>
              <span className="text-sm">{user?.email || '-'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">역할</span>
              <span className="text-sm">매장 관리자</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-muted-foreground">소속 매장</span>
              <span className="text-sm">강남본점</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bell className="w-4 h-4" />알림 설정</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">알림 설정 기능이 곧 추가됩니다.</p>
        </CardContent>
      </Card>

      <Button variant="destructive" className="w-full" onClick={signOut}>
        <LogOut className="w-4 h-4 mr-2" />로그아웃
      </Button>
    </div>
  );
};

export default AdminSettings;
