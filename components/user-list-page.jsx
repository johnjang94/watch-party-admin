import Image from "next/image";
import Link from "next/link";

export function UserListPage({ title, subtitle, users }) {
  return (
    <main className="page-root list-page">
      <section className="list-shell">
        <header className="dashboard-header">
          <p className="eyebrow">{title}</p>
          <h1 className="dashboard-title">{subtitle}</h1>
        </header>

        <div className="user-list">
          {users.map((user) => (
            <article className="user-card" key={user.id}>
              <Image alt={`${user.firstName} ${user.lastName}`} className="user-avatar" src={user.avatar} width={72} height={72} />
              <div className="user-info">
                <strong>
                  {user.firstName} {user.lastName}
                </strong>
                <span>{user.phoneNumber}</span>
                <span>{user.attendance}</span>
                <span>Entered: {user.enteredAt}</span>
                <span>Registered: {user.registeredAt}</span>
              </div>
            </article>
          ))}
        </div>

        <Link className="back-link" href="/dashboard">
          Back to dashboard
        </Link>
      </section>
    </main>
  );
}
