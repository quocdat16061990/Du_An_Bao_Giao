import { useState, useEffect, useRef } from 'react'
import { Search, X, Loader2, PackageSearch } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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

  // Sync external value
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleChange = (newValue: string) => {
    setLocalValue(newValue)
    // Debounce
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
      <div className="relative group">
        {/* Search icon */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {isLoading ? (
            <Loader2 className="size-4 text-primary animate-spin" />
          ) : (
            <Search className="size-4 text-muted-foreground" />
          )}
        </div>

        <Input
          ref={inputRef}
          type="text"
          placeholder="Tìm mã VT, model, OEM, động cơ..."
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          className={cn(
            'h-9 pl-9 pr-9 text-[0.8125rem] rounded-md border border-input',
            'focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-ring',
            'shadow-xs shadow-black/5',
            'text-foreground placeholder:text-muted-foreground/80',
          )}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              handleClear()
            }
          }}
        />

        {/* Clear button */}
        {localValue && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={handleClear}
          >
            <X className="size-3.5" />
          </Button>
        )}
      </div>

      {/* Result count */}
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
