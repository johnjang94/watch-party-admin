"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchAdminUserByToken, markAdminUserCheckedIn } from "../lib/admin-api";

function formatValue(value) {
  if (!value) return "Unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function initialsFor(user) {
  return `${String(user?.firstName ?? "").charAt(0)}${String(user?.lastName ?? "").charAt(0)}`.trim() || "U";
}

function resolveRsvp(user) {
  return String(user?.rsvp ?? user?.attendance ?? user?.status ?? "Going");
}

function sanitizeBarcode(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.length === 5 ? digits : "";
}

function normalizeScanValue(value) {
  const rawValue = String(value ?? "").trim();
  if (!rawValue) {
    return "";
  }

  if (/^\d{5}$/.test(rawValue)) {
    return rawValue;
  }

  try {
    const url = new URL(rawValue, window.location.origin);
    const inviteToken = url.searchParams.get("invite")?.trim();
    if (inviteToken) {
      return inviteToken;
    }
  } catch {
    // Fall back to the raw QR payload.
  }

  return rawValue;
}

function isCheckedIn(user) {
  return Boolean(user?.checkedInAt);
}

export function ScanPage() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const rafRef = useRef(null);
  const ignoreTokenRef = useRef("");
  const ignoreUntilRef = useRef(0);
  const resumeTimerRef = useRef(null);
  const [supportsCamera] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return !!navigator.mediaDevices?.getUserMedia;
  });
  const [supportsAutoScan] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return "BarcodeDetector" in window;
  });
  const [cameraState, setCameraState] = useState("idle");
  const [cameraMessage, setCameraMessage] = useState("");
  const [manualBarcode, setManualBarcode] = useState("");
  const [manualError, setManualError] = useState("");
  const [lookupMessage, setLookupMessage] = useState("");
  const [checkInMessage, setCheckInMessage] = useState("");
  const [checkInError, setCheckInError] = useState("");
  const [isCheckInBusy, setIsCheckInBusy] = useState(false);
  const [isManualBusy, setIsManualBusy] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [activeGuest, setActiveGuest] = useState(null);

  const stopCamera = useCallback(async () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }

    setCameraState("idle");
  }, []);

  const processLookup = useCallback(
    async (identifier) => {
      const safeIdentifier = normalizeScanValue(identifier);
      if (!safeIdentifier) {
        return null;
      }

      try {
        const user = await fetchAdminUserByToken(safeIdentifier);
        if (!user) {
          return null;
        }

        setActiveGuest(user);
        setManualError("");
        setLookupMessage("");
        setCheckInMessage("");
        setCheckInError("");
        setShowManualEntry(false);
        await stopCamera();
        return user;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to look up guest.";
        setManualError(message);
        setLookupMessage("");
        return null;
      }
    },
    [stopCamera],
  );

  const openCamera = useCallback(async () => {
    if (!supportsCamera || activeGuest) {
      if (!supportsCamera) {
        setCameraState("unavailable");
        setCameraMessage("Camera unavailable.");
      }

      return;
    }

    setCameraState("starting");
    setCameraMessage("Opening camera...");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
        },
        audio: false,
      });

      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      video.srcObject = stream;
      await video.play();

      if (!supportsAutoScan) {
        setCameraState("preview");
        setCameraMessage("Camera preview.");
        return;
      }

      const detector = detectorRef.current ?? new window.BarcodeDetector({ formats: ["qr_code"] });
      detectorRef.current = detector;
      setCameraState("ready");
      setCameraMessage("Ready to scan.");

      const scanFrame = async () => {
        if (!videoRef.current || !detectorRef.current || !streamRef.current || activeGuest) {
          return;
        }

        try {
          const codes = await detectorRef.current.detect(videoRef.current);
          if (codes.length) {
            const value = normalizeScanValue(codes[0].rawValue);
            const now = Date.now();
            if (value && (ignoreTokenRef.current !== value || now > ignoreUntilRef.current)) {
              ignoreTokenRef.current = value;
              ignoreUntilRef.current = now + 2500;

              const user = await processLookup(value);
              if (user) {
                return;
              }
            }
          }
        } catch {
          // Keep scanning.
        }

        rafRef.current = requestAnimationFrame(() => {
          void scanFrame();
        });
      };

      void scanFrame();
    } catch (error) {
      await stopCamera();
      setCameraState("error");
      setCameraMessage(
        error instanceof Error && error.name === "NotAllowedError"
          ? "Camera permission denied."
          : "Camera failed.",
      );
    }
  }, [activeGuest, processLookup, stopCamera, supportsAutoScan, supportsCamera]);

  function closeGuestCard() {
    setActiveGuest(null);
    setManualBarcode("");
    setManualError("");
    setLookupMessage("");
    setCheckInMessage("");
    setCheckInError("");
    setShowManualEntry(false);
    resumeTimerRef.current = setTimeout(() => {
      void openCamera();
    }, 250);
  }

  async function handleBarcodeSubmit(event) {
    event.preventDefault();

    const safeBarcode = sanitizeBarcode(manualBarcode);
    if (!safeBarcode) {
      setManualError("Enter 5 digits.");
      return;
    }

    setIsManualBusy(true);
    setManualError("");
    setLookupMessage("Checking...");

    try {
      const user = await processLookup(safeBarcode);
      if (!user) {
        setManualError("No guest matches that barcode.");
        setLookupMessage("");
        return;
      }

      setManualBarcode("");
    } finally {
      setIsManualBusy(false);
    }
  }

  async function handleCheckIn() {
    if (!activeGuest || isCheckedIn(activeGuest) || isCheckInBusy) {
      return;
    }

    setIsCheckInBusy(true);
    setCheckInError("");
    setCheckInMessage("Saving check-in...");

    try {
      const nextGuest = await markAdminUserCheckedIn(activeGuest.id || activeGuest.qrToken || activeGuest.barcode);
      if (!nextGuest) {
        setCheckInError("Could not save the check-in.");
        setCheckInMessage("");
        return;
      }

      setActiveGuest(nextGuest);
      setCheckInMessage("Guest checked in.");
    } catch (error) {
      setCheckInError(error instanceof Error ? error.message : "Could not save the check-in.");
      setCheckInMessage("");
    } finally {
      setIsCheckInBusy(false);
    }
  }

  useEffect(() => {
    if (!supportsCamera) {
      setCameraState("unavailable");
      setCameraMessage("This browser cannot open the camera.");
      return undefined;
    }

    const startTimer = window.setTimeout(() => {
      void openCamera();
    }, 0);

    return () => {
      window.clearTimeout(startTimer);
      void stopCamera();
    };
  }, [openCamera, stopCamera, supportsCamera]);

  const guestName = activeGuest ? `${activeGuest.firstName ?? ""} ${activeGuest.lastName ?? ""}`.trim() : "";
  const guestStatus = resolveRsvp(activeGuest);
  const guestPhoto = activeGuest?.profilePhotoUrl || activeGuest?.avatar || null;

  return (
    <main className="page-root scan-page">
      <section className="scan-shell" aria-label="QR scanner">
        <article className="scan-card">
          <div className="scan-camera">
            <video ref={videoRef} className="scan-video" playsInline muted />
            {cameraState === "unavailable" ? <div className="scan-placeholder">{cameraMessage}</div> : null}
            {cameraState === "starting" ? <div className="scan-placeholder">{cameraMessage}</div> : null}
            {cameraState === "error" ? <div className="scan-placeholder">{cameraMessage}</div> : null}
            {cameraState === "preview" ? <div className="scan-placeholder">{cameraMessage}</div> : null}
          </div>

          <div className="scan-copy">
            <p className="scan-message">
              {activeGuest
                ? isCheckedIn(activeGuest)
                  ? "Checked in."
                  : "Verified."
                : cameraMessage || "Scan the QR code"}
            </p>

            {!activeGuest ? <p className="scan-instruction">Scan the QR code</p> : null}

            {!activeGuest ? (
              <button
                className="scan-toggle"
                type="button"
                onClick={() => setShowManualEntry((current) => !current)}
              >
                can&apos;t scan the QR code?
              </button>
            ) : null}

            {lookupMessage ? <p className="scan-note">{lookupMessage}</p> : null}

            {manualError ? <p className="scan-error">{manualError}</p> : null}

            {!activeGuest && showManualEntry ? (
              <form className="scan-manual" onSubmit={handleBarcodeSubmit}>
                <label className="scan-input-label" htmlFor="barcode-input">
                  <span className="sr-only">Barcode</span>
                  <input
                    autoComplete="off"
                    className="field-input scan-input"
                    disabled={isManualBusy || Boolean(activeGuest)}
                    id="barcode-input"
                    inputMode="numeric"
                    maxLength={5}
                    onChange={(event) => setManualBarcode(event.target.value)}
                    placeholder="5 digits"
                    type="text"
                    value={manualBarcode}
                  />
                </label>
                <button
                  className="primary-button scan-submit"
                  disabled={isManualBusy || Boolean(activeGuest)}
                  type="submit"
                >
                  {isManualBusy ? "checking..." : "verify barcode"}
                </button>
              </form>
            ) : null}
          </div>
        </article>

        {activeGuest ? (
          <section className="scan-result" aria-live="polite">
            <div className="scan-result-avatar">
              {guestPhoto ? (
                <img alt={guestName} src={guestPhoto} />
              ) : (
                <div className="scan-result-fallback">{initialsFor(activeGuest)}</div>
              )}
            </div>

          <div className="scan-result-copy">
            <div className="scan-result-row">
              <strong>{guestName}</strong>
              <span>{guestStatus}</span>
            </div>

            {isCheckedIn(activeGuest) ? (
              <span className="status-chip scan-result-chip is-checked-in">checked-in</span>
            ) : null}

            <dl className="scan-result-meta">
                <div>
                  <dt>Phone</dt>
                  <dd>{activeGuest.phoneNumber || "Unavailable"}</dd>
                </div>
                <div>
                  <dt>Registered</dt>
                  <dd>{formatValue(activeGuest.registeredAt ?? activeGuest.createdAt)}</dd>
                </div>
                <div>
                  <dt>Barcode</dt>
                  <dd>{String(activeGuest.barcode ?? "Unavailable")}</dd>
                </div>
              </dl>

              <div className="scan-actions">
                {checkInError ? <p className="scan-error">{checkInError}</p> : null}
                {checkInMessage ? <p className="scan-note">{checkInMessage}</p> : null}
                <button
                  className="primary-button scan-submit"
                  disabled={isCheckInBusy || isCheckedIn(activeGuest)}
                  type="button"
                  onClick={handleCheckIn}
                >
                  {isCheckedIn(activeGuest) ? "checked in" : isCheckInBusy ? "checking..." : "check-in"}
                </button>
                <button className="secondary-button" type="button" onClick={closeGuestCard}>
                  scan next guest
                </button>
              </div>
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}
