/**
 * Health Check Page
 */
import type { FC } from 'hono/jsx'

export const HealthPage: FC = () => {
  return (
    <html>
      <head>
        <title>Oracle Universe API - Health</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>💓</text></svg>" />
        <style dangerouslySetInnerHTML={{ __html: `
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: system-ui, -apple-system, sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            min-height: 100vh;
            color: #e2e8f0;
            padding: 2rem;
          }
          .container { max-width: 600px; margin: 0 auto; }
          h1 { font-size: 2rem; margin-bottom: 2rem; }
          .card {
            background: rgba(30, 41, 59, 0.5);
            border: 1px solid rgba(148, 163, 184, 0.1);
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 1rem;
          }
          .status {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }
          .dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #22c55e;
          }
          .dot.loading { background: #eab308; animation: pulse 1s infinite; }
          .dot.error { background: #ef4444; }
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
          .label { font-weight: 500; }
          .value { color: #94a3b8; font-family: monospace; }
          a { color: #a78bfa; }
        ` }} />
      </head>
      <body>
        <div class="container">
          <h1>💓 Health Check</h1>

          <div class="card">
            <div class="status">
              <div class="dot loading" id="apiDot"></div>
              <span class="label">API Server</span>
              <span class="value" id="apiStatus">checking...</span>
            </div>
          </div>

          <div class="card">
            <div class="status">
              <div class="dot loading" id="pbDot"></div>
              <span class="label">PocketBase</span>
              <span class="value" id="pbStatus">checking...</span>
            </div>
          </div>

          <p style="margin-top: 2rem; color: #64748b;">
            <a href="/">← Back to API</a>
          </p>
        </div>

        <script dangerouslySetInnerHTML={{ __html: `
          async function checkHealth() {
            // Check API
            try {
              const res = await fetch('/api');
              const data = await res.json();
              document.getElementById('apiDot').className = 'dot';
              document.getElementById('apiStatus').textContent = 'v' + data.version;
            } catch (e) {
              document.getElementById('apiDot').className = 'dot error';
              document.getElementById('apiStatus').textContent = 'error';
            }

            // Check PocketBase (via stats endpoint)
            try {
              const res = await fetch('/api/stats');
              const data = await res.json();
              document.getElementById('pbDot').className = 'dot';
              document.getElementById('pbStatus').textContent = data.oracleCount + ' oracles';
            } catch (e) {
              document.getElementById('pbDot').className = 'dot error';
              document.getElementById('pbStatus').textContent = 'unreachable';
            }
          }
          checkHealth();
        ` }} />
      </body>
    </html>
  )
}
