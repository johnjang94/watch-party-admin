"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import heroImage from "../../image.png";
import profileImage from "../../selfie.jpg";

const PHONE_LENGTH = 10;
const QUICK_REPLIES = [
  "What is this party about?",
  "How do I register?",
  "What happens after the survey?",
  "Help with login",
];

function normalize(value) {
  return String(value ?? "").trim();
}

function normalizePhoneNumber(value) {
  return normalize(value).replace(/\D/g, "").slice(0, PHONE_LENGTH);
}

function formatPhoneNumber(value) {
  const digits = normalize(value).replace(/\D/g, "");

  if (digits.length !== 10) {
    return normalize(value);
  }

  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function normalizeRsvp(value) {
  const normalized = normalize(value).toLowerCase();

  if (normalized === "maybe") {
    return "maybe";
  }

  if (normalized === "not going") {
    return "not going";
  }

  return "Going";
}

function getPortalTitle(rsvp) {
  if (rsvp === "maybe") {
    return "Are you going?";
  }

  if (rsvp === "not going") {
    return "You cant make it";
  }

  return "You are going";
}

function hashString(value) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function buildQrMatrix(seed, size = 25) {
  const matrix = Array.from({ length: size }, () => Array(size).fill(false));

  function setFinder(startX, startY) {
    for (let row = 0; row < 7; row += 1) {
      for (let col = 0; col < 7; col += 1) {
        const isBorder = row === 0 || row === 6 || col === 0 || col === 6;
        const isCore = row >= 2 && row <= 4 && col >= 2 && col <= 4;
        matrix[startY + row][startX + col] = isBorder || isCore;
      }
    }
  }

  setFinder(0, 0);
  setFinder(size - 7, 0);
  setFinder(0, size - 7);

  const hash = hashString(seed || "preview");
  let state = hash || 1;

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const inTopLeft = row < 7 && col < 7;
      const inTopRight = row < 7 && col >= size - 7;
      const inBottomLeft = row >= size - 7 && col < 7;

      if (inTopLeft || inTopRight || inBottomLeft) {
        continue;
      }

      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      const noise = (state >>> 30) & 1;
      matrix[row][col] = Boolean(
        noise || ((row * 11 + col * 7 + hash) % 9 === 0) || ((row + col + hash) % 13 === 0),
      );
    }
  }

  return matrix;
}

function PreviewQr({ token, barcode }) {
  const cells = useMemo(
    () => buildQrMatrix(`${token || "preview"}:${barcode || "00000"}`),
    [token, barcode],
  );

  return (
    <div className="preview-qr-card" aria-label="Preview QR code" role="img">
      <div className="preview-qr-grid" aria-hidden="true">
        {cells.flatMap((row, rowIndex) =>
          row.map((isDark, colIndex) => {
            const isFinder =
              (rowIndex < 7 && colIndex < 7) ||
              (rowIndex < 7 && colIndex >= cells.length - 7) ||
              (rowIndex >= cells.length - 7 && colIndex < 7);

            return (
              <span
                className={`preview-qr-cell ${isDark ? "is-dark" : ""} ${isFinder ? "is-finder" : ""}`}
                key={`${rowIndex}-${colIndex}`}
              />
            );
          }),
        )}
      </div>
      <div className="preview-qr-foot">
        <span>Unique QR code for your invite</span>
        <strong>{normalize(barcode).replace(/\D/g, "").slice(0, 5) || "48291"}</strong>
      </div>
    </div>
  );
}

function SupportMessage({ role, name, text, time, photo = false }) {
  return (
    <article className={`preview-chat-bubble ${role === "assistant" ? "is-agent" : "is-guest"}`}>
      <div className="preview-chat-bubble-head">
        <div className="preview-chat-identity">
          {photo ? (
            <span className="preview-chat-avatar">
              <Image alt="" fill sizes="24px" src={profileImage} />
            </span>
          ) : (
            <span className="preview-chat-avatar is-letter" aria-hidden="true">
              M
            </span>
          )}
          <strong>{name}</strong>
        </div>
        <time>{time}</time>
      </div>
      <p>{text}</p>
    </article>
  );
}

function LoginScreen({ isOpen, phoneNumber, phoneError, phoneStatus, isSubmitting, onToggle, onChange, onSubmit }) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus?.();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isOpen]);

  return (
    <section className="preview-home-screen">
      <section className="preview-hero-stage">
        <div className="preview-hero-media">
          <Image alt="" className="preview-hero-image" fill priority sizes="100vw" src={heroImage} />
          <div className="preview-hero-overlay" aria-hidden="true" />
        </div>

        <div className="preview-hero-content">
          <div className="preview-cta-band">
            <p className="preview-eyebrow">thread 02</p>
            <h2 className="preview-lobby-title">Portal preview</h2>
            <p className="preview-lobby-copy">
              OTP 없이 실제 FIFA X BTS 포털의 로그인과 포털 레이아웃을 미리 볼 수 있는 화면입니다.
            </p>

            <div className={`preview-auth-switch ${isOpen ? "is-open" : ""}`}>
              <div className="preview-auth-state preview-auth-state-login" aria-hidden={isOpen}>
                <button className="preview-login-button" onClick={onToggle} type="button">
                  Login
                </button>
              </div>

              <form className="preview-auth-state preview-auth-state-form preview-login-panel" onSubmit={onSubmit}>
                <label className="preview-login-field">
                  <span>phone number</span>
                  <input
                    autoComplete="tel"
                    inputMode="tel"
                    name="phoneNumber"
                    onChange={(event) => onChange(event.target.value)}
                    placeholder="Enter phone number"
                    ref={inputRef}
                    type="tel"
                    value={phoneNumber}
                  />
                </label>

                {phoneError ? (
                  <p className="preview-status is-error" role="status">
                    {phoneError}
                  </p>
                ) : phoneStatus ? (
                  <p className="preview-status" role="status">
                    {phoneStatus}
                  </p>
                ) : null}

                <button className="preview-login-submit is-ready" disabled={isSubmitting} type="submit">
                  {isSubmitting ? "opening..." : "Open portal"}
                </button>
              </form>
            </div>

            <Link className="preview-join-link" href="/dashboard">
              back to dashboard
            </Link>
          </div>
        </div>
      </section>
    </section>
  );
}

function PortalScreen({
  displayName,
  inviteToken,
  phoneNumber,
  rsvp,
  barcode,
  profilePhotoUrl,
  profilePhotoTag,
  profilePhotoAiGenerated,
  activePanel,
  onBackToHome,
  onOpenTicket,
  onCloseTicket,
  onOpenThingsToKnow,
  onOpenSupport,
  onOpenPrivacy,
  onChangeRsvp,
}) {
  const portalTitle = getPortalTitle(rsvp);
  const contactText = formatPhoneNumber(phoneNumber) || "demo-guest";
  const isTicketOpen = activePanel === "ticket";

  return (
    <section className="preview-portal-screen">
      <section className="preview-portal-shell">
        <header className="preview-portal-header">
          <p className="preview-eyebrow">portal</p>
          <h1>{portalTitle}</h1>
          <p className="preview-portal-lede">
            Your invite has been checked and the full ticket details are ready to review.
          </p>
        </header>

        <section className="preview-portal-qr-area" aria-label="Your QR code">
          <PreviewQr token={inviteToken} barcode={barcode} />
        </section>

        <section className="preview-portal-summary" aria-label="Quick summary">
          <div>
            <span className="preview-summary-kicker">status</span>
            <strong>ready to join</strong>
          </div>
          <div>
            <span className="preview-summary-kicker">contact</span>
            <strong>{contactText}</strong>
          </div>
          <div>
            <span className="preview-summary-kicker">rsvp</span>
            <strong>{normalizeRsvp(rsvp)}</strong>
          </div>
        </section>

        <section className={`preview-ticket-card ${isTicketOpen ? "is-open" : ""}`}>
          <button className="preview-ticket-toggle" onClick={isTicketOpen ? onCloseTicket : onOpenTicket} type="button">
            <span>about my ticket</span>
            <span aria-hidden="true">{isTicketOpen ? "−" : "+"}</span>
          </button>

          {isTicketOpen ? (
            <div className="preview-ticket-meta">
              <div className="preview-profile-stack">
                <div className="preview-profile-photo-frame">
                  {profilePhotoUrl ? (
                    <Image alt="" fill className="preview-profile-photo" src={profilePhotoUrl} />
                  ) : null}
                </div>
                <div className="preview-profile-copy">
                  <strong>{displayName}</strong>
                  <p>{profilePhotoAiGenerated ? "AI-generated profile photo" : "Uploaded profile photo"}</p>
                  {profilePhotoTag ? <span className="preview-profile-tag">{profilePhotoTag}</span> : null}
                </div>
              </div>

              <dl className="preview-ticket-grid">
                <div>
                  <dt>Name</dt>
                  <dd>{displayName}</dd>
                </div>
                <div>
                  <dt>Phone</dt>
                  <dd>{contactText}</dd>
                </div>
                <div>
                  <dt>Invite</dt>
                  <dd>{inviteToken}</dd>
                </div>
                <div>
                  <dt>Barcode</dt>
                  <dd>{barcode || "48291"}</dd>
                </div>
              </dl>

              <div className="preview-rsvp-row">
                <select
                  aria-label="RSVP"
                  className="preview-rsvp-select"
                  onChange={(event) => onChangeRsvp(event.target.value)}
                  value={normalizeRsvp(rsvp)}
                >
                  <option value="Going">Going</option>
                  <option value="maybe">maybe</option>
                  <option value="not going">not going</option>
                </select>
              </div>

              <p className="preview-rsvp-note">
                make sure you finalize whether you can make it or not in 48 hours prior to the event day.
              </p>
            </div>
          ) : null}
        </section>

        <div className="preview-action-stack" aria-label="Portal actions">
          <button className="preview-action-button" onClick={onOpenTicket} type="button">
            about my ticket
          </button>
          <button className="preview-action-button" onClick={onOpenThingsToKnow} type="button">
            things to know
          </button>
          <button className="preview-action-button" onClick={onOpenSupport} type="button">
            questions?
          </button>
          <button className="preview-action-button" onClick={onOpenPrivacy} type="button">
            privacy policy
          </button>
          <button className="preview-action-button is-secondary" onClick={onBackToHome} type="button">
            log out
          </button>
        </div>
      </section>
    </section>
  );
}

function SupportScreen({ customerName, messages, value, onBack, onQuickReply, onSend, onValueChange }) {
  return (
    <section className="preview-support-screen">
      <section className="preview-support-shell">
        <header className="preview-support-header">
          <p className="preview-eyebrow">support</p>
          <h1>How can we help?</h1>
          <p className="preview-support-lede">
            This mirrors the live support experience, with the OTP step intentionally skipped.
          </p>
        </header>

        <div className="preview-support-chat">
          <div className="preview-chat-thread">
            {messages.map((message, index) => (
              <SupportMessage
                key={`${message.role}-${index}`}
                {...message}
                photo={message.role === "assistant"}
              />
            ))}
          </div>

          <div className="preview-quick-replies">
            {QUICK_REPLIES.map((reply) => (
              <button className="preview-quick-reply" key={reply} onClick={() => onQuickReply(reply)} type="button">
                {reply}
              </button>
            ))}
          </div>

          <form className="preview-chat-form" onSubmit={onSend}>
            <label className="preview-chat-field">
              <span className="sr-only">Message</span>
              <input
                aria-label="Message"
                onChange={(event) => onValueChange(event.target.value)}
                placeholder={`Message ${customerName}`}
                value={value}
              />
            </label>
            <button className="preview-chat-send" type="submit">
              send
            </button>
          </form>

          <button className="preview-back-button" onClick={onBack} type="button">
            back to portal
          </button>
        </div>
      </section>
    </section>
  );
}

function PrivacyModal({ onClose }) {
  return (
    <div className="preview-modal-backdrop" role="presentation" onClick={onClose}>
      <article
        aria-modal="true"
        className="preview-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <p className="preview-card-kicker">privacy policy</p>
        <h2>please agree to continue</h2>
        <div className="preview-modal-copy">
          <p>We use your name, phone number, profile photo, RSVP, and support details to manage your registration and event communications.</p>
          <p>We do not sell your information. We share it only with trusted service providers who help us run the event.</p>
          <p>We keep it only as long as needed for event operations, safety, and legal or security requirements.</p>
        </div>
        <button className="preview-modal-close" onClick={onClose} type="button">
          close
        </button>
      </article>
    </div>
  );
}

function ThingsToKnowModal({ onClose }) {
  return (
    <div className="preview-modal-backdrop" role="presentation" onClick={onClose}>
      <article
        aria-modal="true"
        className="preview-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <p className="preview-card-kicker">things to know</p>
        <h2>Before you head in</h2>
        <div className="preview-modal-copy">
          <p>Check in is available from your ticket card and your RSVP can still be reviewed from there.</p>
          <p>Questions go straight to support, and the activity hub keeps the event notes in one place.</p>
          <p>This preview is unlocked so you can jump between sections without the live gate.</p>
        </div>
        <button className="preview-modal-close" onClick={onClose} type="button">
          close
        </button>
      </article>
    </div>
  );
}

export default function PortalPreviewPage() {
  const [screen, setScreen] = useState("home");
  const [loginOpen, setLoginOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("4155550198");
  const [phoneError, setPhoneError] = useState("");
  const [phoneStatus, setPhoneStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activePanel, setActivePanel] = useState("ticket");
  const [showThingsToKnow, setShowThingsToKnow] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [rsvp, setRsvp] = useState("Going");
  const [previewState, setPreviewState] = useState({
    displayName: "Miranda Park",
    inviteToken: "demo-4155550198",
    barcode: "48291",
    profilePhotoUrl: profileImage,
    profilePhotoTag: "verified",
    profilePhotoAiGenerated: false,
  });
  const [supportValue, setSupportValue] = useState("Need help with check-in.");
  const [supportMessages, setSupportMessages] = useState([
    {
      role: "assistant",
      name: "Miranda",
      text: "Hi Miranda, welcome to FIFA X BTS support. How can I help you today?",
      time: "now",
    },
  ]);

  useEffect(() => {
    if (!loginOpen) {
      return undefined;
    }

    setPhoneStatus("");
    setPhoneError("");

    return undefined;
  }, [loginOpen]);

  function goHome() {
    setScreen("home");
    setLoginOpen(false);
    setPhoneError("");
    setPhoneStatus("");
    setActivePanel("ticket");
    setShowThingsToKnow(false);
    setShowPrivacyModal(false);
  }

  function handleStartPortal(event) {
    event.preventDefault();
    const digits = normalizePhoneNumber(phoneNumber);

    if (digits.length !== PHONE_LENGTH) {
      setPhoneError("Please enter the 10-digit phone number you used to register.");
      return;
    }

    setIsSubmitting(true);
    setPhoneError("");
    setPhoneStatus("Opening the portal without OTP for preview.");

    const nextInviteToken = `demo-${digits}`;

    setPreviewState({
      displayName: "Miranda Park",
      inviteToken: nextInviteToken,
      barcode: "48291",
      profilePhotoUrl: profileImage,
      profilePhotoTag: "verified",
      profilePhotoAiGenerated: false,
    });
    setScreen("portal");
    setActivePanel("ticket");
    setLoginOpen(false);
    setIsSubmitting(false);
  }

  function handleQuickReply(reply) {
    setSupportMessages((current) => [
      ...current,
      {
        role: "guest",
        name: "You",
        text: reply,
        time: "now",
      },
      {
        role: "assistant",
        name: "Miranda",
        text: "Absolutely. I can help with that right here in preview mode.",
        time: "now",
      },
    ]);
  }

  function handleSendSupport(event) {
    event.preventDefault();

    const trimmed = normalize(supportValue);
    if (!trimmed) {
      return;
    }

    setSupportMessages((current) => [
      ...current,
      {
        role: "guest",
        name: "You",
        text: trimmed,
        time: "now",
      },
      {
        role: "assistant",
        name: "Miranda",
        text: "Thanks. I’ve noted that in the preview flow.",
        time: "now",
      },
    ]);
    setSupportValue("");
  }

  const liveScreen =
    screen === "support" ? (
      <SupportScreen
        customerName={previewState.displayName}
        messages={supportMessages}
        onBack={() => setScreen("portal")}
        onQuickReply={handleQuickReply}
        onSend={handleSendSupport}
        onValueChange={setSupportValue}
        value={supportValue}
      />
    ) : screen === "portal" ? (
      <PortalScreen
        activePanel={activePanel}
        barcode={previewState.barcode}
        displayName={previewState.displayName}
        inviteToken={previewState.inviteToken}
        onBackToHome={goHome}
        onCloseTicket={() => setActivePanel("")}
        onChangeRsvp={(nextRsvp) => setRsvp(nextRsvp)}
        onOpenThingsToKnow={() => setShowThingsToKnow(true)}
        onOpenSupport={() => setScreen("support")}
        onOpenPrivacy={() => setShowPrivacyModal(true)}
        onOpenTicket={() => setActivePanel("ticket")}
        phoneNumber={phoneNumber}
        profilePhotoAiGenerated={previewState.profilePhotoAiGenerated}
        profilePhotoTag={previewState.profilePhotoTag}
        profilePhotoUrl={previewState.profilePhotoUrl}
        rsvp={rsvp}
      />
    ) : (
      <LoginScreen
        isOpen={loginOpen}
        isSubmitting={isSubmitting}
        onChange={setPhoneNumber}
        onSubmit={handleStartPortal}
        onToggle={() => setLoginOpen((current) => !current)}
        phoneError={phoneError}
        phoneNumber={phoneNumber}
        phoneStatus={phoneStatus}
      />
    );

  return (
    <main className="preview-page">
      <header className="preview-admin-bar">
        <div>
          <p className="preview-eyebrow">thread 02</p>
          <h1>Portal preview</h1>
          <p className="preview-admin-copy">
            OTP step removed. This now stays focused on the live portal layout, ticket card, support, and privacy flow.
          </p>
        </div>

        <div className="preview-admin-actions">
          <button className={`preview-admin-chip ${screen === "home" ? "is-active" : ""}`} onClick={goHome} type="button">
            home
          </button>
          <button className={`preview-admin-chip ${screen === "portal" ? "is-active" : ""}`} onClick={() => setScreen("portal")} type="button">
            portal
          </button>
          <button className="preview-admin-chip" onClick={goHome} type="button">
            reset
          </button>
          <Link className="preview-admin-chip is-link" href="/dashboard">
            back
          </Link>
        </div>
      </header>

      <section className="preview-stage-frame">{liveScreen}</section>

      {showThingsToKnow ? <ThingsToKnowModal onClose={() => setShowThingsToKnow(false)} /> : null}
      {showPrivacyModal ? <PrivacyModal onClose={() => setShowPrivacyModal(false)} /> : null}

      <style jsx global>{`
        .preview-page {
          min-height: 100svh;
          padding: clamp(16px, 3vw, 30px);
          background:
            radial-gradient(circle at 12% 6%, rgba(146, 95, 255, 0.16), transparent 24%),
            radial-gradient(circle at 84% 18%, rgba(245, 231, 197, 0.08), transparent 22%),
            linear-gradient(180deg, #05070c 0%, #090d14 100%);
          color: #f5f7f6;
        }

        .preview-admin-bar {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 16px;
          width: min(100%, 1280px);
          margin: 0 auto 16px;
        }

        .preview-admin-bar h1 {
          margin: 0;
          font-size: clamp(1.8rem, 4vw, 3rem);
          line-height: 0.95;
          letter-spacing: -0.06em;
        }

        .preview-admin-copy {
          margin: 8px 0 0;
          max-width: 42rem;
          color: rgba(244, 255, 248, 0.72);
          line-height: 1.5;
        }

        .preview-admin-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
          justify-content: flex-end;
        }

        .preview-admin-chip {
          min-height: 40px;
          padding: 0 14px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.05);
          color: rgba(244, 255, 248, 0.8);
          text-transform: uppercase;
          letter-spacing: 0.14em;
          font-size: 0.68rem;
          text-decoration: none;
        }

        .preview-admin-chip.is-active {
          border-color: rgba(246, 209, 93, 0.28);
          background: rgba(246, 209, 93, 0.12);
          color: #fff4cf;
        }

        .preview-admin-chip.is-link {
          display: inline-flex;
          align-items: center;
        }

        .preview-stage-frame {
          position: relative;
          width: min(100%, 440px);
          margin: 0 auto;
          overflow: hidden;
          border-radius: 34px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 36px 100px rgba(0, 0, 0, 0.54);
          background: #04080c;
        }

        .preview-home-screen,
        .preview-portal-screen,
        .preview-support-screen {
          min-height: min(100svh, 980px);
          color: #f5f7f6;
        }

        .preview-hero-stage {
          position: relative;
          min-height: min(100svh, 980px);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .preview-hero-media {
          position: absolute;
          inset: 0;
        }

        .preview-hero-image {
          object-fit: cover;
          object-position: center center;
        }

        .preview-hero-overlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(180deg, rgba(4, 8, 12, 0.08) 0%, rgba(4, 8, 12, 0.46) 50%, rgba(4, 8, 12, 0.92) 100%),
            radial-gradient(circle at top, rgba(246, 209, 93, 0.12), transparent 40%);
        }

        .preview-hero-content {
          position: relative;
          z-index: 1;
          min-height: min(100svh, 980px);
          display: flex;
          align-items: end;
          padding: 18px 16px calc(env(safe-area-inset-bottom) + 20px);
        }

        .preview-cta-band {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 18px 16px 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(4, 8, 12, 0.92);
          box-shadow: 0 -18px 46px rgba(0, 0, 0, 0.36);
        }

        .preview-eyebrow {
          margin: 0;
          color: rgba(245, 231, 197, 0.82);
          text-transform: uppercase;
          letter-spacing: 0.18em;
          font-size: 0.7rem;
        }

        .preview-lobby-title,
        .preview-portal-header h1,
        .preview-support-header h1,
        .preview-modal h2 {
          margin: 0;
          letter-spacing: -0.04em;
        }

        .preview-lobby-title {
          font-size: clamp(2rem, 6vw, 3rem);
          line-height: 0.92;
        }

        .preview-lobby-copy,
        .preview-portal-lede,
        .preview-support-lede,
        .preview-status,
        .preview-rsvp-note,
        .preview-modal-copy p,
        .preview-ticket-copy,
        .preview-chat-bubble p {
          margin: 0;
          color: rgba(244, 255, 248, 0.72);
          line-height: 1.5;
        }

        .preview-auth-switch {
          position: relative;
          min-height: 66px;
        }

        .preview-auth-state {
          position: absolute;
          inset: 0;
          display: grid;
          align-items: center;
          transition:
            opacity 220ms ease,
            transform 220ms ease,
            visibility 0s linear 220ms;
        }

        .preview-auth-state-login {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .preview-auth-switch.is-open .preview-auth-state-login {
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transform: translateY(-8px);
        }

        .preview-auth-state-form {
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transform: translateY(8px);
        }

        .preview-auth-switch.is-open .preview-auth-state-form {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
          transform: translateY(0);
          transition-delay: 0s;
        }

        .preview-login-button,
        .preview-login-submit,
        .preview-join-link,
        .preview-action-button,
        .preview-back-button,
        .preview-chat-send,
        .preview-modal-close,
        .preview-admin-chip {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 18px;
          min-height: 54px;
          padding: 0.95rem 1rem;
          color: #f5f7f6;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          font: inherit;
          cursor: pointer;
          backdrop-filter: blur(16px);
        }

        .preview-login-button,
        .preview-login-submit,
        .preview-action-button,
        .preview-chat-send,
        .preview-back-button,
        .preview-modal-close {
          width: 100%;
          background: rgba(255, 255, 255, 0.06);
        }

        .preview-login-button,
        .preview-login-submit {
          border-radius: 999px;
        }

        .preview-login-submit.is-ready {
          background:
            linear-gradient(180deg, rgba(126, 70, 224, 0.92) 0%, rgba(54, 26, 104, 0.96) 58%, rgba(4, 8, 12, 1) 100%);
          box-shadow:
            0 16px 28px rgba(82, 42, 156, 0.28),
            inset 0 1px 0 rgba(255, 255, 255, 0.18);
        }

        .preview-login-panel {
          display: grid;
          gap: 12px;
          padding: 16px;
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(8, 12, 16, 0.8);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.34);
        }

        .preview-login-field {
          display: grid;
          gap: 8px;
        }

        .preview-login-field span {
          color: rgba(244, 255, 248, 0.72);
          text-transform: uppercase;
          letter-spacing: 0.18em;
          font-size: 0.7rem;
        }

        .preview-login-field input,
        .preview-chat-field input,
        .preview-rsvp-select {
          width: 100%;
          min-height: 54px;
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.06);
          color: #f5f7f6;
          padding: 0.85rem 1rem;
          font: inherit;
        }

        .preview-login-field input::placeholder,
        .preview-chat-field input::placeholder {
          color: rgba(244, 255, 248, 0.44);
        }

        .preview-login-field input:focus,
        .preview-chat-field input:focus,
        .preview-rsvp-select:focus {
          outline: 2px solid rgba(245, 231, 197, 0.88);
          outline-offset: 2px;
        }

        .preview-status {
          color: rgba(245, 231, 197, 0.86);
        }

        .preview-status.is-error {
          color: #ffb7b7;
        }

        .preview-join-link {
          text-decoration: none;
          background: transparent;
          border: 0;
          min-height: 40px;
          padding: 0.3rem 0 0;
          color: rgba(244, 255, 248, 0.74);
          letter-spacing: 0.08em;
          text-transform: lowercase;
        }

        .preview-portal-screen,
        .preview-support-screen {
          padding: clamp(20px, 4vw, 28px) 16px 18px;
          background:
            radial-gradient(circle at top, rgba(245, 231, 197, 0.1), transparent 30%),
            linear-gradient(180deg, #05090d 0%, #0a1117 100%);
        }

        .preview-portal-shell,
        .preview-support-shell {
          display: grid;
          gap: 16px;
        }

        .preview-portal-header,
        .preview-support-header {
          display: grid;
          gap: 8px;
          padding-top: 4px;
          text-align: center;
        }

        .preview-portal-header h1,
        .preview-support-header h1 {
          font-size: clamp(2rem, 5vw, 2.8rem);
          line-height: 0.98;
        }

        .preview-portal-lede,
        .preview-support-lede {
          font-size: 0.9rem;
        }

        .preview-portal-qr-area {
          display: flex;
          justify-content: center;
        }

        .preview-qr-card {
          display: grid;
          gap: 10px;
          justify-items: center;
        }

        .preview-qr-grid {
          width: 300px;
          height: 300px;
          display: grid;
          grid-template-columns: repeat(25, 1fr);
          gap: 3px;
          padding: 16px;
          border-radius: 28px;
          background: #fff;
          box-shadow: 0 22px 50px rgba(0, 0, 0, 0.34);
        }

        .preview-qr-cell {
          border-radius: 2px;
          background: #ecebe3;
        }

        .preview-qr-cell.is-dark {
          background: #0b0f12;
        }

        .preview-qr-cell.is-finder {
          border-radius: 0;
        }

        .preview-qr-foot {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          text-align: center;
        }

        .preview-qr-foot span {
          color: rgba(244, 255, 248, 0.64);
          font-size: 0.84rem;
        }

        .preview-qr-foot strong {
          font-size: 0.95rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .preview-portal-summary {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .preview-portal-summary > div,
        .preview-ticket-card,
        .preview-modal {
          border: 1px solid rgba(255, 255, 255, 0.08);
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02)),
            linear-gradient(180deg, rgba(5, 9, 12, 0.92), rgba(4, 7, 10, 0.82));
          box-shadow:
            0 28px 78px rgba(0, 0, 0, 0.42),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }

        .preview-portal-summary > div {
          display: grid;
          gap: 6px;
          padding: 14px;
          border-radius: 18px;
        }

        .preview-summary-kicker,
        .preview-card-kicker {
          color: rgba(234, 243, 238, 0.56);
          text-transform: uppercase;
          letter-spacing: 0.16em;
          font-size: 0.64rem;
        }

        .preview-portal-summary strong,
        .preview-ticket-card h2 {
          font-size: 0.98rem;
          line-height: 1.25;
        }

        .preview-ticket-card {
          display: grid;
          gap: 14px;
          padding: 16px;
          border-radius: 24px;
          text-align: left;
        }

        .preview-ticket-header {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: start;
        }

        .preview-ticket-badge,
        .preview-profile-tag {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 20px;
          padding: 0.08rem 0.5rem;
          border: 1px solid rgba(245, 231, 197, 0.3);
          border-radius: 999px;
          background: rgba(245, 231, 197, 0.12);
          color: rgba(255, 250, 243, 0.94);
          text-transform: uppercase;
          letter-spacing: 0.16em;
          font-size: 0.58rem;
          white-space: nowrap;
        }

        .preview-ticket-meta {
          display: grid;
          gap: 14px;
        }

        .preview-profile-stack {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .preview-profile-photo-frame {
          position: relative;
          flex: 0 0 auto;
          width: 58px;
          height: 58px;
          border-radius: 18px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background:
            radial-gradient(circle at 30% 20%, rgba(245, 231, 197, 0.18), transparent 36%),
            rgba(255, 255, 255, 0.05);
        }

        .preview-profile-photo {
          object-fit: cover;
        }

        .preview-profile-copy {
          display: grid;
          gap: 4px;
          min-width: 0;
        }

        .preview-profile-copy p {
          margin: 0;
          color: rgba(244, 250, 245, 0.72);
          font-size: 0.78rem;
          line-height: 1.35;
        }

        .preview-ticket-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin: 0;
        }

        .preview-ticket-grid div {
          display: grid;
          gap: 4px;
        }

        .preview-ticket-grid dt {
          color: rgba(255, 255, 255, 0.72);
          text-transform: uppercase;
          letter-spacing: 0.16em;
          font-size: 0.7rem;
        }

        .preview-ticket-grid dd {
          margin: 0;
          font-size: 0.95rem;
        }

        .preview-rsvp-row {
          display: flex;
        }

        .preview-rsvp-select {
          min-height: 48px;
        }

        .preview-rsvp-note {
          font-size: 0.84rem;
        }

        .preview-action-stack {
          display: grid;
          gap: 10px;
        }

        .preview-action-button.is-secondary {
          background: rgba(255, 255, 255, 0.04);
        }

        .preview-support-chat {
          display: grid;
          gap: 12px;
        }

        .preview-chat-thread {
          display: grid;
          gap: 12px;
          text-align: left;
        }

        .preview-chat-bubble {
          display: grid;
          gap: 10px;
          padding: 0.9rem 1rem;
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          line-height: 1.5;
        }

        .preview-chat-bubble.is-agent {
          align-self: flex-start;
          background: rgba(255, 255, 255, 0.08);
        }

        .preview-chat-bubble.is-guest {
          align-self: flex-end;
          background: rgba(126, 70, 224, 0.24);
        }

        .preview-chat-bubble-head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
          font-size: 0.72rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .preview-chat-identity {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .preview-chat-avatar {
          position: relative;
          display: grid;
          place-items: center;
          width: 24px;
          height: 24px;
          border-radius: 999px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.1);
          flex: 0 0 auto;
        }

        .preview-chat-avatar.is-letter {
          font-size: 0.72rem;
          line-height: 1;
        }

        .preview-chat-avatar img {
          object-fit: cover;
        }

        .preview-chat-bubble time {
          color: rgba(255, 255, 255, 0.42);
          letter-spacing: 0.04em;
          font-size: 0.62rem;
        }

        .preview-quick-replies {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .preview-quick-reply {
          min-height: 44px;
          border-radius: 16px;
          padding: 0.7rem 0.9rem;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.05);
          color: #f5f7f6;
          letter-spacing: 0.08em;
        }

        .preview-chat-form {
          display: grid;
          grid-template-columns: minmax(0, 8fr) minmax(72px, 2fr);
          gap: 10px;
          align-items: stretch;
        }

        .preview-back-button {
          background: rgba(255, 255, 255, 0.04);
        }

        .preview-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 40;
          display: grid;
          place-items: center;
          padding: 20px;
          background: rgba(4, 8, 12, 0.74);
          backdrop-filter: blur(12px);
        }

        .preview-modal {
          width: min(100%, 440px);
          border-radius: 24px;
          padding: 1.1rem 1.1rem 1rem;
        }

        .preview-modal-copy {
          display: grid;
          gap: 10px;
          margin-top: 1rem;
        }

        .preview-modal-close {
          margin-top: 1rem;
          border-color: rgba(246, 209, 93, 0.28);
          background: linear-gradient(180deg, rgba(246, 209, 93, 0.18), rgba(246, 209, 93, 0.08));
        }

        @media (max-width: 960px) {
          .preview-admin-bar {
            align-items: start;
            flex-direction: column;
          }

          .preview-stage-frame {
            border-radius: 24px;
          }
        }

        @media (max-width: 640px) {
          .preview-page {
            padding: 14px;
          }

          .preview-stage-frame {
            border-radius: 20px;
          }

          .preview-hero-content {
            padding: 16px;
          }

          .preview-cta-band {
            padding: 16px 12px 20px;
          }

          .preview-portal-summary,
          .preview-ticket-grid,
          .preview-chat-form {
            grid-template-columns: 1fr;
          }

          .preview-qr-grid {
            width: min(78vw, 300px);
            height: min(78vw, 300px);
          }
        }
      `}</style>
    </main>
  );
}
