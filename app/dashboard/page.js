import Link from "next/link";

const cards = [
  { href: "/new", title: "new", description: "Recent signups from the last 24 hours.", span: "wide" },
  { href: "/all", title: "all", description: "Every signup in the full history." },
  { href: "/inquiry", title: "inquiry", description: "Chatbot escalations and agent handoff." },
];

export default function DashboardPage() {
  return (
    <main className="page-root dashboard-page">
      <section className="dashboard-shell">
        <header className="dashboard-header">
          <p className="eyebrow">dashboard</p>
          <h1 className="dashboard-title">Admin actions</h1>
        </header>

        <div className="dashboard-grid">
          {cards.map((card) => (
            <Link key={card.title} href={card.href} className={`dashboard-card ${card.span === "wide" ? "is-wide" : ""}`}>
              <span className="card-label">{card.title}</span>
              <p>{card.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
