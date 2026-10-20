// Contraseña del panel del local (/admin), compartida por todas sus rutas.
//
// Variables de entorno:
//   ADMIN_PASSWORD → la contraseña del panel. Sin ella, el panel queda deshabilitado.
//   DATABASE_URL   → la carga Vercel al conectar la base de Neon (Storage).
import { createHash, timingSafeEqual } from 'node:crypto'
import { dbConfigured } from './db.js'
import { json } from './uber.js'

const digest = (s: string) => createHash('sha256').update(s).digest()

// Devuelve una respuesta de error, o null si la contraseña es correcta.
export function guard(request: Request): Response | null {
  const password = process.env.ADMIN_PASSWORD
  if (!password) return json({ error: 'admin_not_configured' }, 503)
  if (!dbConfigured()) return json({ error: 'db_not_configured' }, 503)
  const given = (request.headers.get('authorization') ?? '').replace(/^Bearer /, '')
  // Se comparan los hashes para que el tiempo de respuesta no revele la contraseña.
  if (!timingSafeEqual(digest(given), digest(password))) return json({ error: 'unauthorized' }, 401)
  return null
}
