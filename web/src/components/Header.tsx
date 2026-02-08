'use client'

import Link from 'next/link'
import { useState } from 'react'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="border-b border-nouns-border bg-nouns-surface">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-nouns-text hover:text-nouns-red transition-colors">
            ◖▬◗ ANONS
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
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
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-nouns-text hover:text-nouns-red transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              // Close icon
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              // Hamburger icon
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </nav>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-3 border-t border-nouns-border pt-4">
            <Link 
              href="/" 
              className="block text-nouns-muted hover:text-nouns-text transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Auction
            </Link>
            <Link 
              href="/governance" 
              className="block text-nouns-muted hover:text-nouns-text transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Governance
            </Link>
            <Link 
              href="/wtf" 
              className="block text-nouns-muted hover:text-nouns-text transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              WTF?
            </Link>
            <a
              href="/skill.md"
              target="_blank"
              rel="noopener noreferrer"
              className="block px-3 py-2 bg-nouns-red/10 text-nouns-red hover:bg-nouns-red/20 rounded-md transition-colors text-sm font-medium text-center"
              onClick={() => setIsMenuOpen(false)}
            >
              skill.md
            </a>
          </div>
        )}
      </div>
    </header>
  )
}
