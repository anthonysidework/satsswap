'use client'

interface SparklineProps {
  prices: number[]
  positive: boolean
  width?: number
  height?: number
}

export function Sparkline({ prices, positive, width = 80, height = 32 }: SparklineProps) {
  if (!prices || prices.length < 2) return null

  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const range = max - min || max * 0.01 || 1
  const pad = 2

  const points = prices
    .map((p, i) => {
      const x = pad + (i / (prices.length - 1)) * (width - pad * 2)
      const y = pad + (1 - (p - min) / range) * (height - pad * 2)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  const color = positive ? '#22C55E' : '#EF4444'

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      style={{ overflow: 'visible' }}
    >
      <polyline
        points={points}
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
