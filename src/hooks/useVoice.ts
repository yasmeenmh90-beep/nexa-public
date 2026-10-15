import { useEffect, useRef, useState } from "react";
import type { SpeechMotion } from "../components/SpeakingPortrait";

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onresult:
    | ((event: {
        results: ArrayLike<ArrayLike<{ transcript: string }>>;
      }) => void)
    | null;
  start(): void;
  abort(): void;
};

type VoiceWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};

export function useVoice(onTranscript: (text: string) => void) {
  const [canListen, setCanListen] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [speechMotion, setSpeechMotion] = useState<SpeechMotion>();

  const recognition = useRef<Recognition | null>(null);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const listenTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transcriptHandler = useRef(onTranscript);

  transcriptHandler.current = onTranscript;

  function clearListenTimer() {
    if (listenTimer.current !== null) {
      clearTimeout(listenTimer.current);
      listenTimer.current = null;
    }
  }

  useEffect(() => {
    const browser = window as VoiceWindow;

    setCanListen(
      Boolean(browser.SpeechRecognition || browser.webkitSpeechRecognition),
    );
    setCanSpeak("speechSynthesis" in window);

    return () => {
      clearListenTimer();

      const current = recognition.current;
      recognition.current = null;

      if (current) {
        current.onstart = null;
        current.onend = null;
        current.onerror = null;
        current.onresult = null;
        current.abort();
      }

      const speech = utterance.current;
      utterance.current = null;

      if (speech) {
        speech.onstart = null;
        speech.onboundary = null;
        speech.onpause = null;
        speech.onresume = null;
        speech.onend = null;
        speech.onerror = null;
      }

      window.speechSynthesis?.cancel();
    };
  }, []);

  function stopSpeaking() {
    const current = utterance.current;
    utterance.current = null;

    if (current) {
      current.onstart = null;
      current.onboundary = null;
      current.onpause = null;
      current.onresume = null;
      current.onend = null;
      current.onerror = null;
    }

    window.speechSynthesis?.cancel();
    setSpeechMotion(undefined);
    setSpeaking(false);
  }

  function stopListening() {
    clearListenTimer();

    const current = recognition.current;
    recognition.current = null;

    if (current) {
      current.onstart = null;
      current.onend = null;
      current.onerror = null;
      current.onresult = null;
      current.abort();
    }

    setListening(false);
  }

  function startListening(language = "en-US") {
    if (recognition.current) return;

    const browser = window as VoiceWindow;
    const Constructor =
      browser.SpeechRecognition || browser.webkitSpeechRecognition;

    if (!Constructor) {
      setVoiceError("Voice input is unavailable here. Please type instead.");
      return;
    }

    stopSpeaking();
    setVoiceError("");

    const current = new Constructor();
    recognition.current = current;

    let receivedText = false;

    current.lang = language;
    current.continuous = false;
    current.interimResults = true;

    current.onstart = () => {
      if (recognition.current !== current) return;

      setListening(true);
      clearListenTimer();

      // Prevent the interface remaining in listening mode indefinitely.
      listenTimer.current = setTimeout(() => {
        if (recognition.current !== current) return;

        stopListening();

        if (!receivedText) {
          setVoiceError(
            "No speech transcript was received. Check your microphone, selected language and browser speech-recognition support, then try again.",
          );
        }
      }, 20000);
    };

    current.onresult = (event) => {
      if (recognition.current !== current) return;

      const text = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();

      if (text) {
        receivedText = true;
        setVoiceError("");
        transcriptHandler.current(text.slice(0, 1500));
      }
    };

    current.onerror = (event) => {
      if (recognition.current !== current) return;

      const errors: Record<string, string> = {
        "not-allowed":
          "Microphone or speech-recognition access was denied. Check browser permissions or type instead.",
        "service-not-allowed":
          "The browser’s speech-recognition service is unavailable or blocked. Try another supported browser.",
        "audio-capture":
          "No working microphone was found. Check your microphone settings.",
        "no-speech":
          "No speech was detected. Move closer to the microphone and try again.",
        network:
          "The speech-recognition service could not connect. Check your connection or try another browser.",
        "language-not-supported":
          "The selected voice language is unsupported in this browser. Try English or type instead.",
      };

      stopListening();

      if (event.error !== "aborted") {
        setVoiceError(
          errors[event.error] ||
            `Speech recognition failed (${event.error}). Please try again or type.`,
        );
      }
    };

    current.onend = () => {
      if (recognition.current !== current) return;

      clearListenTimer();
      recognition.current = null;
      setListening(false);

      if (!receivedText) {
        setVoiceError(
          "Listening ended without recognized words. Check the selected language and microphone, or try another browser.",
        );
      }
    };

    try {
      current.start();
    } catch {
      stopListening();
      setVoiceError("Could not start the microphone. Please try again.");
    }
  }

  function speak(text: string, language = "en-US") {
    stopListening();
    stopSpeaking();
    setVoiceError("");

    if (!("speechSynthesis" in window)) {
      setVoiceError("Spoken replies are unavailable. Read the written answer.");
      return;
    }

    if (!text.trim()) return;

    const current = new SpeechSynthesisUtterance(text.slice(0, 4000));
    utterance.current = current;
    current.lang = language;
    current.rate = 1;

    current.onstart = () => {
      if (utterance.current === current) {
        setSpeaking(true);
        setSpeechMotion({ text: current.text, index: 0, at: performance.now(), paused: false });
      }
    };

    current.onboundary = (event) => {
      if (utterance.current !== current || event.name === "sentence") return;
      setSpeechMotion({ text: current.text, index: event.charIndex, at: performance.now(), paused: false });
    };
    current.onpause = () => {
      if (utterance.current === current) setSpeechMotion((previous) => previous && { ...previous, paused: true });
    };
    current.onresume = () => {
      if (utterance.current === current) setSpeechMotion((previous) => previous && { ...previous, at: performance.now(), paused: false });
    };

    current.onend = () => {
      if (utterance.current === current) {
        utterance.current = null;
        setSpeechMotion(undefined);
        setSpeaking(false);
      }
    };

    current.onerror = () => {
      if (utterance.current === current) {
        utterance.current = null;
        setSpeechMotion(undefined);
        setSpeaking(false);
        setVoiceError("Audio could not play. Use Read aloud to try again.");
      }
    };

    try {
      window.speechSynthesis.speak(current);
    } catch {
      stopSpeaking();
      setVoiceError("Audio could not play. Please read the written answer.");
    }
  }

  return {
    canListen,
    canSpeak,
    listening,
    speaking,
    voiceError,
    speechMotion,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
}
