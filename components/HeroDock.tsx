"use client";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";

function clamp(n: number, min = 0, max = 1) { 
  return Math.max(min, Math.min(max, n)); 
}

interface HeroDockProps {
  slides?: any[];
}

export default function HeroDock({ slides = [] }: HeroDockProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(0); // 0 = 히어로 상태, 1 = 헤더 도킹

  useEffect(() => {
    const onScroll = () => {
      const hero = heroRef.current;
      const sticky = stickyRef.current;
      if (!hero || !sticky) return;

      const h = hero.getBoundingClientRect();
      const s = sticky.getBoundingClientRect();
      
      // 진행도 정의: 검색창 상단이 뷰포트 top에 가까워질수록 1
      const startY = h.top + h.height * 0.40; // 히어로 40% 지점부터 축소 시작
      const endY = 8; // 헤더 safe-top 여백
      const raw = (startY - s.top) / Math.max(1, startY - endY);
      setP(clamp(raw));
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const currentSlide = slides[0] || {};

  return (
    <div className="relative">
      {/* 헤더 (투명 시작 → 도킹 후 배경) */}
      <header className="sticky top-0 z-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div 
          className={`h-14 transition-colors duration-200 ${
            p > 0.85 ? "bg-white/80 backdrop-blur border-b border-gray-100/50" : "bg-transparent"
          }`} 
        />
      </header>

      {/* 히어로 */}
      <section
        ref={heroRef}
        className="relative min-h-[72vh] bg-center bg-cover bg-gray-900"
        style={{ 
          backgroundImage: currentSlide.image_url || currentSlide.image 
            ? `linear-gradient(135deg, rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.15)), url('${currentSlide.image_url || currentSlide.image}')`
            : 'linear-gradient(135deg, rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.15))'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
        
        <div className="relative mx-auto max-w-5xl px-4 md:px-8 pt-6 pb-16">
          {/* 로고와 메뉴: 스크롤하며 페이드아웃 */}
          <div
            className="flex items-center justify-between mb-8 will-change-opacity"
            style={{ 
              opacity: 1 - p, 
              transition: "opacity 150ms ease-out",
              transform: `translateY(${p * -15}px)`
            }}
          >
            {/* 로고 */}
            <div className="text-white text-lg md:text-2xl font-light tracking-wide">
              stay<span className="font-medium">oneday</span>
            </div>
            
            {/* 우측 메뉴 */}
            <div className="flex items-center">
              {/* 데스크탑 텍스트 메뉴 */}
              <div className="hidden md:flex items-center gap-8 text-white text-sm font-medium mr-8">
                <a href="/spaces" className="hover:text-white/80 transition-colors">FIND STAY</a>
                <a href="/promotion" className="hover:text-white/80 transition-colors">PROMOTION</a>
                <a href="/journal" className="hover:text-white/80 transition-colors">JOURNAL</a>
                <a href="/preorder" className="hover:text-white/80 transition-colors">PRE-ORDER</a>
              </div>
              
              {/* 우측 아이콘들 */}
              <div className="flex items-center gap-1 md:gap-2">
                <button className="p-1.5 md:p-2 text-white hover:bg-white/10 rounded-full transition-colors">
                  <Search className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                <button className="p-1.5 md:p-2 text-white hover:bg-white/10 rounded-full transition-colors">
                  <Search className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* 검색창: 하나의 DOM이 sticky로 위로 올라감 */}
          <div 
            ref={stickyRef} 
            className="sticky"
            style={{ 
              top: 'calc(env(safe-area-inset-top) + 8px)',
              zIndex: 40
            }}
          >
            <div
              className="will-change-transform transition-[border-radius,box-shadow] duration-150 ease-out mx-auto"
              style={{
                transform: `scale(${1 - 0.18 * p})`,
                borderRadius: `${22 - 10 * p}px`,
                boxShadow: p > 0.95 ? "0 8px 24px rgba(0,0,0,0.12)" : "0 2px 12px rgba(0,0,0,0.08)",
                maxWidth: p > 0.6 ? '480px' : '600px',
                transition: 'max-width 150ms ease-out'
              }}
            >
              <SearchBar compact={p > 0.6} />
            </div>
          </div>

          {/* 히어로 텍스트 */}
          <div 
            className="mt-16 max-w-lg will-change-opacity"
            style={{ 
              opacity: 1 - p * 1.5, 
              transition: "opacity 150ms ease-out",
              transform: `translateY(${p * 20}px)`
            }}
          >
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 tracking-tight drop-shadow-2xl leading-tight">
              {currentSlide?.title || currentSlide?.headline || '감성에서 머무는'}
            </h1>
            <h2 className="text-lg md:text-xl font-light text-white/90 mb-2 tracking-wide drop-shadow-lg">
              {currentSlide?.subtitle || currentSlide?.subheadline || '아주 특별한 감성이 흘러'}
            </h2>
            <p className="text-sm md:text-base text-white/80 font-light tracking-wide drop-shadow-md">
              특별한 공간에서의 완벽한 하루를 만나보세요
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

// 검색바 컴포넌트
function SearchBar({ compact }: { compact: boolean }) {
  const handleOpenModal = () => {
    const event = new CustomEvent('openSearchModal');
    window.dispatchEvent(event);
  };

  return (
    <div
      className={`w-full bg-white/95 backdrop-blur-sm px-5 ${
        compact ? "py-2 h-12" : "py-3 h-14"
      } rounded-full flex items-center gap-3 cursor-pointer hover:bg-white/98 transition-all duration-150 shadow-lg`}
      onClick={handleOpenModal}
    >
      <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
      <div className="flex-1 text-left">
        <div className={`text-gray-500 font-medium ${compact ? 'text-sm' : 'text-sm md:text-base'}`}>
          <span className="md:hidden">검색</span>
          <span className="hidden md:inline">어디든 검색하세요</span>
        </div>
      </div>
    </div>
  );
}