import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser, initAuth, validateEmail } from '../utils/auth';

const Login = () => {
    const navigate = useNavigate();

    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Feedback and errors
    const [emailError, setEmailError] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // Seed mock users database when component mounts
    useEffect(() => {
        initAuth();
    }, []);

    // Validate email format in real-time
    useEffect(() => {
        if (email && !validateEmail(email)) {
            setEmailError('Please enter a valid email address (e.g. name@example.com)');
        } else {
            setEmailError('');
        }
    }, [email]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        // Final check on email format
        if (!validateEmail(email)) {
            setErrorMsg('Invalid email format. Please verify your email.');
            return;
        }

        try {
            const user = await loginUser(email, password);

            // Redirect based on user role
            switch (user.role) {
                case 'Project Owner':
                    navigate('/project-owner-dashboard');
                    break;
                case 'Student':
                    navigate('/student-dashboard');
                    break;
                case 'Industry Liaison':
                    navigate('/industry-liaison-dashboard');
                    break;
                case 'Unit Coordinator':
                    navigate('/unit-coordinator-dashboard');
                    break;
                default:
                    navigate('/project-owner-dashboard');
            }
        } catch (err) {
            setErrorMsg(err.message || 'Login failed. Please check your credentials.');
        }
    };

    return (
        <div className="login-container">
            {/* Background image added via CSS or inline */}
            <img src="/login-bg.png" alt="Abstract Background" className="login-bg-image" />

            <div className="login-content">
                <div className="login-glass-panel">
                    <div className="login-header">
                        <h1 className="login-title">Welcome Back</h1>
                        <p className="login-subtitle">Enter your credentials to access your account</p>
                    </div>

                    {errorMsg && (
                        <div className="auth-alert auth-alert-error">
                            <AlertCircle size={18} />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    <form className="login-form" onSubmit={handleSubmit}>
                        {/* Email Input */}
                        <div className="input-group">
                            <label className="input-label" htmlFor="email">Email</label>
                            <div className="input-wrapper">
                                <Mail className="input-icon" size={20} />
                                <input
                                    id="email"
                                    type="email"
                                    className={`login-input ${emailError ? 'input-error' : ''}`}
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            {emailError && <div className="error-message"><AlertCircle size={12} /> {emailError}</div>}
                        </div>

                        {/* Password Input */}
                        <div className="input-group">
                            <label className="input-label" htmlFor="password">Password</label>
                            <div className="input-wrapper">
                                <Lock className="input-icon" size={20} />
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    className="login-input"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me and Forgot Password */}
                        <div className="login-options">
                            <label className="remember-me">
                                <input type="checkbox" className="remember-checkbox" />
                                <span className="remember-text">Remember me</span>
                            </label>
                            <a href="#" className="forgot-password">Forgot password?</a>
                        </div>

                        {/* Sign In Button (no longer wrapped in Link) */}
                        <button type="submit" className="login-button">
                            Sign In
                        </button>
                    </form>

                    <div className="signup-prompt">
                        Don't have an account?
                        <Link to="/sign-up" className="signup-link">Sign up</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
