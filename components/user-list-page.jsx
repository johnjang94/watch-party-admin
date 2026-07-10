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

export function UserListPage({ title, users }) {
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
