"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import heroImage from "../image.png";

const apiBaseUrl = process.env.NEXT_PUBLIC_CONTROL_URL ?? "http://127.0.0.1:3010";

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
      const response = await fetch(`${apiBaseUrl}/api/admin/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          phoneNumber: phoneNumber.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Authentication failed.");
      }

      localStorage.setItem("watch-party-admin-session", JSON.stringify(data.session));
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page-root home-page">
      <section className="home-hero">
        <div className="hero-media">
          <Image alt="" className="hero-image" fill priority sizes="100vw" src={heroImage} />
          <div className="hero-overlay" aria-hidden="true" />
        </div>

        <form className="home-panel" onSubmit={handleSubmit}>
          <p className="eyebrow">control room</p>
          <h1 className="home-title">Watch Party Admin</h1>
          <p className="home-copy">Enter your name and phone number to unlock the dashboard.</p>

          <label className="field">
            <span>Name</span>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Your name" autoComplete="given-name" />
          </label>

          <label className="field">
            <span>Phone Number</span>
            <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="Your phone number" autoComplete="tel" inputMode="tel" />
          </label>

          {error ? <p className="error-text">{error}</p> : null}
          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Authenticating..." : "Admin Login"}
          </button>
        </form>
      </section>
    </main>
  );
}
