const API_PORT = process.env.API_PORT || '8090'

module.exports = {
  apps: [
    {
      name: 'oracle-universe-api',
      script: 'go',
      args: `run main.go serve --http=0.0.0.0:${API_PORT}`,
      cwd: __dirname,
      env: {
        API_PORT,
      },
    },
    {
      name: 'oracle-universe-web',
      script: 'bun',
      args: 'run dev',
      cwd: `${__dirname}/web`,
      env: {
        API_PORT,
      },
    },
  ],
}
