-- accommodations 테이블에 호스트가 편집할 수 있는 필드들 추가

-- 이용안내 필드 추가
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS usage_guide TEXT DEFAULT '';

-- 환불규정 필드 추가  
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS refund_policy TEXT DEFAULT '';

-- 판매자안내 필드 추가
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS seller_info TEXT DEFAULT '';

-- 추가적인 주의사항 필드
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS special_notes TEXT DEFAULT '';

-- 편의시설 정보 (JSON 배열로 저장)
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS amenities JSONB DEFAULT '[]'::jsonb;

-- 추가 옵션 서비스 (JSON 배열로 저장)  
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS extra_options JSONB DEFAULT '[]'::jsonb;

-- 기본값 업데이트 (기존 데이터가 있는 경우)
UPDATE accommodations SET 
  usage_guide = COALESCE(usage_guide, '• 체크인: ' || checkin_time || CHR(10) ||
                                      '• 체크아웃: ' || checkout_time || CHR(10) ||
                                      '• 최대 인원: ' || max_capacity || '명' || CHR(10) ||
                                      '• 주차 가능 여부는 호스트에게 문의해주세요' || CHR(10) ||
                                      '• 반려동물 동반은 사전 협의가 필요합니다' || CHR(10) ||
                                      '• 시설 내 금연입니다' || CHR(10) ||
                                      '• 소음 및 파손에 대한 책임은 이용자에게 있습니다'),
  refund_policy = COALESCE(refund_policy, '이용 7일 전까지: 100% 환불' || CHR(10) ||
                                         '이용 6일~3일 전까지: 50% 환불' || CHR(10) ||
                                         '이용 2일~당일: 환불 불가' || CHR(10) ||
                                         'No-Show (미출현): 환불 불가' || CHR(10) ||
                                         CHR(10) ||
                                         '* 천재지변, 호스트 귀책사유로 인한 취소는 100% 환불됩니다' || CHR(10) ||
                                         '* 환불 시 결제수수료는 제외됩니다' || CHR(10) ||
                                         '* 환불 처리는 3-5 영업일이 소요됩니다'),
  seller_info = COALESCE(seller_info, '사업자명: ' || business_id || CHR(10) ||
                                     '소재지: ' || address || ', ' || region || CHR(10) ||
                                     '연락처: 호스트 연락처는 예약 확정 후 제공됩니다' || CHR(10) ||
                                     '통신판매업 신고번호: 제2024-서울강남-0123호' || CHR(10) ||
                                     CHR(10) ||
                                     '* 문의사항이 있으시면 고객센터(1588-0000)로 연락주세요' || CHR(10) ||
                                     '* 운영시간: 평일 09:00~18:00 (주말, 공휴일 휴무)' || CHR(10) ||
                                     '* 이메일: support@stay-oneday.com')
WHERE usage_guide IS NULL OR usage_guide = '' OR
      refund_policy IS NULL OR refund_policy = '' OR
      seller_info IS NULL OR seller_info = '';

-- 인덱스 추가 (성능 향상을 위해)
CREATE INDEX IF NOT EXISTS idx_accommodations_usage_guide ON accommodations USING gin(to_tsvector('english', usage_guide));
CREATE INDEX IF NOT EXISTS idx_accommodations_amenities ON accommodations USING gin(amenities);
CREATE INDEX IF NOT EXISTS idx_accommodations_extra_options ON accommodations USING gin(extra_options);

-- 변경사항 확인
SELECT id, name, usage_guide, refund_policy, seller_info, amenities, extra_options 
FROM accommodations 
LIMIT 5;