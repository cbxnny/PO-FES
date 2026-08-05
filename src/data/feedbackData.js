/**
 * feedbackData.js
 *
 * In-browser data layer for the PO-FES frontend prototype.
 * Teams and feedback are persisted in localStorage so that feedback
 * submitted during a session survives a page refresh without needing
 * a backend connection.
 *
 * When the backend is wired up, replace getTeams / saveTeams / addFeedbackToTeam
 * with API calls and remove the localStorage references.
 */

const STORAGE_KEY = 'po_fes_frontend_feedback_data_v1';

// ---------------------------------------------------------------------------
// Default / seed data
// ---------------------------------------------------------------------------

export const DEFAULT_TEAMS = [
  {
    id: 1,
    teamName: 'Team Alpha',
    projectName: 'Smart Booking System',
    clientName: 'Maya Patel',
    tutorName: 'Liam Chen',
    students: ['Alex Johnson', 'Jamie Lee', 'Sara Rivera'],
    escalated: false,
    unit: 'IFB398',
    feedbackHistory: [
      {
        id: 101,
        type: 'Client Feedback',
        source: 'client',
        submittedBy: 'Maya Patel',
        submittedAt: '2026-05-29',
        teamScore: 4.2,
        teamComment: 'Great communication and timely delivery of milestones.',
        commentForTutors: 'Team is reliable. Please keep checking documentation quality.',
        individualFeedback: [
          { studentName: 'Alex Johnson', score: 3.8, comment: 'Could improve on documentation clarity.' },
          { studentName: 'Jamie Lee',    score: 4.4, comment: 'Strong technical work and consistent contribution.' },
          { studentName: 'Sara Rivera',  score: 4.1, comment: 'Good communication and design contribution.' }
        ]
      },
      {
        id: 102,
        type: 'Tutor Feedback',
        source: 'tutor',
        submittedBy: 'Liam Chen',
        submittedAt: '2026-05-30',
        teamScore: 4.0,
        teamComment: 'Good progress this week. Make sure the report clearly explains each member contribution.',
        commentForClient: 'Team is on track. I will monitor documentation quality before the next check-in.',
        individualFeedback: [
          { studentName: 'Alex Johnson', score: 3.9, comment: 'Good effort. Add clearer evidence of individual contribution.' },
          { studentName: 'Jamie Lee',    score: 4.2, comment: 'Consistent technical input and teamwork.' },
          { studentName: 'Sara Rivera',  score: 4.0, comment: 'Good participation and reliable updates.' }
        ]
      }
    ]
  },
  {
    id: 2,
    teamName: 'Team Beta',
    projectName: 'AI Shopping Assistant',
    clientName: 'Maya Patel',
    tutorName: 'Liam Chen',
    students: ['Nina Khan', 'Daniel Park'],
    escalated: false,
    unit: 'IFB398',
    feedbackHistory: [
      {
        id: 201,
        type: 'Client Feedback',
        source: 'client',
        submittedBy: 'Maya Patel',
        submittedAt: '2026-05-14',
        teamScore: 3.5,
        teamComment: 'Progress is okay, but documentation needs improvement.',
        commentForTutors: 'Client seems slightly concerned about communication.',
        individualFeedback: [
          { studentName: 'Nina Khan',   score: 3.7, comment: 'Good ideas but needs clearer updates.' },
          { studentName: 'Daniel Park', score: 3.4, comment: 'Needs to communicate blockers earlier.' }
        ]
      }
    ]
  },
  {
    id: 3,
    teamName: 'Team Gamma',
    projectName: 'Rental Search App',
    clientName: 'Client W',
    tutorName: 'Liam Chen',
    students: ['Chris Wong', 'Amelia Tran'],
    escalated: true,
    unit: 'IFB399',
    feedbackHistory: []
  },
  {
    id: 4,
    teamName: 'Team Epsilon',
    projectName: 'Cybersecurity Dashboard',
    clientName: 'Client A',
    tutorName: 'Liam Chen',
    students: ['Owen Smith', 'Riya Shah'],
    escalated: true,
    unit: 'IFB399',
    feedbackHistory: [
      {
        id: 401,
        type: 'Client Feedback',
        source: 'client',
        submittedBy: 'Client A',
        submittedAt: '2026-05-10',
        teamScore: 2.4,
        teamComment: 'Team has missed several updates and progress is unclear.',
        commentForTutors: 'Needs staff follow-up.',
        individualFeedback: [
          { studentName: 'Owen Smith', score: 2.7, comment: 'Contribution is unclear from current evidence.' },
          { studentName: 'Riya Shah',  score: 2.5, comment: 'Needs more consistent communication.' }
        ]
      }
    ]
  }
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Deep-clones the default data so mutations never affect the source object. */
const cloneDefaultData = () => JSON.parse(JSON.stringify(DEFAULT_TEAMS));

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

/**
 * Returns all teams from localStorage, seeding with DEFAULT_TEAMS on first run.
 * @returns {Array} Array of team objects.
 */
export const getTeams = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved);

  const initialData = cloneDefaultData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
  return initialData;
};

/**
 * Persists the full teams array to localStorage.
 * @param {Array} teams - Updated teams array.
 */
export const saveTeams = (teams) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(teams));
};

/**
 * Finds a team by its numeric ID.
 * Falls back to the first team if no match is found (so pages never crash on
 * a bad or missing teamId param).
 * @param {string|number} teamId
 * @returns {Object} Team object.
 */
export const getTeamById = (teamId) => {
  const numericId = Number(teamId);
  const teams = getTeams();
  return teams.find((team) => team.id === numericId) || teams[0];
};

/**
 * Appends a new feedback entry to the specified team's history.
 * The submission date and a unique ID are added automatically.
 * Does nothing if the teamId is not found.
 *
 * @param {string|number} teamId - ID of the team to update.
 * @param {Object} feedback - Feedback data (type, source, submittedBy, etc.)
 */
export const addFeedbackToTeam = (teamId, feedback) => {
  const teams = getTeams();
  const numericId = Number(teamId);
  const teamIndex = teams.findIndex((team) => team.id === numericId);

  if (teamIndex === -1) return;

  teams[teamIndex].feedbackHistory.push({
    id: Date.now(),
    submittedAt: new Date().toISOString().slice(0, 10),
    individualFeedback: [],
    ...feedback
  });

  saveTeams(teams);
};

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

/**
 * Formats an ISO date string to a human-readable Australian date.
 * e.g. "2026-05-29" → "29 May 2026"
 * @param {string} dateString - ISO date string (YYYY-MM-DD).
 * @returns {string}
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'No date recorded';

  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(dateString));
};

/**
 * Returns the number of whole days elapsed since the given date.
 * Compares date-only (midnight) so the time component is ignored.
 * Returns null if no date string is provided.
 * @param {string} dateString - ISO date string.
 * @returns {number|null}
 */
export const daysSince = (dateString) => {
  if (!dateString) return null;

  const today = new Date();
  const date = new Date(dateString);
  // Zero out times before subtracting to get a clean day diff
  const diff = today.setHours(0, 0, 0, 0) - date.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
};

/**
 * Returns the most recent client or tutor feedback for a team, or undefined
 * if no feedback has been submitted yet.
 * @param {Object} team
 * @returns {Object|undefined}
 */
export const latestFeedback = (team) => {
  return [...(team.feedbackHistory || [])]
    .filter((feedback) => feedback.source === 'client' || feedback.source === 'tutor')
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))[0];
};

/**
 * Derives a status object for a team based on how recently feedback was submitted.
 * Used to drive status badges and alert logic across all dashboards.
 *
 * @param {Object} team
 * @returns {{ label: string, className: 'recent'|'overdue'|'missing', lastText: string }}
 */
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
      lastText: `${days} days ago`
    };
  }

  return {
    label: 'Recent feedback',
    className: 'recent',
    lastText: days === 0 ? 'Today' : `${days} days ago`
  };
};

/**
 * Maps a feedback source string to its CSS modifier class.
 * Used for colouring status badges on feedback cards.
 * @param {'client'|'tutor'|string} source
 * @returns {string}
 */
export const sourceClass = (source) => {
  if (source === 'client') return 'client';
  if (source === 'tutor') return 'tutor';
  return 'neutral';
};

/**
 * Maps a feedback source string to a human-readable label.
 * @param {'client'|'tutor'|'tutor-to-client'|string} source
 * @returns {string}
 */
export const sourceLabel = (source) => {
  if (source === 'client') return 'Client Feedback';
  if (source === 'tutor') return 'Tutor Feedback';
  if (source === 'tutor-to-client') return 'Tutor Comment for Client';
  return 'Feedback';
};
