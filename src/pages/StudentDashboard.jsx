import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';
import { getCurrentUser, logoutUser } from '../utils/auth';

const Stars = ({ score, max = 5 }) => {
    const filled = Math.round(score);
    return (
        <div className="qut-stars">
            {Array.from({ length: max }, (_, i) => (
                <span key={i} className={i < filled ? 'qut-star-filled' : 'qut-star-empty'}>
                    &#9733;
                </span>
            ))}
        </div>
    );
};

const FeedbackCard = ({ label, score, scoreLabel, comment }) => (
    <div className="qut-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div className="qut-section-label">{label}</div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span className="qut-score-value">{score}</span>
            <span className="qut-score-label">{scoreLabel}</span>
        </div>

        <Stars score={score} />

        <div>
            <span className="qut-badge qut-badge-green">Good</span>
        </div>

        <div className="qut-comment-box">{comment}</div>
    </div>
);

const StudentDashboard = () => {
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
                        <div className="qut-page-subtitle">Hey, {displayName}</div>
                    </div>
                </div>
                <button className="qut-btn qut-btn-outline" onClick={handleLogout}>
                    Logout
                </button>
            </header>

            <div className="qut-content" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <FeedbackCard
                    label="My Feedback — Team"
                    score={4.2}
                    scoreLabel="team score"
                    comment="Great communication and timely delivery of milestones."
                />
                <FeedbackCard
                    label="My Feedback — Individual"
                    score={3.8}
                    scoreLabel="individual score"
                    comment="Could improve on documentation clarity."
                />
            </div>
        </div>
    );
};

export default StudentDashboard;
