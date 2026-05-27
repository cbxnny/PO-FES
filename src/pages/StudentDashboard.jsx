import React, { useState } from 'react';
import AppShell from '../components/AppShell';
import { getCurrentUser } from '../utils/auth';
import { Save, X } from 'lucide-react';

const FEEDBACK_DATA = {
  teamScore: 4.2,
  teamFeedback: 'Great communication and timely delivery of milestones. The team showed strong collaboration throughout the project.',
  individualScore: 3.8,
  individualFeedback: 'Good technical contributions. Could improve on documentation clarity and proactive communication with the client.',
  teamMembers: [
    { initials: 'AJ', color: '#2563eb', name: 'Alex Johnson' },
    { initials: 'JL', color: '#7c3aed', name: 'Jamie Lee' },
    { initials: 'SR', color: '#0d9488', name: 'Sara Rivera' },
    { initials: 'MW', color: '#be123c', name: 'Morgan Wu' },
  ],
};

function ScoreRing({ score, max = 5 }) {
  const pct = (score / max) * 100;
  const color = score >= 4 ? 'var(--blue-light)' : score >= 3 ? '#fbbf24' : '#fca5a5';
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
      <span style={{ fontSize: 36, fontWeight: 700, color, letterSpacing: '-0.03em' }}>{score}</span>
      <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>/ {max}</span>
    </div>
  );
}

function Stars({ score }) {
  return (
    <div className="stars" style={{ marginTop: 4 }}>
      {[1,2,3,4,5].map(n => (
        <span key={n} className={`star ${n <= Math.round(score) ? 'filled' : ''}`} style={{ fontSize: 16, cursor: 'default' }}>★</span>
      ))}
    </div>
  );
}

function EditModal({ field, value, label, onClose, onSave }) {
  const [text, setText] = useState(value);
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 1000 }}>
      <div style={{ background: 'var(--navy-card)', border: '1px solid var(--border-mid)', borderRadius: 16, padding: '1.75rem', width: '100%', maxWidth: 480 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>Edit {label}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        <textarea className="form-textarea" style={{ minHeight: 120 }} value={text} onChange={e => setText(e.target.value)} />
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => { onSave(text); onClose(); }}>
            <Save size={14} /> Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const user = getCurrentUser();
  const [data, setData] = useState(FEEDBACK_DATA);
  const [editing, setEditing] = useState(null);
  const [saved, setSaved] = useState(false);

  const handleSave = (field, value) => {
    setData(d => ({ ...d, [field]: value }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <AppShell>
      {editing && (
        <EditModal
          field={editing.field}
          value={editing.value}
          label={editing.label}
          onClose={() => setEditing(null)}
          onSave={(val) => handleSave(editing.field, val)}
        />
      )}

      {saved && (
        <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', background: 'var(--green-faint)', border: '1px solid rgba(34,197,94,0.3)', color: '#86efac', padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 999, display: 'flex', alignItems: 'center', gap: 8 }}>
          ✓ Changes saved
        </div>
      )}

      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Hey, {user?.name?.split(' ')[0]} — here's your latest feedback</p>
      </div>

      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        {/* Team Feedback */}
        <div className="card">
          <p className="card-title">Team feedback</p>
          <ScoreRing score={data.teamScore} />
          <Stars score={data.teamScore} />
          <div style={{ marginTop: '1rem', background: 'var(--input-bg)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            {data.teamFeedback}
          </div>
          <button className="btn btn-outline" style={{ marginTop: '0.875rem', fontSize: 12 }}
            onClick={() => setEditing({ field: 'teamFeedback', value: data.teamFeedback, label: 'Team Response' })}>
            Edit response
          </button>
        </div>

        {/* Individual Feedback */}
        <div className="card">
          <p className="card-title">Individual feedback</p>
          <ScoreRing score={data.individualScore} />
          <Stars score={data.individualScore} />
          <div style={{ marginTop: '1rem', background: 'var(--input-bg)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            {data.individualFeedback}
          </div>
          <button className="btn btn-outline" style={{ marginTop: '0.875rem', fontSize: 12 }}
            onClick={() => setEditing({ field: 'individualFeedback', value: data.individualFeedback, label: 'Individual Response' })}>
            Edit response
          </button>
        </div>
      </div>

      {/* Team members */}
      <div className="card">
        <p className="card-title">Team members</p>
        <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
          {data.teamMembers.map((m, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--input-bg)', borderRadius: 9, padding: '8px 12px' }}>
              <div className="avatar" style={{ background: m.color }}>{m.initials}</div>
              <span style={{ fontSize: 13, color: 'var(--text)' }}>{m.name}</span>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
