import {
  Activity,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Clock3,
  Mail,
  Mic2,
  PhoneCall,
  Send,
  ShieldCheck,
  Target,
} from "lucide-react";

const prospects = [
  {
    name: "Adan Martinez",
    company: "Nemaris",
    role: "Director General",
    score: 91,
    tier: "Hot",
    trigger: "Consultoria con desgaste en diagnosticos y pipeline poco filtrado",
    offer: "Reuniones",
    channel: "Email",
  },
  {
    name: "Rogelio Perez",
    company: "ROCA Sistemas",
    role: "Director Comercial",
    score: 87,
    tier: "Hot",
    trigger: "Equipo comercial con necesidad de abrir conversaciones correctas",
    offer: "Datos + Reuniones",
    channel: "Email",
  },
  {
    name: "Mariana Soto",
    company: "Cyber LATAM",
    role: "Field Marketing",
    score: 76,
    tier: "Warm",
    trigger: "Evento regional y necesidad de audiencia C-Level",
    offer: "Events",
    channel: "LinkedIn",
  },
];

const tasks = [
  {
    title: "Research diario",
    status: "Completado",
    detail: "10 prospectos procesados desde base inicial.",
    icon: Target,
  },
  {
    title: "Drafts pendientes",
    status: "Revision",
    detail: "5 emails listos para aprobacion por Telegram.",
    icon: Mail,
  },
  {
    title: "Voz bloqueada",
    status: "Seguro",
    detail: "Solo pruebas internas hasta validar Twilio + ElevenLabs.",
    icon: ShieldCheck,
  },
];

const timeline = [
  "07:00 Convex dispara dailyPipeline",
  "07:08 Research Agent completa contexto",
  "07:18 Scoring Agent prioriza Hot/Warm/Cold",
  "07:32 Outreach Agent genera mensajes estilo Vox",
  "08:00 Telegram entrega reporte a Miguel",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0d0f12] text-[#f7f3ea]">
      <section className="border-b border-white/10 bg-[#101216]">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-8 lg:px-8">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-[#d7ff46] font-black text-[#0d0f12]">
                V
              </div>
              <div>
                <p className="text-sm font-semibold text-[#d7ff46]">Vox Media Agency</p>
                <h1 className="text-xl font-black tracking-tight">SDR IA Command Center</h1>
              </div>
            </div>
            <div className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-[#b7b2a8] md:flex">
              <Activity className="size-4 text-[#35d4c7]" />
              Cloud agent activo
            </div>
          </nav>

          <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
            <div>
              <p className="mb-3 text-xs font-black uppercase text-[#35d4c7]">Piloto interno</p>
              <h2 className="max-w-4xl text-4xl font-black leading-none tracking-tight md:text-6xl">
                Un ejecutivo IA visible, controlado y entrenado para crear pipeline diario.
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-[#b7b2a8]">
                El agente investiga, prioriza, redacta y reporta desde la nube. Miguel aprueba
                antes de que salga cualquier email o llamada real.
              </p>
            </div>

            <div className="grid gap-3 rounded-lg border border-white/10 bg-[#11151a] p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#b7b2a8]">Regla critica</span>
                <ShieldCheck className="size-5 text-[#d7ff46]" />
              </div>
              <strong className="text-2xl leading-tight">Voz solo en pruebas internas</strong>
              <p className="text-sm leading-6 text-[#b7b2a8]">
                Twilio trial llama solo a numeros verificados. El numero real de Vox se configura
                despues de validar guion, transcripcion, Convex y Telegram.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-6 py-6 lg:grid-cols-4 lg:px-8">
        <Metric label="Prospectos base" value="10" detail="Excel inicial" />
        <Metric label="Drafts listos" value="5" detail="Requieren aprobacion" />
        <Metric label="Cuentas Hot" value="2" detail="Score mayor a 80" />
        <Metric label="Llamadas reales" value="0" detail="Bloqueadas por seguridad" />
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-6 pb-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div className="rounded-lg border border-white/10 bg-[#11151a] p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase text-[#35d4c7]">Agent Workflow</p>
              <h3 className="mt-1 text-2xl font-black">Proceso de hoy</h3>
            </div>
            <Bot className="size-6 text-[#d7ff46]" />
          </div>
          <div className="grid gap-3">
            {tasks.map((task) => (
              <div key={task.title} className="rounded-lg border border-white/10 bg-black/20 p-4">
                <div className="flex items-start gap-3">
                  <task.icon className="mt-1 size-5 text-[#35d4c7]" />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <strong>{task.title}</strong>
                      <span className="rounded-full bg-[#d7ff46]/10 px-2 py-1 text-xs font-bold text-[#d7ff46]">
                        {task.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#b7b2a8]">{task.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-[#11151a] p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase text-[#35d4c7]">Priority Accounts</p>
              <h3 className="mt-1 text-2xl font-black">Top prospectos</h3>
            </div>
            <ArrowUpRight className="size-6 text-[#d7ff46]" />
          </div>
          <div className="overflow-hidden rounded-lg border border-white/10">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-white/[0.04] text-xs uppercase text-[#b7b2a8]">
                <tr>
                  <th className="px-4 py-3">Prospecto</th>
                  <th className="px-4 py-3">Trigger</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Canal</th>
                </tr>
              </thead>
              <tbody>
                {prospects.map((prospect) => (
                  <tr key={prospect.company} className="border-t border-white/10">
                    <td className="px-4 py-4 align-top">
                      <strong className="block">{prospect.company}</strong>
                      <span className="text-[#b7b2a8]">
                        {prospect.name} · {prospect.role}
                      </span>
                    </td>
                    <td className="max-w-sm px-4 py-4 align-top text-[#b7b2a8]">
                      {prospect.trigger}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span className="rounded-lg bg-[#d7ff46] px-2 py-1 font-black text-[#0d0f12]">
                        {prospect.score}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span className="text-[#35d4c7]">{prospect.channel}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-6 pb-10 lg:grid-cols-3 lg:px-8">
        <Panel
          icon={<Send className="size-5" />}
          title="Approval Queue"
          body="Los emails salen por Resend solo si Miguel aprueba desde Telegram o dashboard."
          action="5 pendientes"
        />
        <Panel
          icon={<Mic2 className="size-5" />}
          title="ElevenLabs Voice"
          body="El agente de voz queda conectado a Twilio para pruebas internas antes de llamadas reales."
          action="0 llamadas reales"
        />
        <Panel
          icon={<PhoneCall className="size-5" />}
          title="Telegram Control"
          body="El bot entrega reporte diario, alerts de cuentas Hot y botones de aprobar/pausar."
          action="08:00 reporte"
        />
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-12 lg:px-8">
        <div className="rounded-lg border border-white/10 bg-[#11151a] p-5">
          <div className="mb-5 flex items-center gap-3">
            <Clock3 className="size-5 text-[#35d4c7]" />
            <h3 className="text-2xl font-black">Timeline diario</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-5">
            {timeline.map((item) => (
              <div key={item} className="rounded-lg border border-white/10 bg-black/20 p-4">
                <CheckCircle2 className="mb-3 size-5 text-[#d7ff46]" />
                <p className="text-sm leading-6 text-[#b7b2a8]">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#11151a] p-5">
      <p className="text-sm text-[#b7b2a8]">{label}</p>
      <strong className="mt-2 block text-4xl font-black text-[#f7f3ea]">{value}</strong>
      <span className="mt-2 block text-sm text-[#35d4c7]">{detail}</span>
    </div>
  );
}

function Panel({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#11151a] p-5">
      <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-[#35d4c7]/10 text-[#35d4c7]">
        {icon}
      </div>
      <h3 className="text-xl font-black">{title}</h3>
      <p className="mt-3 min-h-18 text-sm leading-6 text-[#b7b2a8]">{body}</p>
      <span className="mt-4 inline-flex rounded-lg bg-white/[0.04] px-3 py-2 text-sm font-bold text-[#d7ff46]">
        {action}
      </span>
    </div>
  );
}
