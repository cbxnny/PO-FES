import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader';
import { getTeams, getTeamById, getTeamStatus, latestFeedback } from '../data/feedbackApi';
import '../styles/dashboard.css';

const TutorDashboard = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getTeams()
      .then((summaryTeams) => Promise.all(summaryTeams.map((t) => getTeamById(t.id))))
      .then(setTeams)
      .catch(() => setError('Could not load your teams. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="qut-page"><DashboardHeader title="Tutor Dashboard" /><main className="qut-content"><p>Loading...</p></main></div>;
  if (error) return <div className="qut-page"><DashboardHeader title="Tutor Dashboard" /><main className="qut-content"><p>{error}</p></main></div>;

  const attentionTeams = teams.filter((team) => {
    const status = getTeamStatus(team);
    const latest = latestFeedback(team);
    return status.className !== 'recent' || (latest?.teamScore && latest.teamScore < 3);
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
            {attentionTeams.length ? attentionTeams.map((team) => {
              const status = getTeamStatus(team);
              const latest = latestFeedback(team);
              const reason = latest?.teamScore < 3 ? `low score (${latest.teamScore})` : status.label;
              return <div className="qut-alert-item" key={team.id}>{team.teamName} needs attention: {reason}</div>;
            }) : <p>No urgent alerts right now.</p>}
          </div>
        </section>

        <div className="qut-spacer" />
        <h2 className="qut-section-heading">Assigned Teams</h2>
        <div className="qut-team-grid">
          {teams.map((team) => {
            const status = getTeamStatus(team);
            const latest = latestFeedback(team);

            return (
              <section className="qut-card qut-team-card" key={team.id}>
                <div className="qut-team-info">
                  <h3>{team.teamName}</h3>
                  <p><strong>Project:</strong> {team.projectName}</p>
                  <p><strong>Client:</strong> {team.clientName}</p>
                  <p><strong>Last feedback:</strong> {status.lastText}</p>
                  <p><strong>Average team score:</strong> {latest?.teamScore ?? 'N/A'}</p>
                  <span className={`qut-status ${status.className}`}>{status.label}</span>
                  {latest?.teamScore < 3 && <span className="qut-status missing">Low Score</span>}
                </div>

                <div className="qut-action-stack">
                  <button className="qut-btn qut-btn-outline" onClick={() => navigate(`/feedback-timeline/${team.id}`)}>View Feedback</button>
                  <button className="qut-btn qut-btn-primary" onClick={() => navigate(`/tutor-feedback/${team.id}`)}>Send Tutor Feedback</button>
                  <button className="qut-btn qut-btn-outline" onClick={() => navigate(`/client-comment/${team.id}`)}>Comment for Client</button>
                  <button className="qut-btn qut-btn-danger" onClick={() => alert('Issue escalated to Unit Coordinator.')}>Escalate</button>
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