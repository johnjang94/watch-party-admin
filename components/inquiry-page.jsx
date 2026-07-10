"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_CONTROL_URL ?? "https://fifa-control.onrender.com";

function formatTime(value) {
  if (!value) return "Unknown time";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function resolveAvatar(item) {
  if (typeof item.customerPhotoUrl === "string") {
    return item.customerPhotoUrl;
  }

  if (typeof item.profilePhotoUrl === "string") {
    return item.profilePhotoUrl;
  }

  if (typeof item.avatar === "string") {
    return item.avatar;
  }

  return item.avatar?.src ?? null;
}

function makeSummary(item) {
  return item.question || item.answer || "New support ticket";
}

function makeReason(item) {
  return String(item.requestReason ?? "").trim();
}

function matchesInquiry(item, query) {
  const value = query.trim().toLowerCase();
  if (!value) return true;

  const fields = [
    item.customer,
    item.phoneNumber,
    item.question,
    item.answer,
    item.requestReason,
    item.status,
    item.currentAgent,
    ...(item.thread ?? []).flatMap((line) => [line.message, line.role]),
  ]
    .filter(Boolean)
    .map((entry) => String(entry).toLowerCase());

  return fields.some((entry) => entry.includes(value));
}

export function InquiryPage({ inquiries }) {
  const [items, setItems] = useState(() => inquiries);
  const [expandedId, setExpandedId] = useState(inquiries[0]?.id ?? "");
  const [drafts, setDrafts] = useState({});
  const [adminKey, setAdminKey] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return window.localStorage.getItem("fifa-admin-access-key") || "";
  });
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const visibleItems = useMemo(() => items.filter((item) => matchesInquiry(item, query)), [items, query]);
  const resolvedExpandedId =
    visibleItems.some((item) => item.id === expandedId) ? expandedId : visibleItems[0]?.id ?? "";

  const openItem = useMemo(
    () => visibleItems.find((item) => item.id === resolvedExpandedId) ?? null,
    [resolvedExpandedId, visibleItems],
  );

  function toggleItem(id) {
    setExpandedId((current) => (current === id ? "" : id));
    const target = items.find((item) => item.id === id);
    if (target && !target.humanAcknowledgedAt) {
      void acknowledgeItem(target);
    }
  }

  function updateDraft(id, value) {
    setDrafts((current) => ({
      ...current,
      [id]: value,
    }));
  }

  async function handleReply(item) {
    const message = String(drafts[item.id] ?? "").trim();
    if (!message || savingId) {
      return;
    }

    setSavingId(item.id);
    setError("");

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/inquiries/${item.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(adminKey ? { "x-admin-key": adminKey } : {}),
        },
        body: JSON.stringify({
          message,
          agentName: "Admin",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Unable to save reply.");
      }

      if (data.inquiry) {
        setItems((current) =>
          current.map((entry) => (entry.id === item.id ? data.inquiry : entry)),
        );
        updateDraft(item.id, "");
        setExpandedId(item.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save reply.");
    } finally {
      setSavingId("");
    }
  }

  async function acknowledgeItem(item) {
    if (!item?.id || item.humanAcknowledgedAt) {
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/inquiries/${item.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(adminKey ? { "x-admin-key": adminKey } : {}),
        },
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        return;
      }

      if (data.inquiry) {
        setItems((current) =>
          current.map((entry) => (entry.id === item.id ? data.inquiry : entry)),
        );
      }
    } catch {
      // Acknowledgement is best effort only.
    }
  }

  return (
    <main className="page-root detail-page inquiry-page">
      <section className="screen-shell inquiry-shell">
        <header className="screen-topbar inquiry-topbar">
          <Link className="back-link inquiry-back" href="/dashboard">
            back
          </Link>
          <div className="screen-heading inquiry-heading">
            <p className="eyebrow">inquiry</p>
            <h1 className="screen-title">Live queue</h1>
          </div>
        </header>

        <div className="inquiry-summary">
          <span>{visibleItems.length} threads</span>
          <span>{query ? "filtered inbox" : openItem ? "ticket open" : "priority inbox"}</span>
        </div>

        <div className="inquiry-search">
          <label className="inquiry-search-field">
            <span>Search inquiry</span>
            <input
              className="field-input inquiry-search-input"
              placeholder="Search customer, phone, note, or reply"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          {query ? (
            <button className="secondary-button inquiry-clear" type="button" onClick={() => setQuery("")}>
              clear search
            </button>
          ) : null}
        </div>

        {error ? <p className="inquiry-error">{error}</p> : null}

        <div className="inquiry-list inquiry-grid">
          {visibleItems.map((item) => {
            const isOpen = resolvedExpandedId === item.id;
            const avatar = resolveAvatar(item);
            const requestReason = makeReason(item);

            return (
              <article className={`inquiry-card inquiry-panel ${isOpen ? "is-open" : ""}`} key={item.id}>
                <button className="inquiry-summary-button" onClick={() => toggleItem(item.id)} type="button">
                  <div className="inquiry-card-head inquiry-panel-head">
                    <div className="inquiry-copy">
                      <div className="inquiry-heading-row">
                        {avatar ? (
                          <img alt="" className="inquiry-avatar" src={avatar} />
                        ) : (
                          <div className="inquiry-avatar inquiry-avatar-fallback" aria-hidden="true">
                            {String(item.customer ?? "U")
                              .split(" ")
                              .map((part) => part.charAt(0))
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()}
                          </div>
                        )}

                        <div className="inquiry-copy-text">
                          <p className="inquiry-name">{item.customer}</p>
                          <p className="inquiry-question">{makeSummary(item)}</p>
                          {requestReason ? <p className="inquiry-reason">Reason: {requestReason}</p> : null}
                        </div>
                      </div>
                    </div>

                    <div className="inquiry-chip-stack">
                      <span className="status-chip inquiry-chip">{item.status || "open"}</span>
                      <span className="status-chip is-muted inquiry-chip">
                        {item.currentAgent || "Unassigned"}
                      </span>
                    </div>
                  </div>
                </button>

                {isOpen ? (
                  <div className="inquiry-body">
                    <div className="inquiry-thread inquiry-stream" aria-label={`Conversation for ${item.customer}`}>
                      {item.thread?.length ? (
                        item.thread.map((line, index) => (
                          <div
                            className={`thread-line inquiry-line ${line.role === "agent" ? "is-agent" : "is-customer"}`}
                            key={`${item.id}-${index}`}
                          >
                            <div className="thread-line-meta inquiry-line-meta">
                              <span>
                                {line.role === "agent"
                                  ? item.currentAgent || "agent"
                                  : item.customer || "customer"}
                              </span>
                              <time>{formatTime(line.createdAt)}</time>
                            </div>
                            <p>{line.message}</p>
                          </div>
                        ))
                      ) : (
                        <div className="inquiry-empty-thread">No thread messages yet.</div>
                      )}
                    </div>

                    {requestReason ? (
                      <div className="inquiry-reason-panel">
                        <span className="inquiry-reason-label">Reason</span>
                        <p>{requestReason}</p>
                      </div>
                    ) : null}

                    <form
                      className="inquiry-reply-form"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void handleReply(item);
                      }}
                    >
                      <textarea
                        className="inquiry-reply-input"
                        placeholder="Reply to this ticket..."
                        rows={3}
                        value={drafts[item.id] ?? ""}
                        onChange={(event) => updateDraft(item.id, event.target.value)}
                      />

                      <button
                        className="inquiry-reply-button"
                        type="submit"
                        disabled={savingId === item.id}
                      >
                        {savingId === item.id ? "saving..." : "send reply"}
                      </button>
                    </form>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>

        {!visibleItems.length ? (
          <div className="inquiry-empty-thread inquiry-empty-search">
            No inquiries matched your search.
          </div>
        ) : null}
      </section>
    </main>
  );
}
