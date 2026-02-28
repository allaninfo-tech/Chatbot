import ChatWidget from "@/components/ChatWidget";

export default function HomePage() {
  return (
    <main className="site-shell">
      <section className="hero-simple">
        <p className="hero-kicker">Odd Shoes</p>
        <h1>
          Custom Marketing AI Assistant for Christian founders.
        </h1>
      </section>

      <ChatWidget />
    </main>
  );
}
