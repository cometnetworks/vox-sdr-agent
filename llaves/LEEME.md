# Llaves locales

Aquí van tus llaves privadas. **Git ignora todo lo de esta carpeta** (menos este
archivo), así que nada de lo que pegues aquí se sube a GitHub.

`npm run dev` crea solos los archivos que falten. Pega cada llave después del
signo `=`, sin espacios ni comillas, guarda y recarga
http://localhost:3000/jarvis. No hace falta reiniciar.

## El cerebro de Vera (elige uno)

Si hay llave de FreeLLMAPI, Vera usa esa. Si no, usa OpenRouter.

### freellmapi.txt (recomendado para voz)

[FreeLLMAPI](https://github.com/tashfeenahmed/freellmapi) corre en tu computadora
y rota entre los planes gratis de varios proveedores rápidos (Groq, Cerebras,
Gemini y otros); si uno se satura, salta al siguiente.

- `FREELLMAPI_API_KEY`: la llave unificada (empieza con `freellmapi-`), en la
  página Keys de su panel.
- `FREELLMAPI_BASE_URL`: con la app de escritorio, `http://127.0.0.1:31415/v1`;
  con Docker, el one-liner o `npm run dev`, `http://127.0.0.1:3001/v1`. Si no
  responde ahí, Vera prueba sola los dos puertos.
- `FREELLMAPI_MODEL`: `auto:fast` prioriza velocidad; `auto:smart`, calidad.

FreeLLMAPI tiene que estar prendido mientras hablas con Vera.

### openrouter.txt

- `OPENROUTER_API_KEY`: tu llave de openrouter.ai (Keys, en tu cuenta).
- `OPENROUTER_MODEL`: `openrouter/free` elige solo un modelo gratuito. Si
  responde lento, pon un modelo gratuito específico (terminan en `:free`).

## fish-audio.txt: la voz de Vera

- `FISH_AUDIO_API_KEY`: tu llave de fish.audio.
- `FISH_AUDIO_VOICE_ID`: opcional, el ID de una voz en español de fish.audio
  (sale en la URL de la voz).

Si también tienes una llave en `.env.local`, gana la de estos archivos.
