"use client";

import { useMemo } from "react";
import { loadLastNDaysStats } from "@/lib/stats-storage";

function avg(nums: number[]) {
  if (!nums.length) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

export default function CaregiverInsights({ days = 7 }: { days?: number }) {
  const stats = useMemo(() => loadLastNDaysStats(days), [days]);

  if (!stats.length) {
    return (
      <div className="card p-6">
        <div className="font-semibold">Indicadores (operativos)</div>
        <p className="muted mt-1 text-sm">
          Aún no hay datos. En "Rutina", usa "Cerrar día" para guardar estadísticas.
        </p>
      </div>
    );
  }

  const completion = avg(stats.map((s) => s.completionPct));
  const hard = stats.reduce((a, s) => a + s.hardCount, 0);
  const failed = stats.reduce((a, s) => a + s.failedCount, 0);

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="font-semibold">Indicadores (operativos)</div>
          <div className="muted text-sm mt-1">
            No diagnostica ni mide "mejoras" clínicas. Solo muestra cómo se está usando la rutina.
          </div>
        </div>
        <div className="chip">Últimos {Math.min(days, stats.length)} días</div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="card p-4">
          <div className="text-sm font-medium">Cumplimiento promedio</div>
          <div className="mt-2 text-3xl font-semibold">{completion}%</div>
          <div className="muted text-xs mt-1">(pasos marcados como completados)</div>
        </div>
        <div className="card p-4">
          <div className="text-sm font-medium">Pasos "Difíciles"</div>
          <div className="mt-2 text-3xl font-semibold">{hard}</div>
          <div className="muted text-xs mt-1">(sumatoria en el periodo)</div>
        </div>
        <div className="card p-4">
          <div className="text-sm font-medium">Pasos "Falló"</div>
          <div className="mt-2 text-3xl font-semibold">{failed}</div>
          <div className="muted text-xs mt-1">(sumatoria en el periodo)</div>
        </div>
      </div>

      <div className="mt-4 text-xs muted">
        Siguiente iteración: agregar categorías (habla, sensorial, conducta) por paso para tener métricas por dominio.
      </div>
    </div>
  );
}
