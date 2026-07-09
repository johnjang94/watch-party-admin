import Image from "next/image";
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
  return user.avatar ?? user.profilePhotoUrl ?? null;
}

function initialsFor(user) {
  return `${String(user.firstName ?? "").charAt(0)}${String(user.lastName ?? "").charAt(0)}`.trim() || "U";
}

export function UserListPage({ title, subtitle, users }) {
  return (
    <main className="page-root detail-page">
      <section className="screen-shell list-shell">
        <header className="screen-topbar">
          <Link className="back-link" href="/dashboard">
            dashboard
          </Link>
          <div className="screen-heading">
            <p className="eyebrow">{title}</p>
            <h1 className="screen-title">{subtitle}</h1>
          </div>
        </header>

        <div className="user-list">
          {users.map((user) => (
            <article className="user-card" key={user.id}>
              <div className="user-avatar-frame">
                {resolveAvatar(user) ? (
                  <Image
                    alt={`${user.firstName} ${user.lastName}`}
                    className="user-avatar"
                    src={resolveAvatar(user)}
                    width={96}
                    height={96}
                  />
                ) : (
                  <div className="user-avatar-fallback" aria-hidden="true">
                    {initialsFor(user)}
                  </div>
                )}
              </div>

              <div className="user-body">
                <div className="user-title-row">
                  <strong className="user-name">
                    {user.firstName} {user.lastName}
                  </strong>
                  <span className="status-chip">{user.attendance || "attendance"}</span>
                </div>

                <dl className="user-meta">
                  <div>
                    <dt>Phone</dt>
                    <dd>{user.phoneNumber}</dd>
                  </div>
                  <div>
                    <dt>Device tracked</dt>
                    <dd>{formatValue(user.enteredAt ?? user.deviceTrackedAt)}</dd>
                  </div>
                  <div>
                    <dt>Registered</dt>
                    <dd>{formatValue(user.registeredAt ?? user.createdAt)}</dd>
                  </div>
                </dl>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
