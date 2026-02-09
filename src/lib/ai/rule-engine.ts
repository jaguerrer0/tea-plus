import type { ProfileInput, Routine, RoutineBlock, RoutineStep } from "@/lib/types";

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function baseDurationByAge(age: number) {
  // niños: pasos más cortos; adultos: un poco más largos
  if (age <= 6) return 3;
  if (age <= 10) return 5;
  if (age <= 15) return 7;
  return 10;
}

function addVisualSupports(communicationLevel: ProfileInput["communicationLevel"]) {
  if (communicationLevel === "non-verbal") {
    return ["Pictogramas", "Checklist visual", "Temporizador visual"];
  }
  if (communicationLevel === "semi-verbal") {
    return ["Checklist", "Temporizador (visual o app)"];
  }
  return ["Checklist"];
}

function sensoryGuidance(sensory: ProfileInput["sensorySensitivity"]) {
  const notes: string[] = [];
  if (sensory.includes("sound")) notes.push("Reducir ruido (TV baja, puerta cerrada, audífonos si aplica).");
  if (sensory.includes("light")) notes.push("Evitar luz directa; usar iluminación suave.");
  if (sensory.includes("touch")) notes.push("Preferir ropa sin etiquetas / texturas suaves.");
  if (sensory.includes("crowds")) notes.push("Evitar aglomeraciones; planificar rutas y horarios.");
  return notes;
}

function transitionBackupPlans(sensory: ProfileInput["sensorySensitivity"]) {
  const backup: string[] = [
    "Ofrecer elección limitada (A o B).",
    "Reducir el paso a micro-pasos (solo 1 acción).",
    "Pausa breve 1–2 min y retomar.",
  ];
  if (sensory.includes("sound")) backup.push("Moverse a un espacio más silencioso.");
  if (sensory.includes("crowds")) backup.push("Cambiar a un lugar con menos personas.");
  return backup;
}

function buildStep(title: string, durationMin: number, instructions: string[], profile: ProfileInput): RoutineStep {
  const visualSupport = addVisualSupports(profile.communicationLevel);
  const sensoryNotes = sensoryGuidance(profile.sensorySensitivity);
  const backupPlan = transitionBackupPlans(profile.sensorySensitivity);

  return {
    id: uid("step"),
    title,
    durationMin,
    instructions,
    visualSupport,
    sensoryNotes: sensoryNotes.length ? sensoryNotes : undefined,
    backupPlan,
  };
}

function buildMorning(profile: ProfileInput): RoutineBlock {
  const base = baseDurationByAge(profile.age);
  const steps: RoutineStep[] = [];

  steps.push(
    buildStep(
      "Inicio suave",
      clamp(base, 2, 6),
      ["Saludo breve y claro.", "Mostrar la rutina visual (qué sigue).", "1 respiración profunda o presión profunda si ayuda."],
      profile
    )
  );

  steps.push(
    buildStep(
      "Higiene",
      clamp(base + 1, 3, 8),
      ["Ir al baño.", "Lavarse manos/cara.", "Cepillado de dientes con temporizador."],
      profile
    )
  );

  steps.push(
    buildStep(
      "Vestirse",
      clamp(base + 2, 3, 10),
      ["Elegir entre 2 opciones de ropa.", "Vestirse por partes (camisa → pantalón → zapatos).", "Confirmar con checklist."],
      profile
    )
  );

  steps.push(
    buildStep(
      "Desayuno",
      clamp(base + 2, 5, 12),
      ["Ofrecer 1 opción preferida + 1 opción saludable.", "Evitar prisas.", "Refuerzo positivo breve."],
      profile
    )
  );

  if (profile.context === "school" || profile.context === "mixed") {
    steps.push(
      buildStep(
        "Preparación para salir",
        clamp(base + 1, 4, 10),
        ["Mochila lista (lista visual).", "Anticipar: 'en 5 minutos salimos'.", "Transición con temporizador."],
        profile
      )
    );
  }

  return { label: "morning", steps };
}

function buildAfternoon(profile: ProfileInput): RoutineBlock {
  const base = baseDurationByAge(profile.age);
  const steps: RoutineStep[] = [];

  steps.push(
    buildStep(
      "Transición / regreso",
      clamp(base, 3, 8),
      ["Tiempo de descompresión 10–15 min (sin demandas).", "Actividad tranquila (legos, dibujo, música suave)."],
      profile
    )
  );

  steps.push(
    buildStep(
      "Actividad principal",
      clamp(base + 4, 8, 20),
      ["Elegir actividad según interés.", "Dividir en 2 bloques con pausa.", "Cerrar con señal clara de fin."],
      profile
    )
  );

  steps.push(
    buildStep(
      "Snack / hidratación",
      clamp(base + 1, 4, 10),
      ["Beber agua.", "Snack simple.", "Volver a mostrar 'qué sigue'."],
      profile
    )
  );

  return { label: "afternoon", steps };
}

function buildEvening(profile: ProfileInput): RoutineBlock {
  const base = baseDurationByAge(profile.age);
  const steps: RoutineStep[] = [];

  steps.push(
    buildStep(
      "Cena",
      clamp(base + 2, 6, 15),
      ["Ambiente predecible.", "Evitar estímulos fuertes.", "Refuerzo positivo breve."],
      profile
    )
  );

  steps.push(
    buildStep(
      "Higiene nocturna",
      clamp(base + 1, 4, 12),
      ["Baño/ducha (si aplica).", "Cepillado con temporizador.", "Pijama cómoda."],
      profile
    )
  );

  steps.push(
    buildStep(
      "Cierre del día",
      clamp(base, 3, 10),
      ["Actividad calmante (lectura corta).", "Anticipar mañana con 1 frase.", "Dormir."],
      profile
    )
  );

  return { label: "evening", steps };
}

export function generateRoutine(profile: ProfileInput): Routine {
  const blocks: RoutineBlock[] = [buildMorning(profile), buildAfternoon(profile), buildEvening(profile)];

  const explainability: string[] = [
    "Los pasos se dividen en bloques para reducir carga cognitiva.",
    "Se usa anticipación y temporizador para transiciones predecibles.",
    "Se agregan apoyos visuales según el nivel de comunicación.",
  ];

  if (profile.sensorySensitivity.length) {
    explainability.push(`Se incorporaron ajustes sensoriales: ${profile.sensorySensitivity.join(", ")}.`);
  }

  const changePlan = [
    "Avisar cambios con anticipación (5–10 min) usando temporizador.",
    "Ofrecer opciones limitadas para mantener control percibido.",
    "Mantener 1–2 elementos constantes (objeto, frase, orden).",
  ];

  const overloadSignals = [
    "Aumento de estereotipias o repetición.",
    "Irritabilidad, cubrirse oídos/ojos, evasión.",
    "Cambios abruptos en tono, llanto o silencio marcado.",
  ];

  const caregiverNotes = [
    "Usar frases cortas, consistentes y concretas.",
    "Evitar negociaciones largas durante una transición.",
    "Refuerzo positivo específico: 'Bien hecho por X'.",
  ];

  return {
    title: "Rutina diaria personalizada",
    goal: profile.goal,
    blocks,
    changePlan,
    overloadSignals,
    caregiverNotes,
    explainability,
  };
}
