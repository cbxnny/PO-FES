import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BackButton from '../components/BackButton';
import DashboardHeader from '../components/DashboardHeader';
import { getCurrentUser } from '../utils/auth';
import { getUserDisplayName } from '../utils/roleUtils';
import { addFeedbackToTeam, getTeamById } from '../data/feedbackData';
import '../styles/dashboard.css';

const ClientComment = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const user = getCurrentUser();
  const team = getTeamById(teamId || 1);
  const [comment, setComment] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();

    addFeedbackToTeam(team.id, {
      type: 'Tutor Comment for Client',
      source: 'tutor-to-client',
      submittedBy: getUserDisplayName(user),
      teamScore: null,
      teamComment: 'Tutor comment for client added.',
      commentForClient: comment,
      individualFeedback: []
    });

    navigate(`/feedback-timeline/${team.id}`);
  };

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

          <button className="qut-btn qut-btn-primary" type="submit">Save Comment</button>
        </form>
      </main>
    </div>
  );
};

export default ClientComment;
