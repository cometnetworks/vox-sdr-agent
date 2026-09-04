import type { Metadata } from "next";

import { CommandCenter } from "@/components/jarvis/CommandCenter";
import "./hud.css";

export const metadata: Metadata = {
  title: "J.A.V.I.E.R. · Command Center",
  description:
    "Prototipo de interfaz tipo Jarvis para hablar con el ejecutivo SDR IA de Vox Media Agency.",
};

export default function JarvisPage() {
  return <CommandCenter />;
}
