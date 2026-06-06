import React, { useState } from 'react';
import BackButton from '../components/BackButton';
import DashboardHeader from '../components/DashboardHeader';
import '../styles/dashboard.css';

const EditDashboard = () => {
  const [teamScore, setTeamScore] = useState('');
  const [teamComment, setTeamComment] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    alert('Changes saved in the frontend preview. Backend saving can be wired later.');
  };

  return (
    <div className="qut-page">
      <DashboardHeader title="Edit Feedback" />

      <main className="qut-content">
        <BackButton />

        <div className="qut-spacer" />
        <form className="qut-form-stack" onSubmit={handleSubmit}>
          <section className="qut-card">
            <h2>Client Feedback Editing</h2>
            <p>Use this page for future editing workflows. Current implementation is frontend-only.</p>
          </section>

          <section className="qut-card">
            <div className="qut-field">
              <label htmlFor="editTeamScore">Team Score</label>
              <select id="editTeamScore" className="qut-input" value={teamScore} onChange={(event) => setTeamScore(event.target.value)}>
                <option value="">Select score</option>
                <option value="1">1 - Poor</option>
                <option value="2">2 - Needs improvement</option>
                <option value="3">3 - Satisfactory</option>
                <option value="4">4 - Good</option>
                <option value="5">5 - Excellent</option>
              </select>
            </div>
            <div className="qut-field">
              <label htmlFor="editTeamComment">Team Comment</label>
              <textarea
                id="editTeamComment"
                className="qut-textarea"
                placeholder="Overall team comment..."
                value={teamComment}
                onChange={(event) => setTeamComment(event.target.value)}
              />
            </div>
          </section>

          <button type="submit" className="qut-btn qut-btn-primary">Save Changes</button>
        </form>
      </main>
    </div>
  );
};

export default EditDashboard;
