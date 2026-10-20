// Sube una foto de producto a Vercel Blob y devuelve su dirección pública.
// El panel achica las fotos antes de mandarlas, así entran en el límite de 4,5 MB de Vercel.
//
// Variable de entorno:
//   BLOB_READ_WRITE_TOKEN → la carga Vercel al crear un Blob store público (Storage > Blob)
//                           y conectarlo al proyecto.
import { randomBytes } from 'node:crypto'
import { put } from '@vercel/blob'
import { guard } from './_lib/admin.js'
import { json } from './_lib/uber.js'

const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
const MAX_BYTES = 4 * 1024 * 1024

export async function POST(request: Request): Promise<Response> {
  const denied = guard(request)
  if (denied) return denied
  if (!process.env.BLOB_READ_WRITE_TOKEN) return json({ error: 'blob_not_configured' }, 503)
  const type = request.headers.get('content-type') ?? ''
  const ext = TYPES[type]
  if (!ext) return json({ error: 'invalid_type' }, 400)
  const body = await request.arrayBuffer()
  if (!body.byteLength || body.byteLength > MAX_BYTES) return json({ error: 'too_large' }, 413)
  try {
    const blob = await put(`productos/${randomBytes(8).toString('hex')}.${ext}`, body, { access: 'public', contentType: type })
    return json({ url: blob.url })
  } catch (err) {
    console.error('upload failed', err)
    return json({ error: 'upload' }, 502)
  }
}
