'use client'
import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { Token } from '@/types'

interface TokenLogoProps {
  token: Token
  size?: number
  className?: string
}

export function TokenLogo({ token, size = 40, className }: TokenLogoProps) {
  const [imgError, setImgError] = useState(false)

  const showImage = !!token.logoUrl && !imgError

  if (showImage) {
    return (
      <div
        className={cn('relative flex-shrink-0 rounded-full overflow-hidden', className)}
        style={{ width: size, height: size }}
      >
        <Image
          src={token.logoUrl!}
          alt={token.symbol}
          width={size}
          height={size}
          className="object-cover rounded-full"
          onError={() => setImgError(true)}
          unoptimized
        />
      </div>
    )
  }

  // SVG fallback — styled initials ring, looks intentional not broken
  const abbr = token.type === 'RUNE'
    ? token.symbol.slice(0, 3).toUpperCase()
    : token.symbol.slice(0, 2).toUpperCase()

  const fontSize = size <= 24 ? size * 0.38 : size * 0.32

  return (
    <div
      className={cn('flex-shrink-0 rounded-full flex items-center justify-center font-bold select-none', className)}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 30% 30%, ${token.logoColor}30, ${token.logoColor}10)`,
        border: `1.5px solid ${token.logoColor}50`,
        color: token.logoColor,
        fontSize,
        letterSpacing: abbr.length >= 3 ? '-0.5px' : undefined,
      }}
    >
      {abbr}
    </div>
  )
}
