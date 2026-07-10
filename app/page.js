"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import heroImage from "../image.png";
import { authenticateAdmin } from "../lib/admin-api";

export default function HomePage() {
  const router = useRouter();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      if (!firstName.trim() || !lastName.trim() || !phoneNumber.trim()) {
        throw new Error("Please enter your first name, last name, and phone number.");
      }

      const session = await authenticateAdmin({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim(),
      });

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

              <form className="auth-state auth-state-form login-panel" onSubmit={handleSubmit}>
                <div className="name-row">
                  <label className="login-field">
                    <span>first name</span>
                    <input
                      autoComplete="given-name"
                      onChange={(event) => setFirstName(event.target.value)}
                      placeholder="First name"
                      type="text"
                      value={firstName}
                    />
                  </label>

                  <label className="login-field">
                    <span>last name</span>
                    <input
                      autoComplete="family-name"
                      onChange={(event) => setLastName(event.target.value)}
                      placeholder="Last name"
                      type="text"
                      value={lastName}
                    />
                  </label>
                </div>

                <label className="login-field">
                  <span>phone number</span>
                  <input
                    autoComplete="tel"
                    inputMode="tel"
                    onChange={(event) => setPhoneNumber(event.target.value)}
                    placeholder="Enter phone number"
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
                  {isSubmitting ? "authenticating..." : "login"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
