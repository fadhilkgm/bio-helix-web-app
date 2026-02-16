import { db } from "@/lib/db";

const MEMORY_LIMIT = 12;

export async function fetchSessionMemory(sessionId: string) {
  return db.memory.findMany({
    where: { sessionId },
    orderBy: { createdAt: "desc" },
    take: MEMORY_LIMIT
  });
}

export function buildMemoryContext(memories: Array<{ filename: string; content: string; mimeType: string }>) {
  if (!memories.length) {
    return "No memory uploaded yet.";
  }

  return memories
    .map((m, idx) => `Memory ${idx + 1}: ${m.filename} (${m.mimeType})\n${m.content.slice(0, 6000)}`)
    .join("\n\n---\n\n");
}
