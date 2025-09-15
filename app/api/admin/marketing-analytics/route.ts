import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // 관리자/슈퍼만 허용
  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!role || !["admin","super_admin"].includes(role.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    ok: true,
    data: {
      hosts: [],
      systemOverview: {
        totalHosts: 12,
        activeHosts: 8,
        totalAnalysisRuns: 1247,
        weeklyAnalysisRuns: 89,
        popularKeywords: [
          { keyword: '키즈풀', count: 45, category: '가족여행' },
          { keyword: '풀빌라', count: 38, category: '휴양' },
          { keyword: '브라이덜', count: 32, category: '파티' },
          { keyword: '워크샵', count: 28, category: '비즈니스' },
          { keyword: '감성숙소', count: 25, category: '힐링' }
        ],
        analysisDistribution: [
          { type: 'local-demand', count: 245, percentage: 42 },
          { type: 'content-studio', count: 187, percentage: 32 },
          { type: 'competitor-analysis', count: 92, percentage: 16 },
          { type: 'shorts-trends', count: 34, percentage: 6 },
          { type: 'ad-waste-analysis', count: 23, percentage: 4 },
          { type: 'naver-place-health', count: 0, percentage: 0 },
          { type: 'event-suggestions', count: 0, percentage: 0 }
        ],
        quotaUtilization: {
          used: 847,
          total: 1000,
          utilization: 85
        }
      }
    }
  });
}