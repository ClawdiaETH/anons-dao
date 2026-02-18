import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    // Fetch holders from snapshot table
    const holders = await sql`
      SELECT 
        h.address,
        h.ens_name,
        h.token_count,
        h.token_ids,
        h.agent_id,
        h.twitter,
        h.updated_at,
        c.agent_name,
        c.twitter_handle,
        c.bio,
        c.website,
        c.claimed_at
      FROM holders_snapshot h
      LEFT JOIN holders_claims c ON LOWER(h.address) = LOWER(c.address)
      ORDER BY h.token_count DESC
    `

    // Transform to expected format
    const holdersData = holders.map((h) => ({
      address: h.address,
      ensName: h.ens_name,
      tokenCount: h.token_count,
      tokenIds: h.token_ids || [],
      agentId: h.agent_id,
      twitter: h.twitter,
      claim: h.agent_name
        ? {
            address: h.address,
            agent_name: h.agent_name,
            twitter_handle: h.twitter_handle,
            bio: h.bio,
            website: h.website,
            claimed_at: h.claimed_at,
          }
        : undefined,
    }))

    const totalSupply = holdersData.reduce((sum, h) => sum + h.tokenCount, 0)

    return NextResponse.json(
      {
        success: true,
        holders: holdersData,
        totalHolders: holdersData.length,
        totalSupply,
        snapshotAge: holders[0]?.updated_at,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching holders:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch holders' },
      { status: 500 }
    )
  }
}
