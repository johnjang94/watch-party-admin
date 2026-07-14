"use client";

import { useEffect, useMemo, useState } from "react";
import { UserListPage } from "../../components/user-list-page";
import { fetchAdminUsers } from "../../lib/admin-api";

function isRegisteredUser(user) {
  return String(user?.status ?? "").trim().toLowerCase() === "confirmed";
}

export default function RegisteredPage() {
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

  const registeredUsers = useMemo(() => {
    return (users ?? []).filter(isRegisteredUser);
  }, [users]);

  return (
    <UserListPage
      isLoading={users === null}
      listLabel="Registered guest list"
      noMatchesBody="Try another search."
      noMatchesTitle="No matches."
      title="registered"
      users={registeredUsers}
    />
  );
}
