import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';

const initialStudents = [
    { id: 1, name: 'Alex Johnson', initials: 'AJ', rating: '', comment: '' },
    { id: 2, name: 'Jamie Lee',    initials: 'JL', rating: '', comment: '' },
    { id: 3, name: 'Sara Rivera',  initials: 'SR', rating: '', comment: '' },
];

const SubmitFeedback = () => {
    const navigate = useNavigate();
    const [overallComment, setOverallComment] = useState('');
    const [students, setStudents] = useState(initialStudents);

    const updateStudent = (id, field, value) => {
        setStudents((prev) =>
            prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Backend wires up here
        navigate('/staff-dashboard');
    };

    return (
        <div className="qut-page">
            <header className="qut-header">
                <span className="qut-brand">QUT</span>
                <div className="qut-header-divider" />
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="qut-page-title">Submit feedback</div>
                    <span className="qut-badge qut-badge-blue" style={{ fontSize: '12px' }}>Team 1 / W8</span>
                </div>
            </header>

            <div className="qut-content">
                <form onSubmit={handleSubmit} style={{ maxWidth: '760px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Overall team rating */}
                    <div className="qut-card">
                        <div className="qut-section-label">Overall Team Rating</div>
                        <textarea
                            className="qut-textarea"
                            placeholder="Share your thoughts on the team's overall performance..."
                            value={overallComment}
                            onChange={(e) => setOverallComment(e.target.value)}
                            rows={4}
                        />
                    </div>

                    {/* Individual student ratings */}
                    <div className="qut-card">
                        <div className="qut-section-label">Individual Student Ratings</div>
                        <table className="qut-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Rating (1–5)</th>
                                    <th>Comment</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((s) => (
                                    <tr key={s.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div className="qut-avatar">{s.initials}</div>
                                                <span>{s.name}</span>
                                            </div>
                                        </td>
                                        <td style={{ width: '120px' }}>
                                            <select
                                                className="qut-select"
                                                value={s.rating}
                                                onChange={(e) => updateStudent(s.id, 'rating', e.target.value)}
                                            >
                                                <option value="">—</option>
                                                <option value="1">1</option>
                                                <option value="2">2</option>
                                                <option value="3">3</option>
                                                <option value="4">4</option>
                                                <option value="5">5</option>
                                            </select>
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                className="qut-input"
                                                placeholder="Comment"
                                                value={s.comment}
                                                onChange={(e) => updateStudent(s.id, 'comment', e.target.value)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button type="submit" className="qut-btn qut-btn-primary">
                            Submit feedback
                        </button>
                        <button
                            type="button"
                            className="qut-btn qut-btn-outline"
                            onClick={() => navigate(-1)}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SubmitFeedback;
