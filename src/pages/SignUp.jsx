import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, User, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser, checkPasswordStrength, validateEmail } from '../utils/auth';

const SignUp = () => {
    const navigate = useNavigate();
    
    // Form fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('Student');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agreeTerms, setAgreeTerms] = useState(false);

    // Password visibility
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Real-time error states
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmError, setConfirmError] = useState('');

    // Form-level alerts
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Password strength
    const [strength, setStrength] = useState({ score: 0, label: 'Weak', color: '#ef4444', feedback: [], isValid: false });

    // Validate email on change
    useEffect(() => {
        if (email && !validateEmail(email)) {
            setEmailError('Please enter a valid email (e.g. name@example.com)');
        } else {
            setEmailError('');
        }
    }, [email]);

    // Check password strength on change
    useEffect(() => {
        if (password) {
            const result = checkPasswordStrength(password);
            setStrength(result);
            if (!result.isValid && password.length > 0) {
                setPasswordError('Password does not meet all security rules');
            } else {
                setPasswordError('');
            }
        } else {
            setStrength({ score: 0, label: 'Weak', color: '#ef4444', feedback: [], isValid: false });
            setPasswordError('');
        }
    }, [password]);

    // Check password match on change
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
        setSuccessMsg('');

        // Perform email validation
        if (!validateEmail(email)) {
            setErrorMsg('Invalid email format. Please check the email field.');
            return;
        }

        // Check password strength
        const strengthCheck = checkPasswordStrength(password);
        if (!strengthCheck.isValid) {
            setErrorMsg('Password is not strong enough. Ensure it meets all requirements.');
            return;
        }

        // Check password match
        if (password !== confirmPassword) {
            setErrorMsg('Passwords do not match. Please verify your passwords.');
            return;
        }

        // Check agreement
        if (!agreeTerms) {
            setErrorMsg('You must agree to the Terms and Conditions.');
            return;
        }

        try {
            await registerUser(name, email, password, role);
            setSuccessMsg('Account created successfully! Redirecting to login...');
            
            // Redirect after 2 seconds
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setErrorMsg(err.message || 'Registration failed. Please try again.');
        }
    };

    return (
        <div className="login-container">
            <img src="/login-bg.png" alt="Abstract Background" className="login-bg-image" />

            <div className="login-content">
                <div className="login-glass-panel">
                    <div className="login-header">
                        <h1 className="login-title">Create Account</h1>
                        <p className="login-subtitle">Join the PO-FES community to get started</p>
                    </div>

                    {errorMsg && (
                        <div className="auth-alert auth-alert-error">
                            <AlertCircle size={18} />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {successMsg && (
                        <div className="auth-alert auth-alert-success">
                            <CheckCircle size={18} />
                            <span>{successMsg}</span>
                        </div>
                    )}

                    <form className="login-form" onSubmit={handleSubmit}>
                        {/* Name Input */}
                        <div className="input-group">
                            <label className="input-label" htmlFor="name">Full Name</label>
                            <div className="input-wrapper">
                                <User className="input-icon" size={20} />
                                <input
                                    id="name"
                                    type="text"
                                    className="login-input"
                                    placeholder="Enter your name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Email Input */}
                        <div className="input-group">
                            <label className="input-label" htmlFor="email">Email Address</label>
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

                        {/* Role Select Dropdown */}
                        <div className="input-group">
                            <label className="input-label" htmlFor="role">User Role</label>
                            <div className="input-wrapper">
                                <Shield className="input-icon" size={20} />
                                <select
                                    id="role"
                                    className="login-input login-select"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    required
                                >
                                    <option value="Project Owner">Project Owner</option>
                                    <option value="Student">Student</option>
                                    <option value="Industry Liaison">Industry Liaison</option>
                                    <option value="Unit Coordinator">Unit Coordinator</option>
                                </select>
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="input-group">
                            <label className="input-label" htmlFor="password">Password</label>
                            <div className="input-wrapper">
                                <Lock className="input-icon" size={20} />
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    className={`login-input ${passwordError ? 'input-error' : ''}`}
                                    placeholder="Create a strong password"
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
                            
                            {/* Real-time Password Strength Meter */}
                            {password && (
                                <div className="strength-meter">
                                    <div className="strength-bars">
                                        <div className="strength-bar" style={{ backgroundColor: strength.score >= 1 ? strength.color : '' }}></div>
                                        <div className="strength-bar" style={{ backgroundColor: strength.score >= 2 ? strength.color : '' }}></div>
                                        <div className="strength-bar" style={{ backgroundColor: strength.score >= 3 ? strength.color : '' }}></div>
                                        <div className="strength-bar" style={{ backgroundColor: strength.score >= 4 ? strength.color : '' }}></div>
                                    </div>
                                    <div className="strength-text" style={{ color: strength.color }}>
                                        Strength: {strength.label}
                                    </div>
                                    {strength.feedback.length > 0 && (
                                        <div style={{ fontSize: '0.72rem', color: '#a0aec0', textAlign: 'left', marginTop: '0.15rem' }}>
                                            Requires: {strength.feedback.join(', ')}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Confirm Password Input */}
                        <div className="input-group">
                            <label className="input-label" htmlFor="confirmPassword">Confirm Password</label>
                            <div className="input-wrapper">
                                <Lock className="input-icon" size={20} />
                                <input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    className={`login-input ${confirmError ? 'input-error' : ''}`}
                                    placeholder="Confirm your password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {confirmError && <div className="error-message"><AlertCircle size={12} /> {confirmError}</div>}
                        </div>

                        {/* Terms and Conditions Checkbox */}
                        <div className="login-options" style={{ marginTop: '0.25rem' }}>
                            <label className="remember-me">
                                <input 
                                    type="checkbox" 
                                    className="remember-checkbox" 
                                    checked={agreeTerms}
                                    onChange={(e) => setAgreeTerms(e.target.checked)}
                                    required
                                />
                                <span className="remember-text" style={{ fontSize: '0.8rem', textAlign: 'left' }}>
                                    I agree to the Terms of Service & Privacy Policy
                                </span>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button type="submit" className="login-button">
                            Register
                        </button>
                    </form>

                    <div className="signup-prompt">
                        Already have an account?
                        <Link to="/login" className="signup-link">Sign in</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignUp;
