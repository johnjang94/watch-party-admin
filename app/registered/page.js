"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { UserListPage } from "../../components/user-list-page";
import { fetchAdminUsers } from "../../lib/admin-api";

function isRegisteredUser(user) {
  return String(user?.status ?? "").trim().toLowerCase() === "confirmed";
}

function isPrivacyPendingUser(user) {
  return !Boolean(user?.privacyPolicyAccepted ?? user?.privacyAccepted);
}

function RegisteredPageContent() {
  const [users, setUsers] = useState(null);
  const searchParams = useSearchParams();
  const view = searchParams?.get("view") === "privacy-pending" ? "privacy-pending" : "all";

  useEffect(() => {
    let cancelled = false;

    async function loadInitialUsers() {
      const nextUsers = await fetchAdminUsers();
      if (!cancelled) {
        setUsers(nextUsers);
      }
    }

    void loadInitialUsers();

    return () => {
      cancelled = true;
    };
  }, []);

  const registeredUsers = useMemo(() => {
    return (users ?? []).filter(isRegisteredUser);
  }, [users]);

  const privacyPendingUsers = useMemo(() => {
    return registeredUsers.filter(isPrivacyPendingUser);
  }, [registeredUsers]);

  const visibleUsers = view === "privacy-pending" ? privacyPendingUsers : registeredUsers;

  return (
    <div className="registered-page-wrap">
      <div className="registered-filter-row">
        <Link className={`status-chip registered-filter-chip ${view === "all" ? "is-active" : ""}`} href="/registered">
          all registered
        </Link>
        <Link
          className={`status-chip registered-filter-chip ${view === "privacy-pending" ? "is-active" : ""}`}
          href="/registered?view=privacy-pending"
        >
          needs consent
        </Link>
      </div>

      <UserListPage
        isLoading={users === null}
        headerBadge={view === "privacy-pending" ? "CONSENT NEEDED" : ""}
        listLabel="Registered guest list"
        noMatchesBody={
          view === "privacy-pending"
            ? "All registered guests have accepted the privacy policy."
            : "Try another search."
        }
        noMatchesTitle="No matches."
        title="registered"
        users={visibleUsers}
      />
    </div>
  );
}

export default function RegisteredPage() {
  return (
    <Suspense fallback={<div className="registered-page-wrap" />}>
      <RegisteredPageContent />
    </Suspense>
  );
}
