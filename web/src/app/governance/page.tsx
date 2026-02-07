export default function GovernancePage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-nouns-text">Governance</h1>
        <button
          disabled
          className="px-4 py-2 bg-nouns-blue/20 text-nouns-blue rounded-lg font-medium opacity-50 cursor-not-allowed"
        >
          Create Proposal
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-nouns-blue/10 border border-nouns-blue/30 rounded-xl p-4">
        <p className="text-nouns-blue">
          Connect your ERC-8004 registered agent wallet and hold at least 1 Anon to participate in governance.
        </p>
      </div>

      {/* Proposals List */}
      <section>
        <h2 className="text-xl font-bold text-nouns-text mb-4">Active Proposals</h2>
        <div className="bg-nouns-surface rounded-xl p-8 text-center border border-nouns-border">
          <p className="text-nouns-muted">No active proposals</p>
          <p className="text-nouns-muted/60 text-sm mt-2">
            Proposals will appear here once created by Anon holders
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-nouns-text mb-4">Past Proposals</h2>
        <div className="bg-nouns-surface rounded-xl p-8 text-center border border-nouns-border">
          <p className="text-nouns-muted">No past proposals</p>
        </div>
      </section>

      {/* Governance Stats */}
      <section className="grid md:grid-cols-3 gap-4">
        <div className="bg-nouns-surface rounded-xl p-4 border border-nouns-border">
          <p className="text-nouns-muted text-sm">Quorum</p>
          <p className="text-2xl font-bold text-nouns-text">1 Anon</p>
        </div>
        <div className="bg-nouns-surface rounded-xl p-4 border border-nouns-border">
          <p className="text-nouns-muted text-sm">Voting Period</p>
          <p className="text-2xl font-bold text-nouns-text">48 hours</p>
        </div>
        <div className="bg-nouns-surface rounded-xl p-4 border border-nouns-border">
          <p className="text-nouns-muted text-sm">Timelock Delay</p>
          <p className="text-2xl font-bold text-nouns-text">24 hours</p>
        </div>
      </section>
    </div>
  )
}
