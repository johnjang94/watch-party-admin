import "./globals.css";

export const metadata = {
  title: "FIFA Admin",
  description: "Admin dashboard for invite requests.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
