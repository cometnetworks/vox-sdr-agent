# Llaves locales

Aquí van tus llaves privadas. **Git ignora todo lo de esta carpeta** (menos este
archivo), así que nada de lo que pegues aquí se sube a GitHub.

`npm run dev` crea solos los archivos que falten. Pega cada llave después del
signo `=`, sin espacios ni comillas, guarda y recarga
http://localhost:3000/jarvis. No hace falta reiniciar.

## openrouter.txt: que Vera piense

Con esta llave Vera responde con inteligencia artificial en vez de frases fijas.

- `OPENROUTER_API_KEY`: tu llave de openrouter.ai (Keys, en tu cuenta).
- `OPENROUTER_MODEL`: `openrouter/free` elige solo un modelo gratuito disponible.
  Si responde lento, pon aquí un modelo gratuito específico de openrouter.ai
  (los gratuitos terminan en `:free`).

## fish-audio.txt: la voz de Vera

- `FISH_AUDIO_API_KEY`: tu llave de fish.audio.
- `FISH_AUDIO_VOICE_ID`: opcional, el ID de una voz en español de fish.audio
  (sale en la URL de la voz).

Si también tienes una llave en `.env.local`, gana la de estos archivos.
