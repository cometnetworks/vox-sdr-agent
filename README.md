# Vox SDR IA Agent

Dashboard y backend cloud-first para el ejecutivo SDR IA de Vox Media Agency.

## Objetivo

El agente corre en la nube, procesa prospectos, genera research, detecta triggers, prioriza cuentas, redacta mensajes estilo Vox, entrega reporte diario por Telegram y registra todo en una UI operativa.

## Stack

- Next.js + TypeScript para dashboard.
- Convex para base de datos, jobs, webhooks y estado.
- OpenAI para research, scoring, insights, outreach y reportes.
- Resend para envio de emails con `replyTo` a Miguel.
- Telegram Bot para reportes y aprobaciones.
- ElevenLabs Agents + Twilio para voz, solo despues de pruebas internas.

## Comandos

```bash
npm run dev
npm run build
npm run lint
```

## Setup Local

1. Copia `.env.example` a `.env.local`.
2. Configura las llaves necesarias.
3. Ejecuta `npm run dev`.
4. Abre `http://localhost:3000`.

## Convex

Proyecto cloud creado:

- Team: `zcodex`
- Project: `vox-sdr-agent`
- Dashboard: `https://dashboard.convex.dev/t/zcodex/vox-sdr-agent`
- Dev deployment: `brainy-eagle-455`

Variables locales guardadas en `.env.local` por el CLI:

- `CONVEX_DEPLOYMENT`
- `NEXT_PUBLIC_CONVEX_URL`
- `NEXT_PUBLIC_CONVEX_SITE_URL`

Para empujar cambios y regenerar tipos:

```bash
npx convex dev
```

Eso mantiene sincronizadas las functions, schema y webhooks.

## Primer Piloto

La base inicial usa estas columnas:

```csv
Nombre,Email,Empresa,Cargo,Celular,Linkedin
```

Archivo template:

`src/data/prospects-template.csv`

## Regla De Voz

No se hacen llamadas reales a prospectos hasta validar internamente:

- Twilio trial.
- Celular de Miguel verificado.
- ElevenLabs Agent conectado.
- Llamada interna exitosa.
- Transcripcion y resumen.
- Registro en Convex.
- Alerta en Telegram.
- Aprobacion manual.

## GitHub

Este folder ya tiene un repo Git local. Nombre recomendado para remoto:

`vox-sdr-agent`
