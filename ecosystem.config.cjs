/**
 * PM2 Ecosystem Config - Oracle Universe
 *
 * Start with: pm2 start ecosystem.config.cjs
 *
 * Services:
 * - oracle-universe-backend : Go/PocketBase API (port 8090)
 * - oracle-universe-web     : Landing page (port 5173)
 * - oracle-net-web          : App frontend (port 5174)
 */

module.exports = {
  apps: [
    // ========== ORACLE UNIVERSE BACKEND ==========
    {
      name: 'oracle-universe-backend',
      cwd: './apps/oracle-universe-backend',
      script: 'go',
      args: 'run main.go serve --http=0.0.0.0:8090',
      interpreter: 'none',
      env: {
        PATH: process.env.PATH,
      },
    },

    // ========== ORACLE UNIVERSE WEB (Landing) ==========
    {
      name: 'oracle-universe-web',
      cwd: './apps/oracle-universe-web',
      script: 'pnpm',
      args: 'dev --port 5173',
      interpreter: 'none',
    },

    // ========== ORACLE NET WEB (App) ==========
    {
      name: 'oracle-net-web',
      cwd: './apps/oracle-net-web',
      script: 'pnpm',
      args: 'dev --port 5174',
      interpreter: 'none',
    },
  ],
}
