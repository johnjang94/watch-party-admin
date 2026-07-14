"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import heroImage from "../image.png";
import { requestAdminOtp, verifyAdminOtp } from "../lib/admin-api";

export default function HomePage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState("phone");
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isCodeStep = step === "code";

  async function handleSendCode(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setStatusMessage("");

    try {
      if (!phoneNumber.trim()) {
        throw new Error("Please enter your phone number.");
      }

      const result = await requestAdminOtp({
        phoneNumber: phoneNumber.trim(),
      });

      if (!result?.ok) {
        throw new Error(result?.error ?? "Unable to send verification code.");
      }

      setStep("code");
      setStatusMessage(result.message ?? "Verification code sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyCode(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      if (!phoneNumber.trim() || !code.trim()) {
        throw new Error("Please enter your phone number and verification code.");
      }

      const session = await verifyAdminOtp({
        phoneNumber: phoneNumber.trim(),
        code: code.trim(),
      });

      if (!session?.id) {
        throw new Error("Unable to verify code.");
      }

      window.localStorage.setItem("watch-party-admin-session", JSON.stringify(session));
      window.localStorage.setItem("watch-party-admin-last-active-at", String(Date.now()));
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleBackToPhone() {
    setStep("phone");
    setCode("");
    setStatusMessage("");
    setError("");
  }

  return (
    <main className="page-root home-page">
      <section className="hero-stage">
        <div className="page-background" aria-hidden="true">
          <Image
            alt=""
            className="page-background-image"
            fill
            priority
            sizes="100vw"
            src={heroImage}
          />
          <div className="page-background-overlay" />
          <div className="page-background-vignette" />
          <div className="page-background-glow page-background-glow-one" />
          <div className="page-background-glow page-background-glow-two" />
        </div>

        <div className="hero-content">
          <div className="device-shell">
            <header className="device-topbar" aria-hidden="true">
              <span className="device-time">9:55</span>
              <div className="device-indicators">
                <span className="signal">
                  <span />
                  <span />
                  <span />
                  <span />
                </span>
                <span className="wifi" />
                <span className="battery">
                  <span className="battery-level" />
                  <span className="battery-label">99</span>
                </span>
              </div>
            </header>

            <div className="hero-poster" aria-hidden="true">
              <div className="hero-poster-frame">
                <div className="hero-poster-fade" />
              </div>
            </div>

            <div className="login-stage">
              <div className="login-shell">
                <div className="login-mark" aria-hidden="true">
                  <div className="login-mark-ring">
                    <div className="login-mark-core" />
                  </div>
                </div>

                <div className={`auth-switch is-open ${isCodeStep ? "is-code-step" : ""}`}>
                  <form className="auth-state auth-state-form login-panel" onSubmit={isCodeStep ? handleVerifyCode : handleSendCode}>
                    <label className="login-field">
                      <span className="sr-only">Phone number</span>
                      <input
                        autoComplete="tel"
                        inputMode="tel"
                        onChange={(event) => setPhoneNumber(event.target.value)}
                        placeholder="Phone number"
                        type="tel"
                        value={phoneNumber}
                      />
                    </label>

                    {isCodeStep ? (
                      <label className="login-field">
                        <span className="sr-only">Verification code</span>
                        <input
                          autoComplete="one-time-code"
                          inputMode="numeric"
                          onChange={(event) => setCode(event.target.value)}
                          placeholder="6-digit code"
                          type="text"
                          value={code}
                        />
                      </label>
                    ) : null}

                    <div className="login-status-stack" aria-live="polite">
                      {statusMessage ? (
                        <p className="login-banner" role="status">
                          {statusMessage}
                        </p>
                      ) : null}

                      {error ? (
                        <p className="login-banner is-error" role="alert">
                          {error}
                        </p>
                      ) : null}
                    </div>

                    <div className="login-actions">
                      {isCodeStep ? (
                        <button
                          className="login-button is-secondary"
                          disabled={isSubmitting}
                          type="button"
                          onClick={handleBackToPhone}
                        >
                          change number
                        </button>
                      ) : null}

                      <button className="login-submit" disabled={isSubmitting} type="submit">
                        {isSubmitting ? (isCodeStep ? "verifying..." : "sending...") : isCodeStep ? "verify" : "send"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
