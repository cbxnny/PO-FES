import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';

const initialStudents = [
    { id: 1, name: 'Student 1', rating: '', comment: '' },
    { id: 2, name: 'Student 2', rating: '', comment: '' },
];

const EditDashboard = () => {
    const navigate = useNavigate();
    const [overallComment, setOverallComment] = useState('');
    const [privateComment, setPrivateComment] = useState('');
    const [students, setStudents] = useState(initialStudents);

    const updateStudent = (id, field, value) => {
        setStudents((prev) =>
            prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
        );
    };

    const handleSave = (e) => {
        e.preventDefault();
        // Backend wires up here
        navigate(-1);
    };

    return (
        <div className="qut-page">
            <header className="qut-header">
                <span className="qut-brand">QUT</span>
                <div className="qut-header-divider" />
                <div>
                    <div className="qut-page-title">Dashboard</div>
                    <div className="qut-page-subtitle">Client feedback (editing)</div>
                </div>
            </header>

            <div className="qut-content">
                <form onSubmit={handleSave} style={{ maxWidth: '700px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Overall team rating */}
                    <div className="qut-card">
                        <div className="qut-section-label">Overall Team Rating</div>
                        <textarea
                            className="qut-textarea"
                            placeholder="Overall team comment..."
                            value={overallComment}
                            onChange={(e) => setOverallComment(e.target.value)}
                            rows={4}
                        />
                    </div>

                    {/* Student feedback */}
                    <div className="qut-card">
                        <div className="qut-section-label">Student Feedback</div>
                        <table className="qut-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Rating</th>
                                    <th>Comment</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((s) => (
                                    <tr key={s.id}>
                                        <td style={{ fontWeight: 500 }}>{s.name}</td>
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

                    {/* Private comments */}
                    <div className="qut-card">
                        <div className="qut-section-label">Private Comments (Staff Only)</div>
                        <textarea
                            className="qut-textarea"
                            placeholder="Visible to staff only..."
                            value={privateComment}
                            onChange={(e) => setPrivateComment(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button type="submit" className="qut-btn qut-btn-primary">
                            Save changes
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

export default EditDashboard;
