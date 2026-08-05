import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BackButton from '../components/BackButton';
import DashboardHeader from '../components/DashboardHeader';
import { getCurrentUser } from '../utils/auth';
import { getUserDisplayName } from '../utils/roleUtils';
import { addFeedbackToTeam, getTeamById } from '../data/feedbackData';
import '../styles/dashboard.css';

const ratingOptions = [
  { value: '1', label: '1 - Below Expectations' },
  { value: '2', label: '2 - Meets Expectations' },
  { value: '3', label: '3 - Above Expectations' }
];

const defaultTeamMembers = [
  'Dinh (Ben)',
  'Jayden',
  'James',
  'Owen',
  'Sahil'
];

const createInitialStudentFeedback = (students) => {
  return students.reduce((acc, student) => {
    acc[student] = { score: '', comment: '' };
    return acc;
  }, {});
};

const getAverageRating = (ratings) => {
  const validRatings = ratings.map(Number).filter((rating) => !Number.isNaN(rating));
  if (!validRatings.length) return null;

  const total = validRatings.reduce((sum, rating) => sum + rating, 0);
  return Number((total / validRatings.length).toFixed(1));
};

const TutorFeedback = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const user = getCurrentUser();
  const team = getTeamById(teamId || 1);

  const teamMembers = team.students && team.students.length >= 5
    ? team.students
    : defaultTeamMembers;

  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [attendanceAll, setAttendanceAll] = useState(false);
  const [attendees, setAttendees] = useState([]);
  const [productProgressionRating, setProductProgressionRating] = useState('');
  const [processTeamworkRating, setProcessTeamworkRating] = useState('');
  const [teamComment, setTeamComment] = useState('');
  const [studentFeedback, setStudentFeedback] = useState(createInitialStudentFeedback(teamMembers));

  const commentsRequired = productProgressionRating === '1' || processTeamworkRating === '1';

  const handleAllAttendance = (checked) => {
    setAttendanceAll(checked);
    setAttendees(checked ? teamMembers : []);
  };

  const handleStudentAttendance = (student, checked) => {
    setAttendees((current) => {
      const updated = checked
        ? [...new Set([...current, student])]
        : current.filter((name) => name !== student);

      setAttendanceAll(updated.length === teamMembers.length);
      return updated;
    });
  };

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

    if (!attendees.length) {
      alert('Please select meeting attendance before submitting feedback.');
      return;
    }

    if (commentsRequired && !teamComment.trim()) {
      alert('Written comments are required when a Below Expectations rating is selected.');
      return;
    }

    addFeedbackToTeam(team.id, {
      type: 'Tutor Feedback',
      source: 'tutor',
      submittedBy: getUserDisplayName(user),
      submittedAt: new Date().toISOString(),
      meetingDate,
      meetingTime,
      attendance: attendanceAll ? ['All'] : attendees,
      productProgressionRating: Number(productProgressionRating),
      processTeamworkRating: Number(processTeamworkRating),
      teamScore: getAverageRating([productProgressionRating, processTeamworkRating]),
      teamComment,
      individualFeedback: teamMembers
        .map((student) => ({
          studentName: student,
          score: studentFeedback[student]?.score ? Number(studentFeedback[student].score) : null,
          comment: studentFeedback[student]?.comment || ''
        }))
        .filter((student) => student.score || student.comment.trim())
    });

    navigate(`/feedback-timeline/${team.id}`);
  };

  return (
    <div className="qut-page">
      <DashboardHeader title="Send Tutor Feedback" />

      <main className="qut-content">
        <BackButton />

        <div className="feedback-form-container">
          <section className="qut-card feedback-intro-card">
            <h2>Feedback on Project Progress and Performance</h2>

            <div className="feedback-meta feedback-meta-row">
              <p><strong>Team:</strong> {team.teamName}</p>
              <p><strong>Project:</strong> {team.projectName}</p>
            </div>

            <div className="feedback-divider" />

            <h2>Purpose and Guidelines</h2>
            <p>
              This feedback item is formative and is used to keep an accurate record of team progress, communication, and performance during the project.
            </p>
            <p>
              Feedback should be completed at least fortnightly and should be based on the team’s progress since the previous meeting or reporting period.
            </p>
            <p>
              If the team receives a Below Expectations rating, written comments must be provided so the issue can be clearly discussed and followed up.
            </p>
          </section>

          <div className="qut-spacer" />

          <form className="qut-form-stack" onSubmit={handleSubmit}>
            <section className="qut-card">
              <h2>Meeting Details</h2>

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

              <div className="qut-field">
                <label>Meeting Attendance</label>

                <div className="qut-info-box">
                  <label>
                    <input
                      type="checkbox"
                      checked={attendanceAll}
                      onChange={(event) => handleAllAttendance(event.target.checked)}
                    />{' '}
                    All team members attended
                  </label>
                </div>

                <div className="qut-info-box">
                  <p><strong>Or select members present:</strong></p>

                  {teamMembers.map((student) => (
                    <label key={student} style={{ display: 'block', marginTop: '8px' }}>
                      <input
                        type="checkbox"
                        checked={attendees.includes(student)}
                        onChange={(event) => handleStudentAttendance(student, event.target.checked)}
                      />{' '}
                      {student}
                    </label>
                  ))}
                </div>
              </div>
            </section>

            <section className="qut-card">
              <h2>Team Performance Ratings</h2>
              <p>Please select one rating for each domain.</p>

              <div className="qut-info-box">
                <h3>Product &amp; Progression</h3>

                <div className="qut-field">
                  <label htmlFor="productProgressionRating">Rating</label>
                  <select
                    id="productProgressionRating"
                    className="qut-input"
                    value={productProgressionRating}
                    onChange={(event) => setProductProgressionRating(event.target.value)}
                    required
                  >
                    <option value="">Select rating</option>
                    {ratingOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="qut-info-box">
                <h3>Process &amp; Teamwork</h3>

                <div className="qut-field">
                  <label htmlFor="processTeamworkRating">Rating</label>
                  <select
                    id="processTeamworkRating"
                    className="qut-input"
                    value={processTeamworkRating}
                    onChange={(event) => setProcessTeamworkRating(event.target.value)}
                    required
                  >
                    <option value="">Select rating</option>
                    {ratingOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
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
                  placeholder="Provide any feedback about the team’s progress, communication, teamwork, technical work, goals, attendance, or anything that should be followed up."
                  value={teamComment}
                  onChange={(event) => setTeamComment(event.target.value)}
                  required={commentsRequired}
                />
              </div>
            </section>

            <section className="qut-card">
              <h2>Individual Contributions</h2>
              <p>
                Optional: only complete this section to recognise an outstanding contribution or provide feedback about lack of contribution.
              </p>

              <div className="qut-form-stack">
                {teamMembers.map((student) => (
                  <div className="qut-info-box" key={student}>
                    <h3>{student}</h3>

                    <div className="qut-field">
                      <label htmlFor={`tutorScore-${student}`}>Individual Rating</label>
                      <select
                        id={`tutorScore-${student}`}
                        className="qut-input"
                        value={studentFeedback[student]?.score || ''}
                        onChange={(event) => updateStudent(student, 'score', event.target.value)}
                      >
                        <option value="">No rating</option>
                        {ratingOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="qut-field">
                      <label htmlFor={`tutorComment-${student}`}>Individual Comment</label>
                      <textarea
                        id={`tutorComment-${student}`}
                        className="qut-textarea"
                        placeholder={`Optional comment for ${student}...`}
                        value={studentFeedback[student]?.comment || ''}
                        onChange={(event) => updateStudent(student, 'comment', event.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="qut-card">
              <h2>Rating Criteria</h2>

              <table className="qut-table">
                <thead>
                  <tr>
                    <th>Domain</th>
                    <th>Below Expectations</th>
                    <th>Meets Expectations</th>
                    <th>Above Expectations</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Product &amp; Progression</strong></td>
                    <td>
                      The students did not demonstrate significant progress on their project. The goals established at previous meetings have not been met, and no satisfactory explanation was offered for this.
                    </td>
                    <td>
                      The students demonstrate progress on their project that is at the expected level of competency for final-year students.
                    </td>
                    <td>
                      The students demonstrate progress on their project that is (well) above the expected level of competency for final-year students.
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Process &amp; Teamwork</strong></td>
                    <td>
                      The students do not appear to function well as a team. The contribution between students may be unequal and there may be significant issues with communication.
                    </td>
                    <td>
                      The students appear to be working well as a team, however, not all students are aware of the progress of others. The team integrates the feedback received.
                    </td>
                    <td>
                      The students appear to be working very well as a team with all students contributing equally. Communication is well-managed, and all team members have clear roles in the project. All students offer feedback and integrate effectively the feedback received.
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>

            <button className="qut-btn qut-btn-primary" type="submit">
              Send Feedback
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default TutorFeedback;