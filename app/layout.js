import "./globals.css";
import { MobileNav } from "../components/mobile-nav";

export const metadata = {
  title: "Watch Party Admin",
  description: "Mobile-first admin console for signups and inquiries.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <MobileNav />
      </body>
    </html>
  );
}
