import React, { useState } from 'react';
import BackButton from '../components/BackButton';
import DashboardHeader from '../components/DashboardHeader';
import '../styles/dashboard.css';

const ratingOptions = [
  { value: '1', label: '1 - Below Expectations' },
  { value: '2', label: '2 - Meets Expectations' },
  { value: '3', label: '3 - Above Expectations' }
];

const EditDashboard = () => {
  const [productProgressionRating, setProductProgressionRating] = useState('');
  const [processTeamworkRating, setProcessTeamworkRating] = useState('');
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

        <div className="feedback-form-container">
          <div className="qut-spacer" />

          <form className="qut-form-stack" onSubmit={handleSubmit}>
            <section className="qut-card">
              <h2>Client Feedback Editing</h2>
              <p>
                Use this page for future editing workflows. Current implementation is frontend-only.
              </p>
            </section>

            <section className="qut-card">
              <h2>Team Performance Ratings</h2>
              <p>Please update one rating for each domain.</p>

              <div className="qut-info-box">
                <h3>Product &amp; Progression</h3>

                <div className="qut-field">
                  <label htmlFor="editProductProgressionRating">Rating</label>
                  <select
                    id="editProductProgressionRating"
                    className="qut-input"
                    value={productProgressionRating}
                    onChange={(event) => setProductProgressionRating(event.target.value)}
                  >
                    <option value="">Select rating</option>
                    {ratingOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="qut-info-box">
                <h3>Process &amp; Teamwork</h3>

                <div className="qut-field">
                  <label htmlFor="editProcessTeamworkRating">Rating</label>
                  <select
                    id="editProcessTeamworkRating"
                    className="qut-input"
                    value={processTeamworkRating}
                    onChange={(event) => setProcessTeamworkRating(event.target.value)}
                  >
                    <option value="">Select rating</option>
                    {ratingOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="qut-field">
                <label htmlFor="editTeamComment">Comments</label>
                <textarea
                  id="editTeamComment"
                  className="qut-textarea"
                  placeholder="Overall feedback comment..."
                  value={teamComment}
                  onChange={(event) => setTeamComment(event.target.value)}
                />
              </div>
            </section>

            <button type="submit" className="qut-btn qut-btn-primary">
              Save Changes
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default EditDashboard;