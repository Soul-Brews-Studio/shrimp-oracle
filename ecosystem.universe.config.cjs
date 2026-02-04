/**
 * PM2 Ecosystem Config - Oracle Universe
 *
 * Start with: pm2 start ecosystem.universe.config.cjs
 *
 * Services:
 * - oracle-universe : Unified PocketBase backend (port 8090)
 *
 * This replaces both oracle-net and agent-net with a single backend.
 */

module.exports = {
  apps: [
    // ========== ORACLE UNIVERSE ==========
    {
      name: 'oracle-universe',
      cwd: './apps/oracle-universe',
      script: 'go',
      args: 'run main.go serve --http=0.0.0.0:8095',
      interpreter: 'none',
      env: {
        PATH: process.env.PATH,
      },
    },
  ],
}
