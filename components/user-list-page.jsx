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

function resolveAvatar(user) {
  const candidates = [
    user.profilePhotoUrl,
    user.profilePhoto,
    user.avatarUrl,
    user.profilePhoto,
    user.avatar,
    user.photoUrl,
    user.photo,
    user.avatarPath,
    user.picture,
    user.customerPhotoUrl,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeAvatarSource(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return null;
}

function AvatarImage({ alt, className, fallbackClassName, fallbackText, src }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div className={fallbackClassName} aria-hidden="true">
        {fallbackText}
      </div>
    );
  }

  return <img alt={alt} className={className} src={src} onError={() => setFailed(true)} />;
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

function UserAvatar({ user, className, fallbackClassName }) {
  const avatar = resolveAvatar(user);

  return (
    <AvatarImage
      alt={`${user.firstName} ${user.lastName}`}
      className={className}
      fallbackClassName={fallbackClassName}
      fallbackText={initialsFor(user)}
      src={avatar}
    />
  );
}

function NewDetailCard({ user }) {
  return (
    <article className="new-detail-card">
      <div className="new-detail-hero">
        <AvatarImage
          alt={`${user.firstName} ${user.lastName}`}
          className="new-detail-photo"
          fallbackClassName="new-detail-fallback"
          fallbackText={initialsFor(user)}
          src={resolveAvatar(user)}
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

function ExpandableUserCard({ user, isOpen, onToggle }) {
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
          <strong className="new-list-name">
            {user.firstName} {user.lastName}
          </strong>
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

  const resolvedSelectedId =
    visibleUsers.some((user) => user.id === selectedId) ? selectedId : visibleUsers[0]?.id ?? "";
  const selectedUser = visibleUsers.find((user) => user.id === resolvedSelectedId) ?? null;
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
                  const isActive = resolvedSelectedId === user.id;

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

            {selectedUser ? <NewDetailCard user={selectedUser} /> : null}
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
