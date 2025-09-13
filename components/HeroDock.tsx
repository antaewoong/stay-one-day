"use client";
import { useEffect, useRef, useState } from "react";

function clamp(n: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, n));
}

export default function HeroDock() {
  const heroRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const raf = useRef<number>();
  const [p, setP] = useState(0); // 0: 히어로 상태, 1: 헤더 도킹상태

  useEffect(() => {
    const calc = () => {
      const hero = heroRef.current;
      const dock = dockRef.current;
      if (!hero || !dock) return;

      const heroTop = hero.offsetTop;
      const heroH = hero.offsetHeight;

      // 언제부터 축소 시작/도킹 완료로 볼지 (필요시 미세조정)
      const start = heroTop + heroH * 0.40;   // 축소 시작 지점
      const end   = heroTop + heroH - 56;     // 헤더(약 56px) 도킹 지점

      const y = window.scrollY;
      const raw = (y - start) / Math.max(1, end - start);
      setP(clamp(raw));
    };

    const onScroll = () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(calc);
    };

    calc(); // 초기 1회
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", calc);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", calc);
    };
  }, []);

  return (
    <div className="relative">
      {/* 헤더(투명 시작 → 도킹 후 배경) */}
      <header className="sticky top-0 z-[60] safe-pt">
        <div className={`h-14 transition-colors duration-200 ${p > 0.85 ? "bg-white/80 backdrop-blur" : "bg-transparent"}`} />
      </header>

      {/* 히어로 */}
      <section
        ref={heroRef}
        className="relative min-h-[72svh] bg-center bg-cover"
        style={{ backgroundImage: "url(/hero.jpg)" }}
      >
        <div className="absolute inset-0 bg-black/25" />
        <div className="relative mx-auto max-w-5xl px-4 pt-20 pb-16">
          {/* 로고: 스크롤하며 페이드아웃 */}
          <div
            className="text-white text-2xl font-semibold mb-5 will-change-opacity"
            style={{ opacity: 1 - p, transition: "opacity 150ms ease-out" }}
          >
            LOGO
          </div>

          {/* 검색창: 하나의 DOM 요소가 sticky로 위에 '도킹' */}
          <div ref={dockRef} className="sticky z-[55] top-[calc(var(--sat,0px)+8px)]">
            <div
              className="will-change-transform transition-[border-radius,box-shadow] duration-150"
              style={{
                transform: `scale(${1 - 0.18 * p})`,
                borderRadius: `calc(22px - 10px * ${p})`,
                boxShadow: p > 0.95 ? "0 8px 24px rgba(0,0,0,0.12)" : "none",
              }}
            >
              <SearchBar compact={p > 0.6} />
            </div>
          </div>
        </div>
      </section>

      {/* 이하 콘텐츠 */}
      <main className="max-w-5xl mx-auto px-4 py-10">
        {/* ... */}
      </main>
    </div>
  );
}

function SearchBar({ compact }: { compact: boolean }) {
  return (
    <form
      className={`w-full bg-white px-4 ${compact ? "py-2 h-12" : "py-4 h-16"} rounded-2xl flex items-center gap-3`}
      style={{ transition: "height 150ms ease-out, padding 150ms ease-out" }}
      onSubmit={(e) => { e.preventDefault(); /* TODO: 라우팅 */ }}
    >
      <input className="flex-1 outline-none" placeholder="어디로 떠나세요?" />
      <button className="px-3 py-2 rounded-xl bg-black text-white text-sm">검색</button>
    </form>
  );
}