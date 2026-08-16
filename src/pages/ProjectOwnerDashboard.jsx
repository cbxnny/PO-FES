import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader';
import {
  formatDate,
  getTeamById,
  getTeams,
  getTeamStatusFromSummary
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

const formatAttendance = (attendance) => {
  if (!attendance) return 'Not recorded';

  if (Array.isArray(attendance)) {
    if (!attendance.length) return 'Not recorded';
    if (attendance.includes('All')) return 'All team members attended';
    return attendance.join(', ');
  }

  return String(attendance).trim() || 'Not recorded';
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

const attachMeetingsToClientFeedback = (feedbackHistory = [], meetings = []) => {
  const clientFeedback = sortByNewestFeedback(feedbackHistory)
    .filter((feedback) => feedback.source === 'client');

  const availableMeetings = sortByNewestMeeting(meetings);

  return clientFeedback.map((feedback) => {
    const meeting = availableMeetings.shift() || null;
    return { ...feedback, meeting };
  });
};

const getProductRating = (submission) => {
  return submission.meeting?.productProgressionRating ?? submission.productProgressionRating;
};

const getProcessRating = (submission) => {
  return submission.meeting?.processTeamworkRating ?? submission.processTeamworkRating;
};

const hasDomainRatings = (submission) => {
  const productRating = getProductRating(submission);
  const processRating = getProcessRating(submission);

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

const hasOldTeamScore = (submission) => {
  return (
    submission.teamScore !== null &&
    submission.teamScore !== undefined &&
    submission.teamScore !== ''
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

const getSubmittedByText = (submission) => {
  if (submission.submittedBy && String(submission.submittedBy).trim()) {
    return submission.submittedBy;
  }

  return submission.clientName || 'Client';
};

const getTutorCommentText = (comment) => {
  return (
    comment.commentForClient ||
    comment.teamComment ||
    comment.comment ||
    'No comment provided.'
  );
};

const getTutorSubmittedByText = (comment) => {
  if (comment.submittedBy && String(comment.submittedBy).trim()) {
    return comment.submittedBy;
  }

  return 'Tutor';
};

const SubmissionRatings = ({ submission }) => {
  if (hasDomainRatings(submission)) {
    return (
      <>
        <p>
          <strong>Product &amp; Progression:</strong>{' '}
          {getRatingText(getProductRating(submission))}
        </p>
        <p>
          <strong>Process &amp; Teamwork:</strong>{' '}
          {getRatingText(getProcessRating(submission))}
        </p>
      </>
    );
  }

  if (hasOldTeamScore(submission)) {
    return (
      <p>
        <strong>Team Score:</strong> {submission.teamScore}
      </p>
    );
  }

  return (
    <p>
      <strong>Ratings:</strong> Not recorded
    </p>
  );
};

const LatestFeedbackSummary = ({ submission }) => (
  <div className="student-feedback-summary-grid">
    <div className="student-feedback-summary-col">
      <p><strong>Team:</strong> {submission.teamName}</p>
      <p><strong>Project:</strong> {submission.projectName}</p>
      <p><strong>Meeting:</strong> {getMeetingText(submission.meeting)}</p>
      <p><strong>Attendance:</strong> {formatAttendance(submission.meeting?.attendance)}</p>
    </div>

    <div className="student-feedback-summary-col">
      <SubmissionRatings submission={submission} />
      <p>
        <strong>Team Comment:</strong>{' '}
        {submission.teamComment || 'No team comment provided.'}
      </p>
    </div>
  </div>
);

const FullSubmissionDetails = ({ submission }) => (
  <div className="qut-details-panel">
    <div className="student-feedback-details-grid">
      <div className="qut-info-box">
        <h4>Meeting Details</h4>
        <p><strong>Meeting:</strong> {getMeetingText(submission.meeting)}</p>
        <p><strong>Attendance:</strong> {formatAttendance(submission.meeting?.attendance)}</p>
      </div>

      <div className="qut-info-box">
        <h4>Team Performance Ratings</h4>
        <SubmissionRatings submission={submission} />
        <p>
          <strong>Team Comment:</strong>{' '}
          {submission.teamComment || 'No team comment provided.'}
        </p>
      </div>
    </div>

    {submission.individualFeedback?.length > 0 && (
      <div className="qut-info-box">
        <h4>Individual Contributions</h4>

        {submission.individualFeedback.map((student) => (
          <div
            key={`${submission.id}-${student.studentId || student.studentName}`}
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

    {submission.commentForTutors && (
      <div className="qut-info-box">
        <h4>Private Comment for Tutors / Teaching Staff</h4>
        <p>{submission.commentForTutors}</p>
      </div>
    )}
  </div>
);

const TutorCommentSummary = ({ comment }) => (
  <div className="student-feedback-compact-summary">
    <div className="student-feedback-team-project-row">
      <p><strong>Team:</strong> {comment.teamName}</p>
      <p><strong>Project:</strong> {comment.projectName}</p>
    </div>

    <p className="student-feedback-full-line">
      <strong>Message:</strong> {getTutorCommentText(comment)}
    </p>
  </div>
);

const TutorCommentDetails = ({ comment }) => (
  <div className="qut-details-panel">
    <div className="qut-info-box">
      <h4>Comment for Client</h4>
      <p><strong>Team:</strong> {comment.teamName}</p>
      <p><strong>Project:</strong> {comment.projectName}</p>
      <p><strong>Submitted by:</strong> {getTutorSubmittedByText(comment)}</p>
      <p><strong>Message:</strong> {getTutorCommentText(comment)}</p>
    </div>
  </div>
);

const ProjectOwnerDashboard = () => {
  const navigate = useNavigate();

  const [teams, setTeams] = useState([]);
  const [latestSubmissions, setLatestSubmissions] = useState([]);
  const [tutorComments, setTutorComments] = useState([]);
  const [openItems, setOpenItems] = useState([]);
  const [openComments, setOpenComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getTeams()
      .then(async (teamSummaries) => {
        setTeams(teamSummaries);

        const fullTeams = await Promise.all(
          teamSummaries.map(async (team) => {
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

        const latestFeedbackByTeam = fullTeams
          .map((team) => {
            const submissions = attachMeetingsToClientFeedback(
              team.feedbackHistory || [],
              team.meetings || []
            );

            const latestSubmission = submissions[0];

            if (!latestSubmission) return null;

            return {
              ...latestSubmission,
              teamId: team.id,
              teamName: team.teamName,
              projectName: team.projectName,
              clientName: team.clientName
            };
          })
          .filter(Boolean)
          .sort((a, b) => getDateTimeValue(b.submittedAt) - getDateTimeValue(a.submittedAt));

        const tutorMessages = fullTeams
          .flatMap((team) => (
            (team.feedbackHistory || [])
              .filter((feedback) => feedback.source === 'tutor-to-client')
              .map((comment) => ({
                ...comment,
                teamId: team.id,
                teamName: team.teamName,
                projectName: team.projectName
              }))
          ))
          .sort((a, b) => getDateTimeValue(b.submittedAt) - getDateTimeValue(a.submittedAt))
          .slice(0, 3);

        setLatestSubmissions(latestFeedbackByTeam);
        setTutorComments(tutorMessages);
      })
      .catch(() => setError('Could not load your teams. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const toggleOpen = (submissionId) => {
    setOpenItems((current) => (
      current.includes(submissionId)
        ? current.filter((id) => id !== submissionId)
        : [...current, submissionId]
    ));
  };

  const toggleComment = (commentId) => {
    setOpenComments((current) => (
      current.includes(commentId)
        ? current.filter((id) => id !== commentId)
        : [...current, commentId]
    ));
  };

  if (loading) {
    return (
      <div className="qut-page">
        <DashboardHeader title="Client Dashboard" />
        <main className="qut-content">
          <p>Loading...</p>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="qut-page">
        <DashboardHeader title="Client Dashboard" />
        <main className="qut-content">
          <p>{error}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="qut-page">
      <DashboardHeader title="Client Dashboard" />

      <main className="qut-content">
        <h2 className="qut-section-heading">Your Teams</h2>

        <div className="qut-compact-grid">
  {teams.map((team) => {
    const status = getTeamStatusFromSummary(team);

    return (
      <section className="qut-card client-team-card" key={team.id}>
        <div className="client-team-card-header">
          <div>
            <h3>{team.teamName}</h3>
            <p><strong>Project:</strong> {team.projectName}</p>
            <p><strong>Last feedback:</strong> {status.lastText}</p>
          </div>

          <span className={`qut-status ${status.className}`}>
            {status.label}
          </span>
        </div>

        <div className="client-team-actions">
          <button
            className="qut-btn qut-btn-outline"
            onClick={() => navigate(`/feedback-timeline/${team.id}`)}
          >
            View Timeline
          </button>

          <button
            className="qut-btn qut-btn-primary"
            onClick={() => navigate(`/submit-feedback/${team.id}`)}
          >
            Submit Feedback
          </button>
        </div>
      </section>
    );
  })}
        </div>

        <div className="qut-spacer" />

        <h2 className="qut-section-heading">Latest Feedback Summary</h2>

        <div className="qut-list-grid">
          {latestSubmissions.length ? latestSubmissions.map((submission) => {
            const isOpen = openItems.includes(submission.id);

            return (
              <section
                className={`qut-card qut-feedback-card student-feedback-card ${isOpen ? 'student-feedback-card-open' : ''}`}
                key={submission.id}
              >
                <div className="qut-feedback-topline">
                  <span className="qut-status client">Client Feedback</span>

                  <span className="qut-date-text">
                    {formatDate(submission.submittedAt)} · Submitted by{' '}
                    {getSubmittedByText(submission)}
                  </span>
                </div>

                {!isOpen && (
                  <LatestFeedbackSummary submission={submission} />
                )}

                <div className="qut-button-row">
                  <button
                    className="qut-btn qut-btn-outline student-feedback-btn"
                    onClick={() => toggleOpen(submission.id)}
                  >
                    {isOpen ? 'Close Full Submission' : 'Open Full Submission'}
                  </button>

                  <button
                    className="qut-btn qut-btn-outline"
                    onClick={() => navigate(`/feedback-timeline/${submission.teamId}`)}
                  >
                    View Timeline
                  </button>
                </div>

                {isOpen && <FullSubmissionDetails submission={submission} />}
              </section>
            );
          }) : (
            <section className="qut-card">
              <p>No feedback submitted yet.</p>
            </section>
          )}
        </div>

        <div className="qut-spacer" />

        <h2 className="qut-section-heading">Comments from Tutor</h2>

        <div className="qut-list-grid">
          {tutorComments.length ? tutorComments.map((comment) => {
            const isOpen = openComments.includes(comment.id);

            return (
              <section
                className={`qut-card qut-feedback-card student-feedback-card ${isOpen ? 'student-feedback-card-open' : ''}`}
                key={comment.id}
              >
                <div className="qut-feedback-topline">
                  <span className="qut-status tutor">Comment for Client</span>

                  <span className="qut-date-text">
                    {formatDate(comment.submittedAt)} · Submitted by{' '}
                    {getTutorSubmittedByText(comment)}
                  </span>
                </div>

                {!isOpen && <TutorCommentSummary comment={comment} />}

                <div className="qut-button-row">
                  <button
                    className="qut-btn qut-btn-outline student-feedback-btn"
                    onClick={() => toggleComment(comment.id)}
                  >
                    {isOpen ? 'Close Comment' : 'Open Comment'}
                  </button>

                  <button
                    className="qut-btn qut-btn-outline"
                    onClick={() => navigate(`/feedback-timeline/${comment.teamId}`)}
                  >
                    View Timeline
                  </button>
                </div>

                {isOpen && <TutorCommentDetails comment={comment} />}
              </section>
            );
          }) : (
            <section className="qut-card">
              <p>No tutor comments for client yet.</p>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProjectOwnerDashboard;