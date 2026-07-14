"use client";

import { useEffect, useMemo, useState } from "react";
import { UserListPage } from "../../components/user-list-page";
import { fetchAdminUsers } from "../../lib/admin-api";

function isWaitlistedUser(user) {
  return String(user?.status ?? "").trim().toLowerCase() === "waitlist";
}

export default function WaitlistedPage() {
  const [users, setUsers] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      const nextUsers = await fetchAdminUsers();
      if (!cancelled) {
        setUsers(nextUsers);
      }
    }

    void loadUsers();

    return () => {
      cancelled = true;
    };
  }, []);

  const waitlistedUsers = useMemo(() => {
    return (users ?? []).filter(isWaitlistedUser);
  }, [users]);

  return (
    <UserListPage
      isLoading={users === null}
      emptyBody="Waiting for the waitlist to fill."
      emptyTitle="No waitlisted guests yet."
      listLabel="Waitlisted guest list"
      headerBadge="WAITLIST"
      tone="waitlist"
      showCheckInBadge={false}
      noMatchesBody="Try another search."
      noMatchesTitle="No matches."
      title="waitlisted"
      users={waitlistedUsers}
    />
  );
}
