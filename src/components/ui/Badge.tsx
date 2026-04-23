import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'rune' | 'brc20' | 'btc'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium',
        {
          'bg-border text-text-secondary': variant === 'default',
          'bg-success/10 text-success': variant === 'success',
          'bg-warning/10 text-warning': variant === 'warning',
          'bg-danger/10 text-danger': variant === 'danger',
          'bg-primary/10 text-primary': variant === 'rune',
          'bg-accent/10 text-accent': variant === 'brc20',
          'bg-[#F7931A]/10 text-[#F7931A]': variant === 'btc',
        },
        className
      )}
    >
      {children}
    </span>
  )
}
