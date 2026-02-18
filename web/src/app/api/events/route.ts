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
