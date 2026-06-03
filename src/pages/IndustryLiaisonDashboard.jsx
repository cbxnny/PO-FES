import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';

const teams = [
    { name: 'Team Alpha', client: 'Client 2', score: 4.2, scoreClass: 'qut-badge-blue', lowFlag: false },
    { name: 'Team Beta',  client: 'Client X', score: 3.8, scoreClass: 'qut-badge-blue', lowFlag: false },
    { name: 'Team Gamma', client: 'Client A', score: 2.8, scoreClass: 'qut-badge-orange', lowFlag: true },
    { name: 'Team Delta', client: 'Client B', score: 3.9, scoreClass: 'qut-badge-blue', lowFlag: false },
];

const alerts = [
    'Team Gamma — score below threshold (2.8)',
    'Team Epsilon — missing feedback from 2 clients',
    'Week 9 deadline in 2 days',
];

const StaffDashboard = () => {
    const navigate = useNavigate();

    return (
        <div className="qut-page">
            <header className="qut-header">
                <span className="qut-brand">QUT</span>
                <div className="qut-header-divider" />
                <div>
                    <div className="qut-page-title">Dashboard</div>
                    <div className="qut-page-subtitle">Welcome</div>
                </div>
            </header>

            <div className="qut-content" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>

                {/* Teams Overview */}
                <div className="qut-card">
                    <div className="qut-section-label">Teams Overview</div>
                    <table className="qut-table">
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
                            {teams.map((t) => (
                                <tr key={t.name}>
                                    <td>{t.name}</td>
                                    <td style={{ color: 'var(--qut-text-muted)' }}>{t.client}</td>
                                    <td>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                            <span className={`qut-badge ${t.scoreClass}`}>{t.score}</span>
                                            {t.lowFlag && (
                                                <span className="qut-badge qut-badge-orange">Low</span>
                                            )}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className="qut-btn qut-btn-outline qut-btn-sm"
                                            onClick={() => navigate('/submit-feedback')}
                                        >
                                            View
                                        </button>
                                    </td>
                                    <td>
                                        <button className="qut-btn qut-btn-danger qut-btn-sm">
                                            Escalate
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Alerts */}
                <div className="qut-card">
                    <div className="qut-section-label">Alerts</div>
                    {alerts.map((alert, i) => (
                        <div key={i} className="qut-alert-item">{alert}</div>
                    ))}
                </div>

            </div>
        </div>
    );
};

export default StaffDashboard;
