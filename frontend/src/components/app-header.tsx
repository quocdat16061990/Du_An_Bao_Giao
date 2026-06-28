import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
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
  ChevronDown,
  History,
  LogOut,
  Menu,
  Moon,
  Sun,
  User,
  Wrench,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AppHeaderProps {
  stats?: React.ReactNode
  searchSlot?: React.ReactNode
  mobileFilterSlot?: React.ReactNode
  className?: string
}

export function AppHeader({ stats, searchSlot, className }: AppHeaderProps) {
  const { user, logout, isAuthenticated } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenu, setMobileMenu] = useState(false)

  const isSearchPage = location.pathname === '/' || location.pathname === '/search'

  return (
    <header
      className={cn(
        'sticky top-0 z-50',
        'glass',
        'border-b',
        className,
      )}
    >
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center">
                <Wrench className="h-5 w-5 text-primary" />
              </div>
              <div className="hidden sm:block text-left">
                <h1 className="text-base font-bold tracking-tight leading-tight">
                  TURBO DIESEL
                </h1>
                <p className="text-[10px] text-muted-foreground/70 leading-tight">
                  Phụ Tùng Động Cơ
                </p>
              </div>
            </button>
          </div>

          {searchSlot && (
            <div className="hidden md:flex flex-1 max-w-xl mx-auto">
              {searchSlot}
            </div>
          )}

          <div className="hidden lg:flex items-center gap-3">
            {stats}

            {isSearchPage && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground hover:bg-accent gap-1.5 h-9"
                onClick={() => navigate('/bao-gia')}
              >
                <History className="h-4 w-4" />
                <span className="hidden xl:inline">Báo giá</span>
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Chuyển sang nền sáng' : 'Chuyển sang nền tối'}
            >
              {theme === 'dark' ? (
                <Moon className="h-4.5 w-4.5 text-primary" />
              ) : (
                <Sun className="h-4.5 w-4.5 text-primary" />
              )}
            </Button>

            <div className="w-px h-6 bg-border" />

            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 h-9">
                    <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/25 flex items-center justify-center text-xs font-bold text-primary">
                      {user.display_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden xl:inline text-sm">{user.display_name}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{user.display_name}</span>
                      <span className="text-xs text-muted-foreground font-normal">
                        @{user.username}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/bao-gia')}>
                    <History className="h-4 w-4 mr-2" />
                    Lịch sử báo giá
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={logout}
                    className="text-red-400 focus:text-red-400"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                size="sm"
                onClick={() => navigate('/login')}
                className="h-9 gap-1.5"
              >
                <User className="h-4 w-4" />
                Đăng nhập
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9"
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              {mobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {searchSlot && (
          <div className="mt-2 md:hidden">
            {searchSlot}
          </div>
        )}
      </div>

      {mobileMenu && (
        <div className="lg:hidden border-t border-border bg-card/95 backdrop-blur p-4 space-y-3 animate-in slide-in-from-right">
          {stats}
          {isSearchPage && (
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => { navigate('/bao-gia'); setMobileMenu(false) }}
            >
              <History className="h-4 w-4" />
              Lịch sử báo giá
            </Button>
          )}
          {!isAuthenticated ? (
            <Button
              size="sm"
              className="w-full gap-2"
              onClick={() => { navigate('/login'); setMobileMenu(false) }}
            >
              <User className="h-4 w-4" />
              Đăng nhập
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-red-400"
              onClick={() => { logout(); setMobileMenu(false) }}
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </Button>
          )}
        </div>
      )}
    </header>
  )
}
