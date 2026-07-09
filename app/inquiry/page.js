import Link from "next/link";
import { fetchAdminInquiries } from "../../lib/admin-api";

export default async function InquiryPage() {
  const inquiries = await fetchAdminInquiries();

  return (
    <main className="page-root inquiry-page">
      <section className="inquiry-shell">
        <header className="dashboard-header">
          <p className="eyebrow">inquiry</p>
          <h1 className="dashboard-title">Customer inquiries</h1>
          <p className="home-copy">FAQ chatbot escalations and current agent handoff status.</p>
        </header>

        <div className="inquiry-topbar">
          <span>Current owner is recorded per inquiry.</span>
          <Link className="back-link" href="/dashboard">Back to dashboard</Link>
        </div>

        <div className="inquiry-list">
          {inquiries.map((item) => (
            <article className="inquiry-card" key={item.id}>
              <div className="inquiry-meta">
                <strong>{item.customer}</strong>
                <span>{item.currentAgent}</span>
              </div>
              <p className="inquiry-question">{item.question}</p>
              <div className="inquiry-thread">
                {item.thread.map((line, index) => (
                  <div className="thread-line" key={`${item.id}-${index}`}>
                    <span>{line.role}</span>
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
