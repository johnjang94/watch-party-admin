"use client";

import { useEffect, useState } from "react";
import { UserListPage } from "../../components/user-list-page";
import { fetchAdminUsers } from "../../lib/admin-api";

export default function NewPage() {
  const [users, setUsers] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      const nextUsers = await fetchAdminUsers({ days: 1 });
      if (!cancelled) {
        setUsers(nextUsers);
      }
    }

    void loadUsers();

    return () => {
      cancelled = true;
    };
  }, []);

  return <UserListPage isLoading={users === null} title="new" users={users ?? []} variant="new" />;
}
