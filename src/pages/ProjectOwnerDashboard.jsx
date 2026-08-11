import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader';
import { formatDate, getTeams, getTeamStatusFromSummary } from '../data/feedbackApi';
import '../styles/dashboard.css';

const ProjectOwnerDashboard = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getTeams()
      .then(setTeams)
      .catch(() => setError('Could not load your teams. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="qut-page"><DashboardHeader title="Client Dashboard" /><main className="qut-content"><p>Loading...</p></main></div>;
  if (error) return <div className="qut-page"><DashboardHeader title="Client Dashboard" /><main className="qut-content"><p>{error}</p></main></div>;

  return (
    <div className="qut-page">
      <DashboardHeader title="Client Dashboard" />

      <main className="qut-content">
        <h2 className="qut-section-heading">Your Teams</h2>

        <div className="qut-compact-grid">
          {teams.map((team) => {
            const status = getTeamStatusFromSummary(team);

            return (
              <section className="qut-card qut-compact-card" key={team.id}>
                <div>
                  <h3>{team.teamName}</h3>
                  <p><strong>Project:</strong> {team.projectName}</p>
                  <p><strong>Last feedback:</strong> {status.lastText}</p>
                  <span className={`qut-status ${status.className}`}>{status.label}</span>
                </div>

                <div className="qut-button-row">
                  <button className="qut-btn qut-btn-outline" onClick={() => navigate(`/feedback-timeline/${team.id}`)}>
                    View Timeline
                  </button>
                  <button className="qut-btn qut-btn-primary" onClick={() => navigate(`/submit-feedback/${team.id}`)}>
                    Submit Feedback
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

export default ProjectOwnerDashboard;