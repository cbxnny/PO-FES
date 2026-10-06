import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import DashboardHeader from '../components/DashboardHeader';

import {
  escalateIssue,
  resolveActiveEscalations,
  resolveEscalation,
  formatDate,
  getTeamById,
  getTeams,
  getTeamStatus,
  latestFeedback
} from '../data/feedbackApi';

import {
  getMeetingsByTeam
} from '../data/meetingsApi';

import '../styles/dashboard.css';

import BulkImportModal from '../components/BulkImportModal';

const ratingLabels = {
  1: 'Below Expectations',
  2: 'Meets Expectations',
  3: 'Above Expectations'
};

const DISPLAY_UNITS = ['IFB398', 'IFB399'];

const getRatingText = (rating) => {
  if (rating === null || rating === undefined || rating === '') {
    return 'Not recorded';
  }

  return ratingLabels[Number(rating)] || rating;
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

const getLatestRatingText = (team) => {
  const feedback = getLatestClientFeedback(team);

  if (!feedback) return 'Not recorded';

  const productRating = getRatingText(getProductRating(feedback));
  const processRating = getRatingText(getProcessRating(feedback));

  return `Product: ${productRating} · Process: ${processRating}`;
};

const getAverageRatingText = (team) => {
  const feedback = (team.feedbackHistory || []).filter(
    (item) => item.source === 'client' && !item.isRemoved
  );

  const scores = feedback
    .flatMap((item) => [
      Number(getProductRating(item)),
      Number(getProcessRating(item))
    ])
    .filter((score) => !Number.isNaN(score));

  if (!scores.length) return 'Not recorded';

  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;

  if (average < 1.67) return 'Below Expectations';
  if (average < 2.34) return 'Meets Expectations';

  return 'Above Expectations';
};

const getStudentsList = (team) => {
  const students = team.students || [];

  return students
    .map((student) => student.name || student.fullName || student.email)
    .filter(Boolean);
};

const getUnitName = (team) => {
  return cleanText(team.unit) || cleanText(team.unitCode) || 'Not recorded';
};

const getActiveEscalations = (team) => {
  return (team.activeEscalations || []).filter(
    (item) => item.status !== 'resolved'
  );
};

const getCoordinatorEscalations = (team) => {
  return getActiveEscalations(team).filter((item) =>
    ['coordinator', 'both'].includes(item.target)
  );
};

const getLiaisonEscalations = (team) => {
  return getActiveEscalations(team).filter((item) =>
    ['liaison', 'both'].includes(item.target)
  );
};

const isEscalatedToCoordinator = (team) => {
  return (
    getCoordinatorEscalations(team).length > 0 ||
    (team.escalated && Number(team.escalationLevel) === 1)
  );
};

const isEscalatedToLiaison = (team) => {
  return (
    getLiaisonEscalations(team).length > 0 ||
    (team.escalated && Number(team.escalationLevel) >= 2)
  );
};

const getEscalationLevelFromItems = (items = []) => {
  if (items.some((item) => ['liaison', 'both'].includes(item.target))) return 2;
  if (items.some((item) => item.target === 'coordinator')) return 1;
  return 0;
};

const getAttentionReasons = (team) => {
  const status = getTeamStatus(team);
  const latest = getLatestClientFeedback(team);
  const reasons = [];

  if (!latest) {
    reasons.push('Missing feedback');
  } else if (status.className === 'overdue') {
    reasons.push('Feedback overdue');
  }

  if (latest && hasBelowExpectations(latest)) {
    reasons.push('Below Expectations rating');
  }

  if (team.escalated || getActiveEscalations(team).length > 0) {
    reasons.push('Escalated');
  }

  return reasons;
};

const escapeCsvValue = (value) => {
  const text = String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
};

const UnitCoordinatorDashboard = () => {
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState('cards');
  const [selectedUnit, setSelectedUnit] = useState('all');
  const [teams, setTeams] = useState([]);
  const [escalatingTeamId, setEscalatingTeamId] = useState(null);
  const [escalationTeam, setEscalationTeam] = useState(null);
  const [escalationNote, setEscalationNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);

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
              escalated: teamDetails.escalated || team.escalated,
              escalationLevel: teamDetails.escalationLevel ?? team.escalationLevel ?? 0,
              activeEscalations: teamDetails.activeEscalations || team.activeEscalations || [],
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
    return teams.filter((team) => {
      const status = getTeamStatus(team);
      const latest = getLatestClientFeedback(team);
      const attentionReasons = getAttentionReasons(team);
      const search = query.toLowerCase();

      const matchesSearch =
        cleanText(team.teamName).toLowerCase().includes(search) ||
        cleanText(team.projectName).toLowerCase().includes(search) ||
        getProjectOwnerName(team).toLowerCase().includes(search);

      const matchesUnit = selectedUnit === 'all' || getUnitName(team) === selectedUnit;

      const matchesFilter =
        filter === 'all' ||
        (filter === 'recent' && status.className === 'recent') ||
        (filter === 'needs-attention' && attentionReasons.length > 0) ||
        (filter === 'missing' && !latest) ||
        (filter === 'below' && latest && hasBelowExpectations(latest)) ||
        (filter === 'escalated' && (team.escalated || getActiveEscalations(team).length > 0));

      return matchesUnit && matchesSearch && matchesFilter;
    });
  }, [filter, query, selectedUnit, teams]);

  const handleEscalate = (team) => {
    setEscalationTeam(team);
    setEscalationNote('');
  };

  const closeEscalationModal = () => {
    if (escalatingTeamId) return;

    setEscalationTeam(null);
    setEscalationNote('');
  };

  const submitEscalation = async () => {
    if (!escalationTeam) return;

    setEscalatingTeamId(escalationTeam.id);

    try {
      await escalateIssue(escalationTeam.id, {
        target: 'liaison',
        note: escalationNote.trim()
      });

      setTeams((currentTeams) =>
        currentTeams.map((team) =>
          team.id === escalationTeam.id
            ? {
                ...team,
                escalationLevel: 2,
                escalated: true,
                activeEscalations: [
                  ...getActiveEscalations(team),
                  {
                    id: `temp-${Date.now()}`,
                    target: 'liaison',
                    note: escalationNote.trim(),
                    status: 'open'
                  }
                ]
              }
            : team
        )
      );

      setEscalationTeam(null);
      setEscalationNote('');
    } catch (err) {
      alert(err.message || 'Could not escalate this team.');
    } finally {
      setEscalatingTeamId(null);
    }
  };

  const handleResolveEscalations = async (team) => {
    const activeEscalations = getActiveEscalations(team);
    const coordinatorEscalations = getCoordinatorEscalations(team);

    const legacyCoordinatorEscalation =
      team.escalated &&
      Number(team.escalationLevel) === 1 &&
      !activeEscalations.length;

    if (!coordinatorEscalations.length && !legacyCoordinatorEscalation) return;

    if (!window.confirm('Mark this coordinator escalation as resolved?')) return;

    try {
      if (coordinatorEscalations.length) {
        await Promise.all(
          coordinatorEscalations.map((item) => resolveEscalation(team.id, item.id))
        );
      } else {
        await resolveActiveEscalations(team.id);
      }

      setTeams((currentTeams) =>
        currentTeams.map((item) => {
          if (item.id !== team.id) return item;

          const remainingEscalations = getActiveEscalations(item).filter(
            (escalation) => !['coordinator', 'both'].includes(escalation.target)
          );

          return {
            ...item,
            activeEscalations: remainingEscalations,
            escalated: remainingEscalations.length > 0,
            escalationLevel: getEscalationLevelFromItems(remainingEscalations)
          };
        })
      );
    } catch (err) {
      alert(err.message || 'Could not resolve escalation.');
    }
  };

  const handleExport = () => {
    const rows = [
      [
        'Team',
        'Project',
        'Project Owner',
        'Last Feedback',
        'Status',
        'Latest Rating',
        'Needs Attention'
      ],
      ...teams.map((team) => {
        const status = getTeamStatus(team);
        const feedback = getLatestClientFeedback(team);
        const attentionReasons = getAttentionReasons(team);

        return [
          team.teamName,
          team.projectName,
          getProjectOwnerName(team),
          feedback ? formatDate(feedback.submittedAt) : 'No feedback submitted',
          status.label,
          getLatestRatingText(team),
          attentionReasons.length ? attentionReasons.join('; ') : 'No urgent issues'
        ];
      })
    ];

    const csv = rows
      .map((row) => row.map(escapeCsvValue).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'unit-coordinator-feedback-summary.csv';
    link.click();

    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="qut-page">
        <DashboardHeader title="Coordinator Dashboard" />

        <main className="qut-content">
          <section className="qut-card qut-metric-strip coordinator-metric-strip">
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

          <h2 className="qut-section-heading">Teams List</h2>

          <div className="qut-list-grid">
            {[0, 1, 2, 3].map((i) => (
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
        <DashboardHeader title="Coordinator Dashboard" />

        <main className="qut-content">
          <p>{error}</p>
        </main>
      </div>
    );
  }

  const visibleTeamsForSidePanel =
    selectedUnit === 'all'
      ? teams
      : teams.filter((team) => getUnitName(team) === selectedUnit);

  const overviewRows = (selectedUnit === 'all' ? DISPLAY_UNITS : [selectedUnit]).map((unit) => {
    const unitTeams = teams.filter((team) => getUnitName(team) === unit);

    return {
      unit,
      totalTeams: unitTeams.length,
      needsFollowUp: unitTeams.filter(isEscalatedToCoordinator).length,
      escalated: unitTeams.filter(isEscalatedToLiaison).length
    };
  });

  const projectOwnerCards = visibleTeamsForSidePanel.map((team) => ({
    key: `${team.id}-${getProjectOwnerName(team)}-${team.projectName}`,
    ownerName: getProjectOwnerName(team),
    team
  }));

  return (
    <div className="qut-page">
      <DashboardHeader title="Coordinator Dashboard" />

      <main className="qut-content qut-content-wide">
        <div className="dashboard-with-side-panel coordinator-dashboard-layout">
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
                    <p><strong>Email:</strong> {cleanText(team.clientEmail) || 'Not recorded'}</p>
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
                    <th>Escalated</th>
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

            <h2 className="qut-section-heading">Search and Filters</h2>

            <div className="qut-toolbar coordinator-toolbar">
              <input
                className="qut-input"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search team, project owner, project..."
              />

              <button
                className={`qut-btn ${filter === 'all' ? 'qut-btn-primary' : 'qut-btn-outline'}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>

              <button
                className={`qut-btn ${filter === 'recent' ? 'qut-btn-primary' : 'qut-btn-outline'}`}
                onClick={() => setFilter('recent')}
              >
                Recent
              </button>

              <button
                className={`qut-btn ${filter === 'needs-attention' ? 'qut-btn-primary' : 'qut-btn-outline'}`}
                onClick={() => setFilter('needs-attention')}
              >
                Needs Attention
              </button>

              <button
                className={`qut-btn ${filter === 'missing' ? 'qut-btn-primary' : 'qut-btn-outline'}`}
                onClick={() => setFilter('missing')}
              >
                Missing
              </button>

              <button
                className={`qut-btn ${filter === 'below' ? 'qut-btn-primary' : 'qut-btn-outline'}`}
                onClick={() => setFilter('below')}
              >
                Below Expectations
              </button>

              <button
                className={`qut-btn ${filter === 'escalated' ? 'qut-btn-primary' : 'qut-btn-outline'}`}
                onClick={() => setFilter('escalated')}
              >
                Escalated
              </button>
            </div>

            <div className="qut-spacer" />

            <div className="section-heading-actions">
              <h2 className="qut-section-heading">Teams List</h2>

              <div className="qut-button-row">
                <button
                  className={`qut-btn ${viewMode === 'cards' ? 'qut-btn-primary' : 'qut-btn-outline'}`}
                  onClick={() => setViewMode('cards')}
                >
                  Team Cards
                </button>

                <button
                  className={`qut-btn ${viewMode === 'table' ? 'qut-btn-primary' : 'qut-btn-outline'}`}
                  onClick={() => setViewMode('table')}
                >
                  Team Table
                </button>
              </div>
            </div>

            {viewMode === 'cards' ? (
              <div className="qut-list-grid">
                {filteredTeams.length ? (
                  filteredTeams.map((team) => {
                    const status = getTeamStatus(team);
                    const attentionReasons = getAttentionReasons(team);
                    const canResolve =
                      getCoordinatorEscalations(team).length > 0 ||
                      (team.escalated && Number(team.escalationLevel) === 1);

                    return (
                      <section className="qut-card coordinator-team-card" key={team.id}>
                        <div className="client-team-card-header">
                          <div className="team-card-info-block">
                            <h3>{team.teamName}</h3>

                            <div className="team-card-detail-grid">
                              <p><strong>Project:</strong> {team.projectName}</p>
                              <p><strong>Project Owner:</strong> {getProjectOwnerName(team)}</p>
                              <p><strong>Last feedback:</strong> {status.lastText}</p>
                              <p><strong>Latest rating:</strong> {getLatestRatingText(team)}</p>
                              <p><strong>Average rating:</strong> {getAverageRatingText(team)}</p>
                            </div>
                          </div>

                          <span className={`qut-status ${status.className}`}>
                            {status.label}
                          </span>
                        </div>

                        <p className="coordinator-attention-line">
                          <strong>Attention:</strong>{' '}
                          {attentionReasons.length ? attentionReasons.join(', ') : 'No urgent issues'}
                        </p>

                        <div className="coordinator-team-actions">
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

                          <button
                            className="qut-btn qut-btn-danger"
                            onClick={() => handleEscalate(team)}
                            disabled={escalatingTeamId === team.id}
                          >
                            Escalate
                          </button>
                        </div>
                      </section>
                    );
                  })
                ) : (
                  <section className="qut-card">
                    <p>No teams match this search or filter.</p>
                  </section>
                )}
              </div>
            ) : (
              <section className="qut-card qut-table-card">
                <table className="qut-table teams-table-view">
                  <thead>
                    <tr>
                      <th>Team</th>
                      <th>Project</th>
                      <th>Project Owner</th>
                      <th>Tutor</th>
                      <th>Students</th>
                      <th>Last feedback</th>
                      <th>Latest rating</th>
                      <th>Average rating</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredTeams.map((team) => {
                      const status = getTeamStatus(team);
                      const attentionReasons = getAttentionReasons(team);
                      const canResolve =
                        getCoordinatorEscalations(team).length > 0 ||
                        (team.escalated && Number(team.escalationLevel) === 1);

                      return (
                        <tr key={team.id}>
                          <td>{team.teamName}</td>
                          <td>{team.projectName}</td>
                          <td>{getProjectOwnerName(team)}</td>
                          <td>{team.tutorName || 'Not recorded'}</td>
                          <td>
                            {getStudentsList(team).length
                              ? getStudentsList(team).map((name) => (
                                  <div className="table-name-line" key={name}>
                                    {name}
                                  </div>
                                ))
                              : 'Not recorded'}
                          </td>
                          <td>{status.lastText}</td>
                          <td>{getLatestRatingText(team)}</td>
                          <td>{getAverageRatingText(team)}</td>
                          <td>{attentionReasons.length ? attentionReasons.join(', ') : 'No urgent issues'}</td>
                          <td>
                            <div className="table-action-stack">
                              <button
                                className="qut-btn qut-btn-outline qut-btn-sm"
                                onClick={() => navigate(`/feedback-timeline/${team.id}`)}
                              >
                                Timeline
                              </button>

                              {canResolve && (
                                <button
                                  className="qut-btn qut-btn-outline qut-btn-sm"
                                  onClick={() => handleResolveEscalations(team)}
                                >
                                  Resolve
                                </button>
                              )}

                              <button
                                className="qut-btn qut-btn-danger qut-btn-sm"
                                onClick={() => handleEscalate(team)}
                                disabled={escalatingTeamId === team.id}
                              >
                                Escalate
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>
            )}

            <div className="qut-button-row qut-top-gap">
              <button
                className="qut-btn qut-btn-primary"
                onClick={handleExport}
              >
                Export Summary CSV
              </button>

              <button
                className="qut-btn qut-btn-outline"
                onClick={() => setShowImportModal(true)}
              >
                Import Accounts
              </button>
            </div>
          </div>
        </div>
      </main>

      {escalationTeam && (
        <div className="feedback-modal-overlay">
          <section className="feedback-modal-card escalation-modal-card">
            <div className="feedback-modal-header">
              <div>
                <h2>Escalate Team</h2>

                <p className="tutor-comment-modal-subtitle">
                  {escalationTeam.teamName} - {escalationTeam.projectName}
                </p>
              </div>

              <button
                type="button"
                className="feedback-modal-close"
                onClick={closeEscalationModal}
                disabled={Boolean(escalatingTeamId)}
              >
                ×
              </button>
            </div>

            <p className="qut-muted-text">
              This will escalate the issue to the Industry Liaison.
            </p>

            <div className="qut-field">
              <label>Optional note</label>

              <textarea
                className="qut-textarea feedback-textarea-small"
                placeholder="Add a short reason for the escalation..."
                value={escalationNote}
                onChange={(event) => setEscalationNote(event.target.value)}
              />
            </div>

            <div className="tutor-comment-modal-actions escalation-modal-actions">
              <button
                type="button"
                className="qut-btn qut-btn-outline"
                onClick={closeEscalationModal}
                disabled={Boolean(escalatingTeamId)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="qut-btn qut-btn-danger"
                onClick={submitEscalation}
                disabled={Boolean(escalatingTeamId)}
              >
                {escalatingTeamId ? 'Escalating...' : 'Escalate'}
              </button>
            </div>
          </section>
        </div>
      )}

      {showImportModal && (
        <BulkImportModal onClose={() => setShowImportModal(false)} />
      )}
    </div>
  );
};

export default UnitCoordinatorDashboard;