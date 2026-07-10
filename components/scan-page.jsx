"use client";

import { useEffect, useRef, useState } from "react";
import { useCallback } from "react";
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

function resolveRsvp(user) {
  return String(user?.rsvp ?? user?.attendance ?? user?.status ?? "Going");
}

export function ScanPage() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const rafRef = useRef(null);
  const ignoreTokenRef = useRef("");
  const ignoreUntilRef = useRef(0);
  const resumeTimerRef = useRef(null);
  const [supportsScan] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return "BarcodeDetector" in window && !!navigator.mediaDevices?.getUserMedia;
  });
  const [isCameraReady, setIsCameraReady] = useState(false);
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

    setIsCameraReady(false);
  }, []);

  const openCamera = useCallback(async () => {
    if (!supportsScan || activeGuest) {
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
      setIsCameraReady(true);

      const scanFrame = async () => {
        if (!videoRef.current || !detectorRef.current || !streamRef.current || activeGuest) {
          return;
        }

        try {
          const codes = await detectorRef.current.detect(videoRef.current);
          if (codes.length) {
            const value = String(codes[0].rawValue ?? "").trim();
            const now = Date.now();
            if (value && (ignoreTokenRef.current !== value || now > ignoreUntilRef.current)) {
              ignoreTokenRef.current = value;
              ignoreUntilRef.current = now + 2500;
              const user = await fetchAdminUserByToken(value);
              if (user) {
                setActiveGuest(user);
                await stopCamera();
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
    } catch {
      await stopCamera();
    }
  }, [activeGuest, stopCamera, supportsScan]);

  function closeGuestCard() {
    setActiveGuest(null);
    resumeTimerRef.current = setTimeout(() => {
      void openCamera();
    }, 250);
  }

  useEffect(() => {
    if (!supportsScan) {
      return undefined;
    }

    const startTimer = window.setTimeout(() => {
      void openCamera();
    }, 0);

    return () => {
      window.clearTimeout(startTimer);
      void stopCamera();
    };
  }, [openCamera, stopCamera, supportsScan]);

  const guestName = activeGuest ? `${activeGuest.firstName ?? ""} ${activeGuest.lastName ?? ""}`.trim() : "";
  const guestStatus = resolveRsvp(activeGuest);
  const guestPhoto = activeGuest?.profilePhotoUrl || activeGuest?.avatar || null;

  return (
    <main className="page-root scan-page">
      <section className="scan-shell" aria-label="QR scanner">
        <div className="scan-stage">
          <video ref={videoRef} className="scan-video" playsInline muted />
          {!supportsScan ? <div className="scan-fallback">Camera unavailable</div> : null}
          {!isCameraReady && supportsScan ? <div className="scan-fallback">Opening camera...</div> : null}
          <div className="scan-frame" aria-hidden="true" />
        </div>

        {activeGuest ? (
          <div className="scan-modal" role="dialog" aria-modal="true" aria-label="Checked in guest">
            <div className="scan-modal-card">
              <div className="scan-modal-hero">
                {guestPhoto ? (
                  <img alt={guestName} src={guestPhoto} className="scan-modal-photo" />
                ) : (
                  <div className="scan-modal-fallback">{initialsFor(activeGuest)}</div>
                )}
              </div>

              <div className="scan-modal-copy">
                <strong className="scan-modal-name">{guestName}</strong>
                <p className="scan-modal-line">RSVP: {guestStatus}</p>
                <p className="scan-modal-line">{activeGuest.phoneNumber || "Unavailable"}</p>
                <p className="scan-modal-line">{formatValue(activeGuest.registeredAt ?? activeGuest.createdAt)}</p>
                <button className="primary-button scan-modal-button" type="button" onClick={closeGuestCard}>
                  checked in
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
