import { useEffect, useRef, useState, type ReactNode } from "react";
import { useVoice } from "../hooks/useVoice";

type State = "idle" | "listening" | "thinking" | "speaking";
type Message = { role: string; text: string };

type Props = {
  samples: Record<string, string>;
  renderPortrait: (state: State) => ReactNode;
};

export default function VoiceChat({ samples, renderPortrait }: Props) {
  const [mode, setMode] = useState<"sample" | "live">("sample");
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [sound, setSound] = useState(false);
  const [error, setError] = useState("");
  const [language, setLanguage] = useState("en-US");

  const request = useRef<AbortController | null>(null);
  const log = useRef<HTMLDivElement>(null);
  const voice = useVoice(setText);

  const state: State = busy
    ? "thinking"
    : voice.listening
      ? "listening"
      : voice.speaking
        ? "speaking"
        : "idle";

  useEffect(() => () => request.current?.abort(), []);

  useEffect(() => {
    log.current?.scrollTo({
      top: log.current.scrollHeight,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }, [messages, busy]);

  function reset() {
    request.current?.abort();
    request.current = null;
    voice.stopListening();
    voice.stopSpeaking();
    setMessages([]);
    setText("");
    setError("");
    setBusy(false);
  }

  async function send(prompt: string) {
    const message = prompt.trim();
    if (!message || request.current) return;

    voice.stopListening();
    voice.stopSpeaking();
    setError("");
    setText("");
    setBusy(true);

    const controller = new AbortController();
    request.current = controller;

    setMessages((previous) => [
      ...previous,
      { role: "You", text: message },
    ]);

    try {
      let reply: string;

      if (mode === "sample") {
        const topic = Object.keys(samples).find((key) =>
          message.toLowerCase().includes(key.toLowerCase()),
        );

        reply = topic
          ? samples[topic]
          : "This is Sample mode. Try Daily briefing, Inbox, Calendar, Projects, Career or GitHub. Switch to Live AI for general questions.";

        // Keep processing feedback visible without contacting an API.
        await new Promise<void>((resolve) => setTimeout(resolve, 500));
      } else {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
          signal: controller.signal,
        });

        if (response.status === 429) {
          throw new Error("Too many requests. Please wait a minute.");
        }

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.error || "Live chat is unavailable.");
        }

        if (typeof data?.reply !== "string" || !data.reply.trim()) {
          throw new Error("No answer returned. Please try again.");
        }

        reply = data.reply;
      }

      if (controller.signal.aborted || request.current !== controller) return;

      setMessages((previous) => [
        ...previous,
        {
          role: mode === "sample" ? "NEXA · sample" : "NEXA · AI",
          text: reply,
        },
      ]);

      if (sound) voice.speak(reply, language);
    } catch (failure) {
      if (!controller.signal.aborted && request.current === controller) {
        setError(
          failure instanceof Error ? failure.message : "Please try again.",
        );
      }
    } finally {
      if (request.current === controller) {
        request.current = null;
        setBusy(false);
      }
    }
  }

  const lastReply = [...messages]
    .reverse()
    .find((message) => message.role !== "You");

  return (
    <div>
      <div className="buttons" aria-label="Chat mode">
        <button
          type="button"
          className="button"
          aria-pressed={mode === "sample"}
          onClick={() => { reset(); setMode("sample"); }}
        >
          Sample Demo
        </button>
        <button
          type="button"
          className="button"
          aria-pressed={mode === "live"}
          onClick={() => { reset(); setMode("live"); }}
        >
          Live AI
        </button>
      </div>

      <p className="demo-disclosure">
        {mode === "sample"
          ? "Sample mode uses fictional, predefined answers. No OpenAI request is made."
          : "Live AI sends each submitted message to OpenAI through our server. Answers may be inaccurate. Each question is sent separately; earlier messages are not included."}
        {" "}Neither mode connects to personal accounts or private n8n workflows.
      </p>

      <div className="demo">
        <div className="demo-character">
          {renderPortrait(state)}
          <p role="status" className="caption">
            {voice.listening
              ? "Listening… Speak your request."
              : voice.speaking
                ? "NEXA is reading the answer."
                : busy
                  ? "Preparing an answer…"
                  : "Ready. Type or use the microphone."}
          </p>
          <p className="caption">
            Voice input may use your browser provider’s speech service.
            Review the recognized text, then press Send.
            The animated halo indicates speech playback; mouth movements are not lip-synced.
          </p>
        </div>

        <div className="demo-chat">
          <div className="demo-top">
            <span>{mode === "sample" ? "SAMPLE DEMO" : "LIVE AI CHAT"}</span>
            <button type="button" onClick={reset}>Reset</button>
          </div>

          <div
            ref={log}
            className="conversation"
            role="log"
            aria-label="NEXA conversation"
            aria-live="polite"
          >
            {!messages.length && (
              <div className="welcome">
                <h3>Hi, I’m NEXA.</h3>
                <p>Choose a sample action or ask a question in Live AI mode.</p>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`bubble ${message.role === "You" ? "user" : ""}`}
              >
                <small>{message.role}</small>
                <p>{message.text}</p>
              </div>
            ))}

            {busy && <p className="processing">Preparing an answer…</p>}
          </div>

          {mode === "sample" && (
            <div className="quick-actions">
              {Object.keys(samples).map((action) => (
                <button
                  type="button"
                  key={action}
                  disabled={busy || voice.listening}
                  onClick={() => void send(action)}
                >
                  {action}
                </button>
              ))}
            </div>
          )}

          <div className="buttons">
            <label>
              Voice language{" "}
              <select
                value={language}
                disabled={busy || voice.listening || voice.speaking}
                onChange={(event) => setLanguage(event.target.value)}
                style={{ background: "#090b1d", color: "#ede9fe" }}
              >
                <option value="en-US">English</option>
                <option value="ur-PK">Urdu</option>
                <option value="fr-FR">French</option>
              </select>
            </label>

            <button
              type="button"
              className="button"
              disabled={busy || !voice.canListen}
              onClick={() =>
                voice.listening
                  ? voice.stopListening()
                  : voice.startListening(language)
              }
            >
              {voice.listening ? "Stop microphone" : "Microphone"}
            </button>

            <button
              type="button"
              className="button"
              disabled={!voice.canSpeak}
              aria-pressed={sound}
              onClick={() => {
                if (sound) voice.stopSpeaking();
                setSound(!sound);
              }}
            >
              Spoken replies: {sound ? "On" : "Off"}
            </button>

            <button
              type="button"
              className="button"
              disabled={!lastReply || !voice.canSpeak || busy || voice.listening}
              onClick={() => lastReply && voice.speak(lastReply.text, language)}
            >
              Read aloud
            </button>

            <button
              type="button"
              className="button"
              disabled={!voice.speaking}
              onClick={voice.stopSpeaking}
            >
              Stop speaking
            </button>
          </div>

          {!voice.canListen && (
            <p className="caption">
              Voice input is unavailable in this browser. Please type instead.
            </p>
          )}

          <form onSubmit={(event) => {
            event.preventDefault();
            void send(text);
          }}>
            <label className="sr-only" htmlFor="voice-message">
              Message NEXA
            </label>
            <input
              id="voice-message"
              value={text}
              maxLength={1500}
              onChange={(event) => setText(event.target.value)}
              placeholder="Type or dictate your question…"
            />
            <button
              type="submit"
              disabled={busy || voice.listening || !text.trim()}
              aria-label="Send message"
            >
              ↑
            </button>
          </form>

          {(error || voice.voiceError) && (
            <p role="alert">{error || voice.voiceError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
