"use client";

import Image from "next/image";
import Link from "next/link";
import communityImage from "../community.jpg";
import helpImage from "../HELP.webp";

const defaultThreads = [
  {
    href: "/registered",
    badge: "thread 01",
    title: "Registered",
    summary: "",
    meta: "",
    alt: "Community photo for registered guests",
    src: communityImage,
    priority: true,
  },
  {
    href: "/portal-preview",
    badge: "thread 02",
    title: "Portal Preview",
    summary: "",
    meta: "",
    alt: "Preview card for the guest portal flow",
    src: communityImage,
  },
  {
    href: "/add",
    badge: "thread 03",
    title: "Add",
    summary: "",
    meta: "",
    alt: "Guest list illustration for the add members dashboard",
    src: communityImage,
  },
  {
    href: "/inquiry",
    badge: "thread 04",
    title: "Inquiry",
    summary: "",
    meta: "",
    alt: "Help illustration for the inquiry dashboard",
    src: helpImage,
  },
  {
    href: "/volunteer-applications",
    badge: "thread 05",
    title: "Volunteer Application",
    summary: "See what guests are bringing",
    meta: "thread cards",
    alt: "Volunteer application cards for the admin dashboard",
    src: helpImage,
  },
  {
    href: "/broadcast-update",
    badge: "thread 06",
    title: "SMS Update",
    summary: "Send a fresh event note to every invite",
    meta: "one tap broadcast",
    alt: "Broadcast update card for the admin dashboard",
    src: helpImage,
  },
];

function ThreadMedia({ thread }) {
  return (
    <div className="dashboard-thread-media">
      <Image
        alt={thread.alt}
        className="dashboard-thread-image"
        fill
        priority={thread.priority}
        sizes="(max-width: 720px) 72px, 112px"
        src={thread.src}
      />
    </div>
  );
}

export function DashboardCarousel({ cards = defaultThreads }) {
  return (
    <section className="dashboard-threadboard" aria-label="Dashboard menu">
      <div className="dashboard-thread-list">
        {cards.map((thread, index) => (
          <Link
            aria-label={thread.title}
            className={`dashboard-thread-card ${index === cards.length - 1 ? "is-last" : ""}`}
            href={thread.href}
            key={thread.href}
          >
            <span className="dashboard-thread-rail" aria-hidden="true">
              <span className="dashboard-thread-node" />
              {index < cards.length - 1 ? <span className="dashboard-thread-line" /> : null}
            </span>

            <ThreadMedia thread={thread} />

            <div className="dashboard-thread-copy">
              <span className="dashboard-thread-badge">{thread.badge}</span>
              <strong className="dashboard-thread-title">{thread.title}</strong>
              {thread.summary ? <p className="dashboard-thread-summary">{thread.summary}</p> : null}
              {thread.meta ? <span className="dashboard-thread-meta">{thread.meta}</span> : null}
            </div>

            <span className="dashboard-thread-arrow" aria-hidden="true">
              →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
