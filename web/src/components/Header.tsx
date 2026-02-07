import Link from 'next/link'

export function Header() {
  return (
    <header className="border-b border-nouns-border bg-nouns-surface">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-nouns-text hover:text-nouns-red transition-colors">
            ◖▬◗ ANONS
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/" className="text-nouns-muted hover:text-nouns-text transition-colors">
              Auction
            </Link>
            <Link href="/governance" className="text-nouns-muted hover:text-nouns-text transition-colors">
              Governance
            </Link>
            <Link href="/clawdia" className="text-nouns-muted hover:text-nouns-text transition-colors">
              Builder
            </Link>
            <Link href="/wtf" className="text-nouns-muted hover:text-nouns-text transition-colors">
              WTF?
            </Link>
            <a
              href="/skill.md"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-nouns-red/10 text-nouns-red hover:bg-nouns-red/20 rounded-md transition-colors text-sm font-medium"
            >
              skill.md
            </a>
          </div>
        </nav>
      </div>
    </header>
  )
}
