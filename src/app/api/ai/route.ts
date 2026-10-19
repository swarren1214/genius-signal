import { NextResponse } from "next/server";
import { z } from "zod";
import { checkWriteOrigin, parseBody, RequestTooLargeError } from "@/lib/api";
import { isAiConfigured } from "@/lib/config";
import { answerQuestion, generateDigest } from "@/lib/services/ai";
import { readRecord, writeRecord } from "@/lib/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("generate") }),
  z.object({
    action: z.literal("question"),
    question: z.string().trim().min(1).max(2000),
  }),
]);

export async function POST(request: Request) {
  const rejected = checkWriteOrigin(request);
  if (rejected) return rejected;
  if (!isAiConfigured)
    return NextResponse.json(
      { error: "OpenAI is not configured. Set OPENAI_API_KEY on the server." },
      { status: 503 },
    );
  try {
    const input = await parseBody(request, schema);
    const last = readRecord<{ at: number }>("system", "ai-request");
    if (last && Date.now() - last.at < 5000)
      return NextResponse.json(
        { error: "Wait a few seconds before another AI request." },
        { status: 429 },
      );
    writeRecord("system", "ai-request", { at: Date.now() });
    return NextResponse.json(
      input.action === "generate"
        ? { digest: await generateDigest() }
        : await answerQuestion(input.question),
    );
  } catch (error) {
    if (error instanceof RequestTooLargeError)
      return NextResponse.json(
        { error: "Request body is too large." },
        { status: 413 },
      );
    if (error instanceof z.ZodError || error instanceof SyntaxError)
      return NextResponse.json(
        { error: "Invalid request data." },
        { status: 400 },
      );
    console.error("Grounded AI request failed:", error);
    return NextResponse.json(
      {
        error:
          "AI generation failed or source validation rejected the response. No substitute answer was returned.",
      },
      { status: 502 },
    );
  }
}
