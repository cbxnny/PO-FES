import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser, validateEmail } from '../utils/auth';
import { roleToDashboardPath } from '../utils/roleUtils';
import '../styles/dashboard.css';

const Login = () => {
    const navigate = useNavigate();

    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (email && !validateEmail(email)) {
            setEmailError('Enter a valid email address');
        } else {
            setEmailError('');
        }
    }, [email]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (!validateEmail(email)) {
            setErrorMsg('Please enter a valid email address.');
            return;
        }

        setLoading(true);
        try {
            const user = await loginUser(email, password);
            navigate(roleToDashboardPath(user.role), { replace: true });
        } catch (err) {
            setErrorMsg(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-brand">
                    <img src="/pictures/qut.png" alt="QUT logo" className="auth-logo-img" />
                </div>

                <h1 className="auth-heading">Welcome back</h1>
                <p className="auth-subheading">Sign in to your account</p>

                {errorMsg && <div className="auth-error">{errorMsg}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="auth-field">
                        <label className="auth-label" htmlFor="email">Email address</label>
                        <input
                            id="email"
                            type="email"
                            className={`auth-input${emailError ? ' auth-input-error' : ''}`}
                            placeholder="name@qut.edu.au"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        {emailError && <span className="auth-field-error">{emailError}</span>}
                    </div>

                    <div className="auth-field">
                        <label className="auth-label" htmlFor="password">Password</label>
                        <div className="auth-input-wrap">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                className="auth-input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="auth-toggle-btn"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>

                <div className="auth-footer">
                    Don't have an account?
                    <Link to="/sign-up">Sign up</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;