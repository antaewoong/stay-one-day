'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  ChevronDown, 
  ChevronRight, 
  Bell,
  MessageCircle,
  Building2,
  Calendar,
  Calculator,
  BarChart3,
  Settings,
  Home,
  Users,
  DollarSign,
  Camera,
  Star,
  Menu,
  X
} from 'lucide-react'

interface MenuItem {
  title: string
  href?: string
  icon: React.ReactNode
  children?: MenuItem[]
}

const menuItems: MenuItem[] = [
  {
    title: '대시보드',
    href: '/host',
    icon: <BarChart3 className="w-4 h-4" />
  },
  {
    title: '내 숙소 관리',
    icon: <Building2 className="w-4 h-4" />,
    children: [
      { title: '숙소 목록', href: '/host/accommodations', icon: <></> },
      { title: '새 숙소 등록', href: '/host/accommodations/add', icon: <></> },
      { title: '사진 관리', href: '/host/accommodations/photos', icon: <></> }
    ]
  },
  {
    title: '예약 관리',
    icon: <Calendar className="w-4 h-4" />,
    children: [
      { title: '예약 현황', href: '/host/reservations', icon: <></> },
      { title: '예약 달력', href: '/host/reservations/calendar', icon: <></> },
      { title: '체크인/아웃', href: '/host/reservations/checkin', icon: <></> }
    ]
  },
  {
    title: '리뷰 관리',
    href: '/host/reviews',
    icon: <Star className="w-4 h-4" />
  },
  {
    title: '게스트 문의',
    href: '/host/inquiries',
    icon: <MessageCircle className="w-4 h-4" />
  },
  {
    title: '정산 관리',
    icon: <Calculator className="w-4 h-4" />,
    children: [
      { title: '정산 내역', href: '/host/settlement/history', icon: <></> },
      { title: '수익 분석', href: '/host/settlement/analytics', icon: <></> },
      { title: '세금 신고', href: '/host/settlement/tax', icon: <></> }
    ]
  },
  {
    title: '호스트 설정',
    href: '/host/settings',
    icon: <Settings className="w-4 h-4" />
  }
]

interface HostSidebarProps {
  isOpen?: boolean
  onToggle?: () => void
}

export default function HostSidebar({ isOpen = true, onToggle }: HostSidebarProps) {
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['내 숙소 관리'])
  const pathname = usePathname()

  const toggleMenu = (title: string) => {
    setExpandedMenus(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    )
  }

  const renderMenuItem = (item: MenuItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedMenus.includes(item.title)
    const isActive = item.href && pathname === item.href

    if (hasChildren) {
      return (
        <div key={item.title} className="mb-1">
          <button
            onClick={() => toggleMenu(item.title)}
            className="w-full flex items-center justify-between px-4 py-3 text-white/90 hover:bg-white/10 hover:text-white transition-colors rounded-md text-sm"
          >
            <div className="flex items-center gap-3">
              {item.icon}
              <span>{item.title}</span>
            </div>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          {isExpanded && (
            <div className="ml-4 mt-1 space-y-1">
              {item.children?.map(child => renderMenuItem(child, depth + 1))}
            </div>
          )}
        </div>
      )
    }

    return (
      <Link
        key={item.title}
        href={item.href || '#'}
        className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors rounded-md mb-1 ${
          isActive 
            ? 'bg-green-600 text-white font-medium' 
            : depth > 0 
              ? 'text-white/80 hover:bg-white/10 hover:text-white pl-8'
              : 'text-white/90 hover:bg-white/10 hover:text-white'
        }`}
      >
        {depth === 0 && item.icon}
        <span>{item.title}</span>
      </Link>
    )
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-green-800 text-white flex flex-col transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Mobile close button */}
        <button
          onClick={onToggle}
          className="lg:hidden absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-md"
        >
          <X className="w-5 h-5" />
        </button>
      {/* Logo */}
      <div className="p-4 border-b border-green-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">H</span>
          </div>
          <div className="font-bold text-lg">Stay One Day Host</div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-green-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">호</span>
          </div>
          <div>
            <div className="text-sm font-medium">호스트님</div>
            <div className="text-xs text-white/60">최근로그인: {new Date().toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        {menuItems.map(item => renderMenuItem(item))}
      </nav>

      {/* Copyright */}
      <div className="p-4 border-t border-green-700">
        <div className="text-xs text-white/60">
          Copyright © STAY ONE DAY. All Rights Reserved.
        </div>
        </div>
      </div>
    </>
  )
}