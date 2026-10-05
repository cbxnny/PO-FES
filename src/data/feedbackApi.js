import { authFetch, getCurrentUser } from '../utils/auth';
import { getUserDisplayName } from '../utils/roleUtils';

const API_BASE = import.meta.env.VITE_API_URL;
const LOCAL_FEATURE_STORE_KEY = 'po_fes_local_feedback_feature_store';

const safeParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const readLocalStore = () => safeParse(localStorage.getItem(LOCAL_FEATURE_STORE_KEY), { teams: {} });

const writeLocalStore = (store) => {
  localStorage.setItem(LOCAL_FEATURE_STORE_KEY, JSON.stringify(store));
};

const getLocalTeamStore = (store, teamId) => {
  const id = String(teamId);
  if (!store.teams[id]) {
    store.teams[id] = {
      feedbackEdits: {},
      removedFeedback: {},
      escalations: [],
      alerts: [],
      views: {}
    };
  }
  return store.teams[id];
};

const getErrorMessage = async (res, fallback) => {
  const data = await res.json().catch(() => ({}));
  return data.error || fallback;
};

const mergeById = (items = []) => {
  const seen = new Set();
  return items.filter((item) => {
    const id = String(item.id ?? `${item.name}-${item.role}-${item.createdAt}`);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

const applyLocalTeamEnhancements = (team) => {
  const store = readLocalStore();
  const localTeam = store.teams[String(team.id)] || {};
  const localEscalations = localTeam.escalations || [];
  const localAlerts = localTeam.alerts || [];
  const localViews = localTeam.views || {};

  const feedbackHistory = (team.feedbackHistory || []).map((feedback) => {
    const feedbackId = String(feedback.id);
    const edit = localTeam.feedbackEdits?.[feedbackId] || null;
    const removed = localTeam.removedFeedback?.[feedbackId] || null;

    return {
      ...feedback,
      ...(edit || {}),
      isRemoved: Boolean(feedback.isRemoved || removed),
      removedAt: removed?.removedAt || feedback.removedAt,
      removedBy: removed?.removedBy || feedback.removedBy,
      views: mergeById([...(feedback.views || []), ...(localViews[feedbackId] || [])]),
      alerts: mergeById([
        ...(feedback.alerts || []),
        ...localAlerts.filter((alert) => String(alert.feedbackId) === feedbackId)
      ]),
      escalations: mergeById([
        ...(feedback.escalations || []),
        ...localEscalations.filter((item) => String(item.feedbackId || '') === feedbackId)
      ])
    };
  });

  const teamEscalations = localEscalations.filter((item) => !item.feedbackId);
  const activeEscalations = mergeById([
    ...(team.activeEscalations || []),
    ...teamEscalations
  ]);
  const hasOpenEscalation = activeEscalations.some((item) => item.status !== 'resolved');

  return {
    ...team,
    feedbackHistory,
    studentAlerts: mergeById([...(team.studentAlerts || []), ...localAlerts]),
    activeEscalations,
    escalated: Boolean(team.escalated || hasOpenEscalation)
  };
};

export const getTeams = async () => {
  const res = await authFetch(`${API_BASE}/teams`);
  if (!res.ok) throw new Error('Failed to fetch teams');
  return res.json();
};

export const getTeamById = async (teamId) => {
  const res = await authFetch(`${API_BASE}/teams/${teamId}`);
  if (!res.ok) throw new Error('Failed to fetch team');
  const team = await res.json();
  return applyLocalTeamEnhancements(team);
};

export const addFeedbackToTeam = async (teamId, feedback) => {
  const res = await authFetch(`${API_BASE}/teams/${teamId}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(feedback)
  });
  if (!res.ok) throw new Error('Failed to submit feedback');
  return res.json();
};

export const escalateTeam = async (teamId, note, target = undefined, feedbackId = undefined) => {
  const res = await authFetch(`${API_BASE}/teams/${teamId}/escalate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note, target, feedbackId })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to escalate team.');
  }
  return res.json();
};



export const updateFeedback = async (teamId, feedbackId, feedback) => {
  const res = await authFetch(`${API_BASE}/teams/${teamId}/feedback/${feedbackId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(feedback)
  });

  if (res.ok) return res.json();

  const store = readLocalStore();
  const localTeam = getLocalTeamStore(store, teamId);
  localTeam.feedbackEdits[String(feedbackId)] = {
    ...feedback,
    updatedAt: new Date().toISOString()
  };
  writeLocalStore(store);
  return { localOnly: true };
};

export const removeFeedback = async (teamId, feedbackId) => {
  const res = await authFetch(`${API_BASE}/teams/${teamId}/feedback/${feedbackId}`, {
    method: 'DELETE'
  });

  if (res.ok) return res.json();

  const user = getCurrentUser();
  const store = readLocalStore();
  const localTeam = getLocalTeamStore(store, teamId);
  localTeam.removedFeedback[String(feedbackId)] = {
    removedAt: new Date().toISOString(),
    removedBy: getUserDisplayName(user)
  };
  writeLocalStore(store);
  return { localOnly: true };
};

export const escalateIssue = async (teamId, { target = 'coordinator', note = '', feedbackId = null } = {}) => {
  const res = await authFetch(`${API_BASE}/teams/${teamId}/escalations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target, note, feedbackId })
  });

  if (res.ok) return res.json();

  const user = getCurrentUser();
  const store = readLocalStore();
  const localTeam = getLocalTeamStore(store, teamId);
  localTeam.escalations.push({
    id: `local-escalation-${Date.now()}`,
    teamId,
    feedbackId,
    target,
    note,
    status: 'open',
    createdAt: new Date().toISOString(),
    createdBy: getUserDisplayName(user)
  });
  writeLocalStore(store);
  return { localOnly: true };
};

export const resolveEscalation = async (teamId, escalationId) => {
  const res = await authFetch(`${API_BASE}/teams/${teamId}/escalations/${escalationId}/resolve`, {
    method: 'PATCH'
  });

  if (res.ok) return res.json();

  const store = readLocalStore();
  const localTeam = getLocalTeamStore(store, teamId);
  localTeam.escalations = (localTeam.escalations || []).map((item) => (
    String(item.id) === String(escalationId)
      ? { ...item, status: 'resolved', resolvedAt: new Date().toISOString() }
      : item
  ));
  writeLocalStore(store);
  return { localOnly: true };
};

export const resolveActiveEscalations = async (teamId) => {
  const res = await authFetch(`${API_BASE}/teams/${teamId}/escalations/resolve-active`, {
    method: 'PATCH'
  });

  if (res.ok) return res.json();

  const store = readLocalStore();
  const localTeam = getLocalTeamStore(store, teamId);
  localTeam.escalations = (localTeam.escalations || []).map((item) => ({
    ...item,
    status: 'resolved',
    resolvedAt: item.resolvedAt || new Date().toISOString()
  }));
  writeLocalStore(store);
  return { localOnly: true };
};

export const markFeedbackViewed = async (teamId, feedbackId) => {
  const res = await authFetch(`${API_BASE}/teams/${teamId}/feedback/${feedbackId}/viewed`, {
    method: 'POST'
  });

  if (res.ok) return res.json();

  const user = getCurrentUser();
  const store = readLocalStore();
  const localTeam = getLocalTeamStore(store, teamId);
  const id = String(feedbackId);
  const view = {
    id: `local-view-${user?.id || getUserDisplayName(user)}-${Date.now()}`,
    name: getUserDisplayName(user),
    role: user?.role,
    viewedAt: new Date().toISOString()
  };

  const existing = localTeam.views[id] || [];
  const alreadyViewed = existing.some((item) => item.name === view.name);
  localTeam.views[id] = alreadyViewed ? existing : [...existing, view];
  writeLocalStore(store);
  return { localOnly: true };
};

export const alertTutorAboutFeedback = async (teamId, feedbackId, reason) => {
  const res = await authFetch(`${API_BASE}/teams/${teamId}/feedback/${feedbackId}/alert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason })
  });

  if (res.ok) return res.json();

  const user = getCurrentUser();
  const store = readLocalStore();
  const localTeam = getLocalTeamStore(store, teamId);
  localTeam.alerts.push({
    id: `local-alert-${Date.now()}`,
    teamId,
    feedbackId,
    reason,
    studentName: getUserDisplayName(user),
    status: 'open',
    createdAt: new Date().toISOString()
  });
  writeLocalStore(store);
  return { localOnly: true };
};

export const resolveFeedbackAlert = async (teamId, alertId) => {
  const res = await authFetch(`${API_BASE}/teams/${teamId}/feedback-alerts/${alertId}/resolve`, {
    method: 'PATCH'
  });

  if (res.ok) return res.json();

  const store = readLocalStore();
  const localTeam = getLocalTeamStore(store, teamId);
  localTeam.alerts = (localTeam.alerts || []).map((item) => (
    String(item.id) === String(alertId)
      ? { ...item, status: 'resolved', resolvedAt: new Date().toISOString() }
      : item
  ));
  writeLocalStore(store);
  return { localOnly: true };
};

// ---- Pure display helpers — unchanged, no storage involved ----

export const formatDate = (dateString) => {
  if (!dateString) return 'No date recorded';

  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(dateString));
};

export const daysSince = (dateString) => {
  if (!dateString) return null;

  const today = new Date();
  const date = new Date(dateString);

  const diff = today.setHours(0, 0, 0, 0) - date.setHours(0, 0, 0, 0);

  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
};

export const formatDaysAgo = (days) => {
  if (days === null || days === undefined) return 'No feedback submitted yet';
  if (days === 0) return 'Today';

  const dayLabel = days === 1 ? 'day' : 'days';
  return `${days} ${dayLabel} ago`;
};

export const latestFeedback = (team) => {
  return [...(team.feedbackHistory || [])]
    .filter((fb) => fb.source === 'client' && !fb.isRemoved)
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))[0];
};

export const getTeamStatus = (team) => {
  const latest = latestFeedback(team);

  if (!latest) {
    return {
      label: 'No feedback submitted yet',
      className: 'missing',
      lastText: 'No feedback submitted yet'
    };
  }

  const days = daysSince(latest.submittedAt);

  if (days > 14) {
    return {
      label: 'No feedback in past 14 days',
      className: 'overdue',
      lastText: formatDaysAgo(days)
    };
  }

  return {
    label: 'Recent feedback',
    className: 'recent',
    lastText: formatDaysAgo(days)
  };
};

export const getTeamStatusFromSummary = (team) => {
  if (!team.lastFeedbackAt) {
    return {
      label: 'No feedback submitted yet',
      className: 'missing',
      lastText: 'No feedback submitted yet'
    };
  }

  const days = daysSince(team.lastFeedbackAt);

  if (days > 14) {
    return {
      label: 'No feedback in past 14 days',
      className: 'overdue',
      lastText: formatDaysAgo(days)
    };
  }

  return {
    label: 'Recent feedback',
    className: 'recent',
    lastText: formatDaysAgo(days)
  };
};

export const sourceClass = (source) => {
  if (source === 'client') return 'client';
  if (source === 'tutor-to-client') return 'tutor';
  return 'neutral';
};

export const sourceLabel = (source) => {
  if (source === 'client') return 'Client Feedback';
  if (source === 'tutor-to-client') return 'Comment for Client';
  return 'Feedback';
};