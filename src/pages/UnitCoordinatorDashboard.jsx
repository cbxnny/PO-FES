import React, { useState } from 'react';
import AppShell from '../components/AppShell';
import { getCurrentUser } from '../utils/auth';
import { Download, Mail, AlertTriangle } from 'lucide-react';

const TEAMS_DATA = [
  { id: 1,  name: 'Team Alpha',   client: 'Client 2',  clientPct: 80,  status: 'submitted', score: 4.2 },
  { id: 2,  name: 'Team Beta',    client: 'Client X',  clientPct: 80,  status: 'submitted', score: 3.8 },
  { id: 3,  name: 'Team Gamma',   client: 'Client W',  clientPct: 40,  status: 'missing',   score: 2.8 },
  { id: 4,  name: 'Team Delta',   client: 'Client B',  clientPct: 90,  status: 'submitted', score: 3.9 },
  { id: 5,  name: 'Team Epsilon', client: 'Client A',  clientPct: 25,  status: 'missing',   score: 2.4 },
  { id: 6,  name: 'Team Zeta',    client: 'Client C',  clientPct: 100, status: 'submitted', score: 4.5 },
];

export default function UnitCoordinatorDashboard() {
  const user = getCurrentUser();
  const [teams] = useState(TEAMS_DATA);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const submitted = teams.filter(t => t.status === 'submitted').length;
  const missing = teams.filter(t => t.status === 'missing').length;
  const avgScore = (teams.reduce((a, t) => a + t.score, 0) / teams.length).toFixed(1);

  const filtered = teams.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
                        t.client.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || t.status === filter;
    return matchSearch && matchFilter;
  });

  const handleExport = () => {
    const csv = ['Team,Client,Score,Status', ...teams.map(t => `${t.name},${t.client},${t.score},${t.status}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'pofes-teams.csv'; a.click();
  };

  const scoreColor = (s) => s >= 4 ? 'var(--blue-light)' : s >= 3 ? '#fbbf24' : '#fca5a5';
  const pctColor = (p) => p >= 75 ? 'var(--green)' : p >= 40 ? '#fbbf24' : '#fca5a5';

  return (
    <AppShell>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome, {user?.name?.split(' ')[0]} — here's the full overview for this week</p>
      </div>

      {/* Stats */}
      <div className="stats-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><p className="stat-label">Total teams</p><p className="stat-value">{teams.length}</p></div>
        <div className="stat-card">
          <p className="stat-label">Submitted</p>
          <p className="stat-value success">{submitted}</p>
          <div className="progress-bar"><div className="progress-fill green" style={{ width: `${(submitted/teams.length)*100}%` }} /></div>
        </div>
        <div className="stat-card"><p className="stat-label">Missing</p><p className="stat-value danger">{missing}</p></div>
        <div className="stat-card"><p className="stat-label">Avg score</p><p className="stat-value">{avgScore}</p></div>
      </div>

      {/* Alerts */}
      {teams.filter(t => t.score < 3).length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <p className="card-title">Alerts requiring attention</p>
          {teams.filter(t => t.score < 3).map(t => (
            <div key={t.id} className="alert alert-red">
              <AlertTriangle size={15} style={{ flexShrink: 0 }} />
              {t.name} has a low score of {t.score} — consider following up with {t.client}
            </div>
          ))}
          {teams.filter(t => t.status === 'missing').map(t => (
            <div key={`m-${t.id}`} className="alert alert-yellow">
              <AlertTriangle size={15} style={{ flexShrink: 0 }} />
              {t.name} — feedback still missing from {t.client}
            </div>
          ))}
        </div>
      )}

      {/* Teams table */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <p className="card-title" style={{ marginBottom: 0 }}>Teams list</p>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              className="form-input" style={{ width: 180, padding: '6px 12px', fontSize: 13 }}
              placeholder="Search teams…" value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select className="form-input form-select" style={{ width: 130, padding: '6px 12px', fontSize: 13 }}
              value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="submitted">Submitted</option>
              <option value="missing">Missing</option>
            </select>
            <button className="btn btn-outline" onClick={handleExport}>
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Team</th>
                <th>Client</th>
                <th>Completion</th>
                <th>Score</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(team => (
                <tr key={team.id}>
                  <td style={{ fontWeight: 500 }}>{team.name}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{team.client}</td>
                  <td style={{ minWidth: 120 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress-bar" style={{ flex: 1 }}>
                        <div className="progress-fill" style={{ width: `${team.clientPct}%`, background: pctColor(team.clientPct) }} />
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 30 }}>{team.clientPct}%</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: scoreColor(team.score) }}>{team.score}</span>
                  </td>
                  <td>
                    {team.status === 'submitted'
                      ? <span className="badge badge-green">Submitted</span>
                      : <span className="badge badge-red">Missing</span>}
                  </td>
                  <td>
                    <button className="btn btn-outline" style={{ fontSize: 12, padding: '4px 10px' }}>
                      <Mail size={12} /> Contact
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>No teams match your filter</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
