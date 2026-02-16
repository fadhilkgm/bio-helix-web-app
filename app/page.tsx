"use client";

import { useMemo, useRef, useState } from "react";

type Memory = { id: string; filename: string; contentPreview: string; mimeType: string };

export default function HomePage() {
  const [sessionId, setSessionId] = useState<string>(crypto.randomUUID());
  const [textPrompt, setTextPrompt] = useState("");
  const [answer, setAnswer] = useState("Waiting for your first question.");
  const [uploading, setUploading] = useState(false);
  const [chatting, setChatting] = useState(false);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [recording, setRecording] = useState(false);
  const [audioStatus, setAudioStatus] = useState("Voice ready.");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const canAsk = useMemo(() => textPrompt.trim().length > 0 && !chatting, [textPrompt, chatting]);

  async function loadMemories() {
    const res = await fetch(`/api/memory?sessionId=${sessionId}`);
    const data = await res.json();
    setMemories(data.memories ?? []);
  }

  async function onUpload(files: FileList | null) {
    if (!files?.length) return;

    setUploading(true);
    const formData = new FormData();
    formData.set("sessionId", sessionId);

    for (const file of Array.from(files)) {
      formData.append("files", file);
    }

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    setUploading(false);

    if (!res.ok) {
      setAnswer(`Upload failed: ${data.error ?? "Unknown error"}`);
      return;
    }

    setAnswer(data.message);
    await loadMemories();
  }

  async function ask(prompt: string) {
    setChatting(true);
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, prompt })
    });
    const data = await res.json();
    setChatting(false);

    if (!res.ok) {
      setAnswer(`Ask failed: ${data.error ?? "Unknown error"}`);
      return;
    }

    setAnswer(data.answer);

    if (data.audioBase64) {
      const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
      await audio.play();
    }
  }

  async function handleTextAsk() {
    await ask(textPrompt);
    setTextPrompt("");
  }

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    recorder.onstop = async () => {
      setAudioStatus("Transcribing voice...");
      const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
      const formData = new FormData();
      formData.set("audio", audioBlob, "voice.webm");
      formData.set("sessionId", sessionId);

      const transcriptRes = await fetch("/api/voice-transcribe", { method: "POST", body: formData });
      const transcriptData = await transcriptRes.json();

      if (!transcriptRes.ok) {
        setAudioStatus(`Voice error: ${transcriptData.error}`);
        return;
      }

      setAudioStatus(`Heard: ${transcriptData.transcript}`);
      await ask(transcriptData.transcript);
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
    setRecording(true);
    setAudioStatus("Recording... click stop to send to Gemini.");
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  return (
    <main className="grid" style={{ gap: "1.5rem" }}>
      <section>
        <h1>Bio Helix PWA Voice Assistant</h1>
        <small>
          Personalized answers are generated with your uploaded memory, powered by Gemini and PostgreSQL.
        </small>
      </section>

      <section className="grid two">
        <article className="card grid">
          <h2>1) Start Session + Upload Memory</h2>
          <label>
            Session Id
            <input value={sessionId} onChange={(e) => setSessionId(e.target.value)} />
          </label>
          <input type="file" multiple onChange={(e) => onUpload(e.target.files)} />
          <button disabled={uploading} onClick={() => loadMemories()}>
            {uploading ? "Uploading..." : "Refresh memory list"}
          </button>
          <small>Supported: text, PDF, markdown, JSON, PNG/JPEG/WebP (images are summarized by Gemini).</small>
        </article>

        <article className="card grid">
          <h2>2) Chat with Voice or Text</h2>
          <textarea
            rows={4}
            value={textPrompt}
            onChange={(e) => setTextPrompt(e.target.value)}
            placeholder="Ask anything related to your uploaded files..."
          />
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            <button disabled={!canAsk} onClick={handleTextAsk}>
              Ask by text
            </button>
            {!recording ? (
              <button onClick={startRecording}>Start voice</button>
            ) : (
              <button onClick={stopRecording}>Stop + send voice</button>
            )}
          </div>
          <small>{audioStatus}</small>
        </article>
      </section>

      <section className="grid two">
        <article className="card">
          <h2>Assistant Answer</h2>
          <pre>{answer}</pre>
        </article>

        <article className="card">
          <h2>Session Memory ({memories.length})</h2>
          <ul>
            {memories.map((memory) => (
              <li key={memory.id}>
                <strong>{memory.filename}</strong> ({memory.mimeType})
                <br />
                <small>{memory.contentPreview}</small>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}
