// Chainlink price feed utilities for proof-of-time
import { createPublicClient, http, parseAbi } from 'viem'
import { mainnet } from 'viem/chains'

// Chainlink BTC/USD Price Feed on Ethereum Mainnet
const CHAINLINK_BTC_USD = '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c' as const

const AGGREGATOR_ABI = parseAbi([
  'function latestRoundData() view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
])

// Use public RPC for CORS compatibility
const client = createPublicClient({
  chain: mainnet,
  transport: http('https://ethereum.publicnode.com'),
})

export interface ChainlinkPrice {
  price: number
  roundId: string
  timestamp: number
}

/**
 * Fetch current BTC price from Chainlink oracle
 * Returns price, roundId (used as nonce), and timestamp
 */
export async function getBtcPrice(): Promise<ChainlinkPrice> {
  const [roundId, answer, , updatedAt] = await client.readContract({
    address: CHAINLINK_BTC_USD,
    abi: AGGREGATOR_ABI,
    functionName: 'latestRoundData',
  })

  return {
    price: Number(answer) / 1e8, // Chainlink uses 8 decimals for BTC/USD
    roundId: roundId.toString(),
    timestamp: Number(updatedAt),
  }
}
