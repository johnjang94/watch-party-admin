"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getStoredAdminSessionId } from "../lib/admin-api";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_CONTROL_URL ?? "https://fifa-control.onrender.com";

function normalize(value) {
  return String(value ?? "").trim();
}

function readAdminSession() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem("watch-party-admin-session");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readAdminSessionId() {
  const session = readAdminSession();
  return normalize(session?.id);
}

function formatAdminDisplayName(session) {
  const firstName = normalize(session?.firstName);
  const lastName = normalize(session?.lastName);
  return [firstName, lastName].filter(Boolean).join(" ").trim() || "Admin";
}

function normalizeAvatarSource(raw) {
  if (!raw) {
    return null;
  }

  if (typeof raw === "object") {
    const directCandidates = [
      raw.url,
      raw.src,
      raw.downloadUrl,
      raw.downloadURL,
      raw.avatarUrl,
      raw.profilePhotoUrl,
      raw.photoUrl,
      raw.path,
      raw.value,
    ];

    for (const candidate of directCandidates) {
      const normalized = normalizeAvatarSource(candidate);
      if (normalized) {
        return normalized;
      }
    }

    return null;
  }

  const value = normalize(raw);
  if (!value || value === "[object Object]" || value === "null" || value === "undefined") {
    return null;
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  if (value.startsWith("//")) {
    return `https:${value}`;
  }

  if (value.startsWith("firebasestorage.googleapis.com/") || value.startsWith("storage.googleapis.com/")) {
    return `https://${value}`;
  }

  try {
    return new URL(value, apiBaseUrl).toString();
  } catch {
    return value.startsWith("/") ? value : `/${value}`;
  }
}

function formatTime(value, options = {}) {
  const { fallback = "Unknown time", ...formatOptions } = options;

  if (!value) {
    return fallback;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    ...formatOptions,
  }).format(date);
}

function formatThreadDate(value) {
  if (!value) {
    return "recent thread";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatSearchDate(value) {
  if (!value) {
    return "";
  }

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

function initialsFromName(value) {
  const parts = normalize(value)
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) {
    return "?";
  }

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function makeSummary(item) {
  return item?.question || item?.answer || "New support ticket";
}

function makeReason(item) {
  return String(item?.requestReason ?? "").trim();
}

function getInquiryTimestamp(item) {
  const candidates = [item?.updatedAt, item?.humanRequestedAt, item?.createdAt];
  for (const candidate of candidates) {
    const time = new Date(candidate).getTime();
    if (Number.isFinite(time) && time > 0) {
      return time;
    }
  }

  return 0;
}

function parseTimestamp(value) {
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function getThreadRole(entry) {
  const role = normalize(entry?.role).toLowerCase();
  if (role === "agent" || role === "assistant" || role === "admin") {
    return "agent";
  }

  return "customer";
}

function getThreadLastTimestamp(thread, role) {
  return Math.max(
    ...(Array.isArray(thread)
      ? thread
          .filter((entry) => getThreadRole(entry) === role)
          .map((entry) => parseTimestamp(entry?.createdAt))
      : [0]),
    0,
  );
}

function getThreadReadState(item) {
  const thread = Array.isArray(item?.thread) ? item.thread : [];
  const lastAgentAt = getThreadLastTimestamp(thread, "agent");
  const lastCustomerAt = getThreadLastTimestamp(thread, "customer");
  const supportChatReadAt = parseTimestamp(item?.supportChatReadAt);
  const hasUnreadCustomerMessage = lastCustomerAt > lastAgentAt;
  const userHasReadLatestAdminMessage = Boolean(lastAgentAt) && supportChatReadAt >= lastAgentAt;

  return {
    lastAgentAt,
    lastCustomerAt,
    supportChatReadAt,
    hasUnreadCustomerMessage,
    userHasReadLatestAdminMessage,
  };
}

function getInquiryGroupKey(item) {
  return (
    String(item?.inviteId ?? item?.inviteToken ?? item?.phoneNumber ?? item?.customer ?? item?.id ?? "").trim() ||
    item?.id
  );
}

function getInquiryActionId(item) {
  return normalize(item?.id ?? item?.inviteId ?? item?.inviteToken ?? item?.ticketCode ?? "");
}

function getInquiryActionIdFromGroup(group, item) {
  return (
    getInquiryActionId(item) ||
    normalize(group?.inviteId ?? group?.id ?? "")
  );
}

const ONLINE_PRESENCE_WINDOW_MS = 45 * 1000;

function parseTime(value) {
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function isCustomerOnline(item) {
  if (normalize(item?.supportChatState).toLowerCase() !== "active") {
    return false;
  }

  const activeAt = parseTime(item?.supportChatActiveAt);
  if (!activeAt) {
    return false;
  }

  const inactiveAt = parseTime(item?.supportChatInactiveAt);
  const now = Date.now();
  return now - activeAt <= ONLINE_PRESENCE_WINDOW_MS && activeAt >= inactiveAt;
}

function buildAvatarCandidates(...sources) {
  const seen = new Set();
  const candidates = [];

  function addCandidate(value) {
    const normalized = normalizeAvatarSource(value);
    if (!normalized || seen.has(normalized)) {
      return;
    }

    seen.add(normalized);
    candidates.push(normalized);
  }

  for (const source of sources.flat()) {
    addCandidate(source?.customerPhotoUrl);
    addCandidate(source?.profilePhotoUrl);
    addCandidate(source?.avatarUrl);
    addCandidate(source?.avatar?.url);
    addCandidate(source?.avatar);
    addCandidate(source?.photoUrl);
    addCandidate(source?.photo);
    addCandidate(source?.profilePhoto?.url);
    addCandidate(source?.profilePhoto);
    addCandidate(source?.picture);
    addCandidate(source?.profilePicture);
  }

  return candidates;
}

function buildInquiryGroups(items) {
  const groups = new Map();

  for (const item of items) {
    const groupKey = getInquiryGroupKey(item);
    const current = groups.get(groupKey) ?? {
      id: groupKey,
      inviteId: String(item.inviteId ?? item.inviteToken ?? "").trim(),
      customer: item.customer || "Unknown guest",
      customerPhotoUrl: item.customerPhotoUrl ?? item.profilePhotoUrl ?? null,
      phoneNumber: item.phoneNumber || "",
      latestAt: 0,
      inquiries: [],
    };

    current.customer = current.customer || item.customer || "Unknown guest";
    current.customerPhotoUrl =
      current.customerPhotoUrl ||
      item.customerPhotoUrl ||
      item.profilePhotoUrl ||
      buildAvatarCandidates(item)[0] ||
      null;
    current.phoneNumber = current.phoneNumber || item.phoneNumber || "";
    current.inquiries.push(item);
    current.latestAt = Math.max(current.latestAt, getInquiryTimestamp(item));
    groups.set(groupKey, current);
  }

  return [...groups.values()]
    .map((group) => {
      const inquiries = group.inquiries
        .slice()
        .sort((a, b) => getInquiryTimestamp(b) - getInquiryTimestamp(a));

      return {
        ...group,
        inquiries,
        latestInquiry: inquiries[0] ?? null,
        avatarCandidates: buildAvatarCandidates(group, inquiries),
      };
    })
    .sort((a, b) => b.latestAt - a.latestAt);
}

function matchesInquiryGroup(group, query, filterMode) {
  const value = query.trim().toLowerCase();
  if (!value) {
    return true;
  }

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
      ...(item.thread ?? []).flatMap((line) => [line.message, line.role, formatSearchDate(line.createdAt)]),
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

function getThreadCustomerName(group, item) {
  return normalize(item?.customer || group?.customer || "Unknown guest") || "Unknown guest";
}

function getThreadPreview(item) {
  const preview = item?.thread?.find((line) => normalize(line?.message))?.message || makeSummary(item);
  return normalize(preview);
}

function getThreadTitle(item) {
  return normalize(item?.summaryTitle || item?.question || item?.answer || "New support ticket");
}

function getThreadLabel(item) {
  return formatThreadDate(item?.createdAt || item?.updatedAt || item?.humanRequestedAt);
}

function getThreadMessageName(role, group, item) {
  if (getThreadRole({ role }) === "agent") {
    return item?.currentAgent || item?.assignedTo || "Admin";
  }

  return getThreadCustomerName(group, item);
}

function getThreadReceiptLabel(item) {
  const name = normalize(item?.currentAgent || item?.assignedTo);
  if (!name || name.toLowerCase() === "unassigned") {
    return "Unassigned";
  }

  return `Received by ${name}`;
}

function getThreadStatusLabel(item, { isSending = false } = {}) {
  if (isSending) {
    return "Sending";
  }

  const readState = getThreadReadState(item);

  if (readState.userHasReadLatestAdminMessage) {
    return "Read";
  }

  if (readState.lastAgentAt && readState.supportChatReadAt < readState.lastAgentAt) {
    return item?.humanConnectionSmsSentAt ? "Notified" : "Delivered";
  }

  return "Delivered";
}

function InquiryAvatar({ alt, candidates, fallbackText, className = "inquiry-avatar" }) {
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const candidateSignature = (candidates ?? []).join("||");

  useEffect(() => {
    setCandidateIndex(0);
    setFailed(false);
  }, [candidateSignature]);

  const currentSrc = (candidates ?? [])[candidateIndex] ?? null;

  if (!currentSrc || failed) {
    return (
      <div className={`${className} inquiry-avatar-fallback`} aria-hidden="true">
        {fallbackText}
      </div>
    );
  }

  return (
    <img
      alt={alt}
      className={className}
      src={currentSrc}
      onError={() => {
        if (candidateIndex + 1 < (candidates?.length ?? 0)) {
          setCandidateIndex((current) => current + 1);
          return;
        }

        setFailed(true);
      }}
    />
  );
}

export function InquiryPage({ inquiries, isLoading = false }) {
  const [items, setItems] = useState(() => inquiries);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedThreadId, setSelectedThreadId] = useState("");
  const [drafts, setDrafts] = useState({});
  const [adminDisplayName] = useState(() => formatAdminDisplayName(readAdminSession()));
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [filterMode, setFilterMode] = useState("all");
  const adminSessionId = useMemo(() => readAdminSessionId(), []);
  const streamSessionId = useMemo(() => getStoredAdminSessionId(), []);
  const streamReconnectTimerRef = useRef(null);
  const streamReconnectAttemptRef = useRef(0);
  const streamClosedRef = useRef(false);

  const inquiryGroups = useMemo(() => buildInquiryGroups(items), [items]);
  const visibleGroups = useMemo(() => {
    const trimmedQuery = submittedQuery.trim();
    if (!trimmedQuery) {
      return inquiryGroups;
    }

    return inquiryGroups.filter((group) => matchesInquiryGroup(group, trimmedQuery, filterMode));
  }, [inquiryGroups, submittedQuery, filterMode]);
  const isSearchActive = Boolean(submittedQuery.trim());
  const selectedGroup =
    inquiryGroups.find((group) => group.id === selectedGroupId) ??
    visibleGroups.find((group) => group.id === selectedGroupId) ??
    null;
  const selectedThread =
    selectedGroup?.inquiries.find((item) => getInquiryActionId(item) === selectedThreadId) ??
    items.find((item) => getInquiryActionId(item) === selectedThreadId) ??
    null;
  const detailCandidates = selectedGroup
    ? buildAvatarCandidates(selectedGroup, selectedThread)
    : [];

  useEffect(() => {
    setItems(inquiries);
  }, [inquiries]);

  useEffect(() => {
    if (isLoading || !streamSessionId) {
      return undefined;
    }

    const streamUrl = `${apiBaseUrl}/api/admin/inquiries/stream?sessionId=${encodeURIComponent(streamSessionId)}`;

    function clearReconnectTimer() {
      if (streamReconnectTimerRef.current) {
        window.clearTimeout(streamReconnectTimerRef.current);
        streamReconnectTimerRef.current = null;
      }
    }

    function connect() {
      if (streamClosedRef.current) {
        return;
      }

      const source = new EventSource(streamUrl);
      let terminal = false;

      source.onmessage = (event) => {
        if (terminal || streamClosedRef.current) {
          return;
        }

        try {
          const data = JSON.parse(event.data);
          if (data?.ok === false) {
            if (String(data.error ?? "").toLowerCase().includes("unauthorized")) {
              terminal = true;
              streamClosedRef.current = true;
              clearReconnectTimer();
              source.close();
              setError("Admin session required.");
            }
            return;
          }

          if (Array.isArray(data?.inquiries)) {
            setItems(data.inquiries);
            setError("");
          }
        } catch {
          // Ignore malformed stream events.
        }
      };

      source.onopen = () => {
        if (terminal || streamClosedRef.current) {
          return;
        }

        streamReconnectAttemptRef.current = 0;
        clearReconnectTimer();
        setError("");
      };

      source.onerror = () => {
        if (terminal || streamClosedRef.current) {
          return;
        }

        terminal = true;
        source.close();

        const attempt = streamReconnectAttemptRef.current + 1;
        streamReconnectAttemptRef.current = attempt;
        const delay = Math.min(30000, 1000 * 2 ** Math.min(attempt - 1, 5));

        clearReconnectTimer();
        streamReconnectTimerRef.current = window.setTimeout(() => {
          streamReconnectTimerRef.current = null;
          connect();
        }, delay);

        if (attempt >= 4) {
          setError("Live updates disconnected.");
        } else {
          setError((current) => current || "Reconnecting live updates...");
        }
      };
    }

    streamClosedRef.current = false;
    clearReconnectTimer();
    connect();

    return () => {
      streamClosedRef.current = true;
      clearReconnectTimer();
    };
  }, [isLoading, streamSessionId]);

  useEffect(() => {
    if (selectedThreadId && !items.some((item) => getInquiryActionId(item) === selectedThreadId)) {
      setSelectedThreadId("");
      setSelectedGroupId("");
    }
  }, [items, selectedThreadId]);

  function handleSearch(event) {
    event.preventDefault();
    setSubmittedQuery(query.trim());
  }

  function openThread(groupId, threadId) {
    const resolvedThreadId = normalize(threadId);
    if (!normalize(groupId) || !resolvedThreadId) {
      return;
    }

    const group = inquiryGroups.find((entry) => entry.id === groupId);
    const thread = group?.inquiries.find((entry) => getInquiryActionId(entry) === resolvedThreadId);
    if (!group || !thread) {
      return;
    }

    setSelectedGroupId(group.id);
    setSelectedThreadId(getInquiryActionIdFromGroup(group, thread));
    if (!thread.humanAcknowledgedAt) {
      void acknowledgeItem(thread, group);
    }
  }

  function backToList() {
    setSelectedGroupId("");
    setSelectedThreadId("");
  }

  function updateDraft(id, value) {
    setDrafts((current) => ({
      ...current,
      [id]: value,
    }));
  }

  async function handleReply(item, group) {
    const inquiryId = getInquiryActionIdFromGroup(group, item);
    if (!inquiryId) {
      return;
    }

    const message = String(drafts[inquiryId] ?? "").trim();
    if (!message || savingId) {
      return;
    }

    setSavingId(inquiryId);
    setError("");

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/inquiries/${inquiryId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(adminSessionId ? { "x-admin-session-id": adminSessionId } : {}),
        },
        body: JSON.stringify({
          message,
          agentName: adminDisplayName,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Unable to save reply.");
      }

      if (data.inquiry) {
        setItems((current) =>
          current.map((entry) =>
            getInquiryActionId(entry) === inquiryId ? data.inquiry : entry,
          ),
        );
        updateDraft(inquiryId, "");
        setSelectedGroupId(getInquiryGroupKey(data.inquiry));
        setSelectedThreadId(getInquiryActionId(data.inquiry));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save reply.");
    } finally {
      setSavingId("");
    }
  }

  async function acknowledgeItem(item, group) {
    const inquiryId = getInquiryActionIdFromGroup(group, item);
    if (!inquiryId || item.humanAcknowledgedAt) {
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/inquiries/${inquiryId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(adminSessionId ? { "x-admin-session-id": adminSessionId } : {}),
        },
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        return;
      }

      if (data.inquiry) {
        setItems((current) =>
          current.map((entry) =>
            getInquiryActionId(entry) === inquiryId ? data.inquiry : entry,
          ),
        );
      }
    } catch {
      // Acknowledgement is best effort only.
    }
  }

  function renderThreadMessages(thread, group, item) {
    if (!thread?.length) {
      return <div className="inquiry-empty-thread">No messages yet.</div>;
    }

    const activeThreadId = getInquiryActionIdFromGroup(group, item);

    return thread.map((line, index) => {
      const isAgent = getThreadRole(line) === "agent";
      const messageName = getThreadMessageName(line.role, group, item);
      const candidateSet = isAgent ? [] : buildAvatarCandidates(group, item);
      const isLatestAgentMessage = isAgent && getThreadLastTimestamp(thread, "agent") === parseTimestamp(line.createdAt);
      const statusLabel = isLatestAgentMessage
        ? getThreadStatusLabel(item, { isSending: savingId === activeThreadId })
        : "";

      return (
        <article className={`inquiry-message ${isAgent ? "is-agent" : "is-customer"}`} key={`${item.id}-${index}`}>
          <header className="inquiry-message-header">
            <div className="inquiry-message-identity">
              <div className={`inquiry-message-avatar ${isAgent ? "is-agent" : "is-customer"}`} aria-hidden="true">
                {isAgent ? (
                  "A"
                ) : (
                  <InquiryAvatar
                    alt=""
                    candidates={candidateSet}
                    fallbackText={initialsFromName(messageName)}
                    className="inquiry-message-avatar-image"
                  />
                )}
              </div>
              <span className="inquiry-message-copy">
                <strong>{messageName}</strong>
                <span>{isAgent ? "admin reply" : "customer message"}</span>
              </span>
            </div>
            <time dateTime={line.createdAt || ""}>{formatTime(line.createdAt, { fallback: "" })}</time>
          </header>
          <p>{line.message}</p>
          {isLatestAgentMessage ? (
            <div
              className={`inquiry-receipt ${
                statusLabel === "Read"
                  ? "is-read"
                  : statusLabel === "Sending"
                    ? "is-sending"
                    : statusLabel === "Notified"
                      ? "is-notified"
                      : "is-delivered"
              }`}
            >
              {statusLabel}
            </div>
          ) : null}
        </article>
      );
    });
  }

  function renderGroupCard(group) {
    const avatarCandidates = group.avatarCandidates?.length
      ? group.avatarCandidates
      : buildAvatarCandidates(group, group.latestInquiry);
    const latestInquiry = group.latestInquiry;
    const isOnline = group.inquiries.some(isCustomerOnline);

    return (
      <article className="inquiry-card inquiry-panel" key={group.id}>
        <header className="inquiry-card-head inquiry-panel-head">
          <div className="inquiry-copy">
            <div className="inquiry-heading-row">
              <InquiryAvatar
                alt=""
                candidates={avatarCandidates}
                fallbackText={initialsFromName(group.customer)}
              />

              <div className="inquiry-copy-text">
                <div className="inquiry-name-row">
                  <p className="inquiry-name">{group.customer}</p>
                  {isOnline ? <span className="inquiry-presence-dot" aria-hidden="true" /> : null}
                </div>
                <p className="inquiry-question inquiry-group-subtitle">
                  {group.inquiries.length} thread{group.inquiries.length === 1 ? "" : "s"} ready
                </p>
              </div>
            </div>
          </div>

          <div className="inquiry-chip-stack">
            <span className="status-chip inquiry-chip">{group.inquiries.length} chats</span>
            <span className="status-chip is-muted inquiry-chip">{getThreadReceiptLabel(latestInquiry)}</span>
          </div>
        </header>

        <div className="inquiry-thread-list">
          {group.inquiries.map((item) => (
            <ThreadPreviewButton key={item.id} group={group} item={item} onOpen={openThread} />
          ))}
        </div>
      </article>
    );
  }

  function ThreadPreviewButton({ group, item, onOpen }) {
    const readState = getThreadReadState(item);
    const statusLabel = getThreadStatusLabel(item);

    return (
      <button
        className={`inquiry-thread-preview ${readState.hasUnreadCustomerMessage ? "is-unread" : "is-read"}`}
        onClick={() => onOpen(group.id, getInquiryActionId(item))}
        type="button"
      >
        <div className="inquiry-thread-preview-head">
          <strong>{getThreadTitle(item)}</strong>
          {readState.hasUnreadCustomerMessage ? <span className="inquiry-unread-dot" aria-hidden="true" /> : null}
        </div>
        <div className="inquiry-thread-preview-meta">
          <span>{getThreadLabel(item)}</span>
          <span className={`status-chip inquiry-chip ${statusLabel === "Read" ? "is-read" : statusLabel === "Sending" ? "is-sending" : statusLabel === "Notified" ? "is-notified" : "is-delivered"}`}>
            {statusLabel}
          </span>
        </div>
        <p className="inquiry-thread-preview-snippet">{getThreadPreview(item)}</p>
        {makeReason(item) ? (
          <span className="status-chip is-muted inquiry-chip inquiry-reason-chip">
            {makeReason(item)}
          </span>
        ) : null}
      </button>
    );
  }

  function renderDetailView(group, thread) {
    const avatarCandidates = detailCandidates.length ? detailCandidates : buildAvatarCandidates(group, thread);
    const threadMessages = thread?.thread ?? [];
    const threadId = getInquiryActionIdFromGroup(group, thread);
    const draft = thread ? drafts[threadId] ?? "" : "";
    const statusLabel = getThreadStatusLabel(thread, { isSending: savingId === threadId });
    const isOnline = isCustomerOnline(thread);

    return (
      <div className="inquiry-detail-view">
        <header className="inquiry-detail-topbar">
          <button className="inquiry-back-button" onClick={backToList} type="button">
            back
          </button>
          <div className="inquiry-detail-topcopy">
            <p className="inquiry-detail-eyebrow">thread detail</p>
            <h2>{group.customer}</h2>
            <p>{getThreadLabel(thread)}</p>
          </div>
        </header>

        <section className="inquiry-detail-card inquiry-panel">
          <div className="inquiry-detail-header">
            <div className="inquiry-heading-row">
              <InquiryAvatar
                alt=""
                candidates={avatarCandidates}
                fallbackText={initialsFromName(group.customer)}
              />

              <div className="inquiry-copy-text">
                <div className="inquiry-name-row">
                  <p className="inquiry-name">{group.customer}</p>
                  {isOnline ? <span className="inquiry-presence-dot" aria-hidden="true" /> : null}
                </div>
                <p className="inquiry-question">{makeSummary(thread)}</p>
              </div>
            </div>

            <div className="inquiry-chip-stack">
              <span className="status-chip inquiry-chip">{threadMessages.length} messages</span>
              <span className="status-chip is-muted inquiry-chip">{getThreadReceiptLabel(thread)}</span>
              <span className={`status-chip inquiry-chip ${statusLabel === "Read" ? "is-read" : statusLabel === "Sending" ? "is-sending" : statusLabel === "Notified" ? "is-notified" : "is-delivered"}`}>
                {statusLabel}
              </span>
            </div>
          </div>

          <div className="inquiry-detail-thread" aria-label={`Conversation for ${group.customer}`}>
            {renderThreadMessages(threadMessages, group, thread)}
          </div>

          <form
            className="inquiry-reply-form"
            onSubmit={(event) => {
              event.preventDefault();
              void handleReply(thread, group);
            }}
          >
            <textarea
              className="inquiry-reply-input"
              placeholder="Reply"
              rows={4}
              value={draft}
              onChange={(event) => updateDraft(threadId, event.target.value)}
            />

            <button className="inquiry-reply-button" type="submit" disabled={savingId === threadId}>
              {savingId === threadId ? "saving..." : "send reply"}
            </button>
          </form>
        </section>
      </div>
    );
  }

  if (isLoading) {
    return (
      <main className="page-root detail-page inquiry-page">
        <section className="screen-shell inquiry-shell">
          <header className="new-topbar inquiry-topbar">
            <div className="screen-heading new-heading inquiry-heading">
              <h1 className="screen-title">Live queue</h1>
            </div>
          </header>

          <div className="roster-empty new-empty inquiry-empty-search" role="status" aria-live="polite">
            <strong>Loading...</strong>
            <p>Fetching inquiries from the database.</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-root detail-page inquiry-page">
      <section className="screen-shell inquiry-shell">
        {error ? <p className="inquiry-error">{error}</p> : null}
        {selectedThread && selectedGroup ? (
          renderDetailView(selectedGroup, selectedThread)
        ) : (
          <>
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

            <div className="inquiry-list inquiry-grid">
              {visibleGroups.map((group) => renderGroupCard(group))}
            </div>

            {!visibleGroups.length ? (
              <div className="inquiry-empty-thread inquiry-empty-search">
                {isSearchActive ? "No matches." : "No inquiries have been found"}
              </div>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}
