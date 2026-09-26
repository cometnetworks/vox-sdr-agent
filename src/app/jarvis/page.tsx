import type { Metadata } from "next";

import { CommandCenter } from "@/components/jarvis/CommandCenter";
import "./hud.css";

export const metadata: Metadata = {
  title: "V.E.R.A. · Command Center",
  description:
    "Prototipo de interfaz tipo Jarvis para hablar con Vera, la ejecutiva SDR IA de Vox Media Agency.",
};

export default function JarvisPage() {
  return <CommandCenter />;
}
