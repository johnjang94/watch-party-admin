"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import heroImage from "../image.png";
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
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page-root auth-page">
      <section className="screen-shell auth-shell">
        <div className="auth-card">
          <div className="hero-media">
            <Image alt="" className="hero-image" fill priority sizes="100vw" src={heroImage} />
            <div className="hero-overlay" aria-hidden="true" />
          </div>

          <form className="auth-panel" onSubmit={handleSubmit}>
            <div className="auth-title-block">
              <p className="eyebrow">watch party admin</p>
              <h1 className="screen-title">Admin login</h1>
            </div>

            <label className="field">
              <span>Name</span>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Your name"
                autoComplete="given-name"
              />
            </label>

            <label className="field">
              <span>Phone number</span>
              <input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Your phone number"
                autoComplete="tel"
                inputMode="tel"
              />
            </label>

            {error ? <p className="error-text">{error}</p> : null}
            <button className="primary-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Authenticating..." : "Admin login"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
