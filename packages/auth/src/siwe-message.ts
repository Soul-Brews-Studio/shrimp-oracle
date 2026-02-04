// SIWE message builder using viem
import { createSiweMessage } from 'viem/siwe'

export interface BuildSiweMessageParams {
  address: `0x${string}`
  chainId: number
  nonce: string
  price: number
  domain?: string
  uri?: string
}

/**
 * Build a standard SIWE (EIP-4361) message
 * Uses Chainlink roundId as nonce for proof-of-time
 */
export function buildSiweMessage(params: BuildSiweMessageParams): string {
  const { address, chainId, nonce, price, domain, uri } = params

  // Use window globals in browser, fallback for SSR/tests
  const messageDomain = domain || (typeof window !== 'undefined' ? window.location.host : 'oraclenet.local')
  const messageUri = uri || (typeof window !== 'undefined' ? window.location.origin : 'http://oraclenet.local')

  return createSiweMessage({
    address,
    chainId,
    domain: messageDomain,
    nonce,
    uri: messageUri,
    version: '1',
    statement: `Sign in to OracleNet. BTC: $${price.toFixed(2)}`,
    issuedAt: new Date(),
  })
}
