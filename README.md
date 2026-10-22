# LIBRE Salud Deportiva (demo)

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

## Estilos

Los estilos usan [Tailwind CSS](https://tailwindcss.com) (v4, plugin de Vite). Casi todo se escribe con clases en el JSX.

- Los colores de la marca están como variables al principio de `src/index.css`, con su versión para modo oscuro. `@theme` los expone como clases: `bg-surface`, `text-muted`, `border-line`, `bg-accent`, etc. Para cambiar la paleta, tocá solo esas variables.
- Las piezas que se repiten (`btn-primary`, `btn-ghost`, `chip`, `panel`, `price`, `hint`, `eyebrow`…) están definidas una sola vez en `@layer components`, en el mismo archivo.

## Estructura

- `src/data/products.ts`: tipos de producto y catálogo inicial. Con base de datos, el catálogo se edita en `/admin`.
- `src/lib/shipping.ts`: pide la cotización a `/api/quote`. Si no hay credenciales, usa una simulada por distancia.
- `api/quote.ts`: función del servidor (Vercel) que cotiza con Uber Direct.
- `api/checkout.ts`, `api/order.ts`, `api/mp-webhook.ts`: pago con Mercado Pago (crear el pago, confirmar el estado al volver y recibir avisos).
- `api/admin-orders.ts`, `api/admin-products.ts`, `api/admin-upload.ts`, `src/components/AdminPanel.tsx` y `AdminProducts.tsx`: panel del local en `/admin` (pedidos y productos).
- `api/products.ts` y `src/context/CatalogContext.tsx`: catálogo que ve la tienda.
- `api/_lib/`: código compartido de Uber, Mercado Pago y la base de datos (no se publica como ruta).
- `src/context/CartContext.tsx`: carrito, guardado en el navegador.
- `src/components/`: header, tarjetas, detalle de producto, carrito, checkout y seguimiento.

## Campos de un producto

Se cargan en `/admin` > Productos (o en `src/data/products.ts` para el catálogo inicial). Además de nombre, precio y stock:

- `indication`: para qué sirve, en palabras del paciente. El buscador también busca acá.
- `detail`: material, medidas o presentación.
- `sizes`: talles disponibles. Si tiene, hay que elegir uno antes de agregarlo al carrito.
- `madeToMeasure`: se fabrica a medida. Se muestra "desde" en el precio y, después de la compra, el aviso de que se coordina la toma de molde.
- `bulky`: no entra en una moto (silla de ruedas, andador). El envío se cotiza en auto.
- `kind`: qué ilustración usar mientras no haya fotos (solo los productos de ejemplo; los nuevos muestran el ícono de la marca).

## Fotos y videos de un producto

Las fotos se suben desde `/admin` > Productos > Editar. El panel las achica a 1600 px y las guarda
en Vercel Blob. Para eso hay que crear un Blob store **público** en Vercel (**Storage > Create > Blob**)
y conectarlo al proyecto: eso carga `BLOB_READ_WRITE_TOKEN`.

En el catálogo inicial, cada producto puede tener una lista `media` en `src/data/products.ts`. Si tiene
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
2. ~~Backend: productos, stock y pedidos en una base de datos, con panel de administración.~~ Hecho.
3. Pagos con Mercado Pago (Checkout Pro y webhook de confirmación).
4. Envíos con Uber Direct: cotización, creación del envío y webhooks de estado.
5. Dominio propio.

## Envíos con Uber Direct

La cotización real la hace `api/quote.ts`, que corre en el servidor para no exponer las credenciales.
Mientras no estén cargadas, la tienda sigue mostrando el precio simulado.

1. Crear la cuenta de empresa en [direct.uber.com](https://direct.uber.com) y entrar a la pestaña **Developer**.
   Ahí están el Customer ID, el Client ID y el Client Secret. Con la barra azul arriba está en modo prueba (no crea envíos reales).
2. En Vercel: **Settings > Environment Variables**, cargar `UBER_CLIENT_ID`, `UBER_CLIENT_SECRET` y `UBER_CUSTOMER_ID`
   (y opcionalmente `STORE_STREET`, `STORE_CITY`, `STORE_ZIP` con la dirección del local). Después, volver a desplegar.
3. En local: copiar `.env.example` como `.env.local`, completarlo y correr `npm run dev`.

## Pagos con Mercado Pago

El botón de pago crea el cobro en el servidor (`api/checkout.ts`) y lleva al cliente al checkout de Mercado Pago.
Los precios y el envío se recalculan en el servidor, así que no se pueden alterar desde el navegador.
Al volver, la tienda confirma el estado del pago con Mercado Pago antes de mostrar el pedido.
Mientras no haya credenciales, el pago se simula.

1. Entrar a [Tus integraciones](https://www.mercadopago.com.ar/developers/panel/app) y crear una aplicación (tipo Checkout Pro).
2. Copiar el **Access Token** de las credenciales de prueba como `MP_ACCESS_TOKEN` (en `.env.local` y en Vercel).
3. Para probar, pagar con la cuenta de prueba **Comprador** que aparece en la aplicación, en una ventana de incógnito.
4. Opcional: en **Webhooks**, copiar la clave secreta como `MP_WEBHOOK_SECRET`.

En local (`http://localhost`) Mercado Pago no vuelve solo a la tienda ni manda avisos: hay que tocar "Volver al sitio".
En Vercel funciona completo.

## Pedidos y panel del local

Cada compra se guarda en una base de datos Postgres (Neon), primero como "Esperando pago". Cuando
Mercado Pago aprueba el pago, pasa sola a "Pagado, para preparar". El local ve los pedidos en
`/admin`, con la contraseña de `ADMIN_PASSWORD`, y les va cambiando el estado: preparado, enviado,
entregado o cancelado. Las tablas se crean solas la primera vez.

En la pestaña **Productos** el local agrega, edita, ordena, oculta o borra productos, con fotos, talles
y stock. La primera vez se copia el catálogo de `src/data/products.ts` para no arrancar vacío. Cuando un
pago queda aprobado se descuenta el stock de lo vendido (los productos a medida no usan stock). Un
producto sin stock se ve como "Sin stock" y no se puede comprar. Si se cancela un pedido pagado, el stock
no vuelve solo: hay que corregirlo a mano en el producto.

1. En Vercel: **Storage > Create Database > Neon** y conectarla al proyecto. Eso carga `DATABASE_URL`.
2. Cargar `ADMIN_PASSWORD` en las variables de entorno y volver a desplegar.
3. Para usar la misma base en local, copiar `DATABASE_URL` en `.env.local`.

Sin base de datos la tienda usa el catálogo de `src/data/products.ts` y sigue cobrando, pero los
pedidos solo quedan en Mercado Pago.

## Datos del local

Nombre, dirección, horario y WhatsApp del local están en `src/data/store.ts`. Si `whatsapp` tiene un número
(con código de país, por ejemplo `5492615550123`), aparece el botón "Escribinos por WhatsApp" en la
confirmación del pedido y un link en el pie.

## Aviso de ventas por mail

Cuando un pago queda aprobado, le llega un mail al local con el pedido: cliente, teléfono, entrega,
productos y total. Usa [Resend](https://resend.com), que tiene un plan gratis de 3.000 mails por mes.

1. Crear una cuenta en Resend con el mail del local y generar una API Key.
2. En Vercel, cargar `RESEND_API_KEY` y `NOTIFY_EMAIL` (el mail de esa cuenta) y volver a desplegar.
3. Con dominio propio: verificarlo en Resend y cargar `MAIL_FROM`, así se puede mandar a cualquier mail.

Sin esas variables no se manda nada y la tienda funciona igual.

## Botón de arrepentimiento

Es obligatorio para tiendas online en Argentina (Resolución 424/2020). Está en el pie de la tienda: el
cliente completa el formulario y recibe en el momento un código de revocación. El pedido queda en
`/admin` > Pedidos ("Pedidos de arrepentimiento") y, si el mail está configurado, le llega un aviso al local.
