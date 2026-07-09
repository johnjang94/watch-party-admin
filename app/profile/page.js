"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Unable to read file."));
    reader.readAsDataURL(file);
  });
}

export default function ProfilePage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("John Jang");
  const [phoneNumber, setPhoneNumber] = useState("647-553-3499");
  const [photo, setPhoto] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const sessionRaw = window.localStorage.getItem("watch-party-admin-session");
    if (sessionRaw) {
      try {
        const session = JSON.parse(sessionRaw);
        if (session?.firstName) setDisplayName(session.firstName);
        if (session?.phoneNumber) setPhoneNumber(session.phoneNumber);
      } catch {
        // ignore parse errors and use defaults
      }
    }

    const savedPhoto = window.localStorage.getItem("watch-party-admin-photo");
    if (savedPhoto) setPhoto(savedPhoto);
  }, []);

  async function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setSaving(true);
    try {
      const dataUrl = await readImageFile(file);
      setPhoto(dataUrl);
      window.localStorage.setItem("watch-party-admin-photo", dataUrl);
    } finally {
      setSaving(false);
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
        <div className="profile-hero">
          <div className="profile-photo-frame">
            {photo ? (
              <Image alt="Profile photo" className="profile-photo" src={photo} width={320} height={320} />
            ) : (
              <div className="profile-photo-fallback">JJ</div>
            )}
          </div>

          <div className="profile-copy">
            <p className="eyebrow">profile</p>
            <h1 className="screen-title">{displayName}</h1>
            <p className="profile-meta">{phoneNumber}</p>
          </div>
        </div>

        <div className="profile-card">
          <label className="profile-upload">
            <span>Change photo</span>
            <input type="file" accept="image/*" onChange={handlePhotoChange} />
          </label>

          <button className="secondary-button" type="button" onClick={handleLogout}>
            Logout
          </button>

          {saving ? <p className="profile-note">Updating photo...</p> : <p className="profile-note">Photo changes stay on this device.</p>}
        </div>
      </section>
    </main>
  );
}
