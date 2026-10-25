# Correos de la tienda (Brevo)

Los correos transaccionales salen por la API de Brevo (`src/lib/email/brevo.ts`). Cada envío queda en la tabla `email_log` y en el detalle del pedido del panel (estado, botón **Ver** para la vista previa y **Reenviar**).

| Correo | Para | Cuándo |
|---|---|---|
| Confirmación de compra | Cliente | Wompi aprueba el pago |
| Nueva venta | Panel → Mi cuenta → Avisos de venta, o si está vacío `ADMIN_EMAIL` (admite varios) | Wompi aprueba el pago |
| Tu pedido va en camino | Cliente | Se despacha desde el panel (o "Enviar de nuevo" al corregir la guía) |
| Pago no completado | Cliente | Wompi rechaza el pago |

Plantillas: `src/lib/email/templates.ts` (contenido) y `src/lib/email/layout.ts` (marca, tema claro/oscuro). Las imágenes (`public/email/`) son PNG livianos servidos desde `PUBLIC_SITE_URL`: deben estar publicadas para que se vean.

Si un correo falla, el pago y el despacho no se afectan: queda "Falló" en el panel con el motivo y se puede reenviar.

## Configurar Brevo

1. Crear la cuenta en brevo.com (el plan gratuito permite 300 correos al día).
2. **Remitentes, dominios e IP dedicadas → Dominios → Agregar dominio**: `lusarte.net`. Brevo muestra los registros DNS a copiar en GoDaddy (DNS de `lusarte.net`):
   - `TXT` `brevo-code` (verificación del dominio).
   - `CNAME` `brevo1._domainkey` y `brevo2._domainkey` (DKIM).
   - `TXT` `_dmarc` → `v=DMARC1; p=none; rua=mailto:rua@dmarc.brevo.com` (si ya existe un DMARC, conservar uno solo).
   - Si el dominio tiene SPF propio (correo de GoDaddy, Google Workspace…), agregar `include:spf.brevo.com` al **mismo** registro `TXT v=spf1 …` en lugar de crear otro.
3. Esperar a que Brevo marque el dominio como **Autenticado**.
4. **Remitentes → Agregar remitente**: `pedidos@lusarte.net`, nombre "Lusarte".
5. **SMTP y API → API Keys → Generar**: pegarla en `BREVO_API_KEY` (en GoDaddy, en los Secrets de la app).
6. Llenar `ADMIN_EMAIL` con el correo de la clienta (o, más fácil, ponerlo en Panel → Mi cuenta → Avisos de venta: lo del panel tiene prioridad sobre `ADMIN_EMAIL`) y, si se quiere recibir las respuestas de los clientes en otro buzón, `EMAIL_REPLY_TO`.
7. Probar: con un pedido de prueba pagado, revisar en Gmail y Outlook que llegue a la bandeja principal ("Mostrar original" en Gmail debe decir `SPF: PASS`, `DKIM: PASS`, `DMARC: PASS`).

## Para no caer en spam

- Dominio autenticado (paso 2): es lo que más pesa.
- Remitente fijo y real (`pedidos@lusarte.net`) con respuestas a un buzón que alguien lea.
- Correos con mucho texto real y pocas imágenes livianas con `alt`; versión de texto plano en cada envío.
- Enlaces solo a `lusarte.net`, WhatsApp e Instagram; nada de acortadores.
- Asuntos simples y descriptivos ("Recibimos tu pedido LUS-000123"), sin mayúsculas sostenidas ni signos de más.
- Solo correos transaccionales: nada de promociones desde esta cuenta.

## Tema claro y oscuro

- `color-scheme: light dark` + `@media (prefers-color-scheme: dark)`: Apple Mail, iOS Mail, Outlook para Mac/iOS/Android y Samsung Mail aplican la paleta oscura de la marca (fondo noche, tarjeta carbón, texto crema) y cambian el logo por su versión clara.
- Outlook.com usa los selectores `[data-ogsc]`/`[data-ogsb]`.
- Gmail ignora estos estilos e invierte los colores por su cuenta. La paleta se eligió para que siga siendo legible invertida, y el sticker de la vela tiene contorno blanco, así que se ve en los dos temas.
