import {
  demoAdminSession,
  sampleAllUsers,
  sampleInquiries,
  sampleNewUsers,
} from "./sample-data";

const apiBaseUrl = process.env.NEXT_PUBLIC_CONTROL_URL ?? "https://fifa-control.onrender.com";
const adminKeyStorageKey = "fifa-admin-access-key";
const adminSessionStorageKey = "watch-party-admin-session";

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

async function getAuthedJson(path, adminKey, init) {
  return getJson(path, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      "x-admin-key": adminKey,
    },
  });
}

function getStoredAdminKey() {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    return window.localStorage.getItem(adminKeyStorageKey) ?? "";
  } catch {
    return "";
  }
}

export { getStoredAdminKey };

function getStoredAdminSession() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(adminSessionStorageKey);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getStoredAdminSessionId() {
  return String(getStoredAdminSession()?.id ?? "").trim();
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
      sampleAllUsers.find(
        (user) =>
          user.id === safeToken ||
          user.qrToken === safeToken ||
          String(user.barcode ?? "") === safeToken,
      ) ?? null
    );
  }
}

export async function markAdminUserCheckedIn(identifier) {
  const safeIdentifier = String(identifier ?? "").trim();
  if (!safeIdentifier) {
    return null;
  }

  const barcode = /^\d{5}$/.test(safeIdentifier) ? safeIdentifier : "";

  const adminKey = getStoredAdminKey();

  try {
    const data = await getJson("/api/admin/users", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(adminKey ? { "x-admin-key": adminKey } : {}),
      },
      body: JSON.stringify({
        inviteToken: safeIdentifier,
        ...(barcode ? { barcode } : {}),
      }),
    });

    return data.user ?? null;
  } catch (error) {
    if (!isNetworkFallback(error)) {
      throw error;
    }

    const matched = sampleAllUsers.find(
      (user) =>
        user.id === safeIdentifier ||
        user.qrToken === safeIdentifier ||
        String(user.barcode ?? "") === safeIdentifier,
    );

    if (!matched) {
      return null;
    }

    if (!matched.checkedInAt) {
      matched.checkedInAt = new Date().toISOString();
    }

    return {
      ...matched,
      checkedInAt: matched.checkedInAt,
    };
  }
}

export async function resendWelcomeSms(identifier, adminKeyOverride = "") {
  const safeIdentifier = String(identifier ?? "").trim();
  if (!safeIdentifier) {
    return null;
  }

  const adminKey = String(adminKeyOverride ?? "").trim() || getStoredAdminKey();
  const adminSessionId = getStoredAdminSessionId();

  try {
    const data = await getJson("/api/admin/users/resend-welcome", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(adminSessionId ? { "x-admin-session-id": adminSessionId } : {}),
        ...(adminKey ? { "x-admin-key": adminKey } : {}),
      },
      body: JSON.stringify({
        inviteToken: safeIdentifier,
      }),
    });

    return data.user ?? null;
  } catch (error) {
    if (!isNetworkFallback(error)) {
      throw error;
    }

    const matched = sampleAllUsers.find(
      (user) =>
        user.id === safeIdentifier ||
        user.qrToken === safeIdentifier ||
        String(user.barcode ?? "") === safeIdentifier,
    );

    if (!matched) {
      return null;
    }

    const wasResent = Boolean(matched.welcomeSmsSentAt);
    matched.welcomeSmsResentAt = new Date().toISOString();
    matched.welcomeSmsDeliveryStatus = "sent";
    matched.welcomeSmsErrorMessage = null;
    matched.welcomeSmsMessage = null;

    return {
      ...matched,
      wasResent,
      welcomeSmsResentAt: matched.welcomeSmsResentAt,
    };
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

export async function fetchInviteSettings(adminKey) {
  try {
    return await getAuthedJson("/api/settings", adminKey);
  } catch (error) {
    if (!isNetworkFallback(error)) {
      throw error;
    }

    return {
      ok: true,
      capacity: null,
      updatedAt: null,
    };
  }
}

export async function updateInviteCapacity(adminKey, capacity) {
  try {
    return await getAuthedJson("/api/settings", adminKey, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ capacity }),
    });
  } catch (error) {
    if (!isNetworkFallback(error)) {
      throw error;
    }

    return {
      ok: true,
      capacity: capacity === null ? null : Number(capacity),
      updatedAt: new Date().toISOString(),
    };
  }
}

export async function backfillInquiryAgentNames(adminKeyOverride = "") {
  const adminKey = String(adminKeyOverride ?? "").trim() || getStoredAdminKey();
  const adminSessionId = getStoredAdminSessionId();

  try {
    const data = await getJson("/api/admin/maintenance/backfill-inquiry-agent-names", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(adminSessionId ? { "x-admin-session-id": adminSessionId } : {}),
        ...(adminKey ? { "x-admin-key": adminKey } : {}),
      },
      body: JSON.stringify({}),
    });

    return data ?? null;
  } catch (error) {
    if (!isNetworkFallback(error)) {
      throw error;
    }

    return null;
  }
}
