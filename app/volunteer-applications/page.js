"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { fetchVolunteerApplications } from "../../lib/admin-api";

function formatTime(value) {
  if (!value) {
    return "recent thread";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function initialsFor(applicant) {
  const first = String(applicant?.firstName ?? "").trim().charAt(0);
  const last = String(applicant?.lastName ?? "").trim().charAt(0);
  return `${first}${last}`.trim() || "?";
}

function VolunteerApplicationCard({ applicant, isOpen, onToggle }) {
  const interests = Array.isArray(applicant?.volunteerApplication?.interests)
    ? applicant.volunteerApplication.interests.filter(Boolean)
    : [];
  const submittedAt = String(applicant?.volunteerApplication?.submittedAt ?? "").trim();
  const displayName = [applicant?.firstName, applicant?.lastName].filter(Boolean).join(" ").trim() || "Unknown guest";
  const profilePhotoUrl = String(applicant?.profilePhotoUrl ?? "").trim();

  return (
    <article className={`inquiry-card inquiry-panel volunteer-application-card ${isOpen ? "is-open" : ""}`}>
      <button
        className="inquiry-summary-button"
        onClick={onToggle}
        type="button"
      >
        <header className="inquiry-card-head inquiry-panel-head">
          <div className="inquiry-copy">
            <div className="inquiry-heading-row">
              {profilePhotoUrl ? (
                <img alt="" className="inquiry-avatar" src={profilePhotoUrl} />
              ) : (
                <div className="inquiry-avatar inquiry-avatar-fallback" aria-hidden="true">
                  {initialsFor(applicant)}
                </div>
              )}

              <div className="inquiry-copy-text">
                <div className="inquiry-name-row">
                  <p className="inquiry-name">{displayName}</p>
                </div>
                <p className="inquiry-question inquiry-group-subtitle">
                  Volunteer application · {interests.length} item{interests.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>
          </div>

          <div className="inquiry-chip-stack">
            <span className="status-chip inquiry-chip">thread</span>
            <span className="status-chip is-muted inquiry-chip">{formatTime(submittedAt)}</span>
          </div>
        </header>
      </button>

      {isOpen ? (
        <div className="inquiry-body volunteer-application-body">
          <div className="inquiry-detail-header">
            <div className="inquiry-heading-row">
              {profilePhotoUrl ? (
                <img alt="" className="inquiry-avatar" src={profilePhotoUrl} />
              ) : (
                <div className="inquiry-avatar inquiry-avatar-fallback" aria-hidden="true">
                  {initialsFor(applicant)}
                </div>
              )}

              <div className="inquiry-copy-text">
                <div className="inquiry-name-row">
                  <p className="inquiry-name">{displayName}</p>
                </div>
                <p className="inquiry-question">What they are bringing</p>
              </div>
            </div>

            <div className="inquiry-chip-stack">
              <span className="status-chip inquiry-chip">{interests.length} items</span>
              <span className="status-chip is-muted inquiry-chip">{formatTime(submittedAt)}</span>
            </div>
          </div>

          <div className="volunteer-application-thread">
            {interests.length ? (
              interests.map((interest) => (
                <article className="thread-line volunteer-thread-line" key={interest}>
                  <div className="thread-line-meta">
                    <strong>bringing</strong>
                    <time>{formatTime(submittedAt)}</time>
                  </div>
                  <p>{interest}</p>
                </article>
              ))
            ) : (
              <div className="inquiry-empty-thread">No items selected.</div>
            )}
          </div>
        </div>
      ) : null}
    </article>
  );
}

function VolunteerApplicationsPageContent() {
  const [applications, setApplications] = useState(null);
  const [openId, setOpenId] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadApplications() {
      const nextApplications = await fetchVolunteerApplications();
      if (!cancelled) {
        setApplications(nextApplications);
      }
    }

    void loadApplications();

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleApplications = useMemo(() => applications ?? [], [applications]);

  return (
    <main className="page-root detail-page inquiry-page volunteer-applications-page">
      <section className="screen-shell inquiry-shell">
        <header className="new-topbar inquiry-topbar">
          <div className="screen-heading new-heading inquiry-heading">
            <p className="inquiry-detail-eyebrow">thread 05</p>
            <h1 className="screen-title">Volunteer applications</h1>
            <p className="inquiry-detail-topcopy">What guests offered to bring for the party.</p>
          </div>

          <Link className="inquiry-back-button" href="/dashboard">
            back
          </Link>
        </header>

        {applications === null ? (
          <div className="roster-empty new-empty inquiry-empty-search" role="status" aria-live="polite">
            <strong>Loading...</strong>
            <p>Fetching volunteer applications from the database.</p>
          </div>
        ) : visibleApplications.length ? (
          <div className="inquiry-list inquiry-grid">
            {visibleApplications.map((applicant) => {
              const applicationId = String(applicant?.id ?? applicant?.inviteId ?? applicant?.phoneNumber ?? applicant?.firstName ?? "").trim();
              return (
                <VolunteerApplicationCard
                  applicant={applicant}
                  isOpen={openId === applicationId}
                  key={applicationId}
                  onToggle={() => setOpenId((current) => (current === applicationId ? "" : applicationId))}
                />
              );
            })}
          </div>
        ) : (
          <div className="inquiry-empty-thread inquiry-empty-search">
            No volunteer applications yet.
          </div>
        )}
      </section>
    </main>
  );
}

export default function VolunteerApplicationsPage() {
  return (
    <Suspense fallback={<div className="page-root detail-page inquiry-page volunteer-applications-page" />}>
      <VolunteerApplicationsPageContent />
    </Suspense>
  );
}
