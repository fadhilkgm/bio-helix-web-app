import { getFastModel } from "@/lib/gemini";

const TEXT_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "application/json",
  "application/pdf",
  "text/csv",
  "application/xml",
  "text/xml"
]);

const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function toBase64(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("base64");
}

export async function summarizeUpload(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  if (TEXT_TYPES.has(file.type) || file.type.startsWith("text/")) {
    const text = new TextDecoder().decode(bytes);
    return text.slice(0, 14000);
  }

  if (IMAGE_TYPES.has(file.type)) {
    const model = getFastModel();
    const result = await model.generateContent([
      "Describe this user image with factual details so it can be used as personalized memory context.",
      {
        inlineData: {
          mimeType: file.type,
          data: toBase64(bytes)
        }
      }
    ]);

    return result.response.text();
  }

  return `Unsupported file type (${file.type || "unknown"}) uploaded. Store filename only.`;
}
