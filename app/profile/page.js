"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  fetchInviteOverview,
  fetchInviteSettings,
  getStoredAdminSessionId,
  updateInviteBannerPhoto,
  updateInviteCapacity,
  updateInviteProfilePhoto,
} from "../../lib/admin-api";

function formatDisplayName(session) {
  const firstName = typeof session?.firstName === "string" ? session.firstName.trim() : "";
  const lastName = typeof session?.lastName === "string" ? session.lastName.trim() : "";
  return [firstName, lastName].filter(Boolean).join(" ") || "Admin";
}

function readStoredSession() {
  if (typeof window === "undefined") {
    return null;
  }

  const sessionRaw = window.localStorage.getItem("watch-party-admin-session");
  if (!sessionRaw) {
    return null;
  }

  try {
    return JSON.parse(sessionRaw);
  } catch {
    return null;
  }
}

function toPhotoUrl(photo, fallback = "") {
  return typeof photo?.url === "string" && photo.url ? photo.url : fallback;
}

export default function ProfilePage() {
  const router = useRouter();
  const profileInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const previewUrlsRef = useRef(new Set());
  const [adminSessionId] = useState(() => getStoredAdminSessionId());
  const [displayName] = useState(() => formatDisplayName(readStoredSession()));
  const [phoneNumber] = useState(() => {
    const session = readStoredSession();
    return session?.phoneNumber || "Unavailable";
  });
  const [capacity, setCapacity] = useState("");
  const [capacitySaving, setCapacitySaving] = useState(false);
  const [capacityError, setCapacityError] = useState("");
  const [capacitySavedAt, setCapacitySavedAt] = useState("");
  const [inviteCount, setInviteCount] = useState(0);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [bannerPhotoUrl, setBannerPhotoUrl] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [bannerSaving, setBannerSaving] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [bannerError, setBannerError] = useState("");

  useEffect(() => {
    if (!adminSessionId) {
      return undefined;
    }

    let cancelled = false;

    async function loadSettings() {
      try {
        const [settingsData, overviewData] = await Promise.all([
          fetchInviteSettings(),
          fetchInviteOverview(),
        ]);

        if (cancelled || !settingsData.ok || !overviewData.ok) {
          return;
        }

        setCapacity(
          settingsData.capacity === null || settingsData.capacity === undefined
            ? ""
            : String(settingsData.capacity),
        );
        setInviteCount(Number(overviewData.registeredCount ?? overviewData.inviteCount ?? 0));

        const storedSession = readStoredSession();
        const localPhoto = typeof window === "undefined"
          ? ""
          : window.localStorage.getItem("watch-party-admin-photo") || "";

        setProfilePhotoUrl(
          toPhotoUrl(settingsData.profilePhoto, localPhoto || storedSession?.photoUrl || ""),
        );
        setBannerPhotoUrl(toPhotoUrl(settingsData.bannerPhoto, "/image.jpg"));
      } catch (error) {
        if (!cancelled) {
          setCapacityError(error instanceof Error ? error.message : "Unable to load settings.");
        }
      }
    }

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, [adminSessionId]);

  useEffect(() => {
    return () => {
      for (const url of previewUrlsRef.current) {
        URL.revokeObjectURL(url);
      }
      previewUrlsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!capacitySavedAt) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setCapacitySavedAt("");
    }, 2000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [capacitySavedAt]);

  function revokePreviewUrl(url) {
    if (url && url.startsWith("blob:") && previewUrlsRef.current.has(url)) {
      URL.revokeObjectURL(url);
      previewUrlsRef.current.delete(url);
    }
  }

  function buildPreviewUrl(file) {
    const previewUrl = URL.createObjectURL(file);
    previewUrlsRef.current.add(previewUrl);
    return previewUrl;
  }

  function setUploadedPhoto(kind, url) {
    if (kind === "profile") {
      setProfilePhotoUrl(url);
      return;
    }

    setBannerPhotoUrl(url);
  }

  function setPhotoBusy(kind, value) {
    if (kind === "profile") {
      setProfileSaving(value);
      return;
    }

    setBannerSaving(value);
  }

  function setPhotoErrorForKind(kind, value) {
    if (kind === "profile") {
      setPhotoError(value);
      return;
    }

    setBannerError(value);
  }

  async function handlePhotoUpload(kind, file) {
    const previousUrl = kind === "profile" ? profilePhotoUrl : bannerPhotoUrl;
    const previewUrl = buildPreviewUrl(file);

    setUploadedPhoto(kind, previewUrl);
    setPhotoErrorForKind(kind, "");
    setPhotoBusy(kind, true);

    try {
      const response =
        kind === "profile"
          ? await updateInviteProfilePhoto(file)
          : await updateInviteBannerPhoto(file);

      if (!response.ok) {
        throw new Error(response.error ?? "Unable to update photo.");
      }

      const nextUrl =
        kind === "profile"
          ? toPhotoUrl(response.profilePhoto, response.profilePhotoUrl || previousUrl)
          : toPhotoUrl(response.bannerPhoto, response.bannerPhotoUrl || previousUrl);

      setUploadedPhoto(kind, nextUrl || previousUrl);
      revokePreviewUrl(previewUrl);
    } catch (error) {
      setUploadedPhoto(kind, previousUrl);
      setPhotoErrorForKind(
        kind,
        error instanceof Error ? error.message : "Unable to update photo.",
      );
      revokePreviewUrl(previewUrl);
    } finally {
      setPhotoBusy(kind, false);
    }
  }

  async function handlePhotoChange(kind, event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    await handlePhotoUpload(kind, file);
  }

  async function handleSaveCapacity(nextValue = capacity) {
    setCapacitySaving(true);
    setCapacityError("");

    try {
      const rawCapacity = String(nextValue).trim();
      const payload = rawCapacity === "" ? null : Number(rawCapacity);

      if (payload !== null && (!Number.isInteger(payload) || payload <= 0)) {
        throw new Error("Capacity must be a positive whole number.");
      }

      const data = await updateInviteCapacity(payload);

      if (!data.ok) {
        throw new Error(data.error ?? "Unable to update capacity.");
      }

      setCapacity(data.capacity === null || data.capacity === undefined ? "" : String(data.capacity));
      setCapacitySavedAt(data.updatedAt ?? new Date().toISOString());
    } catch (error) {
      setCapacityError(error instanceof Error ? error.message : "Unable to update capacity.");
    } finally {
      setCapacitySaving(false);
    }
  }

  function handleCapacityChange(event) {
    const nextValue = event.target.value.replace(/[^\d]/g, "");
    setCapacity(nextValue);
  }

  function adjustCapacity(delta) {
    const currentValue = Number.parseInt(capacity, 10);
    const baseValue = Number.isInteger(currentValue) ? currentValue : 0;
    const nextValue = Math.max(1, baseValue + delta);
    setCapacity(String(nextValue));
    void handleSaveCapacity(String(nextValue));
  }

  function handleCapacityKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      void handleSaveCapacity();
    }
  }

  function handleLogout() {
    window.localStorage.removeItem("watch-party-admin-session");
    window.localStorage.removeItem("watch-party-admin-last-active-at");
    router.replace("/");
  }

  const capacityValue = capacity === "" ? "—" : capacity;
  const capacityCurrent = capacity === "" ? "∞" : `${inviteCount}`;
  const capacityLimit = capacity === "" ? "∞" : capacityValue;
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "A";
  const bannerStyle = {
    backgroundImage: bannerPhotoUrl
      ? `linear-gradient(180deg, rgba(3, 9, 6, 0.14), rgba(3, 9, 6, 0.64)), url("${bannerPhotoUrl}")`
      : "linear-gradient(135deg, rgba(12, 26, 18, 0.94), rgba(21, 58, 40, 0.88))",
  };
  const capacityLabel = capacityValue === "—" ? "No limit" : `${capacityValue} guests`;
  const capacityButtonLabel = capacitySaving ? "Saving..." : capacitySavedAt ? "Saved" : "Save";
  const capacityStatusLabel =
    capacity === "" ? `${inviteCount} registered` : `${capacityCurrent} / ${capacityLimit}`;

  return (
    <main className="page-root profile-page">
      <section className="screen-shell profile-shell">
        <header className="profile-intro">
          <p className="profile-eyebrow">Profile</p>
          <h1 className="profile-title">My profile</h1>
        </header>

        <article className="profile-card profile-identity-card">
          <div className="profile-banner" style={bannerStyle}>
            <div className="profile-banner-overlay" />

            <button
              className="profile-media-button profile-banner-button"
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              disabled={bannerSaving}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="profile-media-icon">
                <path d="M4.5 6.75A2.25 2.25 0 0 1 6.75 4.5h10.5A2.25 2.25 0 0 1 19.5 6.75v7.5A2.25 2.25 0 0 1 17.25 16.5h-10.5A2.25 2.25 0 0 1 4.5 14.25v-7.5Zm2.25-.75a.75.75 0 0 0-.75.75v7.5c0 .414.336.75.75.75h10.5a.75.75 0 0 0 .75-.75v-7.5a.75.75 0 0 0-.75-.75H6.75Zm.75 2.25a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm11.25 9a1.5 1.5 0 0 1-1.5 1.5H6.75A1.5 1.5 0 0 1 5.25 17.25v-.63c0-.44.24-.84.62-1.05l3.08-1.69a1.5 1.5 0 0 1 1.48.03l1.9 1.08a.75.75 0 0 0 .76 0l2.74-1.57a1.5 1.5 0 0 1 1.72.2l1.87 1.6c.28.24.45.59.45.97v1.02Z" />
              </svg>
              <span>{bannerSaving ? "Saving" : "Banner"}</span>
            </button>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              onChange={(event) => void handlePhotoChange("banner", event)}
              className="profile-upload-input"
            />

            <div className="profile-identity-content">
              <div className="profile-photo-wrap">
                {profilePhotoUrl ? (
                  <img alt="Profile photo" className="profile-photo" src={profilePhotoUrl} />
                ) : (
                  <div className="profile-photo-fallback">{initials}</div>
                )}

                <button
                  className="profile-media-button profile-photo-button"
                  type="button"
                  onClick={() => profileInputRef.current?.click()}
                  disabled={profileSaving}
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="profile-media-icon">
                    <path d="M12 5.25 10.9 7.1H8.7A2.7 2.7 0 0 0 6 9.8v6.45A2.75 2.75 0 0 0 8.75 19h6.5A2.75 2.75 0 0 0 18 16.25V9.8a2.7 2.7 0 0 0-2.7-2.7h-2.2L12 5.25Zm0 4.25a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z" />
                  </svg>
                  <span>{profileSaving ? "Saving" : "Photo"}</span>
                </button>
                <input
                  ref={profileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(event) => void handlePhotoChange("profile", event)}
                  className="profile-upload-input"
                />
              </div>

              <div className="profile-identity-copy">
                <h2 className="profile-name">{displayName}</h2>
                <p className="profile-phone">{phoneNumber}</p>
              </div>
            </div>
          </div>

          {photoError ? <p className="profile-error profile-inline-error">{photoError}</p> : null}
          {bannerError ? <p className="profile-error profile-inline-error">{bannerError}</p> : null}
        </article>

        <section className="profile-card profile-settings-card">
          <div className="profile-section-head">
            <h2 className="profile-section-title">Guests</h2>
          </div>

          <div className="profile-capacity-control" aria-label="Guest capacity">
            <button
              className="profile-capacity-step"
              type="button"
              onClick={() => adjustCapacity(-1)}
              disabled={capacitySaving}
              aria-label="Decrease capacity"
            >
              <span aria-hidden="true">−</span>
            </button>

            <label className="profile-capacity-field">
              <span className="sr-only">Guest capacity</span>
              <input
                inputMode="numeric"
                onChange={handleCapacityChange}
                onKeyDown={handleCapacityKeyDown}
                placeholder="0"
                type="text"
                value={capacity}
              />
            </label>

            <button
              className="profile-capacity-step"
              type="button"
              onClick={() => adjustCapacity(1)}
              disabled={capacitySaving}
              aria-label="Increase capacity"
            >
              <span aria-hidden="true">+</span>
            </button>
          </div>

          <div className="profile-capacity-foot">
            <span className="profile-capacity-chip">
              {capacitySaving ? "Saving" : capacityLabel}
            </span>
            <button
              className="profile-save-button profile-capacity-save"
              type="button"
              onClick={() => void handleSaveCapacity()}
              disabled={capacitySaving || !adminSessionId}
            >
              {capacityButtonLabel}
            </button>
          </div>

          <p className="profile-capacity-status" aria-live="polite">
            {capacityStatusLabel}
          </p>

          {capacitySavedAt ? (
            <p className="profile-success" role="status" aria-live="polite">
              Saved to registration flow.
            </p>
          ) : null}

          {capacityError ? <p className="profile-error">{capacityError}</p> : null}
        </section>

        <button className="profile-logout-button" type="button" onClick={handleLogout}>
          Log out
        </button>
      </section>
    </main>
  );
}
