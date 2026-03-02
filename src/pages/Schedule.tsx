import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';

const days = ['월', '화', '수', '목', '금', '토', '일'];
const demoSchedule = [
  { name: '김민수', role: '홀 매니저', shifts: ['오픈', '오픈', '오픈', '휴무', '오픈', '오픈', '휴무'] },
  { name: '이지은', role: '주방장', shifts: ['오픈', '오픈', '미들', '오픈', '휴무', '오픈', '오픈'] },
  { name: '박서준', role: '홀 직원', shifts: ['미들', '휴무', '오픈', '오픈', '미들', '휴무', '마감'] },
  { name: '최유나', role: '주방 직원', shifts: ['마감', '마감', '휴무', '마감', '마감', '오픈', '휴무'] },
  { name: '정하늘', role: '홀 직원', shifts: ['휴무', '미들', '마감', '미들', '오픈', '마감', '오픈'] },
  { name: '한소영', role: '캐셔', shifts: ['미들', '오픈', '미들', '휴무', '마감', '미들', '마감'] },
];

const shiftColors: Record<string, string> = {
  '오픈': 'bg-primary/10 text-primary',
  '미들': 'bg-info/10 text-info',
  '마감': 'bg-accent/10 text-accent',
  '휴무': 'bg-muted text-muted-foreground',
};

const Schedule = () => {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">스케줄 관리</h1>
          <p className="text-muted-foreground text-sm mt-1">주간 근무 스케줄</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          스케줄 추가
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon"><ChevronLeft className="w-4 h-4" /></Button>
            <CardTitle className="text-base">3월 1주차 (3/2 - 3/8)</CardTitle>
            <Button variant="ghost" size="icon"><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr>
                <th className="text-left text-xs font-semibold text-muted-foreground py-2 px-2 w-32">직원</th>
                {days.map((d) => (
                  <th key={d} className="text-center text-xs font-semibold text-muted-foreground py-2 px-1">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {demoSchedule.map((emp, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="py-2 px-2">
                    <p className="text-sm font-medium">{emp.name}</p>
                    <p className="text-xs text-muted-foreground">{emp.role}</p>
                  </td>
                  {emp.shifts.map((shift, j) => (
                    <td key={j} className="text-center py-2 px-1">
                      <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium ${shiftColors[shift] || ''}`}>
                        {shift}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Schedule;
