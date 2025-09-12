'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Building2,
  Calendar,
  ClipboardList,
  BarChart3,
  X,
  Home,
  Users,
  TrendingUp,
  LogOut,
  Settings,
  MessageCircleQuestion,
  HelpCircle,
  DollarSign,
  Star,
  MessageSquare,
  Camera,
  Target,
  MapPin,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

interface MenuItem {
  title: string
  href: string
  icon: React.ReactNode
  badge?: string
}

interface MenuGroup {
  title: string
  items: MenuItem[]
  defaultOpen?: boolean
}

const menuGroups: MenuGroup[] = [
  {
    title: '대시보드',
    defaultOpen: true,
    items: [
      {
        title: '메인 대시보드',
        href: '/host',
        icon: <BarChart3 className="w-4 h-4" />
      },
      {
        title: 'Group KPI',
        href: '/host/group-kpi',
        icon: <Target className="w-4 h-4" />,
        badge: 'NEW'
      }
    ]
  },
  {
    title: '운영 관리',
    defaultOpen: true,
    items: [
      {
        title: '숙소 관리',
        href: '/host/accommodations',
        icon: <Building2 className="w-4 h-4" />
      },
      {
        title: '예약 관리',
        href: '/host/reservations',
        icon: <ClipboardList className="w-4 h-4" />
      },
      {
        title: '달력',
        href: '/host/calendar',
        icon: <Calendar className="w-4 h-4" />
      },
      {
        title: '문의 관리',
        href: '/host/inquiries',
        icon: <MessageSquare className="w-4 h-4" />
      },
      {
        title: '사진 관리',
        href: '/host/photos',
        icon: <Camera className="w-4 h-4" />
      },
      {
        title: 'CRM',
        href: '/host/crm',
        icon: <Users className="w-4 h-4" />
      }
    ]
  },
  {
    title: '매출 & 리뷰',
    defaultOpen: true,
    items: [
      {
        title: '매출 관리',
        href: '/host/revenue',
        icon: <DollarSign className="w-4 h-4" />
      },
      {
        title: '리뷰 관리',
        href: '/host/reviews',
        icon: <Star className="w-4 h-4" />
      }
    ]
  },
  {
    title: '마케팅',
    defaultOpen: true,
    items: [
      {
        title: '마케팅 분석',
        href: '/host/marketing',
        icon: <TrendingUp className="w-4 h-4" />
      },
      {
        title: '고급 분석',
        href: '/host/marketing-analysis',
        icon: <BarChart3 className="w-4 h-4" />
      },
      {
        title: '네이버 플레이스',
        href: '/host/naver-place-optimization',
        icon: <MapPin className="w-4 h-4" />
      }
    ]
  },
  {
    title: '협업 & 지원',
    defaultOpen: false,
    items: [
      {
        title: '인플루언서 협업',
        href: '/host/collaboration-requests',
        icon: <Users className="w-4 h-4" />
      },
      {
        title: '인플루언서 리뷰',
        href: '/host/influencer-reviews',
        icon: <Star className="w-4 h-4" />
      },
      {
        title: '고객센터',
        href: '/host/support',
        icon: <MessageCircleQuestion className="w-4 h-4" />
      }
    ]
  },
  {
    title: '설정',
    defaultOpen: false,
    items: [
      {
        title: '계정 설정',
        href: '/host/settings',
        icon: <Settings className="w-4 h-4" />
      }
    ]
  }
]

interface HostSidebarProps {
  isOpen?: boolean
  onToggle?: () => void
}

export default function HostSidebar({ isOpen = true, onToggle }: HostSidebarProps) {
  const [hostData, setHostData] = useState<any>(null)
  const [expandedGroups, setExpandedGroups] = useState<{[key: string]: boolean}>({})
  const pathname = usePathname()

  useEffect(() => {
    const userData = sessionStorage.getItem('hostUser')
    if (userData) {
      setHostData(JSON.parse(userData))
    }
    
    // 초기 그룹 확장 상태 설정
    const initialExpanded: {[key: string]: boolean} = {}
    menuGroups.forEach(group => {
      initialExpanded[group.title] = group.defaultOpen ?? false
    })
    setExpandedGroups(initialExpanded)
  }, [])

  const handleLogout = () => {
    // 세션 스토리지 삭제
    sessionStorage.removeItem('hostUser')
    
    // 쿠키 삭제 (미들웨어 인증 쿠키)
    document.cookie = 'host-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    
    window.location.href = '/host/login'
  }

  const toggleGroup = (groupTitle: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupTitle]: !prev[groupTitle]
    }))
  }

  const renderMenuItem = (item: MenuItem) => {
    const isActive = pathname === item.href || (item.href !== '/host' && pathname.startsWith(item.href))

    return (
      <Link
        key={item.title}
        href={item.href}
        className={`flex items-center justify-between px-4 py-2.5 text-sm transition-colors rounded-md mb-1 ml-2 ${
          isActive 
            ? 'bg-green-600 text-white font-medium' 
            : 'text-white/90 hover:bg-white/10 hover:text-white'
        }`}
        onClick={() => {
          if (onToggle && window.innerWidth < 1024) {
            onToggle()
          }
        }}
      >
        <div className="flex items-center gap-3">
          {item.icon}
          <span>{item.title}</span>
        </div>
        {item.badge && (
          <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full font-medium">
            {item.badge}
          </span>
        )}
      </Link>
    )
  }

  const renderMenuGroup = (group: MenuGroup) => {
    const isExpanded = expandedGroups[group.title]
    
    return (
      <div key={group.title} className="mb-2">
        <button
          onClick={() => toggleGroup(group.title)}
          className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
        >
          <span>{group.title}</span>
          {isExpanded ? 
            <ChevronDown className="w-4 h-4" /> : 
            <ChevronRight className="w-4 h-4" />
          }
        </button>
        {isExpanded && (
          <div className="mt-1">
            {group.items.map(item => renderMenuItem(item))}
          </div>
        )}
      </div>
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
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <Home className="w-4 h-4 text-white" />
            </div>
            <div className="font-bold text-lg">Stay One Day</div>
          </div>
        </div>

        {/* Host Info */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">호</span>
            </div>
            <div>
              <div className="text-sm font-medium">{hostData?.business_name || '호스트'}</div>
              <div className="text-xs text-white/60">{hostData?.name || '사용자'}</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          {menuGroups.map(group => renderMenuGroup(group))}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors rounded-md mb-4"
          >
            <LogOut className="w-4 h-4" />
            <span>로그아웃</span>
          </button>
          
          {/* Copyright */}
          <div className="text-xs text-white/60">
            Copyright © STAY ONE DAY. All Rights Reserved.
          </div>
        </div>
      </div>
    </>
  )
}