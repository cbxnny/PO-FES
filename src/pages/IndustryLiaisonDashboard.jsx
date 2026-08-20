import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader';
import {
  getTeamById,
  getTeams,
  getTeamStatus,
  latestFeedback
} from '../data/feedbackApi';
import { getMeetingsByTeam } from '../data/meetingsApi';
import '../styles/dashboard.css';
import { SkeletonGrid } from '../components/SkeletonCard';

const ratingLabels = {
  1: 'Below Expectations',
  2: 'Meets Expectations',
  3: 'Above Expectations'
};

const cleanText = (value) => {
  if (value === null || value === undefined) return '';

  const cleaned = String(value).trim();
  const lower = cleaned.toLowerCase();

  if (
    !cleaned ||
    lower === 'empty' ||
    lower === 'null' ||
    lower === 'undefined' ||
    lower === 'n/a' ||
    lower === 'na'
  ) {
    return '';
  }

  return cleaned;
};

const getRatingText = (rating) => {
  if (rating === null || rating === undefined || rating === '') {
    return 'Not recorded';
  }

  return ratingLabels[Number(rating)] || rating;
};

const getDateTimeValue = (value) => {
  if (!value) return 0;

  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const getMeetingSortValue = (meeting) => {
  if (meeting.createdAt) return getDateTimeValue(meeting.createdAt);

  if (meeting.meetingDate && meeting.meetingTime) {
    return getDateTimeValue(`${meeting.meetingDate}T${meeting.meetingTime}`);
  }

  if (meeting.meetingDate) return getDateTimeValue(meeting.meetingDate);

  return 0;
};

const sortByNewestMeeting = (items = []) => {
  return [...items].sort(
    (a, b) => getMeetingSortValue(b) - getMeetingSortValue(a)
  );
};

const getLatestMeeting = (team) => {
  return sortByNewestMeeting(team.meetings || [])[0] || null;
};

const getLatestClientFeedback = (team) => {
  const feedback = latestFeedback(team);

  if (!feedback) return null;

  return {
    ...feedback,
    meeting: getLatestMeeting(team)
  };
};

const getProductRating = (feedback) => {
  return feedback?.meeting?.productProgressionRating ?? feedback?.productProgressionRating;
};

const getProcessRating = (feedback) => {
  return feedback?.meeting?.processTeamworkRating ?? feedback?.processTeamworkRating;
};

const hasBelowExpectations = (feedback) => {
  return (
    Number(getProductRating(feedback)) === 1 ||
    Number(getProcessRating(feedback)) === 1
  );
};

const getProjectOwnerName = (team) => {
  return cleanText(team.clientName) || 'Not recorded';
};

const getUnitName = (team) => {
  return cleanText(team.unit) || cleanText(team.unitCode) || 'Not recorded';
};

const getLatestRatingText = (team) => {
  const feedback = getLatestClientFeedback(team);

  if (!feedback) return 'Not recorded';

  return `Product: ${getRatingText(getProductRating(feedback))} · Process: ${getRatingText(getProcessRating(feedback))}`;
};

const getIssueReasons = (team) => {
  const status = getTeamStatus(team);
  const latest = getLatestClientFeedback(team);
  const reasons = [];

  if (!latest) {
    reasons.push('Missing project owner feedback');
  } else if (status.className === 'overdue') {
    reasons.push('Project owner feedback overdue');
  }

  if (latest && hasBelowExpectations(latest)) {
    reasons.push('Below Expectations rating');
  }

  if (team.escalated) {
    reasons.push('Escalated by coordinator');
  }

  return reasons;
};

const groupTeamsByUnit = (teams) => {
  return teams.reduce((groups, team) => {
    const unit = getUnitName(team);

    if (!groups[unit]) {
      groups[unit] = [];
    }

    groups[unit].push(team);
    return groups;
  }, {});
};

const IndustryLiaisonDashboard = () => {
  const navigate = useNavigate();

  const [teams, setTeams] = useState([]);
  const [reviewedTeams, setReviewedTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getTeams()
      .then(async (summaryTeams) => {
        const fullTeams = await Promise.all(
          summaryTeams.map(async (team) => {
            const [teamDetails, meetings] = await Promise.all([
              getTeamById(team.id),
              getMeetingsByTeam(team.id)
            ]);

            return {
              ...teamDetails,
              escalated: team.escalated || teamDetails.escalated,
              meetings: meetings || []
            };
          })
        );

        setTeams(fullTeams);
      })
      .catch(() => setError('Could not load teams. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const issueTeams = useMemo(() => {
    return teams
      .filter((team) => getIssueReasons(team).length > 0)
      .sort((a, b) => getIssueReasons(b).length - getIssueReasons(a).length);
  }, [teams]);

  const unitGroups = useMemo(() => groupTeamsByUnit(teams), [teams]);

  const handleMarkReviewed = (teamId) => {
    setReviewedTeams((current) => (
      current.includes(teamId) ? current : [...current, teamId]
    ));
  };

  if (loading) {
    return (
      <div className="qut-page">
        <DashboardHeader title="Industry Liaison Dashboard" />
        <main className="qut-content">
          <section className="qut-card qut-metric-strip liaison-metric-strip">
            <div className="qut-metric-item"><span className="qut-skeleton qut-skeleton-line qut-skeleton-short" /></div>
            <div className="qut-metric-item"><span className="qut-skeleton qut-skeleton-line qut-skeleton-short" /></div>
            <div className="qut-metric-item"><span className="qut-skeleton qut-skeleton-line qut-skeleton-short" /></div>
            <div className="qut-metric-item"><span className="qut-skeleton qut-skeleton-line qut-skeleton-short" /></div>
          </section>

          <div className="qut-spacer" />
          <h2 className="qut-section-heading">Issues Requiring Follow-up</h2>
          <div className="qut-list-grid">
            {[0, 1].map((i) => (
              <section className="qut-skeleton-card" key={i}>
                <span className="qut-skeleton qut-skeleton-line qut-skeleton-title" />
                <span className="qut-skeleton qut-skeleton-line" />
                <span className="qut-skeleton qut-skeleton-line qut-skeleton-short" />
              </section>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="qut-page">
        <DashboardHeader title="Industry Liaison Dashboard" />

        <main className="qut-content">
          <p>{error}</p>
        </main>
      </div>
    );
  }

  const escalatedCount = teams.filter((team) => team.escalated).length;
  const reviewedCount = reviewedTeams.length;

  return (
    <div className="qut-page">
      <DashboardHeader title="Industry Liaison Dashboard" />

      <main className="qut-content">
        <section className="qut-card qut-metric-strip liaison-metric-strip">
          <div className="qut-metric-item">
            <span>Total Teams</span>
            <strong>{teams.length}</strong>
          </div>

          <div className="qut-metric-item">
            <span>Needs Follow-up</span>
            <strong>{issueTeams.length}</strong>
          </div>

          <div className="qut-metric-item">
            <span>Escalated</span>
            <strong>{escalatedCount}</strong>
          </div>

          <div className="qut-metric-item">
            <span>Reviewed This Session</span>
            <strong>{reviewedCount}</strong>
          </div>
        </section>

        <div className="qut-spacer" />

        <h2 className="qut-section-heading">Issues Requiring Follow-up</h2>

        <div className="qut-list-grid">
          {issueTeams.length ? issueTeams.map((team) => {
            const status = getTeamStatus(team);
            const reasons = getIssueReasons(team);
            const isReviewed = reviewedTeams.includes(team.id);

            return (
              <section className="qut-card liaison-issue-card" key={team.id}>
                <div className="client-team-card-header">
                  <div>
                    <h3>{team.teamName}</h3>
                    <p><strong>Project:</strong> {team.projectName}</p>
                    <p><strong>Project Owner:</strong> {getProjectOwnerName(team)}</p>
                    <p><strong>Unit:</strong> {getUnitName(team)}</p>
                    <p><strong>Last feedback:</strong> {status.lastText}</p>
                    <p><strong>Latest rating:</strong> {getLatestRatingText(team)}</p>
                  </div>

                  <span className={`qut-status ${status.className}`}>
                    {status.label}
                  </span>
                </div>

                <p className="liaison-reason-line">
                  <strong>Reason:</strong> {reasons.join(', ')}
                </p>

                {isReviewed && (
                  <p className="liaison-reviewed-line">
                    Reviewed in this session.
                  </p>
                )}

                <div className="liaison-card-actions">
                  <button
                    className="qut-btn qut-btn-outline"
                    onClick={() => navigate(`/feedback-timeline/${team.id}`)}
                  >
                    View Timeline
                  </button>

                  <button
                    className="qut-btn qut-btn-primary"
                    onClick={() => handleMarkReviewed(team.id)}
                  >
                    Mark Reviewed
                  </button>
                </div>
              </section>
            );
          }) : (
            <section className="qut-card">
              <p>No escalated or overdue issues right now.</p>
            </section>
          )}
        </div>

        <div className="qut-spacer" />

        <h2 className="qut-section-heading">Monitoring Overview</h2>

        <section className="qut-card">
          <table className="qut-table">
            <thead>
              <tr>
                <th>Unit</th>
                <th>Total Teams</th>
                <th>Needs Follow-up</th>
                <th>Escalated</th>
              </tr>
            </thead>

            <tbody>
              {Object.entries(unitGroups).map(([unit, unitTeams]) => (
                <tr key={unit}>
                  <td>{unit}</td>
                  <td>{unitTeams.length}</td>
                  <td>{unitTeams.filter((team) => getIssueReasons(team).length > 0).length}</td>
                  <td>{unitTeams.filter((team) => team.escalated).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
};

export default IndustryLiaisonDashboard;