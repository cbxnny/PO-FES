const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/authMiddleware');
const { normalizeRole } = require('../utils/roleUtils');
const { sendEscalationEmail } = require('../utils/mailer');

const TEAM_BASE_QUERY = `
  SELECT t.team_id, t.team_name, t.escalated, t.escalation_level, t.escalation_note,
         t.escalated_at, t.client_id, t.tutor_id,
         p.project_name, un.unit_code,
         client.firstname || ' ' || client.lastname AS client_name,
         client.email AS client_email,
         client.phone_no AS client_phone,
         tutor.firstname || ' ' || tutor.lastname AS tutor_name
  FROM teams t
  JOIN projects p ON t.project_id = p.project_id
  JOIN units un ON p.unit_id = un.unit_id
  LEFT JOIN users client ON t.client_id = client.id
  LEFT JOIN users tutor ON t.tutor_id = tutor.id
`;

const mapEscalationRow = (row) => ({
  id: row.escalation_id,
  teamId: row.team_id,
  feedbackId: row.feedback_id,
  target: row.target,
  note: row.note,
  status: row.status,
  createdAt: row.created_at,
  resolvedAt: row.resolved_at,
  createdBy: row.created_by,
  createdByName: row.created_by_name,
  resolvedBy: row.resolved_by,
  resolvedByName: row.resolved_by_name
});

const mapAlertRow = (row) => ({
  id: row.alert_id,
  teamId: row.team_id,
  feedbackId: row.feedback_id,
  studentId: row.student_id,
  studentName: row.student_name,
  reason: row.reason,
  status: row.status,
  createdAt: row.created_at,
  reviewedAt: row.reviewed_at,
  reviewedBy: row.reviewed_by,
  reviewedByName: row.reviewed_by_name
});

const getEscalationsForTeams = async (teamIds) => {
  if (!teamIds.length) return {};

  const result = await pool.query(
    `SELECT e.*, 
            cb.firstname || ' ' || cb.lastname AS created_by_name,
            rb.firstname || ' ' || rb.lastname AS resolved_by_name
     FROM escalations e
     LEFT JOIN users cb ON e.created_by = cb.id
     LEFT JOIN users rb ON e.resolved_by = rb.id
     WHERE e.team_id = ANY($1)
     ORDER BY e.created_at DESC`,
    [teamIds]
  );

  return result.rows.reduce((acc, row) => {
    if (!acc[row.team_id]) acc[row.team_id] = [];
    acc[row.team_id].push(mapEscalationRow(row));
    return acc;
  }, {});
};

const getAlertsForTeams = async (teamIds) => {
  if (!teamIds.length) return {};

  const result = await pool.query(
    `SELECT a.*, 
            s.firstname || ' ' || s.lastname AS student_name,
            r.firstname || ' ' || r.lastname AS reviewed_by_name
     FROM student_feedback_alerts a
     LEFT JOIN users s ON a.student_id = s.id
     LEFT JOIN users r ON a.reviewed_by = r.id
     WHERE a.team_id = ANY($1)
     ORDER BY a.created_at DESC`,
    [teamIds]
  );

  return result.rows.reduce((acc, row) => {
    if (!acc[row.team_id]) acc[row.team_id] = [];
    acc[row.team_id].push(mapAlertRow(row));
    return acc;
  }, {});
};

const getViewsForFeedbackIds = async (feedbackIds) => {
  if (!feedbackIds.length) return {};

  const result = await pool.query(
    `SELECT v.feedback_id, v.user_id, v.viewed_at,
            u.firstname || ' ' || u.lastname AS viewer_name,
            u.role AS viewer_role
     FROM feedback_views v
     JOIN users u ON v.user_id = u.id
     WHERE v.feedback_id = ANY($1)
     ORDER BY v.viewed_at ASC`,
    [feedbackIds]
  );

  return result.rows.reduce((acc, row) => {
    if (!acc[row.feedback_id]) acc[row.feedback_id] = [];
    acc[row.feedback_id].push({
      userId: row.user_id,
      name: row.viewer_name,
      role: normalizeRole(row.viewer_role),
      viewedAt: row.viewed_at
    });
    return acc;
  }, {});
};

const mapFeedbackRows = (rows, viewsByFeedback = {}, alertsByTeam = {}, escalationsByTeam = {}) => {
  return rows.map((fb) => {
    const teamAlerts = alertsByTeam[fb.team_id] || [];
    const teamEscalations = escalationsByTeam[fb.team_id] || [];

    return {
      id: fb.feedback_id,
      type: fb.type,
      source: fb.source,
      submittedById: fb.submitted_by,
      submittedBy: fb.submitted_by_name,
      submittedAt: fb.submitted_at,
      updatedAt: fb.updated_at,
      removedAt: fb.removed_at,
      removedBy: fb.removed_by_name,
      isRemoved: Boolean(fb.removed_at),
      teamScore: fb.team_score !== null ? Number(fb.team_score) : null,
      teamComment: fb.team_comment,
      commentForTutors: fb.comment_for_tutors,
      commentForClient: fb.comment_for_client,
      views: viewsByFeedback[fb.feedback_id] || [],
      alerts: teamAlerts.filter((alert) => Number(alert.feedbackId) === Number(fb.feedback_id)),
      escalations: teamEscalations.filter((item) => Number(item.feedbackId) === Number(fb.feedback_id)),
      individualFeedback: fb.individual_feedback.map((item) => ({
        ...item,
        score: item.score !== null ? Number(item.score) : null
      }))
    };
  });
};

const getFeedbackRowsForTeam = async (teamId) => {
  const feedbackResult = await pool.query(
    `SELECT f.feedback_id, f.team_id, f.type, f.source, f.submitted_by,
            f.team_score, f.team_comment, f.comment_for_tutors, f.comment_for_client,
            f.submitted_at, f.updated_at, f.removed_at,
            u.firstname || ' ' || u.lastname AS submitted_by_name,
            rb.firstname || ' ' || rb.lastname AS removed_by_name,
            COALESCE(
              json_agg(
                json_build_object(
                  'studentId', ind.student_id,
                  'studentName', su.firstname || ' ' || su.lastname,
                  'score', ind.score,
                  'comment', ind.comment
                )
              ) FILTER (WHERE ind.id IS NOT NULL),
              '[]'
            ) AS individual_feedback
     FROM feedback f
     LEFT JOIN users u ON f.submitted_by = u.id
     LEFT JOIN users rb ON f.removed_by = rb.id
     LEFT JOIN individual_feedback ind ON ind.feedback_id = f.feedback_id
     LEFT JOIN users su ON ind.student_id = su.id
     WHERE f.team_id = $1
     GROUP BY f.feedback_id, u.firstname, u.lastname, rb.firstname, rb.lastname
     ORDER BY f.submitted_at DESC`,
    [teamId]
  );

  const feedbackIds = feedbackResult.rows.map((row) => row.feedback_id);
  const [viewsByFeedback, alertsByTeam, escalationsByTeam] = await Promise.all([
    getViewsForFeedbackIds(feedbackIds),
    getAlertsForTeams([Number(teamId)]),
    getEscalationsForTeams([Number(teamId)])
  ]);

  return mapFeedbackRows(feedbackResult.rows, viewsByFeedback, alertsByTeam, escalationsByTeam);
};

const buildTeamResponse = async (teamRow) => {
  const teamId = teamRow.team_id;
  const [studentsResult, feedbackHistory, alertsByTeam, escalationsByTeam] = await Promise.all([
    pool.query(
      `SELECT u.id, u.firstname || ' ' || u.lastname AS name
       FROM team_members tm
       JOIN users u ON tm.user_id = u.id
       WHERE tm.team_id = $1`,
      [teamId]
    ),
    getFeedbackRowsForTeam(teamId),
    getAlertsForTeams([teamId]),
    getEscalationsForTeams([teamId])
  ]);

  const escalations = escalationsByTeam[teamId] || [];
  const activeEscalations = escalations.filter((item) => item.status !== 'resolved');

  return {
    id: teamRow.team_id,
    teamName: teamRow.team_name,
    projectName: teamRow.project_name,
    unit: teamRow.unit_code,
    clientId: teamRow.client_id,
    clientName: teamRow.client_name,
    clientEmail: teamRow.client_email,
    clientPhone: teamRow.client_phone,
    tutorId: teamRow.tutor_id,
    tutorName: teamRow.tutor_name,
    escalated: activeEscalations.length > 0 || Boolean(teamRow.escalated),
    escalationLevel: teamRow.escalation_level || 0,
    escalationNote: teamRow.escalation_note,
    escalations,
    activeEscalations,
    studentAlerts: alertsByTeam[teamId] || [],
    students: studentsResult.rows,
    feedbackHistory
  };
};

const recalcTeamEscalationStatus = async (teamId) => {
  const activeResult = await pool.query(
    `SELECT target, note, created_by, created_at
     FROM escalations
     WHERE team_id = $1 AND status <> 'resolved'
     ORDER BY created_at DESC`,
    [teamId]
  );

  const activeRows = activeResult.rows;
  const level = activeRows.some((row) => ['liaison', 'both'].includes(row.target))
    ? 2
    : activeRows.length
      ? 1
      : 0;
  const latest = activeRows[0];

  await pool.query(
    `UPDATE teams
     SET escalated = $1,
         escalation_level = $2,
         escalation_note = $3,
         escalated_by = $4,
         escalated_at = $5
     WHERE team_id = $6`,
    [activeRows.length > 0, level, latest?.note || null, latest?.created_by || null, latest?.created_at || null, teamId]
  );

  return { escalated: activeRows.length > 0, escalationLevel: level };
};

const userCanAccessTeam = async (teamId, user) => {
  const role = normalizeRole(user.role);
  if (['coordinator', 'liaison'].includes(role)) return true;

  const result = await pool.query(
    `SELECT team_id FROM teams
     WHERE team_id = $1
       AND (
         client_id = $2 OR
         tutor_id = $2 OR
         team_id IN (SELECT team_id FROM team_members WHERE user_id = $2)
       )`,
    [teamId, user.id]
  );

  return result.rows.length > 0;
};

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { id, role } = req.user;
    const normalizedRole = normalizeRole(role);
    let query = TEAM_BASE_QUERY;
    let params = [];

    if (normalizedRole === 'client') {
      query += ' WHERE t.client_id = $1';
      params = [id];
    } else if (normalizedRole === 'tutor') {
      query += ' WHERE t.tutor_id = $1';
      params = [id];
    } else if (normalizedRole === 'student') {
      query += ' WHERE t.team_id IN (SELECT team_id FROM team_members WHERE user_id = $1)';
      params = [id];
    }

    query += ' ORDER BY t.team_name ASC';

    const teamsResult = await pool.query(query, params);
    const teamIds = teamsResult.rows.map((row) => row.team_id);
    if (teamIds.length === 0) return res.json([]);

    const [latestFeedbackResult, escalationsByTeam, alertsByTeam] = await Promise.all([
      pool.query(
        `SELECT DISTINCT ON (team_id) team_id, submitted_at
         FROM feedback
         WHERE team_id = ANY($1) AND source = 'client' AND removed_at IS NULL
         ORDER BY team_id, submitted_at DESC`,
        [teamIds]
      ),
      getEscalationsForTeams(teamIds),
      getAlertsForTeams(teamIds)
    ]);

    const latestByTeamId = latestFeedbackResult.rows.reduce((acc, row) => {
      acc[row.team_id] = row.submitted_at;
      return acc;
    }, {});

    const teams = teamsResult.rows.map((row) => {
      const escalations = escalationsByTeam[row.team_id] || [];
      const activeEscalations = escalations.filter((item) => item.status !== 'resolved');

      return {
        id: row.team_id,
        teamName: row.team_name,
        projectName: row.project_name,
        unit: row.unit_code,
        clientName: row.client_name,
        clientEmail: row.client_email,
        clientPhone: row.client_phone,
        tutorName: row.tutor_name,
        escalated: activeEscalations.length > 0 || Boolean(row.escalated),
        escalationLevel: row.escalation_level || 0,
        escalations,
        activeEscalations,
        studentAlerts: alertsByTeam[row.team_id] || [],
        lastFeedbackAt: latestByTeamId[row.team_id] || null
      };
    });

    res.json(teams);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching teams.' });
  }
});

router.get('/:teamId', authenticateToken, async (req, res) => {
  try {
    const teamId = Number(req.params.teamId);

    if (!(await userCanAccessTeam(teamId, req.user))) {
      return res.status(403).json({ error: 'You do not have access to this team.' });
    }

    const teamResult = await pool.query(`${TEAM_BASE_QUERY} WHERE t.team_id = $1`, [teamId]);

    if (teamResult.rows.length === 0) {
      return res.status(404).json({ error: 'Team not found.' });
    }

    res.json(await buildTeamResponse(teamResult.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching team.' });
  }
});

const createEscalation = async (req, res) => {
  const { teamId } = req.params;
  const { note, target, feedbackId } = req.body || {};
  const { id, role } = req.user;
  const normalizedRole = normalizeRole(role);

  if (!['tutor', 'coordinator'].includes(normalizedRole)) {
    return res.status(403).json({ error: 'Only tutors or coordinators can escalate.' });
  }

  const normalizedTarget = target || (normalizedRole === 'tutor' ? 'coordinator' : 'liaison');
  const validTutorTargets = ['coordinator', 'liaison', 'both'];
  const validCoordinatorTargets = ['liaison'];

  if (normalizedRole === 'tutor' && !validTutorTargets.includes(normalizedTarget)) {
    return res.status(400).json({ error: 'Invalid escalation target.' });
  }

  if (normalizedRole === 'coordinator' && !validCoordinatorTargets.includes(normalizedTarget)) {
    return res.status(400).json({ error: 'Unit coordinators can only escalate to Industry Liaison.' });
  }

  try {
    const currentResult = await pool.query(
      `SELECT t.team_id, t.tutor_id, t.team_name, p.project_name
       FROM teams t
       JOIN projects p ON t.project_id = p.project_id
       WHERE t.team_id = $1`,
      [teamId]
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Team not found.' });
    }

    const current = currentResult.rows[0];
    if (normalizedRole === 'tutor' && current.tutor_id !== id) {
      return res.status(403).json({ error: 'You are not the assigned tutor for this team.' });
    }

    if (feedbackId) {
      const feedbackResult = await pool.query(
        `SELECT feedback_id FROM feedback WHERE feedback_id = $1 AND team_id = $2`,
        [feedbackId, teamId]
      );
      if (feedbackResult.rows.length === 0) {
        return res.status(404).json({ error: 'Feedback not found for this team.' });
      }
    }

    const duplicateResult = await pool.query(
      `SELECT escalation_id
       FROM escalations
       WHERE team_id = $1
         AND COALESCE(feedback_id, 0) = COALESCE($2, 0)
         AND target = $3
         AND status <> 'resolved'`,
      [teamId, feedbackId || null, normalizedTarget]
    );

    if (duplicateResult.rows.length > 0) {
      return res.status(400).json({ error: 'This issue is already actively escalated.' });
    }

    const result = await pool.query(
      `INSERT INTO escalations (team_id, feedback_id, target, note, status, created_by)
       VALUES ($1, $2, $3, $4, 'open', $5)
       RETURNING *`,
      [teamId, feedbackId || null, normalizedTarget, note || null, id]
    );

    await recalcTeamEscalationStatus(teamId);

    const escalationLevel = ['liaison', 'both'].includes(normalizedTarget) ? 2 : 1;
    sendEscalationEmail({
      teamName: current.team_name,
      projectName: current.project_name,
      escalationLevel,
      escalatedByName: req.user.firstName ? `${req.user.firstName} ${req.user.lastName}` : req.user.email,
      note
    });

    res.status(201).json(mapEscalationRow(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error escalating issue.' });
  }
};

router.post('/:teamId/escalate', authenticateToken, createEscalation);
router.post('/:teamId/escalations', authenticateToken, createEscalation);


const getResolvableTargetsForRole = (role) => {
  if (role === 'coordinator') return ['coordinator', 'both'];
  if (role === 'liaison') return ['liaison', 'both'];
  if (role === 'tutor') return ['coordinator', 'liaison', 'both'];
  return [];
};

router.patch('/:teamId/escalations/resolve-active', authenticateToken, async (req, res) => {
  const { teamId } = req.params;
  const normalizedRole = normalizeRole(req.user.role);
  const resolvableTargets = getResolvableTargetsForRole(normalizedRole);

  if (!resolvableTargets.length) {
    return res.status(403).json({ error: 'Only staff can resolve escalations.' });
  }

  try {
    await pool.query(
      `UPDATE escalations
       SET status = 'resolved',
           resolved_by = $1,
           resolved_at = NOW()
       WHERE team_id = $2
         AND status <> 'resolved'
         AND target = ANY($3::text[])`,
      [req.user.id, teamId, resolvableTargets]
    );

    const status = await recalcTeamEscalationStatus(teamId);

    res.json({
      success: true,
      team: status
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error resolving escalations.' });
  }
});

router.patch('/:teamId/escalations/:escalationId/resolve', authenticateToken, async (req, res) => {
  const { teamId, escalationId } = req.params;
  const normalizedRole = normalizeRole(req.user.role);
  const resolvableTargets = getResolvableTargetsForRole(normalizedRole);

  if (!resolvableTargets.length) {
    return res.status(403).json({ error: 'Only staff can resolve escalations.' });
  }

  try {
    const escalationResult = await pool.query(
      `SELECT *
       FROM escalations
       WHERE escalation_id = $1
         AND team_id = $2`,
      [escalationId, teamId]
    );

    if (escalationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Escalation not found.' });
    }

    const escalation = escalationResult.rows[0];

    if (!resolvableTargets.includes(escalation.target)) {
      return res.status(403).json({
        error: 'This escalation is assigned to another role.'
      });
    }

    const result = await pool.query(
      `UPDATE escalations
       SET status = 'resolved',
           resolved_by = $1,
           resolved_at = NOW()
       WHERE escalation_id = $2
         AND team_id = $3
       RETURNING *`,
      [req.user.id, escalationId, teamId]
    );

    const status = await recalcTeamEscalationStatus(teamId);

    res.json({
      escalation: mapEscalationRow(result.rows[0]),
      team: status
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error resolving escalation.' });
  }
});

router.put('/:teamId/feedback/:feedbackId', authenticateToken, async (req, res) => {
  const { teamId, feedbackId } = req.params;
  const { teamComment, commentForTutors, commentForClient, teamScore } = req.body || {};

  try {
    const feedbackResult = await pool.query(
      `SELECT feedback_id, submitted_by, removed_at FROM feedback WHERE feedback_id = $1 AND team_id = $2`,
      [feedbackId, teamId]
    );

    if (feedbackResult.rows.length === 0) {
      return res.status(404).json({ error: 'Feedback not found.' });
    }

    const feedback = feedbackResult.rows[0];
    if (feedback.submitted_by !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit feedback or comments that you submitted.' });
    }

    if (feedback.removed_at) {
      return res.status(400).json({ error: 'Removed feedback cannot be edited.' });
    }

    const result = await pool.query(
      `UPDATE feedback
       SET team_comment = $1,
           comment_for_tutors = $2,
           comment_for_client = $3,
           team_score = $4,
           updated_at = NOW()
       WHERE feedback_id = $5 AND team_id = $6
       RETURNING feedback_id, updated_at`,
      [teamComment || null, commentForTutors || null, commentForClient || null, teamScore || null, feedbackId, teamId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating feedback.' });
  }
});

router.delete('/:teamId/feedback/:feedbackId', authenticateToken, async (req, res) => {
  const { teamId, feedbackId } = req.params;

  try {
    const feedbackResult = await pool.query(
      `SELECT feedback_id, submitted_by, removed_at FROM feedback WHERE feedback_id = $1 AND team_id = $2`,
      [feedbackId, teamId]
    );

    if (feedbackResult.rows.length === 0) {
      return res.status(404).json({ error: 'Feedback not found.' });
    }

    const feedback = feedbackResult.rows[0];
    if (feedback.submitted_by !== req.user.id) {
      return res.status(403).json({ error: 'You can only remove feedback or comments that you submitted.' });
    }

    await pool.query(
      `UPDATE feedback
       SET removed_at = NOW(), removed_by = $1, updated_at = NOW()
       WHERE feedback_id = $2 AND team_id = $3`,
      [req.user.id, feedbackId, teamId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error removing feedback.' });
  }
});

router.post('/:teamId/feedback/:feedbackId/viewed', authenticateToken, async (req, res) => {
  const { teamId, feedbackId } = req.params;
  const normalizedRole = normalizeRole(req.user.role);

  if (normalizedRole === 'student') {
    return res.json({ skipped: true });
  }

  try {
    if (!(await userCanAccessTeam(Number(teamId), req.user))) {
      return res.status(403).json({ error: 'You do not have access to this team.' });
    }

    const feedbackResult = await pool.query(
      `SELECT feedback_id FROM feedback WHERE feedback_id = $1 AND team_id = $2`,
      [feedbackId, teamId]
    );

    if (feedbackResult.rows.length === 0) {
      return res.status(404).json({ error: 'Feedback not found.' });
    }

    await pool.query(
      `INSERT INTO feedback_views (feedback_id, user_id, viewed_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (feedback_id, user_id)
       DO UPDATE SET viewed_at = EXCLUDED.viewed_at`,
      [feedbackId, req.user.id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error recording feedback view.' });
  }
});

router.post('/:teamId/feedback/:feedbackId/alert', authenticateToken, async (req, res) => {
  const { teamId, feedbackId } = req.params;
  const { reason } = req.body || {};
  const normalizedRole = normalizeRole(req.user.role);

  if (normalizedRole !== 'student') {
    return res.status(403).json({ error: 'Only students can alert their tutor about feedback.' });
  }

  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: 'Please provide a reason for the alert.' });
  }

  try {
    if (!(await userCanAccessTeam(Number(teamId), req.user))) {
      return res.status(403).json({ error: 'You can only alert tutors about your own team feedback.' });
    }

    const feedbackResult = await pool.query(
      `SELECT feedback_id FROM feedback WHERE feedback_id = $1 AND team_id = $2 AND source = 'client' AND removed_at IS NULL`,
      [feedbackId, teamId]
    );

    if (feedbackResult.rows.length === 0) {
      return res.status(404).json({ error: 'Client feedback not found for this team.' });
    }

    const existing = await pool.query(
      `SELECT * FROM student_feedback_alerts
       WHERE team_id = $1 AND feedback_id = $2 AND student_id = $3 AND status = 'open'`,
      [teamId, feedbackId, req.user.id]
    );

    if (existing.rows.length > 0) {
      return res.status(200).json({ alreadyOpen: true, alert: mapAlertRow(existing.rows[0]) });
    }

    const result = await pool.query(
      `INSERT INTO student_feedback_alerts (team_id, feedback_id, student_id, reason)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [teamId, feedbackId, req.user.id, reason.trim()]
    );

    res.status(201).json(mapAlertRow(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error creating student alert.' });
  }
});

router.patch('/:teamId/feedback-alerts/:alertId/resolve', authenticateToken, async (req, res) => {
  const { teamId, alertId } = req.params;
  const normalizedRole = normalizeRole(req.user.role);

  if (!['tutor', 'coordinator', 'liaison'].includes(normalizedRole)) {
    return res.status(403).json({ error: 'Only staff can resolve feedback alerts.' });
  }

  try {
    const result = await pool.query(
      `UPDATE student_feedback_alerts
       SET status = 'resolved', reviewed_at = NOW(), reviewed_by = $1
       WHERE alert_id = $2 AND team_id = $3
       RETURNING *`,
      [req.user.id, alertId, teamId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found.' });
    }

    res.json(mapAlertRow(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error resolving student alert.' });
  }
});

router.post('/:teamId/feedback', authenticateToken, async (req, res) => {
  const { teamId } = req.params;
  const { type, source, teamScore, teamComment, commentForTutors, commentForClient, individualFeedback } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const feedbackResult = await client.query(
      `INSERT INTO feedback (team_id, type, source, submitted_by, team_score, team_comment, comment_for_tutors, comment_for_client)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING feedback_id`,
      [teamId, type, source, req.user.id, teamScore || null, teamComment || null, commentForTutors || null, commentForClient || null]
    );
    const feedbackId = feedbackResult.rows[0].feedback_id;

    if (Array.isArray(individualFeedback)) {
      for (const item of individualFeedback) {
        if (!item.studentId) continue;
        await client.query(
          `INSERT INTO individual_feedback (feedback_id, student_id, score, comment)
           VALUES ($1, $2, $3, $4)`,
          [feedbackId, item.studentId, item.score || null, item.comment || null]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ feedbackId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error submitting feedback.' });
  } finally {
    client.release();
  }
});

module.exports = router;
