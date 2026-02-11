import "./globals.css";
import AppNav from "@/components/app-nav";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <header className="sticky top-0 z-50 border-b glass">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-2xl"
                   style={{
                     background: "linear-gradient(135deg, rgba(99,102,241,1), rgba(16,185,129,0.9))",
                     boxShadow: "0 10px 25px rgba(99,102,241,0.18)"
                   }}
              />
              <div className="leading-tight">
                <div className="font-semibold">TEA+</div>
                <div className="text-xs muted">Rutinas claras, predecibles y adaptables</div>
              </div>
            </div>

            <AppNav />
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
