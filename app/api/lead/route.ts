export const runtime = "edge";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as {
      email?: unknown;
      consent?: unknown;
      source?: unknown;
    };

    const email = typeof body.email === "string" ? body.email.trim() : "";
    const consent = body.consent === true;
    const source = typeof body.source === "string" ? body.source : "chat-widget";

    if (!isValidEmail(email)) {
      return Response.json({ error: "Please provide a valid email." }, { status: 400 });
    }

    if (!consent) {
      return Response.json(
        { error: "Consent is required before subscribing for updates." },
        { status: 400 }
      );
    }

    const webhook = process.env.LEAD_WEBHOOK_URL;
    if (webhook) {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          consent,
          source,
          capturedAt: new Date().toISOString()
        })
      });
    }

    return Response.json(
      {
        ok: true,
        message:
          "Thanks for subscribing. We’ll share product-building insights and updates from the Odd Shoes team."
      },
      { status: 200 }
    );
  } catch {
    return Response.json(
      { error: "Could not submit right now. Please try again in a moment." },
      { status: 500 }
    );
  }
}

