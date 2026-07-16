"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import heroImage from "../../image.png";
import profileImage from "../../selfie.jpg";

const OTPLENGTH = 5;
const PHONE_LENGTH = 10;
const LOGOUT_REASON_KEY = "fifa-half-time-show-logout-reason";

const QUICK_REPLIES = [
  {
    label: "What is this party about?",
    message: "What is this party about?",
  },
  {
    label: "How do I register?",
    message: "How do I register?",
  },
  {
    label: "What happens after the survey?",
    message: "What happens after the survey?",
  },
  {
    label: "Help with login",
    message: "I need help with login / OTP.",
  },
];

const SURVEY_SOURCE_OPTIONS = ["Friends", "Eventbrite", "Instagram", "Volleyball", "Run Club"];
const SURVEY_YES_NO = ["Yes", "No"];

function normalize(value) {
  return String(value ?? "").trim();
}

function normalizePhoneNumber(value) {
  return normalize(value).replace(/\D/g, "").slice(0, PHONE_LENGTH);
}

function formatPhoneNumber(value) {
  const digits = normalize(value).replace(/\D/g, "");
  if (digits.length !== 10) return normalize(value);
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function makeSupportThread(name = "there") {
  const createdAt = new Date().toISOString();
  return [
    {
      role: "assistant",
      name: "Miranda",
      text: `Hi ${name}, welcome to FIFA X BTS support. My name is Miranda. How can I help you today?`,
      createdAt,
    },
  ];
}

function phoneToInviteToken(phoneNumber) {
  const digits = normalizePhoneNumber(phoneNumber);
  return digits ? `demo-${digits}` : "demo-guest";
}

function PreviewQr({ token, barcode }) {
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function generateQr() {
      if (typeof window === "undefined") {
        return;
      }

      try {
        const { default: QRCode } = await import("qrcode");
        const safeToken = normalize(token) || "guest";
        const value = `${window.location.origin}/portal?invite=${encodeURIComponent(safeToken)}`;
        const url = await QRCode.toDataURL(value, {
          errorCorrectionLevel: "M",
          margin: 2,
          width: 420,
          color: {
            dark: "#0b0f12",
            light: "#ffffff",
          },
        });

        if (isMounted) {
          setQrDataUrl(url);
        }
      } catch {
        if (isMounted) {
          setQrDataUrl("");
        }
      }
    }

    void generateQr();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const barcodeValue = normalize(barcode).replace(/\D/g, "").slice(0, 5);

  return (
    <div className="qr-block">
      <div className="qr-code" aria-label="Unique QR code for your invite" role="img">
        {qrDataUrl ? <img alt="" className="qr-image" src={qrDataUrl} /> : <div className="qr-loading" aria-hidden="true" />}
      </div>
      <p className="qr-caption">Unique QR code for your invite</p>
      {barcodeValue ? <p className="qr-barcode is-visible">barcode: {barcodeValue}</p> : null}
    </div>
  );
}

function SendMessageIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <path
        d="M3.5 20.5 20.5 12 3.5 3.5l3.2 7.2L14 12l-7.3 1.3-3.2 7.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function HomeScreen({
  isLoginPanelOpen,
  phoneNumber,
  phoneStatus,
  phoneError,
  isSendingCode,
  logoutNotice,
  joinLinkLabel,
  shouldShowSpotWarning,
  spotsLeft,
  phoneInputRef,
  onOpenLogin,
  onPhoneChange,
  onSendCode,
}) {
  return (
    <main className="portal-preview-guest home-page page-shell">
      <section className="hero-stage">
        <div className="hero-media">
          <Image alt="" className="hero-image" fill priority sizes="100vw" src={heroImage} />
          <div className="hero-overlay" aria-hidden="true" />
        </div>

        <div className="hero-content">
          <div className="cta-band">
            {logoutNotice ? (
              <p className="login-status" role="status">
                {logoutNotice}
              </p>
            ) : null}

            {shouldShowSpotWarning ? (
              <div className="login-warning" role="status" aria-live="polite">
                <strong>{spotsLeft} spots left</strong>
                <span>Hurry, the guest list is nearly full.</span>
              </div>
            ) : null}

            <div className={`auth-switch ${isLoginPanelOpen ? "is-open" : ""}`}>
              <div className="auth-state auth-state-login" aria-hidden={isLoginPanelOpen}>
                <button className="login-button" onClick={onOpenLogin} type="button">
                  Login
                </button>
              </div>

              <form className="auth-state auth-state-form login-panel" onSubmit={onSendCode}>
                <label className="login-field">
                  <span>phone number</span>
                  <input
                    autoComplete="tel"
                    inputMode="tel"
                    name="phoneNumber"
                    onChange={(event) => onPhoneChange(event.target.value)}
                    placeholder="Enter phone number"
                    ref={phoneInputRef}
                    type="tel"
                    value={phoneNumber}
                  />
                </label>

                {phoneError ? (
                  <p className="login-status is-error" role="status">
                    {phoneError}
                  </p>
                ) : phoneStatus ? (
                  <p className="login-status" role="status">
                    {phoneStatus}
                  </p>
                ) : null}

                <button className="login-submit is-ready" disabled={isSendingCode} type="submit">
                  {isSendingCode ? "sending code..." : "Login"}
                </button>
              </form>
            </div>

            <Link className="join-link" href="/dashboard">
              {joinLinkLabel}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function LoginOtpModal({ isOpen, phoneNumber, onClose, onSkip, onVerified }) {
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const otpInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setOtpCode("");
      setError("");
      setIsSubmitting(false);
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => otpInputRef.current?.focus?.());
    return () => window.cancelAnimationFrame(frame);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  async function handleVerifyCode(event) {
    event.preventDefault();
    const digitsOnly = normalize(otpCode).replace(/\D/g, "");

    if (digitsOnly.length !== OTPLENGTH || isSubmitting) {
      setError(`Please enter the ${OTPLENGTH}-digit code from your text message.`);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      onVerified({
        inviteToken: phoneToInviteToken(phoneNumber),
        phoneNumber: normalizePhoneNumber(phoneNumber),
        supportAccessToken: "demo-support-token",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to verify code.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="login-modal-backdrop" onClick={onClose} role="presentation">
      <section
        aria-labelledby="login-modal-title"
        aria-modal="true"
        className="login-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <button
          aria-label="Close login dialog"
          className="login-modal-close"
          onClick={onClose}
          type="button"
        >
          ×
        </button>

        <p className="login-modal-eyebrow">login</p>
        <h2 id="login-modal-title">Enter the {OTPLENGTH}-digit code</h2>
        <p className="login-modal-copy">Check your SMS and type the code below to continue.</p>

        <form className="login-modal-form" onSubmit={handleVerifyCode}>
          <label className="login-modal-field">
            <span>verification code</span>
            <input
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={OTPLENGTH}
              name="otpCode"
              onChange={(event) => setOtpCode(event.target.value)}
              placeholder="12345"
              ref={otpInputRef}
              type="text"
              value={otpCode}
            />
          </label>

          {error ? (
            <p className="login-modal-status is-error" role="status">
              {error}
            </p>
          ) : null}

          <div className="login-modal-actions">
            <button className="login-modal-secondary" disabled={isSubmitting} onClick={onClose} type="button">
              back
            </button>
            <button className="login-modal-secondary" disabled={isSubmitting} onClick={onSkip} type="button">
              skip demo
            </button>
            <button className="login-modal-submit" disabled={isSubmitting} type="submit">
              {isSubmitting ? "verifying..." : "verify"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function PrivacyPolicyGateModal({ isSubmitting, error, onAgree }) {
  const bodyRef = useRef(null);

  useEffect(() => {
    const body = bodyRef.current;
    if (body) body.scrollTop = 0;
  }, []);

  return (
    <div className="portal-modal-backdrop" role="presentation">
      <article aria-modal="true" className="portal-modal portal-privacy-modal" role="dialog">
        <p className="portal-modal-kicker">privacy policy</p>
        <h2>please agree to continue</h2>
        <div className="portal-privacy-copy" ref={bodyRef}>
          <p>
            We use your name, phone number, profile photo, RSVP, and support details to manage
            your registration and event communications.
          </p>
          <p>
            We do not sell your information. We share it only with trusted service providers who
            help us run the event.
          </p>
          <p>
            We keep it only as long as needed for event operations, safety, and legal or security
            requirements.
          </p>
          <p className="portal-privacy-scroll-note">
            Scroll to the end to unlock the agreement button.
          </p>
        </div>
        {error ? <p className="portal-privacy-error">{error}</p> : null}
        <button
          className="portal-modal-close portal-privacy-agree"
          disabled={isSubmitting}
          onClick={onAgree}
          type="button"
        >
          {isSubmitting ? "agreeing..." : "i agree"}
        </button>
      </article>
    </div>
  );
}

function LockedNoticeModal({ onClose }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="portal-modal-backdrop" role="presentation" onClick={onClose}>
      <article
        aria-modal="true"
        className="portal-modal"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="portal-modal-kicker">things to know</p>
        <h2>stay tuned for future announcements!</h2>
        <button className="portal-modal-close" onClick={onClose} type="button">
          close
        </button>
      </article>
    </div>
  );
}

function PortalTicketCard({
  displayName,
  inviteToken,
  phoneNumber,
  rsvp,
  profilePhotoUrl,
  profilePhotoTag,
  profilePhotoAiGenerated,
  onRsvpChange,
  onClose,
}) {
  const [clockTick, setClockTick] = useState(() => Date.now());
  const locked = clockTick >= new Date("2026-07-17T00:00:00-04:00").getTime();

  useEffect(() => {
    const timer = window.setTimeout(() => setClockTick(Date.now()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <article className="portal-card is-open">
      <div className="portal-card-header">
        <h2>about my ticket</h2>
        <button aria-label="Close about my ticket" className="portal-card-close" onClick={onClose} type="button">
          ×
        </button>
      </div>
      <div className="portal-card-body">
        <div className="portal-profile-preview">
          <div className="portal-profile-photo-frame">
            {profilePhotoUrl ? (
              <Image alt="" fill className="portal-profile-photo" src={profilePhotoUrl} />
            ) : (
              <span className="portal-profile-photo-fallback" aria-hidden="true">
                {(displayName.split(" ").filter(Boolean).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("") || "G")}
              </span>
            )}
          </div>
          <div className="portal-profile-meta">
            <div className="portal-profile-meta-row">
              <strong>{displayName}</strong>
              {profilePhotoTag ? (
                <span className={`portal-profile-tag ${profilePhotoAiGenerated ? "is-ai" : ""}`}>{profilePhotoTag}</span>
              ) : null}
            </div>
            <p>{profilePhotoAiGenerated ? "AI-generated profile photo" : "Uploaded profile photo"}</p>
          </div>
        </div>

        <dl className="portal-ticket-meta">
          <div>
            <dt>Name</dt>
            <dd>{displayName}</dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>{formatPhoneNumber(phoneNumber) || inviteToken}</dd>
          </div>
        </dl>

        <div className="portal-rsvp-row">
          <select
            aria-label="RSVP"
            className="portal-rsvp-select"
            value={rsvp}
            disabled={locked}
            onChange={(event) => onRsvpChange(event.target.value)}
          >
            <option value="Going">Going</option>
            <option value="maybe">maybe</option>
            <option value="not going">not going</option>
          </select>
        </div>

        <p className="portal-rsvp-note">
          make sure you finalize whether you can make it or not in 48 hours prior to the event day.
        </p>
      </div>
    </article>
  );
}

function ThingsToKnowCard({ onLockedClick }) {
  return (
    <article className="portal-card portal-things-card">
      <button
        aria-label="Things to know, locked"
        className="portal-things-trigger"
        onClick={onLockedClick}
        type="button"
      >
        <span>things to know</span>
        <span aria-hidden="true" className="portal-things-trigger-lock">
          🔒
        </span>
      </button>
    </article>
  );
}

function PortalScreen({
  invite,
  displayName,
  inviteToken,
  isCheckedIn,
  activePanel,
  onOpenTicket,
  onCloseTicket,
  onRsvpChange,
  onOpenSupport,
  onLogout,
  onShowThings,
}) {
  const portalTitle = invite.rsvp === "maybe" ? "Are you going?" : invite.rsvp === "not going" ? "You cant make it" : "You are going";

  return (
    <main className="app-frame portal-page">
      <section className="portal-shell">
        {isCheckedIn ? <p className="portal-checkin-banner">You have been checked-in</p> : null}

        <header className="portal-header">
          <h1>{portalTitle}</h1>
        </header>

        <section className="portal-qr-area" aria-label="Your QR code">
          <PreviewQr token={inviteToken} barcode={invite.barcode || "12345"} />
        </section>

        <section className="portal-actions" aria-label="Portal actions">
          {activePanel === "ticket" ? (
            <PortalTicketCard
              displayName={displayName}
              inviteToken={inviteToken}
              phoneNumber={invite.phoneNumber}
              rsvp={invite.rsvp}
              profilePhotoUrl={invite.profilePhotoUrl}
              profilePhotoTag={invite.profilePhotoTag}
              profilePhotoAiGenerated={invite.profilePhotoAiGenerated}
              onClose={onCloseTicket}
              onRsvpChange={onRsvpChange}
            />
          ) : (
            <button className="portal-action-button" onClick={onOpenTicket} type="button">
              about my ticket
            </button>
          )}

          <ThingsToKnowCard onLockedClick={onShowThings} />

          <button className="portal-action-button" onClick={onOpenSupport} type="button">
            questions?
          </button>

          <button className="portal-action-button portal-logout-button" onClick={onLogout} type="button">
            Log out
          </button>
        </section>
      </section>
    </main>
  );
}

function SupportScreen({ inviteToken, customerName, customerPhotoUrl, customerPhotoTag, messages, value, isSending, connectionStatus, error, onBack, onQuickReply, onValueChange, onSend, onFinish }) {
  const draftPresent = value.trim().length > 0;
  const hasStartedConversation = messages.some((message) => message.role === "user");

  return (
    <main className="app-frame support-page">
      <section className="support-shell">
        <header className="support-header">
          <p className="support-eyebrow">support</p>
          <h1>Live chat</h1>
        </header>

        <section className="chatbot-shell support-chatbot" aria-label="Support chat">
          <div className="support-top-actions">
            <button className="support-back-button" onClick={onBack} type="button">
              back
            </button>
          </div>

          <div className="support-chat-stage">
            <div className="support-live-panel">
              <div className="chatbot-messages">
                {messages.map((message, index) => (
                  <article className={`chatbot-message chatbot-message-${message.role}`} key={`${message.role}-${index}`}>
                    <header className="chatbot-message-header">
                      <div className="chatbot-message-identity">
                        <span
                          className={`chatbot-avatar ${message.role === "user" ? "is-user" : "is-support"}`}
                          aria-hidden="true"
                        >
                          {message.role === "user" && customerPhotoUrl ? (
                            <img alt="" src={customerPhotoUrl} />
                          ) : message.role === "user" ? (
                            customerName
                              .split(" ")
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((part) => part.charAt(0).toUpperCase())
                              .join("") || "Y"
                          ) : (
                            "M"
                          )}
                        </span>
                        <span className="chatbot-message-name-wrap">
                          <strong>
                            {message.role === "user" ? customerName || "You" : message.name || "Miranda"}
                          </strong>
                          {message.role === "user" && normalize(customerPhotoTag) ? (
                            <span className="chatbot-profile-tag">{customerPhotoTag}</span>
                          ) : null}
                        </span>
                      </div>
                      <time dateTime={message.createdAt || ""}>
                        {new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(message.createdAt))}
                      </time>
                    </header>
                    {message.text}
                  </article>
                ))}
              </div>

              {hasStartedConversation && connectionStatus ? (
                <p className="chatbot-connection-status" role="status" aria-live="polite">
                  {connectionStatus}
                </p>
              ) : null}

              {error ? (
                <p className="chatbot-error" role="alert">
                  {error}
                </p>
              ) : null}

              <div className="chatbot-compose">
                <div className="support-quick-replies" aria-label="Quick questions">
                  {QUICK_REPLIES.map((reply) => (
                    <button
                      className="support-quick-reply"
                      disabled={isSending}
                      key={reply.label}
                      onClick={() => onQuickReply(reply.message)}
                      type="button"
                    >
                      {reply.label}
                    </button>
                  ))}
                </div>

                <form className="chatbot-form" onSubmit={onSend}>
                  <input
                    aria-label="Send a message"
                    placeholder="Type your message..."
                    value={value}
                    onChange={(event) => onValueChange(event.target.value)}
                    type="text"
                  />
                  <button
                    aria-label="Send message"
                    className={`chatbot-send-button ${draftPresent ? "is-ready" : "is-idle"}`}
                    disabled={isSending || !draftPresent}
                    type="submit"
                  >
                    {isSending ? <span className="chatbot-send-loading">...</span> : <SendMessageIcon />}
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="support-bottom-actions">
            <button className="support-finish-button" onClick={onFinish} type="button">
              finish the chat
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}

function SurveyScreen({ answers, error, isSubmitting, onChange, onSubmit }) {
  const isFriends = answers.howDidYouKnow === "Friends";
  const isComplete =
    Boolean(answers.howDidYouKnow) &&
    (!isFriends || Boolean(normalize(answers.referredBy))) &&
    Boolean(normalize(answers.dietaryRestrictions)) &&
    Boolean(answers.resident);

  return (
    <main className="app-frame survey-page is-visible">
      <section className="survey-shell">
        <header className="survey-header">
          <h1>survey</h1>
        </header>

        <form className="survey-form" onSubmit={onSubmit}>
          <label className="survey-question">
            <span className="survey-question-text">Q. How did you get to know about this event?</span>
            <select
              className="survey-control"
              onChange={(event) => onChange("howDidYouKnow", event.target.value)}
              value={answers.howDidYouKnow}
            >
              <option value="">Select one</option>
              {SURVEY_SOURCE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          {isFriends ? (
            <label className="survey-question">
              <span className="survey-question-text">
                Q. If you chose friends, how referred you / invited you to this event?
              </span>
              <input
                className="survey-control"
                onChange={(event) => onChange("referredBy", event.target.value)}
                placeholder="Name"
                type="text"
                value={answers.referredBy}
              />
            </label>
          ) : null}

          <label className="survey-question">
            <span className="survey-question-text">Q. Do you have any dietary restrictions?</span>
            <input
              className="survey-control"
              onChange={(event) => onChange("dietaryRestrictions", event.target.value)}
              placeholder="Type your answer"
              type="text"
              value={answers.dietaryRestrictions}
            />
          </label>

          <label className="survey-question">
            <span className="survey-question-text">
              Q. Are you a resident in this building where the party is hosted?
            </span>
            <select
              className="survey-control"
              onChange={(event) => onChange("resident", event.target.value)}
              value={answers.resident}
            >
              <option value="">Select one</option>
              {SURVEY_YES_NO.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <div className="survey-submit-row">
            {error ? <p className="survey-error">{error}</p> : null}
            <button
              className={`survey-submit ${isComplete ? "is-ready" : ""}`}
              disabled={!isComplete || isSubmitting}
              type="submit"
            >
              {isSubmitting ? "submitting..." : "submit"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

function WaitlistScreen({ onContinue }) {
  return (
    <main className="app-frame thank-you-page is-visible">
      <section className="thank-you-shell">
        <header className="thank-you-header">
          <h1>waitlist</h1>
        </header>

        <div className="thank-you-qr-stack waitlist-stack">
          <p className="waitlist-copy">this needs to be completed to join the party</p>
          <button className="thank-you-return is-visible waitlist-action" onClick={onContinue} type="button">
            Take a quick survey
          </button>
        </div>
      </section>
    </main>
  );
}

function SurveyDoneScreen() {
  return (
    <main className="app-frame survey-done-page is-visible">
      <section className="survey-done-shell">
        <header className="survey-done-header">
          <h1>Thank you.</h1>
        </header>
        <p className="survey-done-copy">stay tuned for more updates!</p>
      </section>
    </main>
  );
}

export default function PortalPreviewPage() {
  const [screen, setScreen] = useState("home");
  const [journeyMode, setJourneyMode] = useState("party");
  const [isLoginPanelOpen, setIsLoginPanelOpen] = useState(false);
  const [isOtpOpen, setIsOtpOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneStatus, setPhoneStatus] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [logoutNotice, setLogoutNotice] = useState("");
  const [inviteCount, setInviteCount] = useState(0);
  const [capacity, setCapacity] = useState(null);
  const [availabilityLoaded, setAvailabilityLoaded] = useState(false);
  const phoneInputRef = useRef(null);
  const [invite, setInvite] = useState({
    firstName: "Demo",
    lastName: "Guest",
    phoneNumber: "4165550198",
    rsvp: "Going",
    barcode: "12345",
    checkedInAt: new Date().toISOString(),
    profilePhotoUrl: profileImage,
    profilePhotoTag: "uploaded",
    profilePhotoAiGenerated: false,
    privacyPolicyAccepted: false,
    privacyPolicyAcceptedAt: "",
  });
  const [showPrivacyGate, setShowPrivacyGate] = useState(false);
  const [privacySubmitting, setPrivacySubmitting] = useState(false);
  const [privacyError, setPrivacyError] = useState("");
  const [activePanel, setActivePanel] = useState(null);
  const [showLockedNotice, setShowLockedNotice] = useState(false);
  const [supportMessages, setSupportMessages] = useState(() => makeSupportThread("Demo Guest"));
  const [supportValue, setSupportValue] = useState("");
  const [supportError, setSupportError] = useState("");
  const [supportConnectionStatus, setSupportConnectionStatus] = useState("");
  const [supportSending, setSupportSending] = useState(false);
  const [surveyAnswers, setSurveyAnswers] = useState({
    howDidYouKnow: "",
    referredBy: "",
    dietaryRestrictions: "",
    resident: "",
  });
  const [surveyError, setSurveyError] = useState("");
  const [surveySubmitting, setSurveySubmitting] = useState(false);

  const displayName = `${invite.firstName} ${invite.lastName}`.trim() || "guest";
  const inviteToken = phoneToInviteToken(invite.phoneNumber);
  const customerPhotoUrl = invite.profilePhotoUrl || profileImage;
  const customerPhotoTag = invite.profilePhotoTag || "uploaded";
  const spotsLeft =
    availabilityLoaded && capacity !== null ? Math.max(0, Number(capacity) - Number(inviteCount)) : null;
  const shouldShowSpotWarning = spotsLeft !== null && spotsLeft > 0 && spotsLeft <= 5;
  const joinLinkLabel = spotsLeft === 0 ? "join the waitlist" : "join the watch party";
  const isComplete = Boolean(
    surveyAnswers.howDidYouKnow &&
      surveyAnswers.dietaryRestrictions &&
      surveyAnswers.resident &&
      (!surveyAnswers.referredBy || surveyAnswers.howDidYouKnow !== "Friends"),
  );

  useEffect(() => {
    if (!showPrivacyGate) {
      return undefined;
    }

    setActivePanel("ticket");
    return undefined;
  }, [showPrivacyGate]);

  useEffect(() => {
    const reason = window.sessionStorage.getItem(LOGOUT_REASON_KEY);
    if (reason === "idle") {
      setLogoutNotice("You were signed out after 15 minutes of inactivity.");
      window.sessionStorage.removeItem(LOGOUT_REASON_KEY);
    }
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (isLoginPanelOpen) {
        phoneInputRef.current?.focus?.();
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isLoginPanelOpen]);

  useEffect(() => {
    let cancelled = false;

    async function loadAvailability() {
      try {
        const response = await fetch("https://fifa-control.onrender.com/api/invites", {
          cache: "no-store",
        });
        const data = await response.json();

        if (!cancelled && response.ok && data.ok) {
          setInviteCount(Number(data.registeredCount ?? data.inviteCount ?? 0));
          setCapacity(data.capacity === null || data.capacity === undefined ? null : Number(data.capacity));
          setAvailabilityLoaded(true);
        }
      } catch {
        // Best effort only.
      }
    }

    void loadAvailability();

    return () => {
      cancelled = true;
    };
  }, []);

  function resetReplay(nextMode = journeyMode) {
    setJourneyMode(nextMode);
    setScreen("home");
    setIsLoginPanelOpen(false);
    setIsOtpOpen(false);
    setPhoneNumber("");
    setPhoneStatus("");
    setPhoneError("");
    setIsSendingCode(false);
    setInvite((current) => ({
      ...current,
      rsvp: "Going",
      privacyPolicyAccepted: false,
      privacyPolicyAcceptedAt: "",
    }));
    setShowPrivacyGate(false);
    setPrivacySubmitting(false);
    setPrivacyError("");
    setActivePanel(null);
    setShowLockedNotice(false);
    setSupportMessages(makeSupportThread("Demo Guest"));
    setSupportValue("");
    setSupportError("");
    setSupportConnectionStatus("");
    setSupportSending(false);
    setSurveyAnswers({
      howDidYouKnow: "",
      referredBy: "",
      dietaryRestrictions: "",
      resident: "",
    });
    setSurveyError("");
    setSurveySubmitting(false);
  }

  function handleOpenLogin() {
    setIsLoginPanelOpen(true);
  }

  function handleSendCode(event) {
    event.preventDefault();

    if (!isLoginPanelOpen) {
      setIsLoginPanelOpen(true);
      return;
    }

    const digitsOnly = normalizePhoneNumber(phoneNumber);
    if (digitsOnly.length !== PHONE_LENGTH || isSendingCode) {
      setPhoneError("Please enter the 10-digit phone number you used to register.");
      return;
    }

    setIsSendingCode(true);
    setPhoneError("");
    setPhoneStatus(`We sent a ${OTPLENGTH}-digit code to your phone.`);
    setIsOtpOpen(true);
    setIsSendingCode(false);
  }

  function handleLoginSuccess() {
    setIsOtpOpen(false);
    if (journeyMode === "waitlist") {
      setScreen("waitlist");
      setSupportMessages(makeSupportThread(displayName));
      return;
    }

    setScreen("portal");
    setShowPrivacyGate(true);
    setSupportMessages(makeSupportThread(displayName));
  }

  async function handleAgreePrivacy() {
    if (privacySubmitting) return;

    setPrivacySubmitting(true);
    setPrivacyError("");

    try {
      setInvite((current) => ({
        ...current,
        privacyPolicyAccepted: true,
        privacyPolicyAcceptedAt: new Date().toISOString(),
      }));
      setShowPrivacyGate(false);
    } catch (error) {
      setPrivacyError(error instanceof Error ? error.message : "Unable to save your agreement.");
    } finally {
      setPrivacySubmitting(false);
    }
  }

  function handleLogout() {
    resetReplay();
  }

  function handleSendSupport(event) {
    event.preventDefault();
    const trimmed = normalize(supportValue);
    if (!trimmed || supportSending) return;

    setSupportSending(true);
    setSupportError("");
    setSupportMessages((current) => [
      ...current,
      {
        role: "user",
        name: displayName,
        text: trimmed,
        createdAt: new Date().toISOString(),
        photoUrl: customerPhotoUrl,
        photoTag: customerPhotoTag,
      },
    ]);
    setSupportValue("");
    setSupportConnectionStatus("");

    window.setTimeout(() => {
      setSupportMessages((current) => [
        ...current,
        {
          role: "assistant",
          name: "Miranda",
          text: "Got it. I’m checking that now.",
          createdAt: new Date().toISOString(),
        },
      ]);
      setSupportSending(false);
    }, 350);
  }

  function handleQuickReply(message) {
    setSupportValue(message);
  }

  function handleFinishChat() {
    setScreen("survey");
  }

  function handleSurveyChange(field, value) {
    setSurveyError("");
    setSurveyAnswers((current) => {
      const next = { ...current, [field]: value };
      if (field === "howDidYouKnow" && value !== "Friends") {
        next.referredBy = "";
      }
      return next;
    });
  }

  function handleSurveySubmit(event) {
    event.preventDefault();
    if (!isComplete || surveySubmitting) return;

    setSurveySubmitting(true);
    setSurveyError("");
    window.setTimeout(() => {
      setSurveySubmitting(false);
      setScreen("survey-done");
    }, 250);
  }

  useEffect(() => {
    if (screen !== "survey-done") {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      resetReplay();
    }, 1100);

    return () => window.clearTimeout(timer);
  }, [screen]);

  return (
    <main className="portal-preview-replay">
      <header className="portal-preview-admin-bar">
        <div>
          <p className="eyebrow">thread 02</p>
          <h1>Portal preview</h1>
        </div>
        <div className="portal-preview-admin-actions">
          <button
            className={`portal-preview-reset ${journeyMode === "party" ? "is-active" : ""}`}
            onClick={() => resetReplay("party")}
            type="button"
          >
            watch party
          </button>
          <button
            className={`portal-preview-reset ${journeyMode === "waitlist" ? "is-active" : ""}`}
            onClick={() => resetReplay("waitlist")}
            type="button"
          >
            waitlist
          </button>
          <button className="portal-preview-reset" onClick={resetReplay} type="button">
            reset
          </button>
          <Link className="portal-preview-reset is-link" href="/dashboard">
            back
          </Link>
        </div>
      </header>

      <section className="portal-preview-stage-frame">
        {screen === "home" ? (
          <HomeScreen
            isLoginPanelOpen={isLoginPanelOpen}
            isSendingCode={isSendingCode}
            joinLinkLabel={joinLinkLabel}
            logoutNotice={logoutNotice}
            onOpenLogin={handleOpenLogin}
            onPhoneChange={setPhoneNumber}
            onSendCode={handleSendCode}
            phoneError={phoneError}
            phoneInputRef={phoneInputRef}
            phoneNumber={phoneNumber}
            phoneStatus={phoneStatus}
            shouldShowSpotWarning={shouldShowSpotWarning}
            spotsLeft={spotsLeft}
          />
        ) : screen === "portal" ? (
          <PortalScreen
            activePanel={activePanel}
            displayName={displayName}
            isCheckedIn={Boolean(invite.checkedInAt)}
            invite={invite}
            inviteToken={inviteToken}
            onLogout={handleLogout}
            onOpenSupport={() => {
              setScreen("support");
              setSupportMessages((current) =>
                current.length ? current : makeSupportThread(displayName),
              );
            }}
            onOpenTicket={() => setActivePanel("ticket")}
            onCloseTicket={() => setActivePanel(null)}
            onRsvpChange={(nextRsvp) => setInvite((current) => ({ ...current, rsvp: nextRsvp }))}
            onShowThings={() => setShowLockedNotice(true)}
          />
        ) : screen === "waitlist" ? (
          <WaitlistScreen onContinue={() => setScreen("survey")} />
        ) : screen === "support" ? (
          <SupportScreen
            connectionStatus={supportConnectionStatus}
            customerName={displayName}
            customerPhotoTag={customerPhotoTag}
            customerPhotoUrl={customerPhotoUrl}
            error={supportError}
            inviteToken={inviteToken}
            isSending={supportSending}
            messages={supportMessages}
            onBack={() => setScreen("portal")}
            onFinish={handleFinishChat}
            onQuickReply={handleQuickReply}
            onSend={handleSendSupport}
            onValueChange={setSupportValue}
            value={supportValue}
          />
        ) : screen === "survey" ? (
          <SurveyScreen
            answers={surveyAnswers}
            error={surveyError}
            isSubmitting={surveySubmitting}
            onChange={handleSurveyChange}
            onSubmit={handleSurveySubmit}
          />
        ) : (
          <SurveyDoneScreen />
        )}

        {isOtpOpen ? (
          <LoginOtpModal
            isOpen={isOtpOpen}
            onClose={() => setIsOtpOpen(false)}
            onSkip={handleLoginSuccess}
            onVerified={handleLoginSuccess}
            phoneNumber={phoneNumber}
          />
        ) : null}

        {showPrivacyGate ? (
          <PrivacyPolicyGateModal
            error={privacyError}
            isSubmitting={privacySubmitting}
            onAgree={handleAgreePrivacy}
          />
        ) : null}

        {showLockedNotice ? <LockedNoticeModal onClose={() => setShowLockedNotice(false)} /> : null}
      </section>

      <style jsx global>{`
        .portal-preview-replay {
          min-height: 100svh;
          padding: clamp(16px, 3vw, 30px);
          background:
            radial-gradient(circle at top, rgba(246, 209, 93, 0.12), transparent 28%),
            linear-gradient(180deg, #05090d 0%, #0b1116 100%);
        }

        .portal-preview-admin-bar {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 16px;
          width: min(100%, 1280px);
          margin: 0 auto 16px;
        }

        .portal-preview-admin-bar h1 {
          margin: 0;
          font-size: clamp(1.8rem, 4vw, 3rem);
          line-height: 0.95;
          letter-spacing: -0.06em;
        }

        .portal-preview-admin-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .portal-preview-reset {
          min-height: 40px;
          padding: 0 14px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.05);
          color: rgba(244, 255, 248, 0.76);
          text-transform: uppercase;
          letter-spacing: 0.14em;
          font-size: 0.68rem;
          text-decoration: none;
        }

        .portal-preview-reset.is-active {
          border-color: rgba(246, 209, 93, 0.28);
          background: rgba(246, 209, 93, 0.12);
          color: #fff4cf;
        }

        .portal-preview-reset.is-link {
          display: inline-flex;
          align-items: center;
        }

        .portal-preview-stage-frame {
          position: relative;
          width: min(100%, 1280px);
          margin: 0 auto;
          overflow: hidden;
          border-radius: 34px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 36px 100px rgba(0, 0, 0, 0.52);
          background: #05090d;
        }

        .portal-preview-stage-frame .page-shell,
        .portal-preview-stage-frame .app-frame {
          min-height: min(100svh, 980px);
          color: #f5f7f6;
        }

        .portal-preview-stage-frame .home-page,
        .portal-preview-stage-frame .portal-page,
        .portal-preview-stage-frame .support-page,
        .portal-preview-stage-frame .survey-page,
        .portal-preview-stage-frame .survey-done-page {
          min-height: min(100svh, 980px);
          color: #f5f7f6;
        }

        .portal-preview-stage-frame .thank-you-page {
          min-height: min(100svh, 980px);
          color: #f5f7f6;
          padding: clamp(20px, 4vw, 44px);
          background:
            radial-gradient(circle at top, rgba(245, 231, 197, 0.12), transparent 30%),
            linear-gradient(180deg, #05090d 0%, #0a1117 100%);
        }

        .portal-preview-stage-frame .thank-you-shell {
          min-height: calc(100svh - clamp(40px, 8vw, 88px));
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
          gap: 22px;
          text-align: center;
        }

        .portal-preview-stage-frame .thank-you-header {
          width: 100%;
          padding-top: clamp(10px, 6vh, 56px);
        }

        .portal-preview-stage-frame .thank-you-header h1 {
          margin: 0;
          font-size: clamp(2rem, 4.6vw, 3rem);
          line-height: 1;
          letter-spacing: -0.04em;
        }

        .portal-preview-stage-frame .thank-you-qr-stack {
          width: 100%;
          display: grid;
          gap: 12px;
          align-content: center;
          justify-items: center;
          flex: 1;
        }

        .portal-preview-stage-frame .waitlist-copy {
          margin: 0;
          max-width: 34rem;
          color: rgba(244, 250, 245, 0.82);
          font-size: 1rem;
          line-height: 1.7;
          letter-spacing: -0.01em;
          text-align: center;
        }

        .portal-preview-stage-frame .waitlist-action,
        .portal-preview-stage-frame .survey-done-home {
          min-width: min(100%, 320px);
        }

        .portal-preview-stage-frame .hero-stage {
          position: relative;
          min-height: min(100svh, 980px);
          overflow: hidden;
        }

        .portal-preview-stage-frame .hero-media {
          position: absolute;
          inset: 0;
        }

        .portal-preview-stage-frame .hero-image {
          object-fit: cover;
          object-position: center center;
        }

        .portal-preview-stage-frame .hero-overlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(180deg, rgba(4, 8, 12, 0.22), rgba(4, 8, 12, 0.9)),
            radial-gradient(circle at top, rgba(246, 209, 93, 0.12), transparent 40%);
        }

        .portal-preview-stage-frame .hero-content {
          position: relative;
          z-index: 1;
          min-height: min(100svh, 980px);
          display: flex;
          align-items: end;
          justify-content: center;
          padding: clamp(20px, 4vw, 42px);
        }

        .portal-preview-stage-frame .cta-band {
          width: min(100%, 520px);
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 18px 16px 24px;
          background: #04080c;
        }

        .portal-preview-stage-frame .auth-switch {
          position: relative;
          min-height: 76px;
        }

        .portal-preview-stage-frame .auth-state {
          transition:
            opacity 180ms ease,
            transform 180ms ease;
        }

        .portal-preview-stage-frame .auth-state-login {
          opacity: 1;
          transform: translateY(0);
        }

        .portal-preview-stage-frame .auth-switch.is-open .auth-state-login {
          opacity: 0;
          pointer-events: none;
          transform: translateY(8px);
        }

        .portal-preview-stage-frame .auth-state-form {
          position: absolute;
          inset: 0;
          opacity: 0;
          pointer-events: none;
          transform: translateY(10px);
        }

        .portal-preview-stage-frame .auth-switch.is-open .auth-state-form {
          opacity: 1;
          pointer-events: auto;
          transform: translateY(0);
        }

        .portal-preview-stage-frame .login-button,
        .portal-preview-stage-frame .login-submit,
        .portal-preview-stage-frame .join-link,
        .portal-preview-stage-frame .portal-action-button,
        .portal-preview-stage-frame .portal-logout-button,
        .portal-preview-stage-frame .portal-modal-close,
        .portal-preview-stage-frame .login-modal-submit,
        .portal-preview-stage-frame .login-modal-secondary,
        .portal-preview-stage-frame .support-back-button,
        .portal-preview-stage-frame .support-finish-button,
        .portal-preview-stage-frame .support-quick-reply,
        .portal-preview-stage-frame .survey-submit,
        .portal-preview-stage-frame .portal-preview-reset {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 18px;
          min-height: 54px;
          padding: 0.95rem 1rem;
          background: rgba(255, 255, 255, 0.06);
          color: #f5f7f6;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          font: inherit;
          cursor: pointer;
        }

        .portal-preview-stage-frame .login-button,
        .portal-preview-stage-frame .login-submit,
        .portal-preview-stage-frame .portal-action-button,
        .portal-preview-stage-frame .support-finish-button,
        .portal-preview-stage-frame .survey-submit {
          width: 100%;
        }

        .portal-preview-stage-frame .login-field,
        .portal-preview-stage-frame .login-modal-field,
        .portal-preview-stage-frame .survey-question {
          display: grid;
          gap: 8px;
        }

        .portal-preview-stage-frame .login-field span,
        .portal-preview-stage-frame .login-modal-field span,
        .portal-preview-stage-frame .survey-question-text {
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: rgba(244, 255, 248, 0.74);
          font-size: 0.64rem;
        }

        .portal-preview-stage-frame .login-field input,
        .portal-preview-stage-frame .login-modal-field input,
        .portal-preview-stage-frame .survey-control,
        .portal-preview-stage-frame .chatbot-form input {
          min-height: 54px;
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.06);
          color: #f5f7f6;
          padding: 0.85rem 1rem;
          font: inherit;
        }

        .portal-preview-stage-frame .login-warning {
          display: grid;
          gap: 4px;
          align-items: start;
          padding: 12px 14px;
          border-radius: 18px;
          border: 1px solid rgba(255, 173, 66, 0.22);
          background:
            linear-gradient(180deg, rgba(255, 173, 66, 0.16), rgba(92, 43, 11, 0.84)),
            rgba(4, 8, 12, 0.72);
          color: rgba(255, 236, 215, 0.96);
          box-shadow:
            0 16px 36px rgba(0, 0, 0, 0.28),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }

        .portal-preview-stage-frame .login-warning strong {
          font-size: 0.92rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .portal-preview-stage-frame .login-warning span {
          color: rgba(255, 236, 215, 0.76);
          font-size: 0.84rem;
          line-height: 1.4;
        }

        .portal-preview-stage-frame .login-status,
        .portal-preview-stage-frame .login-modal-copy,
        .portal-preview-stage-frame .login-modal-status,
        .portal-preview-stage-frame .survey-error,
        .portal-preview-stage-frame .chatbot-connection-status,
        .portal-preview-stage-frame .chatbot-error,
        .portal-preview-stage-frame .portal-privacy-copy p,
        .portal-preview-stage-frame .portal-rsvp-note,
        .portal-preview-stage-frame .qr-caption,
        .portal-preview-stage-frame .qr-barcode,
        .portal-preview-stage-frame .survey-done-copy {
          color: rgba(244, 255, 248, 0.72);
          line-height: 1.5;
        }

        .portal-preview-stage-frame .login-panel {
          display: grid;
          gap: 12px;
          padding: 18px;
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(8, 12, 16, 0.74);
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.46);
        }

        .portal-preview-stage-frame .join-link {
          text-decoration: none;
        }

        .portal-preview-stage-frame .login-modal-backdrop,
        .portal-preview-stage-frame .portal-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 40;
          display: grid;
          place-items: center;
          padding: 20px;
          background: rgba(4, 8, 12, 0.74);
          backdrop-filter: blur(12px);
        }

        .portal-preview-stage-frame .login-modal,
        .portal-preview-stage-frame .portal-modal {
          width: min(100%, 440px);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 24px;
          padding: 1.1rem 1.1rem 1rem;
          background:
            radial-gradient(circle at top, rgba(246, 209, 93, 0.12), transparent 32%),
            rgba(10, 16, 22, 0.98);
          box-shadow: 0 30px 70px rgba(0, 0, 0, 0.42);
        }

        .portal-preview-stage-frame .login-modal-close,
        .portal-preview-stage-frame .portal-card-close {
          width: 34px;
          height: 34px;
          border-radius: 999px;
          padding: 0;
        }

        .portal-preview-stage-frame .login-modal-actions {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .portal-preview-stage-frame .login-modal-secondary,
        .portal-preview-stage-frame .login-modal-submit {
          min-width: 0;
        }

        .portal-preview-stage-frame .portal-page {
          padding: clamp(20px, 4vw, 44px);
          background:
            radial-gradient(circle at top, rgba(245, 231, 197, 0.12), transparent 30%),
            linear-gradient(180deg, #05090d 0%, #0a1117 100%);
        }

        .portal-preview-stage-frame .portal-shell,
        .portal-preview-stage-frame .support-shell,
        .portal-preview-stage-frame .survey-shell,
        .portal-preview-stage-frame .survey-done-shell {
          min-height: calc(100svh - clamp(40px, 8vw, 88px));
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
          gap: 22px;
          text-align: center;
        }

        .portal-preview-stage-frame .portal-header,
        .portal-preview-stage-frame .support-header,
        .portal-preview-stage-frame .survey-header,
        .portal-preview-stage-frame .survey-done-header {
          width: 100%;
          padding-top: clamp(10px, 6vh, 56px);
        }

        .portal-preview-stage-frame .portal-header h1,
        .portal-preview-stage-frame .support-header h1,
        .portal-preview-stage-frame .survey-header h1,
        .portal-preview-stage-frame .survey-done-header h1 {
          margin: 0;
          font-size: clamp(2rem, 4.6vw, 3rem);
          line-height: 1;
          letter-spacing: -0.04em;
        }

        .portal-preview-stage-frame .portal-qr-area {
          width: 100%;
          display: flex;
          justify-content: center;
        }

        .portal-preview-stage-frame .qr-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .portal-preview-stage-frame .qr-code {
          width: 316px;
          height: 316px;
          border-radius: 28px;
          padding: 18px;
          background: #fff;
          box-shadow: 0 22px 50px rgba(0, 0, 0, 0.34);
        }

        .portal-preview-stage-frame .qr-loading {
          width: 100%;
          height: 100%;
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(11, 15, 18, 0.08), rgba(11, 15, 18, 0.02));
        }

        .portal-preview-stage-frame .qr-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 20px;
        }

        .portal-preview-stage-frame .portal-actions {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .portal-preview-stage-frame .portal-action-button,
        .portal-preview-stage-frame .portal-action-link {
          text-decoration: none;
          min-height: 58px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.06);
        }

        .portal-preview-stage-frame .portal-things-card {
          padding-bottom: 0;
        }

        .portal-preview-stage-frame .portal-things-trigger {
          appearance: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          position: relative;
          width: 100%;
          min-height: 58px;
          border: 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0.95rem 3rem 0.95rem 1.1rem;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.09) 0%, rgba(255, 255, 255, 0.05) 100%);
          color: #f5f7f6;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          font: inherit;
          cursor: pointer;
          transition:
            transform 180ms ease,
            background 180ms ease,
            border-color 180ms ease;
        }

        .portal-preview-stage-frame .portal-things-trigger > span:first-child {
          flex: 1;
          text-align: center;
        }

        .portal-preview-stage-frame .portal-things-trigger:hover {
          transform: translateY(-1px);
          border-color: rgba(255, 255, 255, 0.18);
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.11) 0%, rgba(255, 255, 255, 0.06) 100%);
        }

        .portal-preview-stage-frame .portal-things-trigger:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: -2px;
        }

        .portal-preview-stage-frame .portal-things-trigger-lock {
          flex-shrink: 0;
          position: absolute;
          right: 1.1rem;
          font-size: 1rem;
          line-height: 1;
          transition: transform 220ms ease;
        }

        .portal-preview-stage-frame .portal-logout-button {
          background: linear-gradient(180deg, rgba(188, 58, 58, 0.96) 0%, rgba(142, 29, 29, 0.98) 100%);
        }

        .portal-preview-stage-frame .portal-card {
          width: 100%;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.06);
          box-shadow: var(--shadow, 0 18px 40px rgba(0, 0, 0, 0.3));
        }

        .portal-preview-stage-frame .portal-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 0.95rem 1.1rem 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.16em;
        }

        .portal-preview-stage-frame .portal-card-header h2 {
          margin: 0;
          font-size: 0.78rem;
        }

        .portal-preview-stage-frame .portal-card-body {
          padding: 0 1.1rem 1.1rem;
          text-align: left;
        }

        .portal-preview-stage-frame .portal-profile-preview {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
        }

        .portal-preview-stage-frame .portal-profile-photo-frame {
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

        .portal-preview-stage-frame .portal-profile-photo {
          object-fit: cover;
        }

        .portal-preview-stage-frame .portal-profile-photo-fallback {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          color: #f5f7f6;
          font-size: 0.95rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .portal-preview-stage-frame .portal-profile-meta {
          display: grid;
          gap: 4px;
          min-width: 0;
        }

        .portal-preview-stage-frame .portal-profile-meta-row {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }

        .portal-preview-stage-frame .portal-profile-meta-row strong {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .portal-preview-stage-frame .portal-profile-meta p {
          margin: 0;
          color: rgba(244, 250, 245, 0.72);
          font-size: 0.78rem;
          line-height: 1.35;
        }

        .portal-preview-stage-frame .portal-profile-tag,
        .portal-preview-stage-frame .chatbot-profile-tag {
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
          line-height: 1;
          white-space: nowrap;
        }

        .portal-preview-stage-frame .portal-profile-tag.is-ai {
          border-color: rgba(208, 188, 255, 0.38);
          background: rgba(208, 188, 255, 0.14);
        }

        .portal-preview-stage-frame .portal-ticket-meta {
          display: grid;
          gap: 12px;
          margin: 0;
        }

        .portal-preview-stage-frame .portal-ticket-meta div {
          display: grid;
          gap: 4px;
        }

        .portal-preview-stage-frame .portal-ticket-meta dt {
          color: rgba(255, 255, 255, 0.72);
          text-transform: uppercase;
          letter-spacing: 0.16em;
          font-size: 0.7rem;
        }

        .portal-preview-stage-frame .portal-ticket-meta dd {
          margin: 0;
        }

        .portal-preview-stage-frame .portal-checkin-banner {
          margin: 0;
          width: 100%;
          padding: 0.9rem 1rem;
          border-radius: 18px;
          background: rgba(119, 231, 160, 0.12);
          border: 1px solid rgba(119, 231, 160, 0.24);
          color: #bdf7d1;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          font-size: 0.8rem;
          font-weight: 700;
        }

        .portal-preview-stage-frame .portal-rsvp-row {
          display: flex;
          align-items: flex-end;
          gap: 10px;
          margin-top: 12px;
        }

        .portal-preview-stage-frame .portal-rsvp-select {
          flex: 1;
          min-height: 48px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.06);
          color: #f5f7f6;
          padding: 0.75rem 0.9rem;
          font: inherit;
        }

        .portal-preview-stage-frame .portal-modal h2 {
          margin: 0;
          font-size: clamp(1.35rem, 4vw, 1.7rem);
          line-height: 1.15;
        }

        .portal-preview-stage-frame .portal-modal-kicker,
        .portal-preview-stage-frame .login-modal-eyebrow,
        .portal-preview-stage-frame .support-eyebrow {
          margin: 0 0 0.45rem;
          color: rgba(245, 231, 197, 0.9);
          text-transform: uppercase;
          letter-spacing: 0.18em;
          font-size: 0.7rem;
        }

        .portal-preview-stage-frame .portal-privacy-modal {
          width: min(100%, 520px);
          text-align: left;
        }

        .portal-preview-stage-frame .portal-privacy-copy {
          margin-top: 1rem;
          display: grid;
          gap: 10px;
          max-height: min(52svh, 360px);
          overflow-y: auto;
          padding-right: 4px;
        }

        .portal-preview-stage-frame .portal-privacy-agree {
          width: 100%;
          margin-top: 1rem;
          border-color: rgba(246, 209, 93, 0.28);
          background: linear-gradient(180deg, rgba(246, 209, 93, 0.18), rgba(246, 209, 93, 0.08));
        }

        .portal-preview-stage-frame .support-chatbot {
          width: 100%;
        }

        .portal-preview-stage-frame .support-top-actions,
        .portal-preview-stage-frame .support-bottom-actions {
          width: 100%;
          display: flex;
          justify-content: space-between;
        }

        .portal-preview-stage-frame .support-chat-stage {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .portal-preview-stage-frame .support-live-panel {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
        }

        .portal-preview-stage-frame .chatbot-messages {
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-height: 0;
          flex: 1;
          text-align: left;
        }

        .portal-preview-stage-frame .chatbot-message {
          max-width: 88%;
          display: grid;
          gap: 10px;
          padding: 0.9rem 1rem;
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          line-height: 1.5;
        }

        .portal-preview-stage-frame .chatbot-message-assistant {
          align-self: flex-start;
          background: rgba(255, 255, 255, 0.08);
        }

        .portal-preview-stage-frame .chatbot-message-user {
          align-self: flex-end;
          background: rgba(126, 70, 224, 0.24);
        }

        .portal-preview-stage-frame .chatbot-message-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
          font-size: 0.72rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .portal-preview-stage-frame .chatbot-message-identity {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .portal-preview-stage-frame .chatbot-avatar {
          display: grid;
          place-items: center;
          width: 24px;
          height: 24px;
          border-radius: 999px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.1);
        }

        .portal-preview-stage-frame .chatbot-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .portal-preview-stage-frame .chatbot-message-name-wrap {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
        }

        .portal-preview-stage-frame .chatbot-message-name-wrap strong {
          font-weight: 700;
        }

        .portal-preview-stage-frame .chatbot-message-header time {
          color: rgba(255, 255, 255, 0.42);
          text-transform: none;
          letter-spacing: 0.04em;
          font-size: 0.62rem;
        }

        .portal-preview-stage-frame .chatbot-send-button {
          width: 100%;
          min-height: 54px;
          border-radius: 18px;
        }

        .portal-preview-stage-frame .chatbot-send-button svg {
          width: 18px;
          height: 18px;
        }

        .portal-preview-stage-frame .support-quick-replies {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .portal-preview-stage-frame .support-quick-reply {
          min-height: 44px;
          border-radius: 16px;
          padding: 0.7rem 0.9rem;
          letter-spacing: 0.08em;
        }

        .portal-preview-stage-frame .chatbot-form {
          display: grid;
          grid-template-columns: minmax(0, 8fr) minmax(72px, 2fr);
          gap: 10px;
          align-items: stretch;
        }

        .portal-preview-stage-frame .support-finish-button {
          width: 100%;
        }

        .portal-preview-stage-frame .survey-form {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-height: min(72vh, 720px);
          text-align: left;
        }

        .portal-preview-stage-frame .survey-question {
          display: grid;
          gap: 10px;
          padding: 16px 16px 18px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.05);
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.26);
        }

        .portal-preview-stage-frame .survey-control {
          min-height: 54px;
          border-radius: 16px;
          padding: 0.85rem 0.95rem;
        }

        .portal-preview-stage-frame .survey-submit-row {
          margin-top: auto;
          display: grid;
          gap: 10px;
        }

        .portal-preview-stage-frame .survey-submit {
          width: 100%;
          border-radius: 999px;
          min-height: 72px;
          letter-spacing: 0.14em;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.06));
        }

        .portal-preview-stage-frame .survey-submit.is-ready {
          border-color: rgba(160, 120, 255, 0.56);
          background: linear-gradient(180deg, rgba(147, 90, 255, 0.98), rgba(94, 36, 208, 0.98));
          box-shadow:
            0 0 0 1px rgba(196, 168, 255, 0.14),
            0 18px 40px rgba(115, 66, 214, 0.42),
            0 0 34px rgba(157, 110, 255, 0.24);
        }

        .portal-preview-stage-frame .survey-done-shell {
          width: min(100%, 520px);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          justify-content: center;
          gap: 18px;
        }

        .portal-preview-stage-frame .survey-done-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .portal-preview-stage-frame .survey-done-copy {
          margin: 0;
          text-align: center;
          color: rgba(244, 250, 245, 0.82);
          font-size: clamp(1.1rem, 3vw, 1.35rem);
          line-height: 1.5;
        }

        .portal-preview-stage-frame .thank-you-shell {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 18px;
        }

        .portal-preview-stage-frame .thank-you-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding-top: clamp(10px, 6vh, 56px);
        }

        .portal-preview-stage-frame .thank-you-qr-stack {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
        }

        .portal-preview-stage-frame .waitlist-copy {
          max-width: 34rem;
          color: rgba(244, 250, 245, 0.82);
          font-size: 1rem;
          line-height: 1.7;
          letter-spacing: -0.01em;
        }

        .portal-preview-stage-frame .thank-you-return {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-top: 8px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 999px;
          padding: 0.95rem 1.4rem;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.06));
          color: #f5f7f6;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(18px);
          opacity: 0;
          transform: translateY(10px);
          pointer-events: none;
          transition:
            opacity 420ms ease,
            transform 420ms ease,
            border-color 220ms ease;
        }

        .portal-preview-stage-frame .thank-you-return.is-visible {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }

        .portal-preview-stage-frame .thank-you-return:hover {
          border-color: rgba(255, 255, 255, 0.28);
        }

        .portal-preview-stage-frame .qr-preview-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
          width: 100%;
          height: 100%;
          padding: 12px;
          background: #fff;
          border-radius: 18px;
        }

        .portal-preview-stage-frame .qr-preview-grid span {
          border-radius: 2px;
          background: #eae8df;
        }

        .portal-preview-stage-frame .qr-preview-grid span.is-dark {
          background: #0b0f12;
        }

        @media (max-width: 960px) {
          .portal-preview-admin-bar {
            align-items: start;
            flex-direction: column;
          }

          .portal-preview-stage-frame {
            border-radius: 24px;
          }

          .portal-preview-stage-frame .qr-code {
            width: min(78vw, 316px);
            height: min(78vw, 316px);
          }
        }

        @media (max-width: 640px) {
          .portal-preview-replay {
            padding: 14px;
          }

          .portal-preview-stage-frame {
            border-radius: 20px;
          }

          .portal-preview-stage-frame .hero-content {
            padding: 16px;
          }
        }
      `}</style>
    </main>
  );
}
