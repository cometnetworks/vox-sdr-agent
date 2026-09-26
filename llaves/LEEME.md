# Llaves locales

Aquí van tus llaves privadas. **Git ignora todo lo de esta carpeta** (menos este
archivo), así que nada de lo que pegues aquí se sube a GitHub.

## Fish Audio (voz natural de Vera)

1. Corre `npm run dev` una vez: se crea solo el archivo `fish-audio.txt` aquí.
2. Ábrelo con TextEdit y pega tu llave después de `FISH_AUDIO_API_KEY=`,
   sin espacios ni comillas.
3. Opcional: pega el ID de una voz en español de fish.audio después de
   `FISH_AUDIO_VOICE_ID=` (el ID sale en la URL de la voz).
4. Guarda y recarga http://localhost:3000/jarvis. No hace falta reiniciar.

Si también tienes la llave en `.env.local`, gana la de este archivo.
