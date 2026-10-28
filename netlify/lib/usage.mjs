// Daily usage limits for the public live chat.
// Counts are kept in Netlify Blobs per UTC day: one counter per visitor and one for the whole site.
// Visitors are identified only by a salted SHA-256 hash of their IP address and the day,
// so no raw IP address is stored and counters from different days cannot be linked.
import { getStore } from "@netlify/blobs";

const STORE_NAME = "nexa-chat-usage";
let testStore = null;

/** Tests only: replace Netlify Blobs with an in-memory store (pass null to restore). */
export function useUsageStore(store) {
  testStore = store;
}

function store() {
  return testStore ?? getStore({ name: STORE_NAME, consistency: "strong" });
}

function whole(value, fallback, min, max) {
  const number = Number.parseInt(value ?? "", 10);
  return Number.isFinite(number) && number >= min && number <= max ? number : fallback;
}

export function limits() {
  return {
    perVisitor: whole(process.env.NEXA_CHAT_DAILY_PER_VISITOR, 10, 1, 200),
    total: whole(process.env.NEXA_CHAT_DAILY_TOTAL, 100, 1, 5000),
  };
}

/** The current UTC day and the moment the next one starts. */
export function today(now = new Date()) {
  const day = now.toISOString().slice(0, 10);
  const resetAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return { day, resetAt: resetAt.toISOString() };
}

async function visitorId(request, day) {
  const ip = request.headers.get("x-nf-client-connection-ip")
    || request.headers.get("x-forwarded-for")?.split(",")[0].trim()
    || "unknown";
  const salt = process.env.NEXA_CHAT_SALT || "nexa-public-chat";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${day}:${ip}`));
  return Array.from(new Uint8Array(digest).slice(0, 16), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function count(key) {
  const entry = await store().getWithMetadata(key, { type: "json" });
  return entry ? Number(entry.data) || 0 : 0;
}

// Adds one to a counter unless it has reached the limit. Uses ETag checks so that
// two requests arriving together cannot both take the last message.
async function take(key, limit) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const entry = await store().getWithMetadata(key, { type: "json" });
    const used = entry ? Number(entry.data) || 0 : 0;
    if (used >= limit) return { ok: false, used };
    const result = entry
      ? await store().setJSON(key, used + 1, { onlyIfMatch: entry.etag })
      : await store().setJSON(key, 1, { onlyIfNew: true });
    if (result?.modified) return { ok: true, used: used + 1 };
  }
  throw new Error("Usage counter is busy.");
}

/** Read-only view of today's usage for this visitor. */
export async function readUsage(request, now = new Date()) {
  const { day, resetAt } = today(now);
  const { perVisitor, total } = limits();
  const [used, siteUsed] = await Promise.all([
    count(`${day}/visitor/${await visitorId(request, day)}`),
    count(`${day}/total`),
  ]);
  return {
    limit: perVisitor,
    remaining: Math.max(0, perVisitor - used),
    resetAt,
    paused: siteUsed >= total,
  };
}

/**
 * Reserves one live message for this visitor.
 * Returns { ok: true, limit, remaining, resetAt } or { ok: false, reason: "visitor" | "site", ... }.
 * The visitor's own limit is checked first, so one visitor cannot use up the site-wide allowance.
 */
export async function reserveMessage(request, now = new Date()) {
  const { day, resetAt } = today(now);
  const { perVisitor, total } = limits();
  const mine = await take(`${day}/visitor/${await visitorId(request, day)}`, perVisitor);
  if (!mine.ok) return { ok: false, reason: "visitor", limit: perVisitor, remaining: 0, resetAt };
  const site = await take(`${day}/total`, total);
  if (!site.ok) return { ok: false, reason: "site", limit: perVisitor, remaining: perVisitor - mine.used, resetAt };
  return { ok: true, limit: perVisitor, remaining: perVisitor - mine.used, resetAt };
}

/** A small in-memory stand-in for Netlify Blobs, used by the tests. */
export function memoryStore() {
  const data = new Map();
  let version = 0;
  return {
    async getWithMetadata(key) {
      const entry = data.get(key);
      return entry ? { data: entry.value, etag: entry.etag, metadata: {} } : null;
    },
    async setJSON(key, value, options = {}) {
      const current = data.get(key);
      if (options.onlyIfNew && current) return { modified: false };
      if (options.onlyIfMatch && current?.etag !== options.onlyIfMatch) return { modified: false };
      const etag = `v${++version}`;
      data.set(key, { value, etag });
      return { modified: true, etag };
    },
  };
}
