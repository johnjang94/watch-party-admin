"use client";

import Link from "next/link";
import { useState } from "react";

const apiBaseUrl = process.env.NEXT_PUBLIC_CONTROL_URL ?? "https://fifa-control.onrender.com";

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

function normalizeAvatarSource(raw) {
  if (!raw) return null;

  const value =
    typeof raw === "string"
      ? raw.trim()
      : typeof raw?.src === "string"
        ? raw.src.trim()
        : typeof raw?.url === "string"
          ? raw.url.trim()
          : typeof raw?.path === "string"
            ? raw.path.trim()
            : typeof raw?.value === "string"
              ? raw.value.trim()
              : null;

  if (!value) return null;

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  try {
    return new URL(value, apiBaseUrl).toString();
  } catch {
    return value.startsWith("/") ? value : `/${value}`;
  }
}

function resolveAvatar(user) {
  const candidates = [
    user.profilePhotoUrl,
    user.avatarUrl,
    user.profilePhoto,
    user.avatar,
    user.photoUrl,
    user.photo,
    user.avatarPath,
    user.picture,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeAvatarSource(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return null;
}

function initialsFor(user) {
  return `${String(user.firstName ?? "").charAt(0)}${String(user.lastName ?? "").charAt(0)}`.trim() || "U";
}

function hasSurveyAnswers(user) {
  const survey = user.survey ?? {};
  return Boolean(
    survey &&
      (survey.howDidYouKnow ||
        survey.referredBy ||
        survey.dietaryRestrictions ||
        survey.resident ||
        survey.submittedAt),
  );
}

function UserAvatar({ user, className, fallbackClassName }) {
  const avatar = resolveAvatar(user);

  if (avatar) {
    return <img alt={`${user.firstName} ${user.lastName}`} className={className} src={avatar} />;
  }

  return (
    <div className={fallbackClassName} aria-hidden="true">
      {initialsFor(user)}
    </div>
  );
}

function OldListView({ title, users }) {
  const hasUsers = users.length > 0;

  return (
    <main className="page-root detail-page roster-page collection-page">
      <section className="screen-shell list-shell roster-shell collection-shell">
        <header className="screen-topbar roster-topbar collection-topbar">
          <Link className="back-link roster-back" href="/dashboard">
            back
          </Link>
          <div className="screen-heading roster-heading collection-heading">
            <h1 className="screen-title">{title}</h1>
          </div>
        </header>

        {hasUsers ? (
          <div className="user-list roster-grid">
            {users.map((user) => (
              <article className="user-card roster-card collection-card" key={user.id}>
                <div className="user-avatar-frame roster-avatar-frame collection-avatar-frame">
                  <UserAvatar
                    className="user-avatar"
                    fallbackClassName="user-avatar-fallback"
                    user={user}
                  />
                </div>

                <div className="user-body roster-body">
                  <div className="user-title-row roster-title-row collection-title-row">
                    <strong className="user-name roster-name">
                      {user.firstName} {user.lastName}
                    </strong>
                  </div>

                  <dl className="user-meta roster-meta collection-meta">
                    <div>
                      <dt>Phone</dt>
                      <dd>{user.phoneNumber}</dd>
                    </div>
                    <div>
                      <dt>Joined</dt>
                      <dd>{formatValue(user.registeredAt ?? user.createdAt)}</dd>
                    </div>
                  </dl>

                  {hasSurveyAnswers(user) ? (
                    <div className="user-survey">
                      <strong className="user-survey-title">Survey</strong>
                      <dl className="user-meta survey-meta">
                        <div>
                          <dt>Heard from</dt>
                          <dd>{user.survey?.howDidYouKnow || "Unavailable"}</dd>
                        </div>
                        <div>
                          <dt>Referred by</dt>
                          <dd>{user.survey?.referredBy || "n/a"}</dd>
                        </div>
                        <div>
                          <dt>Dietary</dt>
                          <dd>{user.survey?.dietaryRestrictions || "n/a"}</dd>
                        </div>
                        <div>
                          <dt>Resident</dt>
                          <dd>{user.survey?.resident || "n/a"}</dd>
                        </div>
                      </dl>
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="roster-empty">
            <strong>No guests yet.</strong>
            <p>The list will populate as soon as the backend returns registrations.</p>
          </div>
        )}
      </section>
    </main>
  );
}

function NewDetailCard({ user }) {
  const avatar = resolveAvatar(user);

  return (
    <article className="new-detail-card">
      <div className="new-detail-hero">
        {avatar ? (
          <img alt={`${user.firstName} ${user.lastName}`} className="new-detail-photo" src={avatar} />
        ) : (
          <div className="new-detail-fallback" aria-hidden="true">
            {initialsFor(user)}
          </div>
        )}
      </div>

      <div className="new-detail-copy">
        <div className="new-detail-title-row">
          <strong className="new-detail-name">
            {user.firstName} {user.lastName}
          </strong>
          <span className="status-chip is-muted new-detail-chip">Guest</span>
        </div>

        <dl className="new-detail-meta">
          <div>
            <dt>Phone</dt>
            <dd>{user.phoneNumber || "Unavailable"}</dd>
          </div>
          <div>
            <dt>Joined</dt>
            <dd>{formatValue(user.registeredAt ?? user.createdAt)}</dd>
          </div>
        </dl>

        {hasSurveyAnswers(user) ? (
          <div className="new-detail-survey">
            <strong className="user-survey-title">Survey</strong>
            <dl className="user-meta survey-meta new-survey-meta">
              <div>
                <dt>Heard from</dt>
                <dd>{user.survey?.howDidYouKnow || "Unavailable"}</dd>
              </div>
              <div>
                <dt>Referred by</dt>
                <dd>{user.survey?.referredBy || "n/a"}</dd>
              </div>
              <div>
                <dt>Dietary</dt>
                <dd>{user.survey?.dietaryRestrictions || "n/a"}</dd>
              </div>
              <div>
                <dt>Resident</dt>
                <dd>{user.survey?.resident || "n/a"}</dd>
              </div>
            </dl>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function NewListView({ title, users }) {
  const hasUsers = users.length > 0;
  const [selectedId, setSelectedId] = useState("");
  const selectedUser = users.find((user) => user.id === selectedId) ?? null;
  const selectedUserId = selectedUser?.id ?? "";

  return (
    <main className="page-root detail-page new-page">
      <section className="screen-shell new-shell">
        <header className="new-topbar">
          <div className="screen-heading new-heading">
            <p className="eyebrow">new</p>
            <h1 className="screen-title">{title}</h1>
          </div>
          <p className="new-summary">{hasUsers ? `${users.length} guests` : "No guests yet"}</p>
        </header>

        {hasUsers ? (
          <div className="new-layout">
            <section className="new-list-card" aria-label="New guest list">
              <div className="new-list">
                {users.map((user) => {
                  const isActive = selectedUserId === user.id;

                  return (
                    <button
                      className={`new-list-item ${isActive ? "is-active" : ""}`}
                      key={user.id}
                      type="button"
                      onClick={() =>
                        setSelectedId((current) => (current === user.id ? "" : user.id))
                      }
                    >
                      <div className="new-list-avatar">
                        <UserAvatar
                          className="new-list-photo"
                          fallbackClassName="new-list-fallback"
                          user={user}
                        />
                      </div>

                      <div className="new-list-copy">
                        <strong className="new-list-name">
                          {user.firstName} {user.lastName}
                        </strong>
                        <span className="new-list-meta">{user.phoneNumber || "Unavailable"}</span>
                      </div>

                      <span className="new-list-arrow" aria-hidden="true">
                        →
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {selectedUserId ? <NewDetailCard user={selectedUser} /> : null}
          </div>
        ) : (
          <div className="roster-empty new-empty">
            <strong>No guests yet.</strong>
            <p>The list will populate as soon as the backend returns registrations.</p>
          </div>
        )}
      </section>
    </main>
  );
}

export function UserListPage({ title, users, variant = "all" }) {
  if (variant === "new") {
    return <NewListView title={title} users={users} />;
  }

  return <OldListView title={title} users={users} />;
}
