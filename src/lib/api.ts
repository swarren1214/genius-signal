import { NextResponse } from "next/server";
import { z } from "zod";

export class RequestTooLargeError extends Error {}

export function checkWriteOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const url = new URL(request.url);
  const host = request.headers.get("host") ?? url.host;
  const protocol =
    request.headers.get("x-forwarded-proto")?.split(",")[0].trim() ??
    url.protocol.replace(":", "");
  const expected =
    protocol === "http" || protocol === "https"
      ? new URL(`${protocol}://${host}`).origin
      : null;
  if (!origin || origin !== expected)
    return NextResponse.json(
      { error: "Same-origin requests are required." },
      { status: 403 },
    );
  return null;
}

export async function parseBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<T> {
  const text = await request.text();
  if (text.length > 64000)
    throw new RequestTooLargeError("Request body is too large.");
  return schema.parse(JSON.parse(text));
}
