import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { readFile } from 'fs/promises'
import { join } from 'path'

const app = new Hono()

// Serve static files with proper cache control
app.use('*', async (c, next) => {
  const path = c.req.path

  // Static assets (JS, CSS, images) - cache for 1 year
  if (path.match(/\.(js|css|png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf|eot|ico)$/)) {
    c.header('Cache-Control', 'public, max-age=31536000, immutable')
  }
  // HTML files - no cache to ensure fresh content
  else if (path.match(/\.html$/) || path === '/' || !path.includes('.')) {
    c.header('Cache-Control', 'no-cache, no-store, must-revalidate')
    c.header('Pragma', 'no-cache')
    c.header('Expires', '0')
  }

  await next()
})

// Serve static files from 'out' directory
app.use('*', serveStatic({ root: './out' }))

// SPA fallback - serve index.html for any route that doesn't match a file
app.get('*', async (c) => {
  try {
    const indexPath = join(process.cwd(), 'out', 'index.html')
    const html = await readFile(indexPath, 'utf-8')
    c.header('Cache-Control', 'no-cache, no-store, must-revalidate')
    c.header('Content-Type', 'text/html; charset=utf-8')
    return c.html(html)
  } catch (error) {
    return c.text('Not Found', 404)
  }
})

const port = parseInt(process.env.PORT || '3000')
console.log(`Server running at http://localhost:${port}`)

export default {
  port,
  fetch: app.fetch,
}
