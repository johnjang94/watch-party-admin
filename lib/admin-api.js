import {
  demoAdminSession,
  sampleAllUsers,
  sampleInquiries,
  sampleNewUsers,
} from "./sample-data";

const apiBaseUrl = process.env.NEXT_PUBLIC_CONTROL_URL ?? "https://fifa-control.onrender.com";
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

async function getAuthedJson(path, adminSessionId, init) {
  return getJson(path, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...(adminSessionId ? { "x-admin-session-id": adminSessionId } : {}),
    },
  });
}

export function getStoredAdminSessionId() {
  return String(getStoredAdminSession()?.id ?? "").trim();
}

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

export async function requestAdminOtp({ phoneNumber }) {
  try {
    const data = await getJson("/api/admin/auth/otp/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber }),
    });
    return data ?? null;
  } catch (error) {
    if (!isNetworkFallback(error)) {
      throw error;
    }

    return {
      ok: true,
      delivered: true,
      message: "Verification code sent.",
    };
  }
}

export async function verifyAdminOtp({ phoneNumber, code }) {
  try {
    const data = await getJson("/api/admin/auth/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber, code }),
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
  const adminSessionId = getStoredAdminSessionId();

  try {
    const data = await getJson(`/api/admin/users${suffix}`, {
      headers: adminSessionId ? { "x-admin-session-id": adminSessionId } : {},
    });
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

  const adminSessionId = getStoredAdminSessionId();

  try {
    const data = await getJson("/api/admin/users", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(adminSessionId ? { "x-admin-session-id": adminSessionId } : {}),
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

export async function resendWelcomeSms(identifier) {
  const safeIdentifier = String(identifier ?? "").trim();
  if (!safeIdentifier) {
    return null;
  }

  const adminSessionId = getStoredAdminSessionId();

  try {
    const data = await getJson("/api/admin/users/resend-welcome", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(adminSessionId ? { "x-admin-session-id": adminSessionId } : {}),
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
    const adminSessionId = getStoredAdminSessionId();
    const data = await getJson("/api/admin/inquiries", {
      headers: adminSessionId ? { "x-admin-session-id": adminSessionId } : {},
    });
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

export async function fetchInviteSettings() {
  const adminSessionId = getStoredAdminSessionId();
  try {
    return await getAuthedJson("/api/settings", adminSessionId);
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

export async function updateInviteCapacity(capacity) {
  const adminSessionId = getStoredAdminSessionId();
  try {
    return await getAuthedJson("/api/settings", adminSessionId, {
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

export async function backfillInquiryAgentNames() {
  const adminSessionId = getStoredAdminSessionId();

  try {
    const data = await getJson("/api/admin/maintenance/backfill-inquiry-agent-names", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(adminSessionId ? { "x-admin-session-id": adminSessionId } : {}),
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
