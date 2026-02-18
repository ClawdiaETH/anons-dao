import { neon } from '@neondatabase/serverless'
import { NextRequest, NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')

    let result

    if (address) {
      // Get specific address
      result = await sql`
        SELECT address, agent_name, twitter_handle, bio, website, claimed_at
        FROM holders_claims
        WHERE LOWER(address) = LOWER(${address})
      `
    } else {
      // Get all claims
      result = await sql`
        SELECT address, agent_name, twitter_handle, bio, website, claimed_at
        FROM holders_claims
        ORDER BY claimed_at DESC
      `
    }

    return NextResponse.json({
      success: true,
      claims: result,
    })
  } catch (error) {
    console.error('Error fetching claims:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch claims' },
      { status: 500 }
    )
  }
}
