# Publicar el command center de Vera en Netlify

Guía para subir la app (dashboard + `/jarvis`) a Netlify. La configuración del
build ya está en `netlify.toml`; aquí van las variables y la verificación.

## Antes de empezar: qué cambia en la nube

- **Contraseña obligatoria.** `src/proxy.ts` protege todo el sitio (páginas y
  APIs) con la contraseña de `VERA_PASSWORD`. Si falta en producción, el
  sitio responde 503 en vez de quedar público. En tu Mac sigue abierto.
- **Vera piensa con OpenRouter, no con FreeLLMAPI.** FreeLLMAPI corre en tu
  Mac (`127.0.0.1`) y un servidor en internet no lo alcanza. No pongas
  variables `FREELLMAPI_*` en Netlify.
- **Las llaves van como variables de entorno.** La carpeta `llaves/` es solo
  local y git la ignora; en Netlify el código lee las mismas llaves del entorno.

## 1. Crear el sitio

1. En Netlify: **Add new site → Import an existing project → GitHub** y elige
   `cometnetworks/vox-sdr-agent`.
2. Rama: mientras el PR #1 no se una a `main`, usa
   `claude/jarvis-command-center-prototype-rq0yva` (o despliega `main` después
   de unir el PR).
3. Netlify detecta Next.js y toma `netlify.toml` (build `npm run build`,
   Node 22). No hace falta cambiar nada más.

## 2. Variables de entorno

En **Site configuration → Environment variables**, para todos los contextos:

| Variable | Obligatoria | Para qué |
|---|---|---|
| `VERA_PASSWORD` | Sí | Contraseña del sitio. El usuario puede ser cualquiera. |
| `OPENROUTER_API_KEY` | Sí | Cerebro de Vera. |
| `OPENROUTER_MODEL` | Recomendada | Un modelo gratuito rápido que no razone (terminan en `:free`). Sin ella usa `openrouter/free`, que elige al azar y a veces toca uno lento. |
| `FISH_AUDIO_API_KEY` | Sí | Voz de Vera. |
| `FISH_AUDIO_VOICE_ID` | Opcional | Voz femenina en español de fish.audio. |

Para el dashboard principal, las del plan del proyecto
(`docs/START_HERE_2026-05-17.md`): `NEXT_PUBLIC_CONVEX_URL`,
`NEXT_PUBLIC_CONVEX_SITE_URL`, `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID`,
`RESEND_API_KEY`, `RESEND_FROM`, `RESEND_REPLY_TO`.

Después de agregar o cambiar variables, vuelve a desplegar.

## 3. Verificar

1. Abre la URL del sitio: el navegador debe pedir usuario y contraseña.
2. `https://TU-SITIO/api/vera/chat` debe decir
   `"available":true,"provider":"OpenRouter"`.
3. `https://TU-SITIO/api/voice/tts` debe decir `"available":true`.
4. En `https://TU-SITIO/jarvis` la consola debe decir
   `fish.audio · openrouter`. Pulsa **HABLAR** (Chrome pide el micrófono; en
   HTTPS funciona) o escribe una orden.

## Pendiente de confirmar en Netlify

Probado en local con la misma configuración (solo variables de entorno,
contraseña activa, OpenRouter y Fish simulados). En Netlify falta confirmar:

- **Streaming.** Vera empieza a hablar antes porque la respuesta llega en
  pedazos. Si el runtime de Netlify entregara la respuesta completa de golpe,
  funciona igual pero tarda más en arrancar.
- **Tiempo máximo por petición.** Una respuesta tarda de 2 a 3 segundos, muy
  por debajo del límite de las funciones.
