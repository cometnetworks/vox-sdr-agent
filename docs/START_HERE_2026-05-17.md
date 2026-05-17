# Vox SDR Agent - Status y Plan de Arranque

Fecha: 2026-05-17

## Status Actual

El proyecto ya tiene una base funcional solida:

- Repo en GitHub: `cometnetworks/vox-sdr-agent`
- Dashboard Next.js funcionando en `localhost:3000`
- Convex activo como backend y memoria operativa
- Telegram conectado con bot `Kodyx`, identidad conversacional `Javier Reus`
- ElevenLabs conectado con Javier para voz interna en dashboard
- WebSocket agregado como modo estable para pruebas de voz
- WebRTC disponible, pero por ahora menos estable
- Memoria compartida inicial: Telegram registra actividad y dashboard manda contexto a Javier
- Scoring inicial ya proceso parte de la base
- Resend considerado para envio de emails, pendiente de flujo real de aprobacion/envio
- Twilio pendiente para llamadas reales outbound
- CSV real de prospectos permanece local y no se subio al repo

## Decision Actual

Por ahora seguimos con:

- ElevenLabs para voz/agente conversacional
- Twilio para llamadas de salida
- Convex como memoria, base de prospectos y registro operativo
- Telegram como canal principal de control rapido
- Dashboard como command center
- Slack como canal proximo de visibilidad y reportes
- Resend primero para emails; AgentMail queda como alternativa si necesitamos inbox/agente mas avanzado

## Que Falta Construir

### 1. Dashboard Productivo

- Subir a Netlify
- Configurar variables de entorno
- Validar dashboard cloud contra Convex
- Agregar vista real de prospectos, no solo cards estaticas

### 2. Carga y Gestion de Prospectos

- Upload CSV desde dashboard
- Formulario para agregar prospecto manual
- Actualizar prospecto existente por email o celular
- Campos minimos:
  - nombre
  - empresa
  - cargo
  - email
  - celular
  - LinkedIn
- Estados sugeridos:
  - nuevo
  - investigado
  - scored
  - listo para outreach
  - llamado
  - descartado

### 3. Research y Triggers

- Accion: `Actualizar triggers`
- Crear background de empresa
- Guardar:
  - contexto de empresa
  - pain points
  - hipotesis comercial
  - angulo Vox
  - fuentes
- Usar esa informacion para alimentar:
  - emails
  - Telegram
  - llamadas
  - dashboard

### 4. Emails

- Flujo inicial con Resend
- Draft automatico por prospecto
- Aprobacion desde dashboard o Telegram
- Envio real solo con aprobacion
- Respuestas hacia `miguel@voxmedia.com.mx`
- Guardar `resendEmailId`
- Registrar actividad en Convex
- Notificar resultado por Telegram

### 5. Llamadas Outbound

- Mantener ElevenLabs + Twilio
- Twilio sera el telefono
- ElevenLabs sera voz/agente
- Antes de llamar:
  - validar prospecto
  - validar numero
  - definir objetivo de llamada
  - cargar contexto
  - pedir aprobacion explicita
- Despues de llamada:
  - transcript
  - resumen
  - outcome
  - siguiente paso
  - registro en Convex

### 6. Slack

- Agregar Slack como canal de visibilidad
- Fase 1:
  - reportes
  - alertas
  - cuentas Hot
- Fase 2:
  - comandos tipo `ver hot`
  - aprobar email
  - pausar llamadas
- Telegram sigue como canal principal de control rapido

## Plan Para Arrancar Manana

### Bloque 1: Deploy a Netlify

1. Conectar repo GitHub a Netlify
2. Configurar variables:
   - `NEXT_PUBLIC_CONVEX_URL`
   - `NEXT_PUBLIC_CONVEX_SITE_URL`
   - `ELEVENLABS_API_KEY`
   - `ELEVENLABS_AGENT_ID`
   - `RESEND_API_KEY`
   - `RESEND_FROM`
   - `RESEND_REPLY_TO`
3. Deploy preview
4. Validar:
   - dashboard carga
   - `/api/elevenlabs/signed-url`
   - `/api/agent/context`
   - Javier puede hablar desde Netlify

### Bloque 2: Testing Completo

1. Telegram:
   - `/start`
   - `/reporte`
   - `/hot`
   - pregunta libre: `como te llamas`
   - memoria: mandar algo por Telegram y preguntarlo en dashboard
2. Dashboard:
   - iniciar voz con Javier
   - validar memoria sincronizada
   - validar que no use tono outbound con Miguel
3. Convex:
   - revisar actividades
   - confirmar inbound/outbound Telegram guardados
4. ElevenLabs:
   - probar nueva voz elegida
   - ajustar prompt sin tocar logica

### Bloque 3: Prospectos

1. Crear modulo de upload CSV en dashboard
2. Crear tabla real de prospectos
3. Agregar accion `Actualizar triggers`
4. Guardar background de empresa e insight comercial
5. Mostrar score, tier, canal recomendado y siguiente paso

### Bloque 4: Outreach

1. Crear draft email desde prospecto
2. Boton `Aprobar envio`
3. Enviar con Resend
4. Guardar `resendEmailId`
5. Registrar actividad en Convex
6. Notificar por Telegram

### Bloque 5: Llamadas

1. Definir flujo Twilio + ElevenLabs
2. Crear estado `call_ready`
3. Boton/comando: `preparar llamada`
4. Confirmacion obligatoria antes de llamada real
5. Guardar resultado y transcript

## Prioridad Real

No intentar construir todo en una sola sesion.

Orden recomendado:

1. Netlify deploy
2. Testing dashboard + Telegram + memoria
3. Upload/gestion de prospectos
4. Research/triggers
5. Email con aprobacion
6. Twilio outbound

## Principio del Proyecto

La meta no es tener solo una voz.

La meta es que Javier sea un ejecutivo comercial IA con:

- memoria compartida
- contexto de prospectos
- criterio comercial
- acciones controladas
- aprobacion humana antes de emails o llamadas reales

Ya existe la base. El siguiente paso es cerrar el flujo operativo completo.
