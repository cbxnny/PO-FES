const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/authMiddleware');
const { normalizeRole } = require('../utils/roleUtils');

const TEAM_BASE_QUERY = `
  SELECT t.team_id, t.team_name, t.escalated, t.client_id, t.tutor_id,
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
              u.firstname || ' ' || u.lastname AS submitted_by
       FROM feedback f
       LEFT JOIN users u ON f.submitted_by = u.id
       WHERE f.team_id = $1
       ORDER BY f.submitted_at DESC`,
      [teamRow.team_id]
    )
  ]);

  const feedbackIds = feedbackResult.rows.map((row) => row.feedback_id);
  let individualByFeedbackId = {};
  if (feedbackIds.length > 0) {
    const individualResult = await pool.query(
      `SELECT ind.feedback_id, ind.student_id, u.firstname || ' ' || u.lastname AS student_name,
              ind.score, ind.comment
       FROM individual_feedback ind
       JOIN users u ON ind.student_id = u.id
       WHERE ind.feedback_id = ANY($1)`,
      [feedbackIds]
    );
    individualByFeedbackId = individualResult.rows.reduce((acc, row) => {
      if (!acc[row.feedback_id]) acc[row.feedback_id] = [];
      acc[row.feedback_id].push({
        studentId: row.student_id,
        studentName: row.student_name,
        score: row.score !== null ? Number(row.score) : null,
        comment: row.comment
      });
      return acc;
    }, {});
  }

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
    individualFeedback: individualByFeedbackId[fb.feedback_id] || []
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
    console.log('DEBUG query:', query);
    console.log('DEBUG params:', params);
    console.log('DEBUG teamsResult.rows:', teamsResult.rows);
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
    const result = await pool.query(`${TEAM_BASE_QUERY} WHERE t.team_id = $1`, [req.params.teamId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Team not found.' });
    }
    res.json(await buildTeamResponse(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching team.' });
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