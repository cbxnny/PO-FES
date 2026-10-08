import { useEffect, useState } from 'react';
import DashboardHeader from '../components/DashboardHeader';
import { getCurrentUser } from '../utils/auth';
import {
  alertTutorAboutFeedback,
  getTeams,
  getTeamById,
  formatDate
} from '../data/feedbackApi';
import {
  formatMeetingDate,
  formatMeetingTime,
  getMeetingsByTeam
} from '../data/meetingsApi';
import '../styles/dashboard.css';

const ratingLabels = {
  1: '1 - Below Expectations',
  2: '2 - Meets Expectations',
  3: '3 - Above Expectations'
};

const getRatingText = (rating) => {
  if (rating === null || rating === undefined || rating === '') {
    return 'Not recorded';
  }

  return ratingLabels[Number(rating)] || rating;
};

const cleanText = (value) => {
  if (value === null || value === undefined) return '';

  const cleaned = String(value).trim();
  const lower = cleaned.toLowerCase();

  if (
    !cleaned ||
    lower === 'empty' ||
    lower === 'null' ||
    lower === 'undefined' ||
    lower === 'n/a' ||
    lower === 'na'
  ) {
    return '';
  }

  return cleaned;
};

const isSameId = (a, b) => String(a) === String(b);

const isClientFeedback = (feedback) => feedback?.source === 'client';

const formatAttendance = (attendance) => {
  if (!attendance) return 'Not recorded';

  if (Array.isArray(attendance)) {
    if (!attendance.length) return 'Not recorded';
    if (attendance.includes('All')) return 'All team members attended';
    return attendance.join(', ');
  }

  return String(attendance).trim() || 'Not recorded';
};

const getSubmittedByText = (feedback, team) => {
  return (
    cleanText(feedback?.submittedBy) ||
    cleanText(team?.clientName) ||
    'Project Owner'
  );
};

const getDateTimeValue = (value) => {
  if (!value) return 0;

  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const getMeetingSortValue = (meeting) => {
  if (meeting.createdAt) return getDateTimeValue(meeting.createdAt);

  if (meeting.meetingDate && meeting.meetingTime) {
    return getDateTimeValue(`${meeting.meetingDate}T${meeting.meetingTime}`);
  }

  if (meeting.meetingDate) return getDateTimeValue(meeting.meetingDate);

  return 0;
};

const sortByNewestFeedback = (items = []) => {
  return [...items].sort(
    (a, b) => getDateTimeValue(b.submittedAt) - getDateTimeValue(a.submittedAt)
  );
};

const sortByNewestMeeting = (items = []) => {
  return [...items].sort(
    (a, b) => getMeetingSortValue(b) - getMeetingSortValue(a)
  );
};

const attachMeetingsToFeedback = (feedbackHistory = [], meetings = []) => {
  const sortedFeedback = sortByNewestFeedback(feedbackHistory)
    .filter(isClientFeedback);

  const availableMeetings = sortByNewestMeeting(meetings);

  return sortedFeedback.map((feedback) => {
    const meeting = availableMeetings.shift() || null;
    return { ...feedback, meeting };
  });
};

const getProductRating = (feedback) => {
  return feedback.meeting?.productProgressionRating ?? feedback.productProgressionRating;
};

const getProcessRating = (feedback) => {
  return feedback.meeting?.processTeamworkRating ?? feedback.processTeamworkRating;
};

const hasDomainRatings = (feedback) => {
  const productRating = getProductRating(feedback);
  const processRating = getProcessRating(feedback);

  return (
    productRating !== null &&
    productRating !== undefined &&
    productRating !== ''
  ) || (
    processRating !== null &&
    processRating !== undefined &&
    processRating !== ''
  );
};

const hasOldTeamScore = (feedback) => {
  return (
    feedback.teamScore !== null &&
    feedback.teamScore !== undefined &&
    feedback.teamScore !== ''
  );
};

const getMeetingText = (meeting) => {
  if (!meeting) return 'Not recorded';

  const dateText = meeting.meetingDate
    ? formatMeetingDate(meeting.meetingDate)
    : 'Date not recorded';

  const timeText = meeting.meetingTime
    ? ` at ${formatMeetingTime(meeting.meetingTime)}`
    : '';

  return `${dateText}${timeText}`;
};

const getStudentFeedback = (feedbackItems, userId) => {
  return feedbackItems.map((feedback) => ({
    ...feedback,
    individual: (feedback.individualFeedback || []).find((item) =>
      isSameId(item.studentId, userId)
    )
  }));
};


const getViewerText = (feedback) => {
  const viewers = (feedback.views || [])
    .filter((viewer) => viewer.name)
    .map((viewer) => viewer.name);

  if (!viewers.length) return '';
  return `Viewed by: ${[...new Set(viewers)].join(', ')}`;
};

const FeedbackRatings = ({ feedback }) => {
  if (hasDomainRatings(feedback)) {
    return (
      <>
        <p>
          <strong>Product &amp; Progression:</strong>{' '}
          {getRatingText(getProductRating(feedback))}
        </p>

        <p>
          <strong>Process &amp; Teamwork:</strong>{' '}
          {getRatingText(getProcessRating(feedback))}
        </p>
      </>
    );
  }

  if (hasOldTeamScore(feedback)) {
    return (
      <p>
        <strong>Team Score:</strong> {feedback.teamScore}
      </p>
    );
  }

  return (
    <p>
      <strong>Ratings:</strong> Not recorded
    </p>
  );
};

const StudentFeedbackSummary = ({ feedback, team }) => (
  <div className="student-feedback-summary-grid">
    <div className="student-feedback-summary-col">
      <p><strong>Team:</strong> {team.teamName}</p>
      <p><strong>Project:</strong> {team.projectName}</p>

      <p>
        <strong>Meeting:</strong>{' '}
        {feedback.meeting ? getMeetingText(feedback.meeting) : 'Not recorded'}
      </p>

      <p>
        <strong>Attendance:</strong>{' '}
        {feedback.meeting ? formatAttendance(feedback.meeting.attendance) : 'Not recorded'}
      </p>
    </div>

    <div className="student-feedback-summary-col">
      <FeedbackRatings feedback={feedback} />

      <p>
        <strong>Team Comment:</strong>{' '}
        {feedback.teamComment || 'No team comment provided.'}
      </p>
    </div>
  </div>
);

const StudentFeedbackDetails = ({ feedback }) => (
  <div className="qut-details-panel">
    <div className="student-feedback-details-grid">
      <div className="qut-info-box">
        <h4>Meeting Details</h4>
        <p><strong>Meeting:</strong> {getMeetingText(feedback.meeting)}</p>
        <p><strong>Attendance:</strong> {formatAttendance(feedback.meeting?.attendance)}</p>
      </div>

      <div className="qut-info-box">
        <h4>Team Performance Ratings</h4>
        <FeedbackRatings feedback={feedback} />

        <p>
          <strong>Team Comment:</strong>{' '}
          {feedback.teamComment || 'No team comment provided.'}
        </p>
      </div>
    </div>

    <div className="qut-info-box">
      <h4>Your Individual Feedback</h4>

      {feedback.individual ? (
        <div className="student-feedback-summary-grid">
          <div className="student-feedback-summary-col">
            <p>
              <strong>Individual Rating:</strong>{' '}
              {getRatingText(feedback.individual.score)}
            </p>
          </div>

          <div className="student-feedback-summary-col">
            <p>
              <strong>Individual Comment:</strong>{' '}
              {feedback.individual.comment || 'No individual comment provided.'}
            </p>
          </div>
        </div>
      ) : (
        <p>No individual feedback provided for you in this submission.</p>
      )}
    </div>

    {getViewerText(feedback) && (
      <p className="qut-viewed-line">{getViewerText(feedback)}</p>
    )}
  </div>
);

const PreviousFeedbackCompactSummary = ({ feedback, team }) => (
  <div className="student-feedback-compact-summary">
    <div className="student-feedback-team-project-row">
      <p><strong>Team:</strong> {team.teamName}</p>
      <p><strong>Project:</strong> {team.projectName}</p>
    </div>

    <p className="student-feedback-full-line">
      <strong>Meeting:</strong>{' '}
      {feedback.meeting ? getMeetingText(feedback.meeting) : 'Not recorded'}
    </p>

    <p className="student-feedback-full-line">
      <strong>Attendance:</strong>{' '}
      {feedback.meeting ? formatAttendance(feedback.meeting.attendance) : 'Not recorded'}
    </p>
  </div>
);

const StudentFeedbackCard = ({
  feedback,
  team,
  isOpen,
  onToggle,
  isPrevious = false,
  isAlertOpen,
  alertReason,
  saving,
  onAlertClick,
  onAlertReasonChange,
  onAlertSubmit,
  onAlertCancel
}) => (
  <section className={`qut-card qut-feedback-card student-feedback-card ${isOpen ? 'student-feedback-card-open' : ''}`}>
    <div className="qut-feedback-topline student-feedback-topline">
      <div className="feedback-status-row">
        <span className="qut-status client">
          Client Feedback
        </span>
        <button className="qut-btn qut-btn-outline qut-btn-sm student-alert-mini-btn" onClick={onAlertClick}>
          Alert Tutor
        </button>
      </div>

      <span className="qut-date-text">
        {formatDate(feedback.submittedAt)} · Submitted by {getSubmittedByText(feedback, team)}
      </span>
    </div>

    {!isOpen && (
      isPrevious ? (
        <PreviousFeedbackCompactSummary feedback={feedback} team={team} />
      ) : (
        <StudentFeedbackSummary feedback={feedback} team={team} />
      )
    )}

    <div className="client-dashboard-card-actions feedback-card-actions-wrap">
      <button className="qut-btn qut-btn-outline" onClick={onToggle}>
        {isOpen ? 'Close Full Submission' : 'Open Full Submission'}
      </button>
    </div>

    {getViewerText(feedback) && (
  <p className="qut-viewed-line student-viewed-line">
    {getViewerText(feedback)}
  </p>
)}

    {isAlertOpen && (
      <div className="qut-alert-form">
        <textarea
          className="qut-textarea"
          placeholder="Write why you want your tutor to review this feedback..."
          value={alertReason}
          onChange={(event) => onAlertReasonChange(event.target.value)}
        />
        <div className="qut-button-row">
          <button className="qut-btn qut-btn-primary" onClick={onAlertSubmit} disabled={saving}>
            {saving ? 'Sending...' : 'Send Alert'}
          </button>
          <button className="qut-btn qut-btn-outline" onClick={onAlertCancel}>Cancel</button>
        </div>
      </div>
    )}

    {isOpen && <StudentFeedbackDetails feedback={feedback} />}
  </section>
);

const StudentDashboard = () => {
  const user = getCurrentUser();

  const [team, setTeam] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [openItems, setOpenItems] = useState([]);
  const [alertingId, setAlertingId] = useState(null);
  const [alertReason, setAlertReason] = useState('');
  const [savingAlertId, setSavingAlertId] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStudentTeam = () => getTeams()
      .then((teams) => {
        if (!teams.length) {
          setLoading(false);
          return null;
        }

        return Promise.all([
          getTeamById(teams[0].id),
          getMeetingsByTeam(teams[0].id)
        ]);
      })
      .then((result) => {
        if (!result) return;

        const [teamData, meetingsData] = result;
        setTeam(teamData);
        setMeetings(meetingsData || []);
      })
;

  useEffect(() => {
    loadStudentTeam()
      .catch(() => setError('Could not load your team. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const toggleOpen = (feedbackId) => {
    setOpenItems((current) => (
      current.includes(feedbackId)
        ? current.filter((id) => id !== feedbackId)
        : [...current, feedbackId]
    ));
  };


  const handleSendAlert = async (feedback) => {
    if (!team || !alertReason.trim()) {
      setActionMessage('Please write a short reason before sending the alert.');
      return;
    }

    setSavingAlertId(feedback.id);
    setActionMessage(null);

    try {
      await alertTutorAboutFeedback(team.id, feedback.id, alertReason.trim());
      await loadStudentTeam();
      setAlertingId(null);
      setAlertReason('');
      setActionMessage('Tutor alert sent.');
    } catch (err) {
      setActionMessage(err.message || 'Could not send tutor alert.');
    } finally {
      setSavingAlertId(null);
    }
  };

  if (loading) {
    return (
      <div className="qut-page">
        <DashboardHeader title="Student Dashboard" />
        <main className="qut-content">
          <h2 className="qut-section-heading">Latest Feedback</h2>
          <section className="qut-skeleton-card">
            <span className="qut-skeleton qut-skeleton-line qut-skeleton-short" />
            <span className="qut-skeleton qut-skeleton-line qut-skeleton-title" />
            <span className="qut-skeleton qut-skeleton-line" />
            <span className="qut-skeleton qut-skeleton-line qut-skeleton-short" />
          </section>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="qut-page">
        <DashboardHeader title="Student Dashboard" />

        <main className="qut-content">
          <p>{error}</p>
        </main>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="qut-page">
        <DashboardHeader title="Student Dashboard" />

        <main className="qut-content">
          <p>You are not currently assigned to a team.</p>
        </main>
      </div>
    );
  }

  const feedbackWithMeetings = attachMeetingsToFeedback(team.feedbackHistory || [], meetings);
  const feedbackItems = getStudentFeedback(feedbackWithMeetings, user.id);

  const latestFeedback = feedbackItems[0];
  const previousFeedback = feedbackItems.slice(1);

  return (
    <div className="qut-page">
      <DashboardHeader title="Student Dashboard" />

      <main className="qut-content">
        <h2 className="qut-section-heading">Latest Feedback</h2>

        {actionMessage && <p className="qut-inline-message">{actionMessage}</p>}

        {latestFeedback ? (
          <StudentFeedbackCard
            feedback={latestFeedback}
            team={team}
            isOpen={openItems.includes(latestFeedback.id)}
            onToggle={() => toggleOpen(latestFeedback.id)}
            isAlertOpen={alertingId === latestFeedback.id}
            alertReason={alertReason}
            saving={savingAlertId === latestFeedback.id}
            onAlertClick={() => setAlertingId(alertingId === latestFeedback.id ? null : latestFeedback.id)}
            onAlertReasonChange={setAlertReason}
            onAlertSubmit={() => handleSendAlert(latestFeedback)}
            onAlertCancel={() => { setAlertingId(null); setAlertReason(''); }}
          />
        ) : (
          <section className="qut-card">
            <p>No feedback submitted yet.</p>
          </section>
        )}

        <div className="qut-spacer" />

        <h2 className="qut-section-heading">Previous Feedback</h2>

        <div className="qut-list-grid">
          {previousFeedback.length ? previousFeedback.map((feedback) => (
            <StudentFeedbackCard
              key={feedback.id}
              feedback={feedback}
              team={team}
              isOpen={openItems.includes(feedback.id)}
              onToggle={() => toggleOpen(feedback.id)}
              isPrevious
              isAlertOpen={alertingId === feedback.id}
              alertReason={alertReason}
              saving={savingAlertId === feedback.id}
              onAlertClick={() => setAlertingId(alertingId === feedback.id ? null : feedback.id)}
              onAlertReasonChange={setAlertReason}
              onAlertSubmit={() => handleSendAlert(feedback)}
              onAlertCancel={() => { setAlertingId(null); setAlertReason(''); }}
            />
          )) : (
            <section className="qut-card">
              <p>No previous feedback yet.</p>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;