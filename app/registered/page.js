"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { UserListPage } from "../../components/user-list-page";
import { createAdminUser, fetchAdminUsers } from "../../lib/admin-api";

function isRegisteredUser(user) {
  return String(user?.status ?? "").trim().toLowerCase() === "confirmed";
}

function isPrivacyPendingUser(user) {
  return !Boolean(user?.privacyPolicyAccepted ?? user?.privacyAccepted);
}

function RegisteredPageContent() {
  const [users, setUsers] = useState(null);
  const searchParams = useSearchParams();
  const view = searchParams?.get("view") === "privacy-pending" ? "privacy-pending" : "all";
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createMessage, setCreateMessage] = useState("");

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

  async function handleCreateGuest(event) {
    event.preventDefault();

    if (isCreating) {
      return;
    }

    setIsCreating(true);
    setCreateError("");
    setCreateMessage("");

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

  const registeredUsers = useMemo(() => {
    return (users ?? []).filter(isRegisteredUser);
  }, [users]);

  const privacyPendingUsers = useMemo(() => {
    return registeredUsers.filter(isPrivacyPendingUser);
  }, [registeredUsers]);

  const visibleUsers = view === "privacy-pending" ? privacyPendingUsers : registeredUsers;

  return (
    <div className="registered-page-wrap">
      <div className="registered-filter-row">
        <Link className={`status-chip registered-filter-chip ${view === "all" ? "is-active" : ""}`} href="/registered">
          all registered
        </Link>
        <Link
          className={`status-chip registered-filter-chip ${view === "privacy-pending" ? "is-active" : ""}`}
          href="/registered?view=privacy-pending"
        >
          needs consent
        </Link>
      </div>

      <section className="registered-create-card" aria-label="Add member manually">
        <div className="registered-create-copy">
          <p className="registered-page-note">Manually add a member here. No SMS will be sent.</p>
          {createMessage ? <p className="registered-create-status is-success">{createMessage}</p> : null}
          {createError ? <p className="registered-create-status is-error">{createError}</p> : null}
        </div>

        <form className="registered-create-form" onSubmit={handleCreateGuest}>
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

      <UserListPage
        isLoading={users === null}
        headerBadge={view === "privacy-pending" ? "CONSENT NEEDED" : ""}
        listLabel="Registered guest list"
        noMatchesBody={
          view === "privacy-pending"
            ? "All registered guests have accepted the privacy policy."
            : "Try another search."
        }
        noMatchesTitle="No matches."
        title="registered"
        users={visibleUsers}
      />
    </div>
  );
}

export default function RegisteredPage() {
  return (
    <Suspense fallback={<div className="registered-page-wrap" />}>
      <RegisteredPageContent />
    </Suspense>
  );
}
