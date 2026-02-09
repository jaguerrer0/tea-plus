import Link from "next/link";

function FeatureCard({
  title,
  desc,
  href,
  badge,
}: {
  title: string;
  desc: string;
  href: string;
  badge: string;
}) {
  return (
    <Link href={href} className="card p-5 hover:shadow-md transition">
      <div className="flex items-center justify-between gap-3">
        <div className="font-semibold">{title}</div>
        <span className="chip">{badge}</span>
      </div>
      <p className="muted mt-2 text-sm">{desc}</p>
      <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium">
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: "rgb(99 102 241)" }}
        />
        Abrir
      </div>
    </Link>
  );
}

export default function Home() {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="card p-7 relative overflow-hidden">
        <div
          className="absolute -top-24 -right-24 h-64 w-64 rounded-full"
          style={{ background: "rgba(99,102,241,0.18)", filter: "blur(2px)" }}
        />
        <div
          className="absolute -bottom-28 -left-28 h-72 w-72 rounded-full"
          style={{ background: "rgba(16,185,129,0.14)", filter: "blur(2px)" }}
        />

        <div className="relative">
          <div className="flex items-center gap-2">
            <span className="chip">IA explicable</span>
            <span className="chip">Rutinas predecibles</span>
            <span className="chip">Feedback</span>
          </div>

          <h1 className="mt-4 text-3xl font-semibold leading-tight">
            TEA+ crea rutinas claras y adaptables
          </h1>
          <p className="muted mt-2 max-w-2xl">
            Diseñada para cuidadores y personas dentro del espectro autista.
            La IA funciona como acelerador: sugiere estructura, apoyos y planes B,
            manteniendo control humano.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/profile" className="btn-primary">
              Crear/editar perfil
            </Link>
            <Link href="/routines" className="btn-secondary">
              Ir a rutina
            </Link>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="grid gap-4 md:grid-cols-3">
        <FeatureCard
          title="Perfil"
          desc="Edad, comunicación, contexto y sensibilidades para personalizar rutinas."
          href="/profile"
          badge="1"
        />
        <FeatureCard
          title="Generar rutina"
          desc="Rutina por bloques (mañana/tarde/noche) con pasos concretos y duración."
          href="/routines"
          badge="2"
        />
        <FeatureCard
          title="Checklist + feedback"
          desc="Marca completado, señala pasos difíciles y mejora la siguiente versión."
          href="/routines"
          badge="3"
        />
      </section>
    </div>
  );
}
