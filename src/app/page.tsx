import Link from "next/link";

function Card({
  title,
  desc,
  href,
}: {
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border p-5 hover:shadow-sm transition bg-white dark:bg-neutral-950"
    >
      <div className="font-semibold">{title}</div>
      <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{desc}</div>
      <div className="mt-4 text-sm text-neutral-900 dark:text-neutral-100 underline">
        Abrir
      </div>
    </Link>
  );
}

export default function Home() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border p-6 bg-white dark:bg-neutral-950">
        <h1 className="text-2xl font-semibold">TEA+: Rutinas con IA</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          Genera rutinas claras y predecibles usando un motor de reglas explicable y ajustable por feedback.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card
          title="1) Crear perfil"
          desc="Edad, comunicación, sensibilidades, contexto y objetivo."
          href="/profile"
        />
        <Card
          title="2) Generar rutina"
          desc="Rutina por bloques (mañana/tarde/noche) con apoyos y planes B."
          href="/routines"
        />
        <Card
          title="3) Ajustar con feedback"
          desc="Marca pasos difíciles y mejora la siguiente versión."
          href="/routines"
        />
      </section>
    </div>
  );
}
