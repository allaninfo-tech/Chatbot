export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ProspectProfile {
  stage: string;
  timeline: string;
  goal: string;
}

export type MarketingMode = "fit-check" | "offer-clarity" | "objection-handling" | "launch-plan";
