"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { QUICK_REPLIES } from "@/lib/brand";
import type { ChatMessage, ProspectProfile } from "@/lib/types";

const STORAGE_KEY = "odd-shoes-embedded-chat";

const INITIAL_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Welcome to Odd Shoes. Ask about services, timelines, MVP Development vs Kingdom Builder, or how to start working with us."
};

const BOOK_CALL_URL = process.env.NEXT_PUBLIC_BOOK_CALL_URL ?? "https://www.oddshoes.dev/contact";
const PROJECT_PLANNER_URL =
  process.env.NEXT_PUBLIC_PROJECT_PLANNER_URL ?? "https://www.oddshoes.dev/services";
const SERVICES_URL = "https://www.oddshoes.dev/services";

const EMPTY_PROFILE: ProspectProfile = {
  stage: "",
  timeline: "",
  goal: ""
};

function withQuickLinks(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("book") && !lower.includes("http")) {
    return `${message}\n\nBook here: ${BOOK_CALL_URL}`;
  }
  if ((lower.includes("planner") || lower.includes("scope")) && !lower.includes("http")) {
    return `${message}\n\nProject planner: ${PROJECT_PLANNER_URL}`;
  }
  if (lower.includes("service") && !lower.includes("http")) {
    return `${message}\n\nServices: ${SERVICES_URL}`;
  }
  return message;
}

function inferStage(text: string): string {
  const lower = text.toLowerCase();
  if (/(idea|just starting|validation|discover)/.test(lower)) {
    return "Idea / Discovery";
  }
  if (/(mvp|prototype|v1|first version)/.test(lower)) {
    return "Building MVP";
  }
  if (/(traction|live|users|revenue)/.test(lower)) {
    return "Live product with early traction";
  }
  if (/(scale|scaling|optimi|architecture|growth)/.test(lower)) {
    return "Scaling and optimization";
  }
  return "";
}

function inferTimeline(text: string): string {
  const lower = text.toLowerCase();
  if (/(asap|urgent|2 weeks|3 weeks|1 month|this month)/.test(lower)) {
    return "0-4 weeks";
  }
  if (/(4 weeks|5 weeks|6 weeks|7 weeks|8 weeks|two months|2 months)/.test(lower)) {
    return "4-8 weeks";
  }
  if (/(quarter|3 months|4 months|later this year)/.test(lower)) {
    return "2-4 months";
  }
  return "";
}

function mergeProfileFromText(profile: ProspectProfile, text: string): ProspectProfile {
  const stage = profile.stage || inferStage(text);
  const timeline = profile.timeline || inferTimeline(text);
  const goal = profile.goal || (text.length >= 20 ? text.slice(0, 220) : "");
  return { stage, timeline, goal };
}

function safeMessages(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) {
    return [INITIAL_MESSAGE];
  }

  const messages = input
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const row = item as { role?: unknown; content?: unknown };
      return {
        role: row.role === "user" ? "user" : "assistant",
        content: typeof row.content === "string" ? row.content : ""
      } as ChatMessage;
    })
    .filter((item) => item.content.trim().length > 0)
    .slice(-20);

  return messages.length > 0 ? messages : [INITIAL_MESSAGE];
}

function safeProfile(input: unknown): ProspectProfile {
  const row = (input ?? {}) as { stage?: unknown; timeline?: unknown; goal?: unknown };
  return {
    stage: typeof row.stage === "string" ? row.stage : "",
    timeline: typeof row.timeline === "string" ? row.timeline : "",
    goal: typeof row.goal === "string" ? row.goal : ""
  };
}

export default function ChatWidget() {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [profile, setProfile] = useState<ProspectProfile>(EMPTY_PROFILE);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [engine, setEngine] = useState<"gemini" | "fallback">("gemini");
  const [engineNotice, setEngineNotice] = useState("");

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as { messages?: unknown; profile?: unknown };
      setMessages(safeMessages(parsed.messages));
      setProfile(safeProfile(parsed.profile));
    } catch {
      // Ignore bad local storage payloads.
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        messages,
        profile
      })
    );
  }, [messages, profile]);

  const sendMessage = async (content: string): Promise<void> => {
    const userInput = content.trim();
    if (!userInput || isLoading) {
      return;
    }

    setError("");
    setEngineNotice("");
    setDraft("");

    const nextProfile = mergeProfileFromText(profile, userInput);
    setProfile(nextProfile);

    const updated = [...messages, { role: "user", content: userInput } as ChatMessage];
    setMessages(updated);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "fit-check",
          messages: updated,
          profile: nextProfile
        })
      });

      const data = (await response.json()) as {
        message?: string;
        source?: "gemini" | "fallback";
        notice?: string;
      };
      const assistantReply = data.message?.trim();

      if (!assistantReply) {
        setError("No response received. Please try again.");
        return;
      }

      setEngine(data.source === "fallback" ? "fallback" : "gemini");
      if (data.notice) {
        setEngineNotice(data.notice);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: withQuickLinks(assistantReply)
        }
      ]);
    } catch {
      setError("Chatbot is temporarily unavailable.");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendMessage(draft);
  };

  const resetChat = () => {
    setMessages([INITIAL_MESSAGE]);
    setProfile(EMPTY_PROFILE);
    setDraft("");
    setError("");
    setEngine("gemini");
    setEngineNotice("");
    window.localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <section className="embedded-chat" aria-label="Odd Shoes Marketing Chatbot">
      <header className="embedded-header">
        <div>
          <div className="chip-row">
            <p className="status-chip">Marketing AI Assistant</p>
            <p className={`engine-chip ${engine === "gemini" ? "live" : "degraded"}`}>
              {engine === "gemini" ? "Gemini Live" : "Smart Fallback"}
            </p>
          </div>
          <h2>Odd Shoes Growth Concierge</h2>
          <p className="embedded-subtitle">Faith-centered, conversion-first guidance.</p>
        </div>
        <button className="reset-btn" onClick={resetChat} aria-label="Reset chat">
          Reset
        </button>
      </header>

      <div className="quick-replies-wrap">
        <p className="reply-label">Starter prompts</p>
        <div className="quick-replies" role="list" aria-label="Quick replies">
          {QUICK_REPLIES.map((label) => (
            <button key={label} onClick={() => void sendMessage(label)} type="button">
              {label}
            </button>
          ))}
        </div>
      </div>

      <section ref={scrollRef} className="chat-scroll">
        {engineNotice ? <p className="engine-notice">{engineNotice}</p> : null}
        {messages.map((message, idx) => (
          <div key={`${message.role}-${idx}`} className={`message ${message.role}`}>
            {message.content}
          </div>
        ))}
        {isLoading && (
          <div className="message assistant">
            <div className="typing" aria-label="Chatbot is thinking">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
      </section>

      <div className="chat-input-wrap">
        <form className="chat-form" onSubmit={onSubmit}>
          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask about services, timelines, MVP vs Kingdom Builder..."
            aria-label="Message"
          />
          <button type="submit" disabled={isLoading || draft.trim().length === 0}>
            Send {"->"}
          </button>
        </form>
        <p className="input-hint">Try: "Which service fits my startup stage?"</p>
        {error ? <p className="error-text">{error}</p> : null}
      </div>
    </section>
  );
}
