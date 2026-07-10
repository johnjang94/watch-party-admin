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

function ScanArt() {
  return (
    <svg aria-hidden="true" viewBox="0 0 160 160" className="dashboard-art">
      <defs>
        <radialGradient id="scanGlow" cx="50%" cy="38%" r="62%">
          <stop offset="0%" stopColor="#f6d15d" stopOpacity="0.92" />
          <stop offset="52%" stopColor="#9d6cff" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#0a0d11" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="160" height="160" rx="28" fill="#090814" />
      <circle cx="80" cy="78" r="52" fill="url(#scanGlow)" opacity="0.28" />
      <rect x="38" y="38" width="84" height="84" rx="18" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
      <rect x="50" y="50" width="18" height="18" rx="5" fill="#f4fff8" opacity="0.95" />
      <rect x="92" y="50" width="18" height="18" rx="5" fill="#f4fff8" opacity="0.95" />
      <rect x="50" y="92" width="18" height="18" rx="5" fill="#f4fff8" opacity="0.95" />
      <path d="M92 92h18v18H92z" fill="#f4fff8" opacity="0.95" />
      <path d="M76 32h8v96h-8z" fill="rgba(246,209,93,0.38)" />
      <path d="M32 76h96v8H32z" fill="rgba(126,77,214,0.32)" />
      <circle cx="80" cy="80" r="14" fill="none" stroke="rgba(246,209,93,0.8)" strokeWidth="3" />
      <path d="M60 124h40" stroke="rgba(255,255,255,0.22)" strokeLinecap="round" strokeWidth="3" />
      <path d="M30 26h100c2.8 0 5 2.2 5 5v98c0 2.8-2.2 5-5 5H30c-2.8 0-5-2.2-5-5V31c0-2.8 2.2-5 5-5Z" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
    </svg>
  );
}

function InquiryArt() {
  return (
    <svg aria-hidden="true" viewBox="0 0 160 160" className="dashboard-art">
      <rect width="160" height="160" rx="28" fill="#090814" />
      <path
        d="M38 44h84c7.2 0 13 5.8 13 13v42c0 7.2-5.8 13-13 13H76l-20 18v-18H38c-7.2 0-13-5.8-13-13V57c0-7.2 5.8-13 13-13Z"
        fill="rgba(255,255,255,0.08)"
      />
      <path d="M48 62h64" stroke="#f4fff8" strokeLinecap="round" strokeWidth="6" opacity="0.9" />
      <path d="M48 79h44" stroke="#f4fff8" strokeLinecap="round" strokeWidth="6" opacity="0.72" />
      <path d="M48 96h54" stroke="#f4fff8" strokeLinecap="round" strokeWidth="6" opacity="0.56" />
      <circle cx="121" cy="121" r="14" fill="rgba(126,77,214,0.28)" />
      <circle cx="121" cy="121" r="6" fill="#f6d15d" opacity="0.95" />
      <path
        d="M30 26h100c2.8 0 5 2.2 5 5v98c0 2.8-2.2 5-5 5H30c-2.8 0-5-2.2-5-5V31c0-2.8 2.2-5 5-5Z"
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="2"
      />
    </svg>
  );
}

function FrameArt({ variant }) {
  if (variant === "scan") return <ScanArt />;
  if (variant === "group") return <GroupProfileArt />;
  if (variant === "inquiry") return <InquiryArt />;
  return <SingleProfileArt />;
}

const defaultCards = [
  {
    href: "/new",
    variant: "single",
    label: "New",
  },
  {
    href: "/all",
    variant: "group",
    label: "All",
  },
  {
    href: "/inquiry",
    variant: "inquiry",
    label: "Inquiry",
  },
  {
    href: "/scan",
    variant: "scan",
    label: "Scan",
  },
  {
    href: "/profile",
    variant: "single",
    label: "Profile",
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
          <div className="dashboard-slide" key={card.href}>
            <Link
              aria-label={card.label}
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
                <strong className="dashboard-title">{card.label}</strong>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
