import { getAuthToken } from '../utils/auth';

const API_BASE = 'http://localhost:3001/api';

const authHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getTeams = async () => {
  const res = await fetch(`${API_BASE}/teams`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch teams');
  return res.json();
};

export const getTeamById = async (teamId) => {
  const res = await fetch(`${API_BASE}/teams/${teamId}`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch team');
  return res.json();
};

export const addFeedbackToTeam = async (teamId, feedback) => {
  const res = await fetch(`${API_BASE}/teams/${teamId}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(feedback)
  });
  if (!res.ok) throw new Error('Failed to submit feedback');
  return res.json();
};

// ---- Pure display helpers — unchanged, no storage involved ----

export const formatDate = (dateString) => {
  if (!dateString) return 'No date recorded';
  return new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateString));
};

export const daysSince = (dateString) => {
  if (!dateString) return null;
  const today = new Date();
  const date = new Date(dateString);
  const diff = today.setHours(0, 0, 0, 0) - date.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
};

export const latestFeedback = (team) => {
  return [...(team.feedbackHistory || [])]
    .filter((fb) => fb.source === 'client' || fb.source === 'tutor')
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))[0];
};

export const getTeamStatus = (team) => {
  const latest = latestFeedback(team);
  if (!latest) {
    return { label: 'No feedback submitted yet', className: 'missing', lastText: 'No feedback submitted yet' };
  }
  const days = daysSince(latest.submittedAt);
  if (days > 14) {
    return { label: 'No feedback in past 14 days', className: 'overdue', lastText: `${days} days ago` };
  }
  return { label: 'Recent feedback', className: 'recent', lastText: days === 0 ? 'Today' : `${days} days ago` };
};

export const getTeamStatusFromSummary = (team) => {
  if (!team.lastFeedbackAt) {
    return { label: 'No feedback submitted yet', className: 'missing', lastText: 'No feedback submitted yet' };
  }
  const days = daysSince(team.lastFeedbackAt);
  if (days > 14) {
    return { label: 'No feedback in past 14 days', className: 'overdue', lastText: `${days} days ago` };
  }
  return { label: 'Recent feedback', className: 'recent', lastText: days === 0 ? 'Today' : `${days} days ago` };
};

export const sourceClass = (source) => {
  if (source === 'client') return 'client';
  if (source === 'tutor') return 'tutor';
  return 'neutral';
};

export const sourceLabel = (source) => {
  if (source === 'client') return 'Client Feedback';
  if (source === 'tutor') return 'Tutor Feedback';
  if (source === 'tutor-to-client') return 'Tutor Comment for Client';
  return 'Feedback';
};