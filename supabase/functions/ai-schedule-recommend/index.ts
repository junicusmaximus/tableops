import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Time buckets covering typical restaurant hours
// Tuned for 점심/오후/저녁/마감 split
const TIME_BUCKETS = [
  { start: "10:00", end: "12:00", label: "오전 준비/오픈" },
  { start: "12:00", end: "14:00", label: "점심 피크" },
  { start: "14:00", end: "17:00", label: "오후 한산" },
  { start: "17:00", end: "19:00", label: "저녁 초입" },
  { start: "19:00", end: "21:00", label: "저녁 피크" },
  { start: "21:00", end: "22:30", label: "마감" },
];

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function bucketsForReservation(time: string): number {
  const m = timeToMinutes(time);
  for (let i = 0; i < TIME_BUCKETS.length; i++) {
    const s = timeToMinutes(TIME_BUCKETS[i].start);
    const e = timeToMinutes(TIME_BUCKETS[i].end);
    if (m >= s && m < e) return i;
  }
  return -1;
}

function classifyPeak(score: number): { level: string; label: string; bonus: number } {
  if (score >= 81) return { level: "very_high", label: "매우 높음", bonus: 3 };
  if (score >= 61) return { level: "high", label: "높음", bonus: 2 };
  if (score >= 31) return { level: "medium", label: "보통", bonus: 1 };
  return { level: "low", label: "낮음", bonus: 0 };
}

function eachDate(start: string, end: string): string[] {
  const out: string[] = [];
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    out.push(d.toISOString().split("T")[0]);
  }
  return out;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) throw new Error("Unauthorized");

    const { data: roles } = await supabase
      .from("user_store_roles")
      .select("role, store_id")
      .eq("user_id", user.id);

    const managerRoles = ["ceo", "owner", "boss", "manager"];
    const hasAccess = roles?.some(r => managerRoles.includes(r.role));
    if (!hasAccess) throw new Error("Permission denied");

    const {
      store_id,
      start_date,
      end_date,
      roles_needed,
      consider_peak,
      reflect_leave,
      include_parttime,
      max_hours_limit,
    } = await req.json();

    if (!store_id || !start_date || !end_date) throw new Error("Missing required fields");

    const baseHall = roles_needed?.hall ?? 2;
    const baseKitchen = roles_needed?.kitchen ?? 2;
    const targetDates = eachDate(start_date, end_date);

    // Fetch all relevant data
    const lookback28 = new Date(new Date(start_date).getTime() - 28 * 86400000).toISOString().split("T")[0];
    const lookback60 = new Date(new Date(start_date).getTime() - 60 * 86400000).toISOString().split("T")[0];

    const [
      { data: employees },
      { data: shifts },
      { data: attendance },
      { data: leaves },
      { data: sales },
      { data: store },
      { data: templates },
      { data: pastReservations },
      { data: targetReservations },
    ] = await Promise.all([
      supabase.from("employee_profiles").select("*").eq("store_id", store_id).eq("status", "active"),
      supabase.from("shifts").select("*").eq("store_id", store_id).gte("shift_date", lookback28).lte("shift_date", end_date).order("shift_date"),
      supabase.from("attendance_logs").select("*").eq("store_id", store_id).gte("date", lookback28),
      supabase.from("leave_requests").select("*").eq("store_id", store_id).eq("status", "approved").lte("start_date", end_date).gte("end_date", start_date),
      supabase.from("sales_records").select("*").eq("store_id", store_id).gte("date", lookback60).order("date"),
      supabase.from("stores").select("*").eq("id", store_id).single(),
      supabase.from("shift_templates").select("*").eq("store_id", store_id),
      supabase.from("reservations").select("*").eq("store_id", store_id).gte("reservation_date", lookback28).lt("reservation_date", start_date),
      supabase.from("reservations").select("*").eq("store_id", store_id).gte("reservation_date", start_date).lte("reservation_date", end_date),
    ]);

    const { data: userRoles } = await supabase
      .from("user_store_roles")
      .select("user_id, role")
      .eq("store_id", store_id);

    // ========= PEAK ANALYSIS =========
    // Build avg sales by day-of-week (last 60d)
    const dowSales: Record<number, number[]> = {};
    (sales || []).forEach((s: any) => {
      const dow = new Date(s.date).getDay();
      (dowSales[dow] ||= []).push(Number(s.amount) || 0);
    });
    const avgSalesByDow: Record<number, number> = {};
    for (let d = 0; d < 7; d++) {
      const arr = dowSales[d] || [];
      avgSalesByDow[d] = arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    }
    const overallAvgSales = Object.values(avgSalesByDow).reduce((a, b) => a + b, 0) / 7 || 1;

    // Past reservation density by (dow, bucketIndex)
    const pastDensity: Record<string, { resv: number; guests: number; samples: number }> = {};
    const pastDateSet = new Set<string>();
    (pastReservations || []).forEach((r: any) => {
      const dow = new Date(r.reservation_date).getDay();
      const bi = bucketsForReservation(r.reservation_time);
      if (bi < 0) return;
      const key = `${dow}-${bi}`;
      pastDensity[key] ||= { resv: 0, guests: 0, samples: 0 };
      pastDensity[key].resv += 1;
      pastDensity[key].guests += Number(r.guest_count) || 0;
      pastDateSet.add(`${r.reservation_date}-${dow}`);
    });
    // approximate sample counts per dow
    const dowSamples: Record<number, number> = {};
    pastDateSet.forEach(k => {
      const dow = Number(k.split("-").pop());
      dowSamples[dow] = (dowSamples[dow] || 0) + 1;
    });

    // Build per-target-date reservation buckets
    const reservationsByDate: Record<string, any[]> = {};
    (targetReservations || []).forEach((r: any) => {
      (reservationsByDate[r.reservation_date] ||= []).push(r);
    });

    // Compute time_buckets per target date
    const dailyBuckets: Record<string, any[]> = {};
    for (const date of targetDates) {
      const dow = new Date(date + "T00:00:00").getDay();
      const dayResvs = reservationsByDate[date] || [];
      const dowSalesAvg = avgSalesByDow[dow] || 0;
      const dowFactor = dowSalesAvg / (overallAvgSales || 1); // 1.0 = average

      const buckets = TIME_BUCKETS.map((b, idx) => {
        // Reservations actually booked in this bucket on this date
        const inBucket = dayResvs.filter((r: any) => bucketsForReservation(r.reservation_time) === idx);
        const reservedGuests = inBucket.reduce((sum, r) => sum + (Number(r.guest_count) || 0), 0);
        const groupBooking = inBucket.some((r: any) => (Number(r.guest_count) || 0) >= 8);

        // Historical average for this dow+bucket
        const histKey = `${dow}-${idx}`;
        const hist = pastDensity[histKey] || { resv: 0, guests: 0, samples: 0 };
        const samples = Math.max(dowSamples[dow] || 0, 1);
        const histAvgGuests = hist.guests / samples;

        // Expected guests = max(reserved, historical avg) + walk-in factor
        const expectedGuests = Math.max(reservedGuests, Math.round(histAvgGuests * 1.3));

        // Lunch/dinner inherent boost (rule-based fallback when data sparse)
        let inherentBoost = 0;
        if (idx === 1) inherentBoost = 25; // lunch peak
        if (idx === 4) inherentBoost = 35; // dinner peak
        if (idx === 3) inherentBoost = 10;
        // Friday/Saturday evening boost
        if ((dow === 5 || dow === 6) && (idx === 3 || idx === 4)) inherentBoost += 15;

        // Score components (each 0-100)
        const guestScore = Math.min(100, expectedGuests * 4); // 25 guests = 100
        const resvScore = Math.min(100, inBucket.length * 20); // 5 reservations = 100
        const revScore = Math.min(100, dowFactor * 60 + inherentBoost); // weighted by dow + inherent
        const histScore = Math.min(100, (histAvgGuests * 4) + inherentBoost * 0.5);

        let peakScore = Math.round(
          guestScore * 0.35 +
          resvScore * 0.25 +
          revScore * 0.25 +
          histScore * 0.15
        );
        if (groupBooking) peakScore = Math.min(100, peakScore + 15);
        // If we have basically no data, lean on inherentBoost
        if (peakScore < inherentBoost) peakScore = inherentBoost;

        const cls = classifyPeak(peakScore);
        const required = consider_peak
          ? { hall: baseHall + cls.bonus, kitchen: baseKitchen + Math.ceil(cls.bonus * 0.7) }
          : { hall: baseHall, kitchen: baseKitchen };

        const reasonParts: string[] = [];
        reasonParts.push(`${DAY_NAMES[dow]}요일 ${b.start}-${b.end} (${b.label})`);
        if (inBucket.length > 0) reasonParts.push(`예약 ${inBucket.length}건·${reservedGuests}명`);
        if (histAvgGuests > 0) reasonParts.push(`최근 4주 동일 시간대 평균 ${Math.round(histAvgGuests)}명`);
        if (dowFactor > 1.1) reasonParts.push(`동 요일 평균 매출이 평소 대비 ${Math.round((dowFactor - 1) * 100)}% 높음`);
        if (groupBooking) reasonParts.push("단체 예약 포함");
        if (consider_peak && cls.bonus > 0) {
          reasonParts.push(`혼잡도 ${cls.label} → 홀+${cls.bonus}, 주방+${Math.ceil(cls.bonus * 0.7)} 추가 배치`);
        } else if (!consider_peak) {
          reasonParts.push("피크 고려 OFF: 기본 인원 유지");
        } else {
          reasonParts.push("기본 인원 유지");
        }

        return {
          start_time: b.start,
          end_time: b.end,
          label: b.label,
          peak_score: peakScore,
          peak_level: cls.level,
          peak_label: cls.label,
          expected_guests: expectedGuests,
          reservation_count: inBucket.length,
          reserved_guests: reservedGuests,
          group_booking: groupBooking,
          required,
          reason: reasonParts.join(" · "),
        };
      });

      dailyBuckets[date] = buckets;
    }

    // ========= EMPLOYEE CONTEXT =========
    const employeeList = (employees || []).map(e => {
      const role = userRoles?.find(r => r.user_id === e.user_id);
      const recentShifts = (shifts || []).filter(s => s.user_id === e.user_id).slice(-14);
      const recentAttendance = (attendance || []).filter(a => a.user_id === e.user_id).slice(-14);
      const lateCount = recentAttendance.filter(a => a.is_late).length;
      const onLeave = (leaves || []).filter(l => l.applicant_user_id === e.user_id);
      const inferredRole = (() => {
        const r = role?.role || "";
        if (r === "kitchen_staff") return "kitchen";
        if (r === "hall_staff") return "hall";
        return null;
      })();
      return {
        user_id: e.user_id,
        name: e.full_name,
        position: e.position,
        employment_type: e.employment_type,
        role: role?.role || "part_time",
        preferred_role: inferredRole,
        recent_shift_count: recentShifts.length,
        recent_late_count: lateCount,
        leave_dates: onLeave.map(l => ({ start: l.start_date, end: l.end_date })),
      };
    });

    const filteredEmployees = include_parttime
      ? employeeList
      : employeeList.filter(e => e.employment_type !== "part_time");

    // ========= AI ASSIGNMENT =========
    const compactBuckets = targetDates.map(date => ({
      date,
      day_of_week: DAY_NAMES[new Date(date + "T00:00:00").getDay()],
      buckets: dailyBuckets[date].map(b => ({
        start: b.start_time,
        end: b.end_time,
        required_hall: b.required.hall,
        required_kitchen: b.required.kitchen,
        peak_level: b.peak_level,
      })),
    }));

    const prompt = `당신은 한국 레스토랑 스케줄 배정 전문가입니다.
아래 시간대별 필요 인원에 맞춰 ${start_date} ~ ${end_date} 기간의 직원 배정을 생성하세요.

## 매장
${store?.name || "매장"}

## 직원 (${filteredEmployees.length}명)
${JSON.stringify(filteredEmployees)}

## 시간대별 필요 인원 (이미 피크 분석 반영됨)
${JSON.stringify(compactBuckets)}

## 설정
- 휴가 반영: ${reflect_leave}
- 파트타이머 포함: ${include_parttime}
- 주 40시간 제한: ${max_hours_limit}
- 피크 고려: ${consider_peak}

## 규칙
1. 각 시간대 required_hall/required_kitchen 만큼 직원을 배정 (가능한 만큼)
2. 승인된 휴가 기간의 직원은 절대 배정 금지
3. 동일 직원이 같은 날 여러 시간대 연속 근무 시 하나의 shift로 합쳐도 됨
4. preferred_role이 있는 직원은 해당 직무로 우선 배정
5. 연속 5일 이상, 주 40시간 초과 방지 (max_hours_limit=true일 때)
6. 인원이 부족하면 shortage_dates에 날짜 추가하고 warnings에 사유 기재
7. ${consider_peak ? "피크 시간대 추가 인원을 우선 채워주세요" : "기본 인원 중심으로 배정"}

반드시 아래 JSON 형식으로만 응답 (다른 텍스트 금지):
{
  "summary": {
    "total_shifts": number,
    "period": "${start_date} ~ ${end_date}",
    "warnings": [string],
    "shortage_dates": [string],
    "leave_reflected": boolean,
    "peak_considered": ${consider_peak}
  },
  "schedule": [
    {
      "date": "YYYY-MM-DD",
      "shifts": [
        { "user_id": "uuid", "name": "string", "role": "hall|kitchen", "start_time": "HH:MM", "end_time": "HH:MM", "break_minutes": number, "bucket_index": number }
      ],
      "warnings": [string]
    }
  ],
  "employee_summary": [
    { "user_id": "uuid", "name": "string", "total_shifts": number, "total_hours": number, "role": "string" }
  ]
}`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "당신은 레스토랑 스케줄 최적화 전문 AI입니다. 반드시 유효한 JSON으로만 응답하세요." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI 크레딧이 부족합니다." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let recommendation: any;
    try {
      recommendation = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("AI 응답 파싱 실패");
    }

    // Attach time_buckets (with reasons) to each day
    if (Array.isArray(recommendation.schedule)) {
      recommendation.schedule = recommendation.schedule.map((day: any) => ({
        ...day,
        time_buckets: dailyBuckets[day.date] || [],
      }));
    }
    recommendation.peak_considered = !!consider_peak;

    return new Response(JSON.stringify(recommendation), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
