import { DashboardCarousel } from "../../components/dashboard-carousel";

export default function DashboardPage() {
  return (
    <main className="page-root dashboard-page">
      <section className="dashboard-shell">
        <header className="dashboard-hero">
          <p className="eyebrow">watch party admin</p>
          <h1 className="dashboard-title-main">choose a room</h1>
          <p className="dashboard-lede">
            Swipe through the live sections. Each card opens the same polished
            flow, just tuned for a different kind of guest list.
          </p>
        </header>

        <DashboardCarousel />
      </section>
    </main>
  );
}
