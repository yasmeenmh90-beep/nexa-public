import { useEffect, useRef, useState } from "react";

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

  const recognition = useRef<Recognition | null>(null);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const transcriptHandler = useRef(onTranscript);
  transcriptHandler.current = onTranscript;

  useEffect(() => {
    const browser = window as VoiceWindow;
    setCanListen(
      Boolean(browser.SpeechRecognition || browser.webkitSpeechRecognition),
    );
    setCanSpeak("speechSynthesis" in window);

    return () => {
      const current = recognition.current;
      if (current) {
        current.onstart = null;
        current.onend = null;
        current.onerror = null;
        current.onresult = null;
        current.abort();
      }

      if (utterance.current) {
        utterance.current.onend = null;
        utterance.current.onerror = null;
      }

      window.speechSynthesis?.cancel();
    };
  }, []);

  function stopSpeaking() {
    if (utterance.current) {
      utterance.current.onend = null;
      utterance.current.onerror = null;
      utterance.current = null;
    }

    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }

  function stopListening() {
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
    current.lang = language;
    current.continuous = false;
    current.interimResults = false;

    current.onstart = () => {
      if (recognition.current === current) setListening(true);
    };

    current.onresult = (event) => {
      if (recognition.current !== current) return;
      const text = event.results[0]?.[0]?.transcript?.trim();
      if (text) transcriptHandler.current(text.slice(0, 1500));
    };

    current.onerror = (event) => {
      if (recognition.current !== current) return;

      setVoiceError(
        event.error === "not-allowed"
          ? "Microphone access was denied. Allow it in browser settings or type."
          : "Speech could not be recognized. Please try again or type.",
      );
      stopListening();
    };

    current.onend = () => {
      if (recognition.current === current) {
        recognition.current = null;
        setListening(false);
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
      setVoiceError("Spoken replies are unavailable. Read the answer below.");
      return;
    }

    const current = new SpeechSynthesisUtterance(text.slice(0, 4000));
    utterance.current = current;
    current.lang = language;
    current.rate = 1;

    current.onstart = () => {
      if (utterance.current === current) setSpeaking(true);
    };

    current.onend = () => {
      if (utterance.current === current) {
        utterance.current = null;
        setSpeaking(false);
      }
    };

    current.onerror = () => {
      if (utterance.current === current) {
        utterance.current = null;
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
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
}
