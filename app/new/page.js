import { UserListPage } from "../../components/user-list-page";
import { fetchAdminUsers } from "../../lib/admin-api";

export default async function NewPage() {
  const users = await fetchAdminUsers({ days: 1 });
  return <UserListPage title="new" users={users} variant="new" />;
}
