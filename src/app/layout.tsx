import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "TEA+ | Rutinas con IA (reglas)",
  description: "Rutinas claras y adaptables para TEA usando motor de reglas explicable.",
};

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="px-3 py-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
    >
      {label}
    </Link>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
        <div className="border-b bg-white/70 dark:bg-neutral-950/70 backdrop-blur">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-neutral-900 dark:bg-white" />
              <div className="leading-tight">
                <div className="font-semibold">TEA+</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  Rutinas con IA basada en reglas
                </div>
              </div>
            </div>

            <nav className="flex items-center gap-1 text-sm">
              <NavLink href="/" label="Inicio" />
              <NavLink href="/profile" label="Perfil" />
              <NavLink href="/routines" label="Rutinas" />
            </nav>
          </div>
        </div>

        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
