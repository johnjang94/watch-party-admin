"use client";

import Link from "next/link";
import { useState } from "react";

const stages = [
  { id: "login", badge: "step 01", title: "Login" },
  { id: "portal", badge: "step 02", title: "Portal" },
  { id: "ticket", badge: "step 03", title: "Ticket" },
  { id: "privacy", badge: "step 04", title: "Privacy" },
  { id: "support", badge: "step 05", title: "Support" },
];

function StageScreen({ stage }) {
  if (stage.id === "login") {
    return (
      <div className="portal-preview-screen">
        <p className="portal-preview-chip">guest entry</p>
        <h3>login</h3>
        <label className="portal-preview-field">
          <span>phone number</span>
          <input placeholder="(555) 123-4567" readOnly type="text" value="" />
        </label>
        <button className="portal-preview-button" type="button">
          send code
        </button>
      </div>
    );
  }

  if (stage.id === "portal") {
    return (
      <div className="portal-preview-screen">
        <p className="portal-preview-chip">portal home</p>
        <h3>you are going</h3>
        <div className="portal-preview-qr">
          <div className="portal-preview-qr-box" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="portal-preview-qr-copy">
            <strong>QR code</strong>
            <p>barcode visible here</p>
          </div>
        </div>
        <div className="portal-preview-actions">
          <span>about my ticket</span>
          <span>things to know</span>
          <span>questions?</span>
          <span>log out</span>
        </div>
      </div>
    );
  }

  if (stage.id === "ticket") {
    return (
      <div className="portal-preview-screen">
        <p className="portal-preview-chip">detail card</p>
        <h3>about my ticket</h3>
        <div className="portal-preview-ticket">
          <div className="portal-preview-photo" aria-hidden="true">
            <span>G</span>
          </div>
          <div>
            <strong>Guest Name</strong>
            <p>name · phone · privacy · rsvp</p>
          </div>
        </div>
        <label className="portal-preview-field">
          <span>rsvp</span>
          <select disabled value="Going">
            <option>Going</option>
          </select>
        </label>
      </div>
    );
  }

  if (stage.id === "privacy") {
    return (
      <div className="portal-preview-screen">
        <p className="portal-preview-chip">privacy gate</p>
        <h3>privacy policy</h3>
        <div className="portal-preview-privacy">
          <p>We use your name, phone number, profile photo, RSVP, and support details to manage your registration and event communications.</p>
          <p>We do not sell your information. We share it only with trusted service providers who help us run the event.</p>
          <p>We keep it only as long as needed for event operations, safety, and legal or security requirements.</p>
        </div>
        <button className="portal-preview-button is-wide" type="button">
          i agree
        </button>
      </div>
    );
  }

  return (
    <div className="portal-preview-screen">
      <p className="portal-preview-chip">support</p>
      <h3>support thread</h3>
      <div className="portal-preview-chat">
        <div className="portal-preview-bubble is-guest">
          <strong>Guest</strong>
          <p>I have a question.</p>
        </div>
        <div className="portal-preview-bubble is-agent">
          <strong>Support</strong>
          <p>We are looking into it.</p>
        </div>
      </div>
    </div>
  );
}

export default function PortalPreviewPage() {
  const [activeStageId, setActiveStageId] = useState("portal");
  const stage = stages.find((item) => item.id === activeStageId) ?? stages[0];

  return (
    <main className="page-root portal-preview-page">
      <section className="portal-preview-shell">
        <header className="portal-preview-header">
          <div>
            <p className="eyebrow">thread 02</p>
            <h1>Portal preview</h1>
          </div>
          <Link className="portal-preview-back" href="/dashboard">
            back
          </Link>
        </header>

        <div className="portal-preview-layout">
          <aside className="portal-preview-rail" aria-label="Portal flow stages">
            {stages.map((item) => {
              const isActive = item.id === activeStageId;

              return (
                <button
                  className={`portal-preview-rail-item ${isActive ? "is-active" : ""}`}
                  key={item.id}
                  type="button"
                  onClick={() => setActiveStageId(item.id)}
                >
                  <span className="portal-preview-rail-badge">{item.badge}</span>
                  <strong>{item.title}</strong>
                </button>
              );
            })}
          </aside>

          <section className="portal-preview-stage">
            <div className="portal-preview-phone">
              <StageScreen stage={stage} />
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
