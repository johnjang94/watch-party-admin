import Link from "next/link";

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

function resolveAvatar(user) {
  if (typeof user.avatar === "string") {
    return user.avatar;
  }

  if (typeof user.avatar?.src === "string") {
    return user.avatar.src;
  }

  return user.profilePhotoUrl ?? null;
}

function initialsFor(user) {
  return `${String(user.firstName ?? "").charAt(0)}${String(user.lastName ?? "").charAt(0)}`.trim() || "U";
}

export function UserListPage({ title, subtitle, users }) {
  const hasUsers = users.length > 0;

  return (
    <main className="page-root detail-page roster-page">
      <section className="screen-shell list-shell roster-shell">
        <header className="screen-topbar roster-topbar">
          <Link className="back-link roster-back" href="/dashboard">
            back
          </Link>
          <div className="screen-heading roster-heading">
            <p className="eyebrow">{title}</p>
            <h1 className="screen-title">{subtitle}</h1>
          </div>
        </header>

        <div className="roster-summary">
          <span>{users.length} guests</span>
          <span>{title === "new" ? "last 24 hours" : "all time"}</span>
        </div>

        {hasUsers ? (
          <div className="user-list roster-grid">
            {users.map((user) => (
              <article className="user-card roster-card" key={user.id}>
                <div className="user-avatar-frame roster-avatar-frame">
                  {resolveAvatar(user) ? (
                    <img
                      alt={`${user.firstName} ${user.lastName}`}
                      className="user-avatar"
                      src={resolveAvatar(user)}
                    />
                  ) : (
                    <div className="user-avatar-fallback" aria-hidden="true">
                      {initialsFor(user)}
                    </div>
                  )}
                </div>

                <div className="user-body roster-body">
                  <div className="user-title-row roster-title-row">
                    <strong className="user-name roster-name">
                      {user.firstName} {user.lastName}
                    </strong>
                    <span className="status-chip roster-chip">{user.attendance || "guest"}</span>
                  </div>

                  <dl className="user-meta roster-meta">
                    <div>
                      <dt>Phone</dt>
                      <dd>{user.phoneNumber}</dd>
                    </div>
                    <div>
                      <dt>Registered</dt>
                      <dd>{formatValue(user.registeredAt ?? user.createdAt)}</dd>
                    </div>
                    <div>
                      <dt>Check-in</dt>
                      <dd>{formatValue(user.enteredAt ?? user.deviceTrackedAt)}</dd>
                    </div>
                  </dl>
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
