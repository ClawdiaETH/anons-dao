import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

/**
 * Create a new event in the database and trigger notifications
 */
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

/**
 * Send webhook notifications to registered holders
 */
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
