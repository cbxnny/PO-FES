import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader';
import { getTeams, getTeamStatus } from '../data/feedbackData';
import '../styles/dashboard.css';

const UnitCoordinatorDashboard = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const teams = getTeams();

  const filteredTeams = useMemo(() => {
    return teams.filter((team) => {
      const status = getTeamStatus(team);
      const search = query.toLowerCase();
      const matchesSearch =
        team.teamName.toLowerCase().includes(search) ||
        team.projectName.toLowerCase().includes(search) ||
        team.clientName.toLowerCase().includes(search);

      const matchesFilter =
        filter === 'all' ||
        (filter === 'recent' && status.className === 'recent') ||
        (filter === 'overdue' && status.className !== 'recent') ||
        (filter === 'escalated' && team.escalated);

      return matchesSearch && matchesFilter;
    });
  }, [filter, query, teams]);

  const submitted = teams.filter((team) => team.feedbackHistory.length).length;
  const missing = teams.filter((team) => getTeamStatus(team).className !== 'recent').length;

  return (
    <div className="qut-page">
      <DashboardHeader title="Coordinator Dashboard" />

      <main className="qut-content">
        <section className="qut-card qut-metric-strip">
          <div className="qut-metric-item">
            <span>Total Teams</span>
            <strong>{teams.length}</strong>
          </div>
          <div className="qut-metric-item">
            <span>Feedback Submitted</span>
            <strong>{submitted}</strong>
          </div>
          <div className="qut-metric-item">
            <span>Missing Feedback</span>
            <strong>{missing}</strong>
          </div>
        </section>

        <div className="qut-spacer" />
        <h2 className="qut-section-heading">Search and Filters</h2>
        <div className="qut-toolbar">
          <input
            className="qut-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search team, client, project..."
          />
          <button className="qut-btn qut-btn-outline" onClick={() => setFilter('all')}>All</button>
          <button className="qut-btn qut-btn-outline" onClick={() => setFilter('recent')}>Recent Feedback</button>
          <button className="qut-btn qut-btn-outline" onClick={() => setFilter('overdue')}>No Feedback 14+ Days</button>
          <button className="qut-btn qut-btn-outline" onClick={() => setFilter('escalated')}>Escalated</button>
        </div>

        <h2 className="qut-section-heading">Teams List</h2>
        <div className="qut-list-grid">
          {filteredTeams.map((team) => {
            const status = getTeamStatus(team);

            return (
              <section className="qut-card qut-compact-card" key={team.id}>
                <div>
                  <h3>{team.teamName}</h3>
                  <p><strong>Client:</strong> {team.clientName}</p>
                  <p><strong>Project:</strong> {team.projectName}</p>
                  <p><strong>Last feedback:</strong> {status.lastText}</p>
                  <span className={`qut-status ${status.className}`}>{status.label}</span>
                  {team.escalated && <span className="qut-status missing">Escalated</span>}
                </div>

                <div className="qut-button-row">
                  <button className="qut-btn qut-btn-outline" onClick={() => navigate(`/feedback-timeline/${team.id}`)}>View Timeline</button>
                  <button className="qut-btn qut-btn-outline" onClick={() => alert('Contact feature placeholder.')}>Contact</button>
                  <button className="qut-btn qut-btn-danger" onClick={() => alert('Escalated to Industry Liaison.')}>Escalate</button>
                </div>
              </section>
            );
          })}
        </div>

        <div className="qut-button-row qut-top-gap">
          <button className="qut-btn qut-btn-primary" onClick={() => alert('Export would download all feedback data.')}>Export All Data</button>
        </div>
      </main>
    </div>
  );
};

export default UnitCoordinatorDashboard;
