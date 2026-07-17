"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  acceptWaitlistedInvite,
  createAdminUser,
  fetchAdminUsers,
  getStoredAdminRole,
} from "../../lib/admin-api";

function isWaitlistedUser(user) {
  return String(user?.status ?? "").trim().toLowerCase() === "waitlist";
}

function matchesUser(user, query) {
  const value = query.trim().toLowerCase();
  if (!value) return true;

  return [
    user.firstName,
    user.lastName,
    user.phoneNumber,
    user.barcode,
    user.id,
    user.createdAt,
  ]
    .filter(Boolean)
    .map((entry) => String(entry).toLowerCase())
    .some((entry) => entry.includes(value));
}

function WaitlistedRow({ user, onAccept, isAccepting, canAcceptGuests }) {
  return (
    <article className="add-list-row">
      <div className="add-list-row-copy">
        <strong>
          {user.firstName} {user.lastName}
        </strong>
        <span>{user.phoneNumber || "Unavailable"}</span>
      </div>

      <button
        className="submit-button add-list-row-button"
        type="button"
        disabled={isAccepting || !canAcceptGuests}
        onClick={() => onAccept(user.id)}
      >
        {isAccepting ? "Accepting..." : "Accept"}
      </button>
    </article>
  );
}

export default function AddPage() {
  const [users, setUsers] = useState(null);
  const [activeTab, setActiveTab] = useState("manual");
  const [query, setQuery] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [createMessage, setCreateMessage] = useState("");
  const [createError, setCreateError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [acceptingId, setAcceptingId] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [adminRole] = useState(() => getStoredAdminRole());
  const canAcceptGuests = adminRole !== "operator";

  const loadUsers = useCallback(async () => {
    const nextUsers = await fetchAdminUsers();
    setUsers(nextUsers);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialUsers() {
      const nextUsers = await fetchAdminUsers();
      if (!cancelled) {
        setUsers(nextUsers);
      }
    }

    void loadInitialUsers();

    return () => {
      cancelled = true;
    };
  }, []);

  const waitlistedUsers = useMemo(() => {
    return (users ?? []).filter(isWaitlistedUser).filter((user) => matchesUser(user, query));
  }, [query, users]);

  async function handleCreateManual(event) {
    event.preventDefault();

    if (isCreating) {
      return;
    }

    setIsCreating(true);
    setCreateError("");
    setCreateMessage("");
    setActionError("");
    setActionMessage("");

    try {
      const createdUser = await createAdminUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim(),
      });

      if (!createdUser) {
        throw new Error("Unable to create member.");
      }

      setFirstName("");
      setLastName("");
      setPhoneNumber("");
      setCreateMessage("Member added without sending a text.");
      await loadUsers();
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Unable to create member.");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleAcceptUser(inviteToken) {
    if (!inviteToken || acceptingId) {
      return;
    }

    setAcceptingId(inviteToken);
    setActionError("");
    setActionMessage("");

    try {
      const result = await acceptWaitlistedInvite(inviteToken);
      if (!result?.ok) {
        throw new Error(result?.error ?? "Unable to accept guest.");
      }

      setActionMessage("Guest accepted.");
      await loadUsers();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to accept guest.");
    } finally {
      setAcceptingId("");
    }
  }

  const waitlistedCount = waitlistedUsers.length;

  return (
    <main className="page-root detail-page add-page">
      <section className="screen-shell add-shell">
        <div className="add-topbar">
          <label className="all-search-field add-search-field">
            <span className="sr-only">Search guests</span>
            <input
              className="all-search-input add-search-input"
              placeholder="Search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <div className="add-tabs" role="tablist" aria-label="Add guest tabs">
            <button
              className={`add-tab ${activeTab === "waitlisted" ? "is-active" : ""}`}
              type="button"
              role="tab"
              aria-selected={activeTab === "waitlisted"}
              onClick={() => setActiveTab("waitlisted")}
            >
              waitlisted
            </button>
            <button
              className={`add-tab ${activeTab === "manual" ? "is-active" : ""}`}
              type="button"
              role="tab"
              aria-selected={activeTab === "manual"}
              onClick={() => setActiveTab("manual")}
            >
              manual
            </button>
          </div>
        </div>

        {actionMessage ? <p className="add-status is-success">{actionMessage}</p> : null}
        {actionError ? <p className="add-status is-error">{actionError}</p> : null}

        {activeTab === "waitlisted" ? (
          <section className="add-panel" aria-label="Waitlisted guests" role="tabpanel">
            <div className="add-panel-header">
              <strong>{waitlistedCount} waitlisted guests</strong>
            </div>

            {users === null ? (
              <div className="add-empty">Loading</div>
            ) : waitlistedCount ? (
              <div className="add-list">
                {waitlistedUsers.map((user) => (
                  <WaitlistedRow
                    canAcceptGuests={canAcceptGuests}
                    isAccepting={acceptingId === user.id}
                    key={user.id}
                    onAccept={handleAcceptUser}
                    user={user}
                  />
                ))}
              </div>
            ) : (
              <div className="add-empty">No waitlisted guests yet.</div>
            )}
          </section>
        ) : (
          <section className="add-panel add-panel-manual" aria-label="Manual add" role="tabpanel">
            <div className="registered-create-copy">
              {createMessage ? <p className="registered-create-status is-success">{createMessage}</p> : null}
              {createError ? <p className="registered-create-status is-error">{createError}</p> : null}
            </div>

            <form className="registered-create-form add-manual-form" onSubmit={handleCreateManual}>
              <label className="registered-create-field">
                <span>First name</span>
                <input
                  className="registered-create-input"
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="First name"
                  type="text"
                  value={firstName}
                />
              </label>

              <label className="registered-create-field">
                <span>Last name</span>
                <input
                  className="registered-create-input"
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Last name"
                  type="text"
                  value={lastName}
                />
              </label>

              <label className="registered-create-field registered-create-field--phone">
                <span>Phone number</span>
                <input
                  className="registered-create-input"
                  inputMode="tel"
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  placeholder="5551234567"
                  type="tel"
                  value={phoneNumber}
                />
              </label>

              <button className="submit-button registered-create-button" type="submit" disabled={isCreating}>
                {isCreating ? "Adding..." : "Add member"}
              </button>
            </form>
          </section>
        )}
      </section>
    </main>
  );
}
