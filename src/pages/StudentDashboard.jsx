import React from 'react';
import DashboardHeader from '../components/DashboardHeader';
import { getCurrentUser } from '../utils/auth';
import { getUserDisplayName } from '../utils/roleUtils';
import { formatDate, getTeams, sourceClass } from '../data/feedbackData';
import '../styles/dashboard.css';

const getStudentTeam = (user) => {
  const teams = getTeams();
  const displayName = getUserDisplayName(user);
  return teams.find((team) => team.students.includes(displayName)) || teams[0];
};

const getStudentNameForTeam = (team, user) => {
  const displayName = getUserDisplayName(user);
  return team.students.includes(displayName) ? displayName : team.students[0];
};

const getStudentFeedback = (team, studentName) => {
  return team.feedbackHistory
    .filter((feedback) => feedback.source === 'client' || feedback.source === 'tutor')
    .map((feedback) => ({
      ...feedback,
      individual: feedback.individualFeedback.find((item) => item.studentName === studentName)
    }))
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
};

const StudentFeedbackCard = ({ feedback, team }) => (
  <section className="qut-card qut-feedback-card">
    <div className="qut-feedback-topline">
      <span className={`qut-status ${sourceClass(feedback.source)}`}>{feedback.type}</span>
      <span className="qut-date-text">{formatDate(feedback.submittedAt)}</span>
    </div>

    <h3>From: {feedback.submittedBy}</h3>
    <p><strong>Team:</strong> {team.teamName}</p>

    <div className="qut-info-box">
      <p><strong>Team Score:</strong> {feedback.teamScore ?? 'N/A'}</p>
      <p><strong>Team Comment:</strong> {feedback.teamComment || 'No team comment provided.'}</p>
    </div>

    <div className="qut-info-box">
      <p><strong>Individual Score:</strong> {feedback.individual?.score ?? 'N/A'}</p>
      <p><strong>Individual Comment:</strong> {feedback.individual?.comment || 'No individual comment provided.'}</p>
    </div>
  </section>
);

const StudentDashboard = () => {
  const user = getCurrentUser();
  const team = getStudentTeam(user);
  const studentName = getStudentNameForTeam(team, user);
  const feedbackItems = getStudentFeedback(team, studentName);
  const latestFeedback = feedbackItems[0];
  const previousFeedback = feedbackItems.slice(1);

  return (
    <div className="qut-page">
      <DashboardHeader title="Student Dashboard" />

      <main className="qut-content">
        <h2 className="qut-section-heading">Latest Feedback</h2>
        {latestFeedback ? (
          <StudentFeedbackCard feedback={latestFeedback} team={team} />
        ) : (
          <section className="qut-card"><p>No feedback submitted yet.</p></section>
        )}

        <div className="qut-spacer" />
        <h2 className="qut-section-heading">Previous Feedback</h2>

        <div className="qut-list-grid">
          {previousFeedback.length ? previousFeedback.map((feedback) => (
            <StudentFeedbackCard key={feedback.id} feedback={feedback} team={team} />
          )) : (
            <section className="qut-card"><p>No previous feedback yet.</p></section>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
