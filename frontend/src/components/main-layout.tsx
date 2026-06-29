import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth/context'
import { useTheme } from '@/lib/theme/context'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  FileText,
  PieChart,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Wrench,
  ChevronDown,
  FileSpreadsheet,
  Images
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function MainLayout() {
  const { user, logout, isAuthenticated } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, navigate])

  const menuItems = [
    {
      title: 'TÌM KIẾM SẢN PHẨM',
      icon: Search,
      path: '/search',
      altPaths: ['/']
    },
    {
      title: 'QUẢN LÝ BÁO GIÁ',
      icon: FileText,
      path: '/bao-gia',
      altPaths: ['/bao-gia-hom-nay']
    },
    {
      title: 'THỐNG KÊ DOANH SỐ',
      icon: PieChart,
      path: '/bao-gia/dashboard',
      altPaths: []
    },
    ...(user?.is_staff
      ? [
          {
            title: 'NHẬP EXCEL',
            icon: FileSpreadsheet,
            path: '/import-excel',
            altPaths: ['/import-excel/compare']
          },
          {
            title: 'ĐỒNG BỘ ẢNH',
            icon: Images,
            path: '/import-images',
            altPaths: []
          }
        ]
      : [])
  ]

  const isActive = (item: typeof menuItems[0]) => {
    if (location.pathname === item.path) return true
    return item.altPaths.includes(location.pathname)
  }

  const handleNavigate = (path: string) => {
    navigate(path)
    setIsMobileOpen(false)
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex transition-colors duration-200">
      
      {/* ═════ SIDEBAR FOR DESKTOP ═════ */}
      <aside
        className={cn(
          "hidden md:flex flex-col fixed top-0 bottom-0 left-0 z-40",
          "bg-card/85 backdrop-blur-md border-r border-border transition-all duration-300 ease-in-out",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Sidebar Header/Logo */}
        <div className="h-16 px-4 border-b border-border flex items-center justify-between shrink-0">
          <button
            onClick={() => handleNavigate('/')}
            className="flex items-center gap-3 hover:opacity-85 transition-opacity overflow-hidden"
          >
            <div className="w-9 h-9 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center shrink-0">
              <Wrench className="h-5 w-5 text-primary" />
            </div>
            {!isCollapsed && (
              <div className="text-left animate-in fade-in duration-300">
                <h1 className="text-sm font-black tracking-wider leading-none text-foreground">
                  TURBO DIESEL
                </h1>
                <span className="text-[9px] font-bold text-muted-foreground/80 leading-none">
                  PHỤ TÙNG ĐỘNG CƠ
                </span>
              </div>
            )}
          </button>
          
          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors hidden md:block"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Sidebar Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <div>
            {!isCollapsed && (
              <span className="text-[10px] font-bold tracking-widest text-muted-foreground/60 px-3 uppercase block mb-3">
                Main Menu
              </span>
            )}
            <ul className="space-y-1.5">
              {menuItems.map((item) => {
                const active = isActive(item)
                const Icon = item.icon
                return (
                  <li key={item.path}>
                    <button
                      onClick={() => handleNavigate(item.path)}
                      className={cn(
                        "w-full flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative",
                        active
                          ? "bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/10"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/70"
                      )}
                      title={isCollapsed ? item.title : undefined}
                    >
                      <Icon className={cn("h-5 w-5 shrink-0", active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary transition-colors")} />
                      {!isCollapsed && (
                        <span className="truncate">{item.title}</span>
                      )}
                      {isCollapsed && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-popover border border-border text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-md">
                          {item.title}
                        </div>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </nav>

        {/* Sidebar Footer / User section */}
        <div className="p-3 border-t border-border shrink-0 bg-accent/20">
          <div className={cn("flex items-center gap-3", isCollapsed ? "justify-center" : "px-2")}>
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary shrink-0">
              {user?.display_name?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            {!isCollapsed && (
              <div className="text-left min-w-0 flex-1">
                <p className="text-xs font-semibold truncate text-foreground leading-tight">
                  {user?.display_name || user?.username}
                </p>
                <p className="text-[10px] text-muted-foreground truncate leading-none">
                  {user?.email}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ═════ SIDEBAR MOBILE / DRAWER ═════ */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden animate-in fade-in"
          onClick={() => setIsMobileOpen(false)}
        >
          <aside
            className="w-64 h-full bg-card/90 backdrop-blur-md border-r border-border flex flex-col animate-in slide-in-from-left duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-16 px-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center">
                  <Wrench className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <h1 className="text-sm font-black tracking-wider leading-none text-foreground">
                    TURBO DIESEL
                  </h1>
                  <span className="text-[9px] font-bold text-muted-foreground/80 leading-none">
                    PHỤ TÙNG ĐỘNG CƠ
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-muted-foreground/60 px-3 uppercase block mb-3">
                  Main Menu
                </span>
                <ul className="space-y-1">
                  {menuItems.map((item) => {
                    const active = isActive(item)
                    const Icon = item.icon
                    return (
                      <li key={item.path}>
                        <button
                          onClick={() => handleNavigate(item.path)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                            active
                              ? "bg-primary text-primary-foreground font-semibold shadow-md"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent/70"
                          )}
                        >
                          <Icon className="h-5 w-5 shrink-0" />
                          <span>{item.title}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </nav>

            <div className="p-4 border-t border-border bg-accent/20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary">
                  {user?.display_name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="text-left min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate text-foreground leading-tight">
                    {user?.display_name || user?.username}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate leading-none">
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* ═════ MAIN CONTENT CONTAINER ═════ */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-300",
          isCollapsed ? "md:pl-20" : "md:pl-64"
        )}
      >
        {/* ── TOPBAR HEADER ── */}
        <header className="h-16 border-b border-border bg-background/85 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 shadow-sm shadow-foreground/[0.02]">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground md:hidden transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Desktop toggle button */}
            {isCollapsed ? (
              <button
                onClick={() => setIsCollapsed(false)}
                className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground hidden md:block transition-colors"
                title="Mở rộng menu"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <div className="text-sm font-semibold hidden md:block text-muted-foreground/80">
                Hệ Thống Báo Giá Động Cơ
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Chuyển sang nền sáng' : 'Chuyển sang nền tối'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* User Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 hover:opacity-85 transition-opacity focus:outline-none p-1 rounded-lg hover:bg-accent/40">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-xs">
                    {user?.display_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground hidden sm:block">
                    {user?.display_name || user?.username}
                  </span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground/70 hidden sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 mt-1">
                <DropdownMenuLabel className="font-semibold text-xs text-muted-foreground">Tài khoản</DropdownMenuLabel>
                <div className="px-2 pb-2 pt-0.5 text-xs text-muted-foreground border-b border-border/50">
                  <p className="font-bold text-foreground">{user?.display_name || user?.username}</p>
                  <p className="text-[10px] truncate">{user?.email}</p>
                </div>
                <DropdownMenuItem className="text-xs mt-1" onClick={() => navigate('/search')}>
                  <Search className="mr-2 h-3.5 w-3.5" />
                  <span>Tìm kiếm sản phẩm</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs" onClick={() => navigate('/bao-gia')}>
                  <FileText className="mr-2 h-3.5 w-3.5" />
                  <span>Lịch sử báo giá</span>
                </DropdownMenuItem>
                {user?.is_staff && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-xs" onClick={() => navigate('/import-excel')}>
                      <FileSpreadsheet className="mr-2 h-3.5 w-3.5" />
                      <span>Nhập Excel</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-xs" onClick={() => navigate('/import-images')}>
                      <Images className="mr-2 h-3.5 w-3.5" />
                      <span>Đồng bộ ảnh</span>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10 cursor-pointer" onClick={logout}>
                  <LogOut className="mr-2 h-3.5 w-3.5" />
                  <span>Đăng xuất</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* ── ROUTE OUTLET (PAGE CONTENT) ── */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

    </div>
  )
}
