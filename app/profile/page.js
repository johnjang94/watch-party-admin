"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchInviteSettings, updateInviteCapacity } from "../../lib/admin-api";

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Unable to read file."));
    reader.readAsDataURL(file);
  });
}

function formatDisplayName(session) {
  const firstName = typeof session?.firstName === "string" ? session.firstName.trim() : "";
  const lastName = typeof session?.lastName === "string" ? session.lastName.trim() : "";
  return [firstName, lastName].filter(Boolean).join(" ") || "John Jang";
}

export default function ProfilePage() {
  const router = useRouter();
  const [adminKey] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return window.localStorage.getItem("fifa-admin-access-key") || "";
  });
  const [displayName] = useState(() => {
    if (typeof window === "undefined") {
      return "John Jang";
    }

    const sessionRaw = window.localStorage.getItem("watch-party-admin-session");
    if (!sessionRaw) {
      return "John Jang";
    }

    try {
      return formatDisplayName(JSON.parse(sessionRaw));
    } catch {
      return "John Jang";
    }
  });
  const [capacity, setCapacity] = useState("");
  const [capacitySaving, setCapacitySaving] = useState(false);
  const [capacityError, setCapacityError] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(() => {
    if (typeof window === "undefined") {
      return "647-553-3499";
    }

    const sessionRaw = window.localStorage.getItem("watch-party-admin-session");
    if (!sessionRaw) {
      return "647-553-3499";
    }

    try {
      const session = JSON.parse(sessionRaw);
      return session?.phoneNumber || "647-553-3499";
    } catch {
      return "647-553-3499";
    }
  });
  const [photo, setPhoto] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return window.localStorage.getItem("watch-party-admin-photo") || "";
  });

  useEffect(() => {
    if (!adminKey) {
      return undefined;
    }

    let cancelled = false;

    async function loadSettings() {
      try {
        const data = await fetchInviteSettings(adminKey);
        if (cancelled || !data.ok) {
          return;
        }

        setCapacity(
          data.capacity === null || data.capacity === undefined ? "" : String(data.capacity),
        );
      } catch (error) {
        if (!cancelled) {
          setCapacityError(error instanceof Error ? error.message : "Unable to load capacity.");
        }
      }
    }

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, [adminKey]);

  async function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await readImageFile(file);
      setPhoto(dataUrl);
      setPhotoError("");
      window.localStorage.setItem("watch-party-admin-photo", dataUrl);
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : "Unable to update photo.");
    }
  }

  async function handleSaveCapacity() {
    setCapacitySaving(true);
    setCapacityError("");

    try {
      const rawCapacity = capacity.trim();
      const payload = rawCapacity === "" ? null : Number(rawCapacity);

      if (payload !== null && (!Number.isInteger(payload) || payload <= 0)) {
        throw new Error("Capacity must be a positive whole number.");
      }

      const data = await updateInviteCapacity(adminKey, payload);

      if (!data.ok) {
        throw new Error(data.error ?? "Unable to update capacity.");
      }

      setCapacity(
        data.capacity === null || data.capacity === undefined ? "" : String(data.capacity),
      );
    } catch (error) {
      setCapacityError(error instanceof Error ? error.message : "Unable to update capacity.");
    } finally {
      setCapacitySaving(false);
    }
  }

  function handleLogout() {
    window.localStorage.removeItem("watch-party-admin-session");
    window.localStorage.removeItem("watch-party-admin-last-active-at");
    router.replace("/");
  }

  return (
    <main className="page-root profile-page">
      <section className="screen-shell profile-shell">
        <header className="profile-intro">
          <h1 className="profile-title">My profile</h1>
        </header>

        <article className="profile-card profile-identity-card">
          <div className="profile-identity-visual">
            <div className="profile-photo-frame">
              {photo ? (
                <Image
                  alt="Profile photo"
                  className="profile-photo"
                  src={photo}
                  width={320}
                  height={320}
                />
              ) : (
                <div className="profile-photo-fallback">JJ</div>
              )}
            </div>

            <div className="profile-identity-copy">
              <h2 className="profile-name">{displayName}</h2>
              <p className="profile-phone">{phoneNumber}</p>
              <label className="profile-photo-button" aria-label="Change photo">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="profile-upload-icon">
                  <path d="M12 5.25 10.9 7.1H8.7A2.7 2.7 0 0 0 6 9.8v6.45A2.75 2.75 0 0 0 8.75 19h6.5A2.75 2.75 0 0 0 18 16.25V9.8a2.7 2.7 0 0 0-2.7-2.7h-2.2L12 5.25Zm0 4.25a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z" />
                </svg>
                <span>Update photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="profile-upload-input"
                />
              </label>
            </div>
            {photoError ? <p className="profile-error">{photoError}</p> : null}
          </div>
        </article>

        <section className="profile-card profile-settings-card">
          <div className="profile-section-head">
            <h2 className="profile-section-title">Total number of guests we have</h2>
          </div>

          <div className="profile-capacity-row">
            <label className="profile-field profile-capacity-field">
              <span className="sr-only">Total number of guests we have</span>
              <input
                inputMode="numeric"
                min="1"
                onChange={(event) => setCapacity(event.target.value)}
                placeholder="Enter number"
                type="number"
                value={capacity}
              />
            </label>

            <button
              className="profile-save-button profile-check-button"
              disabled={capacitySaving || !adminKey}
              type="button"
              onClick={() => void handleSaveCapacity()}
              aria-label="Save total number of guests"
            >
              {capacitySaving ? (
                "..."
              ) : (
                <svg aria-hidden="true" viewBox="0 0 24 24" className="profile-check-icon">
                  <path d="M9.2 16.2 4.9 11.9l-1.4 1.4 5.7 5.7L20.5 7.7l-1.4-1.4z" />
                </svg>
              )}
            </button>
          </div>

          {capacityError ? <p className="profile-error">{capacityError}</p> : null}
        </section>

        <button className="profile-logout-button" type="button" onClick={handleLogout}>
          Log out
        </button>
      </section>
    </main>
  );
}
