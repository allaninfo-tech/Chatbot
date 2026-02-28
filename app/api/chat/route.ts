import { BRAND_SYSTEM_PROMPT, fallbackGuidance } from "@/lib/brand";
import type { ChatMessage, MarketingMode, ProspectProfile } from "@/lib/types";

export const runtime = "edge";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta";
const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
const CACHE_TTL_MS = 1000 * 60 * 3;

type CacheEntry = {
  expiresAt: number;
  text: string;
};

const responseCache = new Map<string, CacheEntry>();

function normalizeMessages(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter((m) => m && typeof m === "object")
    .map((m) => {
      const item = m as { role?: unknown; content?: unknown };
      const role = item.role === "assistant" ? "assistant" : "user";
      const content = typeof item.content === "string" ? item.content.trim() : "";
      return { role, content } as ChatMessage;
    })
    .filter((m) => m.content.length > 0)
    .slice(-12);
}

function cacheKey(messages: ChatMessage[]): string {
  const last = messages[messages.length - 1]?.content ?? "";
  const prev = messages[messages.length - 2]?.content ?? "";
  return `${last.toLowerCase()}::${prev.toLowerCase()}`;
}

function getCachedResponse(key: string): string | null {
  const match = responseCache.get(key);
  if (!match) {
    return null;
  }
  if (Date.now() > match.expiresAt) {
    responseCache.delete(key);
    return null;
  }
  return match.text;
}

function setCachedResponse(key: string, text: string): void {
  responseCache.set(key, {
    text,
    expiresAt: Date.now() + CACHE_TTL_MS
  });
}

function mapToGeminiContents(messages: ChatMessage[]) {
  return messages.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }]
  }));
}

function normalizeProfile(input: unknown): ProspectProfile {
  const item = (input ?? {}) as {
    stage?: unknown;
    timeline?: unknown;
    goal?: unknown;
  };
  return {
    stage: typeof item.stage === "string" ? item.stage.trim().slice(0, 80) : "",
    timeline: typeof item.timeline === "string" ? item.timeline.trim().slice(0, 80) : "",
    goal: typeof item.goal === "string" ? item.goal.trim().slice(0, 220) : ""
  };
}

function normalizeMode(input: unknown): MarketingMode {
  const value = typeof input === "string" ? input : "";
  if (value === "offer-clarity") {
    return "offer-clarity";
  }
  if (value === "objection-handling") {
    return "objection-handling";
  }
  if (value === "launch-plan") {
    return "launch-plan";
  }
  return "fit-check";
}

function modeContext(mode: MarketingMode): string {
  if (mode === "offer-clarity") {
    return [
      "Conversation mode: Offer Clarity.",
      "Focus on outcome-driven explanation of services, ideal buyers, and key differentiators."
    ].join("\n");
  }
  if (mode === "objection-handling") {
    return [
      "Conversation mode: Objection Handling.",
      "Address concerns around timeline, budget, trust, and technical risk with practical and honest framing."
    ].join("\n");
  }
  if (mode === "launch-plan") {
    return [
      "Conversation mode: Launch Plan.",
      "Provide a concrete 30-60-90 day style action plan and next CTA."
    ].join("\n");
  }
  return [
    "Conversation mode: Fit Check.",
    "Quickly determine if MVP Development or Kingdom Builder is the right path."
  ].join("\n");
}

function profileContext(profile: ProspectProfile): string {
  if (!profile.stage && !profile.timeline && !profile.goal) {
    return "";
  }

  return [
    "Visitor context captured from the planner:",
    `- Stage: ${profile.stage || "Unknown"}`,
    `- Timeline: ${profile.timeline || "Unknown"}`,
    `- Goal: ${profile.goal || "Unknown"}`,
    "Use this context when recommending services and next actions."
  ].join("\n");
}

function extractGeminiText(payload: unknown): string | null {
  const data = payload as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const parts = data?.candidates?.[0]?.content?.parts;
  if (!parts || parts.length === 0) {
    return null;
  }

  return parts
    .map((p) => p.text?.trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as {
      messages?: unknown;
      profile?: unknown;
      mode?: unknown;
    };
    const messages = normalizeMessages(body.messages);
    const profile = normalizeProfile(body.profile);
    const mode = normalizeMode(body.mode);
    const apiKey = process.env.GEMINI_API_KEY;

    if (messages.length === 0) {
      return Response.json({ error: "No messages provided." }, { status: 400 });
    }

    if (!apiKey) {
      return Response.json(
        {
          message:
            "Gemini API is not configured yet. Add GEMINI_API_KEY to continue.\n\nYou can still explore services here: https://www.oddshoes.dev/services"
        },
        { status: 200 }
      );
    }

    const key = cacheKey(messages);
    const cached = getCachedResponse(key);
    if (cached) {
      return Response.json({ message: cached, cached: true }, { status: 200 });
    }

    const profileText = profileContext(profile);
    const modeText = modeContext(mode);
    const contents = mapToGeminiContents(messages);
    contents.unshift({
      role: "user",
      parts: [{ text: modeText }]
    });
    if (profileText) {
      contents.unshift({
        role: "user",
        parts: [{ text: profileText }]
      });
    }

    const result = await fetch(`${GEMINI_URL}/models/${MODEL}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: BRAND_SYSTEM_PROMPT }]
        },
        contents,
        generationConfig: {
          temperature: 0.55,
          topP: 0.9,
          maxOutputTokens: 500
        }
      })
    });

    if (!result.ok) {
      const errorText = await result.text();
      return Response.json(
        {
          message: fallbackGuidance(),
          error: `Gemini request failed (${result.status}): ${errorText.slice(0, 180)}`
        },
        { status: 200 }
      );
    }

    const payload = await result.json();
    const text = extractGeminiText(payload);
    const output = text && text.length > 0 ? text : fallbackGuidance();

    setCachedResponse(key, output);
    return Response.json({ message: output }, { status: 200 });
  } catch {
    return Response.json({ message: fallbackGuidance() }, { status: 200 });
  }
}
