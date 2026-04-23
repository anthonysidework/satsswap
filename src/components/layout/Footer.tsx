import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-border/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke="black"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-text-secondary text-sm">
              <span className="text-text-primary font-semibold">SatsSwap</span> — Non-custodial Bitcoin asset swaps
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-text-muted">
            <Link href="#" className="hover:text-text-secondary transition-colors">Docs</Link>
            <Link href="#" className="hover:text-text-secondary transition-colors">Twitter</Link>
            <Link href="#" className="hover:text-text-secondary transition-colors">Discord</Link>
            <Link href="#" className="hover:text-text-secondary transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
