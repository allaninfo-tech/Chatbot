# Odd Shoes Growth Planner (Gemini + Next.js)

A custom marketing chatbot agent for **Odd Shoes** that reflects the brand mission: tech partnership for Christian founders, production-grade apps, and practical AI support.

This project includes:
- Next.js (App Router) frontend and API routes
- Bottom-right Growth Planner widget with smooth open/close animation
- Conversation context across turns
- Profile-aware personalization (stage, timeline, goal)
- Gemini-powered response generation (via serverless API)
- Quick replies, typing indicator, chat history scroll, and local persistence
- Optional privacy-aware email capture flow
- Vercel-ready deployment config
- Landing page with service comparison and hackathon fitboard

## Tech Stack

- Next.js + React + TypeScript
- Serverless API routes (`app/api/chat`, `app/api/lead`)
- Gemini Text Generation API (`generateContent`)
- Vercel deployment (`vercel.json`)

## Project Structure

```txt
app/
  api/
    chat/route.ts      # Gemini chat endpoint (edge runtime)
    lead/route.ts      # Optional lead capture endpoint (edge runtime)
  globals.css          # UI styling, animation, responsive behavior
  layout.tsx
  page.tsx
components/
  ChatWidget.tsx       # Growth Planner UI, client state, local storage
lib/
  brand.ts             # Odd Shoes tone, knowledge context, fallback guidance
  types.ts
.env.example
vercel.json
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill values:

```bash
cp .env.example .env.local
```

Required:
- `GEMINI_API_KEY` - your Gemini API key

Optional:
- `GEMINI_MODEL` (default: `gemini-2.0-flash`)
- `LEAD_WEBHOOK_URL` for forwarding email opt-ins to CRM/automation
- `NEXT_PUBLIC_BOOK_CALL_URL`
- `NEXT_PUBLIC_PROJECT_PLANNER_URL`

## Run Locally

1. Install dependencies:
```bash
npm install
```

2. Start dev server:
```bash
npm run dev
```

3. Open:
- `http://localhost:3000`

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the project into Vercel.
3. Add environment variables in Vercel Project Settings:
- `GEMINI_API_KEY`
- (optional) `GEMINI_MODEL`
- (optional) `LEAD_WEBHOOK_URL`
- (optional) public CTA URLs
4. Deploy.

`vercel.json` pins chat/lead routes to edge runtime and a default region for speed.

## Feature Mapping to Hackathon Criteria

- UX/UI (20%): conversion-focused landing, responsive planner, intentional visual hierarchy, quick actions
- Functionality (40%): service Q&A, contextual multi-turn chat, stage/timeline/goal capture, path recommendation, lead capture
- Innovation (15%): faith-centered brand voice + profile-aware prompting + guided conversion strategy
- Speed & Smoothness (10%): edge functions, trimmed context window, lightweight in-memory response cache
- Pitch Quality (15%): fitboard narrative from mission to measurable action

## HCU (Human-Centered UX) Choices

- Progressive disclosure: collect only stage, timeline, and goal first.
- Decision support: instant recommendation for MVP Development vs Kingdom Builder.
- Action clarity: one-click links for services, project planner, and discovery call.
- Continuity: local storage keeps context during revisits.

## Example Dialogues (Odd Shoes Voice)

### 1) Services
**User:** What services do you offer?

**Planner:** We partner with Christian founders to build production-grade apps and AI solutions. Most teams start in one of two tracks: MVP Development (launch your first real version quickly) or Kingdom Builder (long-term product growth and scaling). If you share your stage and timeline, I can recommend the best fit.

### 2) MVP vs Kingdom Builder
**User:** What is MVP Development vs Kingdom Builder?

**Planner:** Great question. Here’s the quick side-by-side:
- MVP Development: for validating a new idea fast with a focused scope.
- Kingdom Builder: for ongoing roadmap execution, scaling, and deeper AI/product iteration.
If your priority is proving demand, start with MVP. If you already have traction and need sustained delivery, Kingdom Builder is usually stronger.

### 3) Timeline
**User:** How quickly can you build a product?

**Planner:** Many focused MVPs can launch in roughly 4-8 weeks, depending on scope and integrations. The fastest path is aligning on a sharp v1 outcome first. If you want, I can help define a practical MVP scope before you book a call.

### 4) Start Working Together
**User:** How do I start working with Odd Shoes?

**Planner:** We usually start with a discovery call, align on mission + product goals, then map a delivery plan and sprint timeline. You can book here: https://www.oddshoes.dev/contact

## Notes

- If Gemini is not configured, the app returns a graceful setup message instead of crashing.
- Lead capture is opt-in only and can be connected to any webhook-compatible workflow.
- For production, connect `LEAD_WEBHOOK_URL` to your CRM or automation tool (HubSpot, Zapier, Make, custom backend).
