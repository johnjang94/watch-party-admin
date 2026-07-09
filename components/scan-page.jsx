"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { fetchAdminUserByToken } from "../lib/admin-api";

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

export function ScanPage() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const rafRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [lookupToken, setLookupToken] = useState("");
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState("Point the camera at a guest QR code.");
  const [error, setError] = useState("");
  const [supportsScan, setSupportsScan] = useState(false);

  async function stopCamera() {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }

    setIsRunning(false);
  }

  async function lookupUser(token) {
    const safeToken = String(token ?? "").trim();
    if (!safeToken) {
      return;
    }

    setLookupToken(safeToken);
    setError("");
    setMessage("Checking attendance record...");

    try {
      const user = await fetchAdminUserByToken(safeToken);
      if (!user) {
        setResult(null);
        setMessage("No registration found for that QR code.");
        return;
      }

      setResult(user);
      setMessage("Guest matched successfully.");
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Unable to verify QR code.");
      setMessage("Unable to verify QR code.");
    }
  }

  async function startCamera() {
    setError("");
    if (!supportsScan) {
      setMessage("Your browser does not support live QR scanning. Use manual entry below.");
      return;
    }

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

      const detector = detectorRef.current ?? new window.BarcodeDetector({ formats: ["qr_code"] });
      detectorRef.current = detector;
      setIsRunning(true);
      setMessage("Scanning for QR code...");

      const scanFrame = async () => {
        if (!videoRef.current || !detectorRef.current || !streamRef.current) {
          return;
        }

        try {
          const codes = await detectorRef.current.detect(videoRef.current);
          if (codes.length) {
            const value = String(codes[0].rawValue ?? "").trim();
            if (value) {
              await stopCamera();
              await lookupUser(value);
              return;
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to open the camera.");
      setMessage("Camera access is required for live scanning.");
      await stopCamera();
    }
  }

  useEffect(() => {
    setSupportsScan("BarcodeDetector" in window && !!navigator.mediaDevices?.getUserMedia);

    return () => {
      void stopCamera();
    };
  }, []);

  return (
    <main className="page-root detail-page scan-page">
      <section className="screen-shell scan-shell">
        <header className="screen-topbar scan-topbar">
          <Link className="back-link scan-back" href="/dashboard">
            back
          </Link>
          <div className="screen-heading scan-heading">
            <p className="eyebrow">scan</p>
            <h1 className="screen-title">Attendance check</h1>
          </div>
        </header>

        <div className="scan-summary">
          <span>{isRunning ? "camera on" : "camera idle"}</span>
          <span>{lookupToken ? `token ${lookupToken}` : "ready to scan"}</span>
        </div>

        <article className="scan-card">
          <div className="scan-camera">
            <video ref={videoRef} className="scan-video" playsInline muted />
            {!isRunning ? <div className="scan-placeholder">QR camera preview</div> : null}
          </div>

          <div className="scan-copy">
            <p className="scan-message">{message}</p>
            {error ? <p className="scan-error">{error}</p> : null}

            <div className="scan-actions">
              <button className="secondary-button" type="button" onClick={() => void startCamera()} disabled={isRunning}>
                start camera
              </button>
              <button className="secondary-button" type="button" onClick={() => void stopCamera()} disabled={!isRunning}>
                stop camera
              </button>
            </div>

            <form
              className="scan-manual"
              onSubmit={(event) => {
                event.preventDefault();
                void lookupUser(manualToken);
              }}
            >
              <label className="scan-input-label">
                <span>Manual QR token</span>
                <input
                  className="field-input scan-input"
                  placeholder="Paste or type the token"
                  value={manualToken}
                  onChange={(event) => setManualToken(event.target.value)}
                />
              </label>
              <button className="primary-button scan-submit" type="submit">
                verify attendance
              </button>
            </form>

            {!supportsScan ? (
              <p className="scan-note">This browser does not expose live QR scanning, so manual verification is enabled.</p>
            ) : null}
          </div>
        </article>

        {result ? (
          <article className="scan-result">
            <div className="scan-result-avatar">
              {result.profilePhotoUrl ? (
                <img alt={`${result.firstName} ${result.lastName}`} src={result.profilePhotoUrl} />
              ) : (
                <div className="scan-result-fallback">{initialsFor(result)}</div>
              )}
            </div>

            <div className="scan-result-copy">
              <div className="scan-result-row">
                <strong>{result.firstName} {result.lastName}</strong>
                <span className="status-chip">{result.attendance || "guest"}</span>
              </div>
              <dl className="scan-result-meta">
                <div>
                  <dt>Phone</dt>
                  <dd>{result.phoneNumber}</dd>
                </div>
                <div>
                  <dt>Registered</dt>
                  <dd>{formatValue(result.registeredAt ?? result.createdAt)}</dd>
                </div>
                <div>
                  <dt>Check-in</dt>
                  <dd>{formatValue(result.enteredAt ?? result.deviceTrackedAt)}</dd>
                </div>
              </dl>
            </div>
          </article>
        ) : null}
      </section>
    </main>
  );
}
