import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const since = searchParams.get('since') // ISO timestamp or unix ms
    const types = searchParams.get('types') // comma-separated event types
    const limit = parseInt(searchParams.get('limit') || '50')

    let query

    if (types) {
      const typeList = types.split(',').map(t => t.trim())
      
      if (since) {
        const sinceDate = isNaN(Number(since)) 
          ? new Date(since) 
          : new Date(Number(since))
        
        query = sql`
          SELECT 
            id,
            event_type,
            event_data,
            created_at,
            blockchain_tx
          FROM anons_events
          WHERE event_type = ANY(${typeList})
          AND created_at > ${sinceDate}
          ORDER BY created_at DESC
          LIMIT ${limit}
        `
      } else {
        query = sql`
          SELECT 
            id,
            event_type,
            event_data,
            created_at,
            blockchain_tx
          FROM anons_events
          WHERE event_type = ANY(${typeList})
          ORDER BY created_at DESC
          LIMIT ${limit}
        `
      }
    } else if (since) {
      const sinceDate = isNaN(Number(since)) 
        ? new Date(since) 
        : new Date(Number(since))
      
      query = sql`
        SELECT 
          id,
          event_type,
          event_data,
          created_at,
          blockchain_tx
        FROM anons_events
        WHERE created_at > ${sinceDate}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `
    } else {
      query = sql`
        SELECT 
          id,
          event_type,
          event_data,
          created_at,
          blockchain_tx
        FROM anons_events
        ORDER BY created_at DESC
        LIMIT ${limit}
      `
    }

    const events = await query

    return NextResponse.json(
      {
        success: true,
        events: events.map(e => ({
          id: e.id,
          type: e.event_type,
          data: e.event_data,
          timestamp: e.created_at,
          tx: e.blockchain_tx,
        })),
        count: events.length,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

// Helper to create events (used by other parts of the system)
export async function createEvent(
  eventType: string,
  eventData: object,
  blockchainTx?: string
) {
  try {
    await sql`
      INSERT INTO anons_events (event_type, event_data, blockchain_tx)
      VALUES (${eventType}, ${JSON.stringify(eventData)}, ${blockchainTx || null})
    `
    
    // Trigger webhook notifications
    await notifyWebhooks(eventType, eventData)
    
    return true
  } catch (error) {
    console.error('Error creating event:', error)
    return false
  }
}

// Webhook notification system
async function notifyWebhooks(eventType: string, eventData: object) {
  try {
    // Get all holders with webhooks registered for this event type
    const holders = await sql`
      SELECT webhook_url, webhook_events, address
      FROM holders_claims
      WHERE webhook_url IS NOT NULL
      AND (
        webhook_events IS NULL 
        OR ${eventType} = ANY(webhook_events)
      )
    `

    // Send webhooks in parallel
    const webhookPromises = holders.map(async (holder) => {
      try {
        const response = await fetch(holder.webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Anons-Event': eventType,
            'X-Anons-Holder': holder.address,
          },
          body: JSON.stringify({
            type: eventType,
            data: eventData,
            timestamp: new Date().toISOString(),
          }),
          signal: AbortSignal.timeout(5000), // 5s timeout
        })

        if (!response.ok) {
          console.warn(`Webhook failed for ${holder.address}: ${response.status}`)
        }
      } catch (error) {
        console.warn(`Webhook error for ${holder.address}:`, error)
      }
    })

    await Promise.allSettled(webhookPromises)
  } catch (error) {
    console.error('Error sending webhooks:', error)
  }
}
