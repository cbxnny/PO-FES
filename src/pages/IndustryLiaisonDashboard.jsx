import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader';
import { getTeams, getTeamStatus } from '../data/feedbackData';
import '../styles/dashboard.css';

const IndustryLiaisonDashboard = () => {
  const navigate = useNavigate();
  const teams = getTeams();
  const escalatedTeams = teams.filter((team) => team.escalated || getTeamStatus(team).className !== 'recent');
  const ifb398 = teams.filter((team) => team.unit === 'IFB398');
  const ifb399 = teams.filter((team) => team.unit === 'IFB399');

  const missingCount = (unitTeams) => unitTeams.filter((team) => getTeamStatus(team).className !== 'recent').length;
  const escalatedCount = (unitTeams) => unitTeams.filter((team) => team.escalated).length;

  return (
    <div className="qut-page">
      <DashboardHeader title="Industry Liaison Dashboard" />

      <main className="qut-content">
        <h2 className="qut-section-heading">Escalated Issues</h2>
        <div className="qut-list-grid">
          {escalatedTeams.map((team) => {
            const status = getTeamStatus(team);
            return (
              <section className="qut-card qut-compact-card" key={team.id}>
                <div>
                  <h3>{team.teamName}</h3>
                  <p><strong>Project:</strong> {team.projectName}</p>
                  <p><strong>Client:</strong> {team.clientName}</p>
                  <p><strong>Reason:</strong> {status.label}</p>
                  <p><strong>Status:</strong> Follow-up required</p>
                </div>

                <div className="qut-button-row">
                  <button className="qut-btn qut-btn-outline" onClick={() => navigate(`/feedback-timeline/${team.id}`)}>View Details</button>
                  <button className="qut-btn qut-btn-primary" onClick={() => alert('Oversight note added.')}>Add Oversight Note</button>
                </div>
              </section>
            );
          })}
        </div>

        <div className="qut-spacer" />
        <h2 className="qut-section-heading">Monitoring Overview</h2>
        <section className="qut-card">
          <table className="qut-table">
            <thead>
              <tr>
                <th>Unit</th>
                <th>Total Teams</th>
                <th>Missing Feedback</th>
                <th>Escalated</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>IFB398</td>
                <td>{ifb398.length}</td>
                <td>{missingCount(ifb398)}</td>
                <td>{escalatedCount(ifb398)}</td>
              </tr>
              <tr>
                <td>IFB399</td>
                <td>{ifb399.length}</td>
                <td>{missingCount(ifb399)}</td>
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
