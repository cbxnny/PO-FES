import React, { useEffect, useState } from 'react';
import DashboardHeader from '../components/DashboardHeader';
import { getCurrentUser } from '../utils/auth';
import { getTeams, getTeamById, formatDate, sourceClass } from '../data/feedbackApi';
import '../styles/dashboard.css';
import { SkeletonGrid } from '../components/SkeletonCard';

const getStudentFeedback = (team, userId) => {
  return team.feedbackHistory
    .filter((feedback) => feedback.source === 'client' || feedback.source === 'tutor')
    .map((feedback) => ({
      ...feedback,
      individual: feedback.individualFeedback.find((item) => item.studentId === userId)
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
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getTeams()
      .then((teams) => {
        if (!teams.length) {
          setLoading(false);
          return;
        }
        return getTeamById(teams[0].id).then(setTeam);
      })
      .catch(() => setError('Could not load your team. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="qut-page">
      <DashboardHeader title="Student Dashboard" />
      <main className="qut-content">
        <h2 className="qut-section-heading">Latest Feedback</h2>
        <SkeletonGrid count={1} variant="feedback" gridClass="qut-list-grid" />
      </main>
    </div>
  );
  if (error) return <div className="qut-page"><DashboardHeader title="Student Dashboard" /><main className="qut-content"><p>{error}</p></main></div>;
  if (!team) return <div className="qut-page"><DashboardHeader title="Student Dashboard" /><main className="qut-content"><p>You are not currently assigned to a team.</p></main></div>;

  const feedbackItems = getStudentFeedback(team, user.id);
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