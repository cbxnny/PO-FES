import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/dashboard.css';

const ConfirmationMessage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!location.state?.fromSignup) {
            navigate('/login', { replace: true });
        }
    }, []);

    return (
        <div className="auth-page">
            <div className="auth-card confirm-center">
                <div className="auth-brand">
                    <img src="/pictures/qut.png" alt="QUT logo" className="auth-logo-img" />
                </div>

                <div className="confirm-avatar" />

                <h1 className="auth-heading" style={{ marginTop: '4px' }}>
                    Account successfully created
                </h1>
                <p className="auth-subheading" style={{ marginBottom: '28px' }}>
                    Your account is ready. You can now sign in and get started.
                </p>

                <button
                    className="auth-btn"
                    onClick={() => navigate('/login', { replace: true })}
                >
                    OK
                </button>
            </div>
        </div>
    );
};

export default ConfirmationMessage;