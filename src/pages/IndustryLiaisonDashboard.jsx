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

const getEscalationReason = (team) => {
  const status = getTeamStatus(team);
  const latest = latestFeedback(team);

  if (team.escalated) return 'Manually escalated';
  if (hasBelowExpectations(latest)) return 'Below Expectations rating';
  return status.label;
};

const IndustryLiaisonDashboard = () => {
  const navigate = useNavigate();
  const teams = getTeams();

  const escalatedTeams = teams.filter((team) => {
    const status = getTeamStatus(team);
    const latest = latestFeedback(team);

    return (
      team.escalated ||
      status.className !== 'recent' ||
      hasBelowExpectations(latest)
    );
  });

  const ifb398 = teams.filter((team) => team.unit === 'IFB398');
  const ifb399 = teams.filter((team) => team.unit === 'IFB399');

  const missingCount = (unitTeams) => unitTeams.filter((team) => getTeamStatus(team).className !== 'recent').length;
  const escalatedCount = (unitTeams) => unitTeams.filter((team) => team.escalated).length;
  const belowExpectationsCount = (unitTeams) => unitTeams.filter((team) => hasBelowExpectations(latestFeedback(team))).length;

  return (
    <div className="qut-page">
      <DashboardHeader title="Industry Liaison Dashboard" />

      <main className="qut-content">
        <h2 className="qut-section-heading">Escalated Issues</h2>

        <div className="qut-list-grid">
          {escalatedTeams.length ? escalatedTeams.map((team) => {
            const status = getTeamStatus(team);
            const latest = latestFeedback(team);
            const belowExpectations = hasBelowExpectations(latest);

            return (
              <section className="qut-card qut-compact-card" key={team.id}>
                <div>
                  <h3>{team.teamName}</h3>
                  <p><strong>Project:</strong> {team.projectName}</p>
                  <p><strong>Client:</strong> {team.clientName}</p>
                  <p><strong>Reason:</strong> {getEscalationReason(team)}</p>
                  <p><strong>Status:</strong> Follow-up required</p>

                  {latest ? (
                    hasDomainRatings(latest) ? (
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
                      <p><strong>Team Score:</strong> {latest.teamScore ?? 'N/A'}</p>
                    )
                  ) : (
                    <p><strong>Latest rating:</strong> No feedback submitted yet</p>
                  )}

                  <span className={`qut-status ${status.className}`}>{status.label}</span>
                  {belowExpectations && <span className="qut-status missing">Below Expectations</span>}
                  {team.escalated && <span className="qut-status missing">Escalated</span>}
                </div>

                <div className="qut-button-row">
                  <button
                    className="qut-btn qut-btn-outline"
                    onClick={() => navigate(`/feedback-timeline/${team.id}`)}
                  >
                    View Details
                  </button>

                  <button
                    className="qut-btn qut-btn-primary"
                    onClick={() => alert('Oversight note added.')}
                  >
                    Add Oversight Note
                  </button>
                </div>
              </section>
            );
          }) : (
            <section className="qut-card">
              <p>No escalated issues right now.</p>
            </section>
          )}
        </div>

        <div className="qut-spacer" />
        <h2 className="qut-section-heading">Monitoring Overview</h2>

        <section className="qut-card">
          <table className="qut-table">
            <thead>
              <tr>
                <th>Unit</th>
                <th>Total Teams</th>
                <th>Missing / Overdue Feedback</th>
                <th>Below Expectations</th>
                <th>Escalated</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>IFB398</td>
                <td>{ifb398.length}</td>
                <td>{missingCount(ifb398)}</td>
                <td>{belowExpectationsCount(ifb398)}</td>
                <td>{escalatedCount(ifb398)}</td>
              </tr>
              <tr>
                <td>IFB399</td>
                <td>{ifb399.length}</td>
                <td>{missingCount(ifb399)}</td>
                <td>{belowExpectationsCount(ifb399)}</td>
                <td>{escalatedCount(ifb399)}</td>
              </tr>
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
};

export default IndustryLiaisonDashboard;