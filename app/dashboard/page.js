import { DashboardCarousel } from "../../components/dashboard-carousel";

export default function DashboardPage() {
  return (
    <main className="page-root dashboard-page">
      <section className="dashboard-shell">
        <header className="dashboard-hero">
          <p className="eyebrow">watch party admin</p>
          <h1 className="dashboard-title-main">vault</h1>
          <p className="dashboard-lede">guest ledger</p>
        </header>

        <DashboardCarousel />
      </section>
    </main>
  );
}
