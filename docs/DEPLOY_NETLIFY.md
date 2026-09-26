# Publicar el command center de Vera en Netlify

Vera se evalúa en **su propio proyecto de Netlify**, separado del Voxy
Dashboard:

| Proyecto | Qué muestra | Rama |
|---|---|---|
| `vox-sdr-ai` | Voxy Dashboard (no se toca) | `main` |
| proyecto de Vera | Command center de Vera, entra directo a `/jarvis` | `claude/jarvis-command-center-prototype-rq0yva` |

La configuración del build ya está en `netlify.toml`; aquí van las variables y
la verificación.

## Antes de empezar: qué cambia en la nube

- **Contraseña obligatoria.** `src/proxy.ts` protege todo el sitio (páginas y
  APIs) con la contraseña de `VERA_PASSWORD`. Si falta en producción, el
  sitio responde 503 en vez de quedar público. En tu Mac sigue abierto.
- **Vera piensa con OpenRouter, no con FreeLLMAPI.** FreeLLMAPI corre en tu
  Mac (`127.0.0.1`) y un servidor en internet no lo alcanza. No pongas
  variables `FREELLMAPI_*` en Netlify.
- **Las llaves van como variables de entorno.** La carpeta `llaves/` es solo
  local y git la ignora; en Netlify el código lee las mismas llaves del entorno.

## 1. Conectar el proyecto de Vera a GitHub

1. En el proyecto de Vera: **Project configuration → Build & deploy →
   Continuous deployment → Link repository → GitHub** y elige
   `cometnetworks/vox-sdr-agent`.
2. **Production branch:** `claude/jarvis-command-center-prototype-rq0yva`.
   Así cada cambio que se sube a esa rama se publica solo en el proyecto de
   Vera, y `vox-sdr-ai` sigue con `main` sin enterarse.
3. Netlify detecta Next.js y toma `netlify.toml` (build `npm run build`,
   Node 22). No hace falta cambiar nada más.

## 2. Variables de entorno

En **Site configuration → Environment variables**, para todos los contextos:

| Variable | Obligatoria | Para qué |
|---|---|---|
| `VERA_PASSWORD` | Sí | Contraseña del sitio. El usuario puede ser cualquiera. |
| `VERA_STANDALONE` | Sí, `true` | Hace que la entrada `/` abra directo a Vera en vez del dashboard. |
| `OPENROUTER_API_KEY` | Sí | Cerebro de Vera. |
| `OPENROUTER_MODEL` | Recomendada | Un modelo gratuito rápido que no razone (terminan en `:free`). Sin ella usa `openrouter/free`, que elige al azar y a veces toca uno lento. |
| `FISH_AUDIO_API_KEY` | Sí | Voz de Vera. |
| `FISH_AUDIO_VOICE_ID` | Opcional | Voz femenina en español de fish.audio. |

Las del dashboard (`NEXT_PUBLIC_CONVEX_URL`, `ELEVENLABS_*`, `RESEND_*`) no
hacen falta en el proyecto de Vera; siguen en `vox-sdr-ai`.

Después de agregar o cambiar variables, vuelve a desplegar.

## 3. Verificar

1. Abre la URL del sitio: el navegador debe pedir usuario y contraseña, y
   luego llevarte solo a `/jarvis`.
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
  pedazos. La función de Next en `vox-sdr-ai` ya corre en modo `stream`, así
  que se espera lo mismo en el proyecto de Vera; falta verlo en vivo.
- **Tiempo máximo por petición.** Una respuesta tarda de 2 a 3 segundos, muy
  por debajo del límite de las funciones.
