import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ memories: [] });
  }

  const memories = await db.memory.findMany({
    where: { sessionId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      filename: true,
      mimeType: true,
      content: true
    }
  });

  return NextResponse.json({
    memories: memories.map((memory) => ({
      id: memory.id,
      filename: memory.filename,
      mimeType: memory.mimeType,
      contentPreview: memory.content.slice(0, 160)
    }))
  });
}
