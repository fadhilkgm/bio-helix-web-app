import { NextResponse } from "next/server";
import { getFastModel } from "@/lib/gemini";

function bytesToBase64(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("base64");
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audio = formData.get("audio");

    if (!(audio instanceof File)) {
      return NextResponse.json({ error: "Audio file is required." }, { status: 400 });
    }

    const bytes = new Uint8Array(await audio.arrayBuffer());
    const model = getFastModel();

    const result = await model.generateContent([
      "Transcribe the following user audio exactly. Return only the transcript text.",
      {
        inlineData: {
          mimeType: audio.type || "audio/webm",
          data: bytesToBase64(bytes)
        }
      }
    ]);

    return NextResponse.json({ transcript: result.response.text().trim() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transcription failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
