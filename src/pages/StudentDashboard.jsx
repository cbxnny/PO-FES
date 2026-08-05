import React, { useState } from 'react';
import DashboardHeader from '../components/DashboardHeader';
import { getCurrentUser } from '../utils/auth';
import { getUserDisplayName } from '../utils/roleUtils';
import { formatDate, getTeams, sourceClass } from '../data/feedbackData';
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

const getStudentTeam = (user) => {
  const teams = getTeams();
  const displayName = getUserDisplayName(user);

  return (
    teams.find((team) => team.students.includes(displayName)) ||
    teams.find((team) => team.feedbackHistory.some((feedback) =>
      feedback.individualFeedback?.some((item) => item.studentName === displayName)
    )) ||
    teams[0]
  );
};

const getStudentNameForTeam = (team, user) => {
  const displayName = getUserDisplayName(user);

  if (team.students.includes(displayName)) return displayName;

  const allIndividualNames = team.feedbackHistory.flatMap((feedback) =>
    feedback.individualFeedback?.map((item) => item.studentName) || []
  );

  return allIndividualNames.includes(displayName) ? displayName : displayName;
};

const getStudentFeedback = (team, studentName) => {
  return team.feedbackHistory
    .filter((feedback) => feedback.source === 'client' || feedback.source === 'tutor')
    .map((feedback) => ({
      ...feedback,
      individual: feedback.individualFeedback?.find((item) => item.studentName === studentName)
    }))
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
};

const StudentFeedbackDetails = ({ feedback }) => (
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

    <div className="qut-info-box">
      <h4>Your Individual Feedback</h4>
      <p><strong>Rating:</strong> {getRatingText(feedback.individual?.score)}</p>
      <p><strong>Comment:</strong> {feedback.individual?.comment || 'No individual comment provided.'}</p>
    </div>
  </div>
);

const StudentFeedbackCard = ({ feedback, team, isOpen, onToggle }) => (
  <section className="qut-card qut-feedback-card">
    <div className="qut-feedback-topline">
      <span className={`qut-status ${sourceClass(feedback.source)}`}>{feedback.type}</span>
      <span className="qut-date-text">
        {formatDate(feedback.submittedAt)} · Submitted by {feedback.submittedBy}
      </span>
    </div>

    <h3>{team.teamName}</h3>
    <p><strong>Project:</strong> {team.projectName}</p>

    {hasDomainRatings(feedback) ? (
      <>
        <p><strong>Product &amp; Progression:</strong> {getRatingText(feedback.productProgressionRating)}</p>
        <p><strong>Process &amp; Teamwork:</strong> {getRatingText(feedback.processTeamworkRating)}</p>
      </>
    ) : (
      <p><strong>Team Score:</strong> {feedback.teamScore ?? 'N/A'}</p>
    )}

    <p><strong>Summary:</strong> {feedback.teamComment || 'No summary provided.'}</p>

    <button className="qut-btn qut-btn-outline" onClick={onToggle}>
      {isOpen ? 'Close Full Submission' : 'Open Full Submission'}
    </button>

    {isOpen && <StudentFeedbackDetails feedback={feedback} />}
  </section>
);

const StudentDashboard = () => {
  const user = getCurrentUser();
  const team = getStudentTeam(user);
  const studentName = getStudentNameForTeam(team, user);
  const feedbackItems = getStudentFeedback(team, studentName);
  const latestFeedback = feedbackItems[0];
  const previousFeedback = feedbackItems.slice(1);
  const [openItems, setOpenItems] = useState([]);

  const toggleOpen = (feedbackId) => {
    setOpenItems((current) => (
      current.includes(feedbackId)
        ? current.filter((id) => id !== feedbackId)
        : [...current, feedbackId]
    ));
  };

  return (
    <div className="qut-page">
      <DashboardHeader title="Student Dashboard" />

      <main className="qut-content">
        <h2 className="qut-section-heading">Latest Feedback</h2>
        {latestFeedback ? (
          <StudentFeedbackCard
            feedback={latestFeedback}
            team={team}
            isOpen={openItems.includes(latestFeedback.id)}
            onToggle={() => toggleOpen(latestFeedback.id)}
          />
        ) : (
          <section className="qut-card"><p>No feedback submitted yet.</p></section>
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
            />
          )) : (
            <section className="qut-card"><p>No previous feedback yet.</p></section>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;