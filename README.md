# Bio Helix Web App (Next.js PWA + Gemini Voice)

A production-style starter for a **Progressive Web App (PWA)** with:

- Realtime-feel voice chat UX (record → transcribe with Gemini → personalized response).
- Personalized answers based on user-uploaded files and images.
- Server-side data handling with Next.js Route Handlers + Prisma.
- PostgreSQL as the primary database (recommended over SQLite for this use case).

## Why PostgreSQL (and not SQLite) for this app?

SQLite is excellent for local prototypes, but this app needs concurrent writes (upload + chat + voice), larger payload handling, and easier scaling.

**PostgreSQL is the better fit** because it provides:

1. Better concurrency model for multi-user realtime interactions.
2. Stronger durability and operational tooling for cloud environments.
3. Better upgrade path to semantic/vector personalization (e.g. pgvector) when memory retrieval grows.

If you only run single-user local demos, SQLite can work, but for your requested architecture PostgreSQL is the safer default.

## Stack

- **Frontend**: Next.js 14 + React 18
- **Backend language**: TypeScript (Node.js runtime in Next.js)
- **Database**: PostgreSQL + Prisma ORM
- **AI provider**: Gemini (`@google/generative-ai`)

## Features implemented

- PWA manifest + service worker registration.
- Upload text/doc/image files and store memory records per session.
- Gemini image summarization to turn image uploads into usable memory context.
- Voice input flow:
  - browser microphone recording (`MediaRecorder`)
  - Gemini transcription (`/api/voice-transcribe`)
  - personalized chat response (`/api/chat`) using uploaded memory context.
- Session-scoped memory listing.

## Setup

```bash
npm install
cp .env.example .env
# fill GEMINI_API_KEY and DATABASE_URL
npx prisma migrate dev --name init
npm run dev
```

Open `http://localhost:3000`.

## API endpoints

- `POST /api/upload` - accepts `sessionId` and `files[]`, stores parsed memory.
- `GET /api/memory?sessionId=...` - list memory previews.
- `POST /api/voice-transcribe` - accepts `audio`, returns Gemini transcript.
- `POST /api/chat` - personalized assistant response based on stored memory.

## Notes

- This starter keeps a straightforward memory strategy (store extracted content directly). For production, add chunking + embeddings + retrieval ranking.
- For stricter realtime duplex voice, you can evolve this into Gemini Live API websocket bridging.
