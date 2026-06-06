import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';
import { getCurrentUser, logoutUser } from '../utils/auth';

const yourTeams = [
    { name: 'Team Alpha' },
    { name: 'Team Beta' },
    { name: 'Team Gamma' },
];

const previousSubmissions = [
    { name: 'Team Alpha', status: 'Submitted' },
    { name: 'Team Beta',  status: 'Submitted' },
];

const ClientDashboard = () => {
    const navigate = useNavigate();
    const user = getCurrentUser();
    const firstName = user ? (user.firstName || user.firstname || '') : '';
    const lastName = user ? (user.lastName || user.lastname || '') : '';
    const displayName = user ? (user.name || `${firstName} ${lastName}`.trim() || user.email) : 'User';

    const handleLogout = () => {
        logoutUser();
        navigate('/login');
    };

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

            <div className="qut-content" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>

                {/* Your Teams */}
                <div className="qut-card">
                    <div className="qut-section-label">Your Teams</div>
                    <table className="qut-table">
                        <thead>
                            <tr>
                                <th>Team</th>
                                <th></th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {yourTeams.map((t) => (
                                <tr key={t.name}>
                                    <td>{t.name}</td>
                                    <td>
                                        <button className="qut-btn qut-btn-outline qut-btn-sm">
                                            View
                                        </button>
                                    </td>
                                    <td>
                                        <button
                                            className="qut-btn qut-btn-primary qut-btn-sm"
                                            onClick={() => navigate('/submit-feedback')}
                                        >
                                            Submit feedback
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Previous Submissions */}
                <div className="qut-card">
                    <div className="qut-section-label">Previous Submissions</div>
                    <table className="qut-table">
                        <thead>
                            <tr>
                                <th>Team</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {previousSubmissions.map((s) => (
                                <tr key={s.name}>
                                    <td>{s.name}</td>
                                    <td>
                                        <span className="qut-badge qut-badge-green">{s.status}</span>
                                    </td>
                                    <td>
                                        <button className="qut-btn qut-btn-outline qut-btn-sm">
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
};

export default ClientDashboard;
