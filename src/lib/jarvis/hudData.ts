export type Trend = "up" | "down" | "flat";

export type Vital = {
  id: string;
  label: string;
  value: string;
  delta: string;
  trend: Trend;
  series: number[];
};

export type Directive = {
  id: string;
  text: string;
  eta: string;
  /** Como lo dice Vera en voz alta: sin anglicismos ni abreviaturas. */
  spoken: string;
};

export type TrailEvent = {
  id: string;
  label: string;
  detail: string;
  time: string;
  /** Hora y evento como se dicen en voz alta. */
  spoken: string;
};

export type HudCard = {
  id: string;
  title: string;
  subtitle: string;
  anchor: "top-left" | "top-right" | "bottom-right";
};

export const hudIdentity = {
  code: "V.E.R.A.",
  name: "Vera",
  expansion: "Voz Ejecutiva de Relaciones y Agenda",
  operator: "Miguel Cedillo",
  org: "Vox Media Agency",
};

export const statusChips = [
  { id: "core", label: "CORE", value: "ONLINE" },
  { id: "link", label: "LINK", value: "CONVEX" },
  { id: "voice", label: "VOZ", value: "LIBRE" },
];

export const vitals: Vital[] = [
  {
    id: "prospects",
    label: "PROSPECTOS ACTIVOS",
    value: "1,240",
    delta: "+180 /sem",
    trend: "up",
    series: [820, 870, 905, 940, 1010, 1060, 1120, 1180, 1240],
  },
  {
    id: "outreach",
    label: "MENSAJES ENVIADOS",
    value: "320",
    delta: "+45 /sem",
    trend: "up",
    series: [140, 165, 190, 205, 240, 255, 280, 300, 320],
  },
  {
    id: "reply",
    label: "TASA DE RESPUESTA",
    value: "11.4%",
    delta: "estable",
    trend: "flat",
    series: [9.8, 10.4, 11.1, 10.9, 11.6, 11.2, 11.5, 11.3, 11.4],
  },
  {
    id: "meetings",
    label: "REUNIONES AGENDADAS",
    value: "38",
    delta: "+6 /sem",
    trend: "up",
    series: [12, 15, 18, 21, 25, 28, 31, 35, 38],
  },
];

export const directives: Directive[] = [
  {
    id: "d1",
    text: "Cerrar y enviar los 5 drafts en revision desde Telegram",
    eta: "2h",
    spoken: "enviar los cinco borradores que están en revisión en Telegram, en dos horas",
  },
  {
    id: "d2",
    text: "Validar la prueba interna de voz antes de habilitar Twilio",
    eta: "4h",
    spoken: "validar la prueba interna de voz antes de activar Twilio, en cuatro horas",
  },
  {
    id: "d3",
    text: "Resembrar la base con 40 prospectos nuevos del ICP consultoria",
    eta: "6h",
    spoken: "sumar cuarenta prospectos nuevos del perfil de consultoría, en seis horas",
  },
];

export const trail: TrailEvent[] = [
  {
    id: "t1",
    label: "Research Agent",
    detail: "contexto de 10 cuentas",
    time: "07:08",
    spoken: "a las siete y ocho investigué diez cuentas",
  },
  {
    id: "t2",
    label: "Scoring Agent",
    detail: "Hot 3 · Warm 4 · Cold 3",
    time: "07:18",
    spoken: "a las siete dieciocho las califiqué: tres calientes, cuatro tibias y tres frías",
  },
  {
    id: "t3",
    label: "Outreach Agent",
    detail: "5 drafts estilo Vox",
    time: "07:32",
    spoken: "a las siete treinta y dos redacté cinco borradores con el estilo de Vox",
  },
  {
    id: "t4",
    label: "Reporte Telegram",
    detail: "entregado a Miguel",
    time: "08:00",
    spoken: "a las ocho te mandé el reporte por Telegram",
  },
  {
    id: "t5",
    label: "Voz interna",
    detail: "prueba sin Twilio",
    time: "09:15",
    spoken: "y a las nueve y cuarto hicimos la prueba interna de voz",
  },
];

export const hudCards: HudCard[] = [
  {
    id: "c1",
    title: "REPORTE MATUTINO",
    subtitle: "2026-09-04-reporte.md",
    anchor: "top-left",
  },
  {
    id: "c2",
    title: "ULTIMO DEPLOY",
    subtitle: "brainy-eagle-455",
    anchor: "top-right",
  },
  {
    id: "c3",
    title: "FUENTE",
    subtitle: "voxmedia.com.mx",
    anchor: "bottom-right",
  },
];

export const primaryDirective = {
  label: "DIRECTIVA PRIMARIA · RUTA A 100 REUNIONES",
  value: 38,
  unit: "REUNIONES",
  target: 100,
  weekly: "+6",
  pace: "MAR 2027",
  paceSpoken: "marzo de 2027",
  footnote: "ultimo deploy · Vera voz interna en navegador — sin llamadas reales",
};
