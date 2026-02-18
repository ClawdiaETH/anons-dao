import { neon } from '@neondatabase/serverless'
import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, verifyMessage, isAddress } from 'viem'
import { base } from 'viem/chains'

const sql = neon(process.env.DATABASE_URL!)

const ANON_TOKEN_ADDRESS = '0x1ad890FCE6cB865737A3411E7d04f1F5668b0686'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { address, agentName, twitter, bio, website, signature, message, webhookUrl, webhookEvents } = body

    // Validate required fields
    if (!address || !agentName || !signature || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate address format
    if (!isAddress(address)) {
      return NextResponse.json(
        { success: false, error: 'Invalid address format' },
        { status: 400 }
      )
    }

    // Validate agent name length
    if (agentName.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Agent name too long (max 100 characters)' },
        { status: 400 }
      )
    }

    // Validate bio length
    if (bio && bio.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Bio too long (max 500 characters)' },
        { status: 400 }
      )
    }

    // Validate website URL
    if (website) {
      try {
        new URL(website)
      } catch {
        return NextResponse.json(
          { success: false, error: 'Invalid website URL' },
          { status: 400 }
        )
      }
    }

    // Validate webhook URL
    if (webhookUrl) {
      try {
        const url = new URL(webhookUrl)
        if (!['http:', 'https:'].includes(url.protocol)) {
          return NextResponse.json(
            { success: false, error: 'Webhook URL must use HTTP or HTTPS' },
            { status: 400 }
          )
        }
      } catch {
        return NextResponse.json(
          { success: false, error: 'Invalid webhook URL' },
          { status: 400 }
        )
      }
    }

    // Validate webhook events
    const validEventTypes = [
      'proposal_created',
      'proposal_executed',
      'vote_cast',
      'auction_started',
      'auction_ended',
      'holder_claimed',
    ]
    
    if (webhookEvents && Array.isArray(webhookEvents)) {
      for (const eventType of webhookEvents) {
        if (!validEventTypes.includes(eventType)) {
          return NextResponse.json(
            { success: false, error: `Invalid event type: ${eventType}` },
            { status: 400 }
          )
        }
      }
    }

    // Verify signature
    try {
      const valid = await verifyMessage({
        address: address as `0x${string}`,
        message,
        signature: signature as `0x${string}`,
      })

      if (!valid) {
        return NextResponse.json(
          { success: false, error: 'Invalid signature' },
          { status: 401 }
        )
      }
    } catch (error) {
      console.error('Signature verification error:', error)
      return NextResponse.json(
        { success: false, error: 'Signature verification failed' },
        { status: 401 }
      )
    }

    // Verify address owns Anon NFTs
    try {
      const client = createPublicClient({
        chain: base,
        transport: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'),
      })

      const balance = await client.readContract({
        address: ANON_TOKEN_ADDRESS,
        abi: [{
          type: 'function',
          name: 'balanceOf',
          inputs: [{ name: 'owner', type: 'address' }],
          outputs: [{ name: '', type: 'uint256' }],
          stateMutability: 'view',
        }],
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
      })

      if (balance === 0n) {
        return NextResponse.json(
          { success: false, error: 'Address does not own any Anon NFTs' },
          { status: 403 }
        )
      }
    } catch (error) {
      console.error('Error checking NFT balance:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to verify NFT ownership' },
        { status: 500 }
      )
    }

    // Store/update claim in database
    await sql`
      INSERT INTO holders_claims (
        address, 
        agent_name, 
        twitter_handle, 
        bio, 
        website, 
        signature, 
        message, 
        webhook_url,
        webhook_events,
        updated_at
      )
      VALUES (
        LOWER(${address}),
        ${agentName},
        ${twitter || null},
        ${bio || null},
        ${website || null},
        ${signature},
        ${message},
        ${webhookUrl || null},
        ${webhookEvents || null},
        NOW()
      )
      ON CONFLICT (address) DO UPDATE SET
        agent_name = EXCLUDED.agent_name,
        twitter_handle = EXCLUDED.twitter_handle,
        bio = EXCLUDED.bio,
        website = EXCLUDED.website,
        signature = EXCLUDED.signature,
        message = EXCLUDED.message,
        webhook_url = EXCLUDED.webhook_url,
        webhook_events = EXCLUDED.webhook_events,
        updated_at = NOW()
    `

    return NextResponse.json({
      success: true,
      message: 'Claim saved successfully',
    })
  } catch (error) {
    console.error('Error processing claim:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
