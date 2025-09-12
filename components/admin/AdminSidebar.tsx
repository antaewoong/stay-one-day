'use client'

import { useState, useEffect } from 'react'
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
  Users,
  Menu,
  X,
  Monitor,
  Layout,
  Type,
  Star,
  TrendingUp,
  Bot
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
    href: '/admin',
    icon: <BarChart3 className="w-4 h-4" />
  },
  {
    title: '메인 페이지 관리',
    href: '/admin/main-page',
    icon: <Monitor className="w-4 h-4" />
  },
  {
    title: '숙소 관리',
    icon: <Building2 className="w-4 h-4" />,
    children: [
      { title: '숙소 목록', href: '/admin/accommodations', icon: <></> },
      { title: '새 숙소 등록', href: '/admin/accommodations/add', icon: <></> },
      { title: '숙소할인관리', href: '/admin/accommodations/discount-management', icon: <></> },
      { title: '협찬 신청 숙소관리', href: '/admin/accommodations/collaboration', icon: <></> }
    ]
  },
  {
    title: '호스트 관리',
    icon: <Users className="w-4 h-4" />,
    children: [
      { title: '호스트 목록', href: '/admin/hosts', icon: <></> },
      { title: '호스트 추가', href: '/admin/hosts/add', icon: <></> }
    ]
  },
  {
    title: '관리자 관리',
    icon: <Settings className="w-4 h-4" />,
    children: [
      { title: '관리자 목록', href: '/admin/admins', icon: <></> }
    ]
  },
  {
    title: '인플루언서 관리',
    icon: <Users className="w-4 h-4" />,
    children: [
      { title: '인플루언서 목록', href: '/admin/influencers', icon: <></> },
      { title: '협업 공지 관리', href: '/admin/influencers/notices', icon: <></> },
      { title: '협업 신청 현황', href: '/admin/influencers/collaboration-requests', icon: <></> }
    ]
  },
  {
    title: '통합 CRM',
    icon: <Users className="w-4 h-4" />,
    children: [
      { title: 'CRM 대시보드', href: '/admin/crm', icon: <></> },
      { title: '텔레그램 봇 관리', href: '/admin/telegram', icon: <Bot className="w-3 h-3" /> }
    ]
  },
  {
    title: '마케팅 분석',
    href: '/admin/marketing',
    icon: <TrendingUp className="w-4 h-4" />
  },
  {
    title: '점주 공지사항',
    href: '/admin/notices',
    icon: <Bell className="w-4 h-4" />
  },
  {
    title: '통합 문의 관리', 
    href: '/admin/inquiries',
    icon: <MessageCircle className="w-4 h-4" />
  },
  {
    title: '스테이 예약 관리',
    icon: <Calendar className="w-4 h-4" />,
    children: [
      { title: '객실 예약 정보', href: '/admin/reservations/info', icon: <></> },
      { title: '객실 예약 상태', href: '/admin/reservations/status', icon: <></> },
      { title: '객실 예약 달력', href: '/admin/reservations/calendar', icon: <></> }
    ]
  },
  {
    title: '정산 관리',
    icon: <Calculator className="w-4 h-4" />,
    children: [
      { title: '정산 리포트', href: '/admin/settlement', icon: <></> },
      { title: '결제 정보 통계', href: '/admin/payments', icon: <></> }
    ]
  },
  {
    title: '사이트 통계',
    href: '/admin/statistics',
    icon: <BarChart3 className="w-4 h-4" />
  }
]

interface AdminSidebarProps {
  isOpen?: boolean
  onToggle?: () => void
}

export default function AdminSidebar({ isOpen = true, onToggle }: AdminSidebarProps) {
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['숙소 관리'])
  const [isMainAdmin, setIsMainAdmin] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    // 슈퍼관리자 권한 체크
    const adminUser = sessionStorage.getItem('adminUser')
    if (adminUser) {
      const adminData = JSON.parse(adminUser)
      setIsMainAdmin(adminData.role === 'super_admin')
    }
  }, [])

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
            ? 'bg-blue-600 text-white font-medium' 
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
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-800 text-white flex flex-col transform transition-transform duration-300 ease-in-out
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
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <div className="font-bold text-lg">Stay One Day</div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">관</span>
          </div>
          <div>
            <div className="text-sm font-medium">관리자</div>
            <div className="text-xs text-white/60">최근로그인: 2025-09-04 17:00:00</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        {menuItems
          .filter(item => {
            // 슈퍼관리자가 아니면 관리자 관리 메뉴 숨김
            if (item.title === '관리자 관리' && !isMainAdmin) {
              return false
            }
            return true
          })
          .map(item => renderMenuItem(item))
        }
      </nav>

      {/* Copyright */}
      <div className="p-4 border-t border-slate-700">
        <div className="text-xs text-white/60">
          Copyright © STAY ONE DAY. All Rights Reserved.
        </div>
        </div>
      </div>
    </>
  )
}