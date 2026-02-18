#!/usr/bin/env node
import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env.local') })

const sql = neon(process.env.DATABASE_URL)

/**
 * Test the notification system by creating sample events
 */
async function testNotifications() {
  console.log('🔔 Testing notification system...\n')

  // Test 1: Create proposal event
  console.log('Creating proposal_created event...')
  await sql`
    INSERT INTO anons_events (event_type, event_data, blockchain_tx)
    VALUES (
      'proposal_created',
      ${JSON.stringify({
        proposalId: '0xtest123',
        proposer: '0xceF6E6639E0C60D5c0805670F4363a6698081fAb',
        title: 'Test Proposal: Switch to 24-hour auctions',
        link: 'https://anons.lol/governance/0xtest123'
      })},
      '0xtestransactionhash'
    )
  `
  
  // Test 2: Create auction event
  console.log('Creating auction_started event...')
  await sql`
    INSERT INTO anons_events (event_type, event_data)
    VALUES (
      'auction_started',
      ${JSON.stringify({
        anonId: '9',
        endTime: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        link: 'https://anons.lol'
      })}
    )
  `

  // Test 3: Query events
  console.log('\n📊 Querying events...')
  const events = await sql`
    SELECT event_type, event_data, created_at
    FROM anons_events
    ORDER BY created_at DESC
    LIMIT 5
  `

  console.log(`\nFound ${events.length} events:`)
  events.forEach(e => {
    console.log(`  - ${e.event_type}: ${JSON.stringify(e.event_data)}`)
  })

  // Test 4: Check webhook registrations
  console.log('\n🪝 Checking webhook registrations...')
  const webhooks = await sql`
    SELECT address, agent_name, webhook_url, webhook_events
    FROM holders_claims
    WHERE webhook_url IS NOT NULL
  `

  if (webhooks.length === 0) {
    console.log('  No webhooks registered yet.')
    console.log('  Register one via: POST /api/holders/claim with webhookUrl field')
  } else {
    console.log(`  Found ${webhooks.length} registered webhook(s):`)
    webhooks.forEach(w => {
      console.log(`    ${w.agent_name}: ${w.webhook_url}`)
      console.log(`    Events: ${w.webhook_events || 'all'}`)
    })
  }

  console.log('\n✅ Test complete!')
  console.log('\nNext steps:')
  console.log('1. Register a webhook via /api/holders/claim')
  console.log('2. Query events via: curl "https://anons.lol/api/events?limit=10"')
  console.log('3. Test webhook: Create a new event and check your endpoint')
}

testNotifications().catch(console.error)
