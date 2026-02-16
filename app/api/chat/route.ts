import { NextResponse } from "next/server";
import { z } from "zod";
import { fetchSessionMemory, buildMemoryContext } from "@/lib/memory";
import { getChatModel } from "@/lib/gemini";

const payloadSchema = z.object({
  sessionId: z.string().min(3).max(120),
  prompt: z.string().min(2).max(4000)
});

export async function POST(request: Request) {
  try {
    const payload = payloadSchema.parse(await request.json());
    const memories = await fetchSessionMemory(payload.sessionId);
    const context = buildMemoryContext(memories);

    const model = getChatModel();
    const response = await model.generateContent([
      `You are a real-time voice assistant inside a PWA. Reply in a concise conversational style.\n\nPersonalized memory context:\n${context}`,
      `User request: ${payload.prompt}`
    ]);

    const answer = response.response.text();

    return NextResponse.json({ answer, audioBase64: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Chat failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
