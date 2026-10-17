import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// En Vercel, los archivos de /api se publican solos como funciones del servidor.
// En local (npm run dev), este plugin atiende /api/<nombre> con la función de api/<nombre>.ts,
// leyendo las credenciales de .env.local.
function localApi(): Plugin {
  return {
    name: 'local-api',
    configureServer(server) {
      Object.assign(process.env, loadEnv(server.config.mode, process.cwd(), ''))
      server.middlewares.use('/api', async (req, res, next) => {
        const url = new URL(req.originalUrl ?? req.url ?? '/', `http://${req.headers.host}`)
        const name = url.pathname.replace(/^\/api\//, '')
        if (!/^[a-z-]+$/.test(name)) return next()
        const chunks: Buffer[] = []
        for await (const chunk of req) chunks.push(chunk as Buffer)
        const mod = await server.ssrLoadModule(`/api/${name}.ts`).catch(() => null)
        const handler = mod?.[req.method ?? 'GET']
        if (!handler) return next()
        const response: Response = await handler(
          new Request(url, {
            method: req.method,
            headers: req.headers as Record<string, string>,
            body: chunks.length ? Buffer.concat(chunks) : undefined,
          }),
        )
        res.statusCode = response.status
        res.setHeader('Content-Type', response.headers.get('content-type') ?? 'application/json')
        res.end(await response.text())
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), localApi()],
})
