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

    const { store_id, report_type, force_regenerate } = await req.json();
    if (!store_id) throw new Error("Missing store_id");

    // Calculate date range
    const today = new Date().toISOString().split("T")[0];
    let startDate: string;
    const endDate = today;

    switch (report_type) {
      case "weekly":
        startDate = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
        break;
      case "monthly":
        startDate = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
        break;
      default:
        startDate = today;
    }

    // Check cache first (unless force regenerate)
    if (!force_regenerate) {
      const { data: cached } = await supabase
        .from("ai_reports")
        .select("*")
        .eq("store_id", store_id)
        .eq("period_type", report_type || "daily")
        .eq("period_start", startDate)
        .eq("period_end", endDate)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cached) {
        return new Response(JSON.stringify({ ...cached.report_json, cached: true, cached_at: cached.created_at }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
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
      { data: inventoryItems },
      { data: purchaseRequests },
      { data: salesTargets },
      { data: employees },
    ] = await Promise.all([
      supabase.from("stores").select("*").eq("id", store_id).single(),
      supabase.from("sales_records").select("*").eq("store_id", store_id).gte("date", startDate).lte("date", endDate),
      supabase.from("sales_records").select("*").eq("store_id", store_id).gte("date", new Date(new Date(startDate).getTime() - (report_type === "monthly" ? 30 : report_type === "weekly" ? 7 : 1) * 86400000).toISOString().split("T")[0]).lt("date", startDate),
      supabase.from("attendance_logs").select("*").eq("store_id", store_id).gte("date", startDate).lte("date", endDate),
      supabase.from("shifts").select("*").eq("store_id", store_id).gte("shift_date", startDate).lte("shift_date", endDate),
      supabase.from("leave_requests").select("*").eq("store_id", store_id).eq("status", "approved").lte("start_date", endDate).gte("end_date", startDate),
      supabase.from("checklist_runs").select("*, checklist_templates(title, checklist_type)").eq("store_id", store_id).gte("business_date", startDate).lte("business_date", endDate),
      supabase.from("checklist_templates").select("*").eq("store_id", store_id).eq("is_active", true),
      supabase.from("inventory_alerts").select("*").eq("store_id", store_id).eq("is_resolved", false),
      supabase.from("inventory_items").select("*").eq("store_id", store_id).eq("is_active", true),
      supabase.from("purchase_requests").select("*").eq("store_id", store_id).gte("created_at", startDate),
      supabase.from("sales_targets").select("*").eq("store_id", store_id),
      supabase.from("employee_profiles").select("*").eq("store_id", store_id).eq("status", "active"),
    ]);

    // ── Aggregate metrics ──

    // Sales
    const totalSales = (sales || []).reduce((s, r) => s + Number(r.amount), 0);
    const prevTotalSales = (prevSales || []).reduce((s, r) => s + Number(r.amount), 0);
    const salesGrowthRate = prevTotalSales > 0 ? ((totalSales - prevTotalSales) / prevTotalSales * 100) : null;

    // Daily sales breakdown
    const dailySales = (sales || []).map(s => ({ date: s.date, amount: Number(s.amount) }));
    
    // Peak hour analysis from sales timestamps
    const peakHour = dailySales.length > 0 ? (() => {
      const hourCounts: Record<string, number> = {};
      (sales || []).forEach(s => {
        const h = new Date(s.created_at).getHours();
        const key = `${String(h).padStart(2, "0")}:00`;
        hourCounts[key] = (hourCounts[key] || 0) + Number(s.amount);
      });
      const sorted = Object.entries(hourCounts).sort(([,a],[,b]) => b - a);
      return sorted[0]?.[0] || null;
    })() : null;

    // Monthly target
    const currentYearMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    const monthTarget = salesTargets?.find((t: any) => t.year_month === currentYearMonth);
    const targetAchievementRate = monthTarget ? (totalSales / Number(monthTarget.target_amount) * 100) : null;

    // Staff / Attendance
    const totalStaff = (employees || []).length;
    const totalAttendance = (attendance || []).length;
    const lateCount = (attendance || []).filter(a => a.is_late).length;
    const earlyLeaveCount = (attendance || []).filter(a => a.is_early_leave).length;
    const absentCount = Math.max(0, totalStaff - totalAttendance);

    // Understaffed hours analysis from shifts
    const shiftCoverage: Record<string, number> = {};
    (shifts || []).forEach(s => {
      const start = parseInt(s.start_time?.split(":")[0] || "0");
      const end = parseInt(s.end_time?.split(":")[0] || "0");
      for (let h = start; h < (end > start ? end : 24); h++) {
        const key = `${String(h).padStart(2, "0")}:00~${String(h+1).padStart(2, "0")}:00`;
        shiftCoverage[key] = (shiftCoverage[key] || 0) + 1;
      }
    });
    const understaffedHours = Object.entries(shiftCoverage)
      .filter(([, count]) => count <= 1)
      .map(([hour]) => hour);

    // Checklists
    const completedChecklists = (checklists || []).filter(c => c.status === "completed").length;
    const totalChecklists = (checklists || []).length;
    const checklistRate = totalChecklists > 0 ? Math.round(completedChecklists / totalChecklists * 100) : null;
    const missedItems = (checklists || [])
      .filter(c => c.status !== "completed")
      .map(c => (c as any).checklist_templates?.title || "알 수 없음")
      .filter((v, i, arr) => arr.indexOf(v) === i);

    // Inventory
    const lowStockItems = (inventoryItems || []).filter(i =>
      i.current_stock !== null && i.minimum_stock !== null && Number(i.current_stock) <= Number(i.minimum_stock)
    );
    const unresolvedAlerts = (inventoryAlerts || []).length;
    const pendingPurchases = (purchaseRequests || []).filter(p => p.status === "pending").length;

    // Leave
    const approvedLeaves = (leaves || []).length;

    // ── Build aggregated data JSON ──
    const aggregatedData = {
      store_name: store?.name || "매장",
      period: { start: startDate, end: endDate, type: report_type || "daily" },
      sales: {
        total: totalSales,
        previous: prevTotalSales,
        growth_rate: salesGrowthRate !== null ? Number(salesGrowthRate.toFixed(1)) : null,
        peak_hour: peakHour,
        daily_breakdown: dailySales,
        target_amount: monthTarget ? Number(monthTarget.target_amount) : null,
        target_achievement_rate: targetAchievementRate !== null ? Number(targetAchievementRate.toFixed(1)) : null,
      },
      staff: {
        total_staff: totalStaff,
        attendance_count: totalAttendance,
        late_count: lateCount,
        early_leave_count: earlyLeaveCount,
        absent_count: absentCount,
        approved_leaves: approvedLeaves,
        shift_count: (shifts || []).length,
        understaffed_hours: understaffedHours,
      },
      checklist: {
        template_count: (checklistTemplates || []).length,
        total_runs: totalChecklists,
        completed: completedChecklists,
        completion_rate: checklistRate,
        missed_items: missedItems,
      },
      inventory: {
        low_stock_items: lowStockItems.map(i => ({
          name: i.item_name,
          current: Number(i.current_stock),
          minimum: Number(i.minimum_stock),
          unit: i.default_unit,
        })),
        low_stock_count: lowStockItems.length,
        unresolved_alerts: unresolvedAlerts,
        pending_purchases: pendingPurchases,
      },
    };

    // Check if there's enough data
    const hasData = totalSales > 0 || totalAttendance > 0 || totalChecklists > 0 || lowStockItems.length > 0;

    const reportLabel = report_type === "monthly" ? "월간" : report_type === "weekly" ? "주간" : "오늘";

    const prompt = `당신은 한국 레스토랑의 AI 운영 분석 전문가입니다. 아래 실제 운영 데이터를 바탕으로 ${reportLabel} 매장 리포트를 작성해주세요.

## 집계된 운영 데이터
${JSON.stringify(aggregatedData, null, 2)}

## 지침
- 데이터가 0이거나 없는 항목은 "데이터 없음"으로 표시하고, 데이터 입력을 권장하세요.
- 실제 숫자를 기반으로 분석하세요. 추측하지 마세요.
- 한국어, 전문적이고 간결한 톤으로 작성하세요.
- 각 섹션의 link 필드에는 관련 페이지 경로를 포함하세요.

반드시 아래 JSON 형식으로만 응답하세요:

{
  "key_summary": "핵심 요약 (3-5문장, 실제 수치 포함)",
  "data_completeness": {
    "has_sales": ${totalSales > 0},
    "has_attendance": ${totalAttendance > 0},
    "has_checklists": ${totalChecklists > 0},
    "has_inventory": ${lowStockItems.length > 0 || (inventoryItems || []).length > 0},
    "missing_data_message": "부족한 데이터에 대한 안내 메시지"
  },
  "sections": {
    "sales": {
      "title": "매출 분석",
      "summary": "매출 분석 내용 (실제 수치 기반)",
      "highlights": ["주요 포인트"],
      "trend": "up 또는 down 또는 stable",
      "change_percent": ${salesGrowthRate !== null ? salesGrowthRate.toFixed(1) : "null"}
    },
    "staffing": {
      "title": "인력 운영 분석",
      "summary": "인력 분석 내용",
      "highlights": ["주요 포인트"],
      "issues": ["문제점"]
    },
    "checklist": {
      "title": "운영 체크리스트 분석",
      "summary": "체크리스트 분석 내용",
      "completion_rate": "${checklistRate ?? 'N/A'}",
      "highlights": ["주요 포인트"]
    },
    "inventory": {
      "title": "재고/발주 분석",
      "summary": "재고 분석 내용",
      "highlights": ["주요 포인트"],
      "urgent_items": [${lowStockItems.map(i => `"${i.item_name}"`).join(", ")}]
    },
    "risks": {
      "title": "주의/리스크 알림",
      "items": [
        {
          "level": "high 또는 medium 또는 low",
          "message": "리스크 설명",
          "action": "권장 조치",
          "link": "/schedule-management 또는 /ingredients 또는 /checklists 또는 /leave 등"
        }
      ]
    },
    "suggestions": {
      "title": "개선 제안",
      "items": [
        {
          "suggestion": "제안 내용 (구체적이고 실행 가능한)",
          "priority": "high 또는 medium 또는 low",
          "link": "관련 페이지 경로"
        }
      ]
    }
  },
  "raw_metrics": {
    "total_sales": ${totalSales},
    "prev_sales": ${prevTotalSales},
    "sales_change": "${salesGrowthRate !== null ? salesGrowthRate.toFixed(1) : 'N/A'}",
    "late_count": ${lateCount},
    "early_leave_count": ${earlyLeaveCount},
    "checklist_rate": "${checklistRate ?? 'N/A'}",
    "low_stock_count": ${lowStockItems.length},
    "pending_purchases": ${pendingPurchases},
    "total_staff": ${totalStaff},
    "absent_count": ${absentCount},
    "approved_leaves": ${approvedLeaves}
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
          { role: "system", content: "당신은 레스토랑 운영 분석 전문 AI입니다. 반드시 유효한 JSON으로만 응답하세요. 한국어로 작성하세요. 실제 데이터에 기반하여 분석하고, 데이터가 없는 항목은 솔직하게 표시하세요." },
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

    // Cache the report
    await supabase.from("ai_reports").insert({
      store_id,
      period_type: report_type || "daily",
      period_start: startDate,
      period_end: endDate,
      report_json: report,
      generated_by: user.id,
    });

    return new Response(JSON.stringify({ ...report, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
