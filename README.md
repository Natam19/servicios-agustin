# Servicios de IA y Automatización — Agustin Peralta

Página de servicios con el mismo diseño del portafolio de Agustín (agustin.agustinynatalia.site): Cormorant Garamond, Montserrat y Great Vibes, fondo crema / modo oscuro y acento #ff5c35.

Secciones: servicios, cómo trabajo, resultados, preguntas frecuentes y un diagnóstico de 6 pasos para clientes.

Sitio estático: `index.html`, `styles.css`, `main.js` y `fonts/`. Para verlo en local: `python3 -m http.server` y abrir http://localhost:8000.

## Diagnóstico

Las respuestas se envían por POST (JSON) a la URL que se ponga en `WEBHOOK_DIAGNOSTICO` dentro de `main.js`. Mientras esté vacía, el formulario solo muestra el mensaje de gracias.

Campos: enviado, negocio, actividad, conversaciones, canales, herramientas, otras, facturacion, tarea, urgencia, nombre, whatsapp, correo, autorizo.
