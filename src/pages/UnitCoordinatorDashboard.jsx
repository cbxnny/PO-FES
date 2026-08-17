import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader';
import {
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
import { SkeletonGrid } from '../components/SkeletonCard';

const ratingLabels = {
  1: 'Below Expectations',
  2: 'Meets Expectations',
  3: 'Above Expectations'
};

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

const hasClientFeedback = (team) => {
  return Boolean(getLatestClientFeedback(team));
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

  if (team.escalated) {
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
  const [teams, setTeams] = useState([]);
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

  const filteredTeams = useMemo(() => {
    return teams.filter((team) => {
      const status = getTeamStatus(team);
      const latest = getLatestClientFeedback(team);
      const attentionReasons = getAttentionReasons(team);
      const search = query.toLowerCase();

      const matchesSearch =
        team.teamName.toLowerCase().includes(search) ||
        team.projectName.toLowerCase().includes(search) ||
        getProjectOwnerName(team).toLowerCase().includes(search);

      const matchesFilter =
        filter === 'all' ||
        (filter === 'recent' && status.className === 'recent') ||
        (filter === 'needs-attention' && attentionReasons.length > 0) ||
        (filter === 'missing' && !latest) ||
        (filter === 'below' && latest && hasBelowExpectations(latest)) ||
        (filter === 'escalated' && team.escalated);

      return matchesSearch && matchesFilter;
    });
  }, [filter, query, teams]);

  const handleEscalate = (teamId) => {
    setTeams((currentTeams) => (
      currentTeams.map((team) => (
        team.id === teamId
          ? { ...team, escalated: true }
          : team
      ))
    ));

    alert('Issue flagged for Industry Liaison. Backend saving can be connected later.');
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
            <div className="qut-metric-item"><span className="qut-skeleton qut-skeleton-line qut-skeleton-short" /></div>
            <div className="qut-metric-item"><span className="qut-skeleton qut-skeleton-line qut-skeleton-short" /></div>
            <div className="qut-metric-item"><span className="qut-skeleton qut-skeleton-line qut-skeleton-short" /></div>
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

  const submitted = teams.filter(hasClientFeedback).length;
  const needsAttention = teams.filter((team) => getAttentionReasons(team).length > 0).length;

  return (
    <div className="qut-page">
      <DashboardHeader title="Coordinator Dashboard" />

      <main className="qut-content">
        <section className="qut-card qut-metric-strip coordinator-metric-strip">
          <div className="qut-metric-item">
            <span>Total Teams</span>
            <strong>{teams.length}</strong>
          </div>

          <div className="qut-metric-item">
            <span>Project Owner Feedback Received</span>
            <strong>{submitted}</strong>
          </div>

          <div className="qut-metric-item">
            <span>Needs Attention</span>
            <strong>{needsAttention}</strong>
          </div>
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

        <h2 className="qut-section-heading">Teams List</h2>

        <div className="qut-list-grid">
          {filteredTeams.length ? filteredTeams.map((team) => {
            const status = getTeamStatus(team);
            const attentionReasons = getAttentionReasons(team);

            return (
              <section className="qut-card coordinator-team-card" key={team.id}>
                <div className="client-team-card-header">
                  <div>
                    <h3>{team.teamName}</h3>
                    <p><strong>Project:</strong> {team.projectName}</p>
                    <p><strong>Project Owner:</strong> {getProjectOwnerName(team)}</p>
                    <p><strong>Last feedback:</strong> {status.lastText}</p>
                    <p><strong>Latest rating:</strong> {getLatestRatingText(team)}</p>
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

                  <button
                    className="qut-btn qut-btn-danger"
                    onClick={() => handleEscalate(team.id)}
                  >
                    Escalate to Industry Liaison
                  </button>
                </div>
              </section>
            );
          }) : (
            <section className="qut-card">
              <p>No teams match this search or filter.</p>
            </section>
          )}
        </div>

        <div className="qut-button-row qut-top-gap">
          <button
            className="qut-btn qut-btn-primary"
            onClick={handleExport}
          >
            Export Summary CSV
          </button>
        </div>
      </main>
    </div>
  );
};

export default UnitCoordinatorDashboard;