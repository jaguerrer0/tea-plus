import { NextResponse } from "next/server";
import { GenerateRoutineSchema } from "@/lib/validators/routine";
import { generateRoutine } from "@/lib/ai/rule-engine";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = GenerateRoutineSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const routine = generateRoutine(parsed.data);
    return NextResponse.json({ routine });
  } catch (e) {
    return NextResponse.json(
      { error: "Server error", details: String(e) },
      { status: 500 }
    );
  }
}
