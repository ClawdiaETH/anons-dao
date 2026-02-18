import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

/**
 * Send notification via Net Protocol
 */
export async function sendNetProtocolNotification(
  to: string,
  message: string,
  chainId: number = 8453
) {
  try {
    const command = `netp message send --chain-id ${chainId} --to ${to} --message "${message.replace(/"/g, '\\"')}"`
    await execAsync(command)
    return true
  } catch (error) {
    console.error('Net Protocol notification failed:', error)
    return false
  }
}

/**
 * Broadcast notification to all holders via Net Protocol
 */
export async function broadcastNetProtocol(message: string, chainId: number = 8453) {
  try {
    const command = `netp message broadcast --chain-id ${chainId} --message "${message.replace(/"/g, '\\"')}"`
    await execAsync(command)
    return true
  } catch (error) {
    console.error('Net Protocol broadcast failed:', error)
    return false
  }
}

/**
 * Send event notification to all registered channels
 */
export async function notifyEvent(
  eventType: string,
  eventData: {
    title: string
    description: string
    link?: string
    addresses?: string[]
  }
) {
  const message = eventData.link
    ? `${eventData.title}: ${eventData.description} - ${eventData.link}`
    : `${eventData.title}: ${eventData.description}`

  const promises = []

  // Broadcast to all holders via Net Protocol
  if (shouldBroadcast(eventType)) {
    promises.push(broadcastNetProtocol(message))
  }

  // Send to specific addresses if provided
  if (eventData.addresses && eventData.addresses.length > 0) {
    for (const address of eventData.addresses) {
      promises.push(sendNetProtocolNotification(address, message))
    }
  }

  await Promise.allSettled(promises)
}

/**
 * Determine if event type should be broadcast to all holders
 */
function shouldBroadcast(eventType: string): boolean {
  const broadcastTypes = [
    'auction_started',
    'proposal_created',
    'proposal_executed',
  ]
  return broadcastTypes.includes(eventType)
}

/**
 * Event type descriptions for notifications
 */
export const EVENT_MESSAGES = {
  proposal_created: (data: { proposalId: string; title: string; proposer: string }) =>
    `New governance proposal: ${data.title} (by ${data.proposer})`,
  
  proposal_executed: (data: { proposalId: string; title: string }) =>
    `Proposal executed: ${data.title}`,
  
  vote_cast: (data: { proposalId: string; voter: string; support: boolean }) =>
    `Vote cast on proposal by ${data.voter}: ${data.support ? 'For' : 'Against'}`,
  
  auction_started: (data: { anonId: string; endTime: string }) =>
    `Anon #${data.anonId} auction started! Ends at ${data.endTime}`,
  
  auction_ended: (data: { anonId: string; winner: string; price: string }) =>
    `Anon #${data.anonId} sold to ${data.winner} for ${data.price} ETH`,
  
  holder_claimed: (data: { address: string; agentName: string }) =>
    `New holder claimed profile: ${data.agentName}`,
}
