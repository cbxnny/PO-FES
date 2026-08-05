import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BackButton from '../components/BackButton';
import DashboardHeader from '../components/DashboardHeader';
import { getCurrentUser } from '../utils/auth';
import { getUserDisplayName } from '../utils/roleUtils';
import { addFeedbackToTeam, getTeamById } from '../data/feedbackData';
import '../styles/dashboard.css';

const createInitialStudentFeedback = (students) => {
  return students.reduce((acc, student) => {
    acc[student] = { score: '', comment: '' };
    return acc;
  }, {});
};

const SubmitFeedback = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const user = getCurrentUser();
  const team = getTeamById(teamId || 1);
  const [teamScore, setTeamScore] = useState('');
  const [teamComment, setTeamComment] = useState('');
  const [commentForTutors, setCommentForTutors] = useState('');
  const [studentFeedback, setStudentFeedback] = useState(createInitialStudentFeedback(team.students));

  const updateStudent = (student, field, value) => {
    setStudentFeedback((current) => ({
      ...current,
      [student]: {
        ...current[student],
        [field]: value
      }
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    addFeedbackToTeam(team.id, {
      type: 'Client Feedback',
      source: 'client',
      submittedBy: getUserDisplayName(user),
      teamScore: Number(teamScore),
      teamComment,
      commentForTutors,
      individualFeedback: team.students.map((student) => ({
        studentName: student,
        score: studentFeedback[student]?.score || null,
        comment: studentFeedback[student]?.comment || 'No individual comment provided.'
      }))
    });

    navigate(`/feedback-timeline/${team.id}`);
  };

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
                <div className="qut-info-box" key={student}>
                  <h3>{student}</h3>

                  <div className="qut-field">
                    <label htmlFor={`score-${student}`}>Individual Score</label>
                    <select
                      id={`score-${student}`}
                      className="qut-input"
                      value={studentFeedback[student]?.score || ''}
                      onChange={(event) => updateStudent(student, 'score', event.target.value)}
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
                    <label htmlFor={`comment-${student}`}>Individual Comment</label>
                    <textarea
                      id={`comment-${student}`}
                      className="qut-textarea"
                      placeholder={`Comment for ${student}...`}
                      value={studentFeedback[student]?.comment || ''}
                      onChange={(event) => updateStudent(student, 'comment', event.target.value)}
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

          <button className="qut-btn qut-btn-primary" type="submit">Submit Feedback</button>
        </form>
      </main>
    </div>
  );
};

export default SubmitFeedback;
