const apiBaseUrl = process.env.NEXT_PUBLIC_CONTROL_URL ?? "http://127.0.0.1:3010";

async function getJson(path) {
  const response = await fetch(`${apiBaseUrl}${path}`, { cache: "no-store" });
  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(data.error ?? "Request failed.");
  }
  return data;
}

export async function fetchAdminUsers({ days } = {}) {
  const suffix = Number.isFinite(days) ? `?days=${days}` : "";
  const data = await getJson(`/api/admin/users${suffix}`);
  return data.users ?? [];
}

export async function fetchAdminInquiries() {
  const data = await getJson("/api/admin/inquiries");
  return data.inquiries ?? [];
}

