"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import heroImage from "../image.png";
import { requestAdminOtp, verifyAdminOtp } from "../lib/admin-api";

export default function HomePage() {
  const router = useRouter();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState("phone");
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

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
        </div>

        <div className="hero-content">
          <div className="cta-band">
            <div className={`auth-switch ${isLoginOpen ? "is-open" : ""}`}>
              <div className="auth-state auth-state-login" aria-hidden={isLoginOpen}>
                <button className="login-button" onClick={() => setIsLoginOpen(true)} type="button">
                  admin login
                </button>
              </div>

              {step === "phone" ? (
                <form className="auth-state auth-state-form login-panel" onSubmit={handleSendCode}>
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

                  {error ? (
                    <p className="error-text login-error" role="alert">
                      {error}
                    </p>
                  ) : null}

                  <button className="login-submit" disabled={isSubmitting} type="submit">
                    {isSubmitting ? "sending..." : "send code"}
                  </button>
                </form>
              ) : (
                <form className="auth-state auth-state-form login-panel" onSubmit={handleVerifyCode}>
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

                  {statusMessage ? (
                    <p className="error-text login-error" role="status">
                      {statusMessage}
                    </p>
                  ) : null}

                  {error ? (
                    <p className="error-text login-error" role="alert">
                      {error}
                    </p>
                  ) : null}

                  <div className="name-row">
                    <button
                      className="login-submit"
                      disabled={isSubmitting}
                      type="button"
                      onClick={() => setStep("phone")}
                    >
                      back
                    </button>

                    <button className="login-submit" disabled={isSubmitting} type="submit">
                      {isSubmitting ? "verifying..." : "verify"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
