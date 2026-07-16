"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { broadcastEventUpdateSms, fetchInviteOverview } from "../../lib/admin-api";

const MESSAGE_PREVIEW = `Hi {firstName}, we are reaching out from FIFA Final X BTS Half-Time Show Watch Party :) Thank you for your patience and staying tuned. We now have some updates for our event for this Sunday. See details at:


https://fifa-half-time-show.vercel.app/`;

function normalizePhoneNumber(value) {
  return String(value ?? "").replace(/\D/g, "");
}

function maskPhoneNumber(value) {
  const digits = normalizePhoneNumber(value);
  if (digits.length < 4) {
    return "phone unavailable";
  }

  return `••• ••• ${digits.slice(-4)}`;
}

function formatName(invite) {
  const fullName = [invite?.firstName, invite?.lastName].filter(Boolean).join(" ").trim();
  return fullName || "Unknown guest";
}

function buildRecipientList(invites) {
  const seen = new Set();
  const recipients = [];

  invites.forEach((invite) => {
    const phoneNumber = normalizePhoneNumber(invite?.phoneNumber);
    const id = String(invite?.id ?? "").trim();
    const key = phoneNumber || id;

    if (!phoneNumber || !id || seen.has(key)) {
      return;
    }

    seen.add(key);
    recipients.push(invite);
  });

  return recipients;
}

export default function BroadcastUpdatePage() {
  const [inviteOverview, setInviteOverview] = useState(null);
  const [isSendingAll, setIsSendingAll] = useState(false);
  const [sendingInviteId, setSendingInviteId] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadInvites() {
      try {
        const result = await fetchInviteOverview();
        if (!cancelled) {
          setInviteOverview(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load invite overview.");
        }
      }
    }

    void loadInvites();

    return () => {
      cancelled = true;
    };
  }, []);

  const recipients = useMemo(() => {
    return buildRecipientList(inviteOverview?.invites ?? []);
  }, [inviteOverview]);

  async function sendUpdate(inviteToken, recipientName) {
    const confirmed = window.confirm(
      recipientName
        ? `Send the event update SMS to ${recipientName}?`
        : "Send the event update SMS to this invitee?",
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setStatus("");

    try {
      const result = await broadcastEventUpdateSms({
        mode: "single",
        inviteToken,
      });
      if (!result?.ok) {
        throw new Error(result?.error ?? "Unable to send the update text.");
      }

      setStatus(
        result.target === "single"
          ? `Sent to ${recipientName || "one guest"}.`
          : `Sent to ${result.sent ?? 0} guest${result.sent === 1 ? "" : "s"}.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send the update text.");
    } finally {
      setSendingInviteId("");
      setIsSendingAll(false);
    }
  }

  async function handleSendAll() {
    if (isSendingAll || !recipients.length) {
      return;
    }

    const confirmed = window.confirm(
      `Send the event update SMS to all ${recipients.length} invitee${recipients.length === 1 ? "" : "s"} with a phone number?`,
    );

    if (!confirmed) {
      return;
    }

    setIsSendingAll(true);
    setError("");
    setStatus("");

    try {
      const result = await broadcastEventUpdateSms({
        mode: "all",
      });
      if (!result?.ok) {
        throw new Error(result?.error ?? "Unable to send the update text.");
      }

      setStatus(
        `Sent to ${result.sent ?? 0} guest${result.sent === 1 ? "" : "s"}${result.failed ? `, failed for ${result.failed}` : ""}${result.skipped ? `, skipped ${result.skipped}` : ""}.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send the update text.");
    } finally {
      setIsSendingAll(false);
    }
  }

  return (
    <main className="page-root detail-page inquiry-page broadcast-update-page">
      <section className="screen-shell inquiry-shell">
        <header className="new-topbar inquiry-topbar">
          <div className="screen-heading new-heading inquiry-heading">
            <p className="inquiry-detail-eyebrow">thread 06</p>
            <h1 className="screen-title">SMS Update</h1>
            <p className="inquiry-detail-topcopy">
              Send the latest event note to every invitee with a phone number.
            </p>
          </div>

          <Link className="inquiry-back-button" href="/dashboard">
            back
          </Link>
        </header>

        <article className="profile-card broadcast-update-card">
          <div className="broadcast-update-preview">
            <p className="broadcast-update-kicker">message preview</p>
            <pre className="broadcast-update-message">{MESSAGE_PREVIEW}</pre>
          </div>

          <div className="broadcast-update-summary">
            <strong>{recipients.length} invitee{recipients.length === 1 ? "" : "s"} ready to receive this update</strong>
            <p>Use the top button to send the note to everyone, or message individual guests below.</p>
          </div>

          <button
            className="secondary-button broadcast-update-button"
            disabled={isSendingAll || !recipients.length}
            onClick={() => void handleSendAll()}
            type="button"
          >
            {isSendingAll ? "sending..." : `Send update to all ${recipients.length}`}
          </button>

          {status ? <p className="broadcast-update-status">{status}</p> : null}
          {error ? <p className="inquiry-error">{error}</p> : null}
        </article>

        <section className="broadcast-recipient-list" aria-label="Individual invitees">
          {inviteOverview === null ? (
            <div className="roster-empty new-empty inquiry-empty-search" role="status" aria-live="polite">
              <strong>Loading invitees...</strong>
              <p>Fetching the guest list for individual SMS sending.</p>
            </div>
          ) : recipients.length ? (
            recipients.map((invite) => {
              const inviteToken = String(invite?.id ?? "").trim();
              const recipientName = formatName(invite);
              const phoneLabel = maskPhoneNumber(invite?.phoneNumber);
              const isSending = sendingInviteId === inviteToken;

              return (
                <article className="inquiry-card broadcast-recipient-card" key={inviteToken}>
                  <div className="inquiry-card-head inquiry-panel-head">
                    <div className="inquiry-copy">
                      <div className="inquiry-name-row">
                        <p className="inquiry-name">{recipientName}</p>
                      </div>
                      <div className="inquiry-copy-text">
                        <p className="inquiry-question inquiry-group-subtitle">{phoneLabel}</p>
                        <p className="inquiry-question inquiry-group-subtitle">
                          Individual update recipient
                        </p>
                      </div>
                    </div>

                    <div className="inquiry-chip-stack">
                      <span className="status-chip inquiry-chip">thread</span>
                      <span className="status-chip is-muted inquiry-chip">
                        {String(invite?.rsvp ?? "Going")}
                      </span>
                    </div>
                  </div>

                  <button
                    className="secondary-button broadcast-recipient-button"
                    disabled={isSending}
                    onClick={() => {
                      setSendingInviteId(inviteToken);
                      void sendUpdate(inviteToken, recipientName);
                    }}
                    type="button"
                  >
                    {isSending ? "sending..." : "Send update"}
                  </button>
                </article>
              );
            })
          ) : (
            <div className="inquiry-empty-thread inquiry-empty-search">
              No recipients with phone numbers yet.
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
