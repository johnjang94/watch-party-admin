import Image from "next/image";
import heroImage from "../../image.png";
import { DashboardCarousel } from "../../components/dashboard-carousel";

export const metadata = {
  title: "Dashboard | Watch Party Admin",
};

export default function DashboardPage() {
  return (
    <main className="page-root overview-page">
      <div className="page-background" aria-hidden="true">
        <Image
          alt=""
          className="page-background-image"
          fill
          priority
          sizes="100vw"
          src={heroImage}
        />
        <div className="page-background-overlay" />
      </div>
      <section className="overview-shell">
        <DashboardCarousel />
      </section>
    </main>
  );
}
