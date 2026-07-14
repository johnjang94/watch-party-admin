const apiBaseUrl = process.env.NEXT_PUBLIC_CONTROL_URL ?? "https://fifa-control.onrender.com";
const adminSessionStorageKey = "watch-party-admin-session";

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

export async function requestAdminOtp({ phoneNumber }) {
  const data = await getJson("/api/admin/auth/otp/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phoneNumber }),
  });
  return data ?? null;
}

export async function verifyAdminOtp({ phoneNumber, code }) {
  const data = await getJson("/api/admin/auth/otp/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phoneNumber, code }),
  });
  return data.session ?? null;
}

export async function fetchAdminUsers({ days } = {}) {
  const suffix = Number.isFinite(days) ? `?days=${days}` : "";
  const adminSessionId = getStoredAdminSessionId();
  try {
    const data = await getJson(`/api/admin/users${suffix}`, {
      headers: adminSessionId ? { "x-admin-session-id": adminSessionId } : {},
    });
    return data.users ?? [];
  } catch {
    return [];
  }
}

export async function fetchAdminUserByToken(token) {
  const safeToken = String(token ?? "").trim();
  if (!safeToken) {
    return null;
  }

  const data = await getJson(`/api/admin/users?token=${encodeURIComponent(safeToken)}`);
  return data.user ?? null;
}

export async function markAdminUserCheckedIn(identifier) {
  const safeIdentifier = String(identifier ?? "").trim();
  if (!safeIdentifier) {
    return null;
  }

  const barcode = /^\d{5}$/.test(safeIdentifier) ? safeIdentifier : "";

  const adminSessionId = getStoredAdminSessionId();

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
}

export async function resendWelcomeSms(identifier) {
  const safeIdentifier = String(identifier ?? "").trim();
  if (!safeIdentifier) {
    return null;
  }

  const adminSessionId = getStoredAdminSessionId();

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
}

export async function fetchAdminInquiries() {
  const adminSessionId = getStoredAdminSessionId();
  try {
    const data = await getJson("/api/admin/inquiries", {
      headers: adminSessionId ? { "x-admin-session-id": adminSessionId } : {},
    });
    return data.inquiries ?? [];
  } catch {
    return [];
  }
}

export async function fetchInviteSettings() {
  const adminSessionId = getStoredAdminSessionId();
  return getAuthedJson("/api/settings", adminSessionId);
}

export async function fetchInviteOverview() {
  const adminSessionId = getStoredAdminSessionId();
  return getAuthedJson("/api/invites", adminSessionId);
}

export async function updateInviteCapacity(capacity) {
  const adminSessionId = getStoredAdminSessionId();
  return getAuthedJson("/api/settings", adminSessionId, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ capacity }),
  });
}

async function uploadInvitePhoto(path, file) {
  const adminSessionId = getStoredAdminSessionId();
  const formData = new FormData();
  formData.append("photo", file);

  return getAuthedJson(path, adminSessionId, {
    method: "POST",
    body: formData,
  });
}

export async function updateInviteProfilePhoto(file) {
  return uploadInvitePhoto("/api/settings/profile-photo", file);
}

export async function updateInviteBannerPhoto(file) {
  return uploadInvitePhoto("/api/settings/banner-photo", file);
}

export async function backfillInquiryAgentNames() {
  const adminSessionId = getStoredAdminSessionId();

  const data = await getJson("/api/admin/maintenance/backfill-inquiry-agent-names", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(adminSessionId ? { "x-admin-session-id": adminSessionId } : {}),
    },
    body: JSON.stringify({}),
  });

  return data ?? null;
}
