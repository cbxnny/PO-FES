import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import BackButton from '../components/BackButton';
import DashboardHeader from '../components/DashboardHeader';
import { getCurrentUser } from '../utils/auth';
import { normalizeRole } from '../utils/roleUtils';
import {
  formatDate,
  getTeamById,
  getTeamStatus
} from '../data/feedbackApi';
import {
  formatMeetingDate,
  formatMeetingTime,
  getMeetingsByTeam
} from '../data/meetingsApi';
import '../styles/dashboard.css';
import { SkeletonGrid } from '../components/SkeletonCard';

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

const getSourceKey = (source = '') => {
  return String(source).trim().toLowerCase().replaceAll('_', '-');
};

const getTypeKey = (type = '') => {
  return String(type).trim().toLowerCase();
};

const isClientFeedback = (feedback) => {
  return getSourceKey(feedback.source) === 'client';
};

const isTutorClientComment = (feedback) => {
  const source = getSourceKey(feedback.source);
  const type = getTypeKey(feedback.type);

  return (
    ['tutor-to-client', 'client-comment', 'comment-for-client'].includes(source) ||
    type.includes('comment for client')
  );
};

const canSeeTutorClientComment = (user) => {
  const role = normalizeRole(user?.role);
  return role !== 'student';
};

const shouldShowTimelineItem = (feedback, user) => {
  if (isClientFeedback(feedback)) return true;

  if (isTutorClientComment(feedback)) {
    return canSeeTutorClientComment(user);
  }

  return false;
};

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
  const submittedBy = cleanText(feedback.submittedBy);

  if (submittedBy) {
    return submittedBy;
  }

  if (isClientFeedback(feedback)) {
    return cleanText(team?.clientName) || 'Client';
  }

  if (isTutorClientComment(feedback)) {
    return 'Tutor';
  }

  return 'Unknown';
};

const isSameId = (a, b) => String(a) === String(b);

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

const attachMeetingsToFeedback = (feedbackHistory = [], meetings = [], user) => {
  const sortedFeedback = sortByNewestFeedback(feedbackHistory)
    .filter((feedback) => shouldShowTimelineItem(feedback, user));

  const availableMeetings = sortByNewestMeeting(meetings);

  return sortedFeedback.map((feedback) => {
    if (!isClientFeedback(feedback)) {
      return { ...feedback, meeting: null };
    }

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

const getTutorCommentText = (feedback) => {
  return (
    cleanText(feedback.commentForClient) ||
    cleanText(feedback.teamComment) ||
    cleanText(feedback.comment) ||
    'No comment provided.'
  );
};

const getFeedbackBadgeText = (feedback) => {
  if (isClientFeedback(feedback)) return 'Client Feedback';
  if (isTutorClientComment(feedback)) return 'Comment for Client';
  return 'Feedback';
};

const getFeedbackBadgeClass = (feedback) => {
  if (isClientFeedback(feedback)) return 'client';
  if (isTutorClientComment(feedback)) return 'tutor';
  return '';
};

const getStudentName = (student) => {
  if (typeof student === 'string') return cleanText(student);

  const fullName = cleanText(
    student.name ||
    student.fullName ||
    student.full_name ||
    student.studentName ||
    student.student_name
  );

  if (fullName) return fullName;

  const firstName = cleanText(student.firstName || student.firstname || student.first_name);
  const lastName = cleanText(student.lastName || student.lastname || student.last_name);

  const combinedName = `${firstName} ${lastName}`.trim();

  if (combinedName) return combinedName;

  return cleanText(student.email) || '';
};

const getTeamMembers = (team) => {
  const possibleMembers = (
    team.students ||
    team.members ||
    team.teamMembers ||
    team.team_members ||
    team.studentNames ||
    []
  );

  if (!Array.isArray(possibleMembers)) return [];

  return possibleMembers
    .map(getStudentName)
    .filter(Boolean);
};

const FeedbackRatingsSummary = ({ feedback }) => {
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

const ClientFeedbackSummary = ({ feedback }) => {
  const meeting = feedback.meeting;

  return (
    <>
      <p>
        <strong>Meeting:</strong> {getMeetingText(meeting)}
      </p>

      <p>
        <strong>Attendance:</strong> {formatAttendance(meeting?.attendance)}
      </p>

      <FeedbackRatingsSummary feedback={feedback} />

      <p>
        <strong>Team Comment:</strong>{' '}
        {feedback.teamComment || 'No team comment provided.'}
      </p>
    </>
  );
};

const TutorCommentSummary = ({ feedback }) => (
  <p>
    <strong>Message:</strong> {getTutorCommentText(feedback)}
  </p>
);

const FullSubmissionDetails = ({ feedback, user }) => {
  const role = normalizeRole(user?.role);
  const isStudent = role === 'student';

  const canSeePrivateTutorComment = !isStudent;

  const meeting = feedback.meeting;
  const individualFeedback = feedback.individualFeedback || [];

  const visibleIndividualFeedback = isStudent
    ? individualFeedback.filter((item) => isSameId(item.studentId, user?.id))
    : individualFeedback;

  return (
    <div className="qut-details-panel">
      <div className="student-feedback-details-grid">
        <div className="qut-info-box">
          <h4>Meeting Details</h4>
          <p>
            <strong>Meeting:</strong> {getMeetingText(meeting)}
          </p>
          <p>
            <strong>Attendance:</strong> {formatAttendance(meeting?.attendance)}
          </p>
        </div>

        <div className="qut-info-box">
          <h4>Team Performance Ratings</h4>

          <FeedbackRatingsSummary feedback={feedback} />

          <p>
            <strong>Team Comment:</strong>{' '}
            {feedback.teamComment || 'No team comment provided.'}
          </p>
        </div>
      </div>

      {visibleIndividualFeedback.length > 0 && (
        <div className="qut-info-box">
          <h4>Individual Contributions</h4>

          {visibleIndividualFeedback.map((student) => (
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

      {canSeePrivateTutorComment && feedback.commentForTutors && (
        <div className="qut-info-box">
          <h4>Private Comment for Tutors / Teaching Staff</h4>
          <p>{feedback.commentForTutors}</p>
        </div>
      )}
    </div>
  );
};

const TutorCommentDetails = ({ feedback, team }) => (
  <div className="qut-details-panel">
    <div className="qut-info-box">
      <h4>Comment for Client</h4>
      <p><strong>Team:</strong> {team.teamName}</p>
      <p><strong>Project:</strong> {team.projectName}</p>
      <p><strong>Submitted by:</strong> {getSubmittedByText(feedback, team)}</p>
      <p><strong>Message:</strong> {getTutorCommentText(feedback)}</p>
    </div>
  </div>
);

const TeamOverviewCard = ({ team, status }) => {
  const teamMembers = getTeamMembers(team);

  return (
    <section className="qut-card timeline-team-card">
  <div className="timeline-team-card-header">
    <div className="timeline-team-card-main">
      <h2>{team.teamName} - {team.projectName}</h2>

      <div className="timeline-team-meta">
        <p><strong>Tutor:</strong> {team.tutorName || 'Not recorded'}</p>
        <p><strong>Last feedback:</strong> {status.lastText}</p>
      </div>

      <div className="timeline-team-members-inline">
        <p>
          <strong>Team Members:</strong>{' '}
{teamMembers.length ? teamMembers.join(', ') : 'Not recorded'}
        </p>
      </div>
    </div>

    <span className={`qut-status ${status.className}`}>{status.label}</span>
  </div>
</section>
  );
};

const FeedbackTimeline = () => {
  const { teamId } = useParams();
  const [openItems, setOpenItems] = useState([]);
  const [team, setTeam] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const user = getCurrentUser();

  useEffect(() => {
    Promise.all([
      getTeamById(teamId),
      getMeetingsByTeam(teamId)
    ])
      .then(([teamData, meetingsData]) => {
        setTeam(teamData);
        setMeetings(meetingsData || []);
      })
      .catch(() => setError('Could not load this team. Please try again.'))
      .finally(() => setLoading(false));
  }, [teamId]);

  const toggleOpen = (feedbackId) => {
    setOpenItems((current) => (
      current.includes(feedbackId)
        ? current.filter((id) => id !== feedbackId)
        : [...current, feedbackId]
    ));
  };

  if (loading) return (
    <div className="qut-page">
      <DashboardHeader title="Feedback Timeline" />
      <main className="qut-content">
        <section className="qut-skeleton-card" style={{ marginBottom: 22 }}>
          <span className="qut-skeleton qut-skeleton-line qut-skeleton-title" />
          <span className="qut-skeleton qut-skeleton-line" />
          <span className="qut-skeleton qut-skeleton-line qut-skeleton-short" />
        </section>
        <h2 className="qut-section-heading">Feedback Timeline</h2>
        <SkeletonGrid count={2} variant="feedback" gridClass="qut-list-grid" />
      </main>
    </div>
  );

  if (error || !team) return <div className="qut-page"><DashboardHeader title="Feedback Timeline" /><main className="qut-content"><p>{error || 'Team not found.'}</p></main></div>;

  const status = getTeamStatus(team);
  const feedbackItems = attachMeetingsToFeedback(team.feedbackHistory || [], meetings, user);

  return (
    <div className="qut-page">
      <DashboardHeader title="Feedback Timeline" />

      <main className="qut-content">
        <BackButton />

        <div className="qut-spacer" />

        <TeamOverviewCard team={team} status={status} />

        <div className="qut-spacer" />

        <h2 className="qut-section-heading">Feedback Timeline</h2>

        <div className="qut-list-grid">
          {feedbackItems.length ? feedbackItems.map((feedback) => {
            const isOpen = openItems.includes(feedback.id);
            const isClient = isClientFeedback(feedback);
            const isTutorComment = isTutorClientComment(feedback);

            return (
              <section
                className={`qut-card qut-feedback-card student-feedback-card ${isOpen ? 'student-feedback-card-open' : ''}`}
                key={feedback.id}
              >
                <div className="qut-feedback-topline">
                  <span className={`qut-status ${getFeedbackBadgeClass(feedback)}`}>
                    {getFeedbackBadgeText(feedback)}
                  </span>

                  <span className="qut-date-text">
                    {formatDate(feedback.submittedAt)} · Submitted by{' '}
                    {getSubmittedByText(feedback, team)}
                  </span>
                </div>

                {!isOpen && isClient && (
                  <ClientFeedbackSummary feedback={feedback} />
                )}

                {!isOpen && isTutorComment && (
                  <TutorCommentSummary feedback={feedback} />
                )}

                <button
                  className="qut-btn qut-btn-outline student-feedback-btn"
                  onClick={() => toggleOpen(feedback.id)}
                >
                  {isClient
                    ? (isOpen ? 'Close Full Submission' : 'Open Full Submission')
                    : (isOpen ? 'Close Comment' : 'Open Comment')}
                </button>

                {isOpen && isClient && (
                  <FullSubmissionDetails feedback={feedback} user={user} />
                )}

                {isOpen && isTutorComment && (
                  <TutorCommentDetails feedback={feedback} team={team} />
                )}
              </section>
            );
          }) : (
            <section className="qut-card">
              <p>No feedback submitted yet.</p>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default FeedbackTimeline;