import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { summarizeUpload } from "@/lib/uploads";

const sessionSchema = z.string().min(3).max(120);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const sessionId = sessionSchema.parse(formData.get("sessionId"));
    const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File);

    if (!files.length) {
      return NextResponse.json({ error: "No files uploaded." }, { status: 400 });
    }

    for (const file of files) {
      const content = await summarizeUpload(file);
      await db.memory.create({
        data: {
          sessionId,
          filename: file.name,
          mimeType: file.type || "application/octet-stream",
          content
        }
      });
    }

    return NextResponse.json({
      message: `Uploaded ${files.length} file(s). Memory is ready for personalized answers.`
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
