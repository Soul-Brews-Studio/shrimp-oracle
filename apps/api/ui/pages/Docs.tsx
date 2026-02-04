/**
 * API Documentation Page - Scalar API Reference
 */
import type { FC } from 'hono/jsx'

export const DocsPage: FC = () => {
  return (
    <html>
      <head>
        <title>Oracle Universe API - Docs</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📚</text></svg>" />
        <style dangerouslySetInnerHTML={{ __html: `
          body { margin: 0; padding: 0; }
        ` }} />
      </head>
      <body>
        {/* Scalar API Reference - loads from CDN */}
        <script id="api-reference" data-url="/openapi.json" data-configuration={JSON.stringify({
          darkMode: true,
          defaultOpenAllTags: true,
        })}></script>
        <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
      </body>
    </html>
  )
}
