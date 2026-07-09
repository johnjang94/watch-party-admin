"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

function SingleProfileArt() {
  const glowId = useId();

  return (
    <svg aria-hidden="true" viewBox="0 0 160 160" className="dashboard-art">
      <defs>
        <linearGradient id={glowId} x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#f7d07a" />
          <stop offset="55%" stopColor="#9d6cff" />
          <stop offset="100%" stopColor="#67f0b0" />
        </linearGradient>
      </defs>
      <rect width="160" height="160" rx="28" fill="#090814" />
      <circle cx="80" cy="72" r="34" fill={`url(#${glowId})`} opacity="0.32" />
      <circle cx="80" cy="66" r="18" fill="#f4fff8" opacity="0.95" />
      <path
        d="M46 124c5-20 20-32 34-32s29 12 34 32"
        fill="#f4fff8"
        opacity="0.95"
      />
      <path
        d="M30 26h100c2.8 0 5 2.2 5 5v98c0 2.8-2.2 5-5 5H30c-2.8 0-5-2.2-5-5V31c0-2.8 2.2-5 5-5Z"
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="2"
      />
      <circle cx="52" cy="36" r="3" fill="#f7d07a" />
      <circle cx="80" cy="36" r="3" fill="#9d6cff" />
      <circle cx="108" cy="36" r="3" fill="#67f0b0" />
    </svg>
  );
}

function GroupProfileArt() {
  const glowId = useId();

  return (
    <svg aria-hidden="true" viewBox="0 0 160 160" className="dashboard-art">
      <defs>
        <linearGradient id={glowId} x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#7ef3b6" />
          <stop offset="50%" stopColor="#c6a2ff" />
          <stop offset="100%" stopColor="#ffe08b" />
        </linearGradient>
      </defs>
      <rect width="160" height="160" rx="28" fill="#090814" />
      <g opacity="0.96">
        <circle cx="60" cy="65" r="16" fill="#f4fff8" />
        <circle cx="100" cy="58" r="18" fill="#f4fff8" />
        <circle cx="80" cy="74" r="16" fill="#f4fff8" />
        <path d="M38 125c5-18 16-27 22-27s17 9 22 27" fill="#f4fff8" />
        <path d="M74 125c5-18 18-31 26-31s21 13 26 31" fill="#f4fff8" opacity="0.92" />
        <path d="M54 125c4-16 13-24 20-24s16 8 20 24" fill="#f4fff8" opacity="0.9" />
      </g>
      <circle cx="80" cy="82" r="44" fill={`url(#${glowId})`} opacity="0.18" />
      <path
        d="M30 26h100c2.8 0 5 2.2 5 5v98c0 2.8-2.2 5-5 5H30c-2.8 0-5-2.2-5-5V31c0-2.8 2.2-5 5-5Z"
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="2"
      />
      <circle cx="52" cy="36" r="3" fill="#7ef3b6" />
      <circle cx="80" cy="36" r="3" fill="#c6a2ff" />
      <circle cx="108" cy="36" r="3" fill="#ffe08b" />
    </svg>
  );
}

function FrameArt({ variant }) {
  if (variant === "group") return <GroupProfileArt />;
  return <SingleProfileArt />;
}

const defaultCards = [
  {
    href: "/new",
    title: "new",
    subtitle: "recent signups",
    variant: "single",
  },
  {
    href: "/all",
    title: "all",
    subtitle: "everyone in one stream",
    variant: "group",
  },
  {
    href: "/profile",
    title: "profile",
    subtitle: "your admin identity",
    variant: "single",
  },
  {
    href: "/inquiry",
    title: "inquiry",
    subtitle: "customer questions",
    variant: "group",
  },
];

export function DashboardCarousel({ cards = defaultCards }) {
  const trackRef = useRef(null);
  const cardRefs = useRef([]);
  const rafRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;

    function updateActiveIndex() {
      const trackRect = track.getBoundingClientRect();
      const viewportCenter = trackRect.left + trackRect.width / 2;

      let bestIndex = 0;
      let bestDistance = Number.POSITIVE_INFINITY;

      cardRefs.current.forEach((card, index) => {
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const cardCenter = rect.left + rect.width / 2;
        const distance = Math.abs(cardCenter - viewportCenter);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = index;
        }
      });

      setActiveIndex(bestIndex);
    }

    function handleScroll() {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateActiveIndex);
    }

    updateActiveIndex();
    track.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      track.removeEventListener("scroll", handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <section className="dashboard-carousel" aria-label="Dashboard menu">
      <div className="dashboard-track" ref={trackRef}>
        {cards.map((card, index) => (
          <div className="dashboard-slide" key={card.title}>
            <Link
              aria-current={index === activeIndex ? "true" : undefined}
              className={`dashboard-card ${index === activeIndex ? "is-active" : ""}`}
              href={card.href}
              ref={(node) => {
                cardRefs.current[index] = node;
              }}
            >
              <div className="dashboard-media">
                <FrameArt variant={card.variant} />
              </div>
              <div className="dashboard-caption">
                <span className="dashboard-title">{card.title}</span>
                <span className="dashboard-subtitle">{card.subtitle}</span>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
