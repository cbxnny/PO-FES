import React, { useState } from 'react';
import AppShell from '../components/AppShell';
import { getCurrentUser } from '../utils/auth';
import { AlertTriangle, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';

const TEAMS = [
  { id: 1, name: 'Team Alpha', client: 'Client 2',  score: 4.2, trend: 'up',   status: 'ok',      week: 'W8' },
  { id: 2, name: 'Team Beta',  client: 'Client X',  score: 3.8, trend: 'up',   status: 'ok',      week: 'W8' },
  { id: 3, name: 'Team Gamma', client: 'Client A',  score: 2.8, trend: 'down', status: 'low',     week: 'W8' },
  { id: 4, name: 'Team Delta', client: 'Client B',  score: 3.9, trend: 'up',   status: 'ok',      week: 'W8' },
  { id: 5, name: 'Team Epsilon',client: 'Client C', score: 2.4, trend: 'down', status: 'missing', week: 'W8' },
];

const ALERTS = [
  { type: 'red',    msg: 'Team Gamma — score below threshold (2.8)' },
  { type: 'red',    msg: 'Team Epsilon — score critically low (2.4)' },
  { type: 'yellow', msg: 'Team Epsilon — missing feedback from 2 clients' },
  { type: 'yellow', msg: 'Week 9 deadline in 2 days' },
];

export default function IndustryLiaisonDashboard() {
  const user = getCurrentUser();
  const [teams, setTeams] = useState(TEAMS);
  const [escalated, setEscalated] = useState(new Set());

  const handleEscalate = (id) => setEscalated(s => new Set([...s, id]));

  const scoreColor = (s) => s >= 4 ? 'var(--blue-light)' : s >= 3 ? '#fbbf24' : '#fca5a5';

  return (
    <AppShell>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back, {user?.name?.split(' ')[0]} — monitor client engagement below</p>
      </div>

      <div className="stats-row">
        <div className="stat-card"><p className="stat-label">Total teams</p><p className="stat-value">{teams.length}</p></div>
        <div className="stat-card"><p className="stat-label">Avg score</p><p className="stat-value">{(teams.reduce((a,t) => a + t.score, 0) / teams.length).toFixed(1)}</p></div>
        <div className="stat-card"><p className="stat-label">Low scores</p><p className="stat-value danger">{teams.filter(t => t.score < 3).length}</p></div>
        <div className="stat-card"><p className="stat-label">Escalated</p><p className="stat-value">{escalated.size}</p></div>
      </div>

      <div className="grid-2">
        <div>
          <div className="card">
            <p className="card-title">Teams overview</p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Team</th>
                    <th>Client</th>
                    <th>Score</th>
                    <th></th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map(team => (
                    <tr key={team.id}>
                      <td style={{ fontWeight: 500 }}>{team.name}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{team.client}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 700, color: scoreColor(team.score) }}>{team.score}</span>
                          {team.status === 'low' || team.status === 'missing'
                            ? <span className="badge badge-red" style={{ fontSize: 10 }}>Low</span>
                            : null}
                          {team.trend === 'up'
                            ? <TrendingUp size={13} style={{ color: 'var(--green)' }} />
                            : <TrendingDown size={13} style={{ color: '#fca5a5' }} />}
                        </div>
                      </td>
                      <td>
                        <button className="btn btn-outline" style={{ fontSize: 12, padding: '4px 10px' }}>
                          View <ChevronRight size={12} />
                        </button>
                      </td>
                      <td>
                        {escalated.has(team.id)
                          ? <span className="badge badge-yellow">Escalated</span>
                          : <button className="btn btn-danger" style={{ fontSize: 12, padding: '4px 10px' }}
                              onClick={() => handleEscalate(team.id)}>
                              Escalate
                            </button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <p className="card-title">Alerts</p>
            {ALERTS.map((a, i) => (
              <div key={i} className={`alert alert-${a.type}`}>
                <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                {a.msg}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
