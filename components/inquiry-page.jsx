"use client";

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

function getInquiryTimestamp(item) {
  const candidates = [item.updatedAt, item.humanRequestedAt, item.createdAt];
  for (const candidate of candidates) {
    const time = new Date(candidate).getTime();
    if (Number.isFinite(time) && time > 0) {
      return time;
    }
  }

  return 0;
}

function formatSearchDate(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value).toLowerCase();
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
    .format(date)
    .toLowerCase();
}

function getInquiryGroupKey(item) {
  return (
    String(item.inviteId ?? item.inviteToken ?? item.phoneNumber ?? item.customer ?? item.id ?? "").trim() ||
    item.id
  );
}

function buildInquiryGroups(items) {
  const groups = new Map();

  for (const item of items) {
    const groupKey = getInquiryGroupKey(item);
    const current = groups.get(groupKey) ?? {
      id: groupKey,
      inviteId: String(item.inviteId ?? item.inviteToken ?? "").trim(),
      customer: item.customer || "Unknown guest",
      customerPhotoUrl: item.customerPhotoUrl ?? null,
      phoneNumber: item.phoneNumber || "",
      latestAt: 0,
      inquiries: [],
    };

    current.customer = current.customer || item.customer || "Unknown guest";
    current.customerPhotoUrl = current.customerPhotoUrl || item.customerPhotoUrl || null;
    current.phoneNumber = current.phoneNumber || item.phoneNumber || "";
    current.inquiries.push(item);
    current.latestAt = Math.max(current.latestAt, getInquiryTimestamp(item));
    groups.set(groupKey, current);
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      inquiries: group.inquiries
        .slice()
        .sort((a, b) => getInquiryTimestamp(b) - getInquiryTimestamp(a)),
      latestInquiry: group.inquiries
        .slice()
        .sort((a, b) => getInquiryTimestamp(b) - getInquiryTimestamp(a))[0] ?? null,
    }))
    .sort((a, b) => b.latestAt - a.latestAt);
}

function matchesInquiryGroup(group, query, filterMode) {
  const value = query.trim().toLowerCase();
  if (!value) return true;

  const inquiries = group.inquiries ?? [];

  const getAllFields = () => [
    group.customer,
    group.phoneNumber,
    group.inviteId,
    group.id,
    formatSearchDate(group.latestAt ? new Date(group.latestAt).toISOString() : ""),
    ...inquiries.flatMap((item) => [
      item.question,
      item.answer,
      item.requestReason,
      item.status,
      item.currentAgent,
      item.assignedTo,
      item.inviteId,
      item.phoneNumber,
      item.id,
      formatSearchDate(item.createdAt),
      formatSearchDate(item.updatedAt),
      formatSearchDate(item.humanRequestedAt),
      ...(item.thread ?? []).flatMap((line) => [
        line.message,
        line.role,
        formatSearchDate(line.createdAt),
      ]),
    ]),
  ];

  const fieldsByFilter = {
    all: getAllFields(),
    name: [group.customer],
    phone: [group.phoneNumber, ...inquiries.map((item) => item.phoneNumber)],
    id: [group.inviteId, group.id, ...inquiries.flatMap((item) => [item.inviteId, item.id])],
    keyword: [
      ...inquiries.flatMap((item) => [
        item.question,
        item.answer,
        item.requestReason,
        item.status,
        item.currentAgent,
        item.assignedTo,
        ...(item.thread ?? []).flatMap((line) => [line.message, line.role]),
      ]),
    ],
    date: [
      formatSearchDate(group.latestAt ? new Date(group.latestAt).toISOString() : ""),
      ...inquiries.flatMap((item) => [
        formatSearchDate(item.createdAt),
        formatSearchDate(item.updatedAt),
        formatSearchDate(item.humanRequestedAt),
        ...(item.thread ?? []).flatMap((line) => [formatSearchDate(line.createdAt)]),
      ]),
    ],
  };

  const fields = (fieldsByFilter[filterMode] ?? fieldsByFilter.all)
    .filter(Boolean)
    .map((entry) => String(entry).toLowerCase());

  return fields.some((entry) => entry.includes(value));
}

function makeSummary(item) {
  return item.question || item.answer || "New support ticket";
}

function makeReason(item) {
  return String(item.requestReason ?? "").trim();
}

function formatInquiryLabel(item) {
  if (!item) return "No conversations yet";

  const createdAt = item.createdAt || item.updatedAt || item.humanRequestedAt;
  const time = new Date(createdAt);

  if (Number.isNaN(time.getTime())) {
    return "Most recent";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(time);
}

export function InquiryPage({ inquiries }) {
  const [items, setItems] = useState(() => inquiries);
  const [expandedId, setExpandedId] = useState("");
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
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [filterMode, setFilterMode] = useState("all");

  const inquiryGroups = useMemo(() => buildInquiryGroups(items), [items]);
  const visibleGroups = useMemo(() => {
    const trimmedQuery = submittedQuery.trim();
    if (!trimmedQuery) {
      return inquiryGroups;
    }

    return inquiryGroups.filter((group) => matchesInquiryGroup(group, trimmedQuery, filterMode));
  }, [inquiryGroups, submittedQuery, filterMode]);
  const isSearchActive = Boolean(submittedQuery.trim());
  const resolvedExpandedId = visibleGroups.some((group) => group.id === expandedId) ? expandedId : "";

  function handleSearch(event) {
    event.preventDefault();
    setSubmittedQuery(query.trim());
  }

  function toggleGroup(id) {
    setExpandedId((current) => (current === id ? "" : id));
    const target = inquiryGroups.find((group) => group.id === id)?.latestInquiry;
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
        setExpandedId(getInquiryGroupKey(data.inquiry));
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
        <header className="new-topbar inquiry-topbar">
          <div className="screen-heading new-heading inquiry-heading">
            <h1 className="screen-title">Live queue</h1>
          </div>
        </header>

        <form className="inquiry-toolbar" onSubmit={handleSearch}>
          <label className="sr-only" htmlFor="inquiry-search-input">
            Search inquiries
          </label>

          <button className="inquiry-search-button" type="submit" aria-label="Search inquiries">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M10.5 4a6.5 6.5 0 1 1 4.1 11.55l4.07 4.07-1.41 1.41-4.07-4.07A6.5 6.5 0 0 1 10.5 4Zm0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z" />
            </svg>
          </button>

          <label className="all-search-field inquiry-search-field">
            <span className="sr-only">Search inquiries</span>
            <input
              id="inquiry-search-input"
              className="field-input inquiry-search-input"
              placeholder="Search inquiries"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <label className="sr-only" htmlFor="inquiry-filter-select">
            Search filter
          </label>
          <select
            id="inquiry-filter-select"
            className="field-input inquiry-filter-select"
            value={filterMode}
            onChange={(event) => setFilterMode(event.target.value)}
          >
            <option value="all">All fields</option>
            <option value="name">Name</option>
            <option value="phone">Phone</option>
            <option value="id">ID</option>
            <option value="keyword">Keyword</option>
            <option value="date">Date</option>
          </select>
        </form>

        {error ? <p className="inquiry-error">{error}</p> : null}

        <div className="inquiry-list inquiry-grid">
          {visibleGroups.map((group) => {
            const isOpen = resolvedExpandedId === group.id;
            const avatar = resolveAvatar(group.latestInquiry ?? group);
            const latestInquiry = group.latestInquiry;

            return (
              <article className={`inquiry-card inquiry-panel ${isOpen ? "is-open" : ""}`} key={group.id}>
                <button className="inquiry-summary-button" onClick={() => toggleGroup(group.id)} type="button">
                  <div className="inquiry-card-head inquiry-panel-head">
                    <div className="inquiry-copy">
                      <div className="inquiry-heading-row">
                        {avatar ? (
                          <img alt="" className="inquiry-avatar" src={avatar} />
                        ) : (
                          <div className="inquiry-avatar inquiry-avatar-fallback" aria-hidden="true">
                            {String(group.customer ?? "U")
                              .split(" ")
                              .map((part) => part.charAt(0))
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()}
                          </div>
                        )}

                        <div className="inquiry-copy-text">
                          <p className="inquiry-name">{group.customer}</p>
                        </div>
                      </div>
                    </div>

                    <div className="inquiry-chip-stack">
                      <span className="status-chip inquiry-chip">{group.inquiries.length} chats</span>
                      <span className="status-chip is-muted inquiry-chip">
                        {latestInquiry?.currentAgent || "Unassigned"}
                      </span>
                    </div>
                  </div>
                </button>

                {isOpen ? (
                  <div className="inquiry-body">
                    <div className="inquiry-group-body-inner">
                      {group.inquiries.map((item) => (
                        <section className="inquiry-session" key={item.id}>
                          <div className="inquiry-session-head">
                            <div className="inquiry-session-meta">
                              <strong>{formatInquiryLabel(item)}</strong>
                              <span className="status-chip is-muted inquiry-chip">
                                {item.status || "open"}
                              </span>
                            </div>
                            <p className="inquiry-question">{makeSummary(item)}</p>
                            {makeReason(item) ? (
                              <span className="status-chip is-muted inquiry-chip inquiry-reason-chip">
                                {makeReason(item)}
                              </span>
                            ) : null}
                          </div>

                          <div
                            className="inquiry-thread inquiry-stream"
                            aria-label={`Conversation for ${group.customer}`}
                          >
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
                                        : group.customer || "customer"}
                                    </span>
                                    <time>{formatTime(line.createdAt)}</time>
                                  </div>
                                  <p>{line.message}</p>
                                </div>
                              ))
                            ) : (
                              <div className="inquiry-empty-thread">No messages yet.</div>
                            )}
                          </div>
                        </section>
                      ))}

                      {latestInquiry ? (
                        <form
                          className="inquiry-reply-form"
                          onSubmit={(event) => {
                            event.preventDefault();
                            void handleReply(latestInquiry);
                          }}
                        >
                          <textarea
                            className="inquiry-reply-input"
                            placeholder="Reply"
                            rows={3}
                            value={drafts[latestInquiry.id] ?? ""}
                            onChange={(event) => updateDraft(latestInquiry.id, event.target.value)}
                          />

                          <button
                            className="inquiry-reply-button"
                            type="submit"
                            disabled={savingId === latestInquiry.id}
                          >
                            {savingId === latestInquiry.id ? "saving..." : "send reply"}
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>

        {!visibleGroups.length ? (
          <div className="inquiry-empty-thread inquiry-empty-search">
            {isSearchActive ? "No matches." : "No inquiries have been found"}
          </div>
        ) : null}
      </section>
    </main>
  );
}
