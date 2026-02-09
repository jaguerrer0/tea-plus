import { z } from "zod";

export const GenerateRoutineSchema = z.object({
  age: z.number().min(2).max(99),
  communicationLevel: z.enum(["verbal", "semi-verbal", "non-verbal"]),
  sensorySensitivity: z.array(z.enum(["sound", "light", "touch", "crowds"])),
  goal: z.string().min(5).max(140),
  context: z.enum(["home", "school", "mixed"]),
});

export const FeedbackSchema = z.object({
  routineId: z.string().min(1),
  stepId: z.string().min(1),
  outcome: z.enum(["ok", "hard", "failed"]),
  note: z.string().max(280).optional(),
});
