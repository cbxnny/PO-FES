import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import DashboardHeader from '../components/DashboardHeader';

import {
  getTeamById,
  getTeams,
  resolveEscalation,
  getTeamStatus,
  latestFeedback
} from '../data/feedbackApi';

import { getMeetingsByTeam } from '../data/meetingsApi';
import '../styles/dashboard.css';

const ratingLabels = {
  1: 'Below Expectations',
  2: 'Meets Expectations',
  3: 'Above Expectations'
};

const DISPLAY_UNITS = ['IFB398', 'IFB399'];

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

const getProjectOwnerEmail = (team) => {
  return cleanText(team.clientEmail) || 'Not recorded';
};

const getUnitName = (team) => {
  return cleanText(team.unit) || cleanText(team.unitCode) || 'Not recorded';
};

const getActiveEscalations = (team) => {
  return (team.activeEscalations || []).filter(
    (item) => item.status !== 'resolved'
  );
};

const getLiaisonEscalations = (team) => {
  return getActiveEscalations(team).filter((item) =>
    ['liaison', 'both'].includes(item.target)
  );
};

const isEscalatedToLiaison = (team) => getLiaisonEscalations(team).length > 0;

// The overview's Escalated column counts issues forwarded by a Unit Coordinator.
// Tutor-to-UC-only escalations must never count as Industry Liaison work.
const isForwardedToLiaison = (team) => getLiaisonEscalations(team).some(
  (item) => item.createdByRole === 'coordinator'
);

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

  if (isEscalatedToLiaison(team)) {
    reasons.unshift('Escalated to Industry Liaison');
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState('all');

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
              escalated: teamDetails.escalated,
              escalationLevel: teamDetails.escalationLevel,
              activeEscalations: teamDetails.activeEscalations || [],
              meetings: meetings || []
            };
          })
        );

        setTeams(fullTeams);
      })
      .catch(() => setError('Could not load teams. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const filteredTeams = useMemo(() => {
    return selectedUnit === 'all'
      ? teams
      : teams.filter((team) => getUnitName(team) === selectedUnit);
  }, [selectedUnit, teams]);

  const issueTeams = useMemo(() => {
    return filteredTeams
      .filter(isEscalatedToLiaison)
      .sort((a, b) => getIssueReasons(b).length - getIssueReasons(a).length);
  }, [filteredTeams]);

  const unitGroups = useMemo(() => groupTeamsByUnit(teams), [teams]);

  const handleResolveEscalations = async (team) => {
    const liaisonEscalations = getLiaisonEscalations(team);
    if (!liaisonEscalations.length) return;

    if (!window.confirm('Resolve the escalations addressed to you for this team? Linked escalations will also close.')) return;

    try {
      // A resolution closes all recipients of the same issue. Resolve each
      // distinct issue only once, so later calls aren't sent for a closed item.
      const distinctIssues = new Map(
        liaisonEscalations.map((item) => [item.feedbackId ?? 'team', item])
      );
      for (const escalation of distinctIssues.values()) {
        await resolveEscalation(team.id, escalation.id);
      }
      // Re-fetch the saved state; related coordinator escalation records are
      // resolved by the backend too, so don't keep stale local flags.
      const updatedTeam = await getTeamById(team.id);
      setTeams((current) => current.map((item) => (
        item.id === team.id
          ? { ...item, ...updatedTeam, meetings: item.meetings }
          : item
      )));
    } catch (err) {
      alert(err.message || 'Could not resolve escalation.');
    }
  };

  if (loading) {
    return (
      <div className="qut-page">
        <DashboardHeader title="Industry Liaison Dashboard" />

        <main className="qut-content">
          <section className="qut-card qut-metric-strip liaison-metric-strip">
            <div className="qut-metric-item">
              <span className="qut-skeleton qut-skeleton-line qut-skeleton-short" />
            </div>

            <div className="qut-metric-item">
              <span className="qut-skeleton qut-skeleton-line qut-skeleton-short" />
            </div>

            <div className="qut-metric-item">
              <span className="qut-skeleton qut-skeleton-line qut-skeleton-short" />
            </div>
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

  const overviewRows = (selectedUnit === 'all' ? DISPLAY_UNITS : [selectedUnit]).map((unit) => {
    const unitTeams = unitGroups[unit] || [];

    return {
      unit,
      totalTeams: unitTeams.length,
      needsFollowUp: unitTeams.filter(isEscalatedToLiaison).length,
      escalated: unitTeams.filter(isForwardedToLiaison).length
    };
  });

  const projectOwnerCards = filteredTeams.map((team) => ({
    key: `${team.id}-${getProjectOwnerName(team)}-${team.projectName}`,
    ownerName: getProjectOwnerName(team),
    team
  }));

  return (
    <div className="qut-page">
      <DashboardHeader title="Industry Liaison Dashboard" />

      <main className="qut-content qut-content-wide">
        <div className="dashboard-with-side-panel liaison-dashboard-layout">
          <aside className="qut-card dashboard-side-panel">
            <h2 className="qut-section-heading side-panel-heading">Units</h2>

            <button
              className={`qut-side-option ${selectedUnit === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedUnit('all')}
            >
              All Units
            </button>

            {DISPLAY_UNITS.map((unit) => (
              <button
                key={unit}
                className={`qut-side-option ${selectedUnit === unit ? 'active' : ''}`}
                onClick={() => setSelectedUnit(unit)}
              >
                {unit}
              </button>
            ))}

            <div className="side-panel-divider" />

            <h2 className="qut-section-heading side-panel-heading">Project Owners</h2>

            <div className="client-contact-list">
              {projectOwnerCards.length ? (
                projectOwnerCards.map(({ key, ownerName, team }) => (
                  <div className="client-contact-card" key={key}>
                    <h3>{ownerName}</h3>
                    <p><strong>Project:</strong> {team.projectName}</p>
                    <p><strong>Team:</strong> {team.teamName}</p>
                    <p><strong>Email:</strong> {getProjectOwnerEmail(team)}</p>

                    {getProjectOwnerEmail(team) !== 'Not recorded' && (
                      <a
                        className="qut-btn qut-btn-outline qut-btn-sm"
                        href={`mailto:${getProjectOwnerEmail(team)}`}
                      >
                        Email Client
                      </a>
                    )}
                  </div>
                ))
              ) : (
                <p className="side-panel-empty">No project owners for this unit yet.</p>
              )}
            </div>
          </aside>

          <div className="dashboard-main-panel">
            <section className="qut-card qut-table-card">
              <table className="qut-table monitoring-overview-table">
                <thead>
                  <tr>
                    <th>Unit</th>
                    <th>Total Teams</th>
                    <th>Needs Follow-up</th>
                    <th>Escalated by UC</th>
                  </tr>
                </thead>

                <tbody>
                  {overviewRows.map((row) => (
                    <tr key={row.unit}>
                      <td>{row.unit}</td>
                      <td>{row.totalTeams}</td>
                      <td>{row.needsFollowUp}</td>
                      <td>{row.escalated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <div className="qut-spacer" />

            <h2 className="qut-section-heading">Issues Requiring Follow-up</h2>

            <div className="qut-list-grid">
              {issueTeams.length ? (
                issueTeams.map((team) => {
                  const status = getTeamStatus(team);
                  const reasons = getIssueReasons(team);
                  const activeEscalations = getLiaisonEscalations(team);
                  const canResolve = activeEscalations.length > 0;

                  return (
                    <section className="qut-card liaison-issue-card" key={team.id}>
                      <div className="client-team-card-header">
                        <div className="team-card-info-block">
                          <h3>{team.teamName}</h3>

                          <div className="team-card-detail-grid">
                            <p><strong>Project:</strong> {team.projectName}</p>
                            <p><strong>Project Owner:</strong> {getProjectOwnerName(team)}</p>
                            <p><strong>Unit:</strong> {getUnitName(team)}</p>
                            <p><strong>Last feedback:</strong> {status.lastText}</p>
                            <p><strong>Latest rating:</strong> {getLatestRatingText(team)}</p>
                          </div>
                        </div>

                        <span className={`qut-status ${status.className}`}>
                          {status.label}
                        </span>
                      </div>

                      <p className="liaison-reason-line">
                        <strong>Reason:</strong> {reasons.join(', ')}
                      </p>

                      {activeEscalations.length > 0 && (
                        <div className="qut-mini-list">
                          {activeEscalations.map((item) => (
                            <div className="qut-mini-list-item" key={item.id}>
                              <span>
                                Escalated to {item.target}
                                {item.note ? ` - ${item.note}` : ''}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="liaison-card-actions">
                        <button
                          className="qut-btn qut-btn-outline"
                          onClick={() => navigate(`/feedback-timeline/${team.id}`)}
                        >
                          View Timeline
                        </button>

                        {canResolve && (
                          <button
                            className="qut-btn qut-btn-outline"
                            onClick={() => handleResolveEscalations(team)}
                          >
                            Issue resolved
                          </button>
                        )}
                      </div>
                    </section>
                  );
                })
              ) : (
                <section className="qut-card">
                  <p>No follow-up issues right now.</p>
                </section>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default IndustryLiaisonDashboard;