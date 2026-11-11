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
- `api/quote.ts`: función del servidor (Vercel) que cotiza el envío por distancia.
- `api/checkout.ts`, `api/order.ts`, `api/mp-webhook.ts`: pago con Mercado Pago (crear el pago, confirmar el estado al volver y recibir avisos).
- `api/admin-orders.ts`, `api/admin-products.ts`, `api/admin-upload.ts`, `src/components/AdminPanel.tsx` y `AdminProducts.tsx`: panel del local en `/admin` (pedidos y productos).
- `api/products.ts` y `src/context/CatalogContext.tsx`: catálogo que ve la tienda.
- `api/_lib/`: código compartido: mapa y envíos, Mercado Pago, mails y la base de datos (no se publica como ruta).
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
4. Envíos: precio por distancia real, despacho manual por Uber Envíos.
5. Dominio propio.

## Envíos

El envío se cobra según la distancia real entre el local y la dirección del cliente.
`api/quote.ts` ubica la dirección en el mapa (primero con Georef, el servicio de direcciones del Estado, y si no la encuentra con OpenStreetMap),
mide la distancia y aplica la tarifa. Si no encuentra la calle, calcula desde el centro del departamento.
El pedido se despacha a mano desde la app de Uber (opción Envíos) u otro cadete.

Todo se ajusta en `src/data/store.ts`:

- `location`: coordenadas del local, copiadas de Google Maps (clic derecho sobre el local). Si está vacía, se busca por `address`.
- `shipping`: precio base y por km para moto y auto, y la distancia máxima. Para calibrarlo, simulá envíos en la app de Uber a 2 o 3 distancias.

## Pagos con Mercado Pago

El botón de pago crea el cobro en el servidor (`api/checkout.ts`) con la API de Orders de Mercado Pago
y lleva al cliente al checkout de Mercado Pago, donde puede pagar con tarjeta de débito, crédito o dinero en cuenta.
Los precios y el envío se recalculan en el servidor, así que no se pueden alterar desde el navegador.
Al volver, la tienda confirma el estado del pago con Mercado Pago antes de mostrar el pedido.
Mientras no haya credenciales, el pago se simula (solo en `npm run dev`).

1. Entrar a [Tus integraciones](https://www.mercadopago.com.ar/developers/panel/app) y crear una aplicación de tipo
   **Pagos online** > **Checkout Pro**, eligiendo **API de Orders**.
2. Copiar el **Access Token** como `MP_ACCESS_TOKEN` (en `.env.local` y en Vercel).
   La API de Orders no acepta los tokens que empiezan con `TEST-`: para probar, hay que crear
   **cuentas de prueba** (una vendedora y una compradora), entrar con la vendedora y usar sus credenciales de producción (`APP_USR-...`).
   Después se paga con la cuenta compradora, en una ventana de incógnito.
3. En **Webhooks** > **Configurar notificaciones**, poner la URL `https://<tu tienda>/api/mp-webhook`,
   marcar el evento **Order (Mercado Pago)** y guardar. Copiar la clave secreta como `MP_WEBHOOK_SECRET` (opcional, recomendado).

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

**Productos de otra tienda (a comisión):** en `/admin` > Productos, cada producto tiene un campo de proveedor
(nombre y mail). Cuando se paga una venta con ese producto, al proveedor le llega un mail con lo que se vendió
de lo suyo, sin los datos del cliente; si responde, la respuesta le llega al local. Para que Resend pueda mandarle
a un mail que no es el de la cuenta, hace falta el dominio verificado y `MAIL_FROM` (paso 3).

Sin esas variables no se manda nada y la tienda funciona igual.

## Botón de arrepentimiento

Es obligatorio para tiendas online en Argentina (Resolución 424/2020). Está en el pie de la tienda: el
cliente completa el formulario y recibe en el momento un código de revocación. El pedido queda en
`/admin` > Pedidos ("Pedidos de arrepentimiento") y, si el mail está configurado, le llega un aviso al local.
