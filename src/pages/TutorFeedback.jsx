import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BackButton from '../components/BackButton';
import DashboardHeader from '../components/DashboardHeader';
import { addFeedbackToTeam, getTeamById } from '../data/feedbackApi';
import '../styles/dashboard.css';

const createInitialStudentFeedback = (students) => {
  return students.reduce((acc, student) => {
    acc[student.id] = { score: '', comment: '' };
    return acc;
  }, {});
};

const TutorFeedback = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [teamScore, setTeamScore] = useState('');
  const [teamComment, setTeamComment] = useState('');
  const [studentFeedback, setStudentFeedback] = useState({});

  useEffect(() => {
    getTeamById(teamId || 1)
      .then((data) => {
        setTeam(data);
        setStudentFeedback(createInitialStudentFeedback(data.students));
      })
      .catch(() => setError('Could not load this team. Please try again.'))
      .finally(() => setLoading(false));
  }, [teamId]);
  
  const updateStudent = (studentId, field, value) => {
    setStudentFeedback((current) => ({
      ...current,
      [studentId]: {
        ...current[studentId],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await addFeedbackToTeam(team.id, {
        type: 'Tutor Feedback',
        source: 'tutor',
        teamScore: Number(teamScore),
        teamComment,
        individualFeedback: team.students.map((student) => ({
          studentId: student.id,
          score: studentFeedback[student.id]?.score || null,
          comment: studentFeedback[student.id]?.comment || 'No individual comment provided.'
        }))
      });
      navigate(`/feedback-timeline/${team.id}`);
    } catch (err) {
      setError('Could not submit feedback. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) return <div className="qut-page"><DashboardHeader title="Send Tutor Feedback" /><main className="qut-content"><p>Loading...</p></main></div>;
  if (error || !team) return <div className="qut-page"><DashboardHeader title="Send Tutor Feedback" /><main className="qut-content"><p>{error || 'Team not found.'}</p></main></div>;

  return (
    <div className="qut-page">
      <DashboardHeader title="Send Tutor Feedback" />

      <main className="qut-content">
        <BackButton />

        <div className="qut-spacer" />
        <form className="qut-form-stack" onSubmit={handleSubmit}>
          <section className="qut-card">
            <h2>Send Tutor Feedback</h2>
            <p><strong>Team:</strong> {team.teamName}</p>
            <p><strong>Project:</strong> {team.projectName}</p>
          </section>

          <section className="qut-card">
            <h2>Team Feedback</h2>

            <div className="qut-field">
              <label htmlFor="tutorTeamScore">Team Score</label>
              <select id="tutorTeamScore" className="qut-input" value={teamScore} onChange={(event) => setTeamScore(event.target.value)} required>
                <option value="">Select score</option>
                <option value="1">1 - Poor</option>
                <option value="2">2 - Needs improvement</option>
                <option value="3">3 - Satisfactory</option>
                <option value="4">4 - Good</option>
                <option value="5">5 - Excellent</option>
              </select>
            </div>

            <div className="qut-field">
              <label htmlFor="tutorTeamComment">Team Comment</label>
              <textarea
                id="tutorTeamComment"
                className="qut-textarea"
                placeholder="Feedback for the team..."
                value={teamComment}
                onChange={(event) => setTeamComment(event.target.value)}
                required
              />
            </div>
          </section>

          <section className="qut-card">
            <h2>Individual Student Feedback</h2>
            <div className="qut-form-stack">
              {team.students.map((student) => (
                <div className="qut-info-box" key={student.id}>
                  <h3>{student.name}</h3>
                  <div className="qut-field">
                    <label htmlFor={`tutorScore-${student.id}`}>Individual Score</label>
                    <select
                      id={`tutorScore-${student.id}`}
                      className="qut-input"
                      value={studentFeedback[student.id]?.score || ''}
                      onChange={(event) => updateStudent(student.id, 'score', event.target.value)}
                    >
                      <option value="">Select score</option>
                      <option value="1">1 - Poor</option>
                      <option value="2">2 - Needs improvement</option>
                      <option value="3">3 - Satisfactory</option>
                      <option value="4">4 - Good</option>
                      <option value="5">5 - Excellent</option>
                    </select>
                  </div>

                  <div className="qut-field">
                    <label htmlFor={`tutorComment-${student.id}`}>Individual Comment</label>
                    <textarea
                      id={`tutorComment-${student.id}`}
                      className="qut-textarea"
                      placeholder={`Comment for ${student.name}...`}
                      value={studentFeedback[student.id]?.comment || ''}
                      onChange={(event) => updateStudent(student.id, 'comment', event.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <button className="qut-btn qut-btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Sending...' : 'Send Feedback'}
          </button>
        </form>
      </main>
    </div>
  );
};


export default TutorFeedback;
