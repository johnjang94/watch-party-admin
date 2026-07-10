import {
  demoAdminSession,
  sampleAllUsers,
  sampleInquiries,
  sampleNewUsers,
} from "./sample-data";

const apiBaseUrl = process.env.NEXT_PUBLIC_CONTROL_URL ?? "https://fifa-control.onrender.com";

function isNetworkFallback(error) {
  return (
    error instanceof TypeError ||
    (error instanceof Error &&
      /fetch failed|network|ECONNREFUSED|ENOTFOUND/i.test(error.message))
  );
}

async function getJson(path, init) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    cache: "no-store",
    ...init,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) {
    throw new Error(data.error ?? "Request failed.");
  }
  return data;
}

function filterUsers(days) {
  if (!Number.isFinite(days) || days <= 0) {
    return sampleAllUsers;
  }

  const lowerBound = Date.now() - days * 24 * 60 * 60 * 1000;
  return sampleAllUsers.filter((user) => new Date(user.createdAt).getTime() >= lowerBound);
}

function fallbackUsers(days) {
  if (Number.isFinite(days) && days === 1) {
    return sampleNewUsers;
  }

  return filterUsers(days);
}

export async function authenticateAdmin({ firstName, lastName, phoneNumber }) {
  try {
    const data = await getJson("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, phoneNumber }),
    });
    return data.session ?? demoAdminSession;
  } catch (error) {
    if (!isNetworkFallback(error)) {
      throw error;
    }

    return demoAdminSession;
  }
}

export async function fetchAdminUsers({ days } = {}) {
  const suffix = Number.isFinite(days) ? `?days=${days}` : "";

  try {
    const data = await getJson(`/api/admin/users${suffix}`);
    return data.users ?? [];
  } catch (error) {
    if (!isNetworkFallback(error)) {
      return fallbackUsers(days).map((user) => ({ ...user }));
    }

    return fallbackUsers(days).map((user) => ({ ...user }));
  }
}

export async function fetchAdminUserByToken(token) {
  const safeToken = String(token ?? "").trim();
  if (!safeToken) {
    return null;
  }

  try {
    const data = await getJson(`/api/admin/users?token=${encodeURIComponent(safeToken)}`);
    return data.user ?? null;
  } catch (error) {
    if (!isNetworkFallback(error)) {
      return null;
    }

    return (
      sampleAllUsers.find((user) => user.id === safeToken || user.qrToken === safeToken) ?? null
    );
  }
}

export async function fetchAdminInquiries() {
  try {
    const data = await getJson("/api/admin/inquiries");
    return data.inquiries ?? [];
  } catch (error) {
    if (!isNetworkFallback(error)) {
      throw error;
    }

    return sampleInquiries.map((inquiry) => ({
      ...inquiry,
      thread: inquiry.thread.map((line) => ({ ...line })),
    }));
  }
}
