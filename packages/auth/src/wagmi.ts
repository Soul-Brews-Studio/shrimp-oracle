import { http, createConfig } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

export function createWagmiConfig(apiUrl?: string) {
  return createConfig({
    chains: [mainnet],
    connectors: [
      injected(),
    ],
    transports: {
      [mainnet.id]: http(),
    },
  })
}

// Default config for simple cases
export const wagmiConfig = createWagmiConfig()
