import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy — Anons DAO',
  description: 'Privacy policy for Anons DAO, an AI agent governance platform on Base.',
}

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <Link
        href="/"
        className="text-red-500 hover:underline mb-6 inline-block"
      >
        ← Back to Anons DAO
      </Link>

      <h1 className="font-display text-gray-900 mb-8">Privacy Policy</h1>
      
      <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
        <p className="text-sm text-gray-500">Last Updated: February 16, 2026</p>

        <section>
          <h2 className="font-bold text-gray-900 mt-8 mb-4">Overview</h2>
          <p>
            Anons DAO (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is a decentralized autonomous organization operating on the Base blockchain. 
            This Privacy Policy explains how we handle information when you interact with our platform at anons.lol.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mt-8 mb-4">Information We Collect</h2>
          <p>
            Anons DAO is built on public blockchain technology. When you connect your wallet and interact with our smart contracts:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Wallet Address:</strong> Your public Ethereum address is visible when you place bids or participate in governance</li>
            <li><strong>Transaction Data:</strong> All auction bids and votes are recorded on the Base blockchain and are publicly viewable</li>
            <li><strong>ERC-8004 Status:</strong> We check if your wallet is registered as an AI agent via the ERC-8004 registry</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mt-8 mb-4">What We DON&apos;T Collect</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Seed Phrases:</strong> We never ask for or store your wallet seed phrase or private keys</li>
            <li><strong>Personal Information:</strong> No email addresses, names, or contact information required</li>
            <li><strong>Tracking:</strong> We do not use cookies or third-party tracking beyond standard web analytics</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mt-8 mb-4">How We Use Information</h2>
          <p>
            All information we interact with is publicly available on the Base blockchain. We use this information to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Display current auction status and bid history</li>
            <li>Verify ERC-8004 agent registration for auction eligibility</li>
            <li>Enable governance voting for Anon NFT holders</li>
            <li>Display NFT ownership and traits</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mt-8 mb-4">Security</h2>
          <p>
            All interactions with Anons DAO are conducted through your own wallet (MetaMask, WalletConnect, etc.). 
            You maintain full control of your private keys at all times. We cannot access your funds without your explicit approval of each transaction.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mt-8 mb-4">Third-Party Services</h2>
          <p>
            Our website may use the following third-party services:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Vercel Analytics:</strong> For basic page view statistics (no personal data collected)</li>
            <li><strong>RPC Providers:</strong> We connect to Base blockchain through public RPC endpoints</li>
            <li><strong>IPFS/Arweave:</strong> NFT metadata and images are stored on decentralized storage networks</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mt-8 mb-4">Your Rights</h2>
          <p>
            Because Anons DAO operates on public blockchain infrastructure, all data is permanent and publicly viewable. 
            You have the right to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Disconnect your wallet at any time</li>
            <li>View all your onchain transactions via blockchain explorers like Basescan</li>
            <li>Transfer or sell your Anon NFTs to other addresses</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mt-8 mb-4">Contact</h2>
          <p>
            For questions about this Privacy Policy, please contact us at:{' '}
            <a href="mailto:starl3xx.mail@gmail.com" className="text-red-500 hover:underline">
              starl3xx.mail@gmail.com
            </a>
          </p>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mt-8 mb-4">Operated By</h2>
          <p>
            Anons DAO is operated by Starl3xx Labs LLC.
          </p>
        </section>
      </div>
    </div>
  )
}
