import { getAuthToken } from '../utils/auth';

const API_BASE = 'http://localhost:3001/api';

const authHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Returns meetings visible to the logged-in user (role-scoped server-side:
// clients see meetings they logged, tutors see meetings for their teams,
// students see meetings for their team, staff see everything).
export const getMeetings = async () => {
  const res = await fetch(`${API_BASE}/meetings`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch meetings');
  return res.json();
};

// Returns all meetings logged for a single team, most recent first.
export const getMeetingsByTeam = async (teamId) => {
  const res = await fetch(`${API_BASE}/meetings/team/${teamId}`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch meetings for team');
  return res.json();
};

// Returns a single meeting by id.
export const getMeetingById = async (meetingId) => {
  const res = await fetch(`${API_BASE}/meetings/${meetingId}`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch meeting');
  return res.json();
};

// Logs a new meeting for a team. clientId is set server-side from the
// authenticated user, so it does not need to be (and cannot be) passed in.
// meeting: { teamId, meetingDate, meetingTime, attendance,
//            productProgressionRating, processTeamworkRating }
export const addMeeting = async (meeting) => {
  const res = await fetch(`${API_BASE}/meetings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(meeting)
  });
  if (!res.ok) throw new Error('Failed to submit meeting');
  return res.json();
};

// ---- Pure display helpers ----

export const formatMeetingDate = (dateString) => {
  if (!dateString) return 'No date recorded';
  return new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateString));
};

export const formatMeetingTime = (timeString) => {
  if (!timeString) return '';
  // meeting_time comes back from Postgres as 'HH:MM:SS'
  const [hours, minutes] = timeString.split(':');
  const date = new Date();
  date.setHours(Number(hours), Number(minutes));
  return new Intl.DateTimeFormat('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true }).format(date);
};
