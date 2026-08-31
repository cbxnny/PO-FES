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
                    Check your email
                </h1>
                <p className="auth-subheading" style={{ marginBottom: '28px' }}>
                    We've sent a verification link to your email address.
                    Please click the link to confirm your account before signing in.
                </p>


            </div>
        </div>
    );
};

export default ConfirmationMessage;