import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader';
import { getCurrentUser } from '../utils/auth';
import { getUserDisplayName } from '../utils/roleUtils';
import { formatDate, getTeams, getTeamStatus } from '../data/feedbackData';
import '../styles/dashboard.css';

const ratingLabels = {
  1: '1 - Below Expectations',
  2: '2 - Meets Expectations',
  3: '3 - Above Expectations'
};

const getRatingText = (rating) => {
  if (rating === null || rating === undefined || rating === '') return 'Not recorded';
  return ratingLabels[Number(rating)] || rating;
};

const formatAttendance = (attendance) => {
  if (!attendance || !attendance.length) return 'Not recorded';
  if (attendance.includes('All')) return 'All team members attended';
  return attendance.join(', ');
};

const hasDomainRatings = (feedback) => (
  feedback.productProgressionRating !== undefined ||
  feedback.processTeamworkRating !== undefined
);

const FullSubmissionDetails = ({ submission }) => (
  <div className="qut-details-panel">
    {(submission.meetingDate || submission.meetingTime || submission.attendance) && (
      <div className="qut-info-box">
        <h4>Meeting Details</h4>
        <p><strong>Meeting Date:</strong> {submission.meetingDate ? formatDate(submission.meetingDate) : 'Not recorded'}</p>
        <p><strong>Meeting Time:</strong> {submission.meetingTime || 'Not recorded'}</p>
        <p><strong>Attendance:</strong> {formatAttendance(submission.attendance)}</p>
      </div>
    )}

    <div className="qut-info-box">
      <h4>Team Performance Ratings</h4>

      {hasDomainRatings(submission) ? (
        <>
          <p><strong>Product &amp; Progression:</strong> {getRatingText(submission.productProgressionRating)}</p>
          <p><strong>Process &amp; Teamwork:</strong> {getRatingText(submission.processTeamworkRating)}</p>
        </>
      ) : (
        <p><strong>Team Score:</strong> {submission.teamScore ?? 'N/A'}</p>
      )}

      <p><strong>Comments:</strong> {submission.teamComment || 'No comments provided.'}</p>
    </div>

    {submission.individualFeedback?.length > 0 && (
      <div className="qut-info-box">
        <h4>Individual Contributions</h4>

        {submission.individualFeedback.map((student) => (
          <div key={`${submission.id}-${student.studentName}`} className="qut-student-feedback-line">
            <p><strong>{student.studentName}</strong></p>
            <p><strong>Rating:</strong> {getRatingText(student.score)}</p>
            <p><strong>Comment:</strong> {student.comment || 'No individual comment provided.'}</p>
          </div>
        ))}
      </div>
    )}

    {submission.commentForTutors && (
      <div className="qut-info-box">
        <h4>Comment for Tutors / Teaching Staff</h4>
        <p>{submission.commentForTutors}</p>
      </div>
    )}
  </div>
);

const ProjectOwnerDashboard = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const displayName = getUserDisplayName(user);
  const allTeams = getTeams();
  const [openItems, setOpenItems] = useState([]);

  const matchingTeams = allTeams.filter((team) => team.clientName === displayName);
  const teams = matchingTeams.length
    ? matchingTeams
    : allTeams.filter((team) => ['Maya Patel', 'Client A', 'Client W'].includes(team.clientName));

  const previousSubmissions = teams
    .flatMap((team) => team.feedbackHistory
      .filter((feedback) => feedback.source === 'client')
      .map((feedback) => ({
        ...feedback,
        teamId: team.id,
        teamName: team.teamName,
        projectName: team.projectName
      })))
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  const toggleOpen = (submissionId) => {
    setOpenItems((current) => (
      current.includes(submissionId)
        ? current.filter((id) => id !== submissionId)
        : [...current, submissionId]
    ));
  };

  return (
    <div className="qut-page">
      <DashboardHeader title="Client Dashboard" />

      <main className="qut-content">
        <h2 className="qut-section-heading">Your Teams</h2>

        <div className="qut-compact-grid">
          {teams.map((team) => {
            const status = getTeamStatus(team);

            return (
              <section className="qut-card qut-compact-card" key={team.id}>
                <div>
                  <h3>{team.teamName}</h3>
                  <p><strong>Project:</strong> {team.projectName}</p>
                  <p><strong>Last feedback:</strong> {status.lastText}</p>
                  <span className={`qut-status ${status.className}`}>{status.label}</span>
                </div>

                <div className="qut-button-row">
                  <button className="qut-btn qut-btn-outline" onClick={() => navigate(`/feedback-timeline/${team.id}`)}>
                    View Timeline
                  </button>
                  <button className="qut-btn qut-btn-primary" onClick={() => navigate(`/submit-feedback/${team.id}`)}>
                    Submit Feedback
                  </button>
                </div>
              </section>
            );
          })}
        </div>

        <div className="qut-spacer" />
        <h2 className="qut-section-heading">Previous Submissions</h2>

        <div className="qut-list-grid">
          {previousSubmissions.length ? previousSubmissions.map((submission) => {
            const isOpen = openItems.includes(submission.id);

            return (
              <section className="qut-card qut-feedback-card" key={submission.id}>
                <div className="qut-feedback-topline">
                  <span className="qut-status client">Client Feedback</span>
                  <span className="qut-date-text">
                    {formatDate(submission.submittedAt)} · Submitted by {submission.submittedBy}
                  </span>
                </div>

                <h3>{submission.teamName}</h3>
                <p><strong>Project:</strong> {submission.projectName}</p>

                {hasDomainRatings(submission) ? (
                  <>
                    <p><strong>Product &amp; Progression:</strong> {getRatingText(submission.productProgressionRating)}</p>
                    <p><strong>Process &amp; Teamwork:</strong> {getRatingText(submission.processTeamworkRating)}</p>
                  </>
                ) : (
                  <p><strong>Team Score:</strong> {submission.teamScore ?? 'N/A'}</p>
                )}

                <p><strong>Summary:</strong> {submission.teamComment || 'No summary provided.'}</p>

                <div className="qut-button-row">
                  <button className="qut-btn qut-btn-outline" onClick={() => toggleOpen(submission.id)}>
                    {isOpen ? 'Close Full Submission' : 'Open Full Submission'}
                  </button>

                  <button className="qut-btn qut-btn-outline" onClick={() => navigate(`/feedback-timeline/${submission.teamId}`)}>
                    View Timeline
                  </button>
                </div>

                {isOpen && <FullSubmissionDetails submission={submission} />}
              </section>
            );
          }) : (
            <section className="qut-card">
              <p>No previous submissions yet.</p>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProjectOwnerDashboard;