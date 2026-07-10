"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import selfieImage from "../selfie.jpg";
import communityImage from "../community.jpg";

function ChatArt() {
  return (
    <svg aria-hidden="true" viewBox="0 0 160 160" className="dashboard-art">
      <rect width="160" height="160" rx="28" fill="#090814" />
      <path
        d="M36 46h88c8 0 14 6 14 14v38c0 8-6 14-14 14H77l-21 18v-18H36c-8 0-14-6-14-14V60c0-8 6-14 14-14Z"
        fill="rgba(255,255,255,0.08)"
      />
      <path d="M50 64h60" stroke="#f4fff8" strokeLinecap="round" strokeWidth="6" opacity="0.92" />
      <path d="M50 82h42" stroke="#f4fff8" strokeLinecap="round" strokeWidth="6" opacity="0.72" />
      <path d="M50 100h50" stroke="#f4fff8" strokeLinecap="round" strokeWidth="6" opacity="0.56" />
      <circle cx="122" cy="122" r="15" fill="rgba(119,231,160,0.22)" />
      <circle cx="122" cy="122" r="6" fill="#f6d15d" opacity="0.95" />
      <path
        d="M30 26h100c2.8 0 5 2.2 5 5v98c0 2.8-2.2 5-5 5H30c-2.8 0-5-2.2-5-5V31c0-2.8 2.2-5 5-5Z"
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="2"
      />
    </svg>
  );
}

function ProfileArt() {
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

function CardMedia({ card }) {
  if (card.kind === "photo") {
    return (
      <div className="dashboard-photo-frame">
        <Image
          alt={card.alt}
          className="dashboard-photo"
          fill
          priority={card.priority}
          sizes="(max-width: 640px) 88vw, 520px"
          src={card.src}
        />
      </div>
    );
  }

  if (card.kind === "chat") {
    return (
      <div className="dashboard-icon-frame">
        <ChatArt />
      </div>
    );
  }

  return (
    <div className="dashboard-icon-frame">
      <ProfileArt />
    </div>
  );
}

const defaultCards = [
  {
    href: "/new",
    kind: "photo",
    label: "new",
    subtitle: "recent arrivals",
    src: selfieImage,
    alt: "Selfie photo for recent arrivals",
    priority: true,
  },
  {
    href: "/all",
    kind: "photo",
    label: "all",
    subtitle: "entire community",
    src: communityImage,
    alt: "Community photo for all guests",
  },
  {
    href: "/inquiry",
    kind: "chat",
    label: "inquiry",
    subtitle: "live messages",
  },
  {
    href: "/profile",
    kind: "portrait",
    label: "profile",
    subtitle: "admin details",
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
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(updateActiveIndex);
    }

    updateActiveIndex();
    track.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      track.removeEventListener("scroll", handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
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
                <CardMedia card={card} />
              </div>
              <div className="dashboard-caption">
                <strong className="dashboard-title">{card.label}</strong>
                <span className="dashboard-subtitle">{card.subtitle}</span>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
