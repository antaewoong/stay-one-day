"use client";

import { Search, Heart, Users } from 'lucide-react';

interface SearchBarProps {
  /** 상단 고정 상태인지 여부 (버튼 표시용) */
  isPinned?: boolean;
}

export default function SearchBar({ isPinned = false }: SearchBarProps) {
  const handleClick = () => {
    const event = new CustomEvent('openSearchModal');
    window.dispatchEvent(event);
  };

  return (
    <div
      className="w-full bg-white/95 backdrop-blur-sm py-2.5 px-5 h-11 rounded-full flex items-center gap-3 cursor-pointer hover:bg-white/98 transition-all duration-150 shadow-lg border-0 relative"
      onClick={handleClick}
    >
      <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
      <div className="flex-1 text-left">
        <div className="text-gray-500 font-normal text-base">
          온전한 쉼, 완벽한 하루
        </div>
      </div>

      {/* 상단 고정 시에만 우측 버튼들 표시 */}
      {isPinned && (
        <div className="flex items-center gap-1">
          <button className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-300">
            <Heart className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-300">
            <Users className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}