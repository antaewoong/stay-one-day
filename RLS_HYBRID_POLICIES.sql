-- ========================================
-- Stay One Day 하이브리드 RLS 정책 적용
-- 실제 사용 패턴에 맞는 스마트 정책만 생성
-- ========================================

-- 🔧 1. Categories 테이블 RLS 활성화 (ERROR 해결)
-- ========================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 🎯 2. 스마트 정책 생성 - 역할별 실제 권한 분석
-- ========================================

-- A. 공개 읽기 + 관리자 전용 쓰기 테이블들
-- ========================================

-- stay_options (숙소 옵션 - 공개 읽기, 호스트/관리자 쓰기)
CREATE POLICY "stay_options_public_read" ON stay_options
FOR SELECT USING (true);

CREATE POLICY "stay_options_admin_write" ON stay_options
FOR ALL USING (
  public.get_user_role() IN ('super_admin', 'admin') OR
  EXISTS (
    SELECT 1 FROM stays s 
    WHERE s.id = stay_id 
    AND s.host_id IN (SELECT id FROM hosts WHERE user_id = auth.uid())
  )
) WITH CHECK (
  public.get_user_role() IN ('super_admin', 'admin') OR
  EXISTS (
    SELECT 1 FROM stays s 
    WHERE s.id = stay_id 
    AND s.host_id IN (SELECT id FROM hosts WHERE user_id = auth.uid())
  )
);

-- B. 관리자 전용 테이블들 (민감한 정보)
-- ========================================

-- accommodation_amenities (숙소 편의시설 - 공개 읽기, 호스트/관리자 쓰기)
CREATE POLICY "accommodation_amenities_public_read" ON accommodation_amenities
FOR SELECT USING (true);

CREATE POLICY "accommodation_amenities_host_write" ON accommodation_amenities
FOR ALL USING (
  public.get_user_role() IN ('super_admin', 'admin') OR
  EXISTS (
    SELECT 1 FROM accommodations a 
    WHERE a.id = accommodation_id 
    AND a.host_id IN (SELECT id FROM hosts WHERE user_id = auth.uid())
  )
) WITH CHECK (
  public.get_user_role() IN ('super_admin', 'admin') OR
  EXISTS (
    SELECT 1 FROM accommodations a 
    WHERE a.id = accommodation_id 
    AND a.host_id IN (SELECT id FROM hosts WHERE user_id = auth.uid())
  )
);

-- accommodation_categories (숙소 카테고리 - 공개 읽기, 관리자 쓰기)
CREATE POLICY "accommodation_categories_public_read" ON accommodation_categories
FOR SELECT USING (true);

CREATE POLICY "accommodation_categories_admin_write" ON accommodation_categories
FOR ALL USING (
  public.get_user_role() IN ('super_admin', 'admin')
) WITH CHECK (
  public.get_user_role() IN ('super_admin', 'admin')
);

-- accommodation_images (숙소 이미지 - 공개 읽기, 호스트/관리자 쓰기)
CREATE POLICY "accommodation_images_public_read" ON accommodation_images
FOR SELECT USING (true);

CREATE POLICY "accommodation_images_host_write" ON accommodation_images
FOR ALL USING (
  public.get_user_role() IN ('super_admin', 'admin') OR
  EXISTS (
    SELECT 1 FROM accommodations a 
    WHERE a.id = accommodation_id 
    AND a.host_id IN (SELECT id FROM hosts WHERE user_id = auth.uid())
  )
) WITH CHECK (
  public.get_user_role() IN ('super_admin', 'admin') OR
  EXISTS (
    SELECT 1 FROM accommodations a 
    WHERE a.id = accommodation_id 
    AND a.host_id IN (SELECT id FROM hosts WHERE user_id = auth.uid())
  )
);

-- C. 인플루언서 관련 테이블들
-- ========================================

-- collaboration_periods (협업 기간 - 공개 읽기, 관리자 쓰기)
CREATE POLICY "collaboration_periods_public_read" ON collaboration_periods
FOR SELECT USING (true);

CREATE POLICY "collaboration_periods_admin_write" ON collaboration_periods
FOR ALL USING (
  public.get_user_role() IN ('super_admin', 'admin')
) WITH CHECK (
  public.get_user_role() IN ('super_admin', 'admin')
);

-- influencer_notices (인플루언서 공지 - 인플루언서 읽기, 관리자 쓰기)
CREATE POLICY "influencer_notices_influencer_read" ON influencer_notices
FOR SELECT USING (
  public.get_user_role() IN ('super_admin', 'admin', 'influencer')
);

CREATE POLICY "influencer_notices_admin_write" ON influencer_notices
FOR ALL USING (
  public.get_user_role() IN ('super_admin', 'admin')
) WITH CHECK (
  public.get_user_role() IN ('super_admin', 'admin')
);

-- influencer_notice_views (인플루언서 공지 조회 - 본인만)
CREATE POLICY "influencer_notice_views_own_access" ON influencer_notice_views
FOR ALL USING (
  influencer_id = (SELECT id FROM influencers WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())) OR
  public.get_user_role() IN ('super_admin', 'admin')
);

-- D. 프로모션/결제 관련 테이블들
-- ========================================

-- promotion_usages (프로모션 사용 - 본인 + 관리자)
CREATE POLICY "promotion_usages_user_access" ON promotion_usages
FOR ALL USING (
  user_id = auth.uid() OR
  public.get_user_role() IN ('super_admin', 'admin')
);

-- promotions (프로모션 - 활성화된 것만 공개, 관리자 전체)
CREATE POLICY "promotions_public_read" ON promotions
FOR SELECT USING (
  status = 'active' AND end_date > NOW() OR
  public.get_user_role() IN ('super_admin', 'admin')
);

CREATE POLICY "promotions_admin_write" ON promotions
FOR ALL USING (
  public.get_user_role() IN ('super_admin', 'admin')
) WITH CHECK (
  public.get_user_role() IN ('super_admin', 'admin')
);

-- accommodation_discounts (숙소 할인 - 호스트/관리자만)
CREATE POLICY "accommodation_discounts_host_access" ON accommodation_discounts
FOR ALL USING (
  public.get_user_role() IN ('super_admin', 'admin') OR
  EXISTS (
    SELECT 1 FROM accommodations a 
    WHERE a.id = accommodation_id 
    AND a.host_id IN (SELECT id FROM hosts WHERE user_id = auth.uid())
  )
);

-- E. 시스템/관리 테이블들
-- ========================================

-- review_images (리뷰 이미지 - 공개 읽기, 작성자/관리자 쓰기)
CREATE POLICY "review_images_public_read" ON review_images
FOR SELECT USING (true);

CREATE POLICY "review_images_owner_write" ON review_images
FOR ALL USING (
  public.get_user_role() IN ('super_admin', 'admin') OR
  EXISTS (
    SELECT 1 FROM reviews r 
    WHERE r.id = review_id 
    AND r.user_id = auth.uid()
  )
) WITH CHECK (
  public.get_user_role() IN ('super_admin', 'admin') OR
  EXISTS (
    SELECT 1 FROM reviews r 
    WHERE r.id = review_id 
    AND r.user_id = auth.uid()
  )
);

-- settlements (정산 - 해당 사업자/관리자만)
CREATE POLICY "settlements_business_access" ON settlements
FOR ALL USING (
  public.get_user_role() IN ('super_admin', 'admin') OR
  business_id IN (SELECT id FROM business_accounts WHERE user_id = auth.uid())
);

-- sms_templates (SMS 템플릿 - 해당 사업자/관리자만)
CREATE POLICY "sms_templates_business_access" ON sms_templates
FOR ALL USING (
  public.get_user_role() IN ('super_admin', 'admin') OR
  business_id IN (SELECT id FROM business_accounts WHERE user_id = auth.uid())
);

-- sms_logs (SMS 로그 - 관리자 전용)
CREATE POLICY "sms_logs_admin_only" ON sms_logs
FOR ALL USING (
  public.get_user_role() IN ('super_admin', 'admin')
);

-- stay_images (숙소 이미지 - 공개 읽기, 호스트/관리자 쓰기)
CREATE POLICY "stay_images_public_read" ON stay_images
FOR SELECT USING (true);

CREATE POLICY "stay_images_host_write" ON stay_images
FOR ALL USING (
  public.get_user_role() IN ('super_admin', 'admin') OR
  EXISTS (
    SELECT 1 FROM stays s 
    WHERE s.id = stay_id 
    AND s.host_id IN (SELECT id FROM hosts WHERE user_id = auth.uid())
  )
) WITH CHECK (
  public.get_user_role() IN ('super_admin', 'admin') OR
  EXISTS (
    SELECT 1 FROM stays s 
    WHERE s.id = stay_id 
    AND s.host_id IN (SELECT id FROM hosts WHERE user_id = auth.uid())
  )
);

-- stays (숙소 - 활성화된 것만 공개, 호스트는 본인 것만, 관리자 전체)
CREATE POLICY "stays_public_read" ON stays
FOR SELECT USING (
  status = 'active' OR
  host_id IN (SELECT id FROM hosts WHERE user_id = auth.uid()) OR
  public.get_user_role() IN ('super_admin', 'admin')
);

CREATE POLICY "stays_host_write" ON stays
FOR ALL USING (
  public.get_user_role() IN ('super_admin', 'admin') OR
  host_id IN (SELECT id FROM hosts WHERE user_id = auth.uid())
) WITH CHECK (
  public.get_user_role() IN ('super_admin', 'admin') OR
  host_id IN (SELECT id FROM hosts WHERE user_id = auth.uid())
);

-- system_settings (시스템 설정 - 공개 설정만 읽기, 관리자만 쓰기)
CREATE POLICY "system_settings_public_read" ON system_settings
FOR SELECT USING (
  is_public = true OR
  public.get_user_role() IN ('super_admin', 'admin')
);

CREATE POLICY "system_settings_admin_write" ON system_settings
FOR ALL USING (
  public.get_user_role() IN ('super_admin', 'admin')
) WITH CHECK (
  public.get_user_role() IN ('super_admin', 'admin')
);

-- F. 호스트 필수 권한 추가 (누락된 부분)
-- ========================================

-- 호스트가 본인 숙소 예약 확인 권한 추가 (reservations 테이블)
DROP POLICY IF EXISTS "reservations_host_access" ON reservations;
CREATE POLICY "reservations_host_access" ON reservations  
FOR SELECT USING (
  public.get_user_role() = 'host' AND
  accommodation_id IN (
    SELECT id FROM accommodations 
    WHERE host_id IN (SELECT id FROM hosts WHERE user_id = auth.uid())
  ) OR
  user_id = auth.uid() OR
  public.get_user_role() IN ('super_admin', 'admin')
);

-- 호스트가 본인 숙소 리뷰 확인 권한 추가 (reviews 테이블)
DROP POLICY IF EXISTS "reviews_host_read" ON reviews;
CREATE POLICY "reviews_host_read" ON reviews
FOR SELECT USING (
  public.get_user_role() = 'host' AND
  accommodation_id IN (
    SELECT id FROM accommodations 
    WHERE host_id IN (SELECT id FROM hosts WHERE user_id = auth.uid())
  ) OR
  user_id = auth.uid() OR
  status = 'active' OR
  public.get_user_role() IN ('super_admin', 'admin')
);

-- 호스트가 본인 숙소 문의 확인/답변 권한 추가 (inquiries 테이블)
CREATE POLICY "inquiries_host_access" ON inquiries
FOR ALL USING (
  public.get_user_role() IN ('super_admin', 'admin') OR
  accommodation_id IN (
    SELECT id FROM accommodations 
    WHERE host_id IN (SELECT id FROM hosts WHERE user_id = auth.uid())
  )
) WITH CHECK (
  public.get_user_role() IN ('super_admin', 'admin') OR
  accommodation_id IN (
    SELECT id FROM accommodations 
    WHERE host_id IN (SELECT id FROM hosts WHERE user_id = auth.uid())
  )
);

-- G. 호스트 마케팅/CRM 권한 추가
-- ========================================

-- 호스트가 본인 숙소 마케팅 이벤트 확인 (marketing_events)
CREATE POLICY "marketing_events_host_access" ON marketing_events
FOR SELECT USING (
  public.get_user_role() IN ('super_admin', 'admin') OR
  (public.get_user_role() = 'host' AND 
   page_url LIKE '%accommodation%' AND
   EXISTS (
     SELECT 1 FROM accommodations a, hosts h
     WHERE h.user_id = auth.uid()
     AND page_url LIKE '%' || a.id::text || '%'
     AND a.host_id = h.id
   ))
);

-- 호스트가 본인 숙소 예약 전환 데이터 확인 (booking_conversions)
CREATE POLICY "booking_conversions_host_access" ON booking_conversions
FOR SELECT USING (
  public.get_user_role() IN ('super_admin', 'admin') OR
  (public.get_user_role() = 'host' AND
   host_id IN (SELECT id FROM hosts WHERE user_id = auth.uid()))
);

-- 호스트가 본인 숙소 캠페인 성과 확인 (campaign_performance)
CREATE POLICY "campaign_performance_host_access" ON campaign_performance
FOR SELECT USING (
  public.get_user_role() IN ('super_admin', 'admin') OR
  (public.get_user_role() = 'host' AND
   utm_campaign LIKE '%host%' OR utm_source LIKE '%host%')
);

-- 호스트가 본인 숙소 관련 세션 데이터 확인 (web_sessions)
CREATE POLICY "web_sessions_host_access" ON web_sessions
FOR SELECT USING (
  public.get_user_role() IN ('super_admin', 'admin') OR
  (public.get_user_role() = 'host' AND
   (landing_page LIKE '%accommodation%' OR entry_page LIKE '%accommodation%'))
);

-- 호스트가 본인 숙소 사용자 여정 확인 (user_journey_events)
CREATE POLICY "user_journey_events_host_access" ON user_journey_events
FOR SELECT USING (
  public.get_user_role() IN ('super_admin', 'admin') OR
  user_id = auth.uid() OR
  (public.get_user_role() = 'host' AND
   page_path LIKE '%accommodation%')
);

-- H. Super Admin vs Admin 구분 정책 추가
-- ========================================

-- admin_accounts 테이블: Super Admin만 관리 가능
CREATE POLICY "admin_accounts_super_admin_only" ON admin_accounts
FOR ALL USING (
  public.get_user_role() = 'super_admin'
) WITH CHECK (
  public.get_user_role() = 'super_admin'
);

-- I. 호스트 필수 권한 추가된 CRM용 users 테이블 권한
-- ========================================

-- 호스트가 본인 고객의 users 정보 확인 (CRM용) - auth.users는 정책 생성 불가능하므로 생략
-- 대신 profiles 테이블 사용
CREATE POLICY "profiles_host_crm_access" ON profiles
FOR SELECT USING (
  public.get_user_role() IN ('super_admin', 'admin') OR
  id = auth.uid() OR
  (public.get_user_role() = 'host' AND
   id IN (
     SELECT DISTINCT user_id FROM reservations r
     JOIN accommodations a ON r.accommodation_id = a.id
     WHERE a.host_id IN (SELECT id FROM hosts WHERE user_id = auth.uid())
   ))
);

-- ✅ 완료 메시지
-- ========================================
SELECT '하이브리드 RLS 정책 적용 완료 (Super Admin/Admin 구분 + 호스트 CRM 권한 포함)!' as message;