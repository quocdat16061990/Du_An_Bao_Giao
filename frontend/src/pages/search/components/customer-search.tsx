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
import type { Customer } from '../helper/types'

const TAG_STYLE: Record<string, 'vip' | 'uuDai' | 'daiLy' | 'outline'> = {
  VIP: 'vip', 'ƯU_ĐÃI': 'uuDai', 'ĐẠI_LÝ': 'daiLy', 'NGOẠI_LỆ': 'outline', 'CHƯA_PL': 'outline',
}

export function CustomerSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 250)
  const { data: customers = [], isLoading } = useCustomers(debouncedQuery)
  const selectedCustomer = useSearchStore((s) => s.selectedCustomer)
  const setCustomer = useSearchStore((s) => s.setCustomer)

  // Quick-create form state
  const [showNewForm, setShowNewForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newAddress, setNewAddress] = useState('')

  const handleSelect = (customer: Customer) => {
    setCustomer(customer)
    setOpen(false)
    setQuery('')
    resetNewForm()
  }

  const handleClear = () => { setCustomer(null); setQuery(''); resetNewForm() }

  const handleQuickCreate = () => {
    if (!newName.trim()) return
    const newCustomer: Customer = {
      id: 0, // temporary ID
      ma_kh: 'KH_MOI',
      ten_kh: newName.trim(),
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
    setOpen(false)
    setQuery('')
    resetNewForm()
  }

  const resetNewForm = () => {
    setShowNewForm(false)
    setNewName('')
    setNewPhone('')
    setNewAddress('')
  }

  const showCreateOption = debouncedQuery.length >= 2 && !isLoading && customers.length === 0

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open}
            className="h-9 justify-start gap-2 min-w-[200px] max-w-[300px]">
            <User className="h-4 w-4 text-muted-foreground shrink-0" />
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
              <span className="text-muted-foreground text-sm">Chọn khách hàng...</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Gõ tên, SĐT, mã KH..." value={query} onValueChange={setQuery} />
            <CommandList>
              {isLoading && <div className="py-6 text-center text-sm text-muted-foreground">Đang tìm...</div>}
              {!isLoading && !showCreateOption && (
                <CommandEmpty>{debouncedQuery.length === 0 ? 'Gõ ít nhất 1 ký tự...' : 'Không tìm thấy'}</CommandEmpty>
              )}
              <CommandGroup heading="Khách hàng">
                {customers.map((customer) => (
                  <CommandItem key={customer.id} value={customer.ten_kh} onSelect={() => handleSelect(customer)}
                    className="flex flex-col items-start py-3 cursor-pointer">
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

              {/* Quick-create new customer */}
              {showCreateOption && (
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
                          placeholder="Nhập tên khách hàng..."
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
                      disabled={!newName.trim()}
                    >
                      <Check className="h-3.5 w-3.5" />
                      Xác nhận tạo mới
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
