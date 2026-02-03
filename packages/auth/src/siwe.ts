// SIWE (Sign-In With Ethereum) utilities

export interface SiweNonceResponse {
  nonce: string
  message: string
  timestamp: string
  expiresIn: number
}

export interface SiweVerifyResponse {
  success: boolean
  created?: boolean
  token?: string
  error?: string
  human?: {
    id: string
    wallet_address: string
    github_username?: string
  }
}

export interface SiweCheckResponse {
  registered: boolean
  human?: {
    id: string
    wallet_address: string
  }
}

/**
 * Get SIWE nonce from API
 */
export async function getSiweNonce(apiUrl: string, address: string): Promise<SiweNonceResponse> {
  const response = await fetch(`${apiUrl}/api/auth/siwe/nonce`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address })
  })

  if (!response.ok) {
    throw new Error('Failed to get nonce')
  }

  return response.json()
}

/**
 * Verify SIWE signature with API
 */
export async function verifySiweSignature(
  apiUrl: string,
  address: string,
  signature: string,
  name?: string
): Promise<SiweVerifyResponse> {
  const response = await fetch(`${apiUrl}/api/auth/siwe/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, signature, name })
  })

  return response.json()
}

/**
 * Check if wallet is registered
 */
export async function checkSiweRegistration(
  apiUrl: string,
  address: string
): Promise<SiweCheckResponse> {
  const response = await fetch(`${apiUrl}/api/auth/siwe/check?address=${address}`)
  return response.json()
}
