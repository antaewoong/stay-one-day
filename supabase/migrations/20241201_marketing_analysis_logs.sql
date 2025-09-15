-- 마케팅 분석 로그 테이블 생성
CREATE TABLE IF NOT EXISTS marketing_analysis_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  analysis_type VARCHAR(50) NOT NULL,
  executed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  result JSONB,
  is_proxy BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_marketing_analysis_logs_host_id ON marketing_analysis_logs(host_id);
CREATE INDEX IF NOT EXISTS idx_marketing_analysis_logs_executed_at ON marketing_analysis_logs(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_analysis_logs_analysis_type ON marketing_analysis_logs(analysis_type);

-- RLS 정책 설정
ALTER TABLE marketing_analysis_logs ENABLE ROW LEVEL SECURITY;

-- 호스트는 자신의 로그만 조회 가능
CREATE POLICY "Hosts can view their own logs" ON marketing_analysis_logs
  FOR SELECT USING (host_id = auth.uid());

-- 관리자는 모든 로그 조회 가능
CREATE POLICY "Admins can view all logs" ON marketing_analysis_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 호스트는 자신의 로그 생성 가능
CREATE POLICY "Hosts can create their own logs" ON marketing_analysis_logs
  FOR INSERT WITH CHECK (host_id = auth.uid());

-- 관리자는 대리 분석 로그 생성 가능
CREATE POLICY "Admins can create proxy logs" ON marketing_analysis_logs
  FOR INSERT WITH CHECK (
    is_proxy = true AND
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );