<<<<<<< HEAD
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';

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

    return (
        <div className="qut-page">
            <header className="qut-header">
                <span className="qut-brand">QUT</span>
                <div className="qut-header-divider" />
                <div>
                    <div className="qut-page-title">Dashboard</div>
                    <div className="qut-page-subtitle">Welcome!</div>
                </div>
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
=======
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';

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

    return (
        <div className="qut-page">
            <header className="qut-header">
                <span className="qut-brand">QUT</span>
                <div className="qut-header-divider" />
                <div>
                    <div className="qut-page-title">Dashboard</div>
                    <div className="qut-page-subtitle">Welcome!</div>
                </div>
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
>>>>>>> b12068b478d23e5473371248cb7a9a5bd7a03c01
