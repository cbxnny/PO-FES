import { authFetch } from '../utils/auth';

const API_BASE = import.meta.env.VITE_API_URL;

const getErrorMessage = async (res, fallback) => {
  const data = await res.json().catch(() => ({}));
  return data.error || fallback;
};

const readJson = async (res) => {
  if (res.status === 204) return null;
  return res.json().catch(() => ({}));
};

export const getTeams = async () => {
  const res = await authFetch(`${API_BASE}/teams`);

  if (!res.ok) {
    throw new Error(await getErrorMessage(res, 'Failed to fetch teams'));
  }

  return res.json();
};

export const getTeamById = async (teamId) => {
  const res = await authFetch(`${API_BASE}/teams/${teamId}`);

  if (!res.ok) {
    throw new Error(await getErrorMessage(res, 'Failed to fetch team'));
  }

  return res.json();
};

export const addFeedbackToTeam = async (teamId, feedback) => {
  const res = await authFetch(`${API_BASE}/teams/${teamId}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(feedback)
  });

  if (!res.ok) {
    throw new Error(await getErrorMessage(res, 'Failed to submit feedback'));
  }

  return res.json();
};

export const escalateTeam = async (teamId, note, target = undefined, feedbackId = undefined) => {
  const res = await authFetch(`${API_BASE}/teams/${teamId}/escalate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note, target, feedbackId })
  });

  if (!res.ok) {
    throw new Error(await getErrorMessage(res, 'Failed to escalate team.'));
  }

  return res.json();
};

export const updateFeedback = async (teamId, feedbackId, feedback) => {
  const res = await authFetch(`${API_BASE}/teams/${teamId}/feedback/${feedbackId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(feedback)
  });

  if (!res.ok) {
    throw new Error(await getErrorMessage(res, 'Failed to update feedback.'));
  }

  return readJson(res);
};

export const removeFeedback = async (teamId, feedbackId) => {
  const res = await authFetch(`${API_BASE}/teams/${teamId}/feedback/${feedbackId}`, {
    method: 'DELETE'
  });

  if (!res.ok) {
    throw new Error(await getErrorMessage(res, 'Failed to remove feedback.'));
  }

  return readJson(res);
};

export const escalateIssue = async (
  teamId,
  { target = 'coordinator', note = '', feedbackId = null } = {}
) => {
  const res = await authFetch(`${API_BASE}/teams/${teamId}/escalations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target, note, feedbackId })
  });

  if (!res.ok) {
    throw new Error(await getErrorMessage(res, 'Failed to escalate issue.'));
  }

  return res.json();
};

export const resolveEscalation = async (teamId, escalationId) => {
  const res = await authFetch(`${API_BASE}/teams/${teamId}/escalations/${escalationId}/resolve`, {
    method: 'PATCH'
  });

  if (!res.ok) {
    throw new Error(await getErrorMessage(res, 'Failed to resolve escalation.'));
  }

  return readJson(res);
};

export const resolveActiveEscalations = async (teamId) => {
  const res = await authFetch(`${API_BASE}/teams/${teamId}/escalations/resolve-active`, {
    method: 'PATCH'
  });

  if (!res.ok) {
    throw new Error(await getErrorMessage(res, 'Failed to resolve active escalations.'));
  }

  return readJson(res);
};

export const markFeedbackViewed = async (teamId, feedbackId) => {
  const res = await authFetch(`${API_BASE}/teams/${teamId}/feedback/${feedbackId}/viewed`, {
    method: 'POST'
  });

  if (!res.ok) {
    throw new Error(await getErrorMessage(res, 'Failed to mark feedback as viewed.'));
  }

  return readJson(res);
};

export const alertTutorAboutFeedback = async (teamId, feedbackId, reason) => {
  const res = await authFetch(`${API_BASE}/teams/${teamId}/feedback/${feedbackId}/alert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason })
  });

  if (!res.ok) {
    throw new Error(await getErrorMessage(res, 'Failed to alert tutor about feedback.'));
  }

  return readJson(res);
};

export const resolveFeedbackAlert = async (teamId, alertId) => {
  const res = await authFetch(`${API_BASE}/teams/${teamId}/feedback-alerts/${alertId}/resolve`, {
    method: 'PATCH'
  });

  if (!res.ok) {
    throw new Error(await getErrorMessage(res, 'Failed to resolve feedback alert.'));
  }

  return readJson(res);
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