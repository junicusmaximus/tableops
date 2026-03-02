import {
  Users, Clock, TrendingUp, AlertTriangle, ClipboardCheck,
  FileText, MessageSquare, Calendar, ShoppingCart, Coffee
} from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatusBadge from '@/components/common/StatusBadge';
import { Progress } from '@/components/ui/progress';

const demoAlerts = [
  { id: 1, text: '닭가슴살 유통기한 임박 (D-1)', type: 'destructive' as const },
  { id: 2, text: '김민수 님 퇴근 미체크', type: 'warning' as const },
  { id: 3, text: '마감 보고서 미제출 (강남점)', type: 'warning' as const },
  { id: 4, text: 'VIP 고객 방문 예정 (14:00)', type: 'info' as const },
];

const demoTasks = [
  { id: 1, name: '오픈 체크리스트', progress: 80, status: '진행중' },
  { id: 2, name: '마감 체크리스트', progress: 0, status: '대기' },
  { id: 3, name: '식재료 점검', progress: 60, status: '진행중' },
];

const Dashboard = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">대시보드</h1>
        <p className="text-muted-foreground text-sm mt-1">강남본점 · 2026년 3월 2일 월요일</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="오늘 근무 인원"
          value="8 / 12"
          subtitle="현재 출근 8명"
          icon={Users}
          variant="default"
        />
        <StatCard
          title="오늘 매출"
          value="₩1,840,000"
          subtitle="목표 ₩2,500,000"
          icon={TrendingUp}
          trend={{ value: 12.5, label: '전일 대비' }}
          variant="success"
        />
        <StatCard
          title="미완료 체크리스트"
          value={3}
          subtitle="오픈 2건, 마감 1건"
          icon={ClipboardCheck}
          variant="warning"
        />
        <StatCard
          title="유통기한 임박"
          value={5}
          subtitle="D-3 이내 식재료"
          icon={AlertTriangle}
          variant="destructive"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* 매출 목표 달성률 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">매출 목표 달성률</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">일일 목표</span>
                  <span className="font-semibold">73.6%</span>
                </div>
                <Progress value={73.6} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>₩1,840,000</span>
                  <span>₩2,500,000</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">월간 목표</span>
                  <span className="font-semibold">8.2%</span>
                </div>
                <Progress value={8.2} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>₩5,320,000</span>
                  <span>₩65,000,000</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 알림 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">주요 알림</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {demoAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-2">
                  <StatusBadge status={alert.type} label={alert.type === 'destructive' ? '긴급' : alert.type === 'warning' ? '주의' : '정보'} />
                  <span className="text-sm">{alert.text}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* 체크리스트 진행 현황 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">체크리스트 현황</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {demoTasks.map((task) => (
              <div key={task.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{task.name}</span>
                  <span className="text-muted-foreground">{task.progress}%</span>
                </div>
                <Progress value={task.progress} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 출근 현황 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">출근 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { name: '김민수', role: '홀 매니저', status: '출근', time: '08:55' },
                { name: '이지은', role: '주방장', status: '출근', time: '09:00' },
                { name: '박서준', role: '홀 직원', status: '지각', time: '09:15' },
                { name: '최유나', role: '주방 직원', status: '미출근', time: '-' },
              ].map((emp, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{emp.name}</p>
                    <p className="text-xs text-muted-foreground">{emp.role}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{emp.time}</span>
                    <StatusBadge
                      status={emp.status === '출근' ? 'success' : emp.status === '지각' ? 'warning' : 'destructive'}
                      label={emp.status}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 최근 활동 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">최근 활동</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { icon: Clock, text: '김민수 님이 출근했습니다', time: '08:55' },
                { icon: ClipboardCheck, text: '오픈 체크리스트 시작됨', time: '09:00' },
                { icon: ShoppingCart, text: '식재료 발주 입고 확인', time: '09:30' },
                { icon: MessageSquare, text: '강남점 채팅방에 새 메시지', time: '09:45' },
                { icon: Coffee, text: 'VIP 고객 방문 예약 등록', time: '10:00' },
              ].map((activity, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-muted shrink-0">
                    <activity.icon className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{activity.text}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
