import type { ChatMessage, MarketingMode, ProspectProfile } from "@/lib/types";

function hasAny(text: string, words: string[]): boolean {
  return words.some((word) => text.includes(word));
}

function baseCTA(profile: ProspectProfile): string {
  const summary = [
    profile.stage ? `Stage: ${profile.stage}` : "",
    profile.timeline ? `Timeline: ${profile.timeline}` : "",
    profile.goal ? `Goal: ${profile.goal}` : ""
  ]
    .filter(Boolean)
    .join(" | ");

  if (!summary) {
    return "Next step: share your stage + timeline so I can map your best starting offer.";
  }

  return `Context noted (${summary}). Next step: book a discovery call: https://www.oddshoes.dev/contact`;
}

function fitCheckResponse(profile: ProspectProfile): string {
  const stage = profile.stage.toLowerCase();
  if (stage.includes("scale") || stage.includes("traction")) {
    return [
      "Best fit: Kingdom Builder.",
      "You likely need ongoing product velocity, roadmap execution, and architecture support rather than a one-off MVP sprint.",
      baseCTA(profile)
    ].join("\n\n");
  }

  if (stage.includes("idea") || stage.includes("mvp") || profile.timeline === "0-4 weeks") {
    return [
      "Best fit: MVP Development.",
      "You likely need a focused v1 scope to ship quickly and validate with real users.",
      baseCTA(profile)
    ].join("\n\n");
  }

  return [
    "Fast fit check: MVP Development is best for new concepts; Kingdom Builder is best for scaling live products.",
    baseCTA(profile)
  ].join("\n\n");
}

function offerClarityResponse(): string {
  return [
    "Odd Shoes offers two core paths:",
    "1) MVP Development: launch a production-grade v1 quickly.",
    "2) Kingdom Builder: long-term product growth, scaling, and iteration.",
    "If your priority is validation, choose MVP. If your priority is sustained velocity, choose Kingdom Builder.",
    "Explore services: https://www.oddshoes.dev/services"
  ].join("\n");
}

function objectionHandlingResponse(): string {
  return [
    "If your concern is timeline: start with a focused MVP scope to reduce risk.",
    "If your concern is cost: prioritize core flows first, then phase enhancements.",
    "If your concern is trust: begin with a discovery call and a clear delivery plan.",
    "If your concern is technical risk: use production-grade architecture from day one.",
    "Book a call for a custom plan: https://www.oddshoes.dev/contact"
  ].join("\n");
}

function launchPlanResponse(profile: ProspectProfile): string {
  return [
    "Suggested 30-60-90 launch path:",
    "30 days: define scope, user flows, and core success metric.",
    "60 days: build core product features and integrations.",
    "90 days: launch, gather real user feedback, and iterate.",
    baseCTA(profile)
  ].join("\n");
}

export function localMarketingResponse(args: {
  messages: ChatMessage[];
  profile: ProspectProfile;
  mode: MarketingMode;
}): string {
  const lastUserMessage =
    [...args.messages].reverse().find((message) => message.role === "user")?.content.toLowerCase() ??
    "";

  if (args.mode === "offer-clarity") {
    return offerClarityResponse();
  }
  if (args.mode === "objection-handling") {
    return objectionHandlingResponse();
  }
  if (args.mode === "launch-plan") {
    return launchPlanResponse(args.profile);
  }

  if (hasAny(lastUserMessage, ["mvp", "kingdom builder", "difference", "vs", "compare"])) {
    return [
      "MVP Development vs Kingdom Builder:",
      "- MVP Development: fast, focused build for validating a new idea.",
      "- Kingdom Builder: ongoing partnership for scaling and product maturity.",
      baseCTA(args.profile)
    ].join("\n");
  }

  if (hasAny(lastUserMessage, ["service", "offer", "what do you do"])) {
    return offerClarityResponse();
  }

  if (hasAny(lastUserMessage, ["how fast", "timeline", "how quickly", "launch"])) {
    return [
      "Most focused MVP builds can launch in about 4-8 weeks depending on scope and integrations.",
      "The fastest path is defining a sharp v1 outcome before engineering begins.",
      baseCTA(args.profile)
    ].join("\n\n");
  }

  if (hasAny(lastUserMessage, ["price", "pricing", "cost", "budget", "roi"])) {
    return [
      "Odd Shoes focuses on outcome-first ROI: prioritize high-impact features first, ship early, and iterate from real user data.",
      "For exact pricing, scope and timeline are required.",
      "Book discovery for a custom quote: https://www.oddshoes.dev/contact"
    ].join("\n\n");
  }

  if (hasAny(lastUserMessage, ["start", "work with", "get started", "begin"])) {
    return [
      "Start process:",
      "1) Discovery call",
      "2) Scope and success metric alignment",
      "3) Execution plan and sprint kickoff",
      "Book here: https://www.oddshoes.dev/contact"
    ].join("\n");
  }

  if (hasAny(lastUserMessage, ["mission", "faith", "christian", "kingdom"])) {
    return [
      "Odd Shoes partners with Christian founders to build production-grade apps and AI solutions with mission alignment and practical execution.",
      baseCTA(args.profile)
    ].join("\n\n");
  }

  return fitCheckResponse(args.profile);
}

