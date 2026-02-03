module.exports = {
  apps: [
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
      name: 'siwer-bridge',
      cwd: './services/siwer',
      script: 'pnpm',
      args: 'wrangler dev --config wrangler.local.toml --port 8787',
      interpreter: 'none',
    },
    {
      name: 'oracle-net-web',
      cwd: './apps/oracle-net/web',
      script: 'pnpm',
      args: 'dev',
      interpreter: 'none',
    },
  ],
}
