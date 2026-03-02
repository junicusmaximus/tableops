import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/common/StatusBadge';
import { Clock, LogIn, LogOut, Coffee } from 'lucide-react';

const demoAttendance = [
  { id: 1, name: '김민수', role: '홀 매니저', checkIn: '08:55', checkOut: null, breaks: 0, status: '근무중', scheduled: '09:00-18:00' },
  { id: 2, name: '이지은', role: '주방장', checkIn: '09:00', checkOut: null, breaks: 1, status: '근무중', scheduled: '09:00-18:00' },
  { id: 3, name: '박서준', role: '홀 직원', checkIn: '09:15', checkOut: null, breaks: 0, status: '지각', scheduled: '09:00-15:00' },
  { id: 4, name: '최유나', role: '주방 직원', checkIn: null, checkOut: null, breaks: 0, status: '미출근', scheduled: '10:00-19:00' },
  { id: 5, name: '정하늘', role: '홀 직원', checkIn: '10:00', checkOut: '15:00', breaks: 1, status: '퇴근', scheduled: '10:00-15:00' },
  { id: 6, name: '한소영', role: '캐셔', checkIn: '11:00', checkOut: null, breaks: 0, status: '근무중', scheduled: '11:00-20:00' },
];

const Attendance = () => {
  const [selectedDate] = useState(new Date());

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">출퇴근 관리</h1>
          <p className="text-muted-foreground text-sm mt-1">오늘의 출퇴근 현황</p>
        </div>
        <Button>
          <Clock className="w-4 h-4 mr-2" />
          출근 체크
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: '전체', value: demoAttendance.length, color: 'text-foreground' },
          { label: '근무중', value: demoAttendance.filter(a => a.status === '근무중').length, color: 'text-success' },
          { label: '지각', value: demoAttendance.filter(a => a.status === '지각').length, color: 'text-warning' },
          { label: '미출근', value: demoAttendance.filter(a => a.status === '미출근').length, color: 'text-destructive' },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="pt-4 pb-3 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Attendance List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">출퇴근 기록</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {demoAttendance.map((emp) => (
            <div key={emp.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
                  {emp.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium">{emp.name}</p>
                  <p className="text-xs text-muted-foreground">{emp.role} · {emp.scheduled}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right text-xs">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <LogIn className="w-3 h-3" />
                    {emp.checkIn || '-'}
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <LogOut className="w-3 h-3" />
                    {emp.checkOut || '-'}
                  </div>
                </div>
                <StatusBadge
                  status={
                    emp.status === '근무중' ? 'success' :
                    emp.status === '지각' ? 'warning' :
                    emp.status === '미출근' ? 'destructive' :
                    'default'
                  }
                  label={emp.status}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Attendance;
