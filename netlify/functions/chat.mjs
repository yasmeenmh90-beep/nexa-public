import { readUsage, reserveMessage } from "../lib/usage.mjs";


const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });

export default async function handler(request) {
  if (request.method === "GET") {
    // Read-only: lets the page show how many live messages this visitor has left today.
    if (process.env.NEXA_LIVE_CHAT_ENABLED !== "true") return json({ enabled: false });
    try {
      return json({ enabled: true, ...(await readUsage(request)) });
    } catch {
      return json({ enabled: true, unavailable: true });
    }
  }
  if (request.method !== "POST") {
    return json({ error: "Use POST." }, 405);
  }

  // Server-side switch for controlling public API usage.
  if (process.env.NEXA_LIVE_CHAT_ENABLED !== "true") {
    return json({ error: "Live chat is not enabled yet.", code: "disabled" }, 503);
  }

  const origin = request.headers.get("origin");
  if (origin !== "https://nexa-public.netlify.app") {
    return json({ error: "Request not allowed." }, 403);
  }

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return json({ error: "Send JSON." }, 415);
  }

  let raw;
  try { raw = await request.text(); } catch {
    return json({ error: "Could not read the request." }, 400);
  }
  if (new TextEncoder().encode(raw).length > 48000) {
    return json({ error: "Request is too large." }, 413);
  }

  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "Invalid JSON." }, 400);
  }

  const message =
    typeof body?.message === "string" ? body.message.trim() : "";

  if (!message || message.length > 1500) {
    return json({ error: "Enter a message of 1–1500 characters." }, 400);
  }

  const history = body.history ?? [];
  if (!Array.isArray(history) || history.length > 6 || history.length % 2 !== 0) {
    return json({ error: "Invalid conversation history. Reset the chat." }, 400);
  }
  let historyLength = 0;
  const context = [];
  for (let index = 0; index < history.length; index++) {
    const item = history[index];
    if (!item || item.role !== (index % 2 === 0 ? "user" : "assistant") ||
        typeof item.content !== "string" || !item.content.trim() || item.content.length > 2000) {
      return json({ error: "Invalid conversation history. Reset the chat." }, 400);
    }
    historyLength += item.content.length;
    context.push({ role: item.role, content: item.content });
  }
  if (historyLength > 6000) {
    return json({ error: "Conversation context is too long. Reset the chat." }, 400);
  }

  const purpose = body.purpose ?? "general";
  if (!["general", "interview"].includes(purpose)) {
    return json({ error: "Choose a supported chat mode." }, 400);
  }
  let practiceInstruction = "";
  if (purpose === "interview") {
    const track = body.interview?.track ?? "ai-ml";
    const level = body.interview?.level ?? "beginner";
    const tracks = {
      "ai-ml": "AI and machine learning",
      "full-stack": "full-stack web development",
      backend: "backend software engineering",
    };
    if (typeof track !== "string" || !Object.hasOwn(tracks, track) || !["beginner", "intermediate"].includes(level)) {
      return json({ error: "Choose a supported interview track and level." }, 400);
    }
    practiceInstruction = [
      "You are conducting an educational practice interview, not a hiring assessment.",
      "The topic is " + tracks[track] + " at " + level + " level.",
      "On starting a session, ask exactly one concise technical question and wait for the answer.",
      "When the user answers, give brief feedback: one strength, one concrete improvement,",
      "and a short stronger example if helpful, then ask one next question.",
      "If the user requests a hint, give a hint for the current question without advancing.",
      "If the user asks for an example answer, explain one before offering the next question.",
      "Treat irrelevant text as a request to refocus, not as an interview answer.",
      "Never invent the user's employment history, personal achievements or experience.",
      "Do not infer protected attributes, give hiring predictions or claim a validated score.",
      "Keep feedback encouraging, specific, technically grounded and concise.",
    ].join(" ");
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return json({ error: "Live chat is not configured." }, 503);
  }

  // Daily limits: each visitor gets a few live messages per day, and the whole site has a cap.
  // If the counter cannot be reached, the chat stays closed rather than spending without a limit.
  let usage;
  try {
    usage = await reserveMessage(request);
  } catch {
    return json({ error: "Live chat is resting right now. Please try again later.", code: "unavailable" }, 503);
  }
  if (!usage.ok) {
    const error = usage.reason === "visitor"
      ? `You have used today's ${usage.limit} live messages.`
      : "Live chat has reached today's limit for all visitors.";
    return json({ error, code: usage.reason === "visitor" ? "daily_limit" : "site_limit",
      limit: usage.limit, remaining: usage.remaining, resetAt: usage.resetAt }, 429);
  }
  const usageInfo = { limit: usage.limit, remaining: usage.remaining, resetAt: usage.resetAt };

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        store: false,
        max_output_tokens: 400,
        instructions: [
          "You are NEXA, a friendly public AI assistant.",
          "Answer clearly and concisely in the user's language.",
          "You can answer general questions and explain NEXA.",
          "NEXA is Yasmeen Azmat Ali's AI engineering project.",
          "Its private n8n workflows are separate from this public chat.",
          "You have no access to personal accounts, email, calendars,",
          "repositories, private memory, live web search or external actions.",
          "Never claim to have checked or changed those services.",
          "Do not request passwords, API keys or other credentials.",
          practiceInstruction,
        ].join(" "),
        input: [...context, { role: "user", content: message }],
      }),
    });

    if (!response.ok) {
      return json(
        { error: "AI service unavailable. Please try again later." },
        response.status === 429 ? 429 : 502,
      );
    }

    const data = await response.json();
    const reply = (data.output ?? [])
      .flatMap((item) => item.content ?? [])
      .filter((item) => item.type === "output_text")
      .map((item) => item.text)
      .join("\n")
      .trim();

    if (!reply) {
      return json({ error: "No answer returned. Please try again." }, 502);
    }

    return json({ reply, usage: usageInfo });
  } catch {
    return json({ error: "The request failed or timed out. Try again." }, 502);
  }
}

export const config = {
  path: "/api/chat",
  rateLimit: {
    windowLimit: 5,
    windowSize: 60,
    aggregateBy: ["ip", "domain"],
  },
};
