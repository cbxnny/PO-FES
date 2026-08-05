import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import BackButton from '../components/BackButton';
import DashboardHeader from '../components/DashboardHeader';
import { getCurrentUser } from '../utils/auth';
import { getUserDisplayName, normalizeRole } from '../utils/roleUtils';
import { formatDate, getTeamById, getTeamStatus, sourceClass } from '../data/feedbackData';
import '../styles/dashboard.css';

const ratingLabels = {
  1: '1 - Below Expectations',
  2: '2 - Meets Expectations',
  3: '3 - Above Expectations'
};

const getRatingText = (rating) => {
  if (rating === null || rating === undefined || rating === '') return 'Not recorded';
  return ratingLabels[Number(rating)] || rating;
};

const formatAttendance = (attendance) => {
  if (!attendance || !attendance.length) return 'Not recorded';
  if (attendance.includes('All')) return 'All team members attended';
  return attendance.join(', ');
};

const hasDomainRatings = (feedback) => (
  feedback.productProgressionRating !== undefined ||
  feedback.processTeamworkRating !== undefined
);

const getStudentNameForTeam = (team, user) => {
  const displayName = getUserDisplayName(user);
  return team.students.includes(displayName) ? displayName : team.students[0];
};

const FullSubmissionDetails = ({ feedback, user, team }) => {
  const role = normalizeRole(user?.role);
  const isStudent = role === 'student';
  const studentName = getStudentNameForTeam(team, user);

  const individualFeedback = feedback.individualFeedback || [];
  const visibleIndividualFeedback = isStudent
    ? individualFeedback.filter((item) => item.studentName === studentName)
    : individualFeedback;

  return (
    <div className="qut-details-panel">
      {(feedback.meetingDate || feedback.meetingTime || feedback.attendance) && (
        <div className="qut-info-box">
          <h4>Meeting Details</h4>
          <p><strong>Meeting Date:</strong> {feedback.meetingDate ? formatDate(feedback.meetingDate) : 'Not recorded'}</p>
          <p><strong>Meeting Time:</strong> {feedback.meetingTime || 'Not recorded'}</p>
          <p><strong>Attendance:</strong> {formatAttendance(feedback.attendance)}</p>
        </div>
      )}

      <div className="qut-info-box">
        <h4>Team Performance Ratings</h4>

        {hasDomainRatings(feedback) ? (
          <>
            <p><strong>Product &amp; Progression:</strong> {getRatingText(feedback.productProgressionRating)}</p>
            <p><strong>Process &amp; Teamwork:</strong> {getRatingText(feedback.processTeamworkRating)}</p>
          </>
        ) : (
          <p><strong>Team Score:</strong> {feedback.teamScore ?? 'N/A'}</p>
        )}

        <p><strong>Comments:</strong> {feedback.teamComment || 'No comments provided.'}</p>
      </div>

      {visibleIndividualFeedback.length > 0 && (
        <div className="qut-info-box">
          <h4>Individual Contributions</h4>

          {visibleIndividualFeedback.map((student) => (
            <div key={`${feedback.id}-${student.studentName}`} className="qut-student-feedback-line">
              <p><strong>{student.studentName}</strong></p>
              <p><strong>Rating:</strong> {getRatingText(student.score)}</p>
              <p><strong>Comment:</strong> {student.comment || 'No individual comment provided.'}</p>
            </div>
          ))}
        </div>
      )}

      {!isStudent && feedback.commentForTutors && (
        <div className="qut-info-box">
          <h4>Comment for Tutors / Teaching Staff</h4>
          <p>{feedback.commentForTutors}</p>
        </div>
      )}

      {!isStudent && feedback.commentForClient && (
        <div className="qut-info-box">
          <h4>Comment for Client</h4>
          <p>{feedback.commentForClient}</p>
        </div>
      )}
    </div>
  );
};

const FeedbackTimeline = () => {
  const { teamId } = useParams();
  const [openItems, setOpenItems] = useState([]);
  const user = getCurrentUser();
  const team = getTeamById(teamId);
  const status = getTeamStatus(team);

  const feedbackItems = [...team.feedbackHistory]
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  const toggleOpen = (feedbackId) => {
    setOpenItems((current) => (
      current.includes(feedbackId)
        ? current.filter((id) => id !== feedbackId)
        : [...current, feedbackId]
    ));
  };

  return (
    <div className="qut-page">
      <DashboardHeader title="Feedback Timeline" />

      <main className="qut-content">
        <BackButton />

        <div className="qut-spacer" />
        <section className="qut-card">
          <h2>{team.teamName}</h2>
          <p><strong>Project:</strong> {team.projectName}</p>
          <p><strong>Client:</strong> {team.clientName}</p>
          <p><strong>Last feedback:</strong> {status.lastText}</p>
          <span className={`qut-status ${status.className}`}>{status.label}</span>
        </section>

        <div className="qut-spacer" />
        <h2 className="qut-section-heading">Feedback Timeline</h2>

        <div className="qut-list-grid">
          {feedbackItems.length ? feedbackItems.map((feedback) => {
            const isOpen = openItems.includes(feedback.id);

            return (
              <section className="qut-card qut-feedback-card" key={feedback.id}>
                <div className="qut-feedback-topline">
                  <span className={`qut-status ${sourceClass(feedback.source)}`}>{feedback.type}</span>
                  <span className="qut-date-text">
                    {formatDate(feedback.submittedAt)} · Submitted by {feedback.submittedBy}
                  </span>
                </div>

                {hasDomainRatings(feedback) ? (
                  <>
                    <p><strong>Product &amp; Progression:</strong> {getRatingText(feedback.productProgressionRating)}</p>
                    <p><strong>Process &amp; Teamwork:</strong> {getRatingText(feedback.processTeamworkRating)}</p>
                  </>
                ) : (
                  <p><strong>Team Score:</strong> {feedback.teamScore ?? 'N/A'}</p>
                )}

                <p><strong>Summary:</strong> {feedback.teamComment || 'No summary provided.'}</p>

                <button className="qut-btn qut-btn-outline" onClick={() => toggleOpen(feedback.id)}>
                  {isOpen ? 'Close Full Submission' : 'Open Full Submission'}
                </button>

                {isOpen && (
                  <FullSubmissionDetails feedback={feedback} user={user} team={team} />
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