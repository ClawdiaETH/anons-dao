'use client'

import Link from 'next/link'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'

export function Header() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()

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
            
            {/* Wallet Connect */}
            {isConnected ? (
              <button
                onClick={() => disconnect()}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium text-sm transition-colors"
              >
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </button>
            ) : (
              <button
                onClick={() => connect({ connector: injected() })}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium text-sm transition-colors"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}
