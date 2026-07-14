"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { requestAdminOtp, verifyAdminOtp } from "../lib/admin-api";

export default function HomePage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState("phone");
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isOtpOpen, setIsOtpOpen] = useState(false);

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

  function openOtp() {
    setIsOtpOpen(true);
    setStep("phone");
    setCode("");
    setStatusMessage("");
    setError("");
  }

  function closeOtp() {
    setIsOtpOpen(false);
  }

  function handleBackToPhone() {
    setStep("phone");
    setCode("");
    setStatusMessage("");
    setError("");
  }

  return (
    <main className="page-root home-login-page">
      <div className="home-login-background" aria-hidden="true" />

      <div className="home-login-scrim" aria-hidden="true" />

      <button className="home-login-trigger" type="button" onClick={openOtp}>
        ADMIN LOGIN
      </button>

      {isOtpOpen ? (
        <div className="home-login-modal" role="presentation" onClick={closeOtp}>
          <section
            aria-label="Admin login"
            className="home-login-sheet"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <button className="home-login-close" type="button" onClick={closeOtp} aria-label="Close login">
              ×
            </button>

            <form className="home-login-form" onSubmit={isCodeStep ? handleVerifyCode : handleSendCode}>
              <label className="sr-only" htmlFor="admin-phone">
                Phone number
              </label>
              <input
                id="admin-phone"
                className="home-login-input"
                autoComplete="tel"
                inputMode="tel"
                onChange={(event) => setPhoneNumber(event.target.value)}
                placeholder="Phone number"
                type="tel"
                value={phoneNumber}
                autoFocus={!isCodeStep}
              />

              {isCodeStep ? (
                <>
                  <label className="sr-only" htmlFor="admin-code">
                    Verification code
                  </label>
                  <input
                    id="admin-code"
                    className="home-login-input"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    onChange={(event) => setCode(event.target.value)}
                    placeholder="Enter 5-digit code"
                    type="text"
                    value={code}
                    autoFocus={isCodeStep}
                  />
                </>
              ) : null}

              <div className="home-login-status" aria-live="polite">
                {statusMessage ? <p className="home-login-message">{statusMessage}</p> : null}
                {error ? <p className="home-login-message is-error">{error}</p> : null}
              </div>

              <div className="home-login-actions">
                {isCodeStep ? (
                  <button className="home-login-button is-secondary" type="button" onClick={handleBackToPhone} disabled={isSubmitting}>
                    Back
                  </button>
                ) : null}

                <button className="home-login-button" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (isCodeStep ? "VERIFYING" : "SENDING") : isCodeStep ? "VERIFY OTP" : "VERIFY THE CODE"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  );
}
