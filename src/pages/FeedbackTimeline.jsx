import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import BackButton from '../components/BackButton';
import DashboardHeader from '../components/DashboardHeader';
import { getCurrentUser } from '../utils/auth';
import { normalizeRole } from '../utils/roleUtils';
import { formatDate, getTeamById, getTeamStatus, sourceClass } from '../data/feedbackApi';
import '../styles/dashboard.css';

const FullSubmissionDetails = ({ feedback, user }) => {
  const role = normalizeRole(user?.role);
  const isStudent = role === 'student';
  const visibleIndividualFeedback = isStudent
    ? feedback.individualFeedback.filter((item) => item.studentId === user.id)
    : feedback.individualFeedback;

  return (
    <div className="qut-details-panel">
      <div className="qut-info-box">
        <p><strong>Team Score:</strong> {feedback.teamScore ?? 'N/A'}</p>
        <p><strong>Team Comment:</strong> {feedback.teamComment || 'No team comment provided.'}</p>
      </div>

      {visibleIndividualFeedback.length > 0 && (
        <div className="qut-info-box">
          <h4>Individual Student Feedback</h4>
          {visibleIndividualFeedback.map((student) => (
            <div key={`${feedback.id}-${student.studentId}`} className="qut-student-feedback-line">
              <p><strong>{student.studentName}</strong></p>
              <p>Score: {student.score ?? 'N/A'}</p>
              <p>Comment: {student.comment || 'No individual comment provided.'}</p>
            </div>
          ))}
        </div>
      )}

      {!isStudent && feedback.commentForTutors && (
        <div className="qut-info-box">
          <h4>Comment for Tutors / Teaching Staff</h4>
          <p>{feedback.commentForTutors}</p>
        </div>
      )}

      {!isStudent && feedback.commentForClient && (
        <div className="qut-info-box">
          <h4>Comment for Client</h4>
          <p>{feedback.commentForClient}</p>
        </div>
      )}
    </div>
  );
};

const FeedbackTimeline = () => {
  const { teamId } = useParams();
  const [openItems, setOpenItems] = useState([]);
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = getCurrentUser();

  useEffect(() => {
    getTeamById(teamId)
      .then(setTeam)
      .catch(() => setError('Could not load this team. Please try again.'))
      .finally(() => setLoading(false));
  }, [teamId]);
  
  const toggleOpen = (feedbackId) => {
    setOpenItems((current) => (
      current.includes(feedbackId)
        ? current.filter((id) => id !== feedbackId)
        : [...current, feedbackId]
    ));
  };

  if (loading) return <div className="qut-page"><DashboardHeader title="Feedback Timeline" /><main className="qut-content"><p>Loading...</p></main></div>;
  if (error || !team) return <div className="qut-page"><DashboardHeader title="Feedback Timeline" /><main className="qut-content"><p>{error || 'Team not found.'}</p></main></div>;

  const status = getTeamStatus(team);
  const feedbackItems = [...team.feedbackHistory]
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  return (
    <div className="qut-page">
      <DashboardHeader title="Feedback Timeline" />

      <main className="qut-content">
        <BackButton />

        <div className="qut-spacer" />
        <section className="qut-card">
          <h2>{team.teamName}</h2>
          <p><strong>Project:</strong> {team.projectName}</p>
          <p><strong>Client:</strong> {team.clientName}</p>
          <p><strong>Last feedback:</strong> {status.lastText}</p>
          <span className={`qut-status ${status.className}`}>{status.label}</span>
        </section>

        <div className="qut-spacer" />
        <h2 className="qut-section-heading">Feedback Timeline</h2>

        <div className="qut-list-grid">
          {feedbackItems.length ? feedbackItems.map((feedback) => {
            const isOpen = openItems.includes(feedback.id);
            return (
              <section className="qut-card qut-feedback-card" key={feedback.id}>
                <div className="qut-feedback-topline">
                  <span className={`qut-status ${sourceClass(feedback.source)}`}>{feedback.type}</span>
                  <span className="qut-date-text">{formatDate(feedback.submittedAt)} · Submitted by {feedback.submittedBy}</span>
                </div>

                <p><strong>Team Score:</strong> {feedback.teamScore ?? 'N/A'}</p>
                <p><strong>Summary:</strong> {feedback.teamComment || 'No summary provided.'}</p>

                <button className="qut-btn qut-btn-outline" onClick={() => toggleOpen(feedback.id)}>
                  {isOpen ? 'Close Full Submission' : 'Open Full Submission'}
                </button>

                {isOpen && <FullSubmissionDetails feedback={feedback} user={user} />}
              </section>
            );
          }) : (
            <section className="qut-card"><p>No feedback submitted yet.</p></section>
          )}
        </div>
      </main>
    </div>
  );
};

export default FeedbackTimeline;
