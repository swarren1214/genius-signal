import { NextResponse } from "next/server";
import { z } from "zod";

export function checkWriteOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) return NextResponse.json({ error: "Same-origin requests are required." }, { status: 403 });
  return null;
}

export async function parseBody<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  const text = await request.text();
  if (text.length > 64000) throw new Error("Request body is too large.");
  return schema.parse(JSON.parse(text));
}