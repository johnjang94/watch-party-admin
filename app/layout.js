import "./globals.css";
import { MobileNav } from "../components/mobile-nav";
import { AdminSessionGuard } from "../components/admin-session-guard";

export const metadata = {
  title: "Watch Party Admin",
  description: "Mobile-first admin console for signups and inquiries.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AdminSessionGuard />
        {children}
        <MobileNav />
      </body>
    </html>
  );
}
