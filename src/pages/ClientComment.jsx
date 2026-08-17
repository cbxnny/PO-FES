import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BackButton from '../components/BackButton';
import DashboardHeader from '../components/DashboardHeader';
import { addFeedbackToTeam, getTeamById } from '../data/feedbackApi';
import '../styles/dashboard.css';
import { SkeletonGrid } from '../components/SkeletonCard';

const ClientComment = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [comment, setComment] = useState('');

  useEffect(() => {
    getTeamById(teamId || 1)
      .then(setTeam)
      .catch(() => setError('Could not load this team. Please try again.'))
      .finally(() => setLoading(false));
  }, [teamId]);
  
  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await addFeedbackToTeam(team.id, {
        type: 'Tutor Comment for Client',
        source: 'tutor-to-client',
        teamScore: null,
        teamComment: 'Tutor comment for client added.',
        commentForClient: comment,
        individualFeedback: []
      });
      navigate(`/feedback-timeline/${team.id}`);
    } catch (err) {
      setError('Could not save comment. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="qut-page">
      <DashboardHeader title="Comment for Client" />
      <main className="qut-content">
        <BackButton />
        <div className="qut-spacer" />
        <section className="qut-skeleton-card">
          <span className="qut-skeleton qut-skeleton-line qut-skeleton-title" />
          <span className="qut-skeleton qut-skeleton-line qut-skeleton-short" />
        </section>
        <div className="qut-spacer" />
        <section className="qut-skeleton-card">
          <span className="qut-skeleton qut-skeleton-line" />
          <span className="qut-skeleton qut-skeleton-line" />
          <span className="qut-skeleton qut-skeleton-line qut-skeleton-short" />
        </section>
      </main>
    </div>
  );
  if (error || !team) return <div className="qut-page"><DashboardHeader title="Comment for Client" /><main className="qut-content"><p>{error || 'Team not found.'}</p></main></div>;

  return (
    <div className="qut-page">
      <DashboardHeader title="Comment for Client" />

      <main className="qut-content">
        <BackButton />

        <div className="qut-spacer" />
        <form className="qut-form-stack" onSubmit={handleSubmit}>
          <section className="qut-card">
            <h2>Comment for Client</h2>
            <p><strong>Client:</strong> {team.clientName}</p>
            <p><strong>Team:</strong> {team.teamName}</p>
          </section>

          <section className="qut-card">
            <div className="qut-field">
              <label htmlFor="clientComment">Comment</label>
              <textarea
                id="clientComment"
                className="qut-textarea"
                placeholder="Write a comment for the client..."
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                required
              />
            </div>
          </section>

          <button className="qut-btn qut-btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Comment'}
          </button>
        </form>
      </main>
    </div>
  );
};

export default ClientComment;