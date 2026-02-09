import { NextResponse } from "next/server";
import { FeedbackSchema } from "@/lib/validators/routine";
import { refineRoutine } from "@/lib/ai/refiner";
import type { Routine } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // body: { routine: Routine, feedback: Feedback[] }
    const routine = body?.routine as Routine | undefined;
    const feedbackRaw = body?.feedback;

    if (!routine || !Array.isArray(feedbackRaw)) {
      return NextResponse.json(
        { error: "Invalid payload. Expected { routine, feedback[] }" },
        { status: 400 }
      );
    }

    const parsedFeedback = feedbackRaw.map((f: unknown) => FeedbackSchema.parse(f));
    const next = refineRoutine(routine, parsedFeedback);

    return NextResponse.json({ routine: next });
  } catch (e) {
    return NextResponse.json(
      { error: "Server error", details: String(e) },
      { status: 500 }
    );
  }
}
