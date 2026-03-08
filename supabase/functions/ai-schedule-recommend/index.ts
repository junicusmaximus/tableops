import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user and role
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!);
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

    // Gather data
    const [
      { data: employees },
      { data: shifts },
      { data: attendance },
      { data: leaves },
      { data: sales },
      { data: store },
      { data: templates },
    ] = await Promise.all([
      supabase.from("employee_profiles").select("*").eq("store_id", store_id).eq("status", "active"),
      supabase.from("shifts").select("*").eq("store_id", store_id).gte("shift_date", new Date(new Date(start_date).getTime() - 30 * 86400000).toISOString().split("T")[0]).lte("shift_date", end_date).order("shift_date"),
      supabase.from("attendance_logs").select("*").eq("store_id", store_id).gte("date", new Date(new Date(start_date).getTime() - 30 * 86400000).toISOString().split("T")[0]),
      supabase.from("leave_requests").select("*").eq("store_id", store_id).eq("status", "approved").lte("start_date", end_date).gte("end_date", start_date),
      supabase.from("sales_records").select("*").eq("store_id", store_id).gte("date", new Date(new Date(start_date).getTime() - 60 * 86400000).toISOString().split("T")[0]).order("date"),
      supabase.from("stores").select("*").eq("id", store_id).single(),
      supabase.from("shift_templates").select("*").eq("store_id", store_id),
    ]);

    const { data: userRoles } = await supabase
      .from("user_store_roles")
      .select("user_id, role")
      .eq("store_id", store_id);

    // Build context for AI
    const employeeList = (employees || []).map(e => {
      const role = userRoles?.find(r => r.user_id === e.user_id);
      const recentShifts = (shifts || []).filter(s => s.user_id === e.user_id).slice(-14);
      const recentAttendance = (attendance || []).filter(a => a.user_id === e.user_id).slice(-14);
      const lateCount = recentAttendance.filter(a => a.is_late).length;
      const onLeave = (leaves || []).filter(l => l.applicant_user_id === e.user_id);

      return {
        user_id: e.user_id,
        name: e.full_name,
        position: e.position,
        employment_type: e.employment_type,
        role: role?.role || "part_time",
        recent_shift_count: recentShifts.length,
        recent_late_count: lateCount,
        leave_dates: onLeave.map(l => ({ start: l.start_date, end: l.end_date })),
      };
    });

    const filteredEmployees = include_parttime
      ? employeeList
      : employeeList.filter(e => e.employment_type !== "part_time");

    const salesSummary = (sales || []).reduce((acc: Record<string, number>, s: any) => {
      const dow = new Date(s.date).getDay();
      acc[dow] = (acc[dow] || 0) + Number(s.amount);
      return acc;
    }, {});

    const templateList = (templates || []).map(t => ({
      name: t.name,
      start_time: t.start_time,
      end_time: t.end_time,
      role: t.role,
      break_minutes: t.break_minutes,
    }));

    const prompt = `당신은 한국 레스토랑 운영을 위한 스케줄 추천 전문가입니다.

다음 데이터를 분석하여 ${start_date}부터 ${end_date}까지의 최적의 근무 스케줄을 추천해주세요.

## 매장 정보
- 매장명: ${store?.name || "매장"}

## 직원 목록 (${filteredEmployees.length}명)
${JSON.stringify(filteredEmployees, null, 2)}

## 직무별 필요 인원
${JSON.stringify(roles_needed || { hall: 2, kitchen: 2 })}

## 기존 근무 템플릿
${JSON.stringify(templateList, null, 2)}

## 요일별 매출 합계 (최근 2개월, 0=일요일)
${JSON.stringify(salesSummary)}

## 설정
- 피크 시간대 고려: ${consider_peak ? "예" : "아니오"}
- 휴가 반영: ${reflect_leave ? "예" : "아니오"}
- 파트타이머 포함: ${include_parttime ? "예" : "아니오"}
- 최대 근무시간 제한: ${max_hours_limit ? "주 40시간" : "제한 없음"}

## 추천 규칙
1. 승인된 휴가 기간의 직원은 배정하지 마세요
2. 연속 5일 이상 근무를 피하세요
3. 최근 지각이 잦은 직원은 오픈 시간대 배정을 줄이세요
4. 직무별 필요 인원을 충족하세요
5. 매출이 높은 요일에 더 많은 인원을 배정하세요
6. 공정한 근무 분배를 고려하세요
7. 기존 템플릿의 시간대를 활용하세요

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 JSON만 출력하세요.

{
  "summary": {
    "total_shifts": number,
    "period": "${start_date} ~ ${end_date}",
    "warnings": ["경고 메시지 배열"],
    "shortage_dates": ["인원 부족 날짜 배열"],
    "leave_reflected": boolean
  },
  "schedule": [
    {
      "date": "YYYY-MM-DD",
      "shifts": [
        {
          "user_id": "직원 user_id",
          "name": "직원 이름",
          "role": "hall 또는 kitchen 또는 기타",
          "start_time": "HH:MM",
          "end_time": "HH:MM",
          "break_minutes": number
        }
      ],
      "warnings": ["해당 날짜 경고"]
    }
  ],
  "employee_summary": [
    {
      "user_id": "직원 user_id",
      "name": "직원 이름",
      "total_shifts": number,
      "total_hours": number,
      "role": "주요 역할"
    }
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
        model: "google/gemini-3-flash-preview",
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

    // Strip markdown code fences if present
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let recommendation;
    try {
      recommendation = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("AI 응답 파싱 실패");
    }

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
