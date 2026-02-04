/**
 * Auth routes - SIWE + Chainlink proof-of-time
 */
import { Elysia } from 'elysia'
import { recoverMessageAddress } from 'viem'
import { parseSiweMessage } from 'viem/siwe'

// Chainlink BTC/USD on Ethereum Mainnet
const CHAINLINK_BTC_USD = '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c'
const ETH_RPC = 'https://ethereum.publicnode.com'

// Get PocketBase URL from env or default
const getPbUrl = () => process.env.POCKETBASE_URL || 'http://localhost:8090'

// Fetch BTC price from Chainlink
async function getChainlinkBtcPrice(): Promise<{ price: number; roundId: string; timestamp: number }> {
  const calldata = '0xfeaf968c' // latestRoundData()
  const response = await fetch(ETH_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_call',
      params: [{ to: CHAINLINK_BTC_USD, data: calldata }, 'latest'],
    }),
  })
  const result = await response.json() as { result: string }
  // Decode: (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)
  const data = result.result.slice(2) // remove 0x
  const roundId = BigInt('0x' + data.slice(0, 64)).toString()
  const answer = BigInt('0x' + data.slice(64, 128))
  const updatedAt = BigInt('0x' + data.slice(192, 256))
  return {
    price: Number(answer) / 1e8,
    roundId,
    timestamp: Number(updatedAt),
  }
}

export const authRoutes = new Elysia({ prefix: '/api/auth' })
  // Get Chainlink BTC price (nonce = roundId)
  .get('/chainlink', async ({ set }) => {
    try {
      const data = await getChainlinkBtcPrice()
      return {
        price: data.price,
        roundId: data.roundId,
        timestamp: data.timestamp,
        message: `Use roundId as nonce in SIWE message`,
      }
    } catch (e: any) {
      set.status = 500
      return { error: 'Failed to fetch Chainlink price', details: e.message }
    }
  })

  // Verify SIWE signature and authenticate human
  .post('/humans/verify', async ({ body, set }) => {
    const { message, signature } = body as { message: string; signature: string }
    const PB_URL = getPbUrl()

    if (!message || !signature) {
      set.status = 400
      return { error: 'Missing message or signature' }
    }

    try {
      // Parse SIWE message
      const siweMessage = parseSiweMessage(message)
      if (!siweMessage.address || !siweMessage.nonce) {
        set.status = 400
        return { error: 'Invalid SIWE message' }
      }

      // Recover address from signature
      const recoveredAddress = await recoverMessageAddress({
        message,
        signature: signature as `0x${string}`,
      })

      // Verify signature matches claimed address
      if (recoveredAddress.toLowerCase() !== siweMessage.address.toLowerCase()) {
        set.status = 401
        return { error: 'Signature does not match address' }
      }

      // Verify proof-of-time: nonce should be a recent Chainlink roundId
      const currentChainlink = await getChainlinkBtcPrice()
      const nonceBigInt = BigInt(siweMessage.nonce)
      const currentRoundBigInt = BigInt(currentChainlink.roundId)

      // Allow roundId within last 10 rounds (~1 hour for BTC/USD)
      if (currentRoundBigInt - nonceBigInt > 10n) {
        set.status = 401
        return { error: 'Nonce (roundId) is too old - signature expired' }
      }

      const walletAddress = recoveredAddress.toLowerCase()

      // Check if human exists in PocketBase
      const checkParams = new URLSearchParams({
        filter: `wallet_address = "${walletAddress}"`,
        perPage: '1',
      })
      const checkRes = await fetch(`${PB_URL}/api/collections/humans/records?${checkParams}`)
      const checkData = await checkRes.json() as { items: any[] }

      let human: any
      let created = false

      if (checkData.items && checkData.items.length > 0) {
        human = checkData.items[0]
      } else {
        // Create new human
        const createRes = await fetch(`${PB_URL}/api/collections/humans/records`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wallet_address: walletAddress,
            display_name: `Human-${walletAddress.slice(2, 8)}`,
          }),
        })

        if (!createRes.ok) {
          const error = await createRes.text()
          set.status = 500
          return { error: 'Failed to create human', details: error }
        }

        human = await createRes.json()
        created = true
      }

      return {
        success: true,
        created,
        proofOfTime: {
          btc_price: currentChainlink.price,
          round_id: siweMessage.nonce,
          timestamp: currentChainlink.timestamp,
        },
        human: {
          id: human.id,
          wallet_address: human.wallet_address,
          display_name: human.display_name,
          github_username: human.github_username,
        },
      }
    } catch (e: any) {
      set.status = 500
      return { error: 'Verification failed', details: e.message }
    }
  })

  // Check if wallet is registered
  .get('/humans/check', async ({ query, set }) => {
    const address = (query.address as string)?.toLowerCase()
    const PB_URL = getPbUrl()

    if (!address) {
      set.status = 400
      return { error: 'Address required' }
    }

    try {
      const params = new URLSearchParams({
        filter: `wallet_address = "${address}"`,
        perPage: '1',
      })
      const res = await fetch(`${PB_URL}/api/collections/humans/records?${params}`)
      const data = await res.json() as { items: any[] }

      if (data.items && data.items.length > 0) {
        return {
          registered: true,
          human: {
            id: data.items[0].id,
            wallet_address: data.items[0].wallet_address,
            display_name: data.items[0].display_name,
          },
        }
      }
      return { registered: false }
    } catch (e: any) {
      set.status = 500
      return { error: e.message }
    }
  })
