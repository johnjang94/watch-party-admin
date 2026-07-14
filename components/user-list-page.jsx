"use client";

import { useEffect, useMemo, useState } from "react";
import { acceptWaitlistedInvite, resendWelcomeSms } from "../lib/admin-api";

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

function getUserBarcode(user) {
  return String(user?.barcode ?? user?.qrToken ?? user?.inviteToken ?? user?.id ?? "").trim() || "Unavailable";
}

function getWelcomeSmsState(user) {
  return {
    deliveryStatus: String(user?.welcomeSmsDeliveryStatus ?? "").trim().toLowerCase(),
    resentAt: String(user?.welcomeSmsResentAt ?? "").trim(),
    sentAt: String(user?.welcomeSmsSentAt ?? "").trim(),
  };
}

function getPrivacyPolicyState(user) {
  const accepted = Boolean(user?.privacyPolicyAccepted ?? user?.privacyAccepted);
  const acceptedAt = String(
    user?.privacyPolicyAcceptedAt ?? user?.privacyAcceptedAt ?? user?.privacyConsentAt ?? "",
  ).trim();

  return {
    accepted,
    acceptedAt,
  };
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

function NewDetailCard({
  user,
  checkInBadge,
  primaryActionMode = "resend",
  onPrimaryActionComplete,
}) {
  const avatarCandidates = useMemo(() => buildAvatarCandidates(user), [user]);
  const [isResending, setIsResending] = useState(false);
  const [sendNotice, setSendNotice] = useState(null);
  const [welcomeSmsState, setWelcomeSmsState] = useState(() => getWelcomeSmsState(user));
  const privacyPolicyState = useMemo(() => getPrivacyPolicyState(user), [user]);

  useEffect(() => {
    setWelcomeSmsState(getWelcomeSmsState(user));
    setSendNotice(null);
  }, [user]);

  const latestWelcomeSmsTime = welcomeSmsState.resentAt || welcomeSmsState.sentAt;
  const latestWelcomeSmsLabel = latestWelcomeSmsTime ? formatValue(latestWelcomeSmsTime) : "";
  const latestWelcomeSmsSummary =
    welcomeSmsState.deliveryStatus === "sent"
      ? "Welcome SMS sent"
      : welcomeSmsState.deliveryStatus === "skipped"
        ? "Welcome SMS skipped"
        : welcomeSmsState.deliveryStatus === "failed"
          ? "Welcome SMS failed"
          : "";

  async function handleResendWelcome() {
    if (primaryActionMode !== "resend") {
      return;
    }

    if (isResending) {
      return;
    }

    setIsResending(true);
    setSendNotice(null);

    try {
      const result = await resendWelcomeSms(user.id);
      if (!result) {
        throw new Error("User not found.");
      }

      setWelcomeSmsState({
        deliveryStatus: String(result.welcomeSmsDeliveryStatus ?? "sent").trim().toLowerCase(),
        resentAt: String(result.welcomeSmsResentAt ?? "").trim(),
        sentAt: String(result.welcomeSmsSentAt ?? "").trim(),
      });
      setSendNotice({
        tone: "success",
        title: result.wasResent ? "Welcome SMS resent" : "Welcome SMS sent",
        subject: "Welcome SMS",
        detail: result.wasResent
          ? `Latest send: ${formatValue(result.welcomeSmsResentAt)}`
          : `Sent: ${formatValue(result.welcomeSmsSentAt || result.welcomeSmsResentAt)}`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to resend welcome text.";
      setSendNotice({
        tone: "error",
        title: /unauthorized/i.test(message) ? "Admin session required" : "Welcome SMS failed",
        subject: "Welcome SMS",
        detail: /unauthorized/i.test(message)
          ? "Log in to the admin dashboard first."
          : message,
      });
    } finally {
      setIsResending(false);
    }
  }

  async function handleAcceptToParty() {
    if (primaryActionMode !== "accept" || isResending) {
      return;
    }

    setIsResending(true);
    setSendNotice(null);

    try {
      const result = await acceptWaitlistedInvite(user.id);
      if (!result?.ok) {
        throw new Error(result?.error ?? "Unable to accept guest.");
      }

      setSendNotice({
        tone: "success",
        title: "Accepted to the party",
        subject: "Waitlist",
        detail:
          result.notificationDeliveryStatus === "sent"
            ? "Invitation text sent."
            : result.notificationDeliveryStatus === "skipped"
              ? "Invitation text skipped."
              : "Invitation text failed.",
      });

      onPrimaryActionComplete?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to accept guest.";
      setSendNotice({
        tone: "error",
        title: /unauthorized/i.test(message) ? "Admin session required" : "Acceptance failed",
        subject: "Waitlist",
        detail: /unauthorized/i.test(message)
          ? "Log in to the admin dashboard first."
          : message,
      });
    } finally {
      setIsResending(false);
    }
  }

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
          <div className="new-detail-chip-group">
            {checkInBadge ? (
              <span className={`status-chip new-detail-chip ${checkInBadge.className}`}>
                {checkInBadge.label}
              </span>
            ) : (
              <span className="status-chip is-muted new-detail-chip">Guest</span>
            )}
          </div>
        </div>

        <dl className="new-detail-meta">
          <div>
            <dt>Barcode</dt>
            <dd>{getUserBarcode(user)}</dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>{user.phoneNumber || "Unavailable"}</dd>
          </div>
          <div>
            <dt>Privacy</dt>
            <dd>
              {privacyPolicyState.accepted ? "Accepted" : "Not accepted"}
              {privacyPolicyState.acceptedAt ? ` · ${formatValue(privacyPolicyState.acceptedAt)}` : ""}
            </dd>
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

        <div className="new-detail-actions">
          {latestWelcomeSmsTime ? (
            <div className="new-detail-send-banner">
              <span className="new-detail-send-banner-label">
                {latestWelcomeSmsSummary || "Welcome SMS sent"}
              </span>
              <span className="new-detail-send-banner-subject">Welcome SMS</span>
              <span className="new-detail-send-banner-time">{latestWelcomeSmsLabel}</span>
            </div>
          ) : null}

          {sendNotice ? (
            <div className={`new-detail-send-banner is-${sendNotice.tone}`}>
              <span className="new-detail-send-banner-label">{sendNotice.title}</span>
              <span className="new-detail-send-banner-subject">{sendNotice.subject}</span>
              <span className="new-detail-send-banner-time">{sendNotice.detail}</span>
            </div>
          ) : null}

          {primaryActionMode === "accept" ? (
            <button
              className="secondary-button new-detail-action-button"
              disabled={isResending}
              type="button"
              onClick={handleAcceptToParty}
            >
              {isResending ? "Accepting..." : "accept to the party"}
            </button>
          ) : (
            <button
              className="secondary-button new-detail-action-button"
              disabled={isResending || !user.phoneNumber}
              type="button"
              onClick={handleResendWelcome}
            >
              {isResending ? "Resending..." : "Resend welcome SMS"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function ExpandableUserCard({
  user,
  isOpen,
  onToggle,
  showCheckInBadge = false,
  primaryActionMode = "resend",
  onPrimaryActionComplete,
}) {
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
              isOpen ? (
                <span
                  className={`status-chip roster-chip ${checkInBadge.className} is-inline`}
                >
                  {checkInBadge.label}
                </span>
              ) : (
                <span className={`status-dot ${checkInBadge.className}`} aria-hidden="true" />
              )
            ) : null}
          </div>
          {showCheckInBadge ? null : <span className="status-chip roster-chip is-waitlist">waitlist</span>}
          <span className="new-list-meta">Barcode {getUserBarcode(user)}</span>
        </div>

        <span className="new-list-arrow" aria-hidden="true">
          {isOpen ? "−" : "→"}
        </span>
      </button>

      <div className="new-card-body" aria-hidden={!isOpen}>
        <div className="new-card-body-inner">
          <NewDetailCard
            checkInBadge={checkInBadge}
            onPrimaryActionComplete={onPrimaryActionComplete}
            primaryActionMode={primaryActionMode}
            user={user}
          />
        </div>
      </div>
    </article>
  );
}

function LoadingView({ title, variant }) {
  return (
    <main className={`page-root detail-page ${variant === "new" ? "new-page" : "all-page"}`}>
      <section className={`screen-shell ${variant === "new" ? "new-shell" : "all-shell"}`}>
        <header className={`new-topbar ${variant === "new" ? "" : "all-topbar"}`.trim()}>
          <div className={`screen-heading new-heading ${variant === "new" ? "" : "all-heading"}`.trim()}>
            <h1 className="screen-title">{title}</h1>
          </div>
        </header>

        <div className="roster-empty new-empty" role="status" aria-live="polite">
          <strong>Loading...</strong>
          <p>Fetching guests from the database.</p>
        </div>
      </section>
    </main>
  );
}

function NewListView({
  title,
  users,
  isLoading = false,
  primaryActionMode = "resend",
  onPrimaryActionComplete,
}) {
  const hasUsers = users.length > 0;
  const [selectedId, setSelectedId] = useState("");

  if (isLoading) {
    return <LoadingView title={title} variant="new" />;
  }

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
            <section className="new-list-card" aria-label="Recent guest list">
              <div className="new-list">
                {users.map((user) => {
                  const isActive = selectedId === user.id;

                  return (
                    <ExpandableUserCard
                      isOpen={isActive}
                      key={user.id}
                      onPrimaryActionComplete={onPrimaryActionComplete}
                      onToggle={() =>
                        setSelectedId((current) => (current === user.id ? "" : user.id))
                      }
                      primaryActionMode={primaryActionMode}
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
            <p>Waiting on registrations.</p>
          </div>
        )}
      </section>
    </main>
  );
}

function AllListView({
  title,
  users,
  isLoading = false,
  showCheckInBadge = true,
  listLabel,
  emptyTitle,
  emptyBody,
  noMatchesTitle,
  noMatchesBody,
  tone = "default",
  headerBadge = "",
  primaryActionMode = "resend",
  onPrimaryActionComplete,
}) {
  const hasUsers = users.length > 0;
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");

  const visibleUsers = useMemo(
    () => users.filter((user) => matchesUser(user, query)),
    [query, users],
  );

  if (isLoading) {
    return <LoadingView title={title} variant="all" />;
  }

  const hasResults = visibleUsers.length > 0;
  const rootClassName = `page-root detail-page all-page ${tone === "waitlist" ? "waitlist-page" : ""}`;

  return (
    <main className={rootClassName}>
      <section className="screen-shell all-shell">
        <header className="new-topbar all-topbar">
          <div className="screen-heading new-heading all-heading">
            <h1 className="screen-title">
              {title}
              {headerBadge ? <span className="status-chip page-title-chip">{headerBadge}</span> : null}
            </h1>
          </div>
          <div className="all-toolbar">
            <p className="all-count">{hasUsers ? `${visibleUsers.length} guests` : "No guests yet"}</p>

            <label className="all-search-field">
              <span className="sr-only">Search guests</span>
              <input
                className="field-input all-search-input"
                placeholder="Search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
          </div>
        </header>

        {hasResults ? (
          <div className="new-layout">
            <section
              className={`new-list-card ${tone === "waitlist" ? "is-waitlist" : ""}`}
              aria-label={listLabel ?? `${title} guest list`}
            >
              <div className="new-list">
                {visibleUsers.map((user) => {
                  return (
                    <ExpandableUserCard
                      isOpen={selectedId === user.id}
                      key={user.id}
                      onPrimaryActionComplete={onPrimaryActionComplete}
                      onToggle={() =>
                        setSelectedId((current) => (current === user.id ? "" : user.id))
                      }
                      primaryActionMode={primaryActionMode}
                      showCheckInBadge={showCheckInBadge}
                      user={user}
                    />
                  );
                })}
              </div>
            </section>
          </div>
        ) : (
          <div className="roster-empty new-empty">
            <strong>
              {hasUsers ? noMatchesTitle ?? "No matches." : emptyTitle ?? "No guests yet."}
            </strong>
            <p>
              {hasUsers
                ? noMatchesBody ?? "Try another search."
                : emptyBody ?? "Waiting on registrations."}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

export function UserListPage({
  title,
  users,
  variant = "all",
  isLoading = false,
  showCheckInBadge = true,
  listLabel,
  emptyTitle,
  emptyBody,
  noMatchesTitle,
  noMatchesBody,
  tone = "default",
  headerBadge = "",
  primaryActionMode = "resend",
  onPrimaryActionComplete,
}) {
  if (variant === "new") {
    return (
      <NewListView
        isLoading={isLoading}
        onPrimaryActionComplete={onPrimaryActionComplete}
        primaryActionMode={primaryActionMode}
        title={title}
        users={users}
      />
    );
  }

  return (
    <AllListView
      isLoading={isLoading}
      emptyBody={emptyBody}
      emptyTitle={emptyTitle}
      noMatchesBody={noMatchesBody}
      noMatchesTitle={noMatchesTitle}
      headerBadge={headerBadge}
      listLabel={listLabel}
      onPrimaryActionComplete={onPrimaryActionComplete}
      primaryActionMode={primaryActionMode}
      tone={tone}
      showCheckInBadge={showCheckInBadge}
      title={title}
      users={users}
    />
  );
}
