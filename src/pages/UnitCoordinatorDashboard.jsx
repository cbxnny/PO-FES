import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';
import { getCurrentUser, logoutUser } from '../utils/auth';

const teams = [
    { name: 'Team Alpha',   client: 'Client 2', completion: 80, status: 'Submitted' },
    { name: 'Team Beta',    client: 'Client X', completion: 80, status: 'Submitted' },
    { name: 'Team Gamma',   client: 'Client W', completion: 40, status: 'Missing'   },
    { name: 'Team Delta',   client: 'Client B', completion: 90, status: 'Submitted' },
    { name: 'Team Epsilon', client: 'Client A', completion: 25, status: 'Missing'   },
];

const CoordinatorDashboard = () => {
    const navigate = useNavigate();
    const user = getCurrentUser();
    const firstName = user ? (user.firstName || user.firstname || '') : '';
    const lastName = user ? (user.lastName || user.lastname || '') : '';
    const displayName = user ? (user.name || `${firstName} ${lastName}`.trim() || user.email) : 'User';

    const handleLogout = () => {
        logoutUser();
        navigate('/login');
    };

    const totalTeams = teams.length + 20;
    const submitted = teams.filter((t) => t.status === 'Submitted').length + 14;
    const missing = teams.filter((t) => t.status === 'Missing').length + 6;

    return (
        <div className="qut-page">
            <header className="qut-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <span className="qut-brand">QUT</span>
                    <div className="qut-header-divider" />
                    <div>
                        <div className="qut-page-title">Dashboard</div>
                        <div className="qut-page-subtitle">Welcome, {displayName}!</div>
                    </div>
                </div>
                <button className="qut-btn qut-btn-outline" onClick={handleLogout}>
                    Logout
                </button>
            </header>

            <div className="qut-content">

                {/* Stats bar */}
                <div className="qut-stats-bar">
                    <div className="qut-stat-item">
                        <span className="qut-stat-label">Total teams</span>
                        <span className="qut-stat-value">{totalTeams}</span>
                    </div>
                    <div className="qut-stat-divider" />
                    <div className="qut-stat-item">
                        <span className="qut-stat-label">Feedback submitted</span>
                        <span className="qut-stat-value" style={{ color: 'var(--qut-blue-light)' }}>{submitted}</span>
                    </div>
                    <div className="qut-stat-divider" />
                    <div className="qut-stat-item">
                        <span className="qut-stat-label">Missing feedback</span>
                        <span className="qut-stat-value" style={{ color: 'var(--qut-orange)' }}>{missing}</span>
                    </div>
                </div>

                {/* Teams list */}
                <div className="qut-card">
                    <div className="qut-section-label">Teams List</div>
                    <table className="qut-table">
                        <thead>
                            <tr>
                                <th>Team</th>
                                <th>Client</th>
                                <th>Completion</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {teams.map((t) => (
                                <tr key={t.name}>
                                    <td>{t.name}</td>
                                    <td style={{ color: 'var(--qut-text-muted)' }}>{t.client}</td>
                                    <td style={{ color: 'var(--qut-text-muted)' }}>{t.completion}%</td>
                                    <td>
                                        <span className={`qut-badge ${t.status === 'Submitted' ? 'qut-badge-green' : 'qut-badge-orange'}`}>
                                            {t.status}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="qut-btn qut-btn-outline qut-btn-sm">
                                            Contact
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={{ marginTop: '20px' }}>
                    <button className="qut-btn qut-btn-primary">
                        Export all data
                    </button>
                </div>

            </div>
        </div>
    );
};

export default CoordinatorDashboard;
