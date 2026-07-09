import "./globals.css";
import { MobileNav } from "../components/mobile-nav";
import { AdminSessionGuard } from "../components/admin-session-guard";

export const metadata = {
  title: "Watch Party Admin",
  description: "Mobile-first admin console for signups and inquiries.",
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
