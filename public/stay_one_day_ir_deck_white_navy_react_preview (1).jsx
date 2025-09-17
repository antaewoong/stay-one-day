import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

// StayOneDay IR Deck — White/Navy v3 (Print-safe, AI/특장점 확장)
// Fixes & Additions:
// - 인쇄 안정화, 자동 스케일, 안전 여백
// - 도형/배경을 그라디언트로 단순화 (프린트 시 안정)
// - AI Suite, 차별화, 케이스스터디, 데이터/인프라, 파트너십, 리텐션 전략 슬라이드 추가
// Controls: ←/→, A/D = Prev/Next, P = Print Mode, G = Grid Guide

const C = { navy: "#0B1F3A", mint: "#9BB2D9" } as const;

function useScaleToFit() {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const fit = () => {
    const c = containerRef.current, n = contentRef.current;
    if (!c || !n) return;
    const safeH = c.clientHeight - 24 * 2; // 상하 안전 여백
    const needH = n.scrollHeight;
    const next = Math.min(1, safeH / Math.max(needH, 1));
    setScale(Number.isFinite(next) ? next : 1);
  };
  useLayoutEffect(() => {
    fit();
    const on = () => fit();
    window.addEventListener("resize", on);
    const obs = new MutationObserver(fit);
    if (contentRef.current) obs.observe(contentRef.current, { childList: true, subtree: true });
    return () => { window.removeEventListener("resize", on); obs.disconnect(); };
  }, []);
  return { containerRef, contentRef, scale };
}

function SlideChrome({ children, title, subtitle }: { children: React.ReactNode; title?: string; subtitle?: string }) {
  const { containerRef, contentRef, scale } = useScaleToFit();
  return (
    <div ref={containerRef} className="w-full h-full bg-white relative overflow-hidden">
      <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(90% 70% at 85% 15%, rgba(155,178,217,0.18) 0%, rgba(255,255,255,0) 60%), radial-gradient(90% 70% at 10% 90%, rgba(11,31,58,0.10) 0%, rgba(255,255,255,0) 60%)" }} />
      <div className="relative w-full h-full flex items-center justify-center p-6">
        <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }} className="origin-top-left">
          <div ref={contentRef} className="w-[1280px] h-auto">
            <div className="flex items-center justify-between">
              <div className="text-[12px] tracking-wide text-gray-500">stayoneday.co.kr</div>
              <div className="text-[12px] tracking-wide text-gray-500">IR Deck</div>
            </div>
            {(title || subtitle) && (
              <div className="mt-5">
                {title && (
                  <h1 className="font-semibold text-[color:#0B1F3A] leading-[1.15]" style={{ fontSize: "clamp(28px, 3.2vw, 40px)" }}>{title}</h1>
                )}
                {subtitle && (
                  <p className="mt-2 text-gray-600 max-w-3xl" style={{ fontSize: "clamp(15px, 1.6vw, 18px)" }}>{subtitle}</p>
                )}
              </div>
            )}
            <div className="mt-7">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-full border border-[color:#0B1F3A] text-[color:#0B1F3A] px-3 py-1 text-[14px] mr-2 mb-2 break-keep">{children}</span>
  );
}

function Card({ children, title, footer }: { children: React.ReactNode; title?: string; footer?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 shadow-sm p-6 bg-white break-inside-avoid" style={{ pageBreakInside: "avoid" }}>
      {title && <div className="text-[15px] font-medium text-gray-900 mb-3 leading-[1.3]">{title}</div>}
      <div className="max-w-none">{children}</div>
      {footer && <div className="mt-3 text-[12px] text-gray-500">{footer}</div>}
    </div>
  );
}

function Bullets({ items }: { items: (string | React.ReactNode)[] }) { return (
  <ul className="pl-5 space-y-2 text-[17px] text-gray-800">{items.map((it, i) => (<li key={i} className="leading-[1.55] list-disc break-keep">{it}</li>))}</ul>
); }

// ===== Slides =====
const Cover = () => (
  <div className="w-full h-full relative bg-white">
    <div className="absolute inset-0" aria-hidden style={{ background: "linear-gradient(180deg, rgba(11,31,58,0.04) 0%, rgba(255,255,255,0) 40%), radial-gradient(60% 60% at 85% 20%, rgba(155,178,217,0.22) 0%, rgba(255,255,255,0) 60%)" }} />
    <div className="relative h-full flex flex-col justify-center px-16">
      <div className="text-[12px] tracking-widest uppercase text-gray-500">IR Deck · 2025.09.18</div>
      <h1 className="mt-4 font-semibold text-[color:#0B1F3A]" style={{ fontSize: "clamp(44px,5.6vw,64px)", lineHeight: 1.08 }}>StayOneDay</h1>
      <p className="mt-4 text-gray-700 max-w-3xl" style={{ fontSize: "clamp(18px,2.2vw,22px)"}}>프리미엄 스테이의 <b>평일 프라임타임</b>을 열다 — 주말만 꽉 차던 공간을, 평일에도 프라임 매출로.</p>
      <div className="mt-8 flex items-center gap-3 flex-wrap"><Pill>White/Navy</Pill><Pill>Experience-as-a-Product</Pill><Pill>AI Marketing</Pill></div>
    </div>
  </div>
);

const S1 = () => (
  <SlideChrome title="문제 인식 — 프리미엄 숙소의 유휴시간대 손실" subtitle="주말·성수기 만실, 평일·비성수기 공실. 플랫폼 미스핏과 이용 제약으로 자산 효율 저하.">
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-4"><Card title="수요 왜곡"><Bullets items={["주말·성수기 만실 / 평일·비성수기 공실","고정비 높은 자산의 저효율 운영"]} /></Card></div>
      <div className="col-span-4"><Card title="이용 제약"><Bullets items={["기준인원·하우스룰로 모임/체험 어려움","침구 사용 전제의 비용 증가"]} /></Card></div>
      <div className="col-span-4"><Card title="플랫폼 미스핏"><Bullets items={["OTA/대실 = 호텔·모텔 중심","독채·풀빌라 상품화 소극적 → 평일 매출 공백"]} /></Card></div>
    </div>
  </SlideChrome>
);

const S2 = () => (
  <SlideChrome title="우리의 혁신 — ‘프라임타임’ 대여 & 숙박 없는 경험화" subtitle="15:00~23:00 운영. 침구 미사용 전제의 비용 최소화 + 목적기반 경험 상품화">
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-7"><Card><Bullets items={["프라임타임(15:00~23:00) 대여","생일/브라이덜샤워/워크샵/부부모임 등 테마·인원 유연","‘숙박 없는 경험’ 상품화(예약→체험→리뷰)","평일 매출 창출 + 브랜드 체험 접점 확대"]} /></Card></div>
      <div className="col-span-5">
        <div className="rounded-2xl h-full border border-[color:#0B1F3A] p-6 flex flex-col justify-between" style={{ background: "linear-gradient(180deg, #FFFFFF, #F7FAFF)" }}>
          <div>
            <div className="text-sm text-gray-500">Prime Time</div>
            <div className="text-3xl font-semibold text-[color:#0B1F3A]">15:00 → 23:00</div>
            <div className="mt-3 text-gray-700">침구 미사용 / 청소·세탁 비용 최소화</div>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3">{["생일파티","브라이덜샤워","워크샵","부부모임","베이비샤워","클래스/촬영"].map((k) => (<Pill key={k}>{k}</Pill>))}</div>
        </div>
      </div>
    </div>
  </SlideChrome>
);

const S3 = () => (
  <SlideChrome title="강력한 락인 효과" subtitle="이용자 · 호스트 · 인플루언서 3면 가치 동시 증폭">
    <div className="grid grid-cols-3 gap-6">
      <Card title="이용자"><Bullets items={["프리미엄 공간 합리적 가격","기준인원 부담↓ — 그룹/목적 유연","당일 여행/행사, 쉬운 접근"]} /></Card>
      <Card title="호스트(업주)"><Bullets items={["평일 프라임 공실 → 새 매출원","집단 경험 + 리뷰 누적 → 인지도 상승","고정비 증대 없이 자산 효율 극대화"]} /></Card>
      <Card title="인플루언서"><Bullets items={["협찬(유·무·부분유상) 직접 제안","전환/리치 데이터 제공 — 공정/반복 계약","콘텐츠 제작·배포 자동화"]} /></Card>
    </div>
  </SlideChrome>
);

const S4 = () => (
  <SlideChrome title="차별화 — OTA/Dayuse와 무엇이 다른가?">
    <div className="overflow-hidden rounded-2xl border border-gray-200">
      <table className="w-full text-left" style={{ fontSize: "clamp(14px,1.5vw,16px)" }}>
        <thead className="bg-[color:#0B1F3A] text-white">
          <tr><th className="py-4 px-5">구분</th><th className="py-4 px-5">StayOneDay</th><th className="py-4 px-5">OTA(야놀자 등)</th><th className="py-4 px-5">Dayuse</th></tr>
        </thead>
        <tbody>
          {[["상품","독채·풀빌라·테마 스테이","모텔/호텔 중심","호텔 중심"],["이용","테마모임/체험·그룹","숙박/대실","낮 대실"],["인원","유연(제한 최소화)","제한적","대개 2~4인"],["타깃","다양한 그룹/목적","커플·소가구","비즈니스/트랜짓"],["핵심가치","평일 프라임타임 ‘경험화’","숙박 객실 판매","낮 시간 객실 활용"]].map((row, i) => (
            <tr key={i} className={i % 2 ? "bg-gray-50" : "bg-white"}>{row.map((cell, j) => (<td key={j} className="py-4 px-5 text-gray-800">{cell}</td>))}</tr>
          ))}
        </tbody>
      </table>
    </div>
  </SlideChrome>
);

// NEW: AI Suite — 구체 기능
const S5A = () => (
  <SlideChrome title="AI Suite — 실전형 자동화 & 인사이트" subtitle="콘텐츠 제작·수요예측·가격·매칭·검색·리스크까지 풀스택 AI">
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-6"><Card title="AI-01 PrimeTime 수요예측">
        <Bullets items={["지역/요일/날씨/이벤트 시그널 기반 피크 예측","추천 테마·인원 제안, 가용 슬롯 최적화"]} />
      </Card></div>
      <div className="col-span-6"><Card title="AI-02 스마트 가격/패키징">
        <Bullets items={["프라임타임 가용률·경쟁도·전환률로 동적 가격","침구 미사용 '경험형' 패키지 자동 구성"]} />
      </Card></div>
      <div className="col-span-6"><Card title="AI-03 숏폼 자동 제작">
        <Bullets items={["호스트 사진만 업로드→씬 컷/자막/후킹 자동","네이버·인스타·유튜브 쇼츠 규격 지원"]} />
      </Card></div>
      <div className="col-span-6"><Card title="AI-04 인플루언서 ROI 스코어">
        <Bullets items={["도달/참여/전환 데이터로 성과지수 산출","역제안-채택-성과까지 파이프라인 자동화"]} />
      </Card></div>
      <div className="col-span-6"><Card title="AI-05 검색·노출 어드바이저">
        <Bullets items={["네이버 플레이스/지도/키워드 시그널 분석","리뷰·사진·메뉴/태그 최적화 액션 추천"]} /></Card></div>
      <div className="col-span-6"><Card title="AI-06 리스크/노이즈 가드">
        <Bullets items={["과도 소음/파손 가능성 패턴 탐지","정책 위반 사전 안내·자동 알림"]} /></Card></div>
    </div>
  </SlideChrome>
);

const S5 = () => (
  <SlideChrome title="마케팅·운영 Tech 혁신">
    <div className="grid grid-cols-3 gap-6">
      <Card title="AI 맞춤 리포트(주 2회)"><Bullets items={["노출/검색/리뷰/경쟁사 분석","업주 전용 대시보드"]} /></Card>
      <Card title="원클릭 영상 제작"><Bullets items={["사진 업로드 → 숏폼 자동 생성","바이럴 포맷 템플릿"]} /></Card>
      <Card title="인플루언서 매칭/평가"><Bullets items={["역제안·채택·성과 측정","전 과정 KPI 데이터화"]} /></Card>
    </div>
  </SlideChrome>
);

const S6 = () => (
  <SlideChrome title="시장 기회 & 확장성" subtitle="OTA가 대체하기 어려운 ‘숙박 없는 경험’ 카테고리 개척">
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-7"><Card><Bullets items={["프리미엄 오프라인 공간의 모임·체험·행사화 가속","Dayuse/일본 리조트 벤치마킹","전국 → 해외(일본/대만) 확장","2차 마켓플레이스(패키지/B2B) 비전"]} /></Card></div>
      <div className="col-span-5"><div className="rounded-2xl border border-gray-200 h-full p-6 flex flex-col justify-center items-start" style={{background: "linear-gradient(180deg,#F8FAFC,#FFFFFF)"}}><div className="text-sm text-gray-500 mb-2">지표 입력 자리</div><div className="text-[28px] font-semibold text-[color:#0B1F3A]">TAM 7,000 / SAM 2,500 / SOM(M24) 285</div><p className="mt-2 text-gray-600">GMV: TAM ₩258,720,000,000 · SAM ₩92,400,000,000 · SOM ₩1,239,036,922 (Base). 가정: 평균 세션가 ₩280,000, 연 2% 인상, 12개월 평균 세션수 기준.</p></div></div>
    </div>
  </SlideChrome>
);

const S7 = () => (
  <SlideChrome title="마케팅 전략 — 실전 · 타깃 · 확산">
    <div className="grid grid-cols-2 gap-6">
      <Card title="1) 실전 제작형 영상"><Bullets items={["자사 채널 실사 촬영/편집/성과 검증","평일 데이트립 인터뷰·VLOG"]} /></Card>
      <Card title="2) 초정밀 타겟 퍼포먼스"><Bullets items={["업주 정조준: 콘솔 관심군/운영 커뮤니티","리마케팅·서치 + 직접 방문 리타게팅","후킹: ‘평일만으로 만실’ 등"]} /></Card>
      <Card title="3) 인플루언서·체험단 UGC"><Bullets items={["영상 내 모집 CTA","기여도·영향력·퀄리티 기준 선별","자유 제안 + 성과 데이터화"]} /></Card>
      <Card title="4) 일반 확산 + 5) 선순환"><Bullets items={["1회 무료권 SNS 바이럴 / 2회차 50%","콘텐츠↔SNS/검색↔앱 일원화","초기 성공사례 플라이휠"]} /></Card>
    </div>
  </SlideChrome>
);

// NEW: 차별화 핵심 특장점
const S7A = () => (
  <SlideChrome title="Core Differentiators — 왜 StayOneDay인가" subtitle="독채·풀빌라 특화 경험 상품화 + 데이터/콘텐츠/AI 모트">
    <div className="grid grid-cols-3 gap-6">
      <Card title="경험형 상품화 DNA"><Bullets items={["침구 미사용 운영 설계(비용↓)","테마·그룹 유연성 — 장벽↓"]} /></Card>
      <Card title="데이터·콘텐츠 내재화"><Bullets items={["UGC/숏폼 대량 생산 파이프라인","리뷰·검색·전환 데이터 축적"]} /></Card>
      <Card title="AI 풀스택"><Bullets items={["수요예측/가격/매칭/SEO/리스크","호스트 액션 추천 → 실행률↑"]} /></Card>
    </div>
  </SlideChrome>
);

const S8 = () => (
  <SlideChrome title="비즈니스 모델 & 수익 구조">
    <div className="grid grid-cols-3 gap-6">
      <Card title="거래 수수료"><Bullets items={["프라임타임 예약금액 × 8~15%"]} /></Card>
      <Card title="SaaS 구독"><Bullets items={["AI 리포트/매칭/영상툴"]} /></Card>
      <Card title="부가매출 · B2B"><Bullets items={["프로덕션/에이전시","기업 오프사이트 패키지"]} /></Card>
    </div>
  </SlideChrome>
);

const S9 = () => (
  <SlideChrome title="유닛 이코노믹스(가정값)">
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-6"><Card title="핵심 지표"><Bullets items={["CAC(퍼포먼스+UGC)","LTV(재방문/구독/부가)","Payback < X개월"]} /></Card></div>
      <div className="col-span-6"><div className="rounded-2xl border border-dashed border-[color:#0B1F3A] h-56 flex items-center justify-center text-[color:#0B1F3A]">M12: GMV ₩628,545,174 · Rev ₩80,385,373 · GP ₩64,671,744
Host 기여(월) ₩410,722 / CAC ₩350,000 → Payback 0.9개월</div></div>
    </div>
  </SlideChrome>
);

// NEW: 케이스 스터디 (구공스테이 청주 — 예시)
const S10A = () => (
  <SlideChrome title="Case Study — 구공스테이 청주 (예시)" subtitle="실측/정식 수치 확정 전까지는 가정값 예시로 표기">
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-7"><Card title="전·후 비교(가정)"><Bullets items={["평일 가동률: 12% → 38% (+26pt)","프라임 매출/주: ₩85만 → ₩212만","리뷰/UGC 월 증가: 6 → 21","네이버 노출지수: +34%p"]} /></Card></div>
      <div className="col-span-5"><Card title="활용 액션"><Bullets items={["AI 숏폼 8편 제작 → 쇼츠/리일스 배포","검색 태그/메뉴/사진 최적화 12건 적용","인플루언서 5명 역제안 채택(2회 반복)"]} /></Card></div>
    </div>
  </SlideChrome>
);

const S10 = () => (
  <SlideChrome title="초기 실증/트랙션">
    <div className="grid grid-cols-3 gap-6">
      <Card title="파일럿"><Bullets items={["숙소 수 / 지역 / 카테고리","평일 프라임 예약률 변화"]} /></Card>
      <Card title="퍼널"><Bullets items={["노출→도달→클릭→예약","리뷰/UGC 전환"]} /></Card>
      <Card title="후기/리텐션"><Bullets items={["업주 후기 캡처","재계약/반복률"]} /></Card>
    </div>
  </SlideChrome>
);

// NEW: 제품 깊이 — 대시보드/콘솔
const S11A = () => (
  <SlideChrome title="제품 Deep Dive — 호스트 대시보드 & 인플루언서 콘솔">
    <div className="grid grid-cols-2 gap-6">
      <Card title="호스트 대시보드(요약)"><Bullets items={["주 2회 AI 리포트 — 노출/검색/리뷰/경쟁","추천 액션 1-클릭 적용(태그/사진/설명)","프라임타임 캘린더 — 가격/슬롯 자동 제안","정산/환불/리스크 알림"]} /></Card>
      <Card title="인플루언서 콘솔(요약)"><Bullets items={["캠페인 역제안·채택·콘텐츠 검수","ROI 스코어/성과 리포트 자동화","UGC 저작권/활용 범위 관리"]} /></Card>
    </div>
  </SlideChrome>
);

// NEW: 데이터/인프라 구성
const S12A = () => (
  <SlideChrome title="데이터 & 인프라 — 안정·확장 지향">
    <div className="grid grid-cols-3 gap-6">
      <Card title="스택"><Bullets items={["Next.js 15 · TypeScript · Tailwind","Vercel Edge/SSR · Railway/Render (서비스)","Supabase(Postgres+RLS) · Storage","Config/Feature Flag · Log/Metric 수집"]} /></Card>
      <Card title="데이터 파이프라인"><Bullets items={["클라이언트/서버 이벤트 수집","세션→전환 퍼널 ETL/집계","대시보드 시각화(KPI)"]} /></Card>
      <Card title="보안·프라이버시"><Bullets items={["RLS/권한 레이어 분리","PII 최소 수집·암호화 저장","감사로그/알림"]} /></Card>
    </div>
  </SlideChrome>
);

// NEW: 파트너십 & 디스트리뷰션
const S14A = () => (
  <SlideChrome title="파트너십 & 디스트리뷰션">
    <div className="grid grid-cols-3 gap-6">
      <Card title="리조트/사진/웨딩"><Bullets items={["브라이덜/가족촬영/베이비샤워 연계","스튜디오/플래너 번들"]} /></Card>
      <Card title="로컬 액티비티"><Bullets items={["클래스/체험 패키지","식음료/케이터링 제휴"]} /></Card>
      <Card title="B2B 오프사이트"><Bullets items={["기업 팀데이/워크숍","평일 대량 수요 채널"]} /></Card>
    </div>
  </SlideChrome>
);

// NEW: 리텐션/리퍼럴 엔진
const S18A = () => (
  <SlideChrome title="리텐션 & 리퍼럴 — 탄탄한 반복수요">
    <div className="grid grid-cols-3 gap-6">
      <Card title="2회차 50%/친구초대"><Bullets items={["두번째 이용 강력 할인","초대 코드/적립"]} /></Card>
      <Card title="호스트 Success Program"><Bullets items={["월간 리뷰·UGC 챌린지","상위 호스트 뱃지/프로모션"]} /></Card>
      <Card title="콘텐츠 루프"><Bullets items={["현장 촬영→SNS→검색→예약","콘텐츠→입점 문의 플라이휠"]} /></Card>
    </div>
  </SlideChrome>
);

const S11 = () => (
  <SlideChrome title="제품 하이라이트">
    <div className="grid grid-cols-3 gap-6">
      <Card title="예약 플로우"><Bullets items={["테마→인원/시간→결제→접근안내"]} /></Card>
      <Card title="호스트 대시보드"><Bullets items={["AI 리포트/캠페인/리뷰·UGC/정산"]} /></Card>
      <Card title="인플루언서 콘솔"><Bullets items={["제안·캠페인·성과 데이터"]} /></Card>
    </div>
  </SlideChrome>
);

const S12 = () => (
  <SlideChrome title="데이터 & 아키텍처 요약">
    <div className="grid grid-cols-2 gap-6">
      <Card title="데이터 파이프라인"><Bullets items={["노출/세션/전환/리뷰 이벤트 수집","DWH/대시보드 집계"]} /></Card>
      <Card title="AI/신뢰/안전"><Bullets items={["테마·지역·그룹 추천 & 액션 제안","정책 위반 모니터링/개인정보 준수"]} /></Card>
    </div>
  </SlideChrome>
);

const S13 = () => (
  <SlideChrome title="로드맵">
    <div className="grid grid-cols-4 gap-4">
      {[{ t: "2025.10~11", d: "베타 · 파일럿 1차 온보딩" },{ t: "2025.12", d: "매칭·영상툴 고도화 · KPI 대시보드" },{ t: "2026.01~03", d: "전국 확장 1차 · B2B 런칭" },{ t: "2026.Q2", d: "해외 1차 테스트 · 2차 마켓플레이스 PoC" }].map((x, i) => (
        <div key={i} className="rounded-2xl border border-gray-200 p-5 break-inside-avoid" style={{ pageBreakInside: "avoid" }}>
          <div className="text-sm text-gray-500">{x.t}</div>
          <div className="mt-2 text-[17px] text-gray-900">{x.d}</div>
        </div>
      ))}
    </div>
  </SlideChrome>
);

const S14 = () => (
  <SlideChrome title="경쟁/대체재 & 무형자산(모트)">
    <div className="grid grid-cols-2 gap-6">
      <Card title="경쟁/대체재"><Bullets items={["OTA, 호텔 대실, 파티룸 플랫폼"]} /></Card>
      <Card title="차별 포인트 & 모트"><Bullets items={["독채·풀빌라 특화 · ‘숙박 없는 경험’ 리더","데이터/UGC 제작 역량","AI 리포트/추천 노하우"]} /></Card>
    </div>
  </SlideChrome>
);

const S15 = () => (
  <SlideChrome title="규제·리스크 & 대응">
    <div className="grid grid-cols-3 gap-6">
      <Card title="규제"><Bullets items={["지자체 가이드 준수","파티룸 불법 운영과 명확 구분"]} /></Card>
      <Card title="공급/수요 확보"><Bullets items={["인플루언서·체험단 병행","B2B 수요 선제 확보"]} /></Card>
      <Card title="브랜드·안전"><Bullets items={["품질 기준·리뷰 정책","보험/안전 가이드·노이즈 관리"]} /></Card>
    </div>
  </SlideChrome>
);

// NEW: 안정화·고도화 — 안전망과 UX 우선
const S15A = () => (
  <SlideChrome title="안정화·고도화 — 안전망과 UX 우선" subtitle="사용자 증가 시 동시접속·성능·안정성을 선제적으로 확보">
    <div className="grid grid-cols-3 gap-6">
      <Card title="아키텍처 & HA/DR">
        <Bullets items={[
          "멀티 AZ(Active-Standby) + DB HA(Postgres Replication)",
          "PITR 백업·스냅샷·오브젝트 버저닝",
          "비밀키/권한 계층화 · 감사로그"
        ]} />
      </Card>
      <Card title="릴리즈 엔지니어링">
        <Bullets items={[
          "스테이징에서 먼저 업데이트 후 상용 적용",
          "Blue/Green 또는 카나리(10%→50%→100%)",
          "Feature Flag · e2e/스모크 · 5분 롤백"
        ]} />
      </Card>
      <Card title="성능 & 보안·관측">
        <Bullets items={[
          "Auto Scaling/HPA · CDN/WAF · Rate Limit",
          "동영상/이미지 비동기 큐 처리",
          "OpenTelemetry(Trace/Log/Metric) · Runbook · 분기별 부하테스트(k6)"
        ]} />
      </Card>
    </div>
  </SlideChrome>
);

const S16 = () => (
  <SlideChrome title="재무 계획(24개월) — 3-시나리오" subtitle="Conservative / Base / Aggressive 기준 가정치로 산출">
    <div className="grid grid-cols-3 gap-6">
      <Card title="Conservative">
        <Bullets items={[
          "M12 GMV ₩320.1M · Rev ₩34.0M",
          "M24 GMV ₩653.6M · Rev ₩68.8M",
          "M24 EBITDA ₩-51.8M",
          "BEP n/a (24M 내 미도달)",
          "M24 Hosts 172",
          "Payback@M12 1.8개월"
        ]} />
      </Card>
      <Card title="Base">
        <Bullets items={[
          "M12 GMV ₩628.5M · Rev ₩80.4M",
          "M24 GMV ₩1.326B · Rev ₩168.1M",
          "M24 EBITDA ₩29.0M",
          "BEP M15 (2026-12)",
          "M24 Hosts 285",
          "Payback@M12 0.9개월"
        ]} />
      </Card>
      <Card title="Aggressive">
        <Bullets items={[
          "M12 GMV ₩1.312B · Rev ₩195.9M",
          "M24 GMV ₩2.944B · Rev ₩435.7M",
          "M24 EBITDA ₩234.0M",
          "BEP M7 (2026-04)",
          "M24 Hosts 523",
          "Payback@M12 0.5개월"
        ]} />
      </Card>
    </div>
    <div className="mt-6 grid grid-cols-2 gap-6">
      <Card title="가정치 하이라이트">
        <Bullets items={[
          "Take rate: 10% / 12% / 14%",
          "SaaS ARPU: ₩80k / ₩90k / ₩100k — Opt-in: 25% / 35% / 45%",
          "신규 호스트/월: 10 / 15 / 25 — 이탈: 3% / 2% / 1%",
          "세션/호스트 M12: 11 / 14 / 16 — M24: 13 / 16 / 18"
        ]} />
      </Card>
      <Card title="참고">
        <Bullets items={[
          "수치는 2025-10 시작 24개월 시뮬레이션(엑셀 제공)",
          "민감도 테이블/추가 시나리오 즉시 확장 가능"
        ]} />
      </Card>
    </div>
  </SlideChrome>
);

const S17 = () => (
  <SlideChrome title="투자 유치(Seed) & Milestone" subtitle="초기 진입이지만 안전망과 사용자 경험을 최우선으로">
    <div className="grid grid-cols-2 gap-6">
      <Card title="Ask (Seed)">
        <Bullets items={[
          "규모: ₩3억 ~ ₩5억",
          "Valuation: 협의",
          "Use of Funds (12개월): 엔지니어링/프로덕트 45% · 인프라/신뢰성 25% · 그로스/콘텐츠 20% · 운영/컴플라이언스 10%"
        ]} />
      </Card>
      <Card title="Milestones">
        <Bullets items={[
          "M+6: 파일럿 80호스트 / 월 GMV ₩4억 / 99.9% 가용성",
          "M+12: 180호스트 / 월 GMV ₩8억 / CAC<₩40만 / Payback<1.2개월",
          "플랫폼 안정화: 스테이징→상용 Blue/Green·카나리 배포, 롤백≤5분"
        ]} />
      </Card>
    </div>
  </SlideChrome>
);

const S18 = () => (
  <SlideChrome title="팀 & 어드바이저">
    <div className="grid grid-cols-3 gap-6">
      <Card title="Founder·Core Team"><Bullets items={["호스피탈리티/마케팅/데이터/제품"]} /></Card>
      <Card title="Advisor"><Bullets items={["업계/규제/데이터/콘텐츠"]} /></Card>
      <Card title="Hiring"><Bullets items={["마케팅·콘텐츠·세일즈·데이터"]} /></Card>
    </div>
  </SlideChrome>
);

const S19 = () => (
  <SlideChrome title="Appendix — 데이터룸 & Q&A">
    <div className="grid grid-cols-2 gap-6">
      <Card title="데이터룸"><Bullets items={["파일럿 KPI/퍼널/리뷰","호스트 Economics","리스크 로그"]} /></Card>
      <Card title="지표 정의서"><Bullets items={["CAC/LTV/PB/전환율 측정법"]} /></Card>
    </div>
  </SlideChrome>
);

const slides = [
  { key: "cover", el: <Cover /> },
  { key: "s1", el: <S1 /> },
  { key: "s2", el: <S2 /> },
  { key: "s3", el: <S3 /> },
  { key: "s4", el: <S4 /> },
  { key: "s5A", el: <S5A /> },
  { key: "s5", el: <S5 /> },
  { key: "s6", el: <S6 /> },
  { key: "s7", el: <S7 /> },
  { key: "s7A", el: <S7A /> },
  { key: "s8", el: <S8 /> },
  { key: "s9", el: <S9 /> },
  { key: "s10A", el: <S10A /> },
  { key: "s10", el: <S10 /> },
  { key: "s11A", el: <S11A /> },
  { key: "s11", el: <S11 /> },
  { key: "s12A", el: <S12A /> },
  { key: "s12", el: <S12 /> },
  { key: "s13", el: <S13 /> },
  { key: "s14A", el: <S14A /> },
  { key: "s14", el: <S14 /> },
  { key: "s15", el: <S15 /> },
  { key: "s15A", el: <S15A /> },
  { key: "s16", el: <S16 /> },
  { key: "s17", el: <S17 /> },
  { key: "s18A", el: <S18A /> },
  { key: "s18", el: <S18 /> },
  { key: "s19", el: <S19 /> },
];

export default function IRDeck() {
  const [i, setI] = useState(0);
  const [gridGuide, setGridGuide] = useState(false);
  const last = slides.length - 1;
  const go = (idx: number) => setI(Math.max(0, Math.min(last, idx)));
  const next = () => go(i + 1);
  const prev = () => go(i - 1);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "arrowright" || k === "d") next();
      if (k === "arrowleft" || k === "a") prev();
      if (k === "p") document.documentElement.classList.toggle("print-mode");
      if (k === "g") setGridGuide((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [i]);
  return (
    <div className="w-full h-full min-h-[80vh] bg-white text-[color:#0B1F3A] selection:bg-[#9BB2D9]/30">
      <div className="max-w-[1440px] mx-auto">
        <div className="relative rounded-3xl overflow-hidden border border-gray-200 shadow-xl mt-6">
          <div className="aspect-[16/9] bg-white">{slides[i].el}</div>
          <button onClick={prev} className="absolute inset-y-0 left-0 w-1/6 opacity-0" aria-label="Prev" />
          <button onClick={next} className="absolute inset-y-0 right-0 w-1/6 opacity-0" aria-label="Next" />
          <div className="absolute bottom-0 left-0 h-1 bg-[color:#9BB2D9]" style={{ width: `${((i + 1) / slides.length) * 100}%` }} />
        </div>
        <div className="flex items-center justify-between mt-3 px-1">
          <div className="text-sm text-gray-500">←/→ or A/D · P=프린트 · G=그리드</div>
          <div className="text-sm text-gray-500">{i + 1} / {slides.length}</div>
        </div>
      </div>
      <style>{`
        @page { size: 297mm 210mm; margin: 10mm; }
        @media print {
          html.print-mode body { background: #fff; }
          .print-mode .aspect-\[16\/9\] { aspect-ratio: auto; height: 178mm; }
          .print-mode table, .print-mode .break-inside-avoid { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
