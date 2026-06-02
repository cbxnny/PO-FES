import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser, checkPasswordStrength, validateEmail } from '../utils/auth';
import '../styles/dashboard.css';

const SignUp = () => {
    const navigate = useNavigate();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('Student');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [emailError, setEmailError] = useState('');
    const [confirmError, setConfirmError] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (email && !validateEmail(email)) {
            setEmailError('Enter a valid email address');
        } else {
            setEmailError('');
        }
    }, [email]);

    useEffect(() => {
        if (confirmPassword && password !== confirmPassword) {
            setConfirmError('Passwords do not match');
        } else {
            setConfirmError('');
        }
    }, [password, confirmPassword]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (!validateEmail(email)) {
            setErrorMsg('Please enter a valid email address.');
            return;
        }

        const strengthCheck = checkPasswordStrength(password);
        if (!strengthCheck.isValid) {
            setErrorMsg('Password must be at least 8 characters and include an uppercase letter, number, and special character.');
            return;
        }

        if (password !== confirmPassword) {
            setErrorMsg('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
            await registerUser(fullName, email, password, role);
            navigate('/confirmation');
        } catch (err) {
            setErrorMsg(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card auth-card-wide">
                <div className="auth-brand">QUT</div>

                <h1 className="auth-heading">Create an account</h1>
                <p className="auth-subheading">Sign up to get started</p>

                {errorMsg && <div className="auth-error">{errorMsg}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="auth-name-row">
                        <div className="auth-field">
                            <label className="auth-label" htmlFor="firstName">First name</label>
                            <input
                                id="firstName"
                                type="text"
                                className="auth-input"
                                placeholder="Jane"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="auth-field">
                            <label className="auth-label" htmlFor="lastName">Last name</label>
                            <input
                                id="lastName"
                                type="text"
                                className="auth-input"
                                placeholder="Smith"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                            />
                        </div>
                    </div>

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
                        <label className="auth-label" htmlFor="role">Role</label>
                        <select
                            id="role"
                            className="auth-select"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            required
                        >
                            <option value="Student">Student</option>
                            <option value="Project Owner">Project Owner</option>
                            <option value="Industry Liaison">Industry Liaison</option>
                            <option value="Unit Coordinator">Unit Coordinator</option>
                        </select>
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

                    <div className="auth-field">
                        <label className="auth-label" htmlFor="confirmPassword">Confirm password</label>
                        <div className="auth-input-wrap">
                            <input
                                id="confirmPassword"
                                type={showConfirm ? 'text' : 'password'}
                                className={`auth-input${confirmError ? ' auth-input-error' : ''}`}
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="auth-toggle-btn"
                                onClick={() => setShowConfirm(!showConfirm)}
                                tabIndex={-1}
                            >
                                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {confirmError && <span className="auth-field-error">{confirmError}</span>}
                    </div>

                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? 'Creating account...' : 'Create account'}
                    </button>
                </form>

                <div className="auth-footer">
                    Already have an account?
                    <Link to="/login">Sign in</Link>
                </div>
            </div>
        </div>
    );
};

export default SignUp;
