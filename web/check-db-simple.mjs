import { neon } from '@neondatabase/serverless'

const DATABASE_URL = 'postgresql://neondb_owner:npg_6QxIDE7dMnvp@ep-fancy-shape-a-imqj22i-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require'

const sql = neon(DATABASE_URL)

async function checkDatabase() {
  try {
    console.log('Checking database connection and tables...\n')
    
    // Check if bids table exists
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `
    
    console.log('Tables in database:')
    tables.forEach(t => console.log(`  - ${t.table_name}`))
    
    // If bids table exists, check count
    if (tables.some(t => t.table_name === 'bids')) {
      console.log('\nChecking bids table...')
      const count = await sql`SELECT COUNT(*) as count FROM bids`
      console.log(`Found ${count[0].count} bids`)
      
      if (count[0].count > 0) {
        const sample = await sql`SELECT * FROM bids ORDER BY timestamp DESC LIMIT 5`
        console.log('\nSample bids:')
        sample.forEach(bid => {
          console.log(`  Anon #${bid.anon_id}: ${bid.bidder} - ${bid.amount} wei`)
        })
      }
    } else {
      console.log('\n⚠️  BIDS TABLE DOES NOT EXIST!')
      console.log('Need to run migrations!')
    }
  } catch (error) {
    console.error('Error:', error.message)
    console.error(error)
  }
}

checkDatabase()
