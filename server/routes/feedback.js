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
         tutor.firstname || ' ' || tutor.lastname AS tutor_name
  FROM teams t
  JOIN projects p ON t.project_id = p.project_id
  JOIN units un ON p.unit_id = un.unit_id
  LEFT JOIN users client ON t.client_id = client.id
  LEFT JOIN users tutor ON t.tutor_id = tutor.id
`;

const buildTeamResponse = async (teamRow) => {
  const [studentsResult, feedbackResult] = await Promise.all([
    pool.query(
      `SELECT u.id, u.firstname || ' ' || u.lastname AS name
       FROM team_members tm
       JOIN users u ON tm.user_id = u.id
       WHERE tm.team_id = $1`,
      [teamRow.team_id]
    ),
    pool.query(
      `SELECT f.feedback_id, f.type, f.source, f.team_score, f.team_comment,
              f.comment_for_tutors, f.comment_for_client, f.submitted_at,
              u.firstname || ' ' || u.lastname AS submitted_by,
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
       LEFT JOIN individual_feedback ind ON ind.feedback_id = f.feedback_id
       LEFT JOIN users su ON ind.student_id = su.id
       WHERE f.team_id = $1
       GROUP BY f.feedback_id, u.firstname, u.lastname
       ORDER BY f.submitted_at DESC`,
      [teamRow.team_id]
    )
  ]);

  const feedbackHistory = feedbackResult.rows.map((fb) => ({
    id: fb.feedback_id,
    type: fb.type,
    source: fb.source,
    submittedBy: fb.submitted_by,
    submittedAt: fb.submitted_at,
    teamScore: fb.team_score !== null ? Number(fb.team_score) : null,
    teamComment: fb.team_comment,
    commentForTutors: fb.comment_for_tutors,
    commentForClient: fb.comment_for_client,
    individualFeedback: fb.individual_feedback.map((item) => ({
      ...item,
      score: item.score !== null ? Number(item.score) : null
    }))
  }));

  return {
    id: teamRow.team_id,
    teamName: teamRow.team_name,
    projectName: teamRow.project_name,
    unit: teamRow.unit_code,
    clientId: teamRow.client_id,
    clientName: teamRow.client_name,
    tutorId: teamRow.tutor_id,
    tutorName: teamRow.tutor_name,
    escalated: teamRow.escalated,
    students: studentsResult.rows,
    feedbackHistory
  };
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

    const teamsResult = await pool.query(query, params);
    const teamIds = teamsResult.rows.map((row) => row.team_id);
    if (teamIds.length === 0) return res.json([]);

    const latestFeedbackResult = await pool.query(
      `SELECT DISTINCT ON (team_id) team_id, submitted_at
       FROM feedback
       WHERE team_id = ANY($1) AND source IN ('client', 'tutor')
       ORDER BY team_id, submitted_at DESC`,
      [teamIds]
    );
    const latestByTeamId = latestFeedbackResult.rows.reduce((acc, row) => {
      acc[row.team_id] = row.submitted_at;
      return acc;
    }, {});

    const teams = teamsResult.rows.map((row) => ({
      id: row.team_id,
      teamName: row.team_name,
      projectName: row.project_name,
      unit: row.unit_code,
      clientName: row.client_name,
      tutorName: row.tutor_name,
      escalated: row.escalated,
      escalationLevel: row.escalation_level,
      lastFeedbackAt: latestByTeamId[row.team_id] || null
    }));

    res.json(teams);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching teams.' });
  }
});

router.get('/:teamId', authenticateToken, async (req, res) => {
  try {
    const teamId = req.params.teamId;

    const [teamResult, studentsResult, feedbackResult] = await Promise.all([
      pool.query(`${TEAM_BASE_QUERY} WHERE t.team_id = $1`, [teamId]),
      pool.query(
        `SELECT u.id, u.firstname || ' ' || u.lastname AS name
         FROM team_members tm
         JOIN users u ON tm.user_id = u.id
         WHERE tm.team_id = $1`,
        [teamId]
      ),
      pool.query(
        `SELECT f.feedback_id, f.type, f.source, f.team_score, f.team_comment,
                f.comment_for_tutors, f.comment_for_client, f.submitted_at,
                u.firstname || ' ' || u.lastname AS submitted_by,
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
         LEFT JOIN individual_feedback ind ON ind.feedback_id = f.feedback_id
         LEFT JOIN users su ON ind.student_id = su.id
         WHERE f.team_id = $1
         GROUP BY f.feedback_id, u.firstname, u.lastname
         ORDER BY f.submitted_at DESC`,
        [teamId]
      )
    ]);

    if (teamResult.rows.length === 0) {
      return res.status(404).json({ error: 'Team not found.' });
    }

    const teamRow = teamResult.rows[0];
    const feedbackHistory = feedbackResult.rows.map((fb) => ({
      id: fb.feedback_id,
      type: fb.type,
      source: fb.source,
      submittedBy: fb.submitted_by,
      submittedAt: fb.submitted_at,
      teamScore: fb.team_score !== null ? Number(fb.team_score) : null,
      teamComment: fb.team_comment,
      commentForTutors: fb.comment_for_tutors,
      commentForClient: fb.comment_for_client,
      individualFeedback: fb.individual_feedback.map((item) => ({
        ...item,
        score: item.score !== null ? Number(item.score) : null
      }))
    }));

    res.json({
      id: teamRow.team_id,
      teamName: teamRow.team_name,
      projectName: teamRow.project_name,
      unit: teamRow.unit_code,
      clientId: teamRow.client_id,
      clientName: teamRow.client_name,
      tutorId: teamRow.tutor_id,
      tutorName: teamRow.tutor_name,
      escalated: teamRow.escalated,
      escalationLevel: teamRow.escalation_level,
      escalationNote: teamRow.escalation_note,
      students: studentsResult.rows,
      feedbackHistory
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching team.' });
  }
});

router.post('/:teamId/escalate', authenticateToken, async (req, res) => {
  const { teamId } = req.params;
  const { note } = req.body;
  const { id, role } = req.user;
  const normalizedRole = normalizeRole(role);

  if (!['tutor', 'coordinator'].includes(normalizedRole)) {
    return res.status(403).json({ error: 'Only tutors or coordinators can escalate a team.' });
  }

  try {
    const currentResult = await pool.query(
      `SELECT t.escalation_level, t.tutor_id, t.team_name, p.project_name
       FROM teams t
       JOIN projects p ON t.project_id = p.project_id
       WHERE t.team_id = $1`,
      [teamId]
    );


    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Team not found.' });
    }

    const current = currentResult.rows[0];

    if (normalizedRole === 'tutor') {
      if (current.tutor_id !== id) {
        return res.status(403).json({ error: 'You are not the assigned tutor for this team.' });
      }
      if (current.escalation_level >= 1) {
        return res.status(400).json({ error: 'This team has already been escalated to the coordinator.' });
      }
    }

    if (normalizedRole === 'coordinator' && current.escalation_level >= 2) {
      return res.status(400).json({ error: 'This team has already been escalated to Industry Liaison.' });
    }

    const newLevel = normalizedRole === 'tutor' ? 1 : 2;

    const result = await pool.query(
      `UPDATE teams
       SET escalation_level = $1,
           escalated = TRUE,
           escalation_note = $2,
           escalated_by = $3,
           escalated_at = NOW()
       WHERE team_id = $4
       RETURNING team_id, escalation_level, escalation_note, escalated_at`,
      [newLevel, note || null, id, teamId]
    );

    // Fire-and-forget — an email failure shouldn't block the escalation response
    sendEscalationEmail({
      teamName: current.team_name,
      projectName: current.project_name,
      escalationLevel: newLevel,
      escalatedByName: req.user.firstName ? `${req.user.firstName} ${req.user.lastName}` : req.user.email,
      note
    });

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error escalating team.' });
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