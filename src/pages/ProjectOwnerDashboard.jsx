import React, { useState } from 'react';
import AppShell from '../components/AppShell';
import { getCurrentUser } from '../utils/auth';
import { Send, ChevronRight, Star, X, Check } from 'lucide-react';

const TEAMS = [
  { id: 1, name: 'Team Alpha', project: 'Project 1', submitted: true,  score: 4.2, week: 'W8' },
  { id: 2, name: 'Team Beta',  project: 'Project 2', submitted: true,  score: 3.8, week: 'W8' },
  { id: 3, name: 'Team Gamma', project: 'Project 3', submitted: false, score: null, week: 'W8' },
];

const STUDENTS = [
  { id: 1, name: 'Alex Johnson',  initials: 'AJ', color: '#2563eb' },
  { id: 2, name: 'Jamie Lee',     initials: 'JL', color: '#7c3aed' },
  { id: 3, name: 'Sara Rivera',   initials: 'SR', color: '#0d9488' },
  { id: 4, name: 'Casey Kim',     initials: 'CK', color: '#b45309' },
  { id: 5, name: 'Morgan Wu',     initials: 'MW', color: '#be123c' },
];

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="stars">
      {[1,2,3,4,5].map(n => (
        <span
          key={n}
          className={`star ${n <= (hover || value) ? 'filled' : ''}`}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
        >★</span>
      ))}
    </div>
  );
}

function FeedbackModal({ team, onClose, onSubmit }) {
  const [teamRating, setTeamRating] = useState(0);
  const [teamComment, setTeamComment] = useState('');
  const [studentRatings, setStudentRatings] = useState({});
  const [studentComments, setStudentComments] = useState({});
  const [privateComment, setPrivateComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => { onSubmit(); onClose(); }, 1500);
  };

  if (submitted) return (
    <div style={overlay}>
      <div style={{ ...modalStyle, maxWidth: 380, textAlign: 'center', padding: '3rem 2rem' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--blue-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', color: 'var(--blue-light)' }}>
          <Check size={28} />
        </div>
        <h2 style={{ fontSize: 20, color: 'var(--text)', marginBottom: 8 }}>Feedback submitted!</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Your feedback for {team.name} has been recorded.</p>
      </div>
    </div>
  );

  return (
    <div style={overlay}>
      <div style={{ ...modalStyle, maxWidth: 680 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: 18, color: 'var(--text)', fontWeight: 600 }}>Submit feedback</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{team.name} · {team.week}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <p className="card-title">Overall team rating</p>
            <StarRating value={teamRating} onChange={setTeamRating} />
            <textarea className="form-textarea" style={{ marginTop: '0.75rem' }}
              placeholder="Share your thoughts on the team's overall performance…"
              value={teamComment} onChange={e => setTeamComment(e.target.value)} />
          </div>
          <hr className="section-divider" />
          <p className="card-title" style={{ marginBottom: '0.75rem' }}>Individual student ratings</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ marginBottom: '0.5rem' }}>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Rating</th>
                  <th>Comment</th>
                </tr>
              </thead>
              <tbody>
                {STUDENTS.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="avatar" style={{ background: s.color }}>{s.initials}</div>
                        {s.name}
                      </div>
                    </td>
                    <td>
                      <StarRating
                        value={studentRatings[s.id] || 0}
                        onChange={v => setStudentRatings(r => ({ ...r, [s.id]: v }))}
                      />
                    </td>
                    <td>
                      <input className="form-input" placeholder="Comment…"
                        value={studentComments[s.id] || ''}
                        onChange={e => setStudentComments(c => ({ ...c, [s.id]: e.target.value }))} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <hr className="section-divider" />
          <div style={{ marginBottom: '1.5rem' }}>
            <p className="card-title">Private comments (staff only)</p>
            <textarea className="form-textarea" placeholder="Visible to staff only…"
              value={privateComment} onChange={e => setPrivateComment(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-lg">
              <Send size={15} /> Submit feedback
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '1rem', zIndex: 1000,
};
const modalStyle = {
  background: 'var(--navy-card)', border: '1px solid var(--border-mid)',
  borderRadius: 16, padding: '1.75rem', width: '100%',
  maxHeight: '90vh', overflowY: 'auto',
};

export default function ProjectOwnerDashboard() {
  const user = getCurrentUser();
  const [modal, setModal] = useState(null);
  const [teams, setTeams] = useState(TEAMS);

  const handleSubmitted = (teamId) => {
    setTeams(t => t.map(tm => tm.id === teamId ? { ...tm, submitted: true } : tm));
  };

  return (
    <AppShell>
      {modal && (
        <FeedbackModal
          team={modal}
          onClose={() => setModal(null)}
          onSubmit={() => handleSubmitted(modal.id)}
        />
      )}

      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back, {user?.name?.split(' ')[0]} — here's your feedback overview</p>
      </div>

      <div className="stats-row">
        <div className="stat-card"><p className="stat-label">Teams assigned</p><p className="stat-value">{teams.length}</p></div>
        <div className="stat-card"><p className="stat-label">Submitted</p><p className="stat-value success">{teams.filter(t => t.submitted).length}</p></div>
        <div className="stat-card"><p className="stat-label">Pending</p><p className="stat-value danger">{teams.filter(t => !t.submitted).length}</p></div>
      </div>

      <div className="grid-2">
        <div>
          <div className="card">
            <p className="card-title">Your teams</p>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Team</th><th>Project</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {teams.map(team => (
                    <tr key={team.id}>
                      <td style={{ fontWeight: 500 }}>{team.name}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{team.project}</td>
                      <td>
                        {team.submitted
                          ? <span className="badge badge-green">Submitted</span>
                          : <span className="badge badge-yellow">Pending</span>}
                      </td>
                      <td>
                        <button className="btn btn-primary" style={{ fontSize: 12, padding: '5px 12px' }}
                          onClick={() => setModal(team)}>
                          {team.submitted ? 'Edit' : 'Submit'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <p className="card-title">Previous submissions</p>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Team</th><th>Score</th><th>Week</th><th></th></tr></thead>
                <tbody>
                  {teams.filter(t => t.submitted && t.score).map(team => (
                    <tr key={team.id}>
                      <td style={{ fontWeight: 500 }}>{team.name}</td>
                      <td><span style={{ color: 'var(--blue-light)', fontWeight: 600 }}>{team.score}</span></td>
                      <td style={{ color: 'var(--text-muted)' }}>{team.week}</td>
                      <td>
                        <button className="btn btn-outline" style={{ fontSize: 12, padding: '5px 12px' }}
                          onClick={() => setModal(team)}>
                          View <ChevronRight size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {teams.filter(t => t.submitted && t.score).length === 0 && (
                    <tr><td colSpan={4} style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem 0' }}>No submissions yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
