import { useEffect, useRef, useState } from 'react'
import { PackageSearch, Search, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  isLoading: boolean
  resultCount: number
  className?: string
}

export function SearchBar({
  value,
  onChange,
  isLoading,
  resultCount,
  className,
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleChange = (newValue: string) => {
    setLocalValue(newValue)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      onChange(newValue)
    }, 300)
  }

  const handleClear = () => {
    setLocalValue('')
    onChange('')
    inputRef.current?.focus()
  }

  return (
    <div className={cn('relative w-full max-w-2xl', className)}>
      <div className="group relative">
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
          <Search className="size-4 text-muted-foreground" />
        </div>

        <Input
          ref={inputRef}
          type="text"
          placeholder="Tìm mã VT, model, OEM, động cơ..."
          value={localValue}
          onChange={(event) => handleChange(event.target.value)}
          className={cn(
            'h-9 rounded-md border border-input pl-9 pr-9 text-[0.8125rem]',
            'shadow-xs shadow-black/5',
            'text-foreground placeholder:text-muted-foreground/80',
            'focus-visible:border-ring focus-visible:ring-0 focus-visible:ring-offset-0',
          )}
          onKeyDown={(event) => {
            if (event.key === 'Escape') handleClear()
          }}
        />

        {localValue && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={handleClear}
          >
            <X className="size-3.5" />
          </Button>
        )}
      </div>

      {value && !isLoading && (
        <div
          className={cn(
            'mt-2 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs shadow-sm',
            resultCount > 0
              ? 'border-primary/20 bg-primary/10 text-primary'
              : 'border-border bg-muted text-muted-foreground',
          )}
        >
          <PackageSearch className="h-3.5 w-3.5" />
          <span className="text-muted-foreground">
            {resultCount > 0 ? 'Tìm thấy' : 'Không tìm thấy'}
          </span>
          <span className="rounded-full bg-background px-2 py-0.5 font-bold tabular-nums text-foreground">
            {resultCount.toLocaleString('vi-VN')}
          </span>
          <span className="font-medium">sản phẩm</span>
        </div>
      )}
    </div>
  )
}
