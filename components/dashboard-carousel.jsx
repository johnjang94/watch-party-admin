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
    summary: "Guest roster, check-in state, and capacity tracking.",
    meta: "Open the registered guest list",
    alt: "Community photo for registered guests",
    src: communityImage,
    priority: true,
  },
  {
    href: "/waitlisted",
    badge: "thread 02",
    title: "Waitlisted",
    summary: "Guests waiting for a spot, kept in the same thread flow.",
    meta: "Open the waitlist thread",
    alt: "Guest list illustration for the waitlist dashboard",
    src: communityImage,
  },
  {
    href: "/inquiry",
    badge: "thread 03",
    title: "Inquiry",
    summary: "Open customer questions, replies, and follow-up history.",
    meta: "Open the inquiry inbox",
    alt: "Help illustration for the inquiry dashboard",
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
              <p className="dashboard-thread-summary">{thread.summary}</p>
              <span className="dashboard-thread-meta">{thread.meta}</span>
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
