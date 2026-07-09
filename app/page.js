"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authenticateAdmin } from "../lib/admin-api";

export default function HomePage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      if (!firstName.trim() || !phoneNumber.trim()) {
        throw new Error("Please enter your name and phone number.");
      }

      const session = await authenticateAdmin({
        firstName: firstName.trim(),
        phoneNumber: phoneNumber.trim(),
      });

      localStorage.setItem("watch-party-admin-session", JSON.stringify(session));
      localStorage.setItem("watch-party-admin-last-active-at", String(Date.now()));
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page-root auth-page">
      <section className="auth-card">
        <div className="hero-media" aria-hidden="true">
          <div className="hero-overlay" />
        </div>

        <form className="auth-panel" onSubmit={handleSubmit}>
          <input
            aria-label="Full name"
            className="field-input"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Your full name"
            autoComplete="given-name"
          />

          <input
            aria-label="Phone number"
            className="field-input"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Your phone number"
            autoComplete="tel"
            inputMode="tel"
          />

          {error ? <p className="error-text">{error}</p> : null}
          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "AUTHENTICATING..." : "LOGIN"}
          </button>
        </form>
      </section>
    </main>
  );
}
