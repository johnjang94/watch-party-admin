import Link from "next/link";

const cards = [
  { href: "/new", title: "new", span: "wide" },
  { href: "/all", title: "all" },
  { href: "/inquiry", title: "inquiry" },
];

export default function DashboardPage() {
  return (
    <main className="page-root dashboard-page">
      <section className="screen-shell dashboard-shell">
        <div className="dashboard-grid">
          {cards.map((card) => (
            <Link key={card.title} href={card.href} className={`dashboard-card ${card.span === "wide" ? "is-wide" : ""}`}>
              <span className="card-label">{card.title}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
