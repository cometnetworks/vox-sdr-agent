# Implementation Notes

## Estructura

Esta app vive dentro de `vox-sdr-agent/` para separar el SDR IA del rediseño publico de Vox.

La web actual puede quedarse en la raiz mientras se valida el agente. Cuando iniciemos el rediseño final, conviene mover la web publica a `vox-website/` o convertir todo en un monorepo:

- `vox-sdr-agent/` para dashboard interno y agente.
- `vox-website/` para la nueva web publica.
- `shared/` para copy, componentes o assets reutilizables si hace falta.

## Regla De Seguridad De Voz

No se permite llamada real a prospectos hasta pasar estas pruebas:

1. Twilio trial configurado.
2. Celular de Miguel verificado.
3. ElevenLabs Agent conectado.
4. Llamada interna exitosa.
5. Variables dinamicas correctas.
6. Transcripcion disponible.
7. Resumen guardado.
8. Evento registrado en Convex.
9. Alerta enviada por Telegram.
10. Aprobacion manual habilitada.

## GitHub

Este folder ya tiene un repo Git local creado por `create-next-app`.

Como `gh` no esta instalado en esta maquina, hay tres opciones:

1. Crear el repo en GitHub manualmente y conectar el remote.
2. Instalar/configurar GitHub CLI.
3. Usar el conector de GitHub de Codex si se habilita para crear el repo remoto.

Nombre recomendado del repo: `vox-sdr-agent`.

