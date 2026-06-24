import { useState } from 'react'
import { User, Phone, MapPin, Building2, UserPlus, Check } from 'lucide-react'
import {
  Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem,
} from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useCustomers } from '../helper/use-customers'
import { useSearchStore } from '../store'
import { useDebounce } from '@/hook/use-debounce'
import { cn } from '@/lib/utils'
import type { Customer } from '../helper/types'

const TAG_STYLE: Record<string, 'vip' | 'uuDai' | 'daiLy' | 'outline'> = {
  VIP: 'vip', 'ƯU_ĐÃI': 'uuDai', 'ĐẠI_LÝ': 'daiLy', 'NGOẠI_LỆ': 'outline', 'CHƯA_PL': 'outline',
}

interface CustomerSearchProps {
  hasError?: boolean
  onValidSelect?: () => void
}

export function CustomerSearch({ hasError = false, onValidSelect }: CustomerSearchProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 250)
  const { data: customers = [], isLoading, isError } = useCustomers(debouncedQuery)
  const selectedCustomer = useSearchStore((s) => s.selectedCustomer)
  const setCustomer = useSearchStore((s) => s.setCustomer)
  const [createMode, setCreateMode] = useState(false)

  // Quick-create form state
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newAddress, setNewAddress] = useState('')

  const handleSelect = (customer: Customer) => {
    setCustomer(customer)
    onValidSelect?.()
    setOpen(false)
    setQuery('')
    resetNewForm()
  }

  const handleClear = () => { setCustomer(null); setQuery(''); resetNewForm() }

  const openCreateForm = () => {
    setCreateMode(true)
    setOpen(true)
    if (!newName.trim() && query.trim()) {
      setNewName(query.trim())
    }
  }

  const handleQuickCreate = () => {
    const customerName = newName.trim() || query.trim()
    if (!customerName) return
    const newCustomer: Customer = {
      id: 0, // temporary ID
      ma_kh: 'KH_MOI',
      ten_kh: customerName,
      dien_thoai: newPhone.trim(),
      phan_loai: 'CHƯA_PL' as const,
      dia_chi: newAddress.trim(),
      tinh_tp: '',
      ghi_chu: '',
      nha_xe: null,
      nha_xe_name: '',
      is_active: true,
      created_at: new Date().toISOString(),
    }
    setCustomer(newCustomer)
    onValidSelect?.()
    setOpen(false)
    setQuery('')
    resetNewForm()
  }

  const resetNewForm = () => {
    setCreateMode(false)
    setNewName('')
    setNewPhone('')
    setNewAddress('')
  }

  const showCreateOption = debouncedQuery.length >= 2 && !isLoading && customers.length === 0
  const showCreateForm = createMode || showCreateOption
  const canCreate = Boolean((newName.trim() || query.trim()))

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) resetNewForm()
      }}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open}
            className={cn(
              'h-9 justify-start gap-2 min-w-[200px] max-w-[300px]',
              hasError && !selectedCustomer && 'border-destructive text-destructive ring-1 ring-destructive/30',
            )}>
            <User className={cn('h-4 w-4 shrink-0', hasError && !selectedCustomer ? 'text-destructive' : 'text-muted-foreground')} />
            {selectedCustomer ? (
              <span className="truncate text-sm">
                {selectedCustomer.ten_kh}
                {selectedCustomer.dien_thoai && (
                  <span className="text-muted-foreground ml-1.5 text-xs">· {selectedCustomer.dien_thoai}</span>
                )}
                <Badge variant={TAG_STYLE[selectedCustomer.phan_loai] ?? 'outline'} className="ml-2 text-[10px]">
                  {selectedCustomer.id === 0 ? 'Mới' : selectedCustomer.phan_loai}
                </Badge>
              </span>
            ) : (
              <span className={cn('text-sm', hasError ? 'text-destructive font-medium' : 'text-muted-foreground')}>
                Chọn khách hàng...
              </span>
            )}
          </Button>
        </PopoverTrigger>
        {!selectedCustomer && (
          <Button
            type="button"
            variant="outline"
            className="h-9 gap-1.5 border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
            onClick={openCreateForm}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Thêm KH
          </Button>
        )}
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput placeholder="Gõ tên, SĐT, mã KH..." value={query} onValueChange={setQuery} />
            <CommandList>
              {debouncedQuery.length === 0 && !showCreateForm && (
                <div className="px-3 py-4 text-sm text-muted-foreground">
                  Gõ tên, số điện thoại hoặc mã KH để tìm khách hàng.
                </div>
              )}
              {isLoading && (
                <div className="py-6 text-center text-sm text-muted-foreground">Đang tìm khách hàng...</div>
              )}
              {isError && (
                <div className="px-3 py-4 text-sm text-destructive">
                  Không tải được danh sách khách hàng. Vui lòng thử lại.
                </div>
              )}
              {!isLoading && !isError && debouncedQuery.length > 0 && customers.length === 0 && !showCreateOption && (
                <CommandEmpty>Không tìm thấy khách hàng phù hợp</CommandEmpty>
              )}
              {customers.length > 0 && !createMode && (
                <CommandGroup heading={`Khách hàng tìm thấy (${customers.length})`}>
                  {customers.map((customer) => (
                    <CommandItem
                      key={customer.id}
                      value={[customer.ten_kh, customer.dien_thoai, customer.ma_kh].filter(Boolean).join(' ')}
                      onSelect={() => handleSelect(customer)}
                      className="flex flex-col items-start py-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <span className="font-medium text-sm">{customer.ten_kh}</span>
                        <Badge variant={TAG_STYLE[customer.phan_loai] ?? 'outline'} className="text-[10px]">
                          {customer.phan_loai}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                        {customer.dien_thoai && <span className="flex items-center gap-1"><Phone className="h-3 w-3"/>{customer.dien_thoai}</span>}
                        {customer.tinh_tp && <span className="flex items-center gap-1"><MapPin className="h-3 w-3"/>{customer.tinh_tp}</span>}
                        {customer.ma_kh && <span className="flex items-center gap-1"><Building2 className="h-3 w-3"/>{customer.ma_kh}</span>}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {!createMode && !isLoading && !isError && debouncedQuery.length > 0 && (
                <div className="border-t p-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 w-full justify-start gap-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                    onClick={openCreateForm}
                  >
                    <UserPlus className="h-4 w-4" />
                    Thêm khách hàng mới
                    {query.trim() && <span className="truncate text-muted-foreground">"{query.trim()}"</span>}
                  </Button>
                </div>
              )}

              {showCreateForm && (
                <>
                  <Separator />
                  <div className="p-3 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <UserPlus className="h-4 w-4" />
                      Tạo khách hàng mới
                    </div>
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Tên khách hàng *</Label>
                        <Input
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          placeholder={query.trim() || 'Nhập tên khách hàng...'}
                          className="h-8 text-sm"
                          autoFocus
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Số điện thoại</Label>
                        <Input
                          value={newPhone}
                          onChange={(e) => setNewPhone(e.target.value)}
                          placeholder="090x.xxx.xxx"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Địa chỉ</Label>
                        <Input
                          value={newAddress}
                          onChange={(e) => setNewAddress(e.target.value)}
                          placeholder="Địa chỉ, tỉnh/thành..."
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="w-full h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={handleQuickCreate}
                      disabled={!canCreate}
                    >
                      <Check className="h-3.5 w-3.5" />
                      Thêm khách hàng
                    </Button>
                  </div>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selectedCustomer && (
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0" onClick={handleClear}>×</Button>
      )}
    </div>
  )
}
