import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader';
import { getCurrentUser } from '../utils/auth';
import { getUserDisplayName } from '../utils/roleUtils';
import {
  addFeedbackToTeam,
  formatDate,
  getTeamById,
  getTeams,
  getTeamStatus,
  latestFeedback
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

const sortByNewestMeeting = (items = []) => {
  return [...items].sort(
    (a, b) => getMeetingSortValue(b) - getMeetingSortValue(a)
  );
};

const getLatestMeeting = (team) => {
  return sortByNewestMeeting(team.meetings || [])[0] || null;
};

const getLatestClientFeedback = (team) => {
  const feedback = latestFeedback(team);

  if (!feedback) return null;

  return {
    ...feedback,
    meeting: getLatestMeeting(team)
  };
};

const getProductRating = (feedback) => {
  return feedback?.meeting?.productProgressionRating ?? feedback?.productProgressionRating;
};

const getProcessRating = (feedback) => {
  return feedback?.meeting?.processTeamworkRating ?? feedback?.processTeamworkRating;
};

const hasBelowExpectations = (feedback) => {
  return (
    Number(getProductRating(feedback)) === 1 ||
    Number(getProcessRating(feedback)) === 1
  );
};

const hasClientFeedback = (team) => {
  return (team.feedbackHistory || []).some((feedback) => feedback.source === 'client');
};

const getProjectOwnerName = (team) => {
  return cleanText(team.clientName) || 'Not recorded';
};

const getSubmittedByText = (feedback, team) => {
  return (
    cleanText(feedback?.submittedBy) ||
    cleanText(team?.clientName) ||
    'Project Owner'
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

const getTeamAlerts = (team) => {
  const status = getTeamStatus(team);
  const latest = getLatestClientFeedback(team);
  const alerts = [];

  if (!latest) {
    alerts.push({
      id: `${team.id}-missing-feedback`,
      teamId: team.id,
      teamName: team.teamName,
      message: 'No project owner feedback submitted yet'
    });

    return alerts;
  }

  if (status.className === 'overdue') {
    alerts.push({
      id: `${team.id}-overdue-feedback`,
      teamId: team.id,
      teamName: team.teamName,
      message: 'No project owner feedback in the past 14 days'
    });
  }

  if (hasBelowExpectations(latest)) {
    alerts.push({
      id: `${team.id}-below-expectations`,
      teamId: team.id,
      teamName: team.teamName,
      message: 'Below Expectations rating in latest feedback'
    });
  }

  return alerts;
};

const LatestFeedbackSummary = ({ team, feedback }) => (
  <div className="student-feedback-summary-grid">
    <div className="student-feedback-summary-col">
      <p><strong>Team:</strong> {team.teamName}</p>
      <p><strong>Project:</strong> {team.projectName}</p>
      <p><strong>Project Owner:</strong> {getProjectOwnerName(team)}</p>
      <p><strong>Meeting:</strong> {getMeetingText(feedback.meeting)}</p>
    </div>

    <div className="student-feedback-summary-col">
      <p>
        <strong>Product &amp; Progression:</strong>{' '}
        {getRatingText(getProductRating(feedback))}
      </p>

      <p>
        <strong>Process &amp; Teamwork:</strong>{' '}
        {getRatingText(getProcessRating(feedback))}
      </p>

      <p>
        <strong>Team Comment:</strong>{' '}
        {feedback.teamComment || 'No team comment provided.'}
      </p>
    </div>
  </div>
);

const FullSubmissionDetails = ({ team, feedback }) => {
  const individualFeedback = feedback.individualFeedback || [];

  return (
    <div className="qut-details-panel">
      <div className="student-feedback-details-grid">
        <div className="qut-info-box">
          <h4>Meeting Details</h4>
          <p><strong>Team:</strong> {team.teamName}</p>
          <p><strong>Project:</strong> {team.projectName}</p>
          <p><strong>Project Owner:</strong> {getProjectOwnerName(team)}</p>
          <p><strong>Meeting:</strong> {getMeetingText(feedback.meeting)}</p>
        </div>

        <div className="qut-info-box">
          <h4>Team Performance Ratings</h4>

          <p>
            <strong>Product &amp; Progression:</strong>{' '}
            {getRatingText(getProductRating(feedback))}
          </p>

          <p>
            <strong>Process &amp; Teamwork:</strong>{' '}
            {getRatingText(getProcessRating(feedback))}
          </p>

          <p>
            <strong>Team Comment:</strong>{' '}
            {feedback.teamComment || 'No team comment provided.'}
          </p>
        </div>
      </div>

      {individualFeedback.length > 0 && (
        <div className="qut-info-box">
          <h4>Individual Contributions</h4>

          {individualFeedback.map((student) => (
            <div
              key={`${feedback.id}-${student.studentId || student.studentName}`}
              className="qut-student-feedback-line"
            >
              <p><strong>{student.studentName}</strong></p>
              <p><strong>Rating:</strong> {getRatingText(student.score)}</p>
              <p>
                <strong>Comment:</strong>{' '}
                {student.comment || 'No individual comment provided.'}
              </p>
            </div>
          ))}
        </div>
      )}

      {feedback.commentForTutors && (
        <div className="qut-info-box">
          <h4>Private Comment for Tutors / Teaching Staff</h4>
          <p>{feedback.commentForTutors}</p>
        </div>
      )}
    </div>
  );
};

const LatestFeedbackCard = ({
  team,
  feedback,
  isOpen,
  onToggle,
  onViewTimeline
}) => (
  <section className={`qut-card qut-feedback-card student-feedback-card ${isOpen ? 'student-feedback-card-open' : ''}`}>
    <div className="qut-feedback-topline">
      <span className="qut-status client">Client Feedback</span>

      <span className="qut-date-text">
        {formatDate(feedback.submittedAt)} · Submitted by {getSubmittedByText(feedback, team)}
      </span>
    </div>

    {!isOpen && (
      <LatestFeedbackSummary team={team} feedback={feedback} />
    )}

    <div className="client-dashboard-card-actions">
      <button
        className="qut-btn qut-btn-outline"
        onClick={onToggle}
      >
        {isOpen ? 'Close Full Submission' : 'Open Full Submission'}
      </button>

      <button
        className="qut-btn qut-btn-outline"
        onClick={onViewTimeline}
      >
        View Timeline
      </button>
    </div>

    {isOpen && (
      <FullSubmissionDetails team={team} feedback={feedback} />
    )}
  </section>
);

const CommentForClientModal = ({
  team,
  comment,
  error,
  submitting,
  onChange,
  onClose,
  onSubmit
}) => {
  if (!team) return null;

  return (
    <div className="feedback-modal-overlay">
      <section className="feedback-modal-card tutor-comment-modal">
        <div className="feedback-modal-header">
          <div>
            <h2>Comment for Client</h2>
            <p className="tutor-comment-modal-subtitle">
              {team.teamName} - {team.projectName}
            </p>
          </div>

          <button
            type="button"
            className="feedback-modal-close"
            onClick={onClose}
            disabled={submitting}
          >
            ×
          </button>
        </div>

        {error && <p className="auth-error">{error}</p>}

        <form className="tutor-comment-modal-form" onSubmit={onSubmit}>
          <div className="qut-field">
            <label htmlFor="tutorClientComment">Message</label>
            <textarea
              id="tutorClientComment"
              className="qut-textarea tutor-comment-modal-textarea"
              placeholder="Write your message for the client..."
              value={comment}
              onChange={(event) => onChange(event.target.value)}
              required
            />
          </div>

          <div className="tutor-comment-modal-actions">
            <button
              type="button"
              className="qut-btn qut-btn-outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="qut-btn qut-btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Sending...' : 'Send Comment'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

const TutorDashboard = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [teams, setTeams] = useState([]);
  const [latestSummaries, setLatestSummaries] = useState([]);
  const [openItems, setOpenItems] = useState([]);
  const [commentTeam, setCommentTeam] = useState(null);
  const [comment, setComment] = useState('');
  const [commentError, setCommentError] = useState(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getTeams()
      .then(async (summaryTeams) => {
        const fullTeams = await Promise.all(
          summaryTeams.map(async (team) => {
            const [teamDetails, meetings] = await Promise.all([
              getTeamById(team.id),
              getMeetingsByTeam(team.id)
            ]);

            return {
              ...teamDetails,
              meetings: meetings || []
            };
          })
        );

        const summaries = fullTeams
          .map((team) => {
            const feedback = getLatestClientFeedback(team);

            if (!feedback) return null;

            return {
              team,
              feedback
            };
          })
          .filter(Boolean)
          .sort((a, b) => getDateTimeValue(b.feedback.submittedAt) - getDateTimeValue(a.feedback.submittedAt));

        setTeams(fullTeams);
        setLatestSummaries(summaries);
      })
      .catch(() => setError('Could not load your teams. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const toggleOpen = (feedbackId) => {
    setOpenItems((current) => (
      current.includes(feedbackId)
        ? current.filter((id) => id !== feedbackId)
        : [...current, feedbackId]
    ));
  };

  const openCommentModal = (team) => {
    setCommentTeam(team);
    setComment('');
    setCommentError(null);
  };

  const closeCommentModal = () => {
    if (submittingComment) return;

    setCommentTeam(null);
    setComment('');
    setCommentError(null);
  };

  const handleSubmitComment = async (event) => {
    event.preventDefault();

    if (!commentTeam) return;

    if (!comment.trim()) {
      setCommentError('Please write a message before sending.');
      return;
    }

    setSubmittingComment(true);
    setCommentError(null);

    try {
      await addFeedbackToTeam(commentTeam.id, {
        type: 'Comment for Client',
        source: 'tutor-to-client',
        submittedBy: getUserDisplayName(user),
        submittedAt: new Date().toISOString(),
        teamScore: null,
        teamComment: comment.trim(),
        commentForClient: comment.trim(),
        individualFeedback: []
      });

      setCommentTeam(null);
      setComment('');
    } catch (err) {
      setCommentError('Could not send comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="qut-page">
        <DashboardHeader title="Tutor Dashboard" />
        <main className="qut-content">
          <p>Loading...</p>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="qut-page">
        <DashboardHeader title="Tutor Dashboard" />
        <main className="qut-content">
          <p>{error}</p>
        </main>
      </div>
    );
  }

  const alerts = teams.flatMap(getTeamAlerts);

  return (
    <div className="qut-page">
      <DashboardHeader title="Tutor Dashboard" />

      <main className="qut-content">
        <section className="qut-card qut-metric-strip tutor-metric-strip">
          <div className="qut-metric-item">
            <span>Assigned Teams</span>
            <strong>{teams.length}</strong>
          </div>

          <div className="qut-metric-item">
            <span>Project Owner Feedback Received</span>
            <strong>{teams.filter(hasClientFeedback).length}</strong>
          </div>

          <div className="qut-metric-item">
            <span>Needs Attention</span>
            <strong>{alerts.length}</strong>
          </div>
        </section>

        <div className="qut-spacer" />

        <h2 className="qut-section-heading">Alerts</h2>

        <section className="qut-card">
          <div className="qut-alert-list">
            {alerts.length ? alerts.map((alert) => (
              <div className="qut-alert-item tutor-alert-item" key={alert.id}>
                <span>
                  <strong>{alert.teamName}</strong>: {alert.message}
                </span>

                <button
                  className="qut-btn qut-btn-outline qut-btn-sm"
                  onClick={() => navigate(`/feedback-timeline/${alert.teamId}`)}
                >
                  View
                </button>
              </div>
            )) : (
              <p>No urgent alerts right now.</p>
            )}
          </div>
        </section>

        <div className="qut-spacer" />

        <h2 className="qut-section-heading">Assigned Teams</h2>

        <div className="qut-compact-grid">
          {teams.map((team) => {
            const status = getTeamStatus(team);

            return (
              <section className="qut-card tutor-team-card" key={team.id}>
                <div className="client-team-card-header">
                  <div>
                    <h3>{team.teamName}</h3>
                    <p><strong>Project:</strong> {team.projectName}</p>
                    <p><strong>Project Owner:</strong> {getProjectOwnerName(team)}</p>
                    <p><strong>Last feedback:</strong> {status.lastText}</p>
                  </div>

                  <span className={`qut-status ${status.className}`}>
                    {status.label}
                  </span>
                </div>

                <div className="tutor-team-actions">
                  <button
                    className="qut-btn qut-btn-outline"
                    onClick={() => navigate(`/feedback-timeline/${team.id}`)}
                  >
                    View Timeline
                  </button>

                  <button
                    className="qut-btn qut-btn-danger"
                    onClick={() => alert('Issue escalated to Unit Coordinator.')}
                  >
                    Escalate
                  </button>

                  <button
                    className="qut-btn qut-btn-primary tutor-comment-action"
                    onClick={() => openCommentModal(team)}
                  >
                    Comment for Client
                  </button>
                </div>
              </section>
            );
          })}
        </div>

        <div className="qut-spacer" />

        <h2 className="qut-section-heading">Latest Feedback Summary</h2>

        <div className="qut-list-grid">
          {latestSummaries.length ? latestSummaries.map(({ team, feedback }) => {
            const isOpen = openItems.includes(feedback.id);

            return (
              <LatestFeedbackCard
                key={`${team.id}-${feedback.id}`}
                team={team}
                feedback={feedback}
                isOpen={isOpen}
                onToggle={() => toggleOpen(feedback.id)}
                onViewTimeline={() => navigate(`/feedback-timeline/${team.id}`)}
              />
            );
          }) : (
            <section className="qut-card">
              <p>No project owner feedback submitted yet.</p>
            </section>
          )}
        </div>
      </main>

      <CommentForClientModal
        team={commentTeam}
        comment={comment}
        error={commentError}
        submitting={submittingComment}
        onChange={setComment}
        onClose={closeCommentModal}
        onSubmit={handleSubmitComment}
      />
    </div>
  );
};

export default TutorDashboard;