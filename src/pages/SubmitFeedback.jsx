import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BackButton from '../components/BackButton';
import DashboardHeader from '../components/DashboardHeader';
import { getUserDisplayName } from '../utils/roleUtils';
import { addFeedbackToTeam, getTeamById } from '../data/feedbackApi';
import '../styles/dashboard.css';
import { SkeletonGrid } from '../components/SkeletonCard';

const createInitialStudentFeedback = (students) => {
  return students.reduce((acc, student) => {
    acc[student] = { score: '', comment: '' };
    return acc;
  }, {});
};

const SubmitFeedback = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [teamScore, setTeamScore] = useState('');
  const [teamComment, setTeamComment] = useState('');
  const [commentForTutors, setCommentForTutors] = useState('');
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
        type: 'Client Feedback',
        source: 'client',
        teamScore: Number(teamScore),
        teamComment,
        commentForTutors,
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

  if (loading) return (
    <div className="qut-page">
      <DashboardHeader title="Submit Feedback" />
      <main className="qut-content">
        <BackButton />
        <div className="qut-spacer" />
        <section className="qut-skeleton-card">
          <span className="qut-skeleton qut-skeleton-line qut-skeleton-title" />
          <span className="qut-skeleton qut-skeleton-line qut-skeleton-short" />
        </section>
        <div className="qut-spacer" />
        <section className="qut-skeleton-card">
          <span className="qut-skeleton qut-skeleton-line qut-skeleton-title" />
          <span className="qut-skeleton qut-skeleton-line" />
          <span className="qut-skeleton qut-skeleton-line" />
          <span className="qut-skeleton qut-skeleton-line qut-skeleton-short" />
        </section>
      </main>
    </div>
  );
  if (error || !team) return <div className="qut-page"><DashboardHeader title="Submit Feedback" /><main className="qut-content"><p>{error || 'Team not found.'}</p></main></div>;


  return (
    <div className="qut-page">
      <DashboardHeader title="Submit Feedback" />

      <main className="qut-content">
        <BackButton />

        <div className="qut-spacer" />
        <section className="qut-card">
          <h2>Submit Feedback</h2>
          <p><strong>Team:</strong> {team.teamName}</p>
          <p><strong>Project:</strong> {team.projectName}</p>
        </section>

        <div className="qut-spacer" />
        <form className="qut-form-stack" onSubmit={handleSubmit}>
          <section className="qut-card">
            <h2>Team Feedback</h2>

            <div className="qut-field">
              <label htmlFor="teamScore">Team Score</label>
              <select id="teamScore" className="qut-input" value={teamScore} onChange={(event) => setTeamScore(event.target.value)} required>
                <option value="">Select score</option>
                <option value="1">1 - Poor</option>
                <option value="2">2 - Needs improvement</option>
                <option value="3">3 - Satisfactory</option>
                <option value="4">4 - Good</option>
                <option value="5">5 - Excellent</option>
              </select>
            </div>

            <div className="qut-field">
              <label htmlFor="teamComment">Team Comment</label>
              <textarea
                id="teamComment"
                className="qut-textarea"
                placeholder="Share your thoughts on the team's overall performance..."
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
                    <label htmlFor={`score-${student.id}`}>Individual Score</label>
                    <select
                      id={`score-${student.id}`}
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
                    <label htmlFor={`comment-${student.id}`}>Individual Comment</label>
                    <textarea
                      id={`comment-${student.id}`}
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

          <section className="qut-card">
            <h2>Comment for Tutors / Teaching Staff</h2>
            <div className="qut-field">
              <label htmlFor="commentForTutors">Comment for Tutors</label>
              <textarea
                id="commentForTutors"
                className="qut-textarea"
                placeholder="This comment is visible to tutors/teaching staff, not students..."
                value={commentForTutors}
                onChange={(event) => setCommentForTutors(event.target.value)}
              />
            </div>
          </section>

          <button className="qut-btn qut-btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      </main>
    </div>
  );
};

export default SubmitFeedback;