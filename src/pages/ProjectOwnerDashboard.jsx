import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader';
import { getCurrentUser } from '../utils/auth';
import { getUserDisplayName } from '../utils/roleUtils';
import { formatDate, getTeams, getTeamStatus } from '../data/feedbackData';
import '../styles/dashboard.css';

const ProjectOwnerDashboard = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const displayName = getUserDisplayName(user);
  const allTeams = getTeams();
  const matchingTeams = allTeams.filter((team) => team.clientName === displayName);
  const teams = matchingTeams.length ? matchingTeams : allTeams.filter((team) => ['Maya Patel', 'Client A', 'Client W'].includes(team.clientName));
  const previousSubmissions = teams
    .flatMap((team) => team.feedbackHistory
      .filter((feedback) => feedback.source === 'client')
      .map((feedback) => ({ ...feedback, teamName: team.teamName })))
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  return (
    <div className="qut-page">
      <DashboardHeader title="Client Dashboard" />

      <main className="qut-content">
        <h2 className="qut-section-heading">Your Teams</h2>

        <div className="qut-compact-grid">
          {teams.map((team) => {
            const status = getTeamStatus(team);

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

        <div className="qut-spacer" />
        <h2 className="qut-section-heading">Previous Submissions</h2>

        <div className="qut-list-grid">
          {previousSubmissions.length ? previousSubmissions.map((submission) => (
            <section className="qut-card qut-feedback-card" key={submission.id}>
              <div className="qut-feedback-topline">
                <span className="qut-status client">Client Feedback</span>
                <span className="qut-date-text">{formatDate(submission.submittedAt)}</span>
              </div>
              <h3>{submission.teamName}</h3>
              <p><strong>Team score:</strong> {submission.teamScore ?? 'N/A'}</p>
              <p>{submission.teamComment}</p>
            </section>
          )) : (
            <section className="qut-card">
              <p>No previous submissions yet.</p>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProjectOwnerDashboard;
