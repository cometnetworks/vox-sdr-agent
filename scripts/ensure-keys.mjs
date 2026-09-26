// Crea los archivos de llaves la primera vez que corre `npm run dev`, para que
// las llaves se peguen en archivos visibles y no en un .env oculto.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(process.cwd(), "llaves");

const files = {
  "fish-audio.txt": `# Pega tu llave de Fish Audio despues del signo =, sin espacios ni comillas.
FISH_AUDIO_API_KEY=

# Opcional: ID de una voz en espanol de fish.audio (sale en la URL de la voz).
FISH_AUDIO_VOICE_ID=
`,
  "openrouter.txt": `# Pega tu llave de OpenRouter despues del signo =, sin espacios ni comillas.
# Con esta llave Vera piensa sus respuestas en vez de usar frases fijas.
OPENROUTER_API_KEY=

# Opcional: modelo a usar. openrouter/free elige solo uno gratuito disponible.
OPENROUTER_MODEL=openrouter/free
`,
};

mkdirSync(dir, { recursive: true });

for (const [name, template] of Object.entries(files)) {
  const file = join(dir, name);

  if (!existsSync(file)) {
    writeFileSync(file, template);
    console.log(`Listo: se creo llaves/${name}. Pega ahi tu llave.`);
  }
}
