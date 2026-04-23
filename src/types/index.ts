export type AssetType = 'BTC' | 'RUNE' | 'BRC20' | 'ORDINAL'

export interface Token {
  id: string
  symbol: string
  name: string
  type: AssetType
  decimals: number
  priceBTC: number
  priceUSD: number
  change24h: number
  volume24h: number
  marketCap: number
  logoColor: string
  logoUrl?: string
}

export interface DexQuote {
  dex: string
  dexLogo: string
  rate: number
  estimatedOutput: number
  priceImpact: number
  dexFee: number
  networkFeeSats: number
  isBest: boolean
  liquidityUSD: number
}

export interface AggregatedQuote {
  fromToken: Token
  toToken: Token
  fromAmount: number
  quotes: DexQuote[]
  bestQuote: DexQuote
  expiresAt: number
}

export interface WalletProvider {
  id: string
  name: string
  description: string
  iconBg: string
  iconText: string
  downloadUrl: string
}

export interface ConnectedWallet {
  address: string
  publicKey: string
  provider: string
  balanceSats: number
}

export interface SwapTransaction {
  psbtHex: string
  fee: number
  dex: string
}
