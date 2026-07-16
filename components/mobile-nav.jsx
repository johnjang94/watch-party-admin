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

function CameraIcon({ active }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`nav-icon ${active ? "is-active" : ""}`}>
      <path d="M9 5.5 10.2 4h3.6L15 5.5h2.5A2.5 2.5 0 0 1 20 8v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16V8a2.5 2.5 0 0 1 2.5-2.5H9Zm3 2.5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z" />
    </svg>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  if (isHome) return null;

  const isDashboard =
    pathname === "/dashboard" ||
    pathname === "/portal-preview" ||
    pathname === "/registered" ||
    pathname === "/waitlisted" ||
    pathname === "/inquiry";
  const isProfile = pathname === "/profile";
  const isScan = pathname === "/scan";

  return (
    <nav className="mobile-nav" aria-label="Primary">
      <Link className={`mobile-nav-item ${isDashboard ? "is-active" : ""}`} href="/dashboard">
        <HomeIcon active={isDashboard} />
        <span>Dashboard</span>
      </Link>
      <Link className={`mobile-nav-item ${isScan ? "is-active" : ""}`} href="/scan">
        <CameraIcon active={isScan} />
        <span>Camera</span>
      </Link>
      <Link className={`mobile-nav-item ${isProfile ? "is-active" : ""}`} href="/profile">
        <ProfileIcon active={isProfile} />
        <span>Profile</span>
      </Link>
    </nav>
  );
}
