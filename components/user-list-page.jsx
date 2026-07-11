"use client";

import { useEffect, useMemo, useState } from "react";

const apiBaseUrl = process.env.NEXT_PUBLIC_CONTROL_URL ?? "https://fifa-control.onrender.com";

function buildFirebaseStorageDownloadUrl(bucketName, objectPath, token) {
  const cleanBucket = String(bucketName ?? "").trim();
  const cleanPath = String(objectPath ?? "")
    .trim()
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  const cleanToken = String(token ?? "").trim();

  if (!cleanBucket || !cleanPath || !cleanToken) {
    return null;
  }

  return `https://firebasestorage.googleapis.com/v0/b/${cleanBucket}/o/${cleanPath}?alt=media&token=${encodeURIComponent(cleanToken)}`;
}

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

  if (typeof raw === "object") {
    const directCandidates = [
      raw.url,
      raw.src,
      raw.downloadUrl,
      raw.downloadURL,
      raw.avatarUrl,
      raw.profilePhotoUrl,
      raw.path,
      raw.value,
    ];

    for (const candidate of directCandidates) {
      const normalized = normalizeAvatarSource(candidate);
      if (normalized) {
        return normalized;
      }
    }

    const bucketUrl = buildFirebaseStorageDownloadUrl(
      raw.storageBucket,
      raw.storagePath,
      raw.downloadToken,
    );
    if (bucketUrl) {
      return bucketUrl;
    }

    return null;
  }

  const value = String(raw).trim();

  if (!value) return null;

  if (value === "[object Object]" || value === "null" || value === "undefined") {
    return null;
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  if (value.startsWith("//")) {
    return `https:${value}`;
  }

  if (value.startsWith("/_next/") || value.startsWith("/image") || value.startsWith("/public/")) {
    return value;
  }

  if (
    value.startsWith("firebasestorage.googleapis.com/") ||
    value.startsWith("storage.googleapis.com/")
  ) {
    return `https://${value}`;
  }

  if (value.startsWith("gs://")) {
    return null;
  }

  try {
    return new URL(value, apiBaseUrl).toString();
  } catch {
    return value.startsWith("/") ? value : `/${value}`;
  }
}

function buildAvatarCandidates(user) {
  const seen = new Set();
  const candidates = [];

  function addCandidate(value) {
    const normalized = normalizeAvatarSource(value);
    if (!normalized || seen.has(normalized)) {
      return;
    }

    seen.add(normalized);
    candidates.push(normalized);
  }

  addCandidate(user.profilePhotoUrl);
  addCandidate(user.profilePhoto?.url);
  addCandidate(user.profilePhoto);
  addCandidate(user.avatarUrl);
  addCandidate(user.avatar?.url);
  addCandidate(user.avatar);
  addCandidate(user.photoUrl);
  addCandidate(user.photo);
  addCandidate(user.avatarPath);
  addCandidate(user.picture);
  addCandidate(user.customerPhotoUrl);

  return candidates;
}

function AvatarImage({
  alt,
  className,
  fallbackClassName,
  fallbackText,
  src,
  srcCandidates = [],
}) {
  const [failed, setFailed] = useState(false);
  const [index, setIndex] = useState(0);

  const candidates = useMemo(() => {
    const list = [];
    for (const candidate of [src, ...srcCandidates]) {
      const normalized = normalizeAvatarSource(candidate);
      if (normalized && !list.includes(normalized)) {
        list.push(normalized);
      }
    }
    return list;
  }, [src, srcCandidates]);

  useEffect(() => {
    setFailed(false);
    setIndex(0);
  }, [candidates]);

  const currentSrc = candidates[index] ?? null;

  if (!currentSrc || failed) {
    return (
      <div className={fallbackClassName} aria-hidden="true">
        {fallbackText}
      </div>
    );
  }

  return (
    <img
      alt={alt}
      className={className}
      src={currentSrc}
      onError={() => {
        setIndex((current) => {
          const next = current + 1;
          if (next < candidates.length) {
            return next;
          }

          setFailed(true);
          return current;
        });
      }}
    />
  );
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

function matchesUser(user, query) {
  const value = query.trim().toLowerCase();
  if (!value) return true;

  const fields = [
    user.firstName,
    user.lastName,
    user.phoneNumber,
    user.attendance,
    user.rsvp,
    user.checkedInAt,
    user.registeredAt,
    user.createdAt,
    user.survey?.howDidYouKnow,
    user.survey?.referredBy,
    user.survey?.dietaryRestrictions,
    user.survey?.resident,
  ]
    .filter(Boolean)
    .map((entry) => String(entry).toLowerCase());

  return fields.some((entry) => entry.includes(value));
}

function isCheckedIn(user) {
  return Boolean(user?.checkedInAt);
}

function isGoing(user) {
  return String(user?.rsvp ?? user?.attendance ?? user?.status ?? "").trim().toLowerCase() === "going";
}

function getCheckInBadge(user) {
  if (isCheckedIn(user)) {
    return { label: "checked-in", className: "is-checked-in" };
  }

  if (isGoing(user)) {
    return { label: "to be checked in", className: "is-awaiting-checkin" };
  }

  return null;
}

function UserAvatar({ user, className, fallbackClassName }) {
  const avatarCandidates = useMemo(() => buildAvatarCandidates(user), [user]);
  const secondaryCandidates = useMemo(() => avatarCandidates.slice(1), [avatarCandidates]);

  return (
    <AvatarImage
      alt={`${user.firstName} ${user.lastName}`}
      className={className}
      fallbackClassName={fallbackClassName}
      fallbackText={initialsFor(user)}
      src={avatarCandidates[0] ?? null}
      srcCandidates={secondaryCandidates}
    />
  );
}

function NewDetailCard({ user }) {
  const avatarCandidates = useMemo(() => buildAvatarCandidates(user), [user]);

  return (
    <article className="new-detail-card">
      <div className="new-detail-hero">
        <AvatarImage
          alt={`${user.firstName} ${user.lastName}`}
          className="new-detail-photo"
          fallbackClassName="new-detail-fallback"
          fallbackText={initialsFor(user)}
          srcCandidates={avatarCandidates}
        />
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

function ExpandableUserCard({ user, isOpen, onToggle, showCheckInBadge = false }) {
  const checkInBadge = showCheckInBadge ? getCheckInBadge(user) : null;

  return (
    <article className={`new-card ${isOpen ? "is-open" : ""}`}>
      <button
        className="new-list-item new-card-header"
        type="button"
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        <div className="new-list-avatar">
          <UserAvatar
            className="new-list-photo"
            fallbackClassName="new-list-fallback"
            user={user}
          />
        </div>

        <div className="new-list-copy">
          <div className="new-list-title-row">
            <strong className="new-list-name">
              {user.firstName} {user.lastName}
            </strong>
            {checkInBadge ? (
              <span className={`status-chip roster-chip ${checkInBadge.className}`}>
                {checkInBadge.label}
              </span>
            ) : null}
          </div>
          <span className="new-list-meta">{user.phoneNumber || "Unavailable"}</span>
        </div>

        <span className="new-list-arrow" aria-hidden="true">
          {isOpen ? "−" : "→"}
        </span>
      </button>

      <div className="new-card-body" aria-hidden={!isOpen}>
        <div className="new-card-body-inner">
          <NewDetailCard user={user} />
        </div>
      </div>
    </article>
  );
}

function NewListView({ title, users }) {
  const hasUsers = users.length > 0;
  const [selectedId, setSelectedId] = useState("");

  return (
    <main className="page-root detail-page new-page">
      <section className="screen-shell new-shell">
        <header className="new-topbar">
          <div className="screen-heading new-heading">
            <h1 className="screen-title">{title}</h1>
          </div>
          <p className="new-summary">{hasUsers ? `${users.length} guests` : "No guests yet"}</p>
        </header>

        {hasUsers ? (
          <div className="new-layout">
            <section className="new-list-card" aria-label="New guest list">
              <div className="new-list">
                {users.map((user) => {
                  const isActive = selectedId === user.id;

                  return (
                    <ExpandableUserCard
                      isOpen={isActive}
                      key={user.id}
                      onToggle={() =>
                        setSelectedId((current) => (current === user.id ? "" : user.id))
                      }
                      user={user}
                    />
                  );
                })}
              </div>
            </section>
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

function AllListView({ title, users }) {
  const hasUsers = users.length > 0;
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");

  const visibleUsers = useMemo(
    () => users.filter((user) => matchesUser(user, query)),
    [query, users],
  );

  const hasResults = visibleUsers.length > 0;

  return (
    <main className="page-root detail-page all-page">
      <section className="screen-shell all-shell">
        <header className="new-topbar all-topbar">
          <div className="screen-heading new-heading all-heading">
            <h1 className="screen-title">{title}</h1>
          </div>
          <div className="all-toolbar">
            <p className="all-count">{hasUsers ? `${visibleUsers.length} guests` : "No guests yet"}</p>

            <label className="all-search-field">
              <span>Search guests</span>
              <input
                className="field-input all-search-input"
                placeholder="Search name, phone, or survey"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
          </div>
        </header>

        {hasResults ? (
          <div className="new-layout">
            <section className="new-list-card" aria-label="All guest list">
              <div className="new-list">
                {visibleUsers.map((user) => {
                  return (
                    <ExpandableUserCard
                      isOpen={selectedId === user.id}
                      key={user.id}
                      onToggle={() =>
                        setSelectedId((current) => (current === user.id ? "" : user.id))
                      }
                      showCheckInBadge
                      user={user}
                    />
                  );
                })}
              </div>
            </section>
          </div>
        ) : (
          <div className="roster-empty new-empty">
            <strong>{hasUsers ? "No guests matched your search." : "No guests yet."}</strong>
            <p>
              {hasUsers
                ? "Try a different name, phone number, or survey keyword."
                : "The list will populate as soon as the backend returns registrations."}
            </p>
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

  return <AllListView title={title} users={users} />;
}
