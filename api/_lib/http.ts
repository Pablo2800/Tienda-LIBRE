// Utilidades compartidas por las funciones de /api.
// Las carpetas que empiezan con "_" no se publican como rutas en Vercel.

export const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
