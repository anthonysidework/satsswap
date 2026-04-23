'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import {
  createChart,
  AreaSeries,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from 'lightweight-charts'
import { formatUSD } from '@/lib/utils'

interface RawPoint { time: number; value: number }
interface ChartPoint { time: UTCTimestamp; value: number }

interface PriceChartProps {
  tokenId: string
  symbol: string
  color?: string
  height?: number
}

const RANGES = [
  { label: '1D', days: 1 },
  { label: '7D', days: 7 },
  { label: '1M', days: 30 },
  { label: '1Y', days: 365 },
] as const

type Days = 1 | 7 | 30 | 365

export function PriceChart({ tokenId, symbol, color = '#F7931A', height = 220 }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null)
  const [range, setRange] = useState<Days>(7)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [priceChange, setPriceChange] = useState<{ pct: number; abs: number } | null>(null)
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)

  // Initialize chart once on mount
  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      autoSize: true,
      height,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#8888A0',
        fontSize: 11,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: '#2A2A3A', style: 1 },
      },
      crosshair: {
        vertLine: { color: '#363650', width: 1 },
        horzLine: { color: '#363650', width: 1 },
      },
      rightPriceScale: {
        borderColor: '#2A2A3A',
        scaleMargins: { top: 0.08, bottom: 0.04 },
      },
      timeScale: {
        borderColor: '#2A2A3A',
        timeVisible: false,
        secondsVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    })

    const series = chart.addSeries(AreaSeries, {
      lineColor: color,
      topColor: `${color}35`,
      bottomColor: `${color}00`,
      lineWidth: 2,
      crosshairMarkerRadius: 5,
      crosshairMarkerBorderColor: '#1C1C28',
      crosshairMarkerBackgroundColor: color,
      lastValueVisible: false,
      priceLineVisible: false,
    })

    chartRef.current = chart
    seriesRef.current = series

    return () => {
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [color, height])

  const fetchData = useCallback(async () => {
    if (!seriesRef.current) return
    setLoading(true)
    setError(false)
    try {
      const res = await fetch(`/api/chart/${encodeURIComponent(tokenId)}?days=${range}`)
      if (!res.ok) throw new Error('fetch failed')
      const data: { prices: RawPoint[] } = await res.json()

      if (data.prices.length > 1) {
        const points: ChartPoint[] = data.prices.map((p) => ({
          time: p.time as UTCTimestamp,
          value: p.value,
        }))
        seriesRef.current.setData(points)
        chartRef.current?.timeScale().fitContent()
        chartRef.current?.applyOptions({
          timeScale: { timeVisible: range === 1 },
        })

        const first = data.prices[0].value
        const last = data.prices[data.prices.length - 1].value
        const abs = last - first
        setCurrentPrice(last)
        setPriceChange({ pct: (abs / first) * 100, abs })
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [tokenId, range])

  useEffect(() => {
    fetchData()
    if (range === 1) {
      const id = setInterval(fetchData, 90_000)
      return () => clearInterval(id)
    }
  }, [fetchData, range])

  const positive = (priceChange?.pct ?? 0) >= 0

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-text-primary font-bold text-xl tabular-nums">
              {currentPrice !== null ? formatUSD(currentPrice) : '—'}
            </span>
            <span className="text-text-muted text-sm">{symbol}</span>
          </div>
          {priceChange && (
            <div className={`text-sm font-medium mt-0.5 ${positive ? 'text-success' : 'text-danger'}`}>
              {positive ? '+' : ''}{priceChange.pct.toFixed(2)}%
              <span className="text-text-muted font-normal ml-1.5 text-xs">
                {positive ? '+' : '-'}{formatUSD(Math.abs(priceChange.abs))} this period
              </span>
            </div>
          )}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {RANGES.map((r) => (
            <button
              key={r.label}
              onClick={() => setRange(r.days as Days)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                range === r.days
                  ? 'bg-primary/15 text-primary'
                  : 'text-text-muted hover:text-text-secondary hover:bg-surface'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart canvas */}
      <div className="relative rounded-xl overflow-hidden">
        <div
          ref={containerRef}
          className={`transition-opacity duration-300 ${loading ? 'opacity-40' : 'opacity-100'}`}
          style={{ height }}
        />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="w-5 h-5 rounded-full border-2 animate-spin"
              style={{ borderColor: `${color}30`, borderTopColor: color }}
            />
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <span className="text-text-muted text-sm">Chart unavailable</span>
            <button onClick={fetchData} className="text-primary text-xs hover:underline">Retry</button>
          </div>
        )}
      </div>

      {range === 1 && !error && (
        <p className="text-text-muted text-xs text-center">Auto-refreshes every 90 seconds</p>
      )}
    </div>
  )
}
