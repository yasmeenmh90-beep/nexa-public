
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });

export default async function handler(request) {
  if (request.method !== "POST") {
    return json({ error: "Use POST." }, 405);
  }

  // Server-side switch for controlling public API usage.
  if (process.env.NEXA_LIVE_CHAT_ENABLED !== "true") {
    return json({ error: "Live chat is not enabled yet." }, 503);
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

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return json({ error: "Live chat is not configured." }, 503);
  }

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

    return json({ reply });
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
