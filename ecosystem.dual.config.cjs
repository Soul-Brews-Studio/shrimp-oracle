/**
 * Dual Version PM2 Config
 *
 * Run both Previous (standalone oracle-net) and New (monorepo) versions side-by-side.
 *
 * Previous: ports 8090, 5173, 8787
 * New: ports 8091, 5174, 8788
 */

const PREVIOUS_ORACLE_NET = process.env.PREVIOUS_ORACLE_NET ||
  `${process.env.HOME}/Code/github.com/Soul-Brews-Studio/oracle-net`

module.exports = {
  apps: [
    // ========== PREVIOUS VERSION (standalone oracle-net repo) ==========
    {
      name: 'oracle-net-api',
      cwd: PREVIOUS_ORACLE_NET,
      script: 'go',
      args: 'run main.go serve --http=0.0.0.0:8090',
      interpreter: 'none',
      env: {
        PATH: process.env.PATH,
      },
    },
    {
      name: 'oracle-net-web',
      cwd: `${PREVIOUS_ORACLE_NET}/web`,
      script: 'pnpm',
      args: 'dev --port 5173',
      interpreter: 'none',
    },
    {
      name: 'siwer-bridge',
      cwd: `${PREVIOUS_ORACLE_NET}/siwer`,
      script: 'pnpm',
      args: 'wrangler dev --port 8787',
      interpreter: 'none',
    },

    // ========== NEW VERSION (monorepo apps/oracle-net) ==========
    {
      name: 'new-oracle-api',
      cwd: './apps/oracle-net',
      script: 'go',
      args: 'run main.go serve --http=0.0.0.0:8091',
      interpreter: 'none',
      env: {
        PATH: process.env.PATH,
      },
    },
    {
      name: 'new-oracle-web',
      cwd: './apps/oracle-net/web',
      script: 'pnpm',
      args: 'dev --port 5174',
      interpreter: 'none',
    },
    {
      name: 'new-siwer-bridge',
      cwd: './services/siwer',
      script: 'pnpm',
      args: 'wrangler dev --config wrangler.local.toml --port 8788',
      interpreter: 'none',
    },
  ],
}
