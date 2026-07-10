"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

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

  async function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const dataUrl = await readImageFile(file);
    setPhoto(dataUrl);
    window.localStorage.setItem("watch-party-admin-photo", dataUrl);
  }

  function handleLogout() {
    window.localStorage.removeItem("watch-party-admin-session");
    window.localStorage.removeItem("watch-party-admin-last-active-at");
    router.replace("/");
  }

  return (
    <main className="page-root profile-page">
      <section className="screen-shell profile-shell">
        <div className="profile-hero">
          <label className="profile-upload-button" aria-label="Change photo">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="profile-upload-icon">
              <path d="M12 5.25 10.9 7.1H8.7A2.7 2.7 0 0 0 6 9.8v6.45A2.75 2.75 0 0 0 8.75 19h6.5A2.75 2.75 0 0 0 18 16.25V9.8a2.7 2.7 0 0 0-2.7-2.7h-2.2L12 5.25Zm0 4.25a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z" />
            </svg>
            <span className="sr-only">Change photo</span>
            <input type="file" accept="image/*" onChange={handlePhotoChange} className="profile-upload-input" />
          </label>

          <div className="profile-photo-frame">
            {photo ? (
              <Image alt="Profile photo" className="profile-photo" src={photo} width={320} height={320} />
            ) : (
              <div className="profile-photo-fallback">JJ</div>
            )}
          </div>

          <div className="profile-copy">
            <h1 className="screen-title">{displayName}</h1>
            <p className="profile-meta">{phoneNumber}</p>
          </div>
        </div>

        <div className="profile-card">
          <button className="secondary-button" type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </section>
    </main>
  );
}
