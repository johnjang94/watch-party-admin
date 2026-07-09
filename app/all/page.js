import { UserListPage } from "../../components/user-list-page";
import { fetchAdminUsers } from "../../lib/admin-api";

export default async function AllPage() {
  const users = await fetchAdminUsers();
  return <UserListPage title="all" subtitle="Full registration history" users={users} />;
}
