import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, User, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser, checkPasswordStrength, validateEmail } from '../utils/auth';

export default function SignUp() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Student');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [strength, setStrength] = useState({ score: 0, label: '', color: '#ef4444', isValid: false });

  useEffect(() => {
    if (email && !validateEmail(email)) setEmailError('Please enter a valid email (e.g. name@qut.edu.au)');
    else setEmailError('');
  }, [email]);

  useEffect(() => {
    if (password) {
      const result = checkPasswordStrength(password);
      setStrength(result);
      setPasswordError(result.isValid ? '' : 'Password does not meet all security requirements');
    } else {
      setStrength({ score: 0, label: '', color: '#ef4444', isValid: false });
      setPasswordError('');
    }
  }, [password]);

  useEffect(() => {
    if (confirmPassword && password !== confirmPassword) setConfirmError('Passwords do not match');
    else setConfirmError('');
  }, [password, confirmPassword]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg(''); setSuccessMsg('');
    if (!validateEmail(email)) { setErrorMsg('Invalid email format.'); return; }
    if (!checkPasswordStrength(password).isValid) { setErrorMsg('Password is not strong enough.'); return; }
    if (password !== confirmPassword) { setErrorMsg('Passwords do not match.'); return; }
    if (!agreeTerms) { setErrorMsg('You must agree to the Terms and Conditions.'); return; }
    try {
      registerUser(name, email, password, role);
      setSuccessMsg('Account created! Redirecting to login…');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    }
  };

  const strengthColors = ['#ef4444', '#f97316', '#eab308', '#22c55e'];
  const barColor = (i) => i < strength.score ? (strengthColors[strength.score - 1] || '#ef4444') : 'rgba(255,255,255,0.1)';

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 460 }}>
        <span className="auth-logo">PO<span>-FES</span></span>
        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Join PO-FES to get started</p>

        {errorMsg && <div className="auth-alert auth-alert-error"><AlertCircle size={16} />{errorMsg}</div>}
        {successMsg && <div className="auth-alert auth-alert-success"><CheckCircle size={16} />{successMsg}</div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label">Full name</label>
            <div className="auth-input-wrap">
              <User className="auth-input-icon" size={17} />
              <input type="text" className="auth-input" placeholder="Jane Smith"
                value={name} onChange={e => setName(e.target.value)} required />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label">Email address</label>
            <div className="auth-input-wrap">
              <Mail className="auth-input-icon" size={17} />
              <input type="email" className={`auth-input ${emailError ? 'error' : ''}`}
                placeholder="name@qut.edu.au" value={email}
                onChange={e => setEmail(e.target.value)} required />
            </div>
            {emailError && <div className="auth-error-msg"><AlertCircle size={12} />{emailError}</div>}
          </div>

          <div className="auth-field">
            <label className="auth-label">Role</label>
            <div className="auth-input-wrap">
              <Shield className="auth-input-icon" size={17} />
              <select className="auth-input auth-select" value={role} onChange={e => setRole(e.target.value)}>
                <option value="Project Owner">Project Owner</option>
                <option value="Student">Student</option>
                <option value="Industry Liaison">Industry Liaison</option>
                <option value="Unit Coordinator">Unit Coordinator</option>
              </select>
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label">Password</label>
            <div className="auth-input-wrap">
              <Lock className="auth-input-icon" size={17} />
              <input type={showPassword ? 'text' : 'password'}
                className={`auth-input ${passwordError ? 'error' : ''}`}
                placeholder="Create a strong password"
                value={password} onChange={e => setPassword(e.target.value)} required />
              <button type="button" className="auth-input-toggle" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {password && (
              <div className="strength-wrap">
                <div className="strength-bars">
                  {[0,1,2,3].map(i => <div key={i} className="strength-bar" style={{ background: barColor(i) }} />)}
                </div>
                <div className="strength-hint" style={{ color: strengthColors[strength.score - 1] || 'var(--text-dim)' }}>
                  {strength.label}
                </div>
              </div>
            )}
          </div>

          <div className="auth-field">
            <label className="auth-label">Confirm password</label>
            <div className="auth-input-wrap">
              <Lock className="auth-input-icon" size={17} />
              <input type={showConfirm ? 'text' : 'password'}
                className={`auth-input ${confirmError ? 'error' : ''}`}
                placeholder="Confirm your password"
                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
              <button type="button" className="auth-input-toggle" onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {confirmError && <div className="auth-error-msg"><AlertCircle size={12} />{confirmError}</div>}
          </div>

          <label className="auth-check-label" style={{ marginBottom: '1.25rem' }}>
            <input type="checkbox" className="auth-checkbox" checked={agreeTerms}
              onChange={e => setAgreeTerms(e.target.checked)} required />
            I agree to the Terms of Service &amp; Privacy Policy
          </label>

          <button type="submit" className="auth-btn">Create account</button>
        </form>

        <hr className="auth-divider" />
        <div className="auth-switch">Already have an account?<Link to="/login">Sign in</Link></div>
      </div>
    </div>
  );
}
