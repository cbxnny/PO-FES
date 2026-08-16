import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BackButton from '../components/BackButton';
import DashboardHeader from '../components/DashboardHeader';
import { addFeedbackToTeam, getTeamById } from '../data/feedbackApi';
import { addMeeting } from '../data/meetingsApi';
import '../styles/dashboard.css';

const ratingOptions = [
  { value: '1', label: '1 - Below Expectations' },
  { value: '2', label: '2 - Meets Expectations' },
  { value: '3', label: '3 - Above Expectations' }
];

const ratingCriteria = [
  {
    domain: 'Product & Progression',
    below:
      'The students did not demonstrate significant progress on their project. The goals established at previous meetings have not been met, and no satisfactory explanation was offered for this.',
    meets:
      'The students demonstrate progress on their project that is at the expected level of competency for final-year students.',
    above:
      'The students demonstrate progress on their project that is above the expected level of competency for final-year students.'
  },
  {
    domain: 'Process & Teamwork',
    below:
      'The students do not appear to function well as a team. The contribution between students may be unequal and there may be significant issues with communication.',
    meets:
      'The students appear to be working well as a team, however, not all students are aware of the progress of others. The team integrates the feedback received.',
    above:
      'The students appear to be working very well as a team with all students contributing equally. Communication is well-managed, and all team members have clear roles in the project. All students offer feedback and integrate feedback effectively.'
  }
];

const createInitialStudentFeedback = (students = []) => {
  return students.reduce((acc, student) => {
    acc[student.id] = { score: '', comment: '' };
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

  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [attendanceAll, setAttendanceAll] = useState(false);
  const [attendees, setAttendees] = useState([]);

  const [productProgressionRating, setProductProgressionRating] = useState('');
  const [processTeamworkRating, setProcessTeamworkRating] = useState('');
  const [teamComment, setTeamComment] = useState('');
  const [commentForTutors, setCommentForTutors] = useState('');

  const [studentFeedback, setStudentFeedback] = useState({});
  const [openStudentFeedback, setOpenStudentFeedback] = useState({});
  const [showCriteria, setShowCriteria] = useState(false);

  useEffect(() => {
    getTeamById(teamId || 1)
      .then((data) => {
        setTeam(data);
        setStudentFeedback(createInitialStudentFeedback(data.students || []));
      })
      .catch(() => setError('Could not load this team. Please try again.'))
      .finally(() => setLoading(false));
  }, [teamId]);

  const commentsRequired =
    productProgressionRating === '1' || processTeamworkRating === '1';

  const handleAllAttendance = (checked) => {
    setAttendanceAll(checked);
    setAttendees(checked && team?.students ? team.students.map((student) => student.id) : []);
  };

  const handleStudentAttendance = (studentId, checked) => {
    setAttendees((current) => {
      const updated = checked
        ? [...new Set([...current, studentId])]
        : current.filter((id) => id !== studentId);

      setAttendanceAll(updated.length === team.students.length);
      return updated;
    });
  };

  const toggleStudentFeedback = (studentId) => {
    setOpenStudentFeedback((current) => ({
      ...current,
      [studentId]: !current[studentId]
    }));
  };

  const updateStudent = (studentId, field, value) => {
    setStudentFeedback((current) => ({
      ...current,
      [studentId]: {
        ...current[studentId],
        [field]: value
      }
    }));
  };

  const getAttendanceText = () => {
    if (attendanceAll) return 'All team members attended';

    return team.students
      .filter((student) => attendees.includes(student.id))
      .map((student) => student.name)
      .join(', ');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (!attendees.length) {
      alert('Please select meeting attendance before submitting feedback.');
      return;
    }

    if (commentsRequired && !teamComment.trim()) {
      alert('Written comments are required when a Below Expectations rating is selected.');
      return;
    }

    setSubmitting(true);

    try {
      await addMeeting({
        teamId: team.id,
        meetingDate,
        meetingTime,
        attendance: getAttendanceText(),
        productProgressionRating: productProgressionRating
          ? Number(productProgressionRating)
          : null,
        processTeamworkRating: processTeamworkRating
          ? Number(processTeamworkRating)
          : null
      });

      const individualFeedback = team.students
        .filter((student) => openStudentFeedback[student.id])
        .map((student) => ({
          studentId: student.id,
          score: studentFeedback[student.id]?.score
            ? Number(studentFeedback[student.id].score)
            : null,
          comment: studentFeedback[student.id]?.comment || ''
        }))
        .filter((student) => student.score || student.comment.trim());

      await addFeedbackToTeam(team.id, {
        type: 'Client Feedback',
        source: 'client',
        teamScore: null,
        teamComment,
        commentForTutors,
        individualFeedback
      });

      navigate(`/feedback-timeline/${team.id}`);
    } catch (err) {
      console.error(err);
      setError('Could not submit feedback. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="qut-page">
        <DashboardHeader title="Submit Feedback" />
        <main className="qut-content">
          <p>Loading...</p>
        </main>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="qut-page">
        <DashboardHeader title="Submit Feedback" />
        <main className="qut-content">
          <p>{error || 'Team not found.'}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="qut-page">
      <DashboardHeader title="Submit Feedback" />

      <main className="qut-content">
        <BackButton />

        <div className="feedback-form-container">
          <section className="qut-card feedback-hero-card">
            <h2>Feedback on Project Progress and Performance</h2>

            <div className="feedback-meta-inline">
              <span><strong>Team:</strong> {team.teamName}</span>
              <span><strong>Project:</strong> {team.projectName}</span>
            </div>

            <div className="feedback-divider" />

            <h2>Purpose and Guidelines</h2>

            <p>
              This feedback item is formative and is not directly marked. However,
              keeping an accurate record of meetings with the project owner is a
              mandatory part of the unit and helps verify the team’s progress and
              performance.
            </p>

            <p>
              Feedback should be completed at least fortnightly and should be based
              on the team’s progress since the previous meeting.
            </p>

            <p>
              If the team receives a Below Expectations rating, written comments
              must be provided so the issue can be discussed in the next tutor
              meeting.
            </p>
          </section>

          <div className="qut-spacer" />

          <form className="qut-form-stack feedback-form-stack" onSubmit={handleSubmit}>
            <section className="qut-card">
              <h2>Meeting Details</h2>

              <div className="feedback-two-column">
                <div className="qut-field">
                  <label htmlFor="meetingDate">Meeting Date</label>
                  <input
                    id="meetingDate"
                    className="qut-input"
                    type="date"
                    value={meetingDate}
                    onChange={(event) => setMeetingDate(event.target.value)}
                    required
                  />
                </div>

                <div className="qut-field">
                  <label htmlFor="meetingTime">Meeting Time</label>
                  <input
                    id="meetingTime"
                    className="qut-input"
                    type="time"
                    value={meetingTime}
                    onChange={(event) => setMeetingTime(event.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="feedback-attendance-header">
                <h3>Attendance</h3>

                <label className="feedback-all-attended">
                  <input
                    type="checkbox"
                    checked={attendanceAll}
                    onChange={(event) => handleAllAttendance(event.target.checked)}
                  />{' '}
                  All team members attended
                </label>
              </div>

              <div className="feedback-student-list">
                {team.students.map((student) => (
                  <div className="feedback-student-row" key={student.id}>
                    <div className="feedback-student-topline">
                      <label className="feedback-student-present">
                        <input
                          type="checkbox"
                          checked={attendees.includes(student.id)}
                          onChange={(event) =>
                            handleStudentAttendance(student.id, event.target.checked)
                          }
                        />{' '}
                        <span>{student.name}</span>
                      </label>

                      <button
                        type="button"
                        className="qut-btn qut-btn-outline qut-btn-sm"
                        onClick={() => toggleStudentFeedback(student.id)}
                      >
                        {openStudentFeedback[student.id]
                          ? 'Hide feedback'
                          : 'Add individual feedback'}
                      </button>
                    </div>

                    {openStudentFeedback[student.id] && (
                      <div className="feedback-individual-panel">
                        <div className="qut-field">
                          <label htmlFor={`score-${student.id}`}>Individual Rating</label>
                          <select
                            id={`score-${student.id}`}
                            className="qut-input"
                            value={studentFeedback[student.id]?.score || ''}
                            onChange={(event) =>
                              updateStudent(student.id, 'score', event.target.value)
                            }
                          >
                            <option value="">No rating</option>
                            {ratingOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="qut-field">
                          <label htmlFor={`comment-${student.id}`}>Individual Comment</label>
                          <textarea
                            id={`comment-${student.id}`}
                            className="qut-textarea"
                            placeholder={`Optional comment for ${student.name}...`}
                            value={studentFeedback[student.id]?.comment || ''}
                            onChange={(event) =>
                              updateStudent(student.id, 'comment', event.target.value)
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="qut-card">
              <div className="feedback-heading-row">
                <div>
                  <h2>Team Performance Ratings</h2>
                  <p>Please select one rating for each domain.</p>
                </div>

                <button
                  type="button"
                  className="feedback-criteria-button"
                  title="View rating criteria"
                  onClick={() => setShowCriteria(true)}
                >
                  <span>?</span>
                  View criteria
                </button>
              </div>

              <div className="feedback-two-column">
                <div className="qut-field">
                  <label htmlFor="productProgressionRating">Product &amp; Progression</label>
                  <select
                    id="productProgressionRating"
                    className="qut-input"
                    value={productProgressionRating}
                    onChange={(event) => setProductProgressionRating(event.target.value)}
                    required
                  >
                    <option value="">Select rating</option>
                    {ratingOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="qut-field">
                  <label htmlFor="processTeamworkRating">Process &amp; Teamwork</label>
                  <select
                    id="processTeamworkRating"
                    className="qut-input"
                    value={processTeamworkRating}
                    onChange={(event) => setProcessTeamworkRating(event.target.value)}
                    required
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
                <label htmlFor="teamComment">
                  Comments {commentsRequired ? '(required)' : '(optional)'}
                </label>
                <textarea
                  id="teamComment"
                  className="qut-textarea"
                  placeholder="Provide feedback about the team’s progress, communication, teamwork, technical work, goals, attendance, or anything that should be discussed in the next tutor meeting."
                  value={teamComment}
                  onChange={(event) => setTeamComment(event.target.value)}
                  required={commentsRequired}
                />
              </div>

              <div className="qut-field">
                <label htmlFor="commentForTutors">Private comment for tutors (optional)</label>
                <textarea
                  id="commentForTutors"
                  className="qut-textarea feedback-textarea-small"
                  placeholder="Optional private note for tutors or teaching staff. This should not be shown to students or the project team."
                  value={commentForTutors}
                  onChange={(event) => setCommentForTutors(event.target.value)}
                />
              </div>
            </section>

            <button
              className="qut-btn qut-btn-primary feedback-submit-btn"
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </form>
        </div>
      </main>

      {showCriteria && (
        <div className="feedback-modal-overlay" onClick={() => setShowCriteria(false)}>
          <div
            className="feedback-modal-card feedback-modal-card-wide"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="feedback-modal-header">
              <h2>Rating Criteria</h2>
              <button
                type="button"
                className="feedback-modal-close"
                onClick={() => setShowCriteria(false)}
                aria-label="Close rating criteria"
              >
                ×
              </button>
            </div>

            <div className="feedback-modal-body">
              <table className="qut-table feedback-criteria-table">
                <thead>
                  <tr>
                    <th>Domain</th>
                    <th>Below Expectations</th>
                    <th>Meets Expectations</th>
                    <th>Above Expectations</th>
                  </tr>
                </thead>
                <tbody>
                  {ratingCriteria.map((criteria) => (
                    <tr key={criteria.domain}>
                      <td><strong>{criteria.domain}</strong></td>
                      <td>{criteria.below}</td>
                      <td>{criteria.meets}</td>
                      <td>{criteria.above}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmitFeedback;