import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import RoleBadge from '@/components/common/RoleBadge';
import { Clock, Calendar, AlertTriangle, TrendingUp, Users, User } from 'lucide-react';
import { useMyWorkStats, useTeamWorkStats } from '@/hooks/useWorkStats';
import { useIsManager } from '@/hooks/useUserRole';

const StatCard = ({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string | number; sub?: string; color?: string }) => (
  <Card>
    <CardContent className="pt-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color ?? 'bg-primary/10 text-primary'}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
          {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
        </div>
      </div>
    </CardContent>
  </Card>
);

const WorkStats = () => {
  const { data: myStats, isLoading: myLoading } = useMyWorkStats();
  const { data: teamStats = [], isLoading: teamLoading } = useTeamWorkStats();
  const isManager = useIsManager();

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">근무 통계</h1>
        <p className="text-muted-foreground text-sm mt-1">근무시간, 출근일수, 지각 현황을 확인합니다</p>
      </div>

      <Tabs defaultValue="my" className="w-full">
        <TabsList className={`grid w-full ${isManager ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <TabsTrigger value="my" className="gap-1.5">
            <User className="w-4 h-4" />내 통계
          </TabsTrigger>
          {isManager && (
            <TabsTrigger value="team" className="gap-1.5">
              <Users className="w-4 h-4" />팀 통계
            </TabsTrigger>
          )}
        </TabsList>

        {/* My Stats */}
        <TabsContent value="my" className="space-y-4 mt-4">
          {myLoading ? (
            <div className="text-center py-8 text-sm text-muted-foreground">로딩 중...</div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                  icon={Clock}
                  label="이번주 근무시간"
                  value={`${(myStats?.weeklyHours ?? 0).toFixed(1)}h`}
                  color="bg-primary/10 text-primary"
                />
                <StatCard
                  icon={TrendingUp}
                  label="이번달 근무시간"
                  value={`${(myStats?.monthlyHours ?? 0).toFixed(1)}h`}
                  color="bg-success/10 text-success"
                />
                <StatCard
                  icon={Calendar}
                  label="출근 일수"
                  value={`${myStats?.attendanceDays ?? 0}일`}
                  color="bg-info/10 text-info"
                />
                <StatCard
                  icon={AlertTriangle}
                  label="지각 횟수"
                  value={`${myStats?.lateDays ?? 0}회`}
                  sub={myStats?.earlyLeaveDays ? `조퇴 ${myStats.earlyLeaveDays}회` : undefined}
                  color="bg-warning/10 text-warning"
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">월간 요약</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      ['이번주 근무시간', `${(myStats?.weeklyHours ?? 0).toFixed(1)}시간`],
                      ['이번달 근무시간', `${(myStats?.monthlyHours ?? 0).toFixed(1)}시간`],
                      ['이번달 출근일수', `${myStats?.attendanceDays ?? 0}일`],
                      ['이번달 지각', `${myStats?.lateDays ?? 0}회`],
                      ['이번달 조퇴', `${myStats?.earlyLeaveDays ?? 0}회`],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between items-center py-1.5 border-b border-border last:border-0">
                        <span className="text-sm text-muted-foreground">{label}</span>
                        <span className="text-sm font-semibold">{value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Team Stats */}
        {isManager && (
          <TabsContent value="team" className="space-y-4 mt-4">
            {teamLoading ? (
              <div className="text-center py-8 text-sm text-muted-foreground">로딩 중...</div>
            ) : teamStats.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">팀원 데이터가 없습니다</div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">팀원 근무 현황</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>이름</TableHead>
                          <TableHead>직급</TableHead>
                          <TableHead className="text-right">주간(h)</TableHead>
                          <TableHead className="text-right">월간(h)</TableHead>
                          <TableHead className="text-right">출근일</TableHead>
                          <TableHead className="text-right">지각</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teamStats.map((member) => (
                          <TableRow key={member.user_id}>
                            <TableCell className="font-medium">{member.full_name}</TableCell>
                            <TableCell><RoleBadge role={member.position} /></TableCell>
                            <TableCell className="text-right">{member.weeklyHours.toFixed(1)}</TableCell>
                            <TableCell className="text-right">{member.monthlyHours.toFixed(1)}</TableCell>
                            <TableCell className="text-right">{member.attendanceDays}</TableCell>
                            <TableCell className="text-right">
                              {member.lateDays > 0 ? (
                                <span className="text-warning font-medium">{member.lateDays}</span>
                              ) : (
                                '0'
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default WorkStats;
