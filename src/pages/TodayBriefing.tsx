import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/common/StatusBadge';
import {
  AlertTriangle, Users, Coffee, ShoppingCart, Clock,
  TrendingUp, FileText, MessageSquare, ChevronRight
} from 'lucide-react';

const briefingData = {
  reservations: [
    { time: '12:00', name: '김OO', party: 4, note: '알레르기(갑각류)' },
    { time: '14:00', name: 'VIP 이OO', party: 2, note: 'VIP 고객 - 와인 사전 준비' },
    { time: '18:30', name: '박OO', party: 8, note: '영유아 동반, 하이체어 필요' },
    { time: '19:00', name: '최OO', party: 6, note: '생일 파티 - 케이크 준비' },
  ],
  expiringIngredients: [
    { name: '닭가슴살', expiry: 'D-1', qty: '2kg', status: '당일 소진' },
    { name: '생크림', expiry: 'D-2', qty: '500ml', status: '빠른 사용' },
    { name: '연어', expiry: 'D-3', qty: '1.5kg', status: '점검 필요' },
  ],
  receivingChecks: [
    { supplier: '농협유통', items: '채소류 5종', time: '10:00', status: '대기' },
    { supplier: '삼진수산', items: '해산물 3종', time: '11:00', status: '대기' },
  ],
  handoverMemo: '어제 마감 시 주방 냉장고 3번 온도 이상 감지됨. 오늘 오전 점검 필요. 홀 2번 테이블 의자 다리 흔들림 수리 요청.',
  unresolvedIssues: 2,
  salesTarget: { today: 2500000, current: 0 },
  staffing: { scheduled: 12, confirmed: 10, missing: 2 },
};

const TodayBriefing = () => {
  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">오늘의 브리핑</h1>
        <p className="text-muted-foreground text-sm mt-1">2026년 3월 2일 월요일 · 강남본점</p>
      </div>

      {/* 인력 현황 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">인력 현황</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{briefingData.staffing.scheduled}</p>
              <p className="text-xs text-muted-foreground">예정 인원</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-success">{briefingData.staffing.confirmed}</p>
              <p className="text-xs text-muted-foreground">확정 인원</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-destructive">{briefingData.staffing.missing}</p>
              <p className="text-xs text-muted-foreground">미확인</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 예약 & 고객 노트 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coffee className="w-4 h-4 text-accent" />
              <CardTitle className="text-base">오늘의 예약 · 고객 노트</CardTitle>
            </div>
            <StatusBadge status="info" label={`${briefingData.reservations.length}건`} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {briefingData.reservations.map((res, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="text-sm font-mono font-semibold text-primary shrink-0 w-12">{res.time}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{res.name}</span>
                  <span className="text-xs text-muted-foreground">{res.party}명</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{res.note}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 유통기한 임박 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <CardTitle className="text-base">유통기한 임박 식재료</CardTitle>
            </div>
            <StatusBadge status="warning" label={`${briefingData.expiringIngredients.length}건`} />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {briefingData.expiringIngredients.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">잔량: {item.qty}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge
                  status={item.expiry === 'D-1' ? 'destructive' : 'warning'}
                  label={item.expiry}
                />
                <span className="text-xs text-muted-foreground">{item.status}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 입고 확인 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-info" />
            <CardTitle className="text-base">오늘 입고 예정</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {briefingData.receivingChecks.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-medium">{item.supplier}</p>
                <p className="text-xs text-muted-foreground">{item.items} · {item.time} 예정</p>
              </div>
              <StatusBadge status="default" label={item.status} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 전일 인수인계 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-base">전일 마감 인수인계</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground leading-relaxed bg-muted/50 p-3 rounded-lg">
            {briefingData.handoverMemo}
          </p>
        </CardContent>
      </Card>

      {/* 매출 목표 / 미해결 이슈 */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <TrendingUp className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">오늘 매출 목표</p>
            <p className="text-lg font-bold mt-1">₩{briefingData.salesTarget.today.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <MessageSquare className="w-6 h-6 text-destructive mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">미해결 이슈</p>
            <p className="text-lg font-bold mt-1">{briefingData.unresolvedIssues}건</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TodayBriefing;
