"use client";

import { useEffect, useRef, useState, PropsWithChildren } from "react";
import { LayoutGroup, motion } from "framer-motion";

type SearchDockProps = {
  /** 히어로에 떠 있을 때 가로폭 (vw 퍼센트 또는 px) */
  heroWidth?: string;                // 기본: "66.6667vw" (뷰포트 2/3)
  /** 데스크톱 상단 고정 시 컨테이너 최대폭 */
  pinnedMaxWidth?: number;           // 기본: 920
  /** 상단 고정 바의 높이(padding 포함) */
  pinnedBarHeight?: number;          // 기본: 64
  /** 스크롤 임계 판단을 위한 관찰 높이(히어로 하단에서 얼마 지나면 고정할지) */
  pinThresholdPx?: number;           // 기본: 120
  /** 상단 고정바 배경(투명도/블러 포함) */
  pinnedBarClassName?: string;       // 기본: ""
  /** 모바일 상단 고정 시 좌우 패딩 (px) */
  pinnedPaddingX?: number;           // 기본: 16
  /** 애니메이션 스프링 세팅 */
  stiffness?: number;                // 기본: 500
  damping?: number;                  // 기본: 50
  /** 렌더 함수로 pinned 상태를 전달 */
  children: React.ReactNode | ((pinned: boolean) => React.ReactNode);
};

/**
 * 하나의 동일 요소가 히어로 중앙(2/3 너비) → 상단 고정(모바일 100vw)로
 * 부드럽게 이동/확장되는 공유 레이아웃 전환 컴포넌트.
 * children 자리에 실제 검색창 컴포넌트를 넣어주세요.
 */
export default function SearchDock({
  children,
  heroWidth = "66.6667vw",
  pinnedMaxWidth = 920,
  pinnedBarHeight = 64,
  pinThresholdPx = 120,
  pinnedBarClassName = "",
  pinnedPaddingX = 16,
  stiffness = 500,
  damping = 50,
}: SearchDockProps) {
  const [pinned, setPinned] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // IntersectionObserver로 히어로 하단 기준 고정 토글 (안정적)
  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;

    // 루트뷰포트 상단에서 pinThresholdPx만큼 지나면 pinned = true
    const observer = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        // sentinel이 화면 안에 보이면 아직 히어로 상태 (pinned=false)
        // sentinel이 위로 사라지면 상단 고정 (pinned=true)
        setPinned(!e.isIntersecting);
      },
      {
        root: null,
        rootMargin: `-${pinThresholdPx}px 0px 0px 0px`,
        threshold: 0,
      }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [pinThresholdPx]);

  return (
    <>
      {/* 히어로 섹션 아래에 센티넬 배치: 이 지점을 지나면 pinned 전환 */}
      <div ref={sentinelRef} aria-hidden className="pointer-events-none h-0 w-0" />

      <LayoutGroup>
        {/* 히어로 상태: 중앙 2/3, 최대 720px 정도로 자연스럽게 */}
        {!pinned && (
          <motion.div
            layoutId="search-dock"
            transition={{ type: "spring", stiffness, damping }}
            className="mx-auto"
            style={{ width: heroWidth, maxWidth: 720 }}
          >
            {typeof children === 'function' ? children(pinned) : children}
          </motion.div>
        )}

        {/* 상단 고정 상태: 모바일 100vw 채움, 데스크톱은 maxWidth로 제어 */}
        {pinned && (
          <motion.div
            layoutId="search-dock"
            transition={{ type: "spring", stiffness, damping }}
            className={`fixed left-0 right-0 top-0 z-40 ${pinnedBarClassName}`}
            style={{ height: pinnedBarHeight }}
          >
            <div
              className="mx-auto flex h-full items-center"
              style={{
                paddingLeft: pinnedPaddingX,
                paddingRight: pinnedPaddingX,
                maxWidth: pinnedMaxWidth,
                width: "100vw",
              }}
            >
              <div className="w-full">{typeof children === 'function' ? children(pinned) : children}</div>
            </div>
          </motion.div>
        )}
      </LayoutGroup>

      {/* 상단바가 뜰 때 레이아웃 밀림 방지용 placeholder (고정바 높이만큼) */}
      <div style={{ height: pinned ? pinnedBarHeight : 0 }} aria-hidden />
    </>
  );
}