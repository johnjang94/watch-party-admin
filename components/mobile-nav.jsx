"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function HomeIcon({ active }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`nav-icon ${active ? "is-active" : ""}`}>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6.2h-5V21H5a1 1 0 0 1-1-1z" />
    </svg>
  );
}

function ProfileIcon({ active }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`nav-icon ${active ? "is-active" : ""}`}>
      <path d="M12 12.2a4.1 4.1 0 1 0 0-8.2 4.1 4.1 0 0 0 0 8.2Zm0 1.8c-4.2 0-7.5 2.4-7.5 5.3V21h15v-1.7c0-2.9-3.3-5.3-7.5-5.3Z" />
    </svg>
  );
}

function ScanIcon({ active }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`nav-icon ${active ? "is-active" : ""}`}>
      <path d="M6 5.5A1.5 1.5 0 0 1 7.5 4h2v2h-2v2h-2v-2H4v-2h2Zm8 0V4h2.5A1.5 1.5 0 0 1 18 5.5v2h-2v-2h-2Zm0 13V21H18a1.5 1.5 0 0 0 1.5-1.5v-2h-2v2h-3.5Zm-8-3v2h2v2h-2A1.5 1.5 0 0 1 4 18.5v-2h2Zm1-9h8v8H7V6.5Zm2 2v4h4v-4H9Zm9.5 1.5h-2v2h2v-2Zm-14 0h2v-2h-2v2Zm14 4h-2v2h2v-2Zm-14 0h2v2h-2v-2Z" />
    </svg>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  if (isHome) return null;

  const isDashboard =
    pathname === "/dashboard" ||
    pathname === "/new" ||
    pathname === "/all" ||
    pathname === "/inquiry";
  const isProfile = pathname === "/profile";
  const isScan = pathname === "/scan";

  return (
    <nav className="mobile-nav" aria-label="Primary">
      <Link className={`mobile-nav-item ${isDashboard ? "is-active" : ""}`} href="/dashboard">
        <HomeIcon active={isDashboard} />
        <span>Home</span>
      </Link>
      <Link className={`mobile-nav-item ${isScan ? "is-active" : ""}`} href="/scan">
        <ScanIcon active={isScan} />
        <span>Scan</span>
      </Link>
      <Link className={`mobile-nav-item ${isProfile ? "is-active" : ""}`} href="/profile">
        <ProfileIcon active={isProfile} />
        <span>Profile</span>
      </Link>
    </nav>
  );
}
