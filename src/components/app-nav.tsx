"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const NAV = [
  { href: "/", label: "Inicio" },
  { href: "/profile", label: "Perfil" },
  { href: "/routines", label: "Rutina" },
  { href: "/calendar", label: "Calendario" },
  { href: "/reminders", label: "Recordatorios" },
  { href: "/people", label: "Familia" },
];

function NavLink({ href, label, onClick }: { href: string; label: string; onClick?: () => void }) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`px-3 py-2 rounded-xl text-sm font-medium transition hover:bg-black/[0.04] ${active ? "bg-black/[0.04]" : ""}`}
    >
      {label}
    </Link>
  );
}

export default function AppNav() {
  const [open, setOpen] = useState(false);

  // Cierra el menú al cambiar de ruta
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);

  const items = useMemo(() => NAV, []);

  return (
    <>
      {/* Desktop */}
      <nav className="hidden md:flex items-center gap-1">
        {items.map((x) => (
          <NavLink key={x.href} href={x.href} label={x.label} />
        ))}
      </nav>

      {/* Mobile */}
      <div className="md:hidden relative">
        <button
          className="btn-secondary px-3 py-2"
          aria-label="Abrir menú"
          onClick={() => setOpen((v) => !v)}
        >
          ☰
        </button>

        {open ? (
          <div className="absolute right-0 mt-2 w-56 card p-2 shadow-md">
            <div className="flex flex-col gap-1">
              {items.map((x) => (
                <NavLink key={x.href} href={x.href} label={x.label} onClick={() => setOpen(false)} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
