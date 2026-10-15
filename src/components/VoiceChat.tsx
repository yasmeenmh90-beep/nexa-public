import { useEffect, useRef, useState, type ReactNode } from "react";
import { useVoice } from "../hooks/useVoice";
import { PUBLIC_LINKS } from "../config/publicLinks";

type HistoryMessage = { role: "user" | "assistant"; content: string };
function recentHistory(items: HistoryMessage[]) {
  const recent = items.slice(-6).map(item => ({ ...item, content: item.content.slice(0, 2000) }));
  while (recent.reduce((total, item) => total + item.content.length, 0) > 6000) recent.splice(0, 2);
  return recent;
}
const suggestions = [
  "Explain NEXA and what I can try here.",
  "Help me plan a productive day.",
  "Explain machine learning in simple words.",
  "Help me prepare for an AI engineering interview.",
];
const feedbackUrl = (title: string) => `${PUBLIC_LINKS.repository || "https://github.com/yasmeenmh90-beep/nexa-public"}/issues/new?${new URLSearchParams({ title, body: "What happened or what would you like to improve?\n\nSteps to reproduce (if relevant):\n\nBrowser and device:\n\nPlease do not include API keys or private conversation content." })}`;

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
  const [copied, setCopied] = useState<number | null>(null);
  const [copyNotice, setCopyNotice] = useState("");

  const request = useRef<AbortController | null>(null);
  const log = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const history = useRef<HistoryMessage[]>([]);
  const copyTimer = useRef<ReturnType<typeof setTimeout>>();
  const copyAttempt = useRef(0);
  const voice = useVoice(setText);

  const state: State = busy
    ? "thinking"
    : voice.listening
      ? "listening"
      : voice.speaking
        ? "speaking"
        : "idle";

  useEffect(() => () => {
    request.current?.abort();
    copyAttempt.current++;
    clearTimeout(copyTimer.current);
  }, []);

  useEffect(() => {
    log.current?.scrollTo({
      top: log.current.scrollHeight,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }, [messages, busy]);

  async function copyAnswer(value: string, index: number) {
    const attempt = ++copyAttempt.current;
    clearTimeout(copyTimer.current);
    setCopied(null);
    setCopyNotice("");
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(value);
      if (attempt !== copyAttempt.current) return;
      setCopied(index);
      setCopyNotice("Answer copied.");
      copyTimer.current = setTimeout(() => { setCopied(null); setCopyNotice(""); }, 2500);
    } catch {
      if (attempt === copyAttempt.current) setCopyNotice("Could not copy automatically. Select the answer text and copy it.");
    }
  }

  function reset() {
    history.current = [];
    copyAttempt.current++;
    clearTimeout(copyTimer.current);
    setCopied(null);
    setCopyNotice("");
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
          body: JSON.stringify({ message, history: history.current }),
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

      if (mode === "live") {
        history.current = recentHistory([...history.current,
          { role: "user", content: message },
          { role: "assistant", content: reply },
        ]);
      }

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

  const prompts = messages.length
    ? ["Explain that more simply.", "Give me a practical example."]
    : suggestions;

  return (
    <div className="demo-shell">
      <div className="demo-heading">
        <div className="mode-switch" role="group" aria-label="Chat mode">
          <button type="button" aria-pressed={mode === "sample"} onClick={() => { reset(); setMode("sample"); }}>Sample Demo</button>
          <button type="button" aria-pressed={mode === "live"} onClick={() => { reset(); setMode("live"); }}>Live AI <span>✦</span></button>
        </div>
        <span className={`chat-status status-${state}`}><i aria-hidden="true"/>{state === "idle" ? "Ready to chat" : state === "listening" ? "Listening" : state === "thinking" ? "Preparing an answer" : "Speaking"}</span>
      </div>
      <p className="demo-disclosure">
        {mode === "sample"
          ? "A preview with fictional, predefined answers. Try a task below."
          : "Ask a general question and follow up. Your message and up to three recent exchanges go to OpenAI. AI can be inaccurate."}
        {" "}Personal accounts are not connected.
      </p>
      <div className="demo">
        <div className="demo-character">
          <p className="portrait-eyebrow">NEXA / YOUR CONVERSATION SPACE</p>
          {renderPortrait(state)}
          <p role="status" className="character-status">
            {voice.listening ? "I’m listening. Review your words, then Send."
              : voice.speaking ? "Reading your answer aloud."
              : busy ? "A little thinking time…"
              : "Type it. Say it. Let’s explore it."}
          </p>
          <div className="character-tags"><span>Text & voice</span><span>{mode === "sample" ? "Fictional samples" : "General AI answers"}</span></div>
        </div>
        <div className="demo-chat">
          <div className="demo-top"><div><span>{mode === "sample" ? "EXPLORE THE POSSIBILITIES" : "A LITTLE CLARITY STARTS HERE"}</span><h3>{mode === "sample" ? "What’s on your radar?" : "What’s on your mind?"}</h3></div><button type="button" onClick={reset}>Reset chat ↺</button></div>
          <div ref={log} className={`conversation ${messages.length ? "" : "conversation-empty"}`} role="log" aria-label="NEXA conversation" aria-live="polite">
            {!messages.length && <div className="welcome"><span aria-hidden="true">✦</span><h3>Hi, I’m NEXA.</h3><p>{mode === "sample" ? "Choose a task to preview an everyday workflow." : "Bring a question, an idea, or something you’re curious about."}</p></div>}
            {messages.map((message, index) => <div key={index} className={`bubble ${message.role === "You" ? "user" : ""}`}><small>{message.role}</small><p>{message.text}</p>{message.role !== "You" && <button type="button" className="copy-answer" aria-label={`Copy NEXA answer ${index + 1}`} onClick={() => void copyAnswer(message.text, index)}>{copied === index ? "Copied ✓" : "Copy answer"}</button>}</div>)}
            {busy && <p className="processing"><span aria-hidden="true">•••</span> Preparing an answer</p>}
          </div>
          <p className="copy-notice" role="status">{copyNotice}</p>
          {mode === "sample"
            ? <div className="quick-actions" aria-label="Sample tasks">{Object.keys(samples).map(action => <button type="button" key={action} disabled={busy || voice.listening} onClick={() => void send(action)}>{action}<span aria-hidden="true">↗</span></button>)}</div>
            : <div className="suggested-questions" aria-label="Suggested questions"><p>{messages.length ? "Keep exploring" : "A few places to start"}</p><div>{prompts.map(prompt => <button type="button" key={prompt} disabled={busy || voice.listening} onClick={() => { setText(prompt); input.current?.focus(); }}>{prompt}</button>)}</div></div>}
          <form onSubmit={event => { event.preventDefault(); void send(text); }}>
            <label className="sr-only" htmlFor="voice-message">Message NEXA</label>
            <input id="voice-message" ref={input} value={text} maxLength={1500} onChange={event => setText(event.target.value)} placeholder={mode === "sample" ? "Try “Daily briefing”…" : "Ask anything you’re curious about…"}/>
            <button type="submit" disabled={busy || voice.listening || !text.trim()} aria-label="Send message">↑</button>
          </form>
          <div className="voice-toolbar" aria-label="Voice controls">
            <button type="button" className={`voice-control ${voice.listening ? "active" : ""}`} disabled={busy || !voice.canListen} onClick={() => voice.listening ? voice.stopListening() : voice.startListening(language)}><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M6 11v1a6 6 0 0 0 12 0v-1M12 18v3M9 21h6"/></svg>{voice.listening ? "Stop microphone" : "Microphone"}</button>
            <button type="button" className="voice-control" disabled={!voice.canSpeak} aria-pressed={sound} onClick={() => { if (sound) voice.stopSpeaking(); setSound(!sound); }}>Spoken replies <span className={sound ? "toggle-on" : "toggle-off"}>{sound ? "On" : "Off"}</span></button>
            {voice.speaking
              ? <button type="button" className="voice-control playback-control" onClick={voice.stopSpeaking}>■ Stop speaking</button>
              : <button type="button" className="voice-control playback-control" disabled={!lastReply || !voice.canSpeak || busy || voice.listening} onClick={() => lastReply && voice.speak(lastReply.text, language)}>▷ Read aloud</button>}
          </div>
          <details className="voice-options"><summary>Voice settings & privacy <span>+</span></summary><div><label htmlFor="voice-language">Voice language</label><select id="voice-language" value={language} disabled={busy || voice.listening || voice.speaking} onChange={event => setLanguage(event.target.value)}><option value="en-US">English</option><option value="ur-PK">Urdu</option><option value="fr-FR">French</option></select><p>Voice input may use your browser provider’s speech service. Review dictated text before Send. The portrait’s halo indicates playback; precise lip sync is deferred.</p><p>Reset, switch modes or refresh to clear this app’s conversation context.</p></div></details>
          {!voice.canListen && <p className="caption">Voice input is unavailable in this browser. You can still type.</p>}
          {(error || voice.voiceError) && <p role="alert" className="chat-error">{error || voice.voiceError}</p>}
          <div className="chat-feedback"><span>Make NEXA better.</span><a href={feedbackUrl("NEXA: report a problem")} target="_blank" rel="noopener noreferrer">Report a problem ↗</a><a href={feedbackUrl("NEXA: feature suggestion")} target="_blank" rel="noopener noreferrer">Suggest a feature ↗</a><small>Public GitHub feedback · account required to submit</small></div>
        </div>
      </div>
    </div>
  );
}
