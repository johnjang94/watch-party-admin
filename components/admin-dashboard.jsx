"use client";

import { useEffect, useState } from "react";
import { useCallback } from "react";
import { getStoredAdminSessionId } from "../lib/admin-api";

const controlBaseUrl =
  process.env.NEXT_PUBLIC_CONTROL_URL ?? "https://fifa-control.onrender.com";

export function AdminDashboard() {
  const [initialStoredSessionId] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return getStoredAdminSessionId();
  });
  const [adminSessionId] = useState(() => initialStoredSessionId);
  const [savedSessionId, setSavedSessionId] = useState(() => initialStoredSessionId);
  const [invites, setInvites] = useState([]);
  const [activities, setActivities] = useState([]);
  const [activitySessionFilter, setActivitySessionFilter] = useState("all");
  const [capacity, setCapacity] = useState("");
  const [inviteCount, setInviteCount] = useState(0);
  const [isFull, setIsFull] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [capacityUpdatedAt, setCapacityUpdatedAt] = useState("");
  const [capacitySaving, setCapacitySaving] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadDashboard = useCallback(async (sessionId) => {
    setLoading(true);
    setError("");

    try {
      const [invitesResponse, settingsResponse, activityResponse] =
        await Promise.all([
        fetch(`${controlBaseUrl}/api/invites`, {
          headers: sessionId ? { "x-admin-session-id": sessionId } : {},
        }),
        fetch(`${controlBaseUrl}/api/settings`, {
          headers: sessionId ? { "x-admin-session-id": sessionId } : {},
        }),
        fetch(`${controlBaseUrl}/api/activity`, {
          headers: sessionId ? { "x-admin-session-id": sessionId } : {},
        }),
      ]);

      const inviteData = await invitesResponse.json();
      const settingsData = await settingsResponse.json();
      const activityData = await activityResponse.json();

      if (!invitesResponse.ok || !inviteData.ok) {
        throw new Error(inviteData.error ?? "Unable to load invites.");
      }

      if (!settingsResponse.ok || !settingsData.ok) {
        throw new Error(settingsData.error ?? "Unable to load settings.");
      }

      if (!activityResponse.ok || !activityData.ok) {
        throw new Error(activityData.error ?? "Unable to load activity.");
      }

      setInvites(inviteData.invites ?? []);
      setActivities(activityData.activities ?? []);
      setInviteCount(inviteData.inviteCount ?? 0);
      setIsFull(Boolean(inviteData.isFull));
      setCapacity(
        inviteData.capacity === null || inviteData.capacity === undefined
          ? ""
          : String(inviteData.capacity),
      );
      setCapacityUpdatedAt(settingsData.updatedAt ?? "");
      setSettingsLoaded(true);
      setSavedSessionId(sessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load invites.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialStoredSessionId) {
      const timer = window.setTimeout(() => {
        void loadDashboard(initialStoredSessionId);
      }, 0);

      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [initialStoredSessionId, loadDashboard]);

  async function saveCapacity() {
    setCapacitySaving(true);
    setError("");

    try {
      const response = await fetch(`${controlBaseUrl}/api/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(adminSessionId ? { "x-admin-session-id": adminSessionId } : {}),
        },
        body: JSON.stringify({
          capacity: capacity === "" ? null : Number(capacity),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Unable to update capacity.");
      }

      await loadDashboard(adminSessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update capacity.");
    } finally {
      setCapacitySaving(false);
    }
  }

  const activitySessions = Array.from(
    new Map(
      activities
        .filter((activity) => activity.sessionId)
        .map((activity) => [activity.sessionId, activity]),
    ).values(),
  );

  const visibleActivities =
    activitySessionFilter === "all"
      ? activities
      : activities.filter(
          (activity) => activity.sessionId === activitySessionFilter,
        );

  function formatActivitySummary(activity) {
    const identity = activity.phoneNumber ?? activity.inviteToken ?? "guest";
    const details = [identity, activity.pathname].filter(Boolean);

    return details.join(" · ");
  }

  function groupActivitiesBySession(items) {
    return items.reduce((groups, activity) => {
      const key = activity.sessionId ?? "no-session";
      const current = groups.get(key) ?? [];
      current.push(activity);
      groups.set(key, current);
      return groups;
    }, new Map());
  }

  const groupedActivities = groupActivitiesBySession(visibleActivities);

  return (
    <main className="admin-shell">
      <section className="admin-hero">
        <div className="hero-copy">
          <p className="eyebrow">control room</p>
          <h1>Invite dashboard</h1>

          <div className="stat-row">
            <div>
              <strong>Records</strong>
              <span>{inviteCount} loaded</span>
            </div>
            <div>
              <strong>Capacity</strong>
              <span>
                {settingsLoaded && capacity !== "" ? capacity : "unlimited"}
              </span>
            </div>
            <div>
              <strong>Status</strong>
              <span>{isFull ? "waitlist active" : "open"}</span>
            </div>
            <div>
              <strong>Access</strong>
              <span>{savedSessionId ? "connected" : "waiting"}</span>
            </div>
          </div>
        </div>

        <div className="admin-sidebar">
          <div className="admin-key-card">
            <label className="admin-field">
              <span className="sr-only">Admin session id</span>
              <input
                readOnly
                placeholder="Session connected"
                value={adminSessionId}
              />
            </label>

            <button
              className="submit-button"
              onClick={() => void loadDashboard(adminSessionId)}
              type="button"
            >
              {loading ? "Loading..." : "Load"}
            </button>
          </div>

          <div className="admin-key-card">
            <label className="admin-field">
              <span className="sr-only">Invite capacity</span>
              <input
                inputMode="numeric"
                onChange={(event) => setCapacity(event.target.value)}
                placeholder="Capacity"
                value={capacity}
              />
            </label>

            <button
              className="submit-button"
              onClick={() => void saveCapacity()}
              type="button"
            >
              {capacitySaving ? "Saving..." : "Save"}
            </button>

            <p className="status-copy">
              {capacityUpdatedAt
                ? new Date(capacityUpdatedAt).toLocaleString()
                : "Not set yet"}
            </p>
          </div>
        </div>
      </section>

      {error ? <p className="error-banner">{error}</p> : null}

      <section className="admin-list">
        {invites.length ? (
          invites.map((invite) => (
            <article className="invite-row" key={invite.id}>
              <div>
                <strong>
                  {invite.firstName} {invite.lastName}
                </strong>
                <span>{invite.phoneNumber}</span>
                <span className="status-chip is-muted invite-rsvp-chip">
                  RSVP: {invite.rsvp || "Going"}
                </span>
              </div>
              <time dateTime={invite.createdAt}>
                {new Date(invite.createdAt).toLocaleString()}
              </time>
            </article>
          ))
        ) : (
          <div className="empty-state">
            <strong>No invite requests yet.</strong>
            <p>When guests submit the form, they will appear here.</p>
          </div>
        )}
      </section>

      <section className="admin-list">
        <div className="activity-toolbar">
          <label>
            <span>Session filter</span>
            <select
              onChange={(event) => setActivitySessionFilter(event.target.value)}
              value={activitySessionFilter}
            >
              <option value="all">All sessions</option>
              {activitySessions.map((activity) => (
                <option key={activity.sessionId} value={activity.sessionId}>
                  {activity.phoneNumber ?? activity.inviteToken ?? activity.sessionId}
                </option>
              ))}
            </select>
          </label>
        </div>

        {visibleActivities.length ? (
          Array.from(groupedActivities.entries()).map(([sessionId, sessionActivities]) => (
            <article className="activity-session" key={sessionId}>
              <header className="activity-session-header">
                <div>
                  <strong>
                    {sessionId === "no-session" ? "Events without session" : `Session ${sessionId}`}
                  </strong>
                  <span>{sessionActivities.length} events</span>
                </div>
              </header>

              <div className="activity-session-list">
                {sessionActivities.map((activity) => (
                  <div className="invite-row" key={activity.id}>
                    <div>
                      <strong>{activity.eventType}</strong>
                      <span>{formatActivitySummary(activity)}</span>
                    </div>
                    <time dateTime={activity.createdAt}>
                      {new Date(activity.createdAt).toLocaleString()}
                    </time>
                  </div>
                ))}
              </div>
            </article>
          ))
        ) : (
          <div className="empty-state">
            <strong>No activity logs yet.</strong>
            <p>Login, portal visits, and logout events will appear here.</p>
          </div>
        )}
      </section>
    </main>
  );
}
