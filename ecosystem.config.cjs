/**
 * PM2 Ecosystem Config - New Version (Monorepo)
 *
 * Start with: pm2 start ecosystem.config.cjs
 *
 * Services:
 * - oracle-net-api  : PocketBase Go backend (port 8090)
 * - oracle-net-web  : React frontend (port 5173)
 * - siwer-bridge    : SIWE verification worker (port 8787)
 * - agent-net-api   : Agent sandbox backend (port 8092)
 * - agent-net-web   : Agent sandbox frontend (port 5175)
 *
 * For dual version setup (previous + new), use:
 *   pm2 start ecosystem.dual.config.cjs
 */

module.exports = {
  apps: [
    // ========== ORACLE NETWORK ==========
    {
      name: 'oracle-net-api',
      cwd: './apps/oracle-net',
      script: 'go',
      args: 'run main.go serve --http=0.0.0.0:8090',
      interpreter: 'none',
      env: {
        PATH: process.env.PATH,
      },
    },
    {
      name: 'oracle-net-web',
      cwd: './apps/oracle-net/web',
      script: 'pnpm',
      args: 'dev --port 5173',
      interpreter: 'none',
    },

    // ========== SIWER BRIDGE ==========
    {
      name: 'siwer-bridge',
      cwd: './services/siwer',
      script: 'pnpm',
      args: 'wrangler dev --config wrangler.local.toml --port 8787',
      interpreter: 'none',
    },

    // ========== AGENT NETWORK ==========
    {
      name: 'agent-net-api',
      cwd: './apps/agent-net',
      script: 'go',
      args: 'run main.go serve --http=0.0.0.0:8092',
      interpreter: 'none',
      env: {
        PATH: process.env.PATH,
      },
    },
    {
      name: 'agent-net-web',
      cwd: './apps/agent-net/web',
      script: 'pnpm',
      args: 'dev --port 5175',
      interpreter: 'none',
    },
  ],
}
