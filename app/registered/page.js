"use client";

import { useEffect, useState } from "react";
import { UserListPage } from "../../components/user-list-page";
import { fetchAdminUsers } from "../../lib/admin-api";

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

  return <UserListPage isLoading={users === null} title="registered" users={users ?? []} />;
}
