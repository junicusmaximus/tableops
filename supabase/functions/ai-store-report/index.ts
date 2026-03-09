import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const { store_id, report_type, filters } = await req.json();
    if (!store_id) throw new Error("Missing store_id");

    const today = new Date().toISOString().split("T")[0];
    let startDate: string;
    let endDate = today;

    switch (report_type) {
      case "weekly":
        startDate = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
        break;
      case "monthly":
        startDate = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
        break;
      default: // daily
        startDate = today;
    }

    // Gather all operational data in parallel
    const [
      { data: store },
      { data: sales },
      { data: prevSales },
      { data: attendance },
      { data: shifts },
      { data: leaves },
      { data: checklists },
      { data: checklistTemplates },
      { data: inventoryAlerts },
      { data: lowStockItems },
      { data: purchaseRequests },
      { data: salesTargets },
    ] = await Promise.all([
      supabase.from("stores").select("*").eq("id", store_id).single(),
      supabase.from("sales_records").select("*").eq("store_id", store_id).gte("date", startDate).lte("date", endDate),
      supabase.from("sales_records").select("*").eq("store_id", store_id).gte("date", new Date(new Date(startDate).getTime() - (report_type === "monthly" ? 30 : report_type === "weekly" ? 7 : 1) * 86400000).toISOString().split("T")[0]).lt("date", startDate),
      supabase.from("attendance_logs").select("*").eq("store_id", store_id).gte("date", startDate).lte("date", endDate),
      supabase.from("shifts").select("*").eq("store_id", store_id).gte("shift_date", startDate).lte("shift_date", endDate),
      supabase.from("leave_requests").select("*").eq("store_id", store_id).eq("status", "approved").lte("start_date", endDate).gte("end_date", startDate),
      supabase.from("checklist_runs").select("*").eq("store_id", store_id).gte("business_date", startDate).lte("business_date", endDate),
      supabase.from("checklist_templates").select("*").eq("store_id", store_id).eq("is_active", true),
      supabase.from("inventory_alerts").select("*").eq("store_id", store_id).eq("is_resolved", false),
      supabase.from("inventory_items").select("*").eq("store_id", store_id).eq("is_active", true),
      supabase.from("purchase_requests").select("*").eq("store_id", store_id).gte("created_at", startDate),
      supabase.from("sales_targets").select("*").eq("store_id", store_id),
    ]);

    // Calculate metrics
    const totalSales = (sales || []).reduce((s, r) => s + Number(r.amount), 0);
    const prevTotalSales = (prevSales || []).reduce((s, r) => s + Number(r.amount), 0);
    const salesChange = prevTotalSales > 0 ? ((totalSales - prevTotalSales) / prevTotalSales * 100).toFixed(1) : "N/A";

    const totalAttendance = (attendance || []).length;
    const lateCount = (attendance || []).filter(a => a.is_late).length;
    const earlyLeaveCount = (attendance || []).filter(a => a.is_early_leave).length;

    const completedChecklists = (checklists || []).filter(c => c.status === "completed").length;
    const totalChecklists = (checklists || []).length;
    const checklistRate = totalChecklists > 0 ? (completedChecklists / totalChecklists * 100).toFixed(1) : "N/A";

    const unresolvedAlerts = (inventoryAlerts || []).length;
    const lowStockCount = (lowStockItems || []).filter(i => i.current_stock !== null && i.minimum_stock !== null && Number(i.current_stock) <= Number(i.minimum_stock)).length;

    const pendingPurchases = (purchaseRequests || []).filter(p => p.status === "pending").length;

    const currentYearMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    const monthTarget = salesTargets?.find((t: any) => t.year_month === currentYearMonth);

    const reportLabel = report_type === "monthly" ? "월간" : report_type === "weekly" ? "주간" : "오늘";

    const prompt = `당신은 한국 레스토랑의 AI 운영 분석 전문가입니다. 다음 데이터를 바탕으로 ${reportLabel} 매장 리포트를 작성해주세요.

## 매장 정보
- 매장명: ${store?.name || "매장"}
- 리포트 기간: ${startDate} ~ ${endDate}
- 리포트 유형: ${reportLabel}

## 매출 데이터
- 기간 총 매출: ${totalSales.toLocaleString()}원
- 이전 동기간 매출: ${prevTotalSales.toLocaleString()}원
- 증감률: ${salesChange}%
- 월간 매출 목표: ${monthTarget ? Number(monthTarget.target_amount).toLocaleString() + "원" : "미설정"}
- 일별 매출: ${JSON.stringify((sales || []).map(s => ({ date: s.date, amount: s.amount })))}

## 출근/인력 데이터
- 총 출근 기록: ${totalAttendance}건
- 지각: ${lateCount}건
- 조퇴: ${earlyLeaveCount}건
- 스케줄 수: ${(shifts || []).length}건
- 승인 휴가: ${(leaves || []).length}건

## 체크리스트 데이터
- 등록 템플릿: ${(checklistTemplates || []).length}개
- 기간 내 실행: ${totalChecklists}건
- 완료: ${completedChecklists}건 (${checklistRate}%)

## 재고/발주 데이터
- 미해결 재고 알림: ${unresolvedAlerts}건
- 재고 부족 품목: ${lowStockCount}개
- 대기 발주 요청: ${pendingPurchases}건
- 부족 품목: ${JSON.stringify((lowStockItems || []).filter(i => Number(i.current_stock) <= Number(i.minimum_stock)).map(i => ({ name: i.item_name, current: i.current_stock, minimum: i.minimum_stock, unit: i.default_unit })))}

반드시 아래 JSON 형식으로만 응답하세요:

{
  "key_summary": "핵심 요약 (3-5문장)",
  "sections": {
    "sales": {
      "title": "매출 분석",
      "summary": "매출 관련 분석 내용",
      "highlights": ["주요 포인트 배열"],
      "trend": "up 또는 down 또는 stable",
      "change_percent": number
    },
    "staffing": {
      "title": "인력 운영 분석",
      "summary": "인력 관련 분석 내용",
      "highlights": ["주요 포인트 배열"],
      "issues": ["문제점 배열"]
    },
    "checklist": {
      "title": "운영 체크 분석",
      "summary": "체크리스트 분석 내용",
      "completion_rate": "${checklistRate}",
      "highlights": ["주요 포인트 배열"]
    },
    "inventory": {
      "title": "재고/발주 분석",
      "summary": "재고 분석 내용",
      "highlights": ["주요 포인트 배열"],
      "urgent_items": ["긴급 품목 배열"]
    },
    "risks": {
      "title": "주의/리스크 알림",
      "items": [
        {
          "level": "high 또는 medium 또는 low",
          "message": "리스크 설명",
          "action": "권장 조치",
          "link": "관련 페이지 경로 (예: /schedule-management, /ingredients, /checklists, /leave)"
        }
      ]
    },
    "suggestions": {
      "title": "개선 제안",
      "items": [
        {
          "suggestion": "제안 내용",
          "priority": "high 또는 medium 또는 low",
          "link": "관련 페이지 경로"
        }
      ]
    }
  },
  "raw_metrics": {
    "total_sales": ${totalSales},
    "prev_sales": ${prevTotalSales},
    "sales_change": "${salesChange}",
    "late_count": ${lateCount},
    "early_leave_count": ${earlyLeaveCount},
    "checklist_rate": "${checklistRate}",
    "low_stock_count": ${lowStockCount},
    "pending_purchases": ${pendingPurchases}
  }
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
          { role: "system", content: "당신은 레스토랑 운영 분석 전문 AI입니다. 반드시 유효한 JSON으로만 응답하세요. 한국어로 작성하세요." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "요청 한도를 초과했습니다." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI 크레딧이 부족합니다." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let report;
    try {
      report = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("AI 응답 파싱 실패");
    }

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
