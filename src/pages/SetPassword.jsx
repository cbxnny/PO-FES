import { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { loginUser, checkPasswordStrength } from '../utils/auth';
import { roleToDashboardPath } from '../utils/roleUtils';
import '../styles/dashboard.css';

/**
 * SetPassword
 *
 * Landing page for users created through the bulk (xlsx) import. Supabase's
 * "Invite user" email links here. The page:
 *   1. Establishes a temporary Supabase session from the invite link
 *      (either ?token_hash=...&type=invite, or the #access_token=... hash
 *      that Supabase's default {{ .ConfirmationURL }} produces).
 *   2. Lets the user choose a password (supabase.auth.updateUser).
 *   3. Signs them in through the existing /api/login flow so the app's
 *      normal sessionStorage session is created, then redirects them to
 *      their role's dashboard.
 */
const SetPassword = () => {
    const navigate = useNavigate();
    const startedRef = useRef(false); // invite tokens are single-use; don't verify twice (StrictMode)

    const [status, setStatus] = useState('verifying'); // verifying | ready | invalid
    const [inviteEmail, setInviteEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (startedRef.current) return;
        startedRef.current = true;

        const establishSession = async () => {
            const query = new URLSearchParams(window.location.search);
            const tokenHash = query.get('token_hash');
            const type = query.get('type');

            // A link-preview/scanner error from Supabase arrives in the hash.
            const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
            if (hash.get('error')) {
                setStatus('invalid');
                return;
            }

            if (tokenHash && (type === 'invite' || type === 'recovery')) {
                const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
                if (error || !data.session) {
                    setStatus('invalid');
                    return;
                }
                setInviteEmail(data.session.user.email);
                setStatus('ready');
                window.history.replaceState({}, '', window.location.pathname);
                return;
            }

            // Fallback: supabase-js parses #access_token=... from the URL itself.
            const { data } = await supabase.auth.getSession();
            if (data.session) {
                setInviteEmail(data.session.user.email);
                setStatus('ready');
                window.history.replaceState({}, '', window.location.pathname);
            } else {
                setStatus('invalid');
            }
        };

        establishSession();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (!checkPasswordStrength(password).isValid) {
            setErrorMsg('Password must be at least 8 characters and include an uppercase letter, number, and special character.');
            return;
        }
        if (password !== confirmPassword) {
            setErrorMsg('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw new Error(error.message);

            // Password is now set — sign in through the normal backend flow.
            const user = await loginUser(inviteEmail, password);

            // Drop the temporary Supabase-client session; the app uses its own.
            await supabase.auth.signOut({ scope: 'local' });

            navigate(roleToDashboardPath(user.role), { replace: true });
        } catch (err) {
            setErrorMsg(err.message || 'Could not set your password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const strength = checkPasswordStrength(password);

    if (status === 'verifying') {
        return (
            <div className="auth-page">
                <div className="auth-card confirm-center">
                    <div className="auth-brand">
                        <img src="/pictures/qut.png" alt="QUT logo" className="auth-logo-img" />
                    </div>
                    <p className="auth-subheading">Verifying your invitation…</p>
                </div>
            </div>
        );
    }

    if (status === 'invalid') {
        return (
            <div className="auth-page">
                <div className="auth-card confirm-center">
                    <div className="auth-brand">
                        <img src="/pictures/qut.png" alt="QUT logo" className="auth-logo-img" />
                    </div>
                    <h1 className="auth-heading">Link invalid or expired</h1>
                    <p className="auth-subheading">
                        This invitation link has expired or has already been used.
                        If you've already set a password, you can sign in. Otherwise,
                        ask your unit coordinator to send you a new invitation.
                    </p>
                    <div className="auth-footer">
                        <Link to="/login">Go to sign in</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-brand">
                    <img src="/pictures/qut.png" alt="QUT logo" className="auth-logo-img" />
                </div>

                <h1 className="auth-heading">Set your password</h1>
                <p className="auth-subheading">
                    Welcome! Choose a password for <strong>{inviteEmail}</strong> to finish setting up your account.
                </p>

                {errorMsg && <div className="auth-error">{errorMsg}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="auth-field">
                        <label className="auth-label" htmlFor="password">New password</label>
                        <div className="auth-input-wrap">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                className="auth-input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="new-password"
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
                        {password && (
                            <span className="auth-field-error" style={{ color: strength.color }}>
                                {strength.label}
                                {strength.feedback.length > 0 && ` — needs: ${strength.feedback.join(', ').toLowerCase()}`}
                            </span>
                        )}
                    </div>

                    <div className="auth-field">
                        <label className="auth-label" htmlFor="confirmPassword">Confirm password</label>
                        <div className="auth-input-wrap">
                            <input
                                id="confirmPassword"
                                type={showConfirm ? 'text' : 'password'}
                                className={`auth-input${confirmPassword && password !== confirmPassword ? ' auth-input-error' : ''}`}
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                autoComplete="new-password"
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
                        {confirmPassword && password !== confirmPassword && (
                            <span className="auth-field-error">Passwords do not match</span>
                        )}
                    </div>

                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? 'Saving...' : 'Set password & continue'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SetPassword;
