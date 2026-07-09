import Link from "next/link";

function formatTime(value) {
  if (!value) return "Unknown time";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function InquiryPage({ inquiries }) {
  return (
    <main className="page-root detail-page inquiry-page">
      <section className="screen-shell inquiry-shell">
        <header className="screen-topbar">
          <Link className="back-link" href="/dashboard">
            dashboard
          </Link>
          <div className="screen-heading">
            <p className="eyebrow">inquiry</p>
            <h1 className="screen-title">Customer inquiry</h1>
          </div>
        </header>

        <div className="inquiry-list">
          {inquiries.map((item) => (
            <article className="inquiry-card" key={item.id}>
              <div className="inquiry-card-head">
                <div>
                  <p className="inquiry-name">{item.customer}</p>
                  <p className="inquiry-question">{item.question}</p>
                </div>

                <div className="inquiry-chip-stack">
                  <span className="status-chip">{item.status || "open"}</span>
                  <span className="status-chip is-muted">
                    {item.currentAgent || "Unassigned"}
                  </span>
                </div>
              </div>

              <div className="inquiry-thread" aria-label={`Conversation for ${item.customer}`}>
                {item.thread.map((line, index) => (
                  <div
                    className={`thread-line ${line.role === "agent" ? "is-agent" : "is-customer"}`}
                    key={`${item.id}-${index}`}
                  >
                    <div className="thread-line-meta">
                      <span>{line.role === "agent" ? item.currentAgent || "agent" : "customer"}</span>
                      <time>{formatTime(line.createdAt)}</time>
                    </div>
                    <p>{line.message}</p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
