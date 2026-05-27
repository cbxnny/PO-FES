import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, LogOut, Home, FileText, Users, BarChart2 } from 'lucide-react';
import { getCurrentUser, logoutUser } from '../utils/auth';

const navByRole = {
  'Project Owner': [
    { label: 'Dashboard', path: '/project-owner-dashboard', icon: Home },
    { label: 'Submit Feedback', path: '/project-owner-dashboard', icon: FileText },
  ],
  'Student': [
    { label: 'Dashboard', path: '/student-dashboard', icon: Home },
    { label: 'My Feedback', path: '/student-dashboard', icon: FileText },
  ],
  'Industry Liaison': [
    { label: 'Dashboard', path: '/industry-liaison-dashboard', icon: Home },
    { label: 'Teams', path: '/industry-liaison-dashboard', icon: Users },
    { label: 'Escalations', path: '/industry-liaison-dashboard', icon: BarChart2 },
  ],
  'Unit Coordinator': [
    { label: 'Dashboard', path: '/unit-coordinator-dashboard', icon: Home },
    { label: 'Teams', path: '/unit-coordinator-dashboard', icon: Users },
    { label: 'Reports', path: '/unit-coordinator-dashboard', icon: BarChart2 },
  ],
};

export default function AppShell({ children }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const user = getCurrentUser();
  const userName = user?.name || 'User';
  const role = user?.role || 'Student';
  const nav = navByRole[role] || navByRole['Student'];

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const initials = userName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const avatarColors = {
    'Project Owner': '#2563eb',
    'Student': '#7c3aed',
    'Industry Liaison': '#0d9488',
    'Unit Coordinator': '#b45309',
  };
  const avatarBg = avatarColors[role] || '#2563eb';

  return (
    <div className="app-shell">
      <div className={`sidebar-overlay ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-logo">PO<span>-FES</span></div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {nav.map(item => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <button
                key={item.label}
                className={`nav-item ${active ? 'active' : ''}`}
                onClick={() => { navigate(item.path); setOpen(false); }}
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.5rem 0.75rem', marginBottom: '0.5rem' }}>
            <div className="avatar" style={{ background: avatarBg }}>{initials}</div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{userName}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{role}</div>
            </div>
          </div>
          <button className="nav-item" onClick={handleLogout}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      <div className="mobile-topbar">
        <button className="hamburger" onClick={() => setOpen(true)}><Menu size={22} /></button>
        <span style={{ fontWeight: 700, fontSize: '17px', letterSpacing: '-0.02em' }}>
          PO<span style={{ color: 'var(--blue-light)' }}>-FES</span>
        </span>
        <div className="avatar" style={{ background: avatarBg, width: 32, height: 32, fontSize: 12 }}>{initials}</div>
      </div>

      <main className="main-content">{children}</main>
    </div>
  );
}
