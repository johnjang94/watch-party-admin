import { DashboardCarousel } from "../../components/dashboard-carousel";

export default function DashboardPage() {
  return (
    <main className="page-root dashboard-page">
      <section className="dashboard-shell">
        <DashboardCarousel />
      </section>
    </main>
  );
}
