"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import selfieImage from "../selfie.jpg";
import communityImage from "../community.jpg";
import helpImage from "../HELP.webp";

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
          sizes="(max-width: 640px) 96vw, (max-width: 1024px) 78vw, 720px"
          src={card.src}
        />
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
    src: selfieImage,
    alt: "Selfie photo for recent arrivals",
    priority: true,
  },
  {
    href: "/all",
    kind: "photo",
    label: "all",
    src: communityImage,
    alt: "Community photo for all guests",
  },
  {
    href: "/inquiry",
    kind: "photo",
    label: "inquiry",
    src: helpImage,
    alt: "Help illustration for the inquiry dashboard",
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
              <span className="dashboard-badge">{card.label}</span>
              <div className="dashboard-media">
                <CardMedia card={card} />
              </div>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
