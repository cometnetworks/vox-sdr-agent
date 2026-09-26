import type { NextRequest } from "next/server";

/**
 * Contrasena de acceso para todo el sitio (paginas y APIs) cuando esta en
 * internet: sin ella, cualquiera con la liga gastaria las cuotas de Fish y de
 * la IA, y veria los datos del pipeline.
 *
 * - VERA_PASSWORD definida: el navegador la pide una vez (usuario libre).
 * - Sin VERA_PASSWORD en tu computadora: abierto, como siempre.
 * - Sin VERA_PASSWORD en produccion fuera de localhost: bloqueado, para que un
 *   olvido no deje el sitio publico.
 */
export function proxy(request: NextRequest) {
  const password = process.env.VERA_PASSWORD;

  if (!password) {
    if (process.env.NODE_ENV !== "production" || isLocalRequest(request)) {
      return;
    }

    return new Response(
      "Este command center necesita contrasena. Configura VERA_PASSWORD en las variables de entorno del sitio y vuelve a desplegar.",
      { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }

  if (safeEqual(readPassword(request), password)) {
    return;
  }

  return new Response("Acceso restringido al command center de Vox.", {
    status: 401,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "WWW-Authenticate": 'Basic realm="Vox command center", charset="UTF-8"',
    },
  });
}

export const config = {
  // Todo menos los archivos estaticos que Next sirve sin datos del negocio.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

const LOCAL_HOSTS = ["localhost", "127.0.0.1", "::1", "[::1]"];

/**
 * Se decide con los encabezados de la peticion, no con request.nextUrl: Next
 * arma nextUrl con la direccion interna del servidor, que puede decir
 * "localhost" aunque el visitante venga de internet. Si hay proxy delante,
 * tambien x-forwarded-host tiene que ser local.
 */
function isLocalRequest(request: NextRequest) {
  const hosts = [request.headers.get("host"), request.headers.get("x-forwarded-host")]
    .filter((value): value is string => Boolean(value))
    .map((value) => hostnameOf(value.split(",")[0].trim()));

  return hosts.length > 0 && hosts.every((host) => LOCAL_HOSTS.includes(host));
}

function hostnameOf(host: string) {
  // "[::1]:3000" -> "[::1]"; "localhost:3000" -> "localhost"
  return host.startsWith("[") ? host.slice(0, host.indexOf("]") + 1) : host.split(":")[0].toLowerCase();
}

function readPassword(request: NextRequest) {
  const header = request.headers.get("authorization") ?? "";

  if (!header.startsWith("Basic ")) {
    return "";
  }

  try {
    const bytes = Uint8Array.from(atob(header.slice(6)), (char) => char.charCodeAt(0));
    const credentials = new TextDecoder().decode(bytes);
    return credentials.slice(credentials.indexOf(":") + 1);
  } catch {
    return "";
  }
}

/** Compara sin cortar en el primer caracter distinto, para no filtrar pistas por tiempo. */
function safeEqual(given: string, expected: string) {
  let mismatch = given.length === expected.length ? 0 : 1;

  for (let index = 0; index < expected.length; index += 1) {
    mismatch |= (given.charCodeAt(index) || 0) ^ expected.charCodeAt(index);
  }

  return mismatch === 0;
}
