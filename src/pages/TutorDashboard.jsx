import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader';
import { getTeams, getTeamStatus, latestFeedback } from '../data/feedbackData';
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

const hasDomainRatings = (feedback) => (
  feedback?.productProgressionRating !== undefined ||
  feedback?.processTeamworkRating !== undefined
);

const hasBelowExpectations = (feedback) => (
  Number(feedback?.productProgressionRating) === 1 ||
  Number(feedback?.processTeamworkRating) === 1 ||
  (!hasDomainRatings(feedback) && Number(feedback?.teamScore) < 3)
);

const getAttentionReason = (team) => {
  const status = getTeamStatus(team);
  const latest = latestFeedback(team);

  if (hasBelowExpectations(latest)) {
    return 'Below Expectations rating';
  }

  return status.label;
};

const TutorDashboard = () => {
  const navigate = useNavigate();
  const teams = getTeams();

  const attentionTeams = teams.filter((team) => {
    const status = getTeamStatus(team);
    const latest = latestFeedback(team);

    return status.className !== 'recent' || hasBelowExpectations(latest);
  });

  return (
    <div className="qut-page">
      <DashboardHeader title="Tutor Dashboard" />

      <main className="qut-content">
        <section className="qut-card qut-metric-strip">
          <div className="qut-metric-item">
            <span>Assigned Teams</span>
            <strong>{teams.length}</strong>
          </div>
          <div className="qut-metric-item">
            <span>Feedback Received</span>
            <strong>{teams.filter((team) => team.feedbackHistory.length).length}</strong>
          </div>
          <div className="qut-metric-item">
            <span>Needs Attention</span>
            <strong>{attentionTeams.length}</strong>
          </div>
        </section>

        <div className="qut-spacer" />
        <h2 className="qut-section-heading">Alerts</h2>

        <section className="qut-card">
          <div className="qut-alert-list">
            {attentionTeams.length ? attentionTeams.map((team) => (
              <div className="qut-alert-item" key={team.id}>
                {team.teamName} needs attention: {getAttentionReason(team)}
              </div>
            )) : (
              <p>No urgent alerts right now.</p>
            )}
          </div>
        </section>

        <div className="qut-spacer" />
        <h2 className="qut-section-heading">Assigned Teams</h2>

        <div className="qut-team-grid">
          {teams.map((team) => {
            const status = getTeamStatus(team);
            const latest = latestFeedback(team);
            const belowExpectations = hasBelowExpectations(latest);

            return (
              <section className="qut-card qut-team-card" key={team.id}>
                <div className="qut-team-info">
                  <h3>{team.teamName}</h3>
                  <p><strong>Project:</strong> {team.projectName}</p>
                  <p><strong>Client:</strong> {team.clientName}</p>
                  <p><strong>Last feedback:</strong> {status.lastText}</p>

                  {hasDomainRatings(latest) ? (
                    <>
                      <p>
                        <strong>Product &amp; Progression:</strong>{' '}
                        {getRatingText(latest.productProgressionRating)}
                      </p>
                      <p>
                        <strong>Process &amp; Teamwork:</strong>{' '}
                        {getRatingText(latest.processTeamworkRating)}
                      </p>
                    </>
                  ) : (
                    <p><strong>Team Score:</strong> {latest?.teamScore ?? 'N/A'}</p>
                  )}

                  <span className={`qut-status ${status.className}`}>{status.label}</span>
                  {belowExpectations && <span className="qut-status missing">Below Expectations</span>}
                </div>

                <div className="qut-action-stack">
                  <button
                    className="qut-btn qut-btn-outline"
                    onClick={() => navigate(`/feedback-timeline/${team.id}`)}
                  >
                    View Feedback
                  </button>

                  <button
                    className="qut-btn qut-btn-primary"
                    onClick={() => navigate(`/tutor-feedback/${team.id}`)}
                  >
                    Send Tutor Feedback
                  </button>

                  <button
                    className="qut-btn qut-btn-outline"
                    onClick={() => navigate(`/client-comment/${team.id}`)}
                  >
                    Comment for Client
                  </button>

                  <button
                    className="qut-btn qut-btn-danger"
                    onClick={() => alert('Issue escalated to Unit Coordinator.')}
                  >
                    Escalate
                  </button>
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default TutorDashboard;