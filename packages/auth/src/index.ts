// Wagmi configuration
export { createWagmiConfig, wagmiConfig } from './wagmi'

// SIWE utilities (old backend)
export {
  getSiweNonce,
  verifySiweSignature,
  checkSiweRegistration,
  type SiweNonceResponse,
  type SiweVerifyResponse,
  type SiweCheckResponse,
} from './siwe'

// SIWE utilities (new backend - oracle-universe-backend)
export {
  verifyHumanSiwe,
  type HumanVerifyRequest,
  type HumanVerifyResponse,
  type ProofOfTime,
} from './siwe'

// Chainlink utilities (proof-of-time)
export { getBtcPrice, type ChainlinkPrice } from './chainlink'

// SIWE message builder
export { buildSiweMessage, type BuildSiweMessageParams } from './siwe-message'

// PocketBase client
export { createPocketBaseClient } from './pocketbase'
