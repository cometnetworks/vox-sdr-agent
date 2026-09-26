// Crea llaves/fish-audio.txt la primera vez que corre `npm run dev`, para que
// la llave se pegue en un archivo visible y no en un .env oculto.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(process.cwd(), "llaves");
const file = join(dir, "fish-audio.txt");

const template = `# Pega tu llave de Fish Audio despues del signo =, sin espacios ni comillas.
FISH_AUDIO_API_KEY=

# Opcional: ID de una voz en espanol de fish.audio (sale en la URL de la voz).
FISH_AUDIO_VOICE_ID=
`;

if (!existsSync(file)) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(file, template);
  console.log("Listo: se creo llaves/fish-audio.txt. Pega ahi tu llave de Fish Audio.");
}
