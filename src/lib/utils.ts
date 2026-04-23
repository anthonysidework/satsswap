import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBTC(sats: number): string {
  return (sats / 1e8).toFixed(8).replace(/\.?0+$/, '')
}

export function formatSats(sats: number): string {
  return sats.toLocaleString() + ' sats'
}

export function formatUSD(amount: number): string {
  if (amount >= 1_000_000) return '$' + (amount / 1_000_000).toFixed(2) + 'M'
  if (amount >= 1_000) return '$' + (amount / 1_000).toFixed(2) + 'K'
  if (amount < 0.01) return '$' + amount.toExponential(2)
  return '$' + amount.toFixed(2)
}

export function formatAmount(amount: number, decimals = 6): string {
  if (amount === 0) return '0'
  if (amount < 0.000001) return amount.toExponential(4)
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  })
}

export function formatPercent(value: number, showSign = true): string {
  const sign = showSign && value > 0 ? '+' : ''
  return sign + value.toFixed(2) + '%'
}

export function truncateAddress(address: string, chars = 6): string {
  if (address.length <= chars * 2 + 3) return address
  return address.slice(0, chars) + '...' + address.slice(-chars)
}

export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}
