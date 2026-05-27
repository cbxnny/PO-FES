import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser, initAuth, validateEmail } from '../utils/auth';

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => { initAuth(); }, []);

  useEffect(() => {
    if (email && !validateEmail(email)) {
      setEmailError('Please enter a valid email (e.g. name@qut.edu.au)');
    } else {
      setEmailError('');
    }
  }, [email]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!validateEmail(email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    try {
      const user = loginUser(email, password);
      switch (user.role) {
        case 'Project Owner':    navigate('/project-owner-dashboard'); break;
        case 'Student':          navigate('/student-dashboard'); break;
        case 'Industry Liaison': navigate('/industry-liaison-dashboard'); break;
        case 'Unit Coordinator': navigate('/unit-coordinator-dashboard'); break;
        default:                 navigate('/project-owner-dashboard');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <span className="auth-logo">PO<span>-FES</span></span>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your account to continue</p>

        {errorMsg && (
          <div className="auth-alert auth-alert-error">
            <AlertCircle size={16} />{errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label">Email</label>
            <div className="auth-input-wrap">
              <Mail className="auth-input-icon" size={17} />
              <input
                type="email"
                className={`auth-input ${emailError ? 'error' : ''}`}
                placeholder="name@qut.edu.au"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            {emailError && <div className="auth-error-msg"><AlertCircle size={12} />{emailError}</div>}
          </div>

          <div className="auth-field">
            <label className="auth-label">Password</label>
            <div className="auth-input-wrap">
              <Lock className="auth-input-icon" size={17} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="auth-input"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button type="button" className="auth-input-toggle" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <div className="auth-options">
            <label className="auth-check-label">
              <input type="checkbox" className="auth-checkbox" />
              Remember me
            </label>
            <a href="#" className="auth-forgot">Forgot password?</a>
          </div>

          <button type="submit" className="auth-btn">Sign in</button>
        </form>

        <hr className="auth-divider" />
        <div className="auth-switch">
          Don't have an account?<Link to="/sign-up">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
