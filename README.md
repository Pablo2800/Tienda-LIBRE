# Ortopedia Andina (demo)

Tienda online de ortopedia con envío en el día en Gran Mendoza.
Esta primera etapa es una demo navegable para mostrarle al cliente: catálogo,
buscador, carrito, checkout con cotización de envío según la dirección, pago y
seguimiento del pedido. El envío y el pago están **simulados**.

## Correr el proyecto

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/ para publicar
```

## Estructura

- `src/data/products.ts`: catálogo de ejemplo (después viene de una base de datos).
- `src/lib/shipping.ts`: cotización de envío simulada. Acá se conecta después la API de Uber Direct (vía backend).
- `src/context/CartContext.tsx`: carrito, guardado en el navegador.
- `src/components/`: header, tarjetas, detalle de producto, carrito, checkout y seguimiento.

## Campos de un producto

En `src/data/products.ts`, además de nombre, precio y stock:

- `indication`: para qué sirve, en palabras del paciente. El buscador también busca acá.
- `detail`: material, medidas o presentación.
- `sizes`: talles disponibles. Si tiene, hay que elegir uno antes de agregarlo al carrito.
- `madeToMeasure`: se fabrica a medida. Se muestra "desde" en el precio y, después de la compra, el aviso de que se coordina la toma de molde.
- `bulky`: no entra en una moto (silla de ruedas, andador). El envío se cotiza en auto.
- `kind`: qué ilustración usar mientras no haya fotos.

## Fotos y videos de un producto

Cada producto puede tener una lista `media` en `src/data/products.ts`. Si tiene
más de un elemento, el detalle del producto muestra un carrusel; si no tiene
ninguno, se ve la ilustración genérica. Los archivos van en `public/productos/<id>/`.

```ts
media: [
  { type: 'image', src: '/productos/plantillas-a-medida/frente.jpg', alt: 'Vista frontal' },
  { type: 'video', src: '/productos/plantillas-a-medida/video.mp4', poster: '/productos/plantillas-a-medida/video-poster.jpg' },
  { type: 'youtube', id: 'ID_DEL_VIDEO', title: 'Cómo colocar la plantilla' },
],
```

La primera imagen (o el `poster` del primer video) se usa como foto de la tarjeta en el catálogo.

## Próximas etapas

1. Publicar la demo (Vercel o Netlify) para mostrarla.
2. Backend: productos, stock y pedidos en una base de datos, con panel de administración.
3. Pagos con Mercado Pago (Checkout Pro y webhook de confirmación).
4. Envíos con Uber Direct: cotización, creación del envío y webhooks de estado.
5. Dominio propio.
